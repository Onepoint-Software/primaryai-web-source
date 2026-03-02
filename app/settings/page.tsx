"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  defaultYearGroup: string;
  defaultSubject: string;
  tone: string;
  schoolType: string;
  sendFocus: boolean;
  autoSave: boolean;
};

const INITIAL_PROFILE: Profile = {
  defaultYearGroup: "Year 4",
  defaultSubject: "Maths",
  tone: "professional_uk",
  schoolType: "primary",
  sendFocus: false,
  autoSave: false,
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok && data?.profile) {
        setProfile({
          defaultYearGroup: data.profile.defaultYearGroup ?? INITIAL_PROFILE.defaultYearGroup,
          defaultSubject: data.profile.defaultSubject ?? INITIAL_PROFILE.defaultSubject,
          tone: data.profile.tone ?? INITIAL_PROFILE.tone,
          schoolType: data.profile.schoolType ?? INITIAL_PROFILE.schoolType,
          sendFocus: Boolean(data.profile.sendFocus),
          autoSave: Boolean(data.profile.autoSave),
        });
      } else {
        setStatus(data?.error ?? "Could not load profile");
      }
    })();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving...");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const data = await res.json();
    setStatus(res.ok ? "Saved" : data?.error ?? "Save failed");
  }

  return (
    <main className="page-wrap">
      <h1>Teacher Settings</h1>
      <p className="muted">Default preferences for personalised lesson generation.</p>
      <form onSubmit={onSave} className="card" style={{ display: "grid", gap: "0.75rem", maxWidth: 720 }}>
        <label>
          Default Year Group
          <select
            value={profile.defaultYearGroup}
            onChange={(e) => setProfile({ ...profile, defaultYearGroup: e.target.value })}
          >
            {["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          Default Subject
          <select
            value={profile.defaultSubject}
            onChange={(e) => setProfile({ ...profile, defaultSubject: e.target.value })}
          >
            {["Maths", "English", "Science", "Geography", "History", "Computing"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tone
          <select value={profile.tone} onChange={(e) => setProfile({ ...profile, tone: e.target.value })}>
            {["professional_uk", "warm", "strict"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          School Type
          <select
            value={profile.schoolType}
            onChange={(e) => setProfile({ ...profile, schoolType: e.target.value })}
          >
            {["primary", "infant", "junior", "SEND"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={profile.sendFocus}
            onChange={(e) => setProfile({ ...profile, sendFocus: e.target.checked })}
          />
          Prefer SEND adaptations by default
        </label>

        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={profile.autoSave}
            onChange={(e) => setProfile({ ...profile, autoSave: e.target.checked })}
          />
          Auto-save generated lesson packs to library
        </label>

        <button className="button" type="submit">
          Save Settings
        </button>
        {status && <p className="muted">{status}</p>}
      </form>
    </main>
  );
}
