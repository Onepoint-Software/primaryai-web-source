export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

type RepeatRule = "none" | "daily" | "weekly" | "custom";

function normaliseRepeatRule(value: unknown): RepeatRule {
  const v = String(value || "none").toLowerCase();
  if (v === "daily" || v === "weekly" || v === "custom") return v;
  return "none";
}

function normaliseColour(value: unknown): string {
  const allowed = ["teal", "blue", "purple", "pink", "orange", "green", "red", "yellow", "grey"];
  const v = String(value || "teal").toLowerCase();
  return allowed.includes(v) ? v : "teal";
}

function mapEvent(row: Record<string, unknown>) {
  return {
    id: String(row.id || ""),
    title: String(row.title || ""),
    all_day: Boolean(row.all_day),
    event_date: row.event_date ? String(row.event_date) : null,
    start_at: row.start_at ? String(row.start_at) : null,
    end_at: row.end_at ? String(row.end_at) : null,
    repeat_rule: String(row.repeat_rule || "none"),
    repeat_days: Array.isArray(row.repeat_days) ? row.repeat_days : [],
    valid_from: row.valid_from ? String(row.valid_from) : null,
    valid_to: row.valid_to ? String(row.valid_to) : null,
    location: row.location ? String(row.location) : null,
    notes: row.notes ? String(row.notes) : null,
    boundary_impact: Boolean(row.boundary_impact),
    colour: String(row.colour || "teal"),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function GET(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  let query = supabase
    .from("personal_events")
    .select("*")
    .eq("user_id", session.userId)
    .order("event_date", { ascending: true })
    .order("start_at", { ascending: true });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    query = query.or(`event_date.gte.${from},valid_to.gte.${from}`);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    query = query.or(`event_date.lte.${to},valid_from.lte.${to}`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message || "Could not fetch events" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, events: (Array.isArray(data) ? data : []).map(mapEvent) });
}

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
  const title = String(body?.title || "").trim();
  const allDay = Boolean(body?.allDay ?? body?.all_day ?? false);
  const eventDate = body?.eventDate || body?.event_date || null;
  const startAt = body?.startAt || body?.start_at || null;
  const endAt = body?.endAt || body?.end_at || null;
  const repeatRule = normaliseRepeatRule(body?.repeatRule ?? body?.repeat_rule);
  const repeatDays = Array.isArray(body?.repeatDays ?? body?.repeat_days)
    ? (body?.repeatDays ?? body?.repeat_days)
    : [];
  const validFrom = body?.validFrom || body?.valid_from || null;
  const validTo = body?.validTo || body?.valid_to || null;
  const location = body?.location ? String(body.location).trim() : null;
  const notes = body?.notes ? String(body.notes).trim() : null;
  const boundaryImpact = Boolean(body?.boundaryImpact ?? body?.boundary_impact ?? false);
  const colour = normaliseColour(body?.colour);

  if (!title) {
    return NextResponse.json({ error: "Event title is required" }, { status: 400 });
  }

  if (allDay && !eventDate) {
    return NextResponse.json({ error: "event_date is required for all-day events" }, { status: 400 });
  }

  if (!allDay && (!startAt || !endAt)) {
    return NextResponse.json({ error: "start_at and end_at are required for timed events" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("personal_events")
    .insert({
      user_id: session.userId,
      title,
      all_day: allDay,
      event_date: eventDate,
      start_at: startAt,
      end_at: endAt,
      repeat_rule: repeatRule,
      repeat_days: repeatDays,
      valid_from: validFrom,
      valid_to: validTo,
      location,
      notes,
      boundary_impact: boundaryImpact,
      colour,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create event" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, event: mapEvent(data as Record<string, unknown>) });
}
