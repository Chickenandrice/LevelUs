"""
Simple test script to test the /transcribe-audio endpoint
Run this after starting the FastAPI server
"""
import requests
import json
from pathlib import Path

def test_transcribe_audio():
    """Test the transcribe-audio endpoint"""
    
    # Configuration
    base_url = "http://localhost:8000"
    audio_file = Path("eleven_labs/examples/aoc_court_hearing.mp3")
    meeting_id = "test-meeting-123"
    
    # Check if audio file exists
    if not audio_file.exists():
        print(f"❌ Audio file not found: {audio_file}")
        print("   Please provide a valid audio file path")
        return
    
    print(f"🧪 Testing /transcribe-audio endpoint")
    print(f"   Audio file: {audio_file}")
    print(f"   Meeting ID: {meeting_id}")
    print(f"   Server: {base_url}\n")
    
    # Test health endpoint first
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running\n")
        else:
            print(f"❌ Server returned status {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("   Start the server with: uvicorn src.main:app --reload")
        return
    
    # Test transcribe endpoint
    print("📤 Uploading audio file...")
    try:
        with open(audio_file, "rb") as f:
            files = {"file": (audio_file.name, f, "audio/mpeg")}
            data = {"meeting_id": meeting_id}
            
            print("⏳ Processing (this may take a while)...")
            response = requests.post(
                f"{base_url}/transcribe-audio",
                files=files,
                data=data,
                timeout=300  # 5 minute timeout
            )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!\n")
            
            # Print summary
            print("📊 Results:")
            print(f"   Segments: {result.get('segments_processed', 0)}")
            
            gemini = result.get("gemini_output", {})
            if gemini:
                print(f"\n🤖 Gemini Analysis:")
                print(f"   Summary: {gemini.get('summary', 'N/A')[:100]}...")
                print(f"   Decisions: {len(gemini.get('decisions', []))}")
                print(f"   Action Items: {len(gemini.get('action_items', []))}")
                
                stats = gemini.get("meeting_statistics", {})
                if stats:
                    print(f"\n📈 Statistics:")
                    print(f"   Duration: {stats.get('total_duration_seconds', 0):.1f}s")
                    print(f"   Speakers: {stats.get('total_speakers', 0)}")
                    print(f"   Words: {stats.get('total_words', 0)}")
                    print(f"   Interruptions: {stats.get('interruptions_count', 0)}")
                
                print(f"\n⚠️  Inequalities: {len(gemini.get('inequalities', []))}")
                print(f"💡 Suggestions: {len(gemini.get('suggestions', []))}")
            
            # Save output
            output_file = Path("test_output.json")
            with open(output_file, "w") as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Saved to: {output_file}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (processing took too long)")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_transcribe_audio()
