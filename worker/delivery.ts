import { Webhook } from "svix";

const encoder = new TextEncoder();
const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eventRanks: Record<string, number> = {
  "email.sent": 1,
  "email.delivery_delayed": 2,
  "email.delivered": 3,
  "email.failed": 4,
  "email.suppressed": 5,
  "email.bounced": 6,
  "email.complained": 7,
};

function response(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function linkKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function deliveryLink(env: Env, id: string, createdAt: string) {
  if (!env.DELIVERY_LINK_SECRET || !env.PUBLIC_ORIGIN) return null;
  const expires = Math.floor(Date.parse(createdAt) / 1000) + 30 * 86400;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await linkKey(env.DELIVERY_LINK_SECRET),
    encoder.encode(`${id}.${expires}`),
  );
  const token = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const url = new URL(`/api/delivery/${id}`, env.PUBLIC_ORIGIN);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", token);
  return url.href;
}

export async function resendWebhook(request: Request, env: Env) {
  if (request.method !== "POST")
    return response({ error: "method_not_allowed" }, 405);
  if (!env.RESEND_WEBHOOK_SECRET)
    return response({ error: "unavailable" }, 503);
  if (Number(request.headers.get("Content-Length")) > 16384)
    return response({ error: "body_too_large" }, 413);
  let payload: Record<string, unknown>;
  const eventId = request.headers.get("svix-id") || "";
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(eventId))
    return response({ error: "invalid_signature" }, 400);
  const reader = request.body?.getReader();
  if (!reader) return response({ error: "invalid_request" }, 400);
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return response({ error: "body_too_large" }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const raw = new TextDecoder().decode(bytes);
    new Webhook(env.RESEND_WEBHOOK_SECRET).verify(raw, {
      "svix-id": eventId,
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    });
    payload = JSON.parse(raw) as Record<string, unknown>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new Error("invalid_payload");
  } catch {
    return response({ error: "invalid_signature" }, 400);
  } finally {
    reader.releaseLock();
  }
  const type = typeof payload.type === "string" ? payload.type : "";
  if (!Object.hasOwn(eventRanks, type))
    return response({ ok: true, ignored: true });
  const data = payload.data as Record<string, unknown> | undefined;
  const emailId = data?.email_id;
  const occurredAt = payload.created_at;
  if (
    typeof emailId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,200}$/.test(emailId) ||
    typeof occurredAt !== "string" ||
    !Number.isFinite(Date.parse(occurredAt))
  )
    return response({ error: "invalid_event" }, 400);
  // Tags allow a verified delivery event to arrive before the send response is saved.
  const tags = data?.tags as Record<string, unknown> | undefined;
  const taggedKind =
    tags?.message_kind === "confirmation"
      ? "confirmation"
      : tags?.message_kind === undefined || tags.message_kind === "notification"
        ? "notification"
        : null;
  const taggedId =
    tags?.project === env.DELIVERY_PROJECT &&
    taggedKind &&
    typeof tags?.inquiry_id === "string" &&
    idPattern.test(tags.inquiry_id)
      ? tags.inquiry_id
      : "";
  try {
    const inquiry = await env.LEADS.prepare(
      `SELECT id, CASE WHEN confirmation_message_id = ? THEN 'confirmation'
        WHEN email_message_id = ? THEN 'notification' ELSE ? END AS kind
       FROM inquiries WHERE email_message_id = ? OR confirmation_message_id = ? OR
       (id = ? AND ((? = 'confirmation' AND confirmation_status != 'skipped' AND confirmation_message_id IS NULL)
         OR (? = 'notification' AND email_message_id IS NULL))) LIMIT 1`,
    )
      .bind(
        emailId,
        emailId,
        taggedKind,
        emailId,
        emailId,
        taggedId,
        taggedKind,
        taggedKind,
      )
      .first<{ id: string; kind: "confirmation" | "notification" }>();
    if (!inquiry) return response({ ok: true, ignored: true });
    const timestamp = new Date(occurredAt).toISOString();
    await env.LEADS.prepare(
      "INSERT INTO email_delivery_events (event_id, inquiry_id, email_id, event_type, occurred_at, received_at, message_kind) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING",
    )
      .bind(
        eventId,
        inquiry.id,
        emailId,
        type,
        timestamp,
        new Date().toISOString(),
        inquiry.kind,
      )
      .run();
    // Reapplying a duplicate is safe, including a retry after a failed status update.
    const prefix = inquiry.kind === "confirmation" ? "confirmation_" : "email_";
    await env.LEADS.prepare(
      `UPDATE inquiries SET ${prefix}delivery_status = ?, ${prefix}delivery_rank = ?, ${prefix}event_at = ?,
      ${prefix}complained_at = CASE WHEN ? = 'email.complained' THEN COALESCE(${prefix}complained_at, ?) ELSE ${prefix}complained_at END
      WHERE id = ? AND (${prefix}delivery_rank < ? OR (${prefix}delivery_rank = ? AND (${prefix}event_at IS NULL OR ${prefix}event_at < ?)))`,
    )
      .bind(
        type.slice(6),
        eventRanks[type],
        timestamp,
        type,
        timestamp,
        inquiry.id,
        eventRanks[type],
        eventRanks[type],
        timestamp,
      )
      .run();
    console.log(
      JSON.stringify({
        event: "inquiry_email_delivery_event",
        reference: inquiry.id,
        type,
        kind: inquiry.kind,
      }),
    );
    return response({ ok: true });
  } catch {
    console.error(
      JSON.stringify({ event: "email_webhook_storage_failed", eventId }),
    );
    return response({ error: "temporarily_unavailable" }, 503);
  }
}

