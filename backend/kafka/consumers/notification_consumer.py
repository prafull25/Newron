import asyncio
from kafka.consumers.base_consumer import BaseConsumer
from services.telegram_service import TelegramService
from services import analytics
from database import AsyncSessionLocal
from models.postgres import Recipient, NotificationLog
from sqlalchemy import select

class NotificationConsumer(BaseConsumer):
    def __init__(self):
        super().__init__(
            group_id="notification-group-v3",
            topics=["news.notifications"]
        )
        self.telegram = TelegramService()

    async def process_message(self, data: dict, topic: str):
        print(f"Processing notification for: {data.get('headline')}")
        await self.handle_notification(data)

    async def _get_recipients(self, topic_name: str):
        import time
        if not hasattr(self, '_rec_cache'):
            self._rec_cache = {}
            self._rec_cache_time = 0
            
        if time.time() - self._rec_cache_time > 300: # 5 min cache
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Recipient).where(Recipient.is_active == True))
                all_rec = result.scalars().all()
                self._rec_cache = all_rec
                self._rec_cache_time = time.time()
                
        # Filter from cache
        return [r for r in self._rec_cache if topic_name in r.subscribed_topics]

    async def handle_notification(self, data: dict):
        topic_name = data["topic"]
        headline = data["headline"]
        url = data["url"]
        ai_analysis = data.get("ai_analysis", "")
        priority = data.get("priority", "digest")

        recipients = await self._get_recipients(topic_name)

        async with AsyncSessionLocal() as db:
            for recipient in recipients:
                if priority == "breaking" and not recipient.receive_breaking:
                    continue
                if priority == "digest" and not recipient.receive_digest:
                    continue

                display_topic = topic_name.replace('_', ' ').title()
                article_urls = data.get("article_urls", [])
                sources_block = ""
                if article_urls:
                    links = "\n".join(
                        f'{i+1}. <a href="{u}">{u[:60]}...</a>' for i, u in enumerate(article_urls)
                    )
                    sources_block = f"\n\n📎 <b>Sources:</b>\n{links}"

                message = (
                    f"Hi {recipient.name}, here is News summary for {display_topic}:\n\n"
                    f"{ai_analysis}"
                    f"{sources_block}"
                )

                print(f"Sending to {recipient.name} ({recipient.telegram_chat_id})")
                success = await self.telegram.send_notification(
                    recipient.telegram_chat_id, 
                    message
                )

                log = NotificationLog(
                    recipient_id=recipient.id,
                    topic=topic_name,
                    alert_type=priority,
                    headline=headline,
                    status="sent" if success else "failed"
                )
                db.add(log)

                # Track in ClickHouse for analytics
                analytics.track_notification(
                    topic=topic_name,
                    recipient_id=recipient.id,
                    alert_type=priority,
                    status="sent" if success else "failed"
                )
            
            await db.commit()

if __name__ == "__main__":
    consumer = NotificationConsumer()
    asyncio.run(consumer.consume())
