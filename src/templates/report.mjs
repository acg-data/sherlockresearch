// Industry report page: sherlock-research/<slug>-report.html
// Content comes from src/data/reports/<slug>.json; plans, prices and metros from site.json.
import { esc, scriptJSON, billions, marketSeries, icons } from '../lib.mjs';
import * as partials from '../partials.mjs';

const svg = (inner, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const ICON = {
  chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/>',
  pin: '<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
  people: '<circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>',
  pulse: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  pie: '<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/>',
  team: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/>',
  bars: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
};

const SHARE_COLORS = ['var(--sage)', 'var(--navy)', 'var(--stone-deep)', 'var(--orange-3)'];
const SHARE_LABELS = ['Small (1–9 employees)', 'Mid (10–49 employees)', 'Large (50–249)', 'Enterprise (250+)'];
const FACTORS = ['Quality of work', 'Customer service', 'Reputation & reviews', 'Pricing', 'Reliability & timeliness'];

const TOC = [
  ['Market Size & Forecast', 'National market through {through}, with segment splits.'],
  ['Demand Drivers', "What's fueling growth: residential, commercial, and seasonal demand."],
  ['Buyer Behavior', 'Switching intent, price tolerance, and what wins the job.'],
  ['Competitive Landscape', 'Market share by size, key players, and positioning gaps.'],
  ['Pricing Benchmarks', 'Service-line pricing spreads and premium-tolerance index.'],
  ['Local Market Cuts', 'Metro-level demand, competition, and pricing for your market.'],
  ['Growth Opportunities', 'Highest-odds service lines, segments, and geographies to pursue.'],
  ['Executive Playbook', 'Specific next moves on pricing, channel, and positioning.'],
];

const WHO = [
  ['user', 'Solo & owner-operators', 'Validate a pricing change or new service line before you commit time and money.'],
  ['team', 'Multi-crew businesses', 'Benchmark margins and plan expansion into new metros with local data.'],
  ['grid', 'Franchises & agencies', 'Equip locations and clients with consistent, defensible market intelligence.'],
  ['bars', 'Investors & buyers', 'Diligence a service-business acquisition with fast, credible market data.'],
];

export function render(r, site, ctx, plansApi) {
  const url = `${site.url}/${r.slug}-report.html`;
  const title = `${r.name} Industry Report`;
  const m = marketSeries(r.market);
  const max = Math.max(...m.series.map((b) => b.value));
  const period = `${m.latestYear}–${r.market.projectThrough}`;
  const metroCount = site.metros.length;
  const start = partials.initialCheckout(site, ctx, plansApi, r.slug);
  const city = site.plans.find((p) => p.key === 'city');
  const standard = site.plans.find((p) => p.key === 'single');

  // Donut: conic-gradient stops from the market-share split.
  let acc = 0;
  const stops = r.marketShare.map((pct, i) => {
    const from = acc; acc += pct;
    return `${SHARE_COLORS[i]} ${from}% ${acc}%`;
  }).join(', ');

  const stats = [
    { icon: ICON.dollar, value: billions(m.latestValue), label: `U.S. market size, ${m.latestYear}` },
    { icon: ICON.people, value: r.stats[0].value, label: r.stats[0].label },
    { icon: ICON.pie, value: r.stats[1].value, label: r.stats[1].label },
    { icon: ICON.pin, value: String(metroCount), label: 'Metros with local data cuts' },
  ];

  const faqs = [
    ["What's the difference between the four options?",
      `Standard ($${standard.price}) is the full national report. City-Specific ($${city.price}) adds a local data cut for the metro you choose. Quarterly + Coaching ($2,000/yr) keeps one industry current all year with four updates and four 1:1 calls. All-Access ($2,997, one-time) unlocks every industry report we publish — best if you operate or invest across multiple verticals. For comparison, a single IBISWorld seat runs around $8,000 per year.`],
    ['Which metros are available for the City-Specific report?', partials.metroSentence(site)],
    ['Can I upgrade later?',
      'Yes. Any one-time purchase credits toward an upgrade within 30 days. Most buyers start with a single report, then move to Quarterly once they see the value of ongoing data and coaching.'],
    ['How current is the data?',
      `The ${site.edition} edition reflects the latest available data, refreshed in ${site.dataUpdated}. Quarterly subscribers receive an updated edition every quarter, plus a coaching call to apply it.`],
    ['Is this a download or a subscription?',
      'Standard, City-Specific, and All-Access are instant PDF downloads, yours to keep and use within your business. Quarterly + Coaching is an annual subscription that includes the downloads plus updates and calls.'],
  ];

  const productLD = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${title} — ${site.name}`,
    description: `The ${site.edition} ${r.name} Industry Report: market size, growth forecasts, competitive landscape, and local benchmarks for U.S. ${r.nameLower} operators. 42 pages, instant PDF.`,
    brand: { '@type': 'Brand', name: site.name },
    image: `${site.url}/og-default.png`,
    url,
    offers: site.plans.filter((p) => !p.unit && !p.allIndustries).map((p) => ({
      '@type': 'Offer', name: p.name, price: String(p.price), priceCurrency: 'USD',
      availability: 'https://schema.org/InStock', url,
    })),
  };
  const breadcrumbLD = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
      { '@type': 'ListItem', position: 2, name: 'Reports', item: `${site.url}/reports.html` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };

  return `<!DOCTYPE html>
<!-- Generated by scripts/build.mjs from src/templates/report.mjs and src/data/reports/${r.slug}.json. Do not edit by hand. -->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)} — ${esc(site.name)}</title>
<meta name="description" content="${esc(r.metaDescription)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)} — ${esc(site.name)}">
<meta property="og:description" content="${esc(r.ogDescription)}">
<meta property="og:url" content="${url}">
${partials.head(site, { css: ['plans.css', 'report.css'], js: ['plans.js', 'report.js'] })}
<script type="application/ld+json">
${scriptJSON(productLD)}
</script>
<script type="application/ld+json">
${scriptJSON(breadcrumbLD)}
</script>
</head>
<body style="--cover-a: ${r.coverGradient[0]}; --cover-b: ${r.coverGradient[1]};">

