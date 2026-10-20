import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const oldStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);
afterEach(() => {
  for (const [key, descriptor] of [
    ["window", oldWindow],
    ["sessionStorage", oldStorage],
  ]) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});
let moduleId = 0;
const reference = "f51c4fd9-1f65-41a2-b1ed-eb28d2f383ef";
function browser(
  hostname = "studiothreefounders.com",
  storageAvailable = true,
) {
  const events = [];
  const values = new Map();
  const fixture = {
    fbq: (...args) => events.push(args),
    history: {
      state: null,
      replaceState(state) {
        this.state = structuredClone(state);
      },
    },
    location: { hostname, href: `https://${hostname}/thank-you/` },
  };
  const storage = {
    getItem(key) {
      if (!storageAvailable) throw new Error("storage unavailable");
      return values.get(key) || null;
    },
    setItem(key, value) {
      if (!storageAvailable) throw new Error("storage unavailable");
      values.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: fixture,
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: storage,
    configurable: true,
  });
  return { fixture, events, values };
}
const tracking = () =>
  import(`../artifacts/studio-three/src/lib/meta-pixel.ts?test=${++moduleId}`);

test("the supplied pixel initializes once and sends PageView on the live domain", () => {
  const html = readFileSync(
    new URL("../artifacts/studio-three/index.html", import.meta.url),
    "utf8",
  );
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((value) => value.includes("fbevents.js"));
  assert.ok(script);
  const scripts = [];
  const scope = {
    location: { hostname: "studiothreefounders.com" },
    document: {
      createElement: () => ({}),
      getElementsByTagName: () => [
        { parentNode: { insertBefore: (element) => scripts.push(element) } },
      ],
    },
  };
  scope.window = scope;
  vm.runInNewContext(script, scope);
  assert.equal(
    scripts[0].src,
    "https://connect.facebook.net/en_US/fbevents.js",
  );
  assert.equal(scripts[0].async, true);
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(Array.from(scope.fbq.queue, (args) => Array.from(args))),
    ),
    [
      ["init", "1319802326887263"],
      ["track", "PageView"],
    ],
  );
  assert.match(html, /<noscript\b[\s\S]*1319802326887263[\s\S]*noscript=1/);
});

test("a direct thank-you visit cannot create a Lead event", async () => {
  const { events } = browser();
  const pixel = await tracking();
  assert.equal(pixel.confirmedInquiry(), null);
  assert.equal(pixel.trackConfirmedLead(), false);
  assert.equal(events.length, 0);
});

test("a successful receipt sends one Lead with a stable event ID and no contact fields", async () => {
  const { fixture, events } = browser();
  const pixel = await tracking();
  fixture.history.state = {
    s3Inquiry: pixel.rememberConfirmedInquiry(reference),
  };
  pixel.trackPageView();
  assert.equal(pixel.trackConfirmedLead(), true);
  assert.deepEqual(events, [
    ["track", "PageView"],
    [
      "track",
      "Lead",
      { content_name: "Studio Three Brickell founding membership" },
      { eventID: reference },
    ],
  ]);
  assert.equal(pixel.trackConfirmedLead(), false);
  assert.equal((await tracking()).trackConfirmedLead(), false);
  assert.equal(events.length, 2);
});

test("refresh protection works when sessionStorage is unavailable", async () => {
  const { fixture, events } = browser("studiothreefounders.com", false);
  const pixel = await tracking();
  fixture.history.state = {
    s3Inquiry: pixel.rememberConfirmedInquiry(reference),
  };
  assert.equal(pixel.trackConfirmedLead(), true);
  assert.equal((await tracking()).trackConfirmedLead(), false);
  assert.equal(events.length, 1);
});

test("invalid, expired, and future receipts do not fire conversions", async () => {
  const { fixture, events, values } = browser();
  const pixel = await tracking();
  assert.throws(() => pixel.rememberConfirmedInquiry("unconfirmed"));
  for (const confirmedAt of [Date.now() - 31 * 60 * 1000, Date.now() + 60000]) {
    fixture.history.state = {
      s3Inquiry: { reference, confirmedAt, tracked: false },
    };
    assert.equal(pixel.trackConfirmedLead(), false);
  }
  values.set("s3-brickell-confirmed-inquiry", "{broken");
  assert.equal(pixel.trackConfirmedLead(), false);
  assert.equal(events.length, 0);
});

test("a blocked or failing pixel never throws and leaves a valid receipt available", async () => {
  const { fixture, events } = browser();
  const pixel = await tracking();
  fixture.history.state = {
    s3Inquiry: pixel.rememberConfirmedInquiry(reference),
  };
  fixture.fbq = undefined;
  assert.equal(pixel.trackConfirmedLead(), false);
  fixture.fbq = () => {
    throw new Error("blocked");
  };
  assert.equal(pixel.trackConfirmedLead(), false);
  fixture.fbq = (...args) => events.push(args);
  assert.equal(pixel.trackConfirmedLead(), true);
  assert.equal(events.length, 1);
});

test("preview and local checks do not enter the live pixel conversion totals", async () => {
  for (const hostname of [
    "localhost",
    "127.0.0.1",
    "s3-brickell-lander-dev.justin-b75.workers.dev",
  ]) {
    const { fixture, events } = browser(hostname);
    const pixel = await tracking();
    fixture.history.state = {
      s3Inquiry: pixel.rememberConfirmedInquiry(reference),
    };
    pixel.trackPageView();
    assert.equal(pixel.trackConfirmedLead(), false);
    assert.equal(events.length, 0);
  }
});
