from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_ai_provider_selection_service
from app.models.ai_requests import AISelectProviderRequest, AISelectProviderResponse
from app.services.ai_provider_selection_service import AIProviderSelectionService

router = APIRouter(tags=["ai"])


@router.post("/ai/select-provider", response_model=AISelectProviderResponse)
def select_provider(
    payload: AISelectProviderRequest,
    service: AIProviderSelectionService = Depends(get_ai_provider_selection_service),
) -> AISelectProviderResponse:
    try:
        result = service.select_provider(payload)
        return AISelectProviderResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
