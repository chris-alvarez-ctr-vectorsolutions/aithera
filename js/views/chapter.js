// views/chapter.js — Main learning flow.
// Renders blocks (video|text|poll|concept) inline, with a sticky
// "AI utility rail" (Summarize / Explain / Read to me / Live mode) and
// inline calls to Coach + Practice. Polls give immediate, content-grounded
// feedback — they are *not* generative.
import { store } from '../store.js';

export function render(courseId, chapterId) {
  const course = store.course(courseId);
  const chapter = course?.chapters.find((c) => c.id === chapterId);
  const root = document.createElement('section');
  if (!chapter) { root.innerHTML = '<p class="muted">Chapter not found.</p>'; return root; }

  const idx = course.chapters.findIndex((c) => c.id === chapterId);
  const next = course.chapters[idx + 1];
  const scenario = store.scenariosForCourse(course.id)[0];

  root.innerHTML = `
    <div class="row between" style="margin:4px 4px 8px">
      <span class="tiny muted">${course.title} · Chapter ${idx+1}/${course.chapters.length}</span>
      <span class="tiny muted">${chapter.minutes} min</span>
    </div>
    <h2 style="margin:0 4px 8px">${chapter.title}</h2>

    <div class="utility-rail">
      <button class="chip" data-u="sum">✦ Summarize</button>
      <button class="chip" data-u="alt">↻ Explain another way</button>
      <button class="chip" data-u="read">▶ Read to me</button>
      <button class="chip" data-u="live">● Live conversation</button>
    </div>

    <div id="blocks" class="stack"></div>

    <div class="card coach">
      <strong>Practice this now</strong>
      <p>You retain ~3× more from a ${store.state.industry.language.practiceWord} than from a re-read.</p>
      ${scenario ? `<a href="#/practice/${scenario.id}" class="btn primary block" style="margin-top:8px">Run "${scenario.title}"</a>` : ''}
    </div>

    <div class="row" style="gap:8px">
      <a class="btn ghost" href="#/coach">Ask Coach Vic</a>
      ${next
        ? `<a class="btn primary" style="flex:1" href="#/course/${course.id}/chapter/${next.id}">Next chapter →</a>`
        : `<a class="btn primary" style="flex:1" href="#/course/${course.id}">Course overview →</a>`}
    </div>
  `;

  const blocks = root.querySelector('#blocks');
  for (const b of chapter.blocks) blocks.appendChild(renderBlock(b, course));

  root.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => onUtility(b.dataset.u, root)));

  // Persist that the learner advanced into this chapter.
  store.setProgress(course.id, chapter.id, 0, Math.max(
    store.state.mastery.courseProgress[course.id]?.percent ?? 0,
    (idx + 1) / course.chapters.length * 0.6
  ));

  return root;
}

function renderBlock(b, course) {
  const el = document.createElement('div');
  if (b.type === 'video') {
    el.className = 'media';
    el.setAttribute('aria-label', `Video: ${b.title}`);
    el.innerHTML = `<span class="tiny muted" style="position:absolute;left:12px;bottom:10px">▶ ${b.title}</span>`;
    return el;
  }
  if (b.type === 'text') {
    el.className = 'card';
    el.innerHTML = `<p>${b.body}</p>`;
    return el;
  }
  if (b.type === 'poll') {
    el.className = 'card';
    el.innerHTML = `<strong>Quick check</strong><p style="margin-top:6px">${b.prompt}</p><div class="poll" style="margin-top:10px"></div><p class="tiny muted feedback" style="margin-top:8px;display:none"></p>`;
    const pollEl = el.querySelector('.poll');
    const fb = el.querySelector('.feedback');
    for (const o of b.options) {
      const btn = document.createElement('button');
      btn.textContent = o.label;
      btn.onclick = () => {
        pollEl.querySelectorAll('button').forEach((x) => x.disabled = true);
        btn.classList.add(o.correct ? 'right' : 'wrong');
        fb.textContent = o.feedback;
        fb.style.display = 'block';
      };
      pollEl.appendChild(btn);
    }
    return el;
  }
  if (b.type === 'concept') {
    const concept = course.concepts.find((c) => c.id === b.ref);
    const live = store.state.mastery.concepts[b.ref] ?? concept?.mastery ?? 0;
    el.className = 'card';
    el.innerHTML = `
      <div class="row between">
        <strong>Concept</strong>
        <span class="tag ${live < 0.55 ? 'bad' : live > 0.8 ? 'good' : 'warn'}">${(live*100|0)}% mastery</span>
      </div>
      <p style="margin-top:6px">${concept?.label ?? ''}</p>
      <div class="progress" style="margin-top:8px"><span style="width:${live*100}%"></span></div>
    `;
    return el;
  }
  el.className = 'card';
  el.innerHTML = `<p class="muted">[${b.type}]</p>`;
  return el;
}

function onUtility(kind, root) {
  // Stubbed AI utilities — the point is to *show* they exist as
  // assistive features, not to replace authored content.
  const map = {
    sum:  'Summary: recognition first, isolation second, comms third. Velocity beats perfection.',
    alt:  'Another framing: think of the first 60 seconds as building the mental picture, not acting on it.',
    read: 'Now reading aloud (mocked). Audio playback would attach here.',
    live: 'Live conversation mode (mocked). Vic would join voice and listen for cues.'
  };
  const banner = document.createElement('div');
  banner.className = 'card coach';
  banner.innerHTML = `<strong>Coach Vic</strong><p style="margin-top:6px">${map[kind]}</p>`;
  root.querySelector('#blocks').prepend(banner);
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
