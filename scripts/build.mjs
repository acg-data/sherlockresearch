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
import { SITE_DIR, DATA_DIR, readJSON, esc, scriptJSON, billions, marketSeries, pageUrl, loadCatalog } from '../src/lib.mjs';
import * as partials from '../src/partials.mjs';
import * as reportTemplate from '../src/templates/report.mjs';
import * as cityTemplate from '../src/templates/city.mjs';

const site = readJSON(path.join(DATA_DIR, 'site.json'));
const ctx = {
  ...loadCatalog(site),
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
  '404.html': { sitemap: false },
};
const REQUIRED_REGIONS = ['head', 'nav', 'footer'];

// Renderers for <!-- @name --> regions in hand-written pages.
const regions = {
  head: (page, opts) => partials.head(site, opts),
  nav: (page) => partials.nav(site, ctx, { current: page }),
  footer: () => partials.footer(site, ctx),
  plans: () => partials.plans(site, ctx, plansApi, {}),
  compare: () => partials.compareTable(),
  guarantee: () => partials.guarantee(),
  metros: () => esc(partials.metroSentence(site)),
  'metro-count': () => String(site.metros.length),
  'report-count': () => String(ctx.reports.length),
  'pipeline-count': () => String(ctx.pipeline.length),
  'category-chips': () => categoryChips(),
  'category-links': () => ctx.categories.map((c) => `<a class="cat-link" href="/reports#${c.slug}">${partials.industryIcon(c.slug, 16)}${esc(c.name)}</a>`).join(''),
  'home-pricing': () => homePricing(),
  pipeline: () => pipelineList(),
  'operator-count': () => esc(site.operatorCount),
  'rating': () => esc(site.rating),
  'response-time': () => esc(site.responseTime),
  'report-cards': () => reportCards(),
  'city-cards': () => cityCards(),
  'library-cards': () => libraryCards(),
  'blog-stat': () => blogStat(),
  'home-reviews': () => site.homeReviews.map((v) => '      ' + partials.quoteCard(v)).join('\n'),
  'finder-industries': () => partials.industryOptions(ctx),
  'finder-metros': () => '<option value="">National (all U.S.)</option>' +
    site.metros.map((m) => `<option value="${partials.slugify(m)}">${esc(m)}</option>`).join(''),
  'sample-cta': () => sampleCta(),
  'sample-badge': () => (site.samplePdf ? 'Free · 2 pages · Instant PDF download' : 'Free · 2 pages · Emailed within an hour'),
  'sample-copy': () => (site.samplePdf
    ? 'Direct download, no signup. Or skip the sample and go straight to the full Landscaping report.'
    : 'Ask for the PDF and we email it within an hour on business days. Or skip the sample and go straight to the full Landscaping report.'),
  'faq-schema': (page, opts, html) => faqSchema(html),
  'pricing-schema': () => pricingSchema(),
};

