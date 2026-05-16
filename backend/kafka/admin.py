from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import KafkaException
from config import settings

TOPICS = [
    "news.raw.politics",
    "news.raw.markets",
    "news.raw.tech",
    "news.classifier.input",
    "news.breaking",
    "news.digest",
    "news.ai-enrichment",
    "news.notifications",
    "news.failed",
]

_admin: AdminClient | None = None


def get_admin() -> AdminClient:
    global _admin
    if _admin is None:
        _admin = AdminClient({"bootstrap.servers": settings.kafka_bootstrap_servers})
    return _admin


def create_topics() -> dict:
    admin = get_admin()
    new_topics = [NewTopic(t, num_partitions=1, replication_factor=1) for t in TOPICS]
    results = admin.create_topics(new_topics)

    created, already_exist, failed = [], [], []
    for topic, future in results.items():
        try:
            future.result()
            created.append(topic)
        except KafkaException as e:
            if "TOPIC_ALREADY_EXISTS" in str(e):
                already_exist.append(topic)
            else:
                failed.append({"topic": topic, "error": str(e)})

    return {"created": created, "already_exist": already_exist, "failed": failed}


def list_topics() -> list[dict]:
    admin = get_admin()
    metadata = admin.list_topics(timeout=10)
    return [
        {"topic": name, "partitions": len(meta.partitions)}
        for name, meta in metadata.topics.items()
        if not name.startswith("_")
    ]


def get_topic_stats() -> dict:
    admin = get_admin()
    metadata = admin.list_topics(timeout=10)
    
    topics_info = []
    for name, meta in metadata.topics.items():
        if name.startswith("_"):
            continue
        topics_info.append({
            "topic": name,
            "partitions": len(meta.partitions),
            "replication_factor": len(meta.partitions[0].replicas) if meta.partitions else 0,
            "is_newron_topic": name in TOPICS,
        })
    
    return {
        "cluster_id": metadata.cluster_id,
        "broker_count": len(metadata.brokers),
        "topics": sorted(topics_info, key=lambda x: x["topic"]),
        "brokers": [
            {"id": b.id, "host": b.host, "port": b.port} 
            for b in metadata.brokers.values()
        ]
    }
