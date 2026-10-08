function json(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
}

module.exports = function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed." });
  }

  const siteKey = process.env.TURNSTILE_SITE_KEY;
  if (!siteKey || !process.env.TURNSTILE_SECRET_KEY) {
    return json(res, 503, { error: "Security verification is not configured." });
  }
  return json(res, 200, { siteKey });
};
