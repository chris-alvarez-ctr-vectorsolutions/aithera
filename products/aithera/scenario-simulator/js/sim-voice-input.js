/* =====================================================================
   SimVoiceInput — drop-in microphone / speech-to-text for a coach composer.

   The "Mic + Send" model: a mic sits inside the existing text field, next to
   the (host-owned) send button. Tapping it dictates into the SAME textarea —
   words stream in as provisional text, and on stop they settle into normal
   editable text so the learner can fix a word and send. Because it writes to
   the field and re-dispatches the host's own `input` event, the host's
   existing auto-grow / send-enable logic keeps working untouched — the mic is
   purely additive.

   It also DICTATES-TO-APPEND: starting the mic with text already in the field
   keeps that text and adds to it. That's the reason this model was chosen over
   a single morphing button.

   Usage:
     const voice = SimVoiceInput.attach({
       shell:      '.input-shell',   // element or selector — the bordered field wrapper
       textarea:   '#composer',      // the text input
       sendButton: '#sendBtn',       // optional — disabled while listening, then handed back
       hint:       '#inputHint',     // optional — shows "Listening 0:03 · tap to stop"
       leadIcon:   '#inputIcon',     // optional — a decorative glyph to retire when voice is on
       demo:       false,            // true → scripted fallback when real STT is unavailable
       sampleProvider: () => '…'     // demo only — the text a scripted dictation "speaks"
     });

   Returns a handle: { start, stop, playSample, isListening, el, destroy } (null if
   the browser can't do speech AND demo is off — we don't offer what we can't honor).

   Not part of the product chrome beyond the composer itself — it renders its own
   styles (scoped to `.siv-*` classes) and reads the host's theme tokens, so it
   inherits light/dark and the scene-mode (amber) treatment automatically.
   ===================================================================== */
