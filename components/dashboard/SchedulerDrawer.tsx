"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PackList, { type PackItem } from "./PackList";
import WeekCalendar, { type ScheduleEvent } from "./WeekCalendar";
import ScheduleModal, { type ModalPayload } from "./ScheduleModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.min(Math.floor(total / 60), 23);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export default function SchedulerDrawer({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [packs, setPacks] = useState<PackItem[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [packsLoading, setPacksLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dragRef = useRef<PackItem | null>(null);

  // Mount guard for portal
  useEffect(() => { setMounted(true); }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Load packs once on first open
  const packsLoaded = useRef(false);
  useEffect(() => {
    if (!open || packsLoaded.current) return;
    packsLoaded.current = true;
    setPacksLoading(true);
    fetch("/api/library")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items)) {
          setPacks(
            data.items.map((item: Record<string, string>) => ({
              id: item.id,
              title: item.title,
              subject: item.subject,
              yearGroup: item.year_group,
              topic: item.topic,
            }))
          );
        }
      })
      .catch(() => setError("Could not load packs."))
      .finally(() => setPacksLoading(false));
  }, [open]);

  // Load events for the current week
  const loadEvents = useCallback((monday: Date) => {
    setEventsLoading(true);
    setError("");
    fetch(`/api/schedule?weekStart=${toISO(monday)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.events)) {
          setEvents(
            data.events.map((e: Record<string, string>) => ({
              id: e.id,
              lessonPackId: e.lesson_pack_id,
              title: e.title,
              subject: e.subject,
              yearGroup: e.year_group,
              scheduledDate: e.scheduled_date,
              startTime: e.start_time.slice(0, 5),
              endTime: e.end_time.slice(0, 5),
              notes: e.notes,
            }))
          );
        }
      })
      .catch(() => setError("Could not load schedule."))
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (open) loadEvents(weekStart);
  }, [open, weekStart, loadEvents]);

  function handleWeekChange(delta: -1 | 1) {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  }

  function handleGoToday() {
    setWeekStart(getMondayOf(new Date()));
  }

  function handleDrop(date: string, slotTime: string) {
    const pack = dragRef.current;
    if (!pack) return;
    setModal({
      pack,
      date,
      startTime: slotTime,
      endTime: addMinutes(slotTime, 60),
    });
  }

  async function handleConfirm(data: { startTime: string; endTime: string; notes: string }) {
    if (!modal) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonPackId: modal.pack.id,
          title: modal.pack.title,
          subject: modal.pack.subject,
          yearGroup: modal.pack.yearGroup,
          scheduledDate: modal.date,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to save");
      const e = json.event;
      // Optimistic merge
      setEvents((prev) => [
        ...prev,
        {
          id: e.id,
          lessonPackId: e.lesson_pack_id,
          title: e.title,
          subject: e.subject,
          yearGroup: e.year_group,
          scheduledDate: e.scheduled_date,
          startTime: e.start_time.slice(0, 5),
          endTime: e.end_time.slice(0, 5),
          notes: e.notes,
        },
      ]);
      setModal(null);
    } catch {
      setError("Could not save event. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEventDelete(id: string) {
    // Optimistic removal
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      // Reload to restore correct state on failure
      setError("Could not remove event.");
      loadEvents(weekStart);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div className={`scheduler-backdrop${open ? " open" : ""}`} onClick={onClose} />
      <aside className={`scheduler-drawer${open ? " open" : ""}`} aria-label="Lesson scheduler" aria-modal="true" role="dialog">
        {/* Header */}
        <div className="scheduler-drawer-header">
          <h2 className="scheduler-drawer-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "0.45rem", verticalAlign: "-2px" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Lesson Scheduler
          </h2>
          {error && <span className="scheduler-error-banner">{error}</span>}
          {eventsLoading && !error && (
            <span className="scheduler-error-banner" style={{ color: "var(--muted)" }}>Loading…</span>
          )}
          <button className="scheduler-close-btn" onClick={onClose} aria-label="Close scheduler">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="scheduler-drawer-inner">
          <PackList
            packs={packs}
            loading={packsLoading}
            onDragStart={(pack) => { dragRef.current = pack; }}
            onDragEnd={() => { dragRef.current = null; }}
          />

          <WeekCalendar
            events={events}
            weekStart={weekStart}
            onWeekChange={handleWeekChange}
            onGoToday={handleGoToday}
            onDrop={handleDrop}
            onEventDelete={handleEventDelete}
          />
        </div>

        {/* Time picker modal */}
        {modal && (
          <ScheduleModal
            payload={modal}
            saving={saving}
            onConfirm={handleConfirm}
            onCancel={() => { setModal(null); dragRef.current = null; }}
          />
        )}
      </aside>
    </>,
    document.body
  );
}
