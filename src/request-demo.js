(() => {
  "use strict";

  const form = document.getElementById("demo-form");
  if (!form) return;

  const first = form.querySelector('[data-step="1"]');
  const second = form.querySelector('[data-step="2"]');
  const error = document.getElementById("form-error");
  const fallback = document.getElementById("email-fallback");
  const fallbackCopy = document.getElementById("fallback-copy");
  const submit = document.getElementById("submit-demo");
  const turnstileContainer = document.getElementById("turnstile-widget");
  const turnstileStatus = document.getElementById("turnstile-status");
  const startedAt = Date.now();

  let turnstileToken = "";
  let turnstileWidgetId = null;
  let turnstileLoadPromise = null;

  const controls = step => [...step.querySelectorAll("input, select, textarea")]
    .filter(element => element.id !== "website");

  function clearMessage() {
    error.hidden = true;
    error.textContent = "";
    fallback.hidden = true;
  }

  function showStep(number) {
    first.hidden = number !== 1;
    second.hidden = number !== 2;
    clearMessage();
    if (number === 2) void loadTurnstile();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
    const heading = form.querySelector('[data-step="' + number + '"] .access-stephead');
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }

  function validate(step) {
    for (const control of controls(step)) {
      if (!control.checkValidity()) {
        control.reportValidity();
        control.focus();
        return false;
      }
    }
    return true;
  }

  function setTurnstileStatus(message) {
    turnstileStatus.textContent = message;
  }

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => window.turnstile ? resolve() : reject(new Error("Turnstile unavailable.")), { once: true });
      script.addEventListener("error", () => reject(new Error("Turnstile unavailable.")), { once: true });
      document.head.append(script);
    });
  }

  async function loadTurnstile() {
    if (turnstileWidgetId || turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = (async () => {
      const response = await fetch("/api/turnstile-config", { cache: "no-store" });
      const config = await response.json().catch(() => ({}));
      if (!response.ok || typeof config.siteKey !== "string" || !config.siteKey) {
        throw new Error("Secure submission is not configured yet.");
      }

      await loadTurnstileScript();
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: config.siteKey,
        action: "demo_request",
        theme: "dark",
        callback(token) {
          turnstileToken = token;
          setTurnstileStatus("Security check complete.");
        },
        "expired-callback"() {
          turnstileToken = "";
          setTurnstileStatus("The security check expired. Please complete it again.");
        },
        "error-callback"() {
          turnstileToken = "";
          setTurnstileStatus("Security verification could not load. Please retry shortly.");
        }
      });
      setTurnstileStatus("Complete the security check before submitting.");
    })().catch(() => {
      turnstileLoadPromise = null;
      setTurnstileStatus("Secure submission is not available yet. Your details will stay in this form.");
    });

    return turnstileLoadPromise;
  }

  function values() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("company") || "").trim(),
      whatsapp: String(data.get("whatsapp") || "").trim(),
      role: String(data.get("role") || "").trim(),
      industry: String(data.get("industry") || "").trim(),
      companySize: String(data.get("companySize") || "").trim(),
      annualRevenue: String(data.get("annualRevenue") || "").trim(),
      tools: data.getAll("tools").map(String).slice(0, 12),
      timeline: String(data.get("timeline") || "").trim(),
      challenge: String(data.get("challenge") || "").trim(),
      consent: data.get("consent") === "on",
      website: String(data.get("website") || ""),
      elapsedMs: Date.now() - startedAt,
      turnstileToken
    };
  }

  function emailLink(data) {
    const details = [
      ["Name", data.name],
      ["Work email", data.email],
      ["Organization", data.company],
      ["WhatsApp", data.whatsapp || "Not provided"],
      ["Role", data.role],
      ["Industry", data.industry],
      ["Team size", data.companySize],
      ["Annual revenue", data.annualRevenue || "Not provided"],
      ["Current tools", data.tools.join(", ") || "Not provided"],
      ["Timeline", data.timeline],
      ["Requested workflow", data.challenge || "Not provided"]
    ];
    const subject = "Ranaise demo inquiry — " + data.company;
    const body = "Hello Ranaise team,\n\nI would like to request a demo.\n\n" +
      details.map(([key, value]) => key + ": " + value).join("\n") +
      "\n\nI agree to be contacted about this request.\n";
    return "mailto:founder@ranaise.site?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  document.getElementById("next-step").addEventListener("click", () => {
    if (validate(first)) showStep(2);
  });
  document.getElementById("previous-step").addEventListener("click", () => showStep(1));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();
    if (!validate(first)) {
      showStep(1);
      validate(first);
      return;
    }
    if (!validate(second)) return;

    const data = values();
    document.getElementById("email-draft").href = emailLink(data);
    if (!data.consent) {
      error.textContent = "Please agree to be contacted before requesting a demo.";
      error.hidden = false;
      return;
    }
    if (!data.turnstileToken) {
      error.textContent = "Complete the security check before sending your request.";
      error.hidden = false;
      if (!turnstileWidgetId) {
        fallbackCopy.textContent = "Secure automatic delivery is not available yet. Your details remain in the form; you can retry or open a prepared email.";
        fallback.hidden = false;
      }
      setTurnstileStatus("Complete the security check before submitting.");
      turnstileContainer.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center"
      });
      return;
    }

    submit.disabled = true;
    const original = submit.innerHTML;
    submit.textContent = "Sending request...";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 11000);
      let response;
      try {
        response = await fetch("/api/demo-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }
      if (!response.ok || result.ok !== true) {
        const failure = new Error(result.error || "We could not confirm that your request was accepted.");
        failure.status = response.status;
        throw failure;
      }

      form.hidden = true;
      document.getElementById("form-success").hidden = false;
    } catch (caught) {
      const message = String(caught?.message || "");
      const notConfigured = /not configured|not available yet/i.test(message);
      const knownRejection = [400, 403, 413, 415, 429].includes(caught?.status);

      error.textContent = notConfigured
        ? "Automatic secure email delivery is not ready yet. Your details remain in this form and were not sent."
        : knownRejection
          ? message
          : "We could not confirm that your request was accepted. Your details remain in this form; retry or use the prepared email.";
      error.hidden = false;
      fallbackCopy.textContent = notConfigured || knownRejection
        ? "Your request was not sent. You can retry after correcting the issue or open a prepared email."
        : "The result could not be confirmed. Check for a confirmation before sending the prepared email to avoid a duplicate request.";
      fallback.hidden = false;
      error.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } finally {
      submit.disabled = false;
      submit.innerHTML = original;
      if (turnstileWidgetId && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId);
        turnstileToken = "";
        setTurnstileStatus("Complete the security check before submitting.");
      }
    }
  });
})();
