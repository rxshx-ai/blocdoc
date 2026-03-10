from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter(tags=["ui"])

_UI_PATH = Path(__file__).resolve().parents[1] / "static" / "rbac_dashboard.html"


@router.get("/ui")
def role_ui() -> FileResponse:
    return FileResponse(_UI_PATH)
