# example.py for speech to text for mp3 files
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from io import BytesIO
import requests
from elevenlabs.client import ElevenLabs


def convert_audio_to_transcription(audio_path, elevenlabs):
    """Convert audio to transcription that is diarized by speaker"""
    audio_data = open(audio_path, "rb").read()
    transcription = elevenlabs.speech_to_text.convert(
        file=audio_data,
        model_id="scribe_v2", # Model to use
        tag_audio_events=True, # Tag audio events like laughter, applause, etc.
        language_code="eng", # Language of the audio file. If set to None, the model will detect the language automatically.
        diarize=True, # Whether to annotate who is speaking
    )
    return transcription


def save_transcription_to_json(transcription, output_dir):
    """Save transcription to JSON file"""
    # Convert to serializable dict 
    def to_dict(obj):
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict"):
            return obj.dict()
        return str(obj)
    try:
        transcription_dict = to_dict(transcription)
    except Exception:
        transcription_dict = {"raw": str(transcription)}

    return transcription_dict

def main():
    load_dotenv()

    elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

    # convert audio mp3 file to transcription
    try:
        # CHANGE THIS TO THE AUDIO FILE YOU WANT TO TRANSCRIBE, which will be what the front end sends to the backend
        audio_path = Path(__file__).parent / "aoc_court_hearing.mp3" 
        transcription = convert_audio_to_transcription(audio_path, elevenlabs)

    except Exception as e:
        print(f"Error converting audio to transcription: {e}")
        return

    # Save the transcription to JSON
    output_dir = Path(__file__).parent

    # Convert to serializable dict (handles Pydantic models)
    def to_dict(obj):
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict"):
            return obj.dict()
        return str(obj)

    transcription_dict = save_transcription_to_json(transcription, output_dir)

    # Save as JSON
    json_path = output_dir / "transcription.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(transcription_dict, f, indent=2, ensure_ascii=False, default=str)
    print(f"Saved JSON to {json_path}")