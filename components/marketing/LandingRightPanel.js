"use client";

import { useState, useEffect } from "react";
import LandingDevices from "./LandingDevices";

export default function LandingRightPanel() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setCollapsed(false), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="landing-panel-outer">
      <aside className={`landing-split-right${collapsed ? " is-collapsed" : ""}`}>
        <LandingDevices />
      </aside>
      <button
        type="button"
        className={`landing-panel-toggle${collapsed ? " is-collapsed" : ""}`}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Show app preview" : "Hide app preview"}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 8l4-4 4 4" />
        </svg>
        <span>{collapsed ? "Preview" : "Hide"}</span>
      </button>
    </div>
  );
}
