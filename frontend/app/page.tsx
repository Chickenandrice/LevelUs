import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Page() {
  // 
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight">LevelUs — Fairer, clearer meetings</h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            LevelUs helps facilitators and proctors run meetings where all voices are tracked and encouraged. Use
            live onboarding to identify speakers, get real-time transcripts and fairness metrics, and ensure every
            participant has a chance to speak.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>Open Dashboard</Button>
            </Link>
            <Link href="/meeting/1">
              <Button variant="outline">Start Demo Meeting</Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Feature title="Intro Mode" desc="Quickly capture introductions and map voices to names." />
            <Feature title="Live Insights" desc="See who's speaking, for how long, and interruption counts." />
            <Feature title="Proctor Tools" desc="Manually edit, credit ideas, and ensure balanced participation." />
          </div>
        </div>

        <div className="order-first md:order-last">
          <div className="rounded-xl overflow-hidden shadow-lg bg-card">
            <div className="p-6">
              <div className="h-64 bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-2xl font-semibold">Live Meeting Preview</div>
                  <div className="text-sm text-muted-foreground mt-2">Mic capture, ASR stub, participant list</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t py-10 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-4">Why LevelUs?</h2>
          <p className="text-muted-foreground max-w-3xl">
            Meetings often favor the loudest voices. LevelUs provides lightweight proctoring tools to track speaking
            equity, reduce interruptions, and surface ideas to credit speakers — all in a simple demo-ready app.
          </p>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string; }) {
  return (
    <div className="p-4 bg-muted rounded-md">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}