(function () {
  "use strict";

  var CSS = [
    ".siv-wrap{flex:0 0 auto;display:flex;align-items:center;gap:6px;align-self:center}",
    ".siv-mic{width:34px;height:34px;border-radius:50%;cursor:pointer;border:0;background:transparent;",
    "  color:var(--c-ink-faint,#67718a);display:grid;place-items:center;font-size:15px;position:relative;",
    "  transition:background .15s,color .15s,transform .1s;-webkit-appearance:none;appearance:none}",
    ".siv-mic:hover{background:var(--c-surface-2,#eef1f7);color:var(--c-ink,#1a2030)}",
    ".siv-mic:active{transform:scale(.92)}",
    ".siv-mic:focus-visible{outline:2px solid var(--c-accent,#4b63e6);outline-offset:2px}",
    ".siv-mic:disabled{opacity:.4;cursor:default}",
    ".siv-mic.siv-rec{background:var(--c-rec,#e5484d);color:#fff}",
    ".siv-mic.siv-rec:hover{background:var(--c-rec,#e5484d);filter:brightness(1.06)}",
    ".siv-mic.siv-rec::after{content:'';position:absolute;inset:-5px;border-radius:50%;",
    "  border:2px solid color-mix(in srgb, var(--c-rec,#e5484d) 60%, transparent);animation:sivRing 1.4s ease-out infinite}",
    "@keyframes sivRing{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.5);opacity:0}}",
    ".siv-eq{display:none;align-items:flex-end;gap:2px;height:18px;padding:0 2px}",
    ".siv-listening .siv-eq{display:inline-flex}",
    ".siv-eq span{width:3px;border-radius:2px;background:var(--c-rec,#e5484d);height:30%;animation:sivBars .9s ease-in-out infinite}",
    ".siv-eq span:nth-child(1){animation-delay:0s}.siv-eq span:nth-child(2){animation-delay:.12s}",
    ".siv-eq span:nth-child(3){animation-delay:.24s}.siv-eq span:nth-child(4){animation-delay:.36s}.siv-eq span:nth-child(5){animation-delay:.48s}",
    "@keyframes sivBars{0%,100%{height:25%}50%{height:95%}}",
    ".siv-listening{border-color:var(--c-rec,#e5484d)!important;box-shadow:0 0 0 3px var(--c-rec-soft,rgba(229,72,77,.16))!important}",
    ".siv-listening textarea{color:var(--c-ink-soft,#5a6379)}",
    ".siv-dot{color:var(--c-rec,#e5484d);animation:sivBlink 1s steps(2,jump-none) infinite}",
    "@keyframes sivBlink{50%{opacity:.25}}",
    ".app[data-target=\"character\"] .siv-mic{color:var(--s-ink-faint,#a89b8c)}",
    ".app[data-target=\"character\"] .siv-mic:hover{color:var(--s-ink,#f3ede5)}",
    "@media (prefers-reduced-motion: reduce){.siv-eq span{height:60%!important}.siv-mic.siv-rec::after{animation:none}}"
  ].join("\n");

  var cssDone = false;
  function injectCSS() {
    if (cssDone) return;
    var s = document.createElement("style");
    s.setAttribute("data-siv", "");
    s.textContent = CSS;
    document.head.appendChild(s);
    cssDone = true;
  }

  function pick(v) { return typeof v === "string" ? document.querySelector(v) : (v || null); }

  function attach(opts) {
    opts = opts || {};
    var shell = pick(opts.shell);
    var textarea = pick(opts.textarea);
    if (!shell || !textarea) return null;

    var sendButton = pick(opts.sendButton);
    var hintEl = pick(opts.hint);
    var leadIcon = pick(opts.leadIcon);
    var demo = !!opts.demo;
    var sampleProvider = typeof opts.sampleProvider === "function" ? opts.sampleProvider : null;

    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Production: don't surface an affordance we can't deliver.
    if (!SpeechRec && !demo) return null;

    injectCSS();
    if (leadIcon) leadIcon.style.display = "none";  // retire the decorative lead glyph

    var wrap = document.createElement("div");
    wrap.className = "siv-wrap";
    wrap.innerHTML =
      '<div class="siv-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<button type="button" class="siv-mic" aria-label="Dictate your response" aria-pressed="false" title="Speak your answer">' +
      '<i class="fa-solid fa-microphone"></i></button>';
    shell.appendChild(wrap);
    var micBtn = wrap.querySelector(".siv-mic");
    var micI = micBtn.querySelector("i");

    var recognition = null, listening = false, finalText = "", baseText = "", usingScripted = false;
    var tick = null, secs = 0, scriptTimer = null, savedHint = null, hintTimer = null;

    function fireInput() {
      var e;
      try { e = new Event("input", { bubbles: true }); }
      catch (err) { e = document.createEvent("Event"); e.initEvent("input", true, false); }
      textarea.dispatchEvent(e);
    }
    function renderLive(interim) {
      textarea.value = (baseText + finalText + interim).replace(/\s+$/, " ").replace(/^\s+/, "");
      fireInput();
      // The host's input handler may re-enable send on non-empty text; keep it
      // held while the words are still provisional.
      if (listening && sendButton) sendButton.disabled = true;
      try {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      } catch (e2) {}
      textarea.scrollTop = textarea.scrollHeight;
    }
    function recHintHTML(s) {
      var m = Math.floor(s / 60), ss = String(s % 60);
      if (ss.length < 2) ss = "0" + ss;
      return '<span class="siv-dot">&#9679;</span> Listening&nbsp; ' + m + ":" + ss + " &nbsp;·&nbsp; tap to stop";
    }
    function setListeningUI(on) {
      listening = on;
      shell.classList.toggle("siv-listening", on);
      micBtn.classList.toggle("siv-rec", on);
      micBtn.setAttribute("aria-pressed", on ? "true" : "false");
      micI.className = "fa-solid " + (on ? "fa-stop" : "fa-microphone");
      micBtn.title = on ? "Stop dictation" : "Speak your answer";
      if (sendButton && on) sendButton.disabled = true;
      if (hintEl) {
        if (on) {
          if (savedHint === null) savedHint = hintEl.innerHTML;
          secs = 0; hintEl.innerHTML = recHintHTML(0);
          tick = setInterval(function () { secs++; hintEl.innerHTML = recHintHTML(secs); }, 1000);
        } else {
          if (tick) { clearInterval(tick); tick = null; }
          if (savedHint !== null) { hintEl.innerHTML = savedHint; savedHint = null; }
        }
      }
    }

    function startReal() {
      if (!recognition) {
        recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = opts.lang || "en-US";
        recognition.onresult = function (event) {
          var interim = "";
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var r = event.results[i];
            if (r.isFinal) finalText += r[0].transcript + " "; else interim += r[0].transcript;
          }
          renderLive(interim);
        };
        var FATAL = { "not-allowed": 1, "service-not-allowed": 1, "audio-capture": 1, "network": 1 };
        recognition.onerror = function (e) {
          if (!FATAL[e.error]) return;  // 'no-speech' / 'aborted' recover via onend
          var why = (e.error === "not-allowed" || e.error === "service-not-allowed")
            ? "Microphone access is blocked"
            : (e.error === "audio-capture" ? "No microphone found" : "Voice service is offline");
          stop(false);
          if (demo && sampleProvider) { flashHint(why + " — playing a sample"); setTimeout(startScripted, 500); }
          else { flashHint(why); }
        };
        recognition.onend = function () { if (listening && !usingScripted) stop(true); };
      }
      usingScripted = false;
      setListeningUI(true);
      try { recognition.start(); } catch (err) {}
    }

    function startScripted() {
      if (listening) return;
      var line = (sampleProvider && sampleProvider()) || "This is a sample dictated response.";
      baseText = textarea.value ? textarea.value.replace(/\s*$/, " ") : "";
      finalText = ""; usingScripted = true;
      setListeningUI(true);
      var words = line.split(" "), i = 0;
      scriptTimer = setInterval(function () {
        if (i >= words.length) {
          clearInterval(scriptTimer); scriptTimer = null;
          finalText = line + " "; renderLive("");
          setTimeout(function () { if (listening) stop(true); }, 800);
          return;
        }
        finalText = words.slice(0, i + 1).join(" "); renderLive(""); i++;
      }, 105);
    }

    function start() {
      if (listening || textarea.disabled) return;
      baseText = textarea.value ? textarea.value.replace(/\s*$/, " ") : "";
      finalText = "";
      if (SpeechRec) startReal();
      else if (demo) startScripted();
    }
    function stop(commit) {
      if (!listening) return;
      setListeningUI(false);
      if (recognition && !usingScripted) { try { recognition.stop(); } catch (e) {} }
      if (scriptTimer) { clearInterval(scriptTimer); scriptTimer = null; }
      usingScripted = false;
      if (commit) {
        textarea.value = (baseText + finalText).trim();
        fireInput();                                  // let the host recompute send / height
        if (textarea.value) textarea.dataset.source = "voice";  // set AFTER, so host handlers don't wipe it
      } else {
        fireInput();
      }
      textarea.focus();
    }
    function flashHint(msg) {
      if (!hintEl) return;
      clearTimeout(hintTimer);
      if (savedHint === null) savedHint = hintEl.innerHTML;
      hintEl.textContent = msg;
      hintTimer = setTimeout(function () {
        if (!listening && savedHint !== null) { hintEl.innerHTML = savedHint; savedHint = null; }
      }, 2800);
    }

    micBtn.addEventListener("click", function () { if (listening) stop(true); else start(); });

    return {
      start: start,
      stop: function () { stop(true); },
      playSample: startScripted,
      isListening: function () { return listening; },
      el: micBtn,
      destroy: function () {
        if (listening) stop(false);
        wrap.remove();
        if (leadIcon) leadIcon.style.display = "";
      }
    };
  }

  window.SimVoiceInput = { attach: attach };
})();
