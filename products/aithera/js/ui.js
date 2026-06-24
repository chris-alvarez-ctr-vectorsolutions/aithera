// ui.js — shared component primitives.
//
// Every view imports from here so visual changes propagate everywhere by
// editing a single function. Each helper returns an HTMLElement (or a
// DocumentFragment) — never a string — so callers can attach handlers
// and append directly without re-parsing.
//
// Naming convention:
//   primitives:  tag, progressBar, sectionHeader
//   blocks:      hero, statTile, statusPanel, alertStrip, rowCard,
//                coachMessage, coachPrompt, courseTile, primaryCta

import { isAtLeast } from './phase.js';
import { store } from './store.js';

// Urgency signals (Required badges, mandate footnotes, deadline chips)
// enter the experience in Phase 4 — pre-Phase 4 the catalog reads as
// recommendations only, so the baseline doesn't promise urgency the
// Home screen isn't surfacing yet.
function urgencyVisible() { return isAtLeast(4); }

const SVG = {
  play:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  users:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 19c0-2 2-4 4-4s4 1 4 3"/></svg>`,
  clock:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 3h6"/></svg>`,
  bolt:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,
  star:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63L22 9.24l-5.46 4.73 1.64 7.03z"/></svg>`,
  shield:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>`,
  flag:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/></svg>`,
  warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.6" fill="currentColor"/></svg>`,
  doc:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  kebab:   `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 14l.8 2 2 .8-2 .8L19 19.6l-.8-1.8-2-.8 2-.8L19 14z"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9v6h4l5 4V5L9 9H5z"/><path d="M17 8a5 5 0 010 8"/><path d="M19.5 5.5a8 8 0 010 13"/></svg>`,
  list:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><circle cx="4" cy="6"  r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 00-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a6 6 0 00-4-10z"/></svg>`,
  chat:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-12 7l-5 1 1-5a8 8 0 1116-3z"/></svg>`,
  note:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`,
  wrench:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 105.6 5.6l-2.2-2.2 1.6-1.6 2.2 2.2a6 6 0 11-8.8-8.8l2.2 2.2-1.6 1.6-2.2-2.2a4 4 0 003.2 3.2z" transform="rotate(-25 12 12)"/><path d="M3 21l6-6"/></svg>`,
  check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>`,
  circle:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v5h1"/></svg>`,
  brain:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4a3 3 0 00-3 3v1a3 3 0 00-1 6 3 3 0 003 3v1a3 3 0 003 3 3 3 0 003-3v-1a3 3 0 003-3 3 3 0 00-1-6V7a3 3 0 00-3-3 3 3 0 00-2 1 3 3 0 00-2-1z"/></svg>`,
  mic:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>`,
  trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/></svg>`,
  retry:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>`,
  send:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>`,
  paperclip:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12l-9 9a5 5 0 11-7-7l9-9a3 3 0 114 4l-9 9a1.5 1.5 0 11-2-2l8-8"/></svg>`,
  heart:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 7C19 16.5 12 21 12 21z"/></svg>`,
  lungs:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10"/><path d="M9 7c-3 1-5 4-5 8 0 3 2 4 4 4s2-2 2-4V8"/><path d="M15 7c3 1 5 4 5 8 0 3-2 4-4 4s-2-2-2-4V8"/></svg>`,
  pause:   `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  radio:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="2"/><path d="M7 9a7 7 0 0110 0"/><path d="M5 7a10 10 0 0114 0"/><path d="M9 11a4 4 0 016 0"/></svg>`,
  close:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
};

// ---------- tiny element factory ----------
export function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'on') for (const [evt, fn] of Object.entries(v)) e.addEventListener(evt, fn);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'href' || k.startsWith('aria-') || k.startsWith('data-')) e.setAttribute(k, v);
    else e[k] = v;
  }
  for (const c of children.flat()) {
    if (c == null || c === false || c === '') continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

// ---------- primitives ----------
export function icon(name, opts = {}) {
  const span = el('span', { class: `i ${opts.class || ''}`, 'aria-hidden': 'true' });
  span.innerHTML = SVG[name] || '';
  return span;
}

export function tag(label, variant = '') {
  return el('span', { class: `tag ${variant}` }, label);
}

export function progressBar(percent) {
  const p = el('div', { class: 'progress' });
  p.innerHTML = `<span style="width:${Math.max(0, Math.min(100, percent))}%"></span>`;
  return p;
}

// courseProgressStrip — segmented bar showing course-level lesson
// progress. Lives at the top of every lesson screen so the learner
// always knows which lesson of N they're on, independent of the
// within-lesson Watch/Learn/Check step indicator below.
export function courseProgressStrip({ total, currentIndex, completed = currentIndex, label }) {
  const wrap = el('div', { class: 'course-strip' });
  if (label) wrap.appendChild(el('div', { class: 'cs-label' }, label));
  const bar = el('div', { class: 'cs-bar' });
  for (let i = 0; i < total; i++) {
    const cls = i < completed ? 'done' : i === currentIndex ? 'cur' : '';
    bar.appendChild(el('span', { class: `cs-seg ${cls}` }));
  }
  wrap.appendChild(bar);
  return wrap;
}

export function sectionHeader(label, link) {
  return el('div', { class: 'section-h' },
    el('h2', null, label),
    link ? el('a', { href: link }, 'View all') : null
  );
}

// ---------- blocks ----------

// brandLogo — Aithera mark + wordmark for the home app bar.
export function brandLogo() {
  const wrap = el('div', { class: 'brand' });
  wrap.innerHTML = `
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="aith-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="var(--accent)"/>
            <stop offset="1" stop-color="var(--accent-2)"/>
          </linearGradient>
        </defs>
        <path d="M16 3.5c-1.4 0-2.6.8-3.2 2L4.6 22.7c-.7 1.5.4 3.3 2.1 3.3h3.1c1 0 1.9-.6 2.2-1.5l.6-1.7h7l.6 1.7c.3.9 1.2 1.5 2.2 1.5h3.1c1.7 0 2.8-1.8 2.1-3.3L19.2 5.5c-.6-1.2-1.8-2-3.2-2zM13.7 18.4L16 12.2l2.3 6.2h-4.6z" fill="url(#aith-g)"/>
      </svg>
    </span>
    <span class="brand-name">Aithera</span>
  `;
  return wrap;
}

// readinessCard — the home dashboard centerpiece. Band headline,
// sparkline, you-vs-peers scale, coach note, optional "what moved it"
// breakdown and refresher CTA.
//
// `band` is one of 'behind' | 'on-track' | 'ahead' and drives the
// headline + tone of the scale. `peerLevel` is the cohort average shown
// as a second pin on the scale. The precise score (`level`) is still
// used to position the YOU pin but is no longer displayed numerically.
export function readinessCard({
  level,
  band = 'on-track',
  peerLevel = 70,
  headline,
  trend = [],
  movers = [],
  coachNote,
  ctaLabel = 'Start refresher',
  ctaHref = '#/coach',
  visibleMovers = 2
}) {
  const bandMeta = {
    'behind':   { cls: 'rs-warn', headline: "Let's level up." },
    'on-track': { cls: 'rs-good', headline: "You're right with the pack." },
    'ahead':    { cls: 'rs-ahead', headline: "You're a step beyond the pack." }
  }[band] || { cls: 'rs-good', headline: "You're right with the pack." };

  const card = el('div', { class: `readiness-card r-${bandMeta.cls}` });

  // Header: kicker only — band tone is carried by the headline below
  card.appendChild(el('div', { class: 'rd-head' },
    el('span', { class: 'rd-kicker' }, 'Development level')
  ));

  // Headline (full width — the sparkline was removed in favor of the
  // clearer you-vs-peers slider below).
  card.appendChild(el('h2', { class: 'rd-headline' }, headline || bandMeta.headline));

  // You-vs-peers slider
  card.appendChild(readinessScale(level, peerLevel));
  void trend;

  // Coach note — animated in as live guidance from Coach Vic.
  if (coachNote) {
    card.appendChild(vicNote(coachNote));
  }

  // Breakdown header
  if (movers.length) {
    card.appendChild(el('hr', { class: 'rd-rule' }));
    card.appendChild(el('div', { class: 'rd-bh' },
      el('span', { class: 'rd-bh-label' }, 'Biggest movers'),
      el('span', { class: 'rd-bh-period' }, 'this month')
    ));

    const list = el('div', { class: 'rd-movers' });
    const renderMovers = (count) => {
      list.innerHTML = '';
      for (const m of movers.slice(0, count)) list.appendChild(moverRow(m));
    };
    renderMovers(visibleMovers);
    card.appendChild(list);

    if (movers.length > visibleMovers) {
      const more = el('button', { class: 'rd-viewall',
        on: { click: () => { renderMovers(movers.length); more.remove(); } } },
        `View all ${movers.length}`);
      card.appendChild(more);
    }
  }

  // CTA — omitted when ctaHref is explicitly null (e.g. early phases
  // where no refresher action is needed).
  if (ctaHref !== null) {
    card.appendChild(el('a', { class: 'btn primary block cta-large rd-cta', href: ctaHref },
      el('span', null, ctaLabel),
      icon('chevron')
    ));
  }

  return card;
}

// ---------- Coach Vic staged reveal ----------
// Shared "Vic is thinking" entrance for coach-authored content. First render
// of a given key this page load shows a pulsing mark + a shimmer "thinking"
// label at one-line height, then the container grows to fit the content as
// it fades in. Thinking is deliberately distinct from the typing dots used
// in chat surfaces: dots mean "a message is being composed", shimmer means
// "Vic is working something out". Repeat renders (back-navigation, store
// re-emits) skip straight to static; prefers-reduced-motion renders static.
const revealedNotes = new Set();
const VIC_THINK_MS = 2600;
const VIC_GROW_MS = 320;

// `root` carries the is-thinking/is-revealed classes (component CSS decides
// what they hide/animate); `body` is the position:relative element whose
// height animates and whose children are the revealed content.
function vicReveal({ root, body, label, key, thinkMs = VIC_THINK_MS }) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (revealedNotes.has(key) || reduceMotion) return;

  const thinking = el('span', { class: 'vic-think', 'aria-hidden': 'true' }, label);
  body.appendChild(thinking);
  root.classList.add('is-thinking');
  root.setAttribute('aria-busy', 'true');

  setTimeout(() => {
    // Animate the body from its one-line "thinking" height to the height
    // of the revealed content (height: auto can't be transitioned, so we
    // pin start/end pixel heights and clear them when the growth ends).
    const startH = body.offsetHeight;
    root.classList.remove('is-thinking');
    root.classList.add('is-revealed');
    root.removeAttribute('aria-busy');
    revealedNotes.add(key);

    // Measure the revealed content's layout boxes directly — scrollHeight
    // would include the fade-up animation's translateY offset and overshoot.
    const content = [...body.children].filter((c) => c !== thinking);
    const endH = Math.max(...content.map((c) => c.offsetTop + c.offsetHeight));
    body.style.height = `${startH}px`;
    body.style.overflow = 'hidden';
    // Force a style flush so the transition starts from the pinned height
    // (otherwise the browser batches the writes and jumps straight to endH).
    void body.offsetHeight;
    body.style.transition = `height ${VIC_GROW_MS}ms ease`;
    body.style.height = `${endH}px`;
    setTimeout(() => {
      body.style.height = '';
      body.style.overflow = '';
      body.style.transition = '';
      thinking.remove();
    }, VIC_GROW_MS + 80);
  }, thinkMs);
}

