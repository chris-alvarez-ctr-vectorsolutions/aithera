// ux-mockups feedback widget
// Embed: <script src="/commentwidget/feedback-widget.js"></script>

(() => {
  // ----- Config ---------------------------------------------------------------
  const CW_WORKER_URL = 'https://ux-mockups-feedback.vectorsolutions-ux.workers.dev';
  const WIDGET_VERSION = '1.10.5';
  const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  if (window.__cwWidgetLoaded) return;
  window.__cwWidgetLoaded = WIDGET_VERSION;

  // ----- State ----------------------------------------------------------------
  const state = {
    pins: [],
    stranded: [],
    author: localStorage.getItem('cw-author') || '',
    isAdmin: localStorage.getItem('cw-admin') === '1',
    settings: { visitorMode: false, commentsDisabled: false },
    pickMode: false,
    hoverEl: null,
    openPanelPinId: null,
    activeToast: null,
  };

  // Comments are keyed by a canonical page URL, NOT the raw location.href, so
  // the same mock shows the same comments whether it's viewed on GitHub Pages,
  // a local Live Server (localhost), or a file:// path. We rebuild the canonical
  // GitHub Pages URL from the `/products/...` portion of the path (the same
  // derivation the Share Link pill uses) and treat `/index.html` as the
  // directory form so `…/folder/` and `…/folder/index.html` collapse together.
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

  // Always point at the published viewer on GitHub Pages, regardless of where
  // the mock itself is being viewed (staging server, localhost, file://). The
  // viewer only works there anyway — it's the one origin the Worker's CORS
  // allows and the only place log.html is published.
  const LOG_URL = PAGES_BASE + '/commentwidget/log.html';
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
.cw-bubble:hover .cw-bubble-icon { transform: scale(1.12); }
.cw-bubble--active { background: linear-gradient(140deg, #ef4444, #dc2626); font-size: 18px; animation: cw-pulse-ring 1.8s ease-out infinite; }
.cw-bubble--active:hover { transform: scale(1.12) rotate(8deg); }
/* Comments-off: the bubble fades fully out so it doesn't clutter the page, but it stays in the DOM and clickable for everyone (admins and visitors). Clicking it opens comment mode and reveals the pins; the bubble becomes visible again while comment mode is active, so it can be exited. No hotkey needed. */
.cw-bubble--ghost { opacity: 0; }
.cw-bubble--ghost:hover { transform: none; }
.cw-bubble--ghost.cw-bubble--active { opacity: 1; }
.cw-bubble-tip { position: absolute; top: 58px; right: 0; background: #111827; color: #fff; padding: 7px 11px; border-radius: 8px; font-size: 12px; font-weight: 500; white-space: nowrap; opacity: 0; transform: translateY(-4px); pointer-events: none; transition: opacity .18s, transform .18s; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
.cw-bubble:hover .cw-bubble-tip { opacity: 1; transform: translateY(0); }
.cw-banner { position: fixed; top: 28px; right: 80px; z-index: 2147483640; background: linear-gradient(140deg, #1f2937, #111827); color: #fff; padding: 8px 8px 8px 16px; border-radius: 999px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 22px rgba(17,24,39,.3); border: 1px solid rgba(255,255,255,.08); }
.cw-banner button { background: rgba(255,255,255,.14); color: #fff; border: 0; cursor: pointer; font: inherit; padding: 5px 12px; border-radius: 999px; transition: background .15s, transform .1s; }
.cw-banner button:hover { background: rgba(255,255,255,.26); }
.cw-banner button:active { transform: scale(.95); }
.cw-banner .cw-banner-gear { padding: 5px 9px; border-radius: 50%; font-size: 14px; line-height: 1; }

/* Pick mode */
.cw-picking, .cw-picking * { cursor: crosshair !important; }
.cw-picking .cw-pin, .cw-picking .cw-pin * { cursor: grab !important; }
.cw-picking .cw-pin--dragging, .cw-picking .cw-pin--dragging * { cursor: grabbing !important; }
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
.cw-panel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; padding-right: 32px; }
.cw-panel-avatar { width: 30px; height: 30px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,.2), inset 0 1px 1px rgba(255,255,255,.3); }
.cw-panel-meta { flex: 1; min-width: 0; }
.cw-panel-meta strong { display: block; font-size: 13px; }
.cw-panel-meta span { font-size: 11px; color: #6b7280; }
.cw-panel-actions { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; padding-bottom: 12px; border-bottom: 1px dashed #e3cf94; }
/* Visitor (minimal) panel: no author header, so leave room at top-right for the
   close button and keep the action row as the first thing the visitor sees. */
.cw-panel--mini .cw-panel-actions { margin-top: 2px; padding-right: 30px; }
.cw-panel-body { font-size: 13px; line-height: 1.55; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; }
.cw-panel-claude { margin: 8px 0; padding: 10px; background: linear-gradient(140deg, #fafaf9, #f5f5f4); border: 1px solid #e7e5e4; border-radius: 10px; }
.cw-claude-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.cw-claude-label { font-size: 11px; font-weight: 700; color: #57534e; letter-spacing: .02em; }
.cw-claude-head button { flex: none; }
.cw-claude-text { display: block; max-height: 96px; overflow: auto; font: 500 11px/1.45 'SF Mono', Menlo, Consolas, monospace; color: #1f2937; white-space: pre-wrap; word-break: break-word; }
.cw-panel-thumb { margin: 8px 0; cursor: zoom-in; max-width: 100%; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; transition: transform .15s var(--cw-ease), box-shadow .15s; }
.cw-panel-thumb:hover { transform: scale(1.01); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.cw-panel-thumb img { display: block; max-width: 100%; max-height: 120px; }
.cw-panel-close { position: absolute; top: 8px; right: 10px; background: transparent; border: 0; cursor: pointer; font-size: 18px; color: #92400e; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s var(--cw-ease); }
.cw-panel-close:hover { background: rgba(146,64,14,.1); transform: rotate(90deg); }

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

/* Stranded sidebar */
.cw-stranded { position: fixed; top: 20px; right: 20px; width: 260px; max-height: 60vh; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 10px 28px rgba(0,0,0,.12); padding: 12px; z-index: 2147483620; font-size: 12px; }
.cw-stranded h5 { margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
.cw-stranded-item { padding: 8px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; transition: background .12s; }
.cw-stranded-item:hover { background: #f9fafb; }
.cw-stranded-item strong { display: block; font-size: 12px; color: #111827; }
.cw-stranded-item .cw-stranded-note { font-size: 11px; color: #9ca3af; font-style: italic; }

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

@media (prefers-reduced-motion: reduce) {
  .cw-root *, .cw-bubble, .cw-pin, .cw-toast, .cw-popup, .cw-panel, .cw-admin-panel, .cw-banner { animation: none !important; }
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
    if (classes.length) return tag + '.' + classes.map(c => CSS.escape(c)).join('.');
    let sib = el, idx = 1;
    while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) idx++;
    return tag + `:nth-of-type(${idx})`;
  }

  function goodClasses(el) {
    let cls = el.className;
    if (cls && typeof cls.baseVal === 'string') cls = cls.baseVal; // SVG
    if (typeof cls !== 'string') return [];
    return cls.trim().split(/\s+/).filter(c => {
      if (!c) return false;
      if (c.startsWith('cw-')) return false;                // widget's own classes
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
  // Confluence logs. e.g. `<button class="primary" data-action="save">`.
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
  let root, pinsLayer, bubble, bubbleIcon, banner, stranded;

  function buildRoot() {
    const style = el('style'); style.textContent = css;
    document.head.appendChild(style);

    root = el('div', { class: 'cw-root', 'data-cw-version': WIDGET_VERSION });
    pinsLayer = el('div', { class: 'cw-pins' });
    root.appendChild(pinsLayer);
    document.body.appendChild(root);

    bubbleIcon = el('span', { class: 'cw-bubble-icon' }, ['💬']);
    bubble = el('button', {
      class: 'cw-bubble',
      type: 'button',
      'aria-label': 'Add feedback',
      onclick: togglePickMode,
    }, [
      bubbleIcon,
      el('div', { class: 'cw-bubble-tip' }, ['Add feedback']),
    ]);
    document.body.appendChild(bubble);
    applyAdminBubble();

    banner = el('div', { class: 'cw-banner cw-hidden' }, [
      document.createTextNode('Click any element to leave feedback'),
      el('button', {
        type: 'button', class: 'cw-banner-gear', title: 'Settings & admin controls',
        'aria-label': 'Settings',
        onclick: () => { becomeAdmin(); openAdminPanel(); },
      }, ['⚙']),
      el('button', { type: 'button', onclick: exitPickMode }, ['Esc to cancel']),
    ]);
    document.body.appendChild(banner);
  }

  function togglePickMode() {
    if (state.pickMode) exitPickMode();
    else enterPickMode();
  }

  // ----- Admin -----------------------------------------------------------------
  function becomeAdmin() {
    if (state.isAdmin) return;
    state.isAdmin = true;
    localStorage.setItem('cw-admin', '1');
    applyAdminBubble();
    renderPins();
  }

  function applyAdminBubble() {
    if (!bubble) return;
    const off = !!state.settings.commentsDisabled;
    // Comments off → the bubble fades fully out so it doesn't draw the eye, but
    // it stays in the DOM and clickable for everyone. Clicking it opens comment
    // mode and reveals the pins (see visiblePins), so neither admins nor
    // visitors need a hotkey. Comments on → fully visible.
    bubble.classList.toggle('cw-bubble--ghost', off);
    bubble.title = off ? 'Comments hidden — click to open' : 'Add feedback';
  }

  let adminPanel = null;
  function closeAdminPanel() {
    unbindOutsideClose();
    if (adminPanel) { adminPanel.remove(); adminPanel = null; }
  }

  function openAdminPanel() {
    closeAdminPanel();
    // The gear lives in the comment-mode banner, so leave pick mode first —
    // otherwise the pick handlers would treat clicks on this panel as
    // "place a new pin" and the toggles would never get the click.
    exitPickMode();

    const visitorToggle = makeToggle(
      () => state.settings.visitorMode,
      (next) => saveSetting({ visitorMode: next }, next ? 'Visitor mode on' : 'Visitor mode off'),
    );
    const disabledToggle = makeToggle(
      () => state.settings.commentsDisabled,
      (next) => saveSetting({ commentsDisabled: next }, next ? 'Comments disabled' : 'Comments enabled'),
    );

    adminPanel = el('div', { class: 'cw-admin-panel' }, [
      el('div', { class: 'cw-admin-head' }, [
        el('span', { class: 'cw-admin-title' }, ['⚙ Admin controls']),
        el('button', { class: 'cw-panel-close', onclick: closeAdminPanel, 'aria-label': 'Close' }, ['×']),
      ]),
      el('div', { class: 'cw-admin-row' }, [
        el('div', { class: 'cw-admin-label' }, [
          el('strong', {}, ['Visitor mode']),
          el('span', {}, ['Visitors only see their own comments, in a minimal panel: just the Done / Edit / Delete (and Save) buttons, the comment text, and replies. The author header, screenshot, Claude Code prompt, and Open-in-VS-Code button are all hidden.']),
        ]),
        visitorToggle.el,
      ]),
      el('div', { class: 'cw-admin-row' }, [
        el('div', { class: 'cw-admin-label' }, [
          el('strong', {}, ['Disable comments']),
          el('span', {}, ['Hides every pin and disables the bubble for non-admins. Admins still see and can manage everything.']),
        ]),
        disabledToggle.el,
      ]),
      el('a', { class: 'cw-admin-link', href: LOG_URL, target: '_blank', rel: 'noopener' }, ['🗒️ View activity log ↗']),
      el('div', { class: 'cw-admin-footer' }, [
        `You are admin on this browser. Open comment mode and click the ⚙ button any time to reopen these controls.`
      ]),
    ]);
    document.body.appendChild(adminPanel);
    bindOutsideClose(adminPanel, closeAdminPanel);

    function syncToggles() { visitorToggle.render(); disabledToggle.render(); }

    async function saveSetting(patch, successMsg) {
      const prev = { ...state.settings };
      state.settings = { ...state.settings, ...patch };
      applyAdminBubble();
      renderPins();
      try {
        const { settings } = await api('PATCH', '/settings', {
          url: pageUrl, author: state.author || 'admin', ...patch,
        });
        state.settings = settings;
        applyAdminBubble();
        renderPins();
        syncToggles();
        if (successMsg) showToast(successMsg, 'success');
      } catch (e) {
        state.settings = prev;
        applyAdminBubble();
        renderPins();
        syncToggles();
        showToast(e.message || 'Could not save setting', 'error');
      }
    }
  }

  // Toggle whose visual state is always derived from `getValue()` (the live
  // setting), so a failed save snaps it back. Disabled during the async call.
  function makeToggle(getValue, onChange) {
    const node = el('button', { type: 'button', class: 'cw-toggle', role: 'switch' });
    function render() {
      const v = !!getValue();
      node.classList.toggle('cw-toggle--on', v);
      node.setAttribute('aria-checked', v ? 'true' : 'false');
    }
    node.addEventListener('click', async () => {
      if (node.disabled) return;
      node.disabled = true;
      try { await onChange(!getValue()); }
      catch (_) {}
      finally { node.disabled = false; render(); }
    });
    render();
    return { el: node, render };
  }

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
    if (bubble) {
      bubble.classList.add('cw-bubble--active');
      bubble.setAttribute('aria-label', 'Exit comment mode');
      if (bubbleIcon) bubbleIcon.textContent = '✕';
    }
    if (banner) banner.classList.remove('cw-hidden');
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
    if (bubble) {
      bubble.classList.remove('cw-bubble--active');
      bubble.setAttribute('aria-label', 'Add feedback');
      if (bubbleIcon) bubbleIcon.textContent = '💬';
    }
    if (banner) banner.classList.add('cw-hidden');
    if (hoverOutline) { hoverOutline.remove(); hoverOutline = null; }
    document.removeEventListener('mousemove', onPickHover, true);
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey, true);
    renderPins(); // hide pins again if comments are in the dormant (disabled) state
  }

  function isWidgetEl(node) {
    if (!node || !node.closest) return false;
    return !!(node.closest('.cw-root') || node.closest('.cw-bubble') || node.closest('.cw-banner') || node.closest('.cw-popup') || node.closest('.cw-panel') || node.closest('.cw-admin-panel') || node.closest('.cw-toast') || node.closest('.cw-stranded') || node.closest('.cw-hover-outline') || node.closest('.cw-lightbox'));
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

    const prev = { x: pin.x, y: pin.y, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY };
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
    const patch = { url: pin.url, author: state.author || pin.author, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY, x: pin.x, y: pin.y };

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
    exitPickMode();
    showToast('Capturing screenshot…', 'neutral');
    const screenshot = await captureElement(target);
    if (state.activeToast) { state.activeToast.remove(); state.activeToast = null; }
    openNewPinPopup({ x, y, relX, relY, selector, elementText, elementHtml, dataFile, dataLine, screenshot, clickX: e.clientX, clickY: e.clientY + window.scrollY });
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
      el('h4', {}, ['New feedback']),
      authorRow.row,
      el('div', { class: 'cw-row' }, [el('label', {}, ['Comment']), textArea]),
      el('div', { class: 'cw-actions' }, [cancel, submit]),
    ]);
    positionFloater(popup, ctx.clickX, ctx.clickY);
    document.body.appendChild(popup);
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

  // Returns the pins this user is allowed to see right now.
  // When comments are disabled the widget is dormant: pins stay hidden until
  // someone clicks the (invisible) bubble to enter comment mode, which reveals
  // them. Otherwise admins see everything and non-admins respect visitor mode.
  function visiblePins() {
    if (state.settings.commentsDisabled && !state.pickMode) return [];
    // Done = resolved: the pin disappears from the page (history is kept in the
    // activity log, and the just-marked-done toast offers a 10s Undo).
    let pins = state.pins.filter(p => !p.deleted && !p.done);
    if (state.settings.visitorMode && !state.isAdmin) {
      pins = pins.filter(p => p.author === state.author);
    }
    return pins;
  }

  // ----- Pin rendering --------------------------------------------------------
  // Dots currently on screen, so scroll/reflow can reposition them in place
  // (anchored to their element) without rebuilding the whole layer.
  let renderedPins = [];

  function renderPins() {
    pinsLayer.innerHTML = '';
    state.stranded = [];
    renderedPins = [];

    pinsLayer.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + 'px';

    for (const pin of visiblePins()) {
      const found = pin.selector ? safeQuery(pin.selector) : null;
      if (!found) { state.stranded.push(pin); continue; }
      const dot = makePinDot(pin);
      positionDot(dot, pin, found);
      pinsLayer.appendChild(dot);
      renderedPins.push({ pin, dot });
    }
    renderStranded();
  }

  function safeQuery(sel) {
    try { return document.querySelector(sel); } catch (e) { return null; }
  }

  // Place a dot at its pin's anchor: the element's live bounding rect plus the
  // stored relative offset, in page coordinates. Falls back to legacy x/y for
  // pins saved before element anchoring existed.
  function positionDot(dot, pin, target) {
    const node = target || (pin.selector ? safeQuery(pin.selector) : null);
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

      const prev = { x: pin.x, y: pin.y, selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY };
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
        Object.assign(patch, { selector: pin.selector, elementText: pin.elementText, elementHtml: pin.elementHtml, dataFile: pin.dataFile, dataLine: pin.dataLine, relX: pin.relX, relY: pin.relY });
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

  function renderStranded() {
    if (stranded) { stranded.remove(); stranded = null; }
    if (!state.stranded.length) return;
    // Stranded pins are an admin-only concern. To a visitor or designer just
    // viewing the mockup, a "broken pin" sidebar is noise — they can't do
    // anything with it. Admins still see it so they can open the pin's panel
    // and delete it (or re-anchor it by dragging once we surface that flow).
    if (!state.isAdmin) return;
    stranded = el('div', { class: 'cw-stranded' }, [
      el('h5', {}, [`Stranded feedback (${state.stranded.length})`]),
      ...state.stranded.map(pin => el('div', {
        class: 'cw-stranded-item',
        onclick: () => openPanel(pin, { stranded: true }),
      }, [
        el('strong', {}, [`${pin.author} — ${rel(pin.timestamp)}`]),
        document.createTextNode((pin.comment || '').slice(0, 80) + ((pin.comment || '').length > 80 ? '…' : '')),
        el('div', { class: 'cw-stranded-note' }, ['Element no longer found on this page']),
      ]))
    ]);
    document.body.appendChild(stranded);
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
    panel = renderPanel(pin);
    let x, y;
    if (opts.stranded || !pin.selector || !safeQuery(pin.selector)) {
      x = window.scrollX + window.innerWidth - 400;
      y = window.scrollY + 80;
    } else {
      x = pin.x * window.innerWidth;
      y = pin.y * window.innerHeight;
    }
    positionFloater(panel, x, y);
    document.body.appendChild(panel);
    bindOutsideClose(panel, () => closePanel());
  }

  function renderPanel(pin) {
    const isEditing = panelEditing;
    const stripped = state.settings.visitorMode && !state.isAdmin;
    const closeBtn = el('button', { class: 'cw-panel-close', onclick: closePanel, 'aria-label': 'Close' }, ['×']);
    const avatar = el('div', { class: 'cw-panel-avatar', style: `background:${authorColor(pin.author)};` }, [initial(pin.author)]);
    const meta = el('div', { class: 'cw-panel-meta' }, [
      el('strong', {}, [pin.author]),
      el('span', {}, [rel(pin.timestamp)]),
    ]);
    const actionButtons = [
      el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small', onclick: () => onDone(pin) }, [pin.done ? '↺ Reopen' : '✓ Done']),
      el('button', {
        class: 'cw-btn cw-btn--secondary cw-btn--small',
        title: 'Edit the comment text.',
        onclick: (e) => { e.stopPropagation(); reopenPanel(pin, { editing: true }); },
      }, ['✎ Edit']),
      el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small cw-btn--danger', onclick: () => onDelete(pin) }, ['🗑 Delete']),
    ];
    // Open-in-VS-Code is an admin-only tool (visitors don't have the local
    // repo), so it's left off the stripped/visitor panel.
    if (pinFilePath(pin) && !stripped) {
      actionButtons.push(el('button', {
        class: 'cw-btn cw-btn--secondary cw-btn--small',
        title: pin.dataLine
          ? 'Opens this exact line in VS Code (vscode:// URL). First use prompts for your local repo root path.'
          : 'Opens this mock file in VS Code (vscode:// URL). First use prompts for your local repo root path.',
        onclick: (e) => { e.stopPropagation(); openInVSCode(pin); },
      }, ['📂 Open in VS Code']));
    }
    // Visitors keep the Done / Edit / Delete actions (just not VS Code), so
    // build the action row in both modes.
    const actions = el('div', { class: 'cw-panel-actions' }, actionButtons);

    const head = el('div', { class: 'cw-panel-head' }, [avatar, meta]);

    let body;
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
      body = el('div', { class: 'cw-panel-body' }, [ta, el('div', { class: 'cw-actions', style: 'margin-top:6px;' }, [cancel, save])]);
    } else {
      body = el('div', { class: 'cw-panel-body' }, [pin.comment || '']);
    }

    const extras = [];
    // Ready-to-paste Claude Code prompt (file + selector + line + text + the
    // feedback). Shown on every mock so you can hand the comment straight to
    // Claude Code — especially useful on React mocks where the line number
    // isn't reliable, but handy everywhere.
    if (!stripped) {
      const prompt = claudePrompt(pin);
      extras.push(el('div', { class: 'cw-panel-claude' }, [
        el('div', { class: 'cw-claude-head' }, [
          el('span', { class: 'cw-claude-label' }, ['🤖 For Claude Code']),
          el('button', {
            class: 'cw-btn cw-btn--secondary cw-btn--small',
            title: 'Copy this prompt, then paste it into Claude Code to jump to the element',
            onclick: (e) => { e.stopPropagation(); copyText(prompt, 'Prompt copied — paste into Claude Code'); },
          }, ['📋 Copy']),
        ]),
        el('code', { class: 'cw-claude-text', title: prompt }, [prompt]),
      ]));
    }
    if (pin.screenshot && !stripped) {
      const thumb = el('div', { class: 'cw-panel-thumb', onclick: () => openLightbox(pin.screenshot) }, [
        el('img', { src: pin.screenshot, alt: 'screenshot' })
      ]);
      extras.push(thumb);
    }
    const thread = el('div', { class: 'cw-thread' }, [
      ...(pin.thread || []).map(r => el('div', { class: 'cw-reply' }, [
        el('div', { class: 'cw-reply-head' }, [el('strong', {}, [r.author]), rel(r.timestamp)]),
        el('div', { class: 'cw-reply-text' }, [r.text]),
      ])),
      buildReplyForm(pin),
    ]);

    // Stripped (visitor) mode: a minimal panel focused on the visitor's own
    // actions — the Done / Edit / Delete buttons (and Save while editing), the
    // comment text, and the reply thread (with its Reply button). The author
    // header (avatar / name / timestamp) is dropped too, on top of the
    // screenshot, Claude Code prompt, and Open-in-VS-Code button already left out.
    if (stripped) {
      return el('div', { class: 'cw-panel cw-panel--mini' }, [closeBtn, actions, body, thread]);
    }

    return el('div', { class: 'cw-panel' }, [closeBtn, head, actions, body, ...extras, thread]);
  }

  function reopenPanel(pin, opts = {}) {
    closePanel();
    openPanel(pin, opts);
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
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePopup(); closePanel(); closeAdminPanel(); } });

    try {
      const [pinsRes, settingsRes] = await Promise.all([
        api('GET', '/pins?url=' + encodeURIComponent(pageUrl)),
        api('GET', '/settings?url=' + encodeURIComponent(pageUrl)).catch(() => ({ settings: { visitorMode: false, commentsDisabled: false } })),
      ]);
      state.pins = pinsRes.pins || [];
      state.settings = settingsRes.settings || state.settings;
      applyAdminBubble();
      renderPins();
    } catch (e) {
      console.warn('[cw] failed to load pins', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
