// Shared page fragments. Hand-written pages receive these through
// <!-- @name --> … <!-- /@name --> regions; generated pages call them directly.
import { esc, scriptJSON, assetVersion, formatPrice, slugify, pageUrl, icons, industryIcon } from './lib.mjs';

const asset = (rel) => `/${rel}?v=${assetVersion(rel)}`;

// Shared <head> tags. Per-page title, description, canonical and og:* stay in the page.
export function head(site, { css = [], js = [] } = {}) {
  return [
    '<meta name="theme-color" content="#0D1B2A">',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:image" content="${site.url}/og-default.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(site.name)} — market intelligence for service businesses">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&amp;family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&amp;display=swap">',
    `<link rel="stylesheet" href="${asset('assets/site.css')}">`,
    ...css.map((f) => `<link rel="stylesheet" href="${asset('assets/' + f)}">`),
    `<script src="${asset('assets/site.js')}" defer></script>`,
    ...js.map((f) => `<script src="${asset('assets/' + f)}" defer></script>`),
    ...(site.cloudflareAnalyticsToken
      ? [`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${esc(JSON.stringify({ token: site.cloudflareAnalyticsToken }))}'></script>`]
      : []),
  ].join('\n');
}

// Links take page files ("pricing.html", "index.html#how") and render clean root URLs.
const href = (file) => {
  const [f, hash] = file.split('#');
  return pageUrl(f) + (hash ? '#' + hash : '');
};
const link = (file, label, current, extra = '') =>
  `<a href="${href(file)}"${file === current ? ' aria-current="page"' : ''}${extra}>${esc(label)}</a>`;

const ddItem = (file, title, meta, icon, current) =>
  `<a class="dd-item" href="${href(file)}"${file === current ? ' aria-current="page"' : ''}>${icon ? `<span class="dd-ic">${icon}</span>` : ''}<span class="dd-text"><span class="dd-name">${esc(title)}</span>${meta ? `<span class="dd-meta">${esc(meta)}</span>` : ''}</span></a>`;

export function nav(site, ctx, { current = '' } = {}) {
  const featured = ctx.reports.filter((r) => r.featured)
    .map((r) => ddItem(`${r.slug}-report.html`, r.name, `${site.edition} edition`, industryIcon(r, 18), current)).join('\n            ');
  const categories = ctx.categories.map((c) => {
    const count = ctx.reports.filter((r) => r.category === c.slug).length;
    return ddItem(`reports.html#${c.slug}`, c.name, `${count} report${count === 1 ? '' : 's'}`, industryIcon(c.slug, 18), current);
  }).join('\n            ');
  const cities = ctx.cities.map((c) => ddItem(`${c.slug}.html`, `${c.name}, ${c.state}`, '', '', current)).join('\n            ');
  const cta = current === 'sample.html'
    ? { file: 'reports.html', label: 'Browse reports' }
    : { file: 'sample.html', label: 'Free sample' };
  return `<a class="skip-link" href="#main">Skip to content</a>
<nav class="nav" aria-label="Primary">
  <div class="container nav-inner">
    <a href="/" class="logo" aria-label="${esc(site.name)} home">
      <span class="logo-mark">${icons.foxMark()}</span>
      <span class="logo-stack">Sherlock<small>RESEARCH</small></span>
    </a>
    <div class="nav-links" id="navLinks">
      <div class="nav-item">
        ${link('reports.html', 'Reports', current)}
        <button type="button" class="nav-sub-toggle" aria-expanded="false" aria-controls="navReports" aria-label="Show report categories">${icons.caret()}</button>
        <div class="dropdown" id="navReports">
          <div class="dropdown-col">
            <div class="dropdown-title">Most read</div>
            ${featured}
          </div>
          <div class="dropdown-col">
            <div class="dropdown-title">By category</div>
            ${categories}
          </div>
          <div class="dropdown-col dropdown-col-narrow">
            <div class="dropdown-title">Local markets</div>
            ${cities}
          </div>
          <div class="dropdown-foot">
            ${link('reports.html', `All ${ctx.reports.length} reports →`, current)}
            <a href="/sample">Free 2-page sample →</a>
          </div>
        </div>
      </div>
      ${link('index.html#how', 'How it works', current)}
      ${link('pricing.html', 'Pricing', current)}
      ${link('about.html', 'About', current)}
      ${link('contact.html', 'Contact', current)}
      <a href="${href(cta.file)}" class="btn btn-primary nav-mobile-only">${cta.label}</a>
    </div>
    <div class="nav-right">
      <a href="${href(cta.file)}" class="btn btn-primary nav-cta">${cta.label}</a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="navLinks" aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>`;
}

