"use client";
export const runtime = 'edge';

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DpiaFormData {
  schoolName: string;
  schoolUrn: string;
  dpoName: string;
  headteacherName: string;
  deploymentDate: string;
  residualRisk: "low" | "medium" | "high" | "";
  dpoCertification: string;
  headCertification: string;
}

interface PolicyFormData {
  schoolName: string;
  headteacherName: string;
  aiSafetyLeadName: string;
  dpoName: string;
  reviewDate: string;
}

type Tab = "dpia" | "policy" | "audit" | "workload";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children, color = "var(--accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <h3 style={{ margin: "0 0 0.85rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color, display: "flex", alignItems: "center", gap: "0.45rem" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
      {children}
    </h3>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>{hint}</p>}
      {children}
    </div>
  );
}

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

// ── DPIA document generator ───────────────────────────────────────────────────

function generateDpiaText(data: DpiaFormData, today: string): string {
  const riskLabel = data.residualRisk === "low" ? "Low" : data.residualRisk === "medium" ? "Medium" : data.residualRisk === "high" ? "High" : "[to complete]";

  return `DATA PROTECTION IMPACT ASSESSMENT — PrimaryAI
Prepared for: ${data.schoolName || "[School name]"}
School URN: ${data.schoolUrn || "[URN]"}
DPO: ${data.dpoName || "[DPO name]"}
Headteacher: ${data.headteacherName || "[Headteacher name]"}
Date prepared: ${today}
Deployment date: ${data.deploymentDate || "[to complete]"}
Review date: Annually from deployment, or on material change

─────────────────────────────────────────────────────────────
STEP 1 — IDENTIFY THE NEED FOR A DPIA

A DPIA is required where processing is likely to result in a high risk to the rights and freedoms of individuals. Processing pupil-adjacent data using a generative AI system meets this threshold under Article 35 UK GDPR and ICO guidance on AI and children.

Screening outcome: FULL DPIA REQUIRED

─────────────────────────────────────────────────────────────
STEP 2 — DESCRIBE THE PROCESSING

Nature of the processing:
• Teacher inputs: lesson planning prompts, curriculum objectives, class profile (year group, subject, broad differentiation needs)
• Pupil data: aggregated class-level data only (year group, SEND indicators where teacher-entered). No pupil names required for core lesson-planning flows.
• Staff account data: email, name, role, school affiliation
• Generated outputs: lesson plans, worksheets, assessment materials, marking drafts, CPD prompts
• Telemetry: time-on-task, feature usage, export and edit rates (aggregated, anonymised)

Scope:
• Volume: designed for class-level (~30 pupils) and school-level (up to ~500 pupils) use
• Retention: teacher inputs and outputs retained for the duration of the school's subscription plus 30 days
• Geography: data processed in UK/EU regions only. No transfers to jurisdictions without an adequacy decision.

Purpose:
• Primary: reduce teacher workload on planning, resource creation and marking
• Secondary: develop teacher AI literacy and critical thinking through designed-in scaffolding
• Lawful basis: public task under Article 6(1)(e) UK GDPR in support of the school's statutory educational function

─────────────────────────────────────────────────────────────
STEP 3 — CONSULTATION

The school should document consultation with the following groups before deployment:
☐ Data subjects (teachers, representatives of parents) — via staff meeting and parent letter
☐ Data Protection Officer — formal review of this DPIA and the processor agreement
☐ Information security lead — access controls and incident response
☐ Designated Safeguarding Lead — safeguarding interaction with AI inputs
☐ Governing Body — AI-use policy and budget approval

─────────────────────────────────────────────────────────────
STEP 4 — NECESSITY AND PROPORTIONALITY

Processing is necessary and proportionate because:
• Data minimisation: core flows use class-level aggregates, not individual pupil data
• Purpose limitation: data is not used for model training or any secondary purpose
• Teacher controls: telemetry opt-out available; configurable retention periods
• Alternatives considered: general-purpose AI tools (ChatGPT, Gemini) rejected due to lack of governance, transparency and pedagogical guardrails required in primary schools

─────────────────────────────────────────────────────────────
STEP 5 — RISK REGISTER

Risk | Likelihood | Severity | Mitigation in product
Hallucinated content presented to pupils | Medium | High | Hallucination flag on teacher outputs; teacher review required before any pupil use
Bias in generated content | Medium | Medium | Bias audit feature; red-team test set pre-release; teacher review required
Pupil cognitive offloading | High | High | Socratic-by-default pupil UI (when introduced in v1); intervention dashboard
Safeguarding disclosure sent to AI | Low | High | Input scanner detects safeguarding keywords; content not sent to model; teacher redirected to DSL
Staff over-reliance and de-skilling | Medium | Medium | Show-working default; CPD micro-prompts; edit rate surfaced in workload report
Data breach via model provider | Low | High | Enterprise-grade processor agreements; no training on customer data; UK/EU-only processing
Lack of transparency with parents | Medium | Medium | Template transparency notice and parent communication generator included with product

─────────────────────────────────────────────────────────────
STEP 6 — SIGN-OFF

Residual risk level: ${riskLabel}
ICO consultation required: ${data.residualRisk === "high" ? "YES — consult ICO before processing begins" : "No (residual risk not assessed as high)"}

Signed (DPO): ${data.dpoName || "[Name]"} — ${data.dpoCertification || "[Date]"}
Signed (Headteacher): ${data.headteacherName || "[Name]"} — ${data.headCertification || "[Date]"}

─────────────────────────────────────────────────────────────
REFERENCES

• UK GDPR Articles 35 and 28
• ICO: Guide to DPIAs; Guidance on AI and data protection; Children's Code
• DfE: Generative artificial intelligence in education (updated June 2025)
• DfE: Generative AI product safety expectations (June 2025)
• Keeping Children Safe in Education (latest version)
• PrimaryAI Article 28 Processor Agreement (provided separately)

─────────────────────────────────────────────────────────────
Generated by PrimaryAI Compliance Centre · primaryai.org.uk
This document is provided as a template. It should be reviewed by your DPO before use.
`;
}