export async function deliveryPage(request: Request, env: Env) {
  if (request.method !== "GET")
    return response({ error: "method_not_allowed" }, 405);
  const url = new URL(request.url);
  const id = url.pathname.slice("/api/delivery/".length);
  const expires = url.searchParams.get("expires") || "";
  const signature = url.searchParams.get("signature") || "";
  if (
    !env.DELIVERY_LINK_SECRET ||
    !idPattern.test(id) ||
    !/^\d{10}$/.test(expires) ||
    Number(expires) < Date.now() / 1000 ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return response({ error: "not_found_or_expired" }, 404);
  const bytes = Uint8Array.from(signature.match(/../g)!, (byte) =>
    parseInt(byte, 16),
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    await linkKey(env.DELIVERY_LINK_SECRET),
    bytes,
    encoder.encode(`${id}.${expires}`),
  );
  if (!valid) return response({ error: "not_found_or_expired" }, 404);
  const inquiry = await env.LEADS.prepare(
    "SELECT notification_status, email_delivery_status, email_event_at, email_complained_at, text_status, confirmation_status, confirmation_delivery_status, confirmation_complained_at FROM inquiries WHERE id = ?",
  )
    .bind(id)
    .first<{
      notification_status: string;
      email_delivery_status: string;
      email_event_at: string | null;
      email_complained_at: string | null;
      text_status: string;
      confirmation_status: string;
      confirmation_delivery_status: string;
      confirmation_complained_at: string | null;
    }>();
  if (!inquiry) return response({ error: "not_found_or_expired" }, 404);
  const labels: Record<string, string> = {
    unreported:
      inquiry.notification_status === "sent"
        ? "Accepted by Resend; awaiting delivery report"
        : "Awaiting email send",
    sent: "Accepted by Resend; awaiting delivery report",
    delivery_delayed: "Delivery delayed — check the Resend dashboard",
    delivered: "Delivered to the receiving mail server",
    failed: "Email failed — check the Resend dashboard",
    suppressed: "Email suppressed — check the Resend dashboard",
    bounced: "Email bounced — check the recipient address",
    complained: "Recipient reported this email as spam",
  };
  const textLabels: Record<string, string> = {
    accepted: "Accepted by Comms",
    pending: "Queued",
    sending: "Sending",
    failed: "Needs attention",
    unknown: "Delivery unknown — review in Comms",
    skipped: "No text requested",
  };
  const confirmationLabel =
    inquiry.confirmation_status === "skipped"
      ? "Not requested for this earlier inquiry"
      : inquiry.confirmation_delivery_status !== "unreported"
        ? labels[inquiry.confirmation_delivery_status]
        : inquiry.confirmation_status === "sent"
          ? "Accepted by Resend; awaiting delivery report"
          : inquiry.confirmation_status === "failed"
            ? "Confirmation email needs attention — check the Resend dashboard"
            : "Queued for sending";
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Studio Three — delivery status</title><style>body{margin:0;background:#f4f1ec;color:#171817;font:16px/1.65 Arial,sans-serif}main{max-width:620px;margin:8vh auto;padding:32px}h1{font-size:32px;line-height:1.15}h2{font-size:18px;margin:32px 0 8px}small{color:#555}a{color:#006a85}</style></head><body><main><small>STUDIO THREE BRICKELL</small><h1>Inquiry delivery status</h1><h2>Team notification email</h2><p>${labels[inquiry.email_delivery_status] || "Awaiting delivery report"}</p><h2>Spam complaint</h2><p>${inquiry.email_complained_at ? "A spam complaint was reported. Review the recipient and sending configuration in Resend." : "No spam complaint has been reported for this email."}</p><p>A delivery report confirms that the receiving mail server accepted the message. It does not show whether that mailbox placed it in Inbox or Spam. Spam complaints report a recipient marking an email as spam; automatic filtering may not send a complaint.</p><h2>Member confirmation email</h2><p>${confirmationLabel || "Awaiting delivery report"}</p><p>${inquiry.confirmation_complained_at ? "A spam complaint was reported for the member confirmation." : "No spam complaint has been reported for the member confirmation."}</p><h2>Text confirmation</h2><p>${textLabels[inquiry.text_status] || "Awaiting provider report"}</p><small>This private link expires after 30 days. No visitor contact details are displayed.</small></main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      },
    },
  );
}
