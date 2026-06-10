// views/course.js — Course detail.
// Composed from ui.js primitives so this page stays in lockstep with
// every other surface that uses the same shapes (hero, stat tiles,
// status panel, coach message, primary CTA).

import { store } from '../store.js';
import * as ui from '../ui.js?v=scene-flow-1';
import { isAtLeast } from '../phase.js';

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
  const initials = course.title.split(/\s+/).slice(0,2).map((w) => w[0]).join('').toUpperCase();

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

  // 2. Title — the descriptive capability subtitle was removed to keep the
  // course header clean and focused on the primary action.
  root.appendChild(ui.el('div', { class: 'stack', style: { marginBottom: '14px' } },
    ui.el('h2', { style: { margin: '0', fontSize: '20px' } }, course.title)
  ));

  // 3. Meta bar doubles as the lessons accordion. The quiet "N lessons ·
  // duration" line is the summary; tapping it expands the lesson list
  // right here (closed by default to keep focus on the CTA). The chevron
  // rotates to point down when open.
  const metaAccordion = ui.el('details', { class: 'course-meta-bar' });
  metaAccordion.appendChild(ui.el('summary', { class: 'cmb-summary' },
    ui.el('span', { class: 'cmb-item' }, ui.icon('list'), `${course.lessons.length} lessons`),
    ui.el('span', { class: 'cmb-sep' }),
    ui.el('span', { class: 'cmb-item' }, ui.icon('clock'), `${course.estMinutes}m`),
    ui.icon('chevron', { class: 'cmb-chev' })
  ));

  const completedLessons = store.state.mastery.completedLessons?.[course.id] ?? [];
  const skipMap = new Map((course.skipChips || []).map((s) => [s.lessonId, s]));
  const lessonsBody = ui.el('div', { class: 'cmb-lessons' });

  for (let i = 0; i < course.lessons.length; i++) {
    const ch = course.lessons[i];
    const isCurrent = progress?.lesson === ch.id;
    const isDone = completedLessons.includes(ch.id);
    const status = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
    const skip = skipMap.get(ch.id);
    const isScenario = ch.type === 'scenario';
    const subParts = [`${ch.minutes} min`];
    if (isScenario) subParts.unshift('Practice');
    if (skip) subParts.push(skip.label);

    const card = ui.el('a', {
      class: `lesson-row-card ${status}`,
      href: `#/course/${course.id}/lesson/${ch.id}`
    });
    card.appendChild(ui.el('div', { class: 'lrc-num' }, String(i + 1).padStart(2, '0')));
    card.appendChild(ui.el('div', { class: 'lrc-body' },
      ui.el('strong', null, ch.title),
      ui.el('small', null, subParts.join(' · '))
    ));
    const statusGlyph = isDone ? 'check' : isCurrent ? 'arrowRight' : 'chevron';
    card.appendChild(ui.el('div', { class: 'lrc-status' }, ui.icon(statusGlyph)));
    lessonsBody.appendChild(card);

    if (skip?.rationale) {
      lessonsBody.appendChild(ui.el('p', { class: 'tiny muted', style: { margin: '-6px 12px 8px' } }, skip.rationale));
    }
  }
  metaAccordion.appendChild(lessonsBody);
  root.appendChild(metaAccordion);

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

  // 8. Primary CTA — pinned to the bottom of the page so the main action
  // is always reachable with a thumb, regardless of scroll position.
  const ctaChildren = [
    ui.primaryCta(progress ? 'Resume course' : 'Start course',
      `#/course/${course.id}/start`,
      { percent: pct })
  ];
  if (course.mandated && isAtLeast(4)) {
    ctaChildren.push(ui.el('p', { class: 'tiny muted center', style: { margin: '8px 0 0' } },
      'Required completion under your role assignment.'));
  }
  root.appendChild(ui.stickyFooter({ children: ctaChildren }));

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
