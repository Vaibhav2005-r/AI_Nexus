from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "AI Research Orchestrator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
    
    # APIs
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    NVIDIA_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    USE_MOCK_LLM: bool = False
    
    # LLM Settings
    LLM_PROVIDER: str = "nvidia"
    LLM_FALLBACK_PROVIDER: str = "gemini"
    LLM_MODEL: str = "google/gemma-4-31b-it"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 8192
    LLM_TIMEOUT: int = 300
    LLM_RETRIES: int = 2
    
    # Verifier optimization
    VERIFIER_MAX_SOURCES: int = 10
    VERIFIER_SOURCE_CHAR_LIMIT: int = 1000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