export function footer(site, ctx) {
  const li = (file, label) => `<li><a href="${href(file)}">${esc(label)}</a></li>`;
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="logo" aria-label="${esc(site.name)} home">
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
          ${ctx.categories.map((c) => li(`reports.html#${c.slug}`, c.name)).join('\n          ')}
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Most read</h2>
        <ul>
          ${ctx.reports.filter((r) => r.featured).map((r) => li(`${r.slug}-report.html`, r.name)).join('\n          ')}
          ${li('reports.html', `All ${ctx.reports.length} reports`)}
        </ul>
        <h2 class="footer-h footer-h-gap">Local markets</h2>
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
      <span class="footer-legal"><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></span>
    </div>
  </div>
</footer>`;
}

// Payhip product page -> Payhip's direct checkout for the same product (skips one page).
const payhipCheckout = (site, url) => {
  const key = site.payhipDirectCheckout && url.match(/^https:\/\/payhip\.com\/b\/([A-Za-z0-9]+)$/)?.[1];
  return key ? `https://payhip.com/buy?link=${key}` : url;
};

// Config consumed by assets/plans.js. On a report page only that industry is included.
export function plansConfig(site, ctx, { industry = null } = {}) {
  const industries = industry ? ctx.reports.filter((r) => r.slug === industry) : ctx.reports;
  return {
    email: site.email,
    checkout: {
      ...Object.fromEntries(Object.entries(site.checkout).map(([k, v]) => [k, payhipCheckout(site, v)])),
      single: Object.fromEntries(industries.filter((r) => r.payhip).map((r) => [r.slug, payhipCheckout(site, r.payhip)])),
    },
    defaultPlan: site.defaultPlan,
    industry,
    industries: industries.map((r) => ({ slug: r.slug, name: r.name, presell: r.presell })),
    metros: site.metros,
    plans: site.plans.map(({ key, name, price, unit, note, cta, metro, allIndustries }) =>
      ({ key, name, price, unit, note, cta, metro, allIndustries: !!allIndustries })),
  };
}

// Server-rendered starting state, computed with the same functions the browser uses.
export function initialCheckout(site, ctx, plansApi, industrySlug) {
  const plan = site.plans.find((p) => p.key === site.defaultPlan);
  const industry = ctx.reports.find((r) => r.slug === industrySlug) || ctx.reports[0];
  const cfg = plansConfig(site, ctx, { industry: industrySlug });
  const metro = site.metros[0];
  const ind = cfg.industries.find((i) => i.slug === industry.slug);
  return {
    plan,
    detail: plansApi.describe(plan, ind, metro),
    cta: plansApi.ctaLabel(plan, ind),
    href: plansApi.checkoutHref(cfg, plan, ind, metro),
  };
}

// Industry <select> options grouped by category.
export function industryOptions(ctx, { selected = '' } = {}) {
  return ctx.categories.map((c) => `<optgroup label="${esc(c.name)}">${ctx.reports.filter((r) => r.category === c.slug)
    .map((r) => `<option value="${r.slug}"${r.slug === selected ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</optgroup>`).join('');
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
    const feats = ind?.presell ? p.features.map((f) => f.replace('Instant PDF download', 'PDF emailed on release')) : p.features;
    const unit = p.unit ? `<span class="unit">${esc(p.unit)}</span>` : '';
    const badge = p.badge ? `<span class="opt-badge${p.badgeTone ? ' ' + p.badgeTone : ''}">${esc(p.badge)}</span>` : '';
    const features = feats.map((f) => `<li>${icons.check()} ${esc(f)}</li>`)
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
            <select class="select" id="${idPrefix}-industry" data-industry-select>${industryOptions(ctx)}</select>
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
        <a href="${esc(start.href)}" class="btn btn-primary btn-lg" data-checkout><span data-plan-cta>${esc(start.cta)}</span>&nbsp;→</a>
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

// Testimonial card. `cite` is "Name, role" (e.g. "Caleb T., Owner, Bear Power Wash").
export function quoteCard({ title, text, cite }) {
  const [name, ...rest] = cite.replace(/^—\s*/, '').split(', ');
  const initials = name.split(/\s+/).map((w) => w[0]).join('').replace(/[^A-Z]/gi, '').slice(0, 2).toUpperCase();
  return `<figure class="quote-card">
        <span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span>
        <h3 class="quote-card-title">${esc(title)}</h3>
        <blockquote><p>${esc(text)}</p></blockquote>
        <figcaption><span class="avatar" aria-hidden="true">${initials}</span><span><span class="who-name">${esc(name)}</span><span class="who-role">${esc(rest.join(', '))}</span></span></figcaption>
      </figure>`;
}

// Metro list as prose, for FAQ answers.
export function metroSentence(site) {
  const names = site.metros.map((m) => m.split(',')[0]);
  return `We currently cover ${names.length} U.S. metros: ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}. If your exact market isn't listed, we'll build the local cut for you within 48 hours at no extra cost.`;
}

export { industryIcon, slugify, icons };
