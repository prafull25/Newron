from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models.postgres import Recipient, User
from api.schemas import RecipientCreate, RecipientUpdate, RecipientResponse
from services.auth import get_current_user, require_superuser
from typing import List

router = APIRouter(prefix="/recipients", tags=["recipients"])


# ─────────────────────────────────────────────────────────────────
# Personal Subscriber Configuration for Normal Users
# ─────────────────────────────────────────────────────────────────

@router.get("/my-config", response_model=RecipientResponse)
async def get_my_recipient_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the personal telegram recipient configuration of the logged-in user."""
    # Lookup by user_id
    result = await db.execute(select(Recipient).where(Recipient.user_id == current_user.id))
    recipient = result.scalar_one_or_none()
    
    # If not found, return an unsaved placeholder dict so we do not trigger unique constraint empty string crashes
    if not recipient:
        return {
            "id": 0,
            "name": current_user.username,
            "telegram_chat_id": "",
            "subscribed_topics": [],
            "receive_breaking": True,
            "receive_digest": True,
            "is_active": True,
            "user_id": current_user.id,
            "created_at": None
        }
        
    return recipient


@router.put("/my-config", response_model=RecipientResponse)
async def update_my_recipient_config(
    data: RecipientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update the personal telegram recipient configuration of the logged-in user."""
    # Enforce non-empty telegram chat id when creating/updating recipient config
    if data.telegram_chat_id is not None and not data.telegram_chat_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Telegram Chat ID cannot be empty. Please enter a valid Telegram Chat ID."
        )

    result = await db.execute(select(Recipient).where(Recipient.user_id == current_user.id))
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        # Fallback create - validate chat ID is provided
        if not data.telegram_chat_id or not data.telegram_chat_id.strip():
            raise HTTPException(
                status_code=400,
                detail="Telegram Chat ID is required to register subscription alert configurations."
            )
            
        # Verify uniqueness
        existing = await db.execute(
            select(Recipient).where(Recipient.telegram_chat_id == data.telegram_chat_id.strip())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Telegram chat ID already registered by another user")

        recipient = Recipient(
            name=current_user.username,
            telegram_chat_id=data.telegram_chat_id.strip(),
            subscribed_topics=data.subscribed_topics or [],
            receive_breaking=data.receive_breaking if data.receive_breaking is not None else True,
            receive_digest=data.receive_digest if data.receive_digest is not None else True,
            is_active=data.is_active if data.is_active is not None else True,
            user_id=current_user.id
        )
        db.add(recipient)
    else:
        # Update existing
        if data.name is not None:
            recipient.name = data.name
        if data.telegram_chat_id is not None:
            new_chat_id = data.telegram_chat_id.strip()
            # Check unique constraint if changing chat ID
            if new_chat_id != recipient.telegram_chat_id:
                existing = await db.execute(
                    select(Recipient).where(Recipient.telegram_chat_id == new_chat_id)
                )
                if existing.scalar_one_or_none():
                    raise HTTPException(status_code=409, detail="Telegram chat ID already registered by another user")
            recipient.telegram_chat_id = new_chat_id
        if data.subscribed_topics is not None:
            recipient.subscribed_topics = data.subscribed_topics
        if data.receive_breaking is not None:
            recipient.receive_breaking = data.receive_breaking
        if data.receive_digest is not None:
            recipient.receive_digest = data.receive_digest
        if data.is_active is not None:
            recipient.is_active = data.is_active
            
    await db.commit()
    await db.refresh(recipient)
    return recipient


# ─────────────────────────────────────────────────────────────────
# Global/Superadmin CRUD Endpoints
# ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[RecipientResponse])
async def get_recipients(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    result = await db.execute(select(Recipient).order_by(Recipient.id))
    return result.scalars().all()


@router.get("/{recipient_id}", response_model=RecipientResponse)
async def get_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    result = await db.execute(select(Recipient).where(Recipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient


@router.post("", response_model=RecipientResponse, status_code=201)
async def create_recipient(
    data: RecipientCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
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
async def update_recipient(
    recipient_id: int,
    data: RecipientUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
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
async def delete_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_superuser)
):
    result = await db.execute(select(Recipient).where(Recipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    await db.execute(delete(Recipient).where(Recipient.id == recipient_id))
    await db.commit()
    return {"deleted": True, "id": recipient_id}
