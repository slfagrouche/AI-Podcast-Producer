from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime

class PodcastCreateOutput(BaseModel):
    """Data model for podcast creation requests"""
    topics: List[str] = Field(..., description="List of topics to include in the podcast")
    duration: int = Field(300, description="Target podcast duration in seconds", ge=60, le=3600)
    host_voice: str = Field(..., description="ElevenLabs voice ID for main host")
    co_host_voice: str = Field(..., description="ElevenLabs voice ID for co-host")
    language: str = Field("english", description="Podcast language")

    @validator("host_voice", "co_host_voice")
    def validate_voice_id(cls, v):
        if not v or len(v) < 10:  # ElevenLabs voice IDs are longer than 10 characters
            raise ValueError("Invalid voice ID format")
        return v

class PodcastCreateInput(BaseModel):
    """Data model for podcast creation requests"""
    topics: List[str] = Field(..., description="List of topics to include in the podcast")
    duration: int = Field(300, description="Target podcast duration in seconds", ge=60, le=3600)
    host_voice: str = Field(..., description="ElevenLabs voice ID for main host")
    co_host_voice: str = Field(..., description="ElevenLabs voice ID for co-host")
    language: str = Field("english", description="Podcast language")

    @validator("host_voice", "co_host_voice")
    def validate_voice_id(cls, v):
        if not v or len(v) < 10:  # ElevenLabs voice IDs are longer than 10 characters
            raise ValueError("Invalid voice ID format")
        return v

class PodcastCreate(BaseModel):
    """Data model for podcast creation requests"""
    topics: List[str] = Field(..., description="List of topics to include in the podcast")
    duration: int = Field(300, description="Target podcast duration in seconds", ge=60, le=3600)
    host_voice: str = Field(..., description="ElevenLabs voice ID for main host")
    co_host_voice: str = Field(..., description="ElevenLabs voice ID for co-host")
    language: str = Field("english", description="Podcast language")
    user_id: str = Field(..., description="User ID")

    @validator("host_voice", "co_host_voice")
    def validate_voice_id(cls, v):
        if not v or len(v) < 10:  # ElevenLabs voice IDs are longer than 10 characters
            raise ValueError("Invalid voice ID format")
        return v

class Source(BaseModel):
    """Data model for news sources"""
    url: str
    title: str
    source: str

class PodcastMetadata(BaseModel):
    """Data model for podcast metadata"""
    topics: List[str]
    article_count: int
    target_duration_seconds: int
    target_word_count: int
    sources: List[Source]
    recording_date: datetime

class PodcastResponse(BaseModel):
    """Data model for podcast responses"""
    podcast_id: str
    status: str
    topics: List[str] = []
    url: Optional[str] = None
    message: Optional[str] = None
    created_at: Optional[datetime] = None
    duration: Optional[int] = None
    metadata: Optional[PodcastMetadata] = None
    transcript: Optional[str] = None

class PodcastStatus(BaseModel):
    """Data model for podcast status updates"""
    status: str
    progress: float
    message: str

class ErrorResponse(BaseModel):
    """Data model for error responses"""
    detail: str
    code: str

class Voice(BaseModel):
    """Data model for ElevenLabs voice information"""
    voice_id: str
    name: str
    category: Optional[str] = None
    language: Optional[str] = None
    gender: Optional[str] = None

class VoiceList(BaseModel):
    """Data model for list of available voices"""
    voices: List[Voice]

class HealthCheck(BaseModel):
    """Data model for API health check response"""
    status: str = Field("healthy", description="API health status")
    version: str = Field(..., description="API version number")
