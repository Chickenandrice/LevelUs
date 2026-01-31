"""
Test script to verify 11 Labs API output structure.
Run this to see what the 11 Labs API actually returns.
"""
import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from src.services.elevenlabs_service import transcribe_audio_file, transform_elevenlabs_transcription_to_segments

# Load environment variables
load_dotenv()


async def test_elevenlabs_output():
    """Test 11 Labs API and show the output structure"""
    
    # Check for API key
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("❌ ERROR: ELEVENLABS_API_KEY not found in environment variables")
        print("   Add it to your .env file: ELEVENLABS_API_KEY=your_key_here")
        return
    
    print("✅ Found ELEVENLABS_API_KEY")
    
    # Initialize client
    try:
        elevenlabs = ElevenLabs(api_key=api_key)
        print("✅ Initialized ElevenLabs client")
    except Exception as e:
        print(f"❌ Failed to initialize client: {e}")
        return
    
    # Look for test audio file
    test_files = [
        Path("eleven_labs/aoc_court_hearing.mp3"),
        Path("eleven_labs/examples/aoc_court_hearing.mp3"),
        Path("test_audio.mp3"),
        Path("test_audio.wav"),
    ]
    
    audio_path = None
    for path in test_files:
        if path.exists():
            audio_path = path
            break
    
    if not audio_path:
        print("\n⚠️  No test audio file found. Please provide a path to an audio file.")
        print("   Looking for:")
        for path in test_files:
            print(f"     - {path}")
        print("\n   Or modify the script to point to your audio file.")
        return
    
    print(f"✅ Found audio file: {audio_path}")
    print(f"   File size: {audio_path.stat().st_size / 1024:.2f} KB")
    
    # Read audio file
    try:
        audio_data = audio_path.read_bytes()
        print(f"✅ Read audio file ({len(audio_data)} bytes)")
    except Exception as e:
        print(f"❌ Failed to read audio file: {e}")
        return
    
    # Test 1: Direct 11 Labs API call
    print("\n" + "="*60)
    print("TEST 1: Direct 11 Labs API Call")
    print("="*60)
    
    try:
        print("📞 Calling 11 Labs API...")
        transcription = elevenlabs.speech_to_text.convert(
            file=audio_data,
            model_id="scribe_v2",
            tag_audio_events=True,
            language_code="eng",
            diarize=True,
        )
        print("✅ API call successful!")
        
        # Show raw transcription object type
        print(f"\n📦 Transcription object type: {type(transcription)}")
        print(f"   Has model_dump: {hasattr(transcription, 'model_dump')}")
        print(f"   Has dict: {hasattr(transcription, 'dict')}")
        
        # Convert to dict
        if hasattr(transcription, "model_dump"):
            transcription_dict = transcription.model_dump()
            print("   ✅ Used model_dump()")
        elif hasattr(transcription, "dict"):
            transcription_dict = transcription.dict()
            print("   ✅ Used dict()")
        else:
            # Try attribute access
            transcription_dict = {
                "text": getattr(transcription, "text", "N/A"),
                "words": getattr(transcription, "words", []),
                "language_code": getattr(transcription, "language_code", "N/A"),
                "language_probability": getattr(transcription, "language_probability", 0.0),
            }
            print("   ✅ Used attribute access")
        
        # Show structure
        print(f"\n📊 Transcription Structure:")
        print(f"   language_code: {transcription_dict.get('language_code', 'N/A')}")
        print(f"   language_probability: {transcription_dict.get('language_probability', 'N/A')}")
        print(f"   text length: {len(transcription_dict.get('text', ''))} characters")
        print(f"   words count: {len(transcription_dict.get('words', []))}")
        
        # Show first few words
        words = transcription_dict.get("words", [])
        if words:
            print(f"\n📝 First 5 words:")
            for i, word in enumerate(words[:5]):
                if isinstance(word, dict):
                    print(f"   {i+1}. {word}")
                else:
                    # Try to convert word object
                    if hasattr(word, "model_dump"):
                        word_dict = word.model_dump()
                    elif hasattr(word, "dict"):
                        word_dict = word.dict()
                    else:
                        word_dict = {
                            "text": getattr(word, "text", "N/A"),
                            "start": getattr(word, "start", "N/A"),
                            "end": getattr(word, "end", "N/A"),
                            "type": getattr(word, "type", "N/A"),
                            "speaker_id": getattr(word, "speaker_id", "N/A"),
                        }
                    print(f"   {i+1}. {word_dict}")
        
        # Save full output to JSON
        output_file = Path("elevenlabs_output.json")
        with open(output_file, "w", encoding="utf-8") as f:
            # Convert word objects to dicts if needed
            words_list = []
            for word in words:
                if isinstance(word, dict):
                    words_list.append(word)
                elif hasattr(word, "model_dump"):
                    words_list.append(word.model_dump())
                elif hasattr(word, "dict"):
                    words_list.append(word.dict())
                else:
                    words_list.append({
                        "text": getattr(word, "text", ""),
                        "start": getattr(word, "start", 0.0),
                        "end": getattr(word, "end", 0.0),
                        "type": getattr(word, "type", "word"),
                        "speaker_id": getattr(word, "speaker_id", "speaker_0"),
                        "logprob": getattr(word, "logprob", 0.0),
                        "characters": getattr(word, "characters", None),
                    })
            
            output_dict = {
                "language_code": transcription_dict.get("language_code"),
                "language_probability": transcription_dict.get("language_probability"),
                "text": transcription_dict.get("text"),
                "words": words_list
            }
            json.dump(output_dict, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved full output to: {output_file}")
        
    except Exception as e:
        print(f"❌ API call failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test 2: Transform to segments
    print("\n" + "="*60)
    print("TEST 2: Transform to DiarizedSegments")
    print("="*60)
    
    try:
        segments = await transcribe_audio_file(
            audio_data=audio_data,
            meeting_id="test-meeting",
            is_final=True
        )
        
        print(f"✅ Transformed to {len(segments)} segments")
        
        if segments:
            print(f"\n📋 Segments:")
            for i, seg in enumerate(segments[:5]):  # Show first 5
                print(f"\n   Segment {i+1}:")
                print(f"      speaker: {seg.speaker}")
                print(f"      start_ms: {seg.start_ms}")
                print(f"      end_ms: {seg.end_ms}")
                print(f"      text: {seg.text[:100]}..." if len(seg.text) > 100 else f"      text: {seg.text}")
                print(f"      is_final: {seg.is_final}")
                print(f"      confidence: {seg.confidence}")
            
            if len(segments) > 5:
                print(f"\n   ... and {len(segments) - 5} more segments")
        else:
            print("⚠️  No segments created")
            
    except Exception as e:
        print(f"❌ Transformation failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60)
    print("✅ Testing complete!")
    print("="*60)


if __name__ == "__main__":
    print("🧪 Testing 11 Labs Integration\n")
    asyncio.run(test_elevenlabs_output())
