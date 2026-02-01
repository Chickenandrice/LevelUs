import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Users, MessageSquare, BarChart3, CheckCircle2, Target, Zap } from 'lucide-react';

export default function Page() {
  // 
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight">LevelUs — Fairer, Clearer Meetings</h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            LevelUs helps facilitators and proctors run meetings where all voices are tracked and encouraged. Use
            live onboarding to identify speakers, get real-time transcripts and fairness metrics, and  
            <span className="text-pink-400 font-medium"> empower meetings</span> where 
            <span className="text-pink-400 font-medium"> underrepresented voices are heard</span>.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>Open Dashboard</Button>
            </Link>
            <Link href="/meetings/demo">
              <Button variant="outline">View Demo Meeting</Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Feature title="Equality First" desc="Identify inequities in real-time and take rapid actions." /> 
            <Feature title="Live Insights" desc="See who's speaking, for how long, and interruption counts." />
            <Feature title="Discussion Tool" desc="Manually edit, credit ideas, and ensure balanced participation." />
          </div>
        </div>

        <div className="order-first md:order-last">
          <div className="rounded-xl overflow-hidden shadow-lg bg-card">
            <div className="p-6">
              <div className="h-64 flex items-center justify-center text-white">
                <Image 
                  src="/Logo.png" 
                  alt="LevelUs Logo" 
                  width={400} 
                  height={256}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2 text-center">The Problem: Gender Inequality in Tech Meetings</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-center mb-12">
            Research shows that women and underrepresented groups face significant barriers in technical discussions. 
            LevelUs addresses these systemic issues with data-driven insights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <StatCard
              icon={TrendingDown}
              title="Women Are Interrupted More"
              stat="2x"
              description="Research shows women are interrupted significantly more often than men in group discussions, with studies finding interruption rates 2-3 times higher for women."
              source="Interruptions in Group Discussions: The Effects of Gender and Group Composition"
            />
            <StatCard
              icon={Users}
              title="Underrepresentation in Tech"
              stat="26%"
              description="Women hold only 26% of computing jobs in the U.S., despite making up nearly half of the overall workforce, according to NCWIT data."
              source="NCWIT (National Center for Women & Information Technology)"
            />
            <StatCard
              icon={MessageSquare}
              title="Speaking Time Disparity"
              stat="75%"
              description="Studies of mixed-gender groups show men often dominate speaking time, speaking significantly more than women even in professional settings."
              source="Research on Gender and Group Composition"
            />
            <StatCard
              icon={AlertTriangle}
              title="Idea Attribution Issues"
              stat="Common"
              description="Research indicates women's contributions in technical discussions are more likely to be overlooked or attributed to others, creating barriers to recognition."
              source="Studies on Gender Bias in Technical Discussions"
            />
            <StatCard
              icon={BarChart3}
              title="Meeting Participation Gap"
              stat="Significant"
              description="Women report lower confidence speaking in male-dominated meetings, and studies show measurable differences in participation rates."
              source="Workplace Meeting Dynamics Research"
            />
            <StatCard
              icon={Target}
              title="Retention Challenges"
              stat="Higher"
              description="Women in tech face higher turnover rates, with meeting dynamics and lack of recognition contributing to retention challenges in the industry."
              source="Tech Industry Retention Studies"
            />
          </div>
        </div>
      </section>

      <section className="border-t py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2 text-center">How LevelUs Solves This</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-center mb-12">
            Our AI-powered meeting assistant provides real-time insights and interventions to create more equitable discussions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <SolutionCard
              icon={Zap}
              title="Real-Time Intervention"
              description="LevelUs detects interruptions as they happen and provides facilitator suggestions to ensure all voices are heard. Our system identifies when someone is being interrupted and recommends actions like 'Let the speaker finish' or 'Invite quiet people to talk'."
              benefit="Helps facilitators create more equitable meeting environments"
            />
            <SolutionCard
              icon={CheckCircle2}
              title="Idea Attribution Tracking"
              description="Never lose track of who said what. LevelUs maintains a complete transcript with speaker identification, making it easy to credit the original idea person and prevent idea theft."
              benefit="Ensures proper credit for all contributions"
            />
            <SolutionCard
              icon={BarChart3}
              title="Speaking Time Analytics"
              description="Get detailed statistics on speaking time, word count, and participation rates by speaker. Identify imbalances before they become problems and track improvement over time."
              benefit="Provides data-driven insights for meeting equity"
            />
            <SolutionCard
              icon={Target}
              title="Proactive Facilitation"
              description="Our AI suggests specific interventions like 'Credit the original idea person' or 'Rebalance discussion' when it detects inequality patterns, helping facilitators create more inclusive environments."
              benefit="Empowers facilitators with actionable insights"
            />
          </div>
        </div>
      </section>

      <section className="border-t py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2 text-center">Research-Backed Solutions</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-center mb-12">
            LevelUs is built on findings from leading research on gender dynamics, interruptions, and group composition in technical discussions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResearchCard
              title="Interruption Patterns"
              description="Research shows that interruptions disproportionately affect women and underrepresented groups. LevelUs tracks and reports these patterns to create awareness and drive change."
              link="https://www.researchgate.net/publication/250069045_Interruptions_in_Group_Discussions_The_Effects_of_Gender_and_Group_Composition"
            />
            <ResearchCard
              title="Group Composition Effects"
              description="Studies demonstrate that group composition significantly impacts participation rates. Our analytics help identify and address these dynamics in real-time."
              link="https://pmc.ncbi.nlm.nih.gov/articles/PMC9838290/"
            />
            <ResearchCard
              title="Bias in Technical Discussions"
              description="Research reveals systematic biases in how ideas are attributed and credited. LevelUs ensures proper attribution and reduces bias through transparent tracking."
              link="https://arxiv.org/abs/1711.10985"
            />
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
          <p className="text-muted-foreground max-w-3xl pt-10">
            Built with Next.js, React, FastAPI, Gemini API, ElevenLabs, Tailwind CSS, and AI tools.
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

function StatCard({ icon: Icon, title, stat, description, source }: { 
  icon: React.ElementType; 
  title: string; 
  stat: string; 
  description: string; 
  source: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="size-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold mb-3 text-primary">{stat}</div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <p className="text-xs text-muted-foreground italic">Source: {source}</p>
      </CardContent>
    </Card>
  );
}

function SolutionCard({ icon: Icon, title, description, benefit }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  benefit: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="size-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary">{benefit}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResearchCard({ title, description, link }: { 
  title: string; 
  description: string; 
  link: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Read research paper →
        </a>
      </CardContent>
    </Card>
  );
}
