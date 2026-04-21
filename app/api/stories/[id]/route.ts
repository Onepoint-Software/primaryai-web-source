import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Story not found" }, { status: 404 });
  return NextResponse.json({ ok: true, story: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const updates: Record<string, unknown> = {};
  if ("who" in body) updates.who = String(body.who ?? "").trim();
  if ("what" in body) updates.what = String(body.what ?? "").trim();
  if ("why" in body) updates.why = String(body.why ?? "").trim();
  if ("priority" in body) updates.priority = body.priority ?? null;
  if ("priority_label" in body) updates.priority_label = body.priority_label ?? null;
  if ("effort" in body) updates.effort = body.effort ?? null;
  if ("notes" in body) updates.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  if ("created_by" in body) updates.created_by = typeof body.created_by === "string" ? body.created_by.trim() || null : null;
  if ("acceptance_criteria" in body && Array.isArray(body.acceptance_criteria)) {
    updates.acceptance_criteria = (body.acceptance_criteria as string[]).filter(
      (c) => typeof c === "string" && c.trim()
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_stories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not update story" }, { status: 503 });
  return NextResponse.json({ ok: true, story: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("user_stories")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Could not delete story" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
