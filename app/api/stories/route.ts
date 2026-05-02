export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { CreateStoryPayload } from "@/types/user-stories";

export async function GET(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const priority = searchParams.get("priority");

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  let query = supabase
    .from("user_stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (priority) query = query.eq("priority", priority);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load stories" }, { status: 503 });

  return NextResponse.json({ ok: true, stories: data });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const who = String(body.who ?? "").trim();
  const what = String(body.what ?? "").trim();
  const why = String(body.why ?? "").trim();

  if (!who || !what || !why) {
    return NextResponse.json({ error: "who, what, and why are required" }, { status: 400 });
  }

  const priority = (body.priority as CreateStoryPayload["priority"]) ?? null;
  const validPriorities = ["must", "should", "could", "wont"];
  if (priority && !validPriorities.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority value" }, { status: 400 });
  }

  const payload = {
    story_ref: "",
    who,
    what,
    why,
    priority: priority ?? null,
    priority_label: typeof body.priority_label === "string" ? body.priority_label : null,
    effort: typeof body.effort === "string" ? body.effort : null,
    acceptance_criteria: Array.isArray(body.acceptance_criteria)
      ? (body.acceptance_criteria as string[]).filter((c) => typeof c === "string" && c.trim())
      : [],
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    created_by: typeof body.created_by === "string" ? body.created_by.trim() || null : null,
  };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("user_stories")
    .insert(payload)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not create story" }, { status: 503 });

  return NextResponse.json({ ok: true, story: data }, { status: 201 });
}
