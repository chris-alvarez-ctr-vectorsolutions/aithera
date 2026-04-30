// views/course.js — Course detail.
// Mastery is treated as a first-class progress signal — % complete is
// secondary to "concepts mastered". Unmastered concepts get visually
// flagged so the learner sees what remains.
import { store } from '../store.js';

export function render(courseId) {
  const course = store.course(courseId);
  const root = document.createElement('section');
  if (!course) { root.innerHTML = '<p class="muted">Course not found.</p>'; return root; }

  const progress = store.state.mastery.courseProgress[course.id];
  const concepts = course.concepts.map((c) => ({
    ...c,
    live: store.state.mastery.concepts[c.id] ?? c.mastery
  }));
  const mastered = concepts.filter((c) => c.live >= 0.75).length;
  const weak     = concepts.filter((c) => c.live < 0.55);

  const cont = progress ? `Resume — ${course.chapters.find((c) => c.id === progress.chapter)?.title}` : 'Begin';
  const saved = store.state.mastery.saved.includes(course.id);

  root.innerHTML = `
    <div class="card" style="margin-top:6px">
      <div class="row between">
        <span class="tag accent">${course.mandated ? 'Required' : 'Recommended'}</span>
        <button class="btn sm ghost" id="saveBtn">${saved ? '★ Saved' : '☆ Save'}</button>
      </div>
      <h3 style="font-size:18px">${course.title}</h3>
      <p>${course.summary}</p>
      <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">
        <span class="tag">${course.estMinutes} min</span>
        ${(course.capabilities || []).map((c) => `<span class="tag">${c}</span>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="row between"><strong>Mastery</strong>
        <span class="tiny muted">${mastered}/${concepts.length} concepts mastered</span>
      </div>
      <div class="mastery-bar" style="--n:${concepts.length}">
        ${concepts.map((c) => `<i class="${c.live >= 0.75 ? 'on' : c.live < 0.55 ? 'weak' : ''}" title="${c.label} ${(c.live*100|0)}%"></i>`).join('')}
      </div>
      <hr class="hr" />
      ${concepts.map((c) => `
        <div class="kv">
          <span>${c.label}</span>
          <span>${(c.live*100|0)}%</span>
        </div>
      `).join('')}
      ${weak.length ? `<p class="tiny muted" style="margin-top:8px"><strong style="color:var(--bad)">Unmastered:</strong> ${weak.map((w) => w.label).join(' · ')}</p>` : ''}
    </div>

    <div class="card">
      <strong>Chapters</strong>
      <div style="margin-top:8px" class="stack">
        ${course.chapters.map((ch, i) => `
          <a class="card" href="#/course/${course.id}/chapter/${ch.id}" style="margin:0">
            <div class="row between">
              <span class="tiny muted">Chapter ${i+1}</span>
              <span class="tiny muted">${ch.minutes} min</span>
            </div>
            <h3 style="margin:4px 0 0">${ch.title}</h3>
          </a>
        `).join('')}
      </div>
    </div>

    <div class="card" style="background:linear-gradient(180deg, rgba(255,122,61,0.10), var(--bg-card))">
      <strong>Why this course?</strong>
      <p class="muted" style="margin-top:6px">${course.credibility}</p>
      <p class="tiny muted">Most learners finish in ~${Math.max(15, course.estMinutes-5)}–${course.estMinutes+8} minutes. Practice and Coach Vic count toward mastery — passive minutes don't.</p>
    </div>

    <button class="btn primary block" id="cta">${cont}</button>
  `;

  root.querySelector('#saveBtn').onclick = () => store.toggleSaved(course.id);
  root.querySelector('#cta').onclick = () => {
    const chId = progress?.chapter ?? course.chapters[0].id;
    location.hash = `#/course/${course.id}/chapter/${chId}`;
  };

  return root;
}