// ── AI-use policy generator ───────────────────────────────────────────────────

function generatePolicyText(data: PolicyFormData, today: string): string {
  return `SCHOOL AI-USE POLICY
${data.schoolName || "[School name]"}

Approved by: Governing Body
Headteacher: ${data.headteacherName || "[Name]"}
AI Safety Lead: ${data.aiSafetyLeadName || "[Name]"}
Data Protection Officer: ${data.dpoName || "[Name]"}
Date adopted: ${today}
Review date: ${data.reviewDate || "[Date]"}

─────────────────────────────────────────────────────────────
1. PURPOSE

This policy sets out how ${data.schoolName || "this school"} uses generative artificial intelligence (AI) tools in school operations and teaching. It applies to all staff and, where appropriate, pupils. It is written in accordance with:
• DfE Generative AI guidance (updated June 2025)
• DfE Generative AI product safety expectations (June 2025)
• UK GDPR and the Data Protection Act 2018
• Keeping Children Safe in Education

─────────────────────────────────────────────────────────────
2. APPROVED AI TOOLS

The following AI tools are approved for use in school:
• PrimaryAI (primaryai.org.uk) — lesson planning, resource creation, marking assistance (staff only)

Any additional AI tool must be approved by the headteacher and DPO before use. A Data Protection Impact Assessment must be completed for each approved tool.

─────────────────────────────────────────────────────────────
3. PRINCIPLES FOR USE

3.1 Human oversight
AI outputs must always be reviewed by a qualified member of staff before use in the classroom. Staff retain full professional responsibility for all materials used with pupils.

3.2 Accuracy and hallucination
AI can produce inaccurate, biased or fabricated information. Staff must verify any statistics, named sources, historical dates or curriculum claims before treating them as factual. PrimaryAI flags potentially unverifiable claims automatically.

3.3 Data protection
• No pupil names or personal data are to be entered into any AI tool unless that tool has a current signed Article 28 processor agreement with the school.
• Class-level aggregate data (year group, broad ability indicators) is permitted.
• SEND details should be described generically (e.g. "one pupil with processing difficulties") — no pupil names or diagnoses.

3.4 Safeguarding
AI tools are not a substitute for safeguarding procedures. Any safeguarding disclosure must follow the school's normal DSL process. PrimaryAI's input scanner will flag and redirect safeguarding-adjacent inputs.

3.5 Transparency
Staff will be open with pupils and parents about when AI tools have been used to support planning or provide feedback.

3.6 Pupil use (when applicable)
Pupils may only use AI tools approved for pupil use. Any pupil-facing AI interaction must be supervised and must not provide direct answers to learning tasks. This school does not currently approve any pupil-facing AI tools.

─────────────────────────────────────────────────────────────
4. RESPONSIBILITIES

Headteacher: overall accountability for AI use in school; policy approval.
AI Safety Lead (${data.aiSafetyLeadName || "[Name]"}): day-to-day oversight; staff training; incident reporting; annual policy review.
DPO (${data.dpoName || "[Name]"}): DPIA maintenance; data breach response; processor agreement oversight.
All staff: compliance with this policy; reporting concerns to the AI Safety Lead.

─────────────────────────────────────────────────────────────
5. MONITORING AND REVIEW

• This policy will be reviewed annually by the AI Safety Lead and DPO.
• The headteacher will report AI tool usage to the governing body termly.
• Staff concerns about AI outputs, data handling, or pupil impact should be reported to the AI Safety Lead immediately.

─────────────────────────────────────────────────────────────
6. RELATED POLICIES

• Data Protection and Privacy Policy
• Online Safety Policy
• Acceptable Use Policy (staff and pupils)
• Safeguarding and Child Protection Policy

─────────────────────────────────────────────────────────────
Signed: ${data.headteacherName || "[Headteacher]"} (Headteacher) · ${today}

─────────────────────────────────────────────────────────────
Generated by PrimaryAI Compliance Centre · primaryai.org.uk
Customise all fields marked [in brackets] before adopting.
`;
}

