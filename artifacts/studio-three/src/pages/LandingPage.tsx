import { useEffect, useRef, useState } from "react";
import Arrow from "@/components/Arrow";
import InquiryForm from "@/components/InquiryForm";
import StudioReviews from "@/components/StudioReviews";

const membershipHref = import.meta.env.VITE_MEMBERSHIP_URL || "#membership";
const logo = `${import.meta.env.BASE_URL}studio-three-logo.png`;
const modalities = [
  {
    name: "Strength",
    image: `${import.meta.env.BASE_URL}photos/brickell-strength-800.webp`,
    srcSet: `${import.meta.env.BASE_URL}photos/brickell-strength-480.webp 480w, ${import.meta.env.BASE_URL}photos/brickell-strength-800.webp 800w, ${import.meta.env.BASE_URL}photos/brickell-strength-1280.webp 1280w`,
    alt: "A Studio Three athlete performing a dumbbell row in a plank",
    width: 800,
    height: 534,
    description: "Strength training with dumbbells and bodyweight exercises.",
  },
  {
    name: "Pilates",
    image: `${import.meta.env.BASE_URL}photos/brickell-pilates-800.webp`,
    srcSet: `${import.meta.env.BASE_URL}photos/brickell-pilates-480.webp 480w, ${import.meta.env.BASE_URL}photos/brickell-pilates-800.webp 800w, ${import.meta.env.BASE_URL}photos/brickell-pilates-1280.webp 1280w`,
    alt: "A Studio Three athlete holding a Pilates bridge with a small ball",
    width: 800,
    height: 534,
    description: "Mat Pilates with controlled movement and focused core work.",
  },
  {
    name: "Yoga",
    image: `${import.meta.env.BASE_URL}photos/brickell-yoga-800.webp`,
    srcSet: `${import.meta.env.BASE_URL}photos/brickell-yoga-480.webp 480w, ${import.meta.env.BASE_URL}photos/brickell-yoga-800.webp 800w, ${import.meta.env.BASE_URL}photos/brickell-yoga-1280.webp 1280w`,
    alt: "A Studio Three athlete practicing three-legged downward dog",
    width: 800,
    height: 534,
    description: "Flow classes that connect breath and movement.",
  },
];
const directionsHref =
  "https://maps.google.com/maps?saddr=&daddr=96+SE+8th.+St%2CMiami%2CUnited+States+of+America";

