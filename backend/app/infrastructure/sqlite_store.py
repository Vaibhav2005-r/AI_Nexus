from typing import List, Optional
from app.domain.interfaces import SessionRepository
from app.domain.models import ResearchSession
from app.utils.logger import get_logger
import aiosqlite

logger = get_logger(__name__)

class SQLiteSessionStore(SessionRepository):
    def __init__(self, db_path: str = "research_memory.db"):
        self.db_path = db_path
        self._initialized = False

    async def _init_db(self):
        if self._initialized:
            return
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    data JSON NOT NULL
                )
            """)
            await db.commit()
        self._initialized = True

    async def save_session(self, session: ResearchSession) -> None:
        await self._init_db()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO sessions (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
                (session.id, session.model_dump_json(by_alias=True))
            )
            await db.commit()
        logger.info("Session saved to SQLite", session_id=session.id, status=session.status.value)

    async def get_session(self, session_id: str) -> Optional[ResearchSession]:
        await self._init_db()
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT data FROM sessions WHERE id = ?", (session_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return ResearchSession.model_validate_json(row[0])
        return None

    async def list_sessions(self) -> List[ResearchSession]:
        await self._init_db()
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT data FROM sessions") as cursor:
                rows = await cursor.fetchall()
                sessions = [ResearchSession.model_validate_json(row[0]) for row in rows]
                # Sort by created_at descending
                return sorted(sessions, key=lambda s: s.created_at, reverse=True)

    async def delete_session(self, session_id: str) -> bool:
        await self._init_db()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            await db.commit()
            if cursor.rowcount > 0:
                logger.info("Session deleted from SQLite", session_id=session_id)
                return True
        return False

    async def clear_all_sessions(self) -> int:
        await self._init_db()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM sessions")
            await db.commit()
            count = cursor.rowcount
            logger.info("All sessions cleared from SQLite", deleted_count=count)
            return count

    async def get_global_stats(self) -> dict:
        sessions = await self.list_sessions()
        total_sessions = len(sessions)
        total_sources_analyzed = 0
        total_facts_verified = 0
        total_credibility = 0.0
        sessions_with_metrics = 0
        
        for session in sessions:
            if session.metrics:
                total_sources_analyzed += session.metrics.sources_analyzed
                total_facts_verified += session.metrics.facts_verified
                total_credibility += session.metrics.overall_credibility
                sessions_with_metrics += 1
                
        average_credibility = (total_credibility / sessions_with_metrics) if sessions_with_metrics > 0 else 0.0
        
        return {
            "total_sessions": total_sessions,
            "total_sources_analyzed": total_sources_analyzed,
            "total_facts_verified": total_facts_verified,
            "average_credibility": round(average_credibility, 2)
        }

# Global instance for DI
session_store = SQLiteSessionStore()
