/* =====================================================================
   SimRating — the post-scenario experience rating panel.

   Renders INLINE into a host element. It is not a dialog: the rating is a
   screen of its own at the end of a scenario, reached after the practice has
   completed, so there is nothing behind it to overlay and nothing to trap
   focus away from. (It began life as a modal; the scrim, the `inert` juggling
   and a hand-rolled focus trap all went away with that shape, which is the
   main argument for the change beyond what the stakeholder asked for.)

   Two rules the epic is built around, and neither is negotiable here:

     1. The learner arrives on their own command. The host page is reached by
        tapping "Next" once the practice is complete — nothing auto-advances.

     2. The feedback is NOT mandatory. The forward button is enabled from the
        first frame, with no stars picked and nothing typed, and it says so in
        words next to it. There is no "are you sure?", no second ask, and no
        state in which a learner is stuck.

   Usage:
     const RATING = SimRating.mount({
       into:        '#ratingHost',
       finishLabel: back ? 'Continue' : null,   // null → receipt has no button
       onSubmit:    (result) => { …record it… },
       onFinish:    (result) => { …go to `back`… },
     });

   Returns { value, reset, focus, el, destroy }.

   Self-contained: it injects its own stylesheet (scoped to `.simr-*`) and
   reads the host page's theme tokens, so it inherits light/dark from whatever
   it is mounted into.
   ===================================================================== */
