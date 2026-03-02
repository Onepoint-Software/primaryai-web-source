import { LessonPackSchema, type LessonPack } from "./schema";
import { getProviderStatus, selectProviders } from "./router";
import { retrieveObjectives } from "./retrieve";
import { cache } from "./cache";
import { record } from "./telemetry";
import { lessonPackToSlides } from "./exporters";
import type { LessonPackRequest, LessonPackReview } from "./types";

type ProviderAttempt = {
  providerId: string;
  ok: boolean;
  raw?: string;
  error?: string;
};

const LESSON_PACK_OUTPUT_TEMPLATE = {
  year_group: "string",
  subject: "string",
  topic: "string",
  learning_objectives: ["string", "string", "string"],
  teacher_explanation: "string",
  pupil_explanation: "string",
  worked_example: "string",
  common_misconceptions: ["string", "string", "string"],
  activities: {
    support: "string",
    expected: "string",
    greater_depth: "string",
  },
  send_adaptations: ["string", "string", "string"],
  plenary: "string",
  mini_assessment: {
    questions: ["string", "string", "string"],
    answers: ["string", "string", "string"],
  },
  slides: [],
};

function valueToString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => valueToString(item)).join(" ");
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["text", "content", "value", "description", "explanation", "answer"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
    return Object.values(obj)
      .map((item) => valueToString(item))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function valueToStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => valueToString(item)).filter((item) => item.length > 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => valueToString(item))
      .filter((item) => item.length > 0);
  }

  const scalar = valueToString(value);
  return scalar ? [scalar] : [];
}

function coerceLessonPackCandidate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object") return candidate;
  const obj = candidate as Record<string, unknown>;
  const activities = (obj.activities as Record<string, unknown> | undefined) ?? {};
  const miniAssessment = (obj.mini_assessment as Record<string, unknown> | undefined) ?? {};

  return {
    year_group: valueToString(obj.year_group),
    subject: valueToString(obj.subject),
    topic: valueToString(obj.topic),
    learning_objectives: valueToStringArray(obj.learning_objectives),
    teacher_explanation: valueToString(obj.teacher_explanation),
    pupil_explanation: valueToString(obj.pupil_explanation),
    worked_example: valueToString(obj.worked_example),
    common_misconceptions: valueToStringArray(obj.common_misconceptions),
    activities: {
      support: valueToString(activities.support),
      expected: valueToString(activities.expected),
      greater_depth: valueToString(activities.greater_depth),
    },
    send_adaptations: valueToStringArray(obj.send_adaptations),
    plenary: valueToString(obj.plenary),
    mini_assessment: {
      questions: valueToStringArray(miniAssessment.questions),
      answers: valueToStringArray(miniAssessment.answers),
    },
    slides: [],
  };
}

function parseJsonObject(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }

    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (!objectMatch) throw new Error("Could not find JSON object in provider output");
    return JSON.parse(objectMatch[0]);
  }
}

function normalizeProviderOutput(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw == null) throw new Error("Provider returned empty output");
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function runProviderAttempt(provider: { id: string; generate: (prompt: string) => Promise<unknown> }, prompt: string) {
  const timeoutMs = Number(process.env.ENGINE_PROVIDER_TIMEOUT_MS ?? 25000);
  const maxAttempts = Number(process.env.ENGINE_PROVIDER_MAX_ATTEMPTS ?? 2);

  let lastError = "Unknown provider failure";

  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const output = await withTimeout(provider.generate(prompt), timeoutMs);
      return {
        providerId: provider.id,
        ok: true,
        raw: normalizeProviderOutput(output),
      } as ProviderAttempt;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    providerId: provider.id,
    ok: false,
    error: lastError,
  } as ProviderAttempt;
}

