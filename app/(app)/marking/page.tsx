"use client";

import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CriterionFeedback {
  criterion: string;
  comment: string;
  strength: boolean;
}

interface MarkingResult {
  criterionFeedback: CriterionFeedback[];
  overallComment: string;
  nextSteps: string[];
  warningLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderRadius: "9px",
  border: "1.5px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "0.87rem",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  lineHeight: 1.55,
  minHeight: "80px",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarkingPage() {
  const [yearGroup, setYearGroup] = useState("");
  const [subject, setSubject] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [pupilWork, setPupilWork] = useState("");
  const [markingCriteria, setMarkingCriteria] = useState("");
  const [markingStyle, setMarkingStyle] = useState<"formative" | "summative">("formative");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MarkingResult | null>(null);

  // Per-criterion teacher edits
  const [editedComments, setEditedComments] = useState<Record<number, string>>({});
  const [editedOverall, setEditedOverall] = useState<string>("");
  const [editedNextSteps, setEditedNextSteps] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setEditedComments({});
    setEditedOverall("");
    setEditedNextSteps([]);
    setConfirmed(false);

    try {
      const res = await fetch("/api/marking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearGroup, subject, assignmentDescription, pupilWork, markingCriteria, markingStyle }),
      });

      if (res.status === 422) {
        setError("This content has been flagged and cannot be processed. Please speak with your Designated Safeguarding Lead (DSL) if you have concerns about a pupil.");
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Something went wrong — please try again.");
        return;
      }

      const data: MarkingResult = await res.json();
      setResult(data);
      setEditedOverall(data.overallComment);
      setEditedNextSteps(data.nextSteps.slice());
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [yearGroup, subject, assignmentDescription, pupilWork, markingCriteria, markingStyle]);

  function copyFeedback() {
    if (!result) return;
    const lines: string[] = [];
    result.criterionFeedback.forEach((cf, i) => {
      lines.push(`${cf.criterion}: ${editedComments[i] ?? cf.comment}`);
    });
    lines.push("", editedOverall || result.overallComment);
    lines.push("", "Next steps:");
    (editedNextSteps.length > 0 ? editedNextSteps : result.nextSteps).forEach(s => lines.push(`• ${s}`));
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
  }

  const YEAR_GROUPS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
  const SUBJECTS = [
    "English — Reading", "English — Writing", "English — SPAG",
    "Maths", "Science",
    "History", "Geography", "Art & Design", "Design & Technology",
    "Computing", "Music", "PE", "RE", "PSHE", "MFL",
  ];

