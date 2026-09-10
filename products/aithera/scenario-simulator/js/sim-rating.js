/* =====================================================================
   SimRating — the post-scenario experience rating screen.

   The last step of a scenario, after the closing summary and the coach's
   resources have landed: one question ("How was this experience?"), a
   five-star scale, and an optional comment. It is a SEPARATE SCREEN, not a
   page of the results report — the report is feedback the learner receives,
   this is feedback the learner GIVES, and mixing the two makes the survey
   read like part of their score.

   Two rules the epic is built around, and neither is negotiable here:

     1. The learner crosses INTO it on their own command. Nothing auto-shows;
        the host's bottom-bar CTA calls open(). Same contract as every other
        transition in the player ("step in", "see coach feedback", "view full
        results") — the learner is never moved without tapping.

     2. The feedback is NOT mandatory. The forward button is enabled from the
        first frame, with no stars picked and nothing typed, and it says so in
        words next to it. There is no "are you sure?", no second ask, and no
        state in which a learner is stuck on this screen.

   Usage:
     const RATING = SimRating.attach({
       appEl:    document.querySelector('.app'),   // made inert while open
       question: 'How was this experience?',
       eyebrow:  'Before you go',
       onSubmit: ({ rating, comment, skipped }) => { … },
     });
     RATING.open();          // from the host's bottom-bar CTA

   Returns { open, close, isOpen, value, reset, el, destroy }.

   Self-contained: it injects its own stylesheet (scoped to `.simr-*`) and
   reads the host's theme tokens, so it inherits light/dark and the card
   grammar of the results modal without depending on that module.
   ===================================================================== */
