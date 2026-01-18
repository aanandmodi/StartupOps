"""User model for authentication."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.startup import Startup


class User(Base):
    """User model with OAuth support."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Basic info
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # OAuth
    oauth_provider: Mapped[str] = mapped_column(String(50))  # "google", "github", "local"
    oauth_id: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Optional password for local auth (hashed)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    startups: Mapped[list["Startup"]] = relationship(
        "Startup", back_populates="owner", lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
