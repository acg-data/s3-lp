import { useEffect, useRef, useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import community from "@assets/image_1777662764571.png";
import yoga from "@assets/image_1777662794631.png";
import strength from "@assets/image_1777662826834.png";

const membershipHref = import.meta.env.VITE_MEMBERSHIP_URL || "#membership";

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M3 9h12M10 4l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div id="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Studio Three home">
          STUDIO<span>///</span>
        </a>
        <span className="header-location">Brickell, Miami</span>
        <nav aria-label="Main navigation">
          <a className="nav-about" href="#studio">
            The Studio Three experience
          </a>
          <a className="button button-small" href={membershipHref}>
            Membership details <Arrow />
          </a>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" ref={heroRef}>
          <div className="hero-copy">
            <h1>
              Make your
              <br />
              first <span>move.</span>
            </h1>
            <p>
              Founding memberships are now available at Studio Three Brickell. A
              new studio. A new community. Your place in it.
            </p>
            <a className="button button-light" href={membershipHref}>
              Get founding membership details <Arrow />
            </a>
            <a className="text-link" href="#studio">
              Discover Studio Three <span aria-hidden="true">↓</span>
            </a>
            <div className="hero-footnote">
              <span className="location-mark" aria-hidden="true">
                ↗
              </span>{" "}
              Studio Three is coming to Brickell.
            </div>
          </div>
          <figure className="hero-photo">
            <img
              src={community}
              alt="Studio Three members together in a training studio"
              width="800"
              height="600"
              fetchPriority="high"
            />
            <figcaption>Good energy. Better company.</figcaption>
          </figure>
        </section>

        <section className="intro" id="studio">
          <h2>
            More than a workout.
            <br />
            <span>A place to belong.</span>
          </h2>
          <div className="intro-copy">
            <p>
              Movement brings us together. At Studio Three, the experience is as
              much about the people beside you as the work you put in.
            </p>
            <p>
              Be part of our next chapter in Brickell. Connect with our studio
              manager to explore founding membership options and find your way
              in.
            </p>
          </div>
        </section>

        <section
          className="photo-story"
          aria-label="A look at the Studio Three experience"
        >
          <figure className="story-image story-wide">
            <img
              src={yoga}
              alt="A Studio Three group moving through a yoga practice"
              width="800"
              height="600"
              loading="lazy"
            />
            <figcaption>Space to reset.</figcaption>
          </figure>
          <figure className="story-image story-tall">
            <img
              src={strength}
              alt="Focused strength and core training at Studio Three"
              width="800"
              height="600"
              loading="lazy"
            />
            <figcaption>Room to grow.</figcaption>
          </figure>
        </section>

        <section className="membership" id="membership" ref={inquiryRef}>
          <div className="membership-copy">
            <h2>
              Your first step
              <br />
              starts with
              <br />
              <span>a conversation.</span>
            </h2>
            <p>
              Tell us a little about yourself. Our Brickell studio manager will
              reach out personally with founding membership details and help you
              take the next step.
            </p>
            <div className="personal-note">
              <span aria-hidden="true">↗</span>
              <p>
                A personal welcome.
                <br />
                From our team to you.
              </p>
            </div>
          </div>
          {membershipHref === "#membership" ? (
            <InquiryForm />
          ) : (
            <div className="membership-direct">
              <h3>Explore your membership.</h3>
              <p>
                Visit our membership page to see the latest options and get
                started.
              </p>
              <a className="button" href={membershipHref}>
                View memberships <Arrow />
              </a>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#" aria-label="Studio Three home">
          STUDIO<span>///</span>
        </a>
        <span>Brickell, Miami</span>
        <span>© {new Date().getFullYear()} Studio Three</span>
      </footer>
      <div
        className={`mobile-action${stickyVisible ? " is-visible" : ""}`}
        inert={!stickyVisible}
      >
        <a className="button" href={membershipHref}>
          Get membership details <Arrow />
        </a>
      </div>
    </div>
  );
}
