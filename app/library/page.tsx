"use client";

import { useEffect, useState } from "react";

type LibraryItem = {
  id: string;
  title: string;
  yearGroup: string;
  subject: string;
  topic: string;
  json: string;
  createdAt: string;
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [status, setStatus] = useState("");

  async function loadLibrary() {
    const res = await fetch("/api/library");
    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error ?? "Could not load library");
      return;
    }

    setItems(data.items ?? []);
    setStatus("");
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setStatus(data?.error ?? "Delete failed");
      return;
    }

    await loadLibrary();
    if (selected?.id === id) {
      setSelected(null);
    }
  }

  useEffect(() => {
    void loadLibrary();
  }, []);

  return (
    <main className="page-wrap">
      <h1>Lesson Library</h1>
      <p className="muted">Saved packs linked to your teacher account.</p>
      {status && <p className="muted">{status}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <section className="card">
          <h2>Saved Packs</h2>
          <div className="stack">
            {items.length === 0 && <p className="muted">No saved packs yet.</p>}
            {items.map((item) => (
              <div key={item.id} style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.6rem" }}>
                <p>
                  <strong>{item.title}</strong>
                </p>
                <p className="muted">
                  {item.yearGroup} • {item.subject} • {item.topic}
                </p>
                <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="button" onClick={() => setSelected(item)} type="button">
                    View
                  </button>
                  <button className="button" onClick={() => void deleteItem(item.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Preview</h2>
          {selected ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{selected.json}</pre>
          ) : (
            <p className="muted">Select a pack to view.</p>
          )}
        </section>
      </div>
    </main>
  );
}
