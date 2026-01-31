"use client";
import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MeetingProvider } from "../../../lib/meeting";
import MeetingView from "../../../components/meeting/MeetingView";
import { demoMeeting } from "../../../lib/mockData";

export default function MeetingPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = params?.id ?? "";
  const live = search?.get("live") === "1" || search?.get("live") === "true";

  const initial = id === "demo" ? demoMeeting : undefined;

  return (
    <MeetingProvider initial={initial}>
      <MeetingView />
    </MeetingProvider>
  );
}
