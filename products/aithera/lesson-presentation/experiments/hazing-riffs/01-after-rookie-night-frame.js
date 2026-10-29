/* Hazing riff 01 — course-frame preview (adapted from sharps-riffs/08-scroll-story-v2-frame.js).
   Shows the article inside the real course chrome (css/frame.css) with a Back / Continue footer that walks
   its chapters. The article loads in an iframe with ?embed=1 and keeps the page's pre-check params, so the
   same cut plays in the frame. Continue waits on the "Your turn" activity, as in the Sharps module. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (root.classList.contains('embed')) return;
  const $ = (s, r = document) => r.querySelector(s);
  const btn = $('#chromeBtn');
  if (!btn) return;

  // chapters in order; ones not in this learner's cut are hidden and skipped
  const IDS = ['top', 's1', 's2', 'k1', 's1r', 's1b', 's3', 'k2', 's4', 'f1', 's4r', 's5', 's6', 's7'];
  const GATE = 's5';
  const COURSE = 'Hazing Awareness and Prevention', LESSON = 'After Rookie Night';
  let host = null, view = null, doc = null, built = false, back, next, count, fill, rafId = 0;
  const addEl = (tag, attrs) => { const e = document.createElement(tag); Object.assign(e, attrs); document.head.appendChild(e); return e; };

  const chapters = () => IDS.map(id => doc && doc.getElementById(id)).filter(el => el && el.offsetParent !== null);
  // the count includes chapters held back for now (keypad, triage, "Your turn"), so the total doesn't jump when they open
  const planned = () => IDS.map(id => doc && doc.getElementById(id)).filter(el => el && !el.closest('[hidden]'));
  const current = () => {
    const line = view.contentWindow.innerHeight * .4, list = chapters();
    let cur = list[0];
    list.forEach(el => { if (el.getBoundingClientRect().top <= line) cur = el; });
    return cur;
  };
  const refresh = () => {
    if (!doc) return;
    const list = chapters(), cur = current(); if (!cur) return;
    const at = list.indexOf(cur), locked = doc.body.classList.contains('locked');
    const all = planned(), n = all.indexOf(cur) + 1;
    count.textContent = 'Section ' + n + ' of ' + all.length;
    fill.style.width = (n / all.length * 100) + '%';
    back.disabled = at <= 0;
    const gate = (locked && cur.id === GATE) || (doc.body.classList.contains('holding') && at === list.length - 1);
    next.disabled = at >= list.length - 1 || gate;
    next.title = gate ? 'Complete the activity to continue' : '';
  };
  const go = (dir) => {
    const list = chapters(), to = list[list.indexOf(current()) + dir];
    if (to) to.scrollIntoView({ behavior: doc.documentElement.classList.contains('rm') ? 'auto' : 'smooth', block: 'start' });
  };
  const tick = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(refresh); };
  const press = (id) => () => { const b = doc && doc.getElementById(id); if (b) b.click(); };

  const build = () => {
    host = document.createElement('div');
    host.id = 'chromeHost'; host.hidden = true;
    document.body.appendChild(host);
    addEl('link', { rel: 'stylesheet', href: '../../css/frame.css?v=6' });
    window.LESSON_FRAME = { course: COURSE, lesson: LESSON, step: '', progress: null, mount: host, onBack: () => toggle(false) };
    const s = addEl('script', { src: '../../js/frame.js?v=7' });
    const finish = () => {
      const actions = $('#vtActions', host);
      const mk = (label, icon, fn) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
      mk('Someone in danger?', 'fa-truck-medical', press('expoBtn'));
      const wrap = document.createElement('div'); wrap.className = 'cf-tools';
      const gear = document.createElement('button'); gear.type = 'button'; gear.className = 'cf-gear'; gear.setAttribute('aria-haspopup', 'true'); gear.setAttribute('aria-expanded', 'false'); gear.setAttribute('aria-label', 'Options');
      gear.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i>';
      const menu = document.createElement('div'); menu.className = 'cf-menu'; menu.hidden = true; menu.setAttribute('role', 'menu');
      const item = (label, id) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cf-mi'; b.setAttribute('role', 'menuitemcheckbox'); b.dataset.id = id; b.innerHTML = '<span>' + label + '</span><i></i>'; b.addEventListener('click', () => { press(id)(); setTimeout(sync, 0); }); menu.appendChild(b); return b; };
      item('Reduce motion', 'rmBtn'); item('Review marks', 'tagBtn');
      const exit = document.createElement('button'); exit.type = 'button'; exit.className = 'cf-mi'; exit.innerHTML = '<span>Exit course frame</span><i class="fa-solid fa-xmark cf-x"></i>'; exit.addEventListener('click', () => toggle(false)); menu.appendChild(exit);
      const sync = () => menu.querySelectorAll('[data-id]').forEach(b => { const t = doc && doc.getElementById(b.dataset.id); b.setAttribute('aria-pressed', t ? t.getAttribute('aria-pressed') : 'false'); });
      const setMenu = (open) => { menu.hidden = !open; gear.setAttribute('aria-expanded', String(open)); if (open) sync(); };
      gear.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
      document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
      wrap.append(gear, menu); actions.appendChild(wrap);

      view = document.createElement('iframe');
      view.className = 'cf-view'; view.title = 'Article, shown inside the course frame';
      const u = new URL(location.href); u.searchParams.delete('frame'); u.searchParams.set('embed', '1'); u.hash = '';
      view.src = u.pathname + u.search;
      host.appendChild(view);

      const foot = document.createElement('footer');
      foot.className = 'cf-foot';
      foot.innerHTML =
        '<div class="cf-meta"><span class="cf-count">Section 1</span><span class="cf-bar"><i></i></span></div>' +
        '<div class="cf-nav"><button class="cf-btn cf-ghost" type="button"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<button class="cf-btn cf-pri" type="button">Continue <i class="fa-solid fa-arrow-right"></i></button></div>';
      host.appendChild(foot);
      count = $('.cf-count', foot); fill = $('.cf-bar i', foot);
      [back, next] = foot.querySelectorAll('.cf-btn');
      back.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));

      view.addEventListener('load', () => {
        doc = view.contentDocument;
        view.contentWindow.addEventListener('scroll', tick, { passive: true });
        new view.contentWindow.MutationObserver(tick).observe(doc.body, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true });
        refresh();
      });
    };
    s.onload = () => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(finish)); else finish(); };
    built = true;
  };

  function toggle(on) {
    if (on === undefined) on = !root.classList.contains('in-chrome');
    if (on && !built) build();
    root.classList.toggle('in-chrome', on);
    btn.setAttribute('aria-pressed', String(on));
    if (host) host.hidden = !on;
    if (on) tick();
    try { const u = new URL(location.href); on ? u.searchParams.set('frame', '1') : u.searchParams.delete('frame'); history.replaceState(null, '', u); } catch (e) {}
  }
  btn.addEventListener('click', () => toggle());
  if (/[?&]frame=1/.test(location.search)) toggle(true);
})();
