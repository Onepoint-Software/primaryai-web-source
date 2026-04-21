const ROLE_CARDS = [
  {
    value: "teacher",
    badge: "T",
    title: "Class Teacher",
    subtitle: "Classroom planning, curriculum coverage, and day-to-day workload.",
  },
  {
    value: "headteacher",
    badge: "HT",
    title: "Head Teacher",
    subtitle: "School-wide consistency, staff wellbeing, and policy implementation.",
  },
  {
    value: "trustleader",
    badge: "TL",
    title: "Trust Leader",
    subtitle: "Trust-wide oversight, governance, analytics, and rollout priorities.",
  },
  {
    value: "impartial",
    badge: "IE",
    title: "Impartial / External",
    subtitle: "Share a cross-role perspective across classroom, school, and trust needs.",
  },
];

export default function RoleSelector({ role, onSelect, onContinue }) {
  return (
    <section className="surveyx-card card">
      <p className="surveyx-part-kicker">Step 1 of 1</p>
      <h2 className="surveyx-part-title">Which role best describes you?</h2>
      <p style={{ margin: "0 0 1.1rem", color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
        We&apos;ll tailor the survey sections to what matters most for your perspective.
      </p>

      <div className="surveyx-role-grid">
        {ROLE_CARDS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`surveyx-role-card${role === item.value ? " is-active" : ""}`}
            onClick={() => onSelect(item.value)}
          >
            <span className="surveyx-role-badge">{item.badge}</span>
            <span className="surveyx-role-title">{item.title}</span>
            <span className="surveyx-role-subtitle">{item.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="surveyx-part-nav" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="button surveyx-next-btn"
          disabled={!role}
          onClick={onContinue}
        >
          Start survey
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </section>
  );
}
