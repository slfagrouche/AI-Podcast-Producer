import os
import logging
import requests
import json
import io
from typing import List, Dict
from dotenv import load_dotenv
from datetime import datetime

try:
    from pydub import AudioSegment
    pydub_available = True
except ImportError:
    pydub_available = False

load_dotenv()
logger = logging.getLogger("ai-podcast-producer")

class AudioProcessor:
    """
    AudioProcessor handles TTS via ElevenLabs and merges audio segments if pydub is available.
    If pydub is unavailable (and audioop is missing), merging is disabled.
    """
    def __init__(self):
        # Check for both common environment variable names
        self.eleven_api_key = (
            os.getenv("ELEVENLABS_API_KEY") or 
            os.getenv("ELEVEN_API_KEY")
        )
        if not self.eleven_api_key:
            logger.warning("Neither ELEVENLABS_API_KEY nor ELEVEN_API_KEY found in environment variables. Audio generation and voice listing may be mocked or fail.")

    def convert_text_to_speech(self, text: str, voice_id: str) -> bytes:
        """
        Convert text to speech using ElevenLabs API.
        Returns the audio content as bytes, or raises an exception on failure.
        """
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": self.eleven_api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "output_format": "mp3_44100_128"
            }
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return response.content
            else:
                error_msg = response.text
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        error_msg = error_data["detail"]
                except:
                    pass
                raise Exception(f"Text-to-speech conversion failed: {error_msg}")
        except Exception as e:
            logger.error(f"Error in text-to-speech conversion: {str(e)}")
            raise

    def get_available_voices(self) -> List[Dict]:
        """Get list of available voices from ElevenLabs"""
        try:
            url = "https://api.elevenlabs.io/v1/voices"
            headers = {
                "xi-api-key": self.eleven_api_key,
                "accept": "application/json"
            }
            # Only proceed if API key is set
            if not self.eleven_api_key:
                logger.error("Cannot fetch voices: ElevenLabs API key is not configured.")
                return self._get_mock_voices() # Return mock voices if no key

            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Successfully fetched {len(data.get('voices', []))} voices from ElevenLabs.")
                return [
                    {
                        "voice_id": voice.get("voice_id"),
                        "name": voice.get("name"),
                        "category": voice.get("category", ""),
                        "labels": voice.get("labels", {})
                    }
                    for voice in data.get("voices", [])
                ]
            else:
                # Log specific error if API key was present but request failed
                logger.error(f"Failed to fetch voices from ElevenLabs (Status: {response.status_code}): {response.text}")
                logger.error("This might indicate an invalid API key or an issue with the ElevenLabs service.")
                # Do NOT return mock voices here if the key was present but failed
                # Let the calling function handle the empty list or raise an error
                return [] # Return empty list on failure when key was present
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error fetching voices: {str(e)}")
            logger.error("Please check network connectivity and ElevenLabs service status.")
            return [] # Return empty list on network error
        except Exception as e:
            logger.error(f"Unexpected error fetching voices: {str(e)}")
            return [] # Return empty list on other errors

    def _get_mock_voices(self) -> List[Dict]:
        """Return mock voices for development/testing"""
        return [
            {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "category": "professional"},
            {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Adam", "category": "professional"},
            {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Nicole", "category": "professional"},
            {"voice_id": "D38z5RcWu1voky8WS1ja", "name": "Emily", "category": "professional"},
            {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Sam", "category": "professional"}
        ]

    def validate_voice_id(self, voice_id: str) -> bool:
        """Validate that a voice ID exists among available voices"""
        try:
            available_voices = self.get_available_voices()
            return any(voice["voice_id"] == voice_id for voice in available_voices)
        except Exception as e:
            logger.error(f"Error validating voice ID: {str(e)}")
            return False

    def generate_mock_audio(self, duration_ms: int = 3000) -> bytes:
        """
        Generate mock audio for development/testing (just silence). 
        """
        logger.warning("Generating mock audio (silence). pydub or audioop might be missing.")
        return b"\0" * 100  # Arbitrary small byte content for silent mock audio

    def merge_audio_files(self, audio_contents: List[bytes], output_file: str, metadata: Dict = None):
        """Merge multiple audio segments with proper spacing"""
        if not audio_contents:
            logger.warning("No audio segments to merge. Created an empty file.")
            with open(output_file, "wb") as f:
                pass
            return
        
        if pydub_available:
            try:
                import io
                from pydub import AudioSegment

                segments = []
                # Convert each audio content to AudioSegment
                for audio_bytes in audio_contents:
                    segment = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
                    segments.append(segment)
                    # Add 0.3 second silence between segments
                    segments.append(AudioSegment.silent(duration=300))

                # Remove the last silence we added
                if segments:
                    segments.pop()

                # Combine all segments
                final_audio = sum(segments)

                # Export the final audio
                final_audio.export(output_file, format="mp3")
                logger.info(f"Successfully merged {len(audio_contents)} audio segments to {output_file}")
            except Exception as e:
                logger.warning(f"pydub is available but an error occurred: {str(e)}, falling back to simple concatenation")
                self._merge_audio_simple(audio_contents, output_file)
        else:
            logger.warning("pydub not available, falling back to simple concatenation")
            self._merge_audio_simple(audio_contents, output_file)

    def _merge_audio_simple(self, audio_contents: List[bytes], output_file: str):
        """Simple audio merging fallback"""
        try:
            with open(output_file, "wb") as f:
                for i, chunk in enumerate(audio_contents):
                    f.write(chunk)
                    # Add small silence between segments
                    if i < len(audio_contents) - 1:
                        f.write(b"\0" * 13230)  # 0.3 seconds at 44.1kHz
        except Exception as e:
            logger.error(f"Error in simple audio merge: {str(e)}")
            raise

    def get_intro_music(self) -> bytes:
        """Get intro music for the podcast"""
        try:
            music_path = os.path.join("static", "assets", "intro_music.mp3")
            if os.path.exists(music_path):
                with open(music_path, 'rb') as f:
                    return f.read()
            return self._generate_mp3_tone(duration_ms=5000, frequency=440)  # 5 seconds
        except Exception as e:
            logger.error(f"Error loading intro music: {str(e)}")
            return self._generate_mp3_tone(duration_ms=5000, frequency=440)

    def get_outro_music(self) -> bytes:
        """Get outro music for the podcast"""
        try:
            music_path = os.path.join("static", "assets", "outro_music.mp3")
            if os.path.exists(music_path):
                with open(music_path, 'rb') as f:
                    return f.read()
            return self._generate_mp3_tone(duration_ms=5000, frequency=440)  # 5 seconds
        except Exception as e:
            logger.error(f"Error loading outro music: {str(e)}")
            return self._generate_mp3_tone(duration_ms=5000, frequency=440)

    def get_transition_sound(self) -> bytes:
        """Get transition sound effect"""
        try:
            sound_path = os.path.join("static", "assets", "transition.mp3")
            if os.path.exists(sound_path):
                with open(sound_path, 'rb') as f:
                    return f.read()
            return self._generate_mp3_tone(duration_ms=800, frequency=880)  # 0.8 seconds
        except Exception as e:
            logger.error(f"Error loading transition sound: {str(e)}")
            return self._generate_mp3_tone(duration_ms=800, frequency=880)

    def _generate_mp3_tone(self, duration_ms: int = 1000, frequency: float = 440.0) -> bytes:
        """Generate an MP3 tone using pydub"""
        try:
            from pydub import AudioSegment
            from pydub.generators import Sine
            
            # Create a sine wave
            sine_wave = Sine(frequency)
            audio = sine_wave.to_audio_segment(duration=duration_ms)
            
            # Add fade in/out
            fade_duration = min(duration_ms // 10, 100)  # 10% or max 100ms
            audio = audio.fade_in(fade_duration).fade_out(fade_duration)
            
            # Export to MP3 bytes
            buffer = io.BytesIO()
            audio.export(buffer, format="mp3")
            return buffer.getvalue()
            
        except ImportError:
            logger.warning("pydub not available, falling back to raw PCM generation")
            return self._generate_raw_tone(duration_ms, frequency)

    def _generate_raw_tone(self, duration_ms: int = 1000, frequency: float = 440.0) -> bytes:
        """
        Generate a simple musical tone as a fallback when music files are not available.
        Args:
            duration_ms: Duration in milliseconds
            frequency: Frequency in Hz (440 Hz = A4 note)
        Returns:
            bytes: Generated audio data
        """
        import math
        import struct
        
        # Audio parameters
        sample_rate = 44100
        amplitude = 0.5
        num_samples = int((duration_ms / 1000.0) * sample_rate)
        
        # Generate sine wave
        samples = []
        for i in range(num_samples):
            sample = amplitude * math.sin(2 * math.pi * frequency * i / sample_rate)
            # Convert to 16-bit integer
            packed_sample = struct.pack('h', int(sample * 32767))
            samples.append(packed_sample)
        
        # Add fade in/out
        fade_samples = int(sample_rate * 0.1)  # 100ms fade
        for i in range(fade_samples):
            factor = i / fade_samples
            packed_sample = struct.pack('h', int(factor * struct.unpack('h', samples[i])[0]))
            samples[i] = packed_sample
            
            factor = 1 - (i / fade_samples)
            packed_sample = struct.pack('h', int(factor * struct.unpack('h', samples[-(i+1)])[0]))
            samples[-(i+1)] = packed_sample
        
        return b''.join(samples)

def process_audio(text: str, voice_id: str) -> bytes:
    """
    High-level function to process text to audio.
    """
    processor = AudioProcessor()
    if not processor.eleven_api_key:
        logger.warning("Using mock audio generation because no ElevenLabs API key is set.")
        return processor.generate_mock_audio()
    
    try:
        if processor.validate_voice_id(voice_id):
            return processor.convert_text_to_speech(text, voice_id)
        else:
            raise ValueError(f"Invalid voice ID: {voice_id}")
    except Exception as e:
        logger.error(f"Error in text-to-speech conversion: {str(e)}")
        logger.warning("Using mock audio generation due to ElevenLabs API error.")
        return processor.generate_mock_audio()

def merge_audio_segments(segments: List[bytes], output_file: str):
    """
    Merge multiple audio segments using AudioProcessor's fallback if pydub is unavailable.
    """
    processor = AudioProcessor()
    processor.merge_audio_files(segments, output_file)