const studioCities = [
  {
    city: "Miami",
    studios: [
      {
        name: "Wynwood",
        detail: "96 NW 29th St",
        href: "https://studiothree.com/studio/miami/",
      },
      {
        name: "Brickell",
        detail: "830 Brickell · 96 SE 8th St",
        href: membershipHref,
      },
    ],
  },
  {
    city: "Chicago",
    studios: [
      {
        name: "River North",
        detail: "648 N Clark Street",
        href: "https://studiothree.com/studio/river-north/",
      },
      {
        name: "Lincoln Park",
        detail: "2401 Halsted Street",
        href: "https://studiothree.com/studio/lincoln-park/",
      },
      {
        name: "Fulton Market",
        detail: "333 North Green Street",
        href: "https://studiothree.com/studio/fulton-market/",
      },
      {
        name: "West Loop",
        detail: "176 N Racine Ave",
        href: "https://studiothree.com/studio/west-loop/",
      },
    ],
  },
  {
    city: "Austin",
    studios: [
      {
        name: "Austin",
        detail: "501 Brazos St",
        href: "https://studiothree.com/studio/austin/",
      },
    ],
  },
];

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
    const hash = window.location.hash;
    if (!hash) return;
    let active = true;
    void document.fonts.ready.then(() => {
      if (active && window.location.hash === hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

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
            The studio
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
              src={`${import.meta.env.BASE_URL}photos/brickell-header-1600.webp`}
              srcSet={`${import.meta.env.BASE_URL}photos/brickell-header-800.webp 800w, ${import.meta.env.BASE_URL}photos/brickell-header-1600.webp 1600w, ${import.meta.env.BASE_URL}photos/brickell-header-2400.webp 2400w`}
              sizes="(max-width: 767px) 140vw, 96vw"
              alt="Studio Three athletes training with dumbbells"
              width="1600"
              height="1067"
              fetchPriority="high"
            />
          </div>
          <div className="hero-shade" />
          <div className="hero-copy">
            <h1 id="hero-heading">
              <span className="hero-place">Brickell.</span>
              <span className="hero-tagline">
                Train for
                <br />
                Something Bigger
              </span>
            </h1>
            <h2 className="hero-offer">Founding memberships now available.</h2>
            <p>Strength, Pilates and Yoga at 830 Brickell.</p>
            <a className="button" href={membershipHref}>
              Get membership details <Arrow />
            </a>
            <a className="text-link" href="#studio">
              View the studio <span aria-hidden="true">↓</span>
            </a>
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
            Get directions <Arrow />
          </a>
        </aside>

        <section className="studio-section" id="studio">
          <div className="studio-intro">
            <h2>Three ways to train</h2>
          </div>
          <div
            className="modality-grid"
            id="modalities"
            role="group"
            aria-label="Strength, Pilates and Yoga"
          >
            {modalities.map((modality) => (
              <article
                className="modality"
                key={modality.name}
                aria-labelledby={`modality-${modality.name.toLowerCase()}`}
              >
                <img
                  className={`modality-photo modality-photo-${modality.name.toLowerCase()}`}
                  src={modality.image}
                  srcSet={modality.srcSet}
                  sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1440px) 30vw, 440px"
                  alt={modality.alt}
                  width={modality.width}
                  height={modality.height}
                  loading="lazy"
                  decoding="async"
                />
                <h3 id={`modality-${modality.name.toLowerCase()}`}>
                  {modality.name}
                </h3>
                <p>{modality.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="membership" id="membership" ref={inquiryRef}>
          <div className="membership-copy">
            <h2>
              Founding
              <br />
              memberships
            </h2>
            <p>
              Leave your details. Our Brickell team will contact you with
              founding membership options and pricing.
            </p>
          </div>
          <div className="membership-capture">
            <a className="membership-reviews" href="#reviews">
              <span className="membership-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => (
                  <svg
                    key={star}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5Z" />
                  </svg>
                ))}
              </span>
              <span>Reviews from our other studios</span>
            </a>
            {membershipHref === "#membership" ? (
              <InquiryForm />
            ) : (
              <div className="membership-direct">
                <h3>Join Studio Three Brickell.</h3>
                <p>View current membership options and pricing.</p>
                <a className="button" href={membershipHref}>
                  View memberships <Arrow />
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="studio-network" aria-labelledby="network-heading">
          <div className="network-intro">
            <h2 id="network-heading">Studio locations</h2>
          </div>
          <div className="network-directory">
            {studioCities.map(({ city, studios }) => (
              <div className="network-city" key={city}>
                <h3>{city}</h3>
                <ul>
                  {studios.map((studio) => (
                    <li key={studio.name}>
                      <a
                        className={
                          studio.name === "Brickell" ? "network-brickell" : ""
                        }
                        href={studio.href}
                        {...(studio.name !== "Brickell"
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        <span>
                          <strong>{studio.name}</strong>
                          <small>{studio.detail}</small>
                        </span>
                        <Arrow />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <StudioReviews />

        <section
          className="studio-amenities"
          aria-labelledby="amenities-heading"
        >
          <div className="amenities-copy">
            <h2 id="amenities-heading">Inside the studio</h2>
          </div>
          <ul className="amenities-list">
            <li>
              <h3>Studio essentials</h3>
              <p>
                Complimentary mats and towels. Lockers and water refill
                stations.
              </p>
            </li>
            <li>
              <h3>Locker rooms</h3>
              <p>Showers, Malin + Goetz products and Dyson hair dryers.</p>
            </li>
            <li>
              <h3>Shared space</h3>
              <p>Stretching and social space, a retail shop and Wi-Fi.</p>
            </li>
          </ul>
        </section>

        <section className="studio-faq" aria-labelledby="faq-heading">
          <div className="faq-intro">
            <h2 id="faq-heading">Questions</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>What happens after I submit my details?</summary>
              <p>
                Our Brickell team will contact you with membership options,
                pricing and next steps.
              </p>
            </details>
            <details>
              <summary>Do I purchase a membership on this page?</summary>
              <p>
                No. This form requests information. Our team will explain how to
                join when they contact you.
              </p>
            </details>
            <details>
              <summary>Which workouts can I explore?</summary>
              <p>
                Strength, Pilates and Yoga. Our team can answer questions about
                the classes and membership options.
              </p>
            </details>
            <details>
              <summary>Where is Studio Three Brickell?</summary>
              <p>
                Find us at 830 Brickell, 96 SE 8th St, Miami, FL 33131.{" "}
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions.
                </a>
              </p>
            </details>
          </div>
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
          Get membership details <Arrow />
        </a>
      </div>
    </div>
  );
}
