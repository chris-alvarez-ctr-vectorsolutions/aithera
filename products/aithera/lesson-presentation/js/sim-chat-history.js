/* =========================================================================
   SIM CHAT HISTORY — "Full conversation" for the coach sheet, built once
   =========================================================================

   The coach sheet deliberately shows only the LATEST exchange (the trailing
   coaching run) so the learner reads what's relevant right now — especially
   after switching modes. But sometimes they want to look back. This module
   adds, to every simulator page:

     • a pill in the coach-panel head — "Full conversation" — that appears
       only when there IS more than the sheet is showing (earlier exchanges,
       scene lines, or content that overflows the sheet);
     • tapping it expands the sheet to nearly the full height of the screen
       (from just below the top bar to the input bar) and overlays the
       COMPLETE transcript — coaching exchanges plus the scene context that
       normally lives on the stage — in chronological order;
     • "Latest only" (same pill), Escape, or the sheet lowering collapses it
       back to the focused view. Nothing about the underlying sheet changes —
       the overlay sits above the live body, which keeps rendering as usual.

   The transcript renders with the SAME chat classes the pages already use
   (.coach-msg / .you-coach), so it inherits each page's theme; scene-world
   lines get one canonical "context" treatment defined here.

   Usage (one call per page, after the DOM refs exist):

     const CHAT_HISTORY = SimChatHistory.attach({
       panel: coachPanel,                  // <aside class="coach-panel">
       body: coachPanelBody,               // its .coach-panel-body
       messages: () => state.messages,     // the FULL transcript accessor
       characterName: (m) => m.name || SCENARIO.character,   // optional
       announce,                           // optional screen-reader hook
     });

   Load order: standalone (no other sim module required).
   ========================================================================= */