// ── Download helper ───────────────────────────────────────────────────────────

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayDdMmYyyy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>("dpia");

  // DPIA form
  const [dpiaForm, setDpiaForm] = useState<DpiaFormData>({
    schoolName: "", schoolUrn: "", dpoName: "", headteacherName: "",
    deploymentDate: "", residualRisk: "", dpoCertification: "", headCertification: "",
  });

  // Policy form
  const [policyForm, setPolicyForm] = useState<PolicyFormData>({
    schoolName: "", headteacherName: "", aiSafetyLeadName: "", dpoName: "", reviewDate: "",
  });

  const today = todayDdMmYyyy();

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "dpia",     label: "DPIA",          icon: "🛡️" },
    { id: "policy",   label: "AI-Use Policy",  icon: "📋" },
    { id: "workload", label: "Workload Report", icon: "📊" },
    { id: "audit",    label: "Audit Log",       icon: "🔍" },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🛡️</span>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>Compliance Centre</h1>
          <span style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: "999px", background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, border: "1px solid rgba(16,185,129,0.25)" }}>DfE Aligned</span>
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.55 }}>
          Generate the DPIA, AI-use policy, and audit documentation required to deploy PrimaryAI in your school — aligned with DfE guidance (June 2025) and UK GDPR.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", flexWrap: "wrap" as const }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: `1.5px solid ${tab === t.id ? "#10b981" : "var(--border)"}`, background: tab === t.id ? "rgba(16,185,129,0.08)" : "transparent", color: tab === t.id ? "#10b981" : "var(--muted)", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── DPIA Tab ── */}
      {tab === "dpia" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <SectionLabel color="#10b981">Data Protection Impact Assessment</SectionLabel>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Pre-populated with PrimaryAI&rsquo;s data flows, risk register, and mitigations. Complete the 8 fields below and download a ready-to-sign PDF for your DPO and headteacher.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <Field label="School name" hint="As it appears on official documentation">
              <input style={inputStyle} value={dpiaForm.schoolName} onChange={e => setDpiaForm(f => ({ ...f, schoolName: e.target.value }))} placeholder="St Mary's CE Primary School" />
            </Field>
            <Field label="School URN" hint="7-digit Ofsted reference (optional)">
              <input style={inputStyle} value={dpiaForm.schoolUrn} onChange={e => setDpiaForm(f => ({ ...f, schoolUrn: e.target.value }))} placeholder="123456" />
            </Field>
            <Field label="Data Protection Officer (DPO)" hint="Name of your DPO or DPO service provider">
              <input style={inputStyle} value={dpiaForm.dpoName} onChange={e => setDpiaForm(f => ({ ...f, dpoName: e.target.value }))} placeholder="Jane Smith / Judicium Education" />
            </Field>
            <Field label="Headteacher name">
              <input style={inputStyle} value={dpiaForm.headteacherName} onChange={e => setDpiaForm(f => ({ ...f, headteacherName: e.target.value }))} placeholder="Mr J. Brown" />
            </Field>
            <Field label="Intended deployment date">
              <input type="date" style={inputStyle} value={dpiaForm.deploymentDate} onChange={e => setDpiaForm(f => ({ ...f, deploymentDate: e.target.value }))} />
            </Field>
            <Field label="Residual risk level" hint="After applying the mitigations listed in the risk register">
              <select style={inputStyle} value={dpiaForm.residualRisk} onChange={e => setDpiaForm(f => ({ ...f, residualRisk: e.target.value as DpiaFormData["residualRisk"] }))}>
                <option value="">Select…</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High (ICO consultation required)</option>
              </select>
            </Field>
            <Field label="DPO sign-off date">
              <input type="date" style={inputStyle} value={dpiaForm.dpoCertification} onChange={e => setDpiaForm(f => ({ ...f, dpoCertification: e.target.value }))} />
            </Field>
            <Field label="Headteacher approval date">
              <input type="date" style={inputStyle} value={dpiaForm.headCertification} onChange={e => setDpiaForm(f => ({ ...f, headCertification: e.target.value }))} />
            </Field>
          </div>

          {dpiaForm.residualRisk === "high" && (
            <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.35)" }}>
              <p style={{ margin: 0, fontSize: "0.83rem", color: "#ef4444", fontWeight: 600 }}>⚠️ ICO consultation required before processing begins when residual risk is assessed as High.</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
            <button
              type="button"
              onClick={() => downloadTxt(generateDpiaText(dpiaForm, today), `PrimaryAI-DPIA-${dpiaForm.schoolName.replace(/\s+/g, "-") || "school"}.txt`)}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "none", background: "#10b981", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              ⬇ Download DPIA
            </button>
            <p style={{ margin: "auto 0", fontSize: "0.75rem", color: "var(--muted)" }}>Downloads as a .txt file. Open in Word or Google Docs to convert to PDF for signature.</p>
          </div>
        </div>
      )}

      {/* ── AI-Use Policy Tab ── */}
      {tab === "policy" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <SectionLabel color="#10b981">School AI-Use Policy</SectionLabel>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            A complete, DfE-aligned AI-use policy ready for governing body adoption. Complete the fields below and download.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <Field label="School name">
              <input style={inputStyle} value={policyForm.schoolName} onChange={e => setPolicyForm(f => ({ ...f, schoolName: e.target.value }))} placeholder="St Mary's CE Primary School" />
            </Field>
            <Field label="Headteacher name">
              <input style={inputStyle} value={policyForm.headteacherName} onChange={e => setPolicyForm(f => ({ ...f, headteacherName: e.target.value }))} placeholder="Mr J. Brown" />
            </Field>
            <Field label="AI Safety Lead name" hint="The designated staff member responsible for AI oversight">
              <input style={inputStyle} value={policyForm.aiSafetyLeadName} onChange={e => setPolicyForm(f => ({ ...f, aiSafetyLeadName: e.target.value }))} placeholder="Mrs K. Jones" />
            </Field>
            <Field label="Data Protection Officer">
              <input style={inputStyle} value={policyForm.dpoName} onChange={e => setPolicyForm(f => ({ ...f, dpoName: e.target.value }))} placeholder="Jane Smith / Judicium Education" />
            </Field>
            <Field label="Policy review date" hint="Recommended: annually from date of adoption">
              <input type="date" style={inputStyle} value={policyForm.reviewDate} onChange={e => setPolicyForm(f => ({ ...f, reviewDate: e.target.value }))} />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
            <button
              type="button"
              onClick={() => downloadTxt(generatePolicyText(policyForm, today), `PrimaryAI-AI-Use-Policy-${policyForm.schoolName.replace(/\s+/g, "-") || "school"}.txt`)}
              style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", border: "none", background: "#10b981", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              ⬇ Download AI-Use Policy
            </button>
            <p style={{ margin: "auto 0", fontSize: "0.75rem", color: "var(--muted)" }}>Downloads as a .txt file — open in Word to add school letterhead and convert to PDF.</p>
          </div>
        </div>
      )}

      {/* ── Workload Report Tab ── */}
      {tab === "workload" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <SectionLabel color="#10b981">Workload Evidence Report</SectionLabel>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Your EEF-equivalent metrics — time-to-plan, edit rate, and export-without-edit rate — collected from your PrimaryAI usage. Coming soon in a future update.
          </p>
          <WorkloadReport />
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === "audit" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <SectionLabel color="#10b981">Audit Log</SectionLabel>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            A per-teacher record of all AI-generated content, edits, and exports this term. Coming soon in a future update.
          </p>
          <AuditLog />
        </div>
      )}
    </div>
  );
}

