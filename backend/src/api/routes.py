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


@router.post("/meetings/demo")
async def transcribe_audio(
    meeting_audio: UploadFile = File(..., description="Audio file to transcribe"),
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
        audio_data = await meeting_audio.read()
        
        
        if not audio_data:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty audio file"}
            )
        print("HELLO3")
        
        # Transcribe using 11 Labs (diarization happens once at the end)
        segments = await transcribe_audio_file(
            audio_data=audio_data,
            meeting_id='demo',
            is_final=True  # Always final since diarization happens at end
        )
        
        print("HELLO1")
        if not segments:
            return JSONResponse(
                status_code=400,
                content={"error": "No segments extracted from audio"}
            )
        
        # Add all segments to meeting state
        state = get_meeting('demo')
        valid_segments = []
        print("HELLO2")
        
        for seg in segments:
            if seg.text.strip():
                state.append(seg)
                valid_segments.append(seg)
        
        if not valid_segments:
            return JSONResponse(
                status_code=400,
                content={"error": "No valid segments to process"}
            )
        print(valid_segments)
        
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
        import traceback
        
        try:
            print("Calling Gemini...")
            gemini_output = await call_gemini(segments_for_gemini)
            print("Gemini call completed")
            
            # Validate and fix the output before creating the model
            # Ensure all required fields are present
            if "suggestions" in gemini_output:
                for suggestion in gemini_output["suggestions"]:
                    if "suggested_message" not in suggestion:
                        suggestion["suggested_message"] = ""
            
            if "amplified_transcript" not in gemini_output:
                gemini_output["amplified_transcript"] = []
            
            # Add "speaker" field to full_transcript items for frontend compatibility
            if "full_transcript" in gemini_output and isinstance(gemini_output["full_transcript"], list):
                for entry in gemini_output["full_transcript"]:
                    if isinstance(entry, dict) and "speaker" not in entry:
                        entry["speaker"] = entry.get("speaker_id", "unknown")
            
            # Create timestamped output with validation
            timestamped_output = TimestampedGeminiOutput(
                timestamp_ms=int(time.time() * 1000),
                start_ms=start_ms,
                end_ms=end_ms,
                **gemini_output
            )
        except Exception as gemini_error:
            error_details = traceback.format_exc()
            print(f"Gemini processing error: {gemini_error}")
            print(f"Error details: {error_details}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"Gemini processing failed: {str(gemini_error)}",
                    "details": str(gemini_error),
                    "type": type(gemini_error).__name__
                }
            )
        
        # Store in meeting state
        state.gemini_outputs.append(timestamped_output)
        state.advance_cutoff()  # Mark all segments as processed
        
        return {
            "ok": True,
            "meeting_id": 'demo',
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
        print(e)
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