export function vicNote(text) {
  const mark = el('span', { class: 'rd-note-mark' });
  mark.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/><path d="M12 4v3"/><circle cx="12" cy="3.5" r="0.8" fill="currentColor"/></svg>`;

  const p = el('p', null, text);
  const body = el('div', { class: 'rd-note-body' }, p);
  const note = el('div', { class: 'rd-note' }, mark, body);
  vicReveal({ root: note, body, label: 'Coach Vic is thinking…', key: text });
  return note;
}

function moverRow(m) {
  const cls = m.direction === 'up' ? 'mv-up' : 'mv-down';
  const arrow = m.direction === 'up'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>`;
  const glyph = el('span', { class: `mv-glyph ${cls}` });
  glyph.innerHTML = arrow;
  const deltaTxt = `${m.delta > 0 ? '+' : ''}${m.delta}`;
  return el('div', { class: `mv-row ${cls}` },
    glyph,
    el('div', { class: 'mv-body' },
      el('strong', null, m.title),
      m.when ? el('small', null, m.when) : null
    ),
    el('div', { class: 'mv-delta' },
      el('span', { class: 'mv-delta-num' }, deltaTxt),
      el('span', { class: 'mv-delta-bar', 'aria-hidden': 'true' })
    )
  );
}

// You-vs-peers slider. A calm gray track with a soft blue band marking
// "where most peers are working" (a range centered on the cohort average),
// the learner's own position as a solid blue handle labeled "You", and
// plain-language end labels. Replaces the older gradient bar + pins.
function readinessScale(level, peerLevel) {
  const youPct = Math.max(3, Math.min(97, level));
  const half = 13; // peer band half-width — the cohort's working range
  const bandStart = Math.max(0, Math.min(100, peerLevel - half));
  const bandEnd   = Math.max(0, Math.min(100, peerLevel + half));

  const wrap = el('div', { class: 'rd-scale' });
  wrap.innerHTML = `
    <div class="rd-scale-track">
      <div class="rd-band" style="left:${bandStart}%; width:${bandEnd - bandStart}%"></div>
      <div class="rd-you" style="left:${youPct}%">
        <span class="rd-you-label">You</span>
      </div>
    </div>
    <div class="rd-ends">
      <span>Getting started</span>
      <span>Well along</span>
    </div>
  `;
  return wrap;
}

