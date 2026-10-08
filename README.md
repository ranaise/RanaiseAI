# Ranaise AI

Early-stage enterprise intelligence software. Independent from NalarX and any other reference product.

## Public pages
- `/`: original Ranaise enterprise landing page.
- `/request-demo.html`: two-step early-access and demo inquiry form.
- `/privacy.html`: privacy notice for the current beta.
- `/workspace.html`: public **technical prototype** retaining guided Sales, Finance, and Operations calculations on sample/CSV data with local approval drafts.

No real CRM/ERP integrations, autonomous execution, enterprise login, or governed agent orchestration are offered yet. The Claude API endpoint remains disabled unless server-side credentials are added.

## Getting started

Node.js 20+:

```sh
npm test
npm run check
npm start
```

For deployment, import the repository into Vercel using framework `Other`, root `./`. The GitHub-connected Vercel project can redeploy automatically on main branch updates.

## Form delivery

The two-stage form validates visitor input. The serverless handler at `api/demo-request.js` can email demo inquiries to the founder **only after** the following Vercel environment variables are configured:

- `RESEND_API_KEY`: Resend email API key.
- `DEMO_SENDER_EMAIL`: a verified sending address or domain in Resend.
- `DEMO_NOTIFICATION_EMAIL`: the recipient mailbox, e.g. `founder@ranaise.site` (default).

Until delivery is configured, the website **does not claim a submission was received**. It offers a prefilled `mailto:` draft for visitors to send directly.

Before enabling automatic sending broadly, add production-grade durable rate limits, an automated-abuse challenge (e.g. Turnstile), logging/privacy review, and email deliverability tests. A limited in-memory per-instance throttle is present but insufficient as the sole protection in production.

**DNS warning:** The business email mailbox uses Zoho. Configuring a new outbound sender must be planned carefully to avoid breaking existing Zoho MX, SPF, and DKIM records. Never replace mail DNS records blindly.

## Brand and IP

Uses the existing Ranaise favicon paired with the **full Ranaise wordmark**. No standalone `r.` text branding. Dark charcoal, muted ivory, indigo and lavender; no green or emoji. Copy and layout are original.

## Domain safety

Preserve the previous portfolio project and repository. Change `ranaise.site` only after a QA-approved cutover. Read `DEPLOYMENT.md` for rollback notes.
