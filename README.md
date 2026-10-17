# Sherlock Research website

Marketing site for Sherlock Research at https://sherlockreports.com. The pages in `sherlock-research/` are static files; a small Cloudflare Worker (`src/worker.js`) serves them and adds a preview password gate, security headers and the Payhip webhook.

## Layout

```
sherlock-research/        site root (HTML, assets, sitemap, robots.txt)
  assets/site.css|js      shared tokens, base styles, nav, footer, FAQ accordions
  assets/plans.css|js     plan picker + checkout (pricing page and report pages)
  assets/report.css|js    industry report pages
  assets/city.css         city pages
src/data/catalog.json     the 50 published industry reports (category, status, Payhip link) + the research pipeline
src/data/site.json        prices, plans, checkout links, metro list, operator count, dates
src/data/reports/*.json   extra page content for the featured reports (lead, insights, market figures, reviews)
src/data/cities/*.json    per-city content
src/templates/*.mjs       report, city and sample-PDF templates
src/partials.mjs          shared head, nav, footer, plan picker, comparison table
src/worker.js             Cloudflare Worker (reads the same data files)
wrangler.jsonc            Worker config: assets directory, KV and email bindings
scripts/build.mjs         builds the site
scripts/check.mjs         link, anchor, JSON-LD, heading, metadata and copy checks
scripts/serve.mjs         local preview with production-style clean URLs
```

## Editing

- **Report and city pages** (`*-report.html`, `*-tx.html`) are generated. Edit the JSON in `src/data/` or the templates, never the HTML.
- **Every other page** is hand-written. Edit it directly, except between `<!-- @name -->` and `<!-- /@name -->` markers: the build fills those regions (shared head, nav, footer, plan picker, report lists, counts, and so on).
- **Adding a report:** add an entry to `src/data/catalog.json` and run the build. It gets a page, a sitemap entry, a card on the reports page and an option in every industry picker.
- **Prices, plans, metros, the operator count and the data date** live only in `src/data/site.json`.
- **Links** are root-relative and extensionless (`/pricing`, `/landscaping-report`), matching how Cloudflare serves the pages. `npm run check` rejects `.html` links.
- **Market charts** on the featured report pages are computed from each report's `market.actual` figures and `market.cagr`. The current figures are placeholder estimates; replace them with sourced numbers.

## Checkout

- **Standard Report:** each industry's Payhip product link is `payhip` in `src/data/catalog.json`. With `payhipDirectCheckout` on (site.json), buttons go straight to Payhip's checkout (`payhip.com/buy?link=KEY`) instead of the product page.
- **All-Access, City-Specific, Quarterly:** set `checkout.all`, `checkout.city` and `checkout.quarterly` in `src/data/site.json`. Stripe Payment Links also work; they receive `client_reference_id=<plan>__<industry>__<metro>`.
- While a link is empty, its button opens a prefilled order email instead, and the build prints a warning.
- **Presell** reports (`"status": "presell"`) say "Reserve" instead of "Get" and promise delivery on release, not an instant download.

Optional settings in `site.json`:

- `samplePdf`: the free sample PDF offered on the sample page (empty switches the page to "email me the sample").
- `flipbookEmbed`: HTML for an interactive flipbook; adds a Look Inside section to the report pages.
- `cloudflareAnalyticsToken`: adds the Cloudflare Web Analytics beacon to every page.

## Deploying

The Worker named `sherlockresearch` serves sherlockreports.com. `npx wrangler deploy` uploads `sherlock-research/` and `src/worker.js` together; Cloudflare Workers Builds can run it on every push to `master`.

Secrets live in Cloudflare (Workers → sherlockresearch → Settings → Variables and secrets), never in this repo:

- `PREVIEW_PASSWORD`: while set, every page asks for a password. **Delete it to make the site public.**
- `PAYHIP_API_KEY`: verifies Payhip webhooks sent to `/api/payhip/webhook`.
- `TURNSTILE_SECRET_KEY` (optional): bot check on the lead and resend APIs.

## Free sample PDF

`assets/sherlock-landscaping-sample.pdf` and its preview images (`assets/sample-page-*.jpg`) are rendered from `src/templates/sample-pdf.mjs` using the Landscaping data. Re-run `npm run sample-pdf` (needs Playwright) after changing that data or template.

## Commands

```
npm run build           # regenerate pages and fill shared regions (safe to run repeatedly)
npm run check           # static checks; exits non-zero on problems
npm run check:browser   # also loads every page in Chromium at 375px and 1440px (needs Playwright)
npm run sample-pdf      # re-render the free sample PDF and its previews (needs Playwright)
npm run serve           # preview at http://localhost:8080 (static files only)
npm run dev             # preview through the Worker with wrangler (downloads wrangler)
npm run deploy          # deploy the Worker and site to Cloudflare
```

Run `npm run build && npm run check` before committing. No npm install is needed for the build, the checks or `serve`.
