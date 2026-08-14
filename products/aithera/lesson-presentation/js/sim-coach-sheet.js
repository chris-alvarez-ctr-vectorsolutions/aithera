/* =========================================================================
   SIM COACH SHEET — the AI Coach sheet's rise + follow-scroll motion
   =========================================================================

   The bottom-anchored coach sheet (the `.coach-panel` sitting on the input
   bar) grows as coaching lines arrive, then — once it hits its CSS max-height
   — stops growing and its body (`.coach-panel-body`) scrolls instead. This one
   module owns how that motion feels, so every simulator page animates the
   SAME way. It used to be copy-pasted inline in ~10 pages and had drifted into
   two different implementations; this is the single source of truth.

   TWO motions, one seam:
     • GROWING (sheet below max height) — lay the sheet out at its final height
       immediately, then ease the WHOLE sheet (header + thread together) up
       into place from a dropped start: translateY it down by exactly how much
       it grew (the extra height tucks behind the input bar) and animate that
       transform back to 0. Header and messages share one motion, so nothing
       lags. This is `rise()`.
     • MAXED OUT (sheet at max height) — nothing to grow, so the body scrolls.
       `follow()` GLIDES that scroll smoothly to the new bottom.

   RESERVED FLOOR (the sheet never shrinks): coach lines arrive as a typing
   bubble that is then REMOVED a beat before its message lands. Left alone, the
   sheet would collapse by a bubble's height and immediately re-grow — the
   "jumping" as messages come in. So `rise()` holds a min-height floor that snaps
   up to content instantly but only relaxes down to within one typing-bubble of
   it: the dots' space stays reserved for the message that replaces them. Growth
   is unchanged — only the between-beats SHRINK is removed. `reset()` releases it.

   THE SNAP BUG this module was extracted to kill: the old inline `rise()` ran
   `body.scrollTop = body.scrollHeight` (an instant jump) UNCONDITIONALLY, then
   decided whether it had grown. On the maxed-out path it had already snapped
   the thread to the bottom, so the smooth glide right after had nothing left
   to animate — the thread jumped. Here the instant pin lives ONLY on the paths
   that genuinely can't animate (first paint, reduced motion, and inside the
   grow tween itself); the maxed-out path returns without touching scrollTop so
   `follow()` can glide it.

   Usage (bind once, after the elements exist):
     const coachSheet = SimCoachSheet.create({ app, panel: coachPanel, body: coachPanelBody });
   In render(), when the coach sheet is up:
     if (coachUp) coachSheet.follow({ nearBottom: coachNearBottom, delivering: state.delivering });
     else         coachSheet.reset();
   In showTyping(), when the dots land in the coach body:
     coachSheet.pin();

   No framework, no build step — a plain script exposing window.SimCoachSheet.
   Reduced-motion / backgrounded tabs fall back to instant, guaranteed pins.
   ========================================================================= */
