/**
 * /api/planner/sections
 *
 * POST — upsert a single section state (content, state, rationale)
 *        Called when the teacher accepts, revises, or rejects a section.
 *
 * Body: {
 *   planId: string          — lesson_packs.id
 *   sectionKey: string      — e.g. "starter", "main", "plenary"
 *   sectionOrder: number
 *   contentMd: string
 *   rationaleMd?: string
 *   rationalePrinciples?: string[]
 *   state: "accepted" | "revised" | "rejected"
 * }
 */

import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { trackEvent } from "@/lib/planner-telemetry";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type SectionState = "accepted" | "revised" | "rejected";

interface SectionBody {
  planId: string;
  sectionKey: string;
  sectionOrder: number;
  contentMd: string;
  rationaleMd?: string;
  rationalePrinciples?: string[];
  state: SectionState;
  editDistance?: number;
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: SectionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    planId,
    sectionKey,
    sectionOrder,
    contentMd,
    rationaleMd = "",
    rationalePrinciples = [],
    state,
    editDistance,
  } = body;

  if (!planId || !sectionKey || state === undefined) {
    return NextResponse.json({ error: "planId, sectionKey, and state are required" }, { status: 400 });
  }

  const validStates: SectionState[] = ["accepted", "revised", "rejected"];
  if (!validStates.includes(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Verify the plan belongs to this user before writing
  const planCheck = await fetch(
    `${SUPABASE_URL}/rest/v1/lesson_packs?id=eq.${planId}&user_id=eq.${userId}&select=id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const planRows = await planCheck.json();
  if (!Array.isArray(planRows) || planRows.length === 0) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Upsert the section record
  const upsertBody: Record<string, unknown> = {
    plan_id: planId,
    section_key: sectionKey,
    section_order: sectionOrder,
    content_md: contentMd,
    rationale_md: rationaleMd,
    rationale_principles: rationalePrinciples,
    state,
    last_edited_at: state === "revised" ? new Date().toISOString() : null,
  };

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/plan_sections`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(upsertBody),
  });

  if (!upsertRes.ok) {
    const err = await upsertRes.text().catch(() => "");
    return NextResponse.json({ error: `Failed to save section: ${err}` }, { status: 500 });
  }

  // Fire telemetry
  const eventType =
    state === "accepted" ? "section_accepted" :
    state === "revised"  ? "section_revised" :
                           "section_rejected";

  trackEvent(userId, eventType, {
    section_key: sectionKey,
    ...(state === "revised" && editDistance !== undefined ? { edit_distance: editDistance } : {}),
  }, planId);

  return NextResponse.json({ ok: true });
}
