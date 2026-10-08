# Ranaise AI — Business Intelligence Agent Beta

An independently implemented early-stage **AI intelligence workspace for business teams**, inspired by the broad business category of enterprise intelligence platforms. Not affiliated with NalarX.

## Product direction

Bring business context into one workspace, ask role-specific questions, get evidence-backed answers, prepare work for human review, and eventually connect enterprise tools with authorization.

**Available today:** responsive landing page, browser-based CSV and sample data analysis, guided Sales/Finance/Operations flows, local approval drafts. Claude analysis is optional and disabled unless explicitly configured.

**Not yet available:** ERP/CRM/messaging integrations, multi-tenant accounts, RBAC, SSO, autonomous execution, persistent storage, enterprise-grade protections. Do not claim these exist in a startup application.

## Development

Node.js 20+. Run `npm start` for local preview, `npm test` and `npm run check` for tests.

## Deployment

Import `ranaise/RanaiseAI` into a **new** Vercel project. Use framework Other and root directory `./`; no custom build command. Verify the preview before moving `ranaise.site` or `www.ranaise.site`. Preserve the previous portfolio repo and Vercel project for rollback. Do not change DNS mail records.

## CSV

Header `channel,revenue,cost,orders` (optional `date`; Indonesian aliases supported). Limit 1,000 rows / 2 MB. CSV parsed locally in browser. Optional Claude endpoint transfers a summary and question, not original CSV.

## Design

Ivory, charcoal, indigo and lavender. No green. Original design and copy. Independent product, not affiliated with NalarX.
