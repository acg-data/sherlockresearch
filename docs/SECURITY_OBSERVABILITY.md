# Security And Observability

## Implemented In Worker

- Security headers on asset and API responses.
- HTML cache revalidation to avoid stale launch pages.
- Private preview Basic Auth controlled by `PREVIEW_PASSWORD`.
- Payhip webhook bypasses preview auth but validates the Payhip signature.
- Rate limits for checkout resolution, lead capture, and resend requests when `FULFILLMENTS` KV is available.
- Optional Turnstile verification for lead/resend endpoints. When production Turnstile is enabled, set both `TURNSTILE_SECRET_KEY` in Cloudflare and the public `SITE.turnstileSiteKey` value in `src/report-catalog.js`.
- Same-origin API posture: JSON responses do not use wildcard CORS, and API preflight allows only the production origin and local development origins.
- Email send idempotency records in KV to reduce duplicate support/follow-up emails during webhook retries.
- Structured error logging.

## Cloudflare Controls To Confirm

- Observability enabled for the Worker.
- Alerts on Worker error spikes.
- WAF/Bot rules do not block Payhip webhook POSTs.
- Access/preview rules do not protect the public production site.
- `FULFILLMENTS` KV namespace exists and is bound in production.
- Public forms are protected by Turnstile, or launch has explicitly accepted `ALLOW_FORMS_WITHOUT_TURNSTILE=1`.

## Manual Smoke Tests

- `GET /api/health` returns `{ ok: true }`.
- `POST /api/checkout` with a live Payhip-linked report returns the Payhip URL.
- `POST /api/checkout` with a missing Payhip-linked report returns a contact URL.
- Invalid Payhip webhook signature returns `400`.
- Valid Payhip paid webhook records KV when optional automation is enabled.
- Lead form posts through `/api/lead`, passes Turnstile, and sends confirmation email.
- Unknown industry values in lead forms return `422` instead of being mis-routed.
