import os
from pydantic import BaseModel

class Settings(BaseModel):
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"  # Default to available model
    pause_trigger_seconds: float = 1.5
    max_buffer_segments: int = 300

settings = Settings(
    gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
    gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),  # Default to available model
    pause_trigger_seconds=float(os.getenv("PAUSE_TRIGGER_SECONDS", "1.5")),
    max_buffer_segments=int(os.getenv("MAX_BUFFER_SEGMENTS", "300")),
)

# Only raise error if not in test mode
if not settings.gemini_api_key and "pytest" not in os.environ.get("_", ""):
    # Check if we're running tests by checking if pytest is in the call stack
    import sys
    if "pytest" not in " ".join(sys.argv):
        raise RuntimeError("Missing GEMINI_API_KEY")
