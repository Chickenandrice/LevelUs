"""
Test the full workflow: 11 Labs transcription → Gemini analysis
Tests the /transcribe-audio endpoint end-to-end
"""
import os
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()


async def test_full_workflow():
    """Test the complete workflow from audio file to Gemini output"""
    
    print("🧪 Testing Full Workflow: 11 Labs → Gemini\n")
    
    # Check for required API keys
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not elevenlabs_key:
        print("❌ ERROR: ELEVENLABS_API_KEY not found in environment variables")
        return
    
    if not gemini_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment variables")
        return
    
    print("✅ Found required API keys")
    
    # Find test audio file
    test_files = [
        Path("eleven_labs/examples/aoc_court_hearing.mp3"),
        Path("eleven_labs/aoc_court_hearing.mp3"),
        Path("test_audio.mp3"),
        Path("test_audio.wav"),
    ]
    
    audio_path = None
    for path in test_files:
        if path.exists():
            audio_path = path
            break
    
    if not audio_path:
        print("\n⚠️  No test audio file found.")
        print("   Looking for:")
        for path in test_files:
            print(f"     - {path}")
        print("\n   Please provide an audio file or modify the script.")
        return
    
    print(f"✅ Found audio file: {audio_path}")
    print(f"   File size: {audio_path.stat().st_size / 1024:.2f} KB\n")
    
    # Start the FastAPI server (or assume it's running)
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    print(f"📡 Testing against: {base_url}")
    
    # Test 1: Health check
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{base_url}/health")
            if response.status_code == 200:
                print("✅ Server is running")
            else:
                print(f"❌ Server returned status {response.status_code}")
                return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Make sure the FastAPI server is running:")
        print("   uvicorn src.main:app --reload")
        return
    
    # Test 2: Transcribe audio
    print("\n" + "="*60)
    print("TEST 2: Transcribe Audio (Full Workflow)")
    print("="*60)
    
    meeting_id = f"test-meeting-{int(asyncio.get_event_loop().time())}"
    print(f"📝 Meeting ID: {meeting_id}")
    
    try:
        # Read audio file
        with open(audio_path, "rb") as f:
            audio_data = f.read()
        
        print(f"📤 Uploading audio file ({len(audio_data)} bytes)...")
        
        # Make request to transcribe-audio endpoint
        # Increased timeout for large files: 11 Labs transcription + Gemini processing
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout
            files = {"file": (audio_path.name, audio_data, "audio/mpeg")}
            data = {
                "meeting_id": meeting_id,
            }
            
            print("⏳ Processing (this may take a while)...")
            response = await client.post(
                f"{base_url}/transcribe-audio",
                files=files,
                data=data
            )
        
        if response.status_code != 200:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return
        
        result = response.json()
        print("✅ Transcription successful!")
        
        # Show results
        print(f"\n📊 Results:")
        print(f"   Segments processed: {result.get('segments_processed', 0)}")
        
        gemini_output = result.get("gemini_output", {})
        if gemini_output:
            print(f"\n🤖 Gemini Output:")
            print(f"   Summary: {gemini_output.get('summary', 'N/A')[:100]}...")
            print(f"   Decisions: {len(gemini_output.get('decisions', []))} found")
            print(f"   Action Items: {len(gemini_output.get('action_items', []))} found")
            print(f"   Important Points: {len(gemini_output.get('important_points', []))} found")
            
            # Meeting statistics
            stats = gemini_output.get("meeting_statistics", {})
            if stats:
                print(f"\n📈 Meeting Statistics:")
                print(f"   Total duration: {stats.get('total_duration_seconds', 0):.2f} seconds")
                print(f"   Total speakers: {stats.get('total_speakers', 0)}")
                print(f"   Total words: {stats.get('total_words', 0)}")
                print(f"   Interruptions: {stats.get('interruptions_count', 0)}")
            
            # Inequalities
            inequalities = gemini_output.get("inequalities", [])
            print(f"\n⚠️  Inequalities detected: {len(inequalities)}")
            for i, ineq in enumerate(inequalities[:3]):  # Show first 3
                print(f"   {i+1}. [{ineq.get('type', 'N/A')}] {ineq.get('description', 'N/A')[:60]}...")
            
            # Suggestions
            suggestions = gemini_output.get("suggestions", [])
            print(f"\n💡 Action Suggestions: {len(suggestions)}")
            for i, sug in enumerate(suggestions[:5]):  # Show first 5
                print(f"   {i+1}. [{sug.get('priority', 'N/A')}] {sug.get('action', 'N/A')}: {sug.get('reason', 'N/A')[:50]}...")
            
            # Full transcript
            transcript = gemini_output.get("full_transcript", [])
            print(f"\n📝 Full Transcript: {len(transcript)} segments")
            if transcript:
                print(f"   First segment: {transcript[0].get('speaker', 'N/A')} at {transcript[0].get('start_ms', 0)}ms")
                print(f"   Last segment: {transcript[-1].get('speaker', 'N/A')} at {transcript[-1].get('end_ms', 0)}ms")
        
        # Save full output to file
        output_file = Path("full_workflow_output.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved full output to: {output_file}")
        
        # Test 3: Get meeting state
        print("\n" + "="*60)
        print("TEST 3: Get Meeting State")
        print("="*60)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{base_url}/meeting/{meeting_id}")
            
            if response.status_code == 200:
                state = response.json()
                print("✅ Retrieved meeting state")
                print(f"   Segments stored: {len(state.get('segments', []))}")
                print(f"   Gemini outputs: {len(state.get('gemini_outputs', []))}")
            else:
                print(f"⚠️  Could not retrieve meeting state: {response.status_code}")
        
    except httpx.TimeoutException:
        print("❌ Request timed out (processing took too long)")
        print("   This is normal for large audio files. Try a shorter file or increase timeout.")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60)
    print("✅ Testing complete!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(test_full_workflow())
