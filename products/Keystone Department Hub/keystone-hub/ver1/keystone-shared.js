/* global window, document, KEYSTONE */
/* ========================================================================
   keystone-shared.js — shared vanilla helpers for the Keystone surfaces.
   ------------------------------------------------------------------------
   Ports ui-primitives.jsx (icons, chips, badges, avatars, toasts, feature
   flags) and shell.jsx's PrototypeFab to plain JS. Everything hangs off the
   `window.KX` namespace.

   Rendering model: helpers return HTML strings, pages assemble them and set
   innerHTML, then wire behaviour with delegated listeners. No framework, no
   build step — open the file in a browser and it runs.
   ======================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     ESCAPING + ICONS
     --------------------------------------------------------------------- */

  // Every value interpolated into a template goes through esc(). Fixture data
  // is ours, but user-typed strings (band names, saved-view names, chat
  // prompts) land in the same templates.
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Attribute-safe variant for values inside single-quoted attributes.
  function attr(s) { return esc(s); }

  /**
   * Material Symbol glyph.
   * @param {string} name  glyph name, e.g. 'schedule'
   * @param {object} [o]   { size, fill, color, cls, style }
   */
  function micon(name, o) {
    o = o || {};
    var size = o.size || 18;
    var styles = ['font-size:' + size + 'px'];
    // opsz/wght/FILL mirror the prototype's MIcon variation settings.
    styles.push("font-variation-settings:'FILL' " + (o.fill ? 1 : 0) +
                ",'wght' " + (o.weight || 400) + ",'GRAD' 0,'opsz' " + size);
    if (o.color) styles.push('color:' + o.color);
    if (o.style) styles.push(o.style);
    return '<span class="material-symbols-outlined' + (o.cls ? ' ' + o.cls : '') +
           '" style="' + styles.join(';') + '" aria-hidden="true">' + esc(name) + '</span>';
  }

  /* ---------------------------------------------------------------------
     SOURCE-APP CHIPS  (SourceChip / SourceInitials)
     --------------------------------------------------------------------- */

  function srcChip(sourceId, size) {
    var s = window.KEYSTONE.SOURCES[sourceId];
    if (!s) return '';
    return '<span class="kx-src-chip' + (size === 'lg' ? ' kx-src-chip--lg' : '') +
      '" title="' + attr(s.name) + '" style="background:' + s.bg + ';color:' + s.color + '">' +
      '<span class="dot"></span>' + esc(s.short) + '</span>';
  }

  // Rounded-square app tile with mono initials — matches the left rail's
  // "Pinned apps" look and the task table's App column.
  function srcTile(sourceId, px) {
    var s = window.KEYSTONE.SOURCES[sourceId];
    if (!s) return '';
    px = px || 32;
    return '<span class="kx-src-tile" title="' + attr(s.name) + '" aria-label="' + attr(s.name) +
      '" style="width:' + px + 'px;height:' + px + 'px;background:' + s.bg + ';color:' + s.color +
      ';font-size:' + Math.round(px * 0.375) + 'px">' +
      esc(s.short.slice(0, 2).toUpperCase()) + '</span>';
  }

  // Task-type icon in its source app's tone.
  function typeIcon(task, px) {
    var s = window.KEYSTONE.SOURCES[task.source];
    px = px || 32;
    return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:8px;background:' + s.bg +
      ';color:' + s.color + ';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
      micon(task.icon, { size: Math.round(px * 0.56), fill: 1 }) + '</span>';
  }

  /* ---------------------------------------------------------------------
     STATUS + PRIORITY
     --------------------------------------------------------------------- */

  // Keystone statuses mapped onto Vector's semantic tones. The design renders
  // status as plain text (no badge fill) — the meta is kept because the
  // Agency Intelligence surfaces still use the tones.
  var STATUS_META = {
    overdue:    { label: 'Overdue',    fg: 'var(--lumo-error-text-color)',     bg: 'var(--lumo-error-color-10pct)',   dot: 'var(--lumo-error-color)' },
    past_sla:   { label: 'Past SLA',   fg: 'var(--lumo-error-text-color)',     bg: 'var(--lumo-error-color-10pct)',   dot: 'var(--lumo-error-color)' },
    at_risk:    { label: 'At Risk',    fg: 'var(--lumo-warning-text-color)',   bg: 'var(--lumo-warning-color-10pct)', dot: 'var(--lumo-warning-color)' },
    due_soon:   { label: 'Due Soon',   fg: 'var(--lumo-primary-text-color)',   bg: 'var(--lumo-primary-color-10pct)', dot: 'var(--lumo-primary-color)' },
    on_track:   { label: 'On Track',   fg: 'var(--lumo-success-text-color)',   bg: 'var(--lumo-success-color-10pct)', dot: 'var(--lumo-success-color)' },
    within_sla: { label: 'Within SLA', fg: 'var(--lumo-success-text-color)',   bg: 'var(--lumo-success-color-10pct)', dot: 'var(--lumo-success-color)' },
    completed:  { label: 'Done',       fg: 'var(--lumo-secondary-text-color)', bg: 'var(--lumo-contrast-10pct)',      dot: null }
  };

  function statusText(status) {
    var m = STATUS_META[status] || STATUS_META.on_track;
    return '<span class="kx-status">' + esc(m.label) + '</span>';
  }

  var BAND_TONES = {
    P0: { bg: 'var(--p0-bg)', fg: 'var(--p0)' },
    P1: { bg: 'var(--p1-bg)', fg: 'var(--p1)' },
    P2: { bg: 'var(--p2-bg)', fg: 'var(--p2)' },
    P3: { bg: 'var(--p3-bg)', fg: 'var(--p3)' }
  };

  // Priority = the score inside a band-coloured badge. The band scheme comes
  // from the Prioritization Settings page (see prioBand below), so retuning
  // the bands there recolours every task row here.
  function prioBadge(task) {
    var band = prioBand(task.priorityScore);
    var tip = task.priorityBreakdown
      ? 'Time ' + task.priorityBreakdown.time.toFixed(2) +
        ' · Importance ' + task.priorityBreakdown.importance.toFixed(2) +
        ' · Effort ' + task.priorityBreakdown.effort.toFixed(2)
      : '';
    return '<span class="kx-prio" title="' + attr(tip) + '" style="background:' + band.bg +
      ';color:' + band.fg + '">' + task.priorityScore + '</span>';
  }

  /* ---- Band resolution, shared with Prioritization Settings -------------
     The settings page persists an admin-editable band list (2–5 named
     buckets, highest cutoff first). Band colours map by RANK so the top band
     is always red and the floor is the calmest colour. Falls back to the
     classic P0–P3 cutoffs when nothing is saved. */

  var PRIO_KEY = 'keystone.priorityConfig.v2';
  var TONE_RED    = { bg: 'var(--p0-bg)', fg: 'var(--p0)' };
  var TONE_ORANGE = { bg: 'var(--p1-bg)', fg: 'var(--p1)' };
  var TONE_YELLOW = { bg: 'var(--p2-bg)', fg: 'var(--p2)' };
  var TONE_GREEN  = { bg: 'var(--p3-bg)', fg: 'var(--p3)' };
  var TONE_BLUE   = { bg: '#dce6fb', fg: '#1e40af' };
  var BAND_PALETTES = {
    2: [TONE_RED, TONE_GREEN],
    3: [TONE_RED, TONE_YELLOW, TONE_GREEN],
    4: [TONE_RED, TONE_YELLOW, TONE_GREEN, TONE_BLUE],
    5: [TONE_RED, TONE_ORANGE, TONE_YELLOW, TONE_GREEN, TONE_BLUE]
  };
  var BAND_PALETTE_FALLBACK = [
    TONE_RED, TONE_ORANGE, TONE_YELLOW, TONE_GREEN, TONE_BLUE,
    { bg: 'var(--teal-50)', fg: 'var(--teal-500)' },
    { bg: 'var(--coral-50)', fg: 'var(--coral-500)' }
  ];
  var DEFAULT_BAND_LIST = [
    { id: 'b-crit', name: 'Critical', min: 70 },
    { id: 'b-std',  name: 'Standard', min: 40 },
    { id: 'b-low',  name: 'Low',      min: 0 }
  ];

  function paletteFor(count) { return BAND_PALETTES[count] || BAND_PALETTE_FALLBACK; }

  function savedBandList() {
    try {
      var raw = localStorage.getItem(PRIO_KEY);
      if (!raw) return DEFAULT_BAND_LIST;
      var cfg = JSON.parse(raw);
      return (Array.isArray(cfg.bandList) && cfg.bandList.length) ? cfg.bandList : DEFAULT_BAND_LIST;
    } catch (e) { return DEFAULT_BAND_LIST; }
  }

  // Resolve a score to { label, fg, bg } using the effective band list.
  function prioBand(score) {
    var list = savedBandList().slice().sort(function (a, b) { return b.min - a.min; });
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (score >= (list[i].min || 0)) { hit = list[i]; break; }
    }
    if (!hit) hit = list[list.length - 1];
    var idx = list.indexOf(hit);
    var pal = paletteFor(list.length);
    var tone = pal[idx] || BAND_PALETTE_FALLBACK[idx % BAND_PALETTE_FALLBACK.length];
    return { label: hit ? hit.name : '—', fg: tone.fg, bg: tone.bg };
  }

  /* ---------------------------------------------------------------------
     DUE / SLA CELL
     --------------------------------------------------------------------- */

  function dueCell(task, dense) {
    var NOW = window.KEYSTONE.NOW;
    if (!task.dueAt) {
      var d = task.openDays || 0;
      var txt = d < 1 ? Math.round(d * 24) + 'h open' : Math.round(d) + 'd open';
      return '<span class="kx-due"><span class="main">' + esc(txt) + '</span>' +
        (dense ? '' : '<span class="sub">SLA-tracked</span>') + '</span>';
    }
    var ms = task.dueAt.getTime() - NOW.getTime();
    var past = ms < 0;
    var h = Math.abs(ms) / 3600000;
    var main;
    if (h < 1) main = Math.round(Math.abs(ms) / 60000) + 'm';
    else if (h < 48) main = Math.round(h) + 'h';
    else main = Math.round(h / 24) + 'd';
    var dt = task.dueAt.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    return '<span class="kx-due"' + (dense ? ' title="' + attr(dt) + '"' : '') + '>' +
      '<span class="main' + (past ? ' is-late' : '') + '">' +
      (past ? main + ' late' : 'in ' + main) + '</span>' +
      (dense ? '' : '<span class="sub">' + esc(dt) + '</span>') + '</span>';
  }

  // Relative time for activity feeds.
  function relTime(d) {
    if (!d) return '';
    var NOW = window.KEYSTONE.NOW;
    var ms = NOW - d;
    var past = ms > 0;
    var m = Math.abs(ms) / 60000;
    if (m < 60) return Math.round(m) + 'm' + (past ? ' ago' : '');
    var h = m / 60;
    if (h < 24) return Math.round(h) + 'h' + (past ? ' ago' : '');
    return Math.round(h / 24) + 'd' + (past ? ' ago' : '');
  }

  /* ---------------------------------------------------------------------
     AVATARS
     --------------------------------------------------------------------- */

  var AVATAR_HUES = ['#1f7a6b','#b45309','#7c2d12','#c2410c','#1d4ed8','#7e22ce','#0e7490','#15803d','#a16207'];

  function avatar(person, size) {
    size = size || 28;
    if (!person) {
      return '<span class="kx-avatar kx-avatar--empty" title="Unassigned" style="width:' + size +
        'px;height:' + size + 'px">' +
        micon('help', { size: Math.round(size * 0.55), color: 'var(--ink-400)' }) + '</span>';
    }
    var initials = (person.first[0] + person.last[0]).toUpperCase();
    // Deterministic hue so a person keeps the same colour across surfaces.
    var hash = (person.id || initials).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    return '<span class="kx-avatar" title="' + attr(person.first + ' ' + person.last + ' · ' + person.rank) +
      '" style="width:' + size + 'px;height:' + size + 'px;background:' + AVATAR_HUES[hash % AVATAR_HUES.length] +
      ';font-size:' + (size * 0.38).toFixed(1) + 'px">' + esc(initials) + '</span>';
  }

  function avatarStack(ids, opts) {
    opts = opts || {};
    var size = opts.size || 24, max = opts.max || 3;
    var people = (ids || []).map(function (id) { return window.KEYSTONE.helpers.personById(id); }).filter(Boolean);
    if (!people.length) {
      return '<span class="kx-unassigned">' + avatar(null, size) + '<span>Unassigned</span></span>';
    }
    var shown = people.slice(0, max), extra = people.length - shown.length;
    var out = '<span class="kx-avatar-stack">';
    shown.forEach(function (p) { out += '<span class="ring">' + avatar(p, size) + '</span>'; });
    if (extra > 0) {
      out += '<span class="more" style="width:' + size + 'px;height:' + size + 'px">+' + extra + '</span>';
    }
    return out + '</span>';
  }

  /* ---------------------------------------------------------------------
     TOASTS
     --------------------------------------------------------------------- */

  function toastHost() {
    var host = document.querySelector('.kx-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'kx-toast-host';
      document.body.appendChild(host);
    }
    return host;
  }

  /**
   * Transient notification.
   * @param {object} t { title, body, icon, tone: 'success'|'warn', duration }
   */
  function pushToast(t) {
    t = t || {};
    var host = toastHost();
    var el = document.createElement('div');
    el.className = 'kx-toast';
    if (t.tone) el.setAttribute('data-tone', t.tone);
    el.innerHTML =
      (t.icon ? '<span class="kx-toast-icon">' + micon(t.icon, { size: 20, fill: 1 }) + '</span>' : '') +
      '<div style="flex:1">' +
      (t.title ? '<div class="kx-toast-title">' + esc(t.title) + '</div>' : '') +
      (t.body ? '<div class="kx-toast-body">' + esc(t.body) + '</div>' : '') +
      '</div>';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, t.duration || 4200);
  }

  /* ---------------------------------------------------------------------
     FEATURE FLAGS  (engineering scoping)
     ---------------------------------------------------------------------
     futureOn = false is the v1 surface that ships first. Toggling it on
     reveals planned v2+ features so PMs and engineers can preview them.
     Always boots OFF regardless of what's persisted, so the prototype opens
     on the v1 surface every time. Pages subscribe via onFlagsChange. */

  var FLAGS_KEY = 'keystone.featureFlags';
  var FLAGS_EVENT = 'kx-flags-changed';
  var flags = (function () {
    try {
      var stored = JSON.parse(localStorage.getItem(FLAGS_KEY) || '{}');
      return Object.assign({ futureOn: false }, stored, { futureOn: false });
    } catch (e) { return { futureOn: false }; }
  })();

  function getFlags() { return flags; }
  function setFlag(key, value) {
    flags = Object.assign({}, flags);
    flags[key] = value;
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(flags)); } catch (e) {}
    window.dispatchEvent(new CustomEvent(FLAGS_EVENT, { detail: flags }));
  }
  function onFlagsChange(fn) {
    window.addEventListener(FLAGS_EVENT, function (e) { fn(e.detail); });
  }

  /* ---------------------------------------------------------------------
     PROTOTYPE FAB
     ---------------------------------------------------------------------
     Floating control (lower-right) holding the prototype-only controls that
     used to sit in the top bar: the role switcher and the engineering-scope
     flag. Demo affordance — not part of the product UI. */

  var ROLE_GRADIENTS = {
    amber: ['var(--amber-300)', 'var(--coral-300)'],
    teal:  ['var(--teal-300)', 'var(--teal-500)'],
    coral: ['var(--coral-200)', 'var(--coral-400)']
  };

  function roleBadge(role, size) {
    size = size || 32;
    var g = ROLE_GRADIENTS[role.accent] || ROLE_GRADIENTS.amber;
    var initials = role.who.split(' ').map(function (w) { return w[0]; }).join('');
    return '<span class="kx-role-badge" style="width:' + size + 'px;height:' + size +
      'px;background:linear-gradient(135deg,' + g[0] + ' 0%,' + g[1] + ' 100%);font-size:' +
      (size * 0.4).toFixed(1) + 'px">' + esc(initials) + '</span>';
  }

  var ADMIN_ITEMS = [
    { label: 'User & role management', icon: 'group', desc: 'Add chiefs, training officers, line crew', disabled: true },
    { label: 'Notification policies', icon: 'notifications_active', desc: 'Reminders, escalation cadence', disabled: true }
  ];

  /**
   * Mount the prototype FAB.
   * @param {object} o { role, onRoleChange }
   * @returns {{setRole: function}} handle so the page can push role changes in
   */
  function mountPrototypeFab(o) {
    var state = { open: false, role: o.role };
    var el = document.createElement('div');
    el.className = 'kx-proto-fab';
    document.body.appendChild(el);

    function panelHtml() {
      var ROLES = window.KEYSTONE.ROLES;
      var visible = Object.keys(ROLES).map(function (k) { return ROLES[k]; })
        .filter(function (r) { return flags.futureOn || !r.gated; });

      var roleRows = visible.map(function (r) {
        return '<button class="kx-proto-row' + (r.id === state.role ? ' is-on' : '') +
          '" data-role="' + attr(r.id) + '">' + roleBadge(r, 34) +
          '<span style="flex:1;line-height:1.2;min-width:0">' +
          '<span class="who" style="display:block">' + esc(r.who) + '</span>' +
          '<span class="meta">' + esc(r.title) + ' · ' + esc(r.sub) + '</span></span>' +
          (r.id === state.role ? micon('check_circle', { size: 18, fill: 1, color: 'var(--teal-400)' }) : '') +
          '</button>';
      }).join('');

      var adminRows = ADMIN_ITEMS.map(function (it) {
        return '<div class="kx-proto-row is-disabled">' +
          '<span class="icon-chip">' + micon(it.icon, { size: 18 }) + '</span>' +
          '<span style="flex:1;line-height:1.25;min-width:0">' +
          '<span style="display:block;font-weight:600;font-size:13px;color:var(--ink-500)">' + esc(it.label) + '</span>' +
          '<span class="meta" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.desc) + '</span></span>' +
          '<span class="kx-soon">Soon</span></div>';
      }).join('');

      // Engineering-scope flag row: label + v1/v2 pill + Vector switch.
      var flagRow =
        '<div class="kx-proto-row" style="cursor:default">' +
        '<span class="icon-chip" style="' + (flags.futureOn ? 'background:var(--teal-50);color:var(--teal-500)' : '') + '">' +
        micon('science', { size: 18, fill: flags.futureOn ? 1 : 0 }) + '</span>' +
        '<span style="flex:1;line-height:1.25;min-width:0">' +
        '<span style="display:flex;align-items:center;gap:6px">' +
        '<span style="font-weight:600;font-size:13px">Future functionality</span>' +
        '<span class="kx-flag-pill' + (flags.futureOn ? ' is-on' : '') + '">' + (flags.futureOn ? 'v2+' : 'v1') + '</span>' +
        '</span>' +
        '<span class="meta" style="display:block;margin-top:2px">Reveals phase-2 surfaces: Lieutenant + Training Officer roles, ' +
        'saved-view management, product-level report cards, and reminder/reassign actions.</span></span>' +
        '<vwc-switch id="kxFutureFlag" accessibleName="Future functionality"' +
        (flags.futureOn ? ' checked' : '') + '></vwc-switch></div>';

      return '<div class="kx-proto-panel">' +
        '<div class="kx-proto-head"><span class="mark">' + micon('science', { size: 17, fill: 1 }) + '</span>' +
        '<span><span class="t" style="display:block">Prototype controls</span>' +
        '<span class="s">Demo-only — not part of the product UI</span></span></div>' +
        '<div class="kx-proto-section">Viewing as</div>' + roleRows +
        '<div class="kx-menu-divider"></div>' +
        '<div class="kx-proto-section">Engineering scope</div>' + flagRow +
        '<div class="kx-menu-divider"></div>' +
        '<div class="kx-proto-section">Administration</div>' + adminRows +
        '</div>';
    }

    function render() {
      el.setAttribute('data-open', state.open ? '1' : '0');
      el.innerHTML = (state.open ? panelHtml() : '') +
        '<button class="fab-btn" aria-label="Prototype controls" aria-expanded="' + state.open + '" title="Prototype controls">' +
        micon(state.open ? 'close' : 'tune', { size: 20 }) +
        '<span class="kx-desktop-only">Prototype</span></button>';

      var sw = el.querySelector('#kxFutureFlag');
      if (sw) {
        // vwc-switch fires change on the host element.
        sw.addEventListener('change', function () { setFlag('futureOn', !!sw.checked); });
      }
    }

    el.addEventListener('click', function (e) {
      var fab = e.target.closest('.fab-btn');
      if (fab) { state.open = !state.open; render(); return; }
      var roleBtn = e.target.closest('[data-role]');
      if (roleBtn) {
        state.role = roleBtn.getAttribute('data-role');
        o.onRoleChange && o.onRoleChange(state.role);
        render();
      }
    });
    document.addEventListener('mousedown', function (e) {
      if (state.open && !el.contains(e.target)) { state.open = false; render(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open) { state.open = false; render(); }
    });
    // Flag flips change which roles are visible, so re-render the panel.
    onFlagsChange(function () { if (state.open) render(); });

    render();
    return {
      setRole: function (r) { state.role = r; if (state.open) render(); }
    };
  }

  /* ---------------------------------------------------------------------
     DIALOG HELPER  (vaadin-dialog)
     ---------------------------------------------------------------------
     vaadin-dialog ignores slotted children — content must come from renderer
     functions. This wraps that protocol so pages can open a dialog with
     plain HTML strings and a footer button spec.

     @param {object} o
     @param {string} o.title        header text
     @param {string} [o.subtitle]   header sub-line
     @param {string} [o.icon]       header glyph
     @param {string} o.body         HTML string for the dialog body
     @param {Array}  [o.actions]    [{ label, theme, icon, onClick, disabled, id }]
     @param {string} [o.note]       small footer note, left-aligned
     @param {string} [o.width]      CSS width, default 560px
     @param {function} [o.onMount]  called with (bodyRoot, dialog) after render
     @returns {HTMLElement} the dialog element
     --------------------------------------------------------------------- */
  function openDialog(o) {
    var dlg = document.createElement('vaadin-dialog');
    document.body.appendChild(dlg);

    var accent = o.accent || 'var(--teal-400)';

    dlg.headerRenderer = function (root) {
      if (root.firstChild) return;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:flex-start;gap:14px;width:100%';
      wrap.innerHTML =
        (o.icon ? '<span style="width:40px;height:40px;border-radius:10px;background:' + accent +
          '26;color:' + accent + ';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(o.icon, { size: 22, fill: 1 }) + '</span>' : '') +
        '<div style="flex:1;min-width:0">' +
        '<div style="font-family:var(--font-display);font-weight:500;font-size:22px;letter-spacing:-0.4px;' +
        'color:var(--ink-900);line-height:1.2">' + esc(o.title) + '</div>' +
        (o.subtitle ? '<div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">' + esc(o.subtitle) + '</div>' : '') +
        '</div>';
      var close = document.createElement('vaadin-button');
      close.setAttribute('theme', 'icon tertiary');
      close.setAttribute('aria-label', 'Close');
      close.innerHTML = micon('close', { size: 18 });
      close.addEventListener('click', function () { dlg.opened = false; });
      wrap.appendChild(close);
      root.appendChild(wrap);
    };

    dlg.renderer = function (root) {
      if (root.firstChild) return;
      var body = document.createElement('div');
      body.style.cssText = 'padding:18px 22px;width:min(' + (o.width || '560px') + ', 90vw)';
      body.innerHTML = o.body || '';
      root.appendChild(body);
      if (o.onMount) o.onMount(body, dlg);
    };

    if (o.actions || o.note) {
      dlg.footerRenderer = function (root) {
        if (root.firstChild) return;
        if (o.note) {
          var note = document.createElement('div');
          note.style.cssText = 'font-size:11.5px;color:var(--ink-500);margin-right:auto;max-width:60%';
          note.textContent = o.note;
          root.appendChild(note);
        }
        (o.actions || []).forEach(function (a) {
          var b = document.createElement('vaadin-button');
          b.setAttribute('theme', a.theme || 'secondary');
          if (a.id) b.id = a.id;
          if (a.disabled) b.setAttribute('disabled', '');
          // Label rides .kx-btn-label so the icon gap comes from the stylesheet
          // (a bare space collapsed to ~4px and read as cramped).
          b.innerHTML = (a.icon ? micon(a.icon, { size: 16 }) : '') +
            '<span class="kx-btn-label">' + esc(a.label) + '</span>';
          b.addEventListener('click', function () {
            // An action returning false keeps the dialog open.
            var keep = a.onClick && a.onClick(dlg) === false;
            if (!keep) dlg.opened = false;
          });
          root.appendChild(b);
        });
      };
    }

    dlg.addEventListener('opened-changed', function (e) {
      if (!e.detail.value) setTimeout(function () { dlg.remove(); }, 0);
    });
    dlg.opened = true;
    return dlg;
  }

  /* ---------------------------------------------------------------------
     TOGGLE-BUTTON GROUP SELECTION
     ---------------------------------------------------------------------
     vwc-toggle-button-group must NOT carry `selected` (nor its buttons
     `checked`) as a parse-time attribute: the group upgrades first, reads
     `selected`, and stamps `checked` onto child buttons that haven't upgraded
     yet — whose setter writes through to a light-DOM input that doesn't exist
     yet, throwing "Cannot set properties of undefined".

     So: render the group bare, then assign `.selected` as a property once
     both custom elements are defined.

     @param {HTMLElement} el     the vwc-toggle-button-group
     @param {string|string[]} value  selected value(s)
     --------------------------------------------------------------------- */
  function setToggleGroup(el, value) {
    if (!el) return;
    Promise.all([
      customElements.whenDefined('vwc-toggle-button-group'),
      customElements.whenDefined('vwc-toggle-button')
    ]).then(function () {
      if (!el.isConnected) return;
      // whenDefined only guarantees the class is registered — each button
      // creates its managed light-DOM <input> during its first Lit render, so
      // wait for that too. Assigning `selected` any earlier makes the group
      // stamp `checked` onto a button whose input doesn't exist yet.
      var pending = [el].concat(Array.prototype.slice.call(el.querySelectorAll('vwc-toggle-button')))
        .map(function (n) { return n.updateComplete || Promise.resolve(); });
      return Promise.all(pending);
    }).then(function () {
      if (!el.isConnected) return;
      el.selected = value;
    }).catch(function () { /* element torn down mid-render — nothing to do */ });
  }

  /* ---------------------------------------------------------------------
     THEME RE-ADOPTION AFTER A RE-RENDER  (Safari)
     ---------------------------------------------------------------------
     Vector's theme lives in one ~39KB constructed stylesheet that the themes
     bundle pushes onto document.adoptedStyleSheets. It has to be adopted INTO
     each component's shadow root, because it carries element rules (notably
     `vaadin-button { padding: … }`) and document-level element rules cannot
     cross a shadow boundary — only custom properties inherit.

     The library hands that sheet to a component two ways, both in the theme
     mixin's connectedCallback: it copies any document sheet carrying an
     `inheritable` flag, and it listens for `vwc#theme-added` to catch sheets
     registered later.

     The flag is a JS expando set with Object.defineProperty on the sheet.
     WebKit does not preserve expandos across a round-trip through
     document.adoptedStyleSheets — read the sheet back and the flag is gone —
     so in Safari the copy route silently finds nothing, and the event fired
     once at page load. Net effect: every Vector component created AFTER load
     renders unthemed. Our views re-render by replacing root.innerHTML, so the
     first click rebuilt the status segments with no padding and no borders —
     a 419px control collapsing to ~223px.

     Re-announcing the document's sheets after a render routes them through the
     same listener each freshly connected component just installed. The
     library's handler skips sheets a shadow root already has, so Chromium —
     where the flag survives and the copy route works — no-ops on all of them.

     Call this immediately after any full-view innerHTML render. */
  function reapplyTheme() {
    var sheets = document.adoptedStyleSheets;
    if (!sheets || !sheets.length) return;
    Array.prototype.slice.call(sheets).forEach(function (sheet) {
      window.dispatchEvent(new CustomEvent('vwc#theme-added', { detail: sheet }));
    });
  }

  /* ---------------------------------------------------------------------
     SMALL UTILITIES
     --------------------------------------------------------------------- */

  // Close any open .kx-menu when clicking outside its anchor.
  function autoCloseMenus(rootEl, onClose) {
    document.addEventListener('mousedown', function (e) {
      var open = rootEl.querySelector('.kx-menu');
      if (!open) return;
      if (!e.target.closest('.kx-menu') && !e.target.closest('[data-menu-toggle]')) onClose();
    });
  }

  function fmtDate(d) {
    return d instanceof Date
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : d;
  }

  // Sparkline polyline — used by the hero facets and dashboard widgets.
  function sparkPoints(data, w, h, pad) {
    pad = pad || 0;
    var min = Math.min.apply(null, data) - pad;
    var max = Math.max.apply(null, data) + pad;
    var range = Math.max(1, max - min);
    var step = w / (data.length - 1);
    return data.map(function (v, i) {
      return (i * step).toFixed(2) + ',' + (h - (v - min) / range * h).toFixed(2);
    }).join(' ');
  }

  window.KX = {
    esc: esc, attr: attr, micon: micon,
    srcChip: srcChip, srcTile: srcTile, typeIcon: typeIcon,
    statusText: statusText, STATUS_META: STATUS_META,
    prioBadge: prioBadge, prioBand: prioBand, paletteFor: paletteFor,
    BAND_TONES: BAND_TONES, DEFAULT_BAND_LIST: DEFAULT_BAND_LIST, PRIO_KEY: PRIO_KEY,
    dueCell: dueCell, relTime: relTime, fmtDate: fmtDate, sparkPoints: sparkPoints,
    avatar: avatar, avatarStack: avatarStack,
    pushToast: pushToast,
    getFlags: getFlags, setFlag: setFlag, onFlagsChange: onFlagsChange,
    roleBadge: roleBadge, mountPrototypeFab: mountPrototypeFab,
    openDialog: openDialog, autoCloseMenus: autoCloseMenus,
    setToggleGroup: setToggleGroup, reapplyTheme: reapplyTheme
  };
})();
