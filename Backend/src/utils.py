import os
import logging
import yaml
from typing import Dict, Any, List
import re
from datetime import datetime
import requests
from fastapi import HTTPException

logger = logging.getLogger("ai-podcast-producer")

def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from YAML file.
    
    Args:
        config_path: Path to the YAML configuration file
        
    Returns:
        Dict containing the configuration
    """
    try:
        with open(config_path, "r") as file:
            config = yaml.safe_load(file)
        return config
    except Exception as e:
        logger.error(f"Error loading config from {config_path}: {str(e)}")
        return {}

def ensure_directories_exist(paths: List[str]):
    """
    Ensure all required directories exist, create them if they don't.
    
    Args:
        paths: List of directory paths to check/create
    """
    for path in paths:
        try:
            os.makedirs(path, exist_ok=True)
            logger.info(f"Ensured directory exists: {path}")
        except Exception as e:
            logger.error(f"Error creating directory {path}: {str(e)}")

def handle_elevenlabs_error(response: requests.Response) -> None:
    """
    Handle ElevenLabs API errors and raise appropriate exceptions.
    
    Args:
        response: Response from ElevenLabs API
    
    Raises:
        HTTPException with appropriate status code and message
    """
    try:
        error_data = response.json()
        error_message = error_data.get("detail", {}).get("message", str(error_data))
        
        status_code = response.status_code
        if status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="Invalid ElevenLabs API key"
            )
        elif status_code == 422:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid request to ElevenLabs API: {error_message}"
            )
        elif status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="ElevenLabs API rate limit exceeded"
            )
        else:
            raise HTTPException(
                status_code=status_code,
                detail=f"ElevenLabs API error: {error_message}"
            )
    except ValueError:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"ElevenLabs API error: {response.text}"
        )

def validate_voice_id(voice_id: str, voices_file: str) -> bool:
    """
    Validate that a voice ID exists in the voices configuration.
    
    Args:
        voice_id: The voice ID to validate
        voices_file: Path to the voices.json file
        
    Returns:
        bool: True if voice ID is valid, False otherwise
    """
    try:
        with open(voices_file, 'r') as f:
            voices = yaml.safe_load(f)
            
        # Check all voice lists in the configuration
        for language in voices.values():
            if isinstance(language, dict):
                for gender in language.values():
                    if isinstance(gender, list) and voice_id in gender:
                        return True
        return False
        
    except Exception as e:
        logger.error(f"Error validating voice ID: {str(e)}")
        return False

def get_directory_size(directory: str) -> int:
    """
    Calculate total size of a directory in bytes.
    
    Args:
        directory: Path to the directory
        
    Returns:
        int: Total size in bytes
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            total_size += os.path.getsize(filepath)
    return total_size

def format_duration(seconds: int) -> str:
    """
    Format duration in seconds to MM:SS format.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        str: Formatted duration string
    """
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    return f"{minutes:02d}:{remaining_seconds:02d}"

def calculate_word_count(text: str) -> int:
    """
    Calculate the number of words in a text string.
    
    Args:
        text: The input text
        
    Returns:
        int: Number of words
    """
    return len(text.split())

def clean_text_for_tts(text: str) -> str:
    """
    Clean and format text for text-to-speech processing.
    
    Args:
        text: Input text to clean
        
    Returns:
        str: Cleaned text optimized for TTS
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Add pauses after sentences
    text = re.sub(r'([.!?])\s+', r'\1... ', text)
    
    # Add slight pauses for commas
    text = text.replace(',', ', ')
    
    # Remove any special characters that might cause issues
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    
    return text.strip()

def generate_filename(base_dir: str, prefix: str = "", extension: str = "") -> str:
    """
    Generate a unique filename using timestamp and optional prefix.
    
    Args:
        base_dir: Base directory for the file
        prefix: Optional prefix for the filename
        extension: File extension (with or without dot)
        
    Returns:
        str: Generated filepath
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if extension and not extension.startswith("."):
        extension = f".{extension}"
    return os.path.join(base_dir, f"{prefix}{timestamp}{extension}")