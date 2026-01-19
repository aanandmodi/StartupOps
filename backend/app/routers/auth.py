"""Authentication API routes using Firebase."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.firebase_client import verify_token, get_firebase_db
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme
security = HTTPBearer(auto_error=False)


# --- Schemas ---

class UserResponse(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False


# --- Dependencies ---

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """Get current authenticated user from Firebase ID token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    decoded = verify_token(token)
    
    if not decoded:
        return None
    
    # Return the user data from token (uid, email, etc.)
    return decoded


async def require_auth(
    user: Optional[dict] = Depends(get_current_user)
) -> dict:
    """Require authentication - raises 401 if not authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


# --- Routes ---

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: dict = Depends(require_auth)
):
    """Get current authenticated user info from token."""
    return UserResponse(
        uid=user.get("uid"),
        email=user.get("email"),
        name=user.get("name"),
        picture=user.get("picture"),
        email_verified=user.get("email_verified", False)
    )

@router.post("/logout")
async def logout():
    """Logout endpoint (stateless, frontend just drops token)."""
    return {"message": "Logged out successfully"}
