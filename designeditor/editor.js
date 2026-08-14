/* =============================================================================
   Design Editor — Figma-lite manual adjustments for prototypes.

   A designer-only, browser-injected overlay for making manual tweaks to a
   prototype and exporting them as a copy-paste payload (a text prompt + a
   before/after screenshot) to hand to Claude in VS Code.

   HOW IT LOADS
   ------------
   This file is NEVER referenced by any mock's HTML and never ships to GitHub
   Pages. A bookmarklet in the designer's bookmark bar injects it at runtime,
   on localhost only. See /designeditor/setup.html for the installer.

   FEATURES
   --------
     • Select tool: hover-outline + click any element → selection + label.
     • Property panel: text color, background, border (width/style/color),
       border-radius, box-shadow, padding, margin, font-size.
     • Move tool: drag to reposition via a non-destructive translate transform.
     • Undo / Redo across every edit.
     • Finish & Export: a generated prompt (Copy button) built from the recorded
       deltas + an optional before/after screenshot (Copy-image button) captured
       with html2canvas.

   NON-DESTRUCTIVE: edits are applied via element.style and recorded as deltas.
   The DOM is never re-serialized or written back.

   ZERO-TOUCH: this file imports nothing from the toolbox (feedback-widget.js,
   flow-map.js, toolbox.js). Any shared-looking logic (selector building,
   html2canvas load) is a self-contained copy so no existing file is affected.
   ========================================================================== */
