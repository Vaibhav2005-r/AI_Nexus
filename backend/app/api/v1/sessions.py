from fastapi import APIRouter, HTTPException, Query
from app.domain.schemas import SessionListResponse, GlobalStatsResponse
from app.infrastructure.sqlite_store import session_store

router = APIRouter()

@router.get("", response_model=SessionListResponse)
async def list_sessions(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    sessions = await session_store.list_sessions()
    total = len(sessions)
    # Sort descending by creation date (naive)
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    # Apply pagination
    paginated_sessions = sessions[skip : skip + limit]
    return SessionListResponse(sessions=paginated_sessions, total=total)

@router.get("/stats", response_model=GlobalStatsResponse)
async def get_global_stats():
    stats = await session_store.get_global_stats()
    return stats

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    success = await session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"detail": "Session deleted"}

@router.delete("")
async def clear_all_sessions():
    deleted_count = await session_store.clear_all_sessions()
    return {"detail": f"Cleared {deleted_count} sessions"}
