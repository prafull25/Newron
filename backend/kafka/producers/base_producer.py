import json
from confluent_kafka import Producer
from config import settings

class BaseProducer:
    def __init__(self):
        self.producer = Producer({
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'client.id': 'newron-producer'
        })

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"Message delivery failed: {err}")
        else:
            print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def produce(self, topic: str, data: dict, key: str = None):
        try:
            self.producer.produce(
                topic,
                key=key,
                value=json.dumps(data).encode('utf-8'),
                callback=self.delivery_report
            )
            self.producer.flush()
        except Exception as e:
            print(f"Error producing to {topic}: {e}")
