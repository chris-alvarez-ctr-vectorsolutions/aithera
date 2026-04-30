// views/home.js — Home is a *feed*, not a static dashboard.
// The order of sections answers "what does this learner need RIGHT NOW?"
//   1. Urgent alerts (cert lapse, mandated)
//   2. In-progress (resume cleanly)
//   3. Required queue
//   4. Practice suggestions (with adaptive rationale visible)
//   5. Saved
//   6. Coach Vic entry
import { store } from '../store.js';
import * as adaptive from '../adaptive.js';

export function render() {
  const { learner, industry } = store.state;
  const root = document.createElement('section');
  root.className = 'stack';

  // Greeting
  const hello = document.createElement('div');
  hello.innerHTML = `
    <h1 style="margin:6px 4px 0;font-size:24px;">Hi ${learner.name.split(' ')[0]}.</h1>
    <p class="muted" style="margin:2px 4px 8px">${industry.tagline}</p>
    <div class="row" style="margin:0 4px 8px;gap:6px;flex-wrap:wrap">
      <span class="tag accent">${learner.role}</span>
      <span class="tag">${learner.experienceLevel}</span>
      <span class="tag good">${learner.stats.streakDays}-day streak</span>
      <span class="tag">${learner.stats.weeklyMinutes} min this week</span>
    </div>
  `;
  root.appendChild(hello);

  // 1. Urgent
  const alerts = adaptive.urgentAlerts();
  if (alerts.length) {
    root.appendChild(sectionH('Urgent', null));
    for (const a of alerts) root.appendChild(alertCard(a));
  }

  // 2. In progress
  const inProg = adaptive.inProgress();
  if (inProg.length) {
    root.appendChild(sectionH('Continue', null));
    for (const ip of inProg) root.appendChild(progressCard(ip));
  }

  // 3. Required
  const req = adaptive.requiredQueue();
  if (req.length) {
    root.appendChild(sectionH('Required for your role', null));
    for (const c of req) root.appendChild(courseCard(c, { compact: true }));
  }

  // 4. Practice suggestions (with rationale)
  const sugg = adaptive.practiceSuggestions(3);
  if (sugg.length) {
    root.appendChild(sectionH(`Suggested ${industry.language.practiceWord}`, '#/hub'));
    for (const p of sugg) root.appendChild(practiceCard(p));
  }

  // 5. Saved
  if (store.state.mastery.saved.length) {
    root.appendChild(sectionH('Saved', null));
    for (const id of store.state.mastery.saved) {
      const c = store.course(id); if (c) root.appendChild(courseCard(c, { compact: true }));
    }
  }

  // 6. Coach Vic entry
  root.appendChild(sectionH('Coach Vic', null));
  const coachCard = document.createElement('a');
  coachCard.className = 'card coach';
  coachCard.href = '#/coach';
  coachCard.innerHTML = `
    <div class="row between">
      <div>
        <span class="tag accent">AI Coach</span>
        <h3>Ask, practice, or reflect with Vic</h3>
        <p>Bounded to your trusted course content. Adapts tone to your profile.</p>
      </div>
      <span class="btn primary sm">Open</span>
    </div>
  `;
  root.appendChild(coachCard);

  return root;
}

function sectionH(label, link) {
  const h = document.createElement('div');
  h.className = 'section-h';
  h.innerHTML = `<h2>${label}</h2>${link ? `<a href="${link}">See all</a>` : ''}`;
  return h;
}

function alertCard(a) {
  const el = document.createElement('a');
  el.className = `card ${a.severity === 'urgent' ? 'urgent' : 'alert'}`;
  el.href = a.action.route;
  el.innerHTML = `
    <div class="row between">
      <span class="tag ${a.severity === 'urgent' ? 'bad' : 'warn'}">${a.severity === 'urgent' ? 'Action needed' : 'Heads up'}</span>
      <span class="tiny muted">${a.kind}</span>
    </div>
    <h3>${a.title}</h3>
    <p>${a.body}</p>
    <div class="row" style="margin-top:10px"><span class="btn sm">${a.action.label} →</span></div>
  `;
  return el;
}

function progressCard({ course, progress }) {
  const el = document.createElement('a');
  el.className = 'card';
  el.href = `#/course/${course.id}`;
  const pct = Math.round((progress.percent ?? 0) * 100);
  el.innerHTML = `
    <div class="row between">
      <span class="tag">In progress</span>
      <span class="tiny muted">${pct}%</span>
    </div>
    <h3>${course.title}</h3>
    <p>Picking up at: ${chapterLabel(course, progress.chapter)}</p>
    <div class="progress" style="margin-top:10px"><span style="width:${pct}%"></span></div>
  `;
  return el;
}

function courseCard(course, { compact } = {}) {
  const el = document.createElement('a');
  el.className = 'card';
  el.href = `#/course/${course.id}`;
  const caps = (course.capabilities || []).map((c) => `<span class="tag">${c}</span>`).join(' ');
  el.innerHTML = `
    <div class="row between">
      <span class="tag accent">${course.mandated ? 'Required' : 'Recommended'}</span>
      <span class="tiny muted">${course.estMinutes} min</span>
    </div>
    <h3>${course.title}</h3>
    ${compact ? '' : `<p>${course.summary}</p>`}
    <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">${caps}</div>
  `;
  return el;
}

function practiceCard({ scenario, reason }) {
  const el = document.createElement('a');
  el.className = 'card';
  el.href = `#/practice/${scenario.id}`;
  el.innerHTML = `
    <div class="row between">
      <span class="tag accent">${store.state.industry.language.practiceWord}</span>
      <span class="tiny muted">${scenario.estMinutes} min</span>
    </div>
    <h3>${scenario.title}</h3>
    <p>${scenario.outcomeType}</p>
    <p class="tiny muted" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px"><strong>Why this:</strong> ${reason}</p>
  `;
  return el;
}

function chapterLabel(course, chId) {
  return course.chapters.find((c) => c.id === chId)?.title ?? course.chapters[0].title;
}
