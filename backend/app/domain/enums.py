from enum import Enum

class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class AgentStepType(str, Enum):
    PLANNER = "planner"
    DECOMPOSER = "decomposer"
    SEARCH = "search"
    VERIFIER = "verifier"
    REPORT = "report"

class SessionStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class CredibilityLabel(str, Enum):
    HIGHLY_CREDIBLE = "Highly Credible"
    CREDIBLE = "Credible"
    MODERATE = "Moderate"
    UNVERIFIED = "Unverified"
