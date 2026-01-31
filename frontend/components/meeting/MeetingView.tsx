"use client";
import React, { useState } from "react";
import { useMeeting } from "../../lib/meeting";
import ParticipantList from "./ParticipantList";
import Controls from "./Controls";
import { useMediaRecorder } from "../../lib/useMediaRecorder";
import { asrStub } from "../../lib/asr";
import { Mic, UserPlus, Clock, Activity, Zap, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModeToggle from "@/components/ModeToggle";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import Text from "@/components/ui/typography";
import * as API from "@/lib/api";
import { useMeetingService } from "@/lib/useMeetingService";
import { useSearchParams } from "next/navigation";
import { useDemoPlayback } from "@/lib/useDemoPlayback";

export default function MeetingView() {
  const { meeting, addParticipant, setIntroduced, addTranscript, setMode, updateName } = useMeeting();
  const [selected, setSelected] = useState<string | null>(null);
  const { recording, start, stop } = useMediaRecorder();
  const [asrProcessing, setAsrProcessing] = useState(false);

  const search = useSearchParams();
  const live = search?.get("live") === "1" || search?.get("live") === "true";
  const meetingService = useMeetingService({ meetingId: meeting.id, live });
  const demo = meeting.id === "demo" && !live;
  const { visibleEntries, playing, setPlaying } = useDemoPlayback(demo);

  function handleAddMock() {
    const id = String(Date.now());
    meetingService.createParticipant({ id });
    setSelected(id);
  }

  async function handleRecordSnippet() {
    if (!selected) return;
    if (!recording) {
      await start();
      return;
    }
    const blob = await stop();
    if (!blob) return;
    setAsrProcessing(true);
    try {
      const text = await asrStub(blob, true);
      await meetingService.pushTranscript(selected, text);
    } catch (err) {
      await meetingService.pushTranscript(selected, "[ASR error: could not transcribe]");
    } finally {
      setAsrProcessing(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{meeting.title}</h1>
          <div className="text-sm text-muted-foreground">Mode: {meeting.mode}</div>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle mode={meeting.mode} setMode={setMode} />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-8 bg-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-muted-foreground">Current Speaker</div>
              <div className="text-2xl font-medium">{selected ? meeting.participants.find((p) => p.id === selected)?.name ?? "(unnamed)" : "(no speaker)"}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleRecordSnippet} disabled={asrProcessing} variant="default">
                <Mic className="h-4 w-4" /> {recording ? "Stop" : "Record"}
              </Button>
              <div className="text-sm text-muted-foreground">{asrProcessing ? "Processing..." : "Ready"}</div>
            </div>
          </div>

          <section>
            <h3 className="font-medium mb-3">Live Transcript</h3>
            <div className="h-96 overflow-auto p-4 bg-muted rounded">
              {demo ? (
                visibleEntries.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Demo playback — press Play to start the demo.</div>
                ) : (
                  visibleEntries.map((e, i) => (
                    <div key={e.participantId + String(i)} className="mb-3">
                      <div className="text-xs text-muted-foreground">{meeting.participants.find((pp) => pp.id === e.participantId)?.name ?? "(unnamed)"}</div>
                      <div className="text-sm">{e.text}</div>
                    </div>
                  ))
                )
              ) : (
                meeting.participants.flatMap((p) => p.transcripts.map((t, i) => (
                  <div key={p.id + String(i)} className="mb-3">
                    <div className="text-xs text-muted-foreground">{meeting.participants.find((pp) => pp.id === p.id)?.name ?? "(unnamed)"}</div>
                    <div className="text-sm">{t}</div>
                  </div>
                )))
              )}
            </div>
          </section>
        </main>

        <aside className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <h4 className="font-medium">Participants</h4>
            </CardHeader>
            <CardContent>
              <ParticipantList participants={meeting.participants} selectedId={selected} onSelect={(id) => setSelected(id)} onRemove={(id) => { meetingService.removeParticipant(id); if (selected === id) setSelected(null); }} />
              {selected && (
                <div className="mt-4">
                  <SelectedDetail
                    participant={meeting.participants.find((p) => p.id === selected)!}
                    onRename={(name) => meetingService.updateName(selected, name)}
                    onConfirm={(name) => meetingService.setIntroduced(selected, name)}
                    onRemove={() => {
                      meetingService.removeParticipant(selected);
                      setSelected(null);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h4 className="font-medium">Metrics</h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow icon={Clock} label="Total speaking" value={`${Math.round(meeting.participants.reduce((s, p) => s + p.speakingTime, 0) / 1000)}s`} />
                <MetricRow icon={Activity} label="Interruptions" value="2" />
                <MetricRow icon={Zap} label="Encouragements" value="5" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: any; label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded"><Icon className="size-4" /></div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SelectedDetail({
  participant,
  onRename,
  onConfirm,
  onRemove,
}: {
  participant: any;
  onRename: (name: string) => void;
  onConfirm: (name?: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(participant?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setName(participant?.name ?? "");
    setError(null);
  }, [participant?.id]);


  if (!participant) return null;

  return (
    <div>
      <div className="text-sm font-medium">{participant.name ?? "(unnamed)"}</div>
      <div className="mt-3">
        <label className="text-xs text-muted-foreground">Edit name</label>
        <input className="w-full border rounded px-2 py-1 mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        {error && <div className="text-xs text-destructive mt-1">{error}</div>}
        <div className="mt-2 flex gap-2">
          <Button onClick={() => {
            if (!name.trim()) { setError("Name cannot be empty"); return; }
            setError(null);
            onRename(name.trim());
          }}>
            Rename
          </Button>
          <Button variant="outline" onClick={() => onConfirm(name.trim())}>
            Confirm Introduced
          </Button>
          <Button variant="destructive" onClick={() => onRemove()}>
            <Trash className="h-4 w-4" />
            <span className="ml-2">Remove</span>
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium">Transcripts</h4>
        <div className="mt-2 space-y-2 max-h-40 overflow-auto">
          {participant.transcripts.length === 0 && <div className="text-xs text-muted-foreground">No transcripts</div>}
          {participant.transcripts.map((t: string, i: number) => (
            <div key={i} className="p-2 bg-muted rounded text-sm">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
