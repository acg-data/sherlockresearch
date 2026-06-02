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
    return /^https:\/\//i.test(url || '');
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

  function contactFallback(plan, report) {
    const parts = ['Sherlock Research'];
    if (report && report.name) parts.push(report.name);
    if (plan && plan.name) parts.push(plan.name);
    parts.push('purchase');
    return '/contact?subject=' + encodeURIComponent(parts.join(' '));
  }

  function checkoutUrl(key, slug) {
    if (!catalog) return '#';

    const resolvedKey = planKey(key);
    const plan = planFor(resolvedKey);
    const reportSlug = slug || pageReportSlug() || catalog.defaultReportSlug;
    const report = reportFor(reportSlug);
    const product = productFor(resolvedKey, reportSlug);
    const productUrl = product ? product.checkoutUrl || product.payhipUrl : '';
    const reportCheckout = report && (report.checkout || report.payhip);
    const reportUrl = reportCheckout ? reportCheckout[resolvedKey] : '';
    const planUrl = plan ? plan.checkoutUrl || plan.payhipUrl : '';
    const url = productUrl || reportUrl || planUrl || '';

    return isCheckoutUrl(url) ? url : contactFallback(plan, report);
  }

  function applyCheckoutLink(link, key, slug) {
    if (!link || !catalog) return;

    const resolvedKey = planKey(key || link.dataset.checkoutPlan || link.dataset.payhipPlan);
    const resolvedSlug = slug || link.dataset.reportSlug || pageReportSlug() || catalog.defaultReportSlug;
    const url = checkoutUrl(resolvedKey, resolvedSlug);

    link.dataset.checkoutPlan = resolvedKey;
    link.removeAttribute('data-payhip-plan');
    if (resolvedSlug) link.dataset.reportSlug = resolvedSlug;
    link.href = url;

    if (isCheckoutUrl(url)) {
      link.target = '_blank';
      link.rel = 'noopener';
      link.dataset.checkoutState = 'checkout';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.dataset.checkoutState = 'contact';
    }
  }

  function wireCheckoutLinks(root) {
    if (!catalog) return;
    (root || document).querySelectorAll('[data-checkout-plan], [data-payhip-plan]').forEach(link => {
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
})();
