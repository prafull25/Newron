from fastapi import APIRouter
from clickhouse_driver import Client
from config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_ch() -> Client:
    return Client(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        database=settings.clickhouse_db,
    )


def safe_query(query: str, default):
    try:
        client = get_ch()
        return client.execute(query)
    except Exception as e:
        logger.warning(f"ClickHouse query failed: {e}")
        return default


@router.get("/overview")
def analytics_overview():
    """Total article events and notification events across all time."""
    articles = safe_query("SELECT count() FROM article_events", [(0,)])
    notifications = safe_query("SELECT count() FROM notification_events", [(0,)])
    sent = safe_query("SELECT count() FROM notification_events WHERE status='sent'", [(0,)])
    failed = safe_query("SELECT count() FROM notification_events WHERE status='failed'", [(0,)])
    return {
        "total_articles": articles[0][0] if articles else 0,
        "total_notifications": notifications[0][0] if notifications else 0,
        "notifications_sent": sent[0][0] if sent else 0,
        "notifications_failed": failed[0][0] if failed else 0,
    }


@router.get("/articles-by-topic")
def articles_by_topic():
    """Article count grouped by topic."""
    rows = safe_query(
        "SELECT topic, count() AS total FROM article_events GROUP BY topic ORDER BY total DESC",
        []
    )
    return [{"topic": r[0], "count": r[1]} for r in rows]


@router.get("/articles-over-time")
def articles_over_time():
    """Articles scraped per hour for the last 24 hours."""
    rows = safe_query(
        """
        SELECT toStartOfHour(event_time) AS hour, count() AS total
        FROM article_events
        WHERE event_time >= now() - INTERVAL 24 HOUR
        GROUP BY hour
        ORDER BY hour ASC
        """,
        []
    )
    return [{"hour": str(r[0]), "count": r[1]} for r in rows]


@router.get("/notifications-by-topic")
def notifications_by_topic():
    """Notification delivery breakdown by topic and status."""
    rows = safe_query(
        "SELECT topic, status, count() AS total FROM notification_events GROUP BY topic, status ORDER BY topic",
        []
    )
    return [{"topic": r[0], "status": r[1], "count": r[2]} for r in rows]


@router.get("/notifications-over-time")
def notifications_over_time():
    """Notifications sent per hour for the last 24 hours."""
    rows = safe_query(
        """
        SELECT toStartOfHour(event_time) AS hour, count() AS total
        FROM notification_events
        WHERE event_time >= now() - INTERVAL 24 HOUR
        GROUP BY hour
        ORDER BY hour ASC
        """,
        []
    )
    return [{"hour": str(r[0]), "count": r[1]} for r in rows]
