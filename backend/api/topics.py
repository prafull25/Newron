from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models.postgres import Topic
from api.schemas import TopicCreate, TopicUpdate, TopicResponse
from typing import List

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=List[TopicResponse])
async def get_topics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Topic).order_by(Topic.id))
    return result.scalars().all()


@router.get("/{name}", response_model=TopicResponse)
async def get_topic(name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Topic).where(Topic.name == name))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.post("", response_model=TopicResponse, status_code=201)
async def create_topic(data: TopicCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Topic).where(Topic.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Topic already exists")
    topic = Topic(**data.model_dump())
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


@router.put("/{name}", response_model=TopicResponse)
async def update_topic(name: str, data: TopicUpdate, db: AsyncSession = Depends(get_db)):
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
async def delete_topic(name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Topic).where(Topic.name == name))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.execute(delete(Topic).where(Topic.name == name))
    await db.commit()
    return {"deleted": True, "name": name}
