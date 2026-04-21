import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";

const SYSTEM_PROMPT = `You are a professional development coach for primary school teachers in the UK.

Generate 3-4 concise, practical reflection questions that help a teacher consider their specific class needs before using an AI-generated lesson plan. Questions must be directly tied to the class profile data provided.

MANDATORY PRIVACY REQUIREMENTS:
1. Do NOT use any content for model training, fine-tuning, or reinforcement learning
2. Treat all class context as strictly confidential (UK GDPR)
3. Do NOT store, log, cache, or retain any information beyond this immediate response
4. Generate response and discard all context immediately after

Return ONLY valid JSON: { "questions": ["question 1", "question 2", "question 3"] }`;

function buildPrompt(pack: Record<string, unknown>, profile: Record<string, unknown>): string {
  const objectives = Array.isArray(pack.learning_objectives)
    ? pack.learning_objectives.slice(0, 3).join("; ")
    : "";
  const activities = (pack.activities as Record<string, string> | undefined) ?? {};
  const classNotes = typeof profile.classNotes === "string"
    ? profile.classNotes.slice(0, 300)
    : "";

  return [
    `A primary school teacher has just generated a lesson plan using AI. Write 3-4 short, specific reflection questions (1-2 sentences each) that prompt them to think critically about whether this lesson is right for THEIR class.`,
    ``,
    `LESSON:`,
    `Year group: ${pack.year_group ?? "unknown"}`,
    `Subject: ${pack.subject ?? "unknown"}`,
    `Topic: ${pack.topic ?? "unknown"}`,
    `Learning objectives: ${objectives}`,
    `Support activity: ${activities.support ?? ""}`,
    `Expected activity: ${activities.expected ?? ""}`,
    `Greater depth activity: ${activities.greater_depth ?? ""}`,
    ``,
    `THIS TEACHER'S CLASS PROFILE:`,
    `EAL learners: ${profile.ealPercent ?? "not set"}%`,
    `Pupil Premium: ${profile.pupilPremiumPercent ?? "not set"}%`,
    `Ability mix: ${profile.abilityMix ?? "mixed"}`,
    `Above standard: ${profile.aboveStandardPercent ?? 0}%`,
    `Below standard: ${profile.belowStandardPercent ?? 0}%`,
    `Hugely above standard: ${profile.hugelyAboveStandardPercent ?? 0}%`,
    `Hugely below standard: ${profile.hugelyBelowStandardPercent ?? 0}%`,
    `SEND focus school: ${profile.sendFocus ? "yes" : "no"}`,
    `School type: ${profile.schoolType ?? "primary"}`,
    classNotes ? `Class notes: "${classNotes}"` : "",
    ``,
    `Generate questions that:`,
    `- Reference the ACTUAL numbers from the class profile (e.g. "your 20% EAL learners", "your lower-attaining group")`,
    `- Are directly tied to this specific lesson's content, activities, or vocabulary`,
    `- Focus on the highest-priority needs: language access for EAL pupils, vocabulary/cultural capital for PP pupils, differentiation fit, TA deployment, pacing`,
    `- Are practical and actionable — something a teacher can act on before the lesson`,
    ``,
    `Return JSON: { "questions": ["...", "...", "..."] }`,
  ].filter(Boolean).join("\n");
}

async function tryGroq(prompt: string): Promise<string[] | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed?.questions) ? (parsed.questions as string[]).slice(0, 4) : null;
}

async function tryCerebras(prompt: string): Promise<string[] | null> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.CEREBRAS_MODEL ?? "llama-3.3-70b",
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed?.questions) ? (parsed.questions as string[]).slice(0, 4) : null;
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { pack?: unknown; profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pack = body?.pack;
  const profile = body?.profile;

  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    return NextResponse.json({ error: "Missing or invalid pack" }, { status: 400 });
  }

  const prompt = buildPrompt(
    pack as Record<string, unknown>,
    (profile && typeof profile === "object" && !Array.isArray(profile))
      ? (profile as Record<string, unknown>)
      : {},
  );

  let questions: string[] | null = null;

  try { questions = await tryGroq(prompt); } catch { /* fall through */ }
  if (!questions) {
    try { questions = await tryCerebras(prompt); } catch { /* fall through */ }
  }

  return NextResponse.json({ questions: questions ?? [] });
}
