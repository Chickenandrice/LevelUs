"use client";
import { MeetingProvider } from "../../../lib/meeting";
import MeetingView from "../../../components/meeting/MeetingView";

export default function DemoMeetingPage() {
  return (
    <MeetingProvider>
      <MeetingView />
    </MeetingProvider>
  );
}
