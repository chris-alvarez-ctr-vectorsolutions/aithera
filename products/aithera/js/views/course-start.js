// views/course-start.js — "How do you want to learn?" modality chooser.
//
// Sits between the course detail "Start course" CTA and the lesson flow.
// The learner picks a starting format (Video / Reading / AI chat); the
// choice rides into the lesson as ?via=<mode> and is applied as the
// opening modality. They can still switch formats mid-lesson via the
// "Try another way" panel, so this is a soft default, not a lock-in.

import { store } from '../store.js';
import * as ui from '../ui.js?v=course-flow-1';

export function render(courseId) {
  const course = store.course(courseId);
  const root = document.createElement('section');
  if (!course) {
    root.appendChild(ui.el('p', { class: 'muted' }, 'Course not found.'));
    return root;
  }

  // Resume target — same lesson the CTA would have opened directly.
  const progress = store.state.mastery.courseProgress[course.id];
  const resumeLessonId = progress?.lesson ?? course.lessons[0].id;
  const base = `#/course/${course.id}/lesson/${resumeLessonId}`;

  root.appendChild(ui.el('header', { class: 'start-head' },
    ui.el('p', { class: 'start-kicker' }, course.title),
    ui.el('h1', { class: 'start-title' }, 'How do you want to learn?'),
    ui.el('p', { class: 'start-sub muted' },
      'Pick a format to start with — you can switch anytime during the lesson.')
  ));

  // Each tile maps to a modality the lesson already knows how to render.
  const tiles = [
    { mode: 'video', cls: 'video', icon: 'play', title: 'Video',
      desc: 'Watch short briefings you can pause and rewatch.' },
    { mode: 'read',  cls: 'read',  icon: 'doc',  title: 'Reading',
      desc: 'Work through the material as text, at your own pace.' },
    { mode: 'chat',  cls: 'chat',  icon: 'chat', title: 'AI chat',
      desc: 'Learn by talking it through with Coach Vic.' }
  ];

  const list = ui.el('div', { class: 'start-tiles' });
  for (const t of tiles) {
    list.appendChild(ui.el('a', { class: `start-tile ${t.cls}`, href: `${base}?via=${t.mode}` },
      ui.el('span', { class: 'start-tile-icon' }, ui.icon(t.icon)),
      ui.el('span', { class: 'start-tile-body' },
        ui.el('strong', null, t.title),
        ui.el('small', null, t.desc)
      ),
      ui.el('span', { class: 'start-tile-arrow' }, ui.icon('arrowRight'))
    ));
  }
  root.appendChild(list);

  return root;
}
