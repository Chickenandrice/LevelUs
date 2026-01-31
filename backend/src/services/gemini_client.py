import json
import asyncio
from typing import Any, Dict
from google import genai
from .config import settings

def build_prompt(segments_with_timestamps: list) -> str:
    """
    Build prompt for Gemini with full transcript including timestamps.
    
    segments_with_timestamps: List of dicts with {speaker, start_ms, end_ms, text}
    """
    # Build full transcript with timestamps
    transcript_lines = []
    for seg in segments_with_timestamps:
        start_sec = seg['start_ms'] / 1000.0
        end_sec = seg['end_ms'] / 1000.0
        transcript_lines.append(
            f"[{start_sec:.2f}s-{end_sec:.2f}s] {seg['speaker']}: {seg['text']}"
        )
    
    transcript_text = "\n".join(transcript_lines)
    
    # Build diarized text for analysis
    diarized_text = "\n".join([f"[{s['speaker']}] {s['text']}" for s in segments_with_timestamps])
    
    return f"""
    You are an AI meeting equity assistant and facilitator.

    Your purpose is to analyze meetings to identify and reduce unequal participation,
    especially when women or underrepresented speakers are interrupted, ignored,
    overlooked, or not credited for their ideas.

    You also act as a supportive facilitator by generating personalized,
    context-aware suggestions that encourage inclusive discussion.

    Return ONE valid JSON object only.

    CRITICAL RULES:
    - Output must be valid JSON
    - Do NOT include markdown, backticks, or explanations
    - Do NOT add or rename keys
    - Do NOT invent speakers, timestamps, or events
    - Use null when information is missing
    - All numbers must be numeric
    - Preserve original timestamps
    - If no data exists, return empty arrays

    --------------------------------------------------

    INPUT DATA:

    Full transcript:
    {transcript_text}

    Diarized transcript:
    {diarized_text}

    --------------------------------------------------

    SPEAKER IDENTIFICATION TASK:

    If speakers introduce themselves (e.g., "Hi, I'm Sarah", "This is John speaking"):

    - Extract their names
    - Build a mapping from speaker_id → real name
    - Replace placeholder speaker IDs with names in:
    - full_transcript
    - amplified_transcript
    - inequalities
    - suggestions
    - If no name is found, keep the original speaker_id

    Do NOT guess names.

    --------------------------------------------------

    ANALYSIS TASK:

    Analyze this meeting with special attention to:

    - Interruptions
    - Idea suppression
    - Idea appropriation
    - Unequal speaking time
    - Exclusion from decisions
    - Dismissal or lack of response
    - Dominant speakers
    - Silent or marginalized speakers
    - Missed opportunities for inclusion

    Identify moments where contributions were ignored,
    rephrased by others, or not credited.

    --------------------------------------------------

    FACILITATION TASK:

    For each suggested action, generate a realistic,
    polite, and context-aware facilitator message
    that could be spoken during the meeting.

    Messages should:
    - Reference relevant topics from the meeting
    - Use the speaker's real name when available
    - Encourage participation without sounding accusatory
    - Be supportive and professional

    Example:
    "Sarah, you raised an interesting point about scalability earlier.
    Would you like to expand on that?"

    --------------------------------------------------

    OUTPUT FORMAT:

    Return exactly this JSON schema:

    {{
    "summary": string,

    "decisions": string[],

    "action_items": [
        {{
        "owner": string|null,
        "item": string,
        "due": string|null
        }}
    ],

    "important_points": string[],

    "meeting_statistics": {{
        "total_duration_seconds": number,
        "total_speakers": number,

        "speaking_time_by_speaker": {{
        "speaker_name": number
        }},

        "total_words": number,

        "words_by_speaker": {{
        "speaker_name": number
        }},

        "interruptions_count": number,

        "average_turn_length_seconds": number
    }},

    "inequalities": [
        {{
        "type": "interruption"
                | "idea_ignored"
                | "idea_taken"
                | "domination"
                | "exclusion"
                | "dismissal",

        "description": string,

        "speaker_affected": string,

        "timestamp_ms": number,

        "context": string
        }}
    ],

    "full_transcript": [
        {{
        "speaker": string,
        "start_ms": number,
        "end_ms": number,
        "text": string
        }}
    ],

    "amplified_transcript": [
        {{
        "speaker": string,
        "start_ms": number,
        "end_ms": number,

        "original_text": string,

        "highlighted_text": string
        }}
    ],

    "suggestions": [
        {{
        "action":
            "invite_quiet_people"
        | "credit_original_idea_person"
        | "let_speaker_finish"
        | "clarify_decision"
        | "redirect_attention"
        | "encourage_input"
        | "rebalance_discussion"
        | "do_nothing",

        "reason": string,

        "priority": "low" | "medium" | "high",

        "target_speaker": string|null,

        "suggested_message": string
        }}
    ]
    }}

    IMPORTANT:

    - suggested_message must sound natural and relevant to the meeting
    - Use speaker names when available
    - Do NOT be generic
    - amplified_transcript should highlight overlooked contributions
    - Preserve original timestamps
    - If no inequalities exist, return []

    Return ONLY the JSON object.
    """