function sparkline(values, band) {
  if (!values || values.length < 2) {
    return el('div', { class: 'rd-spark' });
  }
  const w = 140, h = 44, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillD = `${d} L${pts[pts.length-1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  const stroke = band === 'behind' ? 'var(--warn)'
    : band === 'ahead' ? 'var(--accent)' : 'var(--good)';
  const wrap = el('div', { class: 'rd-spark' });
  wrap.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${fillD}" fill="${stroke}" fill-opacity="0.12"/>
      <path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  return wrap;
}

// hero — course hero card. Layers (back→front):
//   1) gradient (always present — fallback if no image, also adds the
//      brand tint when an image is supplied)
//   2) photographic image (optional; loads from `image` prop)
//   3) dark overlay so badges and initials stay legible
//   4) badge + initials marks
//
// `image` is a URL/path. If the file 404s the <img> hides itself and the
// gradient stands alone — drop a file into assets/courses/<id>.jpg and
// it appears automatically.
export function hero({ initials, gradient, badge, height = 200, image }) {
  const wrap = el('div', { class: 'hero-img', style: { height: `${height}px` } });
  if (gradient) wrap.style.background = gradient;

  if (image) {
    const img = el('img', {
      class: 'hero-photo',
      src: image,
      alt: '',
      loading: 'lazy',
      decoding: 'async'
    });
    // If the file 404s, drop back to the gradient + initials path.
    img.addEventListener('error', () => {
      img.remove();
      wrap.classList.remove('has-photo');
      if (initials && !wrap.querySelector('.hero-mark')) {
        wrap.appendChild(el('span', { class: 'hero-mark' }, initials));
      }
    });
    img.addEventListener('load', () => wrap.classList.add('has-photo'));
    wrap.appendChild(img);
    wrap.appendChild(el('span', { class: 'hero-scrim', 'aria-hidden': 'true' }));
  }

  if (badge) {
    wrap.appendChild(el('span', { class: `hero-badge ${badge.variant || ''}` }, badge.label));
  }
  // Only show the initials mark when there's no photo — otherwise it
  // collides with the imagery and reads as a play button.
  if (initials && !image) {
    wrap.appendChild(el('span', { class: 'hero-mark' }, initials));
  }
  return wrap;
}

export function statTile({ icon: iconName, value, label }) {
  // Compact layout: icon + label share a header row, value sits beneath.
  return el('div', { class: 'stat-tile' },
    el('div', { class: 'stat-head' },
      icon(iconName, { class: 'stat-icon' }),
      el('span', { class: 'stat-label' }, label)
    ),
    el('div', { class: 'stat-value' }, value)
  );
}

export function statTileRow(tiles) {
  const row = el('div', { class: 'stat-row' });
  for (const t of tiles) row.appendChild(statTile(t));
  return row;
}

// statusPanel — the dark "current status" panel from the mockup.
// kicker = uppercase mini-label; value = bold status; href = where the
// play affordance navigates (resume target).
export function statusPanel({ kicker, value, href, percent }) {
  return el('a', { class: 'status-panel', href: href || '#' },
    el('div', { class: 'sp-top' },
      el('div', { class: 'sp-kicker' }, kicker),
      el('div', { class: 'sp-value' }, value)
    ),
    typeof percent === 'number' ? progressBar(percent) : null
  );
}

export function alertStrip({ kicker, title, href, severity = 'urgent' }) {
  const cls = severity === 'urgent' ? 'alert-strip' : 'alert-strip warn';
  const a = el('a', { class: cls, href });
  a.appendChild(icon('warn', { class: 'glyph' }));
  a.appendChild(el('div', { class: 'body' },
    el('small', null, kicker),
    el('strong', null, title)
  ));
  a.appendChild(icon('chevron', { class: 'chev' }));
  return a;
}

// nextUpHero — the home "Next up" hero row. Reads as the page's primary
// tap-target without using the loud full-width accent button. Accent
// play disc + title + small meta + trailing chevron.
export function nextUpHero({ title, minutes, href }) {
  const a = el('a', { class: 'next-up-card', href });
  a.appendChild(el('span', { class: 'nu-play', 'aria-hidden': 'true' }, icon('play')));
  const body = el('div', { class: 'nu-body' }, el('strong', null, title));
  if (minutes) body.appendChild(el('small', null, `${minutes} min`));
  a.appendChild(body);
  a.appendChild(el('span', { class: 'nu-chev', 'aria-hidden': 'true' }, icon('chevron')));
  return a;
}

export function rowCard({ glyph = 'flag', title, sub, href, onClick, kebab = true, percent, disabled = false }) {
  const tag = (!disabled && href) ? 'a' : 'div';
  const cls = 'row-card' + (disabled ? ' disabled' : '');
  const a = el(tag, {
    class: cls,
    href: disabled ? null : href,
    on: (!disabled && onClick) ? { click: onClick } : null
  });
  if (glyph) a.appendChild(el('span', { class: 'row-glyph' }, icon(glyph)));
  const body = el('div', { class: 'row-body' },
    el('strong', null, title),
    sub ? el('small', null, sub) : null
  );
  if (typeof percent === 'number') body.appendChild(progressBar(percent));
  a.appendChild(body);
  if (kebab && !disabled) a.appendChild(el('span', { class: 'row-kebab', 'aria-label': 'More' }, icon('kebab')));
  return a;
}

// coachMessage — Vic avatar + text bubble. Used on course detail,
// lesson, summary, etc. Single source for the "Vic says…" pattern.
// Pass `reveal` to stage the message behind a "Vic is thinking" shimmer:
// a string is the thinking label; an object form `{ label, key }` also
// controls the once-per-page-load dedupe key (defaults to title + text).
export function coachMessage({ title, text, footer = '— Coach Vic', reveal }) {
  const body = el('div', { class: 'cm-body' },
    title ? el('strong', null, title) : null,
    el('p', null, text),
    el('small', null, footer)
  );
  const card = el('div', { class: 'coach-message' },
    el('div', { class: 'cm-avatar', 'aria-hidden': 'true' }, 'V'),
    body
  );
  if (reveal) {
    const opts = typeof reveal === 'string' ? { label: reveal } : reveal;
    vicReveal({ root: card, body, label: opts.label, key: opts.key || `${title ?? ''}|${text}` });
  }
  return card;
}

// Pass `reveal` to stage the prompt behind a "Vic is thinking" shimmer —
// the "Coach Vic" header stays put while the question + actions reveal.
// String = thinking label; `{ label, key }` also controls the dedupe key.
export function coachPrompt({ question, primaryLabel, primaryHref, primaryVariant = 'primary', secondaryLabel = 'Later', secondaryHref = '#/coach', reveal }) {
  const body = el('div', { class: 'cp-reveal-body' },
    el('p', { class: 'q' }, `"${question}"`),
    el('div', { class: 'actions' },
      el('a', { class: `btn ${primaryVariant}`, href: primaryHref, style: { flex: '1' } }, primaryLabel),
      el('a', { class: 'btn ghost', href: secondaryHref }, secondaryLabel)
    )
  );
  const card = el('div', { class: 'coach-prompt' },
    el('div', { class: 'ph' }, el('span', { class: 'ph-mark' }, 'V'), el('span', null, 'Coach Vic')),
    body
  );
  if (reveal) {
    const opts = typeof reveal === 'string' ? { label: reveal } : reveal;
    vicReveal({ root: card, body, label: opts.label, key: opts.key || question });
  }
  return card;
}

export function primaryCta(label, href, { percent } = {}) {
  // Progress is only meaningful (and only shows its bottom bar) when the
  // learner is genuinely mid-course. A fresh 0% or finished 100% button is
  // a clean, centered label with no underline track.
  const showProgress = typeof percent === 'number' && percent > 0 && percent < 100;
  const row = el('span', { class: 'cta-row' },
    el('span', { class: 'cta-label' }, label),
    showProgress ? el('span', { class: 'cta-meta' }, `${percent}% completed`) : null
  );
  const cls = 'btn primary block cta-large' + (showProgress ? ' with-progress' : '');
  const a = el('a', { class: cls, href }, row);
  if (showProgress) {
    const bar = el('span', { class: 'cta-progress', 'aria-hidden': 'true' });
    bar.innerHTML = `<span style="width:${Math.max(0, Math.min(100, percent))}%"></span>`;
    a.appendChild(bar);
  }
  return a;
}

// Card surface helper — used as the standard course tile in lists.
export function courseTile(course, { progress, compact = false } = {}) {
  const a = el('a', { class: 'card', href: `#/course/${course.id}` });
  const pct = progress ? Math.round((progress.percent ?? 0) * 100) : null;
  const badgeLabel = course.adaptive
    ? '✨ Tailored for you'
    : (course.mandated && urgencyVisible() ? 'Required' : 'Recommended');
  const badgeVariant = course.adaptive || (course.mandated && urgencyVisible()) ? 'accent' : '';
  a.appendChild(el('div', { class: 'row between' },
    tag(badgeLabel, badgeVariant),
    el('span', { class: 'tiny muted' }, `${course.estMinutes} min`)
  ));
  a.appendChild(el('h3', null, course.title));
  if (!compact) a.appendChild(el('p', null, course.summary));
  if (pct != null) a.appendChild(progressBar(pct));
  return a;
}

// "Try another way" panel — modality switcher tucked behind a tap-to-
// expand header. Picking an option transforms the content above (video
// → summary, prose → audio, etc.) rather than stacking a reply card.
// `current` is the active modality id; onSelect(id) handles the swap.
// `originalLabel` is the name of the default format ("Video", "Text") —
// used to label the "return to original" option when in an alt mode.
// Modalities: 'original' | 'read' | 'summarize' | 'simpler' | 'chat'.
export function assistantPanel({ onSelect, current = 'original', originalLabel = 'Original', expanded = false }) {
  const altOptions = [
    { id: 'read',      label: 'Read to me',     iconName: 'speaker'   },
    { id: 'summarize', label: 'Summarize',      iconName: 'list'      },
    { id: 'simpler',   label: 'Simpler terms',  iconName: 'lightbulb' },
    { id: 'chat',      label: 'Ask Coach Vic',  iconName: 'chat'      }
  ];
  // When the learner is in an alt mode, surface a "Return to original"
  // option at the top of the list so getting back is the most obvious
  // path. On the default view it's a no-op, so we hide it.
  const options = current !== 'original'
    ? [{ id: 'original', label: `Original format · ${originalLabel}`, iconName: 'arrowRight' }, ...altOptions]
    : altOptions;

  const actions = el('div', { class: 'ap-actions' });
  for (const o of options) {
    const isActive = o.id === current;
    const btn = el('button', {
      class: `ai-act${isActive ? ' active' : ''}`,
      on: { click: () => {
        actions.classList.remove('open');
        head.setAttribute('aria-expanded', 'false');
        if (o.id !== current) onSelect(o.id);
      }}
    },
      el('span', { class: 'ai-glyph' }, icon(o.iconName)),
      el('span', { class: 'ai-label' }, o.label),
      el('span', { class: 'ai-chev' }, isActive ? icon('check') : icon('chevron'))
    );
    actions.appendChild(btn);
  }
  if (expanded) actions.classList.add('open');

  const activeLabel = options.find((o) => o.id === current)?.label;
  const hintText = current === 'original'
    ? 'Read · Summarize · Ask'
    : `Showing: ${activeLabel}`;

  const caret = el('span', { class: 'ap-caret' }, icon('chevron'));
  const head = el('button', {
    class: 'ap-head',
    'aria-expanded': expanded ? 'true' : 'false',
    on: { click: () => {
      const open = actions.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    }}
  },
    el('span', { class: 'ap-mark' }, icon('sparkle')),
    el('span', { class: 'ap-name' }, 'Try another way'),
    el('span', { class: 'ap-hint muted' }, hintText),
    caret
  );

  return el('div', { class: `assistant-panel collapsible${current !== 'original' ? ' modality-active' : ''}` }, head, actions);
}

// stepIndicator — top-of-page progress for a stepped flow. `steps` is a
// list of short labels (e.g. ['Watch', 'Learn', 'Check', 'Recap']);
// `current` is the active index. `variant: 'header'` strips the card
// chrome so the indicator can sit inline as part of a page header.
export function stepIndicator({ steps, current, variant }) {
  const wrap = el('div', { class: `step-ind${variant ? ` ${variant}` : ''}` });
  const meta = el('div', { class: 'si-meta' },
    el('span', { class: 'si-pos' }, `Step ${current + 1} of ${steps.length}`),
    el('span', { class: 'si-sep', 'aria-hidden': 'true' }, '·'),
    el('span', { class: 'si-name' }, steps[current])
  );
  const dots = el('div', { class: 'si-dots' });
  for (let i = 0; i < steps.length; i++) {
    const cls = i < current ? 'done' : i === current ? 'cur' : '';
    dots.appendChild(el('span', { class: `si-dot ${cls}` }));
  }
  wrap.append(meta, dots);
  return wrap;
}

// phaseBar — a continuous segmented progress bar for a short, cross-screen
// flow (e.g. Watch → Share observations). One segment per step: completed
// steps fill green, the current step fills blue, upcoming steps stay grey.
// Used by the scene-watch flow and the discussion engine so the learner reads
// the two as one connected sequence even though they're separate routes.
export function phaseBar({ steps, current }) {
  const wrap = el('div', { class: 'phase-bar' });
  wrap.appendChild(el('div', { class: 'phase-bar-label' },
    `Step ${current + 1} of ${steps.length} — ${steps[current]}`));
  const track = el('div', { class: 'phase-bar-track' });
  for (let i = 0; i < steps.length; i++) {
    const cls = i < current ? 'done' : i === current ? 'cur' : '';
    track.appendChild(el('span', { class: `phase-seg ${cls}` }));
  }
  wrap.appendChild(track);
  return wrap;
}

