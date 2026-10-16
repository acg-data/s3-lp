import { providerJson } from "./provider-json.ts";

const MAX_ATTEMPTS = 8;
const RETRY_WINDOW = 23 * 3600;

type TextInquiry = {
  id: string;
  text_number: string;
  text_body: string;
  text_line: string;
  text_attempts: number;
};

export function textNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits))
    return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function founderText(name: string) {
  const firstName = name.split(/\s+/)[0];
  return `Hi ${firstName}, thanks for your interest in becoming a founding member at Studio Three Brickell. Our Brickell team will reach out personally with membership details and next steps. — Studio Three Brickell`;
}

function configured(env: Env) {
  return (
    env.COMMS_ENABLED === "true" &&
    !!env.COMMS_API_KEY &&
    /^\+[1-9]\d{7,14}$/.test(env.COMMS_LINE)
  );
}

export async function notifyFounderText(
  env: Env,
  id: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!configured(env)) return;
  const inquiry = await env.LEADS.prepare(
    `UPDATE inquiries SET text_status = 'sending', text_attempts = text_attempts + 1,
      text_lease_until = ?, text_line = COALESCE(text_line, ?),
      text_started_at = CASE WHEN text_started_at = 0 THEN ? ELSE text_started_at END
    WHERE id = ? AND text_permission = 1 AND text_attempts < ?
      AND (text_started_at = 0 OR text_started_at > ?)
      AND ((text_status = 'pending' AND text_next_attempt_at <= ?)
        OR (text_status = 'sending' AND text_lease_until <= ?)) RETURNING *`,
  )
    .bind(
      now + 120,
      env.COMMS_LINE,
      now,
      id,
      MAX_ATTEMPTS,
      now - RETRY_WINDOW,
      now,
      now,
    )
    .first<TextInquiry>();
  if (!inquiry) return;
  try {
    const response = await fetch("https://osis.co/api/v1/comms/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.COMMS_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `brickell-founder/${inquiry.id}`,
      },
      body: JSON.stringify({
        to: inquiry.text_number,
        body: inquiry.text_body,
        line_e164: inquiry.text_line,
        channel: "imessage",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Object.assign(new Error("comms_rejected"), {
        status: response.status,
      });
    }
    const result = await providerJson(response);
    const message = result.message as Record<string, unknown> | undefined;
    if (!message || typeof message.id !== "string" || !message.id)
      throw new Error("text_not_accepted");
    const unknown =
      result.delivery_unknown === true || message.delivery_unknown === true;
    if (message.status === "failed" || message.status === "rejected")
      throw Object.assign(new Error("text_rejected"), { status: 422 });
    await env.LEADS.prepare(
      `UPDATE inquiries SET text_status = ?, text_message_id = ?,
        text_lease_until = 0, text_error_code = ? WHERE id = ?`,
    )
      .bind(
        unknown ? "unknown" : "accepted",
        message.id,
        unknown ? "delivery_unknown" : null,
        id,
      )
      .run();
    console.log(
      JSON.stringify({
        event: unknown ? "founder_text_needs_review" : "founder_text_accepted",
        reference: id,
      }),
    );
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 0;
    const failed =
      inquiry.text_attempts >= MAX_ATTEMPTS ||
      (status >= 400 && status < 500 && status !== 409 && status !== 429);
    const code = status ? `comms_http_${status}` : "text_delivery_failed";
    await env.LEADS.prepare(
      `UPDATE inquiries SET text_status = ?, text_next_attempt_at = ?,
        text_lease_until = 0, text_error_code = ? WHERE id = ?`,
    )
      .bind(
        failed ? "failed" : "pending",
        now + Math.min(3600, 60 * 2 ** (inquiry.text_attempts - 1)),
        code,
        id,
      )
      .run();
    console.error(
      JSON.stringify({
        event: failed
          ? "founder_text_needs_attention"
          : "founder_text_retry_pending",
        reference: id,
        code,
      }),
    );
  }
}

export async function flushFounderTexts(
  env: Env,
  now = Math.floor(Date.now() / 1000),
) {
  if (!configured(env)) return;
  await env.LEADS.prepare(
    `UPDATE inquiries SET text_status = 'failed', text_lease_until = 0, text_error_code = 'retry_limit_reached'
    WHERE text_status IN ('pending', 'sending') AND text_lease_until <= ?
      AND (text_attempts >= ? OR (text_started_at > 0 AND text_started_at <= ?))`,
  )
    .bind(now, MAX_ATTEMPTS, now - RETRY_WINDOW)
    .run();
  const due = await env.LEADS.prepare(
    `SELECT id FROM inquiries WHERE text_permission = 1 AND text_attempts < ?
    AND ((text_status = 'pending' AND text_next_attempt_at <= ?)
      OR (text_status = 'sending' AND text_lease_until <= ?)) ORDER BY created_at LIMIT 20`,
  )
    .bind(MAX_ATTEMPTS, now, now)
    .all<{ id: string }>();
  for (const inquiry of due.results)
    await notifyFounderText(env, inquiry.id, now);
}
