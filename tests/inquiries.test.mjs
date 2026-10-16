import test, { mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../worker/index.ts";
import { flushNotifications } from "../worker/notifications.ts";
import { flushFounderTexts, textNumber } from "../worker/comms.ts";
import { Webhook } from "svix";
import { deliveryLink } from "../worker/delivery.ts";

afterEach(() => mock.restoreAll());

function webhookRequest(
  env,
  inquiryId,
  type = "email.delivered",
  options = {},
) {
  const eventId = options.eventId || `msg_${crypto.randomUUID()}`;
  const timestamp = options.timestamp || new Date();
  const payload = JSON.stringify({
    type,
    created_at: options.occurredAt || new Date().toISOString(),
    data: {
      email_id: options.emailId || "test-message",
      tags: { project: env.DELIVERY_PROJECT, inquiry_id: inquiryId },
      ...options.data,
    },
  });
  return new Request(`${origin}/api/webhooks/resend`, {
    method: "POST",
    headers: {
      "svix-id": eventId,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": new Webhook(env.RESEND_WEBHOOK_SECRET).sign(
        eventId,
        timestamp,
        payload,
      ),
    },
    body: options.body || payload,
  });
}

const origin = "https://brickell.example.com";
const lead = {
  name: "Jamie Example",
  email: "jamie@example.com",
  phone: "+1 (305) 555-0100",
  website: "",
  consent: true,
};
function request(body = lead, options = {}) {
  return new Request(`${origin}/api/inquiries`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}
function environment(overrides = {}) {
  const messages = [];
  const texts = [];
  const requests = [];
  const { send, sendText, ...bindings } = overrides;
  const db = new DatabaseSync(":memory:");
  for (const migration of readdirSync(
    new URL("../migrations/", import.meta.url),
  ).sort())
    db.exec(
      readFileSync(
        new URL(`../migrations/${migration}`, import.meta.url),
        "utf8",
      ),
    );
  mock.method(globalThis, "fetch", async (url, options) => {
    const message = JSON.parse(options.body);
    requests.push({ url, headers: options.headers, message });
    const isText = url === "https://osis.co/api/v1/comms/messages";
    const result = isText
      ? await (
          sendText ??
          (async (body) => {
            texts.push(body);
            return { message: { id: "msg-test" } };
          })
        )(message)
      : await (
          send ??
          (async (body) => {
            messages.push(body);
            return { id: "test-message" };
          })
        )(message);
    return result instanceof Response ? result : Response.json(result);
  });
  const statement = (sql, values = []) => ({
    bind: (...args) => statement(sql, args),
    run: async () => ({
      success: true,
      meta: { changes: Number(db.prepare(sql).run(...values).changes) },
    }),
    first: async () => db.prepare(sql).get(...values) ?? null,
    all: async () => ({
      success: true,
      results: db.prepare(sql).all(...values),
    }),
  });
  return {
    messages,
    texts,
    requests,
    db,
    inquiries: () => db.prepare("SELECT * FROM inquiries").all(),
    env: {
      LEADS: { prepare: (sql) => statement(sql) },
      LEAD_RECIPIENT: "manager@example.com",
      FRONTEND_ORIGIN: "",
      EMAIL_FROM: "inquiries@example.com",
      EMAIL_ENABLED: "true",
      RESEND_API_KEY: "re_test-only",
      COMMS_ENABLED: "false",
      COMMS_API_KEY: "osis_test-only",
      COMMS_LINE: "+12103933771",
      PUBLIC_ORIGIN: origin,
      DELIVERY_PROJECT: "studio-three-brickell-test",
      DELIVERY_LINK_SECRET: "test-only-link-signing-key",
      RESEND_WEBHOOK_SECRET: `whsec_${Buffer.from("test-only-webhook-secret").toString("base64")}`,
      INQUIRY_LIMITER: { limit: async () => ({ success: true }) },
      ASSETS: { fetch: async () => new Response("static asset") },
      ...bindings,
    },
  };
}

test("valid inquiries go to the configured manager with the visitor as reply-to", async () => {
  const { env, messages, requests } = environment();
  const response = await worker.fetch(
    request({ ...lead, name: "Jamie <Example>" }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].to, [env.LEAD_RECIPIENT]);
  assert.equal(messages[0].reply_to, lead.email);
  assert.equal(messages[0].from, `Studio Three Brickell <${env.EMAIL_FROM}>`);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal(
    requests[0].headers.Authorization,
    `Bearer ${env.RESEND_API_KEY}`,
  );
  assert.match(requests[0].headers["Idempotency-Key"], /^brickell-inquiry\//);
  assert.match(messages[0].html, /Jamie &lt;Example&gt;/);
  assert.doesNotMatch(messages[0].html, /Jamie <Example>/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("membership inquiry notifications reach Justin and Adriana with the visitor as reply-to", async () => {
  const { env, messages } = environment({
    LEAD_RECIPIENT: "justin@aryocg.com, adriana@studiothree.com",
  });
  const response = await worker.fetch(
    request({ ...lead, to: "unapproved@example.com" }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].to, [
    "justin@aryocg.com",
    "adriana@studiothree.com",
  ]);
  assert.equal(messages[0].reply_to, lead.email);
});

test("notification recipient configuration is validated completely before sending", async () => {
  for (const LEAD_RECIPIENT of [
    "manager@example.com,invalid",
    "manager@example.com,",
    ",manager@example.com",
  ]) {
    const { env, messages, inquiries } = environment({ LEAD_RECIPIENT });
    assert.equal((await worker.fetch(request(), env)).status, 200);
    assert.equal(messages.length, 0);
    assert.equal(inquiries()[0].notification_status, "pending");
    assert.equal(inquiries()[0].notification_attempts, 0);
  }
});

test("duplicate notification recipients receive one copy", async () => {
  const { env, messages } = environment({
    LEAD_RECIPIENT: "manager@example.com, MANAGER@example.com",
  });
  assert.equal((await worker.fetch(request(), env)).status, 200);
  assert.deepEqual(messages[0].to, ["manager@example.com"]);
});

test("inquiries remain durably saved while the email setup is pending", async () => {
  const { env, messages, inquiries } = environment({ LEAD_RECIPIENT: "" });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(messages.length, 0);
  assert.equal(inquiries()[0].notification_status, "pending");
  assert.equal(inquiries()[0].notification_attempts, 0);
});

test("the email activation switch prevents use of an unauthenticated sender", async () => {
  const { env, messages, inquiries } = environment({ EMAIL_ENABLED: "false" });
  assert.equal((await worker.fetch(request(), env)).status, 200);
  await flushNotifications(env);
  assert.equal(messages.length, 0);
  assert.equal(inquiries()[0].notification_attempts, 0);
});

test("delivery failures and missing receipts preserve the inquiry for retry", async () => {
  for (const send of [
    async () => {
      throw new Error("Delivery failed");
    },
    async () => ({}),
  ]) {
    const { env, inquiries } = environment({ send });
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(inquiries()[0].notification_status, "pending");
    assert.equal(inquiries()[0].notification_attempts, 1);
  }
});

test("storage failures cannot claim receipt or send a notification", async () => {
  const { env, messages } = environment({
    LEADS: {
      prepare: () => {
        throw new Error("Unavailable");
      },
    },
  });
  assert.equal((await worker.fetch(request(), env)).status, 503);
  assert.equal(messages.length, 0);
});

test("retrying a submitted request does not duplicate the lead or its accepted email", async () => {
  const { env, messages, inquiries } = environment();
  const body = { ...lead, requestId: crypto.randomUUID() };
  const first = await worker.fetch(request(body), env);
  const repeated = await worker.fetch(request(body), env);
  assert.equal(
    (await first.json()).reference,
    (await repeated.json()).reference,
  );
  assert.equal(inquiries().length, 1);
  assert.equal(messages.length, 1);
  assert.equal(inquiries()[0].notification_status, "sent");
});

test("reusing a request identifier with different contact details is rejected", async () => {
  const { env, inquiries } = environment();
  const body = { ...lead, requestId: crypto.randomUUID() };
  assert.equal((await worker.fetch(request(body), env)).status, 200);
  assert.equal(
    (await worker.fetch(request({ ...body, name: "Someone Else" }), env))
      .status,
    409,
  );
  assert.equal(inquiries()[0].name, lead.name);
});

test("concurrent duplicate submissions claim the notification only once", async () => {
  let release;
  const pause = new Promise((resolve) => {
    release = resolve;
  });
  let sends = 0;
  const { env, inquiries } = environment({
    send: async () => {
      sends += 1;
      await pause;
      return { id: "accepted" };
    },
  });
  const body = { ...lead, requestId: crypto.randomUUID() };
  const first = worker.fetch(request(body), env);
  const second = worker.fetch(request(body), env);
  assert.equal((await second).status, 200);
  release();
  assert.equal((await first).status, 200);
  assert.equal(inquiries().length, 1);
  assert.equal(sends, 1);
});

test("scheduled retries send a saved inquiry after a temporary failure", async () => {
  let attempts = 0;
  const { env, inquiries } = environment({
    send: async () => {
      attempts += 1;
      if (attempts === 1)
        throw Object.assign(new Error("Temporary failure"), {
          code: "E_RATE_LIMIT_EXCEEDED",
        });
      return { id: "retry-accepted" };
    },
  });
  await worker.fetch(request(), env);
  const pending = inquiries()[0];
  await flushNotifications(env, pending.next_attempt_at - 1);
  assert.equal(attempts, 1);
  await flushNotifications(env, pending.next_attempt_at);
  assert.equal(attempts, 2);
  assert.equal(inquiries()[0].notification_status, "sent");
  assert.equal(inquiries()[0].email_message_id, "retry-accepted");
});

test("persistent notification errors stop after eight attempts and leave a reviewable lead", async () => {
  const { env, inquiries } = environment({
    send: async () => {
      throw new Error("Unavailable");
    },
  });
  await worker.fetch(request(), env);
  for (let attempt = 1; attempt < 8; attempt += 1)
    await flushNotifications(env, inquiries()[0].next_attempt_at);
  assert.equal(inquiries()[0].notification_status, "failed");
  assert.equal(inquiries()[0].notification_attempts, 8);
  await flushNotifications(env, inquiries()[0].next_attempt_at + 3600);
  assert.equal(inquiries()[0].notification_attempts, 8);
});

test("an interrupted final attempt becomes failed after its lease expires", async () => {
  const { env, db, inquiries } = environment({ LEAD_RECIPIENT: "" });
  await worker.fetch(request(), env);
  db.prepare(
    "UPDATE inquiries SET notification_status = 'sending', notification_attempts = 8, lease_until = 100",
  ).run();
  env.LEAD_RECIPIENT = "manager@example.com";
  await flushNotifications(env, 101);
  assert.equal(inquiries()[0].notification_status, "failed");
});

test("campaign attribution is bounded and unknown fields are not stored", async () => {
  const { env, inquiries } = environment();
  await worker.fetch(
    request({
      ...lead,
      attribution: {
        utm_source: "meta",
        utm_campaign: "Brickell founders",
        gclid: "campaign-click",
        utm_term: "x".repeat(201),
        utm_content: "invalid\nvalue",
        referrer: "www.studiothree.com",
        arbitrary: "not retained",
      },
    }),
    env,
  );
  assert.deepEqual(JSON.parse(inquiries()[0].attribution), {
    utm_source: "meta",
    utm_campaign: "Brickell founders",
    gclid: "campaign-click",
    referrer: "www.studiothree.com",
  });
});

test("server validates names, email, phone, and contact permission", async () => {
  for (const patch of [
    { name: "" },
    { name: "a" },
    { name: "Jamie\r\nInjected" },
    { email: "invalid" },
    { email: "jamie@example.com\r\nBcc: other@example.com" },
    { phone: "555" },
    { phone: "not-a-phone" },
    { phone: "1234567890123456" },
    { consent: false },
  ]) {
    const { env, messages } = environment();
    assert.equal(
      (await worker.fetch(request({ ...lead, ...patch }), env)).status,
      400,
    );
    assert.equal(messages.length, 0);
  }
});

test("honeypot rejects automated submissions without sending email", async () => {
  const { env, messages } = environment();
  assert.equal(
    (await worker.fetch(request({ ...lead, website: "spam" }), env)).status,
    400,
  );
  assert.equal(messages.length, 0);
});

test("foreign and missing origins cannot submit", async () => {
  const { env, messages } = environment();
  for (const value of ["https://other.example.com", "null", ""])
    assert.equal(
      (await worker.fetch(request(lead, { headers: { Origin: value } }), env))
        .status,
      403,
    );
  assert.equal(messages.length, 0);
});

test("the explicitly configured local frontend origin works through the proxy", async () => {
  const { env, messages } = environment({
    FRONTEND_ORIGIN: "http://localhost:5173",
  });
  const proxied = new Request("http://127.0.0.1:8787/api/inquiries", {
    method: "POST",
    headers: {
      Origin: "http://localhost:5173",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });
  assert.equal((await worker.fetch(proxied, env)).status, 200);
  assert.equal(messages.length, 1);
});

test("oversized bodies are bounded even without a Content-Length", async () => {
  const { env, messages } = environment();
  assert.equal(
    (await worker.fetch(request({ ...lead, padding: "x".repeat(5000) }), env))
      .status,
    413,
  );
  assert.equal(messages.length, 0);
});

test("malformed JSON and unsupported content types fail safely", async () => {
  const { env } = environment();
  const malformed = new Request(`${origin}/api/inquiries`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal((await worker.fetch(malformed, env)).status, 400);
  assert.equal(
    (
      await worker.fetch(
        request(lead, { headers: { "Content-Type": "text/plain" } }),
        env,
      )
    ).status,
    415,
  );
});

test("rate limits stop email sends and return a retry interval", async () => {
  const { env, messages } = environment({
    INQUIRY_LIMITER: { limit: async () => ({ success: false }) },
  });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(messages.length, 0);
});

test("unknown API paths and GET requests do not fall through to the SPA", async () => {
  const { env } = environment();
  assert.equal(
    (await worker.fetch(new Request(`${origin}/api/inquiries`), env)).status,
    405,
  );
  assert.equal(
    (await worker.fetch(new Request(`${origin}/api/unknown`), env)).status,
    404,
  );
});

test("page requests use the static asset binding", async () => {
  const { env } = environment();
  assert.equal(
    await (await worker.fetch(new Request(`${origin}/`), env)).text(),
    "static asset",
  );
});

test("Comms sends only for explicit text permission, using the approved line and iMessage", async () => {
  const { env, texts, requests, inquiries } = environment({
    COMMS_ENABLED: "true",
  });
  await worker.fetch(request(), env);
  assert.equal(texts.length, 0);
  assert.equal(inquiries()[0].text_status, "skipped");
  const response = await worker.fetch(
    request({ ...lead, textConsent: true }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(texts.length, 1);
  assert.equal(texts[0].to, "+13055550100");
  assert.equal(texts[0].line_e164, env.COMMS_LINE);
  assert.equal(texts[0].channel, "imessage");
  assert.match(texts[0].body, /founding member at Studio Three Brickell/);
  assert.match(texts[0].body, /Our Brickell team will reach out personally/);
  assert.doesNotMatch(texts[0].body, /Anastasia/);
  const sent = requests.find((item) => item.url.includes("osis.co"));
  assert.equal(sent.headers.Authorization, `Bearer ${env.COMMS_API_KEY}`);
  assert.match(sent.headers["Idempotency-Key"], /^brickell-founder\//);
  assert.equal(inquiries()[1].text_permission, 1);
  assert.equal(inquiries()[1].text_status, "accepted");
  assert.equal(inquiries()[1].text_message_id, "msg-test");
});

test("text opt-in requires a usable phone number and a boolean permission", async () => {
  for (const patch of [
    { textConsent: "true" },
    { textConsent: true, phone: "5550100" },
  ]) {
    const { env, inquiries, texts } = environment({ COMMS_ENABLED: "true" });
    assert.equal(
      (await worker.fetch(request({ ...lead, ...patch }), env)).status,
      400,
    );
    assert.equal(inquiries().length, 0);
    assert.equal(texts.length, 0);
  }
  assert.equal(textNumber("305 555 0100"), "+13055550100");
  assert.equal(textNumber("+44 7700 900123"), "+447700900123");
  assert.equal(textNumber("5550100"), null);
});

test("missing provider credentials preserve queued notifications without attempts", async () => {
  const { env, inquiries, requests } = environment({
    RESEND_API_KEY: "",
    COMMS_ENABLED: "true",
    COMMS_API_KEY: "",
  });
  assert.equal(
    (await worker.fetch(request({ ...lead, textConsent: true }), env)).status,
    200,
  );
  assert.equal(requests.length, 0);
  assert.equal(inquiries()[0].notification_attempts, 0);
  assert.equal(inquiries()[0].text_attempts, 0);
  assert.equal(inquiries()[0].text_status, "pending");
});

test("text failures do not prevent inquiry receipt or an email notification", async () => {
  const { env, inquiries } = environment({
    COMMS_ENABLED: "true",
    sendText: async () =>
      new Response("private provider detail", { status: 503 }),
  });
  assert.equal(
    (await worker.fetch(request({ ...lead, textConsent: true }), env)).status,
    200,
  );
  assert.equal(inquiries()[0].notification_status, "sent");
  assert.equal(inquiries()[0].text_status, "pending");
  assert.equal(inquiries()[0].text_error_code, "comms_http_503");
});

test("text retries retain the message, line and idempotency key", async () => {
  let attempts = 0;
  const { env, inquiries, requests } = environment({
    COMMS_ENABLED: "true",
    sendText: async () => {
      attempts += 1;
      return attempts === 1
        ? new Response(null, { status: 503 })
        : { message: { id: "msg-retry" } };
    },
  });
  await worker.fetch(request({ ...lead, textConsent: true }), env);
  env.COMMS_LINE = "+13124049364";
  await flushFounderTexts(env, inquiries()[0].text_next_attempt_at);
  const sends = requests.filter((item) => item.url.includes("osis.co"));
  assert.equal(sends.length, 2);
  assert.deepEqual(sends[0], sends[1]);
  assert.equal(inquiries()[0].text_status, "accepted");
});

test("Comms unknown delivery is retained for manual review and is not resent", async () => {
  const { env, inquiries, requests } = environment({
    COMMS_ENABLED: "true",
    sendText: async () => ({
      message: { id: "msg-unknown" },
      delivery_unknown: true,
    }),
  });
  await worker.fetch(request({ ...lead, textConsent: true }), env);
  const record = inquiries()[0];
  assert.equal(record.text_status, "unknown");
  await flushFounderTexts(env, record.text_started_at + 1000);
  assert.equal(
    requests.filter((item) => item.url.includes("osis.co")).length,
    1,
  );
});

test("an unsupported iMessage recipient is marked for attention without SMS fallback", async () => {
  const { env, inquiries, requests } = environment({
    COMMS_ENABLED: "true",
    sendText: async () => new Response(null, { status: 422 }),
  });
  await worker.fetch(request({ ...lead, textConsent: true }), env);
  assert.equal(inquiries()[0].text_status, "failed");
  await flushFounderTexts(env);
  assert.equal(
    requests.filter((item) => item.url.includes("osis.co")).length,
    1,
  );
});

test("duplicate text requests are sent once", async () => {
  const { env, inquiries, texts } = environment({ COMMS_ENABLED: "true" });
  const body = { ...lead, textConsent: true, requestId: crypto.randomUUID() };
  await worker.fetch(request(body), env);
  await worker.fetch(request(body), env);
  assert.equal(inquiries().length, 1);
  assert.equal(texts.length, 1);
  assert.equal(
    (await worker.fetch(request({ ...body, textConsent: false }), env)).status,
    409,
  );
});

test("provider retries stop before their 24-hour idempotency retention expires", async () => {
  const { env, inquiries, requests } = environment({
    COMMS_ENABLED: "true",
    send: async () => new Response(null, { status: 429 }),
    sendText: async () => new Response(null, { status: 503 }),
  });
  await worker.fetch(request({ ...lead, textConsent: true }), env);
  const record = inquiries()[0];
  const now =
    Math.max(record.notification_started_at, record.text_started_at) +
    23 * 3600;
  await flushNotifications(env, now);
  await flushFounderTexts(env, now);
  assert.equal(inquiries()[0].notification_status, "failed");
  assert.equal(inquiries()[0].text_status, "failed");
  assert.equal(requests.length, 2);
  assert.equal(record.last_error_code, "E_RESEND_HTTP_429");
});

test("signed provider events record delivery and deduplicate retries", async () => {
  const { env, db, inquiries } = environment();
  const { reference } = await (await worker.fetch(request(), env)).json();
  const event = webhookRequest(env, reference);
  assert.equal((await worker.fetch(event.clone(), env)).status, 200);
  assert.equal((await worker.fetch(event, env)).status, 200);
  assert.equal(inquiries()[0].email_delivery_status, "delivered");
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM email_delivery_events").get().n,
    1,
  );
});

test("a spam complaint remains visible after late sent and delivered events", async () => {
  const { env, inquiries } = environment();
  const { reference } = await (await worker.fetch(request(), env)).json();
  for (const type of ["email.complained", "email.sent", "email.delivered"])
    assert.equal(
      (await worker.fetch(webhookRequest(env, reference, type), env)).status,
      200,
    );
  assert.equal(inquiries()[0].email_delivery_status, "complained");
  assert.ok(inquiries()[0].email_complained_at);
});

test("bounce, failed and suppressed reports are retained as delivery problems", async () => {
  for (const type of ["email.bounced", "email.failed", "email.suppressed"]) {
    const { env, inquiries } = environment();
    const { reference } = await (await worker.fetch(request(), env)).json();
    assert.equal(
      (await worker.fetch(webhookRequest(env, reference, type), env)).status,
      200,
    );
    assert.equal(inquiries()[0].email_delivery_status, type.slice(6));
  }
});

test("tampered and expired webhook signatures cannot change delivery status", async () => {
  const { env, inquiries } = environment();
  const { reference } = await (await worker.fetch(request(), env)).json();
  assert.equal(
    (
      await worker.fetch(
        webhookRequest(env, reference, "email.complained", { body: "{}" }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await worker.fetch(
        webhookRequest(env, reference, "email.complained", {
          timestamp: new Date(Date.now() - 600000),
        }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(inquiries()[0].email_delivery_status, "unreported");
});

test("webhook tags handle delivery before acknowledgement without accepting other projects", async () => {
  const { env, db, inquiries } = environment({ EMAIL_ENABLED: "false" });
  const { reference } = await (await worker.fetch(request(), env)).json();
  const unrelated = webhookRequest(env, reference, "email.delivered", {
    data: { tags: { project: "another-project", inquiry_id: reference } },
  });
  assert.equal(
    (await (await worker.fetch(unrelated, env)).json()).ignored,
    true,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM email_delivery_events").get().n,
    0,
  );
  assert.equal(
    (await worker.fetch(webhookRequest(env, reference), env)).status,
    200,
  );
  assert.equal(inquiries()[0].email_delivery_status, "delivered");
});

test("provider webhook storage failures ask for retry without claiming delivery", async () => {
  const { env } = environment();
  env.LEADS = {
    prepare: () => {
      throw new Error("db unavailable");
    },
  };
  assert.equal(
    (await worker.fetch(webhookRequest(env, crypto.randomUUID()), env)).status,
    503,
  );
});

test("webhook payloads are bounded without trusting Content-Length", async () => {
  const { env } = environment();
  assert.equal(
    (
      await worker.fetch(
        webhookRequest(env, crypto.randomUUID(), "email.sent", {
          body: " ".repeat(17000),
        }),
        env,
      )
    ).status,
    413,
  );
});

test("notification emails contain a private live status link without exposing contact data", async () => {
  const { env, messages } = environment();
  const { reference } = await (await worker.fetch(request(), env)).json();
  const statusUrl = await deliveryLink(
    env,
    reference,
    new Date().toISOString(),
  );
  assert.match(messages[0].text, /Delivery and spam-complaint status: https:/);
  const page = await worker.fetch(new Request(statusUrl), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /No spam complaint has been reported/);
  assert.match(
    html,
    /does not show whether that mailbox placed it in Inbox or Spam/,
  );
  assert.doesNotMatch(html, /jamie@example.com|Jamie Example|555-0100/);
  assert.equal(page.headers.get("Cache-Control"), "no-store");
  assert.equal(page.headers.get("Referrer-Policy"), "no-referrer");
  assert.match(page.headers.get("X-Robots-Tag"), /noindex/);
  const changed = new URL(statusUrl);
  changed.pathname = `/api/delivery/${crypto.randomUUID()}`;
  assert.equal((await worker.fetch(new Request(changed), env)).status, 404);
  const expired = await deliveryLink(
    env,
    reference,
    new Date(Date.now() - 31 * 86400000).toISOString(),
  );
  assert.equal((await worker.fetch(new Request(expired), env)).status, 404);
  assert.equal(
    (
      await worker.fetch(
        new Request(`${origin}/api/delivery/${reference}`),
        env,
      )
    ).status,
    404,
  );
});

test("the public domain redirects HTTP and www to its HTTPS canonical URL", async () => {
  const { env } = environment();
  for (const url of [
    "http://studiothreefounders.com/?utm_source=test",
    "https://www.studiothreefounders.com/?utm_source=test",
  ]) {
    const res = await worker.fetch(new Request(url), env);
    assert.equal(res.status, 308);
    assert.equal(
      res.headers.get("Location"),
      "https://studiothreefounders.com/?utm_source=test",
    );
  }
  assert.equal(
    (await worker.fetch(new Request("https://studiothreefounders.com/"), env))
      .status,
    200,
  );
});
