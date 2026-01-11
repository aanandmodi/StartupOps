"""Task database model."""
import enum
from sqlalchemy import String, Integer, Float, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskCategory(str, enum.Enum):
    """Task category enum."""
    PRODUCT = "product"
    TECH = "tech"
    MARKETING = "marketing"
    FINANCE = "finance"


class TaskStatus(str, enum.Enum):
    """Task status enum."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(Base):
    """Task model representing a startup task."""
    
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    startup_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("startups.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    category: Mapped[TaskCategory] = mapped_column(
        Enum(TaskCategory), nullable=False
    )
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    estimated_days: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False
    )
    dependencies: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    
    # Relationships
    startup = relationship("Startup", back_populates="tasks")
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status={self.status})>"