  return (
    <main style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>
          ✏️ Marking assistant
        </h1>
        <p style={{ margin: 0, fontSize: "0.87rem", color: "var(--muted)", lineHeight: 1.55 }}>
          Generates pre-draft marking comments for teacher review. You must confirm or rewrite all feedback before using it with pupils.
        </p>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { step: "1", title: "Paste pupil work", body: "Type or paste the pupil's work — no name needed. Add the task description and your marking criteria." },
          { step: "2", title: "Get a pre-draft", body: "The assistant generates criterion-by-criterion comments, an overall note, and two next steps — all editable." },
          { step: "3", title: "Review and confirm", body: "Edit every field until it reflects your professional judgement. Click Confirm before copying to your markbook." },
        ].map(({ step, title, body }) => (
          <div key={step} style={{ padding: "0.9rem 1rem", borderRadius: "10px", background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>{step}</div>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{title}</p>
            <p style={{ margin: 0, fontSize: "0.77rem", color: "var(--muted)", lineHeight: 1.5 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Warning banner */}
      <div style={{ marginBottom: "1.5rem", padding: "0.85rem 1rem", borderRadius: "12px", background: "rgba(245,158,11,0.07)", border: "1.5px solid rgba(245,158,11,0.35)" }}>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#b45309", lineHeight: 1.5 }}>
          <strong>Important:</strong> This tool produces pre-draft feedback only. It cannot see your classroom context, your school&rsquo;s marking policy, or this pupil&rsquo;s prior work. Review every comment critically before use. The professional responsibility for all marking remains with the teacher.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
            Task details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <Field label="Year group">
              <select style={inputStyle} value={yearGroup} onChange={e => setYearGroup(e.target.value)}>
                <option value="">Select…</option>
                {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <select style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Select…</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="What did you ask pupils to do?" hint="Briefly describe the task or assignment">
              <textarea
                style={{ ...textareaStyle, minHeight: "60px" }}
                value={assignmentDescription}
                onChange={e => setAssignmentDescription(e.target.value)}
                placeholder="e.g. Write a newspaper report about a historical event using subheadings, quotes, and formal language."
              />
            </Field>
            <Field label="Marking criteria" hint="List the criteria you are marking against, separated by commas">
              <textarea
                style={{ ...textareaStyle, minHeight: "56px" }}
                value={markingCriteria}
                onChange={e => setMarkingCriteria(e.target.value)}
                placeholder="e.g. use of formal language, text organisation, punctuation, factual accuracy"
              />
            </Field>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>Marking style</label>
              {(["formative", "summative"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMarkingStyle(s)}
                  style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: `1.5px solid ${markingStyle === s ? "var(--accent)" : "var(--border)"}`, background: markingStyle === s ? "rgba(99,102,241,0.08)" : "transparent", color: markingStyle === s ? "var(--accent)" : "var(--muted)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
            Pupil work
          </h2>
          <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.45 }}>
            Paste or type the pupil&rsquo;s work below. Do not include the pupil&rsquo;s name — use &ldquo;the pupil&rdquo; or initials only.
          </p>
          <textarea
            style={{ ...textareaStyle, minHeight: "200px" }}
            value={pupilWork}
            onChange={e => setPupilWork(e.target.value)}
            placeholder="Paste the pupil's work here…"
            required
          />
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.35)" }}>
            <p style={{ margin: 0, fontSize: "0.83rem", color: "#ef4444" }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !pupilWork.trim() || !assignmentDescription.trim()}
          style={{ padding: "0.75rem 2rem", borderRadius: "12px", border: "none", background: loading ? "var(--muted)" : "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Generating pre-draft…
            </>
          ) : "Generate marking feedback"}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div style={{ marginTop: "2rem" }}>
          {/* Warning */}
          <div style={{ marginBottom: "1.25rem", padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1.5px solid rgba(245,158,11,0.35)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e", lineHeight: 1.5 }}>{result.warningLabel}</p>
          </div>

          {/* Criterion feedback */}
          {result.criterionFeedback.length > 0 && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <h2 style={{ margin: "0 0 1.1rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
                Criterion-by-criterion feedback
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {result.criterionFeedback.map((cf, i) => (
                  <div key={i} style={{ borderRadius: "10px", border: `1.5px solid ${cf.strength ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, background: cf.strength ? "rgba(16,185,129,0.04)" : "rgba(245,158,11,0.04)", padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cf.strength ? "#059669" : "#d97706", background: cf.strength ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                        {cf.strength ? "✓ Strength" : "→ Development"}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>{cf.criterion}</span>
                    </div>
                    <textarea
                      style={{ ...textareaStyle, minHeight: "56px", background: "var(--bg)", fontSize: "0.83rem" }}
                      value={editedComments[i] ?? cf.comment}
                      onChange={e => setEditedComments(prev => ({ ...prev, [i]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall comment */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
              Overall comment
            </h2>
            <textarea
              style={{ ...textareaStyle, minHeight: "120px" }}
              value={editedOverall}
              onChange={e => setEditedOverall(e.target.value)}
            />
          </div>

          {/* Next steps */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
              Next steps
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(editedNextSteps.length > 0 ? editedNextSteps : result.nextSteps).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>{i + 1}</span>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={step}
                    onChange={e => {
                      const next = [...(editedNextSteps.length > 0 ? editedNextSteps : result.nextSteps)];
                      next[i] = e.target.value;
                      setEditedNextSteps(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Confirm + copy */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "none", background: confirmed ? "#10b981" : "var(--accent)", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {confirmed ? "✓ Confirmed as reviewed" : "I have reviewed and edited this feedback"}
            </button>
            <button
              type="button"
              onClick={copyFeedback}
              disabled={!confirmed}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "1.5px solid var(--border)", background: "transparent", color: confirmed ? "var(--text)" : "var(--muted)", fontSize: "0.85rem", fontWeight: 700, cursor: confirmed ? "pointer" : "not-allowed", fontFamily: "inherit" }}
            >
              Copy feedback
            </button>
            {!confirmed && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                Please review and confirm before copying.
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
