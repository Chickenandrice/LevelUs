"use client";
import React, { useState } from "react";
import { useMeeting } from "../lib/meeting";
import { Button } from "./ui/button";

export default function UploadMeetingAudio({ meetingId: propMeetingId }: { meetingId?: string; }) {
  const { meeting, setMeeting } = useMeeting();
  const meetingId = propMeetingId ?? meeting?.id ?? "demo";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  }

  function handleUpload() {
    if (!selectedFile) return;

    setStatus("uploading");
    const fd = new FormData();
    fd.append("meeting_audio", selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/meetings/demo");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        setResult(json);
        setStatus("done");
      } catch (e) {
        setStatus("error");
      }
    };

    xhr.onerror = () => {
      setStatus("error");
    };

    xhr.send(fd);
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Upload Meeting Audio (Demo)</h3>

      <div className="mb-3">
        <input type="file" accept="audio/*" onChange={handleFileSelect} />
      </div>

      <div className="mb-3">
        <Button onClick={handleUpload} disabled={!selectedFile || status === "uploading"}>
          {status === "uploading" ? `Uploading ${progress}%` : "Upload"}
        </Button>
        <span className="ml-3 text-sm text-muted-foreground">{status ?? "idle"}</span>
      </div>

      <div className="h-2 bg-gray-200 rounded mb-3">
        <div style={{ width: `${progress}%` }} className="h-2 bg-blue-500 rounded"></div>
      </div>

      {result && (
        <div className="mt-2">
          <h4 className="font-medium">Result (raw)</h4>
          <pre className="text-xs bg-gray-900 text-white p-3 rounded overflow-auto" style={{ maxHeight: 300 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
