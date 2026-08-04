from typing import List, Optional
from app.domain.interfaces import SessionRepository
from app.domain.models import ResearchSession
from app.utils.logger import get_logger

logger = get_logger(__name__)

class MemorySessionStore(SessionRepository):
    def __init__(self):
        self._store: dict[str, ResearchSession] = {}

    async def save_session(self, session: ResearchSession) -> None:
        self._store[session.id] = session
        logger.info("Session saved", session_id=session.id, status=session.status.value)

    async def get_session(self, session_id: str) -> Optional[ResearchSession]:
        return self._store.get(session_id)

    async def list_sessions(self) -> List[ResearchSession]:
        return list(self._store.values())

    async def delete_session(self, session_id: str) -> bool:
        if session_id in self._store:
            del self._store[session_id]
            logger.info("Session deleted", session_id=session_id)
            return True
        return False

# Global instance for DI
session_store = MemorySessionStore()
