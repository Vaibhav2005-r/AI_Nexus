from fastapi import APIRouter, HTTPException
from app.domain.schemas import SessionListResponse
from app.infrastructure.sqlite_store import session_store

router = APIRouter()

@router.get("", response_model=SessionListResponse)
async def list_sessions():
    sessions = await session_store.list_sessions()
    # Sort descending by creation date (naive)
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return SessionListResponse(sessions=sessions, total=len(sessions))

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    success = await session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"detail": "Session deleted"}
