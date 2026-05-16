from fastapi import APIRouter
from kafka.admin import create_topics, list_topics, get_topic_stats

router = APIRouter(prefix="/kafka", tags=["kafka"])


@router.post("/setup")
def setup_topics():
    return create_topics()


@router.get("/topics")
def kafka_topics():
    return list_topics()


@router.get("/stats")
def kafka_stats():
    return get_topic_stats()
