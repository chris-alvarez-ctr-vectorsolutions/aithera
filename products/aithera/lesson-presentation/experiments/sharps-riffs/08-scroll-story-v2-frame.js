/* Riff 08 · V2 — course-frame preview.
   The article is built to fill the screen. This toggle shows it inside the real course chrome (the white
   function bar and blue title band from css/frame.css, plus a Back / Continue footer like the one the CLARA
   Sharps module uses) so the two can be compared. The article loads in an iframe with ?embed=1, which hides its
   own top bar and gives it the smaller viewport, so every pinned scene and 100vh measurement adapts by itself.
   Nothing here changes the article; turning the toggle off just hides the frame. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (root.classList.contains('embed')) return;            // the article inside the frame never builds another frame
  const $ = (s, r = document) => r.querySelector(s);
  const btn = $('#chromeBtn');
  if (!btn) return;

  const IDS = ['top', 's1', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];   // chapters, in order (s8 and s9 open after the activity)
  const COURSE = 'Bloodborne Pathogens', LESSON = 'The Next Pair of Hands';
  let host = null, view = null, doc = null, built = false, back, next, count, fill, rafId = 0;

  const addEl = (tag, attrs) => { const e = document.createElement(tag); Object.assign(e, attrs); document.head.appendChild(e); return e; };

  const chapters = () => IDS.map(id => doc && doc.getElementById(id)).map((el, i) => ({ el, i })).filter(c => c.el && c.el.offsetParent !== null);
  const current = () => {
    const win = view.contentWindow, line = win.innerHeight * .4;
    let cur = chapters()[0];
    chapters().forEach(c => { if (c.el.getBoundingClientRect().top <= line) cur = c; });
    return cur;
  };
  const refresh = () => {
    if (!doc) return;
    const cur = current(); if (!cur) return;
    const list = chapters(), at = list.findIndex(c => c.i === cur.i), locked = doc.body.classList.contains('locked');
    count.textContent = 'Section ' + (cur.i + 1) + ' of ' + IDS.length;
    fill.style.width = ((cur.i + 1) / IDS.length * 100) + '%';
    back.disabled = at <= 0;
    const last = at >= list.length - 1, gate = locked && cur.el.id === 's7';
    next.disabled = last || gate;
    next.title = gate ? 'Complete the activity to continue' : '';
  };
  const go = (dir) => {
    const list = chapters(), now = current(), at = list.findIndex(c => c.i === now.i), to = list[at + dir];
    if (to) to.el.scrollIntoView({ behavior: doc.documentElement.classList.contains('rm') ? 'auto' : 'smooth', block: 'start' });
  };
  const tick = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(refresh); };

  /* review controls that normally live in the article's own top bar ride in the blue band instead */
  const press = (id) => () => { const b = doc && doc.getElementById(id); if (b) b.click(); };

  const build = () => {
    host = document.createElement('div');
    host.id = 'chromeHost'; host.hidden = true;
    document.body.appendChild(host);
    addEl('link', { rel: 'stylesheet', href: '../../../../../assets/fontawesome/css/all.min.css' });
    addEl('link', { rel: 'stylesheet', href: '../../css/frame.css?v=6' });
    window.LESSON_FRAME = { course: COURSE, lesson: LESSON, step: '', progress: null, mount: host, onBack: () => toggle(false) };
    const s = addEl('script', { src: '../../js/frame.js?v=7' });
    const finish = () => {
      const actions = $('#vtActions', host);
      const mk = (label, icon, fn) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
      mk('After an exposure', 'fa-kit-medical', press('expoBtn'));
      /* the review options sit behind one button, like the article's own top bar */
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
      view.src = location.pathname + '?embed=1';
      host.appendChild(view);

      const foot = document.createElement('footer');
      foot.className = 'cf-foot';
      foot.innerHTML =
        '<div class="cf-meta"><span class="cf-count">Section 1 of ' + IDS.length + '</span><span class="cf-bar"><i></i></span></div>' +
        '<div class="cf-nav"><button class="cf-btn cf-ghost" type="button"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<button class="cf-btn cf-pri" type="button">Continue <i class="fa-solid fa-arrow-right"></i></button></div>';
      host.appendChild(foot);
      count = $('.cf-count', foot); fill = $('.cf-bar i', foot);
      [back, next] = foot.querySelectorAll('.cf-btn');
      back.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));

      view.addEventListener('load', () => {
        doc = view.contentDocument;
        view.contentWindow.addEventListener('scroll', tick, { passive: true });
        new view.contentWindow.MutationObserver(tick).observe(doc.body, { attributes: true, attributeFilter: ['class'] });   // the activity unlocking
        refresh();
      });
    };
    // frame.js builds on DOMContentLoaded when the page is still loading (e.g. opened with ?frame=1), so wait for that
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
