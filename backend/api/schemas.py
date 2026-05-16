from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TopicCreate(BaseModel):
    name: str
    display_name: str
    sources: List[str] = []
    schedule: str
    breaking_keywords: List[str] = []
    is_active: bool = True


class TopicUpdate(BaseModel):
    display_name: Optional[str] = None
    sources: Optional[List[str]] = None
    schedule: Optional[str] = None
    breaking_keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None


class TopicResponse(BaseModel):
    id: int
    name: str
    display_name: str
    sources: List[str]
    schedule: str
    breaking_keywords: List[str]
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RecipientCreate(BaseModel):
    name: str
    telegram_chat_id: str
    subscribed_topics: List[str] = []
    receive_breaking: bool = True
    receive_digest: bool = True


class RecipientUpdate(BaseModel):
    name: Optional[str] = None
    subscribed_topics: Optional[List[str]] = None
    receive_breaking: Optional[bool] = None
    receive_digest: Optional[bool] = None
    is_active: Optional[bool] = None


class RecipientResponse(BaseModel):
    id: int
    name: str
    telegram_chat_id: str
    subscribed_topics: List[str]
    receive_breaking: bool
    receive_digest: bool
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
