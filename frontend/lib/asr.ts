// Simple ASR stub for demo / live testing.
// Accepts a recorded audio Blob and returns a mocked transcript.

export async function asrStub(blob: Blob, realistic = true): Promise<string> {
  // Keep a tiny delay to simulate network/processing time
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 800));

  if (!realistic) {
    return `Mock transcript (${new Date().toLocaleTimeString()})`;
  }

  const samples = [
    "I think we should prioritize the user flow and validate with customers.",
    "Can someone clarify the goal for this sprint?",
    "I'm concerned about the technical debt — we may need more time.",
    "That's a great point, could you expand on that idea?",
    "We can try a smaller experiment to validate the assumption.",
    "I agree with that approach, and I suggest we A/B test it.",
    "Quick note: we should make the onboarding simpler for new users.",
    "Could you repeat the last part? I want to make sure I understood.",
  ];

  // Pick a sample and sometimes append a short clause to vary outputs.
  const base = samples[Math.floor(Math.random() * samples.length)];
  const suffixes = ["", " Also, we could document it.", " (short example)", " — that's important."];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return base + suffix;
}
