from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.ai import router as ai_router
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.ipfs import router as ipfs_router
from app.routes.logistics import router as logistics_router
from app.routes.notifications import router as notifications_router
from app.routes.telemetry import router as telemetry_router
from app.routes.ui import router as ui_router
from app.config.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Enhanced Backend API for decentralized healthcare logistics platform with AI analytics and real-time notifications.",
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(ai_router)
    app.include_router(analytics_router)
    app.include_router(notifications_router)
    app.include_router(ipfs_router)
    app.include_router(logistics_router)
    app.include_router(telemetry_router)
    app.include_router(ui_router)
    return app


app = create_app()
