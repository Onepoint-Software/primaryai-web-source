"use client";

// Option C — focused feature spotlight card, rendered at 280px, scaled to phone screen size.
// Shows the lesson pack result in a mobile-first layout.

const C = {
  bg: "#080c18",
  surface: "#0f1629",
  surface2: "#141e35",
  accent: "#6366f1",
  orange: "#f97316",
  green: "#22c55e",
  blue: "#3b82f6",
  text: "#e2e8f0",
  muted: "#64748b",
  border: "#1b2642",
};

const OBJECTIVES = [
  "Recognise equivalent fractions using diagrams",
  "Add fractions with the same denominator",
  "Solve problems involving fractions of amounts",
];

const DOCK_ICONS = [
  // Dashboard grid
  <svg key="d" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  // Lesson pack (layers)
  <svg key="l" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  // Library (book)
  <svg key="b" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  // Settings
  <svg key="s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
];

export default function MockPhone({ scale = 0.32 }) {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 280,
        height: 620,
        transformOrigin: "top left",
        transform: `scale(${scale})`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        color: C.text,
      }}>

        {/* Status bar */}
        <div style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px 0 14px",
          background: C.surface,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              {[6, 8, 10, 12].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: i < 3 ? C.text : C.border, borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ width: 20, height: 10, borderRadius: 2, border: `1.5px solid ${C.muted}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 1.5, left: 1.5, right: 4, bottom: 1.5, background: C.green, borderRadius: 1 }} />
              <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 5, background: C.muted, borderRadius: 999 }} />
            </div>
          </div>
        </div>

        {/* Nav bar */}
        <div style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.3 }}>
            Primary<span style={{ color: C.orange }}>AI</span>
          </span>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: `${C.accent}22`, border: `1px solid ${C.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: C.accent,
          }}>SJ</div>
        </div>

        {/* Main scroll area */}
        <div style={{ flex: 1, overflow: "hidden", padding: "12px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: 4 }}>
            {["Year 4", "Mathematics"].map((b, i) => (
              <span key={b} style={{
                fontSize: 9, fontWeight: 700,
                background: i === 0 ? `${C.accent}22` : `${C.orange}18`,
                color: i === 0 ? C.accent : C.orange,
                borderRadius: 4, padding: "2px 6px",
                border: `1px solid ${i === 0 ? C.accent : C.orange}33`,
              }}>{b}</span>
            ))}
          </div>

          {/* Topic + AI badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Fractions</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>AI-generated lesson pack</div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
              fontSize: 8, fontWeight: 700,
              background: `${C.green}18`, color: C.green,
              borderRadius: 999, padding: "3px 7px",
              border: `1px solid ${C.green}33`,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green }} />
              AI
            </div>
          </div>

          {/* Objectives */}
          <div style={{
            background: C.surface,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            padding: "8px 10px",
          }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Objectives
            </div>
            {OBJECTIVES.map((obj, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: i < 2 ? 5 : 0, alignItems: "flex-start" }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 0.5,
                  background: `${C.accent}22`, border: `1px solid ${C.accent}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent }} />
                </div>
                <span style={{ fontSize: 9, color: C.text, lineHeight: 1.45 }}>{obj}</span>
              </div>
            ))}
          </div>

          {/* Activity tier pills */}
          <div style={{ display: "flex", gap: 5 }}>
            {[
              { label: "Support", color: C.blue },
              { label: "Expected", color: C.accent },
              { label: "Deeper", color: C.orange },
            ].map((a) => (
              <div key={a.label} style={{
                flex: 1, borderRadius: 6, padding: "5px 0",
                background: `${a.color}15`, border: `1px solid ${a.color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 700, color: a.color,
              }}>{a.label}</div>
            ))}
          </div>

          {/* Assessment teaser */}
          <div style={{
            background: C.surface,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            padding: "7px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 9, color: C.text, fontWeight: 600 }}>Mini Assessment</span>
            <span style={{
              fontSize: 8, color: C.accent, fontWeight: 700,
              background: `${C.accent}18`, borderRadius: 999, padding: "2px 7px",
            }}>4 questions</span>
          </div>
        </div>

        {/* Bottom dock */}
        <div style={{
          height: 52,
          flexShrink: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 16px",
        }}>
          {DOCK_ICONS.map((icon, i) => (
            <div key={i} style={{
              width: 36, height: 36,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i === 1 ? `${C.accent}22` : "transparent",
              color: i === 1 ? C.accent : C.muted,
            }}>
              {icon}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
