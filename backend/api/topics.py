from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models.postgres import Topic, User
from api.schemas import TopicCreate, TopicUpdate, TopicResponse
from services.auth import get_current_user, require_superuser
from kafka.admin import create_single_topic
from typing import List

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=List[TopicResponse])
async def get_topics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List all available system topics for authenticated users."""
    result = await db.execute(select(Topic).order_by(Topic.id))
    return result.scalars().all()


@router.get("/{name}", response_model=TopicResponse)
async def get_topic(
    name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Retrieve specific topic details for authenticated users."""
    result = await db.execute(select(Topic).where(Topic.name == name))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.post("", response_model=TopicResponse, status_code=201)
async def create_topic(
    data: TopicCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    """Add a new topic (Superadmin only)."""
    existing = await db.execute(select(Topic).where(Topic.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Topic already exists")
    topic = Topic(**data.model_dump())
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    
    # Automatically provision the Kafka topic
    create_single_topic(f"news.raw.{topic.name}")
    
    return topic


@router.put("/{name}", response_model=TopicResponse)
async def update_topic(
    name: str,
    data: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    """Update topic configuration (Superadmin only)."""
    result = await db.execute(select(Topic).where(Topic.name == name))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(topic, field, value)
    await db.commit()
    await db.refresh(topic)
    return topic


@router.delete("/{name}")
async def delete_topic(
    name: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    """Remove a topic (Superadmin only)."""
    result = await db.execute(select(Topic).where(Topic.name == name))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.execute(delete(Topic).where(Topic.name == name))
    await db.commit()
    return {"deleted": True, "name": name}
