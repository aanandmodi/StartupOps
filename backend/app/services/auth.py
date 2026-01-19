"""Authentication service for JWT and OAuth."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()

# For Python 3.14 compatibility, use simpler password hashing
# In production, switch back to bcrypt with proper async handling
import hashlib
import secrets


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        # Format: salt$hash
        try:
            salt, stored_hash = hashed_password.split("$")
            computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt.encode(), 100000).hex()
            return stored_hash == computed_hash
        except:
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password with salt."""
        salt = secrets.token_hex(16)
        hash_value = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
        return f"{salt}${hash_value}"
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.jwt_secret_key, 
            algorithm=settings.jwt_algorithm
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create a JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            return None
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_or_create_oauth_user(
        db: AsyncSession,
        email: str,
        name: str,
        oauth_provider: str,
        oauth_id: str,
        avatar_url: Optional[str] = None
    ) -> User:
        """Get existing user or create new one from OAuth data."""
        # Check if user exists
        user = await AuthService.get_user_by_email(db, email)
        
        if user:
            # Update last login
            user.last_login_at = datetime.utcnow()
            if avatar_url:
                user.avatar_url = avatar_url
            await db.commit()
            await db.refresh(user)
            return user
        
        # Create new user
        user = User(
            email=email,
            name=name,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            avatar_url=avatar_url,
            is_verified=True,  # OAuth users are pre-verified
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"Created new user: {email} via {oauth_provider}")
        return user
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user with email and password."""
        user = await AuthService.get_user_by_email(db, email)
        
        if not user:
            return None
        
        if not user.password_hash:
            return None
        
        if not AuthService.verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        await db.commit()
        
        return user
    
    @staticmethod
    async def create_local_user(
        db: AsyncSession,
        email: str,
        name: str,
        password: str
    ) -> User:
        """Create a new user with email/password authentication."""
        # Check if user already exists
        existing = await AuthService.get_user_by_email(db, email)
        if existing:
            raise ValueError("User with this email already exists")
        
        # Create new user with hashed password
        user = User(
            email=email,
            name=name,
            oauth_provider="local",
            oauth_id=None,
            password_hash=AuthService.get_password_hash(password),
            is_verified=False,  # Email verification can be added later
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"Created new local user: {email}")
        return user

