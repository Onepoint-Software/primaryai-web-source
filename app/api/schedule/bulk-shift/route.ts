export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const fromDate = String(body?.fromDate || "").trim();
  const toDate = String(body?.toDate || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    return NextResponse.json({ error: "fromDate must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return NextResponse.json({ error: "toDate must be YYYY-MM-DD" }, { status: 400 });
  }
  if (fromDate === toDate) {
    return NextResponse.json({ error: "fromDate and toDate must differ" }, { status: 400 });
  }

  // Fetch events to shift (exclude imported calendar events)
  const { data: events, error: fetchError } = await supabase
    .from("lesson_schedule")
    .select("id")
    .eq("user_id", session.userId)
    .eq("scheduled_date", fromDate)
    .is("deleted_at", null)
    .not("external_source", "in", '("google","outlook")');

  if (fetchError) {
    return NextResponse.json({ error: "Could not fetch events" }, { status: 503 });
  }

  const ids = (Array.isArray(events) ? events : []).map((e: any) => e.id);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, shifted: 0 });
  }

  const { error: updateError } = await supabase
    .from("lesson_schedule")
    .update({ scheduled_date: toDate, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", session.userId);

  if (updateError) {
    return NextResponse.json({ error: "Could not shift events" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, shifted: ids.length });
}
