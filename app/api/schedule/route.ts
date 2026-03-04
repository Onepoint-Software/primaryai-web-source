import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "weekStart (YYYY-MM-DD) is required" }, { status: 400 });
  }

  // Compute end of week (exclusive): weekStart + 7 days
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const weekEnd = end.toISOString().split("T")[0];

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Schedule store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("lesson_schedule")
    .select("*")
    .eq("user_id", session.userId)
    .gte("scheduled_date", weekStart)
    .lt("scheduled_date", weekEnd)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Schedule store unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, events: data });
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { lessonPackId, title, subject, yearGroup, scheduledDate, startTime, endTime, notes } = body ?? {};

  if (!lessonPackId || !title || !subject || !yearGroup || !scheduledDate || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (startTime >= endTime) {
    return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Schedule store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("lesson_schedule")
    .insert({
      user_id: session.userId,
      lesson_pack_id: lessonPackId,
      title,
      subject,
      year_group: yearGroup,
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Schedule store unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, event: data });
}
