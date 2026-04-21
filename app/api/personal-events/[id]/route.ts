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
    deleted_at: row.deleted_at ? String(row.deleted_at) : null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("personal_events")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, event: mapEvent(data as Record<string, unknown>) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const { data: existing, error: existingError } = await supabase
    .from("personal_events")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  const title =
    body?.title !== undefined ? String(body.title || "").trim() : String(existing.title || "");
  const allDay =
    body?.allDay !== undefined
      ? Boolean(body.allDay)
      : body?.all_day !== undefined
        ? Boolean(body.all_day)
        : Boolean(existing.all_day);
  const eventDate =
    body?.eventDate !== undefined
      ? body.eventDate
      : body?.event_date !== undefined
        ? body.event_date
        : existing.event_date;
  const startAt =
    body?.startAt !== undefined
      ? body.startAt
      : body?.start_at !== undefined
        ? body.start_at
        : existing.start_at;
  const endAt =
    body?.endAt !== undefined
      ? body.endAt
      : body?.end_at !== undefined
        ? body.end_at
        : existing.end_at;
  const repeatRule =
    body?.repeatRule !== undefined || body?.repeat_rule !== undefined
      ? normaliseRepeatRule(body?.repeatRule ?? body?.repeat_rule)
      : normaliseRepeatRule(existing.repeat_rule);
  const repeatDays =
    body?.repeatDays !== undefined
      ? (Array.isArray(body.repeatDays) ? body.repeatDays : [])
      : body?.repeat_days !== undefined
        ? (Array.isArray(body.repeat_days) ? body.repeat_days : [])
        : (Array.isArray(existing.repeat_days) ? existing.repeat_days : []);
  const validFrom =
    body?.validFrom !== undefined
      ? body.validFrom
      : body?.valid_from !== undefined
        ? body.valid_from
        : existing.valid_from;
  const validTo =
    body?.validTo !== undefined
      ? body.validTo
      : body?.valid_to !== undefined
        ? body.valid_to
        : existing.valid_to;
  const location =
    body?.location !== undefined ? (body.location ? String(body.location).trim() : null) : existing.location;
  const notes =
    body?.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : existing.notes;
  const boundaryImpact =
    body?.boundaryImpact !== undefined
      ? Boolean(body.boundaryImpact)
      : body?.boundary_impact !== undefined
        ? Boolean(body.boundary_impact)
        : Boolean(existing.boundary_impact);
  const colour =
    body?.colour !== undefined ? normaliseColour(body.colour) : normaliseColour(existing.colour);

  if (!title) {
    return NextResponse.json({ error: "Event title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("personal_events")
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", session.userId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not update event" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, event: mapEvent(data as Record<string, unknown>) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const { data: existing } = await supabase
    .from("personal_events")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!existing?.id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("personal_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Could not delete event" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
