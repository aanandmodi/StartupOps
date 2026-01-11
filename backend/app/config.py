"""Application configuration using pydantic-settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenRouter Configuration
    # Groq Configuration
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    
    # Agent Model Assignments
    # Using Moonshot Kimi K2 for all agents
    product_agent_model: str = "moonshotai/kimi-k2-instruct-0905"
    tech_agent_model: str = "moonshotai/kimi-k2-instruct-0905"
    marketing_agent_model: str = "moonshotai/kimi-k2-instruct-0905"
    finance_agent_model: str = "moonshotai/kimi-k2-instruct-0905"
    advisor_agent_model: str = "moonshotai/kimi-k2-instruct-0905"
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./startupops.db"
    
    # Environment
    environment: str = "development"
    
    # API Settings
    api_timeout: int = 30
    max_retries: int = 3
    
    @property
    def is_mock_mode(self) -> bool:
        """Check if we should use mock responses (no API key)."""
        return not self.groq_api_key
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
