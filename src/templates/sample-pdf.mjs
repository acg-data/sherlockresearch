// Free 2-page sample of the Landscaping report, rendered to PDF by scripts/sample-pdf.mjs.
// Figures come from the same data files as the website, so the sample never disagrees with it.
import { esc, billions, marketSeries } from '../lib.mjs';

// Switching & willingness-to-pay module (same panel figures as the homepage sample).
const PANEL = [
  { value: '31%', label: 'Considering a switch', note: 'Active or soft-switch candidates', featured: true },
  { value: '52%', label: 'Quality first', note: 'Quality and reliability beat price for the median buyer' },
  { value: '57%', label: '20%+ price risk', note: 'Would shop, switch, or stop at a 20% increase' },
  { value: '6%', label: 'True price buyers', note: 'Pure cheapest-wins decision makers' },
];

export function render(r, site) {
  const m = marketSeries(r.market);
  const max = Math.max(...m.series.map((b) => b.value));
  const period = `${m.latestYear}–${r.market.projectThrough}`;
  const footer = (n) => `<footer class="pf"><span>${esc(site.name)} · ${esc(r.name)} Industry Report · ${site.edition} edition</span><span>Free sample · page ${n} of 2</span></footer>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(r.name)} Industry Report: free sample (${esc(site.name)})</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Playfair+Display:ital,wght@0,400..800;1,400..600&display=swap">
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, sans-serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.55; font-variant-numeric: lining-nums; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; height: 11in; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .band { background: radial-gradient(ellipse 70% 120% at 100% 0%, rgba(242,106,33,0.25), transparent 60%), linear-gradient(135deg, #1c2f44, #0D1B2A 60%, #08111c); color: #fff; padding: 0.55in 0.7in 0.45in; }
  .brand { display: flex; align-items: center; gap: 10px; font-family: 'Playfair Display'; font-weight: 700; font-size: 15pt; }
  .brand small { display: block; font-family: Inter; font-size: 6.5pt; letter-spacing: 0.24em; color: #FFB38A; font-weight: 700; margin-top: 2px; }
  .mark { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #FF8542, #F26A21 50%, #D9551A); display: flex; align-items: center; justify-content: center; }
  .mark svg { width: 20px; height: 20px; }
  .band-row { display: flex; justify-content: space-between; align-items: center; }
  .tag { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #FFB38A; border: 1px solid rgba(255,179,138,0.4); border-radius: 100px; padding: 4px 10px; }
  .band h1 { font-family: 'Playfair Display'; font-size: 26pt; line-height: 1.05; margin-top: 0.35in; letter-spacing: -0.01em; }
  .band h1 em { font-style: italic; font-weight: 500; color: #FF8542; }
  .band p { color: rgba(255,255,255,0.78); margin-top: 8px; max-width: 5.6in; }
  .body { padding: 0.4in 0.7in 0; flex: 1; }
  .module { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #AD4416; margin-bottom: 6px; }
  h2 { font-family: 'Playfair Display'; font-size: 19pt; color: #0D1B2A; line-height: 1.1; margin-bottom: 8px; }
  .lede { color: #444; margin-bottom: 16px; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .tile { border: 1px solid rgba(13,27,42,0.12); border-radius: 10px; padding: 12px 12px 14px; background: #FBF9F1; }
  .tile.featured { background: linear-gradient(135deg, #C94D17, #A63F12); border: none; color: #fff; }
  .tile .v { font-family: 'Playfair Display'; font-size: 24pt; font-weight: 800; line-height: 1; color: #0D1B2A; }
  .tile.featured .v { color: #fff; }
  .tile .l { font-size: 7pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 8px 0 4px; color: #5f5f5f; }
  .tile.featured .l, .tile.featured .n { color: #fff; }
  .tile .n { font-size: 8pt; line-height: 1.35; color: #0D1B2A; }
  .cols { display: grid; grid-template-columns: 1.15fr 1fr; gap: 0.3in; }
  h3 { font-size: 10.5pt; color: #0D1B2A; margin-bottom: 6px; }
  .cols p, .cols li { color: #333; font-size: 9.5pt; }
  .cols p + p { margin-top: 8px; }
  ul.read { list-style: none; }
  ul.read li { padding: 6px 0 6px 16px; border-bottom: 1px solid rgba(13,27,42,0.08); position: relative; }
  ul.read li::before { content: ''; position: absolute; left: 0; top: 12px; width: 7px; height: 7px; border-radius: 50%; background: #5C7F5A; }
  .action { margin-top: 16px; border-radius: 10px; background: #0D1B2A; color: #fff; padding: 14px 18px; display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
  .action b { display: block; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: #FFB38A; margin-bottom: 4px; }
  .action p { color: rgba(255,255,255,0.88); font-size: 9.5pt; }
  .action .ico { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #C94D17, #A63F12); display: flex; align-items: center; justify-content: center; }
  .source { font-size: 7.5pt; color: #5f5f5f; font-style: italic; margin-top: 10px; }
  .chart { display: flex; align-items: flex-end; gap: 9px; height: 2.1in; border-bottom: 1px solid rgba(13,27,42,0.15); margin: 22px 0 26px; padding-top: 18px; }
  .bar { flex: 1; border-radius: 4px 4px 0 0; position: relative; background: linear-gradient(180deg, #1c2f44, #0D1B2A); }
  .bar.projected { background: linear-gradient(180deg, #6E9269, #5C7F5A); }
  .bar.latest { background: linear-gradient(180deg, #FF8542, #D9551A); }
  .bar .cv { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 7pt; font-weight: 700; color: #0D1B2A; white-space: nowrap; }
  .bar .cl { position: absolute; bottom: -17px; left: 0; right: 0; text-align: center; font-size: 7pt; color: #5f5f5f; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .stat { border-left: 3px solid #F26A21; padding: 2px 0 2px 10px; }
  .stat .v { font-family: 'Playfair Display'; font-size: 16pt; font-weight: 800; color: #0D1B2A; line-height: 1.1; }
  .stat .l { font-size: 7.5pt; color: #5f5f5f; line-height: 1.3; }
  .legend { display: flex; gap: 14px; font-size: 7.5pt; color: #5f5f5f; margin-top: -10px; margin-bottom: 12px; }
  .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; vertical-align: 0; }
  .method { background: #F2EFE6; border-radius: 10px; padding: 12px 16px; margin-top: 14px; }
  .method p { font-size: 8.5pt; color: #444; }
  .cta { margin: 16px 0.7in 0; border: 1.5px solid #F26A21; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .cta strong { font-family: 'Playfair Display'; font-size: 13pt; color: #0D1B2A; display: block; }
  .cta span { font-size: 8.5pt; color: #444; }
  .cta .price { text-align: right; white-space: nowrap; font-size: 8.5pt; color: #0D1B2A; font-weight: 600; }
  .pf { display: flex; justify-content: space-between; font-size: 7pt; color: #7a7a7a; padding: 0.22in 0.7in 0.3in; margin-top: auto; }
</style>
</head>
<body>

<section class="page">
  <div class="band">
    <div class="band-row">
      <div class="brand"><span class="mark"><svg viewBox="0 0 32 32" fill="white"><path d="M16 4 L8 10 L6 8 L4 14 L8 16 L8 22 Q16 28 24 22 L24 16 L28 14 L26 8 L24 10 Z M12 14 Q14 13 14 16 Q12 17 12 14 Z M18 14 Q20 13 20 16 Q18 17 18 14 Z M14 19 Q16 21 18 19 Z"/></svg></span><span>Sherlock<small>RESEARCH</small></span></div>
      <span class="tag">Free sample · 2-page excerpt</span>
    </div>
    <h1>${esc(r.name)} Industry Report <em>${site.edition}</em></h1>
    <p>Two pages from the full report: one buyer-behavior section and the market forecast, each ending in the recommended move we call the Monday-morning action.</p>
  </div>
  <div class="body">
    <div class="module">Section 03 · Buyer behavior</div>
    <h2>Switching &amp; willingness-to-pay signals</h2>
    <p class="lede">Homeowners who paid for landscaping or lawn care in the last 12 months and were the primary or shared decision-maker. The question: who is loyal, who is shopping, and what would make them leave?</p>
    <div class="tiles">
      ${PANEL.map((t) => `<div class="tile${t.featured ? ' featured' : ''}"><div class="v">${t.value}</div><div class="l">${t.label}</div><div class="n">${t.note}</div></div>`).join('')}
    </div>
    <div class="cols">
      <div>
        <h3>What it means</h3>
        <p>Nearly a third of customers are already open to a new provider, but very few are shopping on price alone. Quality and reliability decide the job for more than half of buyers, while only about one in seventeen is a pure cheapest-wins buyer.</p>
        <p>The risk sits in large, sudden increases: more than half would shop, switch, or stop if their price rose 20% or more. Smaller, explained increases on renewals carry far less churn risk than across-the-board jumps.</p>
      </div>
      <div>
        <h3>How to read the segments</h3>
        <ul class="read">
          <li><b>Quality-first (52%):</b> protect with reliability guarantees, not discounts.</li>
          <li><b>Soft switchers (31%):</b> win with response time and visible crew consistency.</li>
          <li><b>Price-led (6%):</b> don't build your pricing around them.</li>
        </ul>
      </div>
    </div>
    <div class="action">
      <span class="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
      <div><b>Monday-morning action</b><p>Re-price renewals in tiers instead of one flat increase: hold or lightly raise accounts that show switching signals, and apply your full increase to quality-first accounts with a reliability promise attached. Keep any single increase under 20%.</p></div>
    </div>
    <p class="source">Source: Sherlock 312-person consumer panel of ${esc(r.nameLower)} buyers, last 12 months. Full report adds segment cuts by home value, region, and service line.</p>
  </div>
  ${footer(1)}
</section>

<section class="page">
  <div class="body" style="padding-top: 0.6in;">
    <div class="module">Section 01 · Market size &amp; forecast</div>
    <h2>${esc(r.market.label.charAt(0).toUpperCase() + r.market.label.slice(1))}, ${m.series[0].year}–${r.market.projectThrough}</h2>
    <p class="lede">${esc(r.lead)}</p>
    <div class="stats">
      <div class="stat"><div class="v">${billions(m.latestValue)}</div><div class="l">${m.latestYear} market size</div></div>
      <div class="stat"><div class="v">${r.market.cagr}%</div><div class="l">Projected CAGR, ${period}</div></div>
      ${r.stats.map((s) => `<div class="stat"><div class="v">${esc(s.value)}</div><div class="l">${esc(s.label)}</div></div>`).join('')}
    </div>
    <div class="chart">
      ${m.series.map((b) => `<div class="bar ${b.kind}" style="height: ${Math.round((b.value / max) * 100)}%"><span class="cv">${billions(b.value)}</span><span class="cl">${b.year}</span></div>`).join('')}
    </div>
    <div class="legend"><span><i style="background:#0D1B2A"></i>Actual</span><span><i style="background:#F26A21"></i>Latest year</span><span><i style="background:#5C7F5A"></i>Projected at ${r.market.cagr}% a year</span></div>
    <div class="cols">
      <div>
        <h3>Demand drivers</h3>
        <ul class="read">
          ${r.insights.map((i) => `<li><b>${esc(i.title)}:</b> ${esc(i.text)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <div class="action" style="margin-top: 0;">
          <span class="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          <div><b>Monday-morning action</b><p>Growth is steady, not explosive, so share comes from competitors rather than new demand. Put next quarter's sales effort into maintenance contracts, where revenue repeats, and use your labor plan as the cap on how fast you add accounts.</p></div>
        </div>
        <div class="method">
          <h3>Methodology</h3>
          <p>Actual years from U.S. Census Bureau and Bureau of Labor Statistics data, cross-checked with Sherlock operator surveys. Projections apply the ${period} CAGR to the ${m.latestYear} base. Every figure in the full report is labelled with its sample size, data vintage, and coverage.</p>
        </div>
      </div>
    </div>
  </div>
  <div class="cta">
    <div><strong>Get the full report</strong><span>Eight sections, each ending in a recommended move. Add a local data cut for any of ${site.metros.length} metros.</span></div>
    <div class="price">Standard $${site.plans[0].price} · City-Specific $${site.plans[1].price}<br>${site.url.replace('https://', '')}/${r.slug}-report.html</div>
  </div>
  ${footer(2)}
</section>

</body>
</html>
`;
}
