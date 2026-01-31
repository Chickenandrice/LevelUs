"""
Test script to list available Gemini models and test API connection
"""
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

def test_gemini_models():
    """List available models and test a simple call"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment variables")
        return
    
    print("API Key found")
    print(f"   Key starts with: {api_key[:10]}...\n")
    
    # Initialize client
    try:
        client = genai.Client(api_key=api_key)
        print("OK: Client initialized\n")
    except Exception as e:
        print(f"ERROR: Failed to initialize client: {e}")
        return
    
    # List available models
    print("="*60)
    print("Available Models:")
    print("="*60)
    
    try:
        models = list(client.models.list())
        if not models:
            print("WARNING: No models found. Check API key permissions.")
            return
        
        print(f"Found {len(models)} models:\n")
        
        available_for_generate = []
        for model in models:
            model_name = model.name
            # Extract just the model name
            if '/' in model_name:
                model_name = model_name.split('/')[-1]
            
            # Check if model supports generateContent
            supports_generate = False
            try:
                if hasattr(model, 'supported_generation_methods'):
                    if 'generateContent' in model.supported_generation_methods:
                        supports_generate = True
                        available_for_generate.append(model_name)
            except:
                pass
            
            status = "[OK]" if supports_generate else "[WARN]"
            print(f"{status} {model_name}")
        
        print(f"\nOK: Models that support generateContent: {len(available_for_generate)}")
        if available_for_generate:
            print(f"   {', '.join(available_for_generate[:10])}")
        
    except Exception as e:
        print(f"ERROR: Failed to list models: {e}")
        print("   This might indicate an API key issue")
        return
    
    # Test a simple generate_content call
    print("\n" + "="*60)
    print("Testing generate_content:")
    print("="*60)
    
    # Try models in order - use models that actually exist
    test_models = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-3-flash-preview",
        "gemini-3-pro-preview",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro-latest",
    ]
    
    for model_name in test_models:
        print(f"\nTesting {model_name}...")
        try:
            response = client.models.generate_content(
                model=model_name,
                contents="Say 'Hello' in JSON format: {\"message\": \"Hello\"}",
                config={"temperature": 0.2}
            )
            text = response.text
            print(f"OK: {model_name} works!")
            print(f"   Response: {text[:100]}...")
            break
        except Exception as e:
            error_str = str(e)
            if "404" in error_str or "not found" in error_str.lower():
                print(f"ERROR: {model_name} not found (404)")
            else:
                print(f"WARNING: {model_name} error: {error_str[:100]}")
    
    print("\n" + "="*60)
    print("OK: Test complete!")
    print("="*60)

if __name__ == "__main__":
    test_gemini_models()
