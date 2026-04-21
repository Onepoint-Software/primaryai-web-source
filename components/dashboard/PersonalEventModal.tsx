"use client";

import { useState } from "react";

type RepeatRule = "none" | "daily" | "weekly" | "custom";

type Props = {
  date: string;
  saving: boolean;
  onConfirm: (data: {
    title: string;
    allDay: boolean;
    eventDate: string | null;
    startAt: string | null;
    endAt: string | null;
    repeatRule: RepeatRule;
    repeatDays: string[];
    validFrom: string | null;
    validTo: string | null;
    colour: string;
    notes: string;
  }) => void;
  onCancel: () => void;
};

const COLOUR_OPTIONS = [
  { value: "teal", hex: "#14b8a6" },
  { value: "blue", hex: "#3b82f6" },
  { value: "purple", hex: "#a855f7" },
  { value: "pink", hex: "#ec4899" },
  { value: "orange", hex: "#f97316" },
  { value: "green", hex: "#22c55e" },
  { value: "red", hex: "#ef4444" },
  { value: "yellow", hex: "#eab308" },
];

const DOW_OPTIONS = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "T" },
  { value: "fri", label: "F" },
  { value: "sat", label: "S" },
  { value: "sun", label: "S" },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

export default function PersonalEventModal({ date, saving, onConfirm, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [eventDate, setEventDate] = useState(date);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [repeatRule, setRepeatRule] = useState<RepeatRule>("none");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState(date);
  const [validTo, setValidTo] = useState("");
  const [colour, setColour] = useState("teal");
  const [notes, setNotes] = useState("");

  function toggleRepeatDay(day: string) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleConfirm() {
    if (!title.trim()) return;
    const isRecurring = repeatRule !== "none";
    onConfirm({
      title: title.trim(),
      allDay,
      eventDate: !isRecurring ? eventDate : null,
      startAt: !allDay ? `${eventDate}T${startTime}:00` : null,
      endAt: !allDay ? `${eventDate}T${endTime}:00` : null,
      repeatRule,
      repeatDays: repeatRule === "custom" ? repeatDays : [],
      validFrom: isRecurring ? validFrom : null,
      validTo: isRecurring && validTo ? validTo : null,
      colour,
      notes: notes.trim(),
    });
  }

  const INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.75rem",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    background: "var(--field-bg)",
    color: "var(--text)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const LABEL_STYLE: React.CSSProperties = {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: "0.35rem",
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="card"
        style={{ maxWidth: 480, width: "100%", margin: 0, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>
              Life Comes First
            </p>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
              Add personal event
            </h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{formatDate(date)}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.25rem" }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div>
          <label style={LABEL_STYLE}>Event name</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Doctor appointment, Kids play…"
            style={INPUT_STYLE}
          />
        </div>

        {/* Date */}
        <div>
          <label style={LABEL_STYLE}>Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* All day toggle */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          onClick={() => setAllDay((v) => !v)}
        >
          <span style={{ fontSize: "0.88rem", color: "var(--text)", fontWeight: 500 }}>All day</span>
          <button
            type="button"
            role="switch"
            aria-checked={allDay}
            style={{
              width: "44px", height: "24px", borderRadius: "999px", border: "none", padding: "2px",
              cursor: "pointer", background: allDay ? "var(--accent)" : "var(--border)",
              display: "flex", alignItems: "center", justifyContent: allDay ? "flex-end" : "flex-start",
            }}
            onClick={(e) => { e.stopPropagation(); setAllDay((v) => !v); }}
          >
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", display: "block", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          </button>
        </div>

        {!allDay && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={LABEL_STYLE}>Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>End time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
        )}

        {/* Colour */}
        <div>
          <label style={LABEL_STYLE}>Colour</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {COLOUR_OPTIONS.map(({ value, hex }) => (
              <button
                key={value}
                type="button"
                onClick={() => setColour(value)}
                style={{
                  width: "26px", height: "26px", borderRadius: "50%", background: hex, border: "none",
                  cursor: "pointer", outline: colour === value ? `3px solid ${hex}` : "3px solid transparent",
                  outlineOffset: "2px", transition: "outline 150ms ease",
                }}
                aria-label={value}
              />
            ))}
          </div>
        </div>

        {/* Repeat */}
        <div>
          <label style={LABEL_STYLE}>Repeat</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["none", "daily", "weekly", "custom"] as const).map((rule) => {
              const labels = { none: "Once", daily: "Daily", weekly: "Weekly", custom: "Custom days" };
              const sel = repeatRule === rule;
              return (
                <button
                  key={rule}
                  type="button"
                  onClick={() => setRepeatRule(rule)}
                  style={{
                    padding: "0.28rem 0.65rem", borderRadius: "999px",
                    border: `1.5px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                    background: sel ? "rgb(var(--accent-rgb) / 0.1)" : "transparent",
                    color: sel ? "var(--accent)" : "var(--muted)",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {labels[rule]}
                </button>
              );
            })}
          </div>

          {repeatRule === "custom" && (
            <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.6rem" }}>
              {DOW_OPTIONS.map(({ value, label }) => {
                const sel = repeatDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRepeatDay(value)}
                    style={{
                      width: "30px", height: "30px", borderRadius: "50%", border: "none",
                      background: sel ? "var(--accent)" : "var(--border)",
                      color: sel ? "white" : "var(--muted)",
                      fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {repeatRule !== "none" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
              <div>
                <label style={LABEL_STYLE}>From</label>
                <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Until (optional)</label>
                <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} style={INPUT_STYLE} />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={LABEL_STYLE}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any context…"
            style={{ ...INPUT_STYLE, resize: "vertical" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{ padding: "0.48rem 1.1rem", borderRadius: "9px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!title.trim() || saving}
            className="nav-btn-cta"
            style={{ padding: "0.48rem 1.2rem", fontSize: "0.84rem", borderRadius: "9px", opacity: (!title.trim() || saving) ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            {saving && <span style={{ width: "12px", height: "12px", border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.65s linear infinite" }} />}
            {saving ? "Saving…" : "Add event"}
          </button>
        </div>
      </div>
    </div>
  );
}
