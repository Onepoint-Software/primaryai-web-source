"use client";

import { useEffect, useState } from "react";

type Props = {
  termName: string;
  termStartDate: string; // YYYY-MM-DD
  termEndDate: string;   // YYYY-MM-DD
};

const RINGS = [
  { key: "S", label: "Seconds", r: 88, color: "#f59e0b" },
  { key: "M", label: "Minutes", r: 73, color: "#10b981" },
  { key: "H", label: "Hours",   r: 58, color: "#06b6d4" },
  { key: "D", label: "Days",    r: 43, color: "#3b82f6" },
  { key: "W", label: "Weeks",   r: 28, color: "#8b5cf6" },
] as const;

// School day: 9am–4pm = 7 hours
const SCHOOL_START_SECS = 9  * 3600;  // 09:00
const SCHOOL_END_SECS   = 16 * 3600;  // 16:00
const SCHOOL_SECS_PER_DAY = SCHOOL_END_SECS - SCHOOL_START_SECS; // 25,200

function isoString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function countSchoolDays(from: Date, to: Date, bankHols: Set<string>): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !bankHols.has(isoString(d))) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function TermCountdownRing({ termName, termStartDate, termEndDate }: Props) {
  const [now, setNow]       = useState(() => new Date());
  const [bankHols, setBankHols] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!termStartDate || !termEndDate) return;
    fetch(`/api/calendar/bank-holidays?from=${termStartDate}&to=${termEndDate}`)
      .then(r => r.json())
      .then(data => {
        const dates = new Set<string>(
          (data.events || []).map((e: { scheduled_date: string }) => e.scheduled_date)
        );
        setBankHols(dates);
      })
      .catch(() => {});
  }, [termStartDate, termEndDate]);

  // Parse dates
  const [sy, sm, sd] = termStartDate.split("-").map(Number);
  const [ey, em, ed] = termEndDate.split("-").map(Number);
  const termStart = new Date(sy, (sm || 1) - 1, sd || 1);
  const termEnd   = new Date(ey, (em || 1) - 1, ed || 1);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayIso = isoString(today);
  const todayDow = today.getDay();
  const todayIsSchoolDay = todayDow !== 0 && todayDow !== 6 && !bankHols.has(todayIso);

  const totalSchoolDays     = countSchoolDays(termStart, termEnd, bankHols);
  const schoolDaysRemaining = countSchoolDays(today, termEnd, bankHols);

  // Count school days from tomorrow onwards, then add today's remaining school time
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureSchoolDays = countSchoolDays(tomorrow, termEnd, bankHols);

  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let todaySchoolSecsLeft = 0;
  if (todayIsSchoolDay) {
    if (nowSecs < SCHOOL_START_SECS) {
      todaySchoolSecsLeft = SCHOOL_SECS_PER_DAY;          // before school
    } else if (nowSecs < SCHOOL_END_SECS) {
      todaySchoolSecsLeft = SCHOOL_END_SECS - nowSecs;    // during school — ticks live
    }
    // after 4pm: 0
  }

  const schoolSecsRemaining = futureSchoolDays * SCHOOL_SECS_PER_DAY + todaySchoolSecsLeft;

  // Ring fill: school-days fraction (excludes weekends + bank holidays)
  const termFrac = totalSchoolDays > 0 ? Math.min(1, schoolDaysRemaining / totalSchoolDays) : 0;

  // Seconds ring: starts full at :00, drains to empty at :59, then resets
  const secFrac = 1 - now.getSeconds() / 60;

  // Seconds/minutes/hours: real wall-clock so they always tick live
  const termEndMoment = new Date(ey, (em || 1) - 1, ed || 1, 16, 0, 0);
  const termStartMoment = new Date(sy, (sm || 1) - 1, sd || 1, 9, 0, 0);
  const msToTermEnd = Math.max(0, termEndMoment.getTime() - now.getTime());
  const wallSecs = Math.floor(msToTermEnd / 1000);
  const termWallSecs = Math.max(1, Math.floor((termEndMoment.getTime() - termStartMoment.getTime()) / 1000));

  // Remaining values
  const secsRemaining  = wallSecs;
  const minsRemaining  = Math.floor(wallSecs / 60);
  const hoursRemaining = Math.floor(wallSecs / 3600);
  const daysRemaining  = schoolDaysRemaining;
  const weeksRemaining = schoolDaysRemaining / 5;

  // Term totals (denominators for x / y display)
  const secsTotal  = termWallSecs;
  const minsTotal  = Math.floor(termWallSecs / 60);
  const hoursTotal = Math.floor(termWallSecs / 3600);
  const daysTotal  = totalSchoolDays;
  const weeksTotal = totalSchoolDays / 5;

  const remaining = [secsRemaining, minsRemaining, hoursRemaining, daysRemaining, weeksRemaining];
  const termTotal  = [secsTotal,    minsTotal,     hoursTotal,     daysTotal,     weeksTotal];

  const CX = 100, SW = 9;

  return (
    <>
    <span className="dashboard-hero-label">End of {termName} countdown</span>
    <div className="term-countdown-wrap">
      {/* Left: rings */}
      <svg viewBox="0 0 200 200" className="term-countdown-svg" aria-label="Term countdown">
        {RINGS.map(({ key, r, color }, i) => {
          const isSeconds = i === 0;
          const frac  = isSeconds ? secFrac : termFrac;
          const circ  = 2 * Math.PI * r;
          const offset = circ * (1 - frac);
          return (
            <g key={key}>
              <circle
                cx={CX} cy={100} r={r}
                fill="none" stroke={color} strokeWidth={SW} opacity={0.13}
              />
              <circle
                cx={CX} cy={100} r={r}
                fill="none" stroke={color} strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${CX} 100)`}
                style={{
                  opacity: 0.95 - i * 0.09,
                  transition: isSeconds
                    ? "stroke-dashoffset 0.9s linear"
                    : "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  filter: `drop-shadow(0 0 ${isSeconds ? 7 : 3}px ${color}${isSeconds ? "dd" : "88"})`,
                }}
              />
            </g>
          );
        })}

        {/* Centre: stopwatch icon */}
        <circle cx={CX} cy="100" r="16" fill="var(--surface)" opacity="0.7" />
        <g style={{ opacity: 0.5 }}>
          <rect x="97.5" y="90" width="5" height="3.5" rx="1.75" fill="var(--text)" />
          <rect x="109" y="99" width="3.5" height="2.5" rx="1.25" fill="var(--text)" />
          <circle cx={CX} cy="103" r="10" fill="none" stroke="var(--text)" strokeWidth="1.5" />
          <line x1="100" y1="94.5" x2="100" y2="96.5" stroke="var(--text)" strokeWidth="1" strokeLinecap="round" />
          <line x1="108.5" y1="103" x2="106.5" y2="103" stroke="var(--text)" strokeWidth="1" strokeLinecap="round" />
          <line x1="100" y1="103" x2="100" y2="96" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="100" y1="103" x2="105" y2="106" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
          <circle cx={CX} cy="103" r="1.5" fill="var(--text)" />
        </g>
      </svg>

      {/* Right: numeric readout */}
      <div className="term-countdown-right">
        <div className="term-countdown-legend">
          {[...RINGS].reverse().map(({ key, label, color }, i) => {
            const vi = RINGS.length - 1 - i;
            const rem = remaining[vi];
            const tot = termTotal[vi];
            const fmt = (v: number) => key === "W" ? v.toFixed(1) : v.toLocaleString();
            return (
              <div key={key} className="term-countdown-legend-item">
                <span className="term-countdown-legend-unit">{label}</span>
                <span className="term-countdown-legend-val" style={{ color }}>
                  {fmt(rem)}
                  <span className="term-countdown-legend-of">/{fmt(tot)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
