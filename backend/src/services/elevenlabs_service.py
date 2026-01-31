"""
Service to integrate 11 Labs speech-to-text with the meeting workflow.
"""
import os
import asyncio
from typing import List, Optional

from elevenlabs.client import ElevenLabs
from src.models.schemas import DiarizedSegment


def normalize_speaker_id(speaker_id: str) -> str:
    """Normalize 11 Labs speaker_id to our format (speaker_0 -> spk_0)"""
    if speaker_id.startswith("speaker_"):
        return speaker_id.replace("speaker_", "spk_")
    return speaker_id


def transform_elevenlabs_transcription_to_segments(
    transcription_data: dict,
    meeting_id: str,
    is_final: bool = True
) -> List[DiarizedSegment]:
    """
    Transform 11 Labs transcription output to DiarizedSegment format.
    
    Expected transcription_data structure:
    {
        "language_code": "eng",
        "language_probability": 1.0,
        "text": "...",
        "words": [
            {
                "text": "word",
                "start": 0.839,  # seconds
                "end": 0.939,   # seconds
                "type": "word" or "spacing",
                "speaker_id": "speaker_0",
                "logprob": 0.0,
                "characters": null
            },
            ...
        ]
    }
    """
    if not transcription_data or "words" not in transcription_data:
        return []
    
    words = transcription_data.get("words", [])
    if not words:
        return []
    
    # Group words by speaker
    segments = []
    current_segment_words = []
    current_speaker = None
    current_start = None
    
    for word in words:
        # Skip spacing-only words for speaker grouping
        if word.get("type") == "spacing":
            if current_segment_words:
                current_segment_words.append(word)
            continue
        
        word_speaker = word.get("speaker_id")
        
        # If speaker changes, finalize current segment and start new one
        if current_speaker is not None and word_speaker != current_speaker:
            if current_segment_words:
                segment = _create_segment_from_words(
                    current_segment_words,
                    current_speaker,
                    meeting_id,
                    is_final,
                    transcription_data.get("language_probability")
                )
                if segment:
                    segments.append(segment)
            
            current_segment_words = [word]
            current_speaker = word_speaker
            current_start = word.get("start")
        else:
            if current_speaker is None:
                current_speaker = word_speaker
                current_start = word.get("start")
            current_segment_words.append(word)
    
    # Add the last segment
    if current_segment_words:
        segment = _create_segment_from_words(
            current_segment_words,
            current_speaker,
            meeting_id,
            is_final,
            transcription_data.get("language_probability")
        )
        if segment:
            segments.append(segment)
    
    return segments


def _create_segment_from_words(
    words: List[dict],
    speaker_id: str,
    meeting_id: str,
    is_final: bool,
    confidence: Optional[float]
) -> Optional[DiarizedSegment]:
    """Create a DiarizedSegment from a list of words."""
    if not words:
        return None
    
    # Filter content words for timing
    content_words = [w for w in words if w.get("type") == "word"]
    if not content_words:
        return None
    
    # Get speaker and normalize
    fallback_speaker = content_words[0].get("speaker_id") if content_words else None
    final_speaker_id = speaker_id or fallback_speaker or "spk_0"
    speaker = normalize_speaker_id(final_speaker_id)
    
    # Calculate timing from content words
    start_seconds = min(w.get("start", 0) for w in content_words)
    end_seconds = max(w.get("end", 0) for w in content_words)
    
    # Convert to milliseconds
    start_ms = int(start_seconds * 1000)
    end_ms = int(end_seconds * 1000)
    
    # Build text from all words (including spacing)
    text = "".join(w.get("text", "") for w in words).strip()
    
    if not text:
        return None
    
    return DiarizedSegment(
        meeting_id=meeting_id,
        speaker=speaker,
        start_ms=start_ms,
        end_ms=end_ms,
        text=text,
        is_final=is_final,
        confidence=confidence
    )


async def transcribe_audio_file(
    audio_data: bytes,
    meeting_id: str,
    elevenlabs_client: Optional[ElevenLabs] = None,
    is_final: bool = True
) -> List[DiarizedSegment]:
    """
    Transcribe audio file using 11 Labs and convert to DiarizedSegments.
    
    Args:
        audio_data: Audio file bytes
        meeting_id: Meeting ID for the segments
        elevenlabs_client: Optional pre-initialized ElevenLabs client
        is_final: Whether this is a final transcription chunk
    
    Returns:
        List of DiarizedSegment objects
    """
    
    # Initialize client if not provided
    if elevenlabs_client is None:
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable is required")
        elevenlabs_client = ElevenLabs(api_key=api_key)
    
    # Convert audio to transcription (run in thread pool since it's blocking)
    loop = asyncio.get_event_loop()
    transcription = await loop.run_in_executor(
        None,
        lambda: elevenlabs_client.speech_to_text.convert(
            file=audio_data,
            model_id="scribe_v2",
            tag_audio_events=True,
            language_code="eng",  # Can be None for auto-detection
            diarize=True,
        )
    )
    
    # Convert transcription to dict
    transcription_dict = {}
    if hasattr(transcription, "model_dump"):
        transcription_dict = transcription.model_dump()
    elif hasattr(transcription, "dict"):
        transcription_dict = transcription.dict()
    else:
        # Try to access attributes directly
        words = getattr(transcription, "words", [])
        # Convert word objects to dicts if needed
        words_list = []
        for word in words:
            if hasattr(word, "model_dump"):
                words_list.append(word.model_dump())
            elif hasattr(word, "dict"):
                words_list.append(word.dict())
            elif isinstance(word, dict):
                words_list.append(word)
            else:
                # Try to access as attributes
                words_list.append({
                    "text": getattr(word, "text", ""),
                    "start": getattr(word, "start", 0.0),
                    "end": getattr(word, "end", 0.0),
                    "type": getattr(word, "type", "word"),
                    "speaker_id": getattr(word, "speaker_id", "speaker_0"),
                    "logprob": getattr(word, "logprob", 0.0),
                    "characters": getattr(word, "characters", None),
                })
        
        transcription_dict = {
            "text": getattr(transcription, "text", ""),
            "words": words_list,
            "language_code": getattr(transcription, "language_code", "eng"),
            "language_probability": getattr(transcription, "language_probability", 1.0),
        }
    
    # Transform to segments
    return transform_elevenlabs_transcription_to_segments(
        transcription_dict,
        meeting_id=meeting_id,
        is_final=is_final
    )