async function runProviders(prompt: string): Promise<ProviderAttempt[]> {
  const providers = selectProviders();
  if (providers.length === 0) {
    const statuses = getProviderStatus();
    throw new Error(
      `No providers are configured. Provider status: ${JSON.stringify(statuses)}. Set one of: CF_API_TOKEN+CF_ACCOUNT_ID, GROQ_API_KEY, GEMINI_API_KEY, HUGGINGFACE_API_KEY+HUGGINGFACE_MODEL.`
    );
  }

  return Promise.all(providers.map((provider) => runProviderAttempt(provider, prompt)));
}

function scoreLessonPack(pack: LessonPack, objectives: string[]) {
  const corpus = [
    pack.teacher_explanation,
    pack.pupil_explanation,
    pack.worked_example,
    pack.activities.support,
    pack.activities.expected,
    pack.activities.greater_depth,
  ]
    .join(" ")
    .toLowerCase();

  let objectiveCoverage = 0;
  for (const objective of objectives) {
    const objectiveTokens = objective
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4);

    if (objectiveTokens.some((token) => corpus.includes(token))) {
      objectiveCoverage += 1;
    }
  }

  const differentiationDepth =
    Number(pack.activities.support.length > 20) +
    Number(pack.activities.expected.length > 20) +
    Number(pack.activities.greater_depth.length > 20);

  const misconceptionsDepth = Math.min(pack.common_misconceptions.length, 3);
  const assessmentDepth =
    Math.min(pack.mini_assessment.questions.length, 4) + Math.min(pack.mini_assessment.answers.length, 4);

  return objectiveCoverage * 5 + differentiationDepth * 3 + misconceptionsDepth * 2 + assessmentDepth;
}

function extractYearNumber(yearGroup: string) {
  const match = yearGroup.match(/Year\s+([1-6])/i);
  return match ? Number(match[1]) : null;
}

function normalizeUkSpelling(text: string) {
  return text
    .replace(/\bcolor\b/gi, "colour")
    .replace(/\borganize\b/gi, "organise")
    .replace(/\borganizing\b/gi, "organising")
    .replace(/\bbehavior\b/gi, "behaviour")
    .replace(/\bcenter\b/gi, "centre")
    .replace(/\banalyze\b/gi, "analyse");
}

function objectiveCoverageCount(pack: LessonPack, objectives: string[]) {
  if (objectives.length === 0) return 0;

  const corpus = [
    ...pack.learning_objectives,
    pack.teacher_explanation,
    pack.pupil_explanation,
    pack.worked_example,
    pack.activities.support,
    pack.activities.expected,
    pack.activities.greater_depth,
  ]
    .join(" ")
    .toLowerCase();

  let matched = 0;
  for (const objective of objectives) {
    const objectiveTokens = objective
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4);

    if (objectiveTokens.some((token) => corpus.includes(token))) {
      matched += 1;
    }
  }

  return matched;
}

function objectiveAlignmentRatio(pack: LessonPack, objectives: string[]) {
  if (objectives.length === 0) return 0;
  return objectiveCoverageCount(pack, objectives) / objectives.length;
}

