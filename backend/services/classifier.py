from models.postgres import Topic
from sqlalchemy import select
from database import AsyncSessionLocal
import asyncio

class Classifier:
    def __init__(self):
        self._topics_cache = {}
        self._cache_time = 0

    async def _refresh_cache(self):
        import time
        if time.time() - self._cache_time < 300: # 5 min cache
            return
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Topic))
            topics = result.scalars().all()
            self._topics_cache = {t.name: [k.lower() for k in t.breaking_keywords] for t in topics}
            self._cache_time = time.time()

    async def is_breaking(self, topic_name: str, headline: str, content: str) -> bool:
        await self._refresh_cache()
        
        keywords = self._topics_cache.get(topic_name)
        if not keywords:
            return False
        
        text = (headline + " " + content).lower()
        for keyword in keywords:
            if keyword in text:
                return True
        return False
