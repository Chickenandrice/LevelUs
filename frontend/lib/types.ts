export type Participant = {
  id: string; // e.g. 'spk_0'
  name?: string;
  totalSpeakingTime: number; // ms
  averageSpeakingTime: number; // ms
  interruptionsCaused?: number;
  interruptionsReceived?: number;
};

export type Interruption = {
  from: string; // speaker id
  to: string; // speaker id
  duration: number; // ms
  timestamp: number; // ms since epoch
  content?: string | null;
  recovered?: boolean;
};

export type TranscriptSegment = {
  id: string;
  speakerName?: string;
  speakerId: string;
  content: string;
  startMs: number;
  endMs: number;
  interrupted?: boolean;
};

export interface MeetingStatistics {
  total_duration_seconds?: number;
  total_speakers?: number;
  total_words?: number;
  interruptions_count?: number;
  average_turn_length_seconds?: number;
  speaking_time_by_speaker?: Record<string, number>;
  words_by_speaker?: Record<string, number>;
}

export interface AmplifiedSegment {
  speaker: string;
  start_ms: number;
  end_ms: number;
  original_text: string;
  highlighted_text?: string;
}

export interface Suggestion {
  action: string;
  reason?: string;
  priority?: string;
  target_speaker?: string | null;
  suggested_message?: string;
}

export interface Inequality {
  type: string; // e.g. 'interruption' | 'domination' | 'dismissal'
  description?: string;
  speaker_affected?: string;
  timestamp_ms?: number;
  context?: string;
}

export interface FullTranscriptEntry {
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export type Meeting = {
  id?: string;
  title?: string;
  participants: Participant[];
  interruptions: Interruption[];
  transcriptSegments: TranscriptSegment[];
  summary?: string;
  importantPoints?: string[];
  suggestions?: Suggestion[];
  inequalities?: Inequality[];
  amplifiedTranscript?: AmplifiedSegment[];
  fullTranscript?: FullTranscriptEntry[];
  // optional stats
  statistics?: MeetingStatistics;
  expectations?: {
    min_speaker_time_ms?: number | null;
    max_speaker_time_ms?: number | null;
  } | null;
};
