from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models.postgres import Recipient
from api.schemas import RecipientCreate, RecipientUpdate, RecipientResponse
from typing import List

router = APIRouter(prefix="/recipients", tags=["recipients"])


@router.get("", response_model=List[RecipientResponse])
async def get_recipients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).order_by(Recipient.id))
    return result.scalars().all()


@router.get("/{recipient_id}", response_model=RecipientResponse)
async def get_recipient(recipient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).where(Recipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient


@router.post("", response_model=RecipientResponse, status_code=201)
async def create_recipient(data: RecipientCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Recipient).where(Recipient.telegram_chat_id == data.telegram_chat_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Telegram chat ID already registered")
    recipient = Recipient(**data.model_dump())
    db.add(recipient)
    await db.commit()
    await db.refresh(recipient)
    return recipient


@router.put("/{recipient_id}", response_model=RecipientResponse)
async def update_recipient(recipient_id: int, data: RecipientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).where(Recipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(recipient, field, value)
    await db.commit()
    await db.refresh(recipient)
    return recipient


@router.delete("/{recipient_id}")
async def delete_recipient(recipient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).where(Recipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    await db.execute(delete(Recipient).where(Recipient.id == recipient_id))
    await db.commit()
    return {"deleted": True, "id": recipient_id}
