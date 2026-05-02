export const runtime = 'edge';
/**
 * POST /api/retrieval
 *
 * Generates curriculum-aligned retrieval practice questions.
 * Anchored to the National Curriculum for England (KS1/KS2).
 *
 * Body:
 *   {
 *     yearGroup: string;       — e.g. "Year 5"
 *     subject: string;         — e.g. "Maths"
 *     priorTopic: string;      — what pupils learned previously (at least 1 week ago)
 *     questionTypes: string[]; — subset of: "multiple_choice" | "short_answer" | "true_false" | "fill_blank"
 *     questionCount?: number;  — 5–10 (default 6)
 *   }
 *
 * Response:
 *   {
 *     questions: Array<{
 *       type: string;
 *       question: string;
 *       options?: string[];    — multiple choice only
 *       answer: string;
 *       rationale: string;     — why this question targets the prior learning
 *     }>;
 *     curriculumAnchor: string; — National Curriculum reference for this content
 *     spacingNote: string;      — brief reminder about spacing/retrieval timing
 *   }
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

const VALID_TYPES = new Set(["multiple_choice", "short_answer", "true_false", "fill_blank"]);

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: {
    yearGroup: string;
    subject: string;
    priorTopic: string;
    questionTypes: string[];
    questionCount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { yearGroup, subject, priorTopic, questionTypes = ["short_answer"], questionCount = 6 } = body;

  if (!priorTopic?.trim()) {
    return NextResponse.json({ error: "priorTopic is required" }, { status: 400 });
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  const validTypes = (Array.isArray(questionTypes) ? questionTypes : ["short_answer"])
    .filter(t => VALID_TYPES.has(t))
    .slice(0, 4);
  if (validTypes.length === 0) validTypes.push("short_answer");

  const count = Math.max(3, Math.min(10, Number(questionCount) || 6));

  const typeDescriptions: Record<string, string> = {
    multiple_choice: 'Multiple choice with 4 options. Include "options" array in the question object.',
    short_answer: "Short written answer (1–3 sentences expected). No options array.",
    true_false: 'True or False. Include "options": ["True", "False"] in the question object.',
    fill_blank: 'Fill in the blank — use ___ for the gap. No options array.',
  };

  const typesBlock = validTypes.map(t => `- ${t}: ${typeDescriptions[t]}`).join("\n");

  const prompt = `You are a UK primary school curriculum expert generating retrieval practice questions.

CONTEXT:
- Year group: ${yearGroup || "not specified"}
- Subject: ${subject}
- Prior topic to retrieve: "${priorTopic}"
- Number of questions: ${count}
- Question types to use: ${validTypes.join(", ")}

QUESTION TYPE SPECIFICATIONS:
${typesBlock}

Generate ${count} retrieval practice questions on this prior topic, grounded in the National Curriculum for England (KS1/KS2). Questions must:
- Test knowledge from PRIOR learning (not introduce new content)
- Be appropriately challenging for ${yearGroup || "the stated year group"}
- Cover different aspects of the topic, not just the most obvious fact
- Be unambiguous in their correct answer

Return a JSON object with EXACTLY these keys:

{
  "questions": [
    {
      "type": "question_type",
      "question": "the question text",
      "options": ["A", "B", "C", "D"],
      "answer": "the correct answer",
      "rationale": "1 sentence: why this question is valuable for retrieval of this specific prior learning"
    }
  ],
  "curriculumAnchor": "The specific National Curriculum programme of study reference(s) this content maps to (e.g. 'KS2 Mathematics: number — fractions, Year 5 statutory requirements')",
  "spacingNote": "One sentence of advice to the teacher about optimal timing for retrieval of this content (e.g. ideally 1–2 weeks after original teaching, not the next day)"
}

Rules:
- UK English throughout
- Omit the "options" key for short_answer and fill_blank types
- answers must be unambiguous — if a question has multiple defensible answers, rewrite it
- Return ONLY the JSON object`;

  const startMs = Date.now();
  const raw = await callSingleProvider(prompt);

  if (!raw) {
    return NextResponse.json({ error: "Retrieval generator unavailable — please try again" }, { status: 503 });
  }

  const parsed = parseJsonFromText(raw) as {
    questions?: Array<{ type: string; question: string; options?: string[]; answer: string; rationale: string }>;
    curriculumAnchor?: string;
    spacingNote?: string;
  } | null;

  if (!parsed?.questions) {
    return NextResponse.json({ error: "Could not parse retrieval response" }, { status: 500 });
  }

  const durationMs = Date.now() - startMs;
  trackEvent(userId, "plan_ready", {
    feature: "retrieval",
    duration_ms: durationMs,
    question_count: parsed.questions.length,
    year_group: yearGroup,
    subject,
  });

  return NextResponse.json({
    questions: parsed.questions,
    curriculumAnchor: parsed.curriculumAnchor ?? "",
    spacingNote: parsed.spacingNote ?? "",
  });
}
