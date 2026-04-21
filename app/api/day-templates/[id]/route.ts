import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

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
    .from("day_templates")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!existing?.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Blocks cascade-delete via FK
  const { error } = await supabase
    .from("day_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Could not delete template" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
