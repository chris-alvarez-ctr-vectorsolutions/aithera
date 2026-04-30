// views/coach.js — Coach Vic chat.
// The chat is the *primary* trust UX. Three things have to be visible:
//   1. Suggested-prompt chips so leadership sees how Vic frames help
//   2. A citation chip on every reply (or "no source" when bounded)
//   3. Suggest-practice / queue-learning quick actions on relevant replies
import { store } from '../store.js';
import { coach } from '../coach.js';

const SUGGESTED = [
  'How far is the initial isolation distance?',
  'What does the hour-1 sepsis bundle include?',
  'How should I structure a sitrep?',
  'Pick a practice scenario for me'
];

export function render() {
  const root = document.createElement('section');
  root.innerHTML = `
    <div class="card coach" style="margin-top:6px">
      <span class="tag accent">Coach Vic</span>
      <h3 style="margin:6px 0 4px">${coach.greeting()}</h3>
      <p class="tiny muted">Vic only answers from your trusted course content. Anything outside scope is flagged, not fabricated.</p>
    </div>

    <div class="utility-rail" id="suggested"></div>
    <div id="thread" class="stack"></div>

    <div class="card" style="position:sticky;bottom:80px;z-index:3">
      <div class="row" style="gap:8px">
        <input id="msg" placeholder="Ask Vic…" style="flex:1;padding:10px;border-radius:10px;background:var(--bg-elev);border:1px solid var(--line);color:var(--text);font:inherit" />
        <button class="btn primary" id="send">Send</button>
      </div>
    </div>
  `;

  const thread = root.querySelector('#thread');
  const sugg   = root.querySelector('#suggested');

  for (const s of SUGGESTED) {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = s;
    b.onclick = () => post(s);
    sugg.appendChild(b);
  }

  function post(text) {
    if (!text.trim()) return;
    thread.appendChild(bubble(text, 'me'));
    const reply = coach.reply(text);
    thread.appendChild(bubble(reply.text, 'coach', reply));
    root.querySelector('#msg').value = '';
    thread.lastChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  root.querySelector('#send').onclick = () => post(root.querySelector('#msg').value);
  root.querySelector('#msg').addEventListener('keydown', (e) => { if (e.key === 'Enter') post(e.target.value); });

  return root;
}

function bubble(text, who, reply) {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;
  el.innerHTML = `<p style="margin:0">${text}</p>`;
  if (reply?.cite) {
    const course = store.course(reply.cite.courseId);
    if (course) {
      const cite = document.createElement('div');
      cite.style.marginTop = '8px';
      cite.innerHTML = `<a class="tag accent" href="#/course/${course.id}">Source: ${course.title}</a>`;
      el.appendChild(cite);
    }
  } else if (reply?.bounded) {
    const tag = document.createElement('span');
    tag.className = 'tag warn'; tag.textContent = 'No matching source — Vic will not guess';
    tag.style.marginTop = '8px'; tag.style.display = 'inline-flex';
    el.appendChild(tag);
  } else if (reply?.escalated) {
    const tag = document.createElement('span');
    tag.className = 'tag bad'; tag.textContent = 'Escalated — outside coaching scope';
    tag.style.marginTop = '8px'; tag.style.display = 'inline-flex';
    el.appendChild(tag);
  }
  if (reply?.suggestPractice) {
    const sc = store.state.scenarios[0];
    if (sc) {
      const a = document.createElement('a');
      a.className = 'btn primary sm';
      a.style.marginTop = '8px'; a.style.display = 'inline-flex';
      a.href = `#/practice/${sc.id}`;
      a.textContent = `Run "${sc.title}" →`;
      el.appendChild(a);
    }
  }
  return el;
}
