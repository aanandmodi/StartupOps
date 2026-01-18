"""FastAPI Main Application - StartupOps Backend V2."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    startup_router, 
    task_router, 
    alert_router, 
    export_router, 
    streaming_router,
    auth_router,
    chat_router,
    integrations_router,
    execution_router,
    startups_router
)


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
    logger.info("Starting StartupOps Backend V2...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {'PostgreSQL' if not settings.use_sqlite else 'SQLite'}")
    logger.info(f"Mock Mode: {settings.is_mock_mode}")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down StartupOps Backend...")


# Create FastAPI app
app = FastAPI(
    title="StartupOps API V2",
    description="""
    ## Multi-Agent AI Co-Founder Platform
    
    StartupOps V2 provides a complete AI co-founder experience with:
    
    ### 🤖 AI Agents
    - **Product Agent**: MVP planning, feature prioritization
    - **Tech Agent**: Technical architecture, stack recommendations
    - **Marketing Agent**: Growth strategy, content planning
    - **Finance Agent**: Budget, runway, financial projections
    - **Advisor Agent**: Strategic oversight, health monitoring
    
    ### 💬 Agent Chat
    Chat directly with any agent like talking to a real co-founder.
    
    ### ⚡ Auto-Execution
    Agents generate real artifacts: code, docs, templates, and more.
    
    ### 🔐 Authentication
    OAuth2 support for Google and GitHub.
    
    ### 📊 Export & Docs
    Export PRD, budget, architecture docs, and more.
    """,
    version="2.0.0",
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
app.include_router(auth_router)
app.include_router(startup_router)
app.include_router(startups_router)
app.include_router(task_router)
app.include_router(alert_router)
app.include_router(export_router)
app.include_router(streaming_router)
app.include_router(chat_router)
app.include_router(integrations_router)
app.include_router(execution_router)



@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "StartupOps API",
        "version": "2.0.0",
        "description": "Multi-Agent AI Co-Founder Platform with Chat",
        "mock_mode": settings.is_mock_mode,
        "database": "PostgreSQL" if not settings.use_sqlite else "SQLite",
        "features": [
            "OAuth Authentication (Google, GitHub)",
            "Multi-Startup Management",
            "Agent Chat Interface",
            "Real-time Streaming",
            "Export Documents",
        ],
        "agents": {
            "product": settings.product_agent_model,
            "tech": settings.tech_agent_model,
            "marketing": settings.marketing_agent_model,
            "finance": settings.finance_agent_model,
            "advisor": settings.advisor_agent_model,
        },
        "endpoints": {
            "auth": "/auth/google, /auth/github, /auth/me",
            "startup": "/startup/create, /startup/{id}/dashboard",
            "chat": "/chat/{startup_id}/{agent_name}",
            "export": "/startup/{id}/export/*",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "mock_mode": settings.is_mock_mode,
        "database": "PostgreSQL" if not settings.use_sqlite else "SQLite",
    }

