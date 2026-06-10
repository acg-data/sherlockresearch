# Email And DNS Checklist

## Email

Required addresses:

- `hello@sherlockreports.com`
- `support@sherlockreports.com`

Cloudflare config:

- `wrangler.jsonc` has a `send_email` binding named `EMAIL`.
- Sender addresses are restricted to `hello@sherlockreports.com` and `support@sherlockreports.com`.
- Production must have the domain onboarded and authenticated for sending.

DNS/authentication records to verify in Cloudflare:

- SPF for authorized sender infrastructure.
- DKIM records for the sending provider.
- DMARC record with a monitored reporting address.

## DNS

Before launch:

- Apex `sherlockreports.com` should resolve publicly and return the site, not `401`.
- `www.sherlockreports.com` should either resolve and redirect to apex or intentionally remain unused.
- Any private preview protection should be removed from production traffic.

## Forms

- Lead and priority-request forms post to `/api/lead`; `/api/waitlist` remains a compatibility alias.
- Turnstile is required for production form protection unless launch explicitly accepts `ALLOW_FORMS_WITHOUT_TURNSTILE=1`.
- Once Turnstile is enabled, add the frontend token field and test one successful form submission from an authorized hostname.