// stickyFooter — bottom-anchored bar holding the page's primary CTA.
// Used on full-flow surfaces (lesson, etc.) so the next action is
// always reachable without scrolling.
export function stickyFooter({ children }) {
  const inner = el('div', { class: 'sf-inner' });
  for (const c of [].concat(children).filter(Boolean)) inner.appendChild(c);
  return el('div', { class: 'sticky-footer' }, inner);
}

// callout — boxed inline content reference (Clinical Note, Required
// Equipment, etc.). `kind` drives the accent stripe and icon.
export function callout({ kind = 'note', title, body, items }) {
  const meta = {
    note:      { glyph: 'note',   color: 'note'   },
    warning:   { glyph: 'warn',   color: 'warn'   },
    equipment: { glyph: 'wrench', color: 'equip'  },
    field:     { glyph: 'flag',   color: 'note'   }
  }[kind] || { glyph: 'note', color: 'note' };
  const node = el('div', { class: `callout co-${meta.color}` },
    el('div', { class: 'co-head' },
      el('span', { class: 'co-glyph' }, icon(meta.glyph)),
      el('strong', null, title)
    ),
    body ? el('p', null, body) : null,
    items ? el('ul', { class: 'co-list' }, ...items.map((i) => el('li', null, i))) : null
  );
  return node;
}

// blockShell — wraps any content block with an inline "AI" toggle that
// reveals per-block modality actions. This is how we apply the four
// modalities to ANY content using AI without it being generative-adaptive.
export function blockShell({ children, onModality }) {
  const wrap = el('div', { class: 'block-shell' });
  const body = el('div', { class: 'bs-body' });
  for (const c of [].concat(children).filter(Boolean)) body.appendChild(c);
  wrap.appendChild(body);

  const trigger = el('button', { class: 'bs-trigger', 'aria-label': 'AI tools for this block',
    on: { click: () => menu.classList.toggle('open') } }, icon('sparkle'));
  const menu = el('div', { class: 'bs-menu' });
  const action = (id, label) =>
    el('button', { class: 'bs-action', on: { click: () => { menu.classList.remove('open'); onModality(id); } } }, label);
  menu.append(
    action('read', 'Read to me'),
    action('summarize', 'Summarize'),
    action('simpler', 'Simpler terms'),
    action('chat', 'Ask Vic about this')
  );
  wrap.appendChild(trigger);
  wrap.appendChild(menu);
  return wrap;
}

// nextUpCard — preview of the upcoming lesson, mirrors the right-rail
// "Next Up" card from the desktop mockup.
export function nextUpCard({ kicker = 'Next up', title, subtitle, href, initials, cta = false, onClick }) {
  // When the card owns the advance action (onClick = mark-complete + navigate),
  // it must NOT also be a raw link: a cmd/middle-click would follow the href and
  // skip the mark-complete step. In that mode drop href and behave as a button.
  const attrs = { class: `next-up${cta ? ' cta' : ''}` };
  if (onClick) { attrs.role = 'button'; attrs.tabIndex = 0; }
  else if (href) { attrs.href = href; }
  const card = el('a', attrs,
    el('div', { class: 'nu-thumb' }, initials || icon('play')),
    el('div', { class: 'nu-body' },
      el('small', null, kicker),
      el('strong', null, title),
      subtitle ? el('span', { class: 'nu-sub' }, subtitle) : null
    ),
    el('span', { class: 'nu-chev' }, icon(cta ? 'arrowRight' : 'chevron'))
  );
  if (onClick) {
    card.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    });
  }
  return card;
}

// progressMini — compact "65% Complete · 7/12 Lessons" summary line.
export function progressMini({ percent, completed, total, label = 'Course progress' }) {
  return el('div', { class: 'progress-mini' },
    el('div', { class: 'pm-row' },
      el('small', null, label),
      el('span', null, `${completed}/${total}`)
    ),
    progressBar(percent),
    el('div', { class: 'pm-row pm-foot' },
      el('span', null, `${percent}% complete`),
      el('span', { class: 'muted' }, `${total - completed} to go`)
    )
  );
}

// scenarioMedia — wide image area for a scenario. Layers (back→front):
//   1) gradient (always present — fallback if no image)
//   2) photographic image (optional; loads from `image` prop)
//   3) dark scrim for label legibility
//   4) optional label pill
//
// `image` is a URL/path. If the file 404s the <img> removes itself and
// the gradient stands alone — drop a file at assets/scenarios/<id>.jpg
// and it appears automatically.
export function scenarioMedia({ id, label, accent, height = 180, image }) {
  const wrap = el('div', { class: 'scn-hero', style: {
    height: `${height}px`,
    background: gradientFor(id, accent || '#3a4a6a')
  } });
  if (image) {
    const img = el('img', {
      class: 'scn-hero-photo',
      src: image,
      alt: '',
      loading: 'lazy',
      decoding: 'async'
    });
    img.addEventListener('error', () => img.remove());
    img.addEventListener('load', () => wrap.classList.add('has-photo'));
    wrap.appendChild(img);
    wrap.appendChild(el('span', { class: 'scn-hero-scrim', 'aria-hidden': 'true' }));
  }
  if (label) wrap.appendChild(el('span', { class: 'scn-hero-label' }, label));
  return wrap;
}

// kickerPill — rounded pill kicker with leading icon, used above the
// scenario title on the welcome card and at the top of each step.
export function kickerPill({ icon: ic = 'sparkle', label }) {
  return el('div', { class: 'kicker-pill' }, icon(ic), el('span', null, label));
}

// tensionTag — small "High / Medium / Low Tension" indicator on a step.
export function tensionTag(level = 'medium') {
  const map = {
    high:   { label: 'High Tension',   variant: 'bad'  },
    medium: { label: 'Medium Tension', variant: 'warn' },
    low:    { label: 'Low Tension',    variant: ''     }
  }[level] || { label: 'Tension', variant: '' };
  return el('span', { class: `tension-tag t-${map.variant}` },
    icon('warn'), el('span', null, map.label));
}

// scenarioTimer — counts UP from 0 in MM:SS, returns the element so the
// caller can start()/stop() it. It does NOT auto-start: the scenario
// overview ("Begin practice" not yet pressed) is a framing screen, so the
// timer sits at 00:00 until the caller calls start() at the real begin.
export function scenarioTimer() {
  const txt = el('span', null, '00:00');
  const wrap = el('span', { class: 'scn-timer' }, icon('clock'), txt);
  let s = 0, h = null;
  const fmt = (n) => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const tick = () => { s++; txt.textContent = fmt(s); };
  wrap.start = () => { if (!h) h = setInterval(tick, 1000); };
  wrap.stop = () => { clearInterval(h); h = null; };
  wrap.elapsed = () => s;
  return wrap;
}

// practiceModeBar — the persistent "labeled mode bar" that marks a screen as
// Practice rather than Lesson. This is the load-bearing structural cue from the
// design: a lesson never carries this bar, so its mere presence tells the
// learner they've changed gears. It shows a bolt mark, the "PRACTICE" label,
// and the live timer (which lives here, not in the hero). The bar's job is
// singular — "you're in practice mode" — so it carries no course-progress
// chrome even when the practice runs as a lesson component (an unlabeled
// strip here read as session progress, which it wasn't).
//
//   timer  — the scenarioTimer() element (re-parented into the bar)
//   onExit — close handler; stands in for the shell's floating × on practice
export function practiceModeBar({ timer, onExit } = {}) {
  const left = el('span', { class: 'pb-mode' },
    el('span', { class: 'pb-bolt' }, icon('bolt')),
    el('span', { class: 'pb-label' }, 'Practice')
  );
  const right = el('span', { class: 'pb-right' });
  if (timer) right.appendChild(timer);
  if (onExit) right.appendChild(
    el('button', { class: 'pb-close', type: 'button', 'aria-label': 'Exit practice', on: { click: onExit } },
      icon('close'))
  );

  return el('div', { class: 'practice-bar', role: 'status' },
    el('div', { class: 'pb-row' }, left, right)
  );
}

