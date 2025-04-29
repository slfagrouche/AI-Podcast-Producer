import os
import sys
import logging
from dotenv import load_dotenv
from openai import OpenAI
import requests
import json

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def test_openai_api():
    """Test OpenAI API connectivity"""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return False, "OpenAI API key not found in environment variables"
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using 3.5-turbo for cost efficiency in testing
            messages=[{"role": "user", "content": "Hello, this is a test message."}]
        )
        
        if response and response.choices[0].message.content:
            return True, "OpenAI API test successful"
        return False, "OpenAI API response was empty"
    
    except Exception as e:
        return False, f"OpenAI API test failed: {str(e)}"

def test_elevenlabs_api():
    """Test ElevenLabs API connectivity"""
    try:
        eleven_api_key = os.getenv("ELEVEN_API_KEY")
        
        if not eleven_api_key:
            return False, "ElevenLabs API key not found in environment variables"
        
        # First test with voices endpoint to verify authentication
        voices_url = "https://api.elevenlabs.io/v1/voices"
        headers = {
            "xi-api-key": eleven_api_key
        }
        
        voices_response = requests.get(voices_url, headers=headers)
        
        if voices_response.status_code != 200:
            return False, f"Failed to authenticate with ElevenLabs API: {voices_response.text}"
            
        # If authentication is successful, try a minimal text-to-speech conversion
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Default "Rachel" voice
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": eleven_api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": "This is a test.",
            "model_id": "eleven_multilingual_v2"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return True, "ElevenLabs API test successful"
            
        error_msg = response.text
        try:
            error_data = response.json()
            if "detail" in error_data:
                error_msg = error_data["detail"]
        except:
            pass
            
        return False, f"ElevenLabs API error: {error_msg}"
    
    except Exception as e:
        return False, f"ElevenLabs API test failed: {str(e)}"

def test_newsapi():
    """Test NewsAPI connectivity"""
    try:
        news_api_key = os.getenv("NEWS_API_KEY")
        
        if not news_api_key:
            return False, "NewsAPI key not found in environment variables"
        
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "technology",
            "language": "en",
            "sortBy": "publishedAt",
            "apiKey": news_api_key,
            "pageSize": 1
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                return True, "NewsAPI test successful"
            return False, f"NewsAPI returned error: {data.get('message', 'Unknown error')}"
        return False, f"NewsAPI returned status code {response.status_code}: {response.text}"
    
    except Exception as e:
        return False, f"NewsAPI test failed: {str(e)}"

def main():
    """Run all API tests"""
    # Test OpenAI API
    logger.info("Testing OpenAI API...")
    success, message = test_openai_api()
    logger.info(f"OpenAI API: {message}")
    
    # Test ElevenLabs API
    logger.info("\nTesting ElevenLabs API...")
    success, message = test_elevenlabs_api()
    logger.info(f"ElevenLabs API: {message}")
    
    # Test NewsAPI
    logger.info("\nTesting NewsAPI...")
    success, message = test_newsapi()
    logger.info(f"NewsAPI: {message}")

if __name__ == "__main__":
    main()