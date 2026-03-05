"use client";

import { useMemo, useState } from "react";

const CONTACT_EMAIL = "admin@primaryAI.org.uk";

function ContactRow({ icon, label, value, href }) {
  return (
    <a className="contact-row" href={href}>
      <span className="contact-row-icon" aria-hidden="true">{icon}</span>
      <span className="contact-row-copy">
        <strong>{label}</strong>
        <span>{value}</span>
      </span>
    </a>
  );
}

export default function ContactClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = `PrimaryAI Enquiry from ${name || "Website Visitor"}`;
    const bodyLines = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `School/Organisation: ${school || "-"}`,
      "",
      "Message:",
      message || "-",
    ];
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
  }, [email, message, name, school]);

  const qrImageUrl = useMemo(() => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:PrimaryAI",
      "ORG:PrimaryAI",
      "TEL;TYPE=WORK:+443301333395",
      `EMAIL;TYPE=INTERNET:${CONTACT_EMAIL}`,
      "URL:https://primaryai.org.uk",
      "END:VCARD",
    ].join("\n");
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(vcard)}`;
  }, []);

  function handleDownloadContact() {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:PrimaryAI",
      "ORG:PrimaryAI",
      `EMAIL;TYPE=INTERNET:${CONTACT_EMAIL}`,
      "URL:https://primaryai.org.uk",
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PrimaryAI-contact.vcf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="contact-shell">
      <header className="contact-hero">
        <p className="contact-kicker">Get In Touch</p>
        <h1>Contact PrimaryAI</h1>
        <p>
          We would love to hear from teachers, school leaders, and trusts. Send us your enquiry and we will reply
          from <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </header>

      <div className="contact-grid">
        <article className="contact-card">
          <h2>Contact details</h2>
          <p className="contact-muted">For product enquiries, pilots, and partnership conversations.</p>

          <div className="contact-rows">
            <ContactRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16v16H4z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              }
              label="Email"
              value={CONTACT_EMAIL}
              href={`mailto:${CONTACT_EMAIL}`}
            />
            <ContactRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
                  <path d="M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z" />
                  <path d="M3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z" />
                  <path d="M9 19a3 3 0 0 0 6 0" />
                </svg>
              }
              label="Phone"
              value="+44(0)3301 333 395"
              href="tel:+4403301333395"
            />
            <ContactRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15 15 0 0 1 0 20" />
                  <path d="M12 2a15 15 0 0 0 0 20" />
                </svg>
              }
              label="Website"
              value="primaryai.org.uk"
              href="https://primaryai.org.uk"
            />
          </div>

          <button type="button" className="landing-thoughts-btn contact-save-btn" onClick={handleDownloadContact}>
            Save Contact
          </button>

          <div className="contact-qr-block">
            <img
              src={qrImageUrl}
              alt="QR code to save PrimaryAI contact"
              width="170"
              height="170"
              loading="lazy"
            />
            <p>Scan to save contact on your phone</p>
          </div>
        </article>

        <article className="contact-card">
          <h2>Send an enquiry</h2>
          <p className="contact-muted">This opens your email app with a pre-filled draft to our team.</p>

          <div className="contact-form">
            <label>
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </label>
            <label>
              Your email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.org.uk"
              />
            </label>
            <label>
              School or organisation
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Example Primary School" />
            </label>
            <label>
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you need help with…"
                rows={5}
              />
            </label>

            <a className="landing-thoughts-btn contact-send-btn" href={mailtoHref}>
              Draft Email
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
