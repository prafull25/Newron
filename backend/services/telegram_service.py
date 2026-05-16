from telegram import Bot
from telegram.constants import ParseMode
from config import settings
import asyncio
import logging

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.token = settings.telegram_bot_token
        self.bot = Bot(token=self.token) if self.token and self.token != "your_telegram_bot_token" else None

    async def send_notification(self, chat_id: str, message: str):
        if not self.bot:
            logger.warning(f"Telegram Bot not configured. Would have sent to {chat_id}: {message[:50]}...")
            return False
        
        try:
            await self.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode=ParseMode.HTML,
                disable_web_page_preview=False
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {chat_id}: {e}")
            return False

    async def broadcast_notification(self, chat_ids: list[str], message: str):
        tasks = [self.send_notification(cid, message) for cid in chat_ids]
        return await asyncio.gather(*tasks)
