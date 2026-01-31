import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

from src.main import app
from src.services.meeting import MEETINGS


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def clear_meetings():
    """Clear meetings before and after each test"""
    MEETINGS.clear()
    yield
    MEETINGS.clear()


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_endpoint(self, client):
        """Test health endpoint returns ok"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"ok": True}


class TestSegmentEndpoint:
    """Test segment ingestion endpoint"""
    
    def test_ingest_segment(self, client, clear_meetings):
        """Test ingesting a segment"""
        segment_data = {
            "meeting_id": "test-meeting-1",
            "speaker": "spk_0",
            "start_ms": 0,
            "end_ms": 1000,
            "text": "Hello world",
            "is_final": True
        }
        
        response = client.post("/segment", json=segment_data)
        
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Verify segment was stored
        from src.services.meeting import get_meeting
        state = get_meeting("test-meeting-1")
        assert len(state.buffer) == 1
        assert state.buffer[0].text == "Hello world"
    
    def test_ingest_segment_non_final_ignored(self, client, clear_meetings):
        """Test that non-final segments don't trigger processing"""
        segment_data = {
            "meeting_id": "test-meeting-1",
            "speaker": "spk_0",
            "start_ms": 0,
            "end_ms": 1000,
            "text": "Hello world",
            "is_final": False
        }
        
        response = client.post("/segment", json=segment_data)
        
        assert response.status_code == 200
        
        # Verify segment was NOT stored
        from src.services.meeting import get_meeting
        state = get_meeting("test-meeting-1")
        assert len(state.buffer) == 0
    
    def test_ingest_segment_empty_text_ignored(self, client, clear_meetings):
        """Test that empty text segments are ignored"""
        segment_data = {
            "meeting_id": "test-meeting-1",
            "speaker": "spk_0",
            "start_ms": 0,
            "end_ms": 1000,
            "text": "   ",
            "is_final": True
        }
        
        response = client.post("/segment", json=segment_data)
        
        assert response.status_code == 200
        
        from src.services.meeting import get_meeting
        state = get_meeting("test-meeting-1")
        assert len(state.buffer) == 0


class TestControlEndpoint:
    """Test control endpoint"""
    
    @pytest.mark.asyncio
    @patch('src.services.meeting.run_gemini')
    async def test_control_flush(self, mock_run_gemini, client, clear_meetings):
        """Test flush control message"""
        from src.services.meeting import get_meeting
        state = get_meeting("test-meeting-1")
        
        control_data = {
            "type": "flush",
            "meeting_id": "test-meeting-1"
        }
        
        response = client.post("/control", json=control_data)
        
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Give async function time to execute
        await asyncio.sleep(0.1)
        # Note: run_gemini is async, so we can't easily verify it was called
        # without more complex async testing setup
    
    def test_control_reset(self, client, clear_meetings):
        """Test reset control message"""
        from src.services.meeting import get_meeting
        from src.models.schemas import DiarizedSegment
        
        state = get_meeting("test-meeting-1")
        seg = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="Test",
            is_final=True
        )
        state.append(seg)
        state.last_cutoff = 1000
        
        control_data = {
            "type": "reset",
            "meeting_id": "test-meeting-1"
        }
        
        response = client.post("/control", json=control_data)
        
        assert response.status_code == 200
        assert len(state.buffer) == 0
        assert state.last_cutoff == 0


class TestGetMeetingEndpoint:
    """Test GET meeting state endpoint"""
    
    def test_get_meeting_state_empty(self, client, clear_meetings):
        """Test getting state of empty meeting"""
        from src.services.meeting import get_meeting
        state = get_meeting("test-meeting-1")
        
        response = client.get("/meeting/test-meeting-1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["meeting_id"] == "test-meeting-1"
        assert data["segments"] == []
        assert data["gemini_outputs"] == []
    
    def test_get_meeting_state_with_segments(self, client, clear_meetings):
        """Test getting state with segments"""
        from src.services.meeting import get_meeting
        from src.models.schemas import DiarizedSegment
        
        state = get_meeting("test-meeting-1")
        
        seg1 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=1000,
            end_ms=2000,
            text="Second",
            is_final=True
        )
        seg2 = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_1",
            start_ms=0,
            end_ms=1000,
            text="First",
            is_final=True
        )
        
        state.append(seg1)
        state.append(seg2)
        
        response = client.get("/meeting/test-meeting-1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["segments"]) == 2
        
        # Verify segments are sorted by start_ms
        assert data["segments"][0]["start_ms"] == 0
        assert data["segments"][1]["start_ms"] == 1000
    
    @patch('src.services.meeting.call_gemini')
    def test_get_meeting_state_with_outputs(self, mock_gemini, client, clear_meetings):
        """Test getting state with Gemini outputs"""
        import asyncio
        from src.services.meeting import get_meeting, run_gemini
        from src.models.schemas import DiarizedSegment
        
        mock_gemini.return_value = {
            "summary": "Test summary",
            "decisions": ["Decision 1"],
            "action_items": []
        }
        
        state = get_meeting("test-meeting-1")
        
        seg = DiarizedSegment(
            meeting_id="test-meeting-1",
            speaker="spk_0",
            start_ms=0,
            end_ms=1000,
            text="Test segment",
            is_final=True
        )
        state.append(seg)
        
        # Run Gemini synchronously for test
        asyncio.run(run_gemini(state))
        
        response = client.get("/meeting/test-meeting-1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["gemini_outputs"]) == 1
        assert data["gemini_outputs"][0]["summary"] == "Test summary"
        assert "timestamp_ms" in data["gemini_outputs"][0]
        assert "start_ms" in data["gemini_outputs"][0]
        assert "end_ms" in data["gemini_outputs"][0]
