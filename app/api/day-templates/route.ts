export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

type Block = {
  title: string;
  subject?: string;
  year_group?: string;
  start_time: string;
  end_time: string;
  event_type?: string;
  event_category?: string | null;
  effort?: string | null;
  notes?: string | null;
};

function mapTemplate(t: Record<string, unknown>, blocks: Block[] = []) {
  return {
    id: String(t.id || ""),
    name: String(t.name || ""),
    day_of_week: String(t.day_of_week || ""),
    created_at: String(t.created_at || ""),
    blocks,
  };
}

function normaliseTime(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) return raw.length === 5 ? `${raw}:00` : raw;
  return null;
}

const VALID_DOW = ["mon", "tue", "wed", "thu", "fri"];

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { data: templates, error } = await supabase
    .from("day_templates")
    .select("id,name,day_of_week,created_at")
    .eq("user_id", session.userId)
    .order("day_of_week")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: "Could not fetch templates" }, { status: 503 });
  }

  const ids = (Array.isArray(templates) ? templates : []).map((t: any) => t.id);
  let blocksMap: Record<string, Block[]> = {};

  if (ids.length > 0) {
    const { data: blocks } = await supabase
      .from("day_template_blocks")
      .select("id,template_id,title,subject,year_group,start_time,end_time,event_type,event_category,effort,notes")
      .in("template_id", ids)
      .order("start_time");

    for (const b of Array.isArray(blocks) ? blocks : []) {
      const tid = String((b as any).template_id || "");
      if (!blocksMap[tid]) blocksMap[tid] = [];
      blocksMap[tid].push(b as Block);
    }
  }

  return NextResponse.json({
    ok: true,
    templates: (Array.isArray(templates) ? templates : []).map((t: any) =>
      mapTemplate(t, blocksMap[String(t.id)] ?? [])
    ),
  });
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
  const name = String(body?.name || "").trim().slice(0, 100);
  const dayOfWeek = String(body?.dayOfWeek || body?.day_of_week || "").toLowerCase();

  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  if (!VALID_DOW.includes(dayOfWeek)) {
    return NextResponse.json({ error: "dayOfWeek must be mon/tue/wed/thu/fri" }, { status: 400 });
  }

  const rawBlocks: any[] = Array.isArray(body?.blocks) ? body.blocks : [];
  const blocks = rawBlocks
    .filter((b) => normaliseTime(b?.start_time) && normaliseTime(b?.end_time) && String(b?.title || "").trim())
    .map((b) => ({
      title: String(b.title || "").trim().slice(0, 200),
      subject: String(b.subject || "").trim().slice(0, 100),
      year_group: String(b.year_group || "").trim().slice(0, 100),
      start_time: normaliseTime(b.start_time)!,
      end_time: normaliseTime(b.end_time)!,
      event_type: ["lesson_pack", "custom"].includes(String(b.event_type || "")) ? String(b.event_type) : "lesson_pack",
      event_category: b.event_category ? String(b.event_category).trim().slice(0, 50) : null,
      effort: ["low", "medium", "high"].includes(String(b.effort || "")) ? String(b.effort) : null,
      notes: b.notes ? String(b.notes).trim().slice(0, 1000) : null,
    }));

  const { data: template, error: tErr } = await supabase
    .from("day_templates")
    .insert({ user_id: session.userId, name, day_of_week: dayOfWeek })
    .select("id,name,day_of_week,created_at")
    .single();

  if (tErr || !template) {
    return NextResponse.json({ error: "Could not create template" }, { status: 503 });
  }

  if (blocks.length > 0) {
    await supabase
      .from("day_template_blocks")
      .insert(blocks.map((b) => ({ ...b, template_id: template.id })));
  }

  return NextResponse.json({ ok: true, template: mapTemplate(template, blocks) }, { status: 201 });
}
