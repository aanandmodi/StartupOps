"""Token usage tracking model."""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Date, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TokenUsage(Base):
    """Track daily token usage per user."""
    
    __tablename__ = "token_usage"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # User reference
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Usage date (for daily reset)
    usage_date: Mapped[date] = mapped_column(Date, index=True)
    
    # Token counts
    input_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    output_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    total_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    
    # Message count
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<TokenUsage user={self.user_id} date={self.usage_date} total={self.total_tokens}>"


# Token limit constants
FREE_DAILY_TOKEN_LIMIT = 15000  # 15k tokens/day for free users
PRO_DAILY_TOKEN_LIMIT = 100000  # 100k tokens/day for pro users

# Approximate token costs (for display)
INPUT_TOKEN_COST_PER_MILLION = 1.00  # $1.00 per million
OUTPUT_TOKEN_COST_PER_MILLION = 3.00  # $3.00 per million