// scenarioWelcome — the orientation card. Two labeled blocks frame the
// run: "Background" (the scene as known going in) and "Expected outcome"
// (what a clean run looks like). The dispatch call and any rehearsal
// reassurance now live downstream of "Begin practice", not here — this
// screen is just the pre-brief.
//
// Optional extras used by the full-screen practice intro:
//   scenarioTitle — the scenario's real name, as the headline
//   meta          — short fact chips ("~6 min", "3 decisions") that set the
//                   commitment before the learner starts
export function scenarioWelcome({ kicker, title, scenarioTitle, body, highlight, expectedOutcome, meta, onBegin, ctaLabel = 'Begin practice' }) {
  // Inline-highlight a substring inside body (the mockup highlights "80% of staff").
  const bodyEl = el('p', { class: 'sw-body' });
  if (highlight && body.includes(highlight)) {
    const [pre, post] = body.split(highlight);
    bodyEl.appendChild(document.createTextNode(pre));
    bodyEl.appendChild(el('mark', null, highlight));
    bodyEl.appendChild(document.createTextNode(post));
  } else {
    bodyEl.textContent = body;
  }

  const card = el('div', { class: 'scn-welcome' },
    // Header cluster: pill ("Scenario overview" / retry / KA variant),
    // then the scenario's actual name, then the commitment chips.
    kickerPill({ icon: 'sparkle', label: kicker || title || 'Scenario overview' }),
    scenarioTitle ? el('h1', { class: 'sw-title' }, scenarioTitle) : null,
    meta?.length ? el('div', { class: 'sw-meta' },
      ...meta.map((m) => el('span', { class: 'sw-meta-chip' }, m))
    ) : null,
    // The scenario prose stands alone under the header — no "Background"
    // label and no rule; generous spacing does the framing.
    bodyEl,
    // Expected outcome docks just above the CTA so the pair reads as
    // "here's what we expect — ready to begin?".
    expectedOutcome ? el('div', { class: 'sw-section sw-pair-cta' },
      el('small', { class: 'sw-section-label' }, 'Expected outcome'),
      el('p', { class: 'sw-outcome' }, expectedOutcome)
    ) : null,
    el('button', { class: 'btn primary block cta-large sw-cta', on: { click: onBegin } },
      el('span', null, ctaLabel),
      icon('arrowRight'))
  );
  return card;
}

// dispatchAudio — a "Play dispatch" card that uses SpeechSynthesis to
// read the dispatch line aloud. Click toggles play/stop. Returns the
// element with a stop() method so callers can cancel if the user
// navigates away mid-play.
export function dispatchAudio({ tag = 'MEDCOM Dispatch', text }) {
  const playIcon = icon('play', { class: 'dp-icon' });
  const pauseIcon = icon('pause', { class: 'dp-icon' });
  const btn = el('button', { type: 'button', class: 'dp-play', 'aria-label': 'Play dispatch audio' }, playIcon);
  const body = el('p', { class: 'dp-text' }, `“${text}”`);
  // tag: null skips the in-card channel row (used when the screen's
  // header already names the channel, e.g. the dispatch lockup).
  const card = el('div', { class: 'dispatch-audio' },
    tag ? el('span', { class: 'dp-channel' }, icon('radio'), el('span', null, tag)) : null,
    el('div', { class: 'dp-row' }, btn, body)
  );

  let utter = null;
  function stop() {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    card.classList.remove('is-playing');
    btn.replaceChildren(playIcon);
  }
  btn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    if (card.classList.contains('is-playing')) { stop(); return; }
    utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0; utter.pitch = 0.85;
    utter.onend = () => stop();
    utter.onerror = () => stop();
    card.classList.add('is-playing');
    btn.replaceChildren(pauseIcon);
    speechSynthesis.speak(utter);
  });
  card.stop = stop;
  return card;
}

// vitalsPanel — animated heart + breathing readout. The heart icon
// pulses at the patient's BPM (driven by an interval), the breathing
// wave expands at the respiratory rate. On a device with vibration
// support, each heartbeat fires a short haptic tick so the learner
// literally feels the pulse on their phone.
//
// Returns the element with `.update({hr, rr})` and `.stop()`.
export function vitalsPanel({ hr = 80, rr = 16, haptics = true } = {}) {
  const heart = el('span', { class: 'vp-heart' }, icon('heart'));
  const hrVal = el('strong', { class: 'vp-num' }, String(hr));
  const rrVal = el('strong', { class: 'vp-num' }, String(rr));
  const lung  = el('span', { class: 'vp-lung' }, icon('lungs'));

  const trendHr = el('span', { class: 'vp-trend' });
  const trendRr = el('span', { class: 'vp-trend' });

  const panel = el('div', { class: 'vitals-panel', 'aria-label': 'Patient vitals' },
    el('div', { class: 'vp-cell vp-hr' },
      heart,
      el('div', { class: 'vp-meta' },
        el('span', { class: 'vp-label' }, 'Pulse'),
        el('div', { class: 'vp-line' }, hrVal, el('span', { class: 'vp-unit' }, 'bpm'), trendHr)
      )
    ),
    el('div', { class: 'vp-cell vp-rr' },
      lung,
      el('div', { class: 'vp-meta' },
        el('span', { class: 'vp-label' }, 'Resp'),
        el('div', { class: 'vp-line' }, rrVal, el('span', { class: 'vp-unit' }, '/min'), trendRr)
      )
    )
  );

  let curHr = hr, curRr = rr;
  let beatTimer = null, breathTimer = null;
  let canVibrate = haptics && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  let hapticEnabled = false; // requires a user gesture before we tap the buzzer

  function scheduleBeat() {
    if (beatTimer) clearTimeout(beatTimer);
    const ms = Math.max(220, Math.round(60000 / curHr));
    const tick = () => {
      heart.classList.remove('beat');
      // restart animation
      void heart.offsetWidth;
      heart.classList.add('beat');
      if (canVibrate && hapticEnabled) {
        try { navigator.vibrate(18); } catch {}
      }
      beatTimer = setTimeout(tick, Math.max(220, Math.round(60000 / curHr)));
    };
    beatTimer = setTimeout(tick, ms);
  }
  function scheduleBreath() {
    if (breathTimer) clearTimeout(breathTimer);
    const ms = Math.max(800, Math.round(60000 / curRr));
    const tick = () => {
      lung.classList.remove('breathe');
      void lung.offsetWidth;
      lung.classList.add('breathe');
      lung.style.setProperty('--breath-ms', `${ms}ms`);
      breathTimer = setTimeout(tick, Math.max(800, Math.round(60000 / curRr)));
    };
    lung.style.setProperty('--breath-ms', `${ms}ms`);
    breathTimer = setTimeout(tick, 0);
  }

  // Enable haptics on the first user tap anywhere in the document — iOS
  // requires a gesture before vibrate() is honored.
  function armHaptics() {
    hapticEnabled = true;
    document.removeEventListener('touchstart', armHaptics);
    document.removeEventListener('click', armHaptics);
  }
  if (canVibrate) {
    document.addEventListener('touchstart', armHaptics, { once: true, passive: true });
    document.addEventListener('click', armHaptics, { once: true });
  }

  scheduleBeat();
  scheduleBreath();

  panel.update = ({ hr: nh, rr: nr } = {}) => {
    if (typeof nh === 'number' && nh !== curHr) {
      const dir = nh > curHr ? 'up' : nh < curHr ? 'down' : '';
      curHr = Math.max(20, Math.min(220, nh));
      hrVal.textContent = String(curHr);
      trendHr.className = `vp-trend ${dir}`;
      trendHr.textContent = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
      scheduleBeat();
    }
    if (typeof nr === 'number' && nr !== curRr) {
      const dir = nr > curRr ? 'up' : nr < curRr ? 'down' : '';
      curRr = Math.max(4, Math.min(60, nr));
      rrVal.textContent = String(curRr);
      trendRr.className = `vp-trend ${dir}`;
      trendRr.textContent = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
      scheduleBreath();
    }
  };
  panel.stop = () => {
    if (beatTimer) clearTimeout(beatTimer);
    if (breathTimer) clearTimeout(breathTimer);
    beatTimer = breathTimer = null;
  };
  return panel;
}

// scenarioPrompt — the learner's directive for the current step. This is the
// single most important instruction on the page; it must dominate the visual
// hierarchy over situational notes and coach hints.
export function scenarioPrompt({ kicker = 'Your task', text }) {
  return el('div', { class: 'scn-prompt' },
    el('div', { class: 'scn-prompt-kicker' }, kicker),
    el('p', { class: 'scn-prompt-text' }, text)
  );
}

// coachHint — small Vic micro-prompt shown inline within a step.
export function coachHint({ text }) {
  return el('div', { class: 'coach-hint' },
    el('span', { class: 'ch-avatar' }, icon('lightbulb')),
    el('p', null, text)
  );
}

// situationalAssessment — colored callout used between steps to relay
// the consequence of a previous answer ("You chose to acknowledge…").
export function situationalAssessment({ tone = 'warn', kicker = 'Situational assessment', body }) {
  return el('div', { class: `sit-assess sa-${tone}` },
    el('div', { class: 'sa-head' }, icon('warn'), el('strong', null, kicker)),
    el('p', null, body)
  );
}

