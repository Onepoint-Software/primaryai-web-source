const SUBJECT_COLOURS: Record<string, string> = {
  Maths: "var(--accent)",
  English: "#60a5fa",
  Science: "#4ade80",
  History: "#f59e0b",
  Geography: "#34d399",
  Computing: "#a78bfa",
  Music: "#f472b6",
  Art: "#fb923c",
  PE: "#22d3ee",
  PSHE: "#e879f9",
  RE: "#facc15",
};

export function subjectColor(s: string): string {
  for (const [k, v] of Object.entries(SUBJECT_COLOURS)) {
    if (s.startsWith(k)) return v;
  }
  return "var(--muted)";
}
