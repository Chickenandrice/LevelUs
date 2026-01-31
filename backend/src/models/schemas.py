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

class MeetingStatistics(BaseModel):
    """Statistics about the meeting"""
    total_duration_seconds: float
    total_speakers: int
    speaking_time_by_speaker: dict[str, float]  # speaker_id -> seconds
    total_words: int
    words_by_speaker: dict[str, int]  # speaker_id -> word count
    interruptions_count: int
    average_turn_length_seconds: float

class Inequality(BaseModel):
    """Detected inequality in the meeting"""
    type: Literal[
        "interruption",
        "idea_ignored",
        "idea_taken",
        "domination",
        "exclusion",
        "dismissal"
    ]
    description: str
    speaker_affected: str  # speaker_id or name
    timestamp_ms: int
    context: str  # surrounding context

class TranscriptSegment(BaseModel):
    """Segment of transcript with timestamp"""
    speaker: str
    start_ms: int
    end_ms: int
    text: str

class AmplifiedTranscriptSegment(BaseModel):
    """Amplified transcript segment with highlighting"""
    speaker: str
    start_ms: int
    end_ms: int
    original_text: str
    highlighted_text: str

class ActionSuggestion(BaseModel):
    """Action suggestion for improving meeting dynamics"""
    action: Literal[
        "invite_quiet_people",
        "credit_original_idea_person",
        "let_speaker_finish",
        "clarify_decision",
        "redirect_attention",
        "encourage_input",
        "rebalance_discussion",
        "do_nothing"
    ]
    reason: str
    priority: Literal["low", "medium", "high"]
    target_speaker: Optional[str] = None  # speaker_id or name if applicable
    suggested_message: str  # Context-aware facilitator message

class GeminiOutput(BaseModel):
    summary: str
    decisions: list[str]
    action_items: list[dict]
    important_points: list[str]  # Changed from "stats"
    meeting_statistics: MeetingStatistics
    inequalities: list[Inequality]
    full_transcript: list[TranscriptSegment]
    amplified_transcript: list[AmplifiedTranscriptSegment]  # New field
    suggestions: list[ActionSuggestion]

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