(function () {
  'use strict';

  var HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  // ---- Guards --------------------------------------------------------------
  // Belt-and-suspenders: refuse to run anywhere but localhost, so even if this
  // file were somehow loaded on Pages it does nothing.
  var host = location.hostname;
  var LOCAL = host === 'localhost' || host === '127.0.0.1' || host === '' || host === '[::1]';
  if (!LOCAL) {
    console.warn('[design-editor] refusing to run outside localhost (host="' + host + '").');
    return;
  }
  // Idempotent: clicking the bookmarklet twice toggles the editor off/on rather
  // than stacking two overlays.
  if (window.__designEditor) {
    window.__designEditor.destroy();
    return;
  }

  // ---- Self-contained element → CSS-selector builder -----------------------
  // Pattern proven in the comment widget's stateAnchor(), re-implemented here
  // so we don't touch that file. Prefers a safe id, then a stable data-*/aria
  // attribute, then a class chain, disambiguating by :nth-of-type when needed.
  function isSafeId(id) {
    return id && /^[A-Za-z][\w-]*$/.test(id);
  }
  function cssAttrEscape(v) {
    return String(v).replace(/(["\\])/g, '\\$1');
  }
  function selectorFor(node) {
    if (!(node instanceof Element)) return '';
    if (isSafeId(node.id)) return node.tagName.toLowerCase() + '#' + node.id;
    var tag = node.tagName.toLowerCase();
    for (var i = 0; i < STABLE_ATTRS.length; i++) {
      var a = STABLE_ATTRS[i];
      var v = node.getAttribute && node.getAttribute(a);
      if (v) return tag + '[' + a + '="' + cssAttrEscape(v) + '"]';
    }
    var cls = classChain(node);
    var base = cls ? tag + '.' + cls : tag;
    // Disambiguate against siblings if the base still matches >1 element.
    try {
      if (document.querySelectorAll(base).length > 1) {
        var idx = indexAmongMatches(node, base);
        if (idx >= 0) base += ':nth-of-type(' + (idx + 1) + ')';
      }
    } catch (_) { /* invalid selector — fall back to base */ }
    return base;
  }
  var STABLE_ATTRS = ['data-testid', 'data-test', 'data-id', 'data-value', 'aria-label'];
  function classChain(node) {
    var cls = node.className;
    if (cls && typeof cls.baseVal === 'string') cls = cls.baseVal; // SVG
    if (typeof cls !== 'string') return '';
    var tokens = cls.trim().split(/\s+/).filter(function (c) {
      return c && !c.startsWith('de-'); // skip our own editor classes
    });
    return tokens.map(function (c) { return CSS.escape(c); }).join('.');
  }
  function indexAmongMatches(node, sel) {
    var all = Array.prototype.slice.call(document.querySelectorAll(sel));
    // nth-of-type is tag-scoped; count only same-tag matches up to node.
    return all.filter(function (n) { return n.tagName === node.tagName; }).indexOf(node);
  }

  // ---- Source-file anchor (optional; present on annotated mocks) -----------
  function findSourceAnchor(node) {
    var n = node;
    while (n && n.nodeType === 1) {
      var f = n.getAttribute && n.getAttribute('data-file');
      var l = n.getAttribute && n.getAttribute('data-line');
      if (f && l) return { file: f, line: l };
      n = n.parentElement;
    }
    return null;
  }
  function pageFilePath() {
    // Strip the leading slash so it reads as a repo-relative path in the prompt.
    var p = location.pathname.replace(/^\//, '');
    return p || '(this mock file)';
  }
  function visibleText(node) {
    var t = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 80);
  }
  function isShadowComp(node) {
    return /^(vaadin|vwc)-/.test(node.tagName.toLowerCase());
  }

  // ---- Editor state --------------------------------------------------------
  // deltas: Map<Element, {
  //   selector, file, line, text,
  //   changes: { prop: { css, label } },  // css = applied to live element;
  //                                        // label = how it exports (token / hex)
  //   moved: boolean,                      // was repositioned (see screenshot)
  // }>
  var deltas = new Map();
  var selected = null;
  var tool = 'select';                 // 'select' | 'move'

  // Undo/redo: each op captures how to reverse and re-apply one atomic change.
  var undoStack = [];
  var redoStack = [];

  function recordFor(node) {
    var rec = deltas.get(node);
    if (!rec) {
      var anchor = findSourceAnchor(node);
      rec = {
        node: node,
        selector: selectorFor(node),
        file: anchor ? anchor.file : pageFilePath(),
        line: anchor ? anchor.line : null,
        text: visibleText(node),
        changes: {},
        moved: false,
        tableRules: {},   // ruleId → { selectorSuffix, decls:{prop:{css,label}} }
      };
      deltas.set(node, rec);
    }
    return rec;
  }
  function pruneIfEmpty(node) {
    var rec = deltas.get(node);
    if (rec && !rec.moved &&
        Object.keys(rec.changes).length === 0 &&
        Object.keys(rec.tableRules || {}).length === 0 &&
        (!rec.colOps || rec.colOps.length === 0)) deltas.delete(node);
  }

  // Apply a CSS property edit and push an undo op.
  //   css   — the value written to the live element (what you see).
  //   label — how it EXPORTS: a design-system token phrase, or a literal
  //           hex/keyword. Defaults to css when the two are the same.
  function applyProp(node, prop, css, label) {
    var prevInline = node.style.getPropertyValue(prop);
    var rec = recordFor(node);
    var hadChange = Object.prototype.hasOwnProperty.call(rec.changes, prop);
    var prevChange = rec.changes[prop];
    var entry = { css: css, label: label != null ? label : css };

    node.style.setProperty(prop, css);
    rec.changes[prop] = entry;

    pushUndo({
      undo: function () {
        if (prevInline) node.style.setProperty(prop, prevInline);
        else node.style.removeProperty(prop);
        if (hadChange) rec.changes[prop] = prevChange; else delete rec.changes[prop];
        pruneIfEmpty(node);
        refreshPanelValues();
      },
      redo: function () {
        node.style.setProperty(prop, css);
        recordFor(node).changes[prop] = entry;
        refreshPanelValues();
      },
    });
  }

  // ---- Table descendant rules ----------------------------------------------
  // Some table edits must style DESCENDANTS (all cells, alt rows, the header),
  // which inline styles on the selected <table> can't do. We give each edited
  // table a stable id and write scoped rules (`#deTbl-N td { ... }`) into one
  // managed <style>, rebuilt from the deltas after every change so it stays the
  // single source of truth. These export as a small CSS block for Claude.
  var tableStyle = null;
  var tableIdSeq = 0;
  function ensureTableId(node) {
    if (!node.id) { node.id = 'deTbl-' + (++tableIdSeq); node.__deSynthId = true; }
    return node.id;
  }
  function rebuildTableStyle() {
    if (!tableStyle) {
      tableStyle = document.createElement('style');
      tableStyle.setAttribute('data-design-editor', '');
      document.head.appendChild(tableStyle);
    }
    var css = [];
    deltas.forEach(function (rec) {
      var ids = Object.keys(rec.tableRules || {});
      if (!ids.length) return;
      var base = '#' + rec.node.id;
      ids.forEach(function (rid) {
        var rule = rec.tableRules[rid];
        var decls = Object.keys(rule.decls).map(function (p) { return p + ':' + rule.decls[p].css; });
        if (decls.length) css.push(base + rule.selectorSuffix + '{' + decls.join(';') + '}');
      });
    });
    tableStyle.textContent = css.join('\n');
  }

  // Set/replace one declaration within a scoped table rule, undoable.
  //   ruleKey        — stable id for this rule (e.g. 'cellPad')
  //   selectorSuffix — appended after the table id (e.g. ' td, th' or ' tr:nth-child(even)')
  //   prop, css      — the declaration; label = how it exports
  function applyTableRule(node, ruleKey, selectorSuffix, prop, css, label) {
    ensureTableId(node);
    var rec = recordFor(node);
    var prevRule = rec.tableRules[ruleKey] ? JSON.parse(JSON.stringify(rec.tableRules[ruleKey])) : null;
    var rule = rec.tableRules[ruleKey] || { selectorSuffix: selectorSuffix, decls: {} };
    rule.selectorSuffix = selectorSuffix;
    rule.decls[prop] = { css: css, label: label != null ? label : css };
    rec.tableRules[ruleKey] = rule;
    rebuildTableStyle();

    pushUndo({
      undo: function () {
        var r = recordFor(node);
        if (prevRule) r.tableRules[ruleKey] = prevRule; else delete r.tableRules[ruleKey];
        rebuildTableStyle(); pruneIfEmpty(node); refreshPanelValues();
      },
      redo: function () {
        var r = recordFor(node);
        var rr = r.tableRules[ruleKey] || { selectorSuffix: selectorSuffix, decls: {} };
        rr.selectorSuffix = selectorSuffix; rr.decls[prop] = { css: css, label: label != null ? label : css };
        r.tableRules[ruleKey] = rr;
        rebuildTableStyle(); refreshPanelValues();
      },
    });
  }
  // Remove an entire table rule (e.g. toggling zebra off), undoable.
  function clearTableRule(node, ruleKey) {
    var rec = deltas.get(node);
    if (!rec || !rec.tableRules[ruleKey]) return;
    var prevRule = JSON.parse(JSON.stringify(rec.tableRules[ruleKey]));
    delete rec.tableRules[ruleKey];
    rebuildTableStyle();
    pushUndo({
      undo: function () { recordFor(node).tableRules[ruleKey] = prevRule; rebuildTableStyle(); refreshPanelValues(); },
      redo: function () { var r = deltas.get(node); if (r) { delete r.tableRules[ruleKey]; rebuildTableStyle(); pruneIfEmpty(node); } refreshPanelValues(); },
    });
  }

  // ---- Column operations (structural — reorder/hide whole columns) ----------
  // A column is a <th> plus every <td> at the same index, so these actually
  // rearrange/hide DOM nodes across all rows (not a style edit). They're
  // recorded on the TABLE's delta and export as precise structural instructions
  // ("move the Status column before Owner", "remove the ID column") — Claude can
  // apply those to markup reliably, so unlike freeform moves we don't defer to
  // the screenshot.

  // Given a th/td, resolve its table, column index, sibling count, and the
  // header names. Returns null if the table uses colspan/rowspan (ambiguous).
  function colInfo(cell) {
    var table = cell.closest && cell.closest('table');
    if (!table) return null;
    var row = cell.closest('tr');
    if (!row) return null;
    // Bail on spans — index math isn't reliable then.
    if (table.querySelector('[colspan],[rowspan]')) return null;
    var cells = Array.prototype.filter.call(row.children, function (c) {
      return c.tagName === 'TD' || c.tagName === 'TH';
    });
    var index = cells.indexOf(cell);
    if (index < 0) return null;
    var count = cells.length;
    // Header names from the first header-ish row.
    var headRow = table.querySelector('thead tr') || table.querySelector('tr');
    var names = [];
    if (headRow) {
      Array.prototype.forEach.call(headRow.children, function (c) {
        if (c.tagName === 'TD' || c.tagName === 'TH') names.push((c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim() || ('col ' + (names.length + 1)));
      });
    }
    return { table: table, index: index, count: count, names: names };
  }
  // Every row's cell at column `idx` (skips rows shorter than idx+1).
  function cellsAtIndex(table, idx) {
    var out = [];
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
      var cs = Array.prototype.filter.call(tr.children, function (c) { return c.tagName === 'TD' || c.tagName === 'TH'; });
      if (cs[idx]) out.push({ tr: tr, cell: cs[idx], ref: cs[idx].nextSibling });
    });
    return out;
  }
  function recordColOp(table, op) {
    var rec = recordFor(table);
    if (!rec.colOps) rec.colOps = [];
    rec.colOps.push(op);
  }
  function popColOp(table) {
    var rec = deltas.get(table);
    if (rec && rec.colOps && rec.colOps.length) rec.colOps.pop();
    if (rec) pruneIfEmpty(table);
  }

  // Swap column `idx` with its neighbor (dir: -1 left, +1 right) across all rows.
  function moveColumn(table, idx, dir, names) {
    var target = idx + dir;
    var count = colInfo(table.querySelector('td,th') || table).count;
    if (target < 0 || target >= count) { showToast('Column is already at the edge'); return idx; }
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
      var cs = Array.prototype.filter.call(tr.children, function (c) { return c.tagName === 'TD' || c.tagName === 'TH'; });
      var a = cs[idx], b = cs[target];
      if (!a || !b) return;
      if (dir > 0) tr.insertBefore(b, a);        // move neighbor before a → a shifts right
      else tr.insertBefore(a, b);                // move a before neighbor → a shifts left
    });
    var name = (names && names[idx]) || ('column ' + (idx + 1));
    var neighborName = (names && names[target]) || ('column ' + (target + 1));
    recordColOp(table, { kind: 'move', name: name, dir: dir < 0 ? 'left' : 'right', beside: neighborName });
    pushUndo({
      undo: function () { moveColumnRaw(table, target, idx); popColOp(table); if (selected) positionOutline(selected); },
      redo: function () { moveColumnRaw(table, idx, target); recordColOp(table, { kind: 'move', name: name, dir: dir < 0 ? 'left' : 'right', beside: neighborName }); if (selected) positionOutline(selected); },
    });
    return target;
  }
  // Raw swap of two adjacent columns (used by undo/redo; no recording/undo push).
  function moveColumnRaw(table, fromIdx, toIdx) {
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
      var cs = Array.prototype.filter.call(tr.children, function (c) { return c.tagName === 'TD' || c.tagName === 'TH'; });
      var a = cs[fromIdx], b = cs[toIdx];
      if (!a || !b) return;
      if (toIdx > fromIdx) tr.insertBefore(b, a); else tr.insertBefore(a, b);
    });
  }
  // Hide/show every cell in column `idx` (live display:none; exports as remove).
  function hideColumn(table, idx, hidden, names) {
    var cells = cellsAtIndex(table, idx);
    cells.forEach(function (c) { c.cell.style.display = hidden ? 'none' : ''; });
    var name = (names && names[idx]) || ('column ' + (idx + 1));
    if (hidden) recordColOp(table, { kind: 'remove', name: name });
    else {
      // Remove the most recent matching remove op.
      var rec = deltas.get(table);
      if (rec && rec.colOps) {
        for (var i = rec.colOps.length - 1; i >= 0; i--) {
          if (rec.colOps[i].kind === 'remove' && rec.colOps[i].name === name) { rec.colOps.splice(i, 1); break; }
        }
        pruneIfEmpty(table);
      }
    }
    pushUndo({
      undo: function () {
        cells.forEach(function (c) { c.cell.style.display = hidden ? '' : 'none'; });
        if (hidden) popColOp(table); else recordColOp(table, { kind: 'remove', name: name });
      },
      redo: function () {
        cells.forEach(function (c) { c.cell.style.display = hidden ? 'none' : ''; });
        if (hidden) recordColOp(table, { kind: 'remove', name: name }); else popColOp(table);
      },
    });
  }

  // Reposition (dx,dy from the element's natural position) via transform —
  // reversible and layout-non-destructive. We do NOT try to describe the move
  // in words: the browser tool isn't pixel-precise and words are a poor medium
  // for spatial intent. We only record THAT the element moved; the exported
  // screenshot is the authority on its new placement. `dx,dy` are kept solely
  // for the live on-screen preview + undo, never exported.
  function applyMove(node, dx, dy) {
    var rec = recordFor(node);
    var prevTransform = node.style.transform;
    var wasMoved = rec.moved;

    setTranslate(node, dx, dy);
    rec.moved = true;

    pushUndo({
      undo: function () {
        node.style.transform = prevTransform;
        rec.moved = wasMoved;
        pruneIfEmpty(node);
        if (selected === node) positionOutline(node);
      },
      redo: function () {
        setTranslate(node, dx, dy);
        recordFor(node).moved = true;
        if (selected === node) positionOutline(node);
      },
    });
  }

  function setTranslate(node, dx, dy) {
    node.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }

  function pushUndo(op) {
    undoStack.push(op);
    redoStack.length = 0;
    updateDockState();
  }
  function undo() {
    var op = undoStack.pop();
    if (!op) return;
    op.undo();
    redoStack.push(op);
    updateDockState();
  }
  function redo() {
    var op = redoStack.pop();
    if (!op) return;
    op.redo();
    undoStack.push(op);
    updateDockState();
  }

  // ---- UI: styles ----------------------------------------------------------
  var CSS_TEXT = [
    '.de-outline{position:absolute;pointer-events:none;z-index:2147483000;',
    'border:2px solid #6366f1;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.6);transition:top .05s,left .05s,width .05s,height .05s;}',
    '.de-outline.de-move{border-style:dashed;border-color:#0ea5e9;}',
    '.de-outline-label{position:absolute;top:-22px;left:-2px;background:#6366f1;color:#fff;',
    'font:600 11px/1 "Open Sans",system-ui,sans-serif;padding:3px 7px;border-radius:4px;white-space:nowrap;}',
    '.de-outline.de-move .de-outline-label{background:#0ea5e9;}',
    // Bottom-center dock, matching the toolbox pill aesthetic.
    '.de-dock{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483600;',
    'display:inline-flex;align-items:center;gap:6px;background:#18181b;padding:8px 12px;border-radius:999px;',
    'box-shadow:0 6px 20px rgba(0,0,0,.3);font-family:"Open Sans",system-ui,sans-serif;color:#fff;}',
    '.de-dock button{font-family:inherit;cursor:pointer;border:0;border-radius:7px;padding:8px 11px;',
    'font-size:13px;font-weight:600;background:rgba(255,255,255,.1);color:#fff;transition:background .12s;}',
    '.de-dock button:hover{background:rgba(255,255,255,.22);}',
    '.de-dock button:disabled{opacity:.35;cursor:default;}',
    '.de-dock button.de-active{background:#6366f1;}',
    '.de-dock .de-primary{background:#6366f1;}.de-dock .de-primary:hover{background:#4f46e5;}',
    '.de-dock .de-title{font-weight:700;font-size:13px;padding-right:2px;opacity:.85;}',
    '.de-dock .de-sep{width:1px;align-self:stretch;margin:2px 0;background:rgba(255,255,255,.16);}',
    // Property panel.
    // Panel: a flex column — fixed drag header, scrolling body, resize grip.
    // Wider + shorter by default; user drag/resize persists across reselects.
    '.de-panel{position:fixed;z-index:2147483500;background:#fff;border-radius:10px;',
    'box-shadow:0 10px 30px rgba(0,0,0,.22);font-family:"Open Sans",system-ui,sans-serif;',
    'width:330px;height:560px;min-width:260px;min-height:220px;max-width:96vw;max-height:92vh;',
    'color:#1a202c;display:flex;flex-direction:column;overflow:hidden;}',
    '.de-panel-header{flex:none;display:flex;align-items:center;gap:8px;cursor:grab;user-select:none;',
    'padding:10px 12px;border-bottom:1px solid #eef2f6;background:#fbfcfe;border-radius:10px 10px 0 0;}',
    '.de-panel-header:active{cursor:grabbing;}',
    '.de-panel-header .de-drag-dots{color:#cbd5e1;font-size:14px;letter-spacing:1px;flex:none;}',
    '.de-panel-title{min-width:0;flex:1;}',
    '.de-panel-title h4{margin:0;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;}',
    '.de-panel-title .de-sel{font:600 12px/1.3 ui-monospace,Menlo,monospace;color:#4f46e5;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;}',
    '.de-panel-body{flex:1;overflow:auto;padding:12px 14px;}',
    '.de-panel-grip{position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;',
    'background:linear-gradient(135deg,transparent 46%,#cbd5e1 46%,#cbd5e1 54%,transparent 54%,transparent 70%,#cbd5e1 70%,#cbd5e1 78%,transparent 78%);}',
    '.de-panel h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;}',
    '.de-panel .de-sel{font:600 12px/1.3 ui-monospace,Menlo,monospace;color:#4f46e5;word-break:break-all;margin-bottom:12px;}',
    // Element navigator — breadcrumb + mini tree.
    '.de-nav{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#f8fafc;overflow:hidden;}',
    '.de-nav-head{display:flex;align-items:flex-start;gap:6px;padding:6px 8px;}',
    '.de-crumbs{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:2px;min-width:0;}',
    '.de-crumb{cursor:pointer;border:0;background:transparent;color:#475569;border-radius:5px;',
    'padding:3px 6px;font:600 11px "Open Sans",system-ui,sans-serif;max-width:130px;overflow:hidden;',
    'text-overflow:ellipsis;white-space:nowrap;}',
    '.de-crumb:hover{background:#e2e8f0;color:#1a202c;}',
    '.de-crumb-sel{background:#6366f1;color:#fff;}.de-crumb-sel:hover{background:#4f46e5;color:#fff;}',
    '.de-crumb-arrow{color:#94a3b8;font-size:11px;}.de-crumb-more{color:#94a3b8;font-size:11px;padding:0 2px;}',
    '.de-nav-toggle{flex:none;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#475569;',
    'border-radius:6px;padding:4px 8px;font:600 11px "Open Sans",system-ui,sans-serif;}',
    '.de-nav-toggle:hover{background:#eef2ff;color:#4f46e5;}.de-nav-open{background:#6366f1;color:#fff;border-color:#6366f1;}',
    '.de-tree{border-top:1px solid #e2e8f0;max-height:180px;overflow:auto;background:#fff;padding:4px 0;}',
    '.de-tree-row{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;',
    'border:0;background:transparent;padding:5px 8px;font:12px "Open Sans",system-ui,sans-serif;color:#334155;}',
    '.de-tree-row:hover{background:#eef2ff;}',
    '.de-tree-self{background:#eef2ff;font-weight:700;color:#4f46e5;}',
    '.de-tree-tag{font-family:ui-monospace,Menlo,monospace;font-size:11px;}',
    '.de-tree-hint{margin-left:auto;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;}',
    // Hover-highlight overlay (locating a crumb/tree entry on the page).
    '.de-hoverbox{position:absolute;pointer-events:none;z-index:2147482900;background:rgba(14,165,233,.14);',
    'border:1px solid #0ea5e9;border-radius:2px;}',
    // Accordion buckets.
    '.de-acc{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;overflow:hidden;}',
    '.de-acc-head{display:flex;align-items:center;gap:7px;width:100%;text-align:left;cursor:pointer;',
    'border:0;background:#f8fafc;padding:9px 11px;font:700 12px "Open Sans",system-ui,sans-serif;color:#334155;}',
    '.de-acc-head:hover{background:#eef2ff;}',
    '.de-acc-caret{display:inline-block;transition:transform .12s;color:#94a3b8;font-size:10px;}',
    '.de-acc-open .de-acc-caret{transform:rotate(90deg);}',
    '.de-acc-body{padding:12px 11px 4px;border-top:1px solid #eef2f6;}',
    // Segmented button group.
    '.de-seg{display:flex;flex-wrap:wrap;gap:4px;}',
    '.de-seg-btn{cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:6px;',
    'padding:5px 9px;font:600 11px "Open Sans",system-ui,sans-serif;text-transform:capitalize;}',
    '.de-seg-btn:hover{background:#eef2ff;}',
    '.de-seg-on{background:#6366f1;color:#fff;border-color:#6366f1;}.de-seg-on:hover{background:#4f46e5;}',
    // Per-side spacing.
    '.de-perside-head{margin:2px 0 8px;}',
    '.de-side-toggle{cursor:pointer;border:1px dashed #cbd5e1;background:#fff;color:#64748b;border-radius:6px;',
    'padding:3px 9px;font:600 11px "Open Sans",system-ui,sans-serif;}',
    '.de-side-toggle:hover{background:#f1f5f9;}.de-side-open{background:#eef2ff;color:#4f46e5;border-style:solid;border-color:#c7d2fe;}',
    '.de-sides{padding-left:8px;border-left:2px solid #eef2f6;margin-bottom:6px;}',
    // Table "advanced" disclosure.
    '.de-adv-summary{cursor:pointer;font:600 11px "Open Sans",system-ui,sans-serif;color:#94a3b8;',
    'padding:6px 0;list-style:revert;}',
    '.de-adv-body{padding:6px 0 2px;}',
    // Section sub-headers inside an accordion body.
    '.de-acc-body h4{margin:10px 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;}',
    '.de-acc-body h4:first-child{margin-top:0;}',
    // Column map chips (order overview / jump-to-column).
    '.de-colmap{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}',
    '.de-colchip{cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:5px;',
    'padding:3px 8px;font:600 11px "Open Sans",system-ui,sans-serif;max-width:110px;overflow:hidden;',
    'text-overflow:ellipsis;white-space:nowrap;}',
    '.de-colchip:hover{background:#eef2ff;}',
    '.de-colchip-on{background:#6366f1;color:#fff;border-color:#6366f1;}',
    '.de-field{margin-bottom:12px;}',
    '.de-field>label{display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#374151;}',
    '.de-row{display:flex;align-items:center;gap:8px;}',
    '.de-panel input[type=color]{width:38px;height:32px;border:1px solid #d1d5db;border-radius:6px;padding:0;background:none;cursor:pointer;flex:none;}',
    '.de-panel input[type=text],.de-panel input[type=number],.de-panel select{',
    'flex:1;min-width:0;border:1px solid #d1d5db;border-radius:6px;padding:7px 9px;font-size:13px;',
    'font-family:ui-monospace,monospace;background:#fff;color:#1a202c;}',
    '.de-panel input[type=range]{flex:1;}',
    '.de-val{font:11px ui-monospace,monospace;color:#6b7280;min-width:96px;text-align:right;white-space:nowrap;}',
    // Palette swatches (primary color choice) + custom picker row (secondary).
    '.de-swatches{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px;}',
    '.de-swatch{width:26px;height:26px;border-radius:6px;cursor:pointer;padding:0;',
    'border:1px solid rgba(0,0,0,.15);box-shadow:inset 0 0 0 2px #fff;transition:transform .1s;}',
    '.de-swatch:hover{transform:scale(1.12);}',
    '.de-swatch-on{outline:2px solid #4f46e5;outline-offset:1px;box-shadow:none;}',
    '.de-custom{gap:6px;}.de-custom input[type=text]{font-size:12px;}',
    '.de-note{font-size:11px;color:#9ca3af;margin-top:4px;line-height:1.45;}',
    '.de-warn{font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;',
    'border-radius:7px;padding:8px 10px;margin-bottom:12px;line-height:1.45;}',
    // Export modal.
    '.de-modal{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.45);',
    'display:flex;align-items:center;justify-content:center;font-family:"Open Sans",system-ui,sans-serif;}',
    '.de-modal-box{background:#fff;border-radius:12px;width:min(720px,92vw);max-height:88vh;overflow:auto;',
    'padding:22px 24px;color:#1a202c;box-shadow:0 20px 60px rgba(0,0,0,.35);}',
    '.de-modal-box h3{margin:0 0 4px;font-size:18px;}',
    '.de-modal-box .de-modal-sub{margin:0 0 16px;color:#6b7280;font-size:13px;}',
    '.de-modal-box h4{margin:18px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;}',
    // Scrollable prompt box with a copy button that reveals on hover, pinned
    // top-right and floating above the scrolling text.
    '.de-promptwrap{position:relative;}',
    '.de-modal-box pre{background:#f4f6f8;border:1px solid #e2e8f0;border-radius:8px;padding:14px;',
    'font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;margin:0;',
    'max-height:260px;overflow:auto;}',
    '.de-copy-hover{position:absolute;top:8px;right:8px;z-index:2;cursor:pointer;border:1px solid #e2e8f0;',
    'border-radius:7px;padding:6px 11px;font:600 12px "Open Sans",system-ui,sans-serif;',
    'background:rgba(255,255,255,.92);color:#4f46e5;box-shadow:0 2px 8px rgba(0,0,0,.12);',
    'opacity:0;transition:opacity .14s;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}',
    '.de-promptwrap:hover .de-copy-hover,.de-copy-hover:focus{opacity:1;}',
    '.de-copy-hover:hover{background:#eef2ff;}',
    // Screenshot rendered small — a thumbnail confirmation, not a full preview.
    '.de-shots{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;}',
    '.de-shot{flex:none;}',
    '.de-shot span{display:block;font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;}',
    '.de-shot img{width:200px;max-height:150px;object-fit:contain;object-position:top left;',
    'border:1px solid #e2e8f0;border-radius:8px;display:block;background:#fff;cursor:zoom-in;}',
    '.de-bar{display:flex;align-items:center;gap:10px;margin-top:8px;}',
    '.de-bar button{cursor:pointer;border:0;border-radius:7px;padding:8px 14px;font-size:13px;font-weight:600;',
    'background:#eef2ff;color:#4f46e5;}',
    '.de-bar button:hover{background:#e0e7ff;}',
    '.de-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;}',
    '.de-modal-actions button{cursor:pointer;border:0;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:600;}',
    '.de-modal-actions .de-copy{background:#6366f1;color:#fff;}',
    '.de-modal-actions .de-close{background:#e5e7eb;color:#374151;}',
    '.de-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:2147483650;',
    'background:#111827;color:#fff;padding:10px 18px;border-radius:999px;font:600 13px "Open Sans",system-ui;',
    'box-shadow:0 6px 20px rgba(0,0,0,.3);opacity:0;transition:opacity .18s;pointer-events:none;}',
    '.de-toast.de-show{opacity:1;}',
    // Move-tool: give the whole page a grab cursor so it reads as draggable.
    'body.de-move-mode{cursor:grab;}body.de-move-mode.de-dragging{cursor:grabbing;}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-design-editor', '');
  styleEl.textContent = CSS_TEXT;
  document.head.appendChild(styleEl);

  // Terse DOM builder.
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function isEditorEl(node) {
    return !!(node && node.closest && node.closest('[data-design-editor],.de-dock,.de-panel,.de-modal,.de-outline,.de-toast'));
  }

  // ---- Selection outline ---------------------------------------------------
  var outline = el('div', { class: 'de-outline' }, [el('div', { class: 'de-outline-label' }, [''])]);
  outline.style.display = 'none';
  document.body.appendChild(outline);

  function positionOutline(node) {
    var r = node.getBoundingClientRect();
    outline.style.display = 'block';
    outline.classList.toggle('de-move', tool === 'move');
    outline.style.top = (r.top + window.scrollY) + 'px';
    outline.style.left = (r.left + window.scrollX) + 'px';
    outline.style.width = r.width + 'px';
    outline.style.height = r.height + 'px';
    var suffix = '';
    if (tool === 'move') {
      if (drag && drag.node === node) suffix = '  ✥ moving — release to place (screenshot captures position)';
      else suffix = '  ✥ drag to move';
    }
    outline.firstChild.textContent = selectorFor(node) + suffix;
  }

  // ---- Design-system tokens (from the themes CONTEXT.md) -------------------
  // The browser tool is not pixel-precise, and hand-dialed values shouldn't
  // become magic numbers (a 17px margin is really "the 16px spacing step").
  // So every pixel edit SNAPS to the nearest token on the relevant scale, and
  // colors are chosen from the palette first. Values resolved at a 16px root
  // (1rem = 16px; em radii resolved at the 16px base).
  var TOKENS = {
    // Spacing scale — --lumo-space-* (xs .25rem … xl 2.5rem).
    spacing: [
      { px: 4, token: '--lumo-space-xs' }, { px: 8, token: '--lumo-space-s' },
      { px: 16, token: '--lumo-space-m' }, { px: 24, token: '--lumo-space-l' },
      { px: 40, token: '--lumo-space-xl' },
    ],
    // Border radius — --lumo-border-radius-* (s .25em, m .5em, l .75em @16px).
    radius: [
      { px: 0, token: '0' }, { px: 4, token: '--lumo-border-radius-s' },
      { px: 8, token: '--lumo-border-radius-m' }, { px: 12, token: '--lumo-border-radius-l' },
    ],
    // Font size — Lumo scale (m = 14px documented; rest are the standard scale).
    fontSize: [
      { px: 12, token: '--lumo-font-size-xs' }, { px: 13, token: '--lumo-font-size-s' },
      { px: 14, token: '--lumo-font-size-m' }, { px: 16, token: '--lumo-font-size-l' },
      { px: 20, token: '--lumo-font-size-xl' }, { px: 24, token: '--lumo-font-size-xxl' },
      { px: 34, token: '--lumo-font-size-xxxl' },
    ],
    // Border width — not a Lumo scale; snap to a conventional hairline set.
    borderWidth: [
      { px: 0, token: '0' }, { px: 1, token: '1px' }, { px: 2, token: '2px' }, { px: 4, token: '4px' },
    ],
    // Palette — semantic color tokens + neutrals from the theme.
    palette: [
      { name: 'Primary', token: '--lumo-primary-color', hex: '#0271ce' },
      { name: 'Success', token: '--lumo-success-color', hex: '#158444' },
      { name: 'Warning', token: '--lumo-warning-color', hex: '#e0782e' },
      { name: 'Error', token: '--lumo-error-color', hex: '#d83e38' },
      { name: 'Body text', token: '--lumo-body-text-color', hex: '#1a202c' },
      { name: 'Secondary text', token: '--lumo-secondary-text-color', hex: '#5a6673' },
      { name: 'Base (white)', token: '--lumo-base-color', hex: '#ffffff' },
      { name: 'Contrast', token: '--lumo-contrast', hex: '#192434' },
    ],
  };
  // (Snapping is done per-field: sliders walk the scale by index; the color
  // field applies palette tokens directly. No standalone snap helper needed.)

  // ---- Color helpers -------------------------------------------------------
  function rgbToHex(rgb) {
    var m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(function (x) {
      return ('0' + parseInt(x, 10).toString(16)).slice(-2);
    }).join('');
  }
  function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : Math.round(n); }

  // ---- Property panel ------------------------------------------------------
  var panel = null;
  var panelRefreshers = [];   // fns that re-read computed style into inputs (for undo)

  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    panelRefreshers = [];
    hideHover();
  }
  function refreshPanelValues() {
    panelRefreshers.forEach(function (f) { try { f(); } catch (_) {} });
  }

  // A color field: design-system PALETTE swatches (primary choice), with a
  // picker + hex as the secondary escape hatch for off-palette colors.
  //  • Palette pick → css `var(--token)`, exported as the token.
  //  • Custom hex   → css + exported as the literal hex.
  function colorField(labelText, node, prop) {
    var swatches = TOKENS.palette.map(function (p) {
      var b = el('button', {
        class: 'de-swatch', title: p.name + '  (' + p.token + ')',
        style: 'background:' + p.hex,
        onclick: function () {
          applyProp(node, prop, 'var(' + p.token + ')', 'var(' + p.token + ') /* ' + p.name + ' */');
          markActiveSwatch(row, b);
        },
      }, []);
      b.__hex = p.hex;
      return b;
    });
    var picker = el('input', { type: 'color', value: '#000000', title: 'Custom color' });
    var hex = el('input', { type: 'text', placeholder: '#hex (custom)' });
    function commitCustom(v) {
      applyProp(node, prop, v, v);   // literal off-palette hex
      markActiveSwatch(row, null);
    }
    picker.addEventListener('input', function () { hex.value = picker.value; commitCustom(picker.value); });
    hex.addEventListener('change', function () {
      var v = hex.value.trim(); if (!v) return;
      commitCustom(v);
      if (/^#[0-9a-f]{6}$/i.test(v)) picker.value = v;
    });
    var swatchRow = el('div', { class: 'de-swatches' }, swatches);
    var customRow = el('div', { class: 'de-row de-custom' }, [picker, hex]);
    var row = el('div', {}, [swatchRow, customRow]);
    // Reflect current inline value onto the active swatch (for undo/redo).
    panelRefreshers.push(function () {
      var now = node.style.getPropertyValue(prop) || '';
      var match = null;
      swatches.forEach(function (b, i) {
        if (now.indexOf(TOKENS.palette[i].token) !== -1) match = b;
      });
      markActiveSwatch(row, match);
      var h = rgbToHex(now) || (/^#[0-9a-f]{6}$/i.test(now) ? now : '');
      if (h) { picker.value = h; hex.value = ''; }
    });
    return field(labelText, row);
  }
  function markActiveSwatch(row, active) {
    row.querySelectorAll('.de-swatch').forEach(function (b) {
      b.classList.toggle('de-swatch-on', b === active);
    });
  }

  // A slider that SNAPS to a design-system token scale. The readout shows the
  // snapped px + token name; the exported label is the token (var()), except
  // non-token scales (border width) which export the literal px.
  function sliderField(labelText, node, prop, scaleName) {
    var scale = TOKENS[scaleName];
    var maxIdx = scale.length - 1;
    // Pick the initial step nearest the element's current computed value.
    var startPx = px(getComputedStyle(node).getPropertyValue(prop));
    var startIdx = 0, bestD = Infinity;
    scale.forEach(function (s, i) { var d = Math.abs(s.px - startPx); if (d < bestD) { bestD = d; startIdx = i; } });

    var range = el('input', { type: 'range', min: 0, max: maxIdx, step: 1, value: startIdx });
    var readout = el('span', { class: 'de-val' }, [stepLabel(scale[startIdx])]);
    function isVarToken(t) { return t && t.indexOf('--') === 0; }
    function cssFor(s) { return isVarToken(s.token) ? 'var(' + s.token + ')' : s.token; }
    function labelFor(s) {
      return isVarToken(s.token)
        ? 'var(' + s.token + ')  /* ' + s.px + 'px */'
        : s.token;   // literal (e.g. "2px", "0")
    }
    range.addEventListener('input', function () {
      var s = scale[+range.value];
      readout.textContent = stepLabel(s);
      applyProp(node, prop, cssFor(s), labelFor(s));
    });
    panelRefreshers.push(function () {
      // Re-derive nearest step from the current inline/computed value.
      var now = px(node.style.getPropertyValue(prop) || getComputedStyle(node).getPropertyValue(prop));
      var idx = 0, bd = Infinity;
      scale.forEach(function (s, i) { var d = Math.abs(s.px - now); if (d < bd) { bd = d; idx = i; } });
      range.value = idx; readout.textContent = stepLabel(scale[idx]);
    });
    return field(labelText, el('div', { class: 'de-row' }, [range, readout]));
  }
  function stepLabel(s) {
    var t = s.token && s.token.indexOf('--') === 0 ? s.token.replace('--lumo-', '') : s.token;
    return s.px + 'px · ' + t;
  }

  // A select field (used for border-style and box-shadow presets).
  function selectField(labelText, options, initial, onChange) {
    var sel = el('select', {}, options.map(function (o) {
      return el('option', { value: o.value }, [o.label]);
    }));
    sel.value = initial;
    sel.addEventListener('change', function () { onChange(sel.value); });
    return { row: field(labelText, sel), select: sel };
  }

  function field(labelText, control) {
    return el('div', { class: 'de-field' }, [el('label', {}, [labelText]), control]);
  }

  // A <select> bound directly to a CSS property (literal keyword values). Syncs
  // its value on undo/redo via the panel refreshers.
  function plainSelect(labelText, values, node, prop) {
    var current = (node.style.getPropertyValue(prop) || getComputedStyle(node).getPropertyValue(prop) || values[0]).trim();
    var sel = el('select', {}, values.map(function (v) { return el('option', { value: v }, [v]); }));
    if (values.indexOf(current) >= 0) sel.value = current;
    sel.addEventListener('change', function () { applyProp(node, prop, sel.value, sel.value); });
    panelRefreshers.push(function () {
      var now = (node.style.getPropertyValue(prop) || '').trim();
      if (now && values.indexOf(now) >= 0) sel.value = now;
    });
    return field(labelText, sel);
  }

  // Collapsible accordion bucket. `open` sets the initial state.
  function accordion(title, open, buildBody) {
    var body = el('div', { class: 'de-acc-body' }, []);
    var head = el('button', {
      class: 'de-acc-head' + (open ? ' de-acc-open' : ''),
      onclick: function () {
        var isOpen = head.classList.toggle('de-acc-open');
        body.style.display = isOpen ? 'block' : 'none';
      },
    }, [el('span', { class: 'de-acc-caret' }, ['▸']), el('span', {}, [title])]);
    body.style.display = open ? 'block' : 'none';
    // Lazy-build so hidden sections cost nothing until first opened? We build
    // eagerly here — panels are small and refreshers must register up-front.
    buildBody(body);
    return el('div', { class: 'de-acc' }, [head, body]);
  }

  // Segmented button group (used for display, text-align, flex justify/align,
  // font-weight). Plain buttons with an .active class — avoids the vwc toggle
  // group quirks noted in the team memory. `options`: [{value,label,title?}].
  function segField(labelText, options, current, onChange) {
    var btns = [];
    var wrap = el('div', { class: 'de-seg' }, options.map(function (o) {
      var b = el('button', {
        class: 'de-seg-btn' + (o.value === current ? ' de-seg-on' : ''),
        title: o.title || o.label,
        onclick: function () {
          btns.forEach(function (x) { x.classList.remove('de-seg-on'); });
          b.classList.add('de-seg-on');
          onChange(o.value);
        },
      }, [o.label]);
      b.__value = o.value;
      btns.push(b);
      return b;
    }));
    wrap.__setActive = function (val) {
      btns.forEach(function (x) { x.classList.toggle('de-seg-on', x.__value === val); });
    };
    return { row: field(labelText, wrap), setActive: wrap.__setActive };
  }

  // A free-text size field (width/height/min/max): accepts auto, Npx, N%, etc.
  function sizeField(labelText, node, prop) {
    var input = el('input', { type: 'text', placeholder: 'auto', value: node.style.getPropertyValue(prop) || '' });
    input.addEventListener('change', function () {
      var v = input.value.trim();
      if (v) applyProp(node, prop, v, v);
      else { node.style.removeProperty(prop); var rec = deltas.get(node); if (rec) delete rec.changes[prop]; pruneIfEmpty(node); }
    });
    panelRefreshers.push(function () { input.value = node.style.getPropertyValue(prop) || ''; });
    return field(labelText, input);
  }

  // Per-side spacing (padding/margin) — a linked "all sides" slider plus a
  // toggle that expands to four independent side sliders. Each snaps to the
  // spacing scale. propBase e.g. 'padding' → 'padding-top' etc.
  function perSideField(labelText, node, propBase) {
    var sides = ['top', 'right', 'bottom', 'left'];
    var allRow = sliderField(labelText + ' (all)', node, propBase, 'spacing');
    var sideRows = el('div', { class: 'de-sides', style: 'display:none' },
      sides.map(function (s) { return sliderField('↳ ' + s, node, propBase + '-' + s, 'spacing'); }));
    var toggle = el('button', { class: 'de-side-toggle', title: 'Edit sides individually',
      onclick: function () {
        var open = sideRows.style.display === 'none';
        sideRows.style.display = open ? 'block' : 'none';
        toggle.classList.toggle('de-side-open', open);
      },
    }, ['⊕ sides']);
    var head = el('div', { class: 'de-perside-head' }, [toggle]);
    return el('div', {}, [allRow, head, sideRows]);
  }

  // A token slider that writes to a scoped TABLE RULE (all cells / rows / etc.)
  // instead of an inline style. `props` is one CSS property or an array of them
  // written together into the same rule — so one "Vertical" control can set both
  // padding-top and padding-bottom at once.
  function tableRuleSlider(labelText, node, ruleKey, selectorSuffix, props) {
    props = [].concat(props);
    var scale = TOKENS.spacing;
    var rec = deltas.get(node);
    var existing = rec && rec.tableRules[ruleKey] && rec.tableRules[ruleKey].decls[props[0]];
    var startIdx = 0;
    if (existing) { var ep = px(existing.css); scale.forEach(function (s, i) { if (s.px === ep) startIdx = i; }); }
    var range = el('input', { type: 'range', min: 0, max: scale.length - 1, step: 1, value: startIdx });
    var readout = el('span', { class: 'de-val' }, [stepLabel(scale[startIdx])]);
    function isVar(t) { return t && t.indexOf('--') === 0; }
    range.addEventListener('input', function () {
      var s = scale[+range.value];
      readout.textContent = stepLabel(s);
      var css = isVar(s.token) ? 'var(' + s.token + ')' : s.token;
      var label = isVar(s.token) ? 'var(' + s.token + ')  /* ' + s.px + 'px */' : s.token;
      // Write every prop into the SAME rule (one applyTableRule call per prop,
      // all sharing ruleKey/selector so they land in one rule block).
      props.forEach(function (p) { applyTableRule(node, ruleKey, selectorSuffix, p, css, label); });
    });
    panelRefreshers.push(function () {
      var r = deltas.get(node);
      var d = r && r.tableRules[ruleKey] && r.tableRules[ruleKey].decls[props[0]];
      var idx = 0; if (d) { var p = px(d.css); scale.forEach(function (s, i) { if (s.px === p) idx = i; }); }
      range.value = idx; readout.textContent = stepLabel(scale[idx]);
    });
    return field(labelText, el('div', { class: 'de-row' }, [range, readout]));
  }

  // An on/off toggle that applies (or clears) a whole table rule — used for
  // zebra striping, header emphasis, and dividers. `decls` is the map written
  // when on; off clears the rule. Optional `onToggle(on)` runs a side-effect
  // (e.g. dividers forcing border-collapse on the table itself).
  function tableToggle(labelText, node, ruleKey, selectorSuffix, decls, extraControl, onToggle) {
    var on = !!(deltas.get(node) && deltas.get(node).tableRules[ruleKey]);
    var seg = segField(labelText, [{ value: 'off', label: 'off' }, { value: 'on', label: 'on' }],
      on ? 'on' : 'off', function (v) {
        if (v === 'on') {
          Object.keys(decls).forEach(function (p) { applyTableRule(node, ruleKey, selectorSuffix, p, decls[p].css, decls[p].label); });
        } else {
          clearTableRule(node, ruleKey);
        }
        if (onToggle) onToggle(v === 'on');
        if (extraControl) extraControl.style.display = v === 'on' ? '' : 'none';
      });
    return seg.row;
  }

  // A palette color picker that writes one property into a table rule (e.g. the
  // zebra background, header background, divider color). Palette-first.
  function tableRuleColor(labelText, node, ruleKey, selectorSuffix, prop) {
    var swatches = TOKENS.palette.map(function (p) {
      return el('button', {
        class: 'de-swatch', title: p.name, style: 'background:' + p.hex,
        onclick: function () { applyTableRule(node, ruleKey, selectorSuffix, prop, 'var(' + p.token + ')', 'var(' + p.token + ') /* ' + p.name + ' */'); markActiveSwatch(row, this); },
      }, []);
    });
    var picker = el('input', { type: 'color', value: '#eef2f6', title: 'Custom' });
    picker.addEventListener('input', function () { applyTableRule(node, ruleKey, selectorSuffix, prop, picker.value, picker.value); markActiveSwatch(row, null); });
    var row = el('div', {}, [el('div', { class: 'de-swatches' }, swatches), el('div', { class: 'de-row de-custom' }, [picker])]);
    return field(labelText, row);
  }

  var SHADOW_PRESETS = {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,.08)',
    md: '0 2px 8px rgba(0,0,0,.12)',
    lg: '0 6px 20px rgba(0,0,0,.18)',
    xl: '0 12px 34px rgba(0,0,0,.24)',
  };

  // Read the element's live display type (used to auto-reveal flex/grid).
  function displayType(node) {
    return (node.style.display || getComputedStyle(node).display || '').trim();
  }

  // ---- Element navigator (breadcrumb + mini tree) --------------------------
  // A friendly, plain-language name for an element — used in the breadcrumb and
  // tree so they read like "the table" / ".results-toolbar" / "Search…" rather
  // than raw tags. Order: recognizable kind → short visible text → tag+class.
  function friendlyLabel(node) {
    var tag = node.tagName.toLowerCase();
    var cls = (typeof node.className === 'string' ? node.className : '').toLowerCase();
    var role = (node.getAttribute && (node.getAttribute('role') || '')).toLowerCase();
    var type = (node.getAttribute && (node.getAttribute('type') || '')).toLowerCase();
    // Recognizable structural kinds.
    if (tag === 'table' || tag === 'vaadin-grid' || role === 'grid') return 'table';
    if (tag === 'thead' || tag === 'tbody' || tag === 'tr' || tag === 'td' || tag === 'th') return tag;
    if (tag === 'form' || tag === 'fieldset') return 'form';
    if (tag === 'nav') return 'nav';
    if (tag === 'img' || tag === 'figure') return 'image';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (/^h[1-6]$/.test(tag)) return tag + ' heading';
    var isSearch = type === 'search' || /search/.test(cls) ||
      /search/.test((node.getAttribute && (node.getAttribute('placeholder') || node.getAttribute('aria-label') || '')).toLowerCase());
    if (isSearch) return 'search field';
    // A meaningful class token reads better than a tag alone.
    var firstClass = (typeof node.className === 'string' ? node.className : '').trim().split(/\s+/)
      .filter(function (c) { return c && !c.startsWith('de-'); })[0];
    if (firstClass) return tag + '.' + firstClass;
    // Short visible text (buttons, links, labels).
    var t = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    if (t && t.length <= 22) return tag + ' “' + t + '”';
    return tag;
  }

  // Hover-highlight overlay — a lightweight second outline that shows where a
  // breadcrumb/tree entry sits on the page, without changing the real selection.
  var hoverBox = el('div', { class: 'de-hoverbox' }, []);
  hoverBox.style.display = 'none';
  document.body.appendChild(hoverBox);
  function showHover(node) {
    if (!node || !node.getBoundingClientRect) { hideHover(); return; }
    var r = node.getBoundingClientRect();
    hoverBox.style.display = 'block';
    hoverBox.style.top = (r.top + window.scrollY) + 'px';
    hoverBox.style.left = (r.left + window.scrollX) + 'px';
    hoverBox.style.width = r.width + 'px';
    hoverBox.style.height = r.height + 'px';
  }
  function hideHover() { hoverBox.style.display = 'none'; }

  // The nearest selectable ancestor that isn't the editor's own chrome or the
  // page root — the breadcrumb/tree stop here (and at the shadow boundary).
  function selectableParent(node) {
    var p = node.parentElement;
    while (p && (isEditorEl(p))) p = p.parentElement;
    if (!p || p === document.documentElement) return null;
    return p;
  }
  function selectableChildren(node) {
    return Array.prototype.filter.call(node.children, function (c) {
      return c.nodeType === 1 && !isEditorEl(c) && c.getClientRects().length;
    });
  }

  // Breadcrumb: the ancestor chain from a shallow root down to the selection.
  // Click any crumb to reselect that element. Solves "I clicked the row but want
  // the container" in one click.
  function buildBreadcrumb(node) {
    var chain = [];
    var n = node;
    while (n && n.nodeType === 1 && n !== document.body && n !== document.documentElement && !isEditorEl(n)) {
      chain.unshift(n);
      n = n.parentElement;
    }
    // Cap the depth shown so the bar stays compact; keep the nearest ancestors.
    var MAX = 5;
    var shown = chain.length > MAX ? chain.slice(chain.length - MAX) : chain;
    var kids = [];
    if (shown.length < chain.length) { kids.push(el('span', { class: 'de-crumb-more' }, ['…'])); kids.push(sep()); }
    shown.forEach(function (el2, i) {
      var isSel = el2 === node;
      var crumb = el('button', {
        class: 'de-crumb' + (isSel ? ' de-crumb-sel' : ''),
        onmouseenter: function () { showHover(el2); },
        onmouseleave: hideHover,
        onclick: function () { hideHover(); select(el2); },
      }, [friendlyLabel(el2)]);
      kids.push(crumb);
      if (i < shown.length - 1) kids.push(sep());
    });
    return el('div', { class: 'de-crumbs' }, kids);
    function sep() { return el('span', { class: 'de-crumb-arrow' }, ['›']); }
  }

  // Mini tree: parent (one up), the selected node, and its direct children —
  // a friendly, element-scoped slice of the DOM. Click to jump; hover to locate.
  function buildTree(node) {
    var rows = [];
    var parent = selectableParent(node);
    if (parent) rows.push(treeRow(parent, 0, 'parent'));
    rows.push(treeRow(node, parent ? 1 : 0, 'self'));
    selectableChildren(node).slice(0, 20).forEach(function (c) {
      rows.push(treeRow(c, parent ? 2 : 1, 'child'));
    });
    return el('div', { class: 'de-tree' }, rows);

    function treeRow(target, depth, kind) {
      var r = el('button', {
        class: 'de-tree-row' + (target === node ? ' de-tree-self' : ''),
        style: 'padding-left:' + (8 + depth * 14) + 'px',
        title: selectorFor(target),
        onmouseenter: function () { showHover(target); },
        onmouseleave: hideHover,
        onclick: function () { hideHover(); select(target); },
      }, [
        el('span', { class: 'de-tree-tag' }, [friendlyLabel(target)]),
        kind === 'parent' ? el('span', { class: 'de-tree-hint' }, ['parent']) : null,
      ]);
      return r;
    }
  }

  // The navigator block: breadcrumb + a collapsible tree tab.
  function buildNavigator(node) {
    var tree = buildTree(node);
    tree.style.display = 'none';
    var toggle = el('button', {
      class: 'de-nav-toggle', title: 'Show element tree',
      onclick: function () {
        var open = tree.style.display === 'none';
        tree.style.display = open ? 'block' : 'none';
        toggle.classList.toggle('de-nav-open', open);
      },
    }, ['⊞ Tree']);
    return el('div', { class: 'de-nav' }, [
      el('div', { class: 'de-nav-head' }, [buildBreadcrumb(node), toggle]),
      tree,
    ]);
  }

  // Remembers the user's dragged/resized panel box so it survives the panel
  // being rebuilt on every reselect (and on display-type changes).
  var panelBox = null;   // { left, top, width, height }

  function openPanel(node) {
    closePanel();
    var children = [
      buildNavigator(node),
    ];

    if (isShadowComp(node)) {
      children.push(el('div', { class: 'de-warn' }, [
        '⚠ Vector component (shadow DOM). Host-level edits (spacing, position, size, radius, shadow) apply; text/background/border may not reach inside — those need theme custom-properties in the real file.',
      ]));
    }

    // ── Layout accordion (open) — display switcher + auto-revealed flex/grid,
    //    plus size. Changing display re-opens the panel so flex/grid appear.
    children.push(accordion('Layout', true, function (body) {
      var disp = displayType(node);
      var dispSeg = segField('Display',
        ['block', 'inline-block', 'flex', 'grid', 'inline', 'none'].map(function (v) { return { value: v, label: v }; }),
        ['block', 'inline-block', 'flex', 'grid', 'inline', 'none'].indexOf(disp) >= 0 ? disp : 'block',
        function (v) { applyProp(node, 'display', v, v); openPanel(node); /* re-reveal flex/grid */ });
      body.appendChild(dispSeg.row);

      if (/\bflex\b/.test(disp)) {
        body.appendChild(segField('Direction',
          [{ value: 'row', label: 'row' }, { value: 'column', label: 'col' }],
          (node.style.flexDirection || getComputedStyle(node).flexDirection || 'row'),
          function (v) { applyProp(node, 'flex-direction', v, v); }).row);
        body.appendChild(plainSelect('Justify', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
          node, 'justify-content'));
        body.appendChild(plainSelect('Align', ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
          node, 'align-items'));
        body.appendChild(segField('Wrap',
          [{ value: 'nowrap', label: 'no' }, { value: 'wrap', label: 'wrap' }],
          (node.style.flexWrap || getComputedStyle(node).flexWrap || 'nowrap'),
          function (v) { applyProp(node, 'flex-wrap', v, v); }).row);
        body.appendChild(sliderField('Gap', node, 'gap', 'spacing'));
      } else if (/\bgrid\b/.test(disp)) {
        body.appendChild(sizeField('Grid columns (template)', node, 'grid-template-columns'));
        body.appendChild(sizeField('Grid rows (template)', node, 'grid-template-rows'));
        body.appendChild(plainSelect('Justify items', ['stretch', 'start', 'center', 'end'], node, 'justify-items'));
        body.appendChild(plainSelect('Align items', ['stretch', 'start', 'center', 'end'], node, 'align-items'));
        body.appendChild(sliderField('Gap', node, 'gap', 'spacing'));
      }

      // If the element is itself a flex/grid CHILD, offer item controls.
      var parent = node.parentElement;
      if (parent && /\b(flex|grid)\b/.test(getComputedStyle(parent).display)) {
        body.appendChild(plainSelect('Align self', ['auto', 'stretch', 'flex-start', 'center', 'flex-end'], node, 'align-self'));
        body.appendChild(sizeField('Flex (grow shrink basis)', node, 'flex'));
        body.appendChild(sizeField('Order', node, 'order'));
      }

      body.appendChild(sizeField('Width', node, 'width'));
      body.appendChild(sizeField('Height', node, 'height'));
      body.appendChild(sizeField('Max width', node, 'max-width'));
    }));

    // ── Table accordion — context-aware, and PADDING-FIRST. Good table spacing
    //    comes from cell padding (not gaps), so that's the headline control when
    //    a <table> is selected; zebra/header/dividers add real polish; row height
    //    is a floor; border-spacing is demoted to "advanced" (detached-cell look).
    //    Zebra/header/dividers/cell-padding style DESCENDANTS via scoped rules.
    var ttag = node.tagName.toLowerCase();
    var isTable = ttag === 'table' || ttag === 'vaadin-grid';
    var isRow = ttag === 'tr';
    var isCell = ttag === 'td' || ttag === 'th';
    if (isTable || isRow || isCell) {
      children.push(accordion('Table', true, function (body) {
        if (isTable) {
          // 1) Cell padding — the real "row/column airiness" control, all cells.
          //    One control per axis: Vertical writes top+bottom, Horizontal
          //    writes left+right, so content stays centered with equal spacing.
          body.appendChild(el('h4', {}, ['Cell padding (all cells)']));
          body.appendChild(tableRuleSlider('Vertical (top & bottom)', node, 'cellPadY', ' td, th', ['padding-top', 'padding-bottom']));
          body.appendChild(tableRuleSlider('Horizontal (left & right)', node, 'cellPadX', ' td, th', ['padding-left', 'padding-right']));

          // 2) Polish — zebra striping, header emphasis.
          //    Selector targets the alt rows AND their cells (some tables paint
          //    the <tr>, others the <td>; hitting both makes the stripe show
          //    regardless). The default stripe uses --lumo-contrast-5pct, the
          //    canonical zebra token — but it's only ~5% opacity, so it can look
          //    like "nothing happened" over a light table; the Stripe-color
          //    picker below lets you bump to a stronger palette value.
          body.appendChild(el('h4', {}, ['Rows']));
          var ZEBRA_SEL = ' tr:nth-child(even), tr:nth-child(even) td, tr:nth-child(even) th';
          var zebraColor = el('div', { style: (deltas.get(node) && deltas.get(node).tableRules['zebra']) ? '' : 'display:none' }, [
            tableRuleColor('Stripe color', node, 'zebra', ZEBRA_SEL, 'background-color'),
          ]);
          body.appendChild(tableToggle('Zebra striping', node, 'zebra', ZEBRA_SEL,
            { 'background-color': { css: 'var(--lumo-contrast-5pct)', label: 'var(--lumo-contrast-5pct)' } },
            zebraColor));
          body.appendChild(el('div', { class: 'de-note' }, ['Default stripe is the ~5% zebra token (subtle). Use Stripe color to make it more visible.']));
          body.appendChild(zebraColor);

          // Header: cover both <thead> tables and header-in-first-row tables.
          var HEADER_SEL = ' thead th, thead td, tr:first-child th';
          var headerControls = el('div', { style: (deltas.get(node) && deltas.get(node).tableRules['header']) ? '' : 'display:none' }, [
            tableRuleColor('Header background', node, 'header', HEADER_SEL, 'background-color'),
          ]);
          body.appendChild(tableToggle('Header emphasis', node, 'header', HEADER_SEL,
            { 'background-color': { css: 'var(--lumo-contrast-10pct)', label: 'var(--lumo-contrast-10pct)' },
              'font-weight': { css: '700', label: '700' } },
            headerControls));
          body.appendChild(headerControls);

          // 3) Dividers. Row dividers must survive border-collapse: on a
          //    collapsed table a per-cell border-bottom competes with the next
          //    row's border-top and can lose — which is why only column dividers
          //    seemed to work. Turning on a divider forces the table to
          //    border-collapse: collapse so shared edges merge into one clean
          //    line, and applies the border to BOTH cells + rows to win either
          //    model. `onToggle` also sets the table's own collapse mode.
          body.appendChild(el('h4', {}, ['Dividers']));
          var divColor = el('div', { style: (deltas.get(node) && (deltas.get(node).tableRules['rowDiv'] || deltas.get(node).tableRules['colDiv'])) ? '' : 'display:none' }, [
            tableRuleColor('Divider color', node, 'divColor', ' td, th', 'border-color'),
          ]);
          function ensureCollapsedForDividers(on) {
            // Collapse is what makes single-line dividers reliable. Set it when
            // any divider is on; leave it when both are off.
            if (on) applyProp(node, 'border-collapse', 'collapse', 'collapse');
          }
          body.appendChild(tableToggle('Row dividers', node, 'rowDiv', ' td, th',
            { 'border-bottom': { css: '1px solid var(--lumo-contrast-10pct)', label: '1px solid var(--lumo-contrast-10pct)' } },
            divColor, ensureCollapsedForDividers));
          body.appendChild(tableToggle('Column dividers', node, 'colDiv', ' td, th',
            { 'border-right': { css: '1px solid var(--lumo-contrast-10pct)', label: '1px solid var(--lumo-contrast-10pct)' } },
            divColor, ensureCollapsedForDividers));
          body.appendChild(divColor);
        } else if (isRow) {
          body.appendChild(sizeField('Row height', node, 'height'));
          body.appendChild(el('div', { class: 'de-note' }, ['Tip: select the table itself for cell padding, zebra striping, header styling, and dividers applied to the whole table.']));
        } else if (isCell) {
          // Column operations — reorder / hide the whole column this cell is in.
          var ci = colInfo(node);
          if (ci) {
            body.appendChild(el('h4', {}, ['Column: ' + (ci.names[ci.index] || ('#' + (ci.index + 1)))]));
            var isHidden = node.style.display === 'none';
            var leftBtn = el('button', { class: 'de-seg-btn', title: 'Move column left',
              onclick: function () {
                var t = ci.table, idx = ci.index;
                if (idx <= 0) { showToast('Already the first column'); return; }
                var newIdx = moveColumn(t, idx, -1, ci.names);
                // Reselect the moved cell at its new index so the panel follows it.
                reselectColumnCell(t, newIdx, node);
              } }, ['◀ Move left']);
            var rightBtn = el('button', { class: 'de-seg-btn', title: 'Move column right',
              onclick: function () {
                var t = ci.table, idx = ci.index;
                if (idx >= ci.count - 1) { showToast('Already the last column'); return; }
                var newIdx = moveColumn(t, idx, 1, ci.names);
                reselectColumnCell(t, newIdx, node);
              } }, ['Move right ▶']);
            var hideBtn = el('button', { class: 'de-seg-btn' + (isHidden ? ' de-seg-on' : ''), title: 'Hide the whole column (exports as “remove column”)',
              onclick: function () {
                hideColumn(ci.table, ci.index, !isHidden, ci.names);
                showToast(!isHidden ? 'Column hidden (exports as “remove”)' : 'Column shown');
                if (selected) positionOutline(selected);
                openPanel(node);   // refresh the hide button state
              } }, [isHidden ? 'Hidden — click to show' : 'Hide column']);
            body.appendChild(el('div', { class: 'de-seg', style: 'margin-bottom:10px' }, [leftBtn, rightBtn, hideBtn]));

            // Column map — chips showing order; current highlighted, click to jump.
            var chips = ci.names.map(function (nm, i) {
              return el('button', {
                class: 'de-colchip' + (i === ci.index ? ' de-colchip-on' : ''),
                title: 'Select this column',
                onclick: function () { reselectColumnCell(ci.table, i, node); },
              }, [nm || ('#' + (i + 1))]);
            });
            body.appendChild(el('div', { class: 'de-colmap' }, chips));
            body.appendChild(el('div', { class: 'de-note' }, ['Reordering physically swaps the header + all cells; Hide removes the column on export. Undoable.']));
          } else {
            body.appendChild(el('div', { class: 'de-note' }, ['Column ops need a simple table (no colspan/rowspan). This table uses spans, so column reordering is disabled.']));
          }
          body.appendChild(el('h4', {}, ['This cell']));
          body.appendChild(sizeField('Cell height', node, 'height'));
          body.appendChild(perSideField('Cell padding', node, 'padding'));
          body.appendChild(el('div', { class: 'de-note' }, ['These adjust just this one cell. For all cells at once, select the table.']));
        }
      }));
    }

    // ── Spacing accordion — per-side padding/margin (token-snapped).
    children.push(accordion('Spacing', false, function (body) {
      body.appendChild(perSideField('Padding', node, 'padding'));
      body.appendChild(perSideField('Margin', node, 'margin'));
    }));

    // ── Border accordion — width/style/color + radius.
    children.push(accordion('Border', false, function (body) {
      body.appendChild(sliderField('Width', node, 'border-width', 'borderWidth'));
      body.appendChild(selectField('Style',
        ['none', 'solid', 'dashed', 'dotted'].map(function (v) { return { value: v, label: v }; }),
        (node.style.borderStyle || getComputedStyle(node).borderStyle || 'none').split(' ')[0],
        function (v) { applyProp(node, 'border-style', v, v); }).row);
      body.appendChild(colorField('Color', node, 'border-color'));
      body.appendChild(sliderField('Radius', node, 'border-radius', 'radius'));
    }));

    // ── Typography accordion.
    children.push(accordion('Typography', false, function (body) {
      body.appendChild(colorField('Text color', node, 'color'));
      body.appendChild(sliderField('Font size', node, 'font-size', 'fontSize'));
      body.appendChild(plainSelect('Weight', ['300', '400', '500', '600', '700', '800'], node, 'font-weight'));
      body.appendChild(segField('Align',
        ['left', 'center', 'right', 'justify'].map(function (v) { return { value: v, label: v }; }),
        (node.style.textAlign || getComputedStyle(node).textAlign || 'left'),
        function (v) { applyProp(node, 'text-align', v, v); }).row);
      body.appendChild(sizeField('Line height', node, 'line-height'));
      body.appendChild(sizeField('Letter spacing', node, 'letter-spacing'));
    }));

    // ── Effects accordion — background, shadow, opacity.
    children.push(accordion('Effects', false, function (body) {
      body.appendChild(colorField('Background', node, 'background-color'));
      var curShadow = node.style.boxShadow;
      var presetKey = 'none';
      Object.keys(SHADOW_PRESETS).forEach(function (k) { if (SHADOW_PRESETS[k] === curShadow) presetKey = k; });
      body.appendChild(selectField('Box shadow', [
        { value: 'none', label: 'None' }, { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'X-Large' },
      ], presetKey, function (v) {
        applyProp(node, 'box-shadow', SHADOW_PRESETS[v],
          v === 'none' ? 'none' : SHADOW_PRESETS[v] + ' /* ' + v + ' elevation — use the nearest --lumo elevation token */');
      }).row);
      body.appendChild(sizeField('Opacity (0–1)', node, 'opacity'));
    }));

    children.push(el('div', { class: 'de-note' }, ['Wrong element? Use the breadcrumb/tree above, Alt-click for parent, or arrow keys (↑parent ↓child ←→siblings). Pixel values snap to tokens; colors use the palette. Move (M) reposition → screenshot. All edits undoable.']));

    // Header (drag handle) — carries the selector; body scrolls; grip resizes.
    var header = el('div', { class: 'de-panel-header', title: 'Drag to move' }, [
      el('span', { class: 'de-drag-dots' }, ['⠿']),
      el('div', { class: 'de-panel-title' }, [
        el('h4', {}, ['Selected element']),
        el('div', { class: 'de-sel', title: selectorFor(node) }, [selectorFor(node)]),
      ]),
    ]);
    var body = el('div', { class: 'de-panel-body' }, children);
    var grip = el('div', { class: 'de-panel-grip', title: 'Drag to resize' }, []);

    panel = el('div', { class: 'de-panel', 'data-design-editor': '' }, [header, body, grip]);
    document.body.appendChild(panel);

    // Restore a remembered box, else position near the selection.
    if (panelBox) {
      applyPanelBox(panelBox);
    } else {
      var r = node.getBoundingClientRect();
      var pw = 330, ph = 560;
      var left = r.right + 12 + pw < window.innerWidth ? r.right + 12 : Math.max(12, r.left - pw - 12);
      var top = Math.min(Math.max(12, r.top), Math.max(12, window.innerHeight - ph - 12));
      panel.style.left = Math.max(12, left) + 'px';
      panel.style.top = Math.max(12, top) + 'px';
    }

    wirePanelDrag(header);
    wirePanelResize(grip);
  }

  function applyPanelBox(box) {
    panel.style.left = box.left + 'px';
    panel.style.top = box.top + 'px';
    panel.style.width = box.width + 'px';
    panel.style.height = box.height + 'px';
  }
  function savePanelBox() {
    var r = panel.getBoundingClientRect();
    panelBox = { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  // Drag the panel by its header. Ignores drags that start on a button/input in
  // the header (there are none today, but keeps it safe).
  function wirePanelDrag(header) {
    header.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || e.target.closest('button,input,select')) return;
      e.preventDefault();
      var r = panel.getBoundingClientRect();
      var offX = e.clientX - r.left, offY = e.clientY - r.top;
      function move(ev) {
        var left = Math.max(0, Math.min(ev.clientX - offX, window.innerWidth - 40));
        var top = Math.max(0, Math.min(ev.clientY - offY, window.innerHeight - 30));
        panel.style.left = left + 'px'; panel.style.top = top + 'px';
      }
      function up() {
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
        savePanelBox();
      }
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
    });
  }

  // Resize from the bottom-right grip. Respects the CSS min/max via clamping.
  function wirePanelResize(grip) {
    grip.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      var r = panel.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY, startW = r.width, startH = r.height;
      function move(ev) {
        var w = Math.max(260, Math.min(startW + (ev.clientX - startX), window.innerWidth * 0.96));
        var h = Math.max(220, Math.min(startH + (ev.clientY - startY), window.innerHeight * 0.92));
        panel.style.width = w + 'px'; panel.style.height = h + 'px';
      }
      function up() {
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
        savePanelBox();
      }
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
    });
  }

  // ---- Selection + tools ----------------------------------------------------
  function select(node) {
    selected = node;
    positionOutline(node);
    if (tool === 'select') openPanel(node);
    else closePanel();
  }
  // After a column op, select the cell now sitting at `idx` in the same row as
  // the previously-selected cell — so the panel stays on the column you moved.
  function reselectColumnCell(table, idx, prevCell) {
    var row = prevCell && prevCell.closest ? prevCell.closest('tr') : (table.querySelector('tr'));
    var target = null;
    if (row) {
      var cs = Array.prototype.filter.call(row.children, function (c) { return c.tagName === 'TD' || c.tagName === 'TH'; });
      target = cs[idx];
    }
    select(target || prevCell);
  }
  function deselect() {
    selected = null;
    outline.style.display = 'none';
    closePanel();
  }
  function setTool(next) {
    tool = next;
    document.body.classList.toggle('de-move-mode', tool === 'move');
    updateDockState();
    if (selected) { positionOutline(selected); if (tool === 'select') openPanel(selected); else closePanel(); }
    showToast(tool === 'move' ? 'Move tool — drag to reposition; the screenshot captures the new position' : 'Select tool — click an element to edit');
  }

  // ---- Pointer handling -----------------------------------------------------
  var drag = null;   // { node, startX, startY, baseDx, baseDy, lastDx, lastDy, moved }

  // Read the element's current translate so repeated drags accumulate.
  function currentTranslate(node) {
    var m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(node.style.transform || '');
    return m ? { dx: parseFloat(m[1]), dy: parseFloat(m[2]) } : { dx: 0, dy: 0 };
  }
  function onMouseDown(e) {
    if (tool !== 'move' || isEditorEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var node = e.target;
    var base = currentTranslate(node);
    drag = { node: node, startX: e.clientX, startY: e.clientY, baseDx: base.dx, baseDy: base.dy, lastDx: base.dx, lastDy: base.dy, moved: false };
    selected = node;
    positionOutline(node);
    document.body.classList.add('de-dragging');
  }
  function onMouseMoveDrag(e) {
    if (!drag) return;
    var dx = drag.baseDx + (e.clientX - drag.startX);
    var dy = drag.baseDy + (e.clientY - drag.startY);
    drag.moved = true;
    // Live preview WITHOUT pushing an undo op per mousemove — set transform
    // directly; commit one undoable op on mouseup.
    setTranslate(drag.node, dx, dy);
    drag.lastDx = dx; drag.lastDy = dy;
    positionOutline(drag.node);
  }
  function onMouseUp() {
    if (!drag) return;
    document.body.classList.remove('de-dragging');
    if (drag.moved) {
      // Reset to base, then commit through applyMove so undo captures it cleanly.
      var node = drag.node, dx = drag.lastDx, dy = drag.lastDy;
      setTranslate(node, drag.baseDx, drag.baseDy);
      applyMove(node, dx, dy);
    }
    drag = null;
  }

  function onClick(e) {
    if (isEditorEl(e.target)) return;   // our own chrome behaves normally
    e.preventDefault();
    e.stopPropagation();
    if (tool === 'move') return;        // move handled via mousedown/up
    // Alt/Option-click selects the PARENT of what you clicked — quick way past
    // a small inner element to its container.
    if (e.altKey) {
      var p = selectableParent(e.target);
      select(p || e.target);
    } else {
      select(e.target);
    }
  }
  function onHover(e) {
    if (drag) return;
    if (isEditorEl(e.target)) return;
    // In select mode, only preview-outline while nothing is locked in.
    if (tool === 'select' && selected) return;
    positionOutline(e.target);
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('mousemove', onHover, true);
  document.addEventListener('mousedown', onMouseDown, true);
  document.addEventListener('mousemove', onMouseMoveDrag, true);
  document.addEventListener('mouseup', onMouseUp, true);
  window.addEventListener('scroll', function () { if (selected) positionOutline(selected); }, true);
  window.addEventListener('resize', function () { if (selected) positionOutline(selected); });

  function onKey(e) {
    if (/input|textarea|select/i.test((e.target.tagName || '')) && !e.target.closest('.de-dock')) return;
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (e.key === 'Escape') { deselect(); }
    else if (e.key.toLowerCase() === 'v') { setTool('select'); }
    else if (e.key.toLowerCase() === 'm') { setTool('move'); }
    // Arrow-key DOM navigation once something is selected (select tool only):
    //   ↑ parent · ↓ first child · ← prev sibling · → next sibling
    else if (selected && tool === 'select' && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) {
      e.preventDefault();
      var next = null;
      if (e.key === 'ArrowUp') next = selectableParent(selected);
      else if (e.key === 'ArrowDown') next = selectableChildren(selected)[0];
      else if (e.key === 'ArrowLeft') next = prevSelectableSibling(selected);
      else if (e.key === 'ArrowRight') next = nextSelectableSibling(selected);
      if (next) select(next);
    }
  }
  function prevSelectableSibling(node) {
    var s = node.previousElementSibling;
    while (s && (isEditorEl(s) || !s.getClientRects().length)) s = s.previousElementSibling;
    return s;
  }
  function nextSelectableSibling(node) {
    var s = node.nextElementSibling;
    while (s && (isEditorEl(s) || !s.getClientRects().length)) s = s.nextElementSibling;
    return s;
  }
  document.addEventListener('keydown', onKey, true);

  // ---- Toast ----------------------------------------------------------------
  var toast = el('div', { class: 'de-toast' }, ['']);
  document.body.appendChild(toast);
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('de-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('de-show'); }, 1900);
  }

  // ---- html2canvas (self-contained loader) ---------------------------------
  var _h2c;
  function loadHtml2Canvas() {
    if (_h2c) return _h2c;
    _h2c = new Promise(function (resolve, reject) {
      if (window.html2canvas) return resolve(window.html2canvas);
      var s = document.createElement('script');
      s.src = HTML2CANVAS_URL;
      s.onload = function () { resolve(window.html2canvas); };
      s.onerror = function () { reject(new Error('html2canvas load failed')); };
      document.head.appendChild(s);
    });
    return _h2c;
  }
  // Capture the full page (or the edited region) to a downscaled JPEG data URL.
  // We hide our own chrome during capture so screenshots are clean.
  function captureViewport() {
    return loadHtml2Canvas().then(function (h2c) {
      var hidden = [dock, outline, panel, toast].filter(Boolean);
      hidden.forEach(function (n) { n.dataset.dePrevVis = n.style.visibility || ''; n.style.visibility = 'hidden'; });
      document.querySelectorAll('.de-modal').forEach(function (n) { n.style.visibility = 'hidden'; });
      return h2c(document.body, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#fff',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true, logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        x: window.scrollX, y: window.scrollY,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      }).then(function (canvas) {
        hidden.forEach(function (n) { n.style.visibility = n.dataset.dePrevVis || ''; delete n.dataset.dePrevVis; });
        document.querySelectorAll('.de-modal').forEach(function (n) { n.style.visibility = ''; });
        // Downscale to keep the data URL paste-friendly.
        var MAX = 1400;
        if (canvas.width > MAX) {
          var out = document.createElement('canvas');
          var ratio = MAX / canvas.width;
          out.width = MAX; out.height = Math.round(canvas.height * ratio);
          out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
          canvas = out;
        }
        return canvas.toDataURL('image/jpeg', 0.85);
      });
    });
  }

  // ---- Export ---------------------------------------------------------------
  // The prompt calls out WHAT changed, not brittle geometry. Two registers:
  //   • VALUES — property edits. Pixel values are snapped to design-system
  //              tokens (a 17px margin → the 16px spacing step) and colors to
  //              palette tokens, so Claude applies the token, not a magic number.
  //   • MOVED  — an element was repositioned. We name WHICH element and defer
  //              its new placement entirely to the screenshot (the browser tool
  //              is not pixel-precise, and the image shows position best).

  // A short scannable header for one element's section: its label + a compact
  // locator (selector, line) the designer can eyeball and Claude can anchor on.
  function elementHeading(rec, index) {
    var label = rec.text ? '"' + rec.text + '"' : rec.selector;
    var meta = [];
    if (rec.text) meta.push(rec.selector);          // selector as secondary when text is the label
    if (rec.line) meta.push('line ' + rec.line);
    var suffix = meta.length ? '  (' + meta.join(', ') + ')' : '';
    return '### ' + index + '. ' + label + suffix;
  }

  // Build the prompt grouped BY ELEMENT — everything changed on one element in
  // one place. Values are token-aware; moves defer to the screenshot.
  function buildPrompt() {
    if (!deltas.size) return 'No edits were made.';

    var sections = [];
    var index = 0;
    var files = {};
    var anyMove = false;
    deltas.forEach(function (rec) {
      var vals = [];   // [prop, label] pairs
      Object.keys(rec.changes).forEach(function (p) { vals.push([p, rec.changes[p].label]); });
      // Table descendant rules → exported as scoped CSS rule lines.
      var ruleKeys = Object.keys(rec.tableRules || {});
      var rules = ruleKeys.map(function (rid) {
        var rule = rec.tableRules[rid];
        var decls = Object.keys(rule.decls).map(function (p) { return p + ': ' + rule.decls[p].label; });
        return { suffix: rule.selectorSuffix.trim(), decls: decls };
      }).filter(function (r) { return r.decls.length; });
      // Column operations → precise structural instructions.
      var colOps = (rec.colOps || []).map(function (op) {
        if (op.kind === 'move') return 'Move the "' + op.name + '" column ' + op.dir + ' (swap it with the "' + op.beside + '" column).';
        if (op.kind === 'remove') return 'Remove the "' + op.name + '" column entirely (its header + every cell in that column).';
        return null;
      }).filter(Boolean);
      if (rec.moved) anyMove = true;
      if (!vals.length && !rec.moved && !rules.length && !colOps.length) return;
      files[rec.file] = true;
      sections.push({ rec: rec, vals: vals, moved: rec.moved, rules: rules, colOps: colOps });
    });

    var fileKeys = Object.keys(files);
    var multiFile = fileKeys.length > 1;

    var sectionText = sections.map(function (s) {
      var rec = s.rec;
      index += 1;
      var lines = [elementHeading(rec, index)];
      if (multiFile) lines.push('File: `' + rec.file + '`');
      if (s.vals.length) {
        // Align property names into a column so values line up for scanning.
        var pad = s.vals.reduce(function (m, kv) { return Math.max(m, kv[0].length); }, 0) + 1;
        lines.push('VALUES:');
        s.vals.forEach(function (kv) {
          lines.push('    ' + (kv[0] + ':' + '                    ').slice(0, pad + 1) + ' ' + kv[1]);
        });
      }
      if (s.rules && s.rules.length) {
        lines.push('TABLE RULES — apply to the table\'s descendants (scope each to this table):');
        s.rules.forEach(function (r) {
          lines.push('    ' + (r.suffix || '(cells)') + ' { ' + r.decls.join('; ') + ' }');
        });
      }
      if (s.colOps && s.colOps.length) {
        lines.push('COLUMNS — structural table changes (apply to the markup, in order):');
        s.colOps.forEach(function (c) { lines.push('    • ' + c); });
      }
      if (s.moved) {
        lines.push('MOVED — repositioned; see the screenshot for its new placement.');
      }
      return lines.join('\n');
    });

    var out = [];
    out.push('Apply these design edits made in the visual editor. Notes on how to read them:');
    out.push('  • VALUES — pixel values are already SNAPPED to the design-system scale and colors to palette tokens. Apply the named token (e.g. `var(--lumo-space-m)`), not a raw pixel number. Never introduce an off-scale value like 17px — use the token shown.');
    out.push('  • MOVED  — the element was repositioned. Its NEW POSITION is shown in the attached screenshot — match the screenshot by editing the markup/CSS to fit the existing layout (reorder elements, adjust flex/grid). Do NOT hard-code a transform or absolute offset.');
    out.push('  • TABLE RULES — CSS to apply to a table\'s descendant cells/rows (padding, zebra striping, header, dividers). Scope each rule to that specific table (e.g. via its class or a wrapping selector), not globally.');
    out.push('  • COLUMNS — structural edits to a table: reorder or remove whole columns (header + every cell in that column). Apply them to the markup in the order listed.');
    out.push('Keep all existing Vector web components and markup intact — only make the changes below.');
    if (anyMove) out.push('IMPORTANT: the attached screenshot is the source of truth for all repositioning — always reference it for MOVED elements.');
    out.push('');
    out.push('## Edits' + (!multiFile && fileKeys.length ? ' — ' + fileKeys[0] : ''));
    out.push('');
    out.push(sectionText.join('\n\n'));
    return out.join('\n');
  }

  // Copy an <img>'s bitmap to the clipboard as a PNG (falls back to a note).
  function copyImage(img) {
    if (!img || !window.ClipboardItem || !navigator.clipboard || !navigator.clipboard.write) {
      showToast('Right-click the image → Copy image'); return;
    }
    var c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    c.toBlob(function (blob) {
      if (!blob) { showToast('Right-click the image → Copy image'); return; }
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(
        function () { showToast('Image copied — paste into Claude'); },
        function () { showToast('Right-click the image → Copy image'); }
      );
    }, 'image/png');
  }

  function openExport() {
    var text = buildPrompt();
    function copyPrompt() {
      navigator.clipboard.writeText(text).then(
        function () { showToast('Prompt copied — paste into Claude'); },
        function () { showToast('Copy failed'); });
    }
    var body = [
      el('h3', {}, ['Export edits → paste into Claude']),
      el('p', { class: 'de-modal-sub' }, [deltas.size ? (deltas.size + ' element(s) edited. Copy the prompt and the screenshot into your Claude session.') : 'No edits recorded yet.']),
      el('h4', {}, ['Prompt']),
      // Scroll-capped box; copy button reveals on hover, top-right.
      el('div', { class: 'de-promptwrap' }, [
        el('button', { class: 'de-copy-hover', title: 'Copy prompt', onclick: copyPrompt }, ['📋 Copy']),
        el('pre', {}, [text]),
      ]),
    ];

    var shotsWrap = el('div', {}, []);
    body.push(el('h4', {}, ['Screenshot']));
    var shotBtn = el('button', {}, ['📸 Capture current view']);
    body.push(el('div', { class: 'de-bar' }, [shotBtn]));
    body.push(shotsWrap);

    shotBtn.addEventListener('click', function () {
      shotBtn.disabled = true; shotBtn.textContent = 'Capturing…';
      captureViewport().then(function (dataUrl) {
        shotsWrap.innerHTML = '';
        // Thumbnail; click to open the full-resolution capture in a new tab.
        var img = el('img', { src: dataUrl, alt: 'current view', title: 'Click to view full size' });
        img.addEventListener('click', function () {
          var w = window.open();
          if (w) w.document.write('<img src="' + dataUrl + '" style="max-width:100%">');
        });
        var copyBtn = el('button', { onclick: function () { copyImage(img); } }, ['📋 Copy image']);
        shotsWrap.appendChild(el('div', { class: 'de-shots' }, [
          el('div', { class: 'de-shot' }, [el('span', {}, ['Current view']), img, el('div', { class: 'de-bar' }, [copyBtn])]),
        ]));
        shotBtn.disabled = false; shotBtn.textContent = '📸 Re-capture';
      }).catch(function (err) {
        shotBtn.disabled = false; shotBtn.textContent = '📸 Capture current view';
        showToast('Screenshot failed: ' + err.message);
      });
    });

    body.push(el('div', { class: 'de-modal-actions' }, [
      el('button', { class: 'de-close', onclick: function () { modal.remove(); } }, ['Close']),
    ]));

    var modal = el('div', { class: 'de-modal', 'data-design-editor': '' }, [el('div', { class: 'de-modal-box' }, body)]);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // ---- Dock -----------------------------------------------------------------
  var selectBtn, moveBtn, undoBtn, redoBtn;
  var dock = el('div', { class: 'de-dock', 'data-design-editor': '' }, [
    el('span', { class: 'de-title' }, ['✏️ Editor']),
    el('span', { class: 'de-sep' }),
    (selectBtn = el('button', { class: 'de-active', title: 'Select tool (V)', onclick: function () { setTool('select'); } }, ['⌖ Select'])),
    (moveBtn = el('button', { title: 'Move tool (M)', onclick: function () { setTool('move'); } }, ['✥ Move'])),
    el('span', { class: 'de-sep' }),
    (undoBtn = el('button', { title: 'Undo (⌘Z)', onclick: undo }, ['↶'])),
    (redoBtn = el('button', { title: 'Redo (⌘⇧Z)', onclick: redo }, ['↷'])),
    el('span', { class: 'de-sep' }),
    el('button', { class: 'de-primary', onclick: openExport }, ['Finish & Export']),
    el('button', { title: 'Exit editor', onclick: function () { window.__designEditor.destroy(); } }, ['✕']),
  ]);
  function updateDockState() {
    selectBtn.classList.toggle('de-active', tool === 'select');
    moveBtn.classList.toggle('de-active', tool === 'move');
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }
  document.body.appendChild(dock);
  updateDockState();
  showToast('Editor on — Select an element, or press M to move');

  // ---- Teardown -------------------------------------------------------------
  window.__designEditor = {
    destroy: function () {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('mousemove', onHover, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onMouseMoveDrag, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      document.removeEventListener('keydown', onKey, true);
      document.body.classList.remove('de-move-mode', 'de-dragging');
      [styleEl, outline, hoverBox, dock, toast].forEach(function (n) { n && n.remove(); });
      // Keep table-rule styling in place so edits stay visible after exit (same
      // as inline edits persisting). Unmark it so a re-inject doesn't treat it
      // as reusable chrome — the fresh session rebuilds its own from deltas.
      if (tableStyle) { tableStyle.removeAttribute('data-design-editor'); tableStyle = null; }
      closePanel();
      document.querySelectorAll('.de-modal').forEach(function (n) { n.remove(); });
      window.__designEditor = null;
    },
  };
})();
