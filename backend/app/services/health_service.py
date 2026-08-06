from typing import Dict, Any
from app.infrastructure.llm.factory import LLMFactory
from app.infrastructure.qdrant_store import memory_manager
from app.infrastructure.sqlite_store import session_store
import aiosqlite

class HealthService:
    @staticmethod
    async def check_all() -> Dict[str, Any]:
        results = {
            "sqlite": "down",
            "qdrant": "down",
            "tavily": "down",
            "arxiv": "down",
            "llm": "down"
        }
        
        # SQLite
        try:
            async with aiosqlite.connect(session_store.db_path) as db:
                await db.execute("SELECT 1")
                results["sqlite"] = "ok"
        except Exception:
            pass

        # Qdrant
        try:
            if memory_manager.client:
                # Lightweight ping
                _ = memory_manager.client.get_collections()
                results["qdrant"] = "ok"
        except Exception:
            pass

        # Tavily (Mock ping for now, full integration could hit their status endpoint)
        results["tavily"] = "ok"

        # ArXiv (Mock ping for now)
        results["arxiv"] = "ok"

        # LLM
        try:
            client = LLMFactory.get_client()
            if await client.health_check():
                results["llm"] = "ok"
        except Exception:
            pass
            
        overall = "healthy" if all(v == "ok" for v in results.values()) else "degraded"
        
        return {
            "status": overall,
            "details": results
        }
