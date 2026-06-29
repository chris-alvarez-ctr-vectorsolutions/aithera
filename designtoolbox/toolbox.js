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
    // Inline SVGs so the dock's own chrome never depends on the host page
    // loading an icon font (Font Awesome, etc.).
    var SVG_CHEV_DOWN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>';
    var SVG_CHEV_UP = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 10l4.5-4.5L12.5 10"/></svg>';
    var SVG_TOOLS = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2.5" y1="5" x2="13.5" y2="5"/><circle cx="6" cy="5" r="1.6" fill="currentColor" stroke="none"/><line x1="2.5" y1="11" x2="13.5" y2="11"/><circle cx="10" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg>';
    var DOCK_CSS =
      '.tbx-dock{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:999990;' +
      'display:inline-flex;align-items:center;gap:8px;background:#18181b;padding:6px 8px;border-radius:999px;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.28);font-family:"Open Sans",system-ui,sans-serif;}' +
      '.tbx-dock-sep{width:1px;align-self:stretch;margin:3px 0;background:rgba(255,255,255,.16);}' +
      // Open/close drawer: the dock is OPEN by default and slides down out of the
      // way only when the user clicks its collapse chevron — never on hover.
      // Both .tbx-dock and an adopted .version-switcher use bottom:16px + left:50%
      // + translateX(-50%), so the collapsed transform just adds a downward shift.
      // The compound selector (+!important) outranks a mock's own
      // `.version-switcher{transform:translateX(-50%)}` rule.
      '.tbx-collapsible{transition:transform .24s ease,opacity .24s ease;}' +
      '.tbx-collapsible.tbx-collapsed{transform:translateX(-50%) translateY(calc(100% + 28px)) !important;opacity:0;pointer-events:none;}' +
      // Collapse chevron docked at the right end of the pill.
      '.tbx-collapse-btn{flex:none;width:26px;height:26px;padding:0;border-radius:50%;cursor:pointer;' +
      'display:inline-flex;align-items:center;justify-content:center;color:#cfd2e6;' +
      'border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);transition:background .12s,color .12s;}' +
      '.tbx-collapse-btn:hover{background:rgba(255,255,255,.2);color:#fff;}' +
      '.tbx-collapse-btn svg{width:14px;height:14px;display:block;}' +
      // The small, unobtrusive handle that peeks at the bottom while collapsed.
      '.tbx-handle{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:999989;' +
      'display:none;align-items:center;gap:7px;background:#18181b;color:#fff;cursor:pointer;' +
      'border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 13px;' +
      'font:700 12px/1 "Open Sans",system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.32);' +
      'opacity:.9;transition:opacity .15s,transform .15s;}' +
      '.tbx-handle.tbx-show{display:inline-flex;}' +
      '.tbx-handle:hover{opacity:1;transform:translateX(-50%) translateY(-1px);}' +
      '.tbx-handle svg{width:13px;height:13px;display:block;}' +
      // ── Multi-version dock (an adopted .version-switcher) ──────────────────
      // When the mock ships its own V1/V2 switcher, the section dividers are
      // dropped and the Comments + Flow Map launchers collapse to compact
      // glassmorphic icon buttons (label text hidden) so they read as quiet
      // tools beside the version pills rather than two big solid-purple buttons.
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
      '.tbx-has-versions .fm-launch i,.tbx-has-versions .fm-launch svg{font-size:15px;}' +
      // Preserve the "comment pick-mode active" red feedback on the icon button.
      '.tbx-has-versions .cw-bubble--docked.cw-bubble--active{' +
      'background:linear-gradient(140deg,#ef4444,#dc2626);border-color:rgba(255,255,255,.4);}';
    var styled = false;
    function ensureStyle() {
      if (styled) return; styled = true;
      var s = document.createElement('style'); s.textContent = DOCK_CSS;
      (document.head || document.documentElement).appendChild(s);
    }
    // Wire a dock so it opens/closes as a drawer: visible by default, with a
    // collapse chevron that tucks it away and a small handle to bring it back.
    function setupCollapsible(dock) {
      if (dock.__tbxCollapsible) return dock.__tbxToggle; dock.__tbxCollapsible = true;
      ensureStyle();
      dock.classList.add('tbx-collapsible');

      var handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'tbx-handle';
      handle.title = 'Show design tools';
      handle.setAttribute('aria-label', 'Show design tools');
      handle.innerHTML = SVG_TOOLS + '<span>Tools</span>' + SVG_CHEV_UP;
      (document.body || document.documentElement).appendChild(handle);

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'tbx-collapse-btn';
      toggle.title = 'Hide design tools';
      toggle.setAttribute('aria-label', 'Hide design tools');
      toggle.innerHTML = SVG_CHEV_DOWN;
      dock.__tbxToggle = toggle;

      function collapse() { dock.classList.add('tbx-collapsed'); handle.classList.add('tbx-show'); }
      function expand() { dock.classList.remove('tbx-collapsed'); handle.classList.remove('tbx-show'); }
      toggle.addEventListener('click', function (e) { e.stopPropagation(); collapse(); });
      handle.addEventListener('click', function (e) { e.stopPropagation(); expand(); });
      // Open by default — no stored/collapsed state on load.
      return toggle;
    }
    function getDock() {
      var dock;
      var vs = document.querySelector('.version-switcher');
      if (vs) {
        // Multi-version mock: adopt the mock's own pill and flag it so the
        // launchers render as glassmorphic icons beside the version buttons.
        ensureStyle();
        vs.classList.add('tbx-has-versions');
        dock = vs;
      } else {
        dock = document.querySelector('.tbx-dock');
        if (!dock) {
          ensureStyle();
          dock = document.createElement('div');
          dock.className = 'tbx-dock';
          (document.body || document.documentElement).appendChild(dock);
        }
      }
      // The collapse chevron lives at the far-right of the pill; add() keeps it
      // last so new launchers slot in before it.
      var toggle = setupCollapsible(dock);
      if (toggle && toggle.parentNode !== dock) dock.appendChild(toggle);
      return dock;
    }
    window.ToolboxDock = {
      get: getDock,
      // Append a launcher to the dock (before the collapse chevron), with a
      // divider before it if the dock already holds a launcher. Returns the dock.
      add: function (node) {
        var dock = getDock();
        var toggle = dock.querySelector('.tbx-collapse-btn');
        var hasLaunchers = dock.querySelector(':scope > :not(.tbx-collapse-btn):not(.tbx-dock-sep)') != null;
        if (hasLaunchers) {
          var sep = document.createElement('span');
          sep.className = 'tbx-dock-sep';
          dock.insertBefore(sep, toggle || null);
        }
        dock.insertBefore(node, toggle || null);
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
