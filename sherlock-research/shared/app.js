(function(){
  'use strict';

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
