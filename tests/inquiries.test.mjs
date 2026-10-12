import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";

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
  return {
    messages,
    env: {
      LEAD_RECIPIENT: "manager@example.com",
      FRONTEND_ORIGIN: "",
      EMAIL_FROM: "inquiries@example.com",
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

test("unconfigured email does not pretend the inquiry was accepted", async () => {
  const { env, messages } = environment({ LEAD_RECIPIENT: "" });
  assert.equal((await worker.fetch(request(), env)).status, 503);
  assert.equal(messages.length, 0);
});

test("delivery failures and missing delivery receipts do not show success", async () => {
  for (const send of [
    async () => {
      throw new Error("Delivery failed");
    },
    async () => ({}),
  ]) {
    const { env } = environment({ EMAIL: { send } });
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, undefined);
  }
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
