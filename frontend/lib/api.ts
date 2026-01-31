// Lightweight API helper functions. These default to calling real endpoints
// but gracefully fall back to mock behavior for local/demo use.

import { Meeting, Participant } from "./types";

export async function fetchMeeting(meetingId: string): Promise<Meeting | null> {
  try {
    const res = await fetch(`/api/meetings/${meetingId}`);
    if (!res.ok) return null;
    return (await res.json()) as Meeting;
  } catch (err) {
    // fallback: no server available (demo mode)
    console.warn("fetchMeeting fallback (demo)", err);
    return null;
  }
}

export async function createParticipant(meetingId: string, p: { id: string; name?: string; }) {
  try {
    const res = await fetch(`/api/meetings/${meetingId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) throw new Error("failed");
    return await res.json();
  } catch (err) {
    console.warn("createParticipant fallback (demo)", err);
    return { ok: true };
  }
}

export async function sendTranscript(meetingId: string, participantId: string, text: string) {
  try {
    const res = await fetch(`/api/meetings/${meetingId}/transcripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, text }),
    });
    if (!res.ok) throw new Error("failed");
    return await res.json();
  } catch (err) {
    console.warn("sendTranscript fallback (demo)", err);
    return { ok: true };
  }
}

/** Backend base URL for FastAPI (default: http://localhost:8000) */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export type TranscribeResult = {
  text?: string;
  words?: Array<{ text: string; start: number; end: number; speaker_id?: string }>;
  language_code?: string;
  [key: string]: unknown;
};

/**
 * Send an MP3 (or other audio) file to the backend /transcribe endpoint.
 * Returns the diarized transcription from ElevenLabs Batch Speech-to-Text.
 */
export async function transcribeAudio(file: Blob | File): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append("file", file, file instanceof File ? file.name : "audio.mp3");

  const res = await fetch(`${BACKEND_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Transcription failed");
  }

  return res.json() as Promise<TranscribeResult>;
}
