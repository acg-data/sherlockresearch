// Shared page fragments. Hand-written pages receive these through
// <!-- @name --> … <!-- /@name --> regions; generated pages call them directly.
import { esc, scriptJSON, assetVersion, formatPrice, slugify, icons, industryIcon } from './lib.mjs';

const asset = (base, rel) => `${base}${rel}?v=${assetVersion(rel)}`;

// Shared <head> tags. Per-page title, description, canonical and og:* stay in the page.
export function head(site, { base = '', css = [], js = [] } = {}) {
  return [
    '<meta name="theme-color" content="#0D1B2A">',
    `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:image" content="${site.url}/og-default.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(site.name)} — market intelligence for service businesses">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&amp;family=Playfair+Display:ital,wght@0,400..800;1,400..600&amp;display=swap">',
    `<link rel="stylesheet" href="${asset(base, 'assets/site.css')}">`,
    ...css.map((f) => `<link rel="stylesheet" href="${asset(base, 'assets/' + f)}">`),
    `<script src="${asset(base, 'assets/site.js')}" defer></script>`,
    ...js.map((f) => `<script src="${asset(base, 'assets/' + f)}" defer></script>`),
  ].join('\n');
}

const link = (href, label, current, base, extra = '') =>
  `<a href="${base}${href}"${href === current ? ' aria-current="page"' : ''}${extra}>${esc(label)}</a>`;

export function nav(site, ctx, { current = '', base = '' } = {}) {
  const reports = ctx.reports.map((r) => link(`${r.slug}-report.html`, r.name, current, base)).join('\n          ');
  const cities = ctx.cities.map((c) => link(`${c.slug}.html`, `${c.name}, ${c.state}`, current, base)).join('\n          ');
  const cta = current === 'sample.html'
    ? { href: 'reports.html', label: 'Browse reports' }
    : { href: 'sample.html', label: 'Get a free sample' };
  return `<a class="skip-link" href="#main">Skip to content</a>
<nav class="nav" aria-label="Primary">
  <div class="container nav-inner">
    <a href="${base}index.html" class="logo" aria-label="${esc(site.name)} home">
      <span class="logo-mark">${icons.foxMark()}</span>
      <span class="logo-stack">Sherlock<small>RESEARCH</small></span>
    </a>
    <div class="nav-links" id="navLinks">
      <div class="nav-item">
        ${link('reports.html', 'Reports', current, base)}
        <button type="button" class="nav-sub-toggle" aria-expanded="false" aria-controls="navReports" aria-label="Show reports and locations">${icons.caret()}</button>
        <div class="dropdown" id="navReports">
          <div class="dropdown-title">Industry reports</div>
          ${reports}
          <div class="dropdown-title">Local markets</div>
          ${cities}
          ${link('reports.html', 'All reports →', current, base, ' class="dropdown-all"')}
        </div>
      </div>
      ${link('index.html#how', 'How it works', current, base)}
      ${link('pricing.html', 'Pricing', current, base)}
      ${link('about.html', 'About', current, base)}
      ${link('contact.html', 'Contact', current, base)}
      <a href="${base}${cta.href}" class="btn btn-primary nav-mobile-only">${cta.label}</a>
    </div>
    <div class="nav-right">
      <a href="${base}${cta.href}" class="btn btn-primary nav-cta">${cta.label}</a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="navLinks" aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>`;
}

export function footer(site, ctx, { base = '' } = {}) {
  const li = (href, label) => `<li><a href="${base}${href}">${esc(label)}</a></li>`;
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="${base}index.html" class="logo" aria-label="${esc(site.name)} home">
          <span class="logo-mark">${icons.foxMark()}</span>
          <span class="logo-stack">Sherlock<small>RESEARCH</small></span>
        </a>
        <p class="footer-tag">See the market. Stay ahead.</p>
        <p>Industry-specific market intelligence for service businesses under $10M.</p>
        <a class="footer-email" href="mailto:${site.email}">${site.email}</a>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Reports</h2>
        <ul>
          ${ctx.reports.map((r) => li(`${r.slug}-report.html`, r.name)).join('\n          ')}
          ${li('reports.html', 'All reports')}
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Local markets</h2>
        <ul>
          ${ctx.cities.map((c) => li(`${c.slug}.html`, `${c.name}, ${c.state}`)).join('\n          ')}
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Company</h2>
        <ul>
          ${li('index.html#how', 'How it works')}
          ${li('pricing.html', 'Pricing')}
          ${li('sample.html', 'Free sample')}
          ${li('blog-article.html', '2026 Landscaping Outlook')}
          ${li('about.html', 'About')}
          ${li('faq.html', 'FAQ')}
          ${li('contact.html', 'Contact')}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${site.copyrightYear} ${esc(site.name)}. All rights reserved.</span>
      <span class="footer-legal"><a href="${base}privacy-policy.html">Privacy</a><a href="${base}terms-of-service.html">Terms</a></span>
    </div>
  </div>
</footer>`;
}

// Config consumed by assets/plans.js.
export function plansConfig(site, ctx, { industry = null } = {}) {
  return {
    email: site.email,
    checkout: site.checkout,
    defaultPlan: site.defaultPlan,
    industry,
    industries: ctx.reports.map((r) => ({ slug: r.slug, name: r.name })),
    metros: site.metros,
    plans: site.plans.map(({ key, name, price, unit, note, cta, metro, allIndustries }) =>
      ({ key, name, price, unit, note, cta, metro, allIndustries: !!allIndustries })),
  };
}

// Server-rendered starting state, computed with the same function the browser uses.
export function initialCheckout(site, ctx, plansApi, industrySlug) {
  const plan = site.plans.find((p) => p.key === site.defaultPlan);
  const industry = ctx.reports.find((r) => r.slug === industrySlug) || ctx.reports[0];
  const cfg = plansConfig(site, ctx, { industry: industrySlug });
  const metro = site.metros[0];
  return {
    plan,
    detail: plansApi.describe(plan, industry, metro),
    href: plansApi.checkoutHref(cfg, plan, industry, metro),
  };
}

function metroSelect(site, id, label) {
  const opts = site.metros.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
  return `<div class="cs-field" data-metro-wrap>
            <label for="${id}">${label}</label>
            <select class="select" id="${id}" data-metro-select>${opts}</select>
          </div>`;
}

// Plan cards + checkout bar. `industry` = report slug, or null for an industry picker.
export function plans(site, ctx, plansApi, { industry = null, idPrefix = 'plan' } = {}) {
  const ind = industry ? ctx.reports.find((r) => r.slug === industry) : null;
  const start = initialCheckout(site, ctx, plansApi, industry);
  const cards = site.plans.map((p) => {
    const id = `${idPrefix}-${p.key}`;
    const selected = p.key === site.defaultPlan;
    const desc = p.desc.replace('{industry}', ind ? ind.name : 'industry');
    const unit = p.unit ? `<span class="unit">${esc(p.unit)}</span>` : '';
    const badge = p.badge ? `<span class="opt-badge${p.badgeTone ? ' ' + p.badgeTone : ''}">${esc(p.badge)}</span>` : '';
    const features = p.features.map((f) => `<li>${icons.check()} ${esc(f)}</li>`)
      .concat(p.missing.map((f) => `<li class="muted">${icons.dash()} <span><span class="visually-hidden">Not included: </span>${esc(f)}</span></li>`))
      .join('\n          ');
    return `<div class="opt-card${p.popular ? ' popular' : ''}${selected ? ' selected' : ''}">
        <input class="opt-input" type="radio" name="plan" id="${id}" value="${p.key}"${selected ? ' checked' : ''}>
        ${badge}
        <span class="opt-radio" aria-hidden="true"></span>
        <div class="opt-axis">${esc(p.axis)}</div>
        <label class="opt-name" for="${id}">${esc(p.name)}<span class="visually-hidden">, ${esc(formatPrice(p))}</span></label>
        <div class="opt-price" aria-hidden="true">$${p.price.toLocaleString('en-US')}${unit}</div>
        <div class="opt-price-sub">${esc(p.priceSub)}</div>
        <div class="opt-compare">${esc(p.compare)}</div>
        <p class="opt-desc">${esc(desc)}</p>
        <ul class="opt-list">
          ${features}
        </ul>
      </div>`;
  }).join('\n      ');

  const industryField = ind ? '' : `<div class="cs-field" data-industry-wrap>
            <label for="${idPrefix}-industry">Industry</label>
            <select class="select" id="${idPrefix}-industry" data-industry-select>${ctx.reports.map((r) => `<option value="${r.slug}">${esc(r.name)}</option>`).join('')}</select>
          </div>`;

  return `<fieldset class="options-grid">
      <legend class="visually-hidden">Choose your plan</legend>
      ${cards}
    </fieldset>

    <div class="checkout-bar">
      <div class="checkout-summary">
        <div class="cs-label">You're getting</div>
        <div class="cs-name" data-plan-name>${esc(start.plan.name)}</div>
        <div class="cs-detail" data-plan-detail>${esc(start.detail)}</div>
        <div class="cs-fields">
          ${industryField}
          ${metroSelect(site, `${idPrefix}-metro`, 'Your metro')}
        </div>
      </div>
      <div class="checkout-action">
        <div class="checkout-price" data-plan-price>${esc(formatPrice(start.plan))}</div>
        <a href="${esc(start.href)}" class="btn btn-primary btn-lg" data-checkout><span data-plan-cta>${esc(start.plan.cta)}</span>&nbsp;→</a>
        <p class="checkout-note">Secure checkout · 30-day money-back guarantee</p>
      </div>
    </div>
    <script type="application/json" id="plansConfig">${scriptJSON(plansConfig(site, ctx, { industry }), 0)}</script>`;
}

export function compareTable() {
  const rows = [
    ['Built for operators', ['yes', 'Yes'], ['no', 'Analysts'], ['mid', 'Sometimes']],
    ['Local / city-level data', ['yes', 'Yes'], ['no', 'No'], ['mid', 'Custom']],
    ['Recommended actions', ['yes', 'Every section'], ['no', 'No'], ['yes', 'Yes']],
    ['Time to answer', ['yes', 'Instant'], ['yes', 'Instant'], ['no', '6–12 weeks']],
    ['Typical cost', [null, '$497–$2,997'], [null, '$8,000+/yr'], [null, '$25,000+']],
  ];
  const cell = ([kind, text], cls = '') =>
    `<td${cls}>${kind ? `<span class="ci ci-${kind}" aria-hidden="true"></span>` : ''}${esc(text)}</td>`;
  return `<div class="compare-scroll" tabindex="0" role="region" aria-label="Sherlock compared with IBISWorld and consultants">
      <table class="compare-table">
        <thead><tr><th scope="col">What you get</th><th scope="col" class="col-sherlock">Sherlock</th><th scope="col">IBISWorld</th><th scope="col">Consultant</th></tr></thead>
        <tbody>
          ${rows.map(([feat, a, b, c]) => `<tr><th scope="row">${esc(feat)}</th>${cell(a, ' class="col-sherlock"')}${cell(b)}${cell(c)}</tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
    <p class="compare-hint" aria-hidden="true">Swipe to compare →</p>`;
}

export function guarantee() {
  return `<div class="guarantee-inner">
      <div class="guarantee-badge">${icons.shield()}</div>
      <h2>The 30-day "made a better decision" guarantee.</h2>
      <p>If the report doesn't give you at least one insight you can act on, email us within 30 days and we'll refund every dollar. We can offer this because operators rarely ask — the data pays for itself on the first decision.</p>
    </div>`;
}

// Metro list as prose, for FAQ answers.
export function metroSentence(site) {
  const names = site.metros.map((m) => m.split(',')[0]);
  return `We currently cover ${names.length} U.S. metros: ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}. If your exact market isn't listed, we'll build the local cut for you within 48 hours at no extra cost.`;
}

export { industryIcon, slugify };
