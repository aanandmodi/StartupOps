"""Alert Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.alert import AlertSeverity


class AlertResponse(BaseModel):
    """Schema for alert response."""
    id: int
    startup_id: int
    severity: AlertSeverity
    message: str
    recommended_action: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
