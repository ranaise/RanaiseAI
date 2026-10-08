const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const handler = require("../api/demo-request.js");
const turnstileConfig = require("../api/turnstile-config.js");

const ENV_KEYS = [
  "RESEND_API_KEY",
  "DEMO_SENDER_EMAIL",
  "DEMO_NOTIFICATION_EMAIL",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_ALLOWED_HOSTS"
];

const deliveryEnv = {
  RESEND_API_KEY: "test-resend-key",
  DEMO_SENDER_EMAIL: "forms@notify.ranaise.site",
  DEMO_NOTIFICATION_EMAIL: "founder@ranaise.site",
  TURNSTILE_SITE_KEY: "test-site-key",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  TURNSTILE_ALLOWED_HOSTS: "ranaise.site,www.ranaise.site,ranaise-ai-beta.vercel.app"
};

const valid = {
  name: "Ranaise Tester",
  email: "person@example.org",
  company: "Example Team",
  role: "Founder / Owner",
  industry: "Technology / SaaS",
  companySize: "1–10",
  timeline: "Just exploring",
  tools: ["Spreadsheets"],
  consent: true,
  elapsedMs: 5000,
  turnstileToken: "test-turnstile-token"
};

async function withEnv(values, run) {
  const previous = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    if (Object.hasOwn(values, key)) process.env[key] = values[key];
    else delete process.env[key];
  }
  try {
    return await run();
  } finally {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function invoke(method, body = {}, headers = {}) {
  const req = {
    method,
    body,
    headers: {
      "content-type": "application/json",
      host: "ranaise-ai-beta.vercel.app",
      ...headers
    },
    socket: { remoteAddress: "127.0.0.1" }
  };
  const res = {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
  return Promise.resolve(handler(req, res)).then(() => res);
}

function configResponse(method, env) {
  const req = { method, headers: {} };
  const res = {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
  return withEnv(env, () => turnstileConfig(req, res).payload ? res : res);
}

test("demo endpoint enforces POST and request size limits", async () => {
  assert.equal((await invoke("GET")).statusCode, 405);
  assert.equal((await invoke("POST", valid, { "content-length": "10001" })).statusCode, 413);
});

test("demo endpoint rejects invalid email and spam honeypot", async () => {
  assert.equal((await invoke("POST", { ...valid, email: "invalid" })).statusCode, 400);
  assert.equal((await invoke("POST", { ...valid, website: "https://spam.test" })).statusCode, 400);
});

test("demo endpoint rejects cross-site submissions and unexpected hosts", async () => {
  assert.equal((await invoke("POST", valid, { origin: "https://not-ranaise.example" })).statusCode, 403);
  assert.equal((await invoke("POST", valid, { host: "attacker.example" })).statusCode, 403);
});

test("demo endpoint fails closed when delivery or server-side bot protection is not configured", async () => {
  await withEnv({}, async () => {
    const response = await invoke("POST", valid);
    assert.equal(response.statusCode, 503);
    assert.match(response.payload.error, /not configured/i);
    assert.equal(response.headers["Cache-Control"], "no-store");
  });
});

test("demo endpoint requires a Turnstile token", async () => {
  await withEnv(deliveryEnv, async () => {
    const response = await invoke("POST", { ...valid, turnstileToken: "" });
    assert.equal(response.statusCode, 403);
    assert.match(response.payload.error, /security check/i);
  });
});

test("demo endpoint rejects invalid Turnstile verification", async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => ({ ok: true, json: async () => ({ success: false }) });

  await withEnv(deliveryEnv, async () => {
    const response = await invoke("POST", valid);
    assert.equal(response.statusCode, 403);
    assert.match(response.payload.error, /could not be verified/i);
  });
});

test("Turnstile config exposes only the public site key and fails closed when incomplete", async () => {
  const ready = await configResponse("GET", deliveryEnv);
  assert.equal(ready.statusCode, 200);
  assert.deepEqual(ready.payload, { siteKey: "test-site-key" });
  assert.equal(ready.headers["Cache-Control"], "no-store");

  const incomplete = await configResponse("GET", { TURNSTILE_SITE_KEY: "test-site-key" });
  assert.equal(incomplete.statusCode, 503);
  assert.equal(incomplete.payload.siteKey, undefined);
});

test("demo endpoint verifies Turnstile then sends a plain-text notification with Reply-To", async t => {
  const originalFetch = global.fetch;
  const providerRequests = [];
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async (url, options) => {
    providerRequests.push({ url, options });
    if (url.includes("siteverify")) {
      const body = JSON.parse(options.body);
      assert.equal(body.secret, "test-turnstile-secret");
      assert.equal(body.response, valid.turnstileToken);
      return {
        ok: true,
        json: async () => ({ success: true, action: "demo_request", hostname: "ranaise-ai-beta.vercel.app" })
      };
    }
    return { ok: true, json: async () => ({ id: "test-email-id" }) };
  };

  await withEnv(deliveryEnv, async () => {
    const response = await invoke("POST", {
      ...valid,
      company: "Example Team\r\nBcc: attacker@example.org",
      annualRevenue: "USD 100k–1M",
      challenge: "Weekly business review"
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { ok: true, message: "Request accepted for email delivery." });
  });

  assert.equal(providerRequests.length, 2);
  assert.match(providerRequests[0].url, /turnstile\/v0\/siteverify/);
  assert.equal(providerRequests[1].url, "https://api.resend.com/emails");
  const mail = JSON.parse(providerRequests[1].options.body);
  assert.equal(mail.from, "forms@notify.ranaise.site");
  assert.deepEqual(mail.to, ["founder@ranaise.site"]);
  assert.equal(mail.reply_to, "person@example.org");
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.match(mail.text, /Weekly business review/);
  assert.match(mail.text, /Annual revenue: USD 100k–1M/);
  assert.equal("html" in mail, false);
});

test("provider errors never produce a success response", async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async url => url.includes("siteverify")
    ? { ok: true, json: async () => ({ success: true, action: "demo_request", hostname: "ranaise-ai-beta.vercel.app" }) }
    : { ok: false, status: 403, json: async () => ({ message: "rejected" }) };

  await withEnv(deliveryEnv, async () => {
    const response = await invoke("POST", valid);
    assert.equal(response.statusCode, 502);
    assert.notEqual(response.payload.ok, true);
  });
});

test("two-step form preserves an honest failure path and keeps credentials server-side", () => {
  const html = fs.readFileSync(path.join(__dirname, "../request-demo.html"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "../src/request-demo.js"), "utf8");
  assert.match(html, /data-step="1"/);
  assert.match(html, /data-step="2"/);
  assert.match(html, /id="form-error"/);
  assert.match(html, /id="email-fallback"/);
  assert.match(html, /id="turnstile-widget"/);
  assert.match(js, /mailto:founder@ranaise\.site/);
  assert.match(js, /turnstileToken/);
  assert.doesNotMatch(js, /RESEND_API_KEY|TURNSTILE_SECRET_KEY/);
});
