# AI Podcast Producer API Documentation

## Overview

The AI Podcast Producer is a sophisticated system that automatically generates podcasts from news articles using AI-powered content processing and text-to-speech synthesis. This document provides comprehensive documentation for all APIs and system components.

## API Reference

### Base URL
```
http://localhost:8000/
```

### Authentication
The system uses OAuth2 with JWT tokens for authentication. All protected endpoints require a Bearer token in the Authorization header.

Token expiration: 30 minutes
Authentication scheme: Bearer

### Endpoints

#### 1. Create Podcast
**POST** `/podcasts/`

Creates a new podcast from specified topics and settings.

**Request Body:**
```json
{
    "topics": ["technology", "artificial intelligence"],
    "duration": 300,
    "host_voice": "ErXwobaYiN019PkySvjV",
    "co_host_voice": "21m00Tcm4TlvDq8ikWAM",
    "language": "english"
}
```

**Parameters:**
- `topics` (array of strings, required): List of topics to include
- `duration` (integer, optional): Target duration in seconds (default: 300, range: 60-3600)
- `host_voice` (string, required): ElevenLabs voice ID for main host
- `co_host_voice` (string, required): ElevenLabs voice ID for co-host
- `language` (string, optional): Podcast language (default: "english")

**Response:** `202 Accepted`
```json
{
    "podcast_id": "uuid-string",
    "status": "processing",
    "topics": ["technology", "artificial intelligence"],
    "message": "Your podcast is being generated. Check status endpoint for updates."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid voice ID or invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server-side processing error

#### 2. Get Podcast Details
**GET** `/podcasts/{podcast_id}`

Retrieves details of a specific podcast including status, metadata, and download URL.

**Parameters:**
- `podcast_id` (string, path parameter): Unique identifier of the podcast

**Response:** `200 OK`
```json
{
    "podcast_id": "uuid-string",
    "status": "completed",
    "url": "/static/podcasts/uuid-string.mp3",
    "created_at": "2025-04-27T04:41:28.857278",
    "duration": 300,
    "metadata": {
        "topics": ["topic1"],
        "article_count": 5,
        "target_duration_seconds": 300,
        "target_word_count": 450,
        "sources": [
            {
                "url": "source-url",
                "title": "article-title",
                "source": "source-name"
            }
        ],
        "recording_date": "2025-04-27T04:41:08.899531"
    },
    "transcript": "full-podcast-transcript"
}
```

**Error Responses:**
- `404 Not Found`: Podcast not found
- `500 Internal Server Error`: Server error

#### 3. List Podcasts
**GET** `/podcasts/`

Returns a paginated list of all podcasts.

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum number of records to return (default: 10, range: 1-100)

**Response:** `200 OK`
```json
[
    {
        "podcast_id": "uuid-string",
        "status": "completed",
        "url": "/static/podcasts/filename.mp3",
        "created_at": "timestamp",
        "duration": 300,
        "topics": []
    }
]
```

#### 4. List Available Voices
**GET** `/voices`

Returns a list of available ElevenLabs voices for podcast generation.

**Response:** `200 OK`
```json
[
    {
        "voice_id": "voice-id-string",
        "name": "Voice Name",
        "category": "professional",
        "labels": {},
        "sample_url": "https://api.elevenlabs.io/v1/voices/voice-id/preview"
    }
]
```

#### 5. Health Check
**GET** `/health`

Checks the API's health status.

**Response:** `200 OK`
```json
{
    "status": "healthy",
    "version": "1.0.0"
}
```

## Technical Stack

### Core Technologies
- **Backend Framework**: FastAPI (Python)
- **Authentication**: JWT with OAuth2
- **Audio Processing**: ElevenLabs API, pydub
- **Content Generation**: OpenAI GPT-4
- **News Collection**: NewsAPI
- **File Storage**: Local filesystem (static/podcasts)

### Dependencies
- Python 3.8+
- OpenAI API
- ElevenLabs API
- NewsAPI (optional)
- pydub for audio processing
- Additional requirements in requirements.txt

### Third-Party Services
1. **ElevenLabs**
   - Purpose: Text-to-speech conversion
   - Features: Multiple voices, natural speech

2. **OpenAI GPT-4**
   - Purpose: Content processing and conversation generation
   - Features: Natural language processing, content summarization

3. **NewsAPI**
   - Purpose: News article collection
   - Features: Multi-source news aggregation

## Backend Architecture

### Component Structure
1. **API Layer** (`/api`)
   - Routes handling
   - Request validation
   - Response formatting
   - Authentication/Authorization

2. **Core Services** (`/src`)
   - NewsCollector: Gathers news articles
   - ContentProcessor: Processes content into podcast scripts
   - ChatBot: Handles conversation generation
   - AudioProcessor: Manages audio generation and processing

3. **Configuration** (`/config`)
   - System settings
   - Voice configurations
   - Podcast generation parameters

### Data Flow
1. Client submits podcast creation request
2. System collects news articles
3. Content is processed and scripted
4. Audio is generated using ElevenLabs
5. Final podcast is assembled and stored

### Performance Considerations
- Asynchronous processing for long-running tasks
- Background task queue for podcast generation
- Caching of frequently accessed data
- Rate limiting for external API calls

## Development Setup

### Prerequisites
1. Python 3.8+
2. Virtual environment
3. API keys for:
   - OpenAI
   - ElevenLabs
   - NewsAPI (optional)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd AI-Podcast-Producer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running the Application
```bash
python main.py
```
Server will start at http://localhost:8000

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contact & Support

For issues and support:
- GitHub Issues: [repository-url]/issues
- Email: [support-email]