${partials.nav(site, ctx, { current: `${r.slug}-report.html` })}

<main id="main">
<header class="hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li><a href="reports.html">Reports</a></li>
        <li><span aria-current="page">${esc(title)}</span></li>
      </ol>
    </nav>
    <div class="hero-grid">
      <div>
        <h1>${esc(title)}</h1>
        <div class="hero-edition">${site.edition} EDITION</div>
        <p class="hero-desc">${esc(r.heroDescription)}</p>
        <ul class="hero-features">
          <li><span class="hero-feature-icon">${svg(ICON.chart)}</span>Market size &amp; growth</li>
          <li><span class="hero-feature-icon">${svg(ICON.pin)}</span>Local market insights</li>
          <li><span class="hero-feature-icon">${svg(ICON.people)}</span>Competitive landscape</li>
          <li><span class="hero-feature-icon">${svg(ICON.pulse)}</span>Trends &amp; opportunities</li>
        </ul>
        <div class="hero-cta-row">
          <a href="#purchase" class="btn btn-primary btn-lg">Get the full report</a>
          <a href="sample.html" class="btn btn-outline btn-lg">See a free sample →</a>
        </div>
        <ul class="hero-meta">
          <li>${svg(ICON.download, 14)} Instant PDF download</li>
          <li>${svg(ICON.clock, 14)} Data updated ${esc(site.dataUpdated)}</li>
        </ul>
      </div>
      <div class="hero-visual">
        <div class="report-cover" aria-hidden="true">
          <div class="rc-label">Sherlock Research</div>
          <div class="rc-title">${esc(title)}</div>
          <div class="rc-edition">${site.edition} EDITION · 42 PAGES</div>
          <div class="rc-bars">${m.series.slice(-5).map((b) => `<span style="height: ${Math.round((b.value / max) * 100)}%"></span>`).join('')}</div>
          <img class="rc-fox" src="assets/sherlock-fox.svg" alt="" width="360" height="345">
        </div>
        <div class="cover-outlook">
          <div class="cover-outlook-label">Industry outlook</div>
          <div class="cover-outlook-row"><span class="cover-outlook-stat">${r.market.cagr}%</span><span class="cover-outlook-sub">projected CAGR, ${period}</span></div>
        </div>
      </div>
    </div>
  </div>
</header>

<div class="stats-bar">
  <div class="container">
    <ul class="stats-inner">
      ${stats.map((s) => `<li class="stat-item">
        <span class="stat-icon">${svg(s.icon)}</span>
        <div><div class="stat-val">${esc(s.value)}</div><div class="stat-label">${esc(s.label)}</div></div>
      </li>`).join('\n      ')}
    </ul>
  </div>
</div>

