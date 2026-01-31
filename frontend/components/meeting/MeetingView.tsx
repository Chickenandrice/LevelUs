"use client";
import { useState } from "react";
import { useMeeting } from "../../lib/meeting";
import ParticipantList from "./ParticipantList";
import { Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";

export default function MeetingView() {
  const { meeting, setMeeting } = useMeeting();

  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

  const handleAudioFileUpload = () => {
    if (!selectedAudioFile) return;

    const payloadJson = new Blob([JSON.stringify(meeting)], { type: "application/json" });

    const formData = new FormData();

    formData.append("meeting_audio", selectedAudioFile);
    formData.append("payload_json", payloadJson);

    fetch('/api/meetings/demo', {
      method: 'POST',
      body: formData,
    }).then(r => r.json()).then(async (request) => {
      const data = await request.json();
      setMeeting({
        ...meeting,
        ...data,
      });
      toast.success("Audio file processed successfully.");
    }).catch(() => {
      toast.error("Failed to upload audio file.");
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{meeting.title}</h1>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-8 bg-card p-6 rounded-xl shadow-sm">
          <section>
            <h3 className="font-medium mb-3">Transcript</h3>
            <div className="h-96 overflow-auto p-4 bg-muted rounded">
              {meeting.transcriptSegments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No transcript segments yet.</div>
              ) : (
                <div className="space-y-2">
                  {meeting.transcriptSegments.map((segment) => {
                    const participant = meeting.participants.find(p => p.id === segment.speakerId);
                    return (
                      <div key={segment.id} className="p-2 bg-background rounded">
                        <div className="text-sm font-medium">{participant ? participant.name : "Unknown Speaker"}</div>
                        <div className="mt-1 text-sm">{segment.content}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="picture">Upload Existing Audio</FieldLabel>
                <FieldDescription>Select an audio file to upload.</FieldDescription>
                <Input id="picture" type="file" onChange={(e) => setSelectedAudioFile(e.target.files ? e.target.files[0] : null)} accept='audio/*' />
                {selectedAudioFile && <Button onClick={handleAudioFileUpload}>
                  Upload
                </Button>}
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h4 className="font-medium">Participants</h4>
            </CardHeader>
            <CardContent>
              <ParticipantList participants={meeting.participants} selectedId={null} onSelect={() => {}} onRemove={() => {}} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h4 className="font-medium">Metrics</h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow icon={Clock} label="Total speaking" value={`${Math.round(meeting.participants.reduce((s, p) => s + p.totalSpeakingTime, 0) / 1000)}s`} />
                <MetricRow icon={Clock} label="Average speaking" value={`${Math.round(meeting.participants.reduce((s, p) => s + p.averageSpeakingTime, 0) / (meeting.participants.length === 0 ? 1 : meeting.participants.length) / 1000)}s`} />
                <MetricRow icon={Activity} label="Interruptions" value={`${meeting.interruptions.length}`} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string; }) {
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
