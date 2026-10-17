// Sherlock Research: plan picker + checkout links (pricing page and report pages).
//
// The page embeds its config as <script type="application/json" id="plansConfig">,
// written by scripts/build.mjs from src/data/site.json. The build also runs
// checkoutHref() below (in a sandbox) to render the no-JS href, so the
// static link and the live link always agree.
(function (root) {
  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function formatPrice(plan) {
    return '$' + plan.price.toLocaleString('en-US') + (plan.unit || '');
  }

  // Order summary line shown under the selected plan name.
  function describe(plan, industry, metro) {
    if (plan.allIndustries) return 'Every Sherlock industry report — current and new releases';
    var base = industry ? industry.name + ' · ' : '';
    if (plan.key === 'quarterly') return base + '4 quarterly updates + 4 coaching calls, with local data for ' + metro;
    if (plan.metro) return base + 'national report + local data for ' + metro;
    return base + 'full national report and forecasts (PDF)';
  }

  // Hosted payment link when configured; otherwise a prefilled order email.
  function checkoutHref(cfg, plan, industry, metro) {
    var url = cfg.checkout[plan.key];
    var parts = [plan.key];
    if (!plan.allIndustries && industry) parts.push(industry.slug);
    if (plan.metro && metro) parts.push(slugify(metro));
    if (url) {
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'client_reference_id=' + encodeURIComponent(parts.join('__'));
    }
    var what = plan.name +
      (!plan.allIndustries && industry ? ' (' + industry.name + ')' : '') +
      (plan.metro && metro ? ', ' + metro : '');
    var body = 'Hi Sherlock team,\n\nI would like to order:\n\n' +
      'Plan: ' + plan.name + ' (' + formatPrice(plan) + ')\n' +
      (!plan.allIndustries && industry ? 'Industry: ' + industry.name + '\n' : '') +
      (plan.metro && metro ? 'Metro: ' + metro + '\n' : '') +
      '\nPlease send the payment link.\n\nName:\nBusiness:\n';
    return 'mailto:' + cfg.email + '?subject=' + encodeURIComponent('Order: ' + what) + '&body=' + encodeURIComponent(body);
  }

  var api = { slugify: slugify, formatPrice: formatPrice, describe: describe, checkoutHref: checkoutHref };
  root.SherlockPlans = api;

  if (typeof document === 'undefined') return;
  var cfgEl = document.getElementById('plansConfig');
  if (!cfgEl) return;
  var cfg = JSON.parse(cfgEl.textContent);

  var planByKey = {};
  cfg.plans.forEach(function (p) { planByKey[p.key] = p; });
  var industryBySlug = {};
  cfg.industries.forEach(function (i) { industryBySlug[i.slug] = i; });

  var state = { plan: cfg.defaultPlan, industry: cfg.industry || cfg.industries[0].slug, metro: cfg.metros[0] };

  // Deep links: ?plan=city&metro=austin-tx (city pages link here).
  var params = new URLSearchParams(location.search);
  if (planByKey[params.get('plan')]) state.plan = params.get('plan');
  var metroParam = params.get('metro');
  if (metroParam) {
    cfg.metros.forEach(function (m) { if (slugify(m) === metroParam) state.metro = m; });
  }
  if (!cfg.industry && industryBySlug[params.get('industry')]) state.industry = params.get('industry');

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setText(sel, text) { all(sel).forEach(function (el) { el.textContent = text; }); }

  function render() {
    var plan = planByKey[state.plan];
    var industry = industryBySlug[state.industry];
    var href = checkoutHref(cfg, plan, industry, state.metro);

    all('input[name="plan"]').forEach(function (r) {
      r.checked = r.value === state.plan;
      r.closest('.opt-card').classList.toggle('selected', r.checked);
    });
    all('[data-metro-select]').forEach(function (s) { s.value = state.metro; });
    all('[data-industry-select]').forEach(function (s) { s.value = state.industry; });
    all('[data-metro-wrap]').forEach(function (w) { w.hidden = !plan.metro; });
    all('[data-industry-wrap]').forEach(function (w) { w.hidden = !!plan.allIndustries; });

    setText('[data-plan-name]', plan.name);
    setText('[data-plan-price]', formatPrice(plan));
    setText('[data-plan-note]', plan.note);
    setText('[data-plan-detail]', describe(plan, industry, state.metro));
    setText('[data-plan-cta]', plan.cta);
    setText('[data-plan-term]', formatPrice(plan) + (plan.unit ? ' · subscription' : ' · one-time'));
    all('[data-checkout]').forEach(function (a) { a.href = href; });
  }

  all('input[name="plan"]').forEach(function (r) {
    r.addEventListener('change', function () { state.plan = r.value; render(); });
  });
  // The whole card is the click target; the radio inside carries focus and state.
  all('.opt-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('input, label, a')) return;
      var r = card.querySelector('input[name="plan"]');
      state.plan = r.value; render(); r.focus();
    });
  });
  all('[data-metro-select]').forEach(function (s) {
    s.addEventListener('change', function () { state.metro = s.value; render(); });
  });
  all('[data-industry-select]').forEach(function (s) {
    s.addEventListener('change', function () { state.industry = s.value; render(); });
  });

  render();
})(typeof window !== 'undefined' ? window : globalThis);
