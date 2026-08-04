from abc import ABC, abstractmethod
from typing import List, Dict, Any

class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Executes a search query and returns normalized evidence items."""
        pass

class VectorStore(ABC):
    @abstractmethod
    async def store_session(self, session_id: str, text_content: str, metadata: dict) -> None:
        pass

    @abstractmethod
    async def search_similar(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        pass

class SessionRepository(ABC):
    @abstractmethod
    async def save_session(self, session: Any) -> None:
        pass

    @abstractmethod
    async def get_session(self, session_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    async def list_sessions(self) -> List[Any]:
        pass
