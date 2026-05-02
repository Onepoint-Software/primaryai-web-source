export const runtime = 'edge';
/**
 * POST /api/planner/critique
 *
 * Analyses the teacher's lesson plan inputs and returns:
 *   - A short critique of the topic/objective as written
 *   - An upgraded version of the topic that will produce a better lesson plan
 *   - 2–3 specific suggestions
 *
 * Single-provider call — must complete in < 5 seconds.
 *
 * Body:    { yearGroup: string; subject: string; topic: string }
 * Response: { critique: string; upgraded: string; suggestions: string[] }
 */

import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { callSingleProvider } from "@/src/engine/orchestrate";
import { trackEvent } from "@/lib/planner-telemetry";

function parseJsonFromText(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { yearGroup: string; subject: string; topic: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { yearGroup, subject, topic } = body;
  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const prompt = `You are helping a UK primary school teacher write a better lesson topic/objective.

Teacher's input:
- Year group: ${yearGroup || "not specified"}
- Subject: ${subject || "not specified"}
- Topic as written: "${topic}"

Analyse this topic and return a JSON object with these exact keys:

{
  "critique": "1–2 sentence honest assessment of what is unclear, too vague, too broad, or missing",
  "upgraded": "an improved version of the topic that is specific, curriculum-grounded, and will generate a higher-quality lesson plan — keep it under 20 words",
  "suggestions": ["specific improvement 1", "specific improvement 2"]
}

Rules:
- UK English throughout
- Reference the National Curriculum for England (Key Stage 1 or 2) where relevant
- Be direct and specific — the teacher wants to improve, not be reassured
- If the topic is already excellent, say so in critique and return it unchanged with suggestions: []
- Return ONLY the JSON object`;

  const raw = await callSingleProvider(prompt);
  if (!raw) {
    return NextResponse.json({ error: "Critique unavailable — try again" }, { status: 503 });
  }

  const parsed = parseJsonFromText(raw) as { critique?: string; upgraded?: string; suggestions?: string[] } | null;
  if (!parsed?.critique) {
    return NextResponse.json({ error: "Could not parse critique response" }, { status: 500 });
  }

  // Track that the teacher used the prompt critique feature
  trackEvent(userId, "cpd_prompt_engaged", { action: "prompt_critique", topic_length: topic.length });

  return NextResponse.json({
    critique: parsed.critique ?? "",
    upgraded: parsed.upgraded ?? topic,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  });
}
