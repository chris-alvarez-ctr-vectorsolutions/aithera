// views/chapter.js — Main learning flow.
// Composed entirely from ui.js primitives. Carries the full pattern from
// the Vector chapter mockup (kicker + title + Save/Mark Complete; video;
// AI Assistant panel with the four modalities; rich content blocks
// including callouts and equipment lists; per-block AI menu so the
// modalities can apply to ANY content; mini course progress; Next Up).

import { store } from '../store.js';
import { coach } from '../coach.js';
import * as ui from '../ui.js';

export function render(courseId, chapterId) {
  const course  = store.course(courseId);
  const chapter = course?.chapters.find((c) => c.id === chapterId);
  const root = document.createElement('section');
  if (!chapter) { root.appendChild(ui.el('p', { class: 'muted' }, 'Chapter not found.')); return root; }

  const idx = course.chapters.findIndex((c) => c.id === chapter.id);
  const next = course.chapters[idx + 1];
  const completed = (store.state.mastery.completedChapters?.[course.id] ?? []).length;
  const total     = course.chapters.length;

  // ---------- Header (kicker + title + Save / Mark Complete) ----------
  const isSaved    = store.state.mastery.saved.includes(course.id);
  const isComplete = store.isChapterComplete(course.id, chapter.id);
  root.appendChild(ui.chapterHeader({
    kicker: chapter.kicker || `${course.title} · Chapter ${idx + 1} of ${total}`,
    title:  chapter.title,
    isSaved, isComplete,
    onSave:     () => store.toggleSaved(course.id),
    onComplete: () => store.markChapterComplete(course.id, chapter.id)
  }));

  // ---------- Hero video ----------
  const videoBlock = chapter.blocks.find((b) => b.type === 'video');
  if (videoBlock) root.appendChild(videoEl(videoBlock));

  // ---------- AI Assistant panel ----------
  // Container for AI-generated coach replies (chapter-scoped).
  const aiOut = ui.el('div', { class: 'stack' });
  root.appendChild(ui.assistantPanel({
    onAction: (kind) => aiOut.appendChild(modalityResponse(kind, chapter, null))
  }));
  root.appendChild(aiOut);

  // ---------- Content blocks (everything except the lead video) ----------
  for (const b of chapter.blocks) {
    if (b.type === 'video') continue;
    const node = renderBlock(b, course);
    if (!node) continue;
    // Wrap most content in blockShell to expose per-block AI menu.
    if (b.type === 'concept' || b.type === 'callout-row') {
      root.appendChild(node);
    } else {
      root.appendChild(ui.blockShell({
        children: node,
        onModality: (kind) => {
          const target = b.type === 'prose' ? b.body : (b.title || b.body || '');
          aiOut.appendChild(modalityResponse(kind, chapter, target));
          aiOut.lastChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }));
    }
  }

  // ---------- Practice nudge ----------
  const sc = store.scenariosForCourse(course.id)[0];
  if (sc) {
    root.appendChild(ui.coachPrompt({
      question: `You retain ~3× more from a ${store.state.industry.language.practiceWord} than from a re-read. Run "${sc.title}"?`,
      primaryLabel: 'Practice now',
      primaryHref: `#/practice/${sc.id}`,
      secondaryLabel: 'Skip',
      secondaryHref: `#/course/${course.id}/chapter/${chapter.id}`
    }));
  }

  // ---------- Course progress mini ----------
  root.appendChild(ui.sectionHeader('Course progress'));
  root.appendChild(ui.progressMini({
    percent: Math.round((completed / total) * 100),
    completed, total,
    label: course.title
  }));

  // ---------- Next Up ----------
  if (next) {
    root.appendChild(ui.sectionHeader('Next up'));
    root.appendChild(ui.nextUpCard({
      title: next.title,
      subtitle: `${next.minutes} min · Video & content`,
      href: `#/course/${course.id}/chapter/${next.id}`,
      initials: String(idx + 2)
    }));
  }

  // ---------- Footer CTA ----------
  root.appendChild(ui.primaryCta(
    next ? 'Mark complete & continue' : 'Mark complete',
    `#/course/${course.id}/chapter/${chapter.id}`
  ));
  // Hook the CTA: mark complete then nav.
  const cta = root.lastElementChild;
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    store.markChapterComplete(course.id, chapter.id);
    location.hash = next
      ? `#/course/${course.id}/chapter/${next.id}`
      : `#/course/${course.id}`;
  });

  return root;
}

// ---------- block renderers ----------

function videoEl(block) {
  const el = ui.el('div', { class: 'media', 'aria-label': `Video: ${block.title}` });
  el.innerHTML = `<span class="tiny muted" style="position:absolute;left:12px;bottom:10px">▶ ${escape(block.title)}</span>`;
  return el;
}

