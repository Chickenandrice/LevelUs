export type Participant = {
  id: number;
  name: string;
  totalSpeakingTime: number;
  averageSpeakingTime: number;
  interruptionsCaused: number;
  interruptionsReceived: number;
};

export type Interruption = {
  from: number;
  to: number;
  duration: number;
  timestamp: number;
  content: string | null; // null if inaudble?
  recovered: boolean; // whether the interrupted speaker was the next to speak after this interruption
};

export type Meeting = {
  title: string;
  participants: Participant[];
  interruptions: Interruption[];
  transcriptSegments: TranscriptSegment[];
};

export type TranscriptSegment = {
  id: number;
  speakerName: string;
  speakerId: number;
  content: string;
  startMs: number;
  endMs: number;
  interrupted?: boolean;
};
