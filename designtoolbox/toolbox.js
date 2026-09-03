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

  // Bump this whenever ANY of the three Design Toolbox scripts change
  // (this file, feedback-widget.js, flow-map.js). It does two jobs:
  //   1. cache-busts the child scripts this file injects (see inject()), and
  //   2. is the token a mock puts on its include — `toolbox.js?v=<TOOLBOX_VERSION>`
  // so a freshly-deployed build can never run alongside a stale cached copy of
  // these scripts. That stale-beside-fresh coexistence is the root cause of the
  // "two 💬 buttons / two collapse chevrons stacked in the dock" report: the
  // includes used to carry no version, so an edge/browser-cached older
  // feedback-widget.js could execute next to the current one and dock a second
  // bubble the dedup never saw. (self-heal below is the belt to this suspenders.)
  var TOOLBOX_VERSION = '1.2.0';

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
    // Six-dot grip for the drag handle that lets the team move the whole dock.
    var SVG_GRIP = '<svg viewBox="0 0 10 16" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></g></svg>';
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
      'display:none;align-items:center;gap:7px;background:#18181b;color:#fff;cursor:pointer;touch-action:none;' +
      'border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 13px;' +
      'font:700 12px/1 "Open Sans",system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.32);' +
      'opacity:.9;transition:opacity .15s,transform .15s;}' +
      '.tbx-handle.tbx-show{display:inline-flex;}' +
      '.tbx-handle:hover{opacity:1;transform:translateX(-50%) translateY(-1px);}' +
      '.tbx-handle svg{width:13px;height:13px;display:block;}' +
      // Leading icon is the 6-dot grip (viewBox 10×16) — size it to that aspect
      // ratio so the dots stay round and it reads as a "drag me" affordance.
      '.tbx-handle svg:first-child{width:9px;height:14px;}' +
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
      'background:linear-gradient(140deg,#ef4444,#dc2626);border-color:rgba(255,255,255,.4);}' +
      // ── Drag handle ────────────────────────────────────────────────────────
      // A quiet six-dot grip at the LEFT of the pill. Grab it to move the whole
      // dock somewhere else when it's covering the design; buttons stay clickable
      // because only this handle starts a drag. Position persists site-wide.
      '.tbx-drag-btn{flex:none;width:20px;height:26px;padding:0;margin-right:-2px;border:0;' +
      'background:transparent;cursor:grab;color:#8b8f9e;display:inline-flex;align-items:center;' +
      'justify-content:center;touch-action:none;border-radius:8px;transition:color .12s,background .12s;}' +
      '.tbx-drag-btn:hover{color:#e5e7eb;background:rgba(255,255,255,.1);}' +
      '.tbx-drag-btn:active{cursor:grabbing;}' +
      '.tbx-drag-btn svg{width:12px;height:15px;display:block;}' +
      // Once moved, the dock is positioned by explicit left/top (set inline), so
      // drop the default bottom/right anchoring. Collapsing a moved dock slides it
      // straight down (no translateX(-50%) recenters it back to the middle).
      '.tbx-dock.tbx-dock--moved,.version-switcher.tbx-dock--moved{bottom:auto;right:auto;}' +
      '.tbx-collapsible.tbx-collapsed.tbx-dock--moved{transform:translateY(calc(100% + 28px)) !important;}' +
      '.tbx-dock--dragging{transition:none !important;}' +
      // ── Version overflow → dropdown ────────────────────────────────────────
      // When the docked VERSION buttons would run the pill off the screen, they
      // collapse into ONE trigger (shows the current version + an up-caret) that
      // opens an upward menu of every version. The trigger reuses the pill blue
      // so it reads as the version control; the menu matches the dark dock.
      '.tbx-ver-trigger{display:none;align-items:center;gap:7px;border:0;cursor:pointer;' +
      'font:700 12px/1 "Open Sans",system-ui,sans-serif;color:#fff;background:#1f4596;' +
      'padding:6px 12px;border-radius:999px;max-width:min(46vw,320px);transition:background .12s;}' +
      '.tbx-ver-trigger:hover{background:#24509f;}' +
      '.tbx-ver-trigger .tbx-ver-cur{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '.tbx-ver-trigger .tbx-ver-caret{flex:none;width:12px;height:12px;}' +
      '.tbx-ver-trigger .tbx-ver-caret svg{width:12px;height:12px;display:block;}' +
      // Collapsed: hide the group\'s label + segmented buttons, show only the trigger.
      '.tbx-ver-collapsed>*{display:none !important;}' +
      '.tbx-ver-collapsed>.tbx-ver-trigger{display:inline-flex !important;}' +
      // The version menu is a fixed popover on the body (never clipped by the pill),
      // opening upward from the trigger. It scrolls if there are many versions.
      '.tbx-ver-menu{position:fixed;z-index:999995;display:none;flex-direction:column;' +
      'min-width:200px;max-width:min(88vw,340px);max-height:min(60vh,420px);overflow:auto;' +
      'background:#18181b;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:6px;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.4);font-family:"Open Sans",system-ui,sans-serif;}' +
      '.tbx-ver-menu.tbx-open{display:flex;}' +
      '.tbx-ver-menu-item{text-align:left;border:0;background:transparent;color:#d4d4d8;cursor:pointer;' +
      'font:600 12.5px/1.35 inherit;padding:9px 12px;border-radius:8px;white-space:normal;}' +
      '.tbx-ver-menu-item:hover{background:rgba(255,255,255,.1);color:#fff;}' +
      '.tbx-ver-menu-item.tbx-active{background:#1f4596;color:#fff;}';
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
      // Lead with the 6-dot grip (not the tools icon) so the minimized pill still
      // signals it can be dragged around, even while collapsed.
      handle.innerHTML = SVG_GRIP + '<span>Tools</span>' + SVG_CHEV_UP;
      (document.body || document.documentElement).appendChild(handle);

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'tbx-collapse-btn';
      toggle.title = 'Minimize design tools';
      toggle.setAttribute('aria-label', 'Minimize design tools');
      toggle.innerHTML = SVG_CHEV_DOWN;
      dock.__tbxToggle = toggle;

      function collapse() {
        // Park the "Tools" peek handle where the dock currently sits (its center
        // x, its top y) so a moved dock reappears right where the team left it —
        // not back at the default bottom-center.
        var r = dock.getBoundingClientRect();
        handle.style.left = (r.left + r.width / 2) + 'px';
        handle.style.top = r.top + 'px';
        handle.style.bottom = 'auto';
        dock.classList.add('tbx-collapsed');
        handle.classList.add('tbx-show');
      }
      function expand() { dock.classList.remove('tbx-collapsed'); handle.classList.remove('tbx-show'); }
      toggle.addEventListener('click', function (e) { e.stopPropagation(); collapse(); });

      // The collapsed "Tools" handle is BOTH a click target (expand) and a drag
      // target (move the tool while it's minimized). A small movement threshold
      // separates the two so a plain click still expands.
      var hMoved = false;
      handle.addEventListener('pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;   // primary / touch only
        var startX = e.clientX, startY = e.clientY;
        var hr = handle.getBoundingClientRect();
        var offX = e.clientX - hr.left, offY = e.clientY - hr.top;
        hMoved = false;
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        function move(ev) {
          if (!hMoved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 4) return;
          hMoved = true;
          handle.style.left = (ev.clientX - offX) + 'px';
          handle.style.top = (ev.clientY - offY) + 'px';
          handle.style.bottom = 'auto';
          handle.style.transform = 'none';
        }
        function up() {
          try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
          document.removeEventListener('pointermove', move, true);
          document.removeEventListener('pointerup', up, true);
          if (!hMoved) return;
          // Moved: park the dock (still collapsed) centered under the handle so it
          // reappears here on expand, and persist that position site-wide.
          var r = handle.getBoundingClientRect();
          var pos = { left: r.left + r.width / 2 - (dock.offsetWidth || 0) / 2, top: r.top };
          if (dock.__tbxPlace) dock.__tbxPlace(pos);
          if (dock.__tbxSave) { var rr = dock.getBoundingClientRect(); dock.__tbxSave({ left: rr.left, top: rr.top }); }
        }
        document.addEventListener('pointermove', move, true);
        document.addEventListener('pointerup', up, true);
      });
      handle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (hMoved) { hMoved = false; return; }   // was a drag, not a click — don't expand
        expand();
      });
      // Open by default — no stored/collapsed state on load.
      return toggle;
    }
    // Make the dock movable: a left-edge grip drags the whole pill, and the
    // position is remembered site-wide so it stays put across mocks. Idempotent.
    var DOCK_POS_KEY = 'tbx-dock-pos';
    function setupDraggable(dock) {
      if (dock.__tbxDraggable) return dock.__tbxGrip;
      dock.__tbxDraggable = true;
      ensureStyle();

      var grip = document.createElement('button');
      grip.type = 'button';
      grip.className = 'tbx-drag-btn';
      grip.title = 'Drag to move the toolbox';
      grip.setAttribute('aria-label', 'Move the toolbox');
      grip.innerHTML = SVG_GRIP;
      dock.__tbxGrip = grip;

      function clamp(pos) {
        var w = dock.offsetWidth || 0, h = dock.offsetHeight || 0;
        var maxLeft = Math.max(8, window.innerWidth - w - 8);
        var maxTop = Math.max(8, window.innerHeight - h - 8);
        return {
          left: Math.min(Math.max(8, pos.left), maxLeft),
          top: Math.min(Math.max(8, pos.top), maxTop),
        };
      }
      // Pin the dock to an explicit viewport position (switches it off the
      // default centered anchoring). Inline styles beat the stylesheet, so this
      // wins over both .tbx-dock and an adopted .version-switcher's own rules.
      function place(pos) {
        var c = clamp(pos);
        dock.classList.add('tbx-dock--moved');
        dock.style.left = c.left + 'px';
        dock.style.top = c.top + 'px';
        dock.style.bottom = 'auto';
        dock.style.right = 'auto';
        dock.style.transform = 'none';
      }
      function save(pos) { try { localStorage.setItem(DOCK_POS_KEY, JSON.stringify(pos)); } catch (_) {} }
      // Expose place/save so the collapsed "Tools" handle can move the dock too
      // (see setupCollapsible) — the handle drags, then persists the same position.
      dock.__tbxPlace = place;
      dock.__tbxSave = save;

      grip.addEventListener('pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;   // primary / touch only
        e.preventDefault();
        var r = dock.getBoundingClientRect();
        var offX = e.clientX - r.left, offY = e.clientY - r.top;
        // Anchor to the current on-screen rect first, so the very first move
        // doesn't jump whether the dock was centered or already relocated.
        place({ left: r.left, top: r.top });
        dock.classList.add('tbx-dock--dragging');
        try { grip.setPointerCapture(e.pointerId); } catch (_) {}
        var moved = false;
        function move(ev) { moved = true; place({ left: ev.clientX - offX, top: ev.clientY - offY }); }
        function up() {
          dock.classList.remove('tbx-dock--dragging');
          try { grip.releasePointerCapture(e.pointerId); } catch (_) {}
          document.removeEventListener('pointermove', move, true);
          document.removeEventListener('pointerup', up, true);
          if (moved) { var rr = dock.getBoundingClientRect(); save({ left: rr.left, top: rr.top }); }
        }
        document.addEventListener('pointermove', move, true);
        document.addEventListener('pointerup', up, true);
      });

      // Restore a saved position (clamped to the current viewport) once the dock
      // has been laid out, so width/height are known for clamping.
      try {
        var raw = localStorage.getItem(DOCK_POS_KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
            requestAnimationFrame(function () { place(saved); });
          }
        }
      } catch (_) {}

      // Keep a relocated dock on-screen if the window is resized smaller.
      window.addEventListener('resize', function () {
        if (!dock.classList.contains('tbx-dock--moved')) return;
        var r = dock.getBoundingClientRect();
        place({ left: r.left, top: r.top });
      });

      return grip;
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
        // Defensive: if a stale/duplicate script ever created more than one
        // `.tbx-dock` (seen intermittently when a cached older toolbox.js loaded
        // alongside a fresh one), collapse them into the FIRST — fold any
        // launchers from the extras in, then drop the empty duplicate pills — so
        // the page never shows two stacked docks.
        var docks = document.querySelectorAll('.tbx-dock');
        if (docks.length > 1) {
          dock = docks[0];
          for (var i = 1; i < docks.length; i++) {
            var extra = docks[i];
            Array.prototype.slice.call(extra.children).forEach(function (c) {
              if (c.classList && (c.classList.contains('tbx-dock-sep') || c.classList.contains('tbx-collapse-btn'))) return;
              dock.appendChild(c);
            });
            extra.remove();
          }
        } else {
          dock = docks[0];
        }
        if (!dock) {
          ensureStyle();
          dock = document.createElement('div');
          dock.className = 'tbx-dock';
          (document.body || document.documentElement).appendChild(dock);
        }
      }
      // The collapse chevron lives at the far-right of the pill; add() keeps it
      // last so new launchers slot in before it. The drag grip lives at the far
      // LEFT (reflow keeps it there) so the pill can be moved out of the way.
      var toggle = setupCollapsible(dock);
      if (toggle && toggle.parentNode !== dock) dock.appendChild(toggle);
      var grip = setupDraggable(dock);
      if (grip && grip.parentNode !== dock) dock.insertBefore(grip, dock.firstChild);
      return dock;
    }
    // Identity of a dock launcher, so duplicates (same tool docked twice — e.g.
    // a widget that ran in two contexts) can be collapsed to one in reflow().
    function launcherKey(node) {
      if (!node || node.nodeType !== 1) return null;
      if (node.id === 'loader-version-group') return 'versions';
      var cl = node.classList;
      if (cl && cl.contains('cw-bubble')) return 'comments';
      if (cl && cl.contains('fm-launch')) return 'flowmap';
      return null;
    }
    // Canonical left-to-right order of the dock's launchers. The loader's
    // version group is always leftmost, then the comment widget, then the flow
    // map. This is derived from each launcher's identity — NOT its arrival
    // order — because the three docking calls (loader's adoptIntoDock, the
    // comment widget, the flow map) race each other and would otherwise land in
    // a nondeterministic order (the pill looked different on first load vs.
    // after a version switch/refresh). A fixed order keeps it stable.
    function orderOf(node) {
      if (!node || node.nodeType !== 1) return 50;
      if (node.id === 'loader-version-group') return 0;   // VERSION buttons — leftmost
      var cl = node.classList;
      if (cl && cl.contains('cw-bubble')) return 10;       // comment widget
      if (cl && cl.contains('fm-launch')) return 20;        // flow map
      return 15;                                            // anything else
    }
    // Re-sort the dock into canonical order and rebuild the dividers between
    // launchers, always keeping the collapse chevron last. Idempotent, so it's
    // safe to run after every add() regardless of who won the race.
    function reflow(dock) {
      var toggle = dock.querySelector('.tbx-collapse-btn');
      var grip = dock.querySelector('.tbx-drag-btn');
      // Drop any extra collapse chevrons — only the first survives as `toggle`.
      Array.prototype.slice.call(dock.querySelectorAll('.tbx-collapse-btn')).forEach(function (t) {
        if (t !== toggle) t.remove();
      });
      // Likewise drop any extra drag grips — only the first survives as `grip`.
      Array.prototype.slice.call(dock.querySelectorAll('.tbx-drag-btn')).forEach(function (g) {
        if (g !== grip) g.remove();
      });
      var launchers = [];
      var seen = {};
      Array.prototype.slice.call(dock.children).forEach(function (c) {
        if (c === toggle || c === grip) return;
        if (c.classList && c.classList.contains('tbx-dock-sep')) { c.remove(); return; }
        // Collapse duplicate launchers of the same identity (a tool docked twice)
        // — keep the first, remove the rest, so the pill never shows two 💬 or
        // two version groups.
        var key = launcherKey(c);
        if (key) { if (seen[key]) { c.remove(); return; } seen[key] = true; }
        launchers.push(c);
      });
      launchers.sort(function (a, b) { return orderOf(a) - orderOf(b); });
      // No dividers between launchers — the dock's own `gap` spaces them. (The
      // old vertical `.tbx-dock-sep` rules between Comments and Flow Map read as
      // visual clutter; the loop above already strips any leftover separators.)
      launchers.forEach(function (node) {
        dock.appendChild(node);
      });
      if (toggle) dock.appendChild(toggle);   // chevron stays at the far right
      if (grip) dock.insertBefore(grip, dock.firstChild);   // grip stays far left
    }
    // --- Self-healing dock -------------------------------------------------
    // reflow() dedups whatever is added THROUGH ToolboxDock.add(). This is the
    // safety net for a duplicate that appears by any OTHER path — most often an
    // older cached toolbox.js/feedback-widget.js executing beside a fresh one,
    // or a page that includes a widget twice. A debounced MutationObserver
    // re-runs the same cleanup the instant a second bubble / launcher / dock /
    // collapse-chevron shows up, so the pill can never visually stack two of a
    // thing. It ACTS only when a duplicate actually exists (hasDupes), so it
    // never fights a correct dock and never loops on reflow's own mutations.
    function activePill() {
      return document.querySelector('.version-switcher.tbx-has-versions') ||
             document.querySelector('.tbx-dock');
    }
    function hasDupes() {
      if (document.querySelectorAll('.tbx-dock').length > 1) return true;
      var pill = activePill();
      if (!pill) return false;
      return pill.querySelectorAll('.cw-bubble').length > 1 ||
             pill.querySelectorAll('.fm-launch').length > 1 ||
             pill.querySelectorAll('#loader-version-group').length > 1 ||
             pill.querySelectorAll('.tbx-collapse-btn').length > 1 ||
             pill.querySelectorAll('.tbx-drag-btn').length > 1;
    }
    function heal() {
      if (!hasDupes()) return;
      // Fold any extra .tbx-dock pills into the first — move their real launchers
      // in, drop the empty duplicate (and its own chrome) — then reflow to dedup.
      var docks = document.querySelectorAll('.tbx-dock');
      if (docks.length > 1) {
        var keep = docks[0];
        for (var i = 1; i < docks.length; i++) {
          var extra = docks[i];
          Array.prototype.slice.call(extra.children).forEach(function (c) {
            if (c.classList && (c.classList.contains('tbx-dock-sep') ||
                c.classList.contains('tbx-collapse-btn') ||
                c.classList.contains('tbx-drag-btn'))) return;
            keep.appendChild(c);
          });
          extra.remove();
        }
      }
      var pill = activePill();
      if (pill) reflow(pill);
    }
    var healPending = false;
    function scheduleHeal() {
      if (healPending) return;
      healPending = true;
      requestAnimationFrame(function () { healPending = false; heal(); });
    }
    try {
      new MutationObserver(scheduleHeal)
        .observe(document.documentElement, { childList: true, subtree: true });
    } catch (_) { /* no MutationObserver → add()-time reflow still dedups */ }

    // ---- Version overflow → dropdown -------------------------------------
    // The loader docks its VERSION buttons as #loader-version-group. With many
    // or long labels (e.g. "V2 · Concierge (Vector sets up)"), that group can
    // push the whole pill wider than the screen and run off the edge. When the
    // fully-expanded pill would exceed the viewport, we collapse the version
    // buttons into ONE trigger that opens an upward menu of every version — so
    // the team can still "shop around" the versions from a compact control. It
    // is purely width-driven and reverses automatically as the window widens.
    var VER_MARGIN = 16;   // keep this much clear on each side of the viewport

    function versionGroup(dock) { return dock && dock.querySelector('#loader-version-group'); }
    // The real version buttons in the group (the "VERSION" label is a span; the
    // dropdown trigger we add is excluded by its class).
    function verButtons(group) {
      return Array.prototype.slice.call(group.children).filter(function (c) {
        return c.tagName === 'BUTTON' && !c.classList.contains('tbx-ver-trigger');
      });
    }
    // Which button is the current version. Prefer explicit signals; fall back to
    // the loader's convention of filling only the active button (opaque blue)
    // and leaving the rest transparent.
    function verIsActive(b) {
      if (b.getAttribute('aria-pressed') === 'true') return true;
      if (b.classList && b.classList.contains('active')) return true;
      try {
        var bg = (b.ownerDocument.defaultView || window).getComputedStyle(b).backgroundColor.replace(/\s+/g, '');
        if (bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)') return true;
      } catch (_) {}
      return false;
    }
    function verCurrentLabel(btns) {
      var act = btns.filter(verIsActive)[0] || btns[0];
      return act ? act.textContent : 'Version';
    }
    // Build the collapsed control ONCE per group (fresh each iframe load, since
    // the loader rebuilds the group). The trigger lives inside the group so the
    // dock's ordering still treats it as the single leftmost version launcher;
    // the menu is a fixed popover on the body so the pill can't clip it.
    function buildVerUI(group) {
      if (group.__tbxVerUI) return group.__tbxVerUI;
      ensureStyle();
      var doc = group.ownerDocument;
      var win = doc.defaultView || window;

      var trigger = doc.createElement('button');
      trigger.type = 'button';
      trigger.className = 'tbx-ver-trigger';
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      var cur = doc.createElement('span'); cur.className = 'tbx-ver-cur';
      var caret = doc.createElement('span'); caret.className = 'tbx-ver-caret'; caret.innerHTML = SVG_CHEV_UP;
      trigger.appendChild(cur); trigger.appendChild(caret);
      group.appendChild(trigger);

      var menu = doc.createElement('div');
      menu.className = 'tbx-ver-menu';
      menu.setAttribute('role', 'menu');
      (doc.body || doc.documentElement).appendChild(menu);

      function onDown(e) { if (!menu.contains(e.target) && !trigger.contains(e.target)) close(); }
      function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) close(); }
      function close() {
        if (!menu.classList.contains('tbx-open')) return;
        menu.classList.remove('tbx-open');
        trigger.setAttribute('aria-expanded', 'false');
        doc.removeEventListener('mousedown', onDown, true);
        doc.removeEventListener('keydown', onKey, true);
        win.removeEventListener('resize', close);
      }
      function position() {
        var r = trigger.getBoundingClientRect();
        var de = doc.documentElement;
        var vw = de.clientWidth || win.innerWidth;
        var vh = de.clientHeight || win.innerHeight;
        menu.style.top = 'auto';
        menu.style.bottom = (vh - r.top + 8) + 'px';   // open UPWARD from the trigger
        menu.style.left = '0px';                        // measure width, then clamp
        var mw = menu.offsetWidth;
        menu.style.left = Math.max(8, Math.min(r.left, vw - mw - 8)) + 'px';
      }
      function open() {
        // Rebuild rows from the CURRENT version buttons each open (labels/active
        // state are refreshed by the loader on every load). Each row reuses the
        // real button's click handler so switching still runs through the loader.
        menu.textContent = '';
        verButtons(group).forEach(function (b) {
          var item = doc.createElement('button');
          item.type = 'button';
          item.className = 'tbx-ver-menu-item' + (verIsActive(b) ? ' tbx-active' : '');
          item.setAttribute('role', 'menuitem');
          item.textContent = b.textContent;
          if (b.title) item.title = b.title;
          item.addEventListener('click', function () { close(); b.click(); });
          menu.appendChild(item);
        });
        menu.classList.add('tbx-open');
        trigger.setAttribute('aria-expanded', 'true');
        position();
        doc.addEventListener('mousedown', onDown, true);
        doc.addEventListener('keydown', onKey, true);
        win.addEventListener('resize', close);
      }
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menu.classList.contains('tbx-open')) close(); else open();
      });

      group.__tbxVerUI = { trigger: trigger, menu: menu, cur: cur, close: close };
      return group.__tbxVerUI;
    }
    // Measure the fully-expanded pill; if it would overflow the viewport,
    // collapse the version buttons to the dropdown trigger (else keep them
    // segmented). Reading offsetWidth forces layout but not a paint, so the
    // expand→measure→final toggle within one turn never flickers. The decision
    // is taken on the expanded width, so it's stable and won't oscillate.
    function fitVersions(dock) {
      var group = versionGroup(dock);
      if (!group) return;
      var btns = verButtons(group);
      if (btns.length < 2) { group.classList.remove('tbx-ver-collapsed'); return; }
      var ui = buildVerUI(group);
      var doc = group.ownerDocument;
      var win = doc.defaultView || window;
      var vw = doc.documentElement.clientWidth || win.innerWidth;
      group.classList.remove('tbx-ver-collapsed');          // measure expanded
      var fits = dock.offsetWidth + VER_MARGIN * 2 <= vw;
      if (fits) {
        ui.close();
      } else {
        ui.cur.textContent = verCurrentLabel(btns);
        var act = btns.filter(verIsActive)[0];
        if (act && act.title) ui.trigger.title = act.title; else ui.trigger.removeAttribute('title');
        group.classList.add('tbx-ver-collapsed');
      }
    }
    // Re-fit on resize and once web fonts settle ("Open Sans" loading late
    // changes label widths and could otherwise leave a stale collapse decision).
    window.addEventListener('resize', function () { var p = activePill(); if (p) fitVersions(p); });
    try {
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () { var p = activePill(); if (p) fitVersions(p); });
      }
    } catch (_) {}

    window.ToolboxDock = {
      get: getDock,
      // Add a launcher to the dock, then reflow so it settles into the canonical
      // order (see orderOf) with dividers rebuilt — independent of arrival order.
      add: function (node) {
        var dock = getDock();
        dock.appendChild(node);
        reflow(dock);
        fitVersions(dock);   // collapse the VERSION buttons to a dropdown if they overflow
        return dock;
      },
    };
  })();

  function inject(src) {
    var s = document.createElement('script');
    // Pin the child scripts to this toolbox's version so a fresh toolbox.js
    // never loads a stale cached feedback-widget.js / flow-map.js beside it.
    s.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'v=' + TOOLBOX_VERSION;
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
