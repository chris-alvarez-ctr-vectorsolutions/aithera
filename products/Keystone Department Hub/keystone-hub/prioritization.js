/* global window, document, KEYSTONE, KX */
/* ========================================================================
   prioritization.js — Prioritization Settings. Vanilla JS.
   ------------------------------------------------------------------------
   Tunes the priority-score config and previews the effect live:

     · Task-type importance (always visible) + per-type timing / SLA overrides
     · Advanced ▾ — score weights, time-pressure tiers, priority bands
     · Floating live-preview rail with two tabs
     · Sticky dirty/save toolbar

   Render model: full re-render for structural changes (opening an override
   panel, adding a band, resetting), granular refresh for value changes — so
   dragging a slider or typing in a number field is never interrupted by the
   DOM being swapped underneath it.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var esc = KX.esc, micon = KX.micon;

  /* ---------------------------------------------------------------------
     DEFAULTS — mirror data.js
     ---------------------------------------------------------------------
     Time thresholds are stored as { value, unit } so the admin UI can flip
     between hours and days without losing precision. SLA tiers carry their
     own weight. Per-type time-pressure overrides live in `timeByType` and
     fall back to the global `timeTiers`; per-type SLA overrides live in
     `slaByType` and fall back to `sla`. */
  var DEFAULT_CONFIG = {
    weights: { time: 50, importance: 40, effort: 10 },
    timeTiers: {
      overdue: { weight: 1.0 },
      due24h:  { value: 24, unit: 'hours', weight: 0.85 },
      due7d:   { value: 7,  unit: 'days',  weight: 0.60 },
      beyond:  { weight: 0.25 }
    },
    sla: {
      atRisk:  { value: 3, unit: 'days', weight: 0.70 },
      pastSla: { value: 5, unit: 'days', weight: 1.00 }
    },
    // Priority bands — named, admin-editable, 2–5 buckets. Highest cutoff
    // first; the lowest bucket is the floor (min 0).
    bandList: KX.DEFAULT_BAND_LIST.map(function (b) { return Object.assign({}, b); }),
    importance: Object.keys(K.TASK_TYPES).reduce(function (acc, k) {
      acc[k] = K.TASK_TYPES[k].importance; return acc;
    }, {}),
    timeByType: {},
    slaByType: {}
  };

  var STORAGE_KEY = KX.PRIO_KEY;              // 'keystone.priorityConfig.v2'
  var ADVANCED_KEY = 'keystone.priorityConfig.advancedOpen';
  var MAX_BANDS = 5, MIN_BANDS = 2;

  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_CONFIG);
      var p = JSON.parse(raw);
      return Object.assign({}, DEFAULT_CONFIG, p, {
        weights:    Object.assign({}, DEFAULT_CONFIG.weights,    p.weights || {}),
        timeTiers:  Object.assign({}, DEFAULT_CONFIG.timeTiers,  p.timeTiers || {}),
        sla:        Object.assign({}, DEFAULT_CONFIG.sla,        p.sla || {}),
        importance: Object.assign({}, DEFAULT_CONFIG.importance, p.importance || {}),
        bandList:   (Array.isArray(p.bandList) && p.bandList.length) ? p.bandList : clone(DEFAULT_CONFIG.bandList),
        timeByType: Object.assign({}, p.timeByType || {}),
        slaByType:  Object.assign({}, p.slaByType || {})
      });
    } catch (e) { return clone(DEFAULT_CONFIG); }
  }

  /* ---------------------------------------------------------------------
     SCORING — mirrors data.js but reads the live config
     --------------------------------------------------------------------- */

  // { value, unit } → hours. Defensive against the legacy { hours: N } shape.
  function toHours(t) {
    if (!t) return 0;
    if (t.unit === 'days') return (t.value || 0) * 24;
    if (t.unit === 'hours') return t.value || 0;
    if (typeof t.hours === 'number') return t.hours;
    return t.value || 0;
  }

  // Effective tiers for a task type — the type override wins, otherwise the
  // department default.
  function effectiveTiers(cfg, typeKey) {
    return (cfg.timeByType && cfg.timeByType[typeKey]) || cfg.timeTiers;
  }

  function timeWeightWith(t, cfg) {
    if (!t.dueAt) {
      var sla = (cfg.slaByType && cfg.slaByType[t.type]) || cfg.sla;
      var dHrs = (t.openDays || 0) * 24;
      if (dHrs >= toHours(sla.pastSla)) return sla.pastSla.weight;
      if (dHrs >= toHours(sla.atRisk)) return sla.atRisk.weight;
      return 0.3;
    }
    var tiers = effectiveTiers(cfg, t.type);
    var ms = t.dueAt.getTime() - K.NOW.getTime();
    if (ms < 0) return tiers.overdue.weight;
    var hrs = ms / 3600000;
    if (hrs <= toHours(tiers.due24h)) return tiers.due24h.weight;
    if (hrs <= toHours(tiers.due7d)) return tiers.due7d.weight;
    return tiers.beyond.weight;
  }

  function priorityWith(t, cfg) {
    var time = timeWeightWith(t, cfg);
    var imp = cfg.importance[t.type] != null ? cfg.importance[t.type] : 0.5;
    var eff = t.effort != null ? t.effort : 0;
    return {
      score: Math.round(cfg.weights.time * time + cfg.weights.importance * imp + cfg.weights.effort * eff),
      time: time, importance: imp, effort: eff
    };
  }

  /* ---- Band helpers (live config, not the persisted one) --------------- */

  function effectiveBandList(cfg) {
    return (Array.isArray(cfg.bandList) && cfg.bandList.length)
      ? cfg.bandList
      : KX.DEFAULT_BAND_LIST.map(function (b) { return Object.assign({}, b); });
  }

  function orderedBands(cfg) {
    return effectiveBandList(cfg).slice().sort(function (a, b) { return b.min - a.min; });
  }

  // Resolve a score → { label, fg, bg } using the live named band list.
  function resolveBand(score, cfg) {
    var sorted = orderedBands(cfg);
    var hit = null;
    for (var i = 0; i < sorted.length; i++) {
      if (score >= (sorted[i].min || 0)) { hit = sorted[i]; break; }
    }
    if (!hit) hit = sorted[sorted.length - 1];
    var idx = sorted.indexOf(hit);
    var pal = KX.paletteFor(sorted.length);
    var tone = pal[idx] || pal[idx % pal.length];
    return { label: hit ? hit.name : '—', fg: tone.fg, bg: tone.bg };
  }

  // Valid when cutoffs strictly decrease and the floor sits at 0.
  function bandListValid(list) {
    if (!list || list.length < MIN_BANDS) return false;
    var sorted = list.slice().sort(function (a, b) { return b.min - a.min; });
    for (var i = 1; i < sorted.length; i++) {
      if (!(sorted[i - 1].min > sorted[i].min)) return false;
    }
    return sorted[sorted.length - 1].min === 0;
  }

  /* ---------------------------------------------------------------------
     STATE
     --------------------------------------------------------------------- */

  var cfg = loadConfig();
  var initialCfg = JSON.stringify(cfg);
  var savedAt = null;
  var openType = null;         // task type key whose override panel is open
  var previewTab = 'types';    // 'types' | 'tasks'
  var advanced = false;
  try { advanced = localStorage.getItem(ADVANCED_KEY) === '1'; } catch (e) {}

  var isDirty   = function () { return JSON.stringify(cfg) !== initialCfg; };
  var weightTot = function () { return cfg.weights.time + cfg.weights.importance + cfg.weights.effort; };
  var bandsOk   = function () { return bandListValid(effectiveBandList(cfg)); };
  var isValid   = function () { return weightTot() === 100 && bandsOk(); };

  /* ---------------------------------------------------------------------
     MARKUP HELPERS
     --------------------------------------------------------------------- */

  var CARD_TONES = {
    amber: { bg: 'var(--amber-50)',  fg: 'var(--amber-600)' },
    coral: { bg: 'var(--coral-50)',  fg: 'var(--coral-500)' },
    teal:  { bg: 'var(--teal-50)',   fg: 'var(--teal-500)' },
    ink:   { bg: 'var(--surface-3)', fg: 'var(--ink-700)' }
  };

  function cardHead(icon, tone, title, sub) {
    var t = CARD_TONES[tone] || CARD_TONES.amber;
    return '<div class="pf-card-head">' +
      '<div class="pf-card-icon" style="background:' + t.bg + '">' + micon(icon, { size: 22, color: t.fg }) + '</div>' +
      '<div class="pf-card-title"><h2>' + esc(title) + '</h2>' +
      '<div class="pf-card-sub">' + sub + '</div></div></div>';
  }

  function warnBox(id, text) {
    return '<div class="pf-warn" id="' + id + '">' +
      micon('error', { size: 18 }) + '<span>' + text + '</span></div>';
  }

  /**
   * Vector number field.
   * @param {object} o { path, value, step, min, max, cls }
   *   `path` is a dotted address into cfg that the change handler resolves,
   *   e.g. 'timeTiers.due24h.weight' or 'band.b-crit.min'.
   */
  function numField(o) {
    return '<vaadin-number-field theme="outlined" class="pf-num-field' + (o.cls ? ' ' + o.cls : '') + '"' +
      ' data-path="' + KX.attr(o.path) + '"' +
      ' value="' + o.value + '"' +
      ' step="' + (o.step != null ? o.step : 1) + '"' +
      (o.min != null ? ' min="' + o.min + '"' : '') +
      (o.max != null ? ' max="' + o.max + '"' : '') +
      (o.label ? ' aria-label="' + KX.attr(o.label) + '"' : '') +
      '></vaadin-number-field>';
  }

  // Duration field — number + hrs/days toggle. Switching unit converts the
  // underlying value so elapsed time stays the same (24 hrs ⇄ 1 day); admins
  // shouldn't be surprised that toggling to "days" means "24 days".
  function durationField(path, t) {
    return '<span class="pf-dur">' +
      numField({ path: path + '.value', value: t.value, step: 1, min: 1, label: 'Threshold' }) +
      // `selected` is assigned as a property after upgrade (wireElements) —
      // setting it in markup makes the group stamp `checked` onto buttons that
      // haven't upgraded yet, which throws inside the component.
      '<vwc-toggle-button-group class="pf-unit-toggle" data-unit-path="' + KX.attr(path) +
      '" data-unit="' + KX.attr(t.unit) + '">' +
      '<vwc-toggle-button value="hours">hrs</vwc-toggle-button>' +
      '<vwc-toggle-button value="days">days</vwc-toggle-button>' +
      '</vwc-toggle-button-group></span>';
  }

  var weightCell = function (path, weight) {
    return '<div class="pf-tier-cell">' +
      numField({ path: path, value: weight, step: 0.05, min: 0, max: 1, label: 'Weight' }) + '</div>';
  };

  /* ---- Time-pressure tier table (used by the card AND each override) ---- */
  function tierGrid(tiers, prefix) {
    return '<div class="pf-tier-grid">' +
      '<div class="pf-tier-h">Window</div><div class="pf-tier-h">Threshold</div><div class="pf-tier-h">Weight (0–1)</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--status-late)"></span>Overdue</div>' +
      '<div class="pf-tier-cell pf-tier-static">past due</div>' +
      weightCell(prefix + '.overdue.weight', tiers.overdue.weight) + '</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--coral-400)"></span>Due within</div>' +
      '<div class="pf-tier-cell">' + durationField(prefix + '.due24h', tiers.due24h) + '</div>' +
      weightCell(prefix + '.due24h.weight', tiers.due24h.weight) + '</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--amber-400)"></span>Due within</div>' +
      '<div class="pf-tier-cell">' + durationField(prefix + '.due7d', tiers.due7d) + '</div>' +
      weightCell(prefix + '.due7d.weight', tiers.due7d.weight) + '</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--teal-300)"></span>Beyond</div>' +
      '<div class="pf-tier-cell pf-tier-static">everything else</div>' +
      weightCell(prefix + '.beyond.weight', tiers.beyond.weight) + '</div>' +
      '</div>';
  }

  /* ---- No-due-date SLA fall-through table (per type) ---- */
  function slaGrid(sla, prefix) {
    return '<div class="pf-tier-grid">' +
      '<div class="pf-tier-h">State</div><div class="pf-tier-h">After</div><div class="pf-tier-h">Weight (0–1)</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--amber-300)"></span>At risk</div>' +
      '<div class="pf-tier-cell">' + durationField(prefix + '.atRisk', sla.atRisk) + '</div>' +
      weightCell(prefix + '.atRisk.weight', sla.atRisk.weight) + '</div>' +

      '<div class="pf-tier-row">' +
      '<div class="pf-tier-label"><span class="pf-tier-dot" style="background:var(--status-late)"></span>Past SLA</div>' +
      '<div class="pf-tier-cell">' + durationField(prefix + '.pastSla', sla.pastSla) + '</div>' +
      weightCell(prefix + '.pastSla.weight', sla.pastSla.weight) + '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     CARD 1 — Task-type importance  (always visible)
     --------------------------------------------------------------------- */
  function importanceCard() {
    var grouped = {};
    Object.keys(K.TASK_TYPES).forEach(function (key) {
      var def = K.TASK_TYPES[key];
      (grouped[def.source] = grouped[def.source] || []).push({ key: key, def: def });
    });
    var order = ['ts', 'ci', 'gt', 'sched', 'ev'];

    var sections = order.filter(function (s) { return grouped[s]; }).map(function (srcId) {
      var src = K.SOURCES[srcId];
      var rows = grouped[srcId].map(function (row) {
        var key = row.key, def = row.def;
        var hasOverride = !!((cfg.timeByType && cfg.timeByType[key]) || (cfg.slaByType && cfg.slaByType[key]));
        var isOpen = openType === key;
        var impVal = Math.round((cfg.importance[key] != null ? cfg.importance[key] : def.importance) * 100);

        var override = '';
        if (hasOverride && isOpen) {
          var tOv = (cfg.timeByType && cfg.timeByType[key]) || cfg.timeTiers;
          var sOv = (cfg.slaByType && cfg.slaByType[key]) || cfg.sla;
          override =
            '<div class="pf-imp-override">' +
            '<div class="pf-imp-override-head">' +
            '<span class="lbl">Custom timing &amp; SLA · ' + esc(def.label) + '</span>' +
            '<vaadin-button theme="tertiary small" data-clear-override="' + KX.attr(key) + '">' +
            'Reset to department default</vaadin-button></div>' +
            '<div class="pf-imp-override-sub">Has a due date · time pressure</div>' +
            tierGrid(tOv, 'timeByType.' + key) +
            '<div class="pf-imp-override-sub" style="margin-top:14px">No due date · SLA fall-through</div>' +
            slaGrid(sOv, 'slaByType.' + key) +
            '</div>';
        }

        return '<div class="pf-imp-row">' +
          '<span class="pf-imp-icon" style="background:' + src.bg + '">' +
          micon(def.icon, { size: 19, color: src.color }) + '</span>' +
          '<div class="pf-imp-name" title="' + KX.attr(def.label) + '">' + esc(def.label) + '</div>' +
          '<input type="range" class="pf-range" min="0" max="100" step="1" value="' + impVal +
          '" data-imp="' + KX.attr(key) + '" aria-label="' + KX.attr(def.label + ' importance') + '">' +
          '<div class="pf-imp-val" data-imp-val="' + KX.attr(key) + '">' + impVal + '</div>' +
          '<button class="pf-imp-timing' + (hasOverride ? ' has-override' : '') + '"' +
          ' data-timing="' + KX.attr(key) + '" data-has="' + (hasOverride ? '1' : '0') + '"' +
          ' title="' + KX.attr(hasOverride
            ? (isOpen ? 'Hide custom timing & SLA' : 'Custom timing & SLA — edit')
            : 'Customize timing & SLA for this type') + '">' +
          micon(hasOverride ? 'tune' : 'more_time', { size: 18 }) + '</button>' +
          override + '</div>';
      }).join('');

      return '<div class="pf-imp-section">' +
        '<div class="pf-imp-section-head"><span class="src-bar" style="background:' + src.color + '"></span>' +
        esc(src.name) + '<span class="count">· ' + grouped[srcId].length + ' types</span></div>' +
        rows + '</div>';
    }).join('');

    return '<div class="pf-card">' +
      cardHead('tune', 'teal', 'Task-type importance',
        'Per-type baseline weight, set once for the whole department. A mandatory NFPA training is ' +
        'fundamentally more important than a PTO confirmation — this is where you say so. Use the timing ' +
        'button on any row to override its time-pressure curve and set its own SLA.') +
      sections + '</div>';
  }

  /* ---------------------------------------------------------------------
     CARD 2a — Score weights
     --------------------------------------------------------------------- */
  function weightsCard() {
    var w = cfg.weights;
    var rows = [
      { k: 'time',       label: 'Time pressure',   swatch: 'var(--coral-400)' },
      { k: 'importance', label: 'Type importance', swatch: 'var(--amber-400)' },
      { k: 'effort',     label: 'Effort',          swatch: 'var(--teal-400)' }
    ].map(function (r) {
      return '<div class="pf-slider-row">' +
        '<label><span class="swatch" style="background:' + r.swatch + '"></span>' + esc(r.label) + '</label>' +
        '<input type="range" class="pf-range" min="0" max="100" step="5" value="' + w[r.k] +
        '" data-weight="' + r.k + '" aria-label="' + KX.attr(r.label + ' weight') + '">' +
        '<div class="pf-num" data-weight-val="' + r.k + '">' + w[r.k] + '<small>%</small></div></div>';
    }).join('');

    return '<div class="pf-card">' +
      cardHead('balance', 'amber', 'Score weights',
        'A task’s priority blends three signals. Dragging one slider rebalances the others so the total stays at 100%.') +
      rows +
      '<div id="pfWeightWarnHost">' + (weightTot() !== 100
        ? warnBox('pfWeightWarn', 'Weights sum to ' + weightTot() + '%. They must total 100% to save.') : '') + '</div>' +
      '<div class="pf-formula" id="pfFormula">' + formulaHtml() + '</div>' +
      '</div>';
  }

  function formulaHtml() {
    var w = cfg.weights;
    return '<b>score</b> = <em>' + w.time + '</em> × time_weight + <em>' + w.importance +
      '</em> × type_importance + <em>' + w.effort + '</em> × effort' +
      '<div class="footnote">Time and effort are scored 0–1; type importance is set on a 0–100 scale and ' +
      'normalised. The blended result is 0–100, then mapped to a priority band.</div>';
  }

  /* ---------------------------------------------------------------------
     CARD 2b — Time-pressure tiers (department default)
     --------------------------------------------------------------------- */
  function timeTiersCard() {
    return '<div class="pf-card">' +
      cardHead('schedule', 'coral', 'Time-pressure tiers',
        'The department default: how a task’s distance from its due date is scored. Any task type can ' +
        'override these — and set its own no-due-date SLA — from its row in the importance table above.') +
      tierGrid(cfg.timeTiers, 'timeTiers') + '</div>';
  }

  /* ---------------------------------------------------------------------
     CARD 2c — Priority bands
     --------------------------------------------------------------------- */
  function bandsCard() {
    var list = effectiveBandList(cfg);
    var ordered = orderedBands(cfg);
    var pal = KX.paletteFor(ordered.length);

    var rows = ordered.map(function (band, i) {
      var tone = pal[i] || pal[i % pal.length];
      var isFloor = i === ordered.length - 1;
      var upper = i === 0 ? null : ordered[i - 1].min - 1;
      var rangeTxt = isFloor
        ? 'below ' + (ordered[i - 1] ? ordered[i - 1].min : band.min)
        : (upper != null ? band.min + ' – ' + upper : 'score ≥ ' + band.min);

      return '<div class="pf-bandrow" style="background:' + tone.bg + '">' +
        '<span class="pf-bandrow-swatch" style="background:' + tone.fg + '"></span>' +
        '<input class="pf-bandrow-name" value="' + KX.attr(band.name) + '" data-band-name="' + KX.attr(band.id) +
        '" style="color:' + tone.fg + '" aria-label="Band name" placeholder="Band name">' +
        '<span class="pf-bandrow-range" data-band-range="' + KX.attr(band.id) + '" style="color:' + tone.fg + '">' +
        esc(rangeTxt) + '</span>' +
        '<span class="pf-bandrow-cut">' +
        (isFloor
          ? '<span class="pf-bandrow-floorlbl">floor</span>'
          : '<span class="ge" style="color:' + tone.fg + '">≥</span>' +
            numField({ path: 'band.' + band.id + '.min', value: band.min, step: 1, min: 1, max: 100, label: 'Cutoff score' })) +
        '<vaadin-button theme="icon tertiary small" data-band-del="' + KX.attr(band.id) + '"' +
        (list.length <= MIN_BANDS ? ' disabled' : '') +
        ' title="' + (list.length <= MIN_BANDS ? 'At least two bands are required' : 'Remove band') + '"' +
        ' aria-label="Remove band" style="color:' + tone.fg + '">' + micon('close', { size: 18 }) + '</vaadin-button>' +
        '</span></div>';
    }).join('');

    var addOrMax = list.length < MAX_BANDS
      ? '<button class="pf-addband" id="pfAddBand">' + micon('add', { size: 18 }) + 'Add band</button>'
      : '<div style="margin-top:12px;font-size:12px;color:var(--ink-500);text-align:center">Maximum of five bands reached.</div>';

    return '<div class="pf-card">' +
      cardHead('flag', 'coral', 'Priority bands',
        'Name your own bands and set the score cutoff for each — keep between two and five. The lowest band ' +
        'is the floor (everything below the band above it). These labels show on every task row.') +
      '<div class="pf-bandlist">' + rows + '</div>' + addOrMax +
      '<div id="pfBandWarnHost">' + (bandsOk() ? '' :
        warnBox('pfBandWarn', 'Cutoffs must strictly decrease and the lowest band must start at 0. Adjust before saving.')) +
      '</div></div>';
  }

  /* ---------------------------------------------------------------------
     ADVANCED SECTION — vaadin-details wrapping the three knob cards
     --------------------------------------------------------------------- */
  function advancedSection() {
    return '<vaadin-details class="pf-advanced" id="pfAdvanced"' + (advanced ? ' opened' : '') + '>' +
      '<vaadin-details-summary slot="summary">' +
      '<span class="pf-adv-summary">' +
      '<span class="pf-adv-icon">' + micon('tune', { size: 18 }) + '</span>' +
      '<span class="pf-adv-text" style="flex:1"><b>Advanced settings</b>' +
      '<span>Score weights · Time-pressure tiers · Priority bands</span></span>' +
      '</span></vaadin-details-summary>' +
      weightsCard() + timeTiersCard() + bandsCard() +
      '</vaadin-details>';
  }

  /* ---------------------------------------------------------------------
     LIVE PREVIEW
     ---------------------------------------------------------------------
     Two tabs:
       · "Task types" (primary) — a representative, config-driven score per
         task type, so a battalion chief who thinks in categories (not
         individual tickets) can see how the scheme treats each type.
       · "Individual tasks" (behind the Future-functionality flag) — per-task
         re-ranking of representative sample tasks. */

  var SAMPLE_IDS = ['t02', 't09', 't08', 't15', 't11', 't06', 't14', 't03'];

  function typeRows() {
    var counts = {};
    K.TASKS.forEach(function (t) { counts[t.type] = (counts[t.type] || 0) + 1; });
    return Object.keys(K.TASK_TYPES).map(function (key) {
      var def = K.TASK_TYPES[key];
      var imp01 = cfg.importance[key] != null ? cfg.importance[key] : def.importance;
      var tiers = effectiveTiers(cfg, key);
      // A "typical pending task" of each type: its configured importance, the
      // type's effective within-a-week time weight, and a neutral effort.
      var Tref = tiers && tiers.due7d ? tiers.due7d.weight : 0.6;
      var Eref = 0.5;
      var score = Math.round(cfg.weights.time * Tref + cfg.weights.importance * imp01 + cfg.weights.effort * Eref);
      return {
        key: key, def: def, src: K.SOURCES[def.source],
        imp: Math.round(imp01 * 100), score: score, count: counts[key] || 0
      };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function previewBodyHtml() {
    var flags = KX.getFlags();
    if (!flags.futureOn) previewTab = 'types';

    var body;
    if (previewTab === 'types') {
      var rows = typeRows();
      body = rows.map(function (r) {
        var tone = resolveBand(r.score, cfg);
        return '<div class="pf-preview-task pf-preview-type">' +
          '<span class="pf-ptype-icon" style="background:' + r.src.bg + '">' +
          micon(r.def.icon, { size: 18, color: r.src.color }) + '</span>' +
          '<div class="pf-preview-title">' + esc(r.def.label) + '</div>' +
          '<div class="pf-preview-score" style="color:' + tone.fg + '">' + r.score + '</div>' +
          '<div class="pf-preview-meta">' + esc(tone.label) + ' · importance ' + r.imp + ' · ' + r.count + ' active</div>' +
          '</div>';
      }).join('') +
      '<div class="pf-preview-foot"><b>Type configuration</b><br>' +
      '<span style="opacity:0.9">' + rows.length + ' task types ranked. <b>' +
      esc(rows[0] ? rows[0].def.label : '—') + '</b> sits highest under this scheme.</span></div>';
    } else {
      var scored = SAMPLE_IDS
        .map(function (id) { return K.TASKS.find(function (t) { return t.id === id; }); })
        .filter(Boolean)
        .map(function (t) { return { t: t, p: priorityWith(t, cfg) }; })
        .sort(function (a, b) { return b.p.score - a.p.score; });

      var topLabel = orderedBands(cfg)[0] ? orderedBands(cfg)[0].name : 'top band';
      var topCount = K.TASKS.filter(function (t) {
        return resolveBand(priorityWith(t, cfg).score, cfg).label === topLabel;
      }).length;

      body = scored.map(function (row) {
        var t = row.t, tone = resolveBand(row.p.score, cfg);
        var meta = t.dueAt
          ? (t.dueAt < K.NOW
              ? Math.round((K.NOW - t.dueAt) / 3600000) + 'h overdue'
              : 'due in ' + Math.round((t.dueAt - K.NOW) / 3600000) + 'h')
          : 'open ' + (t.openDays || 0).toFixed(1) + 'd (SLA)';
        return '<div class="pf-preview-task">' +
          '<div class="pf-preview-title">' + esc(t.title) + '</div>' +
          '<div class="pf-preview-score" style="color:' + tone.fg + '">' + row.p.score + '</div>' +
          '<div class="pf-preview-meta">' + esc(tone.label) + ' · ' + esc(meta) + '</div></div>';
      }).join('') +
      '<div class="pf-preview-foot"><b>Department impact</b><br>' +
      '<span style="opacity:0.9">' + K.TASKS.length + ' active tasks would be reranked. <b>' +
      topCount + '</b> land in ' + esc(topLabel) + '.</span></div>';
    }
    return body;
  }

  function previewHtml() {
    var flags = KX.getFlags();
    var subText = previewTab === 'types'
      ? 'How each task type would rank for a typical pending item. Tune importance and weights to see the order shift.'
      : 'Representative individual tasks, re-scored with your current settings. The order updates as you tune.';

    var tabs = flags.futureOn
      ? '<vaadin-tabs class="pf-preview-tabs" id="pfPreviewTabs" selected="' + (previewTab === 'types' ? 0 : 1) + '">' +
        '<vaadin-tab>' + micon('category', { size: 16 }) + '<span class="kx-btn-label">Task types</span></vaadin-tab>' +
        '<vaadin-tab>' + micon('format_list_bulleted', { size: 16 }) + '<span class="kx-btn-label">Individual tasks</span></vaadin-tab>' +
        '</vaadin-tabs>'
      : '';

    return '<div class="pf-preview-track" id="pfPreviewTrack"><div class="pf-preview-floater" id="pfPreviewFloater">' +
      '<div class="pf-card pf-preview">' +
      cardHead('visibility', 'ink', 'Live preview', '<span id="pfPreviewSub">' + esc(subText) + '</span>') +
      tabs +
      '<div id="pfPreviewBody">' + previewBodyHtml() + '</div>' +
      '</div></div></div>';
  }

  /* ---------------------------------------------------------------------
     TOOLBAR
     --------------------------------------------------------------------- */
  function toolbarHtml() {
    var dirty = isDirty();
    var status = dirty
      ? '<span class="pf-dirty-dot"></span>Unsaved changes'
      : savedAt
        ? micon('check_circle', { size: 16, color: 'var(--teal-400)' }) + 'Saved ' +
          savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : micon('history', { size: 16 }) + 'Last edited by Chief Smith · 12 days ago';

    return '<div class="pf-toolbar"><div class="pf-toolbar-inner">' +
      '<div class="pf-status' + (dirty ? ' dirty' : '') + '" id="pfStatus">' + status + '</div>' +
      '<vaadin-button theme="secondary" id="pfReset">Reset to defaults</vaadin-button>' +
      '<vaadin-button theme="primary" id="pfSave"' + (!dirty || !isValid() ? ' disabled' : '') + '>' +
      micon('save', { size: 16 }) + '<span class="kx-btn-label">Save changes</span></vaadin-button>' +
      '</div></div>';
  }

  /* ---------------------------------------------------------------------
     FULL RENDER
     --------------------------------------------------------------------- */
  function render() {
    var root = document.getElementById('root');
    root.innerHTML =
      '<div class="kx-app"><div class="kx-shell"><div class="kx-main kx-main--wide"><main class="kx-content">' +
      '<nav class="pf-topbar" aria-label="Breadcrumb">' +
      '<a class="pf-backlink" href="index.html">' + micon('arrow_back', { size: 18 }) + 'Back to Hub</a>' +
      '</nav>' +
      '<div class="pf-main">' +
      '<div style="min-width:0">' +
      '<div class="pf-intro"><h1>Prioritization</h1>' +
      '<p>Tune how Keystone ranks open work across TargetSolutions, CheckIt, Guardian, Scheduling, and EV+. ' +
      'Settings apply department-wide and take effect immediately.</p></div>' +
      importanceCard() +
      advancedSection() +
      '</div>' +
      previewHtml() +
      '</div></main></div></div>' +
      toolbarHtml() +
      '</div>';

    wireElements();
    startFloatingPreview();
  }

  /* ---------------------------------------------------------------------
     GRANULAR REFRESH — everything derived from cfg, without touching inputs
     --------------------------------------------------------------------- */
  function refreshDerived() {
    // Weight readouts + formula + warning
    ['time', 'importance', 'effort'].forEach(function (k) {
      var el = document.querySelector('[data-weight-val="' + k + '"]');
      if (el) el.innerHTML = cfg.weights[k] + '<small>%</small>';
    });
    var formula = document.getElementById('pfFormula');
    if (formula) formula.innerHTML = formulaHtml();
    var wHost = document.getElementById('pfWeightWarnHost');
    if (wHost) {
      wHost.innerHTML = weightTot() !== 100
        ? '<div class="pf-warn" id="pfWeightWarn">' + micon('error', { size: 18 }) +
          '<span>Weights sum to ' + weightTot() + '%. They must total 100% to save.</span></div>'
        : '';
    }

    // Band range labels + validity warning
    var ordered = orderedBands(cfg);
    ordered.forEach(function (band, i) {
      var el = document.querySelector('[data-band-range="' + band.id + '"]');
      if (!el) return;
      var isFloor = i === ordered.length - 1;
      var upper = i === 0 ? null : ordered[i - 1].min - 1;
      el.textContent = isFloor
        ? 'below ' + (ordered[i - 1] ? ordered[i - 1].min : band.min)
        : (upper != null ? band.min + ' – ' + upper : 'score ≥ ' + band.min);
    });
    var bHost = document.getElementById('pfBandWarnHost');
    if (bHost) {
      bHost.innerHTML = bandsOk() ? ''
        : '<div class="pf-warn" id="pfBandWarn">' + micon('error', { size: 18 }) +
          '<span>Cutoffs must strictly decrease and the lowest band must start at 0. Adjust before saving.</span></div>';
    }

    refreshPreview();
    refreshToolbar();
  }

  function refreshPreview() {
    var body = document.getElementById('pfPreviewBody');
    if (body) body.innerHTML = previewBodyHtml();
    var sub = document.getElementById('pfPreviewSub');
    if (sub) {
      sub.textContent = previewTab === 'types'
        ? 'How each task type would rank for a typical pending item. Tune importance and weights to see the order shift.'
        : 'Representative individual tasks, re-scored with your current settings. The order updates as you tune.';
    }
  }

  function refreshToolbar() {
    var dirty = isDirty();
    var status = document.getElementById('pfStatus');
    if (status) {
      status.className = 'pf-status' + (dirty ? ' dirty' : '');
      status.innerHTML = dirty
        ? '<span class="pf-dirty-dot"></span>Unsaved changes'
        : savedAt
          ? micon('check_circle', { size: 16, color: 'var(--teal-400)' }) + 'Saved ' +
            savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : micon('history', { size: 16 }) + 'Last edited by Chief Smith · 12 days ago';
    }
    var save = document.getElementById('pfSave');
    if (save) {
      if (!dirty || !isValid()) save.setAttribute('disabled', '');
      else save.removeAttribute('disabled');
    }
  }

  /* ---------------------------------------------------------------------
     PATH RESOLUTION — 'timeTiers.due24h.weight' / 'band.b-crit.min'
     --------------------------------------------------------------------- */
  function setByPath(path, value) {
    var parts = path.split('.');
    if (parts[0] === 'band') {
      var band = effectiveBandList(cfg).find(function (b) { return b.id === parts[1]; });
      if (band) band[parts[2]] = value;
      // Persist the seeded list if it wasn't stored yet.
      cfg.bandList = effectiveBandList(cfg);
      return;
    }
    // Per-type overrides may not exist yet — seed from the department default.
    if ((parts[0] === 'timeByType' || parts[0] === 'slaByType') && !cfg[parts[0]][parts[1]]) {
      cfg[parts[0]][parts[1]] = clone(parts[0] === 'timeByType' ? cfg.timeTiers : cfg.sla);
    }
    var node = cfg;
    for (var i = 0; i < parts.length - 1; i++) node = node[parts[i]];
    node[parts[parts.length - 1]] = value;
  }

  function getByPath(path) {
    var parts = path.split('.');
    if (parts[0] === 'band') {
      var band = effectiveBandList(cfg).find(function (b) { return b.id === parts[1]; });
      return band ? band[parts[2]] : null;
    }
    var node = cfg;
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return null;
      node = node[parts[i]];
    }
    return node;
  }

  /* ---------------------------------------------------------------------
     WEIGHT REBALANCE — dragging one slider rebalances the other two
     --------------------------------------------------------------------- */
  function setWeight(key, val) {
    var w = cfg.weights;
    var others = ['time', 'importance', 'effort'].filter(function (k) { return k !== key; });
    var rest = 100 - val;
    var oldRestTotal = others.reduce(function (s, k) { return s + w[k]; }, 0) || 1;
    var next = Object.assign({}, w);
    next[key] = val;
    others.forEach(function (k) {
      next[k] = Math.max(0, Math.round((w[k] / oldRestTotal) * rest));
    });
    // Absorb rounding drift into the last of the other two.
    next[others[others.length - 1]] += 100 - (next.time + next.importance + next.effort);
    cfg.weights = next;

    // Push the recomputed values into the sibling sliders without re-rendering
    // (the user is mid-drag on this one).
    others.forEach(function (k) {
      var el = document.querySelector('[data-weight="' + k + '"]');
      if (el) el.value = next[k];
    });
  }

  /* ---------------------------------------------------------------------
     OVERRIDES
     --------------------------------------------------------------------- */
  function startOverride(key) {
    // Seed both overrides from the current department defaults.
    cfg.timeByType[key] = clone(cfg.timeTiers);
    cfg.slaByType[key] = clone(cfg.sla);
    openType = key;
    render();
  }
  function clearOverride(key) {
    delete cfg.timeByType[key];
    delete cfg.slaByType[key];
    if (openType === key) openType = null;
    render();
  }

  /* ---------------------------------------------------------------------
     BANDS
     --------------------------------------------------------------------- */
  function addBand() {
    var list = effectiveBandList(cfg);
    if (list.length >= MAX_BANDS) return;
    var ordered = orderedBands(cfg);
    // Insert just above the floor, splitting the gap.
    var aboveFloor = ordered[ordered.length - 2];
    var seedMin = aboveFloor ? Math.max(1, Math.round(aboveFloor.min / 2)) : 30;
    var floor = ordered[ordered.length - 1];
    var withoutFloor = list.filter(function (b) { return b.id !== floor.id; });
    cfg.bandList = withoutFloor.concat([
      { id: 'b-' + Date.now().toString(36), name: 'New band', min: seedMin },
      floor
    ]);
    render();
  }

  function removeBand(id) {
    var list = effectiveBandList(cfg);
    if (list.length <= MIN_BANDS) return;
    var next = list.filter(function (b) { return b.id !== id; });
    // Guarantee a floor at 0.
    var lo = next.slice().sort(function (a, b) { return a.min - b.min; })[0];
    cfg.bandList = next.map(function (b) { return b.id === lo.id ? Object.assign({}, b, { min: 0 }) : b; });
    render();
  }

  /* ---------------------------------------------------------------------
     WIRING
     ---------------------------------------------------------------------
     Two halves, and the split matters:

     · wireDelegated() runs ONCE at boot. #root survives every re-render, so
       attaching these per render would stack duplicate handlers and make a
       single click fire N times.
     · wireElements() runs per render, for listeners that must bind to the
       specific component instances render() just created.
     --------------------------------------------------------------------- */
  function wireDelegated() {
    var root = document.getElementById('root');

    /* ---- Range sliders (importance + weights): live, no re-render ---- */
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('input[data-imp]')) {
        var key = t.getAttribute('data-imp');
        var pct = +t.value;
        // Importance is presented 0–100 but stored 0–1 so the scoring formula
        // (time and effort are also 0–1) stays consistent.
        cfg.importance[key] = Math.max(0, Math.min(1, pct / 100));
        var out = document.querySelector('[data-imp-val="' + key + '"]');
        if (out) out.textContent = pct;
        refreshPreview();
        refreshToolbar();
        return;
      }
      if (t.matches('input[data-weight]')) {
        setWeight(t.getAttribute('data-weight'), +t.value);
        refreshDerived();
        return;
      }
      if (t.matches('input[data-band-name]')) {
        setByPath('band.' + t.getAttribute('data-band-name') + '.name', t.value);
        refreshPreview();
        refreshToolbar();
      }
    });

    /* ---- Vector number fields: value-changed fires per keystroke ---- */
    root.addEventListener('value-changed', function (e) {
      var t = e.target;
      if (!t.matches || !t.matches('vaadin-number-field[data-path]')) return;
      var raw = e.detail && e.detail.value;
      if (raw === '' || raw == null) return;              // mid-edit empty field
      var num = parseFloat(raw);
      if (isNaN(num)) return;
      setByPath(t.getAttribute('data-path'), num);
      refreshDerived();
    });

    /* ---- Unit toggles (hrs / days) — converts the stored value ---- */
    root.addEventListener('selection-change', function (e) {
      var g = e.target;
      if (!g.matches || !g.matches('[data-unit-path]')) return;
      var path = g.getAttribute('data-unit-path');
      var unit = e.detail;
      var cur = getByPath(path);
      if (!cur || unit === cur.unit) return;
      var hrs = toHours(cur);
      var nextVal = unit === 'days' ? Math.max(1, Math.round(hrs / 24)) : Math.max(1, Math.round(hrs));
      setByPath(path + '.unit', unit);
      setByPath(path + '.value', nextVal);
      render();   // the number changed too, so re-render this subtree
    });

    /* ---- Clicks ---- */
    root.addEventListener('click', function (e) {
      var timing = e.target.closest('[data-timing]');
      if (timing) {
        var key = timing.getAttribute('data-timing');
        if (timing.getAttribute('data-has') === '1') {
          openType = (openType === key) ? null : key;
          render();
        } else {
          startOverride(key);
        }
        return;
      }
      var clear = e.target.closest('[data-clear-override]');
      if (clear) { clearOverride(clear.getAttribute('data-clear-override')); return; }

      var del = e.target.closest('[data-band-del]');
      if (del) { if (!del.hasAttribute('disabled')) removeBand(del.getAttribute('data-band-del')); return; }

      if (e.target.closest('#pfAddBand')) { addBand(); return; }

      if (e.target.closest('#pfReset')) {
        cfg = clone(DEFAULT_CONFIG);
        openType = null;
        render();
        return;
      }
      if (e.target.closest('#pfSave')) {
        var btn = e.target.closest('#pfSave');
        if (btn.hasAttribute('disabled')) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
        initialCfg = JSON.stringify(cfg);
        savedAt = new Date();
        refreshToolbar();
        KX.pushToast({
          title: 'Prioritization saved',
          body: 'Every open task has been re-scored department-wide.',
          icon: 'check_circle', tone: 'success'
        });
      }
    });
  }

  // Per-render: bind to the component instances this render created.
  function wireElements() {
    /* ---- Unit toggles: selection must be set as a property post-upgrade ---- */
    document.querySelectorAll('[data-unit-path]').forEach(function (g) {
      KX.setToggleGroup(g, g.getAttribute('data-unit'));
    });

    /* ---- Advanced section (vaadin-details) ---- */
    var adv = document.getElementById('pfAdvanced');
    if (adv) {
      adv.addEventListener('opened-changed', function (e) {
        advanced = !!e.detail.value;
        try { localStorage.setItem(ADVANCED_KEY, advanced ? '1' : '0'); } catch (err) {}
      });
    }

    /* ---- Preview tabs ---- */
    var tabs = document.getElementById('pfPreviewTabs');
    if (tabs) {
      tabs.addEventListener('selected-changed', function (e) {
        previewTab = e.detail.value === 1 ? 'tasks' : 'types';
        refreshPreview();
      });
    }
  }

  /* ---------------------------------------------------------------------
     FLOATING PREVIEW
     ---------------------------------------------------------------------
     A full-height track gives the card room; a rAF loop eases its translateY
     toward a point a little above the viewport centre, so it floats up and
     down as the page scrolls instead of snapping to the top. */
  var rafId = null;
  function startFloatingPreview() {
    if (rafId) cancelAnimationFrame(rafId);
    var cur = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function tick() {
      var track = document.getElementById('pfPreviewTrack');
      var floater = document.getElementById('pfPreviewFloater');
      if (track && floater && window.innerWidth > 1100) {
        var trackRect = track.getBoundingClientRect();
        var cardH = floater.offsetHeight;
        var vh = window.innerHeight;
        var topGap = 112;                              // sticky chrome + a little air
        var focal = topGap + (vh - topGap) * 0.42;     // a touch above centre
        var target = (focal - cardH / 2) - trackRect.top;
        var maxY = Math.max(0, track.offsetHeight - cardH);
        target = Math.max(0, Math.min(target, maxY));
        if (cur == null || reduce) cur = target;
        else cur += (target - cur) * 0.10;
        if (Math.abs(target - cur) < 0.4) cur = target;
        floater.style.transform = 'translateY(' + cur + 'px)';
      } else if (floater) {
        floater.style.transform = '';
        cur = null;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */
  render();
  wireDelegated();

  // Prototype-only demo controls (role switch + feature flag). Kept as a
  // floating control since the nav chrome that used to host it is gone.
  KX.mountPrototypeFab({ role: 'chief', onRoleChange: function () {} });

  // The flag controls whether the preview's second tab exists.
  KX.onFlagsChange(function () { render(); });
})();
