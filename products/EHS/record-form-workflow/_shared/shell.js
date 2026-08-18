/* =============================================================================
   EHS record form workflow — shared rendering helpers
   =============================================================================
   Chrome, field rendering, live-value wiring, donuts and toasts. Every version
   builds its own progress shell on top of these, so the form content itself is
   identical across concepts and only the navigation differs.
   ========================================================================== */

window.EHS_UI = (function () {
  'use strict';

  var M = window.EHS_FORM;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Status vocabulary ─────────────────────────────────────────────────── */
  var LABELS = {
    complete: 'Complete',
    partial: 'In progress',
    empty: 'Not started',
    optional: 'Optional',
    na: 'Not applicable',
    system: 'System'
  };
  var ICONS = {
    complete: 'fa-circle-check',
    partial: 'fa-circle-half-stroke',
    empty: 'fa-circle',
    optional: 'fa-circle-dashed',
    na: 'fa-ban',
    system: 'fa-lock'
  };
  function stateLabel(s) { return LABELS[s] || s; }
  function stateIcon(s) { return ICONS[s] || 'fa-circle'; }

  function srcTag(f) {
    if (!f.src || f.src === 'none') return '';
    var src = M.SOURCES.filter(function (s) { return s.id === f.src; })[0];
    if (!src) return '';
    return '<span class="src-tag src-' + f.src + '" title="' + esc(src.note) + '">' + esc(src.label) + '</span>';
  }

  /* ── Chrome ────────────────────────────────────────────────────────────── */
  function topnav() {
    var items = ['Home', 'Incidents', 'Claims', 'Inspections', 'Hazards', 'Observations',
                 'Corrective Actions', 'Training', 'More'];
    return '' +
      '<nav class="topnav">' +
        '<div class="topnav-logo"><span class="vs-mark">V</span><span>Vector Solutions</span></div>' +
        '<div class="topnav-items">' +
          items.map(function (t) {
            var on = t === 'Incidents' ? ' active' : '';
            var caret = (t === 'Incidents' || t === 'Hazards' || t === 'Corrective Actions')
              ? '' : ' <i class="fa-solid fa-chevron-down"></i>';
            return '<a class="topnav-item' + on + '" href="#">' + t + caret + '</a>';
          }).join('') +
        '</div>' +
        '<div class="topnav-right">' +
          '<div class="nav-icon-btn"><i class="fa-solid fa-table-cells"></i></div>' +
          '<div class="nav-icon-btn"><i class="fa-solid fa-circle-user"></i></div>' +
          '<div class="is-badge">IndustrySafe</div>' +
        '</div>' +
      '</nav>';
  }

  function ribbon(name, blurb, tags) {
    return '' +
      '<div class="concept-ribbon">' +
        '<strong>' + esc(name) + '</strong>' +
        '<span>' + esc(blurb) + '</span>' +
        (tags || []).map(function (t) { return '<span class="ribbon-tag">' + esc(t) + '</span>'; }).join('') +
      '</div>';
  }

  function crumbs() {
    var r = M.record;
    return '' +
      '<div class="record-crumbs">' +
        '<a href="#">Incidents</a><i class="fa-solid fa-chevron-right" style="font-size:9px"></i>' +
        '<a href="#">Investigations</a><i class="fa-solid fa-chevron-right" style="font-size:9px"></i>' +
        '<span>' + esc(r.id) + '</span>' +
      '</div>';
  }

  /* ── Fields ────────────────────────────────────────────────────────────── */
  function fieldHTML(f, secId, opts) {
    opts = opts || {};
    var filled = M.isFilled(f);
    var needs = !!f.req && !filled;
    var cls = 'field' + (f.span === 2 ? ' span-2' : '') + (needs ? ' needs' : '');
    var out = '<div class="' + cls + '" data-field="' + f.id + '" data-section="' + secId + '" id="fld-' + f.id + '">';

    out += '<div class="field-top">' +
      '<span class="field-label">' + esc(f.label) +
        (f.req ? ' <span class="field-req" title="Required before this record can be submitted">*</span>' : '') +
      '</span>' + srcTag(f) +
      (needs ? '<span class="needs-tag"><i class="fa-solid fa-triangle-exclamation"></i>Needed</span>' : '') +
      (f.gate === 'save' && needs ? '<span class="needs-tag" style="background:#eef1f5;color:#4c5866">Blocks saving</span>' : '') +
    '</div>';

    var v = esc(f.value);
    switch (f.type) {
      case 'readonly':
        out += '<div class="readonly-value' + (filled ? '' : ' blank') + '">' +
          (filled ? v : 'Filled in automatically') + '</div>';
        if (filled) out += '<div class="prefill-note"><i class="fa-solid fa-wand-magic-sparkles"></i> Prefilled from your profile</div>';
        break;
      case 'textarea':
        out += '<vaadin-text-area theme="outlined" data-id="' + f.id + '" value="' + v + '"></vaadin-text-area>';
        break;
      case 'select':
        out += '<vaadin-select theme="outlined" data-id="' + f.id + '" value="' + v + '" ' +
               'data-opts="' + esc(JSON.stringify(f.opts || [])) + '" placeholder="Select"></vaadin-select>';
        break;
      case 'date':
        out += '<vaadin-date-picker theme="outlined" data-id="' + f.id + '" value="' + v + '"></vaadin-date-picker>';
        break;
      case 'number':
        out += '<vaadin-number-field theme="outlined" data-id="' + f.id + '" value="' + v + '" min="0"></vaadin-number-field>';
        break;
      default:
        out += '<vaadin-text-field theme="outlined" data-id="' + f.id + '" value="' + v + '"></vaadin-text-field>';
    }
    if (f.help) out += '<div class="field-help">' + esc(f.help) + '</div>';
    out += '</div>';
    return out;
  }

  /* Body of a section: field grid, repeat rows, attachments or history. */
  function sectionBody(sec) {
    var st = M.statusOf(sec);
    var out = '<div class="fs-body">';

    if (st.state === 'na') {
      out += '<div class="repeat-empty">' +
        '<i class="fa-solid fa-ban" style="font-size:18px;display:block;margin-bottom:8px;color:#9aa5b1"></i>' +
        'Not applicable to this record, based on your answer to ' +
        '<strong>' + esc((M.fieldById(sec.showIf.field) || {}).label || '') + '</strong>. ' +
        'Nothing here counts against your progress.' +
        '</div>';
      out += '</div>';
      return out;
    }

    if (sec.repeat) {
      if (sec.rows && sec.rows.length) {
        sec.rows.forEach(function (row) {
          out += '<div class="repeat-row">' +
            '<i class="fa-solid fa-user" style="color:#2c5b86"></i>' +
            '<div><div class="rr-name">' + esc(row.name) + '</div>' +
            '<div class="rr-detail">' + esc(row.detail || '') + '</div></div>' +
            '<div class="rr-actions"><button class="mini-btn" type="button">Edit</button></div>' +
          '</div>';
        });
      } else {
        out += '<div class="repeat-empty">No ' + esc(sec.rowLabel) + ' entries yet. ' +
          'This section is optional, so it will not hold up submission.</div>';
      }
      out += '<div style="margin-top:12px"><button class="mini-btn add-row" type="button" data-section="' + sec.id + '">' +
        '<i class="fa-solid fa-plus"></i> Add ' + esc(sec.rowLabel) + '</button>' +
        '<span class="field-help" style="display:inline-block;margin-left:10px">Fields: ' +
        esc((sec.rowFields || []).join(', ')) + '</span></div>';
      out += '</div>';
      return out;
    }

    if (sec.history) {
      out += '<table class="hist-table"><thead><tr><th>When</th><th>Who</th><th>What changed</th></tr></thead><tbody>';
      sec.history.forEach(function (h) {
        out += '<tr><td>' + esc(h.when) + '</td><td>' + esc(h.who) + '</td><td>' + esc(h.what) + '</td></tr>';
      });
      out += '</tbody></table></div>';
      return out;
    }

    if (sec.attachments) {
      out += '<div style="margin-bottom:16px">';
      sec.attachments.forEach(function (a) {
        out += '<div class="attach-row"><i class="fa-solid ' + a.kind + '"></i>' +
          '<span class="ar-name">' + esc(a.name) + '</span>' +
          '<span class="ar-size">' + esc(a.size) + '</span></div>';
      });
      out += '<button class="mini-btn" type="button"><i class="fa-solid fa-arrow-up-from-bracket"></i> Add attachment</button></div>';
    }

    out += '<div class="field-grid">';
    (sec.fields || []).forEach(function (f) { out += fieldHTML(f, sec.id); });
    out += '</div></div>';
    return out;
  }

  /* A full collapsible section card. `meta` lets a version inject its own
     right-hand status treatment without forking this renderer. */
  function sectionHTML(sec, meta) {
    var st = M.statusOf(sec);
    var metaHTML = meta ? meta(st, sec) : defaultMeta(st);
    return '' +
      '<section class="form-section state-' + st.state + '" id="sec-' + sec.id + '" data-section="' + sec.id + '">' +
        '<div class="fs-head" role="button" tabindex="0" aria-expanded="true">' +
          '<div class="fs-icon"><i class="fa-solid ' + sec.icon + '"></i></div>' +
          '<div class="fs-titlewrap">' +
            '<div class="fs-title">' + esc(sec.title) + '</div>' +
            '<div class="fs-blurb">' + esc(sec.blurb) + '</div>' +
          '</div>' +
          '<div class="fs-meta">' + metaHTML +
            '<i class="fa-solid fa-chevron-down fs-caret"></i>' +
          '</div>' +
        '</div>' +
        sectionBody(sec) +
      '</section>';
  }

  function defaultMeta(st) {
    var txt = st.state === 'complete' ? 'All required fields done'
            : st.state === 'partial' ? (st.reqTotal - st.reqDone) + ' of ' + st.reqTotal + ' required left'
            : st.state === 'empty' ? st.reqTotal + ' required fields'
            : stateLabel(st.state);
    return '<span class="pill ' + st.state + '"><i class="fa-solid ' + stateIcon(st.state) + '"></i>' + esc(txt) + '</span>';
  }

  /* ── Wiring ────────────────────────────────────────────────────────────── */
  /* Called after any innerHTML write that contains fields. Assigns select
     options (Vaadin needs `items` as a property, not markup) and pushes edits
     back into the shared model. */
  function mountInputs(root, onEdit) {
    root = root || document;

    root.querySelectorAll('vaadin-select[data-opts]').forEach(function (el) {
      if (el.__mounted) return;
      var opts = [];
      try { opts = JSON.parse(el.getAttribute('data-opts')); } catch (e) {}
      el.items = [{ label: '', value: '' }].concat(opts.map(function (o) {
        return { label: o, value: o };
      }));
      // Assigning items resets value, so restore it after the items land.
      var want = el.getAttribute('value') || '';
      requestAnimationFrame(function () { el.value = want; });
      el.__mounted = true;
    });

    root.querySelectorAll('[data-id]').forEach(function (el) {
      if (el.__wired) return;
      el.__wired = true;
      var id = el.getAttribute('data-id');
      var f = M.fieldById(id);
      if (f) el.accessibleName = f.label;
      var push = function () {
        var val = el.value == null ? '' : el.value;
        if (val === (f ? f.value : null)) return;
        M.setValue(id, val);
        if (onEdit) onEdit(id, val);
      };
      el.addEventListener('change', push);
      el.addEventListener('value-changed', push);
      el.addEventListener('input', push);
    });

    /* Collapsible section headers */
    root.querySelectorAll('.fs-head').forEach(function (h) {
      if (h.__wired) return;
      h.__wired = true;
      var toggle = function () {
        var sec = h.closest('.form-section');
        var open = !sec.classList.toggle('collapsed');
        h.setAttribute('aria-expanded', String(open));
      };
      h.addEventListener('click', function (e) {
        if (e.target.closest('button, a, vaadin-button')) return;
        toggle();
      });
      h.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    /* Repeat-section "add" buttons: fake a new row so counts move */
    root.querySelectorAll('.add-row').forEach(function (b) {
      if (b.__wired) return;
      b.__wired = true;
      b.addEventListener('click', function () {
        var sec = M.sections.filter(function (s) { return s.id === b.dataset.section; })[0];
        if (!sec) return;
        sec.rows = sec.rows || [];
        sec.rows.push({ name: 'New ' + sec.rowLabel + ' ' + (sec.rows.length + 1), detail: 'Details not filled in yet' });
        toast('Added a ' + sec.rowLabel + ' entry to ' + sec.title.toLowerCase() + '.', 'good');
        M.notify();
      });
    });
  }

  /* Refresh the visible state of one field's wrapper (needed / not needed) and
     its section's colour band, without re-rendering the whole document. */
  function refreshFieldChrome(root) {
    root = root || document;
    root.querySelectorAll('.field[data-field]').forEach(function (wrap) {
      var f = M.fieldById(wrap.dataset.field);
      if (!f) return;
      var needs = !!f.req && !M.isFilled(f);
      wrap.classList.toggle('needs', needs);
      var tag = wrap.querySelector('.needs-tag');
      if (needs && !tag) {
        var span = document.createElement('span');
        span.className = 'needs-tag';
        span.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>Needed';
        wrap.querySelector('.field-top').appendChild(span);
      } else if (!needs) {
        wrap.querySelectorAll('.needs-tag').forEach(function (t) { t.remove(); });
      }
    });
    root.querySelectorAll('.form-section[data-section]').forEach(function (el) {
      var sec = M.sections.filter(function (s) { return s.id === el.dataset.section; })[0];
      if (!sec) return;
      var st = M.statusOf(sec);
      el.className = el.className.replace(/state-\w+/, 'state-' + st.state);
      var pill = el.querySelector('.fs-meta .pill');
      if (pill) {
        pill.className = 'pill ' + st.state;
        pill.innerHTML = '<i class="fa-solid ' + stateIcon(st.state) + '"></i>' +
          (st.state === 'complete' ? 'All required fields done'
            : st.state === 'partial' ? (st.reqTotal - st.reqDone) + ' of ' + st.reqTotal + ' required left'
            : st.state === 'empty' ? st.reqTotal + ' required fields'
            : stateLabel(st.state));
      }
    });
  }

  /* ── Scroll to a section or field and flash it ─────────────────────────── */
  function jumpTo(target) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    var sec = el.closest ? el.closest('.form-section') : null;
    if (sec && sec.classList.contains('collapsed')) {
      sec.classList.remove('collapsed');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var flashEl = sec || el;
    flashEl.classList.add('flash');
    setTimeout(function () { flashEl.classList.remove('flash'); }, 1100);
    var input = el.querySelector ? el.querySelector('[data-id]') : null;
    if (input && input.focus) setTimeout(function () { try { input.focus(); } catch (e) {} }, 420);
  }

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  function toast(msg, kind) {
    var stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    var icon = kind === 'good' ? 'fa-circle-check' : kind === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || 'info');
    t.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + esc(msg) + '</span>';
    stack.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s ease';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, 3400);
  }

  /* ── Donuts ────────────────────────────────────────────────────────────── */
  /* Plain ring: one value against a track. */
  function ring(pct, opts) {
    opts = opts || {};
    var size = opts.size || 84, sw = opts.stroke || 9;
    var r = (size - sw) / 2, c = 2 * Math.PI * r, len = c * Math.max(0, Math.min(1, pct / 100));
    return '' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (opts.track || '#e8eef5') + '" stroke-width="' + sw + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (opts.color || '#17a673') + '" stroke-width="' + sw + '"' +
          ' stroke-linecap="round" stroke-dasharray="' + len + ' ' + (c - len) + '"' +
          ' transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
        (opts.center === false ? '' :
          '<text x="' + size / 2 + '" y="' + (size / 2 + 1) + '" text-anchor="middle" dominant-baseline="middle"' +
          ' font-size="' + (opts.fontSize || 17) + '" font-weight="700" fill="#1a1a2e" font-family="Open Sans, sans-serif">' +
          (opts.label != null ? esc(opts.label) : pct + '%') + '</text>') +
      '</svg>';
  }

  /* Segmented donut with leader-line labels — the Ardent Sky chart treatment. */
  function donutLabeled(segs, opts) {
    opts = opts || {};
    var W = opts.width || 460, H = opts.height || 290;
    var cx = W / 2, cy = H / 2 + (opts.shiftY || 0);
    var r = opts.r || 66, sw = opts.stroke || 30;
    var total = segs.reduce(function (a, s) { return a + s.value; }, 0) || 1;
    var c = 2 * Math.PI * r;

    var arcs = '', labels = '', acc = 0;
    var placed = { left: [], right: [] };

    segs.forEach(function (s) {
      var frac = s.value / total;
      var len = c * frac;
      arcs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '"' +
        ' stroke-width="' + sw + '" stroke-dasharray="' + len + ' ' + (c - len) + '"' +
        ' stroke-dashoffset="' + (-c * acc) + '"' +
        ' transform="rotate(-90 ' + cx + ' ' + cy + ')"><title>' + esc(s.label + ': ' + s.value) + '</title></circle>';

      // Mid-angle of this slice, in screen coordinates (0 = 12 o'clock).
      var mid = (acc + frac / 2) * Math.PI * 2 - Math.PI / 2;
      var dx = Math.cos(mid), dy = Math.sin(mid);
      var side = dx >= 0 ? 'right' : 'left';
      var p1 = { x: cx + dx * (r + sw / 2), y: cy + dy * (r + sw / 2) };
      var p2 = { x: cx + dx * (r + sw / 2 + 16), y: cy + dy * (r + sw / 2 + 16) };

      // Keep labels on the same side from stacking on top of each other.
      var y = p2.y;
      placed[side].forEach(function (prev) { if (Math.abs(y - prev) < 17) y = prev + 17; });
      placed[side].push(y);

      /* Clamp the label elbow so long left-side labels (text-anchor: end grows
         leftward) and right-side labels never run off the card. */
      var margin = opts.labelMargin || 132;
      var x3 = side === 'right' ? Math.min(W - margin, p2.x + 20) : Math.max(margin, p2.x - 20);
      labels += '<polyline points="' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' +
        p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + ' ' + x3.toFixed(1) + ',' + y.toFixed(1) + '"' +
        ' fill="none" stroke="#b6c2d0" stroke-width="1"/>';
      labels += '<text x="' + (side === 'right' ? x3 + 5 : x3 - 5).toFixed(1) + '" y="' + (y + 3.5).toFixed(1) + '"' +
        ' text-anchor="' + (side === 'right' ? 'start' : 'end') + '"' +
        ' font-size="11" fill="#4a5866" font-family="Open Sans, sans-serif">' +
        esc(s.label) + ' - ' + s.value + '</text>';

      acc += frac;
    });

    var center = '';
    if (opts.centerValue != null) {
      center += '<text x="' + cx + '" y="' + (cy + (opts.centerSub ? -3 : 5)) + '" text-anchor="middle"' +
        ' font-size="' + (opts.centerSize || 26) + '" font-weight="700" fill="#1a1a2e" font-family="Open Sans, sans-serif">' +
        esc(opts.centerValue) + '</text>';
      if (opts.centerSub) {
        center += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="10.5"' +
          ' fill="#6b7684" font-family="Open Sans, sans-serif">' + esc(opts.centerSub) + '</text>';
      }
    }

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px" role="img"' +
      ' aria-label="' + esc(opts.aria || 'Donut chart') + '">' + arcs + labels + center + '</svg>';
  }

  return {
    esc: esc, topnav: topnav, ribbon: ribbon, crumbs: crumbs,
    fieldHTML: fieldHTML, sectionHTML: sectionHTML, sectionBody: sectionBody,
    defaultMeta: defaultMeta, mountInputs: mountInputs, refreshFieldChrome: refreshFieldChrome,
    jumpTo: jumpTo, toast: toast, ring: ring, donutLabeled: donutLabeled,
    stateLabel: stateLabel, stateIcon: stateIcon, srcTag: srcTag
  };
})();
