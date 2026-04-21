import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getSupabaseAdminClient } from "@/lib/supabase";

type Suggestion = {
  id: string;
  type: "overload" | "boundary" | "gap" | "balance" | "snooze_due" | "inset";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  date?: string;
  actionLabel?: string;
  actionHref?: string;
};

type BoundarySettings = {
  work_day_start: string;
  work_day_end: string;
  protect_lunch: boolean;
  lunch_start: string;
  lunch_end: string;
  nights_off: string[];
  suggestion_tone: string;
};

type LessonEvent = {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  effort: string | null;
  event_type: string;
  deleted_at: string | null;
};

type PersonalTask = {
  id: string;
  due_date: string;
  snoozed_until: string | null;
  completed: boolean;
  deleted_at: string | null;
  priority: string | null;
  label: string | null;
};

function toMinutes(t: string): number {
  const [h, m] = String(t || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

function dayOfWeek(dateStr: string): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const d = new Date(dateStr);
  return days[d.getDay()] ?? "mon";
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function groupByDate(events: LessonEvent[]): Map<string, LessonEvent[]> {
  const map = new Map<string, LessonEvent[]>();
  for (const ev of events) {
    const arr = map.get(ev.scheduled_date) ?? [];
    arr.push(ev);
    map.set(ev.scheduled_date, arr);
  }
  return map;
}

function effortScore(effort: string | null): number {
  if (effort === "high") return 3;
  if (effort === "medium") return 2;
  return 1;
}

export async function GET(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const today = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // Look ahead 14 days
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 14);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);

  const [settingsRes, eventsRes, tasksRes, insetRes] = await Promise.all([
    supabase
      .from("user_profile_settings")
      .select("work_day_start,work_day_end,protect_lunch,lunch_start,lunch_end,nights_off,suggestion_tone")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("lesson_schedule")
      .select("id,scheduled_date,start_time,end_time,effort,event_type,deleted_at")
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .gte("scheduled_date", today)
      .lte("scheduled_date", windowEndStr),
    supabase
      .from("personal_tasks")
      .select("id,due_date,snoozed_until,completed,deleted_at,priority,label")
      .eq("user_id", session.userId)
      .eq("completed", false)
      .is("deleted_at", null)
      .lte("due_date", windowEndStr),
    supabase
      .from("user_profile_inset_days")
      .select("event_date,label,day_type")
      .eq("user_id", session.userId)
      .gte("event_date", today)
      .lte("event_date", windowEndStr),
  ]);

  const settings: BoundarySettings = {
    work_day_start: settingsRes.data?.work_day_start
      ? String(settingsRes.data.work_day_start).slice(0, 5)
      : "08:00",
    work_day_end: settingsRes.data?.work_day_end
      ? String(settingsRes.data.work_day_end).slice(0, 5)
      : "17:00",
    protect_lunch: Boolean(settingsRes.data?.protect_lunch),
    lunch_start: settingsRes.data?.lunch_start
      ? String(settingsRes.data.lunch_start).slice(0, 5)
      : "12:00",
    lunch_end: settingsRes.data?.lunch_end
      ? String(settingsRes.data.lunch_end).slice(0, 5)
      : "13:00",
    nights_off: Array.isArray(settingsRes.data?.nights_off) ? settingsRes.data.nights_off : [],
    suggestion_tone: String(settingsRes.data?.suggestion_tone || "neutral"),
  };

  const events: LessonEvent[] = Array.isArray(eventsRes.data) ? eventsRes.data : [];
  const tasks: PersonalTask[] = Array.isArray(tasksRes.data) ? tasksRes.data : [];
  const insetDays = Array.isArray(insetRes.data) ? insetRes.data : [];

  const suggestions: Suggestion[] = [];
  const insetDates = new Set(insetDays.map((d: any) => String(d.event_date)));

  // ── INSET days with lessons scheduled ──
  for (const inset of insetDays) {
    const date = String(inset.event_date);
    const lessonsOnInset = events.filter((e) => e.scheduled_date === date && e.event_type === "lesson_pack");
    if (lessonsOnInset.length > 0) {
      suggestions.push({
        id: `inset-${date}`,
        type: "inset",
        severity: "warning",
        title: `Lessons scheduled on ${inset.label ?? "INSET Day"}`,
        body: `You have ${lessonsOnInset.length} lesson${lessonsOnInset.length > 1 ? "s" : ""} on ${friendlyDate(date)}, which is marked as an ${inset.day_type ?? "INSET"} day.`,
        date,
        actionLabel: "View planner",
        actionHref: `/dashboard?date=${date}`,
      });
    }
  }

  // ── Per-day analysis ──
  const byDate = groupByDate(events);

  for (const [date, dayEvents] of byDate) {
    if (insetDates.has(date)) continue;

    const dow = dayOfWeek(date);
    const isNightOff = settings.nights_off.includes(dow);

    const workStart = toMinutes(settings.work_day_start);
    const workEnd = toMinutes(settings.work_day_end);
    const workCapacity = workEnd - workStart;

    // Total scheduled minutes
    let scheduledMinutes = 0;
    let overrunMinutes = 0;

    for (const ev of dayEvents) {
      const start = toMinutes(String(ev.start_time || "00:00").slice(0, 5));
      const end = toMinutes(String(ev.end_time || "00:00").slice(0, 5));
      const duration = Math.max(0, end - start);
      scheduledMinutes += duration;

      // Boundary breach: event ends after work_day_end
      if (end > workEnd) {
        overrunMinutes = Math.max(overrunMinutes, end - workEnd);
      }
    }

    // Overload: scheduled > 110% of work capacity
    if (scheduledMinutes > workCapacity * 1.1) {
      const excess = scheduledMinutes - workCapacity;
      suggestions.push({
        id: `overload-${date}`,
        type: "overload",
        severity: excess > 60 ? "critical" : "warning",
        title: `Heavy day on ${friendlyDate(date)}`,
        body: `You have ${minutesToLabel(scheduledMinutes)} of lessons planned against a ${minutesToLabel(workCapacity)} working day — ${minutesToLabel(excess)} over your limit.`,
        date,
        actionLabel: "Adjust planner",
        actionHref: `/dashboard?date=${date}`,
      });
    }

    // Boundary breach
    if (overrunMinutes > 0) {
      suggestions.push({
        id: `boundary-${date}`,
        type: "boundary",
        severity: overrunMinutes > 60 ? "critical" : "warning",
        title: `Late finish on ${friendlyDate(date)}`,
        body: `Events run ${minutesToLabel(overrunMinutes)} past your ${settings.work_day_end} finish time.`,
        date,
        actionLabel: "View planner",
        actionHref: `/dashboard?date=${date}`,
      });
    }

    // Night off breach
    if (isNightOff && dayEvents.length > 0) {
      suggestions.push({
        id: `nightoff-${date}`,
        type: "boundary",
        severity: "info",
        title: `${friendlyDate(date)} is a protected evening`,
        body: `You've marked ${dow} as a night off, but have ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} scheduled.`,
        date,
      });
    }

    // Lunch protection
    if (settings.protect_lunch) {
      const lunchStart = toMinutes(settings.lunch_start);
      const lunchEnd = toMinutes(settings.lunch_end);
      const lunchClash = dayEvents.filter((ev) => {
        const start = toMinutes(String(ev.start_time || "00:00").slice(0, 5));
        const end = toMinutes(String(ev.end_time || "00:00").slice(0, 5));
        return start < lunchEnd && end > lunchStart;
      });
      if (lunchClash.length > 0) {
        suggestions.push({
          id: `lunch-${date}`,
          type: "boundary",
          severity: "info",
          title: `Lunch break clash on ${friendlyDate(date)}`,
          body: `${lunchClash.length} event${lunchClash.length > 1 ? "s" : ""} overlap your protected lunch (${settings.lunch_start}–${settings.lunch_end}).`,
          date,
          actionLabel: "View planner",
          actionHref: `/dashboard?date=${date}`,
        });
      }
    }

    // High-effort day: 3+ high-effort lessons
    const highEffortCount = dayEvents.filter((e) => e.effort === "high").length;
    if (highEffortCount >= 3) {
      suggestions.push({
        id: `effort-${date}`,
        type: "balance",
        severity: "info",
        title: `Marking-heavy day on ${friendlyDate(date)}`,
        body: `${highEffortCount} high-effort lessons are planned — consider spreading marking load.`,
        date,
        actionLabel: "View planner",
        actionHref: `/dashboard?date=${date}`,
      });
    }
  }

  // ── Overdue / snooze-due tasks ──
  const todayDate = new Date(today);
  for (const task of tasks) {
    const due = new Date(task.due_date);
    const snoozedUntil = task.snoozed_until ? new Date(task.snoozed_until) : null;

    // Snooze expired: snoozed_until is in the past
    if (snoozedUntil && snoozedUntil <= todayDate) {
      suggestions.push({
        id: `snooze-${task.id}`,
        type: "snooze_due",
        severity: "info",
        title: "Snoozed task needs attention",
        body: `A ${task.priority ? task.priority.toUpperCase() + " " : ""}task snoozed until ${friendlyDate(task.snoozed_until!)} is now due.`,
        date: task.due_date,
        actionLabel: "Go to tasks",
        actionHref: "/dashboard?tab=tasks",
      });
    }

    // P1 overdue
    if (task.priority === "p1" && due < todayDate) {
      suggestions.push({
        id: `p1-overdue-${task.id}`,
        type: "overload",
        severity: "critical",
        title: "Overdue P1 task",
        body: `A P1 task was due on ${friendlyDate(task.due_date)} and hasn't been completed.`,
        date: task.due_date,
        actionLabel: "Go to tasks",
        actionHref: "/dashboard?tab=tasks",
      });
    }
  }

  // ── Gap detection: days with no lessons in the planning window ──
  const planningDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.toLocaleDateString("en-CA");
    const dayName = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
    if (!["sat", "sun"].includes(dayName) && !insetDates.has(dow)) {
      planningDays.push(dow);
    }
  }

  const emptyDays = planningDays.filter((d) => !byDate.has(d) || (byDate.get(d) ?? []).length === 0);
  if (emptyDays.length >= 2) {
    suggestions.push({
      id: `gap-this-week`,
      type: "gap",
      severity: "info",
      title: `${emptyDays.length} unplanned days this week`,
      body: `You have no lessons scheduled on ${emptyDays.slice(0, 3).map(friendlyDate).join(", ")}${emptyDays.length > 3 ? " and more" : ""}.`,
      actionLabel: "Open planner",
      actionHref: "/dashboard",
    });
  }

  // Deduplicate by id and sort: critical → warning → info
  const deduped = Array.from(new Map(suggestions.map((s) => [s.id, s])).values());
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  deduped.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  return NextResponse.json({ ok: true, suggestions: deduped, generatedAt: new Date().toISOString() });
}
