import { useRef, useState } from "react";

interface BookingPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function BookingPage({ onBack, onSuccess }: BookingPageProps) {
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function handleSubmit() {
    const newErrors: Record<string, boolean> = {};

    const first = firstRef.current?.value.trim() ?? "";
    const last = lastRef.current?.value.trim() ?? "";
    const email = firstRef.current ? emailRef.current?.value.trim() ?? "" : "";
    const phone = phoneRef.current?.value.trim() ?? "";

    if (!first) newErrors["first"] = true;
    if (!last) newErrors["last"] = true;
    if (!phone) newErrors["phone"] = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors["email"] = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrId = Object.keys(newErrors)[0];
      const el = document.getElementById(`f-${firstErrId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSuccess();
  }

  function clearError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="booking-page">
      <nav className="nav">
        <div className="nav-logo">
          STUDIO<span className="slash">///</span>
        </div>
        <button className="back-btn" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M10 6.5H3M6 3L2.5 6.5 6 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </nav>

      <div className="booking-hero">
        <div className="booking-hero-bg" />
        <div className="booking-hero-content">
          <div className="booking-page-title">
            Book Your
            <br />
            Pass.
          </div>
          <div className="booking-page-sub">
            3 classes · All formats · 60-day window
          </div>
        </div>
      </div>

      <div className="booking-body">
        <div className="order-card">
          <div className="order-card-label">Order Summary</div>
          <div className="order-row">
            <span>3-Class Pass</span>
            <span>×1</span>
          </div>
          <div className="order-row">
            <span>Formats</span>
            <span>All Formats</span>
          </div>
          <div className="order-row">
            <span>Studios</span>
            <span>All Locations</span>
          </div>
          <div className="order-row">
            <span>Valid For</span>
            <span>60 Days</span>
          </div>
          <div className="order-total-row">
            <span className="order-total-label">Total</span>
            <span className="order-total-price">$60</span>
          </div>
          <div className="checks">
            <div className="check-row">
              <div className="check-icon">✓</div>
              No auto-renew or hidden fees
            </div>
            <div className="check-row">
              <div className="check-icon">✓</div>
              Works at every Studio Three location
            </div>
            <div className="check-row">
              <div className="check-icon">✓</div>
              Confirmation sent immediately
            </div>
            <div className="check-row">
              <div className="check-icon">✓</div>
              No commitment required
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-title">Your Details</div>
          <div className="form-card-sub">
            Fill in your info below. Payment is collected at confirmation —
            we'll send everything to your email right away.
          </div>

          <span className="fsec">Personal Information</span>
          <div className="fgrid">
            <div className="field">
              <label htmlFor="f-first">First Name *</label>
              <input
                type="text"
                id="f-first"
                ref={firstRef}
                placeholder="Jane"
                autoComplete="given-name"
                className={errors.first ? "error" : ""}
                onChange={() => clearError("first")}
              />
            </div>
            <div className="field">
              <label htmlFor="f-last">Last Name *</label>
              <input
                type="text"
                id="f-last"
                ref={lastRef}
                placeholder="Smith"
                autoComplete="family-name"
                className={errors.last ? "error" : ""}
                onChange={() => clearError("last")}
              />
            </div>
            <div className="field fg-full">
              <label htmlFor="f-email">Email Address *</label>
              <input
                type="email"
                id="f-email"
                ref={emailRef}
                placeholder="jane@email.com"
                autoComplete="email"
                className={errors.email ? "error" : ""}
                onChange={() => clearError("email")}
              />
            </div>
            <div className="field fg-full">
              <label htmlFor="f-phone">Phone Number *</label>
              <input
                type="tel"
                id="f-phone"
                ref={phoneRef}
                placeholder="(312) 000-0000"
                autoComplete="tel"
                className={errors.phone ? "error" : ""}
                onChange={() => clearError("phone")}
              />
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "18px 0 6px" }} />
          <span className="fsec" style={{ marginTop: 0 }}>
            Your Preferences
          </span>
          <div className="fgrid">
            <div className="field fg-full">
              <label htmlFor="f-studio">Preferred Studio</label>
              <select id="f-studio">
                <option value="">Select location...</option>
                <option>Chicago</option>
                <option>Miami</option>
                <option>Austin</option>
              </select>
            </div>
            <div className="field fg-full">
              <label htmlFor="f-notes">
                Anything we should know? (optional)
              </label>
              <textarea
                id="f-notes"
                placeholder="Injuries, goals, or questions for our team..."
              />
            </div>
          </div>

          <button className="btn-submit" onClick={handleSubmit}>
            <span>
              Complete Booking — $60{" "}
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                style={{ display: "inline", verticalAlign: "middle" }}
              >
                <path
                  d="M2.5 7.5h10M9 4l3.5 3.5L9 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <p className="form-fine">
            Secure checkout · Confirmation sent immediately · 60-day pass
            validity from purchase
          </p>
        </div>
      </div>
    </div>
  );
}
