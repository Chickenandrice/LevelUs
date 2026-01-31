"use client";
import React, { createContext, useContext, useState } from "react";
import { Meeting, Participant, MeetingMode } from "./types";

type MeetingContextValue = {
  meeting: Meeting;
  addParticipant: (p: Omit<Participant, "speakingTime" | "transcripts">) => void;
  setIntroduced: (id: string, name?: string) => void;
  updateName: (id: string, name: string) => void;
  removeParticipant: (id: string) => void;
  addTranscript: (id: string, text: string) => void;
  setMode: (m: MeetingMode) => void;
  reset: () => void;
};

const defaultMeeting: Meeting = {
  id: "demo-1",
  title: "Demo Meeting",
  participants: [],
  mode: "intro",
};

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeeting must be used within MeetingProvider");
  return ctx;
}

export function MeetingProvider({ children, initial }: { children: React.ReactNode; initial?: Meeting; }) {
  const [meeting, setMeeting] = useState<Meeting>(initial ?? defaultMeeting);

  function addParticipant(p: Omit<Participant, "speakingTime" | "transcripts">) {
    setMeeting((m) => ({
      ...m,
      participants: [
        ...m.participants,
        { id: p.id, name: p.name, introduced: p.introduced ?? false, speakingTime: 0, transcripts: [] },
      ],
    }));
  }

  function setIntroduced(id: string, name?: string) {
    setMeeting((m) => ({
      ...m,
      participants: m.participants.map((p) => (p.id === id ? { ...p, name: name ?? p.name, introduced: true } : p)),
    }));
  }

  function updateName(id: string, name: string) {
    setMeeting((m) => ({
      ...m,
      participants: m.participants.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  function removeParticipant(id: string) {
    setMeeting((m) => ({ ...m, participants: m.participants.filter((p) => p.id !== id) }));
  }

  function addTranscript(id: string, text: string) {
    setMeeting((m) => ({
      ...m,
      participants: m.participants.map((p) => (p.id === id ? { ...p, transcripts: [...p.transcripts, text] } : p)),
    }));
  }

  function setMode(mode: MeetingMode) {
    setMeeting((m) => ({ ...m, mode }));
  }

  function reset() {
    setMeeting(initial ?? defaultMeeting);
  }

  const value: MeetingContextValue = { meeting, addParticipant, setIntroduced, updateName, removeParticipant, addTranscript, setMode, reset };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}
