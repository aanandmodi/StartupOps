"""Startup Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class StartupCreate(BaseModel):
    """Schema for creating a new startup."""
    goal: str = Field(..., min_length=10, max_length=500, description="Startup goal")
    domain: str = Field(..., min_length=2, max_length=100, description="Business domain")
    team_size: int = Field(..., ge=1, le=100, description="Team size")


class StartupResponse(BaseModel):
    """Schema for startup response."""
    id: int
    goal: str
    domain: str
    team_size: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ExecutionHealth(BaseModel):
    """Execution health metrics."""
    score: float = Field(..., ge=0, le=100, description="Health score 0-100")
    status: str = Field(..., description="Health status: healthy, at_risk, critical")
    completed_tasks: int
    total_tasks: int
    blocked_tasks: int
    overdue_tasks: int


class StartupDashboard(BaseModel):
    """Full dashboard response schema."""
    startup: StartupResponse
    tasks: list["TaskResponse"]
    kpis: list["KPIResponse"]
    alerts: list["AlertResponse"]
    execution_health: ExecutionHealth


# Import after class definitions to avoid circular imports
from app.schemas.task import TaskResponse
from app.schemas.kpi import KPIResponse
from app.schemas.alert import AlertResponse

StartupDashboard.model_rebuild()
