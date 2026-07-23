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
    let raf   = 0;      // in-flight rise, so a fresh one can cancel it
    let scrollRAF = 0;  // in-flight scroll glide, so a fresh one can re-target it

    /* Raise the sheet as ONE piece. Returns true if it actually animated a
       growth (so callers know whether the body still needs a scroll follow). */
    function rise() {
      if (!app.classList.contains('coach-up')) { lastH = null; return false; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      panel.style.transition = 'none';   // we drive the transform ourselves this beat
      panel.style.transform = '';        // sit at the resting position to measure
      const target = panel.offsetHeight; // forces layout → true post-render height
      const from = lastH;
      lastH = target;
      // First paint or reduced-motion: settle the newest bubble at the bottom
      // instantly — there's no rise to animate, and reduced-motion wants no
      // scroll animation either.
      if (from == null || reducedMotion()) { body.scrollTop = body.scrollHeight; panel.style.transition = ''; return false; }
      // Already at max height — no rise to animate. Do NOT pin the scroll here;
      // return false so follow() can GLIDE the thread down smoothly instead.
      // Pinning here is exactly what made the thread SNAP once the sheet stopped
      // growing.
      if (Math.abs(target - from) < 2) { panel.style.transition = ''; return false; }
      // Growing: lay out at final height with the newest bubble pinned to the
      // bottom, then ease the WHOLE sheet (header + thread) up from a dropped
      // start.
      body.scrollTop = body.scrollHeight;
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
       Reduced-motion / backgrounded tabs settle instantly instead. */
    function glideToBottom() {
      if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; }
      const bottom = () => body.scrollHeight - body.clientHeight;
      if (reducedMotion() || document.visibilityState !== 'visible') { body.scrollTop = bottom(); return; }
      const start = body.scrollTop;
      const target = bottom();
      if (Math.abs(target - start) < 1) { body.scrollTop = target; return; }  // already there
      const dur = 320;
      const ease = (t) => 1 - Math.pow(1 - t, 3);   // easeOutCubic — matches the rise
      let t0 = null;
      const step = (ts) => {
        if (t0 == null) t0 = ts;
        const p = Math.min(1, (ts - t0) / dur);
        body.scrollTop = start + (target - start) * ease(p);
        if (p < 1) { scrollRAF = requestAnimationFrame(step); }
        else { scrollRAF = 0; body.scrollTop = bottom(); }   // settle on the true bottom
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
      if (!grew && (state.nearBottom || state.delivering)) glideToBottom();
      return grew;
    }

    /* Grow-or-follow, for content that isn't a full render follow (e.g. the
       typing dots landing in the coach body): tween the growth if there is any,
       otherwise glide the scroll — the SAME continuous ease as follow(), so the
       dots and the bubble that replaces them move as one motion, never a jump. */
    function pin() {
      if (!rise()) glideToBottom();
    }

    /* Forget the last painted height and stop any in-flight glide — call when the
       sheet lowers, so the next time it rises it treats that as a first paint
       (instant, no stray tween). */
    function reset() { lastH = null; if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; } }

    return { rise, follow, pin, reset };
  }

  window.SimCoachSheet = { create };
})();
