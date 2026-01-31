export type Participant = {
  id: string;
  name?: string;
  speakingTime: number; // ms
  transcripts: string[];
  introduced?: boolean;
};

export type MeetingMode = "intro" | "discussion";

export type Meeting = {
  id: string;
  title?: string;
  participants: Participant[];
  mode: MeetingMode;
};
