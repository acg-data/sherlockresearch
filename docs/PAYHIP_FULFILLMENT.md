# Payhip Fulfillment Setup

## Checkout URLs

Add Payhip product URLs to `payhipLinks` in `src/report-catalog.js`.

Example:

```js
const payhipLinks = {
  landscaping: "https://payhip.com/b/zPJah"
};
```

The generator extracts the Payhip product key from the URL and publishes it into the public catalog for checkout buttons.

## Launch Fulfillment

Payhip checkout and attached-file delivery are the launch-critical fulfillment path:

- Each active/presell product must have a live Payhip URL.
- Available products should have the report file attached in Payhip.
- Presell products must state the expected delivery timing on the Payhip product page.
- The Sherlock site should tell buyers to use their Payhip receipt for the download link.

## Optional Webhook Automation

Configure this Payhip webhook URL only when optional Sherlock automation is enabled:

```text
https://sherlockreports.com/api/payhip/webhook
```

Subscribe to:

- `paid`
- `refunded`
- `subscription.created`
- `subscription.deleted`

Payhip sends a `signature` field in the JSON payload. Their docs state it should match `sha256(API key)`, so the Worker validates the payload with the `PAYHIP_API_KEY` secret. This API key is not required for Payhip to accept payment or deliver attached files.

## Fulfillment Behavior

- `paid`: records the transaction in `FULFILLMENTS` KV and may send a Sherlock support/follow-up email.
- `refunded`: records the refund event in KV.
- subscription events: records the lifecycle event in KV.
- duplicate paid events are idempotent by Payhip transaction id.

## Pending Before Launch

- Add final Payhip URLs for every active/presell report.
- Confirm available Payhip products have the report file attached.
- Confirm Payhip redirect/success URL points to `/success`.
- Send one real test purchase and confirm:
  - Payhip receipt arrives.
  - The Payhip receipt includes the report download for available reports.
  - The Sherlock success page and support copy match the Payhip delivery flow.

## Pending Before Webhook Automation

- Set `PAYHIP_API_KEY`.
- Confirm a valid paid webhook records `payhip-transaction:<id>` in KV.
- Confirm a refund webhook records the refund event in KV.
