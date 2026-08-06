import time
import json
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from app.infrastructure.llm.base import BaseLLMClient, TransientInfrastructureError
from app.utils.logger import get_logger

logger = get_logger(__name__)
T = TypeVar('T', bound=BaseModel)

class FailoverLLMClient(BaseLLMClient):
    """
    A robust LLM client proxy that implements active runtime failover routing
    and circuit breaking for transient infrastructure failures.
    """
    def __init__(self, primary: BaseLLMClient, fallback: BaseLLMClient):
        self.primary = primary
        self.fallback = fallback
        self._circuit_broken_until = 0.0
        # 5 minutes circuit breaker
        self._circuit_breaker_duration = 300 

    async def generate_structured(self, prompt: str, schema_model: Type[T], timeout_seconds: Optional[int] = None) -> T:
        now = time.time()
        
        if now < self._circuit_broken_until:
            logger.info("Circuit breaker is open. Routing directly to fallback.", 
                        fallback=self.fallback.__class__.__name__)
            return await self._call_fallback(prompt, schema_model, "circuit_breaker_open", timeout_seconds)
            
        start_time = time.time()
        try:
            # Delegate to primary; it will handle its own internal retries
            return await self.primary.generate_structured(prompt, schema_model, timeout_seconds)
            
        except TransientInfrastructureError as e:
            latency = time.time() - start_time
            
            # Trip the circuit breaker
            self._circuit_broken_until = time.time() + self._circuit_breaker_duration
            
            # Log structured metadata as requested
            logger.error("failover_triggered",
                         provider=self.primary.__class__.__name__,
                         fallback=self.fallback.__class__.__name__,
                         reason=str(e),
                         circuit_broken_until=self._circuit_broken_until,
                         latency_ms=int(latency * 1000))
                         
            return await self._call_fallback(prompt, schema_model, "transient_infrastructure_error", timeout_seconds)
            
        # We explicitly do NOT catch other Exceptions (like Pydantic ValidationError or JSONDecodeError).
        # We want those to fail fast to avoid hiding real bugs.

    async def _call_fallback(self, prompt: str, schema_model: Type[T], reason: str, timeout_seconds: Optional[int] = None) -> T:
        try:
            return await self.fallback.generate_structured(prompt, schema_model, timeout_seconds)
        except Exception as e:
            logger.error("Fallback provider also failed", error=str(e), reason=reason)
            raise RuntimeError(f"Fallback provider failed after primary failure ({reason}): {str(e)}") from e

    async def health_check(self) -> bool:
        now = time.time()
        if now < self._circuit_broken_until:
            return await self.fallback.health_check()
            
        primary_ok = await self.primary.health_check()
        if primary_ok:
            return True
            
        return await self.fallback.health_check()
