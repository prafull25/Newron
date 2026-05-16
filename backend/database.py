from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(
    f"postgresql+asyncpg://{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}",
    connect_args={
        "user": settings.postgres_user,
        "password": settings.postgres_password,
        "database": settings.postgres_db,
        "host": settings.postgres_host,
        "port": settings.postgres_port,
    },
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
