import { useRef, useState, type FormEvent } from "react";
import { campaignAttribution, trackInquiry } from "@/lib/campaign";

type Field = "name" | "email" | "phone";

export default function InquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submissionRef = useRef<{ payload: string; id: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [sendError, setSendError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const textConsent = data.get("textConsent") === "on";
    const nextErrors: Partial<Record<Field, string>> = {};
    if (name.length < 2 || name.length > 100)
      nextErrors.name = "Enter your name (2–100 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      nextErrors.email = "Enter a valid email address.";
    if (
      !/^[+\d\s().-]+$/.test(phone) ||
      phone.replace(/\D/g, "").length < 7 ||
      phone.replace(/\D/g, "").length > 15 ||
      phone.length > 40
    )
      nextErrors.phone = "Enter a valid phone number.";
    if (textConsent) {
      const digits = phone.replace(/\D/g, "");
      if (
        !(
          digits.length === 10 ||
          (digits.length === 11 && digits.startsWith("1")) ||
          (phone.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits))
        )
      )
        nextErrors.phone =
          "For texts, enter a US phone number or include your country code.";
    }
    setErrors(nextErrors);
    setSendError("");
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstError}"]`)
        ?.focus();
      return;
    }

    setStatus("sending");
    const payload = JSON.stringify([name, email, phone, textConsent]);
    if (submissionRef.current?.payload !== payload) {
      submissionRef.current = { payload, id: crypto.randomUUID() };
    }
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          website: String(data.get("website") || ""),
          consent: true,
          textConsent,
          requestId: submissionRef.current.id,
          attribution: campaignAttribution(),
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        setSendError(
          response.status === 429
            ? "Please wait a minute before trying again."
            : "We couldn’t send your inquiry. Please try again in a moment.",
        );
        setStatus("idle");
        return;
      }
      const result = await response.json();
      if (result.ok !== true || typeof result.reference !== "string")
        throw new Error("Unconfirmed inquiry");
      trackInquiry(result.reference);
      setStatus("success");
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setSendError(
        "We couldn’t confirm your inquiry. Please check your connection and try again.",
      );
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div
        className="inquiry-success"
        ref={successRef}
        tabIndex={-1}
        role="status"
      >
        <div className="success-symbol" aria-hidden="true">
          ✓
        </div>
        <h3>
          Your first move,
          <br />
          made.
        </h3>
        <p>
          Your founder inquiry has been received. Our Brickell studio manager
          will reach out personally with membership details and your next steps.
        </p>
        <a className="text-link" href="#studio">
          Explore Studio Three <span aria-hidden="true">↑</span>
        </a>
      </div>
    );
  }

  return (
    <form
      className="inquiry-form"
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-labelledby="inquiry-title"
      aria-busy={status === "sending"}
    >
      <h3 id="inquiry-title">Let’s talk founding membership.</h3>
      <p className="form-intro">
        Leave your details for our Brickell team. We’ll reach out personally to
        answer your questions and help you become part of our founding
        community.
      </p>
      <fieldset disabled={status === "sending"}>
        {(
          [
            {
              key: "name",
              label: "Name",
              type: "text",
              placeholder: "Your full name",
              autoComplete: "name",
              maxLength: 100,
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              placeholder: "you@example.com",
              autoComplete: "email",
              maxLength: 254,
            },
            {
              key: "phone",
              label: "Phone",
              type: "tel",
              placeholder: "Your phone number",
              autoComplete: "tel",
              maxLength: 40,
            },
          ] as const
        ).map((field) => (
          <div className="field" key={field.key}>
            <label htmlFor={`inquiry-${field.key}`}>{field.label}</label>
            <input
              id={`inquiry-${field.key}`}
              name={field.key}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              required
              aria-invalid={!!errors[field.key]}
              aria-describedby={
                errors[field.key] ? `error-${field.key}` : undefined
              }
              onChange={() =>
                setErrors((prev) => ({ ...prev, [field.key]: undefined }))
              }
            />
            {errors[field.key] && (
              <p className="field-error" id={`error-${field.key}`}>
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}
        <div className="form-trap" aria-hidden="true">
          <label htmlFor="inquiry-website">Website</label>
          <input
            id="inquiry-website"
            name="website"
            type="text"
            autoComplete="off"
            tabIndex={-1}
          />
        </div>
        <label className="text-opt-in">
          <input type="checkbox" name="textConsent" />
          <span>
            Send me an iMessage confirmation about my founder inquiry.
            <small>
              Optional. Our Brickell team will follow up personally.
            </small>
          </span>
        </label>
        <p className="contact-consent">
          By submitting, you agree to be contacted by Studio Three about your
          membership inquiry.
        </p>
        <button className="button" type="submit">
          {status === "sending"
            ? "Sending your inquiry…"
            : "Get founding membership details"}
          <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
      {sendError && (
        <p className="submit-error" role="alert">
          {sendError}
        </p>
      )}
      <p className="form-note">
        Your details are saved for our Brickell team.
        <br />
        No payment is collected here.
      </p>
    </form>
  );
}
