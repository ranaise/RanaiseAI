# Deployment and rollback

Repository: https://github.com/ranaise/RanaiseAI
New Vercel project: ranaise-ai-beta
Target custom domain (after QA): ranaise.site
Old portfolio Vercel project: ranaise — preserve it.

1. Create a completely **new** Vercel project by importing ranaise/RanaiseAI.
2. Use framework Other, root ./, no custom build or output directory.
3. Test deployment on the assigned *.vercel.app URL before changing domains.
4. Verify UI on desktop/mobile, CSV uploads, Sales/Finance/Operations guided analysis, approvals, and API-disabled state.
5. Optional Claude beta requires secure server environment variables ANTHROPIC_API_KEY and BETA_ACCESS_CODE (12+ characters). Do not enable without rate limiting and cost controls.
6. For automatic Book a Demo email, configure the new project's Production environment with `RESEND_API_KEY` (secret), `DEMO_SENDER_EMAIL` (`forms@notify.ranaise.site` after verification), and `DEMO_NOTIFICATION_EMAIL` (`founder@ranaise.site`). Verify the sending subdomain in Resend and add only its requested DNS records; leave all existing Zoho MX, SPF, DKIM, DMARC, and verification records intact.
7. Create a Cloudflare Turnstile widget limited to `ranaise.site`, `www.ranaise.site`, and `ranaise-ai-beta.vercel.app`. Set `TURNSTILE_SITE_KEY` (public), `TURNSTILE_SECRET_KEY` (secret), and `TURNSTILE_ALLOWED_HOSTS` to those exact hostnames. The API checks every token with Cloudflare Siteverify before calling Resend. Do not remove that server-side check.
8. After successful form and site QA, inspect domain assignments on the **old** Vercel project. Move ranaise.site and www.ranaise.site to the new project while keeping the old project and repo available for rollback.
9. Confirm DNS, HTTPS/TLS, canonical redirects and any email-related records. Never replace MX/TXT records blindly.

## Existing portfolio rollback snapshot (2026-10-08)

- Vercel project: `ranaise` (`prj_RaSrI9dYG1y9xFZGAZKIHX1POjtD`), still linked to `ranaise/web-portofolio`.
- Latest verified production deployment: https://ranaise-c7e9ctpgv-ranaises-projects.vercel.app (`READY`, commit `ebe09837657ac04eacd219aef595865693c99b97`).
- Current domain assignment: `ranaise.site` redirects to `www.ranaise.site` with HTTP 308; `www.ranaise.site` serves the portfolio.
- Vercel SSO protects the portfolio's `vercel.app` URLs. The custom domain is the public rollback route.
- No domain or DNS changes have been made. Keep the old project, repository, deployment history, and DNS records intact.

### Rollback after an approved cutover

In the Vercel workspace `ranaises-projects`, open the new `ranaise-ai-beta` project's **Settings → Domains** and remove `ranaise.site` and `www.ranaise.site`. Then open the existing `ranaise` portfolio project's **Settings → Domains** and assign both domains back to it, preserving the apex-to-`www` 308 redirect. Confirm the public portfolio loads at `https://www.ranaise.site` and that `https://ranaise.site` redirects to it. Domain reassignment is sufficient; do not change nameservers or mail-related DNS records.

Product descriptions must distinguish working demo flows from planned ERP/CRM/messaging connectors, enterprise access controls, and autonomous actions. This is not affiliated with NalarX.
