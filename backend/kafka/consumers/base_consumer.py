import json
from confluent_kafka import Consumer, KafkaError
from config import settings

class BaseConsumer:
    def __init__(self, group_id: str, topics: list):
        self.consumer = Consumer({
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest'
        })
        self.topics = topics
        self.consumer.subscribe(self.topics)

    async def consume(self):
        try:
            while True:
                import asyncio
                msg = await asyncio.to_thread(self.consumer.poll, 1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"Consumer error: {msg.error()}")
                        break
                
                try:
                    data = json.loads(msg.value().decode('utf-8'))
                    await self.process_message(data, msg.topic())
                except Exception as e:
                    print(f"Error processing message: {e}")
                    
        finally:
            self.consumer.close()

    async def process_message(self, data: dict, topic: str):
        raise NotImplementedError("Subclasses must implement process_message")
