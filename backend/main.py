from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.topics import router as topics_router
from api.recipients import router as recipients_router
from api.kafka_admin import router as kafka_router
from api.feed import router as feed_router
from api.analytics import router as analytics_router
from api.auth import router as auth_router

from contextlib import asynccontextmanager
from scheduler.jobs import scheduler, sync_scheduler_with_db
from database import engine, Base, AsyncSessionLocal
import models.postgres  # Ensure models are loaded for DDL creation
from sqlalchemy import select
from models.postgres import User
from services.auth import hash_password

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all database tables exist in PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Auto-provision superuser pranjam25
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "pranjam25"))
        superuser = result.scalar_one_or_none()
        if not superuser:
            print("Auto-provisioning superuser: pranjam25")
            superuser = User(
                username="pranjam25",
                password_hash=hash_password("Pran25newron@#"),
                is_superuser=True
            )
            db.add(superuser)
            await db.commit()
            print("Superuser pranjam25 created.")

    # Initialize ClickHouse analytics tables
    try:
        from services.analytics import ensure_tables
        ensure_tables()
    except Exception as e:
        print(f"ClickHouse not ready on startup: {e}")
        
    await sync_scheduler_with_db()
    scheduler.start()
    yield
    # Shutdown: Stop scheduler
    scheduler.shutdown()

app = FastAPI(title="Newron API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(topics_router)
app.include_router(recipients_router)
app.include_router(kafka_router)
app.include_router(feed_router)
app.include_router(analytics_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "newron-backend"}
