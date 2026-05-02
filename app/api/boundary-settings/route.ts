export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

type SuggestionTone = "direct" | "neutral" | "warm";
type CountdownMode = "days" | "sleeps" | "getups";

const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULTS = {
  work_day_start: "08:00",
  work_day_end: "17:00",
  protect_lunch: false,
  lunch_start: "12:00",
  lunch_end: "13:00",
  nights_off: [] as string[],
  suggestion_tone: "neutral" as SuggestionTone,
  dyslexia_font: false,
  reduce_motion: false,
  countdown_mode: "days" as CountdownMode,
};

function normaliseTime(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.slice(0, 5);
  return null;
}

function normaliseSuggestionTone(value: unknown): SuggestionTone {
  const v = String(value || "neutral").toLowerCase();
  if (v === "direct" || v === "warm") return v;
  return "neutral";
}

function normaliseCountdownMode(value: unknown): CountdownMode {
  const v = String(value || "days").toLowerCase();
  if (v === "sleeps" || v === "getups") return v;
  return "days";
}

function normaliseNightsOff(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((d) => String(d || "").toLowerCase()).filter((d) => DAYS_OF_WEEK.includes(d));
}

function mapSettings(row: Record<string, unknown>) {
  return {
    work_day_start: row.work_day_start ? String(row.work_day_start).slice(0, 5) : DEFAULTS.work_day_start,
    work_day_end: row.work_day_end ? String(row.work_day_end).slice(0, 5) : DEFAULTS.work_day_end,
    protect_lunch: Boolean(row.protect_lunch ?? DEFAULTS.protect_lunch),
    lunch_start: row.lunch_start ? String(row.lunch_start).slice(0, 5) : DEFAULTS.lunch_start,
    lunch_end: row.lunch_end ? String(row.lunch_end).slice(0, 5) : DEFAULTS.lunch_end,
    nights_off: Array.isArray(row.nights_off) ? row.nights_off : DEFAULTS.nights_off,
    suggestion_tone: normaliseSuggestionTone(row.suggestion_tone),
    dyslexia_font: Boolean(row.dyslexia_font ?? DEFAULTS.dyslexia_font),
    reduce_motion: Boolean(row.reduce_motion ?? DEFAULTS.reduce_motion),
    countdown_mode: normaliseCountdownMode(row.countdown_mode),
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
    .from("user_profile_settings")
    .select(
      "work_day_start,work_day_end,protect_lunch,lunch_start,lunch_end,nights_off,suggestion_tone,dyslexia_font,reduce_motion,countdown_mode",
    )
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not fetch settings" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, settings: mapSettings((data as Record<string, unknown>) ?? {}) });
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

  const patch: Record<string, unknown> = { user_id: session.userId, updated_at: new Date().toISOString() };

  if (body?.workDayStart !== undefined || body?.work_day_start !== undefined) {
    const t = normaliseTime(body.workDayStart ?? body.work_day_start);
    if (t) patch.work_day_start = t;
  }
  if (body?.workDayEnd !== undefined || body?.work_day_end !== undefined) {
    const t = normaliseTime(body.workDayEnd ?? body.work_day_end);
    if (t) patch.work_day_end = t;
  }
  if (body?.protectLunch !== undefined || body?.protect_lunch !== undefined) {
    patch.protect_lunch = Boolean(body.protectLunch ?? body.protect_lunch);
  }
  if (body?.lunchStart !== undefined || body?.lunch_start !== undefined) {
    const t = normaliseTime(body.lunchStart ?? body.lunch_start);
    if (t) patch.lunch_start = t;
  }
  if (body?.lunchEnd !== undefined || body?.lunch_end !== undefined) {
    const t = normaliseTime(body.lunchEnd ?? body.lunch_end);
    if (t) patch.lunch_end = t;
  }
  if (body?.nightsOff !== undefined || body?.nights_off !== undefined) {
    patch.nights_off = normaliseNightsOff(body.nightsOff ?? body.nights_off);
  }
  if (body?.suggestionTone !== undefined || body?.suggestion_tone !== undefined) {
    patch.suggestion_tone = normaliseSuggestionTone(body.suggestionTone ?? body.suggestion_tone);
  }
  if (body?.dyslexiaFont !== undefined || body?.dyslexia_font !== undefined) {
    patch.dyslexia_font = Boolean(body.dyslexiaFont ?? body.dyslexia_font);
  }
  if (body?.reduceMotion !== undefined || body?.reduce_motion !== undefined) {
    patch.reduce_motion = Boolean(body.reduceMotion ?? body.reduce_motion);
  }
  if (body?.countdownMode !== undefined || body?.countdown_mode !== undefined) {
    patch.countdown_mode = normaliseCountdownMode(body.countdownMode ?? body.countdown_mode);
  }

  const { data, error } = await supabase
    .from("user_profile_settings")
    .upsert(patch, { onConflict: "user_id" })
    .select(
      "work_day_start,work_day_end,protect_lunch,lunch_start,lunch_end,nights_off,suggestion_tone,dyslexia_font,reduce_motion,countdown_mode",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message || "Could not save settings" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, settings: mapSettings((data as Record<string, unknown>) ?? patch) });
}
