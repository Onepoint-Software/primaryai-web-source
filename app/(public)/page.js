import Nav from "@/components/marketing/Nav";
import LandingHero from "@/components/marketing/LandingHero";
import LandingRightPanel from "@/components/marketing/LandingRightPanel";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="page-wrap landing-page-wrap">
      <video
        className="landing-video-bg"
        src="/Classroom_transition_between_202604201805.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <Nav />
      <div className="landing-split">
        <div className="landing-split-left landing-main-content">
          <LandingHero />
        </div>
        <LandingRightPanel />
      </div>
      <section className="landing-waitlist-cta">
        <div className="landing-waitlist-inner">
          <span className="landing-waitlist-label">Launching Spring 2026</span>
          <h2 className="landing-waitlist-heading">
            Be among the first to try PrimaryAI
          </h2>
          <p className="landing-waitlist-text">
            Join the waitlist for early access and help shape the product.
          </p>
          <Link className="landing-waitlist-btn" href="/survey">
            Join the waitlist
          </Link>
        </div>
      </section>
    </main>
  );
}
