from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health Check")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
