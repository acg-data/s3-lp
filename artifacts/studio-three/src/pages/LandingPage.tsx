import { useEffect, useRef, useState } from "react";
import hiit from "@assets/image_1777662764571.png";
import yoga from "@assets/image_1777662794631.png";
import strength from "@assets/image_1777662826834.png";

interface LandingPageProps {
  onBook: () => void;
}

export default function LandingPage({ onBook }: LandingPageProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setStickyVisible(!e.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div id="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <nav className="nav" aria-label="Main navigation">
        <div className="nav-logo">
          STUDIO<span className="slash">///</span>
        </div>
        <div className="nav-links">
          <a href="#the-pass">The pass</a>
          <a href="#formats">Class formats</a>
          <a href="#community">Community</a>
        </div>
        <button className="nav-btn" onClick={onBook}>
          Book Pass →
        </button>
      </nav>

      <div
        className={`sticky-cta${stickyVisible ? " visible" : ""}`}
        inert={!stickyVisible}
      >
        <div className="sticky-cta-text">
          <strong>3-Class Pass</strong>
          <span>All formats · All studios · $60</span>
        </div>
        <button className="sticky-btn" onClick={onBook}>
          Book Now →
        </button>
      </div>

      <main id="main-content" tabIndex={-1}>
        <section
          className="hero"
          ref={heroRef}
          aria-label="Three-class introductory pass"
        >
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${hiit})` }}
          />
          <div className="hero-content">
            <h1 className="hero-hl">
              Three
              <br />
              classes.<span className="price">$60.</span>
            </h1>
            <p className="hero-sub">
              Try any format — Cycle, Interval, Strength, Yoga, Pilates — across
              all Studio Three locations. No commitment. No conditions.
            </p>
            <div className="hero-actions">
              <button className="btn-hero" onClick={onBook}>
                Book Your Pass
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <a className="hero-secondary" href="#the-pass">
                Explore the pass <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-val">3</span>
                <span className="trust-lbl">Classes</span>
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <span className="trust-val">All</span>
                <span className="trust-lbl">Formats</span>
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <span className="trust-val">60</span>
                <span className="trust-lbl">Day Window</span>
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <span className="trust-val">$60</span>
                <span className="trust-lbl">Total</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pass" id="the-pass">
          <h2 className="section-title">
            Three Classes.
            <br />
            No Catch.
          </h2>
          <div className="pass-cards">
            <div className="pass-card">
              <div className="pass-card-title">HIIT</div>
              <p className="pass-card-desc">
                High-intensity functional training that builds power, burns
                calories, and pushes your limits — coached by world-class
                instructors.
              </p>
            </div>
            <div className="pass-card">
              <div className="pass-card-title">Yoga</div>
              <p className="pass-card-desc">
                Flow and strength sessions that deepen flexibility, sharpen
                focus, and leave you reset — available at every Studio Three
                location.
              </p>
            </div>
            <div className="pass-card">
              <div className="pass-card-title">Pilates</div>
              <p className="pass-card-desc">
                Hot mat Pilates that targets your core from every angle.
                Precise, challenging, and genuinely different from anything else
                you've tried.
              </p>
            </div>
            <div className="pass-card">
              <div className="pass-card-title">60-Day Window</div>
              <p className="pass-card-desc">
                Use your three classes anytime within 60 days of purchase. Zero
                pressure. Full flexibility.
              </p>
            </div>
          </div>
        </section>

        <div className="mosaic">
          <div className="mosaic-cell">
            <img
              src={hiit}
              alt="Athlete training in the Studio Three HIIT studio"
              loading="lazy"
              width="800"
              height="600"
            />
            <div className="mosaic-label">HIIT</div>
          </div>
          <div className="mosaic-cell">
            <img
              src={strength}
              alt="Strength and core training at Studio Three"
              loading="lazy"
              width="800"
              height="600"
            />
            <div className="mosaic-label">Core</div>
          </div>
          <div className="mosaic-cell mosaic-cell-wide">
            <img
              src={yoga}
              alt="Yoga practice at Studio Three"
              loading="lazy"
              width="800"
              height="600"
              style={{ objectPosition: "center 30%" }}
            />
            <div className="mosaic-label">Yoga</div>
          </div>
        </div>

        <section className="section-formats" id="formats">
          <h2 className="section-title">
            Three Ways
            <br />
            To Train.
          </h2>
          <p className="formats-sub">
            Use all three on one format or try something new each time. Your
            pass, your call.
          </p>
          <div className="format-list">
            {[
              { idx: "01", name: "HIIT", tag: "High intensity\nfunctional" },
              { idx: "02", name: "Yoga", tag: "Flow &\nstrength" },
              { idx: "03", name: "Pilates", tag: "Hot mat\ncore work" },
            ].map((f) => (
              <div className="format-row" key={f.idx}>
                <span className="format-name">{f.name}</span>
                <span className="format-tag" style={{ whiteSpace: "pre-line" }}>
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="quote-section">
          <div className="quote-content">
            <div className="quote-stars">★★★★★</div>
            <p className="quote-text">
              "I came in skeptical. I left having booked my membership before
              the class even ended."
            </p>
            <p className="quote-attr">
              — Melissa R. · River North · Cycle + Interval Member
            </p>
          </div>
        </section>

        <section className="section-reviews" id="community">
          <h2 className="section-title">
            From The
            <br />
            Community.
          </h2>
          <div className="reviews-list">
            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "I'd been putting off trying a boutique studio for years — too
                intimidating, too expensive to commit without knowing. The
                three-class pass removed every excuse. First class was Cycle at
                Lincoln Park. The energy in that room is something you don't
                find at a regular gym. By class three I was asking the front
                desk about membership options before I'd even showered."
              </p>
              <div className="review-attr">
                Jordan K. · Lincoln Park · Member since Jan 2025
              </div>
            </div>
            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "I tried Interval on a Wednesday morning expecting it to feel
                like a standard HIIT class. It's not. The programming is
                genuinely different — it builds on itself, the coaches actually
                coach. I used my second class on Hot Mat Pilates thinking it'd
                be a recovery day. That was humbling. Both are now in my weekly
                rotation. Signed up for All-Access the week after."
              </p>
              <div className="review-attr">
                Danielle M. · River North · All-Access Member
              </div>
            </div>
            <div className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "My wife convinced me to use the three-class pass with her. I'm
                not a yoga person — I came in on my terms and did Strength twice
                and Interval once. Every single instructor knew my name by the
                third session. That's what got me. It's not just a gym. Twelve
                months later we both still go four times a week."
              </p>
              <div className="review-attr">
                Marcus T. · Bucktown · Member since Mar 2024
              </div>
            </div>
          </div>
        </section>

        <section className="section-final">
          <div
            className="final-bg"
            style={{ backgroundImage: `url(${yoga})` }}
          />
          <div className="final-content">
            <h2 className="final-title">
              3 Classes.
              <br />
              $60.
              <br />
              Start Now.
            </h2>
            <button className="btn-final" onClick={onBook}>
              Book My Pass
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="final-note">
              No auto-renew · No commitment · 60 days to use all three
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-logo">
          STUDIO<span className="slash">///</span>
        </div>
        <div className="footer-copy">
          © 2026 Studio Three. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