// formulationField — labeled textarea with optional voice toggle and an
// optional coach hint rendered inside the card, directly under the field
// (one cohesive input unit — not a separate hint card floating below). The
// voice toggle is mocked — clicking it auto-fills a stand-in transcript
// so the demo can show conversational input without a real microphone.
export function formulationField({ label = 'Your formulation', placeholder = 'Type your response…', voicePrompt, hint }) {
  const ta = el('textarea', { rows: 4, placeholder, class: 'scn-textarea' });
  const voiceBtn = voicePrompt ? el('button', { type: 'button', class: 'voice-btn',
    'aria-label': 'Use voice input',
    on: { click: () => {
      voiceBtn.classList.add('listening');
      voiceBtn.querySelector('.vb-label').textContent = 'Listening…';
      setTimeout(() => {
        ta.value = voicePrompt;
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.vb-label').textContent = 'Voice';
        // Programmatic fill must still notify listeners (e.g. the submit
        // button's enable-on-input gate).
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }, 1100);
    }}}, icon('mic'), el('span', { class: 'vb-label' }, 'Voice')) : null;

  const wrap = el('div', { class: 'formulation' },
    el('div', { class: 'fm-head' },
      el('small', null, label),
      voiceBtn
    ),
    ta,
    hint ? el('div', { class: 'fm-hint' },
      el('span', { class: 'fm-hint-avatar' }, icon('lightbulb')),
      el('p', null, hint)
    ) : null
  );
  wrap.value = () => ta.value;
  wrap.input = ta;
  return wrap;
}

// stepHeader — the top of an in-scenario step: kicker, optional title, timer.
// When title is omitted, the header collapses to a slim orientation row:
// kicker on the left, timer chip on the right. The question itself is
// rendered down with the answer options on choice steps so the prompt and
// the response sit visually together.
export function stepHeader({ kicker, title, timerEl }) {
  const cls = title ? 'scn-stepheader' : 'scn-stepheader is-compact';
  return el('div', { class: cls },
    el('div', { class: 'sh-text' },
      kicker ? el('small', null, kicker) : null,
      title ? el('strong', null, title) : null
    ),
    timerEl
  );
}

// insightHeader — large page header with leading icon + body intro.
// Used on Practice Results to set the qualitative-review framing.
export function insightHeader({ title, body, icon: ic = 'brain' }) {
  return el('div', { class: 'insight-header' },
    el('div', { class: 'ih-icon' }, icon(ic)),
    el('h2', null, title),
    el('p', null, body)
  );
}

// insightCard — strength / growth observation with a left accent stripe.
// tone: 'strength' | 'growth'
// quote: a paraphrased observation of what the learner did
// indicator: the competency this maps to (Situational Awareness, etc.)
export function insightCard({ tone = 'strength', quote, indicator }) {
  const meta = tone === 'strength'
    ? { label: 'Observed strength', cls: 'ic-strength', ic: 'check' }
    : { label: 'Area for growth',   cls: 'ic-growth',   ic: 'trending' };
  return el('div', { class: `insight-card ${meta.cls}` },
    el('div', { class: 'ic-head' },
      icon(meta.ic),
      el('strong', null, meta.label)
    ),
    el('blockquote', { class: 'ic-quote' }, '"' + quote + '"'),
    indicator ? el('p', { class: 'ic-indicator' },
      el('span', null, 'Indicator: '),
      el('strong', null, indicator)
    ) : null
  );
}

// observationList — a single card consolidating every strength/growth
// observation as compact rows. Replaces stacking one insightCard per
// observation (which made the results page sprawl). Each row carries a
// tone marker, the paraphrased observation, and a muted indicator tag.
//
// items: [{ tone: 'strength' | 'growth', quote, indicator }]
export function observationList(items) {
  return el('div', { class: 'card obs-card' },
    el('p', { class: 'obs-title' }, 'What we observed'),
    el('ul', { class: 'obs-list' },
      ...items.map((it) => {
        const strong = it.tone === 'strength';
        return el('li', { class: `obs-item ${strong ? 'is-strength' : 'is-growth'}` },
          el('span', { class: 'obs-mark' }, icon(strong ? 'check' : 'trending')),
          el('div', { class: 'obs-body' },
            el('p', { class: 'obs-text' }, it.quote),
            it.indicator ? el('span', { class: 'obs-tag' }, it.indicator) : null
          )
        );
      })
    )
  );
}

// readinessDelta — compact indicator showing how a practice run moved
// the learner's clinical readiness score. Tone is derived from the
// signed delta (up / down / neutral).
//
// before / after are integer percentages (0-100). Both are required so
// the badge can render the from→to transition explicitly.
export function readinessDelta({ before, after, kicker, size = 'md' }) {
  if (!kicker) kicker = store.state.industry?.language?.readinessLabel || 'Readiness';
  const delta = Math.round((after ?? 0) - (before ?? 0));
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const mag = Math.abs(delta);
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '–';
  const label = dir === 'up' ? 'Readiness up' : dir === 'down' ? 'Readiness down' : 'No change';
  return el('div', { class: `readiness-delta rd-${dir} rd-${size}` },
    el('span', { class: 'rd-kicker' }, kicker),
    el('div', { class: 'rd-row' },
      el('span', { class: 'rd-arrow' }, arrow),
      el('strong', { class: 'rd-label' }, label),
      el('div', { class: 'rd-numbers' },
        el('span', { class: 'rd-delta' }, `${sign}${mag}`),
        el('span', { class: 'rd-fromto' },
          el('span', null, `${before}%`),
          el('span', { class: 'rd-arrow-sm' }, '→'),
          el('span', null, `${after}%`)
        )
      )
    )
  );
}

// practiceCelebration — interstitial shown immediately after a scenario
// run completes. Frames the readiness movement, then offers two CTAs:
// return home (secondary) or see full results (primary).
export function practiceCelebration({ before, after, scenarioTitle, onHome, onResults }) {
  const delta = Math.round((after ?? 0) - (before ?? 0));
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const headline = dir === 'up'
    ? 'Nice rep — your readiness moved up.'
    : dir === 'down'
      ? 'Reps logged — your readiness slipped a bit.'
      : 'Reps logged — readiness held steady.';
  const sub = dir === 'up'
    ? 'The patterns you reinforced advanced the underlying competencies.'
    : dir === 'down'
      ? 'The full breakdown shows which decisions cost ground.'
      : 'See the breakdown for the patterns Coach Vic noticed.';

  return el('section', { class: `practice-celebration pc-${dir}` },
    el('div', { class: 'pc-burst' },
      el('span', { class: 'pc-burst-mark' }, dir === 'up' ? '✨' : dir === 'down' ? '↺' : '◎')
    ),
    el('p', { class: 'pc-kicker' }, 'Practice complete'),
    el('h1', { class: 'pc-title' }, headline),
    scenarioTitle ? el('p', { class: 'pc-scenario' }, scenarioTitle) : null,
    readinessDelta({ before, after, size: 'lg' }),
    el('p', { class: 'pc-sub muted' }, sub),
    el('div', { class: 'pc-actions' },
      el('button', { type: 'button', class: 'btn block', on: { click: onHome } },
        el('span', null, 'Return home')
      ),
      el('button', { type: 'button', class: 'btn primary block cta-large', on: { click: onResults } },
        el('span', null, 'See full results'),
        icon('arrowRight')
      )
    )
  );
}

// dateDivider — pill-shaped date label between conversation segments.
export function dateDivider(label) {
  return el('div', { class: 'date-divider' }, el('span', null, label));
}

// chatBubble — Markdown-lite text bubble.
//   tone: 'coach' | 'me'  →  dark coach bubble vs neutral self bubble
//   time: optional timestamp string ("09:12 AM")
export function chatBubble({ tone = 'coach', text, time, children }) {
  const wrap = el('div', { class: `chat-row r-${tone}` });
  const bub = el('div', { class: `chat-bubble b-${tone}` });
  // markdown-lite: **bold** and *italic*
  bub.innerHTML = mdLite(text || '');
  wrap.appendChild(bub);
  if (children && children.length) {
    const after = el('div', { class: 'chat-extras' }, ...children.filter(Boolean));
    wrap.appendChild(after);
  }
  if (time) wrap.appendChild(el('span', { class: 'chat-time' }, time));
  return wrap;
}

// conceptBreakdown — rich card sometimes returned by Vic. Shows current
// mastery vs peer average, optional delta, summary, and CTA hooks.
export function conceptBreakdown({ concept, currentMastery, delta, peerAvg, tag, summary, onReview, onPractice }) {
  const deltaEl = (typeof delta === 'number' && delta !== 0)
    ? el('span', { class: `cb-delta ${delta < 0 ? 'down' : 'up'}` },
        el('span', null, `${delta < 0 ? '▼' : '▲'} ${Math.abs(delta)}%`))
    : null;
  return el('div', { class: 'concept-card' },
    el('div', { class: 'cc-head' },
      el('span', { class: 'cc-icon' }, icon('trending')),
      el('strong', null, 'Concept Breakdown'),
      tag ? el('span', { class: 'cc-tag' }, tag) : null
    ),
    el('div', { class: 'cc-body' },
      el('div', { class: 'cc-name' }, concept),
      el('div', { class: 'cc-stats' },
        el('div', { class: 'cc-tile' },
          el('small', null, 'Current mastery'),
          el('div', { class: 'cc-row' },
            el('strong', null, `${currentMastery}%`),
            deltaEl
          )
        ),
        el('div', { class: 'cc-tile' },
          el('small', null, 'Peer avg'),
          el('strong', null, `${peerAvg}%`)
        )
      ),
      summary ? el('p', { class: 'cc-summary' }, summary) : null,
      el('div', { class: 'cc-actions' },
        onReview   ? el('button', { class: 'btn primary sm', on: { click: onReview } }, 'Review now') : null,
        onPractice ? el('button', { class: 'btn sm',         on: { click: onPractice } }, 'Run a practice') : null
      )
    )
  );
}

