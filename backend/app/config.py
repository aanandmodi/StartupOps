"""Application configuration using pydantic-settings."""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - PostgreSQL (primary) with SQLite fallback
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/startupops"
    
    # Fallback to SQLite for development without PostgreSQL
    use_sqlite: bool = False
    sqlite_url: str = "sqlite+aiosqlite:///./startupops.db"
    
    # JWT Authentication
    jwt_secret_key: str = "your-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    jwt_refresh_token_expire_days: int = 30
    
    # OAuth2 Providers
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    
    # Frontend URL (for OAuth redirect)
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
    # Groq Configuration
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    
    # OpenAI (for embeddings)
    openai_api_key: str = ""
    
    # Agent Model Assignments & Tiers
    # Free Tier (Moonshot AI Kimi K2 - Cost Effective)
    free_model_id: str = "moonshotai/kimi-k2-instruct-0905"
    
    # Premium Tier (Llama 3.3 70B - High Intelligence)
    premium_model_id: str = "llama-3.3-70b-versatile"
    
    # Default assignments (can be overridden dynamically)
    product_agent_model: str = "llama-3.3-70b-versatile"
    tech_agent_model: str = "llama-3.3-70b-versatile"
    marketing_agent_model: str = "llama-3.3-70b-versatile"
    finance_agent_model: str = "llama-3.3-70b-versatile"
    advisor_agent_model: str = "llama-3.3-70b-versatile"
    
    # Rate Limiting
    groq_concurrent_limit: int = 5
    
    # Rate Limiting
    groq_concurrent_limit: int = 5
    
    # Redis (for Celery and caching)
    redis_url: str = "redis://localhost:6379/0"
    
    # Environment
    environment: str = "development"
    google_cloud_project: str = ""
    
    # API Settings
    api_timeout: int = 30
    max_retries: int = 3
    
    @property
    def is_mock_mode(self) -> bool:
        """Check if we should use mock responses (no API key)."""
        return not self.groq_api_key
    @property
    def effective_database_url(self) -> str:
        """Get the effective database URL based on configuration."""
        if self.use_sqlite:
            return self.sqlite_url
        return self.database_url

    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

