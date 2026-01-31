import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import time

from src.models.schemas import DiarizedSegment, TimestampedGeminiOutput
from src.services.meeting import MeetingState, get_meeting, schedule_pause_trigger, run_gemini, MEETINGS


@pytest.fixture
def clear_meetings():
    """Clear meetings before and after each test"""
    MEETINGS.clear()
    yield
    MEETINGS.clear()


@pytest.fixture
def sample_segment():
    """Create a sample diarized segment"""
    return DiarizedSegment(
        meeting_id="test-meeting-1",
        speaker="spk_0",
        start_ms=0,
        end_ms=1000,
        text="Hello, this is a test segment.",
        is_final=True
    )


class TestMeetingState:
    """Test MeetingState class functionality"""
    
    def test_meeting_state_initialization(self, clear_meetings):
        """Test that MeetingState initializes correctly"""
        state = MeetingState("test-meeting-1")
        
        assert state.meeting_id == "test-meeting-1"
        assert len(state.buffer) == 0
        assert len(state.gemini_outputs) == 0
        assert state.last_cutoff == 0
        assert state.gemini_running == False
        assert len(state.listeners) == 0
    
    def test_append_segment(self, clear_meetings, sample_segment):
        """Test appending segments to buffer"""
        state = MeetingState("test-meeting-1")
        state.append(sample_segment)
        
        assert len(state.buffer) == 1
        assert state.buffer[0].text == "Hello, this is a test segment."
    
    def test_recent_text(self, clear_meetings):
        """Test recent_text method filters by cutoff"""
        state = MeetingState("test-meeting-1")
        
        seg1 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="First segment",
            is_final=True
        )
        seg2 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_1",
            start_ms=1000,
            end_ms=2000,
            text="Second segment",
            is_final=True
        )
        
        state.append(seg1)
        state.append(seg2)
        
        # Before cutoff advance
        text = state.recent_text()
        assert "First segment" in text
        assert "Second segment" in text
        
        # After cutoff advance
        state.last_cutoff = 1500
        text = state.recent_text()
        assert "First segment" not in text
        assert "Second segment" in text
    
    def test_advance_cutoff(self, clear_meetings):
        """Test advance_cutoff updates last_cutoff"""
        state = MeetingState("test-meeting-1")
        
        seg1 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="First",
            is_final=True
        )
        seg2 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=1000,
            end_ms=2500,
            text="Second",
            is_final=True
        )
        
        state.append(seg1)
        state.append(seg2)
        
        assert state.last_cutoff == 0
        state.advance_cutoff()
        assert state.last_cutoff == 2500
    
    def test_clear(self, clear_meetings, sample_segment):
        """Test clear method resets state"""
        state = MeetingState("test-meeting-1")
        state.append(sample_segment)
        state.last_cutoff = 1000
        
        state.clear()
        
        assert len(state.buffer) == 0
        assert len(state.gemini_outputs) == 0
        assert state.last_cutoff == 0


