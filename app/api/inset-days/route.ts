import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

type DayType = "inset" | "bank_holiday" | "closure";

function normaliseDayType(value: unknown): DayType {
  const v = String(value || "inset").toLowerCase();
  if (v === "bank_holiday" || v === "closure") return v;
  return "inset";
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id || ""),
    event_date: String(row.event_date || ""),
    label: String(row.label || "INSET Day"),
    day_type: normaliseDayType(row.day_type),
  };
}

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("user_profile_inset_days")
    .select("*")
    .eq("user_id", session.userId)
    .order("event_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not fetch INSET days" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, insetDays: (Array.isArray(data) ? data : []).map(mapRow) });
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));

  // Accept array of inset days to bulk-replace
  const items = Array.isArray(body?.insetDays) ? body.insetDays : [];

  // Delete all existing and re-insert (simple replace strategy)
  await supabase.from("user_profile_inset_days").delete().eq("user_id", session.userId);

  if (items.length === 0) {
    return NextResponse.json({ ok: true, insetDays: [] });
  }

  const rows = items
    .filter((item: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(item?.event_date || "")))
    .map((item: any) => ({
      user_id: session.userId,
      event_date: String(item.event_date),
      label: item.label ? String(item.label).trim().slice(0, 100) : "INSET Day",
      day_type: normaliseDayType(item.day_type),
    }));

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, insetDays: [] });
  }

  const { data, error } = await supabase
    .from("user_profile_inset_days")
    .insert(rows)
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message || "Could not save INSET days" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, insetDays: (Array.isArray(data) ? data : []).map(mapRow) });
}
