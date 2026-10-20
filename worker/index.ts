import {
  emailPattern,
  flushNotifications,
  notifyInquiry,
  type Inquiry,
} from "./notifications.ts";
import {
  textNumber,
  founderText,
  notifyFounderText,
  flushFounderTexts,
} from "./comms.ts";
import { deliveryPage, resendWebhook } from "./delivery.ts";
import { flushConfirmations, notifyConfirmation } from "./confirmations.ts";

const MAX_BODY_BYTES = 4096;
const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(
  body: object,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

async function readBody(request: Request) {
  if (!request.body) throw new Error("missing_body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } finally {
    reader.releaseLock();
  }
}

function attribution(value: unknown) {
  const result: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    return result;
  const source = value as Record<string, unknown>;
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
    "gbraid",
    "wbraid",
  ]) {
    const field = source[key];
    if (
      typeof field === "string" &&
      field.length <= 200 &&
      !/[\r\n\0]/.test(field)
    )
      result[key] = field.trim();
  }
  if (
    typeof source.referrer === "string" &&
    source.referrer.length <= 253 &&
    /^[a-z0-9.-]+$/i.test(source.referrer)
  )
    result.referrer = source.referrer;
  return result;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      url.hostname === "www.studiothreefounders.com" ||
      (url.hostname === "studiothreefounders.com" && url.protocol !== "https:")
    ) {
      url.protocol = "https:";
      url.hostname = "studiothreefounders.com";
      return Response.redirect(url.href, 308);
    }
    if (!url.pathname.startsWith("/api/")) {
      const asset = await env.ASSETS.fetch(request);
      if (/^\/thank-you\/?$/.test(url.pathname)) {
        const headers = new Headers(asset.headers);
        headers.set("X-Robots-Tag", "noindex, nofollow");
        return new Response(asset.body, {
          status: asset.status,
          statusText: asset.statusText,
          headers,
        });
      }
      return asset;
    }
    if (url.pathname === "/api/webhooks/resend")
      return resendWebhook(request, env);
    if (url.pathname.startsWith("/api/delivery/"))
      return deliveryPage(request, env);
    if (url.pathname !== "/api/inquiries")
      return json({ error: "not_found" }, 404);
    if (request.method !== "POST")
      return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
    const origin = request.headers.get("Origin");
    if (
      origin !== url.origin &&
      (!env.FRONTEND_ORIGIN || origin !== env.FRONTEND_ORIGIN)
    )
      return json({ error: "invalid_origin" }, 403);
    if (
      request.headers
        .get("Content-Type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      return json({ error: "invalid_content_type" }, 415);
    if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES)
      return json({ error: "body_too_large" }, 413);

    const requestId = crypto.randomUUID();
    try {
      const ip = request.headers.get("CF-Connecting-IP") || "local";
      const limit = await env.INQUIRY_LIMITER.limit({ key: `brickell:${ip}` });
      if (!limit.success)
        return json({ error: "rate_limited" }, 429, { "Retry-After": "60" });
      let body: unknown;
      try {
        body = await readBody(request);
      } catch (error) {
        return json(
          { error: "invalid_request" },
          error instanceof Error && error.message === "body_too_large"
            ? 413
            : 400,
        );
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        return json({ error: "invalid_request" }, 400);
      const data = body as Record<string, unknown>;
      if (typeof data.website === "string" && data.website.trim())
        return json({ error: "invalid_request" }, 400);
      const name = typeof data.name === "string" ? data.name.trim() : "";
      const email = typeof data.email === "string" ? data.email.trim() : "";
      const phone = typeof data.phone === "string" ? data.phone.trim() : "";
      const digits = phone.replace(/\D/g, "").length;
      const wantsText = data.textConsent === true;
      const number = wantsText ? textNumber(phone) : null;
      if (
        (data.textConsent !== undefined &&
          typeof data.textConsent !== "boolean") ||
        (wantsText && !number) ||
        (data.requestId !== undefined &&
          (typeof data.requestId !== "string" ||
            !idPattern.test(data.requestId))) ||
        data.consent !== true ||
        name.length < 2 ||
        name.length > 100 ||
        /[\r\n\0]/.test(name) ||
        email.length > 254 ||
        !emailPattern.test(email) ||
        phone.length > 40 ||
        !/^[+\d\s().-]+$/.test(phone) ||
        /[\r\n\0]/.test(phone) ||
        digits < 7 ||
        digits > 15
      )
        return json({ error: "invalid_fields" }, 400);
      const id =
        typeof data.requestId === "string"
          ? data.requestId.toLowerCase()
          : requestId;
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
          JSON.stringify(
            wantsText
              ? [name, email.toLowerCase(), phone, true]
              : [name, email.toLowerCase(), phone],
          ),
        ),
      );
      const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      await env.LEADS.prepare(
        `INSERT INTO inquiries (id, fingerprint, created_at, name, email, phone, contact_permission, attribution, text_permission, text_number, text_body, text_status, confirmation_status)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'pending') ON CONFLICT(id) DO NOTHING`,
      )
        .bind(
          id,
          fingerprint,
          new Date().toISOString(),
          name,
          email,
          phone,
          JSON.stringify(attribution(data.attribution)),
          wantsText ? 1 : 0,
          number,
          wantsText ? founderText(name) : null,
          wantsText ? "pending" : "skipped",
        )
        .run();
      const saved = await env.LEADS.prepare(
        "SELECT * FROM inquiries WHERE id = ?",
      )
        .bind(id)
        .first<Inquiry>();
      if (!saved) throw new Error("inquiry_not_saved");
      if (saved.fingerprint !== fingerprint)
        return json({ error: "request_conflict" }, 409);
      try {
        const results = await Promise.allSettled([
          notifyInquiry(env, id),
          notifyFounderText(env, id),
          notifyConfirmation(env, id),
        ]);
        if (results.some((result) => result.status === "rejected"))
          throw new Error("notification_deferred");
      } catch {
        console.error(
          JSON.stringify({
            event: "inquiry_notification_deferred",
            reference: id,
          }),
        );
      }
      return json({ ok: true, reference: id }, 200);
    } catch {
      console.error(
        JSON.stringify({ event: "inquiry_delivery_failed", requestId }),
      );
      return json({ error: "temporarily_unavailable" }, 503);
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await Promise.all([
      flushNotifications(env),
      flushFounderTexts(env),
      flushConfirmations(env),
    ]);
  },
} satisfies ExportedHandler<Env>;
