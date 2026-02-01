import { MeetingStatistics, Inequality, FullTranscriptEntry, AmplifiedSegment, Suggestion } from './types';

// Re-export core types for API compatibility and future expansion
export type { Meeting, Participant, MeetingStatistics, AmplifiedSegment, Suggestion, Inequality, FullTranscriptEntry } from "./types";

export type CreateParticipantRequest = {
  id: string;
  name?: string;
};

export type TranscriptRequest = {
  participantId: string;
  text: string;
};

// API response types for /api/meetings/demo
export interface ApiSegment {
  meeting_id: string;
  speaker: string; // e.g. 'spk_0'
  start_ms: number;
  end_ms: number;
  text: string;
  is_final?: boolean;
  confidence?: number;
}

export interface GeminiOutput {
  summary: string;
  decisions: unknown[];
  action_items: unknown[];
  important_points: string[];
  meeting_statistics: MeetingStatistics;
  inequalities: Inequality[];
  full_transcript: FullTranscriptEntry[];
  amplified_transcript?: AmplifiedSegment[];
  suggestions?: Suggestion[];
  timestamp_ms?: number;
  start_ms?: number;
  end_ms?: number;
}

export interface ApiResponse {
  ok: boolean;
  meeting_id: string;
  segments_processed?: number;
  segments?: ApiSegment[];
  gemini_output?: GeminiOutput;
}