function pricingSchema() {
  const url = `${site.url}/pricing`;
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

// Reports hub: every industry report, grouped by category (the page filters them client-side).
function reportCards() {
  const standard = site.plans.find((p) => p.key === 'single');
  return ctx.categories.map((c) => {
    const items = ctx.reports.filter((r) => r.category === c.slug);
    return `      <section class="cat-group" id="${c.slug}" data-cat="${c.slug}">
        <h2 class="cat-title"><span class="cat-ic">${partials.industryIcon(c.slug, 18)}</span>${esc(c.name)} <span class="cat-count">${items.length}</span></h2>
        <div class="report-grid">
${items.map((r) => `          <a class="report-card" href="/${r.slug}-report" data-name="${esc(r.name.toLowerCase())}">
            <span class="report-icon">${partials.industryIcon(r)}</span>
            <span class="report-body">
              <span class="report-name">${esc(r.name)}</span>
              <span class="report-meta">${r.presell ? '<span class="tag tag-presell">Presell</span>' : `${site.edition} edition`} · from $${standard.price}</span>
            </span>
            <span class="report-arrow" aria-hidden="true">→</span>
          </a>`).join('\n')}
        </div>
      </section>`;
  }).join('\n');
}

function categoryChips() {
  return `<button type="button" class="chip is-active" data-filter="all" aria-pressed="true">All <span>${ctx.reports.length}</span></button>` +
    ctx.categories.map((c) => `<button type="button" class="chip" data-filter="${c.slug}" aria-pressed="false">${esc(c.name)} <span>${ctx.reports.filter((r) => r.category === c.slug).length}</span></button>`).join('');
}

// Reports in research: names only, with a request link.
function pipelineList() {
  return ctx.pipeline.map((p) => `<li>${esc(p.name)}</li>`).join('');
}

function cityCards() {
  return ctx.cities.map((c) => `      <a class="city-card" href="/${c.slug}">
        <span class="city-name">${esc(c.name)}, ${esc(c.state)}</span>
        <span class="city-meta">${esc(c.stats[0].value)} people · ${esc(c.stats[1].value)} households</span>
      </a>`).join('\n');
}

// Pull-stat for the landscaping outlook article, from the same data as the report page.
function blogStat() {
  const r = ctx.reports.find((x) => x.slug === 'landscaping');
  const m = marketSeries(r.market);
  const max = Math.max(...m.series.map((b) => b.value));
  const last = m.series[m.series.length - 1];
  return `      <aside class="pull-stat">
        <div>
          <div class="pull-stat-num">${billions(m.latestValue)}</div>
          <p class="pull-stat-cap">U.S. landscaping services market in ${m.latestYear}, projected to grow about ${r.market.cagr}% a year to ${billions(last.value)} by ${r.market.projectThrough}.<span>Source: ${esc(site.name)} ${site.edition} Landscaping Industry Report.</span></p>
        </div>
        <div class="pull-stat-bars" aria-hidden="true">${m.series.map((b) => `<i class="${b.kind}" style="height: ${Math.round((b.value / max) * 100)}%"></i>`).join('')}</div>
      </aside>`;
}

// Homepage report library: the featured reports, then other reports to show breadth.
function libraryCards() {
  const from = site.plans.find((p) => p.key === 'single').price;
  // Featured reports, then the first available report from each other category (largest first).
  const others = [...ctx.categories]
    .sort((a, b) => ctx.reports.filter((r) => r.category === b.slug).length - ctx.reports.filter((r) => r.category === a.slug).length)
    .map((c) => ctx.reports.find((r) => r.category === c.slug && !r.featured && !r.presell))
    .filter(Boolean);
  const picks = [...ctx.reports.filter((r) => r.featured), ...others].slice(0, 8);
  return picks.map((r) => `      <a class="lib-card" href="/${r.slug}-report">
        <span class="lib-icon">${partials.industryIcon(r, 22)}</span>
        <span class="lib-title">${esc(r.name)}</span>
        <span class="lib-meta">${esc(r.categoryName)}${r.presell ? ' · Presell' : ''}</span>
        <span class="lib-foot"><span>From $${from}</span><span class="arrow" aria-hidden="true">→</span></span>
      </a>`).join('\n');
}

// Homepage pricing: the three one-time plans; Quarterly is linked underneath.
function homePricing() {
  return ['single', 'city', 'all'].map((key) => {
    const p = site.plans.find((x) => x.key === key);
    const href = `/pricing?plan=${p.key}#purchase`;
    return `      <article class="price-card${p.popular ? ' is-popular' : ''}">
        <div class="price-top">
          <h3>${esc(p.name)}</h3>
          ${p.badge ? `<span class="price-badge">${esc(p.badge)}</span>` : ''}
        </div>
        <p class="price-desc">${esc(p.desc.replace('{industry}', 'industry'))}</p>
        <div class="price-amount"><span class="price-num">$${p.price.toLocaleString('en-US')}</span><span class="price-unit">${esc(p.priceSub)}</span></div>
        <a href="${href}" class="btn ${p.popular ? 'btn-primary' : 'btn-outline-dark'} btn-block">${esc(p.cta)}</a>
        <ul class="price-list">
          ${p.features.map((f) => `<li>${partials.icons.check(15)}${esc(f)}</li>`).join('\n          ')}
        </ul>
      </article>`;
  }).join('\n');
}

function sampleCta() {
  if (site.samplePdf) {
    return `<a href="/${esc(site.samplePdf)}" class="btn btn-primary btn-lg" download>Download the free sample (PDF) ↓</a>`;
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
  ].map((f) => pageUrl(f));
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build.mjs. Do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.url}${u}</loc><lastmod>${site.sitemapLastmod}</lastmod></url>`).join('\n')}
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
const unlinked = ctx.reports.filter((r) => !r.payhip).map((r) => r.slug);
if (missing.length) {
  console.warn(`build: no payment link for plan ${missing.join(', ')} (site.json checkout); those buttons open a prefilled order email.`);
}
if (unlinked.length) {
  console.warn(`build: no Payhip link for ${unlinked.join(', ')} (catalog.json); their Standard Report button opens a prefilled order email.`);
}