(function () {
  "use strict";

  var STAR_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  var CSS = [
    /* Any view in here that sets its own `display` would otherwise beat the UA
       stylesheet's `[hidden]{display:none}` and render anyway — which is
       exactly how the receipt once ended up showing underneath the form. One
       rule up front so no future view can reintroduce that. */
    ".simr-panel [hidden]{display:none!important}",

    /* —— the panel —— */
    ".simr-panel{width:100%;max-width:600px;margin:0 auto;background:var(--c-surface,#fff);",
    "  border:1px solid var(--c-line,#e3e7f0);border-radius:var(--radius,16px);",
    "  box-shadow:var(--shadow-md,0 3px 12px -1px rgba(28,52,84,.26));overflow:hidden}",
    ".simr-head{padding:16px 22px 13px;border-bottom:1px solid var(--c-line,#e3e7f0);",
    "  display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".simr-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;",
    "  color:var(--c-ink-faint,#67718a)}",
    ".simr-badge{flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;",
    "  background:var(--c-accent-soft,#e6f1fb);color:var(--c-accent-strong,#015aa8);font-size:11px}",
    ".simr-body{padding:30px 22px 24px}",

    /* —— the question + star scale —— */
    ".simr-field{border:0;margin:0;padding:0;min-width:0}",
    ".simr-q{display:block;padding:0;margin:0 0 5px;font-size:25px;font-weight:800;line-height:1.25;",
    "  color:var(--c-ink,#1a2030);text-align:center;width:100%}",
    ".simr-sub{margin:0 0 20px;font-size:14px;line-height:1.5;color:var(--c-ink-soft,#5a6379);text-align:center}",
    ".simr-stars{display:flex;justify-content:center;gap:4px;margin:0 0 8px}",
    ".simr-star-in{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;",
    "  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}",
    ".simr-star{width:62px;height:58px;display:grid;place-items:center;cursor:pointer;border-radius:8px;",
    "  font-size:40px;color:var(--simr-empty,#c6ccda);line-height:1;",
    "  transition:color .14s var(--ease,ease),transform .14s var(--ease,ease),background .14s var(--ease,ease)}",
    ".simr-star i{pointer-events:none}",
    /* Filled state is a class the JS paints, so hover-preview, keyboard focus
       and the committed choice all run through ONE code path. */
    ".simr-star.is-on{color:var(--simr-star,#e39a0b)}",
    ".simr-star.is-picked{transform:scale(1.06)}",
    ".simr-star:hover{background:var(--c-surface-2,#eef1f7)}",
    /* Ring rides the LABEL — the input is visually hidden, so without this a
       keyboard learner arrowing the scale sees nothing. :focus-visible only,
       deliberately: a plain :focus also ringed the star a mouse user had just
       clicked, which reads as an error state on what is only a choice. */
    ".simr-star-in:focus-visible+.simr-star{outline:2px solid var(--c-accent,#0271ce);outline-offset:2px}",
    /* Colour is never the only cue: the pick is also stated here in words. */
    ".simr-caption{min-height:22px;margin:0 0 26px;text-align:center;font-size:15px;font-weight:700;",
    "  color:var(--c-ink,#1a2030)}",
    ".simr-caption .n{color:var(--c-ink-faint,#67718a);font-weight:600}",
    ".simr-caption.is-empty{color:var(--c-ink-faint,#67718a);font-weight:600;font-size:14px}",

    /* —— the optional comment —— */
    ".simr-comment{display:block;border-top:1px solid var(--c-line,#e3e7f0);padding-top:20px}",
    ".simr-label{display:flex;align-items:baseline;justify-content:space-between;gap:10px;",
    "  margin:0 0 9px;font-size:15px;font-weight:700;color:var(--c-ink,#1a2030)}",
    ".simr-optional{flex:0 0 auto;font-size:12px;font-weight:600;color:var(--c-ink-faint,#67718a)}",
    ".simr-ta{display:block;width:100%;box-sizing:border-box;min-height:96px;resize:vertical;",
    "  padding:12px 14px;border:1px solid var(--c-line,#e3e7f0);border-radius:4px;",
    "  background:var(--c-surface,#fff);color:var(--c-ink,#1a2030);font:inherit;font-size:15px;line-height:1.55;",
    "  transition:border-color .15s var(--ease,ease),box-shadow .15s var(--ease,ease)}",
    ".simr-ta::placeholder{color:var(--c-ink-faint,#67718a)}",
    ".simr-ta:focus{outline:none;border-color:var(--c-accent,#0271ce);",
    "  box-shadow:0 0 0 3px var(--c-accent-soft,#e6f1fb)}",
    ".simr-count{margin:6px 0 0;text-align:right;font-size:12px;font-weight:600;",
    "  color:var(--c-ink-faint,#67718a);opacity:0;transition:opacity .2s var(--ease,ease)}",
    ".simr-count.is-shown{opacity:1}",
    ".simr-count.is-max{color:#c2410c}",

    /* —— the foot: the optionality is stated NEXT TO the button —— */
    ".simr-foot{padding:16px 22px 20px;border-top:1px solid var(--c-line,#e3e7f0);",
    "  display:flex;align-items:center;justify-content:space-between;gap:14px}",
    ".simr-foot.is-end{justify-content:center}",
    ".simr-note{font-size:13px;line-height:1.45;color:var(--c-ink-faint,#67718a);max-width:28ch}",
    /* Matches the player's own primary CTA (.debrief-cta / .enter-cta): the 4px
       Vector control corner, the primary-blue glow, brightness on hover. */
    ".simr-go{flex:0 0 auto;margin-left:auto;display:inline-flex;align-items:center;",
    "  justify-content:center;gap:11px;padding:13px 24px;border:0;border-radius:4px;",
    "  background:var(--c-accent,#0271ce);color:var(--c-on-accent,#fff);font:inherit;font-size:15px;",
    "  font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(2,113,206,.26);",
    "  transition:filter .15s var(--ease,ease),transform .1s var(--ease,ease)}",
    ".simr-go:hover{filter:brightness(1.06)}",
    ".simr-go:active{transform:scale(.98)}",
    ".simr-go:focus-visible{outline:none;",
    "  box-shadow:0 6px 18px rgba(2,113,206,.26),0 0 0 3px var(--c-accent-soft,#e6f1fb)}",
    ".simr-go .arrow{transition:transform .15s var(--ease,ease)}",
    ".simr-go:hover .arrow{transform:translateX(3px)}",
    ".simr-foot.is-end .simr-go{margin-left:0}",

    /* —— the receipt, replacing the form in the same panel —— */
    ".simr-thanks{display:grid;place-content:center;text-align:center;padding:44px 24px 40px}",
    ".simr-check{width:56px;height:56px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;",
    "  background:var(--c-accent-soft,#e6f1fb);color:#158444;font-size:27px}",
    ".simr-thanks-h{margin:0 0 7px;font-size:22px;font-weight:800;color:var(--c-ink,#1a2030)}",
    /* One short line by design — it has to stay a single line at 375px so a
       centred confirmation never becomes centred multi-line prose. */
    ".simr-thanks-sub{margin:0;font-size:14px;line-height:1.5;color:var(--c-ink-soft,#5a6379)}",
    ".simr-thanks-stars{display:flex;justify-content:center;gap:6px;margin:18px 0 0;font-size:19px;",
    "  color:var(--simr-star,#e39a0b)}",
    ".simr-thanks-stars .off{color:var(--simr-empty,#c6ccda)}",
    "@keyframes simrPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}",
    "@keyframes simrRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
    ".simr-thanks:not([hidden]){animation:simrRise .3s var(--ease,ease) both}",
    ".simr-thanks:not([hidden]) .simr-check{animation:simrPop .34s var(--ease,ease) both}",
    "@media (prefers-reduced-motion:reduce){",
    "  .simr-thanks:not([hidden]),.simr-thanks:not([hidden]) .simr-check{animation:none}",
    "  .simr-star{transition:none}}",

    ".simr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;",
    "  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}",

    "@media (max-width:520px){",
    "  .simr-body{padding:24px 16px 20px}",
    "  .simr-head,.simr-foot{padding-left:16px;padding-right:16px}",
    "  .simr-q{font-size:21px}",
    "  .simr-star{width:100%;height:56px;font-size:33px}",
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

  function mount(cfg) {
    var c = cfg || {};
    injectStyles();

    var host = typeof c.into === "string" ? document.querySelector(c.into) : c.into;
    if (!host) { console.warn("SimRating: no host element for", c.into); return null; }

    var count     = c.stars || 5;
    var labels    = c.labels || STAR_LABELS;
    var maxLength = c.maxLength || 500;
    var uid       = "simr-" + Math.random().toString(36).slice(2, 8);

    /* ---- markup ---------------------------------------------------------
       The scale is a real radio group in a fieldset whose legend IS the
       question, so the whole thing is named, arrow-key navigable and read
       correctly by a screen reader with no ARIA of our own. The stars are
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

    var panel = document.createElement("div");
    panel.className = "simr-panel";
    panel.id = c.id || "ratingPanel";
    panel.innerHTML =
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
      /* The acknowledgement replaces the form in this same panel rather than
         being handed to whatever comes next: the learner acted here, so this
         is where the receipt belongs. Replacing (not appending) also closes
         the questions — re-opening them would invite an edit the payload has
         already gone out with. */
      '<div class="simr-thanks" id="' + uid + '-thanks" hidden>' +
        "<div>" +
          '<div class="simr-check"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>' +
          '<h2 class="simr-thanks-h" id="' + uid + '-thanks-h"></h2>' +
          '<p class="simr-thanks-sub" id="' + uid + '-thanks-sub"></p>' +
          '<div class="simr-thanks-stars" id="' + uid + '-thanks-stars" aria-hidden="true" hidden></div>' +
        "</div>" +
      "</div>" +
      '<div class="simr-foot" id="' + uid + '-foot">' +
        '<p class="simr-note" id="' + uid + '-note">' +
          esc(c.note || "This is optional — you can continue without answering.") + "</p>" +
        '<button type="button" class="simr-go" id="' + uid + '-go">' +
          '<span id="' + uid + '-go-label">' + esc(c.continueLabel || "Continue") + "</span>" +
          ' <i class="fa-solid fa-arrow-right arrow" aria-hidden="true"></i>' +
        "</button>" +
      "</div>";
    host.appendChild(panel);

    var row        = panel.querySelector("#" + uid + "-row");
    var caption    = panel.querySelector("#" + uid + "-cap");
    var ta         = panel.querySelector("#" + uid + "-ta");
    var counter    = panel.querySelector("#" + uid + "-count");
    var goBtn      = panel.querySelector("#" + uid + "-go");
    var goLabel    = panel.querySelector("#" + uid + "-go-label");
    var foot       = panel.querySelector("#" + uid + "-foot");
    var noteEl     = panel.querySelector("#" + uid + "-note");
    var askView    = panel.querySelector("#" + uid + "-ask");
    var thanksView = panel.querySelector("#" + uid + "-thanks");
    var thanksH    = panel.querySelector("#" + uid + "-thanks-h");
    var thanksSub  = panel.querySelector("#" + uid + "-thanks-sub");
    var thanksStars= panel.querySelector("#" + uid + "-thanks-stars");
    var eyebrowEl  = panel.querySelector(".simr-eyebrow");
    var inputs     = Array.prototype.slice.call(row.querySelectorAll(".simr-star-in"));
    var starEls    = Array.prototype.slice.call(row.querySelectorAll(".simr-star"));

    var picked    = 0;        // the committed choice (0 = none)
    var phase     = "ask";    // "ask" → the form · "thanks" → the receipt
    var submitted = false;
    var pending   = null;

    /* ---- paint ----------------------------------------------------------
       ONE function fills the scale, whether the value comes from a hover, a
       keyboard focus or the committed pick. `preview` beats `picked` while the
       pointer is over the row, and the caption follows the same value, so
       hovering star 4 reads "4 / 5 · Great" before you commit to it. */
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
       would be a small lie on the skip path — there is nothing to submit — and
       the optionality note sits right beside it either way. Driven by the
       COMMITTED value, not a hover preview, so it doesn't flicker as the
       pointer crosses the stars. */
    function paintGo() {
      if (phase === "thanks") { goLabel.textContent = c.finishLabel || "Continue"; return; }
      var hasFeedback = !!(picked || (ta.value || "").trim());
      goLabel.textContent = hasFeedback
        ? (c.submitLabel || "Submit feedback")
        : (c.continueLabel || "Continue");
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
    // Arrow keys move radio focus natively and fire `change` — that IS the
    // commit for keyboard, which is what a radio group promises.
    inputs.forEach(function (input) {
      input.addEventListener("change", function () { commit(+input.value); });
      input.addEventListener("focus", function () { paint(+input.value); });
      input.addEventListener("blur", function () { paint(0); });
    });

    ta.addEventListener("input", function () {
      var n = ta.value.length;
      // The counter is noise until it matters — it fades in near the ceiling
      // rather than counting every keystroke from zero.
      var near = n > maxLength * 0.8;
      counter.classList.toggle("is-shown", near);
      counter.classList.toggle("is-max", n >= maxLength);
      if (near) counter.textContent = n + " / " + maxLength;
      paintGo();          // typing turns "Continue" into "Submit feedback" too
    });

    /* ---- the forward move -----------------------------------------------
       Enabled from the first frame and never gated: a learner who taps it with
       nothing filled in is SKIPPING, and that is a first-class outcome
       reported as `skipped: true`, not a failure to complete.

       Because this is a PAGE rather than a dialog, both outcomes have to land
       somewhere visible — a skip can't just dismiss into thin air. So both get
       a closing panel, and the copy is what differs: feedback given is thanked
       for, a skip is simply acknowledged. Thanking someone for a survey they
       declined would read as a bug. */
    function submit() {
      if (phase === "thanks") { if (c.onFinish) c.onFinish(pending); return; }
      if (submitted) return;
      submitted = true;
      var comment = (ta.value || "").trim();
      pending = {
        rating:  picked || null,
        comment: comment || null,
        skipped: !picked && !comment,
        at:      new Date().toISOString()
      };
      showThanks(pending);
      if (c.onSubmit) c.onSubmit(pending);
    }

    // The closing panel. It states what was actually recorded rather than a
    // generic "sent" — a learner who typed a comment but skipped the stars
    // should see their comment acknowledged, not be told they rated something.
    function showThanks(payload) {
      phase = "thanks";
      if (payload.skipped) {
        thanksH.textContent   = c.skippedTitle || "You're all set";
        thanksSub.textContent = c.skippedBody  || "Your practice is complete.";
      } else {
        thanksH.textContent   = c.thanksTitle || "Thanks for the feedback";
        thanksSub.textContent = c.thanksBody || (
          payload.rating && payload.comment ? "We’ve recorded your rating and your comment."
          : payload.rating                  ? "We’ve recorded your rating."
                                            : "We’ve recorded your comment."
        );
      }
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
      noteEl.hidden     = true;                 // nothing optional left to explain
      // "Feedback sent" would be untrue over a skip — nothing was sent.
      eyebrowEl.textContent = payload.skipped
        ? (c.skippedEyebrow || "All done")
        : (c.thanksEyebrow  || "Feedback sent");
      // With nowhere left to go, the panel IS the end of the road — showing a
      // forward button that leads nowhere would be worse than showing none.
      var hasNext = !!c.finishLabel;
      goBtn.hidden = !hasNext;
      foot.classList.toggle("is-end", !hasNext);
      foot.hidden = !hasNext;
      paintGo();
      thanksH.setAttribute("tabindex", "-1");
      thanksH.focus();                          // move the reader to the outcome
    }

    goBtn.addEventListener("click", submit);

    paint(0);
    paintGo();

    return {
      value: function () {
        return { rating: picked || null, comment: (ta.value || "").trim() || null };
      },
      reset: function () {
        submitted = false;
        phase = "ask";
        pending = null;
        picked = 0;
        inputs.forEach(function (i) { i.checked = false; });
        ta.value = "";
        counter.classList.remove("is-shown", "is-max");
        askView.hidden     = false;
        thanksView.hidden  = true;
        thanksStars.hidden = true;
        noteEl.hidden      = false;
        goBtn.hidden       = false;
        foot.hidden        = false;
        foot.classList.remove("is-end");
        eyebrowEl.textContent = c.eyebrow || "Before you go";
        paint(0);
        paintGo();
      },
      focus:   function () { (inputs[0] || goBtn).focus(); },
      el:      panel,
      destroy: function () { panel.remove(); }
    };
  }

  window.SimRating = { mount: mount, STAR_LABELS: STAR_LABELS };
})();
