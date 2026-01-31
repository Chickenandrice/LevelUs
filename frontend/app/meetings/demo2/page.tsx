"use client";
import React from "react";
import { MeetingProvider } from "../../../lib/meeting";
import MeetingView from "../../../components/meeting/MeetingView";
import { demoMeeting } from "../../../lib/mockData";

export default function DemoMeetingPage() {
  return (
    <MeetingProvider initial={demoMeeting}>
      <MeetingView />
    </MeetingProvider>
  );
}
