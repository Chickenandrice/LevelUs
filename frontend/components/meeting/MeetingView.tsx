"use client";
import { useState } from "react";
import { useMeeting } from "../../lib/meeting";
import { ApiResponse } from "../../lib/api-types";
import ParticipantList from "./ParticipantList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Spinner } from '../ui/spinner';

export default function MeetingView() {
  const { meeting, setMeeting } = useMeeting();

  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      (src || []).forEach((s: any, i: number) => {
        // Handle new schema: speaker_id/speaker_name or old schema: speaker
        const speakerId = s.speaker_id || s.speaker || 'unknown';
        const speakerName = s.speaker_name || s.speaker || speakerId;
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
        title: data.meeting_id ?? meeting.title,
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
      toast.success("Audio file processed successfully.");
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Failed to upload audio file; see console for details');
    } finally {
      setIsUploading(false);
    }
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
            <ScrollArea className="h-96 p-4 bg-muted rounded">
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
                  <FieldLabel htmlFor="picture">Upload Existing Audio</FieldLabel>
                  <FieldDescription>Select an audio file to upload.</FieldDescription>
                  <Input id="picture" type="file" onChange={(e) => setSelectedAudioFile(e.target.files ? e.target.files[0] : null)} accept='audio/*' />
                  {selectedAudioFile && (
                    <>

                      <Button onClick={handleAudioFileUpload} disabled={isUploading}>
                        {isUploading && (
                          <Spinner className="size-5" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload and Process'}
                      </Button>

                    </>
                  )}
                </Field>
              </form>
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
