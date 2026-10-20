export const META_PIXEL_ID = "1319802326887263";
const receiptKey = "s3-brickell-confirmed-inquiry";
const receiptLifetime = 30 * 60 * 1000;
const referencePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Receipt = { reference: string; confirmedAt: number; tracked: boolean };
type MetaPixel = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: MetaPixel;
  }
}
let memoryReceipt: Receipt | null = null;

function validReceipt(value: unknown): value is Receipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<Receipt>;
  return (
    typeof receipt.reference === "string" &&
    referencePattern.test(receipt.reference) &&
    typeof receipt.confirmedAt === "number" &&
    receipt.confirmedAt <= Date.now() &&
    Date.now() - receipt.confirmedAt < receiptLifetime &&
    typeof receipt.tracked === "boolean"
  );
}

export function rememberConfirmedInquiry(reference: string): Receipt {
  if (!referencePattern.test(reference))
    throw new Error("Invalid inquiry receipt");
  const receipt = { reference, confirmedAt: Date.now(), tracked: false };
  memoryReceipt = receipt;
  try {
    sessionStorage.setItem(receiptKey, JSON.stringify(receipt));
  } catch {
    /* History and memory preserve the receipt when storage is unavailable. */
  }
  return receipt;
}

export function confirmedInquiry(): Receipt | null {
  const historyReceipt: unknown = window.history.state?.s3Inquiry;
  if (validReceipt(historyReceipt)) return historyReceipt;
  if (validReceipt(memoryReceipt)) return memoryReceipt;
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(receiptKey) || "null",
    );
    if (validReceipt(saved)) return saved;
  } catch {
    /* A missing or malformed receipt never creates a conversion. */
  }
  return null;
}

export function pixelEnabled() {
  return ["studiothreefounders.com", "www.studiothreefounders.com"].includes(
    window.location.hostname,
  );
}

export function trackPageView() {
  if (!pixelEnabled()) return;
  try {
    window.fbq?.("track", "PageView");
  } catch {
    /* Tracking must not affect navigation. */
  }
}

export function trackConfirmedLead() {
  const receipt = confirmedInquiry();
  if (
    !receipt ||
    receipt.tracked ||
    !pixelEnabled() ||
    typeof window.fbq !== "function"
  )
    return false;
  try {
    // The receipt ID supports event deduplication. No name, email, or phone is sent.
    window.fbq(
      "track",
      "Lead",
      { content_name: "Studio Three Brickell founding membership" },
      { eventID: receipt.reference },
    );
  } catch {
    return false;
  }
  const trackedReceipt = { ...receipt, tracked: true };
  memoryReceipt = trackedReceipt;
  try {
    sessionStorage.setItem(receiptKey, JSON.stringify(trackedReceipt));
  } catch {
    /* History remains the refresh-safe fallback. */
  }
  try {
    window.history.replaceState(
      { ...window.history.state, s3Inquiry: trackedReceipt },
      "",
      window.location.href,
    );
  } catch {
    /* Memory still protects repeated renders. */
  }
  return true;
}
