from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from fastembed import TextEmbedding
from app.utils.logger import get_logger
import uuid

logger = get_logger(__name__)

class QdrantMemoryManager:
    def __init__(self, db_path: str = "qdrant_data"):
        self.collection_name = "research_memory"
        # Using local persistent storage
        self.client = QdrantClient(path=db_path)
        self.embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        
        # Initialize collection if not exists
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
            logger.info("Qdrant collection created.")

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
                
            vectors = list(self.embedding_model.embed(documents))
            
            points = []
            for vector, meta, doc in zip(vectors, metadata, documents):
                meta["document"] = doc
                points.append(
                    PointStruct(
                        id=uuid.uuid4().hex, 
                        vector=vector.tolist() if hasattr(vector, "tolist") else vector, 
                        payload=meta
                    )
                )
                
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
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
                
            query_vector = list(self.embedding_model.embed([current_query]))[0]
            
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
                limit=limit
            ).points
            
            # format results
            past_findings = []
            for hit in results:
                if hit.score > 0.6: # Relevance threshold
                    past_findings.append({
                        "text": hit.payload.get("document", ""),
                        "score": hit.score,
                        "session_id": hit.payload.get("session_id")
                    })
                    
            return past_findings
        except Exception as e:
            logger.error("Failed to retrieve past research from Qdrant", error=str(e))
            return []

memory_manager = QdrantMemoryManager()
