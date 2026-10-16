import { emailPattern, escapeHtml, type Inquiry } from "./notifications.ts";
import { providerJson } from "./provider-json.ts";

const MAX_ATTEMPTS = 8;
const RETRY_WINDOW = 23 * 3600;
type ConfirmationInquiry = Pick<Inquiry, "id" | "name" | "email"> & {
  confirmation_attempts: number;
};

export function confirmationMessage(inquiry: ConfirmationInquiry, env: Env) {
  const firstName = inquiry.name.split(/\s+/)[0];
  const text = `Hi ${firstName},\n\nThank you for your interest in a founding membership at Studio Three Brickell. We've received your inquiry, and our Brickell team will contact you with membership options and pricing.\n\nStrength, Pilates and Yoga at 830 Brickell.\n\nHave a question? Reply to this email to reach our studio team.\n\nTrain for Something Bigger.\nStudio Three Brickell`;
  const html = `<div style="background:#f4f1ec;padding:32px;font:15px/1.7 Arial,sans-serif;color:#171817;max-width:560px;margin:0 auto"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="height:4px;background:#007495"></td><td style="background:#de4316"></td><td style="background:#bdcc00"></td></tr></table><p style="font-size:13px;font-weight:bold;letter-spacing:3px;margin:28px 0">STUDIO THREE BRICKELL</p><h1 style="font-size:32px;line-height:1.15;margin:0 0 28px">Thank you, ${escapeHtml(firstName)}.</h1><p>Thank you for your interest in a founding membership at Studio Three Brickell. We've received your inquiry, and our Brickell team will contact you with membership options and pricing.</p><p>Strength, Pilates and Yoga at 830 Brickell.</p><p>Have a question? Reply to this email to reach our studio team.</p><p style="border-top:1px solid #ccc7c0;padding-top:24px;margin-top:32px;font-weight:bold">Train for Something Bigger.</p><p style="font-size:12px;color:#555650">Studio Three Brickell</p></div>`;
  return {
    from: `Studio Three Brickell <${env.EMAIL_FROM}>`,
    to: [inquiry.email],
    reply_to: env.CONFIRMATION_REPLY_TO,
    subject: "Thank you for your interest in Studio Three Brickell",
    text,
    html,
    tags: [
      {
        name: "project",
        value: env.DELIVERY_PROJECT || "studio-three-brickell",
      },
      { name: "inquiry_id", value: inquiry.id },
      { name: "message_kind", value: "confirmation" },
    ],
  };
}

function configured(env: Env) {
  return (
    env.EMAIL_ENABLED === "true" &&
    env.CONFIRMATION_EMAIL_ENABLED === "true" &&
    !!env.RESEND_API_KEY &&
    emailPattern.test(env.EMAIL_FROM) &&
    emailPattern.test(env.CONFIRMATION_REPLY_TO)
  );
}

export async function notifyConfirmation(
  env: Env,
  id: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!configured(env)) return;
  const inquiry = await env.LEADS.prepare(
    `UPDATE inquiries SET confirmation_status = 'sending',
    confirmation_attempts = confirmation_attempts + 1, confirmation_lease_until = ?,
    confirmation_started_at = CASE WHEN confirmation_started_at = 0 THEN ? ELSE confirmation_started_at END
    WHERE id = ? AND confirmation_attempts < ? AND (confirmation_started_at = 0 OR confirmation_started_at > ?)
    AND ((confirmation_status = 'pending' AND confirmation_next_attempt_at <= ?) OR (confirmation_status = 'sending' AND confirmation_lease_until <= ?)) RETURNING *`,
  )
    .bind(now + 120, now, id, MAX_ATTEMPTS, now - RETRY_WINDOW, now, now)
    .first<ConfirmationInquiry>();
  if (!inquiry) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `brickell-confirmation/${inquiry.id}`,
      },
      body: JSON.stringify(confirmationMessage(inquiry, env)),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Object.assign(new Error("resend_rejected"), {
        code: `E_RESEND_HTTP_${response.status}`,
      });
    }
    const sent = await providerJson(response);
    if (typeof sent.id !== "string" || !sent.id)
      throw new Error("confirmation_not_accepted");
    await env.LEADS.prepare(
      `UPDATE inquiries SET confirmation_status = 'sent', confirmation_message_id = ?,
      confirmation_accepted_at = ?, confirmation_lease_until = 0, confirmation_error_code = NULL WHERE id = ?`,
    )
      .bind(sent.id, new Date().toISOString(), id)
      .run();
    console.log(
      JSON.stringify({ event: "inquiry_confirmation_accepted", reference: id }),
    );
  } catch (error) {
    const rawCode =
      error && typeof error === "object" && "code" in error ? error.code : "";
    const code =
      typeof rawCode === "string" && /^E_[A-Z_0-9]{1,60}$/.test(rawCode)
        ? rawCode
        : "confirmation_send_failed";
    const failed = inquiry.confirmation_attempts >= MAX_ATTEMPTS;
    const retryAfter = Math.min(
      3600,
      60 * 2 ** (inquiry.confirmation_attempts - 1),
    );
    await env.LEADS.prepare(
      `UPDATE inquiries SET confirmation_status = ?, confirmation_next_attempt_at = ?,
      confirmation_lease_until = 0, confirmation_error_code = ? WHERE id = ?`,
    )
      .bind(failed ? "failed" : "pending", now + retryAfter, code, id)
      .run();
    console.error(
      JSON.stringify({
        event: failed
          ? "inquiry_confirmation_needs_attention"
          : "inquiry_confirmation_retry_pending",
        reference: id,
        code,
      }),
    );
  }
}

export async function flushConfirmations(
  env: Env,
  now = Math.floor(Date.now() / 1000),
) {
  if (!configured(env)) return;
  await env.LEADS.prepare(
    `UPDATE inquiries SET confirmation_status = 'failed', confirmation_lease_until = 0,
    confirmation_error_code = 'retry_limit_reached' WHERE confirmation_status IN ('pending', 'sending')
    AND confirmation_lease_until <= ? AND (confirmation_attempts >= ? OR (confirmation_started_at > 0 AND confirmation_started_at <= ?))`,
  )
    .bind(now, MAX_ATTEMPTS, now - RETRY_WINDOW)
    .run();
  const pending = await env.LEADS.prepare(
    `SELECT id FROM inquiries WHERE confirmation_attempts < ? AND
    ((confirmation_status = 'pending' AND confirmation_next_attempt_at <= ?) OR (confirmation_status = 'sending' AND confirmation_lease_until <= ?))
    ORDER BY created_at LIMIT 20`,
  )
    .bind(MAX_ATTEMPTS, now, now)
    .all<{ id: string }>();
  for (const inquiry of pending.results)
    await notifyConfirmation(env, inquiry.id, now);
}
