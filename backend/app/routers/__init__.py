"""API Routers package."""
from app.routers.startup import router as startup_router
from app.routers.task import router as task_router
from app.routers.alert import router as alert_router

__all__ = ["startup_router", "task_router", "alert_router"]
