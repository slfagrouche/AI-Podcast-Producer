import logging
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime

load_dotenv()
logger = logging.getLogger("ai-podcast-producer")

class ContentProcessor:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        # Initialize OpenAI client without any proxy configuration
        # Make sure no old environment variables with proxies are affecting the client
        self.client = None
        try:
            self.client = OpenAI(
                api_key=self.openai_api_key
            )
            logger.info("Successfully initialized OpenAI client")
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            # Try alternative initialization if needed
            try:
                import httpx
                # Create a custom httpx client with no proxies
                http_client = httpx.Client(timeout=60.0)
                self.client = OpenAI(
                    api_key=self.openai_api_key,
                    http_client=http_client
                )
                logger.info("Successfully initialized OpenAI client with custom httpx client")
            except Exception as e2:
                logger.error(f"Failed alternative OpenAI client initialization: {str(e2)}")
                # Will attempt to create client on-the-fly in methods that need it

    def process_content(self, articles: List[Dict[str, Any]], target_duration_seconds: int = 300) -> Dict[str, Any]:
        """
        Process and summarize news articles into a podcast script with two speakers.
        """
        try:
            # Group articles by topic
            topics = self._group_articles_by_topic(articles)
            
            # Calculate target word count (150 words per minute)
            target_word_count = int((target_duration_seconds / 60) * 150)
            
            # Create podcast script structure with metadata
            podcast_script = {
                "segments": [],
                "metadata": {
                    "topics": list(topics.keys()),
                    "article_count": len(articles),
                    "target_duration_seconds": target_duration_seconds,
                    "target_word_count": target_word_count,
                    "sources": [],
                    "recording_date": datetime.now().isoformat(),
                    "news_articles": articles  # Store full article data
                },
                "transcript": "",  # Will store the full transcript
            }
            
            # Process each topic
            words_per_topic = target_word_count // len(topics) if topics else 0
            
            for topic, topic_articles in topics.items():
                summary = self._generate_dual_speaker_content(topic, topic_articles, words_per_topic)
                sources = [{"url": article["url"], "title": article["title"], "source": article["source"]["name"]} 
                          for article in topic_articles]
                podcast_script["metadata"]["sources"].extend(sources)
                
                podcast_script["segments"].append({
                    "topic": topic,
                    "content": summary,
                    "sources": sources
                })
            
            # Generate full transcript with intro and outro
            podcast_script["transcript"] = self._generate_full_transcript(podcast_script["segments"])
            
            return podcast_script
            
        except Exception as e:
            logger.error(f"Error processing content: {str(e)}")
            raise

    def _group_articles_by_topic(self, articles: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group articles by their topics"""
        topics = {}
        for article in articles:
            topic = article.get("topic", "general")
            if topic not in topics:
                topics[topic] = []
            topics[topic].append(article)
        return topics

    def _generate_dual_speaker_content(self, topic: str, articles: List[Dict[str, Any]], target_words: int) -> str:
        """Generate conversational content between two hosts with proper flow"""
        try:
            context = "\n\n".join([
                f"ARTICLE {i+1}:\nTitle: {article['title']}\n"
                f"Source: {article['source']['name']}\n"
                f"Content: {article.get('content', article.get('description', ''))}"
                for i, article in enumerate(articles[:5])
            ])
            
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": (
                        "You are writing a podcast script for two hosts named Alex and Sarah. "
                        "Create a natural conversation about the topic based on the provided articles. "
                        f"The segment should be about {target_words} words, written in a conversational style. "
                        "Important rules:\n"
                        "1. Hosts should NEVER repeat what was just said\n"
                        "2. Each line should build on the previous one\n"
                        "3. Alternate between speakers naturally\n"
                        "4. Each speaker should acknowledge what the other just said before adding new information\n"
                        "5. Cite sources naturally within the conversation\n"
                        "Format the output with 'Alex:' and 'Sarah:' prefixes."
                    )},
                    {"role": "user", "content": f"Here are articles about {topic}:\n\n{context}\n\nCreate a conversational podcast segment following the rules above."}
                ]
            )
            
            content = response.choices[0].message.content.strip()
            
            # Add additional validation to prevent repetition
            lines = content.split('\n')
            filtered_lines = []
            last_content = ""
            current_speaker = ""
            
            for line in lines:
                if not line.strip():
                    continue
                    
                # Extract speaker and content
                if ':' in line:
                    speaker, text = line.split(':', 1)
                    text = text.strip()
                    
                    # Skip if it's the same speaker twice in a row or same/similar content
                    if speaker == current_speaker:
                        continue
                    if self._is_similar_content(text, last_content):
                        continue
                        
                    filtered_lines.append(f"{speaker}: {text}")
                    last_content = text
                    current_speaker = speaker
            
            return '\n\n'.join(filtered_lines)
            
        except Exception as e:
            logger.error(f"Error in conversation generation: {str(e)}")
            return self._fallback_dual_speaker(topic, articles, target_words)

    def _is_similar_content(self, text1: str, text2: str) -> bool:
        """Check if two pieces of text are too similar"""
        if not text1 or not text2:
            return False
            
        # Convert to sets of words for comparison
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate similarity using Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        similarity = len(intersection) / len(union)
        return similarity > 0.5  # Threshold for similarity

    def _generate_full_transcript(self, segments: List[Dict[str, Any]]) -> str:
        """Generate complete podcast transcript with intro and outro"""
        try:
            intro = (
                "Alex: Hello and welcome to TechTalk, your source for the latest in technology! "
                "I'm Alex, and with me today is Sarah.\n\n"
                "Sarah: Hi everyone! We've got some fascinating stories to discuss today.\n"
            )
            
            # Join segments with proper spacing and flow validation
            segment_contents = []
            last_speaker = "Sarah"  # Because intro ends with Sarah
            
            for segment in segments:
                content = segment["content"]
                lines = content.split('\n')
                filtered_lines = []
                
                for line in lines:
                    if ':' in line:
                        speaker, _ = line.split(':', 1)
                        if speaker != last_speaker:
                            filtered_lines.append(line)
                            last_speaker = speaker
                
                segment_contents.append('\n\n'.join(filtered_lines))
            
            content = '\n\n'.join(segment_contents)
            
            outro = (
                "\nAlex: And that wraps up our tech roundup for today. Thanks for joining us!\n\n"
                "Sarah: Don't forget to subscribe and leave us a review. See you next time!\n\n"
            )
            
            return f"{intro}\n{content}\n{outro}"
            
        except Exception as e:
            logger.error(f"Error generating full transcript: {str(e)}")
            return ""

    def _fallback_dual_speaker(self, topic: str, articles: List[Dict[str, Any]], target_words: int) -> str:
        """Generate simple dual-speaker content as fallback"""
        summary = f"Alex: Let's talk about {topic}.\n\n"
        
        for i, article in enumerate(articles[:3]):
            speaker = "Sarah" if i % 2 == 0 else "Alex"
            title = article['title']
            source = article['source']['name']
            
            content = article.get('content', article.get('description', ''))
            sentences = content.split('. ')
            key_sentences = sentences[:2]
            
            summary += f"{speaker}: {title}, according to {source}. {'. '.join(key_sentences)}.\n\n"
        
        return summary