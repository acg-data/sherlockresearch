// Sherlock Research: report pages. Shows the sticky buy bar once the hero has
// scrolled away, and hides it while the purchase section is on screen.
(function () {
  var bar = document.getElementById('stickyBuy');
  var hero = document.querySelector('.hero');
  var purchase = document.getElementById('purchase');
  if (!bar || !hero || !purchase || !('IntersectionObserver' in window)) return;

  var heroVisible = true;
  var purchaseVisible = false;

  function update() {
    var show = !heroVisible && !purchaseVisible;
    bar.classList.toggle('show', show);
    bar.toggleAttribute('inert', !show);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.target === hero) heroVisible = e.isIntersecting;
      if (e.target === purchase) purchaseVisible = e.isIntersecting;
    });
    update();
  });
  observer.observe(hero);
  observer.observe(purchase);

  update();
})();
