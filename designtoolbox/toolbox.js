/* =============================================================================
   Design Toolbox — one-line drop-in for any mock.

   Add before </body>:
       <script src="/designtoolbox/toolbox.js"></script>
   (or a relative path, e.g. ../../../designtoolbox/toolbox.js)

   It loads the team's design tools onto the page:
     1. The comment / feedback widget  (designtoolbox/feedback-widget.js)
     2. The Flow Map                   (designtoolbox/flow-map.js)  — only if the page
        defines window.TOOLBOX_CONFIG.flowMap

   It also defines window.ToolboxDock — the shared bottom-center "version
   switcher" pill that both tools dock their launcher buttons into (see below),
   so the comment + flow-map buttons live together instead of floating apart.

   Recursion guard: when the page is loaded as a Flow Map thumbnail
   (?fmthumb=1), the toolbox loads NOTHING — the mock renders bare so the
   thumbnail is a clean, widget-free snapshot of the design itself.

   Opt-outs (set before this script, or via the URL):
     window.TOOLBOX = { comments:false }   // skip the comment widget
     window.TOOLBOX = { flowMap:false }    // skip the flow map
     ?toolbox=off                          // skip everything
   ========================================================================== */
(function () {
  'use strict';

  var qs = location.search;
  if (/[?&]fmthumb=1/.test(qs)) return;        // thumbnail iframe → render bare
  if (/[?&]toolbox=off/.test(qs)) return;

  var OPTS = window.TOOLBOX || {};
  var me = document.currentScript;
  // Directory this script lives in, so siblings (flow-map.js) resolve the same way
  // whether included via an absolute (/designtoolbox/) or relative path.
  var base = (me && me.src) ? me.src.replace(/toolbox\.js(\?.*)?$/, '') : '/designtoolbox/';

  // ---- Toolbox dock ---------------------------------------------------------
  // The shared bottom-center "version switcher" pill that holds the toolbox
  // launchers (comment widget, flow map) — and any per-mock design-version
  // buttons. Its design lives here so every tool docks into one consistent pill
  // instead of each floating in its own corner. The comment widget and flow map
  // call window.ToolboxDock.add(buttonEl) to slot themselves in (in load order).
  //
  // If the mock already ships its own `.version-switcher` (a multi-version mock
  // with V1/V2 buttons), the dock adopts that element so the version buttons and
  // the toolbox launchers share a single pill.
  (function defineDock() {
    if (window.ToolboxDock) return;
    var DOCK_CSS =
      '.tbx-dock{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:999990;' +
      'display:inline-flex;align-items:center;gap:8px;background:#18181b;padding:6px 8px;border-radius:999px;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.28);font-family:"Open Sans",system-ui,sans-serif;}' +
      '.tbx-dock-sep{width:1px;align-self:stretch;margin:3px 0;background:rgba(255,255,255,.16);}' +
      // Auto-hide: the dock is tucked fully below the viewport and only pops up
      // when the user hovers it (or the invisible trigger strip at bottom-center).
      // Both .tbx-dock and an adopted .version-switcher use bottom:16px + left:50%
      // + translateX(-50%), so the hidden transform just adds a downward shift.
      '.tbx-autohide{transition:transform .22s ease,opacity .22s ease;}' +
      '.tbx-autohide.tbx-hidden{transform:translateX(-50%) translateY(calc(100% + 24px));opacity:0;pointer-events:none;}' +
      '.tbx-dock-trigger{position:fixed;left:50%;bottom:0;transform:translateX(-50%);' +
      'width:220px;height:22px;z-index:999989;background:transparent;}' +
      // ── Multi-version dock (an adopted .version-switcher) ──────────────────
      // When the mock ships its own V1/V2 switcher, the dock stays static and
      // always visible (no auto-hide), the section dividers are dropped, and the
      // Comments + Flow Map launchers collapse to compact glassmorphic icon
      // buttons (label text hidden) so they read as quiet tools beside the
      // version pills rather than two big solid-purple buttons.
      '.tbx-has-versions .tbx-dock-sep{display:none;}' +
      '.tbx-has-versions .cw-bubble--docked,.tbx-has-versions .fm-launch{' +
      'width:38px;height:38px;min-width:0;padding:0;border-radius:50%;gap:0;' +
      'display:inline-flex;align-items:center;justify-content:center;' +
      'background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);' +
      'color:#fff;box-shadow:none;-webkit-backdrop-filter:blur(10px) saturate(140%);' +
      'backdrop-filter:blur(10px) saturate(140%);}' +
      '.tbx-has-versions .cw-bubble--docked:hover,.tbx-has-versions .fm-launch:hover{' +
      'background:rgba(255,255,255,.22);transform:translateY(-1px);box-shadow:none;}' +
      // Hide the text labels; keep the glyph centered and legible.
      '.tbx-has-versions .cw-bubble--docked .cw-bubble-label{display:none;}' +
      '.tbx-has-versions .cw-bubble--docked .cw-bubble-icon{font-size:16px;}' +
      '.tbx-has-versions .fm-launch{font-size:0;}' +
      '.tbx-has-versions .fm-launch i{font-size:15px;}' +
      // Preserve the "comment pick-mode active" red feedback on the icon button.
      '.tbx-has-versions .cw-bubble--docked.cw-bubble--active{' +
      'background:linear-gradient(140deg,#ef4444,#dc2626);border-color:rgba(255,255,255,.4);}';
    var styled = false;
    function ensureStyle() {
      if (styled) return; styled = true;
      var s = document.createElement('style'); s.textContent = DOCK_CSS;
      (document.head || document.documentElement).appendChild(s);
    }
    // Wire a dock element so it hides by default and reveals on hover.
    function setupAutoHide(dock) {
      if (dock.__tbxAutoHide) return; dock.__tbxAutoHide = true;
      ensureStyle();
      dock.classList.add('tbx-autohide', 'tbx-hidden');

      // Invisible hover strip at the very bottom-center — the only thing the user
      // can reach while the dock is hidden. Sits just below the dock's z-index so
      // it never covers the revealed pill.
      var trigger = document.createElement('div');
      trigger.className = 'tbx-dock-trigger';
      var z = parseInt(getComputedStyle(dock).zIndex, 10);
      if (z) trigger.style.zIndex = (z - 1);
      (document.body || document.documentElement).appendChild(trigger);

      var hideTimer = null;
      function show() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } dock.classList.remove('tbx-hidden'); }
      function scheduleHide() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { dock.classList.add('tbx-hidden'); }, 320);
      }
      trigger.addEventListener('mouseenter', show);
      trigger.addEventListener('mouseleave', scheduleHide);
      dock.addEventListener('mouseenter', show);
      dock.addEventListener('mouseleave', scheduleHide);
    }
    function getDock() {
      var vs = document.querySelector('.version-switcher');
      if (vs) {
        // Multi-version mock: keep the island static and always on screen (no
        // auto-hide) and flag it so the launchers render as glassmorphic icons.
        ensureStyle();
        vs.classList.add('tbx-has-versions');
        return vs;
      }
      var existing = document.querySelector('.tbx-dock');
      if (existing) { setupAutoHide(existing); return existing; }
      ensureStyle();
      var dock = document.createElement('div');
      dock.className = 'tbx-dock';
      (document.body || document.documentElement).appendChild(dock);
      setupAutoHide(dock);
      return dock;
    }
    window.ToolboxDock = {
      get: getDock,
      // Append a launcher to the dock, with a divider before it if the dock
      // already holds something. Returns the dock element.
      add: function (node) {
        var dock = getDock();
        if (dock.childElementCount > 0) {
          var sep = document.createElement('span');
          sep.className = 'tbx-dock-sep';
          dock.appendChild(sep);
        }
        dock.appendChild(node);
        return dock;
      },
    };
  })();

  function inject(src) {
    var s = document.createElement('script');
    s.src = src;
    // Dynamically-inserted scripts are async by default and would execute in
    // fetch-completion order (the smaller flow-map.js can beat the widget),
    // which would flip the dock order. async=false forces insertion order, so
    // the comment widget always docks before the flow map.
    s.async = false;
    s.defer = true;
    (document.body || document.documentElement).appendChild(s);
    return s;
  }

  // 1) Comment widget — site-root absolute (matches its own documented embed).
  if (OPTS.comments !== false) inject(base + 'feedback-widget.js');

  // 2) Flow map — only meaningful when the page provides a flow config.
  if (OPTS.flowMap !== false) inject(base + 'flow-map.js');
})();
