"use client";

import { useState } from "react";
import { subjectColor } from "@/lib/subjectColor";

export type ScheduleEvent = {
  id: string;
  lessonPackId: string;
  title: string;
  subject: string;
  yearGroup: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  notes?: string;
};

type Props = {
  events: ScheduleEvent[];
  weekStart: Date;
  onWeekChange: (delta: -1 | 1) => void;
  onGoToday: () => void;
  onDrop: (date: string, slotTime: string) => void;
  onEventDelete: (id: string) => void;
};

// 08:00 → 18:00 in 30-min steps = 20 slots
const HOUR_START = 8;
const SLOT_COUNT = 20;

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const h = HOUR_START + Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    slots.push(`${String(h).padStart(2, "0")}:${m}`);
  }
  return slots;
}
const SLOTS = buildSlots();

function timeToSlotIndex(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - HOUR_START) * 2 + (m >= 30 ? 1 : 0);
}

function durationToSlots(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(1, Math.round(mins / 30));
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatWeekLabel(monday: Date): string {
  const friday = addDays(monday, 4);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("en-GB", opts)} – ${friday.toLocaleDateString("en-GB", opts)}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeekCalendar({ events, weekStart, onWeekChange, onGoToday, onDrop, onEventDelete }: Props) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const todayISO = toISO(new Date());

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { iso: toISO(d), date: d, label: DAY_NAMES[i], dayNum: d.getDate() };
  });

  // Map events to (dayIndex, slotIndex) for rendering
  const eventsBySlot: Record<string, ScheduleEvent[]> = {};
  for (const evt of events) {
    const dayIdx = weekDays.findIndex((d) => d.iso === evt.scheduledDate);
    if (dayIdx < 0) continue;
    const slotIdx = timeToSlotIndex(evt.startTime);
    if (slotIdx < 0 || slotIdx >= SLOT_COUNT) continue;
    const key = `${dayIdx}-${slotIdx}`;
    (eventsBySlot[key] ??= []).push(evt);
  }

  function slotKey(dayIdx: number, slotIdx: number) {
    return `${dayIdx}-${slotIdx}`;
  }

  return (
    <div className="scheduler-cal-panel">
      {/* Week navigation */}
      <div className="scheduler-week-nav">
        <button className="scheduler-week-btn" onClick={() => onWeekChange(-1)} aria-label="Previous week">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
        </button>
        <button className="scheduler-week-btn" onClick={() => onWeekChange(1)} aria-label="Next week">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
        </button>
        <span className="scheduler-week-label">{formatWeekLabel(weekStart)}</span>
        <button className="scheduler-today-btn" onClick={onGoToday}>Today</button>
      </div>

      {/* Calendar grid */}
      <div className="scheduler-cal-scroll">
        <div className="scheduler-cal-grid">
          {/* Corner cell */}
          <div className="scheduler-col-header" style={{ borderRight: "1px solid var(--border)" }} />

          {/* Day headers */}
          {weekDays.map((day) => (
            <div key={day.iso} className={`scheduler-col-header${day.iso === todayISO ? " today" : ""}`}>
              <div className="scheduler-col-header-day">{day.label}</div>
              <div className="scheduler-col-header-date">{day.dayNum}</div>
            </div>
          ))}

          {/* Time rows */}
          {SLOTS.map((slot, slotIdx) => (
            <>
              {/* Time label */}
              <div key={`label-${slot}`} className="scheduler-time-label">
                {slot.endsWith(":00") ? slot : ""}
              </div>

              {/* Slot cells for each day */}
              {weekDays.map((day, dayIdx) => {
                const key = slotKey(dayIdx, slotIdx);
                const slotEvents = eventsBySlot[key] ?? [];

                return (
                  <div
                    key={`${day.iso}-${slot}`}
                    className={`scheduler-slot${dragOverSlot === `${dayIdx}-${slotIdx}` ? " drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverSlot(`${dayIdx}-${slotIdx}`); }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverSlot(null);
                      onDrop(day.iso, slot);
                    }}
                  >
                    {slotEvents.map((evt) => {
                      const color = subjectColor(evt.subject);
                      const spanSlots = durationToSlots(evt.startTime, evt.endTime);
                      return (
                        <div
                          key={evt.id}
                          className="scheduler-event"
                          style={{
                            height: `calc(${spanSlots * 34}px - 2px)`,
                            background: `color-mix(in srgb, ${color} 20%, var(--surface))`,
                            borderLeft: `3px solid ${color}`,
                            color: "var(--text)",
                          }}
                          title={`${evt.title} · ${evt.startTime}–${evt.endTime}`}
                        >
                          <span className="scheduler-event-title">{evt.title}</span>
                          <span className="scheduler-event-time">{evt.startTime}–{evt.endTime}</span>
                          <button
                            className="scheduler-event-delete"
                            onClick={(e) => { e.stopPropagation(); onEventDelete(evt.id); }}
                            aria-label={`Remove ${evt.title}`}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
