"use client";

import { useState } from "react";

export default function ThankYou({ surveyId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitPilotInterest(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const response = await fetch("/api/survey/pilot-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyResponseId: surveyId, email }),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setStatus(payload?.error || "Could not save your pilot interest right now.");
      return;
    }

    setStatus("done");
    setEmail("");
  }

  return (
    <section className="surveyx-card card">
      <p className="surveyx-part-kicker">Complete</p>
      <h1 className="surveyx-part-title" style={{ marginBottom: "0.6rem" }}>Thank you.</h1>
      <p className="surveyx-thanks-body">
        Your input will directly shape how PrimaryAI is built. We read every response and use them to decide what to prioritise.
      </p>

      {status === "done" ? (
        <div style={{
          marginTop: "1rem",
          padding: "0.85rem 1rem",
          borderRadius: "10px",
          border: "1px solid rgb(34 197 94 / 0.4)",
          background: "rgb(34 197 94 / 0.08)",
          color: "var(--text)",
          fontSize: "0.92rem",
          lineHeight: 1.5,
        }}>
          You&apos;re on the list. We&apos;ll be in touch when early access opens.
        </div>
      ) : (
        <>
          <p style={{ margin: "1.2rem 0 0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>
            Want early access as a pilot tester?
          </p>
          <form className="surveyx-pilot-form" onSubmit={submitPilotInterest}>
            <label className="surveyx-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@school.org"
                required
              />
            </label>
            <button type="submit" className="button surveyx-next-btn" disabled={saving} style={{ width: "fit-content" }}>
              {saving ? "Saving…" : "Join the pilot"}
            </button>
          </form>
          {status && status !== "done" ? (
            <p className="surveyx-status-message" style={{ color: "#fca5a5" }}>{status}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
