/* =============================================================================
   Toolbox — Flow Map
   A drop-in, config-driven flow map for design mocks. Part of the Design Toolbox.

   • Reads window.TOOLBOX_CONFIG.flowMap (nodes, edges, flows).
   • Thumbnails are LIVE: each node renders the mock itself at that node's state in
     a scaled <iframe>, so they always reflect the current design (no static PNGs).
   • Click a node to drive the real mock into that state ("open live").
   • Dev notes per node, loaded read-only from a committed DEV-NOTES.md sitting
     next to the mock (so every teammate sees the same notes — no localStorage).
   • Per-node comment counts inferred from the comment widget's pins.

   The host page must expose a state driver (default: window.applyFlowState(id))
   and boot into `#fm=<state>` on load (used by the live thumbnails).
   ========================================================================== */
(function () {
  'use strict';

  // Never run inside a thumbnail iframe (recursion guard) or without config.
  if (/[?&]fmthumb=1/.test(location.search)) return;
  var ROOT = window.TOOLBOX_CONFIG && window.TOOLBOX_CONFIG.flowMap;
  if (!ROOT || !Array.isArray(ROOT.nodes)) return;

  var CFG = {
    title: ROOT.title || 'Flow Map',
    applyState: ROOT.applyState || 'applyFlowState',
    flows: ROOT.flows || [],
    nodes: ROOT.nodes,
    edges: ROOT.edges || [],
    canvas: ROOT.canvas || { w: 2080, h: 1120 },
    thumbWidth: ROOT.thumbViewportWidth || 1280, // px the mock renders at inside the thumb
  };

  var WORKER_URL = 'https://ux-mockups-feedback.vectorsolutions-ux.workers.dev';
  var PAGES_BASE = 'https://vectorlearning.github.io/ux-mockups';

  // ---- helpers --------------------------------------------------------------
  var nodeById = function (id) { return CFG.nodes.find(function (n) { return n.id === id; }); };
  var flowById = function (id) { return CFG.flows.find(function (f) { return f.id === id; }); };
  var pageBase = location.href.split('#')[0].split('?')[0];
  function thumbSrc(node) { return pageBase + '?fmthumb=1#fm=' + encodeURIComponent(node.state || node.id); }

  // Canonical page URL — must match the comment widget's keying so counts line up.
  function canonicalPageUrl() {
    var m = location.pathname.match(/\/products\/.+$/i);
    if (!m) return pageBase;
    return PAGES_BASE + m[0].replace(/\/index\.html?$/i, '/');
  }

  // ---- styles ---------------------------------------------------------------
  var CSS = '\
.fm-switcher{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:999990;display:inline-flex;align-items:center;gap:6px;background:#18181b;padding:6px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.28);font-family:"Open Sans",system-ui,sans-serif;}\
.fm-launch{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#4a2bd1;color:#fff;border:none;border-radius:999px;padding:9px 11px;font:700 14px/1 "Open Sans",system-ui,sans-serif;cursor:pointer;transition:background .12s,transform .12s;}\
.fm-launch:hover{background:#5a3ce0;transform:translateY(-1px);}\
.fm-launch.fm-in-vs{padding:8px 10px;font-size:13px;}\
.fm-vs-sep{width:1px;align-self:stretch;margin:2px 0 2px 6px;background:rgba(255,255,255,.16);}\
.fm-overlay{position:fixed;inset:0;z-index:999991;display:none;flex-direction:column;background:radial-gradient(circle at 30% 10%,#20243a 0%,#14162a 60%,#0e0f1d 100%);font-family:"Open Sans",system-ui,sans-serif;}\
.fm-overlay.open{display:flex;}\
.fm-top{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;color:#fff;border-bottom:1px solid rgba(255,255,255,.08);flex:none;}\
.fm-title{display:flex;align-items:center;gap:12px;}\
.fm-title .dot{width:9px;height:9px;border-radius:50%;background:#7c5cff;box-shadow:0 0 10px #7c5cff;}\
.fm-title h2{font-size:17px;font-weight:700;margin:0;}\
.fm-title .tag{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#b9b2ff;border:1px solid rgba(124,92,255,.5);border-radius:4px;padding:2px 7px;}\
.fm-hint{font-size:12.5px;color:#8b90b5;max-width:46ch;text-align:center;}\
.fm-tools{display:flex;align-items:center;gap:8px;}\
.fm-tbtn{width:34px;height:34px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#d6d9f0;border-radius:8px;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;}\
.fm-tbtn:hover{background:rgba(255,255,255,.12);}\
.fm-view{flex:1;overflow:auto;cursor:grab;position:relative;}\
.fm-view.panning{cursor:grabbing;}\
.fm-view::-webkit-scrollbar{width:12px;height:12px;}.fm-view::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px;}\
.fm-canvas{position:relative;margin:40px auto 80px;transform-origin:top center;transition:transform .18s ease;}\
.fm-lane{position:absolute;border:1px dashed rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.018);}\
.fm-lane-label{position:absolute;font-size:13px;font-weight:700;letter-spacing:.03em;color:#cdd1f0;display:flex;align-items:center;gap:8px;}\
.fm-lane-label .pill{font-size:11px;font-weight:700;color:#0e0f1d;border-radius:10px;padding:2px 9px;}\
.fm-edges{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}\
.fm-edges path{fill:none;stroke:#5b6092;stroke-width:2.5;}\
.fm-edges path.branch{stroke:#6b5bd6;stroke-dasharray:6 5;}\
.fm-node{position:absolute;width:248px;background:#1c1f33;border:1px solid rgba(255,255,255,.10);border-radius:12px;overflow:hidden;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4);transition:box-shadow .2s,border-color .2s;}\
.fm-node:hover{z-index:50;border-color:#7c5cff;box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 2px rgba(124,92,255,.5);}\
.fm-node--entry{width:214px;background:#2a2150;border-color:rgba(124,92,255,.4);}\
.fm-thumb{position:relative;width:100%;height:160px;background:#fff;overflow:hidden;border-bottom:1px solid rgba(0,0,0,.25);}\
.fm-thumb iframe{position:absolute;top:0;left:0;border:0;transform-origin:top left;pointer-events:none;background:#fff;}\
.fm-thumb .fm-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aab0d8;font-size:12px;background:#191c2e;}\
.fm-thumb .fm-live{position:absolute;top:7px;left:7px;font-size:9px;font-weight:700;letter-spacing:.05em;color:#7ee0a8;background:rgba(8,12,20,.7);border-radius:4px;padding:2px 6px;display:flex;align-items:center;gap:4px;text-transform:uppercase;}\
.fm-thumb .fm-live .ld{width:5px;height:5px;border-radius:50%;background:#4caf7d;box-shadow:0 0 5px #4caf7d;}\
.fm-meta{padding:10px 13px 12px;}\
.fm-step-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:18px;}\
.fm-step{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8e93c4;}\
.fm-name{font-size:14px;font-weight:700;color:#fff;margin-top:2px;}\
/* Dev-annotation badge — purple glassmorphism, lives next to the step label (not in the corner). */\
.fm-note-badge{display:inline-flex;align-items:center;gap:5px;font:700 10px/1 inherit;padding:4px 8px;border-radius:999px;color:#e9e3ff;cursor:pointer;white-space:nowrap;background:rgba(124,92,255,.20);border:1px solid rgba(124,92,255,.45);box-shadow:0 2px 10px rgba(124,92,255,.22);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);transition:background .15s,border-color .15s;}\
.fm-note-badge:hover{background:rgba(124,92,255,.34);border-color:rgba(124,92,255,.7);}\
.fm-desc{font-size:12px;color:#aab0d8;line-height:1.45;margin-top:6px;max-height:0;opacity:0;overflow:hidden;transition:max-height .25s,opacity .2s,margin-top .2s;}\
.fm-node:hover .fm-desc{max-height:90px;opacity:1;margin-top:6px;}\
.fm-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;max-height:0;opacity:0;overflow:hidden;transition:max-height .25s,opacity .2s,margin-top .2s;}\
.fm-node:hover .fm-actions{max-height:30px;opacity:1;margin-top:10px;}\
.fm-add-note{border:1px solid rgba(124,92,255,.5);background:rgba(124,92,255,.12);color:#cdc4ff;border-radius:6px;font:700 10.5px/1 inherit;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}\
.fm-add-note:hover{background:rgba(124,92,255,.25);}\
.fm-open{font-size:11px;font-weight:700;color:#b9b2ff;}\
/* Comment badge — the prominent emoji badge in the node corner (top-right; the LIVE chip owns top-left). Shows when the comment widget has comments on this flow. */\
.fm-corner{position:absolute;top:8px;z-index:3;display:flex;gap:6px;}\
.fm-corner.right{right:8px;}\
.fm-cmt-badge{display:inline-flex;align-items:center;gap:5px;font:700 11px/1 inherit;padding:5px 9px;border-radius:999px;color:#1f2937;cursor:pointer;white-space:nowrap;background:rgba(255,255,255,.92);box-shadow:0 3px 12px rgba(0,0,0,.4);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .15s,transform .12s;}\
.fm-cmt-badge:hover{background:#fff;transform:translateY(-1px);}\
/* annotation drawer */\
.fm-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:90vw;background:#15182a;border-left:1px solid rgba(255,255,255,.1);box-shadow:-12px 0 40px rgba(0,0,0,.5);transform:translateX(105%);transition:transform .22s ease;display:flex;flex-direction:column;z-index:60;}\
.fm-drawer.open{transform:translateX(0);}\
.fm-drawer-head{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08);color:#fff;}\
.fm-drawer-head .k{font-size:11px;color:#8e93c4;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}\
.fm-drawer-head h3{margin:4px 0 0;font-size:18px;}\
.fm-drawer-head .x{position:absolute;top:16px;right:16px;border:none;background:none;color:#aab0d8;font-size:18px;cursor:pointer;}\
.fm-drawer-body{flex:1;overflow-y:auto;padding:16px 20px;}\
.fm-ann{background:#1f2338;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 13px;margin-bottom:10px;}\
.fm-ann .meta{font-size:11px;color:#8e93c4;display:flex;justify-content:space-between;margin-bottom:5px;}\
.fm-ann .txt{font-size:13px;color:#e6e8f5;line-height:1.5;white-space:pre-wrap;}\
.fm-ann .ops{display:flex;gap:12px;margin-top:8px;}\
.fm-ann .ops button{border:none;background:none;color:#9aa0cf;font:700 11px/1 inherit;cursor:pointer;}\
.fm-ann .ops button:hover{color:#fff;}\
.fm-empty{color:#7a80a8;font-size:13px;text-align:center;padding:24px 0;}\
.fm-composer{border-top:1px solid rgba(255,255,255,.08);padding:14px 20px;}\
.fm-source{font-size:12px;color:#8e93c4;line-height:1.5;display:flex;gap:7px;align-items:flex-start;}\
.fm-source code{background:rgba(255,255,255,.08);border-radius:4px;padding:1px 5px;color:#cdd1f0;font-size:11.5px;}\
.fm-empty code{background:rgba(255,255,255,.08);border-radius:4px;padding:1px 5px;color:#cdd1f0;font-size:11.5px;}\
.fm-composer .row{display:flex;justify-content:flex-end;gap:10px;margin-top:12px;}\
.fm-btn{border:none;border-radius:8px;font:700 13px/1 inherit;padding:9px 16px;cursor:pointer;}\
.fm-btn.primary{background:#6b5bd6;color:#fff;}.fm-btn.primary:hover{background:#7c6ce6;}\
.fm-btn.ghost{background:rgba(255,255,255,.06);color:#cdd1f0;}.fm-btn.ghost:hover{background:rgba(255,255,255,.14);}\
';

  // ---- dev notes (read-only, from committed DEV-NOTES.md) -------------------
  // Notes are authored in a Markdown file next to the mock — not in the browser —
  // so they're committed to git and shared with everyone. Format:
  //
  //   > author: Design handoff            (optional; default attribution)
  //
  //   ## <node-id>  — anything after the id is just a human-readable title
  //   - One bullet = one dev note.
  //   - Another note for the same step.
  //
  //   ## <another-node-id>
  //   - …
  //
  // The loader fetches DEV-NOTES.md from the mock's own folder; override with
  // TOOLBOX_CONFIG.flowMap.devNotes if it lives elsewhere.
  var NOTES_URL = ROOT.devNotes || (pageBase.replace(/[^/]*$/, '') + 'DEV-NOTES.md');
  var anns = {};            // nodeId -> [{ text, author }]
  function annsFor(id) { return anns[id] || []; }

  function parseNotes(md) {
    var out = {}, cur = null, defaultAuthor = 'Design handoff';
    md.split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var av = line.match(/^>\s*author:\s*(.+)$/i);
      if (av) { defaultAuthor = av[1].trim(); return; }
      var h = line.match(/^##\s+([A-Za-z0-9_-]+)/);
      if (h) { cur = h[1]; if (!out[cur]) out[cur] = []; return; }
      if (!cur) return;
      var b = line.match(/^\s*[-*]\s+(.+)$/);
      if (b) out[cur].push({ text: b[1].trim(), author: defaultAuthor });
    });
    return out;
  }

  var fetchedNotes = false;
  function fetchNotes() {
    return fetch(NOTES_URL, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (md) {
        if (!md) return;
        anns = parseNotes(md);
        refreshBadges();
        if (drawer && drawer.classList.contains('open')) renderDrawer();
      })
      .catch(function () { /* no DEV-NOTES.md (or local file:// CORS) — notes stay empty */ });
  }

  // ---- comment counts (from comment-widget pins) ---------------------------
  var commentCounts = {}; // nodeId -> number
  function flowMatch(pin, node) {
    var need = node.match || [];
    if (!need.length) return false;
    var labels = (pin.viewState || []).map(function (d) { return (d.text || '').trim(); });
    return need.every(function (m) { return labels.indexOf(m) !== -1; });
  }
  function fetchCommentCounts() {
    return fetch(WORKER_URL + '/pins?url=' + encodeURIComponent(canonicalPageUrl()))
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (pins) {
        if (!Array.isArray(pins)) return;
        // Attribute each pin to the single best node: the entry node of whichever
        // flow its captured state matches (state capture pinpoints the flow, not
        // the exact step). Pins matching no flow fall to the entry/landing node.
        var entryByFlow = {};
        CFG.nodes.forEach(function (n) { if (n.entry || /entry/.test(n.flow)) entryByFlow[n.flow] = n.id; });
        // also treat first node of each flow as its entry if no explicit entry
        CFG.flows.forEach(function (f) {
          if (!entryByFlow[f.id]) { var first = CFG.nodes.find(function (n) { return n.flow === f.id; }); if (first) entryByFlow[f.id] = first.id; }
        });
        var landing = (CFG.nodes.find(function (n) { return n.entry; }) || {}).id;
        pins.forEach(function (pin) {
          if (pin.deleted) return;
          var hit = null;
          CFG.nodes.forEach(function (n) { if (!hit && flowMatch(pin, n)) hit = entryByFlow[n.flow] || n.id; });
          var target = hit || landing;
          if (target) commentCounts[target] = (commentCounts[target] || 0) + 1;
        });
        refreshBadges();
      })
      .catch(function () { /* off-Pages / no backend — counts stay empty */ });
  }

  // ---- build overlay --------------------------------------------------------
  var built = false, overlay, canvas, edgesSvg, viewport, drawer, drawerNode = null;
  var io; // IntersectionObserver for lazy iframes

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // Mount the launcher button + styles immediately on load (cheap). The heavy
  // overlay/canvas is built lazily on first open() via build().
  //
  // The launcher docks into the shared Toolbox dock (window.ToolboxDock, the
  // bottom-center "version switcher" pill defined in toolbox.js) so it sits
  // alongside the comment-widget button and any per-mock version buttons. If the
  // dock isn't present (flow-map.js loaded standalone, without toolbox.js), we
  // fall back to a standalone bottom-center pill that holds just the Flow Map.
  function init() {
    if (document.querySelector('.fm-launch')) return;
    var style = el('style'); style.textContent = CSS; document.head.appendChild(style);

    var launch = el('button', 'fm-launch fm-in-vs');
    // Icon-only launcher — the glyph alone identifies it; the label is dropped.
    launch.innerHTML = '<i class="fa-solid fa-map"></i>';
    launch.title = 'Open the flow map';
    launch.setAttribute('aria-label', 'Open the flow map');
    launch.addEventListener('click', openMap);

    if (window.ToolboxDock) {
      window.ToolboxDock.add(launch);
    } else {
      // No toolbox dock — float a standalone pill with just the Flow Map button.
      var pill = el('div', 'fm-switcher');
      pill.appendChild(launch);
      document.body.appendChild(pill);
    }
  }

  function build() {
    overlay = el('div', 'fm-overlay');
    overlay.innerHTML =
      '<div class="fm-top">' +
        '<div class="fm-title"><span class="dot"></span><h2>' + CFG.title + '</h2><span class="tag">Dev tool</span></div>' +
        '<div class="fm-hint">Hover to preview the live design · click to open it live · 💬 view comments · 📝 view dev notes</div>' +
        '<div class="fm-tools">' +
          '<button class="fm-tbtn" data-z="-1" title="Zoom out"><i class="fa-solid fa-minus"></i></button>' +
          '<button class="fm-tbtn" data-z="0" title="Reset zoom"><i class="fa-solid fa-expand"></i></button>' +
          '<button class="fm-tbtn" data-z="1" title="Zoom in"><i class="fa-solid fa-plus"></i></button>' +
          '<button class="fm-tbtn" data-close="1" title="Close" style="margin-left:6px;"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="fm-view"><div class="fm-canvas"><svg class="fm-edges"></svg></div></div>';
    document.body.appendChild(overlay);

    viewport = overlay.querySelector('.fm-view');
    canvas = overlay.querySelector('.fm-canvas');
    edgesSvg = overlay.querySelector('.fm-edges');
    canvas.style.width = CFG.canvas.w + 'px';
    canvas.style.height = CFG.canvas.h + 'px';

    // drawer (read-only dev notes from DEV-NOTES.md)
    drawer = el('div', 'fm-drawer');
    drawer.innerHTML =
      '<div class="fm-drawer-head"><button class="x" data-dclose="1"><i class="fa-solid fa-xmark"></i></button>' +
        '<div class="k">Dev notes</div><h3 class="fm-dtitle"></h3></div>' +
      '<div class="fm-drawer-body"></div>' +
      '<div class="fm-composer"><div class="fm-source"><i class="fa-regular fa-file-lines"></i> Notes are maintained in <code>DEV-NOTES.md</code> next to this mock.</div>' +
        '<div class="row"><button class="fm-btn ghost" data-dclose="1">Close</button></div></div>';
    overlay.appendChild(drawer);

    overlay.querySelectorAll('[data-z]').forEach(function (b) {
      b.addEventListener('click', function () { var d = +b.dataset.z; zoom = d === 0 ? 1 : Math.min(1.8, Math.max(.4, zoom + d * 0.15)); canvas.style.transform = 'scale(' + zoom + ')'; });
    });
    overlay.querySelector('[data-close]').addEventListener('click', closeMap);
    drawer.querySelectorAll('[data-dclose]').forEach(function (b) { b.addEventListener('click', closeDrawer); });

    buildLanes();
    buildNodes();
    drawEdges();
    setupPan();
    built = true;
  }

  function buildLanes() {
    CFG.flows.forEach(function (f) {
      if (f.lane) {
        var lane = el('div', 'fm-lane');
        lane.style.cssText = 'left:' + f.lane.x + 'px;top:' + f.lane.y + 'px;width:' + f.lane.w + 'px;height:' + f.lane.h + 'px;';
        canvas.appendChild(lane);
      }
      if (f.labelXY) {
        var label = el('div', 'fm-lane-label');
        label.style.cssText = 'left:' + f.labelXY.x + 'px;top:' + f.labelXY.y + 'px;';
        label.innerHTML = '<span class="pill" style="background:' + (f.color || '#8ab6ff') + '">' + (f.pill || '') + '</span> ' + f.name;
        canvas.appendChild(label);
      }
    });
  }

  function nodeW(n) { return n.entry ? 214 : 248; }
  function nodeH() { return 232; } // approx for edge anchoring

  function buildNodes() {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) { loadThumb(ent.target); io.unobserve(ent.target); }
      });
    }, { root: viewport, rootMargin: '300px' });

    CFG.nodes.forEach(function (n) {
      var node = el('div', 'fm-node' + (n.entry ? ' fm-node--entry' : ''));
      node.style.cssText = 'left:' + n.x + 'px;top:' + n.y + 'px;';
      node.dataset.node = n.id;
      node.innerHTML =
        '<div class="fm-corner right fm-cmt-corner"></div>' +
        '<div class="fm-thumb"><div class="fm-ph">Loading live preview…</div><div class="fm-live"><span class="ld"></span>Live</div></div>' +
        '<div class="fm-meta">' +
          '<div class="fm-step-row"><div class="fm-step">' + (n.step || '') + '</div><span class="fm-note-slot"></span></div>' +
          '<div class="fm-name">' + n.name + '</div>' +
          '<div class="fm-desc">' + (n.desc || '') + '</div>' +
          '<div class="fm-actions"><button class="fm-add-note"><i class="fa-regular fa-note-sticky"></i> Dev notes</button><span class="fm-open">Open live →</span></div>' +
        '</div>';
      // open live (ignore clicks on chips / add-note)
      node.addEventListener('click', function (e) {
        if (e.target.closest('.fm-chip') || e.target.closest('.fm-add-note')) return;
        openLive(n.id);
      });
      node.querySelector('.fm-add-note').addEventListener('click', function (e) { e.stopPropagation(); openDrawer(n.id); });
      canvas.appendChild(node);
      io.observe(node);
    });
    refreshBadges();
  }

  function loadThumb(node) {
    var n = nodeById(node.dataset.node);
    var thumb = node.querySelector('.fm-thumb');
    var iframe = document.createElement('iframe');
    var scale = nodeW(n) / CFG.thumbWidth;
    iframe.width = CFG.thumbWidth;
    iframe.height = Math.round(160 / scale);
    iframe.style.transform = 'scale(' + scale + ')';
    iframe.loading = 'lazy';
    iframe.src = thumbSrc(n);
    iframe.addEventListener('load', function () { var ph = thumb.querySelector('.fm-ph'); if (ph) ph.remove(); });
    thumb.insertBefore(iframe, thumb.firstChild);
  }

  function drawEdges() {
    var ns = 'http://www.w3.org/2000/svg';
    edgesSvg.innerHTML = '<defs><marker id="fmarrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4.5 L0,9 Z" fill="#5b6092"></path></marker></defs>';
    CFG.edges.forEach(function (e) {
      var a = nodeById(e[0]), b = nodeById(e[1]); if (!a || !b) return;
      var x1 = a.x + nodeW(a), y1 = a.y + nodeH() / 2, x2 = b.x, y2 = b.y + nodeH() / 2;
      var dx = Math.max(40, (x2 - x1) / 2);
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2);
      p.setAttribute('marker-end', 'url(#fmarrow)');
      if (e[2]) p.classList.add(e[2]);
      edgesSvg.appendChild(p);
    });
  }

  // ---- badges (comments + notes) -------------------------------------------
  function refreshBadges() {
    if (!canvas) return;
    CFG.nodes.forEach(function (n) {
      var node = canvas.querySelector('.fm-node[data-node="' + n.id + '"]'); if (!node) return;
      var cmtCorner = node.querySelector('.fm-cmt-corner'), noteSlot = node.querySelector('.fm-note-slot');
      var c = commentCounts[n.id] || 0, a = annsFor(n.id).length;
      cmtCorner.innerHTML = c ? '<span class="fm-cmt-badge" title="' + c + ' comment(s) — view">💬 ' + c + '</span>' : '';
      noteSlot.innerHTML = a ? '<span class="fm-note-badge" title="' + a + ' dev note(s) — view"><i class="fa-regular fa-note-sticky"></i> ' + a + '</span>' : '';
      var cc = cmtCorner.querySelector('.fm-cmt-badge'); if (cc) cc.addEventListener('click', function (e) { e.stopPropagation(); viewComments(n.id); });
      var nc = noteSlot.querySelector('.fm-note-badge'); if (nc) nc.addEventListener('click', function (e) { e.stopPropagation(); openDrawer(n.id); });
    });
  }

  // ---- annotation drawer ----------------------------------------------------
  function openDrawer(id) {
    drawerNode = id; var n = nodeById(id);
    drawer.querySelector('.fm-dtitle').textContent = n.name;
    renderDrawer();
    drawer.classList.add('open');
  }
  function closeDrawer() { drawer.classList.remove('open'); }
  function renderDrawer() {
    var body = drawer.querySelector('.fm-drawer-body');
    var list = annsFor(drawerNode);
    if (!list.length) { body.innerHTML = '<div class="fm-empty">No dev notes for this step yet.<br>Add them to <code>DEV-NOTES.md</code> under <code>## ' + esc(drawerNode) + '</code> and they’ll show here.</div>'; return; }
    body.innerHTML = list.map(function (a) {
      return '<div class="fm-ann"><div class="meta"><span>' + esc(a.author || 'Design handoff') + '</span><span>📝 dev note</span></div>' +
        '<div class="txt">' + esc(a.text) + '</div></div>';
    }).join('');
  }
  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  // ---- open live / view comments -------------------------------------------
  function openLive(id) {
    var n = nodeById(id); var apply = window[CFG.applyState];
    closeMap();
    if (typeof apply === 'function') apply(n.state || n.id);
  }
  function viewComments(id) {
    openLive(id);
    // best-effort: enter the comment widget's comment mode to reveal pins
    setTimeout(function () { var b = document.querySelector('.cw-bubble'); if (b) b.click(); }, 350);
  }

  // ---- overlay open/close + pan/zoom ---------------------------------------
  var zoom = 1;
  function openMap() { if (!built) build(); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; if (!fetchedCounts) { fetchedCounts = true; fetchCommentCounts(); } if (!fetchedNotes) { fetchedNotes = true; fetchNotes(); } }
  function closeMap() { if (overlay) overlay.classList.remove('open'); document.body.style.overflow = ''; closeDrawer(); }
  var fetchedCounts = false;

  function setupPan() {
    var panning = false, sx, sy, sl, st;
    viewport.addEventListener('mousedown', function (e) { if (e.target.closest('.fm-node') || e.target.closest('.fm-drawer')) return; panning = true; viewport.classList.add('panning'); sx = e.pageX; sy = e.pageY; sl = viewport.scrollLeft; st = viewport.scrollTop; });
    window.addEventListener('mousemove', function (e) { if (!panning) return; viewport.scrollLeft = sl - (e.pageX - sx); viewport.scrollTop = st - (e.pageY - sy); });
    window.addEventListener('mouseup', function () { panning = false; if (viewport) viewport.classList.remove('panning'); });
  }

  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) { if (drawer.classList.contains('open')) closeDrawer(); else closeMap(); } });

  // expose a tiny API
  window.ToolboxFlowMap = { open: openMap, close: closeMap, init: init };

  // mount the launcher as soon as the DOM is ready
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
