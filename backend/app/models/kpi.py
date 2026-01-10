"""KPI database model."""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, Enum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KPIType(str, enum.Enum):
    """KPI type enum."""
    MARKETING = "marketing"
    FINANCE = "finance"
    EXECUTION = "execution"


class KPI(Base):
    """KPI model representing a key performance indicator."""
    
    __tablename__ = "kpis"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    startup_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("startups.id"), nullable=False
    )
    type: Mapped[KPIType] = mapped_column(Enum(KPIType), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    target: Mapped[float] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    
    # Relationships
    startup = relationship("Startup", back_populates="kpis")
    
    def __repr__(self) -> str:
        return f"<KPI(id={self.id}, name='{self.name}', value={self.value})>"
