from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.postgres import NotificationLog

router = APIRouter(prefix="/feed", tags=["feed"])

@router.get("/")
async def get_feed(limit: int = 20, db: AsyncSession = Depends(get_db)):
    # Join with topic/recipient if needed, but for now simple log list
    result = await db.execute(
        select(NotificationLog)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
