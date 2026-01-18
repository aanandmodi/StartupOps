"""Authentication API routes."""
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.services.auth import AuthService

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme
security = HTTPBearer(auto_error=False)


# --- Schemas ---

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class GitHubAuthRequest(BaseModel):
    code: str  # GitHub OAuth code


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str]
    oauth_provider: str
    
    class Config:
        from_attributes = True


# --- Dependencies ---

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user from JWT token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = AuthService.decode_token(token)
    
    if not payload:
        return None
    
    if payload.get("type") != "access":
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = await AuthService.get_user_by_id(db, int(user_id))
    return user


async def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require authentication - raises 401 if not authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


# --- Routes ---

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with Google OAuth."""
    try:
        # Verify Google token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={request.credential}"
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            google_data = response.json()
        
        email = google_data.get("email")
        name = google_data.get("name", email.split("@")[0])
        picture = google_data.get("picture")
        google_id = google_data.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # Get or create user
        user = await AuthService.get_or_create_oauth_user(
            db=db,
            email=email,
            name=name,
            oauth_provider="google",
            oauth_id=google_id,
            avatar_url=picture
        )
        
        # Generate tokens
        access_token = AuthService.create_access_token({"sub": str(user.id)})
        refresh_token = AuthService.create_refresh_token({"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/github", response_model=TokenResponse)
async def github_auth(
    request: GitHubAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with GitHub OAuth."""
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": request.code
                },
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to exchange GitHub code"
                )
            
            token_data = token_response.json()
            github_token = token_data.get("access_token")
            
            if not github_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No access token from GitHub"
                )
            
            # Get user info
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/json"
                }
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get GitHub user info"
                )
            
            github_data = user_response.json()
            
            # Get primary email if not public
            email = github_data.get("email")
            if not email:
                emails_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {github_token}",
                        "Accept": "application/json"
                    }
                )
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next(
                        (e for e in emails if e.get("primary")), 
                        emails[0] if emails else None
                    )
                    if primary_email:
                        email = primary_email.get("email")
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not get email from GitHub"
                )
            
            name = github_data.get("name") or github_data.get("login")
            avatar_url = github_data.get("avatar_url")
            github_id = str(github_data.get("id"))
            
            # Get or create user
            user = await AuthService.get_or_create_oauth_user(
                db=db,
                email=email,
                name=name,
                oauth_provider="github",
                oauth_id=github_id,
                avatar_url=avatar_url
            )
            
            # Generate tokens
            access_token = AuthService.create_access_token({"sub": str(user.id)})
            refresh_token = AuthService.create_refresh_token({"sub": str(user.id)})
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user={
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "avatar_url": user.avatar_url
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GitHub auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    payload = AuthService.decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await AuthService.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    access_token = AuthService.create_access_token({"sub": str(user.id)})
    new_refresh_token = AuthService.create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: User = Depends(require_auth)
):
    """Get current authenticated user info."""
    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout():
    """Logout current user (client should discard tokens)."""
    return {"message": "Logged out successfully"}
