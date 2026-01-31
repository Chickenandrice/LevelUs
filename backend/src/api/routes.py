import uuid
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

from src.models.schemas import DiarizedSegment, ControlMessage, MeetingStateResponse, TimestampedGeminiOutput
from src.services.meeting import (
    get_meeting,
    schedule_pause_trigger,
    run_gemini,
)
from src.services.elevenlabs_service import transcribe_audio_file

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


@router.post("/transcribe-audio")
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    meeting_id: str = Form(..., description="Meeting ID for this transcription")
):
    """
    Transcribe audio file using 11 Labs and automatically process through Gemini workflow.
    
    Since diarization happens once at the end of the audio recording:
    1. Transcribes entire audio using 11 Labs with speaker diarization
    2. Converts to DiarizedSegments
    3. Adds all segments to meeting state
    4. Processes all segments through Gemini immediately
    5. Returns Gemini output in the response
    
    Returns the segments and Gemini output.
    """
    try:
        # Read audio file
        audio_data = await file.read()
        
        if not audio_data:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty audio file"}
            )
        
        # Transcribe using 11 Labs (diarization happens once at the end)
        segments = await transcribe_audio_file(
            audio_data=audio_data,
            meeting_id=meeting_id,
            is_final=True  # Always final since diarization happens at end
        )
        
        if not segments:
            return JSONResponse(
                status_code=400,
                content={"error": "No segments extracted from audio"}
            )
        
        # Add all segments to meeting state
        state = get_meeting(meeting_id)
        valid_segments = []
        
        for seg in segments:
            if seg.text.strip():
                state.append(seg)
                valid_segments.append(seg)
        
        if not valid_segments:
            return JSONResponse(
                status_code=400,
                content={"error": "No valid segments to process"}
            )
        
        # Process all segments through Gemini immediately (no pause trigger needed)
        # Prepare segments with timestamps for Gemini
        segments_for_gemini = [
            {
                "speaker": s.speaker,
                "start_ms": s.start_ms,
                "end_ms": s.end_ms,
                "text": s.text
            }
            for s in valid_segments
        ]
        
        # Get segment time range
        start_ms = min(s.start_ms for s in valid_segments)
        end_ms = max(s.end_ms for s in valid_segments)
        
        # Call Gemini directly with segments
        from src.services.gemini_client import call_gemini
        import time
        
        gemini_output = await call_gemini(segments_for_gemini)
        
        # Create timestamped output
        timestamped_output = TimestampedGeminiOutput(
            timestamp_ms=int(time.time() * 1000),
            start_ms=start_ms,
            end_ms=end_ms,
            **gemini_output
        )
        
        # Store in meeting state
        state.gemini_outputs.append(timestamped_output)
        state.advance_cutoff()  # Mark all segments as processed
        
        return {
            "ok": True,
            "meeting_id": meeting_id,
            "segments_processed": len(valid_segments),
            "segments": [seg.model_dump() for seg in valid_segments],
            "gemini_output": timestamped_output.model_dump()
        }
        
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Transcription failed: {str(e)}"}
        )


@router.post("/control")
async def control(msg: ControlMessage):
    state = get_meeting(msg.meeting_id)

    if msg.type == "reset":
        state.clear()

    if msg.type == "flush":
        await run_gemini(state)

    return {"ok": True}


# WebSocket endpoint removed - not needed since entire recording is processed at once via API
