"use client";
import { useCallback } from "react";
import { useMeeting } from "./meeting";
import * as API from "./api";

// Lightweight service hook that routes actions either to local Meeting context
// (demo) or to the real API endpoints (live). Use `live` flag to switch.
export function useMeetingService(opts?: { meetingId?: string; live?: boolean; }) {
  const { meeting, addParticipant, addTranscript, setMode, updateName, setIntroduced, removeParticipant } = useMeeting();
  const meetingId = opts?.meetingId ?? meeting.id;
  const live = !!opts?.live;
  const DISABLE_API = process.env.NEXT_PUBLIC_DISABLE_API === "1";

  const fetchServerMeeting = useCallback(async () => {
    if (!live) return null;
    return await API.fetchMeeting(meetingId);
  }, [live, meetingId]);

  const createParticipant = useCallback(
    async (p: { id: string; name?: string; }) => {
      // always update local UI immediately
      addParticipant({ id: p.id, name: p.name, introduced: !!p.name });
      if (!live || DISABLE_API) return { ok: true };
      return await API.createParticipant(meetingId, p);
    },
    [addParticipant, live, meetingId]
  );

  const pushTranscript = useCallback(
    async (participantId: string, text: string) => {
      // update local UI
      addTranscript(participantId, text);
      if (!live || DISABLE_API) return { ok: true };
      return await API.sendTranscript(meetingId, participantId, text);
    },
    [addTranscript, live, meetingId]
  );

  const setModeAndSync = useCallback(
    (m: "intro" | "discussion") => {
      setMode(m);
      // future: notify server of mode change
    },
    [setMode]
  );

  const removeParticipantLocal = useCallback(
    async (id: string) => {
      // update local UI
      removeParticipant(id);
      if (!live || DISABLE_API) return { ok: true };
      // future: call API to remove participant
      return { ok: true };
    },
    [live, removeParticipant]
  );

  return {
    meetingId,
    live,
    fetchServerMeeting,
    createParticipant,
    pushTranscript,
    setMode: setModeAndSync,
    updateName,
    setIntroduced,
    removeParticipant: removeParticipantLocal,
  };
}
