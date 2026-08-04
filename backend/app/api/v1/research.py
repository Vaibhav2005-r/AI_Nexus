from fastapi import APIRouter, HTTPException
from app.domain.schemas import ResearchRequest
from app.domain.models import ResearchSession
from app.services.research_service import ResearchService
from app.infrastructure.sqlite_store import session_store

router = APIRouter()

@router.post("", response_model=ResearchSession)
async def start_research(request: ResearchRequest):
    session = await ResearchService.create_session(
        prompt=request.prompt,
        depth=request.depth,
        deep_web_enabled=request.deep_web_enabled,
        sources_filter=request.sources_filter,
        domain_mode=request.domain_mode
    )
    return session

@router.get("/{session_id}", response_model=ResearchSession)
async def get_research_session(session_id: str):
    session = await session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
