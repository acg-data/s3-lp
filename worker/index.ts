const MAX_BODY_BYTES = 4096;
const emailPattern = /^[^\s@<>(),;:"\\[\]]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

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

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
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
      if (
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
      if (
        !emailPattern.test(env.LEAD_RECIPIENT) ||
        !emailPattern.test(env.EMAIL_FROM)
      )
        return json({ error: "temporarily_unavailable" }, 503);

      const sent = await env.EMAIL.send({
        from: { email: env.EMAIL_FROM, name: "Studio Three Brickell" },
        to: env.LEAD_RECIPIENT,
        replyTo: email,
        subject: "New Brickell founding membership inquiry",
        text: `A visitor requested founding membership details. Please follow up personally.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nStudio: Brickell, Miami\nContact permission: agreed to personal follow-up about this inquiry.\nReference: ${requestId}`,
        html: `<h1>Brickell founding membership inquiry</h1><p>Please follow up personally with membership details.</p><dl><dt>Name</dt><dd>${escapeHtml(name)}</dd><dt>Email</dt><dd>${escapeHtml(email)}</dd><dt>Phone</dt><dd>${escapeHtml(phone)}</dd><dt>Studio</dt><dd>Brickell, Miami</dd></dl><p>This visitor agreed to be contacted about their membership inquiry.</p><p>Reference: ${requestId}</p>`,
      });
      if (!sent.messageId) throw new Error("email_not_accepted");
      console.log(
        JSON.stringify({ event: "inquiry_email_accepted", requestId }),
      );
      return json({ ok: true, reference: requestId }, 200);
    } catch {
      console.error(
        JSON.stringify({ event: "inquiry_delivery_failed", requestId }),
      );
      return json({ error: "temporarily_unavailable" }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
