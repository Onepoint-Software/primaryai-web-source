export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { id } = await params;

  const { data: template } = await supabase
    .from("day_templates")
    .select("id,name")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!template?.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  // Accept a single date or an array of dates (YYYY-MM-DD)
  const rawDates: string[] = Array.isArray(body?.dates)
    ? body.dates
    : body?.date
    ? [String(body.date)]
    : [];

  const dates = rawDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || "")));
  if (dates.length === 0) {
    return NextResponse.json({ error: "At least one valid date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  const { data: blocks } = await supabase
    .from("day_template_blocks")
    .select("*")
    .eq("template_id", id)
    .order("start_time");

  const templateBlocks = Array.isArray(blocks) ? blocks : [];

  const rows = dates.flatMap((date) =>
    templateBlocks.map((b: any) => ({
      user_id: session.userId,
      lesson_pack_id: null,
      title: String(b.title || ""),
      subject: String(b.subject || ""),
      year_group: String(b.year_group || ""),
      scheduled_date: date,
      start_time: String(b.start_time || "09:00"),
      end_time: String(b.end_time || "10:00"),
      event_type: String(b.event_type || "lesson_pack"),
      event_category: b.event_category ? String(b.event_category) : null,
      effort: b.effort ? String(b.effort) : null,
      notes: b.notes ? String(b.notes) : null,
    }))
  );

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  const { data: created, error } = await supabase
    .from("lesson_schedule")
    .insert(rows)
    .select("id,title,scheduled_date,start_time,end_time");

  if (error) {
    return NextResponse.json({ error: "Could not apply template" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, created: Array.isArray(created) ? created.length : 0, events: created });
}
