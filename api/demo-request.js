const ALLOWED_TOOLS = new Set([
  "Spreadsheets",
  "WhatsApp",
  "Accounting",
  "CRM",
  "ERP",
  "Internal systems",
  "Mostly manual"
]);

function text(value, max) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max)
    : "";
}

function validEmail(value) {
  return value.length < 181 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
}

function requestHost(req) {
  return String(req.headers.host || "").split(":")[0].toLowerCase();
}

function allowedHosts() {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTS ||
    "ranaise.site,www.ranaise.site,ranaise-ai-beta.vercel.app";
  return new Set(configured.split(",").map(host => host.trim().toLowerCase()).filter(Boolean));
}

async function verifyTurnstile(token, host, secret) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token })
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true &&
      result?.action === "demo_request" &&
      String(result?.hostname || "").toLowerCase() === host;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "POST");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });

  const host = requestHost(req);
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== String(req.headers.host || "").toLowerCase()) {
        return json(res, 403, { error: "Origin not allowed." });
      }
    } catch {
      return json(res, 403, { error: "Invalid origin." });
    }
  }
  if (!host || !allowedHosts().has(host)) {
    return json(res, 403, { error: "This form is not available on this host." });
  }

  if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
    return json(res, 415, { error: "Expected JSON." });
  }
  if (Number(req.headers["content-length"] || 0) > 10000) {
    return json(res, 413, { error: "Request too large." });
  }

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > 10000) return json(res, 413, { error: "Request too large." });
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "Invalid JSON." });
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(res, 400, { error: "Invalid request." });
  }
  if (JSON.stringify(body).length > 10000) {
    return json(res, 413, { error: "Request too large." });
  }
  if (text(body.website, 100)) {
    return json(res, 400, { error: "Unable to accept request." });
  }
  if (!body.consent || typeof body.elapsedMs !== "number" || body.elapsedMs < 1700) {
    return json(res, 400, { error: "Please complete the form and consent before sending." });
  }

  const payload = {
    name: text(body.name, 100),
    email: text(body.email, 180),
    company: text(body.company, 120),
    whatsapp: text(body.whatsapp, 30),
    role: text(body.role, 60),
    industry: text(body.industry, 65),
    companySize: text(body.companySize, 30),
    annualRevenue: text(body.annualRevenue, 40),
    tools: Array.isArray(body.tools)
      ? [...new Set(body.tools.map(value => text(value, 40).replace(/[\u0000-\u001f\u007f]/g, "")))]
        .filter(value => ALLOWED_TOOLS.has(value)).slice(0, 12)
      : [],
    timeline: text(body.timeline, 55),
    challenge: text(body.challenge, 1200)
  };

  if (!payload.name || !validEmail(payload.email) || !payload.company || !payload.role ||
      !payload.industry || !payload.companySize || !payload.timeline) {
    return json(res, 400, { error: "Please complete all required fields." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const sender = text(process.env.DEMO_SENDER_EMAIL, 180);
  const recipient = text(process.env.DEMO_NOTIFICATION_EMAIL || "founder@ranaise.site", 180);
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!apiKey || !validEmail(sender) || !validEmail(recipient) || !turnstileSiteKey || !turnstileSecret) {
    return json(res, 503, { error: "Automatic email delivery is not configured." });
  }

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";
  if (!token || token.length > 2048) {
    return json(res, 403, { error: "Complete the security check before sending your request." });
  }

  try {
    if (!await verifyTurnstile(token, host, turnstileSecret)) {
      return json(res, 403, { error: "The security check could not be verified. Please try again." });
    }
  } catch (error) {
    console.error("Turnstile verification unavailable:", error?.name || "Unknown");
    return json(res, 503, { error: "Security verification is unavailable. Please try again shortly." });
  }

  const lines = [
    "New Ranaise demo request",
    "",
    ["Name", payload.name],
    ["Work email", payload.email],
    ["Organization", payload.company],
    ["WhatsApp", payload.whatsapp || "Not provided"],
    ["Role", payload.role],
    ["Industry", payload.industry],
    ["Team size", payload.companySize],
    ["Annual revenue", payload.annualRevenue || "Not provided"],
    ["Tools", payload.tools.join(", ") || "Not provided"],
    ["Timeline", payload.timeline],
    ["Problem to solve", payload.challenge || "Not provided"]
  ].map(row => Array.isArray(row) ? row.join(": ") : row).join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: payload.email,
        subject: "New Ranaise demo inquiry: " + payload.company.replace(/[\r\n]/g, " ").slice(0, 80),
        text: lines
      })
    });

    let result;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (!response.ok || !result || typeof result.id !== "string") {
      console.error("Demo delivery failed, status:", response.status);
      return json(res, 502, { error: "Email delivery unavailable. Please retry or use the email option." });
    }
    return json(res, 200, { ok: true, message: "Request accepted for email delivery." });
  } catch (error) {
    console.error("Demo delivery request failed:", error?.name || "Unknown");
    return json(res, 503, { error: "Email delivery unavailable. Please retry or use the email option." });
  } finally {
    clearTimeout(timer);
  }
};
