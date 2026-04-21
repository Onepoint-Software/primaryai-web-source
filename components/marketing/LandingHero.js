"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SALES_POINTS = [
  "Plan lessons, tasks and personal commitments in one clear week.",
  "Create curriculum-aligned lesson packs from the context you already have.",
  "Keep resources, notes and schedule decisions connected.",
];

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingHero() {
  const [iconKey] = useState(0);
  const [sparkleLive, setSparkleLive] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const showSplash = !(pageLoaded && minimumSplashElapsed);

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, 700);

    function handleLoaded() {
      setPageLoaded(true);
    }

    if (document.readyState === "complete") {
      handleLoaded();
    } else {
      window.addEventListener("load", handleLoaded, { once: true });
    }

    return () => {
      window.clearTimeout(minimumTimer);
      window.removeEventListener("load", handleLoaded);
    };
  }, []);

  function onFinalStrokeAnimationEnd(event) {
    if (event.animationName !== "landingHandDraw") {
      return;
    }
    setSparkleLive(true);
  }

  return (
    <section className="landing-hero">
      <div className={`landing-splash-screen${showSplash ? "" : " is-hidden"}`} aria-hidden={!showSplash}>
        <div className="landing-splash-inner">
          <div className="landing-title-row landing-title-row-splash">
            <div className="landing-education-icon landing-education-icon-static">
              <svg
                key={`${iconKey}-splash`}
                className="landing-replay"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f3fffb"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="10"
                shapeRendering="geometricPrecision"
                aria-label="PrimaryAI logo"
              >
                <path
                  className="landing-draw-line landing-s-1 landing-roof-stroke"
                  pathLength="1"
                  d="M2.5,7.5 L11.5,3.1 c0.3,-0.15, 0.7,-0.15, 1,0 L21.5,7.5"
                />
                <path
                  className="landing-draw-line landing-s-2"
                  pathLength="1"
                  d="M19.5,12 v6.5 c0,1.1, -0.9,2, -2,2 h-11 c-1.1,0, -2,-0.9, -2,-2 V12"
                />
                <path
                  className="landing-draw-line landing-s-3"
                  pathLength="1"
                  d="M19.5,12 C17.5,10.2, 14.5,10.2, 12,12"
                />
                <path className="landing-draw-line landing-s-4" pathLength="1" d="M12,12.2 v8.1" />
                <path
                  className="landing-draw-line landing-s-5"
                  pathLength="1"
                  d="M12,12 C9.5,10.2, 6.5,10.2, 4.5,12"
                />
              </svg>
            </div>

            <h1 className="landing-title">
              <span className={sparkleLive ? "landing-ai-sparkle sparkle-live" : "landing-ai-sparkle"}>
                <span className="landing-primary-word">
                  Pr<span className="landing-accent-orange">i</span>m
                  <span className="landing-accent-orange">a</span>ry
                </span>
                <span className="landing-accent-orange">A</span>
                <span className="landing-accent-orange">I</span>
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className={`landing-hero-grid${showSplash ? " landing-content-hidden" : ""}`}>
        <div className="landing-copy">
          <div className="landing-title-row">
            <div className="landing-education-icon landing-education-icon-static">
              <svg
                key={iconKey}
                className="landing-replay"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f3fffb"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="10"
                shapeRendering="geometricPrecision"
                aria-label="PrimaryAI logo"
              >
                <path
                  className="landing-draw-line landing-s-1 landing-roof-stroke"
                  pathLength="1"
                  d="M2.5,7.5 L11.5,3.1 c0.3,-0.15, 0.7,-0.15, 1,0 L21.5,7.5"
                />
                <path
                  className="landing-draw-line landing-s-2"
                  pathLength="1"
                  d="M19.5,12 v6.5 c0,1.1, -0.9,2, -2,2 h-11 c-1.1,0, -2,-0.9, -2,-2 V12"
                />
                <path
                  className="landing-draw-line landing-s-3"
                  pathLength="1"
                  d="M19.5,12 C17.5,10.2, 14.5,10.2, 12,12"
                />
                <path className="landing-draw-line landing-s-4" pathLength="1" d="M12,12.2 v8.1" />
                <path
                  className="landing-draw-line landing-s-5"
                  pathLength="1"
                  d="M12,12 C9.5,10.2, 6.5,10.2, 4.5,12"
                  onAnimationEnd={onFinalStrokeAnimationEnd}
                />
              </svg>
            </div>

            <h1 className="landing-title">
              <span className={sparkleLive ? "landing-ai-sparkle sparkle-live" : "landing-ai-sparkle"}>
                <span className="landing-primary-word">
                  Pr<span className="landing-accent-orange">i</span>m
                  <span className="landing-accent-orange">a</span>ry
                </span>
                <span className="landing-accent-orange">A</span>
                <span className="landing-accent-orange">I</span>
              </span>
            </h1>
          </div>

          <h2 className="landing-sales-headline">
            Plan your teaching week around real life.
          </h2>

          <ul className="landing-sales-points">
            {SALES_POINTS.map((point) => (
              <li key={point} className="landing-sales-point">
                <span className="landing-sales-point-dot">
                  <CheckIcon />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

      </div>

    </section>
  );
}
