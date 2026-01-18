"""Startup database model."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Startup(Base):
    """Startup model representing a startup project."""
    
    __tablename__ = "startups"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Owner relationship
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    
    # Startup details
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(String(100), nullable=False)
    team_size: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, archived, completed
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped[Optional["User"]] = relationship("User", back_populates="startups")
    tasks = relationship("Task", back_populates="startup", cascade="all, delete-orphan")
    kpis = relationship("KPI", back_populates="startup", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="startup", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="startup", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="startup", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Startup(id={self.id}, domain='{self.domain}')>"

