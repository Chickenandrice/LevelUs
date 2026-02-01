"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface AudioRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordingComplete: (file: File) => void;
}

export default function AudioRecorderDialog({
  open,
  onOpenChange,
  onRecordingComplete,
}: AudioRecorderDialogProps) {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setPermission(false);
    setRecordingStatus("idle");
    setAudioChunks([]);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (err) {
        toast.error("Microphone permission denied. Please allow microphone access to record audio.");
        onOpenChange(false);
      }
    } else {
      toast.error("MediaRecorder API is not supported in this browser.");
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      getMicrophonePermission();
    } else {
      cleanup();
    }
  }, [open]);

  const startRecording = () => {
    if (!stream) return;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    setAudioChunks([]);
    setDuration(0);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setRecordingStatus("recording");
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("recording");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioChunks([]);
    setDuration(0);
    setRecordingStatus("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    // Re-initialize isn't strictly needed as startRecording creates a new MediaRecorder,
    // but we need to ensure stream is still active.
  };

  const saveRecording = () => {
    if (audioChunks.length === 0) {
      toast.error("No audio recorded.");
      return;
    }
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const fileExtension = mimeType.includes("wav") ? "wav" : "webm";
    const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.${fileExtension}`, {
      type: mimeType,
    });

    onRecordingComplete(audioFile);
    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Record Audio</AlertDialogTitle>
          <AlertDialogDescription>
            Record a new meeting audio clip. Microphone access is required.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <div className="text-4xl font-mono font-medium tabular-nums text-foreground/80">
            {formatDuration(duration)}
          </div>

          <div className="flex items-center gap-4">
            {recordingStatus === "idle" && (
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full border-2 hover:bg-muted"
                onClick={startRecording}
                disabled={!permission}
              >
                <Mic className="h-8 w-8 text-red-500" />
              </Button>
            )}

            {(recordingStatus === "recording" || recordingStatus === "paused") && (
              <>
                {recordingStatus === "recording" ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-16 w-16 rounded-full border-2"
                    onClick={pauseRecording}
                  >
                    <Pause className="h-8 w-8" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-16 w-16 rounded-full border-2"
                    onClick={resumeRecording}
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-16 w-16 rounded-full"
                  onClick={stopRecording}
                >
                  <Square className="h-8 w-8 fill-current" />
                </Button>
              </>
            )}

            {recordingStatus === "stopped" && (
              <>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="rounded-full"
                  onClick={resetRecording}
                  title="Discard and restart"
                >
                  <Trash2 className="size-5 text-destructive" />
                </Button>
                <Button
                  variant="default"
                  className="rounded-full"
                  onClick={saveRecording}
                >
                  <Save className="size-5" />
                  Use Recording
                </Button>
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground h-4">
            {recordingStatus === "idle" && "Ready to record"}
            {recordingStatus === "recording" && "Recording..."}
            {recordingStatus === "paused" && "Paused"}
            {recordingStatus === "stopped" && "Recording finished"}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
