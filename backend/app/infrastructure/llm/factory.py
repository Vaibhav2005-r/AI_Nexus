from app.config import get_settings
from app.utils.logger import get_logger
from app.infrastructure.llm.base import BaseLLMClient
from app.infrastructure.llm.gemini_client import GeminiClient
from app.infrastructure.llm.nvidia_client import NvidiaClient
from app.infrastructure.llm.mock_client import MockClient
from app.infrastructure.llm.failover_client import FailoverLLMClient

logger = get_logger(__name__)
settings = get_settings()

class LLMFactory:
    _instance = None

    @classmethod
    def get_client(cls) -> BaseLLMClient:
        if cls._instance is not None:
            return cls._instance

        is_mock = settings.USE_MOCK_LLM
        if is_mock:
            logger.info("LLMFactory: Returning MockClient")
            cls._instance = MockClient()
            return cls._instance

        provider = settings.LLM_PROVIDER.lower()
        fallback = settings.LLM_FALLBACK_PROVIDER.lower()
        
        try:
            primary_client = cls._create_client(provider)
            logger.info(f"LLMFactory: Successfully initialized primary {provider} client")
            
            if fallback:
                try:
                    fallback_client = cls._create_client(fallback)
                    logger.info(f"LLMFactory: Successfully initialized fallback {fallback} client")
                    cls._instance = FailoverLLMClient(primary=primary_client, fallback=fallback_client)
                    logger.info("LLMFactory: FailoverLLMClient activated")
                except Exception as fallback_e:
                    logger.error(f"LLMFactory: Failed to initialize fallback '{fallback}': {fallback_e}. Running without fallback.")
                    cls._instance = primary_client
            else:
                cls._instance = primary_client
                
        except Exception as e:
            logger.error(f"LLMFactory: Failed to initialize primary provider '{provider}': {e}")
            if fallback:
                logger.info(f"LLMFactory: Primary initialization failed. Falling back completely to '{fallback}'")
                try:
                    cls._instance = cls._create_client(fallback)
                    logger.info(f"LLMFactory: Successfully initialized fallback {fallback} client as standalone")
                except Exception as fallback_e:
                    logger.error(f"LLMFactory: Failed to initialize fallback '{fallback}': {fallback_e}")
                    raise RuntimeError(f"Both primary ({provider}) and fallback ({fallback}) providers failed initialization.")
            else:
                raise RuntimeError(f"Primary provider '{provider}' failed initialization and no fallback configured.")
                
        return cls._instance

    @classmethod
    def _create_client(cls, provider: str) -> BaseLLMClient:
        if provider == "gemini":
            client = GeminiClient()
            if not client.client:
                raise ValueError("Gemini API key is not configured")
            return client
        elif provider == "nvidia":
            client = NvidiaClient()
            if not client.client:
                raise ValueError("NVIDIA API key is not configured")
            return client
        elif provider == "mock":
            return MockClient()
        elif provider in ["openrouter", "groq", "openai"]:
            raise NotImplementedError(f"Provider '{provider}' is planned but not yet implemented.")
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
