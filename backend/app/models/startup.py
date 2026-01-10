"""Startup database model."""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Startup(Base):
    """Startup model representing a startup project."""
    
    __tablename__ = "startups"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal: Mapped[str] = mapped_column(String(500), nullable=False)
    domain: Mapped[str] = mapped_column(String(100), nullable=False)
    team_size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    
    # Relationships
    tasks = relationship("Task", back_populates="startup", cascade="all, delete-orphan")
    kpis = relationship("KPI", back_populates="startup", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="startup", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="startup", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Startup(id={self.id}, domain='{self.domain}')>"
