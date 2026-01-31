import { Meeting } from "./types";

export const demoMeeting: Meeting = {
  id: "demo",
  title: "Demo — Retrospective",
  mode: "discussion",
  participants: [
    {
      id: "p1",
      name: "Alex",
      introduced: true,
      speakingTime: 125000,
      transcripts: [
        "I think we should prioritize the user flow and validate with customers.",
        "Also, let's consider a small pilot next week.",
      ],
    },
    {
      id: "p2",
      name: "Priya",
      introduced: true,
      speakingTime: 45000,
      transcripts: ["I'm concerned about the technical debt — we may need more time."],
    },
    {
      id: "p3",
      name: "Sam",
      introduced: true,
      speakingTime: 30000,
      transcripts: ["Could you repeat the last part? I want to make sure I understood."],
    },
  ],
};
