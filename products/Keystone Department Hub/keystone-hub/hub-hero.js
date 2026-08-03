/* global window, document, KEYSTONE, KX, KXCharts */
/* ========================================================================
   hub-hero.js — the Hub's role-specific hero surfaces (phase 2).
   ------------------------------------------------------------------------
   All of this sits behind the "Future functionality" flag; v1 ships the
   greeting header and the task table only.

     · coverageHero    (Battalion Chief) — Battalion Pulse meter, per-area
                        readiness facets with sparklines, and the right-hand
                        stack: widgets rail → dashboards rail → Agency Intelligence card
     · complianceHero  (Training Officer) — cohort progress, credential
                        expiry bars, action/monitor split
     · publishedDashboard — a dashboard as an END USER consumes it: the output
                        of the Agency Intelligence builder dropped onto someone's home
                        hero. No builder chrome, just the widgets.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var esc = KX.esc, micon = KX.micon;

  /* =====================================================================
     BATTALION PULSE
     ---------------------------------------------------------------------
     Signed score in [-100, +100]:
       < 0  = items demanding action (left zone, red)
       ~ 0  = "good enough, no panic" (center)
       > 0  = all systems green (right, teal)
     Per-task contribution is weighted by status and priority band so a single
     P0 overdue moves the meter more than a P3 due-soon.
     ===================================================================== */

  var PULSE_PENALTY = {
    past_sla: { P0: -9,   P1: -7,   P2: -5,   P3: -3 },
    overdue:  { P0: -8,   P1: -6,   P2: -4,   P3: -2.5 },
    at_risk:  { P0: -4.5, P1: -3,   P2: -2,   P3: -1 },
    due_soon: { P0: -1.2, P1: -0.8, P2: -0.5, P3: -0.3 }
  };
  var PULSE_CREDIT = { on_track: 0.9, within_sla: 0.85 };

  function computePulse(tasks) {
    var raw = tasks.reduce(function (acc, t) {
      var pen = PULSE_PENALTY[t.status];
      if (pen) return acc + (pen[t.priorityBand] || pen.P2);
      if (PULSE_CREDIT[t.status]) return acc + PULSE_CREDIT[t.status];
      return acc;
    }, 0);
    var demand = tasks.filter(function (t) {
      return ['overdue', 'past_sla', 'at_risk'].indexOf(t.status) !== -1;
    }).length;

    // Damp the raw score and lift by a baseline so a department running with
    // some open items lands in "managing well" territory, not at the critical
    // end. A truly bad day still pulls the needle left.
    var score = Math.max(-100, Math.min(100, Math.round(raw * 0.28 + 35)));
    // Synthesize a "yesterday" score so the delta arrow has something to say.
    var yesterday = Math.max(-100, Math.min(100, score - (score < -10 ? 3 : score > 10 ? -1 : -2)));

    var label, blurb, glow;
    if (score <= -30)     { label = 'CRITICAL';     blurb = 'Multiple criticalities. Act on red items now.';  glow = 'rgba(232,90,79,0.32)'; }
    else if (score <= -10){ label = 'PRESSURE ON';  blurb = 'Several items pressing. Work the action list.';  glow = 'rgba(245,158,11,0.28)'; }
    else if (score < 10)  { label = 'STEADY';       blurb = 'Good enough. No need to panic — keep cadence.';  glow = 'rgba(245,158,11,0.18)'; }
    else if (score < 30)  { label = 'LIGHT LOAD';   blurb = 'Routine follow-ups only. Nothing urgent.';       glow = 'rgba(127,192,179,0.24)'; }
    else                  { label = 'ALL CLEAR';    blurb = 'All systems green across the battalion.';        glow = 'rgba(127,192,179,0.32)'; }

    return { score: score, yesterday: yesterday, delta: score - yesterday, demand: demand,
             label: label, blurb: blurb, glow: glow };
  }

  function pulseMeter(pulse) {
    // Map score [-100, +100] → [0%, 100%] along the bar.
    var pos = (pulse.score + 100) / 2;
    var yPos = (pulse.yesterday + 100) / 2;
    var accent = pulse.score <= -30 ? 'var(--coral-300)'
      : pulse.score <= -10 ? 'var(--amber-300)'
      : pulse.score < 10 ? '#c3ccd6'
      : 'var(--teal-200)';
    var up = pulse.delta > 0;
    var deltaColor = pulse.delta === 0 ? 'rgba(255,255,255,0.55)' : up ? 'var(--teal-200)' : 'var(--coral-300)';

    return '<div style="margin-top:14px">' +
      '<div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:4px">' +
      '<div class="kx-pulse-verdict" style="color:' + accent + '">' + esc(pulse.label) + '</div>' +
      '<div style="margin-left:auto;text-align:right;font-family:var(--font-numeric);line-height:1">' +
      '<div class="kx-pulse-demand-lbl">Demanding action</div>' +
      '<div class="kx-pulse-demand-n">' + pulse.demand + '</div></div></div>' +
      '<div class="kx-pulse-blurb">' + esc(pulse.blurb) + '</div>' +

      '<div class="kx-pulse-bar">' +
      '<div class="kx-pulse-track"></div>' +
      '<div class="kx-pulse-center"></div>' +
      '<div class="kx-pulse-ghost" style="left:calc(' + yPos + '% - 1px)" title="Yesterday"></div>' +
      '<div class="kx-pulse-needle" style="left:calc(' + pos + '% - 10px)">' +
      '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;' +
      'border-top:7px solid ' + accent + ';filter:drop-shadow(0 1px 1px rgba(0,0,0,0.4))"></div>' +
      '<div style="width:4px;height:18px;margin-top:-1px;background:' + accent + ';border-radius:2px;' +
      'box-shadow:0 0 8px ' + accent + '"></div>' +
      '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;' +
      'border-bottom:7px solid ' + accent + ';filter:drop-shadow(0 -1px 1px rgba(0,0,0,0.4))"></div>' +
      '</div></div>' +

      '<div class="kx-pulse-zones"><span style="text-align:left">← Act now</span>' +
      '<span style="text-align:center">Steady</span><span style="text-align:right">Clear →</span></div>' +

      '<div class="kx-pulse-delta"><span>vs. yesterday</span>' +
      '<span style="color:' + deltaColor + ';font-weight:700;letter-spacing:0.3px">' +
      (pulse.delta === 0 ? '— unchanged'
        : (up ? '↑' : '↓') + ' ' + Math.abs(pulse.delta) + ' · ' + (up ? 'easing' : 'tightening')) +
      '</span></div></div>';
  }

  /* =====================================================================
     READINESS FACETS
     ---------------------------------------------------------------------
     Each facet plots the COUNT of items demanding action over time. Today's
     count is the headline number; the up/down chip shows the daily change
     (up = more pressure, bad).
     ===================================================================== */

  var FACET_DEFS = [
    { key: 'staffing',    label: 'Staffing',    color: '#fda4af', savedView: 'sv-cov',
      types: ['open_shift', 'shift_confirm', 'pto_request'], blurb: 'Open shifts, confirmations, PTO coverage' },
    { key: 'credentials', label: 'Credentials', color: '#7dd3fc', savedView: 'sv-cred',
      types: ['credential'], blurb: 'Certifications & endorsements nearing renewal' },
    { key: 'training',    label: 'Training',    color: '#fcd34d', savedView: 'sv-cohort',
      types: ['course', 'evaluation'], blurb: 'Required courses, evals, and refreshers' },
    { key: 'equipment',   label: 'Equipment',   color: '#86efac', savedView: 'sv-rdy',
      types: ['vehicle_inspect', 'equip_inspect', 'open_ticket'], blurb: 'Apparatus checks, gear inspections, work orders' },
    { key: 'inventory',   label: 'Inventory',   color: '#c4b5fd', savedView: null,
      types: ['ppe_inspect'], blurb: 'PPE pools, consumable stock, hydro cycles' }
  ];

  // Synthesize a 30-day count history ending at `today`. Walks a noisy random
  // path toward today's value so the sparkline has shape without drifting too
  // far. The seed keeps each facet's series stable across renders.
  function buildCountHistory(today, seed) {
    var out = [];
    var v = Math.max(0, today + (seed % 4) - 1);
    var r = seed * 9301 + 49297;
    for (var i = 0; i < 30; i++) {
      r = (r * 1103515245 + 12345) & 0x7fffffff;
      var noise = ((r % 100) / 100 - 0.5) * 1.6;
      var drift = (today - v) * 0.08;
      v = Math.max(0, v + drift + noise);
      out.push(Math.max(0, Math.round(v)));
    }
    // Make yesterday distinct from today so the delta chip has something to say.
    if (out[out.length - 1] === today) {
      out[out.length - 2] = Math.max(0, today + (seed % 2 === 0 ? -1 : 1));
    }
    out[out.length - 1] = today;
    return out;
  }

  var facetCache = null;
  function facets(tasks) {
    facetCache = FACET_DEFS.map(function (f) {
      var slice = tasks.filter(function (t) { return f.types.indexOf(t.type) !== -1; });
      var offenders = slice
        .filter(function (t) { return ['overdue', 'past_sla', 'at_risk', 'due_soon'].indexOf(t.status) !== -1; })
        .sort(function (a, b) { return (b.priorityScore || 0) - (a.priorityScore || 0); });
      var critical = offenders.filter(function (t) {
        return (t.status === 'overdue' || t.status === 'past_sla') && (t.priorityBand === 'P0' || t.priorityBand === 'P1');
      }).length;
      var count = offenders.length;
      var seed = f.key.charCodeAt(0) + f.key.charCodeAt(1);
      var series = buildCountHistory(count, seed);
      return Object.assign({}, f, {
        count: count, critical: critical, series: series,
        dailyDelta: count - series[series.length - 2], offenders: offenders
      });
    });
    return facetCache;
  }

  function microSpark(data, color, height) {
    height = height || 22;
    var w = 100;
    var pts = KX.sparkPoints(data, w, height, 2);
    var arr = pts.split(' ');
    var last = arr[arr.length - 1].split(',');
    var gid = 'mspk-' + color.replace(/[^a-z0-9]/gi, '') + '-' + height;
    return '<svg width="100%" height="' + height + '" viewBox="0 0 ' + w + ' ' + height + '" ' +
      'preserveAspectRatio="none" style="display:block">' +
      '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.45"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="0,' + height + ' ' + pts + ' ' + w + ',' + height + '" fill="url(#' + gid + ')"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2" fill="' + color + '"/></svg>';
  }

  var openFacet = null;

  function facetRows(list) {
    return '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;' +
      'color:rgba(255,255,255,0.55);margin-bottom:10px">' +
      '<span>Open items by area · 30-day trend</span>' +
      '<span style="color:rgba(255,255,255,0.4);font-size:10px">tap to drill</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px">' +
      list.map(function (f) {
        // For a count series, UP is bad (more pressure) and DOWN is good.
        var flat = f.dailyDelta === 0, worse = f.dailyDelta > 0;
        var dColor = flat ? 'rgba(255,255,255,0.45)' : worse ? 'var(--coral-300)' : 'var(--teal-200)';
        var nColor = f.critical > 0 ? 'var(--coral-300)' : f.count === 0 ? 'var(--teal-200)' : 'white';
        return '<button class="kx-facet-row" data-facet="' + KX.attr(f.key) + '">' +
          '<span class="nm"><span class="sw" style="background:' + f.color + '"></span>' + esc(f.label) + '</span>' +
          microSpark(f.series, f.color, 22) +
          '<span class="n" style="color:' + nColor + '" title="' + f.count + ' item' + (f.count === 1 ? '' : 's') +
          ' open' + (f.critical ? ' — ' + f.critical + ' highly critical' : '') + '">' + f.count + '</span>' +
          '<span class="d" style="color:' + dColor + '">' +
          (flat ? '—' : (worse ? '↑' : '↓') + Math.abs(f.dailyDelta)) + '</span></button>';
      }).join('') + '</div>';
  }

  function facetDetail(f) {
    var dColor = f.dailyDelta === 0 ? 'rgba(255,255,255,0.55)' : f.dailyDelta > 0 ? 'var(--coral-300)' : 'var(--teal-200)';
    return '<div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
      '<button class="kx-facet-back" data-facet-close aria-label="Back">' + micon('arrow_back', { size: 16 }) + '</button>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="width:8px;height:8px;border-radius:2px;background:' + f.color + '"></span>' +
      '<span style="font-size:12px;font-weight:700;color:white;letter-spacing:0.3px">' + esc(f.label) + '</span></div>' +
      '<span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;' +
      'letter-spacing:0.6px;font-weight:700">30 days</span></div>' +

      '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">' +
      '<span style="font-family:var(--font-numeric);font-weight:700;font-size:30px;color:white;line-height:1">' + f.count + '</span>' +
      '<span style="font-size:12px;color:rgba(255,255,255,0.6)">open item' + (f.count === 1 ? '' : 's') +
      (f.critical > 0 ? ' · <span style="color:var(--coral-300);font-weight:700">' + f.critical + ' highly critical</span>' : '') + '</span>' +
      '<span style="margin-left:auto;font-size:11px;font-weight:700;color:' + dColor + '">' +
      (f.dailyDelta === 0 ? '— same as yesterday'
        : (f.dailyDelta > 0 ? '↑' : '↓') + ' ' + Math.abs(f.dailyDelta) + ' vs yesterday') + '</span></div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:10px">' + esc(f.blurb) + '</div>' +
      '<div style="height:44px;margin-bottom:14px">' + microSpark(f.series, f.color, 44) + '</div>' +

      '<div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;' +
      'font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between">' +
      '<span>Action items</span><span style="color:rgba(255,255,255,0.4)">' + f.offenders.length + ' open</span></div>' +
      (f.offenders.length === 0
        ? '<div style="font-size:11px;color:rgba(255,255,255,0.55);padding:10px 0 14px">Nothing outstanding. Nice.</div>'
        : '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">' +
          f.offenders.slice(0, 3).map(function (t) {
            return '<button class="kx-facet-item" data-facet-drill="' + KX.attr(f.key) + '">' +
              '<span style="width:6px;height:6px;border-radius:50%;background:' +
              (t.status === 'overdue' || t.status === 'past_sla' ? 'var(--coral-400)' : 'var(--amber-400)') + '"></span>' +
              '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,0.92)">' +
              esc(t.title) + '</span>' +
              '<span style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.6px;' +
              'font-weight:700">' + esc(t.status.replace('_', ' ')) + '</span></button>';
          }).join('') + '</div>') +
      '<button class="kx-facet-cta" data-facet-all="' + KX.attr(f.key) + '">' +
      'View all ' + esc(f.label.toLowerCase()) + ' items' + micon('arrow_forward', { size: 14 }) + '</button>' +
      '</div>';
  }

  /* =====================================================================
     COVERAGE HERO (Battalion Chief) — RETIRED
     ---------------------------------------------------------------------
     No longer rendered. At ~500px+ it put the top of the task list below the
     fold, so CHIEF_DASH (a published dashboard, ~250px) replaces it; the rail's
     Agency Intelligence links moved into that dashboard's header.

     Kept here, unreferenced, because it is cheap to restore during review. The
     machinery only this function uses: computePulse, pulseMeter, facets,
     facetRows, facetDetail, microSpark, buildCountHistory, FACET_DEFS, and the
     [data-facet*] handlers in wire().
     ===================================================================== */
  function coverageHero(tasks) {
    var pulse = computePulse(tasks);
    var list = facets(tasks);
    var open = openFacet ? list.find(function (f) { return f.key === openFacet; }) : null;

    return '<div class="kx-coverage-hero">' +
      '<div class="kx-pulse-panel">' +
      '<div class="kx-pulse-glow" style="' + (pulse.score < 0 ? 'left' : 'right') + ':-40px;' +
      'background:radial-gradient(circle, ' + pulse.glow + ' 0%, transparent 70%)"></div>' +
      '<div style="position:relative">' +
      '<div class="kx-pulse-eyebrow">Battalion Pulse · Now</div>' +
      pulseMeter(pulse) +
      '<div class="kx-facets">' + (open ? facetDetail(open) : facetRows(list)) + '</div>' +
      '</div></div>' +

      // Right column: widget tiles, then published dashboards, then Agency Intelligence.
      '<div style="display:flex;flex-direction:column;gap:12px;min-width:0">' +
      (window.KXAgencyIntel ? window.KXAgencyIntel.widgetsRail() + window.KXAgencyIntel.dashboardsRail() : '') +
      '<div id="kxAgencyIntelSlot"></div>' +
      '</div></div>';
  }

  /* =====================================================================
     COMPLIANCE HERO (Training Officer)
     ===================================================================== */
  function complianceHero(tasks) {
    var courses = tasks.filter(function (t) { return t.type === 'course'; });
    var credentials = tasks.filter(function (t) { return t.type === 'credential'; });
    var days = function (t) { return (t.dueAt - K.NOW) / 86400000; };
    var expiring30 = credentials.filter(function (t) { return t.dueAt && days(t) <= 30 && days(t) >= 0; }).length;
    var expiring60 = credentials.filter(function (t) { return t.dueAt && days(t) <= 60 && days(t) >= 0; }).length;
    var expiring90 = credentials.length;
    var mandatoryDone = 19, mandatoryTotal = 47;      // from the t13 cohort fixture
    var overdueMandatory = courses.filter(function (t) {
      return t.status === 'overdue' && t.meta && t.meta.mandatory;
    }).length;
    var pct = Math.round(mandatoryDone / mandatoryTotal * 100);

    var stat = function (n, label, tone) {
      var c = tone === 'good' ? 'var(--teal-200)' : tone === 'warn' ? 'var(--amber-200)' : 'white';
      return '<div><div style="font-family:var(--font-numeric);font-weight:700;font-size:22px;color:' + c +
        ';line-height:1">' + n + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px">' + esc(label) + '</div></div>';
    };

    var expiryBar = function (d, count, max, tone) {
      var barPct = Math.max(8, count / max * 100);
      var color = tone === 'bad' ? 'var(--coral-400)' : tone === 'warn' ? 'var(--amber-400)' : 'var(--teal-400)';
      var bg = tone === 'bad' ? 'var(--coral-50)' : tone === 'warn' ? 'var(--amber-50)' : 'var(--teal-50)';
      return '<div class="kx-expiry-row"><div class="d">' + d + 'd</div>' +
        '<div class="kx-expiry-bar" style="background:' + bg + '">' +
        '<div class="fill" style="width:' + barPct + '%;background:' + color + '"></div>' +
        '<div class="cap">' + count + ' expiring</div></div></div>';
    };

    var actionCard = function (o) {
      var isAction = o.tone === 'action';
      return '<div class="kx-action-card" style="background:' + (isAction ? 'var(--coral-50)' : 'var(--surface-3)') +
        ';border:1px solid ' + (isAction ? 'var(--coral-100)' : 'var(--ink-100)') + '">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="width:26px;height:26px;border-radius:8px;background:' +
        (isAction ? 'var(--coral-400)' : 'var(--ink-700)') + ';color:white;display:inline-flex;' +
        'align-items:center;justify-content:center">' + micon(o.icon, { size: 16, fill: 1 }) + '</span>' +
        '<span style="font-size:12px;font-weight:700;color:var(--ink-800);letter-spacing:0.3px;text-transform:uppercase">' +
        esc(o.headline) + '</span></div>' +
        '<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px">' +
        o.rows.map(function (r) {
          return '<div style="display:flex;justify-content:space-between;font-size:13px">' +
            '<span style="color:var(--ink-700)">' + esc(r.label) + '</span>' +
            '<span style="font-weight:700;font-family:var(--font-mono);color:' +
            (isAction ? 'var(--coral-500)' : 'var(--ink-800)') + '">' + r.n + '</span></div>';
        }).join('') + '</div>' +
        '<button data-jump-view="' + KX.attr(o.view) + '" style="margin-top:8px;background:transparent;border:none;' +
        'font-size:12px;color:' + (isAction ? 'var(--coral-500)' : 'var(--ink-700)') +
        ';font-weight:700;cursor:pointer;padding:0;font-family:inherit">' + esc(o.cta) + ' →</button></div>';
    };

    return '<div class="kx-compliance-grid">' +
      '<div class="kx-cohort-card">' +
      '<div style="position:absolute;bottom:-60px;left:-40px;width:220px;height:220px;border-radius:50%;' +
      'background:radial-gradient(circle, rgba(127,192,179,0.25) 0%, transparent 70%);pointer-events:none"></div>' +
      '<div style="position:relative">' +
      '<div style="font-size:11px;color:var(--teal-100);letter-spacing:1.5px;text-transform:uppercase;font-weight:700">' +
      'Q2 Mandatory Cohort</div>' +
      '<div style="font-size:18px;font-weight:600;margin-top:6px">OSHA Refresher · 47 personnel</div>' +
      '<div style="margin-top:18px;display:flex;align-items:baseline;gap:6px;font-family:var(--font-numeric)">' +
      '<span style="font-size:56px;font-weight:700;line-height:1;letter-spacing:-2px">' + pct + '</span>' +
      '<span style="font-size:24px;color:var(--teal-100)">%</span>' +
      '<span style="font-size:13px;font-family:var(--font-sans);color:rgba(255,255,255,0.65);margin-left:8px">' +
      'complete · ' + mandatoryDone + ' of ' + mandatoryTotal + '</span></div>' +
      '<div style="margin-top:14px;height:8px;border-radius:99px;background:rgba(255,255,255,0.12);overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg, var(--amber-300), var(--amber-200));' +
      'box-shadow:0 0 12px rgba(255,185,56,0.5)"></div></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.6)">' +
      '<span>Started Apr 14</span><span style="color:var(--amber-200);font-weight:600">Due May 13 · 6 days</span></div>' +
      '<div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.12);display:flex;gap:18px">' +
      stat(overdueMandatory, 'Overdue mandatory', 'warn') + stat(28, 'Not started') + stat(19, 'Completed', 'good') +
      '</div></div></div>' +

      '<div class="kx-panel">' +
      '<div style="font-size:11px;color:var(--ink-500);letter-spacing:1.5px;text-transform:uppercase;font-weight:700">' +
      'Credentials expiring</div>' +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">' +
      expiryBar(30, expiring30, expiring90 || 1, 'bad') +
      expiryBar(60, expiring60, expiring90 || 1, 'warn') +
      expiryBar(90, expiring90, expiring90 || 1, 'good') + '</div>' +
      '<vaadin-button theme="secondary small" data-jump-view="sv-cred" style="margin-top:16px">' +
      'See all credentials' + micon('arrow_forward', { size: 14 }) + '</vaadin-button></div>' +

      '<div style="display:flex;flex-direction:column;gap:12px">' +
      actionCard({ tone: 'action', icon: 'priority_high', headline: 'Requires action', cta: 'Open all', view: 'sv-mand',
        rows: [{ label: 'Mandatory overdue', n: overdueMandatory }, { label: 'Cert expiring < 30d', n: expiring30 }] }) +
      actionCard({ tone: 'monitor', icon: 'visibility', headline: 'Monitor', cta: 'View', view: 'sv-cohort',
        rows: [{ label: 'In progress cohorts', n: 1 },
               { label: 'Evaluations open', n: tasks.filter(function (t) { return t.type === 'evaluation'; }).length }] }) +
      '</div></div>';
  }

  /* =====================================================================
     PUBLISHED DASHBOARD (Lieutenant / Firefighter heroes)
     ===================================================================== */

  var PD_RANGES = [
    { value: 'last_7', label: 'Last 7 days' },
    { value: 'last_30', label: 'Last 30 days' },
    { value: 'last_90', label: 'Last 90 days' },
    { value: 'qtd', label: 'Quarter to date' },
    { value: 'ytd', label: 'Year to date' },
    { value: 'last_12mo', label: 'Last 12 months' },
    { value: 'next_14', label: 'Next 14 days' },
    { value: 'next_30', label: 'Next 30 days' }
  ];
  function rangeLabel(v) {
    var r = PD_RANGES.find(function (x) { return x.value === v; });
    return r ? r.label : 'Last 30 days';
  }

  // Abbreviated forms for narrow (w:4) widgets, where the full label would eat
  // the space the widget title needs. The menu still spells every option out.
  var PD_RANGES_SHORT = {
    last_7: 'Last 7d', last_30: 'Last 30d', last_90: 'Last 90d', qtd: 'QTD',
    ytd: 'YTD', last_12mo: 'Last 12mo', next_14: 'Next 14d', next_30: 'Next 30d'
  };
  function rangeLabelShort(v) { return PD_RANGES_SHORT[v] || rangeLabel(v); }

  // The Lieutenant gets a fuller, crew-scoped dashboard a Chief would publish.
  var LT_DASH = {
    name: 'B-Shift Readiness', scope: 'Station 4 · B-Shift',
    publisher: 'Chief Reyes · Battalion 1', ownerShort: 'Chief Reyes',
    widgets: [
      { id: 'lt1', metricId: 'training_completion',    viz: 'kpi',   w: 4,  range: 'qtd',       source: ['ts'],    title: 'Crew training complete' },
      { id: 'lt2', metricId: 'credential_expirations', viz: 'kpi',   w: 4,  range: 'next_30',   source: ['ts'],    title: 'Credentials expiring' },
      { id: 'lt3', metricId: 'open_shifts',            viz: 'kpi',   w: 4,  range: 'next_14',   source: ['sched'], title: 'Open shifts · 14d' },
      { id: 'lt4', metricId: 'ot_trend',               viz: 'line',  w: 7,  range: 'last_12mo', source: ['sched'], title: 'Overtime hours', color: 'var(--amber-500)' },
      { id: 'lt5', metricId: 'overdue_inspections',    viz: 'bar',   w: 5,  range: 'last_90',   source: ['ci'],    title: 'Overdue inspections by station' },
      { id: 'lt6', metricId: 'open_shifts',            viz: 'table', w: 12, range: 'next_14',   source: ['sched'], title: 'Open shifts · next 14 days' }
    ]
  };

  // The Chief's own dashboard, built in Agency Intelligence and dropped on their home
  // hero. One row of three KPIs — deliberately one metric per source app, so the
  // "one surface over five products" premise reads at a glance. Each maps to a task
  // type already in the table below, so clicking through stays coherent.
  //
  // Height is the governing constraint: three w:4 KPI widgets in a single row keep
  // the card at ~250px, which is what keeps the top of the task list above the fold.
  // Trend comes free from pdKpi's built-in 26px sparkline — no second row of charts.
  var CHIEF_DASH = {
    name: 'B-1 Coverage Snapshot', scope: 'Battalion 1 · all stations',
    owned: true, ownerShort: 'you',
    widgets: [
      { id: 'ch1', metricId: 'open_shifts',            viz: 'kpi', w: 4, range: 'next_14', source: ['sched'], title: 'Open shifts' },
      { id: 'ch2', metricId: 'credential_expirations', viz: 'kpi', w: 4, range: 'next_30', source: ['ts'],    title: 'Credentials expiring' },
      { id: 'ch3', metricId: 'overdue_inspections',    viz: 'kpi', w: 4, range: 'last_30', source: ['ci'],    title: 'Overdue inspections' }
    ]
  };

  // The Firefighter's dashboard — the safe-by-default proposal. Ships as a Keystone
  // starter template that the agency's training staff publishes.
  //
  // Every widget clears three bars: it is the firefighter's OWN record, it is data
  // they can already see in the source product today, and they can personally act on
  // it. Nothing here tells them anything new about anybody else, which is what keeps
  // this pushable to every customer without complaints coming back.
  //
  // Deliberately NOT here, and why:
  //   · no peer comparison / ranking / leaderboard — reads as surveillance and lands
  //     as a labor-relations problem, not a UX one
  //   · no station / battalion / department rollups — any aggregate is a window into
  //     colleagues' compliance status
  //   · no staffing, overtime, sick-leave or PTO figures — labor-sensitive, and not a
  //     line firefighter's to see in aggregate
  //   · no Guardian Tracking, evaluation or disciplinary signal — the most sensitive
  //     record class in the suite; never on a home dashboard, even one's own
  //   · no response-time or incident metrics — invites misreading, not personally actionable
  //   · nothing framed as a score — all three are completion-or-countdown against a
  //     stated requirement, never a grade
  var FF_DASH = {
    name: 'My Readiness', scope: 'Riley Brennan · FF / EMT',
    publisher: 'Training Officer Whitfield', ownerShort: 'Training',
    template: 'Keystone starter template',
    widgets: [
      { id: 'ff1', kind: 'kpi', w: 4, range: 'ytd', source: ['ts'], icon: 'school',
        title: 'My required training', num: '92%', delta: '2 courses remaining', tone: 'good',
        trend: [{ x: 'Feb', y: 61 }, { x: 'Mar', y: 68 }, { x: 'Apr', y: 74 },
                { x: 'May', y: 83 }, { x: 'Jun', y: 88 }, { x: 'Jul', y: 92 }] },
      { id: 'ff2', kind: 'kpi', w: 4, range: 'next_30', source: ['ts'], icon: 'workspace_premium',
        title: 'Next credential due', num: '18', unit: 'days',
        delta: 'Paramedic recert · renew by Jul 12', tone: 'warn' },
      { id: 'ff3', kind: 'progress', w: 4, range: 'ytd', source: ['ev'], icon: 'school',
        title: 'CEU progress', num: '38%', pct: 38, delta: '14 of 36 hours · due Dec 31',
        tone: 'neutral', color: 'var(--teal-400)' }
    ]
  };

  // Viewer-side date-range override. The viewer can explore, but only the
  // owner can save the default — the same rule as the builder's preview.
  var pdOverrides = {};

  function pdRangeControl(w, ownerLabel, compact) {
    var saved = w.range || 'last_30';
    var local = pdOverrides[w.id];
    var dirty = local != null && local !== saved;
    var current = dirty ? local : saved;
    return '<span style="position:relative;display:inline-flex;align-items:center;flex-shrink:0">' +
      '<button class="kx-range-btn' + (dirty ? ' is-dirty' : '') + '" data-range-toggle="' + KX.attr(w.id) + '" ' +
      'title="' + esc(rangeLabel(current)) + ' — ' +
      (dirty ? 'exploring, only the owner can save this default' : 'change date range') + '">' +
      micon('calendar_today', { size: 13 }) +
      '<span>' + esc(compact ? rangeLabelShort(current) : rangeLabel(current)) + '</span>' +
      (dirty ? '<span title="Exploring — unsaved" style="width:5px;height:5px;border-radius:99px;background:var(--amber-500)"></span>' : '') +
      micon('expand_more', { size: 14 }) + '</button>' +
      (dirty ? '<button data-range-reset="' + KX.attr(w.id) + '" title="Reset to the owner\'s default" ' +
        'style="margin-left:2px;background:none;border:none;color:var(--lumo-primary-text-color);font-size:11px;' +
        'font-weight:600;cursor:pointer;font-family:inherit">Reset</button>' : '') +
      (openRangeMenu === w.id
        ? '<div class="kx-menu kx-menu--right" style="width:214px;top:calc(100% + 4px)">' +
          PD_RANGES.map(function (r) {
            return '<button class="kx-menu-row" data-range-pick="' + KX.attr(w.id) + '" data-range-val="' + r.value + '">' +
              micon('calendar_today', { size: 14, color: r.value === current ? 'var(--amber-600)' : 'var(--ink-400)' }) +
              '<span class="label">' + esc(r.label) + '</span>' +
              (r.value === current ? micon('check', { size: 14, color: 'var(--amber-600)' }) : '') + '</button>';
          }).join('') +
          '<div style="display:flex;gap:6px;padding:7px 8px 3px;margin-top:4px;border-top:1px solid var(--ink-100);' +
          'font-size:10.5px;color:var(--ink-400);line-height:1.45">' + micon('info', { size: 13 }) +
          '<span>Exploring only — ' + esc(ownerLabel || 'the owner') + ' can save the default.</span></div></div>'
        : '') +
      '</span>';
  }

  var openRangeMenu = null;

  function pubWidget(w, ownerLabel) {
    var CC = window.KEYSTONE_CUSTOM;
    var kind = w.kind || w.viz;
    var title = w.title, icon = w.icon, body = '';

    if (kind === 'kpi') {
      var spec = w.metricId ? CC.buildSpec(w.metricId, 'kpi') : null;
      var lineSpec = w.metricId ? CC.buildSpec(w.metricId, 'line') : null;
      icon = icon || (spec ? spec.icon : 'pin');
      title = title || (spec ? spec.label : '');
      body = KXCharts.pdKpi({
        num: w.num != null ? w.num : (spec ? spec.num : '—'),
        unit: w.unit,
        delta: w.delta != null ? w.delta : (spec ? spec.delta : ''),
        tone: w.tone || (spec ? spec.tone : 'neutral'),
        trend: w.trend || (lineSpec ? lineSpec.data : null)
      });
    } else if (kind === 'line') {
      var ls = w.metricId ? CC.buildSpec(w.metricId, 'line') : null;
      icon = icon || (ls ? ls.icon : 'show_chart');
      title = title || (ls ? ls.label : '');
      body = KXCharts.pdLine(w.data || (ls ? ls.data : []), w.color, w.ySuffix);
    } else if (kind === 'bar') {
      var bs = w.metricId ? CC.buildSpec(w.metricId, 'bar') : null;
      icon = icon || (bs ? bs.icon : 'bar_chart');
      title = title || (bs ? bs.label : '');
      body = KXCharts.pdBar(w.data || (bs ? bs.data : []));
    } else if (kind === 'donut') {
      icon = icon || 'donut_large';
      body = KXCharts.pdDonut(w.donut, w.center);
    } else if (kind === 'progress') {
      // A KPI with a slim completion bar instead of a sparkline. Used where the
      // number is progress against a fixed requirement rather than a trend — it
      // reads as "how far along am I", never as a score, and it keeps the widget
      // the same height as its KPI siblings so the row stays one row.
      icon = icon || 'donut_large';
      body = '<div style="display:flex;flex-direction:column;gap:6px;height:100%">' +
        '<div class="kx-kpi-num" style="color:var(--ink-900)">' + esc(w.num) + '</div>' +
        (w.delta ? '<div style="font-size:11.5px;color:var(--ink-500);font-weight:500">' + esc(w.delta) + '</div>' : '') +
        '<div class="kx-pubprogress" style="margin-top:auto"><div class="fill" style="width:' +
        Math.max(0, Math.min(100, w.pct || 0)) + '%;background:' + (w.color || 'var(--teal-400)') + '"></div></div>' +
        '</div>';
    } else if (kind === 'table') {
      var ts = w.metricId ? CC.buildSpec(w.metricId, 'table') : null;
      icon = icon || (ts ? ts.icon : 'table_rows');
      title = title || (ts ? ts.label : '');
      body = KXCharts.pdTable(w.cols || (ts ? ts.cols : []), w.rows || (ts ? ts.rows : []));
    }

    var iconChip = '<span class="icon-chip">' + micon(icon, { size: 14, fill: 1 }) + '</span>';

    // One header row at every widget width. Narrow (w:4) widgets used to stack
    // the title above a second row of source chips + range control, which cost
    // ~31px per widget — the difference between the card clearing the fold with
    // one task row visible and clearing it with four.
    //
    // At w:4 there is only ~330px to work with, so the title gets priority: the
    // per-widget source chip drops (the card header already lists the union of
    // sources) and the range label abbreviates. Wide widgets keep both in full.
    var narrow = (w.w || 6) <= 4;
    var srcs = narrow ? '' : (w.source || []).map(function (s) { return KX.srcChip(s); }).join('');

    return '<div class="kx-pubwidget" style="grid-column:span ' + (w.w || 6) + '">' +
      '<div class="kx-pubwidget-head">' + iconChip +
      '<span class="title">' + esc(title) + '</span>' +
      (srcs ? '<span class="srcs">' + srcs + '</span>' : '') +
      '<span class="rng">' + pdRangeControl(w, ownerLabel, narrow) + '</span></div>' +
      '<div style="margin-top:10px;flex:1;display:flex;flex-direction:column;justify-content:center">' + body + '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     HEADER CONTROL CLUSTER
     ---------------------------------------------------------------------
     New home for the links that used to live in the retired coverage hero's
     right-hand rail: the "My dashboards" switcher and the way into Agency
     Intelligence. Folding them into the header the card already draws costs no
     extra height, which is the whole point.

     Reads CC.loadDashboards() directly rather than going through the
     agency-intel layer, so nothing in that module needs to change.

     The pinned-widget-tiles rail is NOT relocated — it showed the same metrics
     this dashboard now shows, one card higher up.
     --------------------------------------------------------------------- */

  var openDashMenu = false;

  function pdHeaderControls(cfg, variant) {
    var isAdmin = variant === 'chief';
    var saved = (window.KEYSTONE_CUSTOM && window.KEYSTONE_CUSTOM.loadDashboards()) || [];
    // The Firefighter only gets a switcher if there is genuinely something to
    // switch to; otherwise their header stays a clean title.
    var showSwitcher = isAdmin || saved.length > 0;
    if (!showSwitcher && !isAdmin) return '';

    var out = '<div class="kx-pubhead-ctl">';

    if (showSwitcher) {
      out += '<span style="position:relative;display:inline-flex">' +
        '<button class="kx-pubhead-btn" data-dash-toggle title="Switch dashboard">' +
        micon('dashboard_customize', { size: 14, fill: 1 }) +
        '<span class="lbl">Switch dashboard</span>' + micon('expand_more', { size: 15 }) + '</button>' +
        (openDashMenu
          ? '<div class="kx-menu kx-menu--right" style="width:250px;top:calc(100% + 4px)">' +
            '<button class="kx-menu-row">' +
            micon('check', { size: 14, color: 'var(--amber-600)' }) +
            '<span class="label">' + esc(cfg.name) + '</span></button>' +
            (saved.length
              ? saved.map(function (d) {
                  return '<a class="kx-menu-row" href="agency-intelligence-dashboard.html?custom=' +
                    encodeURIComponent(d.id) + '" target="_blank" rel="noreferrer">' +
                    micon('dashboard_customize', { size: 14, color: 'var(--ink-400)' }) +
                    '<span class="label">' + esc(d.name) + '</span>' +
                    '<span style="font-size:10px;color:var(--ink-400)">' + d.metrics.length + ' metric' +
                    (d.metrics.length === 1 ? '' : 's') + '</span></a>';
                }).join('')
              : '<div style="padding:8px;font-size:11px;color:var(--ink-400);line-height:1.45">' +
                'No other dashboards yet. Build one in Agency Intelligence.</div>') +
        '</div>'
          : '') + '</span>';
    }

    if (isAdmin) {
      out += '<a class="kx-pubhead-btn" href="agency-intelligence-dashboard.html" target="_blank" rel="noreferrer" ' +
        'title="Open Agency Intelligence">' + micon('auto_awesome', { size: 14, fill: 1 }) +
        '<span class="lbl">Agency Intelligence</span>' + micon('open_in_new', { size: 13 }) + '</a>';
    }

    return out + '</div>';
  }

  function publishedDashboard(variant) {
    var cfg = variant === 'chief' ? CHIEF_DASH
            : variant === 'firefighter' ? FF_DASH
            : LT_DASH;
    var union = {};
    cfg.widgets.forEach(function (w) { (w.source || []).forEach(function (s) { union[s] = true; }); });

    // The Chief builds their own, so the badge and footer say so — which is what
    // earns them the "Agency Intelligence" affordance. Everyone else is a consumer.
    var badge = cfg.owned
      ? '<span class="kx-pubbadge is-owned">' + micon('person', { size: 12, fill: 1 }) + ' Your dashboard</span>'
      : '<span class="kx-pubbadge">' + micon('campaign', { size: 12, fill: 1 }) + ' Published to you</span>';

    var meta = esc(cfg.scope) +
      (cfg.owned ? '' : ' · published by ' + esc(cfg.publisher)) +
      (cfg.template ? ' · ' + esc(cfg.template) : '');

    var footRight = cfg.owned
      ? micon('edit', { size: 12 }) + ' You own this · edit in Agency Intelligence'
      : micon('lock', { size: 12 }) + ' Read-only · explore freely, only ' + esc(cfg.ownerShort) + ' can edit';

    return '<div class="kx-pubdash" data-pubdash="' + KX.attr(variant) + '">' +
      '<div class="kx-pubhead">' +
      '<span class="kx-pubmark">' + micon('dashboard_customize', { size: 18, fill: 1 }) + '</span>' +
      '<div style="min-width:0;flex:1">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span class="kx-pubtitle">' + esc(cfg.name) + '</span>' + badge +
      '<span class="kx-pubsrcs">' + Object.keys(union).map(function (s) { return KX.srcChip(s); }).join('') + '</span>' +
      '</div>' +
      '<div class="kx-pubmeta">' + meta + '</div></div>' +
      pdHeaderControls(cfg, variant) + '</div>' +

      '<div class="kx-pubgrid">' + cfg.widgets.map(function (w) { return pubWidget(w, cfg.ownerShort); }).join('') + '</div>' +

      '<div class="kx-pubfoot">' +
      '<span style="display:inline-flex;align-items:center;gap:5px">' +
      micon('cloud_done', { size: 13, fill: 1, color: 'var(--teal-500)' }) + ' Auto-refreshed 2 min ago</span>' +
      '<span style="display:inline-flex;align-items:center;gap:4px">' + footRight + '</span></div></div>';
  }

  /* =====================================================================
     WIRING — attached once; the Hub calls wire() after each render but the
     guard keeps handlers from stacking on the persistent document.
     ===================================================================== */
  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    var root = document.getElementById('root');

    root.addEventListener('click', function (e) {
      /* -- facets -- */
      var f = e.target.closest('[data-facet]');
      if (f) { openFacet = f.getAttribute('data-facet'); window.KXHub.render(); return; }
      if (e.target.closest('[data-facet-close]')) { openFacet = null; window.KXHub.render(); return; }

      var drill = e.target.closest('[data-facet-drill]');
      if (drill) {
        var fd = FACET_DEFS.find(function (x) { return x.key === drill.getAttribute('data-facet-drill'); });
        window.dispatchEvent(new CustomEvent('kx-drill-filter', {
          detail: { filter: { types: fd.types, statuses: ['overdue', 'past_sla', 'at_risk'] } }
        }));
        return;
      }
      var all = e.target.closest('[data-facet-all]');
      if (all) {
        var fa = FACET_DEFS.find(function (x) { return x.key === all.getAttribute('data-facet-all'); });
        if (fa.savedView) window.dispatchEvent(new CustomEvent('kx-jump-view', { detail: { viewId: fa.savedView } }));
        else window.dispatchEvent(new CustomEvent('kx-drill-filter', { detail: { filter: { types: fa.types } } }));
        return;
      }

      /* -- compliance hero jump links -- */
      var jump = e.target.closest('[data-jump-view]');
      if (jump) {
        window.dispatchEvent(new CustomEvent('kx-jump-view', { detail: { viewId: jump.getAttribute('data-jump-view') } }));
        return;
      }

      /* -- published-dashboard range control -- */
      var rt = e.target.closest('[data-range-toggle]');
      if (rt) {
        var id = rt.getAttribute('data-range-toggle');
        openRangeMenu = openRangeMenu === id ? null : id;
        openDashMenu = false;   // only one menu open at a time, both directions
        window.KXHub.render();
        return;
      }
      var rp = e.target.closest('[data-range-pick]');
      if (rp) {
        var wid = rp.getAttribute('data-range-pick');
        pdOverrides[wid] = rp.getAttribute('data-range-val');
        openRangeMenu = null;
        window.KXHub.render();
        return;
      }
      var rr = e.target.closest('[data-range-reset]');
      if (rr) { delete pdOverrides[rr.getAttribute('data-range-reset')]; window.KXHub.render(); return; }

      /* -- published-dashboard header: dashboard switcher -- */
      if (e.target.closest('[data-dash-toggle]')) {
        openDashMenu = !openDashMenu;
        openRangeMenu = null;
        window.KXHub.render();
        return;
      }

      if ((openRangeMenu || openDashMenu) && !e.target.closest('.kx-menu')) {
        openRangeMenu = null;
        openDashMenu = false;
        window.KXHub.render();
      }
    });
  }

  window.KXHero = {
    coverageHero: coverageHero,
    complianceHero: complianceHero,
    publishedDashboard: publishedDashboard,
    computePulse: computePulse,
    wire: wire
  };
})();
