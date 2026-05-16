import asyncio
from kafka.consumers.base_consumer import BaseConsumer
from kafka.producers.base_producer import BaseProducer
from services.classifier import Classifier

class ClassifierConsumer(BaseConsumer):
    def __init__(self):
        # Subscribe to all raw news topics
        super().__init__(
            group_id="classifier-group-v3",
            topics=["^news\.raw\..*"]
        )
        self.producer = BaseProducer()
        self.classifier = Classifier()

    async def process_message(self, data: dict, topic: str):
        print(f"Classifying message from {topic}: {data.get('headline')}")
        
        is_breaking = await self.classifier.is_breaking(
            data["topic"], 
            data["headline"], 
            data.get("summary", "")
        )

        target_topic = "news.breaking" if is_breaking else "news.digest"
        print(f"Routing to: {target_topic}")
        
        # Enrich data with priority
        data["priority"] = "breaking" if is_breaking else "digest"
        
        self.producer.produce(target_topic, data, key=data.get("url"))
        # Also send to a general stream for monitoring
        self.producer.produce("news.classifier.input", data, key=data.get("url"))

if __name__ == "__main__":
    consumer = ClassifierConsumer()
    asyncio.run(consumer.consume())
