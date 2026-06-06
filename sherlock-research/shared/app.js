(function(){
  'use strict';

  const catalog = window.SherlockCatalog;
  const planAliases = { standard: 'single' };

  function planKey(key) {
    return planAliases[key] || key || 'city';
  }

  function pageReportSlug() {
    if (document.body && document.body.dataset.reportSlug) {
      return document.body.dataset.reportSlug;
    }

    const path = window.location.pathname.split('/').pop() || '';
    const match = path.match(/^(.+)-report(?:\.html)?$/);
    return match ? match[1] : '';
  }

  function isCheckoutUrl(url) {
    return /^https:\/\//i.test(url || '') || isDynamicCheckoutUrl(url);
  }

  function isDynamicCheckoutUrl(url) {
    return /^\/api\/checkout(?:\?|$)/i.test(url || '');
  }

  function reportFor(slug) {
    if (!catalog || !catalog.reports) return null;
    return catalog.reports[slug] || null;
  }

  function planFor(key) {
    if (!catalog || !catalog.plans) return null;
    return catalog.plans[planKey(key)] || null;
  }

  function quarterRank(product) {
    const match = String(product.quarter || '').match(/Q([1-4])/i);
    return (Number(product.year) || 0) * 10 + (match ? Number(match[1]) : 0);
  }

  function productFor(key, slug) {
    const report = reportFor(slug || pageReportSlug() || (catalog && catalog.defaultReportSlug));
    const products = report && Array.isArray(report.products) ? report.products : [];
    const resolvedKey = planKey(key);

    return products
      .filter(product => product.plan === resolvedKey)
      .sort((a, b) => quarterRank(b) - quarterRank(a))[0] || null;
  }

  function contactFallback(plan, report, reportSlug, resolvedPlanKey) {
    const parts = ['Sherlock Research'];
    if (report && report.name) parts.push(report.name);
    if (plan && plan.name) parts.push(plan.name);
    parts.push('purchase');
    const params = new URLSearchParams();
    params.set('subject', parts.join(' '));
    if (reportSlug) params.set('industry', reportSlug);
    if (resolvedPlanKey) params.set('plan', resolvedPlanKey);
    if (report && report.status) params.set('status', report.status);
    return '/contact?' + params.toString();
  }

  function checkoutUrl(key, slug) {
    if (!catalog) return '#';

    const resolvedKey = planKey(key);
    const plan = planFor(resolvedKey);
    const reportSlug = slug || pageReportSlug() || catalog.defaultReportSlug;
    const report = reportFor(reportSlug);
    const product = productFor(resolvedKey, reportSlug);
    const productUrl = product ? product.checkoutUrl : '';
    const reportCheckout = report && report.checkout;
    const reportUrl = reportCheckout ? reportCheckout[resolvedKey] : '';
    const planUrl = plan ? plan.checkoutUrl : '';
    const url = productUrl || reportUrl || planUrl || '';

    if (isCheckoutUrl(url)) return url;

    return contactFallback(plan, report, reportSlug, resolvedKey);
  }

  function applyCheckoutLink(link, key, slug) {
    if (!link || !catalog) return;

    const resolvedKey = planKey(key || link.dataset.checkoutPlan);
    const resolvedSlug = slug || link.dataset.reportSlug || pageReportSlug() || catalog.defaultReportSlug;
    const url = checkoutUrl(resolvedKey, resolvedSlug);

    link.dataset.checkoutPlan = resolvedKey;
    if (resolvedSlug) link.dataset.reportSlug = resolvedSlug;
    link.href = url;

    if (isCheckoutUrl(url)) {
      if (/^https:\/\//i.test(url) && !link.classList.contains('payhip-buy-button')) {
        link.target = '_blank';
        link.rel = 'noopener';
      } else {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
      link.dataset.checkoutState = 'checkout';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.dataset.checkoutState = 'contact';
    }
  }

  function wireCheckoutLinks(root) {
    if (!catalog) return;
    (root || document).querySelectorAll('[data-checkout-plan]').forEach(link => {
      applyCheckoutLink(link);
    });
  }

  window.SherlockCheckout = {
    applyLink: applyCheckoutLink,
    checkoutUrl: checkoutUrl,
    planFor: planFor,
    productFor: productFor,
    reportFor: reportFor,
    wireLinks: wireCheckoutLinks
  };

  wireCheckoutLinks(document);

  function carouselPageSize() {
    return 4;
  }

  function initReportCarousel(grid) {
    const section = grid.closest('.reports-section') || document;
    const prev = section.querySelector('[data-report-prev]');
    const next = section.querySelector('[data-report-next]');
    const label = section.querySelector('[data-report-page-label]');
    const dots = section.querySelector('[data-report-dots]');
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.report-card'));
    if (!prev || !next || !label || !cards.length) return;

    let index = 0;

    function updateIndex() {
      index = Math.min(index, maxStart());
    }

    function maxStart() {
      return Math.max(0, cards.length - carouselPageSize());
    }

    function pageStarts() {
      const pageSize = carouselPageSize();
      const max = maxStart();
      const starts = [];
      for (let i = 0; i < cards.length; i += pageSize) {
        starts.push(Math.min(i, max));
      }
      return starts.filter((value, startIndex) => starts.indexOf(value) === startIndex);
    }

    function renderDots() {
      if (!dots) return;
      dots.innerHTML = '';
      pageStarts().forEach((start, pageIndex) => {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (start === index ? ' active' : '');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show report set ' + (pageIndex + 1));
        dot.addEventListener('click', function () {
          index = start;
          render();
        });
        dots.appendChild(dot);
      });
    }

    function render() {
      updateIndex();
      const pageSize = carouselPageSize();
      const end = Math.min(index + pageSize, cards.length);
      grid.replaceChildren.apply(grid, cards.slice(index, end));
      label.textContent = 'Showing ' + (index + 1) + '-' + end + ' of ' + cards.length;
      renderDots();
    }

    prev.addEventListener('click', function () {
      index = index === 0 ? maxStart() : Math.max(0, index - carouselPageSize());
      render();
    });

    next.addEventListener('click', function () {
      index = index >= maxStart() ? 0 : Math.min(maxStart(), index + carouselPageSize());
      render();
    });

    window.addEventListener('resize', render);
    render();
  }

  document.querySelectorAll('[data-report-carousel]').forEach(initReportCarousel);

  function track(eventName, detail) {
    if (!eventName) return;
    if (typeof window.plausible === 'function') window.plausible(eventName, { props: detail || {} });
    if (typeof window.gtag === 'function') window.gtag('event', eventName, detail || {});
    window.dispatchEvent(new CustomEvent('sherlock:analytics', { detail: Object.assign({ event: eventName }, detail || {}) }));
  }

  document.addEventListener('click', function (event) {
    const link = event.target.closest('[data-analytics-event], [data-checkout-plan]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const reportSlug = link.dataset.reportSlug || pageReportSlug() || '';
    const plan = link.dataset.checkoutPlan || '';
    track(link.dataset.analyticsEvent || 'checkout_cta', {
      href: href,
      reportSlug: reportSlug,
      plan: plan,
      checkoutState: link.dataset.checkoutState || ''
    });

    if (!isDynamicCheckoutUrl(href)) return;
    event.preventDefault();
    startDynamicCheckout(link, { reportSlug: reportSlug, plan: plan });
  });

  async function startDynamicCheckout(link, detail) {
    const originalText = link.textContent;
    link.setAttribute('aria-disabled', 'true');
    link.dataset.checkoutBusy = 'true';
    link.textContent = 'Opening checkout...';

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: detail.reportSlug,
          plan: detail.plan || 'single'
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409 && payload.contactUrl) {
        window.location.assign(payload.contactUrl);
        return;
      }
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Checkout is unavailable.');
      window.location.assign(payload.url);
    } catch (error) {
      const fallback = contactFallback(planFor(detail.plan), reportFor(detail.reportSlug), detail.reportSlug, detail.plan);
      window.location.assign(fallback);
    } finally {
      link.removeAttribute('aria-disabled');
      delete link.dataset.checkoutBusy;
      link.textContent = originalText;
    }
  }

  document.querySelectorAll('[data-lead-form]').forEach(form => {
    const note = form.querySelector('[data-form-note]');
    const submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (note) note.textContent = 'Sending...';
      if (submit) submit.disabled = true;
      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to send right now.');
        if (note) note.textContent = 'Received. Check your inbox for the Sherlock follow-up.';
        form.reset();
        track('lead_form_submit', { industry: data.industry || '', plan: data.plan || '', source: data.source || '' });
      } catch (error) {
        if (note) note.innerHTML = 'Could not send automatically. Email <a href="mailto:hello@sherlockreports.com">hello@sherlockreports.com</a>.';
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });

  /* dynamic copyright year */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* mobile menu */
  const burger = document.getElementById('burger');
  const mm = document.getElementById('mobileMenu');
  if (burger && mm) {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mobileMenu');
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mm.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      mm.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* dropdown ARIA */
  document.querySelectorAll('.nav-item > button').forEach(btn => {
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    const item = btn.parentElement;
    const sync = () => {
      const open = item.matches(':hover, :focus-within');
      btn.setAttribute('aria-expanded', String(open));
    };
    item.addEventListener('mouseenter', sync);
    item.addEventListener('mouseleave', sync);
    item.addEventListener('focusin', sync);
    item.addEventListener('focusout', sync);
  });

  /* reveal on scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (Math.min(i, 4) * 70) + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* faq.html accordion (one open at a time) */
  document.querySelectorAll('.faq-q').forEach(q => {
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-expanded', 'false');
    const open = () => {
      const item = q.parentElement;
      const ans = item.querySelector('.faq-a');
      if (!ans) return;
      const isOpen = ans.classList.contains('open');
      document.querySelectorAll('.faq-a.open').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-q.open').forEach(b => {
        b.classList.remove('open');
        b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        q.classList.add('open');
        ans.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    };
    q.addEventListener('click', open);
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  /* faq.html category filter */
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      document.querySelectorAll('.faq-item').forEach(item => {
        const cats = (item.dataset.cat || '').split(',');
        item.style.display = cats.includes(cat) ? 'block' : 'none';
      });
    });
  });

  /* pricing.html accordion (.qa with .q and .a children) */
  document.querySelectorAll('.qa .q').forEach(q => {
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.qa.open').forEach(o => {
        o.classList.remove('open');
        const head = o.querySelector('.q');
        if (head) head.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* report.html data tabs (click-through chart explorer) */
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = Array.prototype.slice.call(group.querySelectorAll('[data-tab]'));
    const panels = Array.prototype.slice.call(group.querySelectorAll('[data-panel]'));
    function activate(key) {
      tabs.forEach(t => {
        const on = t.dataset.tab === key;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === key));
    }
    tabs.forEach(t => {
      t.addEventListener('click', () => activate(t.dataset.tab));
      t.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(t.dataset.tab); }
      });
    });
  });
})();