// chatComposer — bottom input bar (text + mic + attach + send).
// onSend(text), onMic(), onAttach() — mic is mocked; attach is a stub.
export function chatComposer({ placeholder = 'Ask Vic a follow-up…', onSend, onMic, onAttach }) {
  const input = el('input', { type: 'text', class: 'cc-input', placeholder });
  const send = () => { const v = input.value; if (!v.trim()) return; input.value = ''; onSend(v); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  const attach = el('button', { class: 'cc-attach', 'aria-label': 'Attach', on: { click: onAttach } }, icon('paperclip'));
  const mic    = el('button', { class: 'cc-mic',    'aria-label': 'Voice',  on: { click: onMic } },    icon('mic'));
  const submit = el('button', { class: 'cc-send',   'aria-label': 'Send',   on: { click: send } },     icon('send'));

  return el('div', { class: 'chat-composer' },
    el('div', { class: 'cc-input-wrap' }, input, attach),
    mic, submit
  );
}

// suggestedChips — quick-reply chips below the composer.
export function suggestedChips(items, onPick) {
  if (!items?.length) return el('div');
  const row = el('div', { class: 'sugg-row' });
  for (const s of items) {
    row.appendChild(el('button', { class: 'sugg-chip', on: { click: () => onPick(s) } }, s));
  }
  return row;
}

// Markdown-lite: only **bold** and *italic*. Escapes other HTML.
function mdLite(s) {
  const safe = String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// hubHeader — Practice Hub page title + optional "Random scenario" CTA.
export function hubHeader({ kicker, title, onRandom }) {
  return el('div', { class: 'hub-header' },
    el('div', { class: 'hh-text' },
      kicker ? el('small', null, kicker) : null,
      el('h2', null, title)
    ),
    onRandom
      ? el('button', { class: 'btn primary hh-random', on: { click: onRandom } },
          icon('bolt'), el('span', null, 'Random'))
      : null
  );
}

// statHero — single big stat with a leading sparkline-y mark and an
// optional sub-stat ("Top 5% of Practitioners").
export function statHero({ kicker, value, unit, sub, ic = 'trending' }) {
  return el('div', { class: 'stat-hero' },
    el('div', { class: 'sh-icon' }, icon(ic)),
    el('div', { class: 'sh-body' },
      kicker ? el('small', null, kicker) : null,
      el('div', { class: 'sh-value' },
        el('strong', null, value),
        unit ? el('span', { class: 'sh-unit' }, unit) : null
      ),
      sub ? el('p', { class: 'sh-sub' }, sub) : null
    )
  );
}

// featuredScenario — the dark hero card from the mockup. Two CTAs:
// Start (primary) and Briefing (ghost).
export function featuredScenario({ id, title, body, tags, startHref, briefingHref, gradient, accent }) {
  return el('div', { class: 'featured-scn', style: { background: gradient || gradientFor(id, accent || '#3a5d77') } },
    el('div', { class: 'fs-tags' },
      ...(tags || []).map((t) => el('span', { class: `fs-tag t-${t.tone || 'plain'}` }, t.label))
    ),
    el('h3', { class: 'fs-title' }, title),
    el('p', { class: 'fs-body' }, body),
    el('div', { class: 'fs-actions' },
      el('a', { class: 'btn primary', href: startHref }, 'Start simulation'),
      briefingHref ? el('a', { class: 'btn ghost fs-ghost', href: briefingHref }, 'View briefing') : null
    )
  );
}

// catalogFilters — topic dropdown + sort. Returns { node, getTopic, getSort }.
export function catalogFilters({ topics, onChange }) {
  const topicSel = el('select', { class: 'cf-select' },
    el('option', { value: '' }, 'All topics'),
    ...topics.map((t) => el('option', { value: t }, capitalize(t)))
  );
  const sortSel = el('select', { class: 'cf-select' },
    el('option', { value: 'difficulty-desc' }, 'Difficulty: high to low'),
    el('option', { value: 'difficulty-asc' },  'Difficulty: low to high'),
    el('option', { value: 'time-asc' },        'Time: short to long'),
    el('option', { value: 'time-desc' },       'Time: long to short')
  );
  topicSel.addEventListener('change', () => onChange());
  sortSel.addEventListener('change',  () => onChange());
  const node = el('div', { class: 'cat-filters' }, topicSel, sortSel);
  return { node, getTopic: () => topicSel.value, getSort: () => sortSel.value };
}

// scenarioCatalogCard — dense scenario tile used in the catalog grid.
// status: 'active' | 'mastered' | 'locked' | 'coming-soon'
// Locked & coming-soon cards don't navigate.
export function scenarioCatalogCard({ scenario, status, scorePct, onLockedClick }) {
  const map = {
    mastered:      { label: 'Mastered',    cls: 'st-mastered'    },
    active:        { label: 'Active',      cls: 'st-active'      },
    locked:        { label: 'Locked',      cls: 'st-locked'      },
    'coming-soon': { label: 'Coming soon', cls: 'st-coming-soon' }
  }[status] || { label: '', cls: '' };

  const nonNav = status === 'locked' || status === 'coming-soon';

  const footRight = status === 'locked'
    ? el('span', { class: 'sct-foot-meta' }, `Unlocks at lvl ${scenario.unlocksAtLevel || 5}`)
    : status === 'coming-soon'
    ? el('span', { class: 'sct-foot-meta' }, 'In development')
    : status === 'mastered'
    ? el('span', { class: 'sct-foot-meta' }, `${scorePct ?? 100}% score`)
    : el('span', { class: 'sct-foot-meta' }, scenario.estMinutes ? `${scenario.estMinutes}m` : '');

  const arrow = nonNav ? null
    : status === 'mastered' ? icon('retry')
    : icon('arrowRight');

  const routeBase = scenario.kind === 'iv-math' ? 'iv-math' : 'practice';
  const isMini = scenario.kind === 'iv-math';
  const props = {
    class: `scn-cat-card ${map.cls}${isMini ? ' is-minigame' : ''}`,
    href: nonNav ? null : `#/${routeBase}/${scenario.id}`
  };
  if (nonNav && onLockedClick) props.on = { click: onLockedClick };
  if (status === 'coming-soon') props.disabled = true;

  return el(props.href ? 'a' : 'button', props,
    el('div', { class: 'sct-head' },
      el('span', { class: 'sct-glyph' }, icon(scenario.icon || 'shield')),
      isMini ? el('span', { class: 'sct-kind' }, 'Mini-game') : null,
      el('span', { class: `sct-status ${map.cls}` }, map.label)
    ),
    el('strong', { class: 'sct-title' }, scenario.title),
    el('p', { class: 'sct-body' }, scenario.outcomeType || ''),
    el('div', { class: 'sct-foot' },
      el('span', { class: 'sct-time' }, icon('clock'),
        el('span', null, scenario.estMinutes ? `${scenario.estMinutes}m` : '')),
      footRight,
      arrow ? el('span', { class: 'sct-action' }, arrow) : null
    )
  );
}

function capitalize(s) { return String(s || '').replace(/^./, (c) => c.toUpperCase()); }

// audienceCard — small framing card above an articulation mic that tells
// the learner WHO they're explaining to. Three flavors: expert / beginner
// / outsider, each with its own avatar icon and short descriptor.
export function audienceCard({ audience, concept }) {
  // `concept` is the thing being explained, e.g. "why scene size-up always
  // comes before patient contact". It slots in as the object of the coach's
  // direction, so the card is the single place the learner is told both WHO
  // they're talking to and WHAT to land — no separate scene-setting line
  // needs to repeat it. Falls back to "this" if a step omits the concept.
  const c = concept || 'this';
  const meta = {
    expert: {
      title: 'Another expert',
      desc: `They already know the fundamentals, so skip the basics. Use precise terms and explain ${c}.`,
      icon: 'shield'
    },
    beginner: {
      title: 'A new trainee',
      desc: `It's their first week, so assume nothing. Keep it plain and explain ${c}.`,
      icon: 'lightbulb'
    },
    outsider: {
      title: 'Someone outside the field',
      desc: `They work in a different field, so skip the shorthand. Lose the acronyms and explain ${c}.`,
      icon: 'users'
    }
  }[audience] || { title: 'Your listener', desc: '', icon: 'users' };
  return el('div', { class: 'audience-card' },
    el('div', { class: 'ac-avatar' }, icon(meta.icon)),
    el('div', { class: 'ac-body' },
      el('div', { class: 'ac-kicker' }, 'Your audience'),
      el('h3', { class: 'ac-title' }, meta.title),
      el('p', { class: 'ac-desc' }, meta.desc)
    )
  );
}

// createDictation — the single Web Speech API integration shared by every
// voice input in the app. It is HEADLESS: it owns SR feature-detection,
// recognizer config (continuous + interim, en-US), the final/interim
// transcript accumulation, the keep-alive restart that survives natural
// pauses, and fatal-error classification — but renders NO DOM. Callers draw
// their own chrome (a full mic panel, or a bare button inside a textarea) and
// react through the callbacks. Returns null when speech recognition is
// unavailable, so callers can fall back to typing.
//
//   onTranscript(finalText, interimText) — fires on each result. finalText is
//       the cumulative confirmed transcript; interimText is the in-progress
//       tail not yet finalized.
//   onFatalError(message) — mic blocked / no device / service offline, with a
//       ready-to-show message string.
//   onStop() — recording has ended (via stop(), a rapid double-end, or a
//       fatal error). Fires at most once per recording session.
export function createDictation({ onTranscript, onFatalError, onStop } = {}) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return null;

  const recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let recording = false;
  let finalText = '';
  let interimText = '';
  let lastRestart = 0;

  recognition.onresult = (event) => {
    let interim = '', addedFinal = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) addedFinal += r[0].transcript + ' ';
      else interim += r[0].transcript + ' ';
    }
    if (addedFinal) finalText = (finalText + ' ' + addedFinal).trim() + ' ';
    interimText = interim.trim();
    onTranscript?.(finalText.trim(), interimText);
  };

  const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network']);
  recognition.onerror = (e) => {
    if (!FATAL.has(e.error)) return;
    recording = false;
    const msg = (e.error === 'not-allowed' || e.error === 'service-not-allowed')
      ? 'Mic blocked — switch to typing, or enable mic access.'
      : e.error === 'audio-capture'
        ? 'No mic detected — switch to typing.'
        : 'Voice service offline — tap to retry, or type below.';
    // Reset chrome first, then write the specific message — order matters:
    // onStop's setListeningChrome(false) rewrites status text, so it must not
    // run after onFatalError or it would clobber the actionable message.
    onStop?.();
    onFatalError?.(msg);
  };

  // The platform recognizer ends itself after a silent gap. While we still
  // mean to be recording, restart it to keep one continuous session — but a
  // sub-400ms re-end means it can't get going (mic gone, etc.), so give up.
  recognition.onend = () => {
    if (!recording) return;
    const now = Date.now();
    if (now - lastRestart < 400) { recording = false; onStop?.(); return; }
    lastRestart = now;
    try { recognition.start(); } catch {}
  };

  return {
    get recording() { return recording; },
    get finalText() { return finalText; },
    get interimText() { return interimText; },
    // Fold any pending interim tail into the confirmed transcript. Callers that
    // freeze the transcript on stop call this before reading finalText.
    flushInterim() {
      if (interimText) { finalText = (finalText + ' ' + interimText).trim() + ' '; interimText = ''; }
      return finalText.trim();
    },
    // Zero the transcript so a caller can run several independent capture
    // sessions on one helper (the discussion composer does this — each tap
    // should contribute only its own words, not re-append the previous take).
    reset() { finalText = ''; interimText = ''; },
    // Set recording only once the engine actually starts; a synchronous throw
    // (e.g. start() while already running) must not strand the flag at true.
    start() { try { recognition.start(); recording = true; } catch {} },
    stop() {
      if (!recording) return;
      recording = false;
      try { recognition.stop(); } catch {}
      onStop?.();
    },
  };
}

