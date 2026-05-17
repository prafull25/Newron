import feedparser
from kafka.producers.base_producer import BaseProducer
from services.deduplicator import Deduplicator
from services import analytics
import time
import calendar

class NewsScraper:
    def __init__(self):
        self.producer = BaseProducer()
        self.deduplicator = Deduplicator()

    def scrape_rss(self, topic: str, url: str):
        print(f"Scraping RSS: {url} for topic: {topic}")
        feed = feedparser.parse(url)
        for entry in feed.entries:
            url = entry.get("link", "")
            
            # Filter: Skip articles older than 7 days (168 hours) to ensure we get fresh content
            # without completely blocking feeds that update less frequently than daily.
            parsed_time = entry.get("published_parsed")
            if parsed_time:
                published_epoch = calendar.timegm(parsed_time)
                age = time.time() - published_epoch
                if age > 7 * 24 * 3600: # 7 days
                    print(f"Skipping old article (age: {age/3600:.1f}h): {entry.get('title', '')[:50]}...")
                    continue
                    
            if self.deduplicator.is_duplicate(url):
                continue
                
            article = {
                "topic": topic,
                "source": url,
                "headline": entry.get("title", ""),
                "url": url,
                "summary": entry.get("summary", ""),
                "published_at": entry.get("published", "")
            }
            self.producer.produce(f"news.raw.{topic}", article, key=article["url"])
            analytics.track_article(topic, url, article["headline"], event_type="scraped")

    def run_scraper(self, topic_config: dict):
        topic_name = topic_config["name"]
        for source in topic_config["sources"]:
            if source.startswith("http"):
                self.scrape_rss(topic_name, source)
