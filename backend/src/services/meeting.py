import asyncio
import time
from collections import deque
from typing import Deque, Dict, Optional, List

from src.models.schemas import DiarizedSegment, TimestampedGeminiOutput
from src.services.gemini_client import call_gemini


class MeetingState:

    def __init__(self, meeting_id: str):
        self.meeting_id = meeting_id
        self.buffer: Deque[DiarizedSegment] = deque(maxlen=300)
        self.gemini_outputs: List[TimestampedGeminiOutput] = []

        self.pause_task: Optional[asyncio.Task] = None
        self.gemini_running = False
        self.last_cutoff = 0

    def append(self, seg: DiarizedSegment):
        self.buffer.append(seg)

    def clear(self):
        self.buffer.clear()
        self.gemini_outputs.clear()
        self.last_cutoff = 0

    def recent_text(self) -> str:
        parts = [
            f"[{s.speaker}] {s.text}"
            for s in self.buffer
            if s.end_ms > self.last_cutoff
        ]
        return "\n".join(parts)

    def advance_cutoff(self):
        if self.buffer:
            self.last_cutoff = max(s.end_ms for s in self.buffer)


MEETINGS: Dict[str, MeetingState] = {}


def get_meeting(meeting_id: str) -> MeetingState:
    if meeting_id not in MEETINGS:
        MEETINGS[meeting_id] = MeetingState(meeting_id)

    return MEETINGS[meeting_id]


async def schedule_pause_trigger(state: MeetingState, seconds: float):
    if state.pause_task:
        state.pause_task.cancel()

    async def run():
        await asyncio.sleep(seconds)
        await run_gemini(state)

    state.pause_task = asyncio.create_task(run())


async def run_gemini(state: MeetingState):
    if state.gemini_running:
        return

    # Get the segment range that will be processed
    segments_in_range = [
        s for s in state.buffer
        if s.end_ms > state.last_cutoff
    ]
    
    if not segments_in_range:
        return
    
    # Prepare segments with timestamps for Gemini
    segments_for_gemini = [
        {
            "speaker": s.speaker,
            "start_ms": s.start_ms,
            "end_ms": s.end_ms,
            "text": s.text
        }
        for s in segments_in_range
    ]
    
    start_ms = min(s.start_ms for s in segments_in_range)
    end_ms = max(s.end_ms for s in segments_in_range)

    state.gemini_running = True

    try:
        out = await call_gemini(segments_for_gemini)
        state.advance_cutoff()
        
        # Store the output with timestamp and segment range
        timestamped_output = TimestampedGeminiOutput(
            timestamp_ms=int(time.time() * 1000),
            start_ms=start_ms,
            end_ms=end_ms,
            **out
        )
        state.gemini_outputs.append(timestamped_output)

    finally:
        state.gemini_running = False
