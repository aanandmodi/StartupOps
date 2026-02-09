"""Rate limiter for Groq API calls."""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RateLimiter:
    """
    Global rate limiter for API calls.
    Uses a Semaphore to ensure we don't exceed max concurrent requests.
    """
    
    _instance: Optional['RateLimiter'] = None
    _semaphore: Optional[asyncio.Semaphore] = None
    
    def __init__(self):
        # Initialize with configured limit or default to 5
        limit = getattr(settings, "groq_concurrent_limit", 5)
        self._semaphore = asyncio.Semaphore(limit)
        logger.info(f"RateLimiter initialized with {limit} concurrent slots")
    
    @classmethod
    def get_instance(cls) -> 'RateLimiter':
        """Get or create singleton instance."""
        if cls._instance is None:
            cls._instance = RateLimiter()
        return cls._instance
    
    @asynccontextmanager
    async def throttle(self):
        """
        Context manager to acquire a slot in the semaphore.
        Waits if no slots are available.
        """
        if self._semaphore is None:
            self.__init__()
            
        async with self._semaphore:
            yield

# Global instance
limiter = RateLimiter.get_instance()
