/* ============================================================
   ELEVATE AGENCY — Roster modal + genre filter
   Cards are server-rendered by Eleventy; data comes from the
   #roster-data JSON the page embeds. This file only handles
   the detail modal and the genre filtering.
   ============================================================ */
(function () {
  'use strict';

  // Read the embedded roster data into a slug -> dj map
  let BY_SLUG = {};
  function loadData() {
    const el = document.getElementById('roster-data');
    if (!el) return [];
    let list = [];
    try { list = JSON.parse(el.textContent || '[]'); } catch (e) { list = []; }
    BY_SLUG = {};
    list.forEach((dj) => { BY_SLUG[dj.slug] = dj; });
    return list;
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Modal ---------- */
  let modal, lastFocus;
  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal__scrim" data-close></div>
      <div class="modal__card" role="document">
        <button class="modal__close" data-close aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
        <div class="modal__media"><img alt="" id="mModalImg"></div>
        <div class="modal__body">
          <span class="modal__role" id="mRole"></span>
          <h2 class="modal__name" id="mName"></h2>
          <p class="modal__base"><span id="mBase"></span></p>
          <p class="modal__bio" id="mBio"></p>
          <div class="modal__tags" id="mTags"></div>
          <div class="modal__meta" id="mMeta"></div>
          <a class="btn btn--block" id="mBook" data-magnetic="0.2" href="/contact/"><span id="mBookLabel"></span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M5 3h8v8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') trap(e);
    });
  }
  function trap(e) {
    const f = modal.querySelectorAll('a[href],button:not([disabled])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function open(dj) {
    if (!dj) return;
    buildModal();
    lastFocus = document.activeElement;
    modal.querySelector('#mModalImg').src = dj.photo;
    modal.querySelector('#mModalImg').alt = dj.name;
    modal.querySelector('#mRole').textContent = dj.role + (dj.available ? ' · Available' : ' · Booked out');
    modal.querySelector('#mName').textContent = dj.name;
    modal.querySelector('#mBase').textContent = '📍 ' + dj.base;
    modal.querySelector('#mBio').textContent = dj.bio;
    modal.querySelector('#mTags').innerHTML = (dj.genres || []).map((g) => `<span class="tag">${esc(g)}</span>`).join('');
    modal.querySelector('#mMeta').innerHTML = [
      ['Residency', dj.residency], ['Known for', dj.signature], ['Find them', dj.socials],
    ].map(([k, v]) => `<div class="row"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('');
    modal.querySelector('#mBookLabel').textContent = 'Book ' + dj.name;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.modal__close').focus(), 50);
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Wire cards + filters ---------- */
  function wireCards(scope) {
    scope.querySelectorAll('.artist[data-slug]').forEach((el) => {
      el.addEventListener('click', () => open(BY_SLUG[el.dataset.slug]));
    });
  }

  function initFilters(full) {
    const filterWrap = document.querySelector('[data-filters]');
    if (!filterWrap) return;
    const cards = Array.from(full.querySelectorAll('.artist'));
    const all = new Set();
    cards.forEach((c) => (c.dataset.genres || '').split(',').filter(Boolean).forEach((g) => all.add(g)));
    const genres = ['All', ...Array.from(all).sort()];
    filterWrap.innerHTML = genres
      .map((g, i) => `<button class="chip${i === 0 ? ' is-active' : ''}" data-genre="${esc(g)}">${esc(g)}</button>`)
      .join('');
    filterWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filterWrap.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      const g = chip.dataset.genre;
      cards.forEach((card) => {
        const list = (card.dataset.genres || '').split(',');
        card.style.display = g === 'All' || list.includes(g) ? '' : 'none';
      });
    });
  }

  function initRoster() {
    const data = loadData();
    if (!data.length) return;
    buildModal();
    const featured = document.querySelector('[data-roster-featured]');
    if (featured) wireCards(featured);
    const full = document.querySelector('[data-roster]');
    if (full) { wireCards(full); initFilters(full); }
  }

  window.Elevate = window.Elevate || {};
  window.Elevate.initRoster = initRoster;
})();
