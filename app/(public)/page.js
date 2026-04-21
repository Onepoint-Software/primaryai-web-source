import Nav from "@/components/marketing/Nav";
import LandingHero from "@/components/marketing/LandingHero";
import LandingRightPanel from "@/components/marketing/LandingRightPanel";

export default function LandingPage() {
  return (
    <main className="page-wrap landing-page-wrap">
      <video
        className="landing-video-bg"
        src="/Flow_202604210959.mp4"
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
    </main>
  );
}
