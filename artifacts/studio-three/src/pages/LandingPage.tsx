import { useEffect, useRef, useState } from "react";
import hiit from "@assets/image_1777662764571.png";
import yoga from "@assets/image_1777662794631.png";
import pilates from "@assets/image_1777662809847.png";
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
      { threshold: 0.1 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 55);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div id="landing-page">
      <nav className="nav">
        <div className="nav-logo">
          STUDIO<span className="slash">///</span>
        </div>
        <button className="nav-btn" onClick={onBook}>
          Book Pass →
        </button>
      </nav>

      <div className={`sticky-cta${stickyVisible ? " visible" : ""}`}>
        <div className="sticky-cta-text">
          <strong>3-Class Pass</strong>
          <span>All formats · All studios · $60</span>
        </div>
        <button className="sticky-btn" onClick={onBook}>
          Book Now →
        </button>
      </div>

      <section className="hero" ref={heroRef}>
        <div className="hero-bg" style={{ backgroundImage: `url(${hiit})`, backgroundPosition: "center center" }} />
        <div className="hero-gradient" />
        <div className="hero-grain" />
        <div className="hero-content">
          <div className="hero-pill">
            <div className="hero-pill-dot" />
            <span>Intro Offer · Limited Access</span>
          </div>
          <h1 className="hero-hl">
            THREE
            <br />
            CLASSES.<span className="price">$60.</span>
          </h1>
          <p className="hero-sub">
            Try any format — Cycle, Interval, Strength, Yoga, Pilates — across all
            Studio Three locations. No commitment. No conditions.
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
        <div className="scroll-cue">
          <div className="scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      <section className="section-pass">
        <span className="eyebrow reveal">What You Get</span>
        <h2 className="section-title reveal">
          Three Classes.
          <br />
          No Catch.
        </h2>
        <div className="pass-cards">
          <div className="pass-card reveal">
            <div className="pass-card-num">01</div>
            <div className="pass-card-title">HIIT</div>
            <p className="pass-card-desc">
              High-intensity functional training that builds power, burns calories,
              and pushes your limits — coached by world-class instructors.
            </p>
          </div>
          <div className="pass-card reveal">
            <div className="pass-card-num">02</div>
            <div className="pass-card-title">Yoga</div>
            <p className="pass-card-desc">
              Flow and strength sessions that deepen flexibility, sharpen focus,
              and leave you reset — available at every Studio Three location.
            </p>
          </div>
          <div className="pass-card reveal">
            <div className="pass-card-num">03</div>
            <div className="pass-card-title">Pilates</div>
            <p className="pass-card-desc">
              Hot mat Pilates that targets your core from every angle. Precise,
              challenging, and genuinely different from anything else you've tried.
            </p>
          </div>
          <div className="pass-card reveal">
            <div className="pass-card-num">04</div>
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
          <img src={hiit} alt="HIIT" loading="lazy" />
          <div className="mosaic-label">HIIT</div>
        </div>
        <div className="mosaic-cell">
          <img src={strength} alt="Core" loading="lazy" />
          <div className="mosaic-label">Core</div>
        </div>
        <div className="mosaic-cell mosaic-cell-wide">
          <img src={yoga} alt="Yoga" loading="lazy" style={{ objectPosition: "center 30%" }} />
          <div className="mosaic-label">Yoga</div>
        </div>
      </div>

      <section className="section-formats">
        <span className="eyebrow reveal" style={{ color: "rgba(255,255,255,0.35)" }}>
          Your Options
        </span>
        <h2 className="section-title reveal">
          Three Ways
          <br />
          To Train.
        </h2>
        <p className="formats-sub reveal">
          Use all three on one format or try something new each time. Your pass,
          your call.
        </p>
        <div className="format-list">
          {[
            { idx: "01", name: "HIIT", tag: "High intensity\nfunctional" },
            { idx: "02", name: "Yoga", tag: "Flow &\nstrength" },
            { idx: "03", name: "Pilates", tag: "Hot mat\ncore work" },
          ].map((f) => (
            <div className="format-row reveal" key={f.idx}>
              <span className="format-idx">{f.idx}</span>
              <span className="format-name">{f.name}</span>
              <span className="format-tag" style={{ whiteSpace: "pre-line" }}>
                {f.tag}
              </span>
              <span className="format-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-bg" />
        <div className="quote-content">
          <div className="quote-stars">★★★★★</div>
          <p className="quote-text reveal">
            "I came in skeptical. I left having booked my membership before the
            class even ended."
          </p>
          <p className="quote-attr reveal">
            — Melissa R. · River North · Cycle + Interval Member
          </p>
        </div>
      </section>

      <section className="section-reviews">
        <span className="eyebrow reveal">Member Stories</span>
        <h2 className="section-title reveal">
          From The
          <br />
          Community.
        </h2>
        <div className="reviews-list">
          <div className="review-card reveal">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">
              "I'd been putting off trying a boutique studio for years — too
              intimidating, too expensive to commit without knowing. The
              three-class pass removed every excuse. First class was Cycle at
              Lincoln Park. The energy in that room is something you don't find
              at a regular gym. By class three I was asking the front desk about
              membership options before I'd even showered."
            </p>
            <div className="review-attr">
              Jordan K. · Lincoln Park · Member since Jan 2025
            </div>
          </div>
          <div className="review-card reveal">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">
              "I tried Interval on a Wednesday morning expecting it to feel like
              a standard HIIT class. It's not. The programming is genuinely
              different — it builds on itself, the coaches actually coach. I used
              my second class on Hot Mat Pilates thinking it'd be a recovery day.
              That was humbling. Both are now in my weekly rotation. Signed up
              for All-Access the week after."
            </p>
            <div className="review-attr">
              Danielle M. · River North · All-Access Member
            </div>
          </div>
          <div className="review-card reveal">
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
        <div className="final-bg" />
        <div className="final-overlay" />
        <div className="final-content">
          <span className="eyebrow reveal">Intro Offer</span>
          <h2 className="final-title reveal">
            3 Classes.
            <br />
            $60.
            <br />
            Start Now.
          </h2>
          <button className="btn-final reveal" onClick={onBook}>
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
          <p className="final-note reveal">
            No auto-renew · No commitment · 60 days to use all three
          </p>
        </div>
      </section>

      <footer>
        <div className="footer-logo">
          STUDIO<span className="slash">///</span>
        </div>
        <div className="footer-copy">© 2026 Studio Three. All rights reserved.</div>
      </footer>
    </div>
  );
}
