"""Application configuration using pydantic-settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenRouter Configuration
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Agent Model Assignments
    # Using validated OpenRouter model names
    product_agent_model: str = "anthropic/claude-3.5-sonnet"
    tech_agent_model: str = "openai/gpt-4o"  # Fixed: gpt-4.1 doesn't exist
    marketing_agent_model: str = "google/gemini-2.5-flash"  # Fixed: using valid Gemini model
    finance_agent_model: str = "openai/gpt-4o-mini"
    advisor_agent_model: str = "mistralai/mistral-7b-instruct:free"  # Fixed: claude-instant-1 doesn't exist
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./startupops.db"
    
    # Environment
    environment: str = "development"
    
    # API Settings
    api_timeout: int = 60
    max_retries: int = 3
    
    @property
    def is_mock_mode(self) -> bool:
        """Check if we should use mock responses (no API key)."""
        return not self.openrouter_api_key or self.openrouter_api_key.startswith("sk-or-v1-your")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
