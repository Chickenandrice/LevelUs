"""
Quick test to verify Gemini API connection
"""
import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test_gemini_api():
    """Test Gemini API with different model names"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return
    
    print("🧪 Testing Gemini API Connection\n")
    
    models_to_try = [
        "gemini-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]
    
    async with httpx.AsyncClient(timeout=30) as client:
        for model in models_to_try:
            print(f"Testing model: {model}")
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            body = {
                "contents": [{
                    "role": "user",
                    "parts": [{"text": "Say 'Hello' in JSON format: {\"message\": \"Hello\"}"}]
                }],
                "generationConfig": {"temperature": 0.2},
            }
            
            try:
                r = await client.post(url, json=body)
                
                if r.status_code == 200:
                    print(f"  ✅ {model} works!")
                    data = r.json()
                    try:
                        text = data["candidates"][0]["content"]["parts"][0].get("text", "")
                        print(f"     Response: {text[:50]}...")
                    except:
                        print(f"     Response received (check structure)")
                    break
                elif r.status_code == 404:
                    print(f"  ❌ {model} not found (404)")
                else:
                    print(f"  ⚠️  {model} returned {r.status_code}: {r.text[:100]}")
                    
            except Exception as e:
                print(f"  ❌ {model} error: {str(e)[:100]}")
            
            print()
    
    print("💡 Recommendation: Use the model that returned 200 status")

if __name__ == "__main__":
    asyncio.run(test_gemini_api())
