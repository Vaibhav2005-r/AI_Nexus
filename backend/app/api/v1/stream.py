from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from app.services.research_service import ResearchService

router = APIRouter()

@router.get("/{session_id}/stream")
async def stream_research_events(session_id: str, request: Request):
    
    async def event_generator():
        queue = await ResearchService.get_stream_queue(session_id)
        while True:
            if await request.is_disconnected():
                break
                
            msg = await queue.get()
            yield msg
            
            if msg["event"] == "session_complete" or msg["event"] == "error":
                break

    return EventSourceResponse(event_generator())
