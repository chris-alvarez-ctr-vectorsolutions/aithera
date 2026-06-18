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
      '.tbx-dock-sep{width:1px;align-self:stretch;margin:3px 0;background:rgba(255,255,255,.16);}';
    var styled = false;
    function ensureStyle() {
      if (styled) return; styled = true;
      var s = document.createElement('style'); s.textContent = DOCK_CSS;
      (document.head || document.documentElement).appendChild(s);
    }
    function getDock() {
      var existing = document.querySelector('.version-switcher') || document.querySelector('.tbx-dock');
      if (existing) return existing;
      ensureStyle();
      var dock = document.createElement('div');
      dock.className = 'tbx-dock';
      (document.body || document.documentElement).appendChild(dock);
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
