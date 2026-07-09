/* =========================================================================
   SCENE CONTEXT — reusable context-setter for "advancing scenario" learning.

   An advancing scenario is scripted SCENES with an AI conversation in between
   (the conversation is where the learning happens). The FIRST scene sets the
   context, and it can be delivered in any modality: a video, a reading, or
   narrated AUDIO. This module owns the audio + reading modalities as a drop-in
   the learner-facing pages mount before the coach appears.

     SceneContext.mount(hostEl, {
       modality: 'audio' | 'reading',   // audio narrates the text aloud
       eyebrow, title, text,            // the context (text is required)
       continueLabel,                   // CTA text (default "I'm ready")
       autoplay,                        // audio only; default true
       onContinue,                      // called when the learner advances
     }) -> { stop() }

   The AUDIO modality is adapted from the "Audio Summary" experiment
   (narrated-presentation.html): the browser's Web Speech API speaks the text,
   each word highlights as it's spoken, with a stylized waveform + scrubber, and
   a graceful estimated-timeline fallback when word boundaries aren't fired.
   Reading is the same card without narration.

   Self-contained + dark-themed (injects its own <style> once) so it drops onto
   the scenario shells without depending on lesson.css. Exposed as the global
   window.SceneContext. No modules, no build step.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- one-time scoped styles (dark; tuned to the scenario shells) ------- */
  function injectStyles() {
    if (document.getElementById('scene-context-style')) return;
    const s = document.createElement('style');
    s.id = 'scene-context-style';
    s.textContent = `
    .sc-wrap { --sc-accent:#b07bff; --sc-accent-soft:rgba(176,123,255,0.16);
      --sc-panel:rgba(255,255,255,0.04); --sc-line:rgba(255,255,255,0.12);
      --sc-text:#e8ecf4; --sc-soft:rgba(232,236,244,0.55); --sc-dim:rgba(232,236,244,0.40);
      width:min(620px,100%); margin:0 auto; display:flex; flex-direction:column; gap:16px; }
    .sc-eyebrow { display:inline-flex; align-items:center; gap:8px; margin:0;
      font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--sc-accent); }
    .sc-card { position:relative; overflow:hidden; background:var(--sc-panel);
      border:1px solid var(--sc-line); border-radius:16px;
      padding:clamp(22px,4vw,34px) clamp(20px,4vw,34px) clamp(14px,3vw,20px);
      box-shadow:0 20px 50px -30px rgba(0,0,0,0.6); }
    .sc-title { margin:0 0 12px; font-size:clamp(18px,2.4vw,22px); font-weight:700; color:var(--sc-text); }
    .sc-text { margin:0; max-width:60ch; font-size:clamp(15px,1.8vw,18px); line-height:1.7; color:var(--sc-text); text-align:left; }
    .sc-text .sc-w { border-radius:5px; padding:0 .08em; transition:color .15s ease, background-color .18s ease; }
    .sc-card.reading .sc-text .sc-w      { color:var(--sc-dim); }
    .sc-card.reading .sc-text .sc-w.read { color:var(--sc-text); }
    .sc-card.reading .sc-text .sc-w.now  { color:#fff; background:var(--sc-accent-soft); box-shadow:0 0 0 2px var(--sc-accent-soft); }
    .sc-controls { display:flex; align-items:center; gap:14px; margin-top:clamp(16px,3vw,24px);
      padding-top:15px; border-top:1px solid var(--sc-line); }
    .sc-play { flex:0 0 auto; width:44px; height:44px; border:none; border-radius:50%;
      background:var(--sc-accent); color:#0b0713; font-size:16px; cursor:pointer; display:grid; place-items:center;
      transition:transform .1s ease, filter .15s ease; }
    .sc-play:hover { filter:brightness(1.08); } .sc-play:active { transform:scale(.94); }
    .sc-wave { flex:0 0 auto; width:110px; height:26px; display:block; }
    .sc-time { flex:0 0 auto; margin-left:auto; font-size:12px; font-variant-numeric:tabular-nums; color:var(--sc-soft); }
    .sc-replay { flex:0 0 auto; width:36px; height:36px; border:none; border-radius:50%;
      background:transparent; color:var(--sc-soft); font-size:13px; cursor:pointer; display:grid; place-items:center;
      transition:background-color .15s ease, color .15s ease; }
    .sc-replay:hover { background:var(--sc-accent-soft); color:#fff; }
    .sc-scrubber { position:absolute; left:0; right:0; bottom:0; height:4px; background:var(--sc-line); }
    .sc-scrubber-fill { height:100%; width:0%; background:var(--sc-accent); transition:width .25s linear; }
    .sc-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .sc-note { margin:0; font-size:12px; color:var(--sc-soft); display:none; }
    .sc-note.show { display:block; }
    .sc-continue { margin-left:auto; display:inline-flex; align-items:center; gap:8px;
      border:none; border-radius:999px; padding:12px 22px; font-size:15px; font-weight:700; cursor:pointer;
      background:var(--sc-accent); color:#0b0713; transition:transform .1s ease, filter .15s ease; }
    .sc-continue:hover { filter:brightness(1.08); } .sc-continue:active { transform:scale(.97); }
    .sc-continue.ready { box-shadow:0 0 0 4px var(--sc-accent-soft); }
    @media (prefers-reduced-motion: reduce) { .sc-text .sc-w, .sc-scrubber-fill { transition:none; } }
    `;
    document.head.appendChild(s);
  }

  const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function mount(host, opts) {
    injectStyles();
    opts = opts || {};
    const modality = opts.modality === 'reading' ? 'reading' : 'audio';
    const FULL_TEXT = String(opts.text || '').replace(/\s+/g, ' ').trim();
    const continueLabel = opts.continueLabel || "I’m ready";
    const ttsOK = modality === 'audio' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let onContinueFired = false;

    /* ---- DOM ---- */
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'sc-wrap';
    const playerControls = modality === 'audio' ? `
        <div class="sc-controls">
          <button class="sc-play" type="button" aria-label="Play narration"><i class="fa-solid fa-play"></i></button>
          <canvas class="sc-wave" aria-hidden="true"></canvas>
          <span class="sc-time">0%</span>
          <button class="sc-replay" type="button" aria-label="Replay from the start" title="Replay"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
        <div class="sc-scrubber" role="progressbar" aria-label="Narration progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="sc-scrubber-fill"></div></div>` : '';
    wrap.innerHTML = `
      ${opts.eyebrow ? `<p class="sc-eyebrow"><i class="fa-solid ${modality === 'audio' ? 'fa-headphones' : 'fa-book-open'}"></i> ${escapeHtml(opts.eyebrow)}</p>` : ''}
      <div class="sc-card ${modality === 'audio' ? 'reading' : ''}">
        ${opts.title ? `<h2 class="sc-title">${escapeHtml(opts.title)}</h2>` : ''}
        <p class="sc-text">${escapeHtml(FULL_TEXT)}</p>
        ${playerControls}
      </div>
      <div class="sc-foot">
        <p class="sc-note"><i class="fa-solid fa-circle-info"></i> Your browser doesn’t support speech narration, so the words highlight on an estimated timeline.</p>
        <button class="sc-continue" type="button">${escapeHtml(continueLabel)} <i class="fa-solid fa-arrow-right"></i></button>
      </div>`;
    host.appendChild(wrap);

    const card       = wrap.querySelector('.sc-card');
    const textEl     = wrap.querySelector('.sc-text');
    const continueBtn = wrap.querySelector('.sc-continue');
    const note       = wrap.querySelector('.sc-note');

    function doContinue() {
      if (onContinueFired) return;
      onContinueFired = true;
      stopAll();
      if (typeof opts.onContinue === 'function') opts.onContinue();
    }
    continueBtn.addEventListener('click', doContinue);

    /* Reading modality: no narration — just the text + Continue. */
    if (modality !== 'audio') {
      continueBtn.classList.add('ready');
      return { stop: stopAll, continueEl: continueBtn };
    }

    /* ================= AUDIO modality (adapted from Audio Summary) ========= */
    const playBtn   = wrap.querySelector('.sc-play');
    const playIcon  = playBtn.querySelector('i');
    const replayBtn = wrap.querySelector('.sc-replay');
    const scrubFill = wrap.querySelector('.sc-scrubber-fill');
    const scrubber  = wrap.querySelector('.sc-scrubber');
    const timeLabel = wrap.querySelector('.sc-time');
    const canvas    = wrap.querySelector('.sc-wave');

    // Tokenize into words, wrap each in a span so it can highlight in place.
    const words = [];
    let m; const re = /\S+/g;
    while ((m = re.exec(FULL_TEXT)) !== null) words.push({ text: m[0], start: m.index, el: null });
    textEl.innerHTML = words.map((w, i) => `<span class="sc-w" data-i="${i}">${escapeHtml(w.text)}</span>`).join(' ');
    textEl.querySelectorAll('.sc-w').forEach((el, i) => { words[i].el = el; });

    let current = -1, scrubberStep = 0;
    function highlight(i) {
      if (i === current) return;
      i = Math.max(0, Math.min(words.length - 1, i));
      if (current >= 0 && words[current].el) { words[current].el.classList.remove('now'); words[current].el.classList.add('read'); }
      current = i;
      if (words[i].el) words[i].el.classList.add('now');
      for (let k = 0; k < i; k++) words[k].el && words[k].el.classList.add('read');
      const pct = Math.round(((i + 1) / words.length) * 100);
      scrubFill.style.width = pct + '%'; timeLabel.textContent = pct + '%';
      const step = Math.floor(pct / 10) * 10;
      if (step !== scrubberStep) { scrubberStep = step; scrubber.setAttribute('aria-valuenow', String(step)); }
      bumpEnergy();
    }
    function resetHighlight() {
      current = -1; words.forEach((w) => w.el && w.el.classList.remove('now', 'read'));
      scrubFill.style.width = '0%'; timeLabel.textContent = '0%'; scrubberStep = 0; scrubber.setAttribute('aria-valuenow', '0');
    }

    let state = 'idle', chosenVoice = null, boundarySeen = false, fallbackTimer = null, fallbackIdx = 0, keepAlive = null;

    function pickVoice() {
      const voices = speechSynthesis.getVoices() || [];
      if (!voices.length) return null;
      const prefer = ['Google US English', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Natural', 'en-US'];
      for (const name of prefer) { const v = voices.find((v) => v.name.includes(name) || v.lang === name || (v.lang && v.lang.startsWith('en-US'))); if (v) return v; }
      return voices.find((v) => v.lang && v.lang.startsWith('en')) || voices[0];
    }

    // Speak sentence-by-sentence (Chrome cuts utterances > ~15s and fires `end` early).
    const sentences = [];
    { const sre = /[^.!?]+[.!?]*\s*/g; let mm; while ((mm = sre.exec(FULL_TEXT)) !== null) { if (mm[0].trim()) sentences.push({ text: mm[0], start: mm.index }); } if (!sentences.length) sentences.push({ text: FULL_TEXT, start: 0 }); }
    function wordIndexAtChar(ci) { let idx = 0; for (let k = 0; k < words.length; k++) { if (words[k].start <= ci) idx = k; else break; } return idx; }

    function startSpeech() {
      boundarySeen = false;
      speechSynthesis.cancel();
      chosenVoice = chosenVoice || pickVoice();
      let remaining = sentences.length;
      sentences.forEach((s) => {
        const u = new SpeechSynthesisUtterance(s.text);
        if (chosenVoice) u.voice = chosenVoice;
        u.rate = 0.96; u.pitch = 1.0;
        u.onboundary = (e) => { if (e.name && e.name !== 'word' && e.name !== 'sentence') return; boundarySeen = true; stopFallback(); highlight(wordIndexAtChar(s.start + e.charIndex)); };
        u.onend = () => { if (--remaining <= 0) finish(); };
        u.onerror = () => { if (--remaining <= 0) finish(); };
        speechSynthesis.speak(u);
      });
      setTimeout(() => { if (state === 'playing' && !boundarySeen) startFallback(0); }, 600);
      keepAlive = setInterval(() => { if (state === 'playing' && speechSynthesis.speaking) speechSynthesis.resume(); }, 9000);
    }
    const wordDuration = (w) => Math.max(180, w.text.length * 62);
    function startFallback(fromIdx) {
      if (!ttsOK) note.classList.add('show');
      stopFallback(); fallbackIdx = fromIdx;
      const tick = () => { if (state !== 'playing') return; highlight(fallbackIdx); if (fallbackIdx >= words.length - 1) { finish(); return; } const d = wordDuration(words[fallbackIdx]); fallbackIdx++; fallbackTimer = setTimeout(tick, d); };
      tick();
    }
    function stopFallback() { if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; } }

    function play() {
      if (state === 'done') { resetHighlight(); state = 'idle'; }
      if (state === 'paused') {
        state = 'playing';
        if (ttsOK && speechSynthesis.paused) speechSynthesis.resume();
        else if (!ttsOK || !boundarySeen) startFallback(Math.max(0, current));
        playingUI(); return;
      }
      state = 'playing'; resetHighlight(); card.classList.add('reading'); playingUI();
      if (ttsOK) startSpeech(); else startFallback(0);
    }
    function pause() { if (state !== 'playing') return; state = 'paused'; if (ttsOK) speechSynthesis.pause(); stopFallback(); clearInterval(keepAlive); pausedUI(); }
    function finish() {
      state = 'done'; stopFallback(); clearInterval(keepAlive);
      highlight(words.length - 1); words.forEach((w) => w.el && w.el.classList.add('read'));
      scrubFill.style.width = '100%'; timeLabel.textContent = '100%'; scrubber.setAttribute('aria-valuenow', '100');
      pausedUI(); continueBtn.classList.add('ready');
    }
    function playingUI() { playIcon.className = 'fa-solid fa-pause'; playBtn.setAttribute('aria-label', 'Pause narration'); if (reduceMotion) requestAnimationFrame(drawWave); }
    function pausedUI()  { playIcon.className = 'fa-solid fa-play';  playBtn.setAttribute('aria-label', 'Play narration');  if (reduceMotion) requestAnimationFrame(drawWave); }

    /* ---- waveform ---- */
    const ctx2 = canvas.getContext('2d');
    let phase = 0, energy = 0.16, energyTarget = 0.16, waveRAF = null, stopped = false;
    function bumpEnergy() { energyTarget = 0.95; }
    function sizeCanvas() { const r = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); ctx2.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function drawWave() {
      if (stopped) return;
      const r = canvas.getBoundingClientRect(), w = r.width, h = r.height, mid = h / 2;
      ctx2.clearRect(0, 0, w, h);
      const speaking = state === 'playing';
      if (reduceMotion) { energy = 0.16; } else { energyTarget += (0.16 - energyTarget) * 0.04; if (!speaking) energyTarget = 0.05; energy += (energyTarget - energy) * 0.15; phase += speaking ? 0.30 : 0.03; }
      const barW = 2, gap = 2.5, pitch = barW + gap, count = Math.max(1, Math.floor((w + gap) / pitch));
      ctx2.fillStyle = speaking ? 'rgba(176,123,255,0.95)' : 'rgba(232,236,244,0.30)';
      for (let i = 0; i < count; i++) {
        const seed = i * 12.9898;
        const n = Math.sin(phase + seed) * 0.5 + Math.sin(phase * 0.47 + seed * 1.7) * 0.5;
        const amp = (0.10 + 0.90 * Math.abs(n)) * energy, bh = Math.max(2, amp * (h - 2));
        roundRect(i * pitch, mid - bh / 2, barW, bh, barW / 2); ctx2.fill();
      }
      if (!reduceMotion) waveRAF = requestAnimationFrame(drawWave);
    }
    function roundRect(x, y, w, h, r) { ctx2.beginPath(); ctx2.moveTo(x + r, y); ctx2.arcTo(x + w, y, x + w, y + h, r); ctx2.arcTo(x + w, y + h, x, y + h, r); ctx2.arcTo(x, y + h, x, y, r); ctx2.arcTo(x, y, x + w, y, r); ctx2.closePath(); }

    /* ---- wire ---- */
    playBtn.addEventListener('click', () => { if (state === 'playing') pause(); else play(); });
    replayBtn.addEventListener('click', () => { if (ttsOK) speechSynthesis.cancel(); stopFallback(); clearInterval(keepAlive); state = 'idle'; play(); });
    if (ttsOK) { chosenVoice = pickVoice(); speechSynthesis.onvoiceschanged = () => { chosenVoice = pickVoice(); }; }
    else { note.classList.add('show'); }
    const onResize = () => { sizeCanvas(); if (reduceMotion) requestAnimationFrame(drawWave); };
    window.addEventListener('resize', onResize);
    sizeCanvas(); requestAnimationFrame(drawWave);

    // Best-effort autoplay (this mount follows the learner's "Enter" click, so
    // the gesture usually lets audio start). If nothing begins, quietly idle.
    if (opts.autoplay !== false && ttsOK) {
      play();
      setTimeout(() => {
        if (state === 'playing' && !boundarySeen && !speechSynthesis.speaking) {
          speechSynthesis.cancel(); stopFallback(); clearInterval(keepAlive);
          state = 'idle'; resetHighlight(); card.classList.remove('reading'); pausedUI();
        }
      }, 450);
    }

    function stopAll() {
      stopped = true;
      if (waveRAF) cancelAnimationFrame(waveRAF);
      if (ttsOK) speechSynthesis.cancel();
      stopFallback(); clearInterval(keepAlive);
      window.removeEventListener('resize', onResize);
    }
    return { stop: stopAll, continueEl: continueBtn };
  }

  window.SceneContext = { mount };
})();
