// views/home.js — Home / Dashboard.
// Composed entirely of ui.js primitives. The visible "what does the
// learner need NOW?" priority is preserved: urgent → in-progress →
// coach prompt → required → saved.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js';

export function render() {
  const { learner, industry } = store.state;
  const root = document.createElement('section');
  root.className = 'stack';

  // Greeting (compact — the In Progress card carries visual weight)
  root.appendChild(ui.el('div', null,
    ui.el('h1', { style: { margin: '6px 4px 0', fontSize: '22px' } }, `Hi ${learner.name.split(' ')[0]}.`),
    ui.el('p', { class: 'muted tiny', style: { margin: '2px 4px 10px' } }, industry.tagline)
  ));

  // 1. Urgent alerts
  for (const a of adaptive.urgentAlerts()) {
    root.appendChild(ui.alertStrip({
      kicker: a.severity === 'urgent' ? 'Certification expiring' : 'Heads up',
      title: a.title,
      href: a.action.route,
      severity: a.severity
    }));
  }

  // 2. In progress — the prominent status panel from the design system
  const inProg = adaptive.inProgress();
  if (inProg.length) {
    const { course, progress } = inProg[0];
    const ch = course.chapters.find((c) => c.id === progress.chapter) ?? course.chapters[0];
    const pct = Math.round((progress.percent ?? 0) * 100);
    root.appendChild(ui.sectionHeader('In progress', inProg.length > 1 ? '#/courses' : null));
    root.appendChild(ui.statusPanel({
      kicker: course.title,
      value: `${ch.title} · ${pct}%`,
      href: `#/course/${course.id}/chapter/${ch.id}`,
      percent: pct
    }));
  }

  // 3. Coach Vic prompt
  const sugg = adaptive.practiceSuggestions(1)[0];
  const sc = sugg?.scenario ?? store.state.scenarios[0];
  const tone = learner.preferences.coachTone;
  const word = industry.language.practiceWord;
  const first = learner.name.split(' ')[0];
  const q = tone === 'supportive'
    ? `Hey ${first} — want to warm up with the “${sc.title}” ${word}?`
    : `${first}, ready to run the “${sc.title}” ${word}?`;
  root.appendChild(ui.coachPrompt({
    question: q,
    primaryLabel: 'Start practice',
    primaryHref: `#/practice/${sc.id}`
  }));

  // 4. Required training
  const req = adaptive.requiredQueue();
  if (req.length) {
    root.appendChild(ui.sectionHeader('Required training', '#/courses'));
    for (const c of req) {
      root.appendChild(ui.rowCard({
        glyph: 'flag',
        title: c.title,
        sub: 'Required',
        href: `#/course/${c.id}`
      }));
    }
  }

  // 5. Saved
  const saved = store.state.mastery.saved;
  if (saved.length) {
    root.appendChild(ui.sectionHeader('Saved'));
    for (const id of saved) {
      const c = store.course(id);
      if (!c) continue;
      root.appendChild(ui.rowCard({ glyph: 'star', title: c.title, sub: 'Saved', href: `#/course/${c.id}` }));
    }
  }

  return root;
}
