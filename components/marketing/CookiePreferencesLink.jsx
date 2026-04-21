"use client";

import { openCookiePreferences } from "@/components/CookieBanner";

export default function CookiePreferencesLink({ style }) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
        color: style?.color ?? "inherit",
        textDecoration: "underline",
        textDecorationColor: "transparent",
      }}
    >
      Cookie Preferences
    </button>
  );
}