function ensureUsefulContent(pack: LessonPack, req: LessonPackRequest, objectives: string[]) {
  const defaultObjectives =
    objectives.length > 0
      ? objectives.slice(0, 3)
      : [
          `Understand key ideas in ${req.topic}`,
          `Use subject vocabulary linked to ${req.topic}`,
          `Apply learning about ${req.topic} in context`,
        ];

  const objectiveList = pack.learning_objectives.filter((item) => item.trim().length > 0);
  const completedObjectives = [...objectiveList];
  for (const fallback of defaultObjectives) {
    if (completedObjectives.length >= 3) break;
    if (!completedObjectives.includes(fallback)) {
      completedObjectives.push(fallback);
    }
  }

  const year = extractYearNumber(req.year_group);
  const greaterDepthDefault =
    year && year <= 6
      ? `Reasoning challenge: build and solve a multi-step equation from a word problem about ${req.topic}.`
      : `Challenge task comparing multiple examples related to ${req.topic}.`;

  const misconceptions = [...pack.common_misconceptions.filter((item) => item.trim().length > 0)];
  while (misconceptions.length < 3) {
    misconceptions.push(`Possible misunderstanding ${misconceptions.length + 1} linked to ${req.topic}.`);
  }

  const questions =
    pack.mini_assessment.questions.filter((item) => item.trim().length > 0).length > 0
      ? pack.mini_assessment.questions.filter((item) => item.trim().length > 0)
      : [
          `What is one key fact about ${req.topic}?`,
          `How would you explain ${req.topic} to a partner?`,
          `Give one example linked to ${req.topic}.`,
        ];

  const answers =
    pack.mini_assessment.answers.filter((item) => item.trim().length > 0).length > 0
      ? pack.mini_assessment.answers.filter((item) => item.trim().length > 0)
      : [
          `Mark scheme: a correct fact about ${req.topic}.`,
          `Mark scheme: a clear explanation using subject vocabulary.`,
          `Mark scheme: a relevant and accurate example.`,
        ];

  while (answers.length < questions.length) {
    answers.push(`Mark scheme: acceptable equivalent answer for question ${answers.length + 1}.`);
  }

  return LessonPackSchema.parse({
    ...pack,
    learning_objectives: completedObjectives,
    teacher_explanation: normalizeUkSpelling(pack.teacher_explanation),
    pupil_explanation: normalizeUkSpelling(pack.pupil_explanation),
    worked_example: normalizeUkSpelling(pack.worked_example),
    common_misconceptions: misconceptions,
    activities: {
      support: normalizeUkSpelling(
        pack.activities.support.trim().length > 0
          ? pack.activities.support
          : `Guided task with sentence starters about ${req.topic}.`
      ),
      expected: normalizeUkSpelling(
        pack.activities.expected.trim().length > 0
          ? pack.activities.expected
          : `Core class task applying the main concept in ${req.topic}.`
      ),
      greater_depth:
        pack.activities.greater_depth.trim().length > 0
          ? normalizeUkSpelling(
              /two variables/i.test(pack.activities.greater_depth) && year && year <= 6
                ? greaterDepthDefault
                : pack.activities.greater_depth
            )
          : greaterDepthDefault,
    },
    mini_assessment: {
      questions,
      answers: answers.slice(0, questions.length).map((item) => normalizeUkSpelling(item)),
    },
    plenary: normalizeUkSpelling(pack.plenary),
  });
}

