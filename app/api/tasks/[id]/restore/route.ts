export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Task store unavailable" }, { status: 503 });
  }

  const { id } = await params;

  const { data: existing } = await supabase
    .from("personal_tasks")
    .select("id,schedule_event_id")
    .eq("id", id)
    .eq("user_id", session.userId)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (!existing?.id) {
    return NextResponse.json({ error: "Task not found in trash" }, { status: 404 });
  }

  const { error } = await supabase
    .from("personal_tasks")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Could not restore task" }, { status: 503 });
  }

  if (existing.schedule_event_id) {
    await supabase
      .from("lesson_schedule")
      .update({ deleted_at: null })
      .eq("id", existing.schedule_event_id)
      .eq("user_id", session.userId);
  }

  return NextResponse.json({ ok: true });
}
