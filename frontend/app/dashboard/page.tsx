"use client";
import { ElementType } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Play, Clock, BarChart2 } from "lucide-react";
import MeetingCreateDialog from "@/components/MeetingCreateDialog";
import { MeetingProvider } from '@/lib/meeting';

export default function DashboardPage() {
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8">
          <div className="bg-card p-8 rounded-xl shadow-md">
            <h1 className="text-4xl font-extrabold mb-3">LevelUs</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Run fairer meetings with live onboarding, speaker tracking, and proctor tools.
              Capture introductions, get live transcripts, and surface metrics so everyone can be heard regardless of gender, race, or background.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" disabled nativeButton={false} render={
                <Link href="/meetings/demo">
                  <Play className="size-5 mr-2" /> Open Demo Meeting
                </Link>
              }>
              </Button>

              <MeetingProvider>
                <MeetingCreateDialog />
              </MeetingProvider>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <StatCard title="Average Speaking Time" value="2m 14s" icon={Clock} />
            <StatCard title="Meetings" value="1" icon={Play} />
            <StatCard title="Engagement" value="78%" icon={BarChart2} />
          </div>
        </div>
        
        <aside className="col-span-4">
          <div className="bg-card p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3">Recent Demos</h3>
            <ul className="space-y-3">
              <li className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">Demo meeting</div>
                  <div className="text-xs text-muted-foreground">Jan 31 — 3 participants</div>
                </div>
                <Link href="/meetings/demo2" aria-disabled>
                  <Button size="sm" variant="outline">Open</Button>
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: ElementType; }) {
  return (
    <div className="p-4 bg-card rounded-md shadow-sm flex items-center gap-4">
      <div className="p-3 bg-muted rounded">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="font-medium text-lg">{value}</div>
      </div>
    </div>
  );
}
