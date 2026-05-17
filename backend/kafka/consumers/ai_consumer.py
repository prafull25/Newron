import asyncio
from kafka.consumers.base_consumer import BaseConsumer
from kafka.producers.base_producer import BaseProducer
from services.ai_engine import AIEngine
import json
import time

class AIConsumer(BaseConsumer):
    def __init__(self):
        super().__init__(
            topics=["news.breaking", "news.digest"],
            group_id="ai-group-v4"
        )
        self.producer = BaseProducer()
        self.ai_engine = AIEngine()
        self.batches = {}
        self.last_flush = time.time()

    async def process_message(self, kafka_topic: str, data: dict):
        topic = data.get("topic", "general")
        if topic not in self.batches:
            self.batches[topic] = []
            
        self.batches[topic].append(data)
        
        # Safety guard: If a batch reaches 50 articles, flush it immediately
        # to prevent extremely large payloads. Otherwise, let it accumulate
        # and we will flush the entire batch at once when the queue is empty.
        if len(self.batches[topic]) >= 50:
            await self._flush_topic(topic)

    async def _flush_topic(self, topic: str):
        batch = self.batches.get(topic, [])
        if not batch:
            return
            
        print(f"Flushing batch of {len(batch)} articles for topic: {topic}...")
        
        summary_text = await asyncio.to_thread(self.ai_engine.enrich_digest, batch)
        
        if summary_text.startswith("AI Error:") or summary_text.startswith("AI Enrichment Disabled"):
            print(f"Skipping notification for {topic} due to AI error: {summary_text}")
            self.batches[topic] = []
            self.last_flush = time.time()
            return
        
        # Collect unique article URLs from the batch (max 5)
        article_urls = list(dict.fromkeys(
            a["url"] for a in batch if a.get("url")
        ))[:5]

        combined_data = {
            "topic": topic,
            "source": "AI_Digest",
            "headline": f"📰 {topic.capitalize()} News Summary ({len(batch)} articles)",
            "url": "http://localhost:3000",
            "summary": f"Combined news batch for {topic}",
            "ai_analysis": summary_text,
            "article_urls": article_urls,
            "published_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        await asyncio.to_thread(
            self.producer.produce,
            "news.notifications", 
            combined_data, 
            key=f"{topic}-{time.time()}"
        )
        print(f"Batch summary for {topic} delivered to news.notifications")
        
        self.batches[topic] = []
        self.last_flush = time.time()

    async def _consume_loop(self):
        self.consumer.subscribe(self.topics)
        print(f"Subscribed to {self.topics}")
        try:
            while True:
                msg = await asyncio.to_thread(self.consumer.poll, 1.0)
                
                if msg is None:
                    # No new messages received in the last 1.0s.
                    # This means we have consumed the entire current backlog of scraped articles.
                    # Flush all accumulated topic batches now to send exactly one consolidated digest per topic!
                    for topic in list(self.batches.keys()):
                        await self._flush_topic(topic)
                    continue
                    
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue

                kafka_topic = msg.topic()
                data = json.loads(msg.value().decode('utf-8'))
                await self.process_message(kafka_topic, data)
        finally:
            self.consumer.close()

    def consume(self):
        asyncio.run(self._consume_loop())

if __name__ == "__main__":
    consumer = AIConsumer()
    consumer.consume()
