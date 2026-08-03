/* global window, document, KEYSTONE, KX, KXCharts */
/* ========================================================================
   hub-agency-intel.js — the Hub's embedded Agency Intelligence card (phase 2).
   ------------------------------------------------------------------------
   An AI chat surface that queries across all source apps (TargetSolutions,
   Check It, Guardian, Scheduling, EV+) and returns a text answer, an inline
   chartlet, a CSV download, or a link to a full standalone dashboard.

   The point of the surface — beyond "ask the data" — is to introduce the
   chief to CORRELATIVE metrics: pairings of two operational signals that
   together suggest a root cause. The example prompts deliberately pair
   "what's late" with "why".

   Also owns the two rails that sit above the card:
     · widgetsRail()    — pinned single/paired-metric chart tiles
     · dashboardsRail() — published custom dashboards

   Both are created through the in-chat wizard:
     dashboard → metrics → viz per metric → name & publish   (3 steps)
     widget    → 1–2 metrics → viz & pin                     (2 steps)
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CC = window.KEYSTONE_CUSTOM;
  var esc = KX.esc, micon = KX.micon;

  /* =====================================================================
     SEEDED EXAMPLE PROMPTS + RESPONSES
     ===================================================================== */

  var EXAMPLES = [
    { id: 'training_vs_inspection', icon: 'compare_arrows',
      title: 'Where is training compliance dragging down apparatus inspections?',
      hint: 'TargetSolutions × Check It' },
    { id: 'overtime_forecast', icon: 'trending_up',
      title: 'Predict overtime risk for B-1 over the next 30 days.',
      hint: 'Scheduling × PTO requests' },
    { id: 'credentials_vs_ceu', icon: 'workspace_premium',
      title: 'Which credentials expire before CEUs are in place?',
      hint: 'TargetSolutions × Personnel' }
  ];

  var RESPONSES = {
    training_vs_inspection: {
      headline: 'Two stations show a strong training–inspection drag.',
      body: 'Across the battalion, stations whose annual training completion is under 75 % carry 3.2× more late apparatus inspections than peers. **Sta. 4** and **Sta. 7** sit in that zone. The correlation suggests a crew-capacity bottleneck, not a process gap — the same firefighters owe both queues.',
      chart: {
        kind: 'bar-pair',
        legend: [{ label: 'Training %', color: 'var(--amber-400)' },
                 { label: 'Inspection on-time %', color: 'var(--teal-300)' }],
        data: [{ label: 'Sta. 1', a: 91, b: 94 }, { label: 'Sta. 4', a: 68, b: 52 },
               { label: 'Sta. 7', a: 71, b: 61 }, { label: 'Sta. 9', a: 88, b: 90 },
               { label: 'Sta. 11', a: 82, b: 79 }]
      },
      csv: [
        ['Station', 'Training %', 'Inspection on-time %', 'Late inspections', 'Crews under 90%'],
        ['Sta. 1', '91', '94', '0', '0'], ['Sta. 4', '68', '52', '7', '3'],
        ['Sta. 7', '71', '61', '4', '2'], ['Sta. 9', '88', '90', '1', '0'],
        ['Sta. 11', '82', '79', '2', '1']
      ],
      dashboard: 'training-inspection'
    },

    overtime_forecast: {
      headline: 'B-1 overtime trending +18 % month-over-month.',
      body: 'Projected OT for B-1 next month: **412 hours** (vs. 348 last month). Sta. 7 drives ~60 % of the increase — 4 unfilled vacancies overlap with 3 approved PTO blocks between Jun 2 – Jun 9. Filling 2 of the 4 vacancies brings projected OT back under last month\'s baseline.',
      chart: {
        kind: 'line', color: 'var(--coral-400)', ySuffix: ' hrs',
        data: [{ x: 'Feb', y: 286 }, { x: 'Mar', y: 312 }, { x: 'Apr', y: 305 },
               { x: 'May', y: 348 }, { x: 'Jun*', y: 412, projected: true }]
      },
      csv: [['Month', 'OT hours', 'Driver'], ['Feb', '286', ''], ['Mar', '312', ''],
            ['Apr', '305', ''], ['May', '348', 'Sta. 4 sick leave'],
            ['Jun (projected)', '412', 'Sta. 7 vacancies × PTO']],
      dashboard: 'overtime-forecast'
    },

    credentials_vs_ceu: {
      headline: '11 personnel at risk of falling off-roster in 60 days.',
      body: 'These crew members have credentials expiring inside 60 days **and** under 50 % CEU progress. Four are paramedic re-certs — replacement cost ~$8 K each, plus 2 weeks of out-of-service time. Recommend prioritized cohort assignment this week.',
      chart: {
        kind: 'stack',
        data: [{ label: 'Paramedic', a: 4, b: 2 }, { label: 'EVOC', a: 3, b: 6 },
               { label: 'HazMat Ops', a: 2, b: 4 }, { label: 'CPR/AED', a: 2, b: 11 }],
        legend: [{ label: 'At risk (<50% CEU)', color: 'var(--coral-400)' },
                 { label: 'On track', color: 'var(--teal-300)' }]
      },
      csv: [['Person', 'Credential', 'Expires', 'CEU progress', 'Cohort'],
            ['Brennan, Riley', 'Paramedic', '2026-07-12', '38%', 'Unassigned'],
            ['Maguire, Owen', 'Paramedic', '2026-07-19', '41%', 'Q3 Cohort A'],
            ['Shah, Priya', 'EVOC', '2026-06-30', '12%', 'Unassigned'],
            ['Okafor, Jamal', 'HazMat Ops', '2026-07-04', '25%', 'Unassigned']],
      dashboard: 'credentials-risk'
    }
  };

  /* =====================================================================
     STATE
     ===================================================================== */

  var state = {
    thread: [],        // { role, text } | { role:'assistant', headline, body, chart, csv, dashboard }
    draft: '',
    thinking: false,
    wizard: null,      // { kind, step, metricIds, viz, name }
    customOpen: false  // "describe your own metric" panel
  };

  var slotEl = null;

  /* =====================================================================
     ANSWER HELPERS
     ===================================================================== */

  // Crude intent match: if a typed prompt shares >2 keywords with an example,
  // route to that seeded response instead of the generic stub.
  var STOP = ['the','and','a','in','on','to','is','of','how','what','where','when','do','does','with','for','are','by','an'];
  function keywordOverlap(a, b) {
    var norm = function (s) {
      return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/)
        .filter(function (w) { return w && STOP.indexOf(w) === -1; });
    };
    var sb = norm(b);
    return norm(a).filter(function (w) { return sb.indexOf(w) !== -1; }).length;
  }

  // Generic fallback: distribution of tasks per source app in the current set,
  // so the surface always demos as alive.
  function adhocResponse() {
    var bySource = {};
    K.TASKS.forEach(function (t) { bySource[t.source] = (bySource[t.source] || 0) + 1; });
    var rows = Object.keys(bySource).map(function (k) {
      return { label: K.SOURCES[k] ? K.SOURCES[k].name : k, value: bySource[k], fmt: String(bySource[k]) };
    }).sort(function (a, b) { return b.value - a.value; });
    return {
      headline: 'Here is what I see in your data.',
      body: 'I built a quick distribution across all source apps in your current scope. For deeper correlations, try one of the example prompts — they connect two signals.',
      chart: { kind: 'hbar', data: rows, max: Math.max.apply(null, rows.map(function (r) { return r.value; })) * 1.1 },
      csv: [['Source app', 'Task count']].concat(rows.map(function (r) { return [r.label, String(r.value)]; }))
    };
  }

  // Tiny markdown: **bold**. Splits on '**' and bolds odd indices.
  function bodyText(text) {
    return '<div class="cp-bodytext">' + text.split('**').map(function (p, i) {
      return i % 2 === 1 ? '<strong>' + esc(p) + '</strong>' : esc(p);
    }).join('') + '</div>';
  }

  /* =====================================================================
     TURNS
     ===================================================================== */

  function action(o) {
    var cls = 'cp-action' + (o.primary ? ' is-primary' : '');
    if (o.href) {
      return '<a class="' + cls + '" href="' + KX.attr(o.href) + '" target="_blank" rel="noreferrer">' +
        micon(o.icon, { size: 13 }) + esc(o.label) + '</a>';
    }
    return '<button class="' + cls + '" data-cp-action="' + KX.attr(o.action) + '"' +
      (o.arg ? ' data-cp-arg="' + KX.attr(o.arg) + '"' : '') + '>' +
      micon(o.icon, { size: 13 }) + esc(o.label) + '</button>';
  }

  function turnHtml(msg, idx) {
    if (msg.role === 'user') {
      return '<div class="cp-turn-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    // Widget receipt — widgets have no page of their own, so the success
    // message just confirms it landed in the rail above.
    if (msg.isWidgetReceipt) {
      return '<div class="cp-turn-ai is-receipt"><span class="badge">' +
        micon('check_circle', { size: 16, fill: 1 }) + '</span>' +
        '<div class="bubble"><div class="cp-headline" style="color:var(--teal-600)">Widget pinned</div>' +
        '<div class="cp-bodytext">"<strong>' + esc(msg.labels.join(' × ')) +
        '</strong>" is live in the widgets rail above.</div></div></div>';
    }
    if (msg.isPublishedReceipt) {
      return '<div class="cp-turn-ai is-receipt"><span class="badge">' +
        micon('check_circle', { size: 16, fill: 1 }) + '</span>' +
        '<div class="bubble"><div class="cp-headline" style="color:var(--teal-600)">"' + esc(msg.name) + '" published</div>' +
        '<div class="cp-bodytext">Pinned to the rail above this card. ' + msg.metricCount + ' metric' +
        (msg.metricCount === 1 ? '' : 's') + ' included. Click the tile to open it, or share the link with your battalion.</div>' +
        '<div class="cp-actions">' +
        action({ icon: 'open_in_new', label: 'Open dashboard', primary: true,
          href: 'agency-intelligence-dashboard.html?custom=' + encodeURIComponent(msg.dashboardId) }) +
        '</div></div></div>';
    }
    return '<div class="cp-turn-ai"><span class="badge">' + micon('auto_awesome', { size: 16, fill: 1 }) + '</span>' +
      '<div class="bubble">' +
      (msg.headline ? '<div class="cp-headline">' + esc(msg.headline) + '</div>' : '') +
      (msg.body ? bodyText(msg.body) : '') +
      (msg.chart ? KXCharts.inlineChart(msg.chart) : '') +
      ((msg.csv || msg.dashboard)
        ? '<div class="cp-actions">' +
          (msg.csv ? action({ icon: 'download', label: 'Export CSV', action: 'csv', arg: String(idx) }) : '') +
          (msg.dashboard ? action({ icon: 'open_in_new', label: 'Open as dashboard', primary: true,
            href: 'agency-intelligence-dashboard.html?view=' + msg.dashboard + '&q=' + encodeURIComponent(msg.prompt || '') }) : '') +
          '</div>'
        : '') +
      '</div></div>';
  }

  function thinkingHtml() {
    return '<div class="cp-turn-ai"><span class="badge">' + micon('auto_awesome', { size: 16, fill: 1 }) + '</span>' +
      '<div class="bubble" style="flex-direction:row;align-items:center;gap:6px;padding:10px 14px">' +
      '<span class="cp-thinking-dot"></span>' +
      '<span class="cp-thinking-dot" style="animation-delay:150ms"></span>' +
      '<span class="cp-thinking-dot" style="animation-delay:300ms"></span>' +
      '<span style="font-size:11px;color:var(--ink-500);margin-left:4px;font-style:italic">Querying across apps…</span>' +
      '</div></div>';
  }

  function emptyStateHtml() {
    return '<div style="display:flex;flex-direction:column;gap:12px;padding-top:2px">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--ink-400)">' +
      'Prompts to try</div>' +
      '<div class="cp-prompt-grid">' +
      EXAMPLES.map(function (ex) {
        return '<button class="cp-prompt" data-cp-example="' + KX.attr(ex.id) + '">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
          '<span class="chip">' + micon(ex.icon, { size: 14, fill: 1 }) + '</span>' +
          '<span class="hint">' + esc(ex.hint) + '</span></div>' +
          '<div class="title">' + esc(ex.title) + '</div></button>';
      }).join('') +
      '<div style="grid-column:span 2;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">' +
      createOwn('dashboard_customize', 'Create custom dashboard', 'Multi-metric, opens in a new tab', 'dashboard') +
      createOwn('widgets', 'Create custom widget', 'One chart, pinned above', 'widget') +
      '</div></div></div>';
  }

  function createOwn(icon, label, sub, kind) {
    return '<button class="cp-create" data-cp-wizard="' + kind + '">' +
      '<span class="chip">' + micon(icon, { size: 14, fill: 1 }) + '</span>' +
      '<span style="flex:1;min-width:0">' +
      '<span style="display:block;font-size:12px;font-weight:600;color:var(--ink-900);line-height:1.2">' + esc(label) + '</span>' +
      '<span style="display:block;font-size:10.5px;color:var(--ink-500);margin-top:2px">' + esc(sub) + '</span>' +
      '</span></button>';
  }

  /* =====================================================================
     WIZARD
     ===================================================================== */

  var WIDGET_MAX = 2;
  var WIDGET_VIZ_SINGLE = [
    { id: 'kpi', label: 'Big number', icon: 'pin' },
    { id: 'line', label: 'Trend', icon: 'show_chart' },
    { id: 'bar', label: 'Bar', icon: 'bar_chart' },
    { id: 'donut', label: 'Donut', icon: 'donut_large' }
  ];
  var WIDGET_VIZ_PAIR = [
    { id: 'pair', label: 'Paired bars', icon: 'bar_chart', hint: 'Side-by-side comparison by category' },
    { id: 'line', label: 'Dual line', icon: 'show_chart', hint: 'Two trends on the same axis' }
  ];

  function metricsByCategory() {
    var byCat = {};
    CC.AVAILABLE_METRICS.concat(CC.CUSTOM_METRICS).forEach(function (m) {
      (byCat[m.category] = byCat[m.category] || []).push(m);
    });
    return byCat;
  }

  function metricChip(m, on, atCap) {
    return '<button data-cp-metric="' + KX.attr(m.id) + '"' + (atCap ? ' disabled' : '') +
      ' style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:8px;' +
      'background:' + (on ? 'var(--amber-50)' : 'var(--surface-1)') + ';' +
      'border:1px solid ' + (on ? 'var(--amber-400)' : 'var(--ink-200)') + ';' +
      'cursor:' + (atCap ? 'not-allowed' : 'pointer') + ';opacity:' + (atCap ? 0.45 : 1) + ';' +
      'font-size:12px;font-weight:500;color:var(--ink-800);text-align:left;font-family:inherit">' +
      '<span style="width:22px;height:22px;border-radius:5px;background:' +
      (on ? 'var(--amber-400)' : (m.custom ? 'var(--teal-50)' : 'var(--ink-100)')) + ';color:' +
      (on ? 'white' : (m.custom ? 'var(--teal-500)' : 'var(--ink-500)')) +
      ';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
      micon(m.icon, { size: 13, fill: on ? 1 : 0 }) + '</span>' +
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m.label) + '</span>' +
      (on ? micon('check', { size: 14, color: 'var(--amber-600)' }) : '') + '</button>';
  }

  function metricPicker(selected, maxHeight, cap) {
    var byCat = metricsByCategory();
    return '<div style="display:flex;flex-direction:column;gap:10px;max-height:' + maxHeight +
      'px;overflow-y:auto;padding:2px 2px 0">' +
      Object.keys(byCat).map(function (cat) {
        return '<div><div style="font-size:9px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;' +
          'color:var(--ink-400);margin-bottom:6px">' + esc(cat) + '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));gap:6px">' +
          byCat[cat].map(function (m) {
            var on = selected.indexOf(m.id) !== -1;
            return metricChip(m, on, !on && cap != null && selected.length >= cap);
          }).join('') + '</div></div>';
      }).join('') + '</div>';
  }

  // Curated 2-metric pairings, so the user can jump straight to a meaningful
  // pairing instead of hunting the catalog. For widgets it replaces the current
  // selection (cap is 2); for dashboards it appends.
  function correlationSuggestions(selected, replaceMode) {
    var sgs = CC.CORRELATION_SUGGESTIONS || [];
    if (!sgs.length) return '';
    return '<div style="background:linear-gradient(180deg, var(--amber-50) 0%, var(--surface-1) 100%);' +
      'border:1px solid var(--amber-200);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:6px">' +
      micon('hub', { size: 13, color: 'var(--amber-700)' }) +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--amber-700)">' +
      'Suggested correlations</div>' +
      '<div style="font-size:10.5px;color:var(--ink-500);margin-left:auto">One click → both metrics' +
      (replaceMode ? ' (replaces current)' : '') + '</div></div>' +
      '<div style="display:flex;gap:6px;overflow-x:auto;margin:0 -2px;padding:2px 2px 4px">' +
      sgs.map(function (sg) {
        var metas = sg.metricIds.map(function (id) { return CC.metricById(id); }).filter(Boolean);
        if (metas.length < 2) return '';
        var all = sg.metricIds.every(function (id) { return selected.indexOf(id) !== -1; });
        return '<button data-cp-suggest="' + KX.attr(sg.id) + '" title="' +
          KX.attr(metas.map(function (m) { return m.label; }).join(' × ')) + '" ' +
          'style="flex:0 0 auto;display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:9px;' +
          'background:' + (all ? 'var(--amber-100)' : 'var(--surface-1)') + ';' +
          'border:1px solid ' + (all ? 'var(--amber-400)' : 'var(--ink-200)') + ';' +
          'cursor:pointer;text-align:left;font-family:inherit;min-width:180px;max-width:220px">' +
          '<div style="display:flex;align-items:center;gap:4px">' +
          '<span style="width:20px;height:20px;border-radius:5px;background:var(--amber-100);color:var(--amber-700);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(metas[0].icon, { size: 11, fill: 1 }) + '</span>' +
          micon('close', { size: 10, color: 'var(--ink-400)' }) +
          '<span style="width:20px;height:20px;border-radius:5px;background:var(--teal-50);color:var(--teal-500);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(metas[1].icon, { size: 11, fill: 1 }) + '</span>' +
          (all ? '<span style="margin-left:auto">' + micon('check_circle', { size: 13, fill: 1, color: 'var(--amber-600)' }) + '</span>' : '') +
          '</div>' +
          '<div style="font-size:11.5px;font-weight:600;color:var(--ink-900);line-height:1.25">' + esc(sg.title) + '</div>' +
          '<div style="font-size:10px;color:var(--ink-500);line-height:1.3">' + esc(sg.hint) + '</div></button>';
      }).join('') + '</div></div>';
  }

  // Freeform metric input — lets the user describe a metric the catalog
  // doesn't carry. Registering it synthesizes a mock dataset in the data layer
  // and auto-selects it in the wizard.
  function customMetricInput() {
    if (!state.customOpen) {
      return '<button data-cp-custom-open style="background:transparent;border:1px dashed var(--ink-200);' +
        'border-radius:9px;padding:8px 10px;color:var(--ink-600);font-size:11.5px;font-weight:600;' +
        'cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;align-self:flex-start">' +
        micon('add', { size: 14 }) + 'Describe your own metric</button>';
    }
    return '<div style="background:var(--surface-2);border:1px solid var(--ink-200);border-radius:10px;padding:10px;' +
      'display:flex;flex-direction:column;gap:8px">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500)">' +
      'Your own metric</div>' +
      '<vaadin-text-field theme="outlined small" id="cpCustomLabel" style="width:100%" ' +
      'placeholder="e.g. Hydrant flow tests overdue"></vaadin-text-field>' +
      '<vaadin-text-field theme="outlined small" id="cpCustomDesc" style="width:100%" ' +
      'placeholder="Optional — what should it measure?"></vaadin-text-field>' +
      '<div style="display:flex;gap:6px;justify-content:flex-end">' +
      '<vaadin-button theme="tertiary small" data-cp-custom-cancel>Cancel</vaadin-button>' +
      '<vaadin-button theme="primary small" data-cp-custom-add>Add metric</vaadin-button>' +
      '</div></div>';
  }

  function wizardBtn(o) {
    return '<vaadin-button theme="' + (o.primary ? 'primary' : 'secondary') + ' small"' +
      ' data-cp-wiz="' + KX.attr(o.action) + '"' + (o.disabled ? ' disabled' : '') + '>' +
      (o.iconLeft && o.icon ? micon(o.icon, { size: 13 }) : '') +
      '<span style="margin:0 4px">' + esc(o.label) + '</span>' +
      (!o.iconLeft && o.icon ? micon(o.icon, { size: 13 }) : '') + '</vaadin-button>';
  }

  function wizardFooter(inner, withBack) {
    return '<div style="display:flex;gap:6px;justify-content:space-between;align-items:center;margin-top:4px">' +
      '<button data-cp-wiz="cancel" style="background:transparent;border:none;color:var(--ink-500);' +
      'font-size:11px;font-weight:600;cursor:pointer;padding:6px 4px;font-family:inherit">Cancel</button>' +
      '<div style="display:flex;gap:6px">' +
      (withBack ? wizardBtn({ label: 'Back', action: 'back', icon: 'arrow_back', iconLeft: true }) : '') +
      inner + '</div></div>';
  }

  function wizardCard() {
    var w = state.wizard;
    var isWidget = w.kind === 'widget';
    var steps = isWidget ? ['metrics', 'viz'] : ['metrics', 'viz', 'name'];
    var stepIdx = steps.indexOf(w.step);
    var markIcon = isWidget ? 'widgets' : 'dashboard_customize';

    var progress = '<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--ink-500);' +
      'font-weight:600;letter-spacing:0.4px;text-transform:uppercase">' +
      micon(markIcon, { size: 13 }) +
      '<span>' + (isWidget ? 'New widget' : 'New dashboard') + ' · Step ' + (stepIdx + 1) + ' of ' + steps.length + '</span>' +
      '<div style="flex:1;display:flex;gap:3px;margin-left:8px">' +
      steps.map(function (s, i) {
        return '<div style="flex:1;height:3px;border-radius:99px;background:' +
          (i <= stepIdx ? 'var(--amber-400)' : 'var(--ink-100)') + ';transition:background 0.2s"></div>';
      }).join('') + '</div></div>';

    var body = '';
    if (w.step === 'metrics') body = isWidget ? widgetStepMetrics(w) : dashStepMetrics(w);
    else if (w.step === 'viz') body = isWidget ? widgetStepViz(w) : dashStepViz(w);
    else if (w.step === 'name') body = dashStepName(w);

    return '<div style="display:flex;gap:10px;align-items:flex-start">' +
      '<span style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg, var(--amber-400), var(--coral-400));' +
      'color:white;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;' +
      'box-shadow:0 2px 6px rgba(245, 158, 11, 0.3)">' + micon(markIcon, { size: 15, fill: 1 }) + '</span>' +
      '<div style="flex:1;min-width:0;background:var(--surface-1);border:1px solid var(--amber-200);' +
      'border-radius:14px 14px 14px 4px;padding:14px;box-shadow:0 0 0 3px var(--amber-50)">' +
      '<div style="display:flex;flex-direction:column;gap:12px">' + progress + body + '</div>' +
      '</div></div>';
  }

  function stepIntro(title, sub) {
    return '<div><div style="font-size:13px;font-weight:700;color:var(--ink-900)">' + title + '</div>' +
      '<div style="font-size:12px;color:var(--ink-600);margin-top:4px;line-height:1.5">' + sub + '</div></div>';
  }

  /* ---- Dashboard wizard ---- */
  function dashStepMetrics(w) {
    return stepIntro('Which metrics should the dashboard answer?',
      'Pick as many as fit the story, start from a suggested correlation, or describe a metric of your own. <strong>' +
      w.metricIds.length + '</strong> selected.') +
      correlationSuggestions(w.metricIds, false) +
      metricPicker(w.metricIds, 260, null) +
      customMetricInput() +
      wizardFooter(wizardBtn({
        label: 'Continue · ' + (w.metricIds.length || 0), action: 'next',
        icon: 'arrow_forward', primary: true, disabled: w.metricIds.length === 0
      }), false);
  }

  function dashStepViz(w) {
    return stepIntro('How should each metric be visualized?',
      'I picked a sensible default for each. Switch any of them.') +
      '<div style="display:flex;flex-direction:column;gap:10px;max-height:320px;overflow-y:auto;padding:2px 2px 0">' +
      w.metricIds.map(function (mid) {
        var m = CC.metricById(mid);
        if (!m) return '';
        var cur = w.viz[mid] || CC.DEFAULT_VIZ[mid] || 'bar';
        return '<div style="padding:10px;border-radius:10px;background:var(--surface-2);border:1px solid var(--ink-100)">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="width:22px;height:22px;border-radius:5px;background:var(--amber-100);color:var(--amber-700);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(m.icon, { size: 13, fill: 1 }) + '</span>' +
          '<div style="flex:1;font-size:12.5px;font-weight:600;color:var(--ink-900)">' + esc(m.label) + '</div></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
          CC.VIZ_TYPES.map(function (v) {
            var on = cur === v.id;
            return '<button data-cp-viz="' + KX.attr(mid) + '" data-cp-viz-val="' + KX.attr(v.id) + '" ' +
              'title="' + KX.attr(v.hint) + '" style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;' +
              'border-radius:999px;background:' + (on ? 'var(--ink-900)' : 'var(--surface-1)') + ';color:' +
              (on ? 'white' : 'var(--ink-700)') + ';border:1px solid ' + (on ? 'var(--ink-900)' : 'var(--ink-200)') +
              ';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">' +
              micon(v.icon, { size: 12 }) + esc(v.label) + '</button>';
          }).join('') + '</div></div>';
      }).join('') + '</div>' +
      wizardFooter(wizardBtn({ label: 'Continue', action: 'next', icon: 'arrow_forward', primary: true }), true);
  }

  // Naming is the last commitment before publish so the user shapes the
  // content first.
  function dashStepName(w) {
    return stepIntro('Name it and publish.',
      'Pick something short — it\'ll show on a tile above this card and as the page title when opened.') +
      '<div style="padding:12px;border-radius:10px;background:var(--surface-2);border:1px solid var(--ink-100)">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500);' +
      'margin-bottom:8px">Includes ' + w.metricIds.length + ' metric' + (w.metricIds.length === 1 ? '' : 's') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      w.metricIds.map(function (mid) {
        var m = CC.metricById(mid);
        var vizId = w.viz[mid] || CC.DEFAULT_VIZ[mid];
        var viz = CC.VIZ_TYPES.find(function (v) { return v.id === vizId; }) || CC.VIZ_TYPES[0];
        return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-800)">' +
          '<span style="width:20px;height:20px;border-radius:4px;background:var(--amber-100);color:var(--amber-700);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(m.icon, { size: 12, fill: 1 }) + '</span>' +
          '<span style="flex:1;font-weight:500">' + esc(m.label) + '</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:99px;' +
          'background:var(--surface-1);border:1px solid var(--ink-200);font-size:10.5px;color:var(--ink-600);font-weight:600">' +
          micon(viz.icon, { size: 11 }) + esc(viz.label) + '</span></div>';
      }).join('') + '</div></div>' +
      '<vaadin-text-field theme="outlined" id="cpDashName" label="Dashboard name" style="width:100%" ' +
      'value="' + KX.attr(w.name || '') + '" placeholder="e.g. Sta. 7 Readiness, Daily Brief, Q3 Compliance…"></vaadin-text-field>' +
      wizardFooter(wizardBtn({
        label: 'Publish dashboard', action: 'publish', icon: 'check',
        primary: true, disabled: !(w.name || '').trim()
      }), true);
  }

  /* ---- Widget wizard ---- */
  function widgetStepMetrics(w) {
    return stepIntro('What should the widget show?',
      'Pick <strong>one metric</strong> for a single chart, or <strong>two</strong> to correlate them. ' +
      'Try a suggestion below — or describe something the catalog doesn\'t cover.') +
      correlationSuggestions(w.metricIds, true) +
      metricPicker(w.metricIds, 220, WIDGET_MAX) +
      customMetricInput() +
      wizardFooter(wizardBtn({
        label: 'Continue · ' + w.metricIds.length + '/' + WIDGET_MAX, action: 'next',
        icon: 'arrow_forward', primary: true, disabled: w.metricIds.length === 0
      }), false);
  }

  function widgetStepViz(w) {
    var pair = w.metricIds.length >= 2;
    var options = pair ? WIDGET_VIZ_PAIR : WIDGET_VIZ_SINGLE;
    var metas = w.metricIds.map(function (id) { return CC.metricById(id); }).filter(Boolean);
    // Live preview with mock data so the user sees the real widget output
    // before pinning.
    var spec = pair ? CC.buildCorrelationSpec(w.metricIds, w.viz) : CC.buildSpec(w.metricIds[0], w.viz);

    return stepIntro('How should it look?',
      pair
        ? 'Correlating <strong>' + esc(metas[0].label) + '</strong> and <strong>' + esc(metas[1].label) +
          '</strong>. Pick a chart type.'
        : 'Showing <strong>' + esc(metas[0] ? metas[0].label : '') + '</strong>. Pick a chart type.') +
      '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
      options.map(function (v) {
        var on = w.viz === v.id;
        return '<button data-cp-wviz="' + KX.attr(v.id) + '" title="' + KX.attr(v.hint || '') + '" ' +
          'style="display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;background:' +
          (on ? 'var(--ink-900)' : 'var(--surface-1)') + ';color:' + (on ? 'white' : 'var(--ink-700)') +
          ';border:1px solid ' + (on ? 'var(--ink-900)' : 'var(--ink-200)') +
          ';font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit">' +
          micon(v.icon, { size: 13 }) + esc(v.label) + '</button>';
      }).join('') + '</div>' +
      '<div style="padding:12px;border-radius:10px;background:var(--surface-2);border:1px solid var(--ink-100)">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500);' +
      'margin-bottom:8px">Preview</div>' +
      '<div style="padding:10px 12px;background:var(--surface-1);border:1px solid var(--ink-100);border-radius:8px;' +
      'min-height:96px;display:flex;flex-direction:column;gap:6px">' +
      '<div style="font-size:11px;color:var(--ink-700);font-weight:600;line-height:1.3">' +
      esc(pair ? metas.map(function (m) { return m.label; }).join(' × ') : (metas[0] ? metas[0].label : '')) + '</div>' +
      '<div style="flex:1;min-width:0;display:flex;align-items:center">' +
      (spec ? KXCharts.miniViz(spec)
            : '<span style="font-size:11px;color:var(--ink-500);font-style:italic">' +
              'These two metrics don\'t share a category axis, so they can\'t be correlated. Try another pairing.</span>') +
      '</div></div></div>' +
      wizardFooter(wizardBtn({ label: 'Pin widget', action: 'publish', icon: 'check', primary: true, disabled: !spec }), true);
  }

  /* =====================================================================
     RAILS
     ===================================================================== */

  // Sits above the Agency Intelligence card. One tile per published dashboard; hidden
  // until the user has published at least one.
  function dashboardsRail() {
    var list = CC.loadDashboards();
    if (!list.length) return '';
    return '<div class="cp-rail"><div class="cp-rail-head">' +
      micon('push_pin', { size: 14, fill: 1, color: 'var(--ink-500)' }) +
      '<span class="t">My dashboards</span><span class="n">· ' + list.length + '</span></div>' +
      '<div class="cp-dashgrid">' + list.map(function (d) {
        return '<a class="cp-dash-tile" href="agency-intelligence-dashboard.html?custom=' + encodeURIComponent(d.id) +
          '" target="_blank" rel="noreferrer">' +
          '<div style="display:flex;align-items:center;gap:6px">' +
          '<span class="cp-tile-icon">' + micon('dashboard_customize', { size: 11, fill: 1 }) + '</span>' +
          '<span style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
          'flex:1;line-height:1.25">' + esc(d.name) + '</span>' +
          '<button class="cp-tile-del del" data-cp-del-dash="' + KX.attr(d.id) + '" title="Remove" ' +
          'aria-label="Remove dashboard">' + micon('close', { size: 12 }) + '</button></div>' +
          '<div style="font-size:10px;color:var(--ink-500);padding-left:24px;white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis">' + d.metrics.length + ' metric' + (d.metrics.length === 1 ? '' : 's') +
          ' · ' + esc(tilesAgo(d.createdAt)) + '</div></a>';
      }).join('') + '</div></div>';
  }

  function tilesAgo(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  // Single-metric (or paired correlation) chart tiles pinned above the
  // dashboards rail. Hidden until at least one widget exists — the user
  // bootstraps via the Agency Intelligence prompt button below.
  function widgetsRail() {
    var widgets = CC.loadWidgets();
    if (!widgets.length) return '';
    return '<div class="cp-rail"><div class="cp-rail-head">' +
      micon('widgets', { size: 14, fill: 1, color: 'var(--ink-500)' }) +
      '<span class="t">Widgets</span><span class="n">· ' + widgets.length + '</span></div>' +
      '<div class="cp-tilegrid">' + widgets.map(widgetTile).join('') +
      '<button class="cp-add-tile" data-cp-wizard="widget">' +
      '<span style="width:28px;height:28px;border-radius:7px;background:var(--surface-3);' +
      'display:inline-flex;align-items:center;justify-content:center">' + micon('add', { size: 18 }) + '</span>' +
      '<span style="font-size:11px;font-weight:600">Add widget</span></button>' +
      '</div></div>';
  }

  function widgetTile(w) {
    // Supports both the legacy single-metric (metricId) and the current
    // multi-metric (metricIds) shapes.
    var ids = w.metricIds || (w.metricId ? [w.metricId] : []);
    var metas = ids.map(function (id) { return CC.metricById(id); }).filter(Boolean);
    if (!metas.length) return '';
    var isCorrelation = metas.length >= 2;
    var spec = isCorrelation ? CC.buildCorrelationSpec(ids, w.viz) : CC.buildSpec(ids[0], w.viz);
    var label = metas.map(function (m) { return m.label; }).join(' × ');
    return '<div class="cp-widget-tile">' +
      '<div style="display:flex;align-items:center;gap:6px">' +
      '<span class="cp-tile-icon is-metric">' +
      micon(isCorrelation ? 'compare_arrows' : metas[0].icon, { size: 11, fill: 1 }) + '</span>' +
      '<span style="font-size:11px;font-weight:600;color:var(--ink-700);overflow:hidden;text-overflow:ellipsis;' +
      'white-space:nowrap;flex:1">' + esc(label) + '</span>' +
      '<button class="cp-tile-del del" data-cp-del-widget="' + KX.attr(w.id) + '" title="Remove" ' +
      'aria-label="Remove widget">' + micon('close', { size: 12 }) + '</button></div>' +
      '<div style="flex:1;display:flex;align-items:center;justify-content:center">' +
      (spec ? KXCharts.miniViz(spec) : '') + '</div></div>';
  }

  /* =====================================================================
     CARD SHELL + MOUNT
     ===================================================================== */

  function cardHtml() {
    var hasThread = state.thread.length > 0 || state.thinking || state.wizard;
    var ready = state.draft.trim() && !state.thinking && !state.wizard;

    return '<div class="cp-card">' +
      '<div class="cp-head">' +
      '<span class="cp-mark">' + micon('auto_awesome', { size: 17, fill: 1 }) + '</span>' +
      '<div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">' +
      '<div style="font-weight:700;font-size:16px;color:var(--ink-900);line-height:1.2">Agency Intelligence</div>' +
      '<div style="font-size:12.5px;font-weight:600;color:var(--ink-800);line-height:1.35">' +
      'Ask the data across your apps.</div>' +
      '<div style="font-size:11.5px;color:var(--ink-500);line-height:1.45">' +
      'Agency Intelligence pulls signals from TargetSolutions, Check It, Guardian, Scheduling, and EV+ — ' +
      'and looks for connections between them.</div></div>' +
      (hasThread
        ? '<button class="cp-action" data-cp-clear title="Start a new conversation" style="flex-shrink:0">' +
          micon('restart_alt', { size: 13 }) + 'New chat</button>'
        : '') +
      '</div>' +

      '<div class="cp-body" id="cpBody">' +
      (!hasThread
        ? emptyStateHtml()
        : state.thread.map(turnHtml).join('') +
          (state.wizard ? wizardCard() : '') +
          (state.thinking ? thinkingHtml() : '')) +
      '</div>' +

      '<div class="cp-input-wrap"><div class="cp-input">' +
      '<textarea id="cpDraft" rows="1"' + (state.wizard ? ' disabled' : '') +
      ' placeholder="' + KX.attr(state.wizard
        ? 'Wizard in progress — finish or cancel above to chat again.'
        : 'Ask anything across your apps. Try: how does PTO correlate with inspection delays?') + '"' +
      (state.wizard ? ' style="opacity:0.55;cursor:not-allowed"' : '') + '>' + esc(state.draft) + '</textarea>' +
      '<button class="cp-send' + (ready ? ' is-ready' : '') + '" data-cp-send title="Send"' +
      (ready ? '' : ' disabled') + '>' + micon('arrow_upward', { size: 18, weight: 500 }) + '</button>' +
      '</div>' +
      '<div class="cp-foot">' +
      '<span>Agency Intelligence drafts may contain inaccuracies — always verify before acting.</span>' +
      '<span><span class="kbd">↵</span> send · <span class="kbd">⇧↵</span> newline</span>' +
      '</div></div></div>';
  }

  function paint() {
    if (!slotEl || !slotEl.isConnected) return;
    slotEl.innerHTML = cardHtml();
    // Keep the transcript pinned to the newest turn.
    var body = slotEl.querySelector('#cpBody');
    if (body) body.scrollTop = body.scrollHeight;
    var ta = slotEl.querySelector('#cpDraft');
    if (ta && document.activeElement !== ta && state.draft) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }

  function mountInto(el) {
    if (!el) return;
    slotEl = el;
    paint();
  }

  /* =====================================================================
     ACTIONS
     ===================================================================== */

  function respondTo(prompt, responseKey) {
    state.thread.push({ role: 'user', text: prompt });
    state.thinking = true;
    state.draft = '';
    paint();
    // Fake a small LLM-shaped delay so the UI shows its "thinking" state.
    setTimeout(function () {
      var resp = responseKey ? RESPONSES[responseKey] : adhocResponse();
      state.thread.push(Object.assign({ role: 'assistant', prompt: prompt }, resp));
      state.thinking = false;
      paint();
    }, 900 + Math.random() * 600);
  }

  function send() {
    var v = state.draft.trim();
    if (!v || state.wizard) return;
    var hit = EXAMPLES.find(function (e) { return keywordOverlap(v, e.title) >= 2; });
    respondTo(v, hit ? hit.id : null);
  }

  function startWizard(kind) {
    state.thread.push({
      role: 'user',
      text: kind === 'widget' ? 'Create a custom widget' : 'Create a custom dashboard'
    });
    state.wizard = kind === 'widget'
      ? { kind: 'widget', step: 'metrics', metricIds: [], viz: 'bar' }
      : { kind: 'dashboard', step: 'metrics', name: '', metricIds: [], viz: {} };
    state.customOpen = false;
    paint();
  }

  function cancelWizard() {
    state.wizard = null;
    state.customOpen = false;
    state.thread.push({
      role: 'assistant',
      headline: 'Cancelled.',
      body: 'No changes were saved. You can start over any time.'
    });
    paint();
  }

  function publishWizard() {
    var w = state.wizard;
    if (!w) return;

    if (w.kind === 'widget') {
      var wid = 'w-' + Date.now().toString(36);
      CC.addWidget({ id: wid, metricIds: w.metricIds.slice(), viz: w.viz, createdAt: Date.now() });
      var labels = w.metricIds.map(function (id) {
        var m = CC.metricById(id); return m ? m.label : null;
      }).filter(Boolean);
      state.wizard = null;
      state.thread.push({ role: 'assistant', isWidgetReceipt: true, widgetId: wid, labels: labels, viz: w.viz });
      KX.pushToast({ title: 'Widget pinned', body: labels.join(' × '), icon: 'widgets', tone: 'success' });
      window.KXHub.render();      // the rail above needs to pick up the new tile
      return;
    }

    var id = 'dash-' + Date.now().toString(36);
    var dash = {
      id: id,
      name: (w.name || '').trim() || 'Untitled dashboard',
      createdAt: Date.now(),
      metrics: w.metricIds.map(function (mid) {
        return { id: mid, viz: w.viz[mid] || CC.DEFAULT_VIZ[mid] || 'bar' };
      })
    };
    CC.publishDashboard(dash);
    state.wizard = null;
    state.thread.push({
      role: 'assistant', isPublishedReceipt: true,
      dashboardId: id, name: dash.name, metricCount: dash.metrics.length
    });
    KX.pushToast({
      title: 'Dashboard published',
      body: '"' + dash.name + '" is pinned above. ' + dash.metrics.length +
        ' metric' + (dash.metrics.length === 1 ? '' : 's') + '.',
      icon: 'dashboard_customize', tone: 'success'
    });
    window.KXHub.render();
  }

  function wizardNext() {
    var w = state.wizard;
    if (w.kind === 'widget') {
      if (w.step === 'metrics') {
        // Reset viz to a sensible default for the metric count.
        w.viz = w.metricIds.length === 2 ? 'pair' : (CC.DEFAULT_VIZ[w.metricIds[0]] || 'kpi');
        w.step = 'viz';
      }
    } else {
      if (w.step === 'metrics') {
        // Pre-fill viz defaults so the next step starts populated.
        w.metricIds.forEach(function (id) {
          if (!w.viz[id]) w.viz[id] = CC.DEFAULT_VIZ[id] || 'bar';
        });
        w.step = 'viz';
      } else if (w.step === 'viz') w.step = 'name';
    }
    paint();
  }

  function wizardBack() {
    var w = state.wizard;
    if (w.step === 'name') w.step = 'viz';
    else if (w.step === 'viz') w.step = 'metrics';
    paint();
  }

  function toggleMetric(id) {
    var w = state.wizard;
    var i = w.metricIds.indexOf(id);
    if (i !== -1) { w.metricIds.splice(i, 1); paint(); return; }
    if (w.kind === 'widget' && w.metricIds.length >= WIDGET_MAX) return;   // cap
    w.metricIds.push(id);
    paint();
  }

  function applySuggestion(sgId) {
    var sg = (CC.CORRELATION_SUGGESTIONS || []).find(function (x) { return x.id === sgId; });
    if (!sg) return;
    var w = state.wizard;
    if (w.kind === 'widget') {
      // Widget suggestions carry exactly two metrics → replace the selection.
      w.metricIds = sg.metricIds.slice(0, WIDGET_MAX);
    } else {
      sg.metricIds.forEach(function (id) { if (w.metricIds.indexOf(id) === -1) w.metricIds.push(id); });
    }
    paint();
  }

  function addCustomMetric(label, description) {
    var meta = CC.registerCustomMetric({ label: label, description: description });
    if (!meta) return;
    var w = state.wizard;
    if (w.metricIds.indexOf(meta.id) === -1) {
      if (w.kind === 'widget' && w.metricIds.length >= WIDGET_MAX) {
        // Bump the oldest selection so the new custom metric lands.
        w.metricIds = [w.metricIds[w.metricIds.length - 1], meta.id];
      } else {
        w.metricIds.push(meta.id);
      }
    }
    state.customOpen = false;
    paint();
  }

  /* =====================================================================
     WIRING — delegated once on document, guarded so it never stacks
     ===================================================================== */
  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;

    document.addEventListener('click', function (e) {
      /* -- rails -- */
      var dw = e.target.closest('[data-cp-del-widget]');
      if (dw) {
        e.preventDefault(); e.stopPropagation();
        var wid = dw.getAttribute('data-cp-del-widget');
        var w = CC.loadWidgets().find(function (x) { return x.id === wid; });
        var ids = w ? (w.metricIds || [w.metricId]) : [];
        var label = ids.map(function (id) { var m = CC.metricById(id); return m ? m.label : ''; }).join(' × ');
        if (window.confirm('Remove "' + label + '" widget?')) {
          CC.deleteWidget(wid);
          window.KXHub.render();
        }
        return;
      }
      var dd = e.target.closest('[data-cp-del-dash]');
      if (dd) {
        e.preventDefault(); e.stopPropagation();
        var did = dd.getAttribute('data-cp-del-dash');
        var d = CC.loadDashboards().find(function (x) { return x.id === did; });
        if (d && window.confirm('Remove "' + d.name + '"?')) {
          CC.deleteDashboard(did);
          window.KXHub.render();
        }
        return;
      }

      /* -- chat -- */
      var ex = e.target.closest('[data-cp-example]');
      if (ex) {
        var id = ex.getAttribute('data-cp-example');
        var meta = EXAMPLES.find(function (x) { return x.id === id; });
        if (meta) respondTo(meta.title, meta.id);
        return;
      }
      if (e.target.closest('[data-cp-send]')) { send(); return; }
      if (e.target.closest('[data-cp-clear]')) {
        state.thread = []; state.draft = ''; state.wizard = null; state.customOpen = false;
        paint();
        return;
      }
      var csv = e.target.closest('[data-cp-action="csv"]');
      if (csv) {
        var msg = state.thread[+csv.getAttribute('data-cp-arg')];
        if (msg && msg.csv) KXCharts.downloadCSV(msg.prompt || 'agency-intel', msg.csv);
        return;
      }

      /* -- wizard entry -- */
      var start = e.target.closest('[data-cp-wizard]');
      if (start) { startWizard(start.getAttribute('data-cp-wizard')); return; }

      /* -- wizard controls -- */
      var wiz = e.target.closest('[data-cp-wiz]');
      if (wiz) {
        if (wiz.hasAttribute('disabled')) return;
        var act = wiz.getAttribute('data-cp-wiz');
        if (act === 'cancel') cancelWizard();
        else if (act === 'next') wizardNext();
        else if (act === 'back') wizardBack();
        else if (act === 'publish') publishWizard();
        return;
      }
      var mtc = e.target.closest('[data-cp-metric]');
      if (mtc) { if (!mtc.hasAttribute('disabled')) toggleMetric(mtc.getAttribute('data-cp-metric')); return; }
      var sug = e.target.closest('[data-cp-suggest]');
      if (sug) { applySuggestion(sug.getAttribute('data-cp-suggest')); return; }
      var vz = e.target.closest('[data-cp-viz]');
      if (vz) {
        state.wizard.viz[vz.getAttribute('data-cp-viz')] = vz.getAttribute('data-cp-viz-val');
        paint();
        return;
      }
      var wvz = e.target.closest('[data-cp-wviz]');
      if (wvz) { state.wizard.viz = wvz.getAttribute('data-cp-wviz'); paint(); return; }

      /* -- custom metric input -- */
      if (e.target.closest('[data-cp-custom-open]')) { state.customOpen = true; paint(); return; }
      if (e.target.closest('[data-cp-custom-cancel]')) { state.customOpen = false; paint(); return; }
      if (e.target.closest('[data-cp-custom-add]')) {
        var labelEl = document.getElementById('cpCustomLabel');
        var descEl = document.getElementById('cpCustomDesc');
        var lbl = (labelEl && labelEl.value || '').trim();
        if (lbl) addCustomMetric(lbl, (descEl && descEl.value || '').trim());
        return;
      }
    });

    // Draft input: keep state in sync without repainting on every keystroke
    // (a repaint would drop the caret).
    document.addEventListener('input', function (e) {
      if (e.target.id !== 'cpDraft') return;
      state.draft = e.target.value;
      var btn = document.querySelector('[data-cp-send]');
      if (btn) {
        var ready = state.draft.trim() && !state.thinking && !state.wizard;
        btn.classList.toggle('is-ready', !!ready);
        if (ready) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', '');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.target.id === 'cpDraft' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
        return;
      }
      // Enter in the dashboard-name field publishes.
      if (e.target.id === 'cpDashName' && e.key === 'Enter') {
        if (state.wizard && (state.wizard.name || '').trim()) publishWizard();
      }
    });

    // The dashboard-name field drives the publish button's disabled state.
    document.addEventListener('value-changed', function (e) {
      if (e.target.id !== 'cpDashName' || !state.wizard) return;
      state.wizard.name = e.detail.value || '';
      var pub = document.querySelector('[data-cp-wiz="publish"]');
      if (pub) {
        if (state.wizard.name.trim()) pub.removeAttribute('disabled');
        else pub.setAttribute('disabled', '');
      }
    });

    // "+ Add widget" in the widgets rail routes through the same Agency Intelligence flow
    // as the prompt button.
    window.addEventListener('kx-start-widget-wizard', function () { startWizard('widget'); });
  }

  wire();

  window.KXAgencyIntel = {
    mountInto: mountInto,
    widgetsRail: widgetsRail,
    dashboardsRail: dashboardsRail
  };
})();
