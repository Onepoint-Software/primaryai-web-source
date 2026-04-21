import SurveyShell from "./SurveyShell";

export const metadata = {
  title: "PrimaryAI — Educator Survey",
};

export default function SurveyPage() {
  return (
    <main className="page-wrap survey-shell">
      <div className="surveyx-wrap">
        <header className="survey-hero">
          <p className="survey-kicker">PrimaryAI Product Development</p>
          <h1 className="survey-title">Help shape what we build.</h1>
          <p className="survey-description">
            A short survey for UK primary educators. Your honest answers directly influence what PrimaryAI
            prioritises — we read every response.
          </p>
          <div className="survey-hero-meta">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              5–8 minutes
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Anonymous
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Shapes the product
            </span>
          </div>
        </header>
      </div>
      <SurveyShell />
    </main>
  );
}
