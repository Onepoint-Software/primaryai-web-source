"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MockPhone from "./mockui/MockPhone";

// The three preview screens are full 1440×900 renders of the actual app.
// We scale them to fit the laptop chassis via ResizeObserver.
const DashboardPreview    = dynamic(() => import("@/app/(preview)/preview/dashboard/page.js"),     { ssr: false });
const LessonResultPreview = dynamic(() => import("@/app/(preview)/preview/lesson-result/page.js"), { ssr: false });
const LibraryPreview      = dynamic(() => import("@/app/(preview)/preview/library/page.js"),       { ssr: false });

const SCREENS = [
  { Component: DashboardPreview,    label: "Weekly Planner",  kicker: "Dashboard" },
  { Component: LessonResultPreview, label: "Lesson Pack",     kicker: "AI Generator" },
  { Component: LibraryPreview,      label: "Lesson Library",  kicker: "Library" },
];

export default function LandingDevices() {
  const [index, setIndex]       = useState(0);
  const [fading, setFading]     = useState(false);
  const [laptopScale, setLaptopScale] = useState(0.31);
  const [phoneScale, setPhoneScale]   = useState(0.32);
  const screenWrapRef = useRef(null);
  const phoneWrapRef  = useRef(null);

  // Scale laptop screen to fit chassis
  useEffect(() => {
    const el = screenWrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setLaptopScale(entry.contentRect.width / 1440);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scale phone content to fit phone screen
  useEffect(() => {
    const el = phoneWrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setPhoneScale(entry.contentRect.width / 280);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-cycle screens
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SCREENS.length);
        setFading(false);
      }, 350);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  function goTo(i) {
    if (i === index) return;
    setFading(true);
    setTimeout(() => { setIndex(i); setFading(false); }, 350);
  }

  const { Component, label, kicker } = SCREENS[index];

  return (
    <div className="landing-showcase-inner">
      <div className="landing-about-copy">
        <span className="landing-about-kicker">Product preview</span>
        <h2 className="landing-about-heading">One workspace for the week ahead</h2>
        <p className="landing-about-text">
          Lesson packs, library resources, notes and weekly scheduling stay in
          one place, shaped around real primary school practice.
        </p>
      </div>

      <div className="landing-device-showcase" aria-label="PrimaryAI dashboard preview">

        <div className="landing-laptop-wrap">
          <div className="landing-laptop-screen-shell">
            <div className="landing-laptop-screen">
              {/* Measure the real pixel size of the screen area */}
              <div ref={screenWrapRef} style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
                {/* Scale 1440×900 preview content to fill the chassis */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: 1440, height: 900,
                  transformOrigin: "top left",
                  transform: `scale(${laptopScale})`,
                  opacity: fading ? 0 : 1,
                  transition: "opacity 0.35s ease",
                  pointerEvents: "none",
                }}>
                  <Component />
                </div>
              </div>
            </div>
          </div>
          <div className="landing-laptop-base">
            <div className="landing-laptop-notch" />
          </div>
        </div>

        <div className="landing-phone-back-glow" aria-hidden="true" />
        <div className="landing-phone-wrap">
          <div className="landing-phone-notch" />
          <div className="landing-phone-screen" ref={phoneWrapRef}>
            <MockPhone scale={phoneScale} />
          </div>
        </div>

      </div>

      {/* Screen indicator */}
      <div className="landing-screen-nav">
        <div className="landing-screen-dots">
          {SCREENS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`landing-screen-dot${i === index ? " is-active" : ""}`}
              aria-label={`Show ${s.label}`}
            />
          ))}
        </div>
        <span className="landing-screen-label">
          <span className="landing-screen-kicker">{kicker}</span>
          {label}
        </span>
      </div>
    </div>
  );
}
