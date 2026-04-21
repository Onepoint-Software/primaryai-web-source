"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pa_cookie_consent";

// Global opener — called from footer link
if (typeof window !== "undefined") {
  window.__openCookiePreferences = null;
}

export function openCookiePreferences() {
  if (typeof window !== "undefined" && window.__openCookiePreferences) {
    window.__openCookiePreferences();
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.__openCookiePreferences = () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setVisible(true);
    };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
    return () => { window.__openCookiePreferences = null; };
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(92vw, 560px)",
        zIndex: 9999,
        padding: "1rem 1.15rem",
        borderRadius: "14px",
        border: "1px solid var(--border, #1e293b)",
        background: "var(--card-bg, #0f172a)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted, #94a3b8)", lineHeight: 1.55, flex: "1 1 260px" }}>
        PrimaryAI uses essential cookies to keep you signed in and remember your preferences. We do not use tracking,
        analytics, or advertising cookies. See our{" "}
        <a href="/legal/privacy" style={{ color: "var(--accent, #6366f1)" }}>Privacy Policy</a> and{" "}
        <a href="/legal/compliance" style={{ color: "var(--accent, #6366f1)" }}>Compliance page</a> for details.
      </p>
      <div style={{ display: "flex", gap: "0.55rem", flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={accept}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent, #6366f1)",
            color: "var(--accent-text, #fff)",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "8px",
            border: "1px solid var(--border, #1e293b)",
            background: "transparent",
            color: "var(--muted, #94a3b8)",
            fontSize: "0.82rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
