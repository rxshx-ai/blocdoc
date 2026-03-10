from fastapi import FastAPI

from app.routes.ai import router as ai_router
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.ipfs import router as ipfs_router
from app.routes.logistics import router as logistics_router
from app.routes.telemetry import router as telemetry_router
from app.routes.ui import router as ui_router
from app.config.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Backend API for decentralized healthcare logistics platform.",
    )

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(ai_router)
    app.include_router(ipfs_router)
    app.include_router(logistics_router)
    app.include_router(telemetry_router)
    app.include_router(ui_router)
    return app


app = create_app()
