import { useEffect, useRef, useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import community from "@assets/image_1777662764571.png";
import yoga from "@assets/image_1777662794631.png";

const membershipHref = import.meta.env.VITE_MEMBERSHIP_URL || "#membership";
const logo = `${import.meta.env.BASE_URL}studio-three-logo.png`;
const modalities = [
  {
    name: "Interval",
    image: `${import.meta.env.BASE_URL}modalities/interval.jpg`,
    alt: "A Studio Three athlete doing strength work with a medicine ball",
    width: 800,
    height: 1200,
    description:
      "Build strength and endurance with coached treadmill intervals and strength work. High energy, purposeful effort, and a pace you can make your own.",
  },
  {
    name: "Cycle",
    image: `${import.meta.env.BASE_URL}modalities/cycle.jpg`,
    alt: "Three Studio Three riders training together on indoor bikes",
    width: 800,
    height: 800,
    description:
      "Clip in for a rhythm-driven ride, athletic intervals and energizing playlists. Expert coaching keeps you moving with the room.",
  },
  {
    name: "Yoga",
    image: yoga,
    alt: "Three Studio Three members practicing yoga together",
    width: 435,
    height: 442,
    description:
      "Connect breath with movement through thoughtfully guided flows. Find your balance, build your practice and make space for yourself.",
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
        detail: "Your founding membership starts here",
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
                Interval. Cycle. Yoga. Three distinct ways to train, connected
                by one community. Discover the Studio Three experience—with a
                new chapter at 830 Brickell.
              </p>
              <p>
                Be here from the beginning. Connect with our studio manager to
                explore founding membership options and find your place in the
                community.
              </p>
            </div>
          </div>
          <div
            className="modality-grid"
            id="modalities"
            role="group"
            aria-label="Interval, Cycle and Yoga"
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
          <div className="modality-invitation">
            <p>Find your mix in Brickell.</p>
            <a className="text-link" href={membershipHref}>
              Explore founding membership <Arrow />
            </a>
          </div>
        </section>

        <section className="studio-network" aria-labelledby="network-heading">
          <div className="network-intro">
            <h2 id="network-heading">
              Already part of Miami.
              <br />
              <span>Now part of Brickell.</span>
            </h2>
            <p>
              Our Miami story started in Wynwood. With five other studios across
              Chicago and Austin, Studio Three is an established community of
              people who train, move and grow together. Brickell is our next
              chapter—and your chance to be here from the beginning.
            </p>
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

        <section
          className="studio-amenities"
          aria-labelledby="amenities-heading"
        >
          <div className="amenities-copy">
            <h2 id="amenities-heading">
              The workout is just
              <br />
              <span>the beginning.</span>
            </h2>
            <p>
              Thoughtful spaces make it easier to fit movement into your day. At
              Brickell, the details extend from the studio floor to the way you
              get ready, reset and reconnect.
            </p>
          </div>
          <ul className="amenities-list">
            <li>
              <h3>Arrive ready.</h3>
              <p>
                Complimentary mats and towels, easy-to-use lockers and
                refillable water stations.
              </p>
            </li>
            <li>
              <h3>Leave refreshed.</h3>
              <p>
                Full locker rooms with showers, Malin + Goetz grooming products
                and Dyson blow-dry stations.
              </p>
            </li>
            <li>
              <h3>Stay a little longer.</h3>
              <p>
                Community space for socializing and stretching, an onsite retail
                boutique and complimentary Wi-Fi.
              </p>
            </li>
          </ul>
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
