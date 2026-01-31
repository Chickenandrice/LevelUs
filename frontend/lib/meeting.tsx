"use client";
import React, { createContext, useContext, useState } from "react";
import { Meeting } from "./types";

type MeetingContextValue = {
  meeting: Meeting;
  setMeeting: (payload: Meeting) => void;
};

const defaultMeeting: Meeting = {
  title: "Demo Meeting",
  participants: [],
  interruptions: [],
  transcriptSegments: [],
};

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeeting must be used within MeetingProvider");
  return ctx;
}

export function MeetingProvider({ children, initial }: { children: React.ReactNode; initial?: Meeting; }) {
  const [meeting, setMeeting] = useState<Meeting>(initial ?? defaultMeeting);

  const value: MeetingContextValue = { meeting, setMeeting };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}
