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
import * as ui from '../ui.js?v=scene-flow-7';

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

  // Starting modality from the course-start chooser (?via=video|read|chat).
  //   video → default video hero
  //   read  → jump straight to the text (Learn) phase
  //   chat  → open the first content phase in "Ask Coach Vic"
  // pendingStartMode is consumed by the first content phase that renders,
  // so it only affects the entry view — switching/advancing is unaffected.
  const via = new URLSearchParams((location.hash.split('?')[1] || '')).get('via');
  let cursor = 0;
  let pendingStartMode = null;
  if (via === 'read') {
    const li = phases.indexOf('learn');
    if (li >= 0) cursor = li;
  } else if (via === 'chat') {
    pendingStartMode = 'chat';
  }
  function consumeStartMode(fallback) {
    const m = pendingStartMode || fallback;
    pendingStartMode = null;
    return m;
  }

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

    // Scene-watch micro-flow owns the whole screen — it draws its own header
    // (kicker + flow title + 2-step phase bar) and its own per-scene CTA
    // buttons, so the standard lesson header + sticky footer are skipped.
    const watchVb = videoBlocks[0];
    if (name === 'watch' && watchVb?.scenes?.length) {
      wrap.classList.add('chap-scene-watch');
      consumeStartMode('original');   // swallow any ?via=chat so it doesn't leak into Learn
      wrap.appendChild(sceneWatchEl(watchVb, {
        headLabel: headLabel(),
        onExit: () => { location.hash = `#/course/${course.id}`; },
        onLaunch: (scenarioId) => {
          // &from=watch tells the practice view to drop straight into the
          // discussion as "Step 2 of 2" with a re-watch link, rather than
          // showing a fresh welcome card.
          location.hash = `#/practice/${scenarioId}?courseLesson=${course.id}:${lesson.id}&from=watch`;
        }
      }));
      return wrap;
    }

    if (name === 'recap') {
      wrap.classList.add('chap-checkpoint');
      wrap.appendChild(buildRecap());
    } else {
      wrap.appendChild(buildHeader(name));
      if (name === 'watch') wrap.appendChild(buildWatch());
      if (name === 'learn') wrap.appendChild(buildLearn());
      if (name === 'check') wrap.appendChild(buildCheck());
    }

    // On the recap, the prominent "Up next" tile is the primary CTA, so we
    // skip the footer button there — unless this is the final lesson, where
    // the footer carries the "Finish course" action instead.
    if (name !== 'recap' || !next) {
      wrap.appendChild(ui.stickyFooter({ children: footerCta(name) }));
    }
    return wrap;
  }

  // Unified header: course-level strip + kicker + title + within-lesson
  // step indicator. The strip answers "which lesson?", the indicator
  // answers "where in this lesson?".
  // "Lesson 01 of 04 · Recognition" — the course-level locator shown atop
  // every lesson phase. Pulled out so the scene-watch micro-flow can reuse
  // the exact same label in its own header.
  function headLabel() {
    const lessonNum = `Lesson ${String(idx + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')}`;
    const rawKicker = lesson.kicker || course.title;
    // Strip the leading "Lesson N · " segment from the authored kicker so we
    // don't repeat "Lesson" twice; keep the section descriptor on the right.
    const section = rawKicker.replace(/^\s*Lesson\s+\d+\s*[·:-]\s*/i, '').trim();
    return section && section.toLowerCase() !== rawKicker.toLowerCase()
      ? `${lessonNum} · ${section}`
      : lessonNum;
  }

  function buildHeader(name) {
    const header = ui.el('header', { class: 'lesson-head' });
    const kicker = ui.el('div', { class: 'ch-kicker' });
    kicker.appendChild(ui.el('div', null, headLabel()));
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

    // Slide-deck video: a paged image+text sequence (stand-in for a real video)
    // that ends in a question-CTA launching this lesson's knowledge-check
    // scenario. Falls back to the single video hero + modality swap when no
    // slides are authored, so every other course is unaffected.
    if (vb.slides && vb.slides.length) {
      consumeStartMode('original');   // swallow any ?via=chat so it doesn't leak into Learn
      stack.append(slideDeckEl(vb, {
        onLaunch: (scenarioId) => {
          location.hash = `#/practice/${scenarioId}?courseLesson=${course.id}:${lesson.id}`;
        }
      }));
      return stack;
    }

    let mode = consumeStartMode('original');
    const stage = ui.el('div', { class: 'modality-stage' });

    function renderHero() {
      const node = heroForMode('watch', mode, { videoBlock: vb, lesson, backToOriginal: () => switchMode('original') });
      node.classList.add('modality-enter');
      stage.replaceChildren(node);
      requestAnimationFrame(() => node.classList.remove('modality-enter'));
    }
    // Kept for the "Show original" affordance inside a modality view; the
    // format chooser up front replaces the old "Try another way" panel.
    function switchMode(nextMode) {
      if (nextMode === mode) return;
      const cur = stage.firstElementChild;
      if (cur) {
        cur.classList.add('modality-exit');
        setTimeout(() => { mode = nextMode; renderHero(); }, 180);
      } else {
        mode = nextMode; renderHero();
      }
    }

    renderHero();
    stack.append(stage);
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

    let mode = consumeStartMode('original');
    const card = ui.el('article', { class: 'lesson-card learn-card' });

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
    }
    // Kept for the "Show original" affordance inside a modality view; the
    // format chooser up front replaces the old "Try another way" panel.
    function switchMode(nextMode) {
      if (nextMode === mode) return;
      const stage = card.querySelector('.modality-stage');
      const cur = stage?.firstElementChild;
      if (cur) {
        cur.classList.add('modality-exit');
        setTimeout(() => { mode = nextMode; renderCard(); }, 180);
      } else {
        mode = nextMode; renderCard();
      }
    }

    renderCard();
    stack.append(card);
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

    // Condensed stat line — the three checkpoint stats on a single row.
    const minutes = course.lessons.slice(0, doneCount).reduce((s, l) => s + (l.minutes || 0), 0);
    stack.appendChild(ui.el('div', { class: 'checkpoint-statline' },
      ui.el('div', { class: 'cps-item' },
        ui.el('span', { class: 'cps-v' }, `${doneCount}/${total}`),
        ui.el('span', { class: 'cps-k' }, 'Lessons')),
      ui.el('span', { class: 'cps-div', 'aria-hidden': 'true' }),
      ui.el('div', { class: 'cps-item' },
        ui.el('span', { class: 'cps-v' }, `${minutes} min`),
        ui.el('span', { class: 'cps-k' }, 'Invested')),
      ui.el('span', { class: 'cps-div', 'aria-hidden': 'true' }),
      ui.el('div', { class: 'cps-item' },
        ui.el('span', { class: 'cps-v' }, `${pct}%`),
        ui.el('span', { class: 'cps-k' }, 'Progress'))
    ));

    const courseScenarios = store.scenariosForCourse(course.id);
    const sc = courseScenarios.find((s) => s.kind !== 'iv-math');
    const mini = courseScenarios.find((s) => s.kind === 'iv-math');
    // When this lesson's video deck names a knowledge-check scenario, the recap
    // surfaces the same check for Reading/AI-chat learners — and carries
    // ?courseLesson so finishing it credits THIS lesson (not just the scenario).
    const ctaScenarioId = videoBlocks[0]?.cta?.scenarioId;
    if (sc) {
      const isCheck = sc.id === ctaScenarioId;
      stack.appendChild(ui.coachPrompt({
        question: isCheck
          ? (videoBlocks[0].cta.question || `Ready to put this into practice? Run "${sc.title}".`)
          : `You retain ~3× more from a ${store.state.industry.language.practiceWord} than from a re-read. Run "${sc.title}"?`,
        primaryLabel: isCheck ? 'Start the knowledge check' : 'Practice now',
        primaryHref: isCheck
          ? `#/practice/${sc.id}?courseLesson=${course.id}:${lesson.id}`
          : `#/practice/${sc.id}`,
        primaryVariant: 'secondary',
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
      // The Up next card is the page's primary CTA (the separate "Continue"
      // footer button was removed as redundant). It owns the advance action
      // so the current lesson is still marked complete on the way out.
      stack.appendChild(ui.sectionHeader('Up next'));
      stack.appendChild(ui.nextUpCard({
        title: next.title,
        subtitle: `${next.minutes} min · Lesson ${String(idx + 2).padStart(2, '0')} of ${String(total).padStart(2, '0')}`,
        href: `#/course/${course.id}/lesson/${next.id}`,
        initials: String(idx + 2),
        cta: true,
        onClick: advance
      }));
    }
    return stack;
  }

  show();
  return root;
}

// ---------- block renderers ----------

// Paged image+text slide deck for a "video" block that carries `slides`.
// Reuses the discussion engine's keyframe hero (image + caption + fade) and the
// step-indicator dot CSS. The final slide swaps Next for a question-CTA that
// calls onLaunch(scenarioId) to start the knowledge-check.
function slideDeckEl(block, { onLaunch }) {
  const slides = block.slides || [];
  const wrap = ui.el('div', { class: 'slide-deck' });

  const heroImg = ui.el('img', { class: 'scn-hero-photo', alt: '', decoding: 'async' });
  heroImg.addEventListener('error', () => { heroImg.style.display = 'none'; });
  const heroCaption = ui.el('div', { class: 'scn-kf-caption' });
  const hero = ui.el('div', { class: 'scn-hero has-photo scn-kf', style: { height: '220px' } },
    heroImg,
    ui.el('span', { class: 'scn-hero-scrim', 'aria-hidden': 'true' }),
    heroCaption
  );

  const body = ui.el('p', { class: 'slide-text' });
  const dots = ui.el('div', { class: 'si-dots slide-dots' });
  const controls = ui.el('div', { class: 'slide-nav' });

  let i = 0;

  function setSlide(slide) {
    hero.classList.remove('kf-in');
    heroImg.src = slide.image || '';
    heroImg.style.display = '';
    heroCaption.textContent = slide.caption || '';
    requestAnimationFrame(() => hero.classList.add('kf-in'));
    body.textContent = slide.text || '';
  }

  function renderDots() {
    dots.replaceChildren(...slides.map((_, di) =>
      ui.el('span', { class: `si-dot ${di < i ? 'done' : di === i ? 'cur' : ''}` })));
  }

  function renderControls() {
    const last = i === slides.length - 1;
    const back = ui.el('button',
      { class: 'btn ghost slide-back', disabled: i === 0, on: { click: () => goTo(i - 1) } },
      'Back');
    let forward;
    if (!last) {
      forward = ui.el('button', { class: 'btn primary slide-next', on: { click: () => goTo(i + 1) } },
        ui.el('span', null, 'Next'), ui.icon('arrowRight'));
    } else if (block.cta && block.cta.scenarioId) {
      forward = ui.el('button', { class: 'btn primary slide-cta', on: { click: () => onLaunch(block.cta.scenarioId) } },
        ui.el('span', null, block.cta.question || 'Continue'), ui.icon('arrowRight'));
    } else {
      forward = ui.el('span', { class: 'slide-nav-spacer', 'aria-hidden': 'true' });
    }
    controls.replaceChildren(back, forward);
  }

  function goTo(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    setSlide(slides[i] || {});
    renderDots();
    renderControls();
  }

  wrap.append(hero, body, dots, controls);
  goTo(0);
  return wrap;
}

// Scene-watch flow for a "video" block carrying `scenes`. A focused 2-step
// micro-flow:
//   1. Pre-roll — frames the task, shows a poster + scene-count/duration, and
//      a "Play all scenes" CTA so the learner controls when watching starts.
//   2. One page per scene — each scene plays its own clip with a description
//      below. A segmented scrubber fills blue as the current clip plays and
//      turns green once a scene completes. "Next Scene" stays disabled until
//      the clip finishes (the video `ended` event); the final scene's button
//      becomes the cta question and calls onLaunch(scenarioId).
//
// Real clips drive playback via the <video> element; when a clip is missing
// or fails to load, a short simulated timer fills the scrubber and unlocks the
// gate so the prototype stays clickable with placeholder data.
function sceneWatchEl(block, { headLabel, onExit, onLaunch }) {
  const scenes = block.scenes || [];
  const flow = block.flow || {};
  const steps = ['Watch', 'Share observations'];
  const completed = new Set();        // indices of finished scenes

  const wrap = ui.el('section', { class: 'scene-watch' });

  // ---- persistent header: back + kicker + flow title + 2-step phase bar ----
  const back = ui.el('button', { class: 'scene-back', 'aria-label': 'Back to course', on: { click: onExit } });
  back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>';
  const head = ui.el('header', { class: 'lesson-head scene-watch-head' },
    ui.el('div', { class: 'scene-head-row' },
      back,
      ui.el('div', { class: 'ch-kicker' }, ui.el('div', null, headLabel))
    ),
    ui.el('h2', { class: 'ch-title' }, flow.title || block.title || 'Watch'),
    ui.phaseBar({ steps, current: 0 })
  );

  const body = ui.el('div', { class: 'scene-watch-body' });
  wrap.append(head, body);

  // ---- pre-roll ----
  function renderPreroll() {
    body.replaceChildren();
    if (flow.intro) body.appendChild(ui.el('p', { class: 'scene-intro' }, flow.intro));

    const poster = scenes[0]?.poster || block.image || '';
    const stats = [`${scenes.length} scene${scenes.length === 1 ? '' : 's'}`];
    if (flow.duration) stats.push(flow.duration);

    const img = ui.el('img', { class: 'scene-poster', src: poster, alt: '', decoding: 'async' });
    img.addEventListener('error', () => { img.style.display = 'none'; });
    // Poster only — this is a preview thumbnail, not a player. Playback starts
    // on the scene pages, so no play button here (the CTA advances instead).
    const media = ui.el('div', { class: 'scene-preroll-media' },
      img,
      ui.el('span', { class: 'scene-poster-scrim', 'aria-hidden': 'true' })
    );

    body.appendChild(ui.el('div', { class: 'scene-preroll-card' },
      ui.el('div', { class: 'scene-preroll-meta' },
        ui.el('span', { class: 'scene-preroll-tag' }, 'Video'),
        ui.el('span', { class: 'scene-preroll-stats' }, stats.join('   |   '))
      ),
      media
    ));

    body.appendChild(ui.el('button', { class: 'btn primary block cta-large scene-playall', on: { click: () => renderScene(0) } },
      ui.el('span', null, 'Continue to Scene 1'), ui.icon('arrowRight')));
  }

  // ---- segmented scrubber (one segment per scene) ----
  function buildScrubber(activeIdx) {
    const el = ui.el('div', { class: 'scene-scrub', 'aria-hidden': 'true' });
    const segs = scenes.map((_, si) => {
      const fill = ui.el('span', { class: 'scene-seg-fill' });
      const seg = ui.el('span', { class: 'scene-seg' }, fill);
      if (completed.has(si)) { seg.classList.add('done'); fill.style.width = '100%'; }
      else if (si === activeIdx) seg.classList.add('cur');
      el.appendChild(seg);
      return { seg, fill };
    });
    return {
      el,
      // Live playhead for the scene on screen. Updates even on a re-watch
      // (completed scene) so the learner can see where they are in the clip;
      // other already-done segments are left untouched.
      setProgress(i, p) {
        if (i !== activeIdx && completed.has(i)) return;
        segs[i].fill.style.width = `${Math.max(0, Math.min(100, Math.round(p * 100)))}%`;
      },
      // Flip the active segment into "watching" (blue) and rewind it — called
      // when a clip starts, including replaying one that was already finished.
      beginPlay(i) {
        segs[i].seg.classList.remove('done');
        segs[i].seg.classList.add('cur');
        segs[i].fill.style.width = '0%';
      },
      markDone(i) {
        segs[i].seg.classList.remove('cur');
        segs[i].seg.classList.add('done');
        segs[i].fill.style.width = '100%';
      }
    };
  }

  // ---- one scene page ----
  // Holds the previous scene's timer-cleanup so leaving a scene cancels any
  // in-flight sim/guard timers (they'd otherwise fire against detached nodes).
  let leaveScene = null;
  function renderScene(i) {
    if (leaveScene) { leaveScene(); leaveScene = null; }
    body.replaceChildren();
    const scene = scenes[i] || {};
    const last = i === scenes.length - 1;

    // Muted: the clips' audio is placeholder-only for now, so we play silent.
    const hasClip = !!scene.video;
    const video = ui.el('video', { class: 'scene-video', playsinline: '', muted: true, preload: hasClip ? 'auto' : 'metadata' });
    if (hasClip) {
      // Show the clip's OWN first frame as the still rather than the authored
      // poster (which can mismatch the footage). The #t media fragment nudges
      // the browser to decode and display frame ~0 before playback starts.
      video.appendChild(ui.el('source', { src: scene.video + '#t=0.001', type: 'video/mp4' }));
    } else if (scene.poster || block.image) {
      video.poster = scene.poster || block.image;   // placeholder fallback (no clip)
    }

    const scrub = buildScrubber(i);
    // Play/pause affordance. On arrival (and once a clip ends) it shows a play
    // triangle. Tapping it starts playback, the icon morphs to a pause bar, and
    // it auto-fades after ~800ms so it doesn't sit over the footage. Hovering or
    // tapping the frame brings it back so the learner can pause/resume.
    const playIcon = ui.icon('play');
    const pauseIcon = ui.icon('pause');
    const playBtn = ui.el('button', { class: 'scene-play-overlay', 'aria-label': 'Play scene' }, playIcon);
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();                 // don't let the frame-tap handler re-show it
      if (frame.classList.contains('playing')) pausePlayback();
      else startPlayback(video.ended);
    });
    const frame = ui.el('div', { class: 'scene-video-frame' }, video, ui.el('span', { class: 'scene-video-scrim', 'aria-hidden': 'true' }), playBtn, scrub.el);
    // Tapping anywhere on the frame while playing reveals the (faded) control;
    // hover does the same on pointer devices via CSS.
    frame.addEventListener('click', () => { if (frame.classList.contains('playing')) revealControl(); });
    body.appendChild(frame);

    // ---- control visibility (auto-fade while playing) ----
    let fadeTimer = null;
    function clearFade() { if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; } }
    // Show the control, then schedule it to fade back out after a beat.
    function revealControl() {
      clearFade();
      frame.classList.remove('control-faded');
      fadeTimer = setTimeout(() => {
        // Only fade while still playing — a paused/ended clip keeps it visible.
        if (frame.classList.contains('playing')) frame.classList.add('control-faded');
      }, 800);
    }
    // Pin the control on (no fade) — used whenever the clip is paused or ended.
    function pinControl() { clearFade(); frame.classList.remove('control-faded'); }

    // Title + description read as one block, so they sit tighter to each other
    // than to the video above / button below.
    const copy = ui.el('div', { class: 'scene-copy' },
      ui.el('h3', { class: 'scene-title' }, scene.title || `Scene ${i + 1}`));
    if (scene.description) copy.appendChild(ui.el('p', { class: 'scene-desc' }, scene.description));
    body.appendChild(copy);

    const btn = ui.el('button', { class: 'btn primary block cta-large scene-next', disabled: !completed.has(i) },
      ui.el('span', null, last ? (block.cta?.question || 'Continue') : 'Next Scene'));
    if (!last) btn.appendChild(ui.icon('arrowRight'));
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      if (last) onLaunch(block.cta?.scenarioId);
      else renderScene(i + 1);
    });
    body.appendChild(btn);

    // Tells the learner why the button is greyed out — a disabled button alone
    // is easy to miss. Flips to a "Scene complete!" confirmation once watched.
    const gateHint = ui.el('p', { class: 'scene-gate-hint' },
      ui.icon('play'),
      ui.el('span', null, 'Watch the full scene to continue'));
    body.appendChild(gateHint);
    function markGateComplete() {
      gateHint.classList.add('is-complete');
      gateHint.replaceChildren(ui.icon('check'), ui.el('span', null, 'Scene complete!'));
    }

    // ---- playback + gating ----
    let simTimer = null, guard = null;
    function clearSim() { if (simTimer) { clearInterval(simTimer); simTimer = null; } if (guard) { clearTimeout(guard); guard = null; } }
    leaveScene = () => { clearSim(); clearFade(); };
    function completeScene() {
      clearSim();
      completed.add(i);
      scrub.markDone(i);
      btn.disabled = false;
      btn.classList.add('ready');
      markGateComplete();
      playBtn.hidden = false;          // becomes a replay affordance
      playBtn.replaceChildren(playIcon);
      playBtn.setAttribute('aria-label', 'Replay scene');
      frame.classList.remove('playing');
      pinControl();
    }
    // Simulated playback for missing/broken clips — fills over ~5s.
    function startSim() {
      clearSim();
      const DUR = 5000, t0 = performance.now();
      simTimer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / DUR);
        scrub.setProgress(i, p);
        if (p >= 1) completeScene();
      }, 80);
    }
    function startPlayback(isReplay) {
      frame.classList.add('playing');
      playBtn.replaceChildren(pauseIcon);   // toggles to a pause control while playing
      playBtn.setAttribute('aria-label', 'Pause scene');
      revealControl();                      // briefly show the pause state, then fade
      // Rewind the scrubber when we're (re)starting from the top — a replay or
      // re-watch of an already-finished scene. A mid-scene resume keeps its fill.
      if (isReplay || completed.has(i)) scrub.beginPlay(i);
      if (!scene.video) { startSim(); return; }
      if (isReplay) { try { video.currentTime = 0; } catch (e) {} }
      const pr = video.play?.();
      if (pr && pr.catch) pr.catch(() => startSim());
      // If the file never loads (404 / missing), fall back to simulation.
      guard = setTimeout(() => { if (video.readyState < 2 && !simTimer) startSim(); }, 1200);
    }
    function pausePlayback() {
      if (scene.video) video.pause();       // fires the 'pause' handler below
      else { clearSim(); onUserPaused(); }  // simulated clips have no media events
    }
    // Restore the play affordance and pin it on whenever playback stops short.
    function onUserPaused() {
      frame.classList.remove('playing');
      playBtn.replaceChildren(playIcon);
      playBtn.setAttribute('aria-label', 'Play scene');
      pinControl();
    }
    video.addEventListener('loadeddata', () => { if (guard) { clearTimeout(guard); guard = null; } });
    video.addEventListener('timeupdate', () => {
      if (video.duration && !simTimer) scrub.setProgress(i, video.currentTime / video.duration);
    });
    video.addEventListener('ended', () => { scrub.setProgress(i, 1); completeScene(); });
    video.addEventListener('error', () => { if (!completed.has(i)) startSim(); });
    // A user pause (not the end-of-clip pause) brings the play button back so
    // they can resume.
    video.addEventListener('pause', () => { if (!video.ended) onUserPaused(); });

    // No auto-play: the scene opens on its poster with the play button showing.
    // Already-watched scenes stay unlocked and show the replay button.
    if (completed.has(i)) { scrub.markDone(i); markGateComplete(); }
    playBtn.hidden = false;

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderPreroll();
  return wrap;
}

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

