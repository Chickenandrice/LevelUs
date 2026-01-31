// Re-export core types for API compatibility and future expansion
export type { Meeting, Participant } from "./types";

export type CreateParticipantRequest = {
  id: string;
  name?: string;
};

export type TranscriptRequest = {
  participantId: string;
  text: string;
};
