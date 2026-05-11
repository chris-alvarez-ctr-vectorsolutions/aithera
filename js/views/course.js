// views/course.js — Course detail.
// Composed from ui.js primitives so this page stays in lockstep with
// every other surface that uses the same shapes (hero, stat tiles,
// status panel, coach message, primary CTA).

import { store } from '../store.js';
import * as ui from '../ui.js';

export function render(courseId) {
  const course = store.course(courseId);
  const root = document.createElement('section');
  if (!course) {
    root.appendChild(ui.el('p', { class: 'muted' }, 'Course not found.'));
    return root;
  }

  const progress = store.state.mastery.courseProgress[course.id];
  const concepts = course.concepts.map((c) => ({
    ...c, live: store.state.mastery.concepts[c.id] ?? c.mastery
  }));
  const mastered = concepts.filter((c) => c.live >= 0.75).length;
  const weak     = concepts.filter((c) => c.live < 0.55);
  const pct = Math.round((progress?.percent ?? 0) * 100);
  const resumeLessonId = progress?.lesson ?? course.lessons[0].id;
  const initials = course.title.split(/\s+/).slice(0,2).map((w) => w[0]).join('').toUpperCase();
  const saved = store.state.mastery.saved.includes(course.id);

  // 1. Hero with mandated badge + course initials mark.
  // Image lookup convention: drop a file at assets/courses/<course.id>.jpg
  // and the hero picks it up automatically. If the file is missing the
  // <img> errors out and the gradient stands alone — no broken state.
  root.appendChild(ui.hero({
    initials,
    image: course.heroImage || `assets/courses/${course.id}.jpg`,
    gradient: ui.gradientFor(course.id, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d'),
    badge: course.mandated
      ? { label: 'Mandated', variant: '' }
      : { label: 'Recommended', variant: 'recommended' }
  }));

  // 2. Title + subtitle (uses the lesson the learner is on if any)
  const subline = progress
    ? `Picking up at: ${course.lessons.find((c) => c.id === progress.lesson)?.title ?? course.lessons[0].title}`
    : course.capabilities.join(' · ');

  root.appendChild(ui.el('div', { class: 'stack', style: { marginBottom: '14px' } },
    ui.el('div', { class: 'row between' },
      ui.el('h2', { style: { margin: '0', fontSize: '20px' } }, course.title),
      ui.el('button', { class: 'btn sm ghost', on: { click: () => store.toggleSaved(course.id) } },
        saved ? '★ Saved' : '☆ Save')
    ),
    ui.el('p', { class: 'muted', style: { margin: '6px 0 0' } }, subline)
  ));

  // 3. Stat tiles row — lesson count + duration
  root.appendChild(ui.statTileRow([
    { icon: 'list',  value: String(course.lessons.length), label: 'Lessons' },
    { icon: 'clock', value: `${course.estMinutes}m`,       label: 'Est. duration' }
  ]));

  // 4. Status panel — current state with play affordance
  root.appendChild(ui.statusPanel({
    kicker: 'Current status',
    value: pct === 0 ? '0% completed' : pct === 100 ? 'Complete' : `${pct}% completed`,
    href: `#/course/${course.id}/lesson/${resumeLessonId}`,
    percent: pct
  }));

  // 5. Coach message — adapts greeting tone
  root.appendChild(ui.coachMessage({
    title: progress ? 'Welcome back.' : `Ready to start, ${store.state.learner.name.split(' ')[0]}?`,
    text: coachLine(course, progress, store.state.learner.preferences.coachTone)
  }));

  // 6. Mastery breakdown (page-specific)
  root.appendChild(ui.el('div', { class: 'card' },
    ui.el('div', { class: 'row between' },
      ui.el('strong', null, 'Mastery'),
      ui.el('span', { class: 'tiny muted' }, `${mastered}/${concepts.length} concepts mastered`)
    ),
    ui.el('div', { class: 'mastery-bar', style: { '--n': concepts.length } },
      ...concepts.map((c) => {
        const i = ui.el('i', { 'aria-label': `${c.label} ${(c.live*100|0)}%` });
        i.className = c.live >= 0.75 ? 'on' : c.live < 0.55 ? 'weak' : '';
        return i;
      })
    ),
    ui.el('hr', { class: 'hr' }),
    ...concepts.map((c) =>
      ui.el('div', { class: 'kv' },
        ui.el('span', null, c.label),
        ui.el('span', null, `${(c.live*100|0)}%`)
      )
    ),
    weak.length
      ? ui.el('p', { class: 'tiny muted', style: { marginTop: '8px' } },
          ui.el('strong', { style: { color: 'var(--bad)' } }, 'Unmastered: '),
          weak.map((w) => w.label).join(' · '))
      : null
  ));

  // 6.5 Adaptive banner — only when the course is flagged adaptive.
  if (course.adaptive && course.adaptive_banner) {
    const banner = ui.el('div', { class: 'card', style: { borderLeft: '3px solid var(--accent)' } },
      ui.el('strong', null, '✨ Tailored for you'),
      ui.el('p', { class: 'tiny muted', style: { margin: '6px 0 0' } }, course.adaptive_banner)
    );
    root.appendChild(banner);
  }

  // 7. Lessons — with optional skip suggestion chips for adaptive courses
  root.appendChild(ui.sectionHeader('Lessons'));
  const skipMap = new Map((course.skipChips || []).map((s) => [s.lessonId, s]));
  for (let i = 0; i < course.lessons.length; i++) {
    const ch = course.lessons[i];
    const isCurrent = progress?.lesson === ch.id;
    const skip = skipMap.get(ch.id);
    const subParts = [`${ch.minutes} min`];
    if (isCurrent) subParts.push('You are here');
    if (skip) subParts.push(skip.label);
    root.appendChild(ui.rowCard({
      glyph: skip ? 'sparkle' : (isCurrent ? 'bolt' : 'doc'),
      title: `${i+1}. ${ch.title}`,
      sub: subParts.join(' · '),
      href: `#/course/${course.id}/lesson/${ch.id}`,
      kebab: false
    }));
    if (skip?.rationale) {
      root.appendChild(ui.el('p', { class: 'tiny muted', style: { margin: '-6px 12px 8px' } }, skip.rationale));
    }
  }

  // 8. Primary CTA + footnote (matches mockup)
  root.appendChild(ui.primaryCta(progress ? 'Resume course' : 'Start course',
    `#/course/${course.id}/lesson/${resumeLessonId}`));
  if (course.mandated) {
    root.appendChild(ui.el('p', { class: 'tiny muted center', style: { marginTop: '8px' } },
      'Required completion under your role assignment.'));
  }

  return root;
}

function coachLine(course, progress, tone) {
  if (progress) {
    return tone === 'supportive'
      ? `You're picking up "${course.lessons.find((c) => c.id === progress.lesson)?.title}". The earlier lessons set up exactly what you need next.`
      : `Resuming "${course.lessons.find((c) => c.id === progress.lesson)?.title}". You've got the foundation — let's close the loop.`;
  }
  return tone === 'supportive'
    ? `This course pairs short reading with a scenario, so practice will lock the pieces together. Take it at your pace.`
    : `Short reads, then a scenario. Practice locks the pieces together — don't skip it.`;
}
