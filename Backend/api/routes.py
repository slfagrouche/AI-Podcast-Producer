from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Query, Path, Response
from typing import List, Optional
from datetime import datetime
import uuid
import os
import logging
import json
import requests # Added for proxy request
from fastapi.responses import JSONResponse, StreamingResponse # Added StreamingResponse
from .models import PodcastCreate, PodcastResponse, PodcastStatus, ErrorResponse, HealthCheck, PodcastCreateInput
from src.news_collector import NewsCollector
from src.content_processor import ContentProcessor
from src.chat import ChatBot
from src.audio import AudioProcessor, merge_audio_segments
from src.utils import load_config, validate_voice_id

router = APIRouter()
logger = logging.getLogger("ai-podcast-producer")

# Load configuration
config = load_config("config/podcast_config.yaml")


@router.post("/podcasts/", response_model=PodcastResponse, status_code=202)
async def create_podcast(
    podcast_data: PodcastCreate,
    background_tasks: BackgroundTasks
):
    """Create a new podcast based on provided topics and settings."""
    try:
        # Generate unique ID for this podcast
        podcast_id = str(uuid.uuid4())

        # Initialize audio processor and validate voices
        audio_processor = AudioProcessor()

        # Validate host voice
        if not audio_processor.validate_voice_id(podcast_data.host_voice):
            available_voices = audio_processor.get_available_voices()
            voice_names = ", ".join(f"{v['name']} ({v['voice_id']})" for v in available_voices)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid host voice ID: {podcast_data.host_voice}. Available voices: {voice_names}"
            )

        # Validate co-host voice
        if not audio_processor.validate_voice_id(podcast_data.co_host_voice):
            available_voices = audio_processor.get_available_voices()
            voice_names = ", ".join(f"{v['name']} ({v['voice_id']})" for v in available_voices)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid co-host voice ID: {podcast_data.co_host_voice}. Available voices: {voice_names}"
            )

        # Insert podcast data into Supabase
        podcast_record = await insert_podcast_into_supabase(
            user_id=podcast_data.user_id,
            podcast_id=podcast_id,
            topics=podcast_data.topics,
            duration=podcast_data.duration,
            host_voice=podcast_data.host_voice,
            co_host_voice=podcast_data.co_host_voice,
            language=podcast_data.language
        )

        # Create processing marker
        # Create processing marker
        with open(f"static/podcasts/{podcast_id}.processing", 'w') as f:
            f.write("processing")

        # Add job to background tasks
        background_tasks.add_task(
            generate_podcast,
            podcast_id=podcast_id,
            topics=podcast_data.topics,
            duration=podcast_data.duration,
            host_voice=podcast_data.host_voice,
            co_host_voice=podcast_data.co_host_voice,
            language=podcast_data.language,
            user_id=podcast_data.user_id
        )
        return PodcastResponse(
            podcast_id=podcast_id,
            status="processing",
            topics=podcast_data.topics,
            message="Your podcast is being generated. Check status endpoint for updates."
        )

    except HTTPException as e:
        logger.error(f"HTTP error creating podcast: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error creating podcast: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

async def insert_podcast_into_supabase(
    user_id: str,
    podcast_id: str,
    topics: List[str],
    duration: int,
    host_voice: str,
    co_host_voice: str,
    language: str
):
    """Inserts podcast data into Supabase."""
    # Get environment variables using os.getenv
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    # Try both possible environment variable names for the service role key
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Log keys for debugging (mask part of the key)
    if supabase_service_key:
        masked_key = supabase_service_key[:10] + "..." + supabase_service_key[-5:] if len(supabase_service_key) > 15 else "***masked***"
        logger.info(f"Using service role key: {masked_key}")
    else:
        logger.error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables")
    
    if not supabase_url:
        logger.error("VITE_SUPABASE_URL is not set in environment variables")
    
    if not supabase_url or not supabase_service_key:
        logger.error("Supabase URL or Service Role Key not configured")
        raise HTTPException(
            status_code=500,
            detail="Supabase URL or Service Role Key not configured"
        )
    
    from supabase import create_client, Client
    
    # Use the service role key instead of anon key to bypass RLS
    supabase: Client = create_client(supabase_url, supabase_service_key)
    
    try:
        # Ensure we're using the correct user ID format
        logger.info(f"Inserting podcast {podcast_id} for user {user_id} into Supabase")
        
        # Make sure user_id isn't null
        if not user_id:
            logger.error("User ID is missing or null")
            raise HTTPException(
                status_code=400,
                detail="User ID is required"
            )
        
        # Remove the await - the supabase client doesn't support it directly
        response = supabase.table("podcasts").insert(
            {
                "id": podcast_id,
                "user_id": user_id,
                "topics": topics,
                "duration": duration,
                "host_voice": host_voice,
                "co_host_voice": co_host_voice,
                "language": language,
                "status": "processing",
            }
        ).execute()
        
        # Now handle the response without await
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error inserting podcast into Supabase: {response.error}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to insert podcast into Supabase: {response.error}"
            )
            
        # Get the data from the response
        if hasattr(response, 'data'):
            data = response.data
        else:
            data = response
            
        logger.info(f"Successfully inserted podcast {podcast_id} into Supabase with user_id {user_id}")
        
        # Verify the insert by checking if the record exists
        verify = supabase.table("podcasts").select("*").eq("id", podcast_id).execute()
        if hasattr(verify, 'data') and verify.data:
            logger.info(f"Verified podcast record: {verify.data}")
        else:
            logger.warning(f"Could not verify podcast record was created. Response: {verify}")
        
        return data
    except Exception as e:
        logger.error(f"Error inserting podcast into Supabase: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to insert podcast into Supabase: {str(e)}"
        )

