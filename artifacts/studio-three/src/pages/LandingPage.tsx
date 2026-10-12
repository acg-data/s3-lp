import { useEffect, useRef, useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import community from "@assets/image_1777662764571.png";
import yoga from "@assets/image_1777662794631.png";
import strength from "@assets/image_1777662826834.png";

const membershipHref = import.meta.env.VITE_MEMBERSHIP_URL || "#membership";
const logo = `${import.meta.env.BASE_URL}studio-three-logo.png`;
const directionsHref =
  "https://maps.google.com/maps?saddr=&daddr=96+SE+8th.+St%2CMiami%2CUnited+States+of+America";

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M3 10h14M11 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="Studio Three Brickell home">
      <img src={logo} alt="Studio Three" width="1316" height="142" />
    </a>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const inquiryRef = useRef<HTMLElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = heroRef.current?.getBoundingClientRect();
      const inquiry = inquiryRef.current?.getBoundingClientRect();
      setStickyVisible(
        !!hero &&
          !!inquiry &&
          hero.bottom < 80 &&
          inquiry.top > window.innerHeight,
      );
    };
    const observer = new IntersectionObserver(update, {
      threshold: [0, 0.1, 1],
    });
    if (heroRef.current) observer.observe(heroRef.current);
    if (inquiryRef.current) observer.observe(inquiryRef.current);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Logo />
        <span className="header-location">
          Brickell <span aria-hidden="true">/</span> Miami
        </span>
        <nav aria-label="Main navigation">
          <a className="nav-about" href="#studio">
            Our new studio
          </a>
          <a className="button button-small" href={membershipHref}>
            Founding memberships <Arrow />
          </a>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" ref={heroRef} aria-labelledby="hero-heading">
          <div className="hero-photo">
            <img
              src={community}
              alt="Studio Three members training together"
              width="800"
              height="600"
              fetchPriority="high"
            />
          </div>
          <div className="hero-shade" />
          <div className="hero-copy">
            <h1 id="hero-heading">
              <span className="hero-place">Brickell.</span>
              <span>
                Be part of
                <br />
                the beginning.
              </span>
            </h1>
            <h2 className="hero-offer">Founding memberships now available.</h2>
            <p>
              A new Studio Three. Right here in Brickell. Join our founding
              community and make this next chapter yours.
            </p>
            <a className="button" href={membershipHref}>
              Explore founding membership <Arrow />
            </a>
            <a className="text-link" href="#studio">
              Meet your new studio <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-caption">
            <span>Studio Three</span>
            <span>Train for something bigger.</span>
          </div>
        </section>

        <aside className="location-strip" aria-label="Brickell studio location">
          <div className="location-building">830 Brickell</div>
          <address>
            96 SE 8th St
            <br />
            Miami, FL 33131
          </address>
          <a
            className="text-link"
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Find your new studio <Arrow />
          </a>
        </aside>

        <section className="studio-section" id="studio">
          <div className="studio-intro">
            <h2>
              Your neighborhood.
              <br />
              <span>Your new community.</span>
            </h2>
            <div className="intro-copy">
              <p>
                From high-energy Interval and Cycle to Yoga, Strength and
                Pilates, discover the Studio Three experience—with a new chapter
                at 830 Brickell.
              </p>
              <p>
                Be here from the beginning. Connect with our studio manager to
                explore founding membership options and find your place in the
                community.
              </p>
            </div>
          </div>
          <div className="photo-story" aria-label="The Studio Three experience">
            <figure className="story-image story-wide">
              <img
                src={yoga}
                alt="A Studio Three group practicing yoga"
                width="800"
                height="600"
                loading="lazy"
              />
              <figcaption>Move with intention.</figcaption>
            </figure>
            <figure className="story-image story-tall">
              <img
                src={strength}
                alt="Strength and core training at Studio Three"
                width="800"
                height="600"
                loading="lazy"
              />
              <figcaption>Train for something bigger.</figcaption>
            </figure>
          </div>
        </section>

        <section className="membership" id="membership" ref={inquiryRef}>
          <div className="membership-copy">
            <h2>
              Founding
              <br />
              memberships.
              <br />
              <span>
                A personal
                <br />
                welcome.
              </span>
            </h2>
            <p>
              Make Studio Three Brickell part of your routine from day one.
              Share your details and our studio manager will reach out
              personally with founding membership information.
            </p>
            <div className="personal-note">
              <span className="brand-slashes" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <p>
                Your community starts here.
                <br />
                Studio Three Brickell.
              </p>
            </div>
          </div>
          {membershipHref === "#membership" ? (
            <InquiryForm />
          ) : (
            <div className="membership-direct">
              <h3>Join Studio Three Brickell.</h3>
              <p>
                Explore the latest membership options and take your next step.
              </p>
              <a className="button" href={membershipHref}>
                View memberships <Arrow />
              </a>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <Logo />
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
      <div
        className={`mobile-action${stickyVisible ? " is-visible" : ""}`}
        inert={!stickyVisible}
      >
        <a className="button" href={membershipHref}>
          Founding membership details <Arrow />
        </a>
      </div>
    </div>
  );
}
