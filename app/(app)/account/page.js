"use client";
export const runtime = 'edge';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    const a = document.createElement("a");
    a.href = "/api/account/export";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDelete() {
    if (deleteConfirm.toLowerCase() !== "delete") return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Could not delete account");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <main className="page-wrap">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em" }}>My Account</h1>

        {/* Data rights */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700 }}>Your data rights</h2>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Under UK GDPR you have the right to access, correct, and delete the personal data we hold about you.
            You can download a complete copy of your data at any time.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={handleExport}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
              <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 6.779a.749.749 0 1 1 1.06-1.06l1.97 1.97Z" />
            </svg>
            Download my data (JSON)
          </button>
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
            Includes your profile, lesson packs, schedule, notes, and tasks. Passwords and payment details are not included.
          </p>
        </div>

        {/* Delete account */}
        <div className="card" style={{ border: "1px solid rgb(239 68 68 / 0.25)", background: "rgb(239 68 68 / 0.03)" }}>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700, color: "#ef4444" }}>Delete account</h2>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Permanently deletes your account and all associated data. This cannot be undone.
          </p>

          {!showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 600,
                border: "1.5px solid #ef4444", background: "transparent", color: "#ef4444",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Delete my account
            </button>
          )}

          {showDeleteConfirm && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600, color: "var(--text)" }}>
                Type <strong>delete</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete"
                style={{
                  padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1.5px solid #ef4444",
                  background: "var(--field-bg)", color: "var(--text)", fontSize: "0.87rem",
                  fontFamily: "inherit", outline: "none", maxWidth: 240,
                }}
              />
              <div style={{ display: "flex", gap: "0.65rem" }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirm.toLowerCase() !== "delete"}
                  style={{
                    padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 600,
                    border: "none", background: "#ef4444", color: "white",
                    cursor: deleting || deleteConfirm.toLowerCase() !== "delete" ? "not-allowed" : "pointer",
                    opacity: deleting || deleteConfirm.toLowerCase() !== "delete" ? 0.6 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); setError(""); }}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
              {error && <p style={{ margin: 0, fontSize: "0.82rem", color: "#ef4444" }}>{error}</p>}
            </div>
          )}
        </div>

        <p style={{ marginTop: "1.25rem", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>
          For data access requests or complaints, contact us via the{" "}
          <a href="/contact" style={{ color: "var(--accent)" }}>Contact page</a>.
          You can also raise a concern with the{" "}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
            Information Commissioner&apos;s Office (ICO)
          </a>.
        </p>
      </div>
    </main>
  );
}
