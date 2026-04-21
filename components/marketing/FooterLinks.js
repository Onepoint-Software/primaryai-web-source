import Link from "next/link";
import CookiePreferencesLink from "./CookiePreferencesLink";

const LANDING_STYLE = {
  background: "rgba(0,0,0,0.65)",
  color: "rgba(255,255,255,0.65)",
  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
  position: "relative",
  zIndex: 10,
};

const LANDING_LINK_STYLE = {
  color: "rgba(255,255,255,0.85)",
};

export default function FooterLinks({ landing = false }) {
  return (
    <footer
      className="site-footer-links"
      style={landing ? LANDING_STYLE : undefined}
      aria-label="Footer links"
    >
      <Link href="/guide" style={landing ? LANDING_LINK_STYLE : undefined}>User Guide</Link>
      <span aria-hidden="true">|</span>
      <Link href="/legal/privacy" style={landing ? LANDING_LINK_STYLE : undefined}>Privacy Policy</Link>
      <span aria-hidden="true">|</span>
      <Link href="/legal/terms" style={landing ? LANDING_LINK_STYLE : undefined}>Terms</Link>
      <span aria-hidden="true">|</span>
      <Link href="/legal/compliance" style={landing ? LANDING_LINK_STYLE : undefined}>Compliance</Link>
      <span aria-hidden="true">|</span>
      <Link href="/contact" style={landing ? LANDING_LINK_STYLE : undefined}>Contact</Link>
      <span aria-hidden="true">|</span>
      <Link href="/survey" style={landing ? LANDING_LINK_STYLE : undefined}>Share Your Thoughts</Link>
      <span aria-hidden="true">|</span>
      <Link href="/survey-responses" style={landing ? LANDING_LINK_STYLE : undefined}>Survey Responses</Link>
      <span aria-hidden="true">|</span>
      <Link href="/stories" style={landing ? LANDING_LINK_STYLE : undefined}>Contribute to Development</Link>
      <span aria-hidden="true">|</span>
      <CookiePreferencesLink style={landing ? LANDING_LINK_STYLE : undefined} />
    </footer>
  );
}
