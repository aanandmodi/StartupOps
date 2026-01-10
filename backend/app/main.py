"""FastAPI Main Application - StartupOps Backend."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import startup_router, task_router, alert_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    logger.info("Starting StartupOps Backend...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Mock Mode: {settings.is_mock_mode}")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down StartupOps Backend...")


# Create FastAPI app
app = FastAPI(
    title="StartupOps API",
    description="""
    Multi-Agent AI Co-Founder Platform
    
    This backend orchestrates 5 AI agents:
    - **Product Agent** (Claude 3.5 Sonnet): MVP planning
    - **Tech Agent** (GPT-4.1): Technical architecture
    - **Marketing Agent** (Gemini 1.5 Pro): Growth strategy
    - **Finance Agent** (GPT-4o-mini): Budget & runway
    - **Advisor Agent** (Claude Instant): Health monitoring
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(startup_router)
app.include_router(task_router)
app.include_router(alert_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "StartupOps API",
        "version": "1.0.0",
        "description": "Multi-Agent AI Co-Founder Platform",
        "mock_mode": settings.is_mock_mode,
        "agents": {
            "product": settings.product_agent_model,
            "tech": settings.tech_agent_model,
            "marketing": settings.marketing_agent_model,
            "finance": settings.finance_agent_model,
            "advisor": settings.advisor_agent_model,
        },
        "endpoints": {
            "create_startup": "POST /startup/create",
            "get_dashboard": "GET /startup/{id}/dashboard",
            "update_task": "POST /task/{id}/update",
            "get_alerts": "GET /alerts/{startup_id}",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mock_mode": settings.is_mock_mode,
    }
