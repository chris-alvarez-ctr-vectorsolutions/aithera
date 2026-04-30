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
  circle:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`
};

// ---------- tiny element factory ----------
export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
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

export function sectionHeader(label, link) {
  return el('div', { class: 'section-h' },
    el('h2', null, label),
    link ? el('a', { href: link }, 'View all') : null
  );
}

// ---------- blocks ----------

// hero — gradient image area with optional corner badge.
// Pulls from course.hero { from, to } or derives a gradient from the
// industry accent so each course feels distinct without bitmap assets.
export function hero({ initials, gradient, badge, height = 200 }) {
  const wrap = el('div', { class: 'hero-img', style: { height: `${height}px` } });
  if (gradient) wrap.style.background = gradient;
  if (badge) {
    wrap.appendChild(el('span', { class: `hero-badge ${badge.variant || ''}` }, badge.label));
  }
  if (initials) {
    wrap.appendChild(el('span', { class: 'hero-mark' }, initials));
  }
  return wrap;
}

export function statTile({ icon: iconName, value, label }) {
  return el('div', { class: 'stat-tile' },
    icon(iconName, { class: 'stat-icon' }),
    el('div', { class: 'stat-value' }, value),
    el('div', { class: 'stat-label' }, label)
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
  const inner = el('div', { class: 'sp-inner' },
    el('div', { class: 'sp-text' },
      el('div', { class: 'sp-kicker' }, kicker),
      el('div', { class: 'sp-value' }, value),
      typeof percent === 'number' ? progressBar(percent) : null
    ),
    el('div', { class: 'sp-cta' }, icon('play'))
  );
  return el('a', { class: 'status-panel', href: href || '#' }, inner);
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

export function rowCard({ glyph = 'flag', title, sub, href, onClick, kebab = true }) {
  const a = el(href ? 'a' : 'div', { class: 'row-card', href, on: onClick ? { click: onClick } : null });
  a.appendChild(el('span', { class: 'row-glyph' }, icon(glyph)));
  a.appendChild(el('div', { class: 'row-body' },
    el('strong', null, title),
    sub ? el('small', null, sub) : null
  ));
  if (kebab) a.appendChild(el('span', { class: 'row-kebab', 'aria-label': 'More' }, icon('kebab')));
  return a;
}

// coachMessage — Vic avatar + text bubble. Used on course detail,
// chapter, summary, etc. Single source for the "Vic says…" pattern.
export function coachMessage({ title, text, footer = '— Coach Vic' }) {
  const card = el('div', { class: 'coach-message' },
    el('div', { class: 'cm-avatar', 'aria-hidden': 'true' }, 'V'),
    el('div', { class: 'cm-body' },
      title ? el('strong', null, title) : null,
      el('p', null, text),
      el('small', null, footer)
    )
  );
  return card;
}

export function coachPrompt({ question, primaryLabel, primaryHref, secondaryLabel = 'Later', secondaryHref = '#/coach' }) {
  return el('div', { class: 'coach-prompt' },
    el('div', { class: 'ph' }, el('span', { class: 'ph-mark' }, 'V'), el('span', null, 'Coach Vic')),
    el('p', { class: 'q' }, `"${question}"`),
    el('div', { class: 'actions' },
      el('a', { class: 'btn primary', href: primaryHref, style: { flex: '1' } }, primaryLabel),
      el('a', { class: 'btn ghost', href: secondaryHref }, secondaryLabel)
    )
  );
}

export function primaryCta(label, href) {
  return el('a', { class: 'btn primary block cta-large', href },
    el('span', null, label),
    icon('chevron')
  );
}

// Card surface helper — used as the standard course tile in lists.
export function courseTile(course, { progress, compact = false } = {}) {
  const a = el('a', { class: 'card', href: `#/course/${course.id}` });
  const pct = progress ? Math.round((progress.percent ?? 0) * 100) : null;
  a.appendChild(el('div', { class: 'row between' },
    tag(course.mandated ? 'Required' : 'Recommended', course.mandated ? 'accent' : ''),
    el('span', { class: 'tiny muted' }, `${course.estMinutes} min`)
  ));
  a.appendChild(el('h3', null, course.title));
  if (!compact) a.appendChild(el('p', null, course.summary));
  if (pct != null) a.appendChild(progressBar(pct));
  return a;
}

// chapterHeader — module kicker, title, and chapter-level actions
// (Save Reference / Mark Complete). Mirrors the desktop mockup's
// header bar in mobile single-column form.
export function chapterHeader({ kicker, title, isSaved, isComplete, onSave, onComplete }) {
  const actions = el('div', { class: 'ch-actions' },
    el('button', {
      class: `ch-action${isSaved ? ' on' : ''}`,
      on: { click: onSave },
      'aria-label': 'Save reference'
    }, icon('star'), el('span', null, isSaved ? 'Saved' : 'Save')),
    el('button', {
      class: `ch-action complete${isComplete ? ' on' : ''}`,
      on: { click: onComplete },
      'aria-label': 'Mark complete'
    }, icon(isComplete ? 'check' : 'circle'), el('span', null, isComplete ? 'Completed' : 'Mark complete'))
  );
  return el('div', { class: 'ch-header' },
    el('div', { class: 'ch-kicker' }, kicker),
    el('h2', { class: 'ch-title' }, title),
    actions
  );
}

// AI Assistant panel — the four "any-content" modalities up top.
// onAction(name) is invoked with: 'read' | 'summarize' | 'simpler' | 'chat'.
export function assistantPanel({ onAction }) {
  const action = (id, label, iconName) =>
    el('button', { class: 'ai-act', on: { click: () => onAction(id) } },
      el('span', { class: 'ai-glyph' }, icon(iconName)),
      el('span', { class: 'ai-label' }, label),
      el('span', { class: 'ai-chev' }, icon('chevron'))
    );
  return el('div', { class: 'assistant-panel' },
    el('div', { class: 'ap-head' },
      el('span', { class: 'ap-mark' }, icon('sparkle')),
      el('span', { class: 'ap-name' }, 'AI Assistant'),
      el('span', { class: 'ap-dot' })
    ),
    el('div', { class: 'ap-actions' },
      action('read',      'Read to me',      'speaker'),
      action('summarize', 'Summarize',       'list'),
      action('simpler',   'Simpler terms',   'lightbulb'),
      action('chat',      'Start conversation', 'chat')
    )
  );
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

// nextUpCard — preview of the upcoming chapter, mirrors the right-rail
// "Next Up" card from the desktop mockup.
export function nextUpCard({ kicker = 'Next up', title, subtitle, href, initials }) {
  return el('a', { class: 'next-up', href },
    el('div', { class: 'nu-thumb' }, initials || icon('play')),
    el('div', { class: 'nu-body' },
      el('small', null, kicker),
      el('strong', null, title),
      subtitle ? el('span', { class: 'nu-sub' }, subtitle) : null
    ),
    el('span', { class: 'nu-chev' }, icon('chevron'))
  );
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