// articulationMic — the prominent "speak now" mic used in articulate
// practice steps. Has three visible states:
//   idle      — large pulsing-ring button, "Tap to start"
//   listening — solid accent, ring pulses, "Listening — speak now",
//               live interim transcript fills below
//   stopped   — frozen transcript + Submit / Retake row
// A "Type instead" toggle swaps the mic for a textarea without losing
// any text the learner already captured. If the browser has no
// SpeechRecognition, the component opens in typing mode from the start
// with a small footnote.
export function articulationMic({ audienceLabel = 'Listening', onChange, hint } = {}) {
  // The Web Speech engine is shared with every other voice input via
  // createDictation; this component only renders chrome and reacts.
  const dictation = createDictation({
    onTranscript: () => { paintTranscript(); emit(); },
    onFatalError: (msg) => { status.textContent = msg; },
    onStop: () => setListeningChrome(false),
  });
  const supported = !!dictation;
  let mode = supported ? 'voice' : 'type';

  const ring = el('span', { class: 'am-ring' });
  const micIcon = el('span', { class: 'am-icon' }, icon('mic'));
  const stopIcon = el('span', { class: 'am-icon am-icon-stop', style: { display: 'none' } },
    el('span', { class: 'am-stop-square' }));
  const button = el('button', { type: 'button', class: 'am-button', 'aria-label': 'Start recording' },
    ring, micIcon, stopIcon);

  const status = el('div', { class: 'am-status' },
    supported
      ? 'Tap the mic and speak your explanation'
      : 'Voice not supported here — switching to typing');

  const transcript = el('div', { class: 'am-transcript' });
  const typed = el('textarea', { rows: 5, class: 'am-textarea', placeholder: 'Type your explanation…' });
  const toggle = el('button', { type: 'button', class: 'am-toggle', 'aria-label': 'Switch input mode' },
    icon('chat'),
    el('span', { class: 'am-toggle-label' }, 'Type instead')
  );

  const voicePane = el('div', { class: 'am-voice' },
    el('div', { class: 'am-mic-wrap' }, button),
    status,
    transcript
  );
  const typePane = el('div', { class: 'am-type' }, typed);
  typePane.style.display = 'none';

  const root = el('div', { class: 'articulation-mic' },
    voicePane, typePane,
    // Coach hint lives inside the input card, under the capture area —
    // same in-card treatment as formulationField's hint.
    hint ? el('div', { class: 'fm-hint' },
      el('span', { class: 'fm-hint-avatar' }, icon('lightbulb')),
      el('p', null, hint)
    ) : null,
    el('div', { class: 'am-foot' }, toggle)
  );

  function emit() { onChange?.(getText()); }
  function getText() {
    if (mode === 'type') return typed.value.trim();
    return dictation ? (dictation.finalText + ' ' + dictation.interimText).trim() : '';
  }
  function paintTranscript() {
    const finalText = dictation ? dictation.finalText : '';
    const interimText = dictation ? dictation.interimText : '';
    if (!finalText && !interimText) {
      transcript.classList.remove('on');
      transcript.replaceChildren();
      return;
    }
    transcript.classList.add('on');
    transcript.replaceChildren(
      el('span', { class: 'am-final' }, finalText),
      interimText ? el('span', { class: 'am-interim' }, ' ' + interimText) : null
    );
  }
  function setListeningChrome(on) {
    button.classList.toggle('is-listening', on);
    micIcon.style.display = on ? 'none' : '';
    stopIcon.style.display = on ? '' : 'none';
    button.setAttribute('aria-label', on ? 'Stop recording' : 'Start recording');
    status.classList.toggle('is-live', on);
    const finalText = dictation ? dictation.finalText : '';
    const interimText = dictation ? dictation.interimText : '';
    status.textContent = on
      ? `${audienceLabel} — speak now`
      : (finalText || interimText
          ? 'Captured. Tap to add more, or submit below.'
          : 'Tap the mic and speak your explanation');
  }

  button.addEventListener('click', () => {
    if (!dictation) { status.textContent = 'Voice not supported — type below.'; return; }
    if (!dictation.recording) {
      dictation.start();
      setListeningChrome(true);
    } else {
      dictation.stop();
      dictation.flushInterim();
      paintTranscript();
      setListeningChrome(false);
      emit();
    }
  });

  typed.addEventListener('input', emit);

  toggle.addEventListener('click', () => {
    if (mode === 'voice') {
      if (dictation && dictation.recording) {
        dictation.stop();
        dictation.flushInterim();
        setListeningChrome(false);
      }
      const finalText = dictation ? dictation.finalText.trim() : '';
      if (finalText && !typed.value) typed.value = finalText;
      voicePane.style.display = 'none';
      typePane.style.display = '';
      toggle.querySelector('.am-toggle-label').textContent = 'Use voice instead';
      mode = 'type';
      setTimeout(() => typed.focus(), 0);
    } else {
      if (!supported) return;
      voicePane.style.display = '';
      typePane.style.display = 'none';
      toggle.querySelector('.am-toggle-label').textContent = 'Type instead';
      mode = 'voice';
    }
    emit();
  });

  if (!supported) {
    voicePane.style.display = 'none';
    typePane.style.display = '';
    toggle.style.display = 'none';
  }

  root.value = getText;
  root.mode = () => mode;
  root.stop = () => {
    if (dictation && dictation.recording) {
      dictation.stop();
      dictation.flushInterim();
      paintTranscript();
      setListeningChrome(false);
    }
  };
  return root;
}

// gradient generator — keeps every hero distinct without bitmaps.
// Hash the course id to a pair of hues, then build a layered gradient.
export function gradientFor(seed, accent = '#ff7a3d') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const a = (Math.abs(h) % 360);
  const b = (a + 60) % 360;
  return `radial-gradient(120% 80% at 80% 20%, ${accent}66 0%, transparent 55%),`
       + `linear-gradient(135deg, hsl(${a} 45% 22%) 0%, hsl(${b} 50% 12%) 100%)`;
}
