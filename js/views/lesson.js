// views/lesson.js — Stepped learning flow.
//
// A lesson is broken into focused phases the learner moves through one
// at a time:
//   1. Watch  — hero video; modality switcher tucked into a panel below.
//   2. Learn  — concept-card text content (no media frame).
//   3. Check  — any embedded polls / knowledge checks.
//   4. Recap  — lesson recap header, practice nudge, course progress,
//               next-up preview, and the "mark complete" CTA.
//
// Steps with no content for the current lesson are skipped. A sticky
// footer carries the forward CTA so the next action is always reachable.
//
// The route is rendered fullscreen (see app.js) — the bottom tabbar is
// hidden so the lesson surface owns the screen.

import { store } from '../store.js';
import * as ui from '../ui.js?v=course-flow-1';

export function render(courseId, lessonId) {
  const course = store.course(courseId);
  const lesson = course?.lessons.find((c) => c.id === lessonId);
  const root = document.createElement('section');
  if (!lesson) { root.appendChild(ui.el('p', { class: 'muted' }, 'Lesson not found.')); return root; }

  // Scenario lessons are rehearsal, not reading. Hand off to the practice
  // engine, carrying course+lesson context so completion can credit the
  // lesson back in this course's progress.
  if (lesson.type === 'scenario' && lesson.scenarioId) {
    location.hash = `#/practice/${lesson.scenarioId}?courseLesson=${course.id}:${lesson.id}`;
    return root;
  }

  const idx = course.lessons.findIndex((c) => c.id === lesson.id);
  const next = course.lessons[idx + 1];
  const completed = (store.state.mastery.completedLessons?.[course.id] ?? []).length;
  const total     = course.lessons.length;

  // ---------- Partition blocks into phases ----------
  const videoBlocks   = lesson.blocks.filter((b) => b.type === 'video');
  const pollBlocks    = lesson.blocks.filter((b) => b.type === 'poll');
  const learnBlocks   = lesson.blocks.filter((b) => b.type !== 'video' && b.type !== 'poll');

  // Build the active step list dynamically — skip phases with no content.
  const phases = [];
  if (videoBlocks.length) phases.push('watch');
  if (learnBlocks.length) phases.push('learn');
  if (pollBlocks.length)  phases.push('check');
  phases.push('recap');

  // In-lesson stepper covers learning steps only — Recap is treated as
  // a distinct "Lesson complete" checkpoint screen, not a fourth step.
  const learningPhases = phases.filter((p) => p !== 'recap');
  const phaseLabels = { watch: 'Watch', learn: 'Learn', check: 'Check' };
  const stepLabels = learningPhases.map((p) => phaseLabels[p]);

  let cursor = 0;

  function show() {
    root.replaceChildren(buildPhase(phases[cursor]));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function advance() {
    if (cursor < phases.length - 1) { cursor++; show(); return; }
    store.markLessonComplete(course.id, lesson.id);
    location.hash = next
      ? `#/course/${course.id}/lesson/${next.id}`
      : `#/course/${course.id}`;
  }

  function buildPhase(name) {
    const wrap = ui.el('section', { class: 'chap-phase' });

    if (name === 'recap') {
      wrap.classList.add('chap-checkpoint');
      wrap.appendChild(buildRecap());
    } else {
      wrap.appendChild(buildHeader(name));
      if (name === 'watch') wrap.appendChild(buildWatch());
      if (name === 'learn') wrap.appendChild(buildLearn());
      if (name === 'check') wrap.appendChild(buildCheck());
    }

    wrap.appendChild(ui.stickyFooter({ children: footerCta(name) }));
    return wrap;
  }

  // Unified header: course-level strip + kicker + title + within-lesson
  // step indicator. The strip answers "which lesson?", the indicator
  // answers "where in this lesson?".
  function buildHeader(name) {
    const header = ui.el('header', { class: 'lesson-head' });
    const kicker = ui.el('div', { class: 'ch-kicker' });
    kicker.appendChild(ui.el('div', null, lesson.kicker || course.title));
    kicker.appendChild(ui.el('div', { class: 'ch-kicker-sub' },
      `Lesson ${String(idx + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')}`));
    header.appendChild(kicker);
    header.appendChild(ui.el('h2', { class: 'ch-title' }, lesson.title));
    const learningIdx = learningPhases.indexOf(name);
    if (learningIdx >= 0 && stepLabels.length > 1) {
      header.appendChild(ui.stepIndicator({ steps: stepLabels, current: learningIdx, variant: 'header' }));
    }
    return header;
  }

  function footerCta(name) {
    const labels = {
      watch: 'Continue',
      learn: phases.includes('check') ? 'Continue to check' : 'Continue',
      check: 'Continue to recap',
      recap: next ? `Continue to Lesson ${String(idx + 2).padStart(2, '0')}` : 'Finish course'
    };
    return ui.el('button', { class: 'btn primary block cta-large', on: { click: advance } },
      ui.el('span', null, labels[name]),
      ui.icon('arrowRight')
    );
  }

  // ---------- WATCH ----------
  function buildWatch() {
    const stack = ui.el('div', { class: 'stack' });
    const vb = videoBlocks[0];

    let mode = 'original';
    const hint = ui.el('p', { class: 'lesson-instruction' });
    const stage = ui.el('div', { class: 'modality-stage' });
    const panelHost = ui.el('div', null);

    function renderHero() {
      const node = heroForMode('watch', mode, { videoBlock: vb, lesson, backToOriginal: () => switchMode('original') });
      node.classList.add('modality-enter');
      stage.replaceChildren(node);
      requestAnimationFrame(() => node.classList.remove('modality-enter'));
    }
    function renderPanel() {
      panelHost.replaceChildren(ui.assistantPanel({
        current: mode,
        originalLabel: 'Video',
        onSelect: (nextMode) => switchMode(nextMode)
      }));
    }
    function renderHint() {
      hint.textContent = mode === 'original'
        ? `Watch the ${vb ? 'briefing' : 'intro'}, then continue when you're ready. You can swap formats any time.`
        : 'Tap "Original format · Video" below to return to the briefing, or pick another way.';
    }
    function switchMode(nextMode) {
      if (nextMode === mode) return;
      const cur = stage.firstElementChild;
      if (cur) {
        cur.classList.add('modality-exit');
        setTimeout(() => { mode = nextMode; renderHero(); renderPanel(); renderHint(); }, 180);
      } else {
        mode = nextMode; renderHero(); renderPanel(); renderHint();
      }
    }

    renderHero(); renderPanel(); renderHint();
    stack.append(hint, stage, panelHost);
    return stack;
  }

  // ---------- LEARN ----------
  // Concept-card text content. No video frame, no embedded step
  // indicator — the body prose is the visual hero.
  function buildLearn() {
    const stack = ui.el('div', { class: 'stack' });

    const conceptBlock = learnBlocks.find((b) => b.type === 'concept');
    const concept = conceptBlock ? course.concepts.find((c) => c.id === conceptBlock.ref) : null;
    const proseBlocks = learnBlocks.filter((b) => b.type !== 'concept');
    const aiTarget = proseBlocks.find((b) => b.type === 'prose' || b.type === 'text');
    const targetText = aiTarget ? (aiTarget.body || aiTarget.title || '') : '';

    let mode = 'original';
    const hint = ui.el('p', { class: 'lesson-instruction' });
    const card = ui.el('article', { class: 'lesson-card learn-card' });
    const panelHost = ui.el('div', null);

    function renderHint() {
      hint.textContent = mode === 'original'
        ? 'Read through the key concept, then continue. You can swap formats any time.'
        : 'Tap "Original format · Text" below to return to the original, or pick another way.';
    }

    function renderCard() {
      card.replaceChildren();
      const stage = ui.el('div', { class: 'modality-stage' });
      const hero = heroForMode('learn', mode, {
        concept, proseBlocks, course, lesson, targetText,
        backToOriginal: () => switchMode('original')
      });
      hero.classList.add('modality-enter');
      stage.appendChild(hero);
      card.appendChild(stage);
      requestAnimationFrame(() => hero.classList.remove('modality-enter'));

      if (concept && mode === 'original') {
        const live = store.state.mastery.concepts[concept.id] ?? concept.mastery ?? 0;
        const pct = Math.round(live * 100);
        card.appendChild(ui.el('div', { class: 'lc-mastery' },
          ui.el('div', { class: 'lc-mastery-row' },
            ui.el('span', { class: 'lc-mastery-label' }, 'Your mastery on this concept'),
            ui.el('span', { class: 'lc-mastery-pct' }, `${pct}%`)
          ),
          ui.progressBar(pct)
        ));
      }
    }
    function renderPanel() {
      panelHost.replaceChildren(ui.assistantPanel({
        current: mode,
        originalLabel: 'Text',
        onSelect: (nextMode) => switchMode(nextMode)
      }));
    }
    function switchMode(nextMode) {
      if (nextMode === mode) return;
      const stage = card.querySelector('.modality-stage');
      const cur = stage?.firstElementChild;
      if (cur) {
        cur.classList.add('modality-exit');
        setTimeout(() => { mode = nextMode; renderCard(); renderPanel(); renderHint(); }, 180);
      } else {
        mode = nextMode; renderCard(); renderPanel(); renderHint();
      }
    }

    renderCard(); renderPanel(); renderHint();
    stack.append(hint, card, panelHost);
    return stack;
  }

  // ---------- CHECK ----------
  function buildCheck() {
    const stack = ui.el('div', { class: 'stack' });
    stack.appendChild(ui.el('p', { class: 'lesson-instruction' },
      'Quick check before you move on — pick the answer that best fits.'));
    for (const b of pollBlocks) {
      const node = renderBlock(b, course);
      if (node) stack.appendChild(node);
    }
    return stack;
  }

  // Light confetti burst — sits behind the seal and clears itself.
  // Suppressed under prefers-reduced-motion via CSS.
  function buildConfetti() {
    const wrap = ui.el('div', { class: 'checkpoint-confetti', 'aria-hidden': 'true' });
    const colors = ['var(--accent)', 'var(--accent-2)', 'var(--good)', 'var(--warn)'];
    for (let i = 0; i < 16; i++) {
      const piece = ui.el('span', { class: 'cc-piece' });
      const left = Math.random() * 100;
      const delay = Math.random() * 0.25;
      const dur = 1.1 + Math.random() * 0.7;
      const rot = Math.random() * 360;
      const size = 5 + Math.random() * 5;
      Object.assign(piece.style, {
        left: left + '%',
        background: colors[i % colors.length],
        width: size + 'px',
        height: (size * 1.5) + 'px',
        animationDelay: delay + 's',
        animationDuration: dur + 's',
        transform: `rotate(${rot}deg)`
      });
      wrap.appendChild(piece);
    }
    return wrap;
  }

  // ---------- RECAP ----------
  // Rendered as a distinct "Lesson complete" checkpoint — visually
  // separated from the in-lesson steps above so the learner reads it as
  // a milestone, not another phase to grind through.
  function buildRecap() {
    const stack = ui.el('div', { class: 'stack' });

    const pw = store.state.industry?.language?.practiceWord || 'scenario';
    const doneCount = completed + 1;     // this lesson is about to be marked complete
    const pct = Math.round((doneCount / total) * 100);

    // Celebratory header: seal + lesson-title eyebrow + completion title.
    // Confetti pops on mount; CSS animation handles the rest.
    const head = ui.el('div', { class: 'checkpoint-head' });
    head.appendChild(buildConfetti());
    head.appendChild(ui.el('div', { class: 'checkpoint-seal', 'aria-hidden': 'true' }, ui.icon('check')));
    head.appendChild(ui.el('div', { class: 'checkpoint-eyebrow' }, lesson.title));
    head.appendChild(ui.el('h2', { class: 'checkpoint-title' },
      `Lesson ${String(idx + 1).padStart(2, '0')} complete`));
    head.appendChild(ui.el('p', { class: 'checkpoint-lede' },
      next
        ? `Nice work. ${doneCount} of ${total} done — let's keep the momentum.`
        : `That's the last lesson. One tap to finish the course.`));
    stack.appendChild(head);

    // Stats grid
    const minutes = course.lessons.slice(0, doneCount).reduce((s, l) => s + (l.minutes || 0), 0);
    stack.appendChild(ui.el('div', { class: 'checkpoint-grid' },
      ui.el('div', { class: 'cp-cell' },
        ui.el('div', { class: 'cp-v' }, `${doneCount}`,
          ui.el('span', { class: 'cp-v-sub' }, `/${total}`)),
        ui.el('div', { class: 'cp-k' }, 'Lessons')),
      ui.el('div', { class: 'cp-cell' },
        ui.el('div', { class: 'cp-v' }, `${minutes}`,
          ui.el('span', { class: 'cp-v-sub' }, 'min')),
        ui.el('div', { class: 'cp-k' }, 'Invested')),
      ui.el('div', { class: 'cp-cell' },
        ui.el('div', { class: 'cp-v' }, `${pct}%`),
        ui.el('div', { class: 'cp-k' }, 'Progress'))
    ));

    stack.appendChild(ui.el('p', { class: 'lesson-instruction', style: { marginTop: '4px' } },
      `Save this lesson for later, or lock it in with a quick ${pw}.`));

    // Save (bookmark) — Mark complete lives in the footer CTA below.
    const isSaved = store.state.mastery.saved.includes(course.id);
    stack.appendChild(ui.el('div', { class: 'recap-actions single' },
      ui.el('button', {
        class: `ch-action${isSaved ? ' on' : ''}`,
        on: { click: (e) => {
          store.toggleSaved(course.id);
          const t = e.currentTarget;
          const nowSaved = store.state.mastery.saved.includes(course.id);
          t.classList.toggle('on', nowSaved);
          t.querySelector('span:last-child').textContent = nowSaved ? 'Saved' : 'Save for later';
        }},
        'aria-label': 'Save reference'
      }, ui.icon('star'), ui.el('span', null, isSaved ? 'Saved' : 'Save for later'))
    ));

    const courseScenarios = store.scenariosForCourse(course.id);
    const sc = courseScenarios.find((s) => s.kind !== 'iv-math');
    const mini = courseScenarios.find((s) => s.kind === 'iv-math');
    if (sc) {
      stack.appendChild(ui.coachPrompt({
        question: `You retain ~3× more from a ${store.state.industry.language.practiceWord} than from a re-read. Run "${sc.title}"?`,
        primaryLabel: 'Practice now',
        primaryHref: `#/practice/${sc.id}`,
        secondaryLabel: 'Skip',
        secondaryHref: `#/course/${course.id}/lesson/${lesson.id}`
      }));
    }
    // Companion mini-game tee-up — sits below the standard practice nudge.
    // Shown only on the final lesson so it acts as a course-end capstone.
    if (mini && !next) {
      stack.appendChild(ui.el('div', { class: 'card iv-teeup' },
        ui.el('div', { class: 'iv-teeup-head' },
          ui.el('span', { class: 'iv-teeup-glyph' }, ui.icon('bolt')),
          ui.el('div', null,
            ui.el('small', { class: 'iv-teeup-kicker' }, 'Mini-game'),
            ui.el('strong', { class: 'iv-teeup-title' }, mini.title)
          )
        ),
        ui.el('p', { class: 'iv-teeup-body' }, mini.outcomeType || ''),
        ui.el('a', { class: 'btn primary block', href: `#/iv-math/${mini.id}` }, 'Play 10 rounds')
      ));
    }

    if (next) {
      stack.appendChild(ui.sectionHeader('Up next'));
      stack.appendChild(ui.nextUpCard({
        title: next.title,
        subtitle: `${next.minutes} min · Lesson ${String(idx + 2).padStart(2, '0')} of ${String(total).padStart(2, '0')}`,
        href: `#/course/${course.id}/lesson/${next.id}`,
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
  const wrap = ui.el('div', { class: 'media', 'aria-label': `Video: ${block.title}` });
  if (block.image) {
    const img = ui.el('img', { class: 'media-photo', src: block.image, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => { img.remove(); wrap.classList.remove('has-photo'); });
    img.addEventListener('load', () => wrap.classList.add('has-photo'));
    wrap.appendChild(img);
  }
  wrap.insertAdjacentHTML('beforeend',
    `<span class="tiny muted media-label">▶ ${escape(block.title)}</span>`);
  return wrap;
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

// ---------- Modality hero ----------
function heroForMode(phase, mode, ctx) {
  if (mode === 'original') {
    return phase === 'watch'
      ? (ctx.videoBlock ? videoEl(ctx.videoBlock) : ui.el('div', { class: 'modality-empty muted' }, 'No video for this lesson.'))
      : originalProse(ctx);
  }
  if (mode === 'read')      return audioPlayerView(phase, ctx);
  if (mode === 'summarize') return summaryView(phase, ctx);
  if (mode === 'simpler')   return simplerView(phase, ctx);
  if (mode === 'chat')      return chatView(phase, ctx);
  return ui.el('div', null);
}

function originalProse({ concept, proseBlocks, course }) {
  const body = ui.el('div', { class: 'lc-body' });
  if (concept?.label) body.appendChild(ui.el('h3', { class: 'lc-title' }, concept.label));
  for (const b of proseBlocks) {
    const node = renderBlock(b, course);
    if (node) body.appendChild(node);
  }
  return body;
}

function modalityChrome({ label, glyph, body, onBack, hint }) {
  const wrap = ui.el('div', { class: 'modality-view' });
  wrap.appendChild(ui.el('div', { class: 'mv-head' },
    ui.el('span', { class: 'mv-tag' },
      ui.el('span', { class: 'mv-glyph' }, ui.icon(glyph)),
      ui.el('span', null, label)
    ),
    ui.el('button', { class: 'mv-back', on: { click: onBack } },
      ui.icon('arrowRight'),
      ui.el('span', null, 'Show original')
    )
  ));
  wrap.appendChild(body);
  if (hint) wrap.appendChild(ui.el('p', { class: 'mv-hint muted' }, hint));
  return wrap;
}

function audioPlayerView(phase, ctx) {
  const title = phase === 'watch'
    ? (ctx.videoBlock?.title || ctx.lesson.title)
    : (ctx.concept?.label || ctx.lesson.title);
  const player = ui.el('div', { class: 'mv-player' },
    ui.el('button', { class: 'mv-play', 'aria-label': 'Play audio' }, ui.icon('speaker')),
    ui.el('div', { class: 'mv-player-meta' },
      ui.el('div', { class: 'mv-player-title' }, title),
      ui.el('div', { class: 'mv-player-sub muted' }, 'Narrated — 0:00 / 2:48')
    ),
    ui.el('div', { class: 'mv-player-bar' }, ui.el('div', { class: 'mv-player-bar-fill' }))
  );
  return modalityChrome({
    label: 'Read to me', glyph: 'speaker',
    body: player,
    onBack: ctx.backToOriginal
  });
}

function summaryView(phase, ctx) {
  const body = ui.el('div', { class: 'mv-prose' });
  if (phase === 'watch') {
    body.appendChild(ui.el('p', null, `Key takeaways from ${ctx.lesson.title}:`));
    const list = ui.el('ul', { class: 'mv-list' });
    list.append(
      ui.el('li', null, 'Recognize the situation before you act.'),
      ui.el('li', null, 'Escalate by signal, not by clock.'),
      ui.el('li', null, "The bundle's velocity matters more than its perfect order.")
    );
    body.appendChild(list);
  } else {
    body.appendChild(ui.el('p', null, ctx.targetText ? `In short: ${shorten(ctx.targetText)}` : 'No prose to summarize on this step.'));
  }
  return modalityChrome({
    label: 'Summary', glyph: 'list',
    body, onBack: ctx.backToOriginal
  });
}

function simplerView(phase, ctx) {
  const body = ui.el('div', { class: 'mv-prose' });
  if (phase === 'watch') {
    body.appendChild(ui.el('p', null,
      `Plain-language take on "${ctx.lesson.title}": notice the situation, set the boundary, then ask for help in clear pieces.`));
  } else {
    body.appendChild(ui.el('p', null, ctx.targetText ? simpler(ctx.targetText) : 'Nothing to simplify on this step.'));
  }
  return modalityChrome({
    label: 'Simpler terms', glyph: 'lightbulb',
    body, onBack: ctx.backToOriginal
  });
}

function chatView(phase, ctx) {
  const scope = phase === 'watch' ? 'this lesson' : 'this passage';
  const log = ui.el('div', { class: 'mv-chat' },
    ui.el('div', { class: 'mv-msg coach' },
      ui.el('div', { class: 'mv-msg-author' }, 'Coach Vic'),
      ui.el('div', { class: 'mv-msg-text' }, `Ready when you are — ask anything about ${scope}.`)
    ),
    ui.el('div', { class: 'mv-suggest' },
      ui.el('button', { class: 'mv-chip' }, "What's the most common mistake here?"),
      ui.el('button', { class: 'mv-chip' }, 'Give me a quick example'),
      ui.el('button', { class: 'mv-chip' }, 'Why does this matter in practice?')
    ),
    ui.el('div', { class: 'mv-compose' },
      ui.el('input', { type: 'text', placeholder: 'Ask Coach Vic…', class: 'mv-input' }),
      ui.el('button', { class: 'mv-send', 'aria-label': 'Send' }, ui.icon('arrowRight'))
    )
  );
  return modalityChrome({
    label: 'Ask Coach Vic', glyph: 'chat',
    body: log, onBack: ctx.backToOriginal
  });
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
