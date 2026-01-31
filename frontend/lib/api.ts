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
