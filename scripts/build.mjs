#!/usr/bin/env node
// Builds the static site in sherlock-research/.
//
//   Generated pages   <industry>-report.html and <city>.html, from src/templates + src/data.
//   Hand-written pages every other .html. The build only rewrites the regions between
//                     <!-- @name --> and <!-- /@name --> markers (shared head, nav, footer, …).
//   sitemap.xml       from the page list below.
//
// Output is committed, so hosting stays plain static files. Running the build twice
// produces no further changes.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { SITE_DIR, DATA_DIR, readJSON, esc, scriptJSON } from '../src/lib.mjs';
import * as partials from '../src/partials.mjs';
import * as reportTemplate from '../src/templates/report.mjs';
import * as cityTemplate from '../src/templates/city.mjs';

const site = readJSON(path.join(DATA_DIR, 'site.json'));
const ctx = {
  reports: site.industries.map((slug) => readJSON(path.join(DATA_DIR, 'reports', `${slug}.json`))),
  cities: site.cities.map((slug) => readJSON(path.join(DATA_DIR, 'cities', `${slug}.json`))),
};

// Run the browser checkout code in a sandbox so static hrefs match what the page computes.
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(SITE_DIR, 'assets', 'plans.js'), 'utf8'), sandbox);
const plansApi = sandbox.SherlockPlans;

// Hand-written pages and the shared assets each one needs. Order = sitemap order.
const PAGES = {
  'index.html': {},
  'reports.html': {},
  'pricing.html': { css: ['plans.css'], js: ['plans.js'] },
  'sample.html': {},
  'about.html': {},
  'faq.html': {},
  'contact.html': {},
  'blog-article.html': {},
  'privacy-policy.html': {},
  'terms-of-service.html': {},
  '404.html': { base: '/', sitemap: false },
};
const REQUIRED_REGIONS = ['head', 'nav', 'footer'];

// Renderers for <!-- @name --> regions in hand-written pages.
const regions = {
  head: (page, opts) => partials.head(site, opts),
  nav: (page, opts) => partials.nav(site, ctx, { current: page, base: opts.base || '' }),
  footer: (page, opts) => partials.footer(site, ctx, { base: opts.base || '' }),
  plans: () => partials.plans(site, ctx, plansApi, {}),
  compare: () => partials.compareTable(),
  guarantee: () => partials.guarantee(),
  metros: () => esc(partials.metroSentence(site)),
  'metro-count': () => String(site.metros.length),
  'operator-count': () => esc(site.operatorCount),
  'response-time': () => esc(site.responseTime),
  'report-cards': () => reportCards(),
  'city-cards': () => cityCards(),
  'library-cards': () => libraryCards(),
  'sample-cta': () => sampleCta(),
  'sample-badge': () => (site.samplePdf ? 'Free · 2 pages · Instant PDF download' : 'Free · 2 pages · Emailed within an hour'),
  'sample-copy': () => (site.samplePdf
    ? 'Direct download, no signup. Or skip the sample and go straight to the full Landscaping report.'
    : 'Ask for the PDF and we email it within an hour on business days. Or skip the sample and go straight to the full Landscaping report.'),
  'faq-schema': (page, opts, html) => faqSchema(html),
  'pricing-schema': () => pricingSchema(),
};

