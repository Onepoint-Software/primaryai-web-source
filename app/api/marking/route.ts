/**
 * POST /api/marking
 *
 * Generates pre-draft marking comments for a piece of pupil work.
 * The teacher MUST review and confirm or rewrite before use.
 *
 * Body:
 *   {
 *     yearGroup: string;         — e.g. "Year 4"
 *     subject: string;           — e.g. "English — Writing"
 *     assignmentDescription: string;  — what the task asked pupils to do
 *     pupilWork: string;         — the pupil's work (anonymised — no name)
 *     markingCriteria: string;   — e.g. "use of descriptive language, punctuation, structure"
 *     markingStyle?: string;     — "formative" (default) | "summative"
 *   }
 *
 * Response:
 *   {
 *     criterionFeedback: Array<{ criterion: string; comment: string; strength: boolean }>;
 *     overallComment: string;
 *     nextSteps: string[];
 *     warningLabel: string;  — always present: reminds teacher this is a pre-draft
 *   }
 */

import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { callSingleProvider } from "@/src/engine/orchestrate";
import { scanInput } from "@/lib/safeguarding";
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

  let body: {
    yearGroup: string;
    subject: string;
    assignmentDescription: string;
    pupilWork: string;
    markingCriteria: string;
    markingStyle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { yearGroup, subject, assignmentDescription, pupilWork, markingCriteria, markingStyle = "formative" } = body;

  if (!pupilWork?.trim()) {
    return NextResponse.json({ error: "pupilWork is required" }, { status: 400 });
  }
  if (!assignmentDescription?.trim()) {
    return NextResponse.json({ error: "assignmentDescription is required" }, { status: 400 });
  }

  // Safeguarding scan — never send flagged content to the model
  const scanResult = scanInput(`${assignmentDescription} ${pupilWork} ${markingCriteria}`);
  if (!scanResult.safe) {
    trackEvent(userId, "planner_submitted", { feature: "marking", safeguarding_blocked: true, category: scanResult.category });
    return NextResponse.json({ error: "SAFEGUARDING_REDIRECT" }, { status: 422 });
  }

  const criteriaList = markingCriteria
    .split(/[,;|\n]+/)
    .map(c => c.trim())
    .filter(Boolean)
    .slice(0, 8); // max 8 criteria

  const prompt = `You are helping a UK primary school teacher produce pre-draft marking feedback.

CONTEXT:
- Year group: ${yearGroup || "not specified"}
- Subject: ${subject || "not specified"}
- Task: ${assignmentDescription}
- Marking style: ${markingStyle === "summative" ? "Summative (level/grade focused)" : "Formative (feed-forward focused)"}
- Criteria: ${criteriaList.join(", ") || "general quality"}

PUPIL WORK (anonymised — no pupil name):
"""
${pupilWork.slice(0, 2000)}
"""

Produce marking feedback following the UK National Curriculum expectations for ${yearGroup || "primary"} ${subject || ""}.

Return a JSON object with EXACTLY these keys:

{
  "criterionFeedback": [
    { "criterion": "criterion name", "comment": "specific, evidence-based comment referencing the pupil's actual words or choices", "strength": true }
  ],
  "overallComment": "one paragraph (3–4 sentences) of overall formative feedback, written in second person ('You have...'). Warm but specific — reference the work directly.",
  "nextSteps": ["one concrete next step", "one concrete next step"]
}

Rules:
- UK English throughout
- Reference the pupil's actual work — quote words or phrases where helpful
- Each criterion comment must be specific to this piece of work, not generic
- strength: true if this is a strength, false if it is an area for development
- nextSteps: exactly 2 items, each beginning with a verb (e.g. "Try...", "Extend...", "Practise...")
- If the pupil work is too short to assess a criterion, note this in the comment
- Return ONLY the JSON object`;

  const startMs = Date.now();
  const raw = await callSingleProvider(prompt);

  if (!raw) {
    return NextResponse.json({ error: "Marking assistant unavailable — please try again" }, { status: 503 });
  }

  const parsed = parseJsonFromText(raw) as {
    criterionFeedback?: Array<{ criterion: string; comment: string; strength: boolean }>;
    overallComment?: string;
    nextSteps?: string[];
  } | null;

  if (!parsed?.overallComment) {
    return NextResponse.json({ error: "Could not parse marking response" }, { status: 500 });
  }

  const durationMs = Date.now() - startMs;
  trackEvent(userId, "plan_ready", { feature: "marking", duration_ms: durationMs, criteria_count: criteriaList.length });

  return NextResponse.json({
    criterionFeedback: Array.isArray(parsed.criterionFeedback) ? parsed.criterionFeedback : [],
    overallComment: parsed.overallComment ?? "",
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 2) : [],
    warningLabel: "Pre-draft only — review and edit before using with pupils. The teacher retains full responsibility for all marking decisions.",
  });
}
