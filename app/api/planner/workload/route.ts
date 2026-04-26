/**
 * GET /api/planner/workload
 *
 * Returns workload metrics derived from planner_events for the authenticated user.
 *
 * Response:
 *   {
 *     totalPlans: number;          — count of planner_submitted events
 *     avgDurationMs: number | null — mean of plan_ready.total_duration_ms
 *     editRate: number | null      — section_revised / (section_revised + section_accepted) [0–1]
 *     exportWithoutEditRate: number | null — plan_exported where no preceding section_revised / total plan_exported [0–1]
 *     lastUpdated: string          — ISO timestamp of most recent event
 *   }
 */

import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Fetch all planner events for the user in one query (capped at 10 000 rows; enough for any individual teacher)
  const { data: events, error } = await supabase
    .from("planner_events")
    .select("event_type, payload, created_at, plan_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    console.error("[workload] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({
      totalPlans: 0,
      avgDurationMs: null,
      editRate: null,
      exportWithoutEditRate: null,
      lastUpdated: new Date().toISOString(),
    });
  }

  // ── Metrics ──────────────────────────────────────────────────────────────────

  const submittedEvents = events.filter(e => e.event_type === "planner_submitted");
  const totalPlans = submittedEvents.length;

  // avgDurationMs — from plan_ready payloads
  const durations = events
    .filter(e => e.event_type === "plan_ready" && typeof e.payload?.total_duration_ms === "number")
    .map(e => e.payload.total_duration_ms as number);
  const avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // editRate — section_revised / (section_revised + section_accepted)
  const revised = events.filter(e => e.event_type === "section_revised").length;
  const accepted = events.filter(e => e.event_type === "section_accepted").length;
  const editRate = (revised + accepted) > 0 ? revised / (revised + accepted) : null;

  // exportWithoutEditRate — exported plans where there are no section_revised events for that plan
  const exportedEvents = events.filter(e => e.event_type === "plan_exported" && e.plan_id);
  let exportWithoutEditRate: number | null = null;
  if (exportedEvents.length > 0) {
    const revisedPlanIds = new Set(
      events
        .filter(e => e.event_type === "section_revised" && e.plan_id)
        .map(e => e.plan_id as string)
    );
    const exportedWithoutEdit = exportedEvents.filter(e => !revisedPlanIds.has(e.plan_id as string)).length;
    exportWithoutEditRate = exportedWithoutEdit / exportedEvents.length;
  }

  const lastUpdated = events[events.length - 1]?.created_at ?? new Date().toISOString();

  return NextResponse.json({
    totalPlans,
    avgDurationMs,
    editRate,
    exportWithoutEditRate,
    lastUpdated,
  });
}
