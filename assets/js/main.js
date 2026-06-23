/* ============================================================
   ELEVATE AGENCY — Interaction layer (vanilla, no deps)
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Preloader ---------- */
  function preloader() {
    const pl = $('.preloader');
    if (!pl) return;
    const done = () => pl.classList.add('is-done');
    window.addEventListener('load', () => setTimeout(done, 650));
    setTimeout(done, 2200); // safety net
  }

  /* ---------- Nav scroll + mobile menu ---------- */
  function nav() {
    const bar = $('.nav');
    if (bar) {
      const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    const burger = $('.nav-burger');
    const menu = $('.mobile-menu');
    if (burger && menu) {
      const toggle = (open) => {
        const willOpen = open ?? !document.body.classList.contains('menu-open');
        document.body.classList.toggle('menu-open', willOpen);
        burger.setAttribute('aria-expanded', String(willOpen));
      };
      burger.addEventListener('click', () => toggle());
      $$('a', menu).forEach((a) => a.addEventListener('click', () => toggle(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    }
  }

  /* ---------- Hero entrance (home .hero + sub-page .pagehero) ---------- */
  function hero() {
    const els = $$('.hero, .pagehero');
    if (!els.length) return;
    setTimeout(() => els.forEach((e) => e.classList.add('is-ready')), 60);
    // safety net: never leave headings stuck hidden
    setTimeout(() => $$('[data-hero]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; }), 1600);
  }

  /* ---------- Scroll reveal ---------- */
  function reveal() {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Count up ---------- */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      if (reduce) { el.textContent = target + suffix; return; }
      let start = null;
      const step = (t) => {
        if (!start) start = t;
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Marquee (seamless) ---------- */
  function marquee() {
    $$('.marquee__track').forEach((track) => {
      track.setAttribute('aria-hidden', 'false');
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.parentElement.appendChild(clone);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function magnetic() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.32;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * strength}px,${my * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Tilt ---------- */
  function tilt() {
    if (!fine || reduce) return;
    $$('[data-tilt]').forEach((el) => {
      const max = 8;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Hero parallax ---------- */
  function parallax() {
    if (reduce) return;
    const layers = $$('[data-parallax]');
    if (!layers.length) return;
    let ticking = false;
    const apply = () => {
      const y = window.scrollY;
      layers.forEach((l) => {
        const speed = parseFloat(l.dataset.parallax) || 0.2;
        l.style.transform = `translate3d(0, ${y * speed}px, 0) scale(${l.classList.contains('hero__bg') ? 1.12 : 1})`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
  }

  /* ---------- Contact: audience toggle + form ---------- */
  function contact() {
    const toggle = $('.toggle');
    if (toggle) {
      const pill = $('.toggle__pill', toggle);
      const btns = $$('button', toggle);
      const setPill = (btn) => { if (pill) { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`; } };
      const select = (btn) => {
        btns.forEach((b) => b.classList.toggle('is-active', b === btn));
        setPill(btn);
        const role = btn.dataset.role;
        document.body.dataset.audience = role;
        const ph = $('#message');
        if (role === 'venue') {
          if (ph) ph.placeholder = 'which venue, what kind of night, dates you’re looking at…';
        } else {
          if (ph) ph.placeholder = 'where you play, your style, links to a mix or soundcloud…';
        }
      };
      btns.forEach((b) => b.addEventListener('click', () => select(b)));
      const active = $('button.is-active', toggle) || btns[0];
      if (active) select(active);
      window.addEventListener('resize', () => { const a = $('button.is-active', toggle); if (a) setPill(a); });
    }
    const form = $('.form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        form.classList.add('is-sent');
        const btn = $('button[type="submit"]', form);
        if (btn) { btn.textContent = 'Message sent ✓'; btn.disabled = true; }
      });
    }
  }

  /* ---------- init ---------- */
  function init() {
    document.body.classList.add('grain');
    preloader(); nav(); hero(); reveal(); counters();
    marquee(); magnetic(); tilt(); parallax(); contact();
    if (window.Elevate && typeof window.Elevate.initRoster === 'function') {
      window.Elevate.initRoster();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