<section class="main">
  <div class="container">
    <div class="main-grid">
      <div>
        <p class="lead-text">${esc(r.lead)}</p>

        <figure class="content-card">
          <div class="card-head">
            <figcaption class="card-title">Market size &amp; growth (${esc(r.market.label)})</figcaption>
            <span class="card-tag">National · $ billions</span>
          </div>
          <div class="chart" aria-hidden="true">
            ${m.series.map((b, i) => `<div class="chart-bar ${b.kind}${i < 2 ? ' early' : ''}" style="height: ${Math.round((b.value / max) * 100)}%;"><span class="cval">${billions(b.value)}</span><span class="clabel">${b.year}</span></div>`).join('\n            ')}
          </div>
          <div class="visually-hidden">
            <table>
              <caption>${esc(r.market.label)} market size by year, in billions of dollars. Years marked E are projections.</caption>
              <tr><th scope="col">Year</th><th scope="col">Market size</th></tr>
              ${m.series.map((b) => `<tr><td>${b.year}</td><td>${billions(b.value)}</td></tr>`).join('\n              ')}
            </table>
          </div>
          <div class="chart-legend">
            <span><span class="ldot" style="background: var(--navy);"></span> Actual</span>
            <span><span class="ldot" style="background: var(--orange);"></span> Latest year</span>
            <span><span class="ldot" style="background: var(--sage);"></span> Projected at ${r.market.cagr}% a year</span>
          </div>
          <p class="source-note"><strong>Sources:</strong> U.S. Census Bureau, Bureau of Labor Statistics, and Sherlock Research operator surveys. Projections apply the ${period} CAGR to the ${m.latestYear} base.</p>
        </figure>

        <h2 class="section-h">Key industry insights</h2>
        <div class="insight-cards">
          ${r.insights.map((i) => `<div class="insight-c">
            <div class="insight-c-icon">${i.icon.replace('<svg ', '<svg aria-hidden="true" ')}</div>
            <h3>${esc(i.title)}</h3>
            <p>${esc(i.text)}</p>
          </div>`).join('\n          ')}
        </div>

        <h2 class="section-h">Competitive landscape</h2>
        <p class="section-sub-text">The industry is fragmented, with thousands of small businesses and a mix of regional and national players.</p>
        <div class="content-card">
          <div class="comp-grid">
            <div>
              <h3 class="card-title">Market share by business size</h3>
              <div class="donut" style="background: conic-gradient(${stops});" aria-hidden="true"></div>
              <ul class="comp-legend">
                ${r.marketShare.map((pct, i) => `<li><span class="ldot" style="background: ${SHARE_COLORS[i]};"></span> ${SHARE_LABELS[i]} <span class="pctval">${pct}%</span></li>`).join('\n                ')}
              </ul>
            </div>
            <div class="comp-factors">
              <h3>Top competitive factors</h3>
              <ul>
                ${FACTORS.map((f) => `<li>${icons.check(16)} ${esc(f)}</li>`).join('\n                ')}
              </ul>
            </div>
          </div>
        </div>

        <h2 class="section-h">Methodology &amp; sources</h2>
        <div class="content-card method-card">
          <p>Sherlock Research reports combine national datasets with local survey data and proprietary modeling. Every figure is labelled with its sample size, data vintage, and geographic coverage, and tagged as fielded, benchmarked, or modeled.</p>
          <ul class="method-list">
            <li><b>Public data:</b> U.S. Census Bureau, Bureau of Labor Statistics, and trade-association reports</li>
            <li><b>Consumer panels:</b> 300+ service-buying households per market, fielded in the last 12 months</li>
            <li><b>Operator interviews:</b> active ${esc(r.nameLower)} business owners across the metros we cover</li>
            <li><b>Local cuts:</b> metro-level demand, competition, and pricing for ${metroCount} metros</li>
          </ul>
        </div>
      </div>

      <aside class="sidebar" aria-label="Buy this report">
        <div class="buy-card">
          <div class="buy-cover">
            <div class="bc-label">Sherlock Research</div>
            <div class="bc-title">${esc(r.name)}<br>Industry Report</div>
            <div class="bc-ed">${site.edition} EDITION · TRENDS, BENCHMARKS, OPPORTUNITIES</div>
          </div>
          <div class="buy-body">
            <ul class="buy-checks">
              ${['42 pages of data & insights', 'Charts, graphs & visual data', 'Local market breakdowns', 'Competitive benchmarking', 'Instant download (PDF)']
                .map((t) => `<li>${icons.check(16)} ${esc(t)}</li>`).join('\n              ')}
            </ul>
            <hr class="buy-divider">
            <div class="buy-selected-label">Selected plan</div>
            <div class="buy-selected-name" data-plan-name>${esc(start.plan.name)}</div>
            <div class="buy-price" data-plan-price>${esc(plansApi.formatPrice(start.plan))}</div>
            <div class="buy-price-note" data-plan-note>${esc(start.plan.note)}</div>
            <div class="cs-field" data-metro-wrap>
              <label class="field-label" for="sidebar-metro">Your metro</label>
              <select class="select" id="sidebar-metro" data-metro-select>${site.metros.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>
            </div>
            <a href="${esc(start.href)}" class="btn btn-primary btn-block btn-lg" data-checkout><span data-plan-cta>${esc(start.plan.cta)}</span></a>
            <a href="#purchase" class="change-plan">Compare all 4 options →</a>
            <div class="buy-trust">${svg(ICON.lock, 13)} Secure checkout · 30-day money-back guarantee</div>
          </div>
        </div>
        <div class="sample-card" data-lint-skip>
          <img class="sample-thumb" src="assets/sample-page-1.jpg" alt="" width="734" height="950" loading="lazy">
          <div>
            <h3>See it before you buy</h3>
            <p>Two real pages from the ${esc(site.edition)} Landscaping report, including a full insight module. Free PDF.</p>
            <a href="sample.html" class="sample-link">Get the free sample →</a>
          </div>
        </div><!-- /lint-skip -->
      </aside>
    </div>
  </div>
</section>
${site.flipbookEmbed ? `
<section class="flipbook-section" id="flipbook">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">Look inside the report</div>
      <h2>See the structure and depth before you buy.</h2>
      <p>Flip through real report pages. The framework and visuals are exactly what you get — only the figures stay locked until you unlock the full report.</p>
    </div>
    <div class="flipbook-mount">${site.flipbookEmbed}</div>
  </div>
</section>
` : ''}
<section class="toc-section">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">What's inside</div>
      <h2>Eight sections, one clear path to a decision.</h2>
      <p>Every section ends with a recommended action — not just a chart.</p>
    </div>
    <ol class="toc-grid">
      ${TOC.map(([h, p], i) => `<li class="toc-item"><span class="toc-num" aria-hidden="true">0${i + 1}</span><div><h3>${esc(h)}</h3><p>${esc(p.replace('{through}', r.market.projectThrough))}</p></div></li>`).join('\n      ')}
      <li class="toc-item appendix"><span class="toc-num" aria-hidden="true">+</span><div><h3>Appendix &amp; sources</h3><p>Full methodology, sample sizes, and data vintage.</p></div></li>
    </ol>
  </div>
</section>

<section class="purchase" id="purchase">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">Choose your access</div>
      <h2>One report, or <em>your whole edge</em>.</h2>
      <p>Pick the option that fits your move. Your selection updates the summary below, so it's always clear exactly what you're buying.</p>
    </div>
    <div style="text-align: center;"><div class="axis-note"><span><b>Depth</b> = more for this industry</span><span><b>Breadth</b> = every industry report</span></div></div>
    ${partials.plans(site, ctx, plansApi, { industry: r.slug })}
  </div>
</section>

<section class="compare">
  <div class="container">
    <div class="compare-head">
      <div class="eyebrow">Why Sherlock</div>
      <h2>One IBISWorld seat is $8,000 a year.<br> Every Sherlock report is $2,997, once.</h2>
    </div>
    ${partials.compareTable()}
  </div>
</section>

<section class="whofor">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">Who it's for</div>
      <h2>Built for the people making the call.</h2>
    </div>
    <div class="whofor-grid">
      ${WHO.map(([icon, h, p]) => `<div class="who-card">
        <div class="who-icon">${svg(ICON[icon], 22)}</div>
        <h3>${esc(h)}</h3>
        <p>${esc(p)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="rev">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">From ${esc(r.nameLower)} operators</div>
      <h2>Used to make real moves.</h2>
    </div>
    <div class="rev-grid">
      ${r.reviews.map((v) => partials.quoteCard(v)).join('\n      ')}
    </div>
  </div>
</section>

<section class="guarantee">
  <div class="container">
    ${partials.guarantee()}
  </div>
</section>

<section class="faq">
  <div class="container">
    <h2>Questions before you buy.</h2>
    <div class="faq-list">
      ${faqs.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}>
        <summary>${esc(q)}</summary>
        <p>${esc(a)}</p>
      </details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="final">
  <div class="container">
    <div class="final-grid">
      <div>
        <h2>Better data. Better decisions. <em>More growth.</em></h2>
        <p>Join ${esc(site.operatorCount)} service-business operators who use Sherlock Research to stay ahead of the competition.</p>
        <a href="#purchase" class="btn btn-primary btn-lg">Get your edge today →</a>
      </div>
      <div class="final-fox">
        <img src="assets/sherlock-fox.svg" alt="" width="300" height="288" loading="lazy">
      </div>
    </div>
  </div>
</section>
</main>

${partials.footer(site, ctx)}

<div class="sticky-buy" id="stickyBuy" inert>
  <div class="container sticky-buy-inner">
    <div>
      <div class="sticky-buy-name" data-plan-name>${esc(start.plan.name)}</div>
      <div class="sticky-buy-price" data-plan-term>${esc(plansApi.formatPrice(start.plan))} · one-time</div>
    </div>
    <a href="${esc(start.href)}" class="btn btn-primary" data-checkout><span data-plan-cta>${esc(start.plan.cta)}</span>&nbsp;→</a>
  </div>
</div>

</body>
</html>
`;
}
