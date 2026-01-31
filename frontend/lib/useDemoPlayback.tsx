"use client";
import { useEffect, useMemo, useState } from "react";
import { demoMeeting } from "./mockData";

type DemoEntry = { participantId: string; text: string; };

export function useDemoPlayback(enabled: boolean) {
  const entries: DemoEntry[] = useMemo(() => {
    // flatten demoMeeting transcripts into a chronological list (simple order)
    return demoMeeting.participants.flatMap((p) => p.transcripts.map((t) => ({ participantId: p.id, text: t })));
  }, []);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(enabled);

  useEffect(() => {
    setPlaying(enabled);
    if (!enabled) setIndex(entries.length);
  }, [enabled, entries.length]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setIndex((i) => {
        if (i >= entries.length) {
          clearInterval(iv);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(iv);
  }, [playing, entries.length]);

  return {
    visibleEntries: entries.slice(0, index),
    playing,
    setPlaying,
    reset: () => setIndex(0),
    done: index >= entries.length,
  };
}