function pricingSchema() {
  const url = `${site.url}/pricing.html`;
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${site.name} Industry Reports`,
    description: `Market intelligence reports for service-business operators in ${ctx.reports.map((r) => r.nameLower).join(', ').replace(/, ([^,]*)$/, ', and $1')}.`,
    brand: { '@type': 'Brand', name: site.name },
    image: `${site.url}/og-default.png`,
    url,
    offers: site.plans.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: String(p.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
      description: p.desc.replace('{industry}', 'industry'),
      ...(p.unit === '/yr' && {
        priceSpecification: {
          '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'USD',
          billingDuration: 'P1Y', unitCode: 'ANN',
        },
      }),
    })),
  };
  return `<script type="application/ld+json">\n${scriptJSON(product)}\n</script>`;
}

// Reports hub: one card per industry report, then one per city page.
function reportCards() {
  const city = site.plans.find((p) => p.key === 'city');
  const standard = site.plans.find((p) => p.key === 'single');
  return ctx.reports.map((r, i) => `      <a class="report-card" href="${r.slug}-report.html">
        <span class="report-icon">${partials.industryIcon(r.slug)}</span>
        <h3>${esc(r.name)}${i === 0 ? ' <span class="report-badge">Free sample</span>' : ''}</h3>
        <p>${esc(r.summary)}</p>
        <span class="report-meta">From $${standard.price} national · $${city.price} with your metro</span>
        <span class="report-link">View report →</span>
      </a>`).join('\n');
}

function cityCards() {
  return ctx.cities.map((c) => `      <a class="city-card" href="${c.slug}.html">
        <span class="city-name">${esc(c.name)}, ${esc(c.state)}</span>
        <span class="city-meta">${esc(c.stats[0].value)} people · ${esc(c.stats[2].value)} home-service businesses</span>
      </a>`).join('\n');
}

// Homepage report library: live reports first (the sampled one featured), then hand-written "coming soon" cards.
function libraryCards() {
  return ctx.reports.map((r, i) => `      <a class="lib-card${i === 0 ? ' featured' : ''}" href="${r.slug}-report.html">
        <span class="lib-icon">${partials.industryIcon(r.slug, 28)}</span>
        <div class="lib-title">${esc(r.name)}</div>
        <div class="lib-meta">${i === 0 ? 'Free sample available' : 'Market report'}</div>
      </a>`).join('\n');
}

function sampleCta() {
  if (site.samplePdf) {
    return `<a href="${esc(site.samplePdf)}" class="btn btn-primary btn-lg" download>Download the sample PDF ↓</a>`;
  }
  const subject = encodeURIComponent('Free sample: Landscaping Industry Report');
  const body = encodeURIComponent('Hi Sherlock team,\n\nPlease email me the free 2-page sample.\n\nName:\nBusiness:\n');
  return `<a href="mailto:${site.email}?subject=${subject}&amp;body=${body}" class="btn btn-primary btn-lg">Email me the free sample →</a>`;
}

// FAQPage JSON-LD built from the page's own visible <details> blocks, so they can't drift.
function faqSchema(html) {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
  const items = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } }));
  if (!items.length) throw new Error('faq-schema region: no <details> FAQ items found on the page');
  return `<script type="application/ld+json">\n${scriptJSON({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items })}\n</script>`;
}

function applyRegions(page, html, opts) {
  const seen = new Set();
  const out = html.replace(/<!-- @([\w-]+) -->[\s\S]*?<!-- \/@\1 -->/g, (match, name) => {
    const render = regions[name];
    if (!render) throw new Error(`${page}: unknown region "@${name}"`);
    seen.add(name);
    // Inline regions (no newline in the original) stay inline.
    const inline = !match.includes('\n');
    const body = render(page, opts, html);
    return inline ? `<!-- @${name} -->${body}<!-- /@${name} -->` : `<!-- @${name} -->\n${body}\n<!-- /@${name} -->`;
  });
  for (const name of REQUIRED_REGIONS) {
    if (!seen.has(name)) throw new Error(`${page}: missing required region <!-- @${name} -->`);
  }
  return out;
}

function sitemap() {
  const urls = [
    ...Object.entries(PAGES).filter(([, o]) => o.sitemap !== false).map(([f]) => f),
    ...ctx.reports.map((r) => `${r.slug}-report.html`),
    ...ctx.cities.map((c) => `${c.slug}.html`),
  ].map((f) => (f === 'index.html' ? '' : f));
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build.mjs. Do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.url}/${u}</loc><lastmod>${site.sitemapLastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

// ---------------------------------------------------------------------------
const outputs = new Map();
for (const r of ctx.reports) outputs.set(`${r.slug}-report.html`, reportTemplate.render(r, site, ctx, plansApi));
for (const c of ctx.cities) outputs.set(`${c.slug}.html`, cityTemplate.render(c, site, ctx));
for (const [page, opts] of Object.entries(PAGES)) {
  const html = fs.readFileSync(path.join(SITE_DIR, page), 'utf8');
  outputs.set(page, applyRegions(page, html, opts));
}
outputs.set('sitemap.xml', sitemap());

let changed = 0;
for (const [file, content] of outputs) {
  const target = path.join(SITE_DIR, file);
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (before === content) continue;
  fs.writeFileSync(target, content);
  changed++;
  console.log(`  wrote ${file}`);
}
console.log(`build: ${outputs.size} files, ${changed} changed`);

const missing = Object.entries(site.checkout).filter(([, url]) => !url).map(([k]) => k);
if (missing.length) {
  console.warn(`build: no payment link for ${missing.join(', ')}; those buttons open a prefilled order email (set checkout.* in src/data/site.json).`);
}
