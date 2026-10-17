// Sherlock Research: shared behaviour for the site nav (mobile menu + Reports dropdown).
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var menuBtn = nav.querySelector('.nav-toggle');
  var subItem = nav.querySelector('.nav-item');
  var subBtn = subItem && subItem.querySelector('.nav-sub-toggle');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function setSub(open) {
    subItem.classList.toggle('open', open);
    subBtn.setAttribute('aria-expanded', String(open));
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!nav.classList.contains('open'));
    });
    // Close after choosing a link (same-page anchors otherwise leave the panel open).
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  if (subBtn) {
    subBtn.addEventListener('click', function () {
      setSub(!subItem.classList.contains('open'));
    });
    subItem.addEventListener('focusout', function (e) {
      if (!subItem.contains(e.relatedTarget)) setSub(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (subItem && subItem.classList.contains('open')) { setSub(false); subBtn.focus(); }
    else if (nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  document.addEventListener('click', function (e) {
    if (subItem && subItem.classList.contains('open') && !subItem.contains(e.target)) setSub(false);
  });
})();

// Scroll reveal for cards and section headings. Only elements that start below the fold are
// hidden, siblings are staggered, and nothing animates for reduced-motion users.
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var selector = [
    '.section-title', '.section-head', '.problem-head', '.library-head', '.compare-head',
    '.problem-card', '.module', '.lib-card', '.how-step', '.price-card', '.method-card', '.quote-card',
    '.opt-card', '.rep-card', '.why-card', '.insight-c', '.toc-item', '.who-card',
    '.report-card', '.city-card', '.value-card', '.tl-item', '.content-card', '.guarantee-inner', '.chart-bar'
  ].join(',');
  var fold = window.innerHeight;
  var items = Array.prototype.filter.call(document.querySelectorAll(selector), function (el) {
    return el.getBoundingClientRect().top > fold && !el.closest('.nav, .site-footer');
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      observer.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (s) { return s.matches(selector); });
    var index = Math.min(siblings.indexOf(el), 5);
    var cls = el.matches('.chart-bar') ? 'grow' : 'reveal';
    el.style.setProperty('--reveal-delay', (index * 70) + 'ms');
    el.classList.add(cls);
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || !el.classList.contains('is-in')) return;
      el.classList.remove(cls, 'is-in');
      el.style.removeProperty('--reveal-delay');
      el.removeEventListener('transitionend', done);
    });
    observer.observe(el);
  });
})();

// Homepage report finder: go straight to the chosen report, with the metro preselected.
(function () {
  var form = document.querySelector('[data-finder]');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var industry = form.elements.industry.value;
    var metro = form.elements.metro.value;
    location.href = '/' + industry + '-report' + (metro ? '?plan=city&metro=' + encodeURIComponent(metro) + '#purchase' : '');
  });
})();
