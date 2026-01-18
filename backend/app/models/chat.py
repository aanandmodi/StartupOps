"""Chat message model for agent conversations."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Float

from app.database import Base

if TYPE_CHECKING:
    from app.models.startup import Startup
    from app.models.user import User


class ChatMessage(Base):
    """Chat message for agent conversations."""
    
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign keys
    startup_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("startups.id"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    
    # Message details
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # product, tech, marketing, finance, advisor
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    
    # Relationships
    startup: Mapped["Startup"] = relationship("Startup", back_populates="chat_messages")
    
    # Composite index for efficient conversation retrieval
    __table_args__ = (
        Index("ix_chat_messages_conversation", "startup_id", "agent_name", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, agent={self.agent_name}, role={self.role})>"


class AgentMemory(Base):
    """Persistent memory for agent decisions and context."""
    
    __tablename__ = "agent_memories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    startup_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("startups.id"), nullable=False, index=True
    )
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Memory content
    memory_type: Mapped[str] = mapped_column(String(50), nullable=False)  # decision, fact, preference
    key: Mapped[str] = mapped_column(String(255), nullable=False)  # What kind of info
    value: Mapped[str] = mapped_column(Text, nullable=False)  # The actual content
    
    # Importance score for retrieval
    importance: Mapped[float] = mapped_column(Float, default=1.0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    
    __table_args__ = (
        Index("ix_agent_memories_lookup", "startup_id", "agent_name", "memory_type"),
    )
    
    def __repr__(self) -> str:
        return f"<AgentMemory(id={self.id}, agent={self.agent_name}, key={self.key})>"
