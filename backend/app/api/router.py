from fastapi import APIRouter
from app.api.v1.research import router as research_router
from app.api.v1.stream import router as stream_router
from app.api.v1.sessions import router as sessions_router

api_router = APIRouter()

# Combine routers
api_router.include_router(research_router, prefix="/research", tags=["Research"])
api_router.include_router(stream_router, prefix="/research", tags=["Stream"])
api_router.include_router(sessions_router, prefix="/sessions", tags=["Sessions"])
