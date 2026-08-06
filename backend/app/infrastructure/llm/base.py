from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class TransientInfrastructureError(Exception):
    """Raised when an LLM provider encounters a retryable infrastructure failure (timeout, 5xx, 429)."""
    pass

class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_structured(self, prompt: str, schema_model: Type[T], timeout_seconds: Optional[int] = None) -> T:
        """
        Generates structured data based on the provided Pydantic model.
        """
        pass
        
    @abstractmethod
    async def health_check(self) -> bool:
        """
        Performs a lightweight completion test to verify the provider is responsive.
        """
        pass
