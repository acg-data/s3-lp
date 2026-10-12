const fields = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "gbraid",
  "wbraid",
];
const storageKey = "s3-brickell-attribution";

export function campaignAttribution() {
  const current: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  for (const field of fields) {
    const value = params.get(field);
    if (value && value.length <= 200 && !/[\r\n\0]/.test(value))
      current[field] = value;
  }
  try {
    if (document.referrer)
      current.referrer = new URL(document.referrer).hostname;
  } catch {
    /* A malformed referrer must not prevent an inquiry. */
  }
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved) as Record<string, string>;
    sessionStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    /* Attribution works even when browser storage is unavailable. */
  }
  return current;
}

export function trackInquiry(reference: string) {
  // Tag integrations can consume this receipt event without receiving contact details.
  window.dispatchEvent(
    new CustomEvent("studio-three:inquiry-received", {
      detail: { reference, studio: "brickell" },
    }),
  );
}
