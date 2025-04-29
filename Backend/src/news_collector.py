import os
from typing import List, Dict, Any
from dotenv import load_dotenv
import logging
import time
import random
from newsapi import NewsApiClient
from newsapi.newsapi_exception import NewsAPIException

load_dotenv()
logger = logging.getLogger("ai-podcast-producer")

class NewsCollector:
    def __init__(self):
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.newsapi = None
        if not self.news_api_key:
            logger.error("NEWS_API_KEY environment variable is not set")
        else:
            try:
                self.newsapi = NewsApiClient(api_key=self.news_api_key)
                # Validate API key with a simple request
                self.newsapi.get_sources()
                logger.info("Successfully initialized NewsAPI client")
            except NewsAPIException as e:
                logger.error(f"Failed to initialize NewsAPI client: {str(e)}")
                self.newsapi = None
                self.news_api_key = None

    def collect_news(self, topics: List[str], days_back: int = 1, articles_per_topic: int = 5) -> List[Dict[str, Any]]:
        """
        Collect news articles from various sources based on specified topics.
        """
        logger.info(f"Collecting news for topics: {topics}")
        all_articles = []
        
        if self.newsapi:
            # Get current date for "from" parameter
            from_date = time.strftime("%Y-%m-%d", time.localtime(time.time() - days_back * 86400))
            
            for topic in topics:
                try:
                    # Make request using NewsAPI client
                    response = self.newsapi.get_everything(
                        q=topic,
                        from_param=from_date,
                        sort_by='relevancy',
                        language='en',
                        page_size=articles_per_topic
                    )
                    
                    if response["status"] == "ok":
                        # Add topic to each article for reference
                        for article in response["articles"]:
                            article["topic"] = topic
                        
                        all_articles.extend(response["articles"])
                        logger.info(f"Retrieved {len(response['articles'])} articles for topic '{topic}'")
                    else:
                        logger.warning(f"News API returned non-ok status: {response['status']}")
                        
                except NewsAPIException as e:
                    logger.error(f"NewsAPI error for topic '{topic}': {str(e)}")
                except Exception as e:
                    logger.error(f"Unexpected error collecting news for topic '{topic}': {str(e)}")
                    
                # Add a small delay to avoid hitting rate limits
                time.sleep(0.5)
        
        # If we don't have NEWS_API_KEY or no articles were found, use fallback data
        if not self.newsapi or not all_articles:
            if not self.news_api_key:
                logger.warning("No valid NEWS_API_KEY found - using fallback mock news data")
            else:
                logger.warning("No articles found - using fallback mock news data")
            all_articles = self._generate_mock_news(topics)
        
        # Deduplicate based on URL and shuffle
        unique_articles = {article["url"]: article for article in all_articles}
        result = list(unique_articles.values())
        random.shuffle(result)
        
        return result

    def _generate_mock_news(self, topics: List[str]) -> List[Dict[str, Any]]:
        """Generate mock news data for development purposes"""
        mock_articles = []
        
        for topic in topics:
            for i in range(5):  # Generate 5 articles per topic
                mock_articles.append({
                    "source": {"id": f"source-{i}", "name": f"Mock Source {i}"},
                    "author": f"Author {i}",
                    "title": f"Latest developments in {topic} - Article {i+1}",
                    "description": f"This is a mock article about {topic} with important information and updates.",
                    "url": f"https://mock-news.example/article/{topic.replace(' ', '-')}-{i}",
                    "urlToImage": None,
                    "publishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "content": f"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This article discusses {topic} in detail with analysis and expert opinions.",
                    "topic": topic
                })
        
        return mock_articles
