import os
import json
import logging
from datetime import datetime
from supabase import create_client, Client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync-utility")

def sync_podcasts_with_supabase():
    """
    Utility to sync locally generated podcasts with Supabase database.
    This will find all MP3 files in the static/podcasts directory,
    read their metadata from corresponding JSON files, and update
    Supabase records accordingly.
    """
    # Get environment variables
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        logger.error("Supabase URL or Service Role Key not configured")
        return {"error": "Supabase configuration is missing"}
    
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_service_key)
    
    # Directory where podcasts are stored
    podcast_dir = "static/podcasts"
    
    if not os.path.exists(podcast_dir):
        logger.error(f"Podcast directory {podcast_dir} not found")
        return {"error": f"Podcast directory {podcast_dir} not found"}
    
    # Find all MP3 files
    mp3_files = [f for f in os.listdir(podcast_dir) if f.endswith('.mp3')]
    logger.info(f"Found {len(mp3_files)} MP3 files in {podcast_dir}")
    
    # Track results
    results = {
        "total_files": len(mp3_files),
        "processed": 0,
        "updated": 0,
        "created": 0,
        "failed": 0,
        "skipped": 0,
        "details": []
    }
    
    # Get the database schema to check what columns exist
    try:
        schema_response = supabase.table("podcasts").select("*").limit(1).execute()
        logger.info(f"Retrieved schema information")
        # Sample record to understand the schema
        if schema_response.data:
            sample_record = schema_response.data[0]
            logger.info(f"Sample record columns: {list(sample_record.keys())}")
    except Exception as e:
        logger.error(f"Error retrieving schema: {str(e)}")
    
    # For each MP3 file, find the corresponding JSON and update/create the Supabase record
    for mp3_file in mp3_files:
        podcast_id = mp3_file.replace('.mp3', '')
        json_file = f"{podcast_dir}/{podcast_id}.json"
        
        try:
            # Check if JSON metadata exists
            if not os.path.exists(json_file):
                logger.warning(f"No metadata file found for {podcast_id}")
                results["skipped"] += 1
                results["details"].append({
                    "podcast_id": podcast_id,
                    "status": "skipped",
                    "reason": "No metadata file found"
                })
                continue
            
            # Read metadata
            with open(json_file, 'r') as f:
                try:
                    data = json.load(f)
                    metadata = data.get("metadata", {})
                    transcript = data.get("transcript", "")
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON in metadata file for {podcast_id}")
                    results["failed"] += 1
                    results["details"].append({
                        "podcast_id": podcast_id,
                        "status": "failed",
                        "reason": "Invalid JSON in metadata file"
                    })
                    continue
            
            # Check if podcast already exists in Supabase
            response = supabase.table("podcasts").select("*").eq("id", podcast_id).execute()
            
            if response.data and len(response.data) > 0:
                # Update existing record - only include fields that exist in the schema
                update_data = {
                    "status": "completed",
                    "url": f"/static/podcasts/{mp3_file}",
                    "metadata": metadata,
                    "transcript": transcript
                }
                
                # Add topics if available 
                if metadata.get("topics"):
                    update_data["topics"] = metadata.get("topics")
                
                update_response = supabase.table("podcasts").update(update_data).eq("id", podcast_id).execute()
                
                if hasattr(update_response, 'error') and update_response.error:
                    logger.error(f"Failed to update podcast {podcast_id}: {update_response.error}")
                    results["failed"] += 1
                    results["details"].append({
                        "podcast_id": podcast_id,
                        "status": "failed",
                        "reason": f"Update failed: {update_response.error}"
                    })
                else:
                    logger.info(f"Updated podcast {podcast_id} in Supabase")
                    results["updated"] += 1
                    results["details"].append({
                        "podcast_id": podcast_id,
                        "status": "updated"
                    })
            else:
                # Create new record
                # We need to find a valid user_id to associate with the podcast
                # First, check if any records exist in the podcasts table
                users_response = supabase.table("podcasts").select("user_id").execute()
                
                # Default user ID - use a hardcoded value as fallback
                user_id = "user_2wNeXyyGo1hYZZuoZ2QlV7yZwbO"
                
                if users_response.data and len(users_response.data) > 0:
                    # Find the most frequent user_id in existing records
                    user_counts = {}
                    for record in users_response.data:
                        if record.get("user_id"):
                            uid = record.get("user_id")
                            user_counts[uid] = user_counts.get(uid, 0) + 1
                    
                    if user_counts:
                        # Get most common user_id
                        user_id = max(user_counts.items(), key=lambda x: x[1])[0]
                
                # Create basic record with only fields that exist in the schema
                create_data = {
                    "id": podcast_id,
                    "user_id": user_id,
                    "status": "completed",
                    "url": f"/static/podcasts/{mp3_file}",
                    "metadata": metadata,
                    "transcript": transcript,
                    "duration": metadata.get("target_duration_seconds", 300),
                    "topics": metadata.get("topics", []),
                    # Add required fields with default values
                    "host_voice": "eleven_multilingual_v2",  # Default voice ID
                    "co_host_voice": "eleven_multilingual_v2",  # Default voice ID
                    "language": "en-US"  # Default language
                }
                
                create_response = supabase.table("podcasts").insert(create_data).execute()
                
                if hasattr(create_response, 'error') and create_response.error:
                    logger.error(f"Failed to create podcast {podcast_id}: {create_response.error}")
                    results["failed"] += 1
                    results["details"].append({
                        "podcast_id": podcast_id,
                        "status": "failed",
                        "reason": f"Create failed: {create_response.error}"
                    })
                else:
                    logger.info(f"Created podcast {podcast_id} in Supabase")
                    results["created"] += 1
                    results["details"].append({
                        "podcast_id": podcast_id,
                        "status": "created"
                    })
            
            results["processed"] += 1
            
        except Exception as e:
            logger.error(f"Error processing podcast {podcast_id}: {str(e)}")
            results["failed"] += 1
            results["details"].append({
                "podcast_id": podcast_id,
                "status": "failed",
                "reason": str(e)
            })
    
    return results

if __name__ == "__main__":
    print("Starting podcast sync utility...")
    results = sync_podcasts_with_supabase()
    print(f"Sync complete: {results}")