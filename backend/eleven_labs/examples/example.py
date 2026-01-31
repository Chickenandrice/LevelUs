""""
Example script to test the ElevenLabs API with text to speech"""

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
import os

load_dotenv()

elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)

audio = elevenlabs.text_to_speech.convert(
    text="Hey... Have you met Snee? Oh, you havent? Oh... Here I am!",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2",
    output_format="mp3_44100_128",
)

# Replace play(audio) with this:
with open("output.mp3", "wb") as f:
    for chunk in audio:
        f.write(chunk)
print("Audio saved to output.mp3")