// Inline still image for reading mode. Removes itself on load error so a
// dead URL never leaves a broken-image placeholder in the article.
function figureEl(b) {
  const fig = ui.el('figure', { class: 'lesson-figure' });
  const img = ui.el('img', {
    class: 'lf-img', src: b.src, alt: b.alt || '',
    loading: 'lazy', decoding: 'async'
  });
  img.addEventListener('error', () => fig.remove());
  fig.appendChild(img);
  if (b.caption) fig.appendChild(ui.el('figcaption', { class: 'lf-cap' }, b.caption));
  return fig;
}

// Lightweight horizontal bar chart built from CSS — no chart library,
// no external image. `data` is [{ label, value }]; bars scale to the max.
function chartEl(b) {
  const fig = ui.el('figure', { class: 'lesson-chart' });
  if (b.title) fig.appendChild(ui.el('div', { class: 'lch-title' }, b.title));
  const max = Math.max(1, ...b.data.map((d) => d.value));
  const rows = ui.el('div', { class: 'lch-rows' });
  for (const d of b.data) {
    const bar = ui.el('span', { class: 'lch-bar', style: { width: `${Math.round((d.value / max) * 100)}%` } });
    rows.appendChild(ui.el('div', { class: 'lch-row' },
      ui.el('div', { class: 'lch-rowhead' },
        ui.el('span', { class: 'lch-label' }, d.label),
        ui.el('span', { class: 'lch-val' }, `${d.value}${b.unit || ''}`)
      ),
      ui.el('span', { class: 'lch-track' }, bar)
    ));
  }
  fig.appendChild(rows);
  if (b.note) fig.appendChild(ui.el('figcaption', { class: 'lch-note' }, b.note));
  return fig;
}

function renderBlock(b, course) {
  if (b.type === 'text' || b.type === 'prose') {
    const wrap = ui.el('div', null);
    if (b.title) wrap.appendChild(ui.el('strong', null, b.title));
    wrap.appendChild(ui.el('p', { style: { marginTop: b.title ? '6px' : '0' } }, b.body));
    return wrap;
  }
  if (b.type === 'image') return figureEl(b);
  if (b.type === 'chart') return chartEl(b);
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
