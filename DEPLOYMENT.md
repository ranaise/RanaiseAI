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
6. After approved QA, inspect domain assignments on the **old** Vercel project. Move ranaise.site and www.ranaise.site to the new project while keeping the old project and repo available for rollback.
7. Confirm DNS, HTTPS/TLS, canonical redirects and any email-related records. Never replace MX/TXT records blindly.

Product descriptions must distinguish working demo flows from planned ERP/CRM/messaging connectors, enterprise access controls, and autonomous actions. This is not affiliated with NalarX.
