import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

// ── Time parsing ─────────────────────────────────────────────────────────────

function parseTime(str: string): string | null {
  str = str.trim().toLowerCase();
  const m12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const mins = m12[2] ? parseInt(m12[2], 10) : 0;
    const period = m12[3];
    if (period === "am" && h === 12) h = 0;
    if (period === "pm" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  }
  const m24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return `${String(parseInt(m24[1], 10)).padStart(2, "0")}:${m24[2]}:00`;
  return null;
}

function toTime(str: string): string {
  return str.length === 5 ? `${str}:00` : str;
}

// ── Date parsing (relative to today) ─────────────────────────────────────────

const DOW_MAP: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};

function nextWeekday(from: Date, targetDow: number): Date {
  const d = new Date(from);
  const current = d.getDay();
  const delta = ((targetDow - current + 7) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function parseDate(str: string, today: Date): Date | null {
  str = str.trim().toLowerCase();
  if (str === "today") return today;
  if (str === "tomorrow") {
    const d = new Date(today); d.setDate(d.getDate() + 1); return d;
  }
  if (str === "monday next week" || str === "next monday") return nextWeekday(new Date(today.getTime() + 7 * 86400000), 1);
  for (const [name, dow] of Object.entries(DOW_MAP)) {
    if (str === name || str === `next ${name}` || str === `this ${name}`) {
      return nextWeekday(today, dow);
    }
  }
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(`${str}T00:00:00`);
  // DD/MM or DD/MM/YYYY
  const dm = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (dm) {
    const year = dm[3] ? parseInt(dm[3], 10) : today.getFullYear();
    return new Date(year, parseInt(dm[2], 10) - 1, parseInt(dm[1], 10));
  }
  return null;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Subject/year group inference ──────────────────────────────────────────────

const SUBJECTS: Record<string, string> = {
  maths: "Maths", math: "Maths", numeracy: "Maths",
  english: "English", literacy: "English", writing: "English", reading: "English", phonics: "English",
  science: "Science",
  history: "History",
  geography: "Geography",
  art: "Art",
  pe: "PE", "p.e": "PE", sport: "PE", sports: "PE",
  music: "Music",
  computing: "Computing", it: "Computing", ict: "Computing", coding: "Computing",
  pshe: "PSHE", rhe: "PSHE",
  re: "RE", rs: "RE",
  dt: "D&T", "design technology": "D&T", "design and technology": "D&T",
  french: "French", spanish: "Spanish", german: "German",
};

const YEAR_GROUPS = ["year 1","year 2","year 3","year 4","year 5","year 6","year r","reception","nursery","eyfs","y1","y2","y3","y4","y5","y6"];

function inferSubject(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, label] of Object.entries(SUBJECTS)) {
    if (lower.includes(kw)) return label;
  }
  return "Other";
}

function inferYearGroup(text: string): string {
  const lower = text.toLowerCase();
  for (const yg of YEAR_GROUPS) {
    if (lower.includes(yg)) {
      if (yg === "y1") return "Year 1";
      if (yg === "y2") return "Year 2";
      if (yg === "y3") return "Year 3";
      if (yg === "y4") return "Year 4";
      if (yg === "y5") return "Year 5";
      if (yg === "y6") return "Year 6";
      if (yg === "reception" || yg === "year r") return "Reception";
      if (yg === "nursery") return "Nursery";
      if (yg === "eyfs") return "EYFS";
      return yg.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return "";
}

// ── Main parser ───────────────────────────────────────────────────────────────

type ParsedEvent = {
  title: string;
  subject: string;
  year_group: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
};

function parse(input: string, today: Date): ParsedEvent | null {
  let text = input.trim();
  if (!text) return null;

  // Extract time range: "2pm-3pm", "9am to 10am", "14:00-15:00"
  let startTime = "09:00:00";
  let endTime = "10:00:00";
  const rangeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:[-–]|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (rangeMatch) {
    const s = parseTime(rangeMatch[1].trim());
    const e = parseTime(rangeMatch[2].trim());
    if (s && e) { startTime = s; endTime = e; }
    text = text.replace(rangeMatch[0], " ").trim();
  } else {
    // Single time: "at 9am", "@ 14:00", "9:30", "2pm"
    const singleMatch = text.match(/(?:at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) ||
                        text.match(/\b(\d{1,2}:\d{2})\b/) ||
                        text.match(/\b(\d{1,2}\s*(?:am|pm))\b/i);
    if (singleMatch) {
      const s = parseTime(singleMatch[1].trim());
      if (s) {
        startTime = s;
        const [h, m] = s.split(":").map(Number);
        const endH = h + 1;
        endTime = `${String(endH < 24 ? endH : 23).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      }
      text = text.replace(singleMatch[0], " ").trim();
    }
  }

  // Extract date
  let scheduledDate = toISO(today);
  const dateKeywords = [
    "today", "tomorrow",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "mon", "tue", "wed", "thu", "fri", "sat", "sun",
    "next monday","next tuesday","next wednesday","next thursday","next friday",
    "this monday","this tuesday","this wednesday","this thursday","this friday",
  ];
  for (const kw of dateKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, "i");
    if (re.test(text)) {
      const d = parseDate(kw.toLowerCase(), today);
      if (d) { scheduledDate = toISO(d); text = text.replace(re, " ").trim(); break; }
    }
  }
  // ISO date in text
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) { scheduledDate = isoMatch[1]; text = text.replace(isoMatch[0], " ").trim(); }
  // DD/MM or DD/MM/YYYY
  const dmMatch = text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\b/);
  if (dmMatch) {
    const d = parseDate(dmMatch[1], today);
    if (d) { scheduledDate = toISO(d); text = text.replace(dmMatch[0], " ").trim(); }
  }

  const yearGroup = inferYearGroup(text);
  const subject = inferSubject(text);

  // Strip year group tokens from title
  let title = text;
  for (const yg of YEAR_GROUPS) {
    title = title.replace(new RegExp(`\\b${yg}\\b`, "i"), "").trim();
  }
  title = title.replace(/\s+/g, " ").trim();
  if (!title) return null;

  return { title, subject, year_group: yearGroup, scheduled_date: scheduledDate, start_time: startTime, end_time: endTime };
}

// ── Route ─────────────────────────────────────────────────────────────────────

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
  const input = String(body?.input || "").trim();
  const todayStr = String(body?.today || new Date().toISOString().slice(0, 10));

  if (!input) return NextResponse.json({ error: "input is required" }, { status: 400 });

  const today = new Date(`${todayStr}T00:00:00`);
  const parsed = parse(input, today);
  if (!parsed) {
    return NextResponse.json({ error: "Could not understand that. Try: 'Year 3 Maths tomorrow at 9am'" }, { status: 422 });
  }

  if (body?.preview === true) {
    return NextResponse.json({ ok: true, parsed });
  }

  const { data, error } = await supabase
    .from("lesson_schedule")
    .insert({
      user_id: session.userId,
      lesson_pack_id: null,
      title: parsed.title,
      subject: parsed.subject,
      year_group: parsed.year_group,
      scheduled_date: parsed.scheduled_date,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      event_type: "custom",
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not create event" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, event: data, parsed }, { status: 201 });
}
