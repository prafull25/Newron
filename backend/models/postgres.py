from sqlalchemy import Column, Integer, String, Boolean, ARRAY, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    sources = Column(JSONB, nullable=False, default=list)
    schedule = Column(String(50), nullable=False)
    breaking_keywords = Column(ARRAY(Text), nullable=False, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    telegram_chat_id = Column(String(50), unique=True, nullable=False)
    subscribed_topics = Column(ARRAY(Text), nullable=False, default=list)
    receive_breaking = Column(Boolean, default=True)
    receive_digest = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, unique=True, nullable=True) # links to User.id
    created_at = Column(TIMESTAMP, server_default=func.now())


class NotificationLog(Base):
    __tablename__ = "notification_log"

    id = Column(Integer, primary_key=True)
    recipient_id = Column(Integer)
    topic = Column(String(100))
    alert_type = Column(String(20))
    headline = Column(Text)
    message_preview = Column(Text)
    sent_at = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(20), default="sent")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
