"use client";
import { ChangeEvent, useRef, useState } from "react";
import { useMeeting } from "../../lib/meeting";
import { ApiResponse } from "../../lib/api-types";
import ParticipantList from "./ParticipantList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Activity, Mic, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Spinner } from '../ui/spinner';
import AudioRecorderDialog from "./AudioRecorderDialog";

export default function MeetingView() {
  const { meeting, setMeeting } = useMeeting();

  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioSource, setAudioSource] = useState<"uploaded" | "recorded" | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyFileToInput = (file: File | null) => {
    const input = fileInputRef.current;
    if (!input) return;

    if (!file) {
      input.value = "";
      return;
    }

    if (typeof DataTransfer !== "undefined") {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
    }
  };

  const handleFileSelection = (file: File | null, source: "uploaded" | "recorded" | null) => {
    setSelectedAudioFile(file);
    setAudioSource(source);
    applyFileToInput(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelection(file, file ? "uploaded" : null);
  };

  const handleRecordingComplete = (file: File) => {
    handleFileSelection(file, "recorded");
    toast.success("Recording ready. You can upload it now.");
  };

  const clearSelectedFile = () => {
    handleFileSelection(null, null);
  };

  const handleAudioFileUpload = async () => {
    if (!selectedAudioFile) return;

    const formData = new FormData();
    formData.append("meeting_audio", selectedAudioFile);
    setIsUploading(true);
    try {
      const resp = await fetch('/api/meetings/demo', {
        method: 'POST',
        body: formData,
      });

      // Log content-type and status for debugging
      try { console.log('Response content-type:', resp.headers.get('content-type')); } catch (e) {}

      const text = await resp.text();

      if (!resp.ok) {
        console.error('Upload failed', resp.status, text);
        toast.error(`Upload failed: ${resp.status} - see console for details`);
        return;
      }

      let data: ApiResponse | null = null;
      try {
        data = JSON.parse(text) as ApiResponse;
      } catch (err) {
        console.error('Failed to parse JSON from server response:', err, text);
        toast.error('Server returned non-JSON response; check backend logs');
        return;
      }

      // map API response into frontend Meeting shape
      const gem = data.gemini_output;
      const participants = [] as any[];
      if (gem?.meeting_statistics?.speaking_time_by_speaker) {
        for (const [id, seconds] of Object.entries(gem.meeting_statistics.speaking_time_by_speaker)) {
          participants.push({ id, name: id, totalSpeakingTime: Math.round((seconds as number) * 1000), averageSpeakingTime: Math.round((gem.meeting_statistics.average_turn_length_seconds ?? 0) * 1000) });
        }
      }

      const segments = [] as any[];
      const src = gem?.full_transcript ?? data.segments ?? [];
      src.forEach((s: any, i: number) => {
        // Handle new schema: speaker_id/speaker_name or old schema: speaker
        const speakerId = s.speaker_id || s.speaker;
        const speakerName = (s.speaker_name?.startsWith('spk_') || !s.speaker_name) ? ('Unknown Speaker #' + (i + 1)) : s.speaker_name;
        segments.push({ id: `${speakerId}-${s.start_ms}-${i}`, speakerId: speakerId, speakerName: speakerName, content: s.text, startMs: s.start_ms, endMs: s.end_ms });
      });

      // Normalize inequalities - convert speaker_affected objects to strings
      const normalizedInequalities = (gem?.inequalities || []).map((iq: any) => ({
        ...iq,
        speaker_affected: typeof iq.speaker_affected === 'object' && iq.speaker_affected !== null
          ? (iq.speaker_affected.speaker_id || iq.speaker_affected.speaker_name || 'unknown')
          : (iq.speaker_affected || 'unknown')
      }));

      // Normalize suggestions - convert target_speaker objects to strings
      const normalizedSuggestions = (gem?.suggestions || []).map((s: any) => ({
        ...s,
        target_speaker: typeof s.target_speaker === 'object' && s.target_speaker !== null
          ? (s.target_speaker.speaker_id || s.target_speaker.speaker_name || null)
          : (s.target_speaker || null)
      }));

      // Normalize action_items - convert owner objects to strings
      const normalizedActionItems = (gem?.action_items || []).map((item: any) => ({
        ...item,
        owner: typeof item.owner === 'object' && item.owner !== null
          ? (item.owner.speaker_id || item.owner.speaker_name || null)
          : (item.owner || null)
      }));

      const mapped = {
        id: data.meeting_id ?? 'demo',
        title: 'Demo Meeting',
        participants,
        interruptions: [],
        transcriptSegments: segments,
        summary: gem?.summary,
        importantPoints: gem?.important_points,
        suggestions: normalizedSuggestions,
        inequalities: normalizedInequalities,
        amplifiedTranscript: gem?.amplified_transcript,
        fullTranscript: (gem?.full_transcript ?? []).map((t: any, i: number) => ({
          speaker: t.speaker_id || t.speaker || 'unknown',
          speaker_id: t.speaker_id || t.speaker,
          speaker_name: t.speaker_name || null,
          start_ms: t.start_ms,
          end_ms: t.end_ms,
          text: t.text
        })),
        statistics: gem?.meeting_statistics ? {
          total_duration_seconds: gem.meeting_statistics.total_duration_seconds,
          total_speakers: gem.meeting_statistics.total_speakers,
          total_words: gem.meeting_statistics.total_words,
          interruptions_count: gem.meeting_statistics.interruptions_count,
          average_turn_length_seconds: gem.meeting_statistics.average_turn_length_seconds,
        } : undefined,
      };

      setMeeting(mapped);
      clearSelectedFile();
      toast.success("Audio file processed successfully.");
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Failed to upload audio file; see console for details');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <AudioRecorderDialog
        open={isRecorderOpen}
        onOpenChange={setIsRecorderOpen}
        onRecordingComplete={handleRecordingComplete}
      />
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{meeting.title}</h1>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <main className="col-span-8 bg-card p-6 rounded-xl shadow-sm">
            <section className="mb-4">
              <h3 className="font-medium mb-3">Summary</h3>
              <div className="p-4 bg-muted rounded">
                {meeting.summary ? (
                  <div className="space-y-3">
                    <div className="text-sm">{meeting.summary}</div>
                    {meeting.importantPoints && meeting.importantPoints.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mt-2">Important points</div>
                        <ul className="list-disc pl-5 text-sm mt-1">
                          {meeting.importantPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No summary available yet.</div>
                )}
              </div>
            </section>

            <section>
              <h3 className="font-medium mb-3">Transcript</h3>
              <ScrollArea className="h-max p-4 bg-muted rounded">
                {meeting.transcriptSegments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No transcript segments yet.</div>
                ) : (
                  <div className="space-y-2">
                    {meeting.transcriptSegments.map((segment) => {
                      const participant = meeting.participants.find(p => p.id === segment.speakerId);
                      return (
                        <div key={segment.id} className="p-2 bg-background/80 rounded-md">
                          <div className='flex flex-row items-center'>
                            <div className="text-sm font-medium">{participant ? participant.name : "Unknown Speaker"}</div>
                            <div className="text-xs text-muted-foreground ml-2">{new Date(segment.startMs).toISOString().substring(14, 19)} • ({(segment.endMs - segment.startMs) / 1000}s)</div>
                          </div>
                          <div className="mt-1 text-sm">{segment.content}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </section>
          </main>

          <aside className="col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="audio-upload-form">
                  <Field>
                    <FieldLabel htmlFor="meeting-audio-input">Upload Existing Audio</FieldLabel>
                    <FieldDescription>Upload a file or record directly within the app.</FieldDescription>
                    <Input
                      ref={fileInputRef}
                      id="meeting-audio-input"
                      type="file"
                      accept='audio/*'
                      onChange={handleFileInputChange}
                    />
                    {selectedAudioFile && (
                      <div className="mt-3 flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium truncate max-w-48" title={selectedAudioFile.name}>{selectedAudioFile.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB · {audioSource === "recorded" ? "Recorded in app" : "Uploaded"}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={clearSelectedFile}>Clear</Button>
                      </div>
                    )}
                    <div className="flex flex-row items-center gap-2">
                      <Button
                        className={'w-1/2'}
                        type="button"
                        onClick={handleAudioFileUpload}
                        disabled={!selectedAudioFile || isUploading}
                      >
                        {isUploading ? (
                          <Spinner />
                        ) : <Upload />}
                        {isUploading ? 'Uploading...' : 'Upload and Process'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className=" w-1/2"
                        onClick={() => setIsRecorderOpen(true)}
                      >
                        <Mic className="size-4" />
                        Record Audio
                      </Button>
                    </div>
                  </Field>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h4 className="font-medium">Participants</h4>
              </CardHeader>
              <CardContent>
                <ParticipantList participants={meeting.participants} />
              </CardContent>
            </Card>

            {meeting.inequalities && meeting.inequalities.length > 0 && (
              <Card>
                <CardHeader>
                  <h4 className="font-medium">Inequalities</h4>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {meeting.inequalities.map((iq, idx) => (
                      <div key={idx} className="p-2 bg-background rounded">
                        <div className="text-sm font-medium">{(iq.type ?? "issue").replace(/_/g, " ")}</div>
                        <div className="mt-1 text-sm">{iq.description}</div>
                        {iq.speaker_affected && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Speaker: {meeting.participants.find(p => p.id === iq.speaker_affected)?.name ?? iq.speaker_affected}
                          </div>
                        )}
                        {typeof iq.timestamp_ms === 'number' && (
                          <div className="text-xs text-muted-foreground">At: {(iq.timestamp_ms / 1000).toFixed(2)}s</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {meeting.suggestions && meeting.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <h4 className="font-medium">Suggestions</h4>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meeting.suggestions.map((s, i) => (
                      <div key={i} className="p-2 bg-background rounded">
                        <div className="text-sm font-medium">{s.action}</div>
                        {s.reason && <div className="text-sm mt-1">{s.reason}</div>}
                        {s.suggested_message && <div className="text-xs text-muted-foreground mt-1">"{s.suggested_message}"</div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
    </>
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
