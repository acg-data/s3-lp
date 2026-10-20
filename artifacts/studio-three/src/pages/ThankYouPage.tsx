import { useEffect, useRef } from "react";
import Arrow from "@/components/Arrow";
import { confirmedInquiry, trackConfirmedLead } from "@/lib/meta-pixel";

// Kept after the page footer: conversions require a successful inquiry receipt.
function LeadAtFooter() {
  useEffect(() => {
    trackConfirmedLead();
  }, []);
  return null;
}

export default function ThankYouPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const received = !!confirmedInquiry();
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="thank-you-page">
      <a className="skip-link" href="#thank-you-content">
        Skip to content
      </a>
      <header className="site-header thank-you-header">
        <a className="brand" href="/" aria-label="Studio Three Brickell home">
          <img
            src="/studio-three-logo.png"
            width="1316"
            height="142"
            alt="Studio Three"
          />
        </a>
        <a className="nav-about" href="/#studio">
          View the studio
        </a>
      </header>
      <main className="thank-you-main" id="thank-you-content">
        <div className="thank-you-copy">
          <h1 ref={headingRef} tabIndex={-1}>
            {received ? (
              <>
                Thank you.
                <br />
                <span>We’ll be in touch.</span>
              </>
            ) : (
              <>
                Founding memberships.
                <br />
                <span>Studio Three Brickell.</span>
              </>
            )}
          </h1>
          <p className="thank-you-description">
            {received
              ? "Your inquiry is received. Our Brickell team will contact you with founding membership options and pricing."
              : "Strength, Pilates and Yoga at 830 Brickell. Request founding membership options and pricing from our studio team."}
          </p>
          {received && (
            <p className="thank-you-email">
              Check your inbox for a confirmation email. If you don’t see it,
              check your spam or junk folder.
            </p>
          )}
          <a className="button" href={received ? "/#studio" : "/#membership"}>
            {received ? "Back to the studio" : "Get membership details"}
            <Arrow />
          </a>
        </div>
        <picture className="thank-you-photo">
          <img
            src="/photos/brickell-strength-800.webp"
            srcSet="/photos/brickell-strength-480.webp 480w, /photos/brickell-strength-800.webp 800w, /photos/brickell-strength-1280.webp 1280w"
            sizes="(max-width: 767px) 100vw, 50vw"
            width="800"
            height="534"
            alt="A Studio Three athlete training with dumbbells"
          />
        </picture>
      </main>
      <footer className="site-footer thank-you-footer">
        <p>Train for Something Bigger.</p>
        <div className="footer-location">
          Studio Three Brickell
          <br />
          96 SE 8th St · Miami, FL
        </div>
        <div className="footer-meta">
          <a href="https://studiothree.com/privacy-policy/">Privacy policy</a>
          <span>© {new Date().getFullYear()} Studio Three</span>
        </div>
      </footer>
      <LeadAtFooter />
    </div>
  );
}
