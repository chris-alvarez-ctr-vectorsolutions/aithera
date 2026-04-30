// views/home.js — Home / Dashboard.
// Reshape per Vector mockup: single prominent In Progress card with a
// strong Resume CTA, a Coach Vic prompt card with explicit actions, and
// a compact Required Training list. Urgent alerts render as a slim
// strip at the very top so they're impossible to miss but don't dominate.
import { store } from '../store.js';
import * as adaptive from '../adaptive.js';

export function render() {
  const { learner, industry } = store.state;
  const root = document.createElement('section');
  root.className = 'stack';

  // Greeting (kept compact — the In Progress card carries visual weight)
  const hello = document.createElement('div');
  hello.innerHTML = `
    <h1 style="margin:6px 4px 0;font-size:22px">Hi ${learner.name.split(' ')[0]}.</h1>
    <p class="muted tiny" style="margin:2px 4px 10px">${industry.tagline}</p>
  `;
  root.appendChild(hello);

  // 1. Urgent alerts (slim strips)
  for (const a of adaptive.urgentAlerts()) root.appendChild(alertStrip(a));

  // 2. In progress (prominent)
  const inProg = adaptive.inProgress();
  if (inProg.length) {
    root.appendChild(sectionH('In progress', inProg.length > 1 ? '#/courses' : null));
    root.appendChild(inProgressCard(inProg[0]));
  }

  // 3. Coach Vic prompt — adaptive: pick weakest concept's scenario
  root.appendChild(coachPromptCard());

  // 4. Required training (compact rows)
  const req = adaptive.requiredQueue();
  if (req.length) {
    root.appendChild(sectionH('Required training', '#/courses'));
    for (const c of req) root.appendChild(requiredRow(c));
  }

  // 5. Saved (still useful, kept slim)
  const saved = store.state.mastery.saved;
  if (saved.length) {
    root.appendChild(sectionH('Saved', null));
    for (const id of saved) {
      const c = store.course(id); if (c) root.appendChild(requiredRow(c, { saved: true }));
    }
  }

  return root;
}

function sectionH(label, link) {
  const h = document.createElement('div');
  h.className = 'section-h';
  h.innerHTML = `<h2>${label}</h2>${link ? `<a href="${link}">View all</a>` : ''}`;
  return h;
}

function alertStrip(a) {
  const el = document.createElement('a');
  el.className = 'alert-strip';
  el.href = a.action.route;
  el.innerHTML = `
    <span class="glyph" aria-hidden="true">⚠</span>
    <div class="body">
      <small>${a.severity === 'urgent' ? 'Certification expiring' : 'Heads up'}</small>
      <strong>${a.title}</strong>
    </div>
    <span class="chev" aria-hidden="true">›</span>
  `;
  return el;
}

function inProgressCard({ course, progress }) {
  const pct = Math.round((progress.percent ?? 0) * 100);
  const ch = course.chapters.find((c) => c.id === progress.chapter) ?? course.chapters[0];
  const chIdx = course.chapters.findIndex((c) => c.id === ch.id) + 1;
  const minutesLeft = course.chapters
    .slice(chIdx - 1)
    .reduce((s, c) => s + (c.minutes || 0), 0);
  const initials = course.title.split(/\s+/).slice(0,2).map((w) => w[0]).join('').toUpperCase();

  const el = document.createElement('div');
  el.className = 'in-progress';
  el.innerHTML = `
    <div class="ip-head">
      <div class="thumb">${initials}</div>
      <div style="flex:1;min-width:0">
        <h3>${course.title}</h3>
        <p class="muted tiny" style="margin:4px 0 0">Chapter ${chIdx}: ${ch.title}</p>
      </div>
    </div>
    <div class="ip-meta">
      <span>${pct}% complete</span>
      <span>~${minutesLeft} min left</span>
    </div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <a class="resume" href="#/course/${course.id}/chapter/${ch.id}">Resume</a>
  `;
  return el;
}

function coachPromptCard() {
  // Pick the weakest concept's scenario as the engagement hook.
  const sugg = adaptive.practiceSuggestions(1)[0];
  const sc = sugg?.scenario ?? store.state.scenarios[0];
  const learner = store.state.learner;
  const word = store.state.industry.language.practiceWord;
  const tone = learner.preferences.coachTone;
  const first = learner.name.split(' ')[0];
  const q = tone === 'supportive'
    ? `Hey ${first} — want to warm up with the “${sc.title}” ${word}?`
    : `${first}, ready to run the “${sc.title}” ${word}?`;

  const el = document.createElement('div');
  el.className = 'coach-prompt';
  el.innerHTML = `
    <div class="ph"><i class="ico ico-coach" aria-hidden="true"></i><span>Coach Vic</span></div>
    <p class="q">"${q}"</p>
    <div class="actions">
      <a class="btn primary" style="flex:1" href="#/practice/${sc.id}">Start practice</a>
      <a class="btn ghost" href="#/coach">Later</a>
    </div>
  `;
  return el;
}

function requiredRow(course, { saved } = {}) {
  const a = document.createElement('a');
  a.className = 'row-card';
  a.href = `#/course/${course.id}`;
  const due = course.mandated ? `Due in 30 days` : (saved ? 'Saved' : 'Recommended');
  const glyph = course.mandated ? '⚑' : (saved ? '★' : '◆');
  a.innerHTML = `
    <span class="glyph" aria-hidden="true">${glyph}</span>
    <div class="body">
      <strong>${course.title}</strong>
      <small>${due}</small>
    </div>
    <span class="kebab" aria-hidden="true">⋯</span>
  `;
  return a;
}
