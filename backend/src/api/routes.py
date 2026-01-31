import os
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from elevenlabs.client import ElevenLabs

from src.models.schemas import DiarizedSegment, ControlMessage, MeetingStateResponse
from eleven_labs.speech_to_transcript import convert_audio_to_transcription, save_transcription_to_json
from src.services.meeting import (
    get_meeting,
    schedule_pause_trigger,
    run_gemini,
)

router = APIRouter()


@router.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    """Accept an MP3 (or other audio) file, run ElevenLabs Batch Speech-to-Text with diarization, return JSON."""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY is not configured")

    try:
        # read the file from the uploaded file
        audio_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    #   check if the file is empty or not
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    #   convert the audio to transcription
    try:
        elevenlabs = ElevenLabs(api_key=api_key)
        transcription = convert_audio_to_transcription(audio_bytes, elevenlabs)
        result = save_transcription_to_json(transcription, output_dir=None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/meeting/{meeting_id}", response_model=MeetingStateResponse)
async def get_meeting_state(meeting_id: str):
    """Get the current state of a meeting including all segments and Gemini outputs chronologically."""
    state = get_meeting(meeting_id)
    
    # Convert deque to list and sort segments by start_ms
    segments = sorted(list(state.buffer), key=lambda s: s.start_ms)
    
    return MeetingStateResponse(
        meeting_id=meeting_id,
        segments=segments,
        gemini_outputs=state.gemini_outputs
    )


@router.post("/segment")
async def ingest_segment(seg: DiarizedSegment):
    state = get_meeting(seg.meeting_id)

    if seg.is_final and seg.text.strip():
        state.append(seg)
        await schedule_pause_trigger(state, 1.5)

    return {"ok": True}


@router.post("/control")
async def control(msg: ControlMessage):
    state = get_meeting(msg.meeting_id)

    if msg.type == "reset":
        state.clear()

    if msg.type == "flush":
        await run_gemini(state)

    return {"ok": True}


@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()

    meeting_id = str(uuid.uuid4())
    state = get_meeting(meeting_id)
    state.listeners.add(ws)

    await ws.send_json({
        "type": "meeting_started",
        "meeting_id": meeting_id
    })

    try:
        while True:
            data = await ws.receive_json()

            if data.get("type") in ("flush", "reset"):
                msg = ControlMessage(**data)
                await control(msg)
                continue

            data["meeting_id"] = data.get("meeting_id", meeting_id)
            seg = DiarizedSegment(**data)

            if seg.is_final and seg.text.strip():
                state.append(seg)
                await schedule_pause_trigger(state, 1.5)

    except WebSocketDisconnect:
        pass
    finally:
        state.listeners.discard(ws)
