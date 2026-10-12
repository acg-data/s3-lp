export type Inquiry = {
  id: string;
  fingerprint: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  attribution: string;
  notification_status: "pending" | "sending" | "sent" | "failed";
  notification_attempts: number;
};

export const emailPattern =
  /^[^\s@<>(),;:"\\[\]]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const MAX_ATTEMPTS = 8;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export function notificationMessage(inquiry: Inquiry, env: Env) {
  const attribution = JSON.parse(inquiry.attribution) as Record<string, string>;
  const campaign = [
    attribution.utm_source && `Source: ${attribution.utm_source}`,
    attribution.utm_medium && `Medium: ${attribution.utm_medium}`,
    attribution.utm_campaign && `Campaign: ${attribution.utm_campaign}`,
  ]
    .filter(Boolean)
    .join("\n");
  const text = `New Studio Three Brickell founding membership inquiry\n\nPlease follow up personally with membership details.\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nReceived: ${inquiry.created_at}\n${campaign ? `\n${campaign}\n` : ""}\nContact permission: agreed to personal follow-up about this inquiry.\nReference: ${inquiry.id}`;
  const details = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Received", inquiry.created_at],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:12px 0;color:#555650;width:100px">${label}</td><td style="padding:12px 0;font-weight:bold">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<div style="background:#f7f7f4;padding:32px;font:15px/1.6 Arial,sans-serif;color:#0b0b0b;max-width:600px"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="height:4px;background:#007495"></td><td style="background:#de4316"></td><td style="background:#bdcc00"></td></tr></table><h1 style="font-size:28px;line-height:1.2">New Brickell founding membership inquiry</h1><p>Please follow up personally with membership details.</p><table style="width:100%;border-collapse:collapse">${details}</table>${campaign ? `<p style="white-space:pre-line">${escapeHtml(campaign)}</p>` : ""}<p>This visitor agreed to be contacted about their membership inquiry. Reply to this email to contact them directly.</p><p style="font-size:12px;color:#555650">Reference: ${inquiry.id}</p></div>`;
  return {
    from: { email: env.EMAIL_FROM, name: "Studio Three Brickell" },
    to: env.LEAD_RECIPIENT,
    replyTo: inquiry.email,
    subject: "New Brickell founding membership inquiry",
    text,
    html,
    headers: { "X-Studio-Three-Inquiry": inquiry.id },
  };
}

export function emailConfigured(env: Env) {
  return (
    env.EMAIL_ENABLED === "true" &&
    emailPattern.test(env.LEAD_RECIPIENT) &&
    emailPattern.test(env.EMAIL_FROM)
  );
}

export async function notifyInquiry(
  env: Env,
  id: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!emailConfigured(env)) return;
  const inquiry = await env.LEADS.prepare(
    `UPDATE inquiries SET notification_status = 'sending',
       notification_attempts = notification_attempts + 1, lease_until = ?
     WHERE id = ? AND notification_attempts < ? AND
       ((notification_status = 'pending' AND next_attempt_at <= ?) OR
        (notification_status = 'sending' AND lease_until <= ?))
     RETURNING *`,
  )
    .bind(now + 120, id, MAX_ATTEMPTS, now, now)
    .first<Inquiry>();
  if (!inquiry) return;
  try {
    const sent = await env.EMAIL.send(notificationMessage(inquiry, env));
    if (!sent.messageId) throw new Error("email_not_accepted");
    await env.LEADS.prepare(
      `UPDATE inquiries SET notification_status = 'sent', email_message_id = ?,
        notified_at = ?, lease_until = 0, last_error_code = NULL WHERE id = ?`,
    )
      .bind(sent.messageId, new Date().toISOString(), id)
      .run();
    console.log(
      JSON.stringify({ event: "inquiry_email_accepted", reference: id }),
    );
  } catch (error) {
    const rawCode =
      error && typeof error === "object" && "code" in error ? error.code : "";
    const code =
      typeof rawCode === "string" && /^E_[A-Z_]{1,60}$/.test(rawCode)
        ? rawCode
        : "email_delivery_failed";
    const failed = inquiry.notification_attempts >= MAX_ATTEMPTS;
    const retryAfter = Math.min(
      3600,
      60 * 2 ** (inquiry.notification_attempts - 1),
    );
    await env.LEADS.prepare(
      `UPDATE inquiries SET notification_status = ?, next_attempt_at = ?,
        lease_until = 0, last_error_code = ? WHERE id = ?`,
    )
      .bind(failed ? "failed" : "pending", now + retryAfter, code, id)
      .run();
    console.error(
      JSON.stringify({
        event: failed
          ? "inquiry_email_needs_attention"
          : "inquiry_email_retry_pending",
        reference: id,
        code,
      }),
    );
  }
}

export async function flushNotifications(
  env: Env,
  now = Math.floor(Date.now() / 1000),
) {
  if (!emailConfigured(env)) return;
  await env.LEADS.prepare(
    `UPDATE inquiries SET notification_status = 'failed', lease_until = 0,
      last_error_code = 'retry_limit_reached'
      WHERE notification_status = 'sending' AND lease_until <= ? AND notification_attempts >= ?`,
  )
    .bind(now, MAX_ATTEMPTS)
    .run();
  const pending = await env.LEADS.prepare(
    `SELECT id FROM inquiries WHERE notification_attempts < ? AND
      ((notification_status = 'pending' AND next_attempt_at <= ?) OR
       (notification_status = 'sending' AND lease_until <= ?))
      ORDER BY created_at LIMIT 20`,
  )
    .bind(MAX_ATTEMPTS, now, now)
    .all<{ id: string }>();
  for (const inquiry of pending.results)
    await notifyInquiry(env, inquiry.id, now);
}
