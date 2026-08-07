// ux-mockups feedback widget
// Embed: <script src="/designtoolbox/feedback-widget.js"></script>

(() => {
  // ----- Config ---------------------------------------------------------------
  const CW_WORKER_URL = 'https://ux-mockups-feedback.vectorsolutions-ux.workers.dev';
  const WIDGET_VERSION = '1.26.0';
  const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  if (window.__cwWidgetLoaded) return;
  window.__cwWidgetLoaded = WIDGET_VERSION;

  // Reply threads are hidden for now to keep the panel focused on the feedback
  // itself (flip to true — or set window.TOOLBOX.replies — to bring them back).
  const REPLIES_ENABLED = (window.TOOLBOX && window.TOOLBOX.replies === true) || false;

  // ----- State ----------------------------------------------------------------
  const state = {
    pins: [],
    stranded: [],
    // Comments whose anchored element exists in the DOM but isn't currently
    // shown (it lives on a hidden screen/view of a single-file mock). These are
    // pulled OFF the canvas — otherwise a display:none element reports a 0×0 box
    // and the pin would pile up at the top-left of the landing screen — and
    // listed in the "On other screens" drawer instead.
    offscreen: [],
    author: localStorage.getItem('cw-author') || '',
    isAdmin: localStorage.getItem('cw-admin') === '1',
    settings: { visitorMode: false, commentsDisabled: false },
    // Local, per-viewer "show comments" state, separate from the admin
    // `commentsDisabled` setting. Comments ALWAYS start hidden on every page load
    // so a mock reads clean; revealing is session-only (in-memory) — this state
    // re-inits to hidden on the next refresh. Deliberately NOT persisted, so a
    // reveal on one page/mock never leaks to another or survives a reload.
    commentsHidden: true,
    pickMode: false,
    hoverEl: null,
    openPanelPinId: null,
    activeToast: null,
  };

  // Comments are keyed by a canonical page URL, NOT the raw location.href, so
  // the same mock shows the same comments whether it's viewed on GitHub Pages,
  // a local Live Server (localhost), or a file:// path. We rebuild the canonical
  // GitHub Pages URL from the `/products/...` portion of the path and treat
  // `/index.html` as the directory form so `…/folder/` and
  // `…/folder/index.html` collapse together.
  // Because GitHub Pages comments are already stored under this canonical URL,
  // existing comments keep working — this only makes other environments match.
  const PAGES_BASE = 'https://vectorlearning.github.io/ux-mockups';
  function canonicalPageUrl() {
    const m = location.pathname.match(/\/products\/.+$/i);
    if (!m) return location.href.split('#')[0].split('?')[0]; // not a /products/ mock → best effort
    const sub = m[0].replace(/\/index\.html?$/i, '/');         // drop the default document
    return PAGES_BASE + sub;
  }
  const pageUrl = canonicalPageUrl();

  // Is this the published GitHub Pages site, or somewhere else (the preview /
  // staging server, localhost, file://)? On Pages the feedback bubble shows
  // normally; everywhere else the widget stays dormant by default — an
  // invisible, click-to-reveal bubble and hidden pins — so the comment UI
  // doesn't clutter in-progress preview environments. (Comparing origins reuses
  // the same canonical host the rest of the widget points at.)
  // ?cwtest=1 makes a local/preview page behave like Pages (pins visible without
  // entering comment mode) so the widget can be exercised by automated tests and
  // local harnesses that stub the backend. Harmless elsewhere: off-Pages the
  // Worker's CORS still blocks real requests.
  const IS_GITHUB_PAGES = location.origin === new URL(PAGES_BASE).origin || /[?&]cwtest=1/.test(location.search);

  // Dormant = invisible (ghost) bubble + pins hidden until someone clicks to
  // reveal. True when an admin has disabled comments, OR when we're not on the
  // published Pages site (preview server, etc.).
  function isDormant() { return state.settings.commentsDisabled || !IS_GITHUB_PAGES; }

  // Always point at the published viewer on GitHub Pages, regardless of where
  // the mock itself is being viewed (staging server, localhost, file://). The
  // viewer only works there anyway — it's the one origin the Worker's CORS
  // allows and the only place log.html is published.
  const LOG_URL = PAGES_BASE + '/designtoolbox/log.html';
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  const CMD_KEY = IS_MAC ? '⌘' : 'Ctrl';

  // ----- Styles ---------------------------------------------------------------
  // A "warm sticky-note" design system, modernized: springy entrance/hover
  // motion, soft layered shadows, gentle gradients and glassy bars. All class
  // names and DOM structure are unchanged from earlier versions — this is a
  // pure visual refresh, so none of the widget JS depends on it.
  const css = `
.cw-root, .cw-root * { box-sizing: border-box; }
.cw-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #1f2937; }
/* Custom props MUST live on :root, not .cw-root. The floating surfaces (popup,
   detail panel, admin panel, toast) are appended to document.body — OUTSIDE
   .cw-root — so vars scoped to .cw-root would not resolve there, and a
   background like var(--cw-paper) with no value collapses to transparent
   (which made the panels see-through). :root cascades to every surface. */
:root {
  --cw-ease: cubic-bezier(.34, 1.56, .64, 1);            /* springy overshoot for playful motion */
  --cw-paper: #fffdf6;
  --cw-paper-edge: #fde9b0;
  --cw-ink: #78350f;
  --cw-accent: #f59e0b;
  --cw-accent-deep: #d97706;
}
.cw-hidden { display: none !important; }

/* Pop-in animates by slide + scale only — NO opacity fade — so the surface is
   fully opaque on every frame. (A fade made popups/panels see-through mid-open,
   letting the page bleed through.) */
@keyframes cw-pop-in { 0% { transform: translateY(8px) scale(.96); } 100% { transform: translateY(0) scale(1); } }
@keyframes cw-toast-in { 0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(.96); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
@keyframes cw-bubble-in { 0% { opacity: 0; transform: scale(.4) rotate(-30deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
@keyframes cw-pin-drop { 0% { opacity: 0; transform: translate(-50%, -130%) scale(.5); } 100% { opacity: 1; transform: translate(-50%, -100%) scale(1); } }
@keyframes cw-pulse-ring { 0% { box-shadow: 0 8px 20px rgba(17,24,39,.28), 0 0 0 0 rgba(245,158,11,.45); } 70% { box-shadow: 0 8px 20px rgba(17,24,39,.28), 0 0 0 12px rgba(245,158,11,0); } 100% { box-shadow: 0 8px 20px rgba(17,24,39,.28), 0 0 0 0 rgba(245,158,11,0); } }

/* Pins layer */
.cw-pins { position: absolute; inset: 0; pointer-events: none; z-index: 2147483600; }
.cw-pin { position: absolute; transform: translate(-50%, -100%); width: 30px; height: 30px; border-radius: 50% 50% 50% 2px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,.28), inset 0 1px 1px rgba(255,255,255,.35); cursor: pointer; pointer-events: auto; border: 2.5px solid #fff; transition: transform .2s var(--cw-ease), box-shadow .2s ease, opacity .3s; }
/* Only first-appearance dots drop in. renderPins() recreates every dot on each
   render (incl. resize), so animating the base .cw-pin would flicker them; this
   class is added once per pin id (see makePinDot). */
.cw-pin--enter { animation: cw-pin-drop .35s var(--cw-ease); }
.cw-pin span { transform: rotate(0); display: inline-block; text-shadow: 0 1px 1px rgba(0,0,0,.25); }
.cw-pin:hover { transform: translate(-50%, -100%) scale(1.18) rotate(-4deg); box-shadow: 0 8px 18px rgba(0,0,0,.35), inset 0 1px 1px rgba(255,255,255,.35); z-index: 1; }
.cw-pin--done { background: #9ca3af !important; opacity: .7; }
.cw-pin--dragging { cursor: grabbing; opacity: .75; transform: translate(-50%, -100%) scale(1.14) rotate(-6deg); transition: none; animation: none; box-shadow: 0 12px 24px rgba(0,0,0,.4); }
.cw-pin--done::after { content: "✓"; position: absolute; right: -5px; top: -5px; background: #10b981; color: #fff; width: 16px; height: 16px; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); }

/* Bubble (top-right activation) */
.cw-bubble { position: fixed; top: 20px; right: 20px; z-index: 2147483640; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(140deg, #1f2937, #111827); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 21px; cursor: pointer; box-shadow: 0 8px 20px rgba(17,24,39,.28); border: 0; padding: 0; opacity: 1; transition: transform .25s var(--cw-ease), background .2s, opacity .25s, box-shadow .2s; animation: cw-bubble-in .4s var(--cw-ease); }
.cw-bubble:hover { transform: scale(1.12) rotate(-8deg); box-shadow: 0 12px 26px rgba(17,24,39,.36); }
.cw-bubble:active { transform: scale(1.02); }
.cw-bubble .cw-bubble-icon { transition: transform .25s var(--cw-ease); display: inline-block; }
.cw-bubble .cw-bubble-icon .cw-fa { width: 20px; height: 20px; display: inline-flex; }
.cw-bubble--docked .cw-bubble-icon .cw-fa { width: 16px; height: 16px; }
.cw-bubble:hover .cw-bubble-icon { transform: scale(1.12); }
.cw-bubble--active { background: linear-gradient(140deg, #ef4444, #dc2626); font-size: 18px; animation: cw-pulse-ring 1.8s ease-out infinite; }
.cw-bubble--active:hover { transform: scale(1.12) rotate(8deg); }
/* Comments-off: the bubble fades fully out so it doesn't clutter the page, but it stays in the DOM and clickable for everyone (admins and visitors). Clicking it opens comment mode and reveals the pins; the bubble becomes visible again while comment mode is active, so it can be exited. No hotkey needed. */
.cw-bubble--ghost { opacity: 0; }
.cw-bubble--ghost:hover { transform: none; }
.cw-bubble--ghost.cw-bubble--active { opacity: 1; }
.cw-bubble-tip { position: absolute; top: 58px; right: 0; background: #111827; color: #fff; padding: 7px 11px; border-radius: 8px; font-size: 12px; font-weight: 500; white-space: nowrap; opacity: 0; transform: translateY(-4px); pointer-events: none; transition: opacity .18s, transform .18s; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
.cw-bubble:hover .cw-bubble-tip { opacity: 1; transform: translateY(0); }
/* Label is only shown in the docked (pill) layout, hidden for the floating circular bubble. */
.cw-bubble-label { display: none; font: 700 13px/1 "Open Sans", system-ui, sans-serif; }
/* Docked: the bubble lives inside the shared Toolbox dock pill (bottom-center) as an inline pill button next to the Flow Map button, instead of a floating circle. */
/* Docked in the toolbox pill: a compact ICON-ONLY round button (no "Comments"
   word) so it reads as a quiet tool next to the flow-map + version buttons. */
.cw-bubble--docked { position: static; top: auto; right: auto; width: 38px; height: 38px; border-radius: 50%; padding: 0; gap: 0; justify-content: center; font-size: 15px; background: #4a2bd1; box-shadow: none; animation: none; transition: background .12s, transform .12s; }
.cw-bubble--docked:hover { transform: translateY(-1px); background: #5a3ce0; box-shadow: none; }
.cw-bubble--docked .cw-bubble-icon { font-size: 15px; }
.cw-bubble--docked .cw-bubble-label { display: none; }
.cw-bubble--docked .cw-bubble-tip { display: none; }
.cw-bubble--docked.cw-bubble--active { background: linear-gradient(140deg, #ef4444, #dc2626); animation: none; }
.cw-bubble--docked.cw-bubble--active:hover { transform: translateY(-1px); }
/* Ghost (comments-off) while docked: dim in place rather than fade out, so the pill keeps its shape. */
.cw-bubble--docked.cw-bubble--ghost { opacity: .55; }
.cw-bubble--docked.cw-bubble--ghost.cw-bubble--active { opacity: 1; }
.cw-banner { position: fixed; top: 28px; right: 80px; z-index: 2147483640; background: linear-gradient(140deg, #1f2937, #111827); color: #fff; padding: 8px 8px 8px 16px; border-radius: 999px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 22px rgba(17,24,39,.3); border: 1px solid rgba(255,255,255,.08); }
.cw-banner button { background: rgba(255,255,255,.14); color: #fff; border: 0; cursor: pointer; font: inherit; padding: 5px 12px; border-radius: 999px; transition: background .15s, transform .1s; }
.cw-banner button:hover { background: rgba(255,255,255,.26); }
.cw-banner button:active { transform: scale(.95); }
/* Inline admin controls in the pick-mode banner (replaces the gear→settings
   popover): a Hide-comments toggle button and a View-log link, right beside the
   "Click any element to leave feedback" prompt. */
.cw-banner-text { white-space: nowrap; }
.cw-banner-sep { width: 1px; align-self: stretch; margin: 3px 0; background: rgba(255,255,255,.2); flex: none; }
.cw-banner-hide { white-space: nowrap; }
.cw-banner-hide.cw-banner-on { background: rgba(255,255,255,.32); }
.cw-banner-link { color: #fff; font-size: 13px; font-weight: 600; text-decoration: underline; white-space: nowrap; }
.cw-banner-link:hover { opacity: .85; }
.cw-banner-link { display: inline-flex; align-items: center; gap: 4px; }
.cw-banner-link .cw-fa { width: 11px; height: 11px; }
.cw-banner-esc { padding: 5px 12px; }
/* Docked: float just above the bottom-center toolbox dock instead of top-right, so the pick-mode hint reads as part of the flow switcher. */
.cw-banner--docked { top: auto; right: auto; bottom: 86px; left: 50%; transform: translateX(-50%); }

/* Pick mode */
.cw-picking, .cw-picking * { cursor: crosshair !important; }
.cw-picking .cw-pin, .cw-picking .cw-pin * { cursor: grab !important; }
.cw-picking .cw-pin--dragging, .cw-picking .cw-pin--dragging * { cursor: grabbing !important; }
/* The crosshair is for picking PAGE elements — the widget's own chrome (bubble,
   banner, panel, nav hub) and the toolbox dock are not pickable, so revert them
   to normal cursors: default over surfaces, pointer over their buttons/links. */
.cw-picking .cw-root, .cw-picking .cw-root *, .cw-picking .cw-bubble, .cw-picking .cw-bubble *, .cw-picking .cw-banner, .cw-picking .cw-banner *, .cw-picking .cw-nav, .cw-picking .cw-nav *, .cw-picking .cw-panel, .cw-picking .cw-panel *, .cw-picking .tbx-dock, .cw-picking .tbx-dock *, .cw-picking .tbx-handle, .cw-picking .tbx-handle * { cursor: default !important; }
.cw-picking .cw-bubble, .cw-picking .cw-banner button, .cw-picking .cw-banner a, .cw-picking .cw-nav button, .cw-picking .cw-panel button, .cw-picking .cw-panel a, .cw-picking .cw-root button, .cw-picking .cw-root a, .cw-picking .tbx-dock button, .cw-picking .tbx-handle { cursor: pointer !important; }
.cw-picking .tbx-drag-btn, .cw-picking .cw-nav-grip { cursor: grab !important; }
.cw-hover-outline { position: fixed; border: 2.5px dashed var(--cw-accent); background: rgba(245,158,11,.1); pointer-events: none; z-index: 2147483630; transition: all .08s var(--cw-ease); border-radius: 6px; box-shadow: 0 0 0 4px rgba(245,158,11,.08); }

/* Popup (new pin) — sticky-note overlay */
.cw-popup { position: absolute; z-index: 2147483645; width: 320px; background: var(--cw-paper, #fffdf6); border: 1px solid var(--cw-paper-edge, #fde9b0); border-radius: 16px; box-shadow: 0 18px 40px rgba(146,94,12,.2), 0 4px 10px rgba(0,0,0,.08); padding: 16px 18px; }
.cw-popup h4 { margin: 0 0 12px; font-size: 15px; font-weight: 700; color: var(--cw-ink); letter-spacing: .01em; display: flex; align-items: center; gap: 6px; }
.cw-popup h4::before { content: "✦"; color: var(--cw-accent); font-size: 13px; }
.cw-popup label { display: block; font-size: 12px; font-weight: 600; color: var(--cw-ink); margin-bottom: 4px; }
.cw-popup input, .cw-popup textarea { width: 100%; border: 1px solid #fcd34d; background: #fffaeb; border-radius: 10px; padding: 8px 10px; font: inherit; resize: vertical; color: #1f2937; transition: border-color .15s, box-shadow .15s; }
.cw-popup input:focus, .cw-popup textarea:focus { outline: none; border-color: var(--cw-accent); box-shadow: 0 0 0 3px rgba(245,158,11,.2); }
.cw-popup textarea { min-height: 72px; }
.cw-popup .cw-row { margin-bottom: 12px; }
.cw-popup .cw-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Author row (compact vs edit) */
.cw-author-compact { font-size: 12px; color: #6b7280; }
.cw-author-compact strong { color: #111827; }
.cw-author-change { background: transparent; border: 0; color: var(--cw-accent-deep); cursor: pointer; padding: 0 0 0 4px; font: inherit; text-decoration: underline; }
.cw-author-change:hover { color: var(--cw-ink); }

/* Buttons */
.cw-btn { font: inherit; font-weight: 600; cursor: pointer; padding: 7px 14px; border-radius: 10px; border: 1px solid transparent; transition: background .15s, transform .12s var(--cw-ease), box-shadow .15s; }
.cw-btn:hover { transform: translateY(-1px); }
.cw-btn:active { transform: translateY(0) scale(.97); }
.cw-btn--primary { background: linear-gradient(140deg, #fbbf24, var(--cw-accent)); color: #fff; border-color: var(--cw-accent-deep); box-shadow: 0 3px 8px rgba(217,119,6,.35); }
.cw-btn--primary:hover { background: linear-gradient(140deg, var(--cw-accent), var(--cw-accent-deep)); box-shadow: 0 5px 14px rgba(217,119,6,.4); }
.cw-btn--primary:disabled { background: #fcd34d; border-color: transparent; cursor: not-allowed; box-shadow: none; opacity: .7; transform: none; }
.cw-btn--secondary { background: #fffaeb; color: var(--cw-ink); border-color: #fcd34d; }
.cw-btn--secondary:hover { background: #fef3c7; box-shadow: 0 2px 6px rgba(146,94,12,.12); }
.cw-btn--danger { color: #b91c1c; }
.cw-btn--danger:hover { background: #fef2f2; border-color: #fecaca; }
.cw-btn--small { padding: 5px 10px; font-size: 12px; border-radius: 8px; }
.cw-kbd { margin-left: 8px; font-size: 11px; opacity: .85; font-weight: 600; letter-spacing: .02em; padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,.22); }
.cw-btn--secondary .cw-kbd { background: rgba(0,0,0,.06); }

/* Panel (pin detail) — sticky-note overlay */
.cw-panel { position: absolute; z-index: 2147483645; width: 360px; background: var(--cw-paper, #fffdf6); border: 1px solid var(--cw-paper-edge, #fde9b0); border-radius: 16px; box-shadow: 0 18px 40px rgba(146,94,12,.2), 0 4px 10px rgba(0,0,0,.08); padding: 16px 18px; }
.cw-panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.cw-panel-avatar { width: 30px; height: 30px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.2), inset 0 1px 1px rgba(255,255,255,.3); }
.cw-panel-meta { flex: 1; min-width: 0; }
.cw-panel-meta strong { display: block; font-size: 13px; }
.cw-panel-meta span { font-size: 11px; color: #6b7280; }
.cw-panel-actions { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; padding-bottom: 12px; border-bottom: 1px dashed #e3cf94; }
/* Visitor (minimal) panel: no author header, so leave room at top-right for the
   close button and keep the action row as the first thing the visitor sees. */
.cw-panel--mini .cw-panel-actions { margin-top: 2px; padding-right: 30px; }
.cw-panel-body { font-size: 13px; line-height: 1.55; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; }

/* Compact, low-emphasis management actions docked in the header row (Done / Edit
   / Delete) — deliberately quiet so the FEEDBACK is the panel's focus, and kept
   inline at the top so opening the panel never grows the page. */
.cw-head-actions { display: flex; align-items: center; gap: 4px; flex: none; }
/* Right-hand controls column in the panel header: the ✕ close sits on top and
   the Done / Edit / Delete actions tuck in directly underneath it, pushed all
   the way to the right so the author identity keeps the left of the row. */
.cw-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-left: auto; flex: none; }
.cw-act { background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer; color: #78716c; font: 600 12px/1 inherit; padding: 5px 7px; display: inline-flex; align-items: center; gap: 5px; transition: background .12s, color .12s, border-color .12s; }
.cw-act:hover { background: rgba(120,113,108,.12); color: #44403c; }
.cw-act:active { transform: scale(.96); }
.cw-act .cw-fa { width: 12px; height: 12px; }
.cw-act--icon { width: 28px; height: 28px; padding: 0; justify-content: center; }
/* Mark done keeps a visible border so it reads as the affirmative action, while
   Edit/Delete stay borderless icons — a gentle hierarchy that doesn't shout. */
.cw-act--done { color: #047857; border-color: #a7f3d0; font-size: 10px; padding: 4px 7px; }
.cw-act--done .cw-fa { width: 10px; height: 10px; }
.cw-act--done:hover { background: #ecfdf5; color: #065f46; border-color: #6ee7b7; }
.cw-act--done.cw-act--is-done { color: #92400e; border-color: #fcd34d; }
.cw-act--done.cw-act--is-done:hover { background: #fffbeb; color: #78350f; }
.cw-act--danger:hover { background: #fef2f2; color: #b91c1c; }
.cw-fa { display: inline-flex; align-items: center; justify-content: center; }
.cw-fa svg { width: 100%; height: 100%; display: block; }

/* Element screenshot, pulled to the TOP of the panel so a reviewer sees WHAT the
   comment is about before reading it. */
.cw-panel-shot { margin: 0 0 12px; cursor: zoom-in; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; background: #fff; transition: transform .15s var(--cw-ease), box-shadow .15s; }
.cw-panel-shot:hover { box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.cw-panel-shot img { display: block; max-width: 100%; max-height: 150px; margin: 0 auto; }

/* The FEEDBACK — the whole point of a comment, so it's the visual hero: a tiny
   accent label above a highlighted card in the warm accent tint, larger type. */
.cw-feedback-label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--cw-accent-deep); margin: 0 0 5px; }
/* Timestamp relocated onto the FEEDBACK label row (right side) so the header row
   can hold avatar + name + Done/Edit/Delete together. Reset the label's uppercase
   bold styling for this quieter meta text. */
.cw-feedback-time { font-weight: 500; letter-spacing: normal; text-transform: none; color: #6b7280; font-size: 11px; white-space: nowrap; }
.cw-feedback { font-size: 15.5px; line-height: 1.5; font-weight: 500; color: #1f2937; background: #fffef8; border: 1px solid var(--cw-paper-edge); border-left: 3px solid var(--cw-accent); border-radius: 10px; padding: 12px 14px; margin: 0 0 12px; white-space: pre-wrap; word-break: break-word; }
.cw-panel-claude { margin: 8px 0; padding: 10px; background: linear-gradient(140deg, #fafaf9, #f5f5f4); border: 1px solid #e7e5e4; border-radius: 10px; }
.cw-claude-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.cw-claude-label { font-size: 11px; font-weight: 700; color: #57534e; letter-spacing: .02em; }
.cw-claude-head button { flex: none; }
.cw-claude-text { display: block; max-height: 96px; overflow: auto; font: 500 11px/1.45 'SF Mono', Menlo, Consolas, monospace; color: #1f2937; white-space: pre-wrap; word-break: break-word; }
.cw-panel-thumb { margin: 8px 0; cursor: zoom-in; max-width: 100%; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; transition: transform .15s var(--cw-ease), box-shadow .15s; }
.cw-panel-thumb:hover { transform: scale(1.01); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.cw-panel-thumb img { display: block; max-width: 100%; max-height: 120px; }
.cw-panel-close { flex: none; background: transparent; border: 0; cursor: pointer; font-size: 18px; color: #92400e; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s var(--cw-ease); z-index: 1; }
.cw-panel-stranded { font-size: 12px; line-height: 1.45; color: #b45309; background: #fffbeb; border: 1px dashed #fcd34d; border-radius: 8px; padding: 6px 9px; margin: 4px 0 10px; }
.cw-panel-path { font-size: 12px; color: #475569; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 9px; margin: 4px 0 10px; }
.cw-panel-path > summary { cursor: pointer; font-weight: 600; color: #334155; list-style: none; user-select: none; }
.cw-panel-path > summary::-webkit-details-marker { display: none; }
.cw-panel-path[open] > summary { margin-bottom: 6px; }
.cw-path-steps { margin: 0; padding: 0 0 0 20px; display: flex; flex-direction: column; gap: 2px; }
.cw-path-steps li { line-height: 1.4; }
.cw-panel-close:hover { background: rgba(146,64,14,.1); transform: rotate(90deg); }

/* Drag grip — a title-bar handle at the top of a floating surface (panel/popup).
   Grab it to move the sticky note out of the way of the design. Sits above the
   content and clears the top-right close button. */
.cw-grip { display: flex; align-items: center; justify-content: center; height: 14px; margin: -8px -10px 8px; border-radius: 10px 10px 0 0; cursor: grab; color: #d8bd6c; user-select: none; touch-action: none; transition: background .15s, color .15s; }
.cw-grip::before { content: "\\2022\\2022\\2022\\2022\\2022\\2022"; letter-spacing: 2px; font-size: 9px; line-height: 1; transform: translateY(-1px); }
.cw-grip:hover { background: rgba(146,64,14,.06); color: #b8912f; }
.cw-floater--dragging { cursor: grabbing; box-shadow: 0 26px 60px rgba(146,94,12,.3), 0 8px 20px rgba(0,0,0,.16); transition: none; }
.cw-floater--dragging .cw-grip { cursor: grabbing; background: rgba(146,64,14,.06); }

/* Thread */
.cw-thread { border-top: 1px dashed var(--cw-paper-edge); padding-top: 10px; }
.cw-reply { margin-bottom: 8px; background: #fffaeb; border: 1px solid #f3e0a8; border-radius: 8px; padding: 6px 8px; }
.cw-reply-head { font-size: 11px; color: #92400e; margin-bottom: 2px; }
.cw-reply-head strong { color: #1f2937; margin-right: 6px; font-size: 12px; }
.cw-reply-text { font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.cw-reply-form { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.cw-reply-form input, .cw-reply-form textarea { width: 100%; border: 1px solid #fcd34d; background: #fffaeb; border-radius: 10px; padding: 8px 10px; font: inherit; color: #1f2937; transition: border-color .15s, box-shadow .15s; }
.cw-reply-form input:focus, .cw-reply-form textarea:focus { outline: none; border-color: var(--cw-accent); box-shadow: 0 0 0 3px rgba(245,158,11,.2); }
.cw-reply-form textarea { min-height: 50px; resize: vertical; }
.cw-reply-form .cw-actions { display: flex; justify-content: flex-end; }

/* Pulse a dot when the navigator jumps to it (cosmetic, client-side only). */
@keyframes cw-pin-pulse { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,.55); } 70% { box-shadow: 0 0 0 16px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
.cw-pin--pulse { animation: cw-pin-pulse 1s var(--cw-ease) 1; }

/* Toast */
.cw-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px); background: linear-gradient(140deg, #1f2937, #111827); color: #fff; padding: 12px 16px; border-radius: 999px; box-shadow: 0 10px 28px rgba(0,0,0,.3); display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 500; z-index: 2147483646; opacity: 0; border: 1px solid rgba(255,255,255,.08); transition: opacity .25s, transform .25s var(--cw-ease); }
.cw-toast--show { opacity: 1; transform: translateX(-50%) translateY(0); animation: cw-toast-in .35s var(--cw-ease); }
.cw-toast--success { background: linear-gradient(140deg, #059669, #047857); }
.cw-toast--error { background: linear-gradient(140deg, #dc2626, #b91c1c); }
.cw-toast--neutral { background: linear-gradient(140deg, #1f2937, #111827); }
.cw-toast button { background: rgba(255,255,255,.16); color: #fff; border: 0; cursor: pointer; font: inherit; font-weight: 600; padding: 5px 12px; border-radius: 999px; transition: background .15s, transform .1s; }
.cw-toast button:hover { background: rgba(255,255,255,.28); }
.cw-toast button:active { transform: scale(.95); }

/* Admin panel (⚙ button in the comment-mode banner) */
.cw-admin-panel { position: fixed; top: 78px; right: 20px; z-index: 2147483646; width: 300px; background: var(--cw-paper, #fffdf6); border: 1px solid var(--cw-paper-edge, #fde9b0); border-radius: 16px; box-shadow: 0 18px 40px rgba(146,94,12,.22), 0 4px 10px rgba(0,0,0,.08); padding: 16px 18px; }
.cw-admin-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; position: relative; padding-right: 24px; }
.cw-admin-title { font-weight: 700; font-size: 14px; color: var(--cw-ink); letter-spacing: .01em; }
.cw-admin-row { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px dashed var(--cw-paper-edge); }
.cw-admin-row:last-of-type { border-bottom: 0; }
.cw-admin-label { flex: 1; min-width: 0; }
.cw-admin-label strong { display: block; font-size: 13px; color: #1f2937; margin-bottom: 3px; }
.cw-admin-label span { display: block; font-size: 11px; color: #92400e; line-height: 1.4; }
.cw-admin-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 8px 14px; border-radius: 10px; background: #fffaeb; border: 1px solid #fcd34d; color: var(--cw-ink); font-size: 12px; font-weight: 600; text-decoration: none; transition: background .15s, transform .12s var(--cw-ease), box-shadow .15s; }
.cw-admin-link:hover { background: #fef3c7; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(146,94,12,.15); }
.cw-admin-footer { font-size: 10.5px; color: #92400e; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--cw-paper-edge); font-style: italic; }

/* Toggle switch */
.cw-toggle { position: relative; width: 40px; height: 23px; background: #d6d3d1; border-radius: 999px; cursor: pointer; transition: background .2s; flex-shrink: 0; margin-top: 4px; border: 0; padding: 0; }
.cw-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 19px; height: 19px; background: #fff; border-radius: 50%; transition: transform .25s var(--cw-ease); box-shadow: 0 1px 3px rgba(0,0,0,.3); }
.cw-toggle--on { background: linear-gradient(140deg, #fbbf24, var(--cw-accent)); }
.cw-toggle--on::after { transform: translateX(17px); }
.cw-toggle:focus { outline: 2px solid rgba(245,158,11,.5); outline-offset: 2px; }

/* Lightbox */
.cw-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.85); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 20px; cursor: zoom-out; animation: cw-pop-in .2s ease; }
.cw-lightbox img { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,.5); }

/* Comment navigator hub — ONE bottom-left control that accounts for every
   comment on the page: a total count, a Prev/Next stepper to walk through each
   one, and an expandable list grouped by where the comment lives (this screen /
   other screens / not found). Purely client-side over already-loaded pins — it
   adds no Cloudflare reads, writes, or lists. */
.cw-nav { position: fixed; left: 20px; bottom: 20px; z-index: 2147483635; display: flex; flex-direction: column; align-items: stretch; gap: 10px; width: 320px; max-width: 86vw; font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.cw-nav-bar { display: flex; align-items: center; gap: 2px; padding: 5px 7px; border-radius: 999px; background: linear-gradient(140deg, #1f2937, #111827); color: #fff; box-shadow: 0 8px 20px rgba(17,24,39,.28); }
.cw-nav.cw-nav--dragging { transition: none; user-select: none; }
.cw-nav-grip { background: transparent; border: 0; color: rgba(255,255,255,.55); cursor: grab; touch-action: none; font-size: 15px; line-height: 1; padding: 7px 4px 7px 6px; flex-shrink: 0; border-radius: 999px; transition: color .15s, background .15s; }
.cw-nav-grip:hover { color: #fff; background: rgba(255,255,255,.1); }
.cw-nav-grip:active { cursor: grabbing; }
/* Eye toggle — a circle-bordered button that shows/hides the comment pins for
   this viewer (hidden by default). Leads the hub bar; when hidden, the hub is
   just this eye. */
.cw-nav-eye { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.55); background: rgba(255,255,255,.08); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background .15s, border-color .15s, transform .1s; }
.cw-nav-eye:hover { background: rgba(255,255,255,.22); border-color: #fff; transform: translateY(-1px); }
.cw-nav-eye:active { transform: scale(.92); }
.cw-nav-eye .cw-fa { width: 15px; height: 15px; }
.cw-nav-eye--off { color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.4); }
.cw-nav--collapsed .cw-nav-bar { padding: 5px; }
.cw-nav-count { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; background: transparent; border: 0; color: #fff; font: 600 13px/1 inherit; cursor: pointer; padding: 7px 8px; border-radius: 999px; transition: background .15s; }
.cw-nav-count:hover { background: rgba(255,255,255,.1); }
.cw-nav-glyph { font-size: 14px; line-height: 1; flex-shrink: 0; }
.cw-nav-count-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw-nav-caret { font-size: 10px; opacity: .7; margin-left: auto; padding-left: 4px; }
.cw-nav-div { width: 1px; align-self: stretch; margin: 5px 3px; background: rgba(255,255,255,.16); flex-shrink: 0; }
.cw-nav-step { background: rgba(255,255,255,.12); color: #fff; border: 0; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; font-size: 19px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .1s; flex-shrink: 0; }
.cw-nav-step:hover { background: rgba(255,255,255,.26); }
.cw-nav-step:active { transform: scale(.92); }
.cw-nav-pos { min-width: 50px; text-align: center; font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.92); }
/* List popover sits ABOVE the bar (DOM order: list then bar, anchored at bottom). */
.cw-nav-list { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.16); padding: 10px; max-height: 56vh; overflow-y: auto; }
.cw-nav-group + .cw-nav-group { margin-top: 10px; }
.cw-nav-group-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; margin: 2px 4px 6px; }
.cw-nav-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px; border: 1px solid #eef0f2; border-radius: 11px; margin-bottom: 6px; cursor: pointer; transition: background .12s, border-color .12s, transform .12s var(--cw-ease); }
.cw-nav-item:last-child { margin-bottom: 0; }
.cw-nav-item:hover { background: #f9fafb; border-color: #e5e7eb; transform: translateY(-1px); }
.cw-nav-item--current { border-color: var(--cw-accent); box-shadow: 0 0 0 2px rgba(245,158,11,.18); }
.cw-nav-avatar { width: 26px; height: 26px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.2), inset 0 1px 1px rgba(255,255,255,.3); }
.cw-nav-item-body { flex: 1; min-width: 0; }
.cw-nav-item-meta { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
.cw-nav-item-meta strong { color: #111827; font-size: 12px; }
.cw-nav-item-text { font-size: 13px; color: #1f2937; line-height: 1.4; word-break: break-word; }
.cw-nav-item-ctx { font-size: 11px; color: #9ca3af; margin-top: 3px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw-nav-go { font-size: 12px; font-weight: 600; color: var(--cw-accent-deep); flex-shrink: 0; align-self: center; }

/* Bar shown while peeking at a revealed screen (top-center; toast owns the bottom). */
.cw-reveal-bar { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 2147483646; display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 999px; background: linear-gradient(140deg, #1f2937, #111827); color: #fff; font: 500 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-shadow: 0 10px 28px rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.08); }
.cw-reveal-bar button { background: rgba(255,255,255,.16); color: #fff; border: 0; cursor: pointer; font: inherit; font-weight: 600; padding: 6px 14px; border-radius: 999px; transition: background .15s, transform .1s; }
.cw-reveal-bar button:hover { background: rgba(255,255,255,.28); }
.cw-reveal-bar button:active { transform: scale(.95); }

@media (prefers-reduced-motion: reduce) {
  .cw-root *, .cw-bubble, .cw-pin, .cw-toast, .cw-popup, .cw-panel, .cw-admin-panel, .cw-banner, .cw-nav, .cw-nav * { animation: none !important; transition: none !important; }
}
`;

  // ----- DOM helpers ----------------------------------------------------------
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'style') e.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

  // Font Awesome 6 (Solid) glyphs, inlined as SVG. We render these as SVG rather
  // than <i class="fa-solid fa-…"> because the widget runs on EVERY mock — incl.
  // legacy ones that never load the Font Awesome stylesheet, where an <i> tag
  // would be an invisible zero-width glyph (the exact silent-failure the repo
  // guidelines warn about). Inline SVG always renders and inherits currentColor.
  const FA_SVG = {
    check: '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>',
    'rotate-left': '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3-163.8-62.5-226.3 0L125.7 160z"/></svg>',
    pen: '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505.1s15.4 8.5 23.9 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/></svg>',
    trash: '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>',
    eye: '<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4 142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-7.1 0-13.9-1.2-20.3-3.3-5.5-1.8-11.9 1.6-11.7 7.4.3 6.9 1.3 13.8 3.2 20.7 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1-5.8-.2-9.2 6.1-7.4 11.7 2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>',
    'eye-slash': '<svg viewBox="0 0 640 512" aria-hidden="true"><path fill="currentColor" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144 0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3-11.1-41.5-47.8-69.4-88.6-71.1-5.8-.2-9.2 6.1-7.4 11.7 2.1 6.4 3.3 13.2 3.3 20.3 0 .5 0 1.1 0 1.6l-91.1-71.2zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1-79.5 0-144-64.5-144-144 0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/></svg>',
    // Arrow-up-right (external / new-tab) — replaces the ↗ character on the log link.
    'arrow-up-right': '<svg viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M328 96c13.3 0 24 10.7 24 24l0 240c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-182.1L73 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l231-231L88 144c-13.3 0-24-10.7-24-24s10.7-24 24-24l240 0z"/></svg>',
  };
  function faIcon(name) {
    const s = document.createElement('span');
    s.className = 'cw-fa';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = FA_SVG[name] || '';
    return s;
  }

  // Topmost real page element at a viewport point, skipping the widget's own
  // layers (pins, outlines, banner, etc.) so we anchor to the design, not us.
  function topElementAt(clientX, clientY) {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const node of stack) {
      if (!isWidgetEl(node)) return node;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function rel(ts) {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d/60) + 'm ago';
    if (d < 86400) return Math.floor(d/3600) + 'h ago';
    return Math.floor(d/86400) + 'd ago';
  }

  function authorColor(name) {
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360}, 65%, 45%)`;
  }

  function initial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  function getProduct(url) {
    const m = url.match(/\/products\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Returns { row, getValue }. Shows "Posting as <name> · change" when a name
  // is already saved; clicking "change" reveals the editable input.
  function buildAuthorRow(onChange) {
    const row = el('div', { class: 'cw-row cw-author-row' });
    let current = state.author || '';

    function renderCompact() {
      row.innerHTML = '';
      row.appendChild(el('div', { class: 'cw-author-compact' }, [
        'Posting as ',
        el('strong', {}, [current]),
        el('button', { type: 'button', class: 'cw-author-change', onclick: renderEdit }, ['change']),
      ]));
    }
    function renderEdit() {
      row.innerHTML = '';
      const input = el('input', {
        type: 'text', value: current, placeholder: 'Your name',
        oninput: () => { current = input.value; if (onChange) onChange(); },
      });
      row.appendChild(el('label', {}, ['Your name']));
      row.appendChild(input);
      setTimeout(() => input.focus(), 0);
    }

    if (current) renderCompact(); else renderEdit();
    return { row, getValue: () => current.trim() };
  }

  // Build a CSS selector for an element, preferring stable, grep-friendly
  // anchors (id, data-testid, aria-label, semantic classes) over brittle
  // structural selectors. Falls back to :nth-of-type only when nothing
  // better is available. Tries to stop early once the chain is unique.
  function cssPath(node) {
    if (!(node instanceof Element)) return '';
    const anchor = uniqueAnchorFor(node);
    if (anchor) return anchor;
    const parts = [];
    let n = node;
    while (n && n.nodeType === 1 && n !== document.body && parts.length < 6) {
      parts.unshift(segmentFor(n));
      try {
        if (document.querySelectorAll(parts.join(' > ')).length === 1) {
          return parts.join(' > ');
        }
      } catch (_) {}
      n = n.parentElement;
    }
    if (n === document.body) parts.unshift('body');
    return parts.join(' > ');
  }

  function uniqueAnchorFor(el) {
    const tag = el.tagName.toLowerCase();
    if (isSafeId(el.id)) {
      const sel = tag + '#' + CSS.escape(el.id);
      if (countMatches(sel) === 1) return sel;
    }
    for (const attr of ['data-testid', 'data-test', 'data-cy']) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v) {
        const sel = `${tag}[${attr}="${cssAttrEscape(v)}"]`;
        if (countMatches(sel) === 1) return sel;
      }
    }
    const aria = el.getAttribute && el.getAttribute('aria-label');
    if (aria && aria.length < 60) {
      const sel = `${tag}[aria-label="${cssAttrEscape(aria)}"]`;
      if (countMatches(sel) === 1) return sel;
    }
    return null;
  }

  function segmentFor(el) {
    const tag = el.tagName.toLowerCase();
    if (isSafeId(el.id)) return tag + '#' + CSS.escape(el.id);
    for (const attr of ['data-testid', 'data-test', 'data-cy']) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v) return `${tag}[${attr}="${cssAttrEscape(v)}"]`;
    }
    const classes = goodClasses(el);
    const base = classes.length ? tag + '.' + classes.map(c => CSS.escape(c)).join('.') : tag;
    // A segment must single this element out among its siblings. If the base
    // (tag or tag.class) still matches more than one sibling, querySelector
    // resolves the whole path to the FIRST match — making a dot jump to the
    // wrong same-class element (e.g. the first of six identical .select filters).
    // Pin it to its position with :nth-of-type whenever the base is ambiguous.
    const parent = el.parentElement;
    const matchesBase = (c) => c.tagName === el.tagName &&
      (!classes.length || classes.every(cls => c.classList.contains(cls)));
    if (parent && [...parent.children].filter(matchesBase).length > 1) {
      let sib = el, idx = 1;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) idx++;
      return base + `:nth-of-type(${idx})`;
    }
    return base;
  }

  function goodClasses(el) {
    let cls = el.className;
    if (cls && typeof cls.baseVal === 'string') cls = cls.baseVal; // SVG
    if (typeof cls !== 'string') return [];
    return cls.trim().split(/\s+/).filter(c => {
      if (!c) return false;
      if (c.startsWith('cw-')) return false;                // widget's own classes
      if (STATE_CLASSES.has(c)) return false;                // state, not identity — never anchor to it
      if (c.length > 30) return false;                       // utility-class-soup
      if (/^css-[a-z0-9]{4,}$/i.test(c)) return false;       // CSS-in-JS hashes
      if (/^[a-z]+-\d+$/i.test(c)) return false;             // generated like btn-1
      return true;
    }).slice(0, 2);
  }

  const isSafeId = (id) => !!id && /^[A-Za-z][\w-]*$/.test(id);
  const countMatches = (sel) => { try { return document.querySelectorAll(sel).length; } catch (_) { return 0; } };
  const cssAttrEscape = (v) => String(v).replace(/(["\\])/g, '\\$1');

  // The element's opening tag, persisted on the pin for the data model and
  // activity log. e.g. `<button class="primary" data-action="save">`.
  function captureOpenTag(node) {
    if (!(node instanceof Element)) return '';
    const html = node.outerHTML || '';
    const m = html.match(/^<[^>]+>/);
    if (!m) return '';
    return m[0].length > 300 ? m[0].slice(0, 297) + '…' : m[0];
  }

  // Walks up from the clicked element to find the nearest ancestor annotated
  // with `data-file` + `data-line` (added by `scripts/annotate-source.py`).
  // Mirrors the SOURCE-INSPECTOR.md Alt+click pattern — same attributes, same
  // walk-up — so the widget reuses the existing locator instead of inventing
  // a parallel one. Returns null if the page hasn't been annotated.
  function findSourceAnchor(node) {
    let n = node;
    while (n && n.nodeType === 1) {
      const f = n.getAttribute && n.getAttribute('data-file');
      const l = n.getAttribute && n.getAttribute('data-line');
      if (f && l) return { file: f, line: l };
      n = n.parentElement;
    }
    return null;
  }

  // ----- Interaction state (which "scene" a comment belongs to) ---------------
  // Many mocks change what's on screen without changing the URL or removing
  // elements from the DOM — a bottom version switcher (V1/V2), tabs, nav items,
  // toggles. The commented element often stays rendered across those states, so
  // a pin would otherwise show on every state. We snapshot the page's active
  // toggle-group members when a comment is created (captureViewState), store
  // them on the pin, and only pin the comment when the page is back in that
  // state (viewMatches). Mismatched comments go to the "other views" drawer,
  // and clicking one restores the state (driveToViewState) before jumping to it.

  // Class / attribute markers that mean "this control is the selected one".
  const ACTIVE_CLASSES = ['active', 'selected', 'current', 'is-active', 'is-selected', 'is-current', 'checked', 'is-checked', 'is-on', 'on'];
  // Superset of ACTIVE_CLASSES: every class token that describes transient STATE
  // rather than the element's identity. These must never be baked into a saved
  // CSS selector — a selector like `button.cp-tab.is-on` stops meaning "this tab"
  // and starts meaning "whichever tab is active right now", so the pin would jump
  // to a different element the moment the user toggles state (the tab-switch bug).
  const STATE_CLASSES = new Set([
    ...ACTIVE_CLASSES,
    'open', 'is-open', 'opened', 'closed', 'is-closed',
    'show', 'shown', 'showing', 'visible', 'is-visible', 'hidden', 'is-hidden',
    'expanded', 'is-expanded', 'collapsed', 'is-collapsed',
    'hover', 'is-hover', 'focus', 'focused', 'is-focused',
    'disabled', 'is-disabled', 'loading', 'is-loading',
    'dragging', 'is-dragging', 'highlight', 'highlighted',
  ]);
  // Strip state-class tokens out of a stored CSS selector (`.is-on`, `.active`, …)
  // so it can be re-resolved by the element's IDENTITY alone. Legacy pins saved
  // before selectors excluded state classes rely on this to keep resolving.
  // Returns '' when stripping would leave an unusable selector.
  const STATE_CLASS_RE = new RegExp('\\.(?:' + [...STATE_CLASSES].join('|') + ')(?![\\w-])', 'g');
  function stripStateClasses(sel) {
    if (!sel) return '';
    const out = sel.replace(STATE_CLASS_RE, '');
    if (out === sel) return '';                        // nothing stripped → no relaxed variant
    if (/(^|[\s>+~])\s*(?=[\s>+~]|$)/.test(out.trim()) || !out.trim()) return ''; // a compound collapsed to nothing
    try { document.querySelectorAll(out); } catch (_) { return ''; }              // invalid after stripping
    return out;
  }
  // querySelectorAll union that finds every currently-active control on the page.
  const ACTIVE_SELECTOR = ACTIVE_CLASSES.map(c => '.' + c).join(',') +
    ',[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-pressed="true"]';

  function isActiveControl(node) {
    if (!(node instanceof Element)) return false;
    for (const c of ACTIVE_CLASSES) if (node.classList.contains(c)) return true;
    if (node.getAttribute('aria-selected') === 'true') return true;
    const ac = node.getAttribute('aria-current');
    if (ac && ac !== 'false') return true;
    if (node.getAttribute('aria-pressed') === 'true') return true;
    return false;
  }

  // Class tokens with the state markers (and the widget's own classes) removed —
  // the stable part that identifies the control regardless of its current state.
  function nonStateClasses(node) {
    let cls = node.className;
    if (cls && typeof cls.baseVal === 'string') cls = cls.baseVal; // SVG
    if (typeof cls !== 'string') return [];
    return cls.trim().split(/\s+/).filter(c =>
      c && !c.startsWith('cw-') && !STATE_CLASSES.has(c));
  }

  function controlText(node) {
    const aria = node.getAttribute && node.getAttribute('aria-label');
    const t = ((node.innerText || node.textContent || '') || aria || '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 80);
  }

  // True only when `node` is one option among alternatives — i.e. it has a
  // sibling of the same kind (same tag, or sharing a base class) that is NOT
  // currently active. This filters out lone "active" elements that are always
  // on (so binding to them would be meaningless) and keeps real toggle groups
  // (version switcher buttons, tabs, nav items, radio-style options).
  function isToggleGroupMember(node) {
    const p = node.parentElement;
    if (!p) return false;
    const base = nonStateClasses(node);
    for (const s of p.children) {
      if (s === node || s.nodeType !== 1 || isWidgetEl(s)) continue;
      const sameTag = s.tagName === node.tagName;
      const sharesClass = base.some(c => s.classList.contains(c));
      if ((sameTag || sharesClass) && !isActiveControl(s)) return true;
    }
    return false;
  }

  // A stable selector + label for an active control, ignoring its state class
  // so it can be re-found later whether or not it's selected. Prefers ids and
  // stable data-*/aria attributes; matching tolerates multiple hits and
  // disambiguates by text (see findStateControl).
  function stateAnchor(node) {
    const tag = node.tagName.toLowerCase();
    const text = controlText(node);
    if (isSafeId(node.id)) return { sel: tag + '#' + CSS.escape(node.id), text };
    for (const attr of ['data-version', 'data-tab', 'data-value', 'data-id', 'data-testid', 'data-test', 'aria-label']) {
      const v = node.getAttribute && node.getAttribute(attr);
      if (v) return { sel: `${tag}[${attr}="${cssAttrEscape(v)}"]`, text };
    }
    const cls = nonStateClasses(node);
    if (cls.length) return { sel: tag + '.' + cls.map(c => CSS.escape(c)).join('.'), text };
    return { sel: tag, text };
  }

  // Snapshot every active toggle-group member on the page right now.
  // ----- Modal / dialog / drawer open-state ------------------------------------
  // A mock's "scene" isn't only its toggle controls (tabs, version switchers,
  // nav items — those are handled by captureViewState's toggle-group scan).
  // Whether an *overlay surface* — a modal, dialog, or drawer — is open also
  // changes what a comment is about:
  //   • A comment ON something inside an open modal belongs to that modal — it
  //     should reappear only when that modal is open, and stay out of the way
  //     when it's closed.
  //   • A comment on the page BEHIND a modal belongs to the modal-closed view —
  //     it should not sit under the modal.
  // Opening/closing one of these is NOT a toggle-group member, so we detect it
  // separately and fold the result into the same `viewState` array via two
  // sentinel entries (sel starts with `@`, so they never collide with a real
  // CSS selector and survive the worker's cleanViewState):
  //   { sel: '@modal-aware' }              → this pin recorded overlay state
  //   { sel: '@modal', text: <modalKey> }  → one per overlay open at capture time
  // Because this runs in captureViewState for EVERY new comment, any comment on
  // (or behind) an openable surface is automatically pinned to that open/closed
  // state — no per-mock setup needed. Legacy pins (no `@modal-aware` marker)
  // skip overlay matching, so existing comments keep behaving exactly as before.
  const MODAL_AWARE_SEL = '@modal-aware';
  const MODAL_OPEN_SEL = '@modal';
  // Flow-map binding: a comment left while a flow-map node is showing records
  // that node id in a `@flow` view-state sentinel. Same `@`-prefixed shape as the
  // modal sentinels, so every existing viewState consumer ignores it and the
  // worker persists it untouched — no backend change needed. "Go" reads it to
  // jump straight to the node via the host's applyFlowState (deterministic,
  // unlike replaying the click trail). Purely additive: mocks without a flow map,
  // and all pre-existing comments, never carry it and behave exactly as before.
  const FLOW_SEL = '@flow';
  // Overlay surfaces that have an open/closed state. Vaadin dialogs/drawers and
  // native <dialog> expose role="dialog" on their open surface; .modal-backdrop
  // is the common hand-rolled-modal pattern in these mocks; vwc-drawer in
  // overlay mode floats over content the same way a modal does.
  const MODAL_SELECTOR = '[role="dialog"], [aria-modal="true"], dialog[open], .modal-backdrop, vwc-drawer[overlay][open]';

  function isElVisible(el) {
    if (!(el instanceof Element)) return false;
    let cs;
    try { cs = getComputedStyle(el); } catch (_) { return false; }
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // Every currently-visible modal/dialog, reduced to the outermost element of
  // each (a backdrop wrapping its own `[role="dialog"]` counts once).
  function openModalEls() {
    let nodes;
    try { nodes = document.querySelectorAll(MODAL_SELECTOR); } catch (_) { return []; }
    const vis = [];
    for (const n of nodes) { if (!isWidgetEl(n) && isElVisible(n)) vis.push(n); }
    return vis.filter(n => !vis.some(o => o !== n && o.contains(n)));
  }

  // A stable key identifying a modal across capture and later matching. Prefers
  // a safe id; falls back to a non-state class or its title text.
  function modalKey(el) {
    if (el.id && isSafeId(el.id)) return '#' + el.id;
    const cls = nonStateClasses(el).filter(c => c !== 'modal-backdrop' && c !== 'modal');
    const label = modalLabel(el);
    return (cls[0] ? '.' + cls[0] : el.tagName.toLowerCase()) + (label ? '|' + label : '');
  }

  // Human-readable modal title for the scene label, when one can be found.
  function modalLabel(el) {
    const lid = el.getAttribute && el.getAttribute('aria-labelledby');
    if (lid) { const t = document.getElementById(lid); if (t) return controlText(t); }
    const al = el.getAttribute && el.getAttribute('aria-label');
    if (al) return al.slice(0, 80);
    const h = el.querySelector('.modal-title, h1, h2, h3, [class*="title" i]');
    if (h) return controlText(h);
    return '';
  }

  // Close one open modal as non-destructively as possible: drive a real close
  // affordance (so the mock's own handler runs) before falling back to hiding.
  function closeModalEl(el) {
    if ('opened' in el) { try { el.opened = false; return; } catch (_) {} }
    if (el.tagName === 'DIALOG' && el.open && typeof el.close === 'function') { try { el.close(); return; } catch (_) {} }
    const btn = el.querySelector('.modal-close, [data-dismiss], [data-close], button[aria-label="Close" i], [aria-label="Close" i]');
    if (btn) { try { btn.click(); return; } catch (_) {} }
    try { el.style.display = 'none'; } catch (_) {}
  }

  // Strip the leading `#`/`.` from a modalKey for display.
  function prettyModalKey(k) { return (k || '').replace(/^[#.]/, '').split('|')[0]; }

  // ----- Flow-map binding (all read-only, all guarded) -------------------------
  // The mock's current flow-map node, if it HAS a flow map and we can tell which
  // node is showing. Two read-only sources: the flow map records the node it last
  // drove to (window.__toolboxFlowState — its own global, set in flow-map.js), and
  // a `#fm=<node>` deep link in the URL. Returns '' when there's no flow map or no
  // known node — in which case nothing flow-related is captured.
  function currentFlowState() {
    if (!(window.TOOLBOX_CONFIG && window.TOOLBOX_CONFIG.flowMap)) return '';
    const rec = window.__toolboxFlowState;
    if (rec && rec.state) return String(rec.state);
    const m = (location.hash || '').match(/[#&]fm=([^&]+)/);
    if (m) { try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; } }
    return '';
  }
  // Name of the host's state-driver fn (config-overridable, default applyFlowState).
  function flowApplyName() {
    const fm = window.TOOLBOX_CONFIG && window.TOOLBOX_CONFIG.flowMap;
    return (fm && fm.applyState) || 'applyFlowState';
  }
  // The flow-map node a comment was bound to, read from its `@flow` sentinel
  // (empty for comments that predate flow binding or weren't left on a node).
  function flowStateOf(pin) {
    if (!Array.isArray(pin.viewState)) return '';
    const d = pin.viewState.find(x => x && x.sel === FLOW_SEL);
    return d && d.text ? String(d.text) : '';
  }
  // Readable label for a flow node id, resolved against the flow map config when
  // present; falls back to the raw id so it never renders blank.
  function flowNodeLabel(stateId) {
    const fm = window.TOOLBOX_CONFIG && window.TOOLBOX_CONFIG.flowMap;
    const nodes = fm && Array.isArray(fm.nodes) ? fm.nodes : [];
    const n = nodes.find(x => x && ((x.state || x.id) === stateId || x.id === stateId));
    return (n && (n.label || n.title || n.id)) || stateId;
  }

  // `excludeEl` is the element the comment is being pinned to (when known). A
  // toggle control must never be captured into ITS OWN pin's view state: a
  // comment left ON the active tab is about the tab button — which is visible in
  // every tab state — so binding it to "this tab is active" would wrongly hide
  // (or worse, re-anchor) the pin the moment the user switches tabs.
  function captureViewState(excludeEl) {
    const out = [];
    const seen = new Set();
    // Compute the flow node up front so the control cap reserves a slot for it
    // ONLY when there is one. A non-flow mock keeps the original 14-control cap,
    // so its captured state is byte-for-byte identical to before this feature.
    const flow = currentFlowState();
    const ctrlCap = flow ? 13 : 14;
    let nodes = [];
    try { nodes = document.querySelectorAll(ACTIVE_SELECTOR); } catch (_) {}
    for (const node of nodes) {
      if (isWidgetEl(node) || !isActiveControl(node) || !isToggleGroupMember(node)) continue;
      if (excludeEl && (node === excludeEl || node.contains(excludeEl) || excludeEl.contains(node))) continue;
      const anchor = stateAnchor(node);
      const k = anchor.sel + '|' + anchor.text;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(anchor);
      if (out.length >= ctrlCap) break; // leave room for the flow + modal sentinels below
    }
    // Fold in the current flow-map node (if any), so "Go" can jump straight to it
    // via applyFlowState. Inert to every other viewState consumer (they skip
    // '@'-prefixed entries). Pushed before the modal sentinels so it stays within
    // the worker's 16-entry cap.
    if (flow) out.push({ sel: FLOW_SEL, text: flow.slice(0, 80) });
    // Fold in modal open-state (see notes above).
    out.push({ sel: MODAL_AWARE_SEL, text: '' });
    for (const m of openModalEls()) {
      out.push({ sel: MODAL_OPEN_SEL, text: modalKey(m) });
      if (out.length >= 16) break;
    }
    return out;
  }

  // Loose text equality for re-finding controls: exact match, or one side is a
  // truncated/decorated form of the other (dynamic count badges, 80-char cap).
  function looseTextEq(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length >= 4 && b.length >= 4) return a.startsWith(b) || b.startsWith(a);
    return false;
  }

  // Re-find the control a descriptor points at. The selector may match several
  // (e.g. all `.vs-btn`); the stored text picks the right one. Legacy descriptors
  // saved before state classes were excluded may carry them (`button.cp-tab.is-on`)
  // — after a state change that selector matches a DIFFERENT control (whichever
  // is active now), so any hit is verified against the stored text, and on a miss
  // the selector is relaxed (state classes stripped) and re-tried. Returns null
  // rather than guessing when the text can't be matched.
  function findStateControl(desc) {
    if (!desc || !desc.sel) return null;
    const pick = (nodes) => {
      const real = [...nodes].filter(n => !isWidgetEl(n));
      if (!real.length) return null;
      if (!desc.text) return real[0];
      for (const n of real) if (controlText(n) === desc.text) return n;
      for (const n of real) if (looseTextEq(controlText(n), desc.text)) return n;
      return null;
    };
    let nodes = [];
    try { nodes = document.querySelectorAll(desc.sel); } catch (_) { return null; }
    let hit = pick(nodes);
    if (!hit) {
      const relaxed = stripStateClasses(desc.sel);
      if (relaxed) {
        let rn = [];
        try { rn = document.querySelectorAll(relaxed); } catch (_) {}
        hit = pick(rn);
      }
    }
    return hit;
  }

  // Does the page's current interaction state match the one this comment was
  // left in? A comment with no captured state (legacy pins, or comments on
  // shared chrome that wasn't in any toggle group) always matches.
  // `anchorEl` is the pin's own resolved element (when known): a captured control
  // that IS the anchor (or wraps it / sits inside it) is skipped, because the
  // anchor's own active-state must not decide the pin's visibility — legacy pins
  // on tab buttons captured "this tab is active" about themselves, which would
  // otherwise hide the pin whenever a different tab is selected.
  function viewMatches(pin, anchorEl) {
    const vs = pin.viewState;
    if (!Array.isArray(vs) || !vs.length) return true;
    // Toggle controls (non-sentinel entries) must all be active.
    const controls = vs.filter(d => d.sel && d.sel[0] !== '@');
    const controlsOk = controls.every(desc => {
      const node = findStateControl(desc);
      if (!node) return false;
      if (anchorEl && (node === anchorEl || node.contains(anchorEl) || anchorEl.contains(node))) return true;
      return isActiveControl(node);
    });
    if (!controlsOk) return false;
    // If this pin recorded modal state, the open-modal set must match exactly
    // (an empty captured set means "only when no modal is open").
    if (vs.some(d => d.sel === MODAL_AWARE_SEL)) {
      const want = vs.filter(d => d.sel === MODAL_OPEN_SEL).map(d => d.text).sort();
      const have = openModalEls().map(modalKey).sort();
      if (want.length !== have.length) return false;
      for (let i = 0; i < want.length; i++) if (want[i] !== have[i]) return false;
    }
    return true;
  }

  // True when clicking this element would leave the page (or the widget must
  // never synthesize a click on it): a real hyperlink, a new-tab/download link,
  // a form submit/reset control, or any review-tool chrome. Used to gate every
  // programmatic click in state-restore and trail replay — those must drive the
  // mock's in-page navigation only, never a real navigation or our own UI.
  function isUnsafeToClick(node) {
    if (!(node instanceof Element)) return true;
    if (isToolboxEl(node)) return true;
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (node.hasAttribute('download')) return true;
      if ((node.getAttribute('target') || '') === '_blank') return true;
      return !!href && href !== '#' && !/^javascript:/i.test(href);
    }
    // Submit/reset buttons and inputs post or clear a form — a real page action,
    // not the in-page screen switch replay is meant to reproduce.
    const type = (node.getAttribute && (node.getAttribute('type') || '')).toLowerCase();
    if ((node.tagName === 'BUTTON' || node.tagName === 'INPUT') && (type === 'submit' || type === 'reset') && node.form) return true;
    return false;
  }

  // One restore pass: click every captured control that isn't currently active.
  // Clicking runs the mock's own handler (so the real switch happens — version
  // var flips, table re-renders, etc.). Returns how many clicks were issued.
  function clickStateControls(pin) {
    const vs = pin.viewState;
    if (!Array.isArray(vs) || !vs.length) return 0;
    let clicked = 0;
    for (const desc of vs.filter(d => d.sel && d.sel[0] !== '@')) {
      const node = findStateControl(desc);
      if (!node || isActiveControl(node) || isUnsafeToClick(node)) continue;
      try { node.click(); clicked++; } catch (_) {}
    }
    return clicked;
  }

  // Bring the modal layer into the captured state. We can reliably *close*
  // modals that shouldn't be open (restore a "modal closed" scene); re-OPENING
  // a modal needs the mock's own trigger — that's what the trail replay does.
  function closeUnwantedModals(pin) {
    const vs = pin.viewState;
    if (!Array.isArray(vs) || !vs.some(d => d.sel === MODAL_AWARE_SEL)) return;
    const want = new Set(vs.filter(d => d.sel === MODAL_OPEN_SEL).map(d => d.text));
    for (const m of openModalEls()) {
      if (!want.has(modalKey(m))) closeModalEl(m);
    }
  }

  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  // Give the mock's own handlers time to re-render between our clicks.
  async function settle(ms = 160) { await nextFrame(); await sleep(ms); await nextFrame(); }

  // Drive the mock back into a comment's captured interaction state, in rounds:
  // clicking one control often re-renders a region and only THEN exposes the
  // next control (switch version → tab bar appears → pick the tab). Keep going
  // until the state matches, there's nothing left to click, or rounds run out.
  async function driveToViewState(pin) {
    for (let round = 0; round < 5; round++) {
      closeUnwantedModals(pin);
      const anchor = findPinEl(pin);
      if (anchor && viewMatches(pin, anchor)) return true;
      if (!clickStateControls(pin)) break;
      await settle();
    }
    closeUnwantedModals(pin);
    const anchor = findPinEl(pin);
    return !!anchor && viewMatches(pin, anchor);
  }

  // Re-find one recorded trail step's element: exact selector (text-verified
  // when several match), then the state-relaxed selector. Lenient by design —
  // replay is best-effort and the destination is verified afterwards.
  function findTrailEl(step) {
    if (!step || !step.s) return null;
    const pick = (nodes) => {
      const real = [...nodes].filter(n => !isToolboxEl(n));
      if (!real.length) return null;
      if (!step.t) return real[0];
      for (const n of real) if (controlText(n) === step.t) return n;
      for (const n of real) if (looseTextEq(controlText(n), step.t)) return n;
      return real.length === 1 ? real[0] : null;
    };
    let nodes = [];
    try { nodes = document.querySelectorAll(step.s); } catch (_) {}
    let hit = pick(nodes);
    if (!hit) {
      const relaxed = stripStateClasses(step.s);
      if (relaxed) {
        let rn = [];
        try { rn = document.querySelectorAll(relaxed); } catch (_) {}
        hit = pick(rn);
      }
    }
    return hit;
  }

  // Re-walk the user's recorded click path from a fresh page load — the only
  // generic way back into screens a mock builds on demand (innerHTML swaps,
  // modals, wizard steps). Steps whose element can't be found are skipped
  // (they may have been noise — a toast dismissal, a hover-menu click).
  async function replayTrail(pin) {
    const trail = pin.trail || [];
    let reached = 0, lastNode = null;
    for (const step of trail) {
      const node = findTrailEl(step);
      if (!node || isUnsafeToClick(node)) continue;
      try { node.click(); lastNode = node; reached++; } catch (_) {}
      await settle(120);
    }
    // Report progress so a partial replay can leave the reviewer at the nearest
    // reachable step instead of stranding them at nothing.
    return { reached, total: trail.length, lastNode };
  }

  // Short human label for a comment's bound state, e.g. "Version 2 · Compliance".
  function viewStateLabel(pin) {
    const vs = pin.viewState;
    if (!Array.isArray(vs) || !vs.length) return '';
    const parts = vs.filter(d => d.sel && d.sel[0] !== '@').map(d => d.text).filter(Boolean);
    // Lead with the flow-map screen this comment sits on, when it's bound to one.
    const flow = flowStateOf(pin);
    if (flow) parts.unshift('Screen: ' + flowNodeLabel(flow));
    if (vs.some(d => d.sel === MODAL_AWARE_SEL)) {
      // Only surface modal state when a modal was actually open. A bare
      // "No modal" is noise in the header — suppress it (a comment left on a
      // plain screen just shows its timestamp).
      const modals = vs.filter(d => d.sel === MODAL_OPEN_SEL).map(d => prettyModalKey(d.text));
      if (modals.length) parts.push('Modal: ' + modals.join(', '));
    }
    return parts.join(' · ');
  }

  // ----- Click trail (the comment navigator's path back) -----------------------
  // Toggle-state restore (viewState) can only re-press controls that are still
  // findable — it cannot re-open a modal, re-enter a wizard step, or reach a
  // screen the mock builds on demand with innerHTML. For that, the widget keeps
  // a rolling log of the user's REAL clicks since page load; each new comment
  // stores a snapshot (pin.trail). "Go" can then reload the mock into its known
  // landing state and re-walk that exact click path, arriving at the precise
  // step the comment was left on. Replay is best-effort — missing steps are
  // skipped and the destination is always verified before the pin is shown.
  const TRAIL_MAX = 40;
  const clickTrail = []; // {s: selector, t: control text} per real user click
  // True while a "Go" navigation (state restore / trail replay) is running, so
  // the trail recorder ignores the clicks WE synthesize and overlapping jumps
  // are blocked (a single navigation owns the page until it finishes).
  let navigating = false;
  const TRAIL_INTERACTIVE = 'a,button,[role="button"],[role="tab"],[role="menuitem"],[role="option"],[role="switch"],[role="checkbox"],[role="radio"],input,select,textarea,label,summary,[onclick],[tabindex]';

  function recordTrailClick(e) {
    if (!e.isTrusted) return;                 // programmatic clicks (state restore, replay)
    if (state.pickMode || movePinId) return;  // widget interactions, not mock navigation
    if (navigating) return;                   // clicks WE issue during a Go replay
    let node = e.target;
    if (!(node instanceof Element) || isToolboxEl(node)) return; // skip all review-tool chrome
    node = node.closest(TRAIL_INTERACTIVE) || node;
    if (isToolboxEl(node)) return;            // the closest() hop can still land on chrome
    clickTrail.push({ s: cssPath(node), t: controlText(node) });
    if (clickTrail.length > TRAIL_MAX) clickTrail.shift(); // oldest steps drop; replay stays best-effort
  }

  const currentTrail = () => clickTrail.slice();
  const hasTrail = (pin) => Array.isArray(pin.trail) && pin.trail.length > 0;
  // Does this pin carry anything the widget can act on to auto-navigate to it —
  // a recorded click trail, or captured toggle-group controls (version/tab/nav)?
  // Legacy pins predate trails and often captured only the modal sentinel, so
  // they have no path: their element genuinely lives on another screen, but the
  // widget can't drive there — the reviewer must open that flow manually.
  function hasNavInfo(pin) {
    if (hasTrail(pin)) return true;
    if (flowStateOf(pin)) return true;
    return Array.isArray(pin.viewState) && pin.viewState.some(d => d.sel && d.sel[0] !== '@');
  }

  // The recorded click trail, rendered as human-readable step labels (each
  // control's visible text, in order). This is what turns the internal replay
  // log into something a reviewer or a developer can read — e.g.
  // "Analytics Overview" → "Manage delivery". Kept faithful (no de-duping) so a
  // dev sees every click behavior; blank labels fall back to a placeholder.
  function pathLabels(pin) {
    if (!hasTrail(pin)) return [];
    return pin.trail.map(step => {
      const t = (step && step.t ? String(step.t) : '').replace(/\s+/g, ' ').trim();
      if (!t) return '(unlabeled control)';
      return t.length > 44 ? t.slice(0, 43) + '…' : t;
    });
  }

  // Pins whose full navigation (including the reload fallback) failed this
  // session — listed honestly as "not found" instead of bouncing forever.
  const NAV_FAILED_KEY = 'cw-nav-failed';
  function navFailedMap() { try { return JSON.parse(sessionStorage.getItem(NAV_FAILED_KEY) || '{}') || {}; } catch (_) { return {}; } }
  function navFailed(id) { return !!navFailedMap()[id]; }
  function markNavFailed(id) { try { const m = navFailedMap(); m[id] = Date.now(); sessionStorage.setItem(NAV_FAILED_KEY, JSON.stringify(m)); } catch (_) {} }
  function clearNavFailed(id) { try { const m = navFailedMap(); if (m[id]) { delete m[id]; sessionStorage.setItem(NAV_FAILED_KEY, JSON.stringify(m)); } } catch (_) {} }

  // Cross-reload handoff for "Go": before reloading we stash the target pin id;
  // after the fresh boot the widget picks it up and finishes the navigation.
  // A reload is DESTRUCTIVE (it throws away the mock's in-memory state), so it
  // is only ever offered behind an explicit, cancelable prompt — never fired
  // silently and never from a low-intent skim (the Prev/Next stepper). The
  // resume key is short-lived (12s) and cleared on cancel so it can't fire a
  // surprise auto-navigation on some unrelated later reload.
  const NAV_RESUME_KEY = 'cw-nav-resume';
  const NAV_RESUME_TTL = 12000;
  function clearNavResume() { try { sessionStorage.removeItem(NAV_RESUME_KEY); } catch (_) {} }
  // Ask before reloading; resolves true only if the user confirms in time.
  function confirmNavReload(pin) {
    try { sessionStorage.setItem(NAV_RESUME_KEY, JSON.stringify({ id: pin.id, ts: Date.now() })); } catch (_) { return false; }
    showToast('This comment lives deeper in the flow. Reload the mock to navigate to it?', 'neutral', {
      undoLabel: 'Reload & go',
      onUndo: () => { setTimeout(() => location.reload(), 60); },
    });
    // If the user lets the toast expire (or dismisses it) we do NOT reload, and
    // the stashed resume key is dropped so nothing fires later.
    setTimeout(() => { if (sessionStorage.getItem(NAV_RESUME_KEY)) clearNavResume(); }, 10500);
    return true;
  }
  function pendingNavResume() {
    try {
      const raw = sessionStorage.getItem(NAV_RESUME_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(NAV_RESUME_KEY);
      const v = JSON.parse(raw);
      return (v && v.id && (Date.now() - (v.ts || 0)) < NAV_RESUME_TTL) ? v : null;
    } catch (_) { return null; }
  }

  // The mock's repo-relative file path. Prefer the pin's own annotation
  // (data-file, set when the element was clicked); otherwise derive it from the
  // current page path so "Open in VS Code" works on ANY mock — even ones the
  // annotate script never touched. A directory URL (…/folder/) maps to its
  // index.html.
  function pageFilePath() {
    const m = location.pathname.match(/\/(products\/.+)$/i);
    if (!m) return '';
    let p = decodeURIComponent(m[1]);
    if (p.endsWith('/')) p += 'index.html';
    return p;
  }
  function pinFilePath(pin) { return pin.dataFile || pageFilePath(); }

  // Opens the file (and line, when known) in VS Code via the
  // `vscode://file/<abs>[:<line>]` URL handler. Needs the user's local repo
  // root (which only they know — the widget runs on GitHub Pages but VS Code
  // opens local files). We cache it in localStorage under `cw-repo-root` after
  // the first prompt.
  function openInVSCode(pin) {
    const file = pinFilePath(pin);
    if (!file) { showToast('Could not determine the source file for this page', 'error'); return; }
    let repoRoot = localStorage.getItem('cw-repo-root') || '';
    if (!repoRoot) {
      const entered = window.prompt(
        'Set your local repo root path (saved in this browser only):\n\n' +
        '  e.g. /Users/you/code/ux-mockups\n\n' +
        'You can change this later by running:\n' +
        '  localStorage.removeItem("cw-repo-root")'
      );
      if (!entered) return;
      repoRoot = entered.trim().replace(/\/+$/, '');
      if (!repoRoot) return;
      localStorage.setItem('cw-repo-root', repoRoot);
    }
    const url = `vscode://file${repoRoot}/${file}` + (pin.dataLine ? `:${pin.dataLine}` : '');
    const a = document.createElement('a');
    a.href = url;
    a.click();
  }

  // Builds a ready-to-paste Claude Code prompt for a pin: file, CSS selector,
  // line (if known), the element's visible text, and the feedback itself. The
  // selector is what lets Claude Code locate the element even in React/JSX
  // mocks where there's no usable line number.
  function claudePrompt(pin) {
    const file = pinFilePath(pin) || '(this mock file)';
    let s = `In ${file}, find the element`;
    if (pin.selector) s += ` matching \`${pin.selector}\``;
    if (pin.dataLine) s += ` (near line ${pin.dataLine})`;
    if (pin.elementText) s += ` — visible text: "${pin.elementText.slice(0, 80)}"`;
    s += '.';
    // The recorded click path to the element — so a developer sees every
    // interaction needed to reach it (it often lives deeper in a flow).
    const steps = pathLabels(pin);
    if (steps.length) {
      s += ` To reach it in the mock: ${steps.map((t, i) => `${i + 1}) ${t}`).join(' → ')}` +
        ` (${steps.length} click${steps.length > 1 ? 's' : ''}).`;
    }
    if (pin.comment) s += ` Feedback: "${pin.comment}"`;
    return s;
  }

  // Generic clipboard copy with a toast.
  function copyText(text, okMsg) {
    if (!text) { showToast('Nothing to copy', 'error'); return; }
    navigator.clipboard.writeText(text).then(
      () => showToast(okMsg || 'Copied', 'success'),
      () => showToast('Could not copy to clipboard', 'error'),
    );
  }

  // ----- API ------------------------------------------------------------------
  async function api(method, path, body) {
    const res = await fetch(CW_WORKER_URL.replace(/\/$/, '') + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ----- html2canvas ----------------------------------------------------------
  let _h2c;
  function loadHtml2Canvas() {
    if (_h2c) return _h2c;
    _h2c = new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const s = document.createElement('script');
      s.src = HTML2CANVAS_URL;
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error('html2canvas load failed'));
      document.head.appendChild(s);
    });
    return _h2c;
  }

  // Per-pin generation counter for background screenshot recapture after a
  // drag. Incremented on every drag drop so an in-flight capture from a prior
  // drag can detect it's stale and bail out before overwriting a newer image.
  const pinDragGen = new Map();

  async function recaptureScreenshot(pin, target, dragGen, panelWasOpen) {
    const newShot = await captureElement(target);
    if (!newShot) return;                                  // capture failed — keep the old screenshot
    if (pinDragGen.get(pin.id) !== dragGen) return;        // newer drag superseded this one
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, {
        url: pin.url,
        author: state.author || pin.author,
        screenshot: newShot,
      });
      mergePin(updated);
      // Only refresh the panel if it's still open for this same pin — don't
      // pop it back up if the user has since closed it or opened a different one.
      if (panelWasOpen && state.openPanelPinId === updated.id) reopenPanel(updated);
    } catch (_) {
      // Swallow — the pin is already re-anchored; a missing screenshot update
      // is not worth a toast. Old screenshot just stays for now.
    }
  }

  async function captureElement(node) {
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(node, { logging: false, backgroundColor: '#fff', scale: 1 });
      const MAX = 800;
      if (canvas.width <= MAX) return canvas.toDataURL('image/jpeg', 0.8);
      const out = document.createElement('canvas');
      const r = MAX / canvas.width;
      out.width = MAX;
      out.height = Math.round(canvas.height * r);
      out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
      return out.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn('[cw] screenshot failed', e);
      return '';
    }
  }

  // ----- Root container -------------------------------------------------------
  let root, pinsLayer, bubble, bubbleIcon, bubbleLabel, banner, bannerHideBtn;

  function buildRoot() {
    const style = el('style'); style.textContent = css;
    document.head.appendChild(style);

    root = el('div', { class: 'cw-root', 'data-cw-version': WIDGET_VERSION });
    pinsLayer = el('div', { class: 'cw-pins' });
    root.appendChild(pinsLayer);
    document.body.appendChild(root);

    bubbleIcon = el('span', { class: 'cw-bubble-icon' }, ['💬']);
    bubbleLabel = el('span', { class: 'cw-bubble-label' }, ['Comments']);
    bubble = el('button', {
      class: 'cw-bubble',
      type: 'button',
      'aria-label': 'Add feedback',
      title: 'Comments',
      onclick: onBubbleClick,
    }, [
      bubbleIcon,
      bubbleLabel,
      el('div', { class: 'cw-bubble-tip' }, ['Add feedback']),
    ]);
    // Dock into the shared Toolbox pill (bottom-center, alongside the Flow Map
    // button) when it's available; otherwise float as the standalone bubble.
    if (window.ToolboxDock) { bubble.classList.add('cw-bubble--docked'); window.ToolboxDock.add(bubble); }
    else document.body.appendChild(bubble);
    applyAdminBubble();

    // The pick-mode banner. The admin controls (Hide comments, View activity log)
    // live INLINE here — right where "Click any element to leave feedback" is —
    // instead of hidden behind a gear→settings popover. When docked, the banner
    // sits just above the toolbox dock and drops its own "Esc" button (the docked
    // Comments button already becomes ✕ Cancel in pick mode, and Esc still works).
    var docked = !!window.ToolboxDock;

    bannerHideBtn = el('button', {
      type: 'button', class: 'cw-banner-hide',
      title: 'Hide every pin and disable the bubble for non-admins. Admins still see and manage everything.',
      onclick: async () => {
        becomeAdmin();
        const next = !state.settings.commentsDisabled;
        await saveCommentsSetting({ commentsDisabled: next }, next ? 'Comments hidden' : 'Comments shown');
        renderBannerHide();
      },
    }, []);
    const logLink = el('a', {
      class: 'cw-banner-link', href: LOG_URL, target: '_blank', rel: 'noopener',
      title: 'Open the activity log in a new tab', onclick: () => becomeAdmin(),
    }, ['Log ', faIcon('arrow-up-right')]);

    var bannerKids = [
      el('span', { class: 'cw-banner-text' }, ['Click any element to leave feedback']),
      el('span', { class: 'cw-banner-sep', 'aria-hidden': 'true' }),
      bannerHideBtn,
      logLink,
    ];
    if (!docked) {
      bannerKids.push(el('span', { class: 'cw-banner-sep', 'aria-hidden': 'true' }));
      bannerKids.push(el('button', { type: 'button', class: 'cw-banner-esc', onclick: exitPickMode }, ['Esc']));
    }
    banner = el('div', { class: 'cw-banner cw-hidden' + (docked ? ' cw-banner--docked' : '') }, bannerKids);
    document.body.appendChild(banner);
    renderBannerHide();
  }

  // Reflect the live "comments hidden" setting on the banner's Hide button.
  function renderBannerHide() {
    if (!bannerHideBtn) return;
    const on = !!state.settings.commentsDisabled;
    // Text label (no eye icon here — the only eyeball lives on the island's
    // comment button). This is the admin "hide for everyone" control.
    bannerHideBtn.textContent = on ? '✓ Comments hidden' : 'Hide comments';
    bannerHideBtn.classList.toggle('cw-banner-on', on);
    bannerHideBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // Save a comment setting (currently just commentsDisabled) with an optimistic
  // update that snaps back on failure. Used by the banner's Hide button. (This
  // replaces the old gear→settings panel, whose controls now live in the banner.)
  async function saveCommentsSetting(patch, successMsg) {
    const prev = { ...state.settings };
    state.settings = { ...state.settings, ...patch };
    applyAdminBubble(); renderPins(); renderBannerHide();
    try {
      const { settings } = await api('PATCH', '/settings', { url: pageUrl, author: state.author || 'admin', ...patch });
      state.settings = settings;
      applyAdminBubble(); renderPins(); renderBannerHide();
      if (successMsg) showToast(successMsg, 'success');
    } catch (e) {
      state.settings = prev;
      applyAdminBubble(); renderPins(); renderBannerHide();
      showToast(e.message || 'Could not save setting', 'error');
    }
  }

  // The dock comment button is the single show/hide + comment control. Its
  // behavior depends on state (comments are hidden by default):
  //   • pick mode      → exit pick mode
  //   • comments hidden → SHOW comments (reveal pins) — this is how you get back
  //                       in after the default-hidden load; the eye lives HERE,
  //                       not in the nav hub.
  //   • comments shown → enter pick mode to add feedback
  function onBubbleClick() {
    if (state.pickMode) { exitPickMode(); return; }
    if (state.commentsHidden) { showComments(); return; }
    enterPickMode();
  }
  function showComments() {
    state.commentsHidden = false;   // session-only (not persisted); resets on refresh
    refreshBubble();
    renderPins();
  }

  // Set the bubble's glyph. 'eye' uses the inline SVG icon; the others are text.
  function setBubbleGlyph(kind) {
    if (!bubbleIcon) return;
    if (kind === 'eye') { bubbleIcon.textContent = ''; bubbleIcon.appendChild(faIcon('eye')); }
    else bubbleIcon.textContent = kind;
  }
  // Reconcile the bubble's icon / labels / ghosting with the current state. One
  // place so pick-mode, hidden, and shown states never drift out of sync.
  function refreshBubble() {
    if (!bubble) return;
    // Dormant (comments disabled by an admin, or off the published site) still
    // dims the bubble in place — but it stays clickable so it can be opened.
    bubble.classList.toggle('cw-bubble--ghost', isDormant() && !state.pickMode);
    if (state.pickMode) {
      setBubbleGlyph('✕');
      bubble.title = 'Exit comment mode';
      bubble.setAttribute('aria-label', 'Exit comment mode');
      if (bubbleLabel) bubbleLabel.textContent = 'Cancel';
    } else if (state.commentsHidden) {
      // Comments hidden (the default): the island's single eyeball. Fully enabled
      // (never ghosted for hidden); clicking it reveals comments.
      setBubbleGlyph('eye');
      bubble.title = 'Show comments';
      bubble.setAttribute('aria-label', 'Show comments');
      if (bubbleLabel) bubbleLabel.textContent = 'Comments';
    } else {
      setBubbleGlyph('💬');
      bubble.title = 'Add feedback';
      bubble.setAttribute('aria-label', 'Add feedback');
      if (bubbleLabel) bubbleLabel.textContent = 'Comments';
    }
  }

  // ----- Admin -----------------------------------------------------------------
  // The admin's effective role for rendering.
  function effectiveAdmin() { return state.isAdmin; }

  function becomeAdmin() {
    if (state.isAdmin) return;
    state.isAdmin = true;
    localStorage.setItem('cw-admin', '1');
    applyAdminBubble();
    renderPins();
  }

  // Kept as the public name other call sites use; the bubble's full icon/label/
  // ghost state now lives in refreshBubble (single source of truth).
  function applyAdminBubble() { refreshBubble(); }

  // ----- Toast ----------------------------------------------------------------
  function showToast(text, variant = 'neutral', opts = {}) {
    if (state.activeToast) { state.activeToast.remove(); state.activeToast = null; }
    const t = el('div', { class: `cw-toast cw-toast--${variant}` });
    t.appendChild(document.createTextNode(text));
    let undoBtn = null;
    if (opts.undoLabel && opts.onUndo) {
      undoBtn = el('button', { onclick: () => {
        opts.onUndo();
        t.classList.remove('cw-toast--show');
        setTimeout(() => t.remove(), 200);
        if (state.activeToast === t) state.activeToast = null;
      }}, [opts.undoLabel]);
      t.appendChild(undoBtn);
    }
    document.body.appendChild(t);
    state.activeToast = t;
    requestAnimationFrame(() => t.classList.add('cw-toast--show'));
    const ttl = opts.onUndo ? 10000 : 4000;
    setTimeout(() => {
      if (state.activeToast !== t) return;
      t.classList.remove('cw-toast--show');
      setTimeout(() => t.remove(), 200);
      state.activeToast = null;
    }, ttl);
  }

  // ----- Pick mode ------------------------------------------------------------
  let hoverOutline;

  // Outline shown under the cursor while dragging a pin, marking the element it
  // will re-anchor to on drop. Reuses the pick-mode outline styling.
  let dragOutline;
  function showDragOutline() {
    if (dragOutline) return;
    dragOutline = el('div', { class: 'cw-hover-outline cw-hidden' });
    document.body.appendChild(dragOutline);
  }
  function updateDragOutline(target) {
    if (!dragOutline) return;
    if (!target) { dragOutline.classList.add('cw-hidden'); return; }
    const r = target.getBoundingClientRect();
    Object.assign(dragOutline.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    dragOutline.classList.remove('cw-hidden');
  }
  function hideDragOutline() {
    if (dragOutline) { dragOutline.remove(); dragOutline = null; }
  }

  function enterPickMode() {
    if (state.pickMode) return;
    state.pickMode = true;
    document.documentElement.classList.add('cw-picking');
    if (bubble) { bubble.classList.add('cw-bubble--active'); refreshBubble(); }
    if (banner) { banner.classList.remove('cw-hidden'); renderBannerHide(); }
    hoverOutline = el('div', { class: 'cw-hover-outline cw-hidden' });
    document.body.appendChild(hoverOutline);
    document.addEventListener('mousemove', onPickHover, true);
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKey, true);
    renderPins(); // reveal pins if comments were hidden (dormant) until now
  }

  function exitPickMode() {
    if (!state.pickMode) return;
    state.pickMode = false;
    document.documentElement.classList.remove('cw-picking');
    if (bubble) { bubble.classList.remove('cw-bubble--active'); refreshBubble(); }
    if (banner) banner.classList.add('cw-hidden');
    if (hoverOutline) { hoverOutline.remove(); hoverOutline = null; }
    document.removeEventListener('mousemove', onPickHover, true);
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey, true);
    renderPins(); // hide pins again if comments are in the dormant (disabled) state
  }

  // Selector union of the widget's OWN surfaces. `.cw-reveal-bar` is included so
  // the "Jumped to this screen · Exit" bar (appended to document.body, outside
  // .cw-root) is never treated as a mock element — a click on it must not be
  // recorded into a trail, and a trail must never try to re-click it.
  const WIDGET_SURFACE_SEL = '.cw-root,.cw-bubble,.cw-banner,.cw-popup,.cw-panel,.cw-admin-panel,.cw-toast,.cw-nav,.cw-hover-outline,.cw-lightbox,.cw-reveal-bar';
  // Other Design Toolbox chrome that lives on the same page but isn't ours: the
  // shared dock, the flow-map launcher + overlay, and a mock's own version pill.
  // Clicks on these are review-tool navigation, not mock navigation — they must
  // stay out of the click trail (and out of replay), or a "Go" could re-open the
  // flow map, collapse the dock, or flip the design version mid-navigation.
  const TOOLBOX_CHROME_SEL = '.tbx-dock,.tbx-handle,.tbx-collapse-btn,.fm-switcher,.fm-launch,.fm-devnotes,.fm-overlay,.version-switcher,#loader-version-group';
  function isWidgetEl(node) {
    if (!node || !node.closest) return false;
    return !!node.closest(WIDGET_SURFACE_SEL);
  }
  // True for the widget's own surfaces OR any other toolbox chrome — the guard
  // the click trail and its replay use, so neither ever touches review tooling.
  function isToolboxEl(node) {
    if (!node || !node.closest) return false;
    return !!(node.closest(WIDGET_SURFACE_SEL) || node.closest(TOOLBOX_CHROME_SEL));
  }

  // ----- Move pin (re-anchor an existing comment via the "Move pin" button) ---
  // Same re-anchoring the drag-to-move flow does, but triggered by a button and
  // a single click on the target element — more discoverable than dragging. The
  // comment, author, replies, done state, and timestamp are untouched (the PATCH
  // only sends element + position fields); the selector, element text/HTML,
  // source file/line, screenshot, location copy, and Claude Code prompt are all
  // re-captured for the new element.
  let movePinId = null, moveOutline = null, movePanelWasOpen = false, moveThenEdit = false;

  function enterMovePinMode(pin, opts = {}) {
    if (movePinId) return;
    closePopup();
    movePinId = pin.id;
    movePanelWasOpen = state.openPanelPinId === pin.id;
    moveThenEdit = !!opts.thenEdit;
    closePanel();                            // tuck the panel away while aiming
    document.documentElement.classList.add('cw-picking');
    moveOutline = el('div', { class: 'cw-hover-outline cw-hidden' });
    document.body.appendChild(moveOutline);
    document.addEventListener('mousemove', onMoveHover, true);
    document.addEventListener('click', onMoveClick, true);
    document.addEventListener('keydown', onMoveKey, true);
    showToast(moveThenEdit
      ? 'Click a new element to move this comment — or Esc to keep it here. Then edit the text.'
      : 'Click the element to move this comment to — Esc to cancel', 'neutral');
  }

  function exitMovePinMode() {
    if (!movePinId) return;
    movePinId = null;
    moveThenEdit = false;
    document.documentElement.classList.remove('cw-picking');
    if (moveOutline) { moveOutline.remove(); moveOutline = null; }
    document.removeEventListener('mousemove', onMoveHover, true);
    document.removeEventListener('click', onMoveClick, true);
    document.removeEventListener('keydown', onMoveKey, true);
  }

  function onMoveHover(e) {
    if (isWidgetEl(e.target)) { moveOutline.classList.add('cw-hidden'); return; }
    const r = e.target.getBoundingClientRect();
    Object.assign(moveOutline.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    moveOutline.classList.remove('cw-hidden');
  }

  function onMoveKey(e) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    // Keep the comment where it is; if this was an Edit/move, still open the
    // text editor so the user can change the comment without moving it.
    const id = movePinId, wasOpen = movePanelWasOpen, thenEdit = moveThenEdit;
    exitMovePinMode();
    const pin = state.pins.find(p => p.id === id);
    if (!pin) return;
    if (thenEdit) { panelEditing = true; openPanel(pin); }
    else if (wasOpen) openPanel(pin);
  }

  async function onMoveClick(e) {
    if (isWidgetEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    const pin = state.pins.find(p => p.id === movePinId);
    const panelWasOpen = movePanelWasOpen;
    const thenEdit = moveThenEdit;
    const target = e.target;
    const cx = e.clientX, cy = e.clientY + window.scrollY;
    exitMovePinMode();
    if (!pin) return;

    const prev = { x: pin.x, y: pin.y, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY, viewState: pin.viewState, trail: pin.trail };
    const r = target.getBoundingClientRect();
    const anchor = findSourceAnchor(target);
    pin.selector = cssPath(target);
    pin.elementText = (target.innerText || target.textContent || '').trim().slice(0, 200);
    pin.elementHtml = captureOpenTag(target);
    pin.dataFile = anchor ? anchor.file : '';
    pin.dataLine = anchor ? anchor.line : '';
    pin.relX = r.width ? clamp01((e.clientX - r.left) / r.width) : 0.5;
    pin.relY = r.height ? clamp01((e.clientY - r.top) / r.height) : 0;
    pin.x = cx / window.innerWidth;
    pin.y = cy / window.innerHeight;
    pin.viewState = captureViewState(target);
    pin.trail = currentTrail();
    const patch = { url: pin.url, author: state.author || pin.author, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY, x: pin.x, y: pin.y, viewState: pin.viewState, trail: pin.trail };

    const myDragGen = (pinDragGen.get(pin.id) || 0) + 1;
    pinDragGen.set(pin.id, myDragGen);
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, patch);
      mergePin(updated);
      renderPins();
      // Reopen so the location copy, "Open in VS Code", and Claude Code prompt
      // all reflect the element just moved to. For the Edit/move flow, open the
      // panel straight into the comment editor.
      if (thenEdit) { panelEditing = true; reopenPanel(updated); }
      else if (panelWasOpen) reopenPanel(updated);
      showToast(thenEdit ? 'Moved — now edit the comment' : 'Comment moved to new element', 'success');
      // Don't let the background screenshot refresh reopen the panel over an
      // open editor (it would discard in-progress edits); the new screenshot
      // still saves and shows once editing ends.
      recaptureScreenshot(pin, target, myDragGen, thenEdit ? false : panelWasOpen);
    } catch (err) {
      Object.assign(pin, prev);
      renderPins();
      if (thenEdit) { panelEditing = true; reopenPanel(pin); }
      else if (panelWasOpen) reopenPanel(pin);
      showToast(err.message || 'Could not move comment', 'error');
    }
  }

  function onPickHover(e) {
    const target = e.target;
    if (isWidgetEl(target)) { hoverOutline.classList.add('cw-hidden'); return; }
    state.hoverEl = target;
    const r = target.getBoundingClientRect();
    Object.assign(hoverOutline.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    hoverOutline.classList.remove('cw-hidden');
  }

  function onPickKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); exitPickMode(); }
  }

  async function onPickClick(e) {
    if (isWidgetEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    const target = e.target;
    const selector = cssPath(target);
    const elementText = (target.innerText || target.textContent || '').trim().slice(0, 200);
    const elementHtml = captureOpenTag(target);
    const sourceAnchor = findSourceAnchor(target);
    const dataFile = sourceAnchor ? sourceAnchor.file : '';
    const dataLine = sourceAnchor ? sourceAnchor.line : '';
    const x = (e.clientX) / window.innerWidth;
    const y = (e.clientY + window.scrollY) / window.innerHeight;
    // Relative offset within the clicked element's box — keeps the pin anchored
    // to the element as the page scrolls or the layout reflows.
    const rect = target.getBoundingClientRect();
    const relX = rect.width ? clamp01((e.clientX - rect.left) / rect.width) : 0.5;
    const relY = rect.height ? clamp01((e.clientY - rect.top) / rect.height) : 0;
    // Snapshot the page's interaction state BEFORE leaving pick mode, so the
    // comment binds to the version/tab/toggle the user is actually looking at —
    // and the click path that led here, so "Go" can navigate back to this step.
    const viewState = captureViewState(target);
    const trail = currentTrail();
    exitPickMode();
    showToast('Capturing screenshot…', 'neutral');
    const screenshot = await captureElement(target);
    if (state.activeToast) { state.activeToast.remove(); state.activeToast = null; }
    openNewPinPopup({ x, y, relX, relY, selector, elementText, elementHtml, dataFile, dataLine, viewState, trail, screenshot, clickX: e.clientX, clickY: e.clientY + window.scrollY });
  }

  // ----- New pin popup --------------------------------------------------------
  let popup;

  function openNewPinPopup(ctx) {
    closePopup();
    const authorRow = buildAuthorRow(validate);
    const textArea = el('textarea', { placeholder: 'Describe your feedback… (⌘/Ctrl + Enter to add)', oninput: validate });
    const submit = el('button', { class: 'cw-btn cw-btn--primary', disabled: true, onclick: doSubmit }, [
      'Add feedback',
      el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
    ]);
    const cancel = el('button', { class: 'cw-btn cw-btn--secondary', onclick: () => { closePopup(); enterPickMode(); } }, ['Cancel']);
    textArea.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submit.disabled) {
        e.preventDefault(); doSubmit();
      }
    });

    function validate() { submit.disabled = !(authorRow.getValue() && textArea.value.trim()); }
    async function doSubmit() {
      submit.disabled = true;
      const author = authorRow.getValue();
      const comment = textArea.value.trim();
      localStorage.setItem('cw-author', author);
      state.author = author;
      try {
        const { pin } = await api('POST', '/pins', {
          url: pageUrl,
          product: getProduct(pageUrl),
          selector: ctx.selector,
          elementText: ctx.elementText,
          elementHtml: ctx.elementHtml,
          dataFile: ctx.dataFile,
          dataLine: ctx.dataLine,
          x: ctx.x, y: ctx.y,
          relX: ctx.relX, relY: ctx.relY,
          viewState: ctx.viewState,
          trail: ctx.trail,
          screenshot: ctx.screenshot,
          author, comment,
        });
        state.pins.push(pin);
        renderPins();
        closePopup();
        showToast('Feedback added · click another element to add more', 'success');
        enterPickMode();
      } catch (err) {
        submit.disabled = false;
        showToast(err.message || 'Could not save', 'error');
      }
    }

    popup = el('div', { class: 'cw-popup' }, [
      gripHandle(),
      el('h4', {}, ['New feedback']),
      authorRow.row,
      el('div', { class: 'cw-row' }, [el('label', {}, ['Comment']), textArea]),
      el('div', { class: 'cw-actions' }, [cancel, submit]),
    ]);
    positionFloater(popup, ctx.clickX, ctx.clickY);
    document.body.appendChild(popup);
    makeFloaterDraggable(popup, popup.querySelector('.cw-grip'));
    if (state.author) setTimeout(() => textArea.focus(), 0);
    bindOutsideClose(popup, () => { closePopup(); enterPickMode(); });
  }

  // Closes a floating surface when the user clicks/taps outside of it.
  // Skips closing when the click lands on another widget surface (toast, etc.)
  // and waits a tick so the opening click doesn't immediately close it.
  let _outsideHandler = null;
  function bindOutsideClose(surface, onClose) {
    unbindOutsideClose();
    const handler = (e) => {
      if (!surface.isConnected) { unbindOutsideClose(); return; }
      if (surface.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.cw-toast, .cw-bubble, .cw-banner, .cw-pin, .cw-lightbox')) return;
      onClose();
    };
    setTimeout(() => {
      document.addEventListener('mousedown', handler, true);
      _outsideHandler = handler;
    }, 0);
  }
  function unbindOutsideClose() {
    if (_outsideHandler) {
      document.removeEventListener('mousedown', _outsideHandler, true);
      _outsideHandler = null;
    }
  }

  function closePopup() { unbindOutsideClose(); if (popup) { popup.remove(); popup = null; } }

  function positionFloater(node, x, y) {
    const W = 360, H = 300;
    const left = Math.min(Math.max(8, x + 16), window.scrollX + window.innerWidth - W - 8);
    const top = Math.min(Math.max(window.scrollY + 8, y + 16), window.scrollY + window.innerHeight - H);
    node.style.left = left + 'px';
    node.style.top = top + 'px';
  }

  // The little dotted title-bar handle at the top of a floating surface. Grab it
  // to drag the whole card around (see makeFloaterDraggable).
  function gripHandle() {
    return el('div', { class: 'cw-grip', title: 'Drag to move' }, []);
  }

  // Lets the user drag a floating surface (comment panel / new-pin popup) around
  // by its grip handle so it doesn't cover the part of the design being reviewed.
  // The surface is position:absolute with page-coordinate left/top (set by
  // positionFloater), so we move it by the pointer delta and clamp it on screen.
  function makeFloaterDraggable(surface, handle) {
    if (!surface || !handle) return;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;          // left button only
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const origLeft = parseFloat(surface.style.left) || 0;
      const origTop = parseFloat(surface.style.top) || 0;
      let moved = false;
      surface.classList.add('cw-floater--dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        moved = true;
        const w = surface.offsetWidth, h = surface.offsetHeight;
        const maxLeft = window.scrollX + window.innerWidth - w - 8;
        const maxTop = window.scrollY + window.innerHeight - 40; // keep the grip reachable
        const nx = Math.max(window.scrollX + 8, Math.min(origLeft + (ev.clientX - startX), maxLeft));
        const ny = Math.max(window.scrollY + 8, Math.min(origTop + (ev.clientY - startY), maxTop));
        surface.style.left = nx + 'px';
        surface.style.top = ny + 'px';
      };
      const up = () => {
        surface.classList.remove('cw-floater--dragging');
        try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
        // Swallow the click that follows a real drag so it doesn't fall through.
        if (moved) handle.addEventListener('click', (c) => c.stopPropagation(), { capture: true, once: true });
      };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
    });
  }

  // Every comment that COULD be shown right now — after dropping done/deleted and
  // applying visitor-mode filtering, but IGNORING the dormant/local-hidden gates.
  // The nav hub counts these so its eye can offer "Show N comments" even while
  // the pins themselves are hidden.
  // Done = resolved: the pin disappears from the page (history is kept in the
  // activity log, and the just-marked-done toast offers a 10s Undo).
  function eligiblePins() {
    let pins = state.pins.filter(p => !p.deleted && !p.done);
    if (state.settings.visitorMode && !effectiveAdmin()) {
      pins = pins.filter(p => p.author === state.author);
    }
    return pins;
  }

  // Returns the pins this user is allowed to see right now.
  // Pins stay hidden — until pick mode reveals them — when EITHER the page is
  // dormant (comments disabled, or not on the published Pages site) OR the viewer
  // has comments locally hidden (the default; toggled by the nav hub's eye).
  // Otherwise admins see everything and non-admins respect visitor mode.
  function visiblePins() {
    if (!state.pickMode && (isDormant() || state.commentsHidden)) return [];
    return eligiblePins();
  }

  // Flip the local "show comments" state. Session-only by design — NOT persisted,
  // so a reveal lasts only until the next refresh, when the widget re-inits to
  // hidden. Hiding also closes any open panel / list so nothing is left dangling
  // over a now-clean design.
  function toggleCommentsHidden() {
    state.commentsHidden = !state.commentsHidden;
    if (state.commentsHidden) { navOpen = false; if (typeof closePanel === 'function') closePanel(); }
    renderPins();  // redraws dots (or clears them) and rebuilds the hub
  }

  // ----- Pin rendering --------------------------------------------------------
  // Dots currently on screen, so scroll/reflow can reposition them in place
  // (anchored to their element) without rebuilding the whole layer.
  let renderedPins = [];

  function renderPins() {
    // Pause the DOM observer while WE rebuild the pins layer / navigator hub —
    // otherwise our own mutations would re-trigger it.
    if (pinObserver) pinObserver.disconnect();
    pinsLayer.innerHTML = '';
    state.stranded = [];
    state.offscreen = [];
    renderedPins = [];

    pinsLayer.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + 'px';

    for (const pin of visiblePins()) {
      // Exact selector first, then a tag+text re-find for mocks that rebuilt the
      // region (see findPinEl).
      const found = findPinEl(pin);
      if (!found) {
        // Missing from the DOM is NOT the same as removed from the design. Mocks
        // rebuild whole screens (innerHTML swaps, React mounts, tabs), keeping
        // only the CURRENT screen's elements in the DOM — so an absent element
        // is, by default, just "on another screen." We stay optimistic and file
        // it under "On other screens" (navigable); it only drops to the honest
        // "Couldn't locate" bucket once an actual navigation attempt has failed
        // this session (navFailed) — that's the real evidence it's gone. This is
        // exactly the case the reviewer hit: a comment on a button that only
        // renders deep in a flow was wrongly called "removed" on the landing
        // screen; now it's "On other screens" and reappears the moment you open
        // that flow (see the pin observer + viewMatches).
        if (navFailed(pin.id)) state.stranded.push(pin);
        else state.offscreen.push(pin);
        continue;
      }
      // Element exists but isn't being shown (it's on a hidden screen/view).
      // Divert to the "On other screens" drawer rather than dropping a dot at
      // the 0×0 box a display:none element reports (which would stack pins in
      // the top-left of whatever screen is currently visible).
      if (!isRendered(found)) { state.offscreen.push(pin); continue; }
      // Element is on screen, but the comment was left in a different
      // interaction state (other version/tab/toggle). Don't pin it on top of
      // the current state — divert it to the drawer, where clicking restores
      // its state and jumps to it.
      if (!viewMatches(pin, found)) { state.offscreen.push(pin); continue; }
      const dot = makePinDot(pin);
      positionDot(dot, pin, found);
      pinsLayer.appendChild(dot);
      renderedPins.push({ pin, dot });
    }
    renderHub();
    if (pinObserver) reconnectPinObserver();
  }

  // ----- Re-anchor on DOM changes (React/SPA screen swaps) ---------------------
  // Single-file React mocks (e.g. the CallBack prototypes) mount/unmount whole
  // screens instead of toggling display, so an element a pin is anchored to is
  // GONE from the DOM until you navigate back to its screen — then it's a brand
  // new node. Resize/scroll alone won't notice. This observer re-runs renderPins
  // (debounced) whenever real page nodes are added or removed, so pins re-attach
  // to a screen the moment React mounts it. We also watch a small set of
  // attributes (class/aria/hidden) so in-place state toggles — the V1/V2
  // version switcher, tab bars — re-bucket pins too (see reconnectPinObserver).
  let pinObserver = null;
  let pinRenderQueued = false;

  function scheduleRenderPins() {
    if (pinRenderQueued) return;
    pinRenderQueued = true;
    requestAnimationFrame(() => { pinRenderQueued = false; renderPins(); });
  }

  // True when every node touched by these mutations is one of the widget's own
  // surfaces (pins, toast, panel, launcher, …). Those are OUR changes — ignore
  // them so we never loop on our own rendering.
  function recordsAreWidgetOnly(records) {
    for (const m of records) {
      if (isWidgetEl(m.target)) continue;            // mutation inside a widget surface
      // A class / aria / hidden change on a real page element means a state
      // toggle (version switch, tab change, modal show) — re-bucket the pins.
      if (m.type === 'attributes') return false;
      const nodes = [...m.addedNodes, ...m.removedNodes];
      if (nodes.some(n => n.nodeType === 1 && !isWidgetEl(n))) return false; // a real page node changed
    }
    return true;
  }

  function reconnectPinObserver() {
    if (!pinObserver) return;
    // childList: React/SPA screen mounts. attributes (class/aria/hidden): in-place
    // state toggles like the V1/V2 version switcher and tab bars, which flip an
    // "active" class without adding or removing nodes. Both decide whether a
    // pin belongs on the current view (see viewMatches / isRendered).
    pinObserver.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-current', 'aria-pressed', 'hidden'],
    });
  }

  function startPinObserver() {
    if (pinObserver || typeof MutationObserver === 'undefined') return;
    pinObserver = new MutationObserver((records) => {
      if (recordsAreWidgetOnly(records)) return;
      scheduleRenderPins();
    });
    reconnectPinObserver();
  }

  // Parse the tag name from a stored opening tag like '<button class="…">'.
  function tagFromHtml(html) {
    const m = (html || '').match(/^<([a-zA-Z][\w-]*)/);
    return m ? m[1].toLowerCase() : '';
  }

  // Parse the class list from a stored opening tag, dropping the widget's own
  // cw-* classes. Used to disambiguate a tag+text re-find.
  function classesFromHtml(html) {
    const m = (html || '').match(/\sclass\s*=\s*"([^"]*)"/i) || (html || '').match(/\sclass\s*=\s*'([^']*)'/i);
    if (!m) return [];
    return m[1].trim().split(/\s+/).filter(c => c && !c.startsWith('cw-'));
  }

  // Last-resort re-anchor when a pin's CSS selector matches nothing. The usual
  // cause is a mock that rebuilds a region with `innerHTML = …` (the Scheduling
  // dashboard does this on every search / filter / view change): the node the
  // pin was placed on is destroyed and a fresh one takes its place, so the saved
  // selector — and any :nth-of-type in it — no longer resolves. We re-find by
  // the element's captured tag + visible text, but ONLY when exactly one element
  // matches; an ambiguous match could silently move the pin somewhere wrong, so
  // we'd rather leave it stranded than guess. We compare textContent (not
  // innerText) so an element on a hidden screen still matches — it then flows
  // through isRendered/viewMatches into the navigable "Comments elsewhere"
  // drawer instead of the dead-end stranded box.
  function refindByText(pin) {
    const raw = pin.elementText || '';
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return null;
    const truncated = raw.length >= 200;   // elementText was sliced to 200 at capture
    const tag = tagFromHtml(pin.elementHtml);
    // Captured CSS classes (from the stored opening tag) further disambiguate, so
    // a deep-flow "Save" button isn't re-anchored onto a different "Save" on the
    // current screen. Required only when the original had classes; the widget's
    // own cw-* classes are ignored, and so are state classes (`is-on`, `active`,
    // …) — the element was captured WITH its then-current state, which it may no
    // longer be in (a tab pinned while active must still re-find when inactive).
    const wantClasses = classesFromHtml(pin.elementHtml).filter(c => !STATE_CLASSES.has(c));
    let nodes;
    try { nodes = document.querySelectorAll(tag || '*'); } catch (_) { return null; }
    let hit = null;
    for (const n of nodes) {
      if (isWidgetEl(n)) continue;
      if (wantClasses.length && !wantClasses.every(c => n.classList.contains(c))) continue;
      const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
      const match = truncated ? t.startsWith(text) : t === text;
      if (match) {
        if (hit) return null;   // ambiguous → bail rather than mis-place the pin
        hit = n;
      }
    }
    return hit;
  }

  // Does this node's text match what was captured on the pin at placement?
  // Compares both textContent (also works for hidden elements) and innerText
  // (what capture used), whitespace-normalized. elementText was sliced to 200
  // chars at capture, so a max-length capture matches by prefix. A pin with no
  // captured text can't be text-verified — every node passes.
  function pinTextMatches(pin, node) {
    const want = (pin.elementText || '').replace(/\s+/g, ' ').trim();
    if (!want) return true;
    const truncated = (pin.elementText || '').length >= 200;
    const ok = (t) => { t = (t || '').replace(/\s+/g, ' ').trim(); return t && (truncated ? t.startsWith(want) : t === want); };
    if (ok(node.textContent)) return true;
    try { return ok(node.innerText); } catch (_) { return false; }
  }

  // The element a pin is anchored to, on the page right now. Resolution order:
  //   1. stored selector, TEXT-VERIFIED — a selector that captured a state class
  //      (`button.cp-tab.is-on`) resolves to whichever element carries that state
  //      NOW, so even a single match is only trusted when its text agrees;
  //   2. the selector with state classes stripped, text-verified — re-finds the
  //      element by identity after its state changed (legacy pins);
  //   3. tag+text re-find for mocks that rebuilt the node (see refindByText);
  //   4. the raw selector match, as a last resort — the element's text may simply
  //      have been edited in the design since the pin was placed.
  // Returns null only when the element truly isn't present. On a re-find via
  // 2/3 we refresh the in-memory selector so every later lookup (scroll
  // repositioning, navigation) uses the fresh node.
  function findPinEl(pin) {
    const queryAll = (sel) => {
      try { return [...document.querySelectorAll(sel)].filter(x => !isWidgetEl(x)); } catch (_) { return []; }
    };
    const exact = pin.selector ? queryAll(pin.selector) : [];
    let n = exact.find(x => pinTextMatches(pin, x)) || null;
    if (!n && pin.selector && (pin.elementText || '').trim()) {
      const relaxed = stripStateClasses(pin.selector);
      if (relaxed) n = queryAll(relaxed).find(x => pinTextMatches(pin, x)) || null;
    }
    if (!n) n = refindByText(pin);
    if (!n && exact.length) n = exact[0];
    if (n && exact.indexOf(n) === -1) pin.selector = cssPath(n); // self-heal the in-memory selector
    return n;
  }

  // Is this element actually visible to the user on the CURRENT screen right
  // now — not merely present in the DOM? This is the gate that keeps a comment
  // left three clicks deep in an in-page flow (a tab, a wizard step, a clickable
  // sub-screen) from leaking onto the landing screen. A pin whose element fails
  // this check is diverted to the "Comments elsewhere" drawer instead of being
  // dropped on whatever screen happens to be showing (see renderPins).
  //
  // getClientRects() is empty for display:none / detached nodes. But hand-built
  // prototypes hide a "deep" screen many other ways that STILL report client
  // rects, so we also walk the ancestor chain and reject the element when it (or
  // any ancestor) is hidden by:
  //   • display:none / visibility:hidden  — visibility:hidden does NOT clear
  //                                          rects, and it inherits, so an
  //                                          ancestor with it hides the element
  //   • opacity:0                         — fade-out screen transitions
  //   • aria-hidden="true"                — semantically hidden panels/slides
  //   • being clipped fully outside an overflow:hidden|clip ancestor
  //                                        — off-canvas translateX/Y "slide" flows
  // An element merely scrolled out of a SCROLLABLE (auto/scroll) region still
  // counts as rendered — it's on the current screen, just out of the viewport —
  // so scroll overflow is never treated as hidden.
  function isRendered(node) {
    if (!(node instanceof Element)) return false;
    if (node.getClientRects().length === 0) return false;        // display:none / detached
    const nodeRect = node.getBoundingClientRect();
    for (let el = node; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
      if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      // Off-canvas slide: a clipping ancestor (overflow hidden/clip) whose box
      // the element sits entirely outside of. Scrollable ancestors (auto/scroll)
      // are skipped — scrolled-away content is still "on this screen".
      if (el !== node) {
        const clipsX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
        const clipsY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
        if (clipsX || clipsY) {
          const r = el.getBoundingClientRect();
          const outside =
            (clipsX && (nodeRect.right <= r.left || nodeRect.left >= r.right)) ||
            (clipsY && (nodeRect.bottom <= r.top || nodeRect.top >= r.bottom));
          if (outside) return false;
        }
      }
    }
    return true;
  }

  // Place a dot at its pin's anchor: the element's live bounding rect plus the
  // stored relative offset, in page coordinates. Falls back to legacy x/y for
  // pins saved before element anchoring existed.
  function positionDot(dot, pin, target) {
    const node = target || findPinEl(pin);
    let left, top;
    if (node && pin.relX != null && pin.relY != null) {
      const r = node.getBoundingClientRect();
      left = r.left + window.scrollX + pin.relX * r.width;
      top = r.top + window.scrollY + pin.relY * r.height;
    } else if (node) {
      const r = node.getBoundingClientRect();
      left = r.left + window.scrollX + r.width / 2;
      top = r.top + window.scrollY;
    } else {
      left = pin.x * window.innerWidth;
      top = pin.y * window.innerHeight;
    }
    dot.style.left = left + 'px';
    dot.style.top = top + 'px';
  }

  // Re-anchor every visible dot to its element. Cheap enough to run on scroll.
  function repositionDots() {
    for (const { pin, dot } of renderedPins) {
      if (dot.classList.contains('cw-pin--dragging')) continue;
      positionDot(dot, pin);
    }
  }

  // Pin ids that have already played their drop-in animation this session, so a
  // re-render (resize, mark-done, etc.) doesn't replay it — only genuinely new
  // dots pop in.
  const seenPinIds = new Set();

  function makePinDot(pin) {
    const isNew = !seenPinIds.has(pin.id);
    seenPinIds.add(pin.id);
    const dot = el('div', {
      class: 'cw-pin' + (pin.done ? ' cw-pin--done' : '') + (isNew ? ' cw-pin--enter' : ''),
      style: `background:${authorColor(pin.author)};`,
      title: `${pin.author} — ${rel(pin.timestamp)}  ·  drag to re-pin to another element`,
    }, [el('span', {}, [initial(pin.author)])]);

    // Three interaction modes on a pin:
    //   - Comment mode active → mousedown starts a drag; a click without movement
    //     opens the pin's detail panel (so comment info is viewable while placing
    //     feedback), and a drag re-pins it to another element.
    //   - This pin's detail panel is open → mousedown also starts a drag (so the
    //     user can re-pin while reading the comment); click on the pin is a no-op
    //     because the panel is already open.
    //   - Normal browse → click opens the detail panel.
    //
    // The 5-px movement threshold in onMove keeps accidental jitter from being
    // mistaken for a drag.
    let drag = null;
    dot.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const canDrag = state.pickMode || state.openPanelPinId === pin.id;
      if (!canDrag) return; // normal click → panel handler below
      e.stopPropagation(); e.preventDefault();
      drag = { sx: e.clientX, sy: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false };
      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.pickMode) return;                       // pick mode owns the pin via drag handler
      if (state.openPanelPinId === pin.id) return;      // panel already open for this pin → no-op
      openPanel(pin);
    });

    function onMove(e) {
      if (!drag) return;
      drag.lastX = e.clientX; drag.lastY = e.clientY;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
        drag.moved = true;
        dot.classList.add('cw-pin--dragging');
        showDragOutline();
      }
      if (drag.moved) {
        // Dot follows the cursor in page coords while dragging…
        dot.style.left = (e.clientX + window.scrollX) + 'px';
        dot.style.top = (e.clientY + window.scrollY) + 'px';
        // …and we outline the element it would attach to on drop.
        drag.targetEl = topElementAt(e.clientX, e.clientY);
        updateDragOutline(drag.targetEl);
      }
    }

    async function onUp(e) {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      const d = drag; drag = null;
      dot.classList.remove('cw-pin--dragging');
      hideDragOutline();
      if (!d) return;
      if (!d.moved) {
        // Click without a drag: open this pin's detail panel so its comment +
        // info are viewable even while in feedback (comment) mode. If the panel
        // is already open for this pin, leave it as-is.
        if (state.openPanelPinId !== pin.id) openPanel(pin);
        return;
      }

      const cx = (e && e.clientX != null) ? e.clientX : d.lastX;
      const cy = (e && e.clientY != null) ? e.clientY : d.lastY;
      const target = topElementAt(cx, cy);

      const prev = { x: pin.x, y: pin.y, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY, viewState: pin.viewState, trail: pin.trail };
      const patch = { url: pin.url, author: state.author || pin.author };

      // Re-anchor to whatever element we dropped on: new selector, element text,
      // opening HTML tag, source file/line, and relative offset all travel
      // with the pin. The dataFile/dataLine pair is what makes "Open in VS
      // Code" point at the *new* element after a move.
      if (target) {
        const r = target.getBoundingClientRect();
        const anchor = findSourceAnchor(target);
        pin.selector = cssPath(target);
        pin.elementText = (target.innerText || target.textContent || '').trim().slice(0, 200);
        pin.elementHtml = captureOpenTag(target);
        pin.dataFile = anchor ? anchor.file : '';
        pin.dataLine = anchor ? anchor.line : '';
        pin.relX = r.width ? clamp01((cx - r.left) / r.width) : 0.5;
        pin.relY = r.height ? clamp01((cy - r.top) / r.height) : 0;
        pin.viewState = captureViewState(target);
        pin.trail = currentTrail();
        Object.assign(patch, { selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY, viewState: pin.viewState, trail: pin.trail });
      }
      pin.x = cx / window.innerWidth;
      pin.y = (cy + window.scrollY) / window.innerHeight;
      patch.x = pin.x; patch.y = pin.y;

      positionDot(dot, pin, target); // snap to the anchored spot immediately
      const panelWasOpen = state.openPanelPinId === pin.id;
      // Bump the per-pin drag generation so a slower-to-complete background
      // screenshot capture from a *previous* drag of the same pin can detect
      // that it's stale and skip writing its result.
      const myDragGen = (pinDragGen.get(pin.id) || 0) + 1;
      pinDragGen.set(pin.id, myDragGen);
      try {
        const { pin: updated } = await api('PATCH', '/pins/' + pin.id, patch);
        mergePin(updated);
        renderPins();
        // If the user dragged a pin whose panel was open, refresh the panel so
        // the Open-in-VS-Code button reflects the new element they just
        // re-anchored to.
        if (panelWasOpen) reopenPanel(updated);
        showToast(target ? 'Pin re-anchored to element' : 'Pin moved', 'success');

        // Recapture the screenshot in the background — html2canvas takes long
        // enough (~hundreds of ms to seconds) that we don't want to block the
        // drop confirmation on it. When it finishes, PATCH again with just the
        // new image and refresh the panel if still open.
        if (target) recaptureScreenshot(pin, target, myDragGen, panelWasOpen);
      } catch (err) {
        Object.assign(pin, prev);
        renderPins();
        if (panelWasOpen) reopenPanel(pin);
        showToast(err.message || 'Could not move pin', 'error');
      }
    }

    return dot;
  }

  // ----- Comment navigator hub ------------------------------------------------
  // A single bottom-left control that accounts for EVERY comment on the page so a
  // reviewer can see the total and step through each one without hunting for
  // dots. Comments fall into three buckets, all computed in renderPins:
  //   • on this screen   → a dot on the canvas (renderedPins)
  //   • on other screens → element exists but on a hidden screen / different
  //     interaction state (state.offscreen); jumping reveals it (revealPin)
  //   • not found        → selector no longer matches (state.stranded); admin-only,
  //     since a broken pin is noise a visitor can't act on
  // Everything here is CLIENT-SIDE over already-loaded pins — counting, listing,
  // and jumping add zero Cloudflare KV reads/writes/lists.
  let navEl = null;        // hub DOM node (rebuilt on each renderPins)
  let navOpen = false;     // is the list expanded?
  let navCurrentId = null; // id of the comment the stepper last jumped to
  let navPos = null;       // {left, top} once the user drags the hub; null = default bottom-left anchor

  // Apply a dragged position to the hub container (switches it from the default
  // bottom-left anchor to an explicit top-left one) and keep it within the viewport.
  function applyNavPos() {
    if (!navEl) return;
    if (!navPos) return; // keep the CSS default (left/bottom)
    const r = navEl.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - r.width - 8);
    const maxTop = Math.max(8, window.innerHeight - r.height - 8);
    const left = Math.min(Math.max(8, navPos.left), maxLeft);
    const top = Math.min(Math.max(8, navPos.top), maxTop);
    navPos = { left, top };
    navEl.style.left = left + 'px';
    navEl.style.top = top + 'px';
    navEl.style.bottom = 'auto';
  }

  // Order on-screen pins top-to-bottom (natural reading order), then the
  // other-screens bucket, then not-found (admins only). `all` is the stepping
  // order; the named buckets drive the grouped list.
  function computeNavGroups() {
    const onScreen = renderedPins.map(rp => rp.pin).sort((a, b) => dotTopOf(a) - dotTopOf(b));
    const elsewhere = state.offscreen.slice();
    const notFound = effectiveAdmin() ? state.stranded.slice() : [];
    return { onScreen, elsewhere, notFound, all: [...onScreen, ...elsewhere, ...notFound] };
  }

  function dotTopOf(pin) {
    const rp = renderedPins.find(r => r.pin.id === pin.id);
    if (rp) { const t = parseFloat(rp.dot.style.top); if (!Number.isNaN(t)) return t; }
    return 0;
  }

  function renderHub() {
    if (navEl) { navEl.remove(); navEl = null; }

    // Count every comment that exists for this page (independent of whether the
    // pins are currently drawn), so the eye can still say "Show N comments" while
    // they're hidden. No comments at all — or a dormant page that isn't being
    // actively reviewed — means no hub.
    const eligibleTotal = eligiblePins().length;
    if (!eligibleTotal || (isDormant() && !state.pickMode)) { navOpen = false; return; }

    // Comments hidden → no hub at all. Revealing is done from the dock comment
    // button (the single show/hide control); the hub used to carry its own eye
    // toggle, but that lived in two places at once — the eye now belongs ONLY to
    // the comment button, so the hub simply doesn't appear while hidden.
    if (state.commentsHidden && !state.pickMode) { navOpen = false; return; }

    const groups = computeNavGroups();
    const total = groups.all.length;

    const idx = groups.all.findIndex(p => p.id === navCurrentId);
    const pos = idx >= 0 ? `${idx + 1} / ${total}` : `– / ${total}`;

    // Grip handle: drag it to move the whole hub aside so you can see/click the
    // elements underneath. Double-click resets it to the default bottom-left spot.
    const grip = el('button', {
      type: 'button', class: 'cw-nav-grip',
      title: 'Drag to move · double-click to reset',
      'aria-label': 'Move comment bar',
      ondblclick: () => { navPos = null; renderHub(); },
    }, ['⠿']);
    grip.addEventListener('pointerdown', startNavDrag);

    const bar = el('div', { class: 'cw-nav-bar' }, [
      grip,
      el('button', {
        type: 'button', class: 'cw-nav-count',
        title: navOpen ? 'Hide comment list' : 'Show all comments on this page',
        onclick: toggleNavList,
      }, [
        el('span', { class: 'cw-nav-glyph', 'aria-hidden': 'true' }, ['💬']),
        el('span', { class: 'cw-nav-count-label' }, [`${total} comment${total === 1 ? '' : 's'}`]),
        el('span', { class: 'cw-nav-caret', 'aria-hidden': 'true' }, [navOpen ? '▾' : '▴']),
      ]),
      el('span', { class: 'cw-nav-div', 'aria-hidden': 'true' }),
      el('button', { type: 'button', class: 'cw-nav-step', title: 'Previous comment', 'aria-label': 'Previous comment', onclick: () => stepNav(-1) }, ['‹']),
      el('span', { class: 'cw-nav-pos' }, [pos]),
      el('button', { type: 'button', class: 'cw-nav-step', title: 'Next comment', 'aria-label': 'Next comment', onclick: () => stepNav(1) }, ['›']),
    ]);

    // List first, bar last: the container is anchored at the bottom, so the list
    // expands upward above the bar.
    navEl = el('div', { class: 'cw-nav' }, [
      navOpen ? buildNavList(groups) : null,
      bar,
    ]);
    document.body.appendChild(navEl);
    applyNavPos(); // restore a dragged position after the rebuild
  }

  // Drag the hub by its grip. Tracks the pointer and writes left/top live; the
  // position persists in navPos so it survives the hub's frequent re-renders.
  function startNavDrag(e) {
    if (e.button != null && e.button !== 0) return; // primary button / touch only
    e.preventDefault();
    const r = navEl.getBoundingClientRect();
    const offsetX = e.clientX - r.left;
    const offsetY = e.clientY - r.top;
    navEl.classList.add('cw-nav--dragging');

    const onMove = (ev) => {
      navPos = { left: ev.clientX - offsetX, top: ev.clientY - offsetY };
      applyNavPos();
    };
    const onUp = () => {
      navEl.classList.remove('cw-nav--dragging');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  function buildNavList(groups) {
    const list = el('div', { class: 'cw-nav-list' });
    const section = (title, pins, opts = {}) => {
      if (!pins.length) return;
      list.appendChild(el('div', { class: 'cw-nav-group' }, [
        el('div', { class: 'cw-nav-group-title' }, [`${title} (${pins.length})`]),
        ...pins.map(pin => navItem(pin, opts)),
      ]));
    };
    section('On this screen', groups.onScreen);
    section('On other screens', groups.elsewhere, { elsewhere: true });
    section('Couldn’t locate', groups.notFound, { notFound: true });
    return list;
  }

  function navItem(pin, opts = {}) {
    const stateLabel = viewStateLabel(pin);
    const canNav = hasNavInfo(pin);
    const title = opts.notFound
      ? 'Open this comment — a navigation attempt couldn’t find its element (it may be deeper in a flow, or removed)'
      : opts.elsewhere
        ? (canNav
            ? 'Go — switches the mock to this comment’s screen/state and opens it there'
            : 'Not on this screen. This older comment has no saved path — open its flow in the mock and the pin appears. Click to see details.')
        : 'Jump to this comment';
    return el('div', {
      class: 'cw-nav-item' + (pin.id === navCurrentId ? ' cw-nav-item--current' : ''),
      title,
      // Clicking a list item is an explicit "take me there" — it may offer a
      // reload to reach a deep-flow step. (The Prev/Next stepper does not.)
      onclick: () => { navCurrentId = pin.id; jumpToPin(pin, { allowReload: true }); renderHub(); },
    }, [
      el('div', { class: 'cw-nav-avatar', style: `background:${authorColor(pin.author)};` }, [initial(pin.author)]),
      el('div', { class: 'cw-nav-item-body' }, [
        el('div', { class: 'cw-nav-item-meta' }, [el('strong', {}, [pin.author]), ' · ' + rel(pin.timestamp)]),
        el('div', { class: 'cw-nav-item-text' }, [(pin.comment || '').slice(0, 120) || '(no text)']),
        opts.notFound
          ? el('div', { class: 'cw-nav-item-ctx' }, ['⚠ Not on the current screen — couldn’t auto-locate (deeper in a flow, or removed)'])
          : opts.elsewhere
            ? el('div', { class: 'cw-nav-item-ctx' }, ['◫ Not on this screen' + (stateLabel ? ' — on: ' + stateLabel : '') + (canNav ? ' · Go opens it' : ' · open its flow to see it')])
            : (stateLabel ? el('div', { class: 'cw-nav-item-ctx' }, ['◫ ' + stateLabel]) : null),
        (!opts.notFound && pin.elementText) ? el('div', { class: 'cw-nav-item-ctx' }, ['↳ ' + pin.elementText.slice(0, 60)]) : null,
      ]),
      el('span', { class: 'cw-nav-go' }, [opts.notFound ? 'Open →' : 'Go →']),
    ]);
  }

  function toggleNavList() { navOpen = !navOpen; renderHub(); }
  function closeNavList() { if (navOpen) { navOpen = false; renderHub(); } }

  // Step to the next/prev comment in the unified order, wrapping around. The
  // order is recomputed each step so it stays correct as a reveal moves a
  // comment from "other screens" onto the canvas.
  function stepNav(dir) {
    const all = computeNavGroups().all;
    if (!all.length) return;
    let idx = all.findIndex(p => p.id === navCurrentId);
    idx = idx < 0 ? (dir > 0 ? 0 : all.length - 1) : (idx + dir + all.length) % all.length;
    const pin = all[idx];
    navCurrentId = pin.id;
    // The stepper is a low-intent skim — never let it reload the page out from
    // under the reviewer. Deep-flow steps it can't reach in place just open the
    // detached panel; the user can hit "Go" in the list for the full navigation.
    jumpToPin(pin, { allowReload: false });
    renderHub(); // refresh the "k / N" readout + current-item highlight
  }

  // Route a jump to the right mechanism based on the comment's bucket. On-screen
  // and "not found" are local DOM work; the off-screen path may drive the mock's
  // own navigation (and, only when opts.allowReload, offer a reload).
  function jumpToPin(pin, opts = {}) {
    const rp = renderedPins.find(r => r.pin.id === pin.id);
    if (rp) {                                    // on this screen → scroll, open, pulse
      const target = findPinEl(pin);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      openPanel(pin);
      pulseDot(rp.dot);
      return;
    }
    if (state.offscreen.some(p => p.id === pin.id)) { revealPin(pin, { allowReload: opts.allowReload }); return; }
    openPanel(pin, { stranded: true });          // not found → off-page panel
  }

  // Briefly ring the dot so the eye lands on it after a jump. Re-adding the class
  // after a forced reflow restarts the animation on repeat jumps to the same dot.
  function pulseDot(dot) {
    dot.classList.remove('cw-pin--pulse');
    void dot.offsetWidth;
    dot.classList.add('cw-pin--pulse');
  }

  // ----- Reveal a comment's view and open it ----------------------------------
  // revealPin (above) first restores the comment's captured interaction state
  // (clicking the version/tab/toggle controls it was left in). The helpers here
  // handle the second case — a hidden ancestor (display:none screen) that the
  // state restore didn't reach. We can't know how an arbitrary mock switches
  // screens, so this works structurally: walk up to each hidden ancestor and
  // turn it on the way the mock most likely does — by mirroring the "active"
  // class a visible sibling screen carries (preserves the mock's own layout),
  // falling back to a forced display override. Every forced mutation is
  // recorded so "Exit" restores the page exactly. Only one peek is active at a
  // time. (State restored via clicks is real navigation and is NOT undone.)
  let revealUndo = [];
  let revealBar = null;

  const classTokens = (elt) => (typeof elt.className === 'string' ? elt.className.trim().split(/\s+/).filter(Boolean) : []);
  // Sibling that plausibly belongs to the same screen group: same tag, or shares a class.
  function isScreenSibling(a, b) {
    if (a.tagName === b.tagName) return true;
    const bt = classTokens(b);
    return classTokens(a).some(t => bt.includes(t));
  }

  function recordClassAdd(elt, cls) { if (!elt.classList.contains(cls)) { revealUndo.push({ t: 'cls-remove', elt, cls }); elt.classList.add(cls); } }
  function recordClassRemove(elt, cls) { if (elt.classList.contains(cls)) { revealUndo.push({ t: 'cls-add', elt, cls }); elt.classList.remove(cls); } }
  function recordAttrRemove(elt, attr) { if (elt.hasAttribute(attr)) { revealUndo.push({ t: 'attr-add', elt, attr, val: elt.getAttribute(attr) }); elt.removeAttribute(attr); } }
  function recordStyle(elt, prop, val, important) {
    revealUndo.push({ t: 'style', elt, prop, prev: elt.style.getPropertyValue(prop), prevPri: elt.style.getPropertyPriority(prop) });
    elt.style.setProperty(prop, val, important ? 'important' : '');
  }

  function restoreReveal() {
    for (let i = revealUndo.length - 1; i >= 0; i--) {
      const u = revealUndo[i];
      try {
        if (u.t === 'cls-add') u.elt.classList.add(u.cls);
        else if (u.t === 'cls-remove') u.elt.classList.remove(u.cls);
        else if (u.t === 'attr-add') u.elt.setAttribute(u.attr, u.val);
        else if (u.t === 'style') {
          if (u.prev) u.elt.style.setProperty(u.prop, u.prev, u.prevPri);
          else u.elt.style.removeProperty(u.prop);
        }
      } catch (_) {}
    }
    revealUndo = [];
  }

  // Make one hidden container visible, preferring the mock's own activation.
  function revealContainer(H) {
    const parent = H.parentElement;
    const screenSibs = parent
      ? Array.from(parent.children).filter(s => s !== H && s.nodeType === 1 && isScreenSibling(H, s) && isRendered(s))
      : [];

    // Class-activator: a visible sibling has all of H's classes plus extra
    // tokens (e.g. "active"/"current"). Copy those onto H, strip them off the
    // siblings — this is exactly what the mock's own click handler tends to do.
    for (const s of screenSibs) {
      const extra = classTokens(s).filter(t => !H.classList.contains(t));
      const missing = classTokens(H).filter(t => !s.classList.contains(t));
      if (extra.length && !missing.length) {
        extra.forEach(t => recordClassAdd(H, t));
        screenSibs.forEach(o => extra.forEach(t => recordClassRemove(o, t)));
        break;
      }
    }

    if (H.hasAttribute('hidden')) recordAttrRemove(H, 'hidden');

    // Whatever the mock used, if H still isn't painting, force it — and hide the
    // sibling screens so they don't stack on top of it. Mirror a visible
    // sibling's display value (flex/grid/block) to keep the revealed screen's
    // internal layout intact.
    if (!isRendered(H)) {
      const model = screenSibs.find(isRendered) || screenSibs[0];
      const disp = model ? getComputedStyle(model).display : 'block';
      recordStyle(H, 'display', disp === 'none' ? 'block' : disp, true);
      recordStyle(H, 'visibility', 'visible', true);
      screenSibs.forEach(s => { if (isRendered(s)) recordStyle(s, 'display', 'none', true); });
    }
  }

  async function revealPin(pin, opts = {}) {
    // One navigation owns the page at a time. A second jump (fast stepper taps,
    // an impatient double-click) while a multi-second replay is mid-flight would
    // interleave two click sequences and land nowhere — ignore it.
    if (navigating) { showToast('Still navigating to the previous comment…', 'neutral'); return; }
    navigating = true;
    // Navigating TO a specific comment always means the user wants to SEE it, so
    // force comments shown. This is deliberate: after a "Go" that reloads the
    // mock (deep-flow navigation), the fresh load would otherwise re-hide
    // comments (hidden-by-default) and swallow the very comment being navigated
    // to. Someone stepping the list wants the comment, not the clean default.
    state.commentsHidden = false;
    closeNavList();
    hideRevealBar();   // clear any stale "Exit" bar from a previous peek
    restoreReveal();   // drop any previous peek before starting a new one
    try {
      // Step 0a: if the comment is bound to a flow-map node and the host exposes
      // its state driver, jump straight there — deterministic and reload-free.
      // Fully guarded: no flow binding, no flow map, or a throwing driver all just
      // fall through to the trail/viewState path below, so behavior is unchanged
      // for every mock that isn't a flow-map mock.
      const flow = flowStateOf(pin);
      if (flow) {
        const applyFn = window[flowApplyName()];
        if (typeof applyFn === 'function') {
          try { applyFn(flow); await settle(160); } catch (_) {}
        }
      }

      // Step 0b (only after our own reload): re-walk the recorded click path from
      // the mock's fresh landing state — this is what reaches screens/modals that
      // only exist after the user's own clicks built them. Keep the progress so a
      // partial replay can fall back to the nearest reachable step below.
      let replay = null;
      if (opts.fromReload && hasTrail(pin)) replay = await replayTrail(pin);

      // Step 1: drive the mock into this comment's interaction state by clicking
      // its captured controls (version, tab, toggle) over a few settle-rounds.
      await driveToViewState(pin);

      const target = findPinEl(pin);
      if (!target) {
        const canNav = hasNavInfo(pin);
        // With a real path (trail / captured controls) we can try a reload:
        // a fresh landing state lets the trail replay reach the step. Reloading
        // is destructive, so it's offered only behind a confirm, on explicit
        // Go, and never twice.
        if (canNav && !opts.fromReload && opts.allowReload && confirmNavReload(pin)) return;
        if (replay && replay.reached > 0 && replay.lastNode && isRendered(replay.lastNode)) {
          // The exact element wasn't found, but the trail replay got us partway.
          // Land the reviewer at the NEAREST reachable step instead of nowhere,
          // and say how far it got — the remaining clicks couldn't be resolved
          // (the deeper screen may have changed, or the element was removed).
          markNavFailed(pin.id);
          try { replay.lastNode.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
          showToast(`Showed the nearest saved step (${replay.reached} of ${replay.total}) — couldn’t reach the element itself. Use the selector in the panel.`, 'neutral');
        } else if (canNav) {
          // We had a path and still couldn't reach it — strong evidence it's
          // gone. Mark failed so it moves to the honest "Couldn't locate" bucket.
          markNavFailed(pin.id);
          showToast('Couldn’t auto-navigate to that element — it may be deeper in a flow, or removed. See the selector in the panel.', 'neutral');
        } else {
          // No saved path (older comment). The element likely lives on another
          // screen we can't drive to — DON'T call it removed and DON'T mark it
          // failed; leave it under "On other screens" and tell the reviewer to
          // open that flow themselves, at which point the pin reappears on its own.
          showToast('This is an older comment with no saved navigation path. Open its screen/flow in the mock and the pin will appear there.', 'neutral');
        }
        renderPins();
        openPanel(pin, { stranded: true });
        return;
      }

      // Step 2: reveal any hidden ancestors outermost-first (single-file mocks
      // that toggle display:none), so each inner check sees its parent shown.
      const chain = [];
      for (let n = target; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) chain.push(n);
      for (let i = chain.length - 1; i >= 0; i--) {
        if (!isRendered(chain[i])) revealContainer(chain[i]);
      }

      // Let layout settle, then re-render (the dot returns to the canvas),
      // scroll the element into view, open its panel, and offer a way back.
      await settle(60);
      renderPins();
      if (isRendered(target) && viewMatches(pin, target)) {
        clearNavFailed(pin.id);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openPanel(pin);
        const rp = renderedPins.find(r => r.pin.id === pin.id);
        if (rp) pulseDot(rp.dot);
        if (revealUndo.length) showRevealBar(); // only offer "Exit" if we force-revealed a screen
      } else {
        // The element exists but we couldn't fully switch to its view. After our
        // own reload attempt that's as far as we get — mark it failed so the next
        // "Go" doesn't reload again forever; it moves to the honest "Not found"
        // bucket instead.
        if (opts.fromReload) markNavFailed(pin.id);
        renderPins();
        openPanel(pin, { stranded: true });
        showToast('Couldn’t fully switch to that view — showing the comment here', 'neutral');
      }
    } finally {
      navigating = false;
    }
  }

  function showRevealBar() {
    hideRevealBar();
    revealBar = el('div', { class: 'cw-reveal-bar' }, [
      el('span', {}, ['👀 Jumped to this comment’s screen']),
      el('button', { type: 'button', onclick: exitReveal }, ['Exit']),
    ]);
    document.body.appendChild(revealBar);
  }
  function hideRevealBar() { if (revealBar) { revealBar.remove(); revealBar = null; } }

  function exitReveal() {
    if (!revealUndo.length && !revealBar) return;
    closePanel();
    restoreReveal();
    hideRevealBar();
    renderPins(); // the comment returns to the navigator's "On other screens" group
  }

  // ----- Pin detail panel -----------------------------------------------------
  let panel, panelEditing = false;

  function closePanel() {
    unbindOutsideClose();
    if (panel) { panel.remove(); panel = null; }
    state.openPanelPinId = null;
    panelEditing = false;
  }

  function openPanel(pin, opts = {}) {
    closePanel();
    if (opts.editing) panelEditing = true;
    state.openPanelPinId = pin.id;
    panel = renderPanel(pin, opts);
    if (opts.keepPos) {
      // Re-render (edit / reply / done) of the same pin — stay where the user
      // left it rather than snapping back to the pin.
      panel.style.left = opts.keepPos.left;
      panel.style.top = opts.keepPos.top;
    } else {
      let x, y;
      if (opts.stranded || !findPinEl(pin)) {
        x = window.scrollX + window.innerWidth - 400;
        y = window.scrollY + 80;
      } else {
        x = pin.x * window.innerWidth;
        y = pin.y * window.innerHeight;
      }
      positionFloater(panel, x, y);
    }
    document.body.appendChild(panel);
    makeFloaterDraggable(panel, panel.querySelector('.cw-grip'));
    bindOutsideClose(panel, () => closePanel());
  }

  function renderPanel(pin, opts = {}) {
    const isEditing = panelEditing;
    const stripped = state.settings.visitorMode && !effectiveAdmin();
    // Shown only when the panel opened detached from its element (stranded):
    // say plainly why there's no pin on the canvas for it.
    const strandedNote = opts.stranded
      ? el('div', { class: 'cw-panel-stranded' }, ['⚠ This comment’s element isn’t on the current screen — it may be deeper in a flow, or removed. Use the selector below to find it.'])
      : null;
    // Recorded click path — a collapsible list of the clicks that reach this
    // element. Shows reviewers there's a deeper flow (even when auto-nav can't
    // run) and gives devs the exact interaction sequence.
    const pathSteps = pathLabels(pin);
    const pathNote = pathSteps.length
      ? el('details', { class: 'cw-panel-path' }, [
          el('summary', {}, [`🧭 Path to this element · ${pathSteps.length} click${pathSteps.length > 1 ? 's' : ''}`]),
          el('ol', { class: 'cw-path-steps' }, pathSteps.map(t => el('li', {}, [t]))),
        ])
      : null;
    const closeBtn = el('button', { class: 'cw-panel-close', onclick: closePanel, 'aria-label': 'Close' }, ['×']);
    const avatar = el('div', { class: 'cw-panel-avatar', style: `background:${authorColor(pin.author)};` }, [initial(pin.author)]);
    const sl = viewStateLabel(pin);
    // Name only on the header row — the timestamp (and any scene label) moves down
    // to the FEEDBACK label row so avatar + name + Done/Edit/Delete share one line.
    const meta = el('div', { class: 'cw-panel-meta' }, [
      el('strong', {}, [pin.author]),
    ]);

    // Management actions — quiet and compact, docked in the header so they don't
    // add a tall row or compete with the feedback. Done reads as "Mark done";
    // Edit and Delete collapse to icons. (Open-in-VS-Code was removed — it didn't
    // work reliably from inside the panel.)
    const doneBtn = el('button', {
      class: 'cw-act cw-act--done' + (pin.done ? ' cw-act--is-done' : ''),
      title: pin.done ? 'Reopen this comment' : 'Mark this comment done',
      onclick: (e) => { e.stopPropagation(); onDone(pin); },
    }, [faIcon(pin.done ? 'rotate-left' : 'check'), el('span', {}, [pin.done ? 'Reopen' : 'Mark done'])]);
    const editBtn = el('button', {
      class: 'cw-act cw-act--icon', title: 'Edit the comment text', 'aria-label': 'Edit',
      onclick: (e) => { e.stopPropagation(); reopenPanel(pin, { editing: true }); },
    }, [faIcon('pen')]);
    const deleteBtn = el('button', {
      class: 'cw-act cw-act--icon cw-act--danger', title: 'Delete this comment', 'aria-label': 'Delete',
      onclick: (e) => { e.stopPropagation(); onDelete(pin); },
    }, [faIcon('trash')]);
    const headActions = el('div', { class: 'cw-head-actions' }, [doneBtn, editBtn, deleteBtn]);

    // Single-line header: avatar + name on the left, then Done / Edit / Delete and
    // the ✕ close all on the same row (the name's flex:1 pushes them right). In
    // stripped (visitor) mode there's no author identity, so a flex spacer keeps
    // the controls pushed to the right.
    const head = stripped
      ? el('div', { class: 'cw-panel-head' }, [el('div', { class: 'cw-panel-meta' }), headActions, closeBtn])
      : el('div', { class: 'cw-panel-head' }, [avatar, meta, headActions, closeBtn]);

    // FEEDBACK — the hero. When editing, this slot becomes the editor.
    let feedback;
    if (isEditing) {
      const ta = el('textarea', { style: 'width:100%;min-height:80px;border:1px solid #d1d5db;border-radius:4px;padding:6px 8px;font:inherit;', placeholder: 'Edit comment… (⌘/Ctrl + Enter to save)' });
      ta.value = pin.comment || '';
      async function doSave() {
        try {
          const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, comment: ta.value.trim() });
          mergePin(updated);
          panelEditing = false; reopenPanel(updated);
          showToast('Updated', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      }
      const save = el('button', { class: 'cw-btn cw-btn--primary cw-btn--small', onclick: doSave }, [
        'Save',
        el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
      ]);
      const cancel = el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small', onclick: () => { panelEditing = false; reopenPanel(pin); } }, ['Cancel']);
      ta.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doSave(); }
      });
      feedback = el('div', { class: 'cw-feedback' }, [ta, el('div', { class: 'cw-actions', style: 'margin-top:6px;' }, [cancel, save])]);
    } else {
      feedback = el('div', { class: 'cw-feedback' }, [pin.comment || '(no feedback text)']);
    }
    const feedbackLabel = el('div', { class: 'cw-feedback-label' }, [
      el('span', {}, ['Feedback']),
      el('span', { class: 'cw-feedback-time' }, [rel(pin.timestamp) + (sl ? ' · on ' + sl : '')]),
    ]);

    // Element screenshot, moved to the TOP so you see WHAT the comment is on
    // before reading it. (Not shown in stripped/visitor mode.)
    const shot = (pin.screenshot && !stripped)
      ? el('div', { class: 'cw-panel-shot', title: 'Click to enlarge', onclick: () => openLightbox(pin.screenshot) }, [el('img', { src: pin.screenshot, alt: 'the element this comment is on' })])
      : null;

    // Ready-to-paste Claude Code prompt — the "take it to Claude Code" step,
    // after the feedback. Also carries the CSS selector, which is how you locate
    // the element for a stranded/deep-flow comment.
    let claude = null;
    if (!stripped) {
      const prompt = claudePrompt(pin);
      claude = el('div', { class: 'cw-panel-claude' }, [
        el('div', { class: 'cw-claude-head' }, [
          el('span', { class: 'cw-claude-label' }, ['🤖 For Claude Code']),
          el('button', {
            class: 'cw-btn cw-btn--secondary cw-btn--small',
            title: 'Copy this prompt, then paste it into Claude Code to jump to the element',
            onclick: (e) => { e.stopPropagation(); copyText(prompt, 'Prompt copied — paste into Claude Code'); },
          }, ['📋 Copy']),
        ]),
        el('code', { class: 'cw-claude-text', title: prompt }, [prompt]),
      ]);
    }

    // Reply thread — hidden for now (REPLIES_ENABLED) to keep the panel focused.
    const thread = REPLIES_ENABLED
      ? el('div', { class: 'cw-thread' }, [
          ...(pin.thread || []).map(r => el('div', { class: 'cw-reply' }, [
            el('div', { class: 'cw-reply-head' }, [el('strong', {}, [r.author]), rel(r.timestamp)]),
            el('div', { class: 'cw-reply-text' }, [r.text]),
          ])),
          buildReplyForm(pin),
        ])
      : null;

    // Order top→bottom: identity + quiet actions · (stranded note) · (path) ·
    // screenshot (what) · FEEDBACK (why — the hero) · Claude Code (act on it) ·
    // replies.
    return el('div', { class: 'cw-panel' + (stripped ? ' cw-panel--mini' : '') }, [
      gripHandle(), head, strandedNote, pathNote, shot, feedbackLabel, feedback, claude, thread,
    ]);
  }

  function reopenPanel(pin, opts = {}) {
    // Preserve the current on-screen position so an edit/reply/done re-render
    // keeps the panel where the user dragged it instead of snapping to the pin.
    const keepPos = (panel && !opts.stranded) ? { left: panel.style.left, top: panel.style.top } : null;
    closePanel();
    openPanel(pin, keepPos ? { keepPos, ...opts } : opts);
  }

  function buildReplyForm(pin) {
    const authorRow = buildAuthorRow(validate);
    const text = el('textarea', { placeholder: 'Add a reply… (⌘/Ctrl + Enter)', oninput: validate });
    const submit = el('button', { class: 'cw-btn cw-btn--primary cw-btn--small', disabled: true, onclick: doSubmit }, [
      'Reply',
      el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
    ]);
    text.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submit.disabled) {
        e.preventDefault(); doSubmit();
      }
    });
    function validate() { submit.disabled = !(authorRow.getValue() && text.value.trim()); }
    async function doSubmit() {
      submit.disabled = true;
      const author = authorRow.getValue();
      const body = text.value.trim();
      localStorage.setItem('cw-author', author);
      state.author = author;
      try {
        const { pin: updated } = await api('POST', `/pins/${pin.id}/replies`, { url: pin.url, author, text: body });
        mergePin(updated);
        reopenPanel(updated);
        showToast('Reply added', 'success');
      } catch (e) {
        submit.disabled = false;
        showToast(e.message, 'error');
      }
    }
    return el('div', { class: 'cw-reply-form' }, [authorRow.row, text, el('div', { class: 'cw-actions' }, [submit])]);
  }

  // ----- Done / Delete / Undo -------------------------------------------------
  async function onDone(pin) {
    const wasDone = !!pin.done;
    const next = !wasDone;
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, done: next });
      mergePin(updated);
      closePanel();
      renderPins();
      if (next) {
        showToast('Marked complete', 'success', {
          undoLabel: 'Undo',
          onUndo: () => undo(pin.id, pin.url),
        });
      } else {
        showToast('Reopened', 'success');
      }
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function onDelete(pin) {
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, deleted: true });
      mergePin(updated);
      closePanel();
      renderPins();
      showToast('Deleted', 'success', {
        undoLabel: 'Undo',
        onUndo: () => undo(pin.id, pin.url),
      });
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function undo(pinId, url) {
    try {
      const { pin: updated } = await api('POST', `/pins/${pinId}/undo`, { url, author: state.author });
      mergePin(updated);
      renderPins();
      showToast('Undone', 'neutral');
    } catch (e) {
      if (e.status === 409) showToast('Undo window expired — change could not be reverted', 'error');
      else showToast(e.message, 'error');
    }
  }

  function mergePin(updated) {
    const i = state.pins.findIndex(p => p.id === updated.id);
    if (i >= 0) state.pins[i] = updated; else state.pins.push(updated);
  }

  // ----- Lightbox -------------------------------------------------------------
  function openLightbox(src) {
    const lb = el('div', { class: 'cw-lightbox', onclick: () => lb.remove() }, [el('img', { src })]);
    document.body.appendChild(lb);
  }

  // ----- Init -----------------------------------------------------------------
  async function init() {
    buildRoot();
    window.addEventListener('resize', () => renderPins());
    // Pins are anchored to elements — keep them glued as the page scrolls/reflows.
    window.addEventListener('scroll', () => repositionDots(), { passive: true });
    // Late layout shifts are the norm on data-driven mocks: fonts/images finish
    // loading, async data widens a column, a dashboard re-lays-out after its
    // charts mount — all of which MOVE an already-anchored element without
    // touching its DOM, so the pin observer never fires and a dot placed at the
    // element's first-paint position is left stranded a few pixels (or a whole
    // tab) away. Re-glue dots on `load` and whenever the document box resizes.
    window.addEventListener('load', () => repositionDots());
    if (typeof ResizeObserver !== 'undefined') {
      let rAF = 0;
      const ro = new ResizeObserver(() => {
        if (rAF) return;
        rAF = requestAnimationFrame(() => { rAF = 0; repositionDots(); });
      });
      try { ro.observe(document.documentElement); } catch (_) {}
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePopup(); closePanel(); closeNavList(); exitReveal(); } });
    // Record the user's real clicks (capture phase, before any mock handler can
    // stop propagation) — each new comment snapshots this trail so "Go" can
    // navigate back to the exact step it was left on. Observation only.
    document.addEventListener('click', recordTrailClick, true);
    loadComments();
  }

  // Load pins + settings from the Worker and do the first render. Split out from
  // init() so a failed load can offer a Retry that re-runs only this step.
  async function loadComments() {
    try {
      const [pinsRes, settingsRes] = await Promise.all([
        api('GET', '/pins?url=' + encodeURIComponent(pageUrl)),
        api('GET', '/settings?url=' + encodeURIComponent(pageUrl)).catch(() => ({ settings: { visitorMode: false, commentsDisabled: false } })),
      ]);
      state.pins = pinsRes.pins || [];
      state.settings = settingsRes.settings || state.settings;
      applyAdminBubble();
      renderPins();
      // Watch for SPA/React screen swaps so pins re-attach when their screen
      // (re)mounts. Started after the first render so the initial paint isn't
      // double-rendered. renderPins() pauses/resumes it around its own work.
      // startPinObserver() guards against double-starting, so a Retry is safe.
      startPinObserver();
      // Finish a "Go" navigation that reloaded the page: from the mock's fresh
      // landing state, replay the pin's click trail / restore its view state.
      const resume = pendingNavResume();
      if (resume) {
        const pin = state.pins.find(p => p.id === resume.id);
        if (pin) {
          navCurrentId = pin.id;
          // The reload just re-hid comments (hidden-by-default). The user was
          // mid-navigation to THIS comment — keep them shown so it's visible the
          // moment we arrive, not swallowed by the clean default.
          state.commentsHidden = false;
          showToast('Navigating to the comment…', 'neutral');
          await settle(350); // give the mock's own boot render a moment
          revealPin(pin, { fromReload: true });
        }
      }
    } catch (e) {
      console.warn('[cw] failed to load pins', e);
      // Surface the failure ONLY on the published Pages site, where the backend
      // is expected to answer and an empty page would otherwise be mistaken for
      // "no comments." Off-Pages (localhost / file:// / preview) the Worker's
      // CORS blocks the request by design and the widget is dormant — staying
      // silent there avoids crying wolf on every local load.
      if (IS_GITHUB_PAGES) {
        showToast('Couldn’t load comments — the feedback server didn’t respond', 'error', {
          undoLabel: 'Retry',
          onUndo: loadComments,
        });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