async function generateBestLessonPack(prompt: string, objectives: string[]) {
  const attempts = await runProviders(prompt);

  const validCandidates: Array<{ providerId: string; pack: LessonPack; score: number }> = [];
  const errors: string[] = [];

  for (const attempt of attempts) {
    if (!attempt.ok || !attempt.raw) {
      errors.push(`${attempt.providerId}: ${attempt.error ?? "unknown error"}`);
      continue;
    }

    try {
      const parsed = parseJsonObject(attempt.raw);
      const coerced = coerceLessonPackCandidate(parsed);
      const validated = LessonPackSchema.parse(coerced);
      const coverage = objectiveCoverageCount(validated, objectives);
      if (objectives.length > 0 && coverage === 0) {
        errors.push(`${attempt.providerId}: no curriculum objective overlap detected`);
        continue;
      }

      validCandidates.push({
        providerId: attempt.providerId,
        pack: validated,
        score: scoreLessonPack(validated, objectives),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${attempt.providerId}: ${message}`);
    }
  }

  if (validCandidates.length === 0) {
    throw new Error(`No provider succeeded. Attempt details: ${errors.join(" | ")}`);
  }

  validCandidates.sort((a, b) => b.score - a.score);
  return {
    providerId: validCandidates[0].providerId,
    lessonPack: validCandidates[0].pack,
    attempts,
  };
}

function selectSectionsToRegenerate(improvements: string[]) {
  const sections = new Set<string>();
  const map: Array<{ keyword: string; section: string }> = [
    { keyword: "objective", section: "learning_objectives" },
    { keyword: "teacher", section: "teacher_explanation" },
    { keyword: "pupil", section: "pupil_explanation" },
    { keyword: "misconception", section: "common_misconceptions" },
    { keyword: "activity", section: "activities" },
    { keyword: "adaptation", section: "send_adaptations" },
    { keyword: "plenary", section: "plenary" },
    { keyword: "assessment", section: "mini_assessment" },
    { keyword: "flow", section: "worked_example" },
  ];

  for (const item of improvements) {
    const normalized = item.toLowerCase();
    for (const entry of map) {
      if (normalized.includes(entry.keyword)) {
        sections.add(entry.section);
      }
    }
  }

  if (sections.size === 0) {
    sections.add("learning_objectives");
    sections.add("activities");
  }

  return Array.from(sections);
}

function mergeRegeneratedSections(base: LessonPack, patch: Record<string, unknown>): LessonPack {
  const merged = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(patch)) {
    merged[key] = value;
  }

  return LessonPackSchema.parse(merged);
}

async function runQualityPass(
  draft: LessonPack,
  req: LessonPackRequest,
  objectives: string[]
): Promise<LessonPack> {
  const reviewPrompt = `
You are reviewing a lesson pack for quality.
Check:
- Clear differentiation
- Curriculum alignment
- Logical flow
Return JSON:
{ "approved": true/false, "improvements": [] }

Year Group: ${req.year_group}
Subject: ${req.subject}
Topic: ${req.topic}
Curriculum Objectives: ${objectives.join("; ")}
Lesson Pack:
${JSON.stringify(draft, null, 2)}
  `;

  try {
    const reviewAttempts = await runProviders(reviewPrompt);
    let review: LessonPackReview | null = null;

    for (const attempt of reviewAttempts) {
      if (!attempt.ok || !attempt.raw) continue;
      try {
        review = parseJsonObject(attempt.raw) as LessonPackReview;
        break;
      } catch {
        // Try next successful provider output.
      }
    }

    if (!review || review.approved) {
      return draft;
    }

    const sections = selectSectionsToRegenerate(review.improvements ?? []);
    const regeneratePrompt = `
Regenerate only the flagged sections of this lesson pack.

Flagged sections: ${sections.join(", ")}
Improvements needed: ${JSON.stringify(review.improvements ?? [], null, 2)}

Return ONLY a JSON object with those section keys and corrected values.
Do not include any other keys.

Lesson Pack:
${JSON.stringify(draft, null, 2)}
  `;

    const regenAttempts = await runProviders(regeneratePrompt);
    for (const attempt of regenAttempts) {
      if (!attempt.ok || !attempt.raw) continue;
      try {
        const patch = parseJsonObject(attempt.raw) as Record<string, unknown>;
        return mergeRegeneratedSections(draft, patch);
      } catch {
        // Try next successful provider output.
      }
    }
  } catch {
    // Review pass should never block delivery of a valid first draft.
  }

  return draft;
}

async function runAlignmentPass(
  draft: LessonPack,
  req: LessonPackRequest,
  objectives: string[]
): Promise<LessonPack> {
  if (objectives.length === 0) return draft;

  const minAlignmentRatio = Number(process.env.ENGINE_MIN_ALIGNMENT_RATIO ?? 0.6);
  if (objectiveAlignmentRatio(draft, objectives) >= minAlignmentRatio) {
    return draft;
  }

  const alignmentPrompt = `
Improve this lesson pack so it explicitly aligns to these UK curriculum objectives.
Prioritize revising:
- learning_objectives
- teacher_explanation
- pupil_explanation
- worked_example
- activities
- mini_assessment

Return ONLY a JSON object with those keys.
Do not include any other keys.

Curriculum Objectives:
${objectives.join("; ")}

Lesson Pack:
${JSON.stringify(draft, null, 2)}
  `;

  const attempts = await runProviders(alignmentPrompt);
  for (const attempt of attempts) {
    if (!attempt.ok || !attempt.raw) continue;

    try {
      const patch = parseJsonObject(attempt.raw) as Record<string, unknown>;
      const merged = mergeRegeneratedSections(draft, patch);
      if (objectiveAlignmentRatio(merged, objectives) >= objectiveAlignmentRatio(draft, objectives)) {
        return merged;
      }
    } catch {
      // Try next provider response.
    }
  }

  return draft;
}

function attachProgrammaticSlides(pack: LessonPack): LessonPack {
  return LessonPackSchema.parse({
    ...pack,
    slides: lessonPackToSlides(pack),
  });
}

export function getLessonPackCacheKey(req: LessonPackRequest) {
  return `v3:${JSON.stringify(req)}`;
}

export async function generateLessonPackWithMeta(req: LessonPackRequest): Promise<{
  pack: LessonPack;
  providerId: string;
  cacheHit: boolean;
}> {
  const cacheKey = getLessonPackCacheKey(req);
  const cached = cache.get<LessonPack>(cacheKey);
  if (cached) {
    return {
      pack: cached,
      providerId: "cache",
      cacheHit: true,
    };
  }

  const objectives = await retrieveObjectives(req.year_group, req.subject, req.topic);
  if (objectives.length === 0) {
    throw new Error(
      `No UK curriculum objectives found for ${req.year_group} ${req.subject} topic "${req.topic}". Try a more specific curriculum topic.`
    );
  }

  const teacherProfile = req.profile ?? null;

  const prompt = `
You are PrimaryAI Engine. Return ONLY valid JSON matching this schema.
Do not generate slide content; set slides to [] and it will be generated programmatically.
Use ONLY primitive strings/arrays/objects exactly matching keys below.
Do not return nested rich objects for text fields.
Use UK spelling and UK primary classroom tone.
Provide at least 3 learning objectives.
For mini_assessment answers, write mark-scheme style expected answers.
Never include real pupil names or personal data.

Year Group: ${req.year_group}
Subject: ${req.subject}
Topic: ${req.topic}
Curriculum Objectives: ${objectives.join("; ")}
Teacher Profile:
${JSON.stringify(
    {
      defaultYearGroup: teacherProfile?.defaultYearGroup ?? null,
      defaultSubject: teacherProfile?.defaultSubject ?? null,
      tone: teacherProfile?.tone ?? "professional_uk",
      schoolType: teacherProfile?.schoolType ?? "primary",
      sendFocus: teacherProfile?.sendFocus ?? false,
      styleRules: [
        "Profile influences tone, examples, and scaffolding style.",
        "Profile must not override factual curriculum claims.",
      ],
    },
    null,
    2
  )}

Profile-Driven Instructions:
- Apply profile tone and school type to explanations and examples.
- If sendFocus is true, include robust SEND adaptations in send_adaptations and differentiated activities.
- Do not invent curriculum facts beyond provided objectives.

Generate structured lesson pack with:
${JSON.stringify(LESSON_PACK_OUTPUT_TEMPLATE, null, 2)}
  `;

  if (process.env.NODE_ENV === "development") {
    console.debug("lesson-pack-profile-context", {
      year_group: req.year_group,
      subject: req.subject,
      profile: teacherProfile ?? null,
    });
  }

  const generated = await generateBestLessonPack(prompt, objectives);
  const reviewed = await runQualityPass(generated.lessonPack, req, objectives);
  const aligned = await runAlignmentPass(reviewed, req, objectives);
  const useful = ensureUsefulContent(aligned, req, objectives);
  const finalized = attachProgrammaticSlides(useful);

  cache.set(cacheKey, finalized);
  record(generated.providerId, req);
  return {
    pack: finalized,
    providerId: generated.providerId,
    cacheHit: false,
  };
}

export async function generateLessonPack(req: LessonPackRequest): Promise<LessonPack> {
  const generated = await generateLessonPackWithMeta(req);
  return generated.pack;
}