(function () {
  'use strict';

  /* ---- one canonical stylesheet --------------------------------------- */
  const CSS = `
  /* the head pill (matches .coach-panel-resume's quiet ghost look) */
  .sim-history-btn {
    display: inline-flex; align-items: center; gap: 7px;
    height: 32px; padding: 0 13px;
    border: 1px solid var(--c-line); border-radius: 999px;
    background: var(--c-surface); color: var(--c-ink-soft);
    font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
    transition: border-color .15s var(--ease), color .15s var(--ease);
  }
  .sim-history-btn:hover { border-color: var(--c-accent); color: var(--c-ink); }
  .sim-history-btn i { font-size: 11px; }
  .sim-history-btn[hidden] { display: none; }
  /* the sheet, expanded — geometry (height) is set inline by JS so it works
     with every page's input-bar sync; this class carries the look */
  .coach-panel.sim-history-open { max-height: none; }
  /* the transcript view — a flex sibling of the live body (below the head),
     so the head row and its controls always stay visible */
  .sim-history-view {
    flex: 1 1 auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px 16px 20px;
    display: none;
  }
  .coach-panel.sim-history-open .sim-history-view { display: block; }
  .coach-panel.sim-history-open .coach-panel-body { display: none; }
  .sim-history-view .sim-history-lede {
    margin: 0 0 14px; font-size: 12px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint);
    display: flex; align-items: center; gap: 8px;
  }
  .sim-history-view .sim-history-lede::after {
    content: ''; flex: 1 1 auto; height: 1px; background: var(--c-line);
  }
  .sim-history-view > .coach-msg,
  .sim-history-view > .you-coach { margin-bottom: 12px; }
  /* scene-world context — one canonical treatment on every page */
  .sim-history-scene {
    margin: 2px 0 12px; padding: 8px 12px 8px 14px;
    border-left: 3px solid var(--c-line);
    font-size: 13.5px; line-height: 1.55; color: var(--c-ink-soft);
  }
  .sim-history-scene .who {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: .06em; text-transform: uppercase;
    color: var(--c-ink-faint); margin-bottom: 3px;
  }
  .sim-history-scene.is-narration { font-style: italic; }
  `;
  function injectStyles() {
    if (document.getElementById('sim-chat-history-style')) return;
    const s = document.createElement('style');
    s.id = 'sim-chat-history-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const esc = (s) => String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ---- generic transcript nodes ---------------------------------------
     Coaching lines reuse the page's own chat classes (theme-consistent);
     scene-world lines get the module's canonical context treatment. */
  function coachNode(m, labels) {
    return el('div', 'coach-msg', `
      <div class="coach-avatar"><i class="fa-solid fa-chalkboard-user"></i></div>
      <div class="coach-body"><div class="coach-label">${esc(labels.coach)}</div>
      <div class="coach-bubble">${esc(m.text)}</div></div>`);
  }
  function youNode(m, labels) {
    return el('div', 'you-coach', `
      <div class="cap">${esc(labels.you)}</div>
      <div class="bubble">${esc(m.text)}</div>`);
  }
  function sceneNode(m, who) {
    const narration = m.kind === 'narration';
    return el('div', 'sim-history-scene' + (narration ? ' is-narration' : ''), `
      <span class="who">${esc(who)}${narration ? ' · scene' : ''}</span>${narration ? esc(m.text) : '“' + esc(m.text) + '”'}`);
  }

  function attach(cfg) {
    injectStyles();
    const panel = cfg.panel;
    const body = cfg.body;
    const head = cfg.head || panel.querySelector('.coach-panel-head');
    const labels = Object.assign({
      coach: 'AI Coach', you: 'You',
      open: 'Full conversation', close: 'Latest only',
    }, cfg.labels || {});
    const charName = (m) => {
      const c = cfg.characterName;
      const name = typeof c === 'function' ? c(m) : (m.name || c);
      return name || 'In the scene';
    };
    const announce = cfg.announce || (() => {});
    let open = false;

    /* the head pill */
    const btn = el('button', 'sim-history-btn',
      `<i class="fa-solid fa-chevron-up"></i><span>${esc(labels.open)}</span>`);
    btn.type = 'button';
    btn.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    // sits in the head's right cluster, before the resume/back control
    const resume = head && head.querySelector('.coach-panel-resume');
    if (head) head.insertBefore(btn, resume || null);
    else panel.appendChild(btn);

    /* the transcript view — inserted right after the head so it takes the
       live body's place in the panel's column flex while open */
    const view = el('div', 'sim-history-view');
    view.setAttribute('role', 'log');
    view.setAttribute('aria-label', 'Full conversation so far');
    if (head && head.parentElement === panel) panel.insertBefore(view, head.nextSibling);
    else panel.insertBefore(view, panel.firstChild);

    function renderView() {
      const msgs = (cfg.messages && cfg.messages()) || [];
      view.innerHTML = '';
      view.appendChild(el('p', 'sim-history-lede', 'The conversation so far'));
      for (const m of msgs) {
        if (!m || typeof m.text !== 'string' || !m.text.trim()) continue;
        if (m.speaker === 'coach') view.appendChild(coachNode(m, labels));
        else if (m.speaker === 'you' && m.kind === 'coaching') view.appendChild(youNode(m, labels));
        else if (m.speaker === 'you') view.appendChild(sceneNode(m, labels.you + ' · in the scene'));
        else view.appendChild(sceneNode(m, charName(m)));
      }
      // The coach's "typing" dots live in .coach-panel-body, which is hidden
      // while this view is open — so mirror any live indicator into the view
      // (theme-consistent: it reuses the page's own .typing markup). The body
      // MutationObserver re-renders on every add/remove, keeping this in sync.
      const liveTyping = body && body.querySelector('.typing');
      if (liveTyping) {
        const dots = liveTyping.cloneNode(true);
        dots.removeAttribute('id');   // never duplicate #typingNode
        view.appendChild(dots);
      }
    }

    function setBtn() {
      btn.innerHTML = open
        ? `<i class="fa-solid fa-chevron-down" aria-hidden="true"></i><span>${esc(labels.close)}</span>`
        : `<i class="fa-solid fa-chevron-up" aria-hidden="true"></i><span>${esc(labels.open)}</span>`;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open
        ? 'Show only the latest exchange'
        : 'Show the full conversation so far');
    }

    /* geometry: from just below the top chrome to the input bar (the panel's
       own bottom offset, which every page keeps synced). The top edge must
       clear EVERY bar stacked above the panel — not just the top bar, but the
       Learn/Observe mode bar, which paints above the panel (higher z-index).
       Miss it and the newest lines slide up behind that bar. */
    function topBoundary() {
      if (cfg.topOffset != null) {
        return typeof cfg.topOffset === 'function' ? cfg.topOffset() : cfg.topOffset;
      }
      // the bottom-most edge of any visible top chrome (top bar + mode bar)
      let bottom = 0;
      for (const sel of ['.topbar', '.mode-indicator']) {
        const n = document.querySelector(sel);
        if (!n || n.offsetParent === null) continue;   // absent or collapsed/hidden
        const b = n.getBoundingClientRect().bottom;
        if (b > bottom) bottom = b;
      }
      return (bottom || 56) + 8;   // small breathing gap below the chrome
    }
    function applyGeometry() {
      if (!open) return;
      const panelBottom = parseFloat(getComputedStyle(panel).bottom) || 0;
      const vh = (window.visualViewport && window.visualViewport.height)
        || window.innerHeight || document.documentElement.clientHeight || 0;
      const h = Math.max(220, vh - topBoundary() - panelBottom);
      panel.style.maxHeight = h + 'px';
      panel.style.minHeight = h + 'px';
    }

    function openView() {
      if (open) return;
      open = true;
      renderView();
      panel.classList.add('sim-history-open');
      applyGeometry();
      setBtn();
      view.scrollTop = view.scrollHeight;   // land on the latest, scroll UP for history
      announce('Showing the full conversation. Scroll up for earlier exchanges.');
    }
    function closeView() {
      if (!open) return;
      open = false;
      panel.classList.remove('sim-history-open');
      panel.style.maxHeight = '';
      panel.style.minHeight = '';
      setBtn();
      refreshVisibility();
      announce('Back to the latest exchange.');
    }
    function toggle() { open ? closeView() : openView(); }
    btn.addEventListener('click', toggle);

    /* the pill only appears when it would DO something: the transcript holds
       more than the live sheet is showing (earlier exchanges, scene lines, a
       cleared sheet), or the sheet's visible content already overflows */
    function refreshVisibility() {
      const msgs = (cfg.messages && cfg.messages()) || [];
      const shown = body ? body.querySelectorAll('.coach-msg, .you-coach').length : 0;
      const hasMore = msgs.length > shown;
      const overflows = body && body.scrollHeight > body.clientHeight + 8;
      btn.hidden = !open && !(hasMore || overflows);
    }

    /* live updates: new messages while open re-render the transcript; any
       body change re-evaluates whether the pill should show */
    const mo = new MutationObserver(() => {
      refreshVisibility();
      if (open) {
        const pinned = view.scrollHeight - view.scrollTop - view.clientHeight < 40;
        renderView();
        applyGeometry();
        if (pinned) view.scrollTop = view.scrollHeight;
      }
    });
    if (body) mo.observe(body, { childList: true, subtree: true });

    /* the sheet lowering (mode switch, restart) collapses the view */
    const ao = new MutationObserver(() => {
      if (panel.getAttribute('aria-hidden') === 'true' && open) closeView();
    });
    ao.observe(panel, { attributes: true, attributeFilter: ['aria-hidden'] });

    /* Escape collapses (capture, so page-level Escape handlers don't race) */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        e.stopPropagation();
        closeView();
        btn.focus();
      }
    }, true);

    window.addEventListener('resize', applyGeometry);

    return { open: openView, close: closeView, toggle, isOpen: () => open, refresh: refreshVisibility };
  }

  window.SimChatHistory = { attach };
})();
