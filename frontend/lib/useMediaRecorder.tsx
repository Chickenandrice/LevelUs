"use client";
import { useRef, useState } from "react";

type RecorderState = {
  recording: boolean;
  error?: string;
};

export function useMediaRecorder() {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecorderState>({ recording: false });

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
      setState({ recording: true });
    } catch (err: any) {
      setState({ recording: false, error: err?.message ?? String(err) });
    }
  }

  async function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mr = recorderRef.current;
      if (!mr) return resolve(null);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // stop tracks
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        recorderRef.current = null;
        setState({ recording: false });
        resolve(blob);
      };
      mr.stop();
    });
  }

  return { ...state, start, stop };
}
