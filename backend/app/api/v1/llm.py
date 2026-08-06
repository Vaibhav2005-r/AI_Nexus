from fastapi import APIRouter
from app.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/info", summary="Get LLM Provider Info")
async def get_llm_info():
    return {
        "provider": settings.LLM_PROVIDER,
        "fallback_provider": settings.LLM_FALLBACK_PROVIDER,
        "model": settings.LLM_MODEL,
        "is_mock": settings.USE_MOCK_LLM
    }
