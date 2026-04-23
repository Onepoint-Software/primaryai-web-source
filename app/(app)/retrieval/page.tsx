"use client";

import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetrievalQuestion {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  rationale: string;
}

interface RetrievalResult {
  questions: RetrievalQuestion[];
  curriculumAnchor: string;
  spacingNote: string;
}

type QuestionType = "multiple_choice" | "short_answer" | "true_false" | "fill_blank";

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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>{hint}</p>}
      {children}
    </div>
  );
}

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  true_false: "True / False",
  fill_blank: "Fill in the blank",
};

const TYPE_ICONS: Record<QuestionType, string> = {
  multiple_choice: "⊙",
  short_answer: "✎",
  true_false: "⇌",
  fill_blank: "___",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function RetrievalPage() {
  const [yearGroup, setYearGroup] = useState("");
  const [subject, setSubject] = useState("");
  const [priorTopic, setPriorTopic] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["short_answer", "multiple_choice"]);
  const [questionCount, setQuestionCount] = useState(6);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggleType(t: QuestionType) {
    setQuestionTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionTypes.length === 0) {
      setError("Please select at least one question type.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setShowAnswers(false);
    setCopied(false);

    try {
      const res = await fetch("/api/retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearGroup, subject, priorTopic, questionTypes, questionCount }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Something went wrong — please try again.");
        return;
      }

      const data: RetrievalResult = await res.json();
      setResult(data);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [yearGroup, subject, priorTopic, questionTypes, questionCount]);

  function copyQuestions() {
    if (!result) return;
    const lines: string[] = [];
    result.questions.forEach((q, i) => {
      lines.push(`${i + 1}. [${TYPE_LABELS[q.type as QuestionType] ?? q.type}] ${q.question}`);
      if (q.options) q.options.forEach((opt, j) => lines.push(`   ${String.fromCharCode(65 + j)}) ${opt}`));
      lines.push("");
    });
    lines.push("ANSWERS:");
    result.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.answer}`));
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const YEAR_GROUPS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
  const SUBJECTS = [
    "English — Reading", "English — Writing", "English — SPAG",
    "Maths", "Science",
    "History", "Geography", "Art & Design", "Design & Technology",
    "Computing", "Music", "RE", "PSHE", "MFL",
  ];
  const ALL_TYPES: QuestionType[] = ["multiple_choice", "short_answer", "true_false", "fill_blank"];

  return (
    <main style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>
          🔁 Retrieval practice generator
        </h1>
        <p style={{ margin: 0, fontSize: "0.87rem", color: "var(--muted)", lineHeight: 1.55 }}>
          Generate curriculum-aligned retrieval questions on prior learning. Spaced retrieval has one of the strongest evidence bases in education — EEF rates it +5 months impact.
        </p>
      </div>

      {/* CPD note */}
      <div style={{ marginBottom: "1.5rem", padding: "0.85rem 1rem", borderRadius: "12px", background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.2)", display: "flex", gap: "0.75rem" }}>
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>📚</span>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.55 }}>
          <strong>Spacing tip:</strong> Retrieval works best when pupils last encountered the content at least one week ago, not the very next lesson. Use this tool to plan &lsquo;retrieval starters&rsquo; that bridge prior units with current teaching.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
            Prior learning
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
          <Field label="What prior topic should pupils retrieve?" hint="Be specific — e.g. 'place value to 10,000' not just 'number'. The more specific, the better the questions.">
            <input
              style={inputStyle}
              value={priorTopic}
              onChange={e => setPriorTopic(e.target.value)}
              placeholder="e.g. identifying features of a non-chronological report — Year 4 Autumn Term"
              required
            />
          </Field>
        </div>

        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
            Question settings
          </h2>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "0.5rem" }}>Question types</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {ALL_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: `1.5px solid ${questionTypes.includes(t) ? "var(--accent)" : "var(--border)"}`, background: questionTypes.includes(t) ? "rgba(99,102,241,0.08)" : "transparent", color: questionTypes.includes(t) ? "var(--accent)" : "var(--muted)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{TYPE_ICONS[t]}</span>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>Number of questions</label>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {[3, 5, 6, 8, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  style={{ width: "38px", height: "38px", borderRadius: "8px", border: `1.5px solid ${questionCount === n ? "var(--accent)" : "var(--border)"}`, background: questionCount === n ? "rgba(99,102,241,0.08)" : "transparent", color: questionCount === n ? "var(--accent)" : "var(--muted)", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.35)" }}>
            <p style={{ margin: 0, fontSize: "0.83rem", color: "#ef4444" }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !priorTopic.trim() || questionTypes.length === 0}
          style={{ padding: "0.75rem 2rem", borderRadius: "12px", border: "none", background: loading ? "var(--muted)" : "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Generating…
            </>
          ) : `Generate ${questionCount} retrieval questions`}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div style={{ marginTop: "2rem" }}>

          {/* Curriculum anchor + spacing note */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Curriculum anchor</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.45 }}>{result.curriculumAnchor}</p>
            </div>
            <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Spacing advice</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.45 }}>{result.spacingNote}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
                {result.questions.length} questions
              </h2>
              <button
                type="button"
                onClick={() => setShowAnswers(s => !s)}
                style={{ padding: "0.35rem 0.85rem", borderRadius: "7px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                {showAnswers ? "Hide answers" : "Show answers"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {result.questions.map((q, i) => (
                <div key={i} style={{ borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--surface)", padding: "1rem 1.1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--muted)", background: "var(--bg)", padding: "0.15rem 0.45rem", borderRadius: "5px", border: "1px solid var(--border)" }}>
                          {TYPE_LABELS[q.type as QuestionType] ?? q.type}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5, fontWeight: 500 }}>{q.question}</p>

                      {/* Multiple choice options */}
                      {q.options && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.5rem" }}>
                          {q.options.map((opt, j) => (
                            <div key={j} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", flexShrink: 0, width: "18px" }}>{String.fromCharCode(65 + j)})</span>
                              <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Answer (toggle) */}
                      {showAnswers && (
                        <div style={{ marginTop: "0.5rem", padding: "0.45rem 0.75rem", borderRadius: "7px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)" }}>
                          <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>Answer</p>
                          <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text)" }}>{q.answer}</p>
                        </div>
                      )}

                      {/* Rationale */}
                      <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4, fontStyle: "italic" }}>{q.rationale}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={copyQuestions}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "none", background: copied ? "#10b981" : "var(--accent)", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {copied ? "✓ Copied!" : "Copy questions + answers"}
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setPriorTopic(""); }}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Generate new set
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
