from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from app.utils.logger import get_logger
import uuid

logger = get_logger(__name__)

class QdrantMemoryManager:
    def __init__(self, db_path: str = "qdrant_data"):
        self.collection_name = "research_memory"
        # Using local persistent storage
        self.client = QdrantClient(path=db_path)
        
        # Initialize collection if not exists
        if not self.client.collection_exists(self.collection_name):
            # We don't need to manually create collection if using the fastembed .add() and .query() API,
            # QdrantClient will handle it automatically, but we can configure it if needed.
            logger.info("Qdrant collection will be auto-created on first insert.")

    def store_research_memory(self, session_id: str, query: str, chunks: List[str]):
        """
        Embeds and stores the most important chunks of a research report into Qdrant.
        """
        try:
            if not chunks:
                return

            documents = []
            metadata = []
            
            for chunk in chunks:
                documents.append(f"Query: {query}\nFinding: {chunk}")
                metadata.append({"session_id": session_id, "query": query})
                
            # .add() automatically uses fastembed with all-MiniLM-L6-v2
            self.client.add(
                collection_name=self.collection_name,
                documents=documents,
                metadata=metadata
            )
            logger.info("Stored research memory in Qdrant", session_id=session_id, chunks=len(chunks))
        except Exception as e:
            logger.error("Failed to store research memory in Qdrant", error=str(e))

    def retrieve_past_research(self, current_query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves the top N most relevant past research chunks for a given new query.
        """
        try:
            if not self.client.collection_exists(self.collection_name):
                return []
                
            results = self.client.query(
                collection_name=self.collection_name,
                query_text=current_query,
                limit=limit
            )
            
            # format results
            past_findings = []
            for hit in results:
                # hit is a QueryResponse, usually hit.document has the text
                if hit.score > 0.6: # Relevance threshold
                    past_findings.append({
                        "text": hit.document,
                        "score": hit.score,
                        "session_id": hit.metadata.get("session_id") if hit.metadata else None
                    })
                    
            return past_findings
        except Exception as e:
            logger.error("Failed to retrieve past research from Qdrant", error=str(e))
            return []

memory_manager = QdrantMemoryManager()
