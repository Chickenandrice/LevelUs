import httpx
import json
from typing import Any, Dict
from .config import settings

def build_prompt(diarized_text: str) -> str:
    return (
        "You are a meeting assistant. Return ONLY valid JSON.\n"
        "Do not include markdown, backticks, or extra commentary.\n\n"
        "Diarized transcript (recent):\n"
        f"{diarized_text}\n\n"
        "Task:\n"
        "Extract:\n"
        "1) summary: 1-3 sentences\n"
        "2) decisions: array of strings (empty if none)\n"
        "3) action_items: array of objects {owner: string|null, item: string, due: string|null}\n\n"
        "Return JSON with exactly these keys: summary, decisions, action_items."
    )

async def call_gemini(diarized_text: str) -> Dict[str, Any]:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )

    body = {
        "contents": [
            {"role": "user", "parts": [{"text": build_prompt(diarized_text)}]}
        ],
        "generationConfig": {"temperature": 0.2},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=body)
        r.raise_for_status()
        data = r.json()

    # Extract text from response
    text = ""
    try:
        parts = data["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts)
    except Exception:
        text = ""

    # Parse JSON (best effort)
    try:
        return json.loads(text)
    except Exception:
        # Fallback if model returns non-JSON
        return {"summary": text, "decisions": [], "action_items": []}