@router.get("/podcasts/{podcast_id}", response_model=PodcastResponse)
async def get_podcast(podcast_id: str = Path(...)):
    """Get details of a specific podcast including status, metadata, transcript and download URL if ready."""
    try:
        # Check Supabase first for the podcast record
        supabase_url = os.getenv("VITE_SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if supabase_url and supabase_service_key:
            from supabase import create_client, Client
            supabase: Client = create_client(supabase_url, supabase_service_key)
            
            # Query for the podcast in Supabase
            result = supabase.table("podcasts").select('*').eq("id", podcast_id).execute()
            if hasattr(result, 'data') and result.data and len(result.data) > 0:
                podcast_data = result.data[0]
                
                # If the podcast exists in the database, respond with its current status
                logger.info(f"Found podcast {podcast_id} in database with status: {podcast_data.get('status')}")
                
                # For completed podcasts, check if the file exists and include metadata
                if podcast_data.get('status') == 'completed':
                    podcast_file = f"static/podcasts/{podcast_id}.mp3"
                    metadata_file = f"static/podcasts/{podcast_id}.json"
                    
                    if os.path.exists(podcast_file):
                        metadata = {}
                        transcript = ""
                        
                        # Load metadata and transcript if available
                        if os.path.exists(metadata_file):
                            with open(metadata_file, 'r') as f:
                                data = json.load(f)
                                metadata = data.get("metadata", {})
                                transcript = data.get("transcript", "")
                        
                        return PodcastResponse(
                            podcast_id=podcast_id,
                            status="completed",
                            url=f"/static/podcasts/{podcast_id}.mp3",
                            created_at=datetime.fromtimestamp(os.path.getctime(podcast_file)) if os.path.exists(podcast_file) else datetime.now(),
                            duration=podcast_data.get('duration', 300),
                            metadata=metadata,
                            transcript=transcript,
                            topics=podcast_data.get('topics', [])
                        )
                    else:
                        # File doesn't exist but database says completed - this is an error state
                        logger.warning(f"Podcast {podcast_id} is marked completed in database but file not found")
                        return PodcastResponse(
                            podcast_id=podcast_id,
                            status="failed",
                            message="Podcast file not found though marked as completed. Please contact support.",
                            topics=podcast_data.get('topics', [])
                        )
                
                # For processing or failed podcasts, return the status from the database
                return PodcastResponse(
                    podcast_id=podcast_id,
                    status=podcast_data.get('status', 'processing'),
                    message=podcast_data.get('message', 'Your podcast is being processed.'),
                    topics=podcast_data.get('topics', []),
                    created_at=datetime.fromisoformat(podcast_data.get('created_at')) if podcast_data.get('created_at') else datetime.now(),
                    duration=podcast_data.get('duration', 300)
                )
        
        # Fallback to checking the file system if database query fails or podcast not found in database
        podcast_file = f"static/podcasts/{podcast_id}.mp3"
        metadata_file = f"static/podcasts/{podcast_id}.json"
        processing_file = f"static/podcasts/{podcast_id}.processing"
        
        # Check if the podcast is completed (file exists)
        if os.path.exists(podcast_file):
            metadata = {}
            transcript = ""
            
            # Load metadata and transcript if available
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    data = json.load(f)
                    metadata = data.get("metadata", {})
                    transcript = data.get("transcript", "")
            
            return PodcastResponse(
                podcast_id=podcast_id,
                status="completed",
                url=f"/static/podcasts/{podcast_id}.mp3",
                created_at=datetime.fromtimestamp(os.path.getctime(podcast_file)),
                duration=300,  # Would be calculated from actual file
                metadata=metadata,
                transcript=transcript
            )
        
        # Check if podcast is still processing
        if os.path.exists(processing_file):
            return PodcastResponse(
                podcast_id=podcast_id,
                status="processing",
                message="Your podcast is still being generated.",
                topics=[]
            )
            
        # At this point, we've checked both database and filesystem and found nothing
        # This is a true 404 case
        raise HTTPException(
            status_code=404,
            detail=f"Podcast {podcast_id} not found"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving podcast {podcast_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/podcasts/", response_model=List[PodcastResponse])
async def list_podcasts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """List all podcasts with pagination."""
    try:
        podcasts = []
        podcast_dir = "static/podcasts"
        
        if os.path.exists(podcast_dir):
            files = [f for f in os.listdir(podcast_dir) if f.endswith('.mp3')]
            files.sort(key=lambda x: os.path.getctime(os.path.join(podcast_dir, x)), reverse=True)
            
            for file in files[skip:skip+limit]:
                podcast_id = file.replace('.mp3', '')
                file_path = os.path.join(podcast_dir, file)
                
                podcasts.append(PodcastResponse(
                    podcast_id=podcast_id,
                    status="completed",
                    url=f"/static/podcasts/{file}",
                    created_at=datetime.fromtimestamp(os.path.getctime(file_path)),
                    duration=300,  # Would be calculated from actual file
                    topics=[]  # Would be retrieved from database in production
                ))
                
        return podcasts
        
    except Exception as e:
        logger.error(f"Error listing podcasts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/health", response_model=HealthCheck, tags=["system"])
async def check_health():
    """Check the health status of the API."""
    try:
        # Read version from package or environment variable, defaulting to 1.0.0
        version = os.getenv("API_VERSION", "1.0.0")
        return HealthCheck(status="healthy", version=version)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="System health check failed"
        )

@router.get("/voices", response_model=List[dict], tags=["voices"])
async def list_voices():
    """Get list of available ElevenLabs voices with details."""
    try:
        audio_processor = AudioProcessor()
        voices = audio_processor.get_available_voices()
        # Include more details in response
        return [{
            "voice_id": voice["voice_id"],
            "name": voice["name"],
            "category": voice["category"],
            "labels": voice.get("labels", {}),
            # No longer need to construct sample_url here, frontend will use the new proxy endpoint
            # "sample_url": f"https://api.elevenlabs.io/v1/voices/{voice['voice_id']}/preview"
        } for voice in voices]
    except Exception as e:
        logger.error(f"Error listing voices: {str(e)}") # Changed log message slightly
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/voices/{voice_id}/preview", tags=["voices"])
async def get_voice_preview(voice_id: str = Path(...)):
    """Proxy endpoint to fetch and stream voice preview audio from ElevenLabs."""
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("ELEVEN_API_KEY")
    if not api_key:
        logger.error("Cannot fetch voice preview: ElevenLabs API key is not configured.")
        raise HTTPException(status_code=500, detail="API key not configured for voice previews")

    eleven_url = f"https://api.elevenlabs.io/v1/voices/{voice_id}/preview"
    headers = {"xi-api-key": api_key}

    try:
        logger.info(f"Proxying request for voice preview: {voice_id} to {eleven_url}")
        # Use stream=True to handle potentially large audio files efficiently
        response = requests.get(eleven_url, headers=headers, stream=True, timeout=20) # Added timeout

        if response.status_code == 200:
            # Check content type, default to audio/mpeg if not provided
            content_type = response.headers.get("Content-Type", "audio/mpeg")
            logger.info(f"ElevenLabs response headers: {response.headers}") # Added detailed header logging
            logger.info(f"Successfully fetched preview from ElevenLabs (Status: 200, Type: {content_type})")
            # Stream the response back to the client
            return StreamingResponse(response.iter_content(chunk_size=1024*4), media_type=content_type)
        else:
            error_detail = response.text # Read the error text
            logger.error(f"Failed to fetch preview from ElevenLabs (Status: {response.status_code}): {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from ElevenLabs API: {error_detail}"
            )
    except requests.exceptions.Timeout:
        logger.error(f"Timeout fetching voice preview from ElevenLabs: {eleven_url}")
        raise HTTPException(status_code=504, detail="Timeout fetching preview from upstream service")
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching voice preview from ElevenLabs: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Network error fetching preview: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error fetching voice preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error fetching preview: {str(e)}")


async def generate_podcast(
    podcast_id: str,
    topics: List[str],
    duration: int,
    host_voice: str,
    co_host_voice: str,
    language: str,
    user_id: str
):
    """Background task for podcast generation."""
    try:
        # Initialize components
        audio_processor = AudioProcessor()
        news_collector = NewsCollector()
        content_processor = ContentProcessor()
        
        # Create processing marker
        with open(f"static/podcasts/{podcast_id}.processing", 'w') as f:
            f.write("processing")
        
        # Collect news and process content
        articles = news_collector.collect_news(topics, days_back=1)
        podcast_script = content_processor.process_content(articles, duration)
        
        # Save metadata and transcript
        with open(f"static/podcasts/{podcast_id}.json", 'w') as f:
            json.dump({
                "metadata": podcast_script["metadata"],
                "transcript": podcast_script["transcript"]
            }, f, default=str)
        
        # Create chatbots
        host = ChatBot("Alex", "Professional and engaging tech podcast host",
                      "Generate engaging podcast content", host_voice)
        co_host = ChatBot("Sarah", "Knowledgeable and enthusiastic tech expert",
                         "Engage in natural conversation", co_host_voice)
        
        # Initialize audio segments list
        segments = []
        logger.info("Starting audio generation...")

        # 1. Add intro music
        # intro_music = audio_processor.get_intro_music()
        # if intro_music:
        #     segments.append(intro_music)
        #     logger.info("Added intro music")
        
        # 2. Add intro dialogue
        intro_host = host.speak("Hello and welcome to TechTalk, your source for the latest in technology! I'm Alex, and with me today is Sarah.")
        if intro_host:
            segments.append(intro_host)
            logger.info("Added host intro")
        
        intro_cohost = co_host.speak("Hi everyone! We've got some fascinating stories to discuss today.")
        if intro_cohost:
            segments.append(intro_cohost)
            logger.info("Added co-host intro")

        # Add first transition
        # transition = audio_processor.get_transition_sound()
        # if transition:
        #     segments.append(transition)
        
        # 3. Process main content
        last_speaker = None
        last_line = ""
        
        for segment in podcast_script["segments"]:
            lines = segment["content"].split('\n')
            segment_segments = []
            
            for line in lines:
                if not line.strip() or ':' not in line:
                    continue
                
                speaker, text = line.split(':', 1)
                text = text.strip()
                
                # Skip if too similar to last line
                if text == last_line:
                    continue
                
                try:
                    if speaker == "Alex":
                        audio = host.speak(text)
                    else:
                        audio = co_host.speak(text)
                        
                    if audio:
                        segment_segments.append(audio)
                        last_speaker = speaker
                        last_line = text
                        logger.info(f"Added {speaker}'s line")
                except Exception as e:
                    logger.error(f"Error generating audio for {speaker}: {str(e)}")
            
            # Add segment audio
            segments.extend(segment_segments)
            
            # Add transition between segments if not the last segment
            # if transition and segment != podcast_script["segments"][-1]:
            #     segments.append(transition)
        
        # 4. Add outro dialogue
        outro_host = host.speak("And that wraps up our tech roundup for today. Thanks for joining us!")
        if outro_host:
            segments.append(outro_host)
            logger.info("Added host outro")
        
        outro_cohost = co_host.speak("Don't forget to subscribe and leave us a review. See you next time!")
        if outro_cohost:
            segments.append(outro_cohost)
            logger.info("Added co-host outro")
        
        # 5. Add outro music
        # outro_music = audio_processor.get_outro_music()
        # if outro_music:
        #     segments.append(outro_music)
        #     logger.info("Added outro music")
        
        # Log segment count before merging
        logger.info(f"Total segments to merge: {len(segments)}")
        
        # 6. Merge all segments
        output_file = f"static/podcasts/{podcast_id}.mp3"
        merge_audio_segments(segments, output_file)
        logger.info(f"Successfully merged all segments to {output_file}")
        
        # Update podcast status in Supabase
        await update_podcast_status_in_supabase(
            podcast_id=podcast_id,
            status="completed",
            url=f"/static/podcasts/{podcast_id}.mp3",
            transcript=podcast_script["transcript"],
            metadata=podcast_script["metadata"],
            message="Podcast generation completed successfully."
        )
        
        # Clean up
        if os.path.exists(f"static/podcasts/{podcast_id}.processing"):
            os.remove(f"static/podcasts/{podcast_id}.processing")
        
        logger.info(f"Podcast {podcast_id} generation completed")
        
    except Exception as e:
        logger.error(f"Error generating podcast {podcast_id}: {str(e)}")
        if os.path.exists(f"static/podcasts/{podcast_id}.processing"):
            os.remove(f"static/podcasts/{podcast_id}.processing")
        await update_podcast_status_in_supabase(
            podcast_id=podcast_id,
            status="failed",
            message=f"Podcast generation failed: {str(e)}"
        )
        raise

async def update_podcast_status_in_supabase(
    podcast_id: str,
    status: str,
    url: Optional[str] = None,
    transcript: Optional[str] = None,
    metadata: Optional[dict] = None,
    message: Optional[str] = None
):
    """Updates podcast status and data in Supabase."""
    # Get environment variables using os.getenv
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        logger.error("Supabase URL or Service Role Key not configured")
        return False
    
    from supabase import create_client, Client
    
    # Use the service role key to bypass RLS
    supabase: Client = create_client(supabase_url, supabase_service_key)
    
    try:
        logger.info(f"Updating podcast {podcast_id} status to {status}")
        
        update_data = {
            "status": status
        }
        
        if url:
            update_data["url"] = url
            
        if transcript:
            update_data["transcript"] = transcript
            
        if metadata:
            update_data["metadata"] = metadata
            
        if message:
            update_data["message"] = message
        
        response = supabase.table("podcasts").update(update_data).eq("id", podcast_id).execute()
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error updating podcast in Supabase: {response.error}")
            return False
            
        logger.info(f"Successfully updated podcast {podcast_id} in Supabase to status: {status}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating podcast in Supabase: {str(e)}")
        return False

async def list_podcasts_by_user(user_id: str):
    """Debug function to list all podcasts in Supabase for a specific user."""
    # Get environment variables using os.getenv
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        logger.error("Supabase URL or Service Role Key not configured")
        return None
    
    from supabase import create_client, Client
    
    # Use the service role key to bypass RLS
    supabase: Client = create_client(supabase_url, supabase_service_key)
    
    try:
        logger.info(f"Querying all podcasts in database for user {user_id}")
        
        # Query all podcasts to see what's actually in the database
        all_podcasts = supabase.table("podcasts").select('*').execute()
        
        if hasattr(all_podcasts, 'data'):
            logger.info(f"Total podcasts in database: {len(all_podcasts.data)}")
            
            # Log all user_ids in the database to check for mismatches
            user_ids = set([podcast.get('user_id') for podcast in all_podcasts.data if podcast.get('user_id')])
            logger.info(f"Unique user_ids in database: {user_ids}")
            
            if user_id in user_ids:
                logger.info(f"User {user_id} found in database")
            else:
                logger.info(f"User {user_id} NOT found in database")
            
            # Find podcasts for this specific user
            user_podcasts = [p for p in all_podcasts.data if p.get('user_id') == user_id]
            logger.info(f"Found {len(user_podcasts)} podcasts for user {user_id}")
            
            return user_podcasts
        else:
            logger.warning("No data returned from Supabase query")
            return []
            
    except Exception as e:
        logger.error(f"Error listing podcasts from Supabase: {str(e)}")
        return None

@router.get("/debug/podcasts/user/{user_id}", tags=["debug"])
async def debug_list_user_podcasts(user_id: str = Path(...)):
    """Debug endpoint to list all podcasts for a specific user."""
    try:
        # List the podcasts in the database
        podcasts = await list_podcasts_by_user(user_id)
        
        # Also list the podcasts in the static folder
        podcast_dir = "static/podcasts"
        local_files = []
        
        if os.path.exists(podcast_dir):
            files = [f for f in os.listdir(podcast_dir) if f.endswith('.mp3')]
            
            for file in files:
                podcast_id = file.replace('.mp3', '')
                local_files.append(podcast_id)
        
        # Return both database records and local files
        return {
            "database_podcasts": podcasts,
            "local_podcast_files": local_files,
            "database_count": len(podcasts) if podcasts else 0,
            "local_file_count": len(local_files)
        }
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
