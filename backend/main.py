from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.topics import router as topics_router
from api.recipients import router as recipients_router
from api.kafka_admin import router as kafka_router
from api.feed import router as feed_router

from contextlib import asynccontextmanager
from scheduler.jobs import scheduler, sync_scheduler_with_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler
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

app.include_router(topics_router)
app.include_router(recipients_router)
app.include_router(kafka_router)
app.include_router(feed_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "newron-backend"}
