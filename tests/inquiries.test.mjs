import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../worker/index.ts";
import { flushNotifications } from "../worker/notifications.ts";

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
  const db = new DatabaseSync(":memory:");
  db.exec(
    readFileSync(
      new URL("../migrations/0001_inquiries.sql", import.meta.url),
      "utf8",
    ),
  );
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
    db,
    inquiries: () => db.prepare("SELECT * FROM inquiries").all(),
    env: {
      LEADS: { prepare: (sql) => statement(sql) },
      LEAD_RECIPIENT: "manager@example.com",
      FRONTEND_ORIGIN: "",
      EMAIL_FROM: "inquiries@example.com",
      EMAIL_ENABLED: "true",
      EMAIL: {
        send: async (message) => {
          messages.push(message);
          return { messageId: "test-message" };
        },
      },
      INQUIRY_LIMITER: { limit: async () => ({ success: true }) },
      ASSETS: { fetch: async () => new Response("static asset") },
      ...overrides,
    },
  };
}

test("valid inquiries go to the configured manager with the visitor as reply-to", async () => {
  const { env, messages } = environment();
  const response = await worker.fetch(
    request({ ...lead, name: "Jamie <Example>" }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, env.LEAD_RECIPIENT);
  assert.equal(messages[0].replyTo, lead.email);
  assert.match(messages[0].html, /Jamie &lt;Example&gt;/);
  assert.doesNotMatch(messages[0].html, /Jamie <Example>/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
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
    const { env, inquiries } = environment({ EMAIL: { send } });
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
    EMAIL: {
      send: async () => {
        sends += 1;
        await pause;
        return { messageId: "accepted" };
      },
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
    EMAIL: {
      send: async () => {
        attempts += 1;
        if (attempts === 1)
          throw Object.assign(new Error("Temporary failure"), {
            code: "E_RATE_LIMIT_EXCEEDED",
          });
        return { messageId: "retry-accepted" };
      },
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
    EMAIL: {
      send: async () => {
        throw new Error("Unavailable");
      },
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
