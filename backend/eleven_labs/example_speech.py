# example.py for speech to text for mp3 files
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from io import BytesIO
import requests
from elevenlabs.client import ElevenLabs

load_dotenv()

elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# use the audio file TWO MEN TALKING.mp3 file instead
audio_path = Path(__file__).parent / "sample.mp3"
audio_data = open(audio_path, "rb").read()


transcription = elevenlabs.speech_to_text.convert(
    file=audio_data,
    model_id="scribe_v2", # Model to use
    tag_audio_events=True, # Tag audio events like laughter, applause, etc.
    language_code="eng", # Language of the audio file. If set to None, the model will detect the language automatically.
    diarize=True, # Whether to annotate who is speaking
)

# Save the transcription to JSON and TXT files
output_dir = Path(__file__).parent

# Convert to serializable dict (handles Pydantic models)
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

# Save as JSON
json_path = output_dir / "transcription.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(transcription_dict, f, indent=2, ensure_ascii=False, default=str)
print(f"Saved JSON to {json_path}")


