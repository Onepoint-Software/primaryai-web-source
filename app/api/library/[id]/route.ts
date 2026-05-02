export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("lesson_packs")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, item: data },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=90" } },
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }

  const updates: Record<string, unknown> = {};
  if ("folder_id" in body) updates.folder_id = body.folder_id ?? null;
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lesson_packs")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update lesson pack" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("lesson_packs")
    .delete()
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