(function () {
  "use strict";

  var STAR_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  var CSS = [
    /* Any view in here that sets its own `display` would otherwise beat the UA
       stylesheet's `[hidden]{display:none}` and render anyway — which is
       exactly how the receipt ended up showing underneath the form. One rule
       up front so no future view can reintroduce that. */
    ".simr-screen [hidden]{display:none!important}",
    /* —— the screen: same card grammar as the results modal, own classes —— */
    ".simr-screen{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;",
    "  padding:20px;background:rgba(0,0,0,.55)}",
    ".simr-screen[hidden]{display:none}",
    ".simr-card{width:100%;max-width:560px;max-height:85vh;display:flex;flex-direction:column;",
    "  background:var(--c-bg,#f5f7fb);border:1px solid var(--c-line,#e3e7f0);border-radius:var(--radius,16px);",
    "  box-shadow:var(--shadow-lg,0 12px 48px -6px rgba(28,50,79,.38));overflow:hidden}",
    ".simr-card:focus{outline:none}",
    ".simr-head{flex:0 0 auto;padding:16px 20px 13px;border-bottom:1px solid var(--c-line,#e3e7f0);",
    "  display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".simr-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;",
    "  color:var(--c-ink-faint,#67718a)}",
    /* The head badge stands in for the report's page dots — this screen is one
       page, so dots would be a lie; a quiet glyph keeps the head from looking
       unfinished next to the report the learner just came from. */
    ".simr-badge{flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;",
    "  background:var(--c-accent-soft,#e6f1fb);color:var(--c-accent-strong,#015aa8);font-size:11px}",
    ".simr-body{flex:1 1 auto;overflow-y:auto;padding:24px 20px 20px}",

    /* —— the question + star scale —— */
    ".simr-field{border:0;margin:0;padding:0;min-width:0}",
    ".simr-q{display:block;padding:0;margin:0 0 4px;font-size:21px;font-weight:800;line-height:1.3;",
    "  color:var(--c-ink,#1a2030);text-align:center;width:100%}",
    ".simr-sub{margin:0 0 16px;font-size:13px;line-height:1.5;color:var(--c-ink-soft,#5a6379);text-align:center}",
    ".simr-stars{display:flex;justify-content:center;gap:2px;margin:0 0 6px}",
    ".simr-star-in{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;",
    "  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}",
    ".simr-star{width:56px;height:52px;display:grid;place-items:center;cursor:pointer;border-radius:10px;",
    "  font-size:34px;color:var(--simr-empty,#c6ccda);line-height:1;",
    "  transition:color .14s var(--ease,ease),transform .14s var(--ease,ease),background .14s var(--ease,ease)}",
    ".simr-star i{pointer-events:none}",
    /* Filled state is driven by a class the JS paints, so hover-preview,
       keyboard focus and the committed choice all use ONE code path. */
    ".simr-star.is-on{color:var(--simr-star,#e39a0b)}",
    ".simr-star.is-picked{transform:scale(1.08)}",
    ".simr-stars:hover .simr-star{background:transparent}",
    ".simr-star:hover{background:var(--c-surface-2,#eef1f7)}",
    /* Focus ring rides the LABEL — the input itself is visually hidden, so
       without this a keyboard learner arrowing through the scale sees nothing.
       :focus-visible only, deliberately: a plain :focus here also ringed the
       star a mouse user just clicked, which reads as an error state on what
       is only a choice. */
    ".simr-star-in:focus-visible+.simr-star{outline:2px solid var(--c-accent,#0271ce);outline-offset:2px}",
    /* Colour is never the only cue: the pick is also stated here in words. */
    ".simr-caption{min-height:20px;margin:0 0 22px;text-align:center;font-size:14px;font-weight:700;",
    "  color:var(--c-ink,#1a2030)}",
    ".simr-caption .n{color:var(--c-ink-faint,#67718a);font-weight:600}",
    ".simr-caption.is-empty{color:var(--c-ink-faint,#67718a);font-weight:600}",

    /* —— the optional comment —— */
    ".simr-comment{display:block;border-top:1px solid var(--c-line,#e3e7f0);padding-top:18px}",
    ".simr-label{display:flex;align-items:baseline;justify-content:space-between;gap:10px;",
    "  margin:0 0 8px;font-size:14px;font-weight:700;color:var(--c-ink,#1a2030)}",
    ".simr-optional{flex:0 0 auto;font-size:12px;font-weight:600;color:var(--c-ink-faint,#67718a);",
    "  text-transform:none;letter-spacing:0}",
    ".simr-ta{display:block;width:100%;box-sizing:border-box;min-height:84px;resize:vertical;",
    "  padding:11px 13px;border:1px solid var(--c-line,#e3e7f0);border-radius:4px;",
    "  background:var(--c-surface,#fff);color:var(--c-ink,#1a2030);font:inherit;font-size:14px;line-height:1.55;",
    "  transition:border-color .15s var(--ease,ease),box-shadow .15s var(--ease,ease)}",
    ".simr-ta::placeholder{color:var(--c-ink-faint,#67718a)}",
    ".simr-ta:focus{outline:none;border-color:var(--c-accent,#0271ce);",
    "  box-shadow:0 0 0 3px var(--c-accent-soft,#e6f1fb)}",
    ".simr-count{margin:6px 0 0;text-align:right;font-size:12px;font-weight:600;",
    "  color:var(--c-ink-faint,#67718a);opacity:0;transition:opacity .2s var(--ease,ease)}",
    ".simr-count.is-shown{opacity:1}",
    ".simr-count.is-max{color:#c2410c}",

    /* —— the foot: the optionality is stated NEXT TO the button —— */
    ".simr-foot{flex:0 0 auto;padding:14px 20px 18px;border-top:1px solid var(--c-line,#e3e7f0);",
    "  display:flex;align-items:center;justify-content:space-between;gap:14px}",
    ".simr-note{font-size:12.5px;line-height:1.45;color:var(--c-ink-faint,#67718a);max-width:26ch}",
    /* Matches the page's own primary CTA (.debrief-cta / .enter-cta): the 4px
       Vector control corner, the primary-blue glow, brightness on hover — not
       the results modal's flatter 10px nav button, which is a different job. */
    ".simr-go{flex:0 0 auto;margin-left:auto;display:inline-flex;align-items:center;",
    "  justify-content:center;gap:11px;padding:13px 22px;border:0;border-radius:4px;",
    "  background:var(--c-accent,#0271ce);color:var(--c-on-accent,#fff);font:inherit;font-size:15px;",
    "  font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(2,113,206,.26);",
    "  transition:filter .15s var(--ease,ease),transform .1s var(--ease,ease)}",
    ".simr-go:hover{filter:brightness(1.06)}",
    ".simr-go:active{transform:scale(.98)}",
    ".simr-go:focus-visible{outline:none;",
    "  box-shadow:0 6px 18px rgba(2,113,206,.26),0 0 0 3px var(--c-accent-soft,#e6f1fb)}",
    ".simr-go .arrow{transition:transform .15s var(--ease,ease)}",
    ".simr-go:hover .arrow{transform:translateX(3px)}",

    /* —— the confirmation, in the card the learner acted in —— */
    ".simr-thanks{display:grid;place-content:center;text-align:center;padding:34px 24px 30px}",
    ".simr-check{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;",
    "  background:var(--c-accent-soft,#e6f1fb);color:#158444;font-size:25px}",
    ".simr-thanks-h{margin:0 0 6px;font-size:20px;font-weight:800;color:var(--c-ink,#1a2030)}",
    /* One short line by design — it has to stay a single line at 375px so a
       centered confirmation never becomes centered multi-line prose. */
    ".simr-thanks-sub{margin:0;font-size:13.5px;line-height:1.5;color:var(--c-ink-soft,#5a6379)}",
    ".simr-thanks-stars{display:flex;justify-content:center;gap:5px;margin:16px 0 0;font-size:17px;",
    "  color:var(--simr-star,#e39a0b)}",
    ".simr-thanks-stars .off{color:var(--simr-empty,#c6ccda)}",
    "@keyframes simrPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}",
    ".simr-thanks:not([hidden]) .simr-check{animation:simrPop .32s var(--ease,ease) both}",
    "@media (prefers-reduced-motion:reduce){.simr-thanks:not([hidden]) .simr-check{animation:none}}",

    ".simr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;",
    "  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}",

    /* The screen rises rather than snapping in — it matches the coach sheet's
       motion so the end of the practice keeps one vocabulary. */
    "@keyframes simrRise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}",
    "@keyframes simrFade{from{opacity:0}to{opacity:1}}",
    ".simr-screen:not([hidden]){animation:simrFade .22s var(--ease,ease) both}",
    ".simr-screen:not([hidden]) .simr-card{animation:simrRise .34s var(--ease,ease) both}",
    "@media (prefers-reduced-motion:reduce){",
    "  .simr-screen:not([hidden]),.simr-screen:not([hidden]) .simr-card{animation:none}",
    "  .simr-star{transition:none}}",

    "@media (max-width:480px){",
    "  .simr-q{font-size:19px}",
    "  .simr-star{width:100%;height:56px;font-size:30px}",
    "  .simr-stars{gap:0}",
    "  .simr-foot{flex-direction:column;align-items:stretch}",
    "  .simr-note{max-width:none;order:2;text-align:center}",
    "  .simr-go{margin-left:0;justify-content:center;order:1}}"
  ].join("\n");

  function injectStyles() {
    if (document.getElementById("sim-rating-style")) return;
    var s = document.createElement("style");
    s.id = "sim-rating-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function attach(cfg) {
    var c = cfg || {};
    injectStyles();

    var count      = c.stars || 5;
    var labels     = c.labels || STAR_LABELS;
    var maxLength  = c.maxLength || 500;
    var uid        = "simr-" + Math.random().toString(36).slice(2, 8);

    /* ---- markup ---------------------------------------------------------
       The scale is a real radio group in a fieldset whose legend IS the
       question, so the whole thing is named, arrow-key navigable and
       announced by a screen reader with no ARIA of our own. The stars are
       labels; the inputs are visually hidden but focusable. */
    var stars = "";
    for (var i = 1; i <= count; i++) {
      var name = i + (i === 1 ? " star" : " stars") +
                 (labels[i - 1] ? " — " + labels[i - 1] : "");
      stars +=
        '<input class="simr-star-in" type="radio" name="' + uid + '" id="' + uid + "-" + i + '" value="' + i + '">' +
        '<label class="simr-star" for="' + uid + "-" + i + '" data-v="' + i + '">' +
          '<i class="fa-solid fa-star" aria-hidden="true"></i>' +
          '<span class="simr-sr">' + esc(name) + "</span>" +
        "</label>";
    }

    var screen = document.createElement("div");
    screen.className = "simr-screen";
    screen.id = c.id || "ratingScreen";
    screen.hidden = true;
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-modal", "true");
    screen.setAttribute("aria-label", c.question || "How was this experience?");
    screen.innerHTML =
      '<div class="simr-card" tabindex="-1">' +
        '<div class="simr-head">' +
          '<span class="simr-eyebrow">' + esc(c.eyebrow || "Before you go") + "</span>" +
          '<span class="simr-badge"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i></span>' +
        "</div>" +
        '<div class="simr-body" id="' + uid + '-ask">' +
          '<fieldset class="simr-field">' +
            '<legend class="simr-q">' + esc(c.question || "How was this experience?") + "</legend>" +
            '<p class="simr-sub">' + esc(c.sub || "Your rating helps us improve these scenarios.") + "</p>" +
            '<div class="simr-stars" id="' + uid + '-row">' + stars + "</div>" +
          "</fieldset>" +
          '<p class="simr-caption is-empty" id="' + uid + '-cap">' + esc(c.emptyCaption || "Tap a star to rate") + "</p>" +
          '<div class="simr-comment">' +
            '<label class="simr-label" for="' + uid + '-ta">' +
              "<span>" + esc(c.commentLabel || "Anything you'd like to add?") + "</span>" +
              '<span class="simr-optional">Optional</span>' +
            "</label>" +
            '<textarea class="simr-ta" id="' + uid + '-ta" maxlength="' + maxLength + '" rows="3" ' +
              'placeholder="' + esc(c.commentPlaceholder || "What worked, what didn't, anything you'd change…") + '"></textarea>' +
            '<p class="simr-count" id="' + uid + '-count" aria-hidden="true"></p>' +
          "</div>" +
        "</div>" +
        /* The acknowledgement stays IN this card rather than being handed to
           whatever comes next: the learner acted here, so this is where the
           receipt belongs. It replaces the form instead of sitting under it —
           the questions are answered and re-opening them would invite an edit
           the payload has already gone out with. */
        '<div class="simr-body simr-thanks" id="' + uid + '-thanks" hidden>' +
          '<div>' +
            '<div class="simr-check"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>' +
            '<h3 class="simr-thanks-h">' + esc(c.thanksTitle || "Thanks for the feedback") + "</h3>" +
            '<p class="simr-thanks-sub" id="' + uid + '-thanks-sub"></p>' +
            '<div class="simr-thanks-stars" id="' + uid + '-thanks-stars" aria-hidden="true" hidden></div>' +
          "</div>" +
        "</div>" +
        '<div class="simr-foot">' +
          '<p class="simr-note">' + esc(c.note || "This is optional — you can continue without answering.") + "</p>" +
          '<button type="button" class="simr-go" id="' + uid + '-go">' +
            '<span id="' + uid + '-go-label">' + esc(c.continueLabel || "Continue") + "</span>" +
            ' <i class="fa-solid fa-arrow-right arrow" aria-hidden="true"></i>' +
          "</button>" +
        "</div>" +
      "</div>";
    document.body.appendChild(screen);

    var card    = screen.querySelector(".simr-card");
    var row     = screen.querySelector("#" + uid + "-row");
    var caption = screen.querySelector("#" + uid + "-cap");
    var ta      = screen.querySelector("#" + uid + "-ta");
    var counter = screen.querySelector("#" + uid + "-count");
    var goBtn   = screen.querySelector("#" + uid + "-go");
    var goLabel = screen.querySelector("#" + uid + "-go-label");
    var inputs  = Array.prototype.slice.call(row.querySelectorAll(".simr-star-in"));
    var starEls = Array.prototype.slice.call(row.querySelectorAll(".simr-star"));
    var askView   = screen.querySelector("#" + uid + "-ask");
    var thanksView= screen.querySelector("#" + uid + "-thanks");
    var thanksSub = screen.querySelector("#" + uid + "-thanks-sub");
    var thanksStars = screen.querySelector("#" + uid + "-thanks-stars");
    var eyebrowEl = screen.querySelector(".simr-eyebrow");
    var noteEl    = screen.querySelector(".simr-note");

    var picked      = 0;        // the committed choice (0 = none)
    var open        = false;
    var submitted   = false;
    var phase       = "ask";    // "ask" → the form · "thanks" → the receipt
    var pending     = null;     // the payload, held while the receipt is up
    var returnFocus = null;

    /* ---- paint ----------------------------------------------------------
       ONE function fills the scale, whether the value comes from a hover, a
       keyboard focus or the committed pick. `preview` beats `picked` while
       the pointer is over the row, and the caption follows the same value so
       hovering star 4 says "4 — Great" before you commit to it. */
    function paint(preview) {
      var shown = preview || picked;
      starEls.forEach(function (el) {
        var v = +el.dataset.v;
        el.classList.toggle("is-on", v <= shown);
        el.classList.toggle("is-picked", !preview && v <= picked);
      });
      if (shown) {
        caption.classList.remove("is-empty");
        caption.innerHTML = '<span class="n">' + shown + " / " + count + "</span> · " +
                            esc(labels[shown - 1] || "");
      } else {
        caption.classList.add("is-empty");
        caption.textContent = c.emptyCaption || "Tap a star to rate";
      }
    }

    /* The button names the action it is about to perform, which changes with
       what the learner has entered: "Submit feedback" once there IS feedback,
       plain "Continue" while the form is empty. A static "Submit feedback"
       would be a small lie on the skip path — there is nothing to submit —
       and the optionality note sits right beside it either way. Deliberately
       driven by the COMMITTED value, not a hover preview, so the label doesn't
       flicker as the pointer crosses the stars. */
    function paintGo() {
      var hasFeedback = !!(picked || (ta.value || "").trim());
      goLabel.textContent = (phase === "thanks" || !hasFeedback)
        ? (c.continueLabel || "Continue")
        : (c.submitLabel || "Submit feedback");
    }

    function commit(v) {
      picked = v;
      var input = inputs[v - 1];
      if (input) input.checked = true;
      paint(0);
      paintGo();
    }

    // Hover / keyboard preview. `mouseleave` on the ROW (not each star) so
    // sliding across the scale doesn't flicker back to the committed value.
    starEls.forEach(function (el) {
      el.addEventListener("mouseenter", function () { paint(+el.dataset.v); });
    });
    row.addEventListener("mouseleave", function () { paint(0); });
    // Arrow keys move the radio focus natively and fire `change` — that IS
    // the commit for keyboard, which is the behaviour a radio group promises.
    inputs.forEach(function (input) {
      input.addEventListener("change", function () { commit(+input.value); });
      input.addEventListener("focus", function () { paint(+input.value); });
      input.addEventListener("blur", function () { paint(0); });
    });

    /* ---- the optional comment ---- */
    ta.addEventListener("input", function () {
      var n = ta.value.length;
      // The counter is noise until it matters — it fades in near the ceiling
      // rather than sitting there counting every keystroke from zero.
      var near = n > maxLength * 0.8;
      counter.classList.toggle("is-shown", near);
      counter.classList.toggle("is-max", n >= maxLength);
      if (near) counter.textContent = n + " / " + maxLength;
      paintGo();          // typing turns "Continue" into "Submit feedback" too
    });

    /* ---- the forward move -----------------------------------------------
       Enabled from the first frame and never gated: a learner who taps it
       with nothing filled in is SKIPPING, and that is a first-class outcome
       reported as `skipped: true`, not a failure to complete.

       Two phases, and the split is deliberate. Feedback GIVEN earns a receipt
       in this card before the screen goes; feedback SKIPPED gets none and
       leaves immediately, because there is nothing to acknowledge and a
       thank-you for a survey somebody declined reads as a bug. That also
       keeps skipping the FASTEST way out rather than taxing it with an extra
       screen — the whole point of the feedback being optional. */
    function submit() {
      if (phase === "thanks") { finalize(); return; }   // the receipt's own Continue
      if (submitted) return;
      submitted = true;
      var comment = (ta.value || "").trim();
      pending = {
        rating:  picked || null,
        comment: comment || null,
        skipped: !picked && !comment,
        at:      new Date().toISOString()
      };
      if (pending.skipped) finalize();
      else showThanks(pending);
    }

    // The receipt. It states what was actually recorded rather than a generic
    // "sent" — a learner who typed a comment but skipped the stars should see
    // their comment acknowledged, not be told they rated something.
    function showThanks(payload) {
      phase = "thanks";
      var line = c.thanksBody || (
        payload.rating && payload.comment ? "We\u2019ve recorded your rating and your comment."
        : payload.rating                  ? "We\u2019ve recorded your rating."
                                          : "We\u2019ve recorded your comment."
      );
      thanksSub.textContent = line;
      if (payload.rating) {
        var out = "";
        for (var i = 1; i <= count; i++) {
          out += '<i class="fa-solid fa-star' + (i > payload.rating ? " off" : "") + '"></i>';
        }
        thanksStars.innerHTML = out;
        thanksStars.hidden = false;
      } else {
        thanksStars.hidden = true;
      }
      askView.hidden    = true;
      thanksView.hidden = false;
      noteEl.hidden     = true;         // nothing optional left to explain
      eyebrowEl.textContent = c.thanksEyebrow || "Feedback sent";
      paintGo();          // the receipt's button is a plain "Continue" again
      // The receipt is the only thing left to read, so focus lands on the card
      // and the button stays one Tab away.
      card.focus();
      if (c.onThanks) c.onThanks(payload);
    }

    // Closing out for good — from the receipt's Continue, or straight from the
    // form when the learner skipped.
    function finalize() {
      var payload = pending;
      pending = null;
      close();
      if (payload && c.onSubmit) c.onSubmit(payload);
    }

    /* ---- keeping the screen isolated ------------------------------------
       `inert` on the host app is NOT enough on its own here, and the reason
       is worth writing down: sim-debrief's renderModal() re-asserts inert on
       every render from ITS own open flag, so any render that happens while
       this screen is up (a coach-sheet reconcile, a scroll settle) strips the
       attribute out from under us. Two modules, one shared attribute.

       So the trap is owned here and does not depend on that attribute
       surviving: Tab cycles inside the card, and a focusin backstop pulls
       focus home if anything gets past it — re-claiming inert on the way, so
       the isolation heals itself instead of silently staying gone.

       For the build: use a real <dialog> (or an inert owner that ref-counts)
       and this whole dance goes away. */
    var FOCUSABLE = 'input:not([disabled]),textarea:not([disabled]),button:not([disabled]),' +
                    '[href],select:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function focusables() {
      return Array.prototype.filter.call(card.querySelectorAll(FOCUSABLE), function (el) {
        // Whichever view is hidden contributes nothing — without this the Tab
        // cycle in the receipt phase still stops on the form's star group.
        if (el.offsetParent === null) return false;
        // A radio group is ONE tab stop: only the checked radio is reachable
        // by Tab, or the first when none is checked — same as the browser's
        // own behaviour, which the trap must not override.
        if (el.type === "radio") {
          var group = inputs.filter(function (i) { return i.name === el.name; });
          var checked = group.filter(function (i) { return i.checked; })[0];
          return el === (checked || group[0]);
        }
        return true;
      });
    }

    function claimInert() {
      if (c.appEl && !c.appEl.hasAttribute("inert")) c.appEl.setAttribute("inert", "");
    }

    function onKeydownTrap(e) {
      if (e.key !== "Tab") return;
      var list = focusables();
      if (!list.length) { e.preventDefault(); card.focus(); return; }
      var first = list[0];
      var last  = list[list.length - 1];
      var at    = document.activeElement;
      if (e.shiftKey && (at === first || at === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last)             { e.preventDefault(); first.focus(); }
    }

    function onFocusIn(e) {
      if (!open || screen.contains(e.target)) return;
      claimInert();
      var list = focusables();
      (list[0] || card).focus();
    }

    function openScreen() {
      if (open) return;
      open = true;
      returnFocus = document.activeElement;
      screen.hidden = false;
      claimInert();
      document.addEventListener("focusin", onFocusIn, true);
      screen.addEventListener("keydown", onKeydownTrap);
      // Focus the CARD, not the first star — landing on a star would read as
      // a default rating the learner didn't choose.
      card.focus();
      if (c.onOpen) c.onOpen();
    }

    function close() {
      if (!open) return;
      open = false;
      document.removeEventListener("focusin", onFocusIn, true);
      screen.removeEventListener("keydown", onKeydownTrap);
      screen.hidden = true;
      if (c.appEl) c.appEl.removeAttribute("inert");
      var rf = returnFocus;
      returnFocus = null;
      if (rf && rf.isConnected && rf.offsetParent !== null) rf.focus();
      else if (c.focusFallback) c.focusFallback();
      if (c.onClose) c.onClose();
    }

    goBtn.addEventListener("click", submit);
    // Escape is the same forward move, not a cancel — there is nothing behind
    // this screen to go back to, so dismissing it must still finish the flow.
    screen.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); submit(); }
    });

    paint(0);
    paintGo();

    return {
      open:   openScreen,
      close:  close,
      isOpen: function () { return open; },
      value:  function () {
        return { rating: picked || null, comment: (ta.value || "").trim() || null };
      },
      reset:  function () {
        submitted = false;
        phase = "ask";
        pending = null;
        picked = 0;
        inputs.forEach(function (i) { i.checked = false; });
        ta.value = "";
        counter.classList.remove("is-shown", "is-max");
        // Back to the form, receipt put away — a restart that re-opened on
        // last run's thank-you would have nothing to thank anyone for.
        askView.hidden    = false;
        thanksView.hidden = true;
        thanksStars.hidden = true;
        noteEl.hidden     = false;
        eyebrowEl.textContent = c.eyebrow || "Before you go";
        paint(0);
        paintGo();
      },
      el: screen,
      destroy: function () { close(); screen.remove(); }
    };
  }

  window.SimRating = { attach: attach, STAR_LABELS: STAR_LABELS };
})();
