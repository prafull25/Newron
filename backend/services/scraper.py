import feedparser
from kafka.producers.base_producer import BaseProducer
from services.deduplicator import Deduplicator
import time

class NewsScraper:
    def __init__(self):
        self.producer = BaseProducer()
        self.deduplicator = Deduplicator()

    def scrape_rss(self, topic: str, url: str):
        print(f"Scraping RSS: {url} for topic: {topic}")
        feed = feedparser.parse(url)
        for entry in feed.entries:
            url = entry.get("link", "")
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

    def run_scraper(self, topic_config: dict):
        topic_name = topic_config["name"]
        for source in topic_config["sources"]:
            if source.startswith("http"):
                self.scrape_rss(topic_name, source)
