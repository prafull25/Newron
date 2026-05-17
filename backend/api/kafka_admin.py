from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.postgres import Topic
from kafka.admin import create_topics, list_topics, get_topic_stats, create_single_topic

from services.auth import require_superuser

router = APIRouter(prefix="/kafka", tags=["kafka"], dependencies=[Depends(require_superuser)])


@router.post("/setup")
async def setup_topics(db: AsyncSession = Depends(get_db)):
    # 1. Create all hardcoded system topics
    result = create_topics()

    # 2. Also sync any user-created topics from Postgres
    db_result = await db.execute(select(Topic))
    db_topics = db_result.scalars().all()
    synced = []
    for topic in db_topics:
        kafka_topic = f"news.raw.{topic.name}"
        # Only create if not already in the hardcoded list
        if kafka_topic not in result["created"] and kafka_topic not in result["already_exist"]:
            created = create_single_topic(kafka_topic)
            if created:
                synced.append(kafka_topic)

    result["synced_from_db"] = synced
    return result


@router.get("/topics")
def kafka_topics():
    return list_topics()


@router.get("/stats")
def kafka_stats():
    return get_topic_stats()
