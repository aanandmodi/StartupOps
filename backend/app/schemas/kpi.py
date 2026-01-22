"""KPI Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.kpi import KPIType


class KPIResponse(BaseModel):
    """Schema for KPI response."""
    id: str  # Firestore uses string document IDs
    startup_id: str
    type: KPIType
    name: str
    value: float
    target: Optional[float]
    unit: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True