// ── Workload report (live from planner_events) ────────────────────────────────

function WorkloadReport() {
  const [data, setData] = useState<{
    totalPlans: number;
    avgDurationMs: number | null;
    editRate: number | null;
    exportWithoutEditRate: number | null;
    lastUpdated: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/planner/workload");
      if (res.ok) setData(await res.json());
    } catch { /* non-blocking */ }
    finally { setLoading(false); setLoaded(true); }
  }

  const fmt = (ms: number | null) => ms === null ? "—" : `${Math.round(ms / 60000)} min`;
  const pct = (n: number | null) => n === null ? "—" : `${Math.round(n * 100)}%`;

  return (
    <div>
      {!loaded ? (
        <button type="button" onClick={load} disabled={loading} style={{ padding: "0.6rem 1.2rem", borderRadius: "9px", border: "1.5px solid #10b981", background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: "0.83rem", fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Loading…" : "Load my workload data"}
        </button>
      ) : data ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem", marginBottom: "1rem" }}>
            {[
              { label: "Plans generated", value: String(data.totalPlans) },
              { label: "Avg. time to plan", value: fmt(data.avgDurationMs) },
              { label: "Edit rate", value: pct(data.editRate) },
            ].map(m => (
              <div key={m.label} style={{ padding: "1rem", borderRadius: "12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" as const }}>
                <p style={{ margin: "0 0 0.3rem", fontSize: "1.4rem", fontWeight: 800, color: "#10b981" }}>{m.value}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>{m.label}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, color: "#10b981" }}>Export-without-edit rate</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)" }}>{pct(data.exportWithoutEditRate)} of plans exported with no revisions</p>
            {data.exportWithoutEditRate !== null && data.exportWithoutEditRate > 0.8 && (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#f59e0b" }}>High export-without-edit rate — consider whether AI output is being reviewed critically before use.</p>
            )}
          </div>
          {data.lastUpdated && <p style={{ margin: "0.6rem 0 0", fontSize: "0.7rem", color: "var(--muted)" }}>Data as of {data.lastUpdated}</p>}
          <button type="button" onClick={() => { const text = `PrimaryAI Workload Report\nGenerated: ${new Date().toLocaleDateString("en-GB")}\n\nPlans generated: ${data.totalPlans}\nAverage time to plan: ${fmt(data.avgDurationMs)}\nEdit rate: ${pct(data.editRate)}\nExport-without-edit rate: ${pct(data.exportWithoutEditRate)}\n\nGenerated by PrimaryAI · primaryai.org.uk`; const blob = new Blob([text], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "PrimaryAI-Workload-Report.txt"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }} style={{ marginTop: "0.85rem", padding: "0.55rem 1.1rem", borderRadius: "9px", border: "none", background: "#10b981", color: "#fff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            ⬇ Download report
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "0.83rem", color: "var(--muted)" }}>No data available yet. Generate your first lesson plan to start collecting metrics.</p>
      )}
    </div>
  );
}

// ── Audit log (live from planner_events) ──────────────────────────────────────

function AuditLog() {
  const [events, setEvents] = useState<Array<{ event_type: string; created_at: string; payload: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/planner/audit");
      if (res.ok) setEvents(await res.json());
    } catch { /* non-blocking */ }
    finally { setLoading(false); setLoaded(true); }
  }

  const EVENT_LABELS: Record<string, string> = {
    planner_form_opened: "Planner opened",
    planner_submitted: "Plan generated",
    plan_ready: "Plan ready",
    section_accepted: "Section accepted",
    section_revised: "Section revised",
    section_rejected: "Section rejected",
    section_regenerated: "Section regenerated",
    plan_exported: "Plan exported",
    cpd_prompt_shown: "CPD prompt shown",
    cpd_prompt_engaged: "CPD prompt engaged",
  };

  return (
    <div>
      {!loaded ? (
        <button type="button" onClick={load} disabled={loading} style={{ padding: "0.6rem 1.2rem", borderRadius: "9px", border: "1.5px solid #10b981", background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: "0.83rem", fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Loading…" : "Load my audit log"}
        </button>
      ) : events.length === 0 ? (
        <p style={{ fontSize: "0.83rem", color: "var(--muted)" }}>No events recorded yet. Generate a lesson plan to start the audit trail.</p>
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem", maxHeight: "400px", overflowY: "auto" as const }}>
            {events.slice(0, 100).map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.5rem 0.75rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--muted)", flexShrink: 0, width: "120px" }}>{new Date(ev.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", flex: 1 }}>{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
                {!!ev.payload?.section_key && <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{String(ev.payload.section_key)}</span>}
                {!!ev.payload?.format && <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{String(ev.payload.format)}</span>}
              </div>
            ))}
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>Showing most recent 100 events</p>
        </div>
      )}
    </div>
  );
}
