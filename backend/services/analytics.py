from clickhouse_driver import Client
from config import settings
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

_client = None

def get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(
            host=settings.clickhouse_host,
            port=settings.clickhouse_port,
            database=settings.clickhouse_db,
        )
    return _client


def ensure_tables():
    """Create analytics tables if they don't exist."""
    client = get_client()

    client.execute("""
        CREATE TABLE IF NOT EXISTS article_events (
            event_time   DateTime DEFAULT now(),
            topic        String,
            source_url   String,
            headline     String,
            event_type   String   -- 'scraped' | 'classified_breaking' | 'classified_digest'
        ) ENGINE = MergeTree()
        ORDER BY (event_time, topic)
    """)

    client.execute("""
        CREATE TABLE IF NOT EXISTS notification_events (
            event_time   DateTime DEFAULT now(),
            topic        String,
            recipient_id UInt32,
            alert_type   String,  -- 'breaking' | 'digest'
            status       String   -- 'sent' | 'failed'
        ) ENGINE = MergeTree()
        ORDER BY (event_time, topic)
    """)

    logger.info("ClickHouse analytics tables ready.")


def track_article(topic: str, source_url: str, headline: str, event_type: str = "scraped"):
    """Log a single article event to ClickHouse."""
    try:
        get_client().execute(
            "INSERT INTO article_events (event_time, topic, source_url, headline, event_type) VALUES",
            [{"event_time": datetime.now(timezone.utc).replace(tzinfo=None),
              "topic": topic,
              "source_url": source_url,
              "headline": headline,
              "event_type": event_type}]
        )
    except Exception as e:
        logger.warning(f"ClickHouse track_article failed: {e}")


def track_notification(topic: str, recipient_id: int, alert_type: str, status: str):
    """Log a notification delivery event to ClickHouse."""
    try:
        get_client().execute(
            "INSERT INTO notification_events (event_time, topic, recipient_id, alert_type, status) VALUES",
            [{"event_time": datetime.now(timezone.utc).replace(tzinfo=None),
              "topic": topic,
              "recipient_id": recipient_id,
              "alert_type": alert_type,
              "status": status}]
        )
    except Exception as e:
        logger.warning(f"ClickHouse track_notification failed: {e}")
