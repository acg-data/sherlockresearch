# Report Update Guide

Sherlock is a static site. Keep checkout provider API keys out of this repo and
out of frontend JavaScript. Buyers only need public checkout URLs.

Stripe can stay as the first checkout provider. Use Stripe Payment Links in the
`checkoutUrl` fields until Payhip or SendOwl becomes useful for bulk PDF
operations.

## Report Segmentation

Each PDF product should map to this structure in `shared/catalog.js`:

```js
{
  key: "landscaping-2026-q2-full-city",
  plan: "city",
  industry: "Landscaping",
  quarter: "Q2",
  year: 2026,
  access: "full",
  cityInclusion: "city-specific",
  title: "Landscaping Industry Report, Q2 2026, Full City-Specific PDF",
  checkoutUrl: "https://buy.stripe.com/example"
}
```

Allowed values:

- `plan`: `sample`, `single`, `city`, or `quarterly`
- `access`: `redacted` or `full`
- `cityInclusion`: `national`, `city-specific`, or `none`

## Adding Or Swapping A PDF

1. Upload the PDF as a digital product in Stripe, Payhip, SendOwl, or your active checkout provider.
2. Copy the public product, payment, or instant-buy URL.
3. Open `shared/catalog.js`.
4. Add a new product object or replace the `checkoutUrl` on the current product.
5. Keep the `key` descriptive: `industry-year-quarter-access-city`.
6. Load the relevant report page and verify each CTA goes to the expected checkout.

The checkout script always chooses the newest matching product for the selected
plan by `year` and `quarter`, so adding `Q3 2026` can replace `Q2 2026` without
rewiring page buttons.

## Provider Notes

Stripe is fine to start if products are created manually and each report only
needs a public Payment Link. Keep using those links until the operational
workflow needs bulk creation, automated file assignment, or a larger PDF catalog.

Payhip's public API currently supports coupons and license keys, not uploading
or creating digital-product PDFs. Product creation still happens inside Payhip.

SendOwl is a better fit if the report library needs bulk or API-driven product
creation. It supports digital-file products, SFTP uploads, and product create
endpoints. The site still stores only public checkout URLs.
