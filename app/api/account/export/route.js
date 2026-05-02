export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const uid = session.userId;

  const [
    profileSetup,
    profile,
    terms,
    preferences,
    lessonPacks,
    schedule,
    tasks,
    notes,
    googleConn,
    outlookConn,
  ] = await Promise.all([
    supabase.from("user_profile_setup").select("display_name, avatar_url, profile_completed, created_at, updated_at").eq("user_id", uid).maybeSingle(),
    supabase.from("teacher_profiles").select("default_year_group, default_subject, tone, school_type, send_focus, auto_save, class_notes, teaching_approach, ability_mix, eal_percent, pupil_premium_percent, above_standard_percent, below_standard_percent, hugely_above_standard_percent, hugely_below_standard_percent, updated_at").eq("user_id", uid).maybeSingle(),
    supabase.from("user_profile_terms").select("term_name, term_start_date, term_end_date").eq("user_id", uid),
    supabase.from("user_preferences").select("theme, palette, updated_at").eq("user_id", uid).maybeSingle(),
    supabase.from("lesson_packs").select("id, title, year_group, subject, topic, created_at, updated_at").eq("user_id", uid),
    supabase.from("lesson_schedule").select("id, title, subject, year_group, scheduled_date, start_time, end_time, notes, created_at").eq("user_id", uid),
    supabase.from("personal_tasks").select("id, title, due_date, due_time, completed, created_at").eq("user_id", uid),
    supabase.from("teacher_notes").select("id, title, created_at, updated_at, pinned").eq("user_id", uid),
    supabase.from("google_calendar_connections").select("email, scope, updated_at").eq("user_id", uid).maybeSingle(),
    supabase.from("outlook_calendar_connections").select("email, scope, updated_at").eq("user_id", uid).maybeSingle(),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: {
      userId: uid,
      email: session.email ?? null,
    },
    profile: profileSetup.data ?? null,
    teacherSettings: profile.data ?? null,
    termDates: terms.data ?? [],
    preferences: preferences.data ?? null,
    lessonPacks: lessonPacks.data ?? [],
    schedule: schedule.data ?? [],
    tasks: tasks.data ?? [],
    notes: notes.data ?? [],
    connectedCalendars: {
      google: googleConn.data ? { email: googleConn.data.email, scope: googleConn.data.scope, connectedAt: googleConn.data.updated_at } : null,
      outlook: outlookConn.data ? { email: outlookConn.data.email, scope: outlookConn.data.scope, connectedAt: outlookConn.data.updated_at } : null,
    },
  };

  const filename = `primaryai-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
