// views/home.js — Home / Dashboard.
// Composed entirely of ui.js primitives. The visible "what does the
// learner need NOW?" priority is preserved: greeting → urgent →
// readiness → coach prompt → required → saved.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js';

export function render() {
  const { learner, industry } = store.state;
  const root = document.createElement('section');
  root.className = 'stack';

  // Greeting — time-of-day + first name + unit/role line.
  const first = learner.name.split(' ')[0];
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const subline = learner.unit || `${learner.role} · ${industry.label}`;
  root.appendChild(ui.el('div', { class: 'home-greeting' },
    ui.el('h1', null, `Good ${partOfDay}, ${first}.`),
    ui.el('p', { class: 'muted' }, subline)
  ));

  // 1. Urgent alerts
  for (const a of adaptive.urgentAlerts()) {
    root.appendChild(ui.alertStrip({
      kicker: 'Action required',
      title: a.title,
      href: a.action.route,
      severity: a.severity
    }));
  }

  // 2. Readiness — the centerpiece of the home view.
  const snap = adaptive.readinessSnapshot();
  if (snap) {
    const note = noteFor(snap);
    const refresherHref = primaryActionHref(snap);
    root.appendChild(ui.readinessCard({
      level: snap.level,
      delta: snap.delta,
      status: snap.status,
      trend: snap.trend,
      movers: snap.movers,
      coachNote: note,
      ctaHref: refresherHref
    }));
  }

  // 3. In progress
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

  // 4. Coach Vic prompt
  const sugg = adaptive.practiceSuggestions(1)[0];
  const sc = sugg?.scenario ?? store.state.scenarios[0];
  const tone = learner.preferences.coachTone;
  const word = industry.language.practiceWord;
  const q = tone === 'supportive'
    ? `Hey ${first} — want to warm up with the “${sc.title}” ${word}?`
    : `${first}, ready to run the “${sc.title}” ${word}?`;
  root.appendChild(ui.coachPrompt({
    question: q,
    primaryLabel: 'Start practice',
    primaryHref: `#/practice/${sc.id}`
  }));

  // 5. Required training
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

  // 6. Saved
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

// Pick a refresher target — first lapsed cert's course, otherwise first required.
function primaryActionHref(snap) {
  const { learner } = store.state;
  const lapsed = (learner.certifications ?? []).find((c) => c.expiresInDays <= 30);
  if (lapsed) return `#/course/${lapsed.id}`;
  const req = adaptive.requiredQueue()[0];
  return req ? `#/course/${req.id}` : '#/coach';
}

function noteFor(snap) {
  const top = snap.movers.find((m) => m.direction === 'down');
  if (snap.status === 'action-needed') {
    const what = top ? top.title.replace(/^Cert lapsed: /, '') : 'a few items';
    return `Several gaps opened up. Let’s close the biggest one first — should take 8 min.`;
  }
  if (snap.status === 'watch') {
    return `You’re holding steady. A short refresh on ${top?.title ?? 'one weak area'} will keep you in the green.`;
  }
  return `Strong shape. A 5-minute drill keeps the streak going.`;
}
