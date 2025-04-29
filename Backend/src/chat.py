import logging
from typing import Dict, Any
import os
from dotenv import load_dotenv
from openai import OpenAI
from src.audio import process_audio, AudioProcessor

load_dotenv()
logger = logging.getLogger("ai-podcast-producer")

class ChatBot:
    def __init__(self, name: str, personality: str, instructions: str, voice: str):
        """
        Initialize a chatbot with specific personality and voice.
        
        Args:
            name: Name of the chatbot
            personality: Description of the chatbot's personality
            instructions: Specific instructions for the chatbot's behavior
            voice: Voice ID to use for text-to-speech (ElevenLabs voice ID)
        """
        self.name = name
        self.personality = personality
        self.instructions = instructions
        self.voice = voice
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        # Initialize OpenAI client without any proxy configuration
        self.client = OpenAI(api_key=self.openai_api_key)
        self.audio_processor = AudioProcessor()
        self.conversation_history = []

    def chat(self, message: str) -> str:
        """
        Generate a response to a message using OpenAI's GPT model.
        
        Args:
            message: The input message to respond to
            
        Returns:
            str: The generated response
        """
        try:
            # Add message to conversation history
            self.conversation_history.append({"role": "user", "content": message})
            
            # Prepare the messages including system instructions
            messages = [
                {
                    "role": "system",
                    "content": f"You are {self.name}. {self.personality}\n\nInstructions: {self.instructions}"
                }
            ] + self.conversation_history[-5:]  # Keep last 5 messages for context
            
            # Generate response using the new API
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
            
            # Extract response content
            reply = response.choices[0].message.content.strip()
            
            # Add response to conversation history
            self.conversation_history.append({"role": "assistant", "content": reply})
            
            return reply
            
        except Exception as e:
            logger.error(f"Error in chat generation: {str(e)}")
            return self._fallback_response(message)

    def speak(self, text: str) -> bytes:
        """
        Convert text to speech using the configured voice.
        
        Args:
            text: The text to convert to speech
            
        Returns:
            bytes: The audio content
        """
        try:
            return self.audio_processor.convert_text_to_speech(text, self.voice)
        except Exception as e:
            logger.error(f"Error in text-to-speech conversion: {str(e)}")
            return self.audio_processor.generate_mock_audio()

    def _fallback_response(self, message: str) -> str:
        """Generate a simple fallback response when API fails"""
        return f"I understand you're asking about {message}. However, I'm having trouble processing that right now. Could you please rephrase your question?"

    def clear_history(self):
        """Clear the conversation history"""
        self.conversation_history = []