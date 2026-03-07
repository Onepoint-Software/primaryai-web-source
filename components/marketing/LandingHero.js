"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LAPTOP_FRAMES = [
  { src: "/images/landing/home-laptop-1.png", width: 2838, height: 1484 },
  { src: "/images/landing/home-laptop-2.png", width: 2862, height: 1476 },
  { src: "/images/landing/home-laptop-3.png", width: 2838, height: 1450 },
  { src: "/images/landing/home-laptop-4.png", width: 2794, height: 1448 },
  { src: "/images/landing/home-laptop-5.png", width: 2806, height: 1470 },
];

const MOBILE_FRAMES = [
  { src: "/images/landing/home-mobile-fit-5.png", width: 429, height: 916 },
  { src: "/images/landing/home-mobile-fit-6.png", width: 436, height: 930 },
  { src: "/images/landing/home-mobile-fit-7.png", width: 428, height: 914 },
];

const SALES_POINTS = [
  "Build your planning around your own time with an AI designed to protect your week.",
  "Curriculum-aligned planning tailored to your class’s individual needs.",
  "Trusted by teachers and shaped by real classroom practice.",
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
  const [laptopFrameIndex, setLaptopFrameIndex] = useState(0);
  const [mobileFrameIndex, setMobileFrameIndex] = useState(0);
  const showSplash = !(pageLoaded && minimumSplashElapsed);
  const activeMobileFrame = MOBILE_FRAMES[mobileFrameIndex] ?? MOBILE_FRAMES[0];

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

  useEffect(() => {
    if (LAPTOP_FRAMES.length <= 1 && MOBILE_FRAMES.length <= 1) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setLaptopFrameIndex((current) => (current + 1) % LAPTOP_FRAMES.length);
      setMobileFrameIndex((current) => (current + 1) % MOBILE_FRAMES.length);
    }, 6200);
    return () => {
      window.clearInterval(intervalId);
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
            The week planner that puts your life first and your teaching in order.
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

          <div className="landing-cta-row">
            <Link className="landing-thoughts-btn" href="/survey">
              Your Thoughts
            </Link>
          </div>
        </div>

        <div className="landing-device-showcase" aria-label="PrimaryAI dashboard preview">
          <div className="landing-laptop-wrap">
            <div className="landing-laptop-screen-shell">
              <div className="landing-laptop-screen">
                <div className="landing-frame-stage">
                  {LAPTOP_FRAMES.map((frame, index) => (
                    <Image
                      key={frame.src}
                      className={`landing-frame-image landing-frame-layer${index === laptopFrameIndex ? " is-active" : ""}`}
                      src={frame.src}
                      alt="PrimaryAI current dashboard screen"
                      width={frame.width}
                      height={frame.height}
                      priority={index === 0}
                      loading="eager"
                      quality={85}
                      sizes="(max-width: 760px) 100vw, (max-width: 1200px) 60vw, 700px"
                    />
                  ))}
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
            <div className="landing-phone-screen">
              <div className="landing-frame-stage landing-frame-stage-phone">
                <Image
                  key={activeMobileFrame.src}
                  className="landing-frame-image landing-frame-image-phone landing-frame-layer is-active"
                  src={activeMobileFrame.src}
                  alt="PrimaryAI current dashboard screen on mobile"
                  width={activeMobileFrame.width}
                  height={activeMobileFrame.height}
                  priority
                  loading="eager"
                  quality={85}
                  sizes="(max-width: 760px) 26vw, 160px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className={`landing-footer-note${showSplash ? " landing-content-hidden" : ""}`}>
        Launching Spring 2026 | Design & Build by{" "}
        <a className="landing-onepoint-link" href="https://www.onepointconsult.com">
          onepointconsult.com
        </a>
      </p>
    </section>
  );
}
