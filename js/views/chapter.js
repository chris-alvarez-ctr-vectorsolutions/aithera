// views/chapter.js — Stepped learning flow.
//
// Instead of a single dense scroll, the chapter is broken into focused
// phases the learner moves through one at a time:
//   1. Watch  — hero video; AI assistant tucked behind a tap-to-expand
//               header so it doesn't dominate.
//   2. Learn  — the rich content blocks (prose, callouts, concept). Per-
//               block AI menu still available via blockShell.
//   3. Check  — any embedded polls / knowledge checks.
//   4. Recap  — practice nudge, course progress, next-up preview, and
//               the "mark complete" CTA.
//
// Steps with no content for the current chapter are skipped (e.g. a
// chapter without a poll skips Check). A sticky footer carries the
// forward CTA so the next action is always reachable.
//
// The route is rendered fullscreen (see app.js) — the bottom tabbar is
// hidden so the lesson surface owns the screen.

import { store } from '../store.js';
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

  // ---------- Partition blocks into phases ----------
  const videoBlocks   = chapter.blocks.filter((b) => b.type === 'video');
  const pollBlocks    = chapter.blocks.filter((b) => b.type === 'poll');
  const learnBlocks   = chapter.blocks.filter((b) => b.type !== 'video' && b.type !== 'poll');

  // Build the active step list dynamically — skip phases with no content.
  const phases = [];
  if (videoBlocks.length) phases.push('watch');
  if (learnBlocks.length) phases.push('learn');
  if (pollBlocks.length)  phases.push('check');
  phases.push('recap');

  const phaseLabels = { watch: 'Watch', learn: 'Learn', check: 'Check', recap: 'Recap' };
  const stepLabels = phases.map((p) => phaseLabels[p]);

  let cursor = 0;

  function show() {
    root.replaceChildren(buildPhase(phases[cursor]));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function advance() {
    if (cursor < phases.length - 1) { cursor++; show(); return; }
    // Final step — mark complete and navigate.
    store.markChapterComplete(course.id, chapter.id);
    location.hash = next
      ? `#/course/${course.id}/chapter/${next.id}`
      : `#/course/${course.id}`;
  }

  function buildPhase(name) {
    const wrap = ui.el('section', { class: 'chap-phase' });

    // Compact header on every step so the learner always knows where
    // they are. Save / Mark-complete actions live in the recap step.
    const kicker = ui.el('div', { class: 'ch-kicker' });
    if (chapter.kicker) {
      kicker.textContent = chapter.kicker;
    } else {
      kicker.appendChild(ui.el('div', null, course.title));
      kicker.appendChild(ui.el('div', { class: 'ch-kicker-sub' }, `Chapter ${idx + 1} of ${total}`));
    }
    wrap.appendChild(kicker);
    wrap.appendChild(ui.el('h2', { class: 'ch-title' }, chapter.title));

    // Learn folds the step indicator into its unified lesson card; other
    // phases keep it as a standalone strip up top.
    if (name !== 'learn') {
      wrap.appendChild(ui.stepIndicator({ steps: stepLabels, current: cursor }));
    }

    // Per-phase body
    if (name === 'watch') wrap.appendChild(buildWatch());
    if (name === 'learn') wrap.appendChild(buildLearn());
    if (name === 'check') wrap.appendChild(buildCheck());
    if (name === 'recap') wrap.appendChild(buildRecap());

    // Sticky footer CTA
    wrap.appendChild(ui.stickyFooter({ children: footerCta(name) }));
    return wrap;
  }

  function footerCta(name) {
    const labels = {
      watch: 'Continue to lesson',
      learn: phases.includes('check') ? 'Continue to check' : 'Continue',
      check: 'Continue to recap',
      recap: next ? 'Mark complete & continue' : 'Mark complete'
    };
    const btn = ui.el('button', { class: 'btn primary block cta-large', on: { click: advance } },
      ui.el('span', null, labels[name]),
      ui.icon('arrowRight')
    );
    return btn;
  }

  // ---------- WATCH ----------
  function buildWatch() {
    const stack = ui.el('div', { class: 'stack' });

    const vb = videoBlocks[0];
    if (vb) stack.appendChild(videoEl(vb));

    // AI assistant — collapsed by default. Replies render below it.
    const aiOut = ui.el('div', { class: 'stack' });
    stack.appendChild(ui.assistantPanel({
      onAction: (kind) => {
        aiOut.appendChild(modalityResponse(kind, chapter, null));
        aiOut.lastChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }));
    stack.appendChild(aiOut);

    // Lightweight orientation line so the watch step isn't bare.
    stack.appendChild(ui.el('p', { class: 'muted phase-hint' },
      `Watch the ${vb ? 'briefing' : 'intro'}, then continue when you're ready. ` +
      `You can replay or use AI tools any time.`));

    return stack;
  }

  // ---------- LEARN ----------
  // The learn phase merges step indicator, learning content, and concept
  // mastery into a single "lesson card" so the body text is the visual
  // hero rather than competing with sibling cards.
  function buildLearn() {
    const stack = ui.el('div', { class: 'stack' });
    const aiOut = ui.el('div', { class: 'stack' });

    const card = ui.el('div', { class: 'lesson-card' });

    // Embedded step indicator — same component, restyled inside the card.
    const stepInd = ui.stepIndicator({ steps: stepLabels, current: cursor });
    stepInd.classList.add('embedded');
    card.appendChild(stepInd);

    // Use the concept label (if any) as the section title above the body.
    const conceptBlock = learnBlocks.find((b) => b.type === 'concept');
    const concept = conceptBlock ? course.concepts.find((c) => c.id === conceptBlock.ref) : null;

    const body = ui.el('div', { class: 'lc-body' });
    if (concept?.label) body.appendChild(ui.el('h3', { class: 'lc-title' }, concept.label));

    const proseBlocks = learnBlocks.filter((b) => b.type !== 'concept');
    for (const b of proseBlocks) {
      const node = renderBlock(b, course);
      if (node) body.appendChild(node);
    }

    // AI affordance on the unified card. Acts on the first prose/text
    // block's body — that's the learning content the user is reading.
    const aiTarget = proseBlocks.find((b) => b.type === 'prose' || b.type === 'text');
    const aiMenu = ui.el('div', { class: 'lc-ai-menu' });
    const aiTrigger = ui.el('button', {
      class: 'lc-ai', 'aria-label': 'AI tools for this lesson',
      on: { click: () => aiMenu.classList.toggle('open') }
    }, ui.icon('sparkle'));
    const aiAction = (id, label) =>
      ui.el('button', { class: 'bs-action', on: { click: () => {
        aiMenu.classList.remove('open');
        const target = aiTarget ? (aiTarget.body || aiTarget.title || '') : '';
        aiOut.appendChild(modalityResponse(id, chapter, target));
        aiOut.lastChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }}}, label);
    aiMenu.append(
      aiAction('read', 'Read to me'),
      aiAction('summarize', 'Summarize'),
      aiAction('simpler', 'Simpler terms'),
      aiAction('chat', 'Ask Vic about this')
    );

    card.appendChild(aiTrigger);
    card.appendChild(aiMenu);
    card.appendChild(body);

    // Mastery as quiet footer context — current standing on this concept,
    // not a freshly-earned score.
    if (concept) {
      const live = store.state.mastery.concepts[concept.id] ?? concept.mastery ?? 0;
      const pct = Math.round(live * 100);
      const footer = ui.el('div', { class: 'lc-mastery' },
        ui.el('div', { class: 'lc-mastery-row' },
          ui.el('span', { class: 'lc-mastery-label' }, 'Your mastery on this concept'),
          ui.el('span', { class: 'lc-mastery-pct' }, `${pct}%`)
        ),
        ui.progressBar(pct)
      );
      card.appendChild(footer);
    }

    stack.appendChild(card);
    stack.appendChild(aiOut);
    return stack;
  }

  // ---------- CHECK ----------
  function buildCheck() {
    const stack = ui.el('div', { class: 'stack' });
    stack.appendChild(ui.el('p', { class: 'muted phase-hint' },
      'Quick check before you move on — pick the answer that best fits.'));
    for (const b of pollBlocks) {
      const node = renderBlock(b, course);
      if (node) stack.appendChild(node);
    }
    return stack;
  }

  // ---------- RECAP ----------
  function buildRecap() {
    const stack = ui.el('div', { class: 'stack' });

    // Save / Mark complete affordances move here so they don't compete
    // with the learning steps above. The footer CTA is the primary path.
    const isSaved    = store.state.mastery.saved.includes(course.id);
    const isComplete = store.isChapterComplete(course.id, chapter.id);
    stack.appendChild(ui.el('div', { class: 'ch-actions recap-actions' },
      ui.el('button', {
        class: `ch-action${isSaved ? ' on' : ''}`,
        on: { click: (e) => {
          store.toggleSaved(course.id);
          const t = e.currentTarget;
          const nowSaved = store.state.mastery.saved.includes(course.id);
          t.classList.toggle('on', nowSaved);
          t.querySelector('span:last-child').textContent = nowSaved ? 'Saved' : 'Save';
        }},
        'aria-label': 'Save reference'
      }, ui.icon('star'), ui.el('span', null, isSaved ? 'Saved' : 'Save')),
      ui.el('button', {
        class: `ch-action complete${isComplete ? ' on' : ''}`,
        on: { click: (e) => {
          store.markChapterComplete(course.id, chapter.id);
          const t = e.currentTarget;
          t.classList.add('on');
          t.querySelector('span:last-child').textContent = 'Completed';
        }},
        'aria-label': 'Mark complete'
      }, ui.icon(isComplete ? 'check' : 'circle'),
         ui.el('span', null, isComplete ? 'Completed' : 'Mark complete'))
    ));

    // Practice nudge (if there's a scenario tied to this course)
    const sc = store.scenariosForCourse(course.id)[0];
    if (sc) {
      stack.appendChild(ui.coachPrompt({
        question: `You retain ~3× more from a ${store.state.industry.language.practiceWord} than from a re-read. Run "${sc.title}"?`,
        primaryLabel: 'Practice now',
        primaryHref: `#/practice/${sc.id}`,
        secondaryLabel: 'Skip',
        secondaryHref: `#/course/${course.id}/chapter/${chapter.id}`
      }));
    }

    stack.appendChild(ui.sectionHeader('Course progress'));
    stack.appendChild(ui.progressMini({
      percent: Math.round((completed / total) * 100),
      completed, total,
      label: course.title
    }));

    if (next) {
      stack.appendChild(ui.sectionHeader('Next up'));
      stack.appendChild(ui.nextUpCard({
        title: next.title,
        subtitle: `${next.minutes} min · Video & content`,
        href: `#/course/${course.id}/chapter/${next.id}`,
        initials: String(idx + 2)
      }));
    }
    return stack;
  }

  show();
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
    const wrap = ui.el('div', { class: 'card' },
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

  return ui.coachMessage({
    title: kind === 'chat' ? 'Coach Vic — live' : `Coach Vic · ${labelFor(kind)}`,
    text: body,
    footer: kind === 'chat' ? '— Tap "Coach Vic" tab to continue' : '— Coach Vic'
  });
}

function labelFor(kind) {
  return { read: 'Read to me', summarize: 'Summary', simpler: 'Simpler terms', chat: 'Conversation' }[kind] || kind;
}

function shorten(text) {
  const first = String(text).split(/(?<=[.!?])\s+/)[0] || text;
  return first.length > 140 ? first.slice(0, 137) + '…' : first;
}

function simpler(text) {
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
