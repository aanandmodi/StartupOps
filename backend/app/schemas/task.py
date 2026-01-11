"""Task Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from app.models.task import TaskCategory, TaskStatus


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(..., min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=1000)
    category: TaskCategory
    priority: int = Field(1, ge=1, le=5)
    estimated_days: float = Field(1, ge=0.5, le=365)
    dependencies: list[int] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    estimated_days: Optional[float] = Field(None, ge=0.5, le=365)


class TaskResponse(BaseModel):
    """Schema for task response."""
    id: int
    startup_id: int
    title: str
    description: Optional[str]
    category: TaskCategory
    priority: int
    estimated_days: float
    status: TaskStatus
    dependencies: list[int]
    
    class Config:
        from_attributes = True
