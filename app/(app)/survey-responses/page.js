import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { isLeaderSession } from "@/lib/survey-auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

function isLegacySurveySchemaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("column") && (message.includes("part_a") || message.includes("role") || message.includes("completed"));
}

function mapLegacyRowToModern(row) {
  const rawAnswers = row?.answers && typeof row.answers === "object" ? row.answers : {};
  return {
    id: String(row.id),
    role: rawAnswers.role || "unknown",
    part_a: rawAnswers.partA || {},
    part_b: rawAnswers.partB || {},
    part_c: rawAnswers.partC || {},
    part_d: rawAnswers.partD || {},
    completed: Boolean(rawAnswers.completed),
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

function prettyDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleChip({ role }) {
  return <span className="surveyx-role-chip">{role}</span>;
}

function toLabel(key) {
  return String(key || "")
    .replace(/^[a-d]_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function renderValue(value) {
  if (value == null || value === "") return <span className="muted">No response</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="muted">No response</span>;
    return (
      <ul className="surveyx-answer-list">
        {value.map((item, index) => (
          <li key={`${index}-${String(item)}`}>{isPlainObject(item) ? renderValue(item) : String(item)}</li>
        ))}
      </ul>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="muted">No response</span>;
    return (
      <div className="surveyx-answer-group">
        {entries.map(([nestedKey, nestedValue]) => (
          <div key={nestedKey} className="surveyx-answer-row">
            <p className="surveyx-answer-label">{toLabel(nestedKey)}</p>
            <div className="surveyx-answer-value">{renderValue(nestedValue)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

function SectionBlock({ title, data }) {
  const hasData = data && typeof data === "object" && Object.keys(data).length > 0;
  if (!hasData) return null;

  return (
    <details className="surveyx-response-section">
      <summary>{title}</summary>
      <div className="surveyx-answer-group">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="surveyx-answer-row">
            <p className="surveyx-answer-label">{toLabel(key)}</p>
            <div className="surveyx-answer-value">{renderValue(value)}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default async function SurveyResponsesPage() {
  const session = await getAuthSession();
  if (!session?.userId) {
    redirect("/login?next=/survey-responses");
  }

  if (!isLeaderSession(session)) {
    return (
      <main className="page-wrap survey-shell">
        <section className="surveyx-card card">
          <h1 className="survey-title">Survey Responses</h1>
          <p className="muted">
            You are signed in as <strong>{session.email || "an authenticated user"}</strong>, but this account is not authorised to view responses.
          </p>
          <p className="muted">Use an approved admin email or ask an admin to add your address to SURVEY_ADMIN_EMAILS.</p>
        </section>
      </main>
    );
  }

  const db = getSupabaseAdminClient();
  if (!db) {
    return (
      <main className="page-wrap">
        <h1>Survey Responses</h1>
        <p className="muted">Supabase is not configured.</p>
      </main>
    );
  }

  const { data: primaryData, error: primaryError } = await db
    .from("survey_responses")
    .select("*")
    .eq("completed", true)
    .order("created_at", { ascending: false });

  let data = primaryData || [];

  if (primaryError && isLegacySurveySchemaError(primaryError)) {
    const { data: legacyData, error: legacyError } = await db
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (legacyError) {
      return (
        <main className="page-wrap">
          <h1>Survey Responses</h1>
          <p className="muted">Could not load responses: {legacyError.message}</p>
        </main>
      );
    }

    data = (legacyData || []).map(mapLegacyRowToModern).filter((row) => row.completed);
  } else if (primaryError) {
    return (
      <main className="page-wrap">
        <h1>Survey Responses</h1>
        <p className="muted">Could not load responses: {primaryError.message}</p>
      </main>
    );
  }

  return (
    <main className="page-wrap survey-shell">
      <section className="surveyx-card card">
        <h1 className="survey-title">Survey Responses</h1>
        <p className="muted survey-description">Completed responses are shown newest first.</p>
        <div className="surveyx-response-toolbar">
          <a className="button surveyx-next-btn" href="/api/survey/export">
            Download CSV
          </a>
        </div>
      </section>

      <div className="surveyx-response-list">
        {(data || []).map((row) => (
          <article key={row.id} className="card surveyx-response-card">
            <header className="surveyx-response-head">
              <div>
                <p className="surveyx-response-id">{row.id}</p>
                <p className="muted">Submitted: {prettyDate(row.created_at)}</p>
              </div>
              <RoleChip role={row.role} />
            </header>

            <SectionBlock title="Part A" data={row.part_a} />
            <SectionBlock title="Part B" data={row.part_b} />
            <SectionBlock title="Part C" data={row.part_c} />
            <SectionBlock title="Part D" data={row.part_d} />
          </article>
        ))}

        {(!data || data.length === 0) ? (
          <div className="card">
            <p className="muted">No completed responses yet.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
