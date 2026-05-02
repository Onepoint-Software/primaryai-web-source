export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

function normaliseImportance(value: unknown): "low" | "high" {
  return String(value || "").toLowerCase() === "high" ? "high" : "low";
}

function mapTask(task: Record<string, unknown>) {
  return {
    id: String(task.id || ""),
    title: String(task.title || ""),
    due_date: String(task.due_date || ""),
    due_time: task.due_time ? String(task.due_time).slice(0, 5) : null,
    importance: normaliseImportance(task.importance),
    completed: Boolean(task.completed),
    priority: task.priority ? String(task.priority) : null,
    label: task.label ? String(task.label) : null,
    deleted_at: String(task.deleted_at || ""),
  };
}

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Task store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("personal_tasks")
    .select("id,title,due_date,due_time,importance,completed,priority,label,deleted_at")
    .eq("user_id", session.userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Could not fetch deleted tasks" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, tasks: (Array.isArray(data) ? data : []).map(mapTask) });
}

export async function DELETE() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Task store unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("personal_tasks")
    .delete()
    .eq("user_id", session.userId)
    .not("deleted_at", "is", null);

  if (error) {
    return NextResponse.json({ error: "Could not empty trash" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
