import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.models.schemas import DiarizedSegment, ControlMessage, MeetingStateResponse
from src.services.meeting import (
    get_meeting,
    schedule_pause_trigger,
    run_gemini,
)

router = APIRouter()


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
