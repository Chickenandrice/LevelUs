from pydantic import BaseModel, Field
from typing import Optional, Literal, Any, Dict

class DiarizedSegment(BaseModel):
    meeting_id: str
    speaker: str = Field(..., description='e.g. "spk_0", "spk_1"')
    start_ms: int
    end_ms: int
    text: str
    is_final: bool = True
    confidence: Optional[float] = None

class GeminiOutput(BaseModel):
    summary: str
    decisions: list[str]
    action_items: list[dict]
    stats: list[str]

class TimestampedGeminiOutput(GeminiOutput):
    timestamp_ms: int
    start_ms: int  # Start time of segments processed
    end_ms: int    # End time of segments processed

class ControlMessage(BaseModel):
    type: Literal["flush", "reset"]  # flush => force Gemini now; reset => clear buffer
    meeting_id: str

class MeetingStateResponse(BaseModel):
    meeting_id: str
    segments: list[DiarizedSegment]
    gemini_outputs: list[TimestampedGeminiOutput]
