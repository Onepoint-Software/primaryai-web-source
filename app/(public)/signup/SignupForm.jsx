"use client";

import { useEffect, useRef, useState } from "react";

export default function SignupForm({ next }) {
  const [submitting, setSubmitting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [roleConfirmed, setRoleConfirmed] = useState(false);
  const timerRef = useRef(null);

  // Clean up timer if the component unmounts (page navigated away successfully)
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function handleSubmit() {
    setSubmitting(true);
    setTimedOut(false);
    // If the server hasn't responded in 15s, re-enable the form with a message
    timerRef.current = setTimeout(() => {
      setSubmitting(false);
      setTimedOut(true);
    }, 15000);
  }

  return (
    <form action="/api/auth/signup" method="post" onSubmit={handleSubmit}>
      <input type="hidden" name="next" value={next} />

      <div className="auth-field">
        <label className="auth-label" htmlFor="email">Email</label>
        <input
          className="auth-input"
          id="email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="password">Password</label>
        <input
          className="auth-input"
          id="password"
          type="password"
          name="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", margin: "0.25rem 0 0.85rem" }}>
        <input
          id="role-confirm"
          type="checkbox"
          checked={roleConfirmed}
          onChange={(e) => setRoleConfirmed(e.target.checked)}
          required
          style={{ marginTop: "2px", flexShrink: 0, accentColor: "var(--accent, #4f46e5)", cursor: "pointer" }}
        />
        <label htmlFor="role-confirm" style={{ fontSize: "0.78rem", color: "var(--muted, #94a3b8)", lineHeight: 1.45, cursor: "pointer" }}>
          I confirm I am a qualified teacher or school staff member (aged 18+). I will not enter personal data about
          individual pupils into PrimaryAI.
        </label>
      </div>

      {timedOut && (
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "#fc8181" }}>
          This is taking longer than expected. Please check your connection and try again.
        </p>
      )}

      <button
        className="auth-submit"
        type="submit"
        disabled={submitting || !roleConfirmed}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          opacity: submitting || !roleConfirmed ? 0.75 : 1,
          cursor: submitting || !roleConfirmed ? "not-allowed" : "pointer",
          transition: "opacity 150ms ease",
        }}
      >
        {submitting && (
          <span
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.65s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
