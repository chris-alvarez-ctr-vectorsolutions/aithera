/* =============================================================================
   Design Toolbox — one-line drop-in for any mock.

   Add before </body>:
       <script src="/designtoolbox/toolbox.js"></script>
   (or a relative path, e.g. ../../../designtoolbox/toolbox.js)

   It loads the team's design tools onto the page:
     1. The comment / feedback widget  (designtoolbox/feedback-widget.js)
     2. The Flow Map                   (designtoolbox/flow-map.js)  — only if the page
        defines window.TOOLBOX_CONFIG.flowMap

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

  function inject(src) {
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    (document.body || document.documentElement).appendChild(s);
    return s;
  }

  // 1) Comment widget — site-root absolute (matches its own documented embed).
  if (OPTS.comments !== false) inject(base + 'feedback-widget.js');

  // 2) Flow map — only meaningful when the page provides a flow config.
  if (OPTS.flowMap !== false) inject(base + 'flow-map.js');
})();
