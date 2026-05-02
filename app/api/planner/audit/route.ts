export const runtime = 'edge';
/**
 * GET /api/planner/audit
 *
 * Returns the 100 most recent planner_events for the authenticated user,
 * ordered newest-first.
 *
 * Query params:
 *   limit  — integer 1–200 (default 100)
 *   offset — integer ≥ 0   (default 0)
 *
 * Response: Array<{
 *   id: string;
 *   event_type: string;
 *   plan_id: string | null;
 *   payload: Record<string, unknown>;
 *   created_at: string;
 * }>
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 100 : Math.min(rawLimit, 200);
  const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

  const { data: events, error } = await supabase
    .from("planner_events")
    .select("id, event_type, plan_id, payload, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[audit] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(events ?? []);
}
