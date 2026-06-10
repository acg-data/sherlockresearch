# Sherlock Launch Runbook

## Source Of Truth

- Launch branch: `codex/sherlock-launch-readiness`
- Production candidate should be built from this branch, not the static-only `master` branch.
- Main verification command: `npm run check`
- Dry-run deployment command: `npm run deploy:dry-run`

## Pre-Launch Gates

1. `npm ci`
2. `npm run check`
3. `npm run deploy:dry-run`
4. Confirm `https://sherlockreports.com` is not behind the preview password.
5. Confirm `www.sherlockreports.com` either redirects to the apex or has an intentional DNS record.
6. Confirm Cloudflare secrets exist:
   - `TURNSTILE_SECRET_KEY` when public forms are protected by Turnstile
   - no `PREVIEW_PASSWORD` on public production traffic
7. Confirm public form abuse posture:
   - Preferred: set `SITE.turnstileSiteKey` in `src/report-catalog.js`, set `TURNSTILE_SECRET_KEY`, rebuild, and test the contact form.
   - Temporary launch exception: set `ALLOW_FORMS_WITHOUT_TURNSTILE=1` only if manual monitoring is planned.
8. Confirm the Cloudflare Email sender domain is verified.
9. Confirm Payhip checkout/delivery:
   - active and presell reports have live Payhip URLs.
   - Payhip products have the report files attached or clear presell delivery language.
   - Payhip redirects/success flow points buyers back to `/success`.
10. Confirm active reports have Payhip checkout URLs and full PDF assets in `src/report-catalog.js`.
11. Confirm presell reports have an intentional checkout/delivery plan before public promotion.

## Optional Post-Launch Automation

- `PAYHIP_API_KEY` is only required for the optional `/api/payhip/webhook` automation path.
- The webhook records transactions/refunds in KV and can send Sherlock support emails, but Payhip checkout and attached-file delivery work without it.
- If webhook automation is enabled, configure `https://sherlockreports.com/api/payhip/webhook` in Payhip and test one paid/refund event.

## Rollback

1. In Cloudflare, open the Worker deployment history for `sherlockresearch`.
2. Roll back to the last known-good deployment.
3. If the issue is a bad catalog/page build, revert the branch commit and redeploy.
4. If the issue is Payhip delivery, pause the affected Payhip product or route buyers to support from Payhip.

## Owner Review Points

- Payhip URLs and product keys
- Report PDF availability
- Email sender/domain authentication
- Public DNS and preview gate
- Refund and support policy wording