class TestMeetingService:
    """Test meeting service functions"""
    
    def test_get_meeting_creates_new(self, clear_meetings):
        """Test get_meeting creates new meeting if doesn't exist"""
        assert "new-meeting" not in MEETINGS
        
        state = get_meeting("new-meeting")
        
        assert "new-meeting" in MEETINGS
        assert state.meeting_id == "new-meeting"
    
    def test_get_meeting_returns_existing(self, clear_meetings):
        """Test get_meeting returns existing meeting"""
        state1 = get_meeting("existing-meeting")
        state2 = get_meeting("existing-meeting")
        
        assert state1 is state2
    
    @pytest.mark.asyncio
    async def test_schedule_pause_trigger(self, clear_meetings):
        """Test pause trigger scheduling"""
        state = get_meeting("test-meeting")
        
        await schedule_pause_trigger(state, 0.1)
        
        assert state.pause_task is not None
        assert not state.pause_task.done()
        
        # Wait for task to complete
        await asyncio.sleep(0.15)
        
        # Task should be done (but we can't verify run_gemini was called without mocking)
        # Just verify task exists and can be cancelled
        if state.pause_task and not state.pause_task.done():
            state.pause_task.cancel()
    
    @pytest.mark.asyncio
    async def test_schedule_pause_trigger_cancels_previous(self, clear_meetings):
        """Test that scheduling a new pause trigger cancels the previous one"""
        state = get_meeting("test-meeting")
        
        await schedule_pause_trigger(state, 1.0)
        task1 = state.pause_task
        
        await schedule_pause_trigger(state, 0.1)
        task2 = state.pause_task
        
        assert task1 is not task2
        # Give cancellation time to propagate
        await asyncio.sleep(0.01)
        # Task should be cancelled or in the process of being cancelled
        assert task1.cancelled() or task1.done()
    
    @pytest.mark.asyncio
    @patch('src.services.meeting.call_gemini')
    async def test_run_gemini_processes_segments(self, mock_gemini, clear_meetings):
        """Test run_gemini processes segments and stores output"""
        mock_gemini.return_value = {
            "summary": "Test summary",
            "decisions": ["Decision 1"],
            "action_items": [{"owner": "Alice", "item": "Task 1", "due": None}]
        }
        
        state = get_meeting("test-meeting")
        
        seg1 = DiarizedSegment(
            meeting_id="test-meeting",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="First segment",
            is_final=True
        )
        seg2 = DiarizedSegment(
            meeting_id="test-meeting",
            speaker="spk_1",
            start_ms=1000,
            end_ms=2000,
            text="Second segment",
            is_final=True
        )
        
        state.append(seg1)
        state.append(seg2)
        
        await run_gemini(state)
        
        # Verify Gemini was called
        assert mock_gemini.called
        call_args = mock_gemini.call_args[0][0]
        assert "First segment" in call_args
        assert "Second segment" in call_args
        
        # Verify output was stored
        assert len(state.gemini_outputs) == 1
        output = state.gemini_outputs[0]
        assert output.summary == "Test summary"
        assert output.decisions == ["Decision 1"]
        assert output.start_ms == 0
        assert output.end_ms == 2000
        assert output.timestamp_ms > 0
        
        # Verify cutoff was advanced
        assert state.last_cutoff == 2000
    
    @pytest.mark.asyncio
    @patch('src.services.meeting.call_gemini')
    async def test_run_gemini_skips_if_running(self, mock_gemini, clear_meetings):
        """Test run_gemini doesn't run if already running"""
        mock_gemini.return_value = {"summary": "Test", "decisions": [], "action_items": []}
        
        state = get_meeting("test-meeting")
        state.gemini_running = True
        
        await run_gemini(state)
        
        # Should not call Gemini
        assert not mock_gemini.called
    
    @pytest.mark.asyncio
    @patch('src.services.meeting.call_gemini')
    async def test_run_gemini_handles_empty_text(self, mock_gemini, clear_meetings):
        """Test run_gemini skips if no text to process"""
        state = get_meeting("test-meeting")
        
        await run_gemini(state)
        
        assert not mock_gemini.called
    
    @pytest.mark.asyncio
    @patch('src.services.meeting.call_gemini')
    async def test_run_gemini_only_processes_new_segments(self, mock_gemini, clear_meetings):
        """Test run_gemini only processes segments after last_cutoff"""
        mock_gemini.return_value = {"summary": "Test", "decisions": [], "action_items": []}
        
        state = get_meeting("test-meeting")
        
        seg1 = DiarizedSegment(
            meeting_id="test-meeting",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="Old segment",
            is_final=True
        )
        seg2 = DiarizedSegment(
            meeting_id="test-meeting",
            speaker="spk_0",
            start_ms=1000,
            end_ms=2000,
            text="New segment",
            is_final=True
        )
        
        state.append(seg1)
        state.append(seg2)
        state.last_cutoff = 1000  # Already processed first segment
        
        await run_gemini(state)
        
        # Should only include new segment
        call_args = mock_gemini.call_args[0][0]
        assert "Old segment" not in call_args
        assert "New segment" in call_args
        
        assert len(state.gemini_outputs) == 1
        assert state.gemini_outputs[0].start_ms == 1000
        assert state.gemini_outputs[0].end_ms == 2000
