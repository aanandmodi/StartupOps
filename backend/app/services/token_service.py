"""Token usage service for tracking and limiting API usage."""
import logging
from datetime import datetime, date
from typing import Optional, Tuple

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_usage import TokenUsage, FREE_DAILY_TOKEN_LIMIT, PRO_DAILY_TOKEN_LIMIT
from app.models.user import User

logger = logging.getLogger(__name__)


class TokenService:
    """Service for managing token usage and limits."""
    
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Estimate token count for a text string.
        Uses a simple heuristic: ~4 characters per token (average for English).
        For more accuracy, use tiktoken library.
        """
        if not text:
            return 0
        # Rough estimate: 1 token ≈ 4 characters
        return max(1, len(text) // 4)
    
    @staticmethod
    async def get_or_create_daily_usage(
        db: AsyncSession, 
        user_id: int
    ) -> TokenUsage:
        """Get or create today's usage record for a user."""
        today = date.today()
        
        result = await db.execute(
            select(TokenUsage).where(
                and_(
                    TokenUsage.user_id == user_id,
                    TokenUsage.usage_date == today
                )
            )
        )
        usage = result.scalar_one_or_none()
        
        if not usage:
            usage = TokenUsage(
                user_id=user_id,
                usage_date=today,
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                message_count=0
            )
            db.add(usage)
            await db.commit()
            await db.refresh(usage)
        
        return usage
    
    @staticmethod
    async def check_token_limit(
        db: AsyncSession,
        user_id: int,
        is_pro: bool = False
    ) -> Tuple[bool, int, int]:
        """
        Check if user has tokens remaining.
        
        Returns:
            Tuple of (has_tokens, remaining_tokens, daily_limit)
        """
        usage = await TokenService.get_or_create_daily_usage(db, user_id)
        limit = PRO_DAILY_TOKEN_LIMIT if is_pro else FREE_DAILY_TOKEN_LIMIT
        remaining = max(0, limit - usage.total_tokens)
        
        return (remaining > 0, remaining, limit)
    
    @staticmethod
    async def record_usage(
        db: AsyncSession,
        user_id: int,
        input_tokens: int,
        output_tokens: int
    ) -> TokenUsage:
        """
        Record token usage for a chat message.
        
        Args:
            user_id: The user's ID
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens used
            
        Returns:
            Updated TokenUsage record
        """
        usage = await TokenService.get_or_create_daily_usage(db, user_id)
        
        usage.input_tokens += input_tokens
        usage.output_tokens += output_tokens
        usage.total_tokens += (input_tokens + output_tokens)
        usage.message_count += 1
        
        await db.commit()
        await db.refresh(usage)
        
        logger.info(
            f"Token usage recorded for user {user_id}: "
            f"+{input_tokens} input, +{output_tokens} output, "
            f"total today: {usage.total_tokens}"
        )
        
        return usage
    
    @staticmethod
    async def get_usage_stats(
        db: AsyncSession,
        user_id: int,
        is_pro: bool = False
    ) -> dict:
        """
        Get detailed usage statistics for a user.
        
        Returns:
            Dictionary with usage stats
        """
        usage = await TokenService.get_or_create_daily_usage(db, user_id)
        limit = PRO_DAILY_TOKEN_LIMIT if is_pro else FREE_DAILY_TOKEN_LIMIT
        remaining = max(0, limit - usage.total_tokens)
        percentage_used = min(100, (usage.total_tokens / limit) * 100)
        
        # Calculate reset time (midnight UTC)
        now = datetime.utcnow()
        tomorrow = date.today().replace(day=date.today().day + 1)
        reset_time = datetime.combine(tomorrow, datetime.min.time())
        hours_until_reset = max(0, (reset_time - now).total_seconds() / 3600)
        
        return {
            "user_id": user_id,
            "date": str(usage.usage_date),
            "plan": "pro" if is_pro else "free",
            "daily_limit": limit,
            "tokens_used": usage.total_tokens,
            "tokens_remaining": remaining,
            "percentage_used": round(percentage_used, 1),
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
            "message_count": usage.message_count,
            "hours_until_reset": round(hours_until_reset, 1),
            "is_limit_reached": remaining <= 0
        }
