# Sherlock Research website

Static marketing site for Sherlock Research. Everything in `sherlock-research/` is deployed as plain files; there is no server code.

## Layout

```
sherlock-research/        deploy root (HTML, assets, sitemap, robots.txt)
  assets/site.css|js      shared tokens, base styles, nav, footer, FAQ accordions
  assets/plans.css|js     plan picker + checkout (pricing page and report pages)
  assets/report.css|js    industry report pages
  assets/city.css         city pages
src/data/site.json        prices, plans, payment links, metro list, operator count, dates
src/data/reports/*.json   per-industry report content and market figures
src/data/cities/*.json    per-city content
src/templates/*.mjs       report, city and sample-PDF templates
src/partials.mjs          shared head, nav, footer, plan picker, comparison table
scripts/build.mjs         builds the site
scripts/check.mjs         link, anchor, JSON-LD, heading, metadata and copy checks
```

## Editing

- **Report and city pages** (`*-report.html`, `*-tx.html`) are generated. Edit the JSON in `src/data/` or the templates, never the HTML.
- **Every other page** is hand-written. Edit it directly, except between `<!-- @name -->` and `<!-- /@name -->` markers: the build fills those regions (shared head, nav, footer, plan picker, metro list, and so on).
- **Prices, plans, metros, the operator count and the data date** live only in `src/data/site.json`.
- **Market charts** are computed from each report's `market.actual` figures and `market.cagr`, so the projections always match the stated growth rate. The current figures are placeholder estimates; replace them with sourced numbers.

## Checkout

Set `checkout.single`, `checkout.city`, `checkout.quarterly` and `checkout.all` in `src/data/site.json` to hosted payment links (Stripe Payment Links or Payhip). Buy buttons append `client_reference_id=<plan>__<industry>__<metro>`. While a link is empty, its button opens a prefilled order email instead, and the build prints a warning.

Optional settings in `site.json`:

- `samplePdf`: the free sample PDF offered on the sample page (empty switches the page to "email me the sample").
- `flipbookEmbed`: HTML for an interactive flipbook; adds a Look Inside section to the report pages.
- `cloudflareAnalyticsToken`: adds the Cloudflare Web Analytics beacon to every page. Leave empty if Cloudflare Pages injects it for you.

## Free sample PDF

`assets/sherlock-landscaping-sample.pdf` and its preview images (`assets/sample-page-*.jpg`) are rendered from `src/templates/sample-pdf.mjs` using the Landscaping data. Re-run `npm run sample-pdf` (needs Playwright) after changing that data or template.

## Commands

```
npm run build           # regenerate pages and fill shared regions (safe to run repeatedly)
npm run check           # static checks; exits non-zero on problems
npm run check:browser   # also loads every page in Chromium at 375px and 1440px (needs Playwright)
npm run sample-pdf      # re-render the free sample PDF and its previews (needs Playwright)
npm run serve           # preview at http://localhost:8080
```

Run `npm run build && npm run check` before committing. No npm install is needed for the build or the static checks.