async def call_gemini(segments_with_timestamps: list) -> Dict[str, Any]:
    """
    Call Gemini API using the new Google GenAI SDK with segments that include timestamps.
    
    Based on official documentation: https://ai.google.dev/gemini-api/docs/text-generation
    
    Args:
        segments_with_timestamps: List of dicts with keys: speaker, start_ms, end_ms, text
    """
    # Initialize the client - API key can be passed or read from env
    client = genai.Client(api_key=settings.gemini_api_key)
    
    # Get model name and ensure it's valid
    requested_model = settings.gemini_model
    
    # Normalize model name - use models that actually exist
    if not requested_model.startswith("gemini-"):
        if "flash" in requested_model.lower():
            requested_model = "gemini-2.5-flash"
        elif "pro" in requested_model.lower():
            requested_model = "gemini-2.5-pro"
        else:
            requested_model = f"gemini-{requested_model}"
    
    # Build the prompt
    prompt = build_prompt(segments_with_timestamps)
    
    # List of models to try in order of preference
    # Use models that actually exist based on API listing
    models_to_try = [
        requested_model,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-3-flash-preview",
        "gemini-3-pro-preview",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro-latest",
    ]
    
    # Try each model until one works
    # Run SDK calls in executor since they're blocking
    def generate_content_sync():
        """Synchronous wrapper for SDK call"""
        last_error = None
        text = None
        available_models = []
        
        # First, try to list available models to help with debugging
        try:
            # Try to get available models (if SDK supports it)
            models_list = list(client.models.list())
            for model in models_list:
                model_name = model.name
                # Extract just the model name (remove 'models/' prefix if present)
                if '/' in model_name:
                    model_name = model_name.split('/')[-1]
                available_models.append(model_name)
        except Exception:
            # If listing fails, continue with our fallback list
            pass
        
        for model_name in models_to_try:
            try:
                # Use the new SDK exactly as shown in official docs
                # https://ai.google.dev/gemini-api/docs/text-generation
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={"temperature": 0.2}
                )
                # According to docs, response has .text attribute directly
                text = response.text
                if text and text.strip():
                    return text, None, available_models  # Success
            except Exception as e:
                last_error = e
                # Continue to next model
                continue
        
        return None, last_error, available_models
    
    # Run in executor to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    text, last_error, available_models = await loop.run_in_executor(None, generate_content_sync)
    
    # If all models failed, raise an informative error
    if not text:
        error_msg = str(last_error) if last_error else "Unknown error"
        available_msg = ""
        if available_models:
            available_msg = f"\nAvailable models for your API key: {', '.join(available_models[:10])}"
        else:
            available_msg = "\nCould not list available models. Check your API key permissions."
        
        raise Exception(
            f"Gemini API error: None of the tried models worked.\n"
            f"Tried models: {', '.join(models_to_try)}\n"
            f"Last error: {error_msg}{available_msg}\n"
            f"\nTroubleshooting:\n"
            f"1. Verify GEMINI_API_KEY is correct\n"
            f"2. Check API key has access to generateContent models\n"
            f"3. Try setting GEMINI_MODEL=gemini-1.5-flash in .env\n"
            f"4. See: https://ai.google.dev/gemini-api/docs/troubleshooting"
        )

    # Parse JSON (best effort)
    # Remove markdown code blocks if present
    text_clean = text.strip()
    if text_clean.startswith("```"):
        # Remove ```json or ``` markers
        lines = text_clean.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text_clean = "\n".join(lines)
    
    try:
        result = json.loads(text_clean)
        # Ensure all required fields are present with defaults
        defaults = {
            "summary": "",
            "decisions": [],
            "action_items": [],
            "important_points": [],  # Changed from "stats"
            "meeting_statistics": {
                "total_duration_seconds": 0.0,
                "total_speakers": 0,
                "speaking_time_by_speaker": {},
                "total_words": 0,
                "words_by_speaker": {},
                "interruptions_count": 0,
                "average_turn_length_seconds": 0.0
            },
            "inequalities": [],
            "full_transcript": [{"speaker": s["speaker"], "start_ms": s["start_ms"], "end_ms": s["end_ms"], "text": s["text"]} for s in segments_with_timestamps],
            "amplified_transcript": [],  # New field
            "suggestions": []
        }
        
        for key, default_value in defaults.items():
            if key not in result:
                result[key] = default_value
        
        return result
    except Exception:
        # Fallback if model returns non-JSON - return structure with provided transcript
        return {
            "summary": text[:200] if text else "",
            "decisions": [],
            "action_items": [],
            "important_points": [],  # Changed from "stats"
            "meeting_statistics": {
                "total_duration_seconds": 0.0,
                "total_speakers": 0,
                "speaking_time_by_speaker": {},
                "total_words": 0,
                "words_by_speaker": {},
                "interruptions_count": 0,
                "average_turn_length_seconds": 0.0
            },
            "inequalities": [],
            "full_transcript": [{"speaker": s["speaker"], "start_ms": s["start_ms"], "end_ms": s["end_ms"], "text": s["text"]} for s in segments_with_timestamps],
            "amplified_transcript": [],  # New field
            "suggestions": []
        }