(function () {
  'use strict';

  // Use SimCore's reducedMotion if the page loaded it; otherwise our own — so
  // standalone pages that don't pull in sim-core.js still work unchanged.
  const reducedMotion = () =>
    (window.SimCore && typeof SimCore.reducedMotion === 'function')
      ? SimCore.reducedMotion()
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function create(opts) {
    const app  = opts.app;
    const panel = opts.panel;   // <aside class="coach-panel">
    const body  = opts.body;    // its .coach-panel-body

    let lastH = null;   // sheet height we last painted, = the rise's start point
    let floor = 0;      // reserved height — the sheet never shrinks below this
    let raf   = 0;      // in-flight rise, so a fresh one can cancel it
    let scrollRAF = 0;  // in-flight scroll glide, so a fresh one can re-target it
    let lastScrollTop = 0;  // the scroll position WE last drove the body to — the
                            // truth glideToBottom eases from, immune to the browser
                            // clamping scrollTop down during the typing→message swap
                            // (see glideToBottom's "un-clamp").

    // RESERVE — how much empty space the sheet is allowed to HOLD above its
    // current content. This is what bridges the beat where the typing dots are
    // removed just before their message lands: instead of the thread collapsing
    // by a bubble's worth and then re-growing (the "jumping"), the space stays
    // reserved and the message drops into it. The floor relaxes back toward real
    // content beyond this window, so an intentional big reduction (a fresh run
    // replacing an old one) never leaves a large gap. ≈ one typing bubble + air.
    const RESERVE = 96;
    function releaseFloor() { floor = 0; if (panel.style.minHeight) panel.style.minHeight = ''; }

    /* Raise the sheet as ONE piece. Returns true if it actually animated a
       growth (so callers know whether the body still needs a scroll follow). */
    function rise() {
      if (!app.classList.contains('coach-up')) { lastH = null; releaseFloor(); return false; }
      // The "Full conversation" overlay (sim-chat-history) drives its OWN
      // min/max-height while it's open — don't fight it; just resync our height.
      if (panel.classList.contains('sim-history-open')) { lastH = panel.offsetHeight; return false; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      panel.style.transition = 'none';   // we drive the transform ourselves this beat
      panel.style.transform = '';        // sit at the resting position to measure
      // RESERVE SPACE so the sheet never shrinks mid-conversation. Measure the
      // TRUE content height (floor lifted first), then hold a min-height floor.
      // The floor snaps UP to content instantly, but only relaxes DOWN to within
      // one RESERVE window of it — so removing the typing dots (or landing a
      // short line) leaves the space reserved instead of collapsing the thread,
      // while a genuine big reduction still settles close to its real content.
      panel.style.minHeight = '';
      const content = panel.offsetHeight;                       // forces layout → true content height
      floor = Math.max(content, Math.min(floor, content + RESERVE));
      panel.style.minHeight = floor + 'px';
      const target = panel.offsetHeight; // = max(content, floor), capped by CSS max-height
      const from = lastH;
      lastH = target;
      // First paint or reduced-motion: settle the newest bubble at the bottom
      // instantly — there's no rise to animate, and reduced-motion wants no
      // scroll animation either.
      if (from == null || reducedMotion()) { body.scrollTop = body.scrollHeight; lastScrollTop = body.scrollTop; panel.style.transition = ''; return false; }
      // No growth — the floor held the height steady (dots removed, short line),
      // or we're maxed out. Don't animate and don't pin the scroll here; return
      // false so follow() can GLIDE the thread down smoothly instead. Pinning
      // here is exactly what made the thread SNAP once the sheet stopped growing.
      // The floor guarantees `target` never drops below `from`, so this is the
      // only non-growth case — there is no shrink to animate.
      if (target - from < 2) { panel.style.transition = ''; return false; }
      // Growing: lay out at final height with the newest bubble pinned to the
      // bottom, then ease the WHOLE sheet (header + thread) up from a dropped
      // start.
      body.scrollTop = body.scrollHeight;
      lastScrollTop = body.scrollTop;
      const delta = target - from;                 // how much taller we grew = how far to rise
      const dur = 300;
      const ease = (t) => 1 - Math.pow(1 - t, 3);  // easeOutCubic — quick, settles soft
      let t0 = null;
      const step = (ts) => {
        if (t0 == null) t0 = ts;
        const p = Math.min(1, (ts - t0) / dur);
        panel.style.transform = 'translateY(' + (delta * (1 - ease(p))) + 'px)';   // header + thread, one block
        if (p < 1) { raf = requestAnimationFrame(step); }
        else { raf = 0; panel.style.transform = ''; panel.style.transition = ''; } // release to CSS
      };
      panel.style.transform = 'translateY(' + delta + 'px)';   // start dropped, synchronously
      raf = requestAnimationFrame(step);
      return true;
    }

    /* Glide the body's scroll to its current bottom, once the sheet is maxed out
       and can only scroll (not grow). This is our OWN rAF tween, NOT the native
       `scrollTo({behavior:'smooth'})`, on purpose: coach lines arrive in bursts
       (typing dots, then the bubble, then the next line's dots…), and each beat
       calls this again. A fresh call cancels the in-flight glide and re-targets
       from the CURRENT scroll position, so overlapping beats read as ONE
       continuous ease. The native smooth-scroll couldn't do that — a plain
       `scrollTop =` pin (which the typing dots used to do) instantly CANCELS an
       in-progress native smooth scroll and jumps, and that glide→jump→glide
       alternation is what read as janky once the thread started scrolling.
       Reduced-motion / backgrounded tabs settle instantly instead.

       UN-CLAMP (the maxed-out swap jump): a coach line arrives as typing dots that
       are removed a beat BEFORE their message lands. While maxed and scrolling,
       removing the dots shrinks the body's scrollHeight, and the forced reflow in
       the page's render() — which reads scrollHeight to add the message — happens
       while the dots are gone and the message isn't in the DOM yet. The browser
       clamps scrollTop DOWN to that smaller range (measured: 400→351, one bubble).
       Then this glide would capture the clamped-low value as its start and ease
       back UP — the thread visibly DROPS a bubble's height, then rises: the "jumpy"
       swap the sheet showed only once it stopped growing and began scrolling.
       Before reading `start`, restore scrollTop to the position we actually drove
       to (lastScrollTop), capped at the new bottom — so the glide eases from where
       the thread VISUALLY sat, not the clamp. Gated on `restore` (a follow/pin
       delivery beat) so it never fights a learner who scrolled up to re-read. */
    function glideToBottom(restore) {
      if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; }
      const bottom = () => body.scrollHeight - body.clientHeight;
      const target = bottom();
      if (restore && body.scrollTop < lastScrollTop) body.scrollTop = Math.min(lastScrollTop, target);
      if (reducedMotion() || document.visibilityState !== 'visible') { body.scrollTop = target; lastScrollTop = body.scrollTop; return; }
      const start = body.scrollTop;
      if (Math.abs(target - start) < 1) { body.scrollTop = target; lastScrollTop = body.scrollTop; return; }  // already there
      const dur = 320;
      const ease = (t) => 1 - Math.pow(1 - t, 3);   // easeOutCubic — matches the rise
      let t0 = null;
      const step = (ts) => {
        if (t0 == null) t0 = ts;
        const p = Math.min(1, (ts - t0) / dur);
        body.scrollTop = start + (target - start) * ease(p);
        lastScrollTop = body.scrollTop;
        if (p < 1) { scrollRAF = requestAnimationFrame(step); }
        else { scrollRAF = 0; body.scrollTop = bottom(); lastScrollTop = body.scrollTop; }   // settle on the true bottom
      };
      scrollRAF = requestAnimationFrame(step);
    }

    /* Follow the coach thread to the bottom after a render. If the sheet grew,
       rise() already carried the newest bubble up. If it's maxed out, glide the
       body's scroll to the new bottom — but only when asked (the learner was
       near the bottom, or a reveal is delivering) so we never yank someone who
       scrolled up to re-read. */
    function follow(state) {
      state = state || {};
      const grew = rise();
      if (!grew && (state.nearBottom || state.delivering)) glideToBottom(true);
      return grew;
    }

    /* Grow-or-follow, for content that isn't a full render follow (e.g. the
       typing dots landing in the coach body): tween the growth if there is any,
       otherwise glide the scroll — the SAME continuous ease as follow(), so the
       dots and the bubble that replaces them move as one motion, never a jump. */
    function pin() {
      if (!rise()) glideToBottom(true);
    }

    /* Forget the last painted height and stop any in-flight glide — call when the
       sheet lowers, so the next time it rises it treats that as a first paint
       (instant, no stray tween). */
    function reset() { lastH = null; lastScrollTop = 0; releaseFloor(); if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; } }

    return { rise, follow, pin, reset };
  }

  window.SimCoachSheet = { create };
})();