function renderBlock(b, course) {
  if (b.type === 'text' || b.type === 'prose') {
    const wrap = ui.el('div', null);
    if (b.title) wrap.appendChild(ui.el('strong', null, b.title));
    wrap.appendChild(ui.el('p', { style: { marginTop: b.title ? '6px' : '0' } }, b.body));
    return wrap;
  }
  if (b.type === 'callout') {
    return ui.callout({ kind: b.kind, title: b.title, body: b.body, items: b.items });
  }
  if (b.type === 'callout-row') {
    const row = ui.el('div', { class: 'callout-row' });
    for (const it of b.items) row.appendChild(ui.callout(it));
    return row;
  }
  if (b.type === 'poll') {
    const wrap = ui.el('div', null,
      ui.el('strong', null, 'Quick check'),
      ui.el('p', { style: { marginTop: '6px' } }, b.prompt)
    );
    const poll = ui.el('div', { class: 'poll', style: { marginTop: '10px' } });
    const fb = ui.el('p', { class: 'tiny muted', style: { marginTop: '8px', display: 'none' } });
    for (const o of b.options) {
      const btn = ui.el('button', { type: 'button', on: { click: () => {
        poll.querySelectorAll('button').forEach((x) => x.disabled = true);
        btn.classList.add(o.correct ? 'right' : 'wrong');
        fb.textContent = o.feedback; fb.style.display = 'block';
      }}}, o.label);
      poll.appendChild(btn);
    }
    wrap.appendChild(poll); wrap.appendChild(fb);
    return wrap;
  }
  if (b.type === 'concept') {
    const concept = course.concepts.find((c) => c.id === b.ref);
    const live = store.state.mastery.concepts[b.ref] ?? concept?.mastery ?? 0;
    return ui.el('div', { class: 'card' },
      ui.el('div', { class: 'row between' },
        ui.el('strong', null, 'Concept'),
        ui.tag(`${(live*100|0)}% mastery`, live < 0.55 ? 'bad' : live > 0.8 ? 'good' : 'warn')
      ),
      ui.el('p', { style: { marginTop: '6px' } }, concept?.label || ''),
      ui.progressBar(live * 100)
    );
  }
  return null;
}

// ---------- modality replies ----------
// Stubbed AI responses keyed off the four modalities. The point is to
// SHOW that any content can be transformed without it being open-ended
// generation — these are bounded, scoped to the chapter or block.
function modalityResponse(kind, chapter, blockText) {
  const scope = blockText ? 'this passage' : 'this chapter';
  const body = {
    read:      `▶ Audio playback queued for ${scope}. (Mocked — would route through the platform's TTS.)`,
    summarize: blockText
      ? `In short: ${shorten(blockText)}`
      : `${chapter.title} in three points: 1) recognize before you act; 2) escalate by signal, not by clock; 3) the bundle's velocity matters more than its perfect order.`,
    simpler:   blockText
      ? `Simpler version: ${simpler(blockText)}`
      : `Plain-language take on "${chapter.title}": notice the situation, set the boundary, then ask for help in clear pieces.`,
    chat:      `Starting a Coach Vic conversation scoped to ${scope}. Try: "What's the most common mistake here?"`
  }[kind];

  const card = ui.coachMessage({
    title: kind === 'chat' ? 'Coach Vic — live' : `Coach Vic · ${labelFor(kind)}`,
    text: body,
    footer: kind === 'chat' ? '— Tap "Coach Vic" tab to continue' : '— Coach Vic'
  });
  return card;
}

function labelFor(kind) {
  return { read: 'Read to me', summarize: 'Summary', simpler: 'Simpler terms', chat: 'Conversation' }[kind] || kind;
}

function shorten(text) {
  // Take the first meaningful sentence, trim to ~140 chars.
  const first = String(text).split(/(?<=[.!?])\s+/)[0] || text;
  return first.length > 140 ? first.slice(0, 137) + '…' : first;
}

function simpler(text) {
  // Replace a handful of medical/operational terms with plain phrasing.
  // Very limited but visible — the point is "this transforms language".
  return String(text)
    .replace(/qSOFA/gi, 'a 3-point quick check')
    .replace(/MAP/g, 'blood pressure')
    .replace(/crystalloid/gi, 'IV fluid')
    .replace(/vasopressors?/gi, 'blood-pressure medication')
    .replace(/broad[- ]?spectrum antibiotics?/gi, 'wide-coverage antibiotics')
    .replace(/UN \d+/g, 'a UN-numbered chemical')
    .replace(/SCBA/g, 'breathing apparatus')
    .replace(/ICS/g, 'incident command');
}

function escape(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
