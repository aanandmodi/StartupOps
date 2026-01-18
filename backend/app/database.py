"""Database configuration and session management."""
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Determine which database to use
db_url = settings.effective_database_url
is_postgres = db_url.startswith("postgresql")

# Create async engine with appropriate settings
engine_kwargs = {
    "echo": settings.environment == "development",
    "future": True,
}

# Use NullPool for PostgreSQL in async context to avoid connection issues
if is_postgres:
    engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(db_url, **engine_kwargs)

logger.info(f"Database configured: {'PostgreSQL' if is_postgres else 'SQLite'}")

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")

