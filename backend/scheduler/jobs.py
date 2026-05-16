from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from database import AsyncSessionLocal
from models.postgres import Topic
from services.scraper import NewsScraper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
scraper = NewsScraper()

async def run_scraper_job(topic_id: int):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if topic and topic.is_active:
            logger.info(f"Starting scraper job for topic: {topic.name}")
            config = {
                "name": topic.name,
                "sources": topic.sources
            }
            scraper.run_scraper(config)

async def sync_scheduler_with_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Topic))
        topics = result.scalars().all()
        
        # Remove all existing jobs to refresh
        scheduler.remove_all_jobs()
        
        for topic in topics:
            if topic.is_active:
                logger.info(f"Scheduling {topic.name} with cron: {topic.schedule}")
                scheduler.add_job(
                    run_scraper_job,
                    'cron',
                    # Using split logic or simple cron if it's standard
                    # apscheduler cron takes individual fields. 
                    # We'll assume topic.schedule is standard 5-field cron
                    **parse_cron(topic.schedule),
                    args=[topic.id],
                    id=f"job_{topic.name}",
                    replace_existing=True
                )

def parse_cron(cron_str: str) -> dict:
    parts = cron_str.split()
    if len(parts) != 5:
        return {"minute": "0", "hour": "*"} # Fallback
    return {
        "minute": parts[0],
        "hour": parts[1],
        "day": parts[2],
        "month": parts[3],
        "day_of_week": parts[4]
    }
