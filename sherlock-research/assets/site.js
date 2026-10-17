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
