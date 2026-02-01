from pydantic import BaseModel, Field
from typing import Optional, Literal, Any, Dict

class SpeakerReference(BaseModel):
    """Reference to a speaker with ID and optional name"""
    speaker_id: str
    speaker_name: Optional[str] = None

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
    # Action counts (excluding do_nothing)
    invite_quiet_people_count: int = 0
    credit_original_idea_person_count: int = 0
    let_speaker_finish_count: int = 0
    clarify_decision_count: int = 0
    redirect_attention_count: int = 0
    encourage_input_count: int = 0
    rebalance_discussion_count: int = 0

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
    speaker_affected: SpeakerReference  # speaker reference object
    timestamp_ms: int
    context: str  # surrounding context

class TranscriptSegment(BaseModel):
    """Segment of transcript with timestamp"""
    speaker_id: str
    speaker_name: Optional[str] = None
    start_ms: int
    end_ms: int
    text: str

class AmplifiedTranscriptSegment(BaseModel):
    """Amplified transcript segment with highlighting"""
    speaker_id: str
    speaker_name: Optional[str] = None
    start_ms: int
    end_ms: int
    original_text: str
    highlighted_text: str
    trigger_text: Optional[str] = None
    issue_description: Optional[str] = None
    recommended_action: Literal[
        "invite_quiet_people",
        "credit_original_idea_person",
        "let_speaker_finish",
        "clarify_decision",
        "redirect_attention",
        "encourage_input",
        "rebalance_discussion",
        "do_nothing"
    ] = "do_nothing"
    moderator_instruction: Optional[str] = None
    facilitator_message: Optional[str] = None

class ActionItem(BaseModel):
    """Action item with owner and description"""
    owner: Optional[SpeakerReference] = None
    item: str
    due_date: Optional[str] = None

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
    target_speaker: Optional[SpeakerReference] = None  # speaker reference object
    suggested_message: str  # Context-aware facilitator message

class SpeakerSentiment(BaseModel):
    """Sentiment analysis for a specific speaker"""
    speaker_id: str
    label: str  # e.g., "positive", "negative", "neutral"
    score: float
    rationale: str

class SentimentAnalysis(BaseModel):
    """Overall sentiment analysis"""
    overall: dict[str, Any]  # overall sentiment
    by_speaker: list[SpeakerSentiment]

class GeminiOutput(BaseModel):
    summary: str
    action_items: list[ActionItem]  # Updated to use ActionItem model
    important_points: list[str]
    meeting_statistics: MeetingStatistics
    inequalities: list[Inequality]
    full_transcript: list[TranscriptSegment]
    amplified_transcript: list[AmplifiedTranscriptSegment]
    suggestions: list[ActionSuggestion]
    sentiment: Optional[SentimentAnalysis] = None

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
