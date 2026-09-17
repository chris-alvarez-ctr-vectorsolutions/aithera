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
      '<span class="kx-btn-label">See all credentials</span>' +
      micon('arrow_forward', { size: 14 }) + '</vaadin-button></div>' +

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

  // ONE date range per DASHBOARD, never one per widget — the same rule the
  // Agency Intelligence builder follows, because it is the same dashboard.
  // A dashboard's data is queried as a whole, so the picker sits in the card
  // header beside Export and scopes every widget under it.
  var PD_RANGES = [
    { value: 'last_7', label: 'Last 7 days' },
    { value: 'last_30', label: 'Last 30 days' },
    { value: 'last_90', label: 'Last 90 days' },
    { value: 'qtd', label: 'Quarter to date' },
    { value: 'ytd', label: 'Year to date' },
    { value: 'last_12mo', label: 'Last 12 months' }
  ];
  // Forward horizons — deliberately absent from the picker. A dashboard range
  // is a window over data that already exists; "last 90 days of open shifts"
  // means nothing. Countdown metrics carry a fixed horizon of their own and
  // print it as static text, sitting out the dashboard range.
  var PD_HORIZONS = {
    next_14: 'Next 14 days',
    next_30: 'Next 30 days'
  };
  function rangeLabel(v) {
    if (PD_HORIZONS[v]) return PD_HORIZONS[v];
    var r = PD_RANGES.find(function (x) { return x.value === v; });
    return r ? r.label : 'Last 30 days';
  }
  function pdDashRange(cfg) { return (cfg && cfg.range) || 'last_30'; }
  // The fixed forward window a widget reports on, or null if it follows the
  // dashboard. Read off the metric where there is one so a hand-authored
  // widget and a metric-backed one agree.
  function pdHorizonOf(w) {
    var CP = window.AGENCY_INTEL;
    if (CP && CP.widgetHorizon && (w.metricId || w.metricIds)) {
      var h = CP.widgetHorizon(w);
      if (h) return h;
    }
    return PD_HORIZONS[w.range] ? w.range : null;
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
    id: 'b-shift-readiness',
    name: 'B-Shift Readiness', scope: 'Station 4 · B-Shift',
    publisher: 'Chief Smith · Battalion 1', ownerShort: 'Chief Smith',
    // The dashboard's ONE reporting window — every time-bounded widget on it
    // reads this value. A crew-readiness read is a quarter-to-date story.
    range: 'qtd',
    // Which widget goes down when the "a widget can't load" scenario is on.
    // See pdFailed — deliberately not the first widget on the dashboard.
    failWidget: 'lt4',
    widgets: [
      { id: 'lt1', metricId: 'training_completion',    viz: 'kpi',   w: 4,  source: ['ts'],    title: 'Crew training complete' },
      { id: 'lt2', metricId: 'credential_expirations', viz: 'kpi',   w: 4,  source: ['ts'],    title: 'Credentials expiring' },
      { id: 'lt3', metricId: 'open_shifts',            viz: 'kpi',   w: 4,  source: ['sched'], title: 'Open shifts · 14d' },
      { id: 'lt4', metricId: 'ot_trend',               viz: 'line',  w: 7,  source: ['sched'], title: 'Overtime hours', color: 'var(--amber-500)' },
      { id: 'lt5', metricId: 'overdue_inspections',    viz: 'bar',   w: 5,  source: ['ci'],    title: 'Overdue inspections by station' },
      { id: 'lt6', metricId: 'open_shifts',            viz: 'table', w: 12, source: ['sched'], title: 'Open shifts · next 14 days' }
    ]
  };

  // The Chief's own dashboard, built in Agency Intelligence and dropped on their home
  // hero. Three of the six chart types the Agency Intelligence builder actually
  // offers — a scatter + trend, a bar chart, and a donut — so the card reads as
  // something built with that tool instead of three interchangeable big numbers.
  //
  // Height is no longer the governing constraint the way it was for the old
  // three-KPI row (~250px): a scatter + sentence, a 5-station bar, and a donut run
  // taller than KPI tiles, so this card lands around ~430px instead. That trade —
  // real charts over a fold-hugging height — was made explicitly by the designer.
  //
  // Widths: none of the three shares the old uniform w:3 split evenly. Scatter
  // takes w:5, which at the dashboard's 1400px measures 376px — almost exactly
  // the 380px its renderer was designed for. Donut takes w:4 (299px) because its
  // legend needs room for five source-app names plus percentages; at w:3 (215px)
  // names wrapped mid-word and percentages were cut off. Bar stays w:3 (221px) —
  // it is the compact one, five station bars read fine at that width.
  // ch3's donut needs all five source apps (tasks_by_app spans ts/ci/sched/gt/ev),
  // which is also why the Chief's entitlements now include Scheduling — see the
  // comment in agency-intel-page-data.js.
  //
  /* ---------------------------------------------------------------------
     OVERTIME EXPOSURE × INJURY RATE — the Chief's correlation widget (ch1)
     ---------------------------------------------------------------------
     Unit of analysis is the BATTALION, not the station. This dashboard is
     aimed at large metro departments, which run 20-60 battalions; a station-
     level field at that size is both too granular for a chief to act on and
     too small a denominator for an injury rate to mean anything. 45
     battalions is the middle of the target range.

     ⚠ SYNTHETIC DEMO DATA. Generated, then tuned against three constraints
     and verified numerically before being pasted here:
       · Pearson r = 0.61 over the 45 points (target band 0.55-0.65 — strong
         enough to read as a real signal, not so tidy it looks fabricated).
         n = 45, p < 0.001. The renderer recomputes all three from this table
         rather than trusting these numbers; see pdOutlierScatter.
       · Highest-overtime quartile averages 12.35 recordables/100 FTE against
         a department median of 5.2 — a 2.37× gap, which the headline renders
         as "2.4×". That multiple is COMPUTED from this table at render time,
         so editing a row moves the sentence with it.
       · Battalions 14, 31 and 44 are the three deliberate outliers. They sit
         clear of the cloud on both axes: the non-outlier field tops out at
         235 OT hours and 13.0 injuries, against 262-301 and 20.8-25.1 here.
     `calls` (annual responses) is what makes the headline's "at comparable
     call volume" a checked claim rather than an assertion — the top-OT
     quartile's median call volume is within a few hundred responses of the
     department's, and pdOutlierScatter prints both in the detail panel.
     Labels are generic by design: no real FDNY/CFD battalion or division
     names appear here or anywhere in this file.

     Divisions are 1-5, assigned round-robin so no division owns the outliers.
     `fte` is uniformed headcount; the renderer buckets it into 3 size steps
     at the terciles (≤113 / ≤147 / above). --------------------------------- */
  var OT_INJURY_BATTALIONS = [
    { b: 1,  div: 4, ot: 120, inj: 6.4,  fte: 151, calls: 24000 },
    { b: 2,  div: 2, ot: 105, inj: 3.1,  fte: 118, calls: 17600 },
    { b: 3,  div: 5, ot: 95,  inj: 3.3,  fte: 95,  calls: 15600 },
    { b: 4,  div: 3, ot: 189, inj: 5.5,  fte: 104, calls: 13000 },
    { b: 5,  div: 1, ot: 226, inj: 11.0, fte: 100, calls: 16000 },
    { b: 6,  div: 4, ot: 88,  inj: 6.9,  fte: 166, calls: 23200 },
    { b: 7,  div: 2, ot: 158, inj: 3.9,  fte: 118, calls: 18800 },
    { b: 8,  div: 5, ot: 190, inj: 10.4, fte: 135, calls: 17700 },
    { b: 9,  div: 3, ot: 150, inj: 2.6,  fte: 147, calls: 23900 },
    { b: 10, div: 1, ot: 90,  inj: 6.1,  fte: 101, calls: 17400 },
    { b: 11, div: 4, ot: 228, inj: 2.7,  fte: 128, calls: 15200 },
    { b: 12, div: 2, ot: 119, inj: 4.0,  fte: 159, calls: 25300 },
    { b: 13, div: 5, ot: 129, inj: 8.9,  fte: 150, calls: 19200 },
    { b: 14, div: 3, ot: 288, inj: 23.4, fte: 92,  calls: 12100, outlier: true },
    { b: 15, div: 1, ot: 219, inj: 3.0,  fte: 96,  calls: 11200 },
    { b: 16, div: 4, ot: 198, inj: 2.6,  fte: 101, calls: 17300 },
    { b: 17, div: 2, ot: 173, inj: 4.6,  fte: 87,  calls: 10200 },
    { b: 18, div: 5, ot: 94,  inj: 2.4,  fte: 163, calls: 20400 },
    { b: 19, div: 3, ot: 198, inj: 5.7,  fte: 145, calls: 24400 },
    { b: 20, div: 1, ot: 208, inj: 3.7,  fte: 129, calls: 21200 },
    { b: 21, div: 4, ot: 206, inj: 5.1,  fte: 147, calls: 17600 },
    { b: 22, div: 2, ot: 232, inj: 7.9,  fte: 108, calls: 17000 },
    { b: 23, div: 5, ot: 88,  inj: 6.5,  fte: 114, calls: 19100 },
    { b: 24, div: 3, ot: 161, inj: 7.2,  fte: 89,  calls: 10700 },
    { b: 25, div: 1, ot: 108, inj: 2.3,  fte: 167, calls: 27500 },
    { b: 26, div: 4, ot: 118, inj: 2.2,  fte: 104, calls: 13700 },
    { b: 27, div: 2, ot: 98,  inj: 1.9,  fte: 145, calls: 17800 },
    { b: 28, div: 5, ot: 181, inj: 7.7,  fte: 155, calls: 21700 },
    { b: 29, div: 3, ot: 112, inj: 11.6, fte: 106, calls: 14300 },
    { b: 30, div: 1, ot: 223, inj: 9.4,  fte: 153, calls: 21500 },
    { b: 31, div: 4, ot: 262, inj: 20.8, fte: 159, calls: 24600, outlier: true },
    { b: 32, div: 2, ot: 234, inj: 10.3, fte: 167, calls: 23000 },
    { b: 33, div: 5, ot: 148, inj: 2.3,  fte: 92,  calls: 13000 },
    { b: 34, div: 3, ot: 125, inj: 2.9,  fte: 153, calls: 19200 },
    { b: 35, div: 1, ot: 224, inj: 8.4,  fte: 107, calls: 13900 },
    { b: 36, div: 4, ot: 231, inj: 13.0, fte: 167, calls: 24100 },
    { b: 37, div: 2, ot: 146, inj: 4.4,  fte: 144, calls: 19300 },
    { b: 38, div: 5, ot: 196, inj: 5.2,  fte: 119, calls: 19000 },
    { b: 39, div: 3, ot: 181, inj: 3.4,  fte: 109, calls: 12800 },
    { b: 40, div: 1, ot: 129, inj: 3.4,  fte: 142, calls: 18900 },
    { b: 41, div: 4, ot: 155, inj: 4.9,  fte: 154, calls: 24500 },
    { b: 42, div: 2, ot: 224, inj: 3.8,  fte: 121, calls: 17400 },
    { b: 43, div: 5, ot: 187, inj: 5.3,  fte: 113, calls: 16000 },
    { b: 44, div: 3, ot: 301, inj: 25.1, fte: 145, calls: 22100, outlier: true },
    { b: 45, div: 1, ot: 99,  inj: 5.9,  fte: 138, calls: 20200 }
  ];

  // Division colours: five hues, each paired with a distinct SHAPE by the
  // renderer so division never rides on colour alone. All five are existing
  // tokens and all clear 3:1 against the card background — see the contrast
  // table in pdOutlierScatter's header. --src-sched is borrowed because the
  // palette has no other distinct fifth hue; the shape encoding and the
  // "Division N" legend labels keep it from reading as the Scheduling chip.
  // A division is an identity, not a verdict, so none of these may be a status
  // hue: teal for "Division 1" and amber for "Division 3" quietly told the
  // reader which divisions were the good and bad ones. All five are now
  // status-free and each clears 3:1 on the surface.
  //
  // KNOWN LIMIT: five series in a scatter is an all-pairs colour problem — any
  // two points can sit side by side — and no five-hue set from this palette
  // clears the >= 15 normal-vision separation floor. This set gets the worst
  // pair to 13.8 (it was 10.4). The mitigation is the SHAPE encoding each
  // division also carries plus the labelled legend, per the rule that a
  // sub-floor pair is legal only with secondary encoding; the real fix is
  // fewer series or facets, not another palette.
  var OT_INJURY_DIVISIONS = [
    { id: 1, label: 'Division 1', color: 'var(--status-due)' },
    { id: 2, label: 'Division 2', color: 'var(--src-sched)' },
    { id: 3, label: 'Division 3', color: 'var(--src-gt)' },
    { id: 4, label: 'Division 4', color: 'var(--ink-600)' },
    { id: 5, label: 'Division 5', color: 'var(--azure-400)' }
  ];

  // Headcount terciles → the renderer's 3 size steps. Computed from the
  // fixture rather than hardcoded, so adding battalions re-buckets cleanly.
  function otInjurySizeStep(fte) {
    var sorted = OT_INJURY_BATTALIONS.map(function (r) { return r.fte; })
      .sort(function (a, b) { return a - b; });
    var t1 = sorted[Math.floor(sorted.length / 3)];
    var t2 = sorted[Math.floor(2 * sorted.length / 3)];
    return fte <= t1 ? 1 : fte <= t2 ? 2 : 3;
  }

  function otInjurySpec() {
    return {
      xLabel: 'Overtime hours per uniformed FTE',
      xUnit: 'rolling 90 days',
      yLabel: 'OSHA-recordable injuries per 100 FTE',
      yUnit: 'annualized',
      // Short forms for the detail panel's median line, where the axis units
      // above ("rolling 90 days") would read as gibberish attached to a number.
      xShort: 'OT hrs/FTE',
      yShort: 'injuries/100 FTE',
      quadrantLabel: 'High OT, high injury',
      sizeNote: 'Battalion headcount (FTE)',
      // ⚠ PLACEHOLDER FIGURE — the cost model behind this number does not
      // exist yet. Standing it up needs real inputs the mock does not have:
      // the department's workers' comp claim cost per recordable, its
      // light-duty backfill rate and average light-duty duration, and the
      // loaded OT replacement rate for the ranks actually being replaced.
      // Until those are wired in, treat $1.8M as illustrative of the SHAPE of
      // the answer (a dollar figure attached to three named battalions), not
      // as a defensible estimate. Do not put this on a budget document.
      costNote: 'Est. $1.8M in comp, light-duty backfill, and OT replacement across these 3 battalions.',
      groups: OT_INJURY_DIVISIONS,
      points: OT_INJURY_BATTALIONS.map(function (rec) {
        return {
          label: 'Battalion ' + rec.b,
          short: String(rec.b),
          order: rec.b,
          x: rec.ot, y: rec.inj,
          size: otInjurySizeStep(rec.fte),
          group: rec.div,
          fte: rec.fte, calls: rec.calls,
          outlier: !!rec.outlier
        };
      })
    };
  }

  // ch1 carries an EXPLICIT short title, and a subtitle. Every other widget
  // here leaves `title` unset and lets pubWidget derive it from the metric
  // spec's own label, which is what a widget built in the Agency Intelligence
  // builder would show. For a correlation that derivation is
  // `xLabel + ' × ' + yLabel`, which for this pair would be 60+ characters —
  // and since .kx-pubwidget .title wraps rather than truncates, a title that
  // long runs to three lines and pushes the card past its accepted height
  // ceiling. "Overtime exposure × injury rate" (31 chars) holds one line from
  // 1100px up, the same budget the previous title was measured against.
  var CHIEF_DASH = {
    id: 'b1-coverage',
    name: 'B-1 Coverage Snapshot', scope: 'Battalion 1 · all stations',
    owned: true, ownerShort: 'you',
    // The dashboard's ONE reporting window — see PD_RANGES.
    range: 'last_90',
    // Scenario-only: this one is healthy until the prototype panel says
    // otherwise. See pdFailed.
    failWidget: 'ch2',
    widgets: [
      // Sources: overtime/scheduling data is Scheduling ('sched') — the same
      // source the 'Overtime hours' widget on the Lieutenant's dashboard
      // already declares, so that mapping is settled.
      //
      // TODO(source): the injury / OSHA-recordable side is NOT settled. None
      // of the five apps in KEYSTONE.SOURCES (TargetSolutions, Check It,
      // Guardian, Scheduling, EV+) is confirmed as the system of record for
      // OSHA recordables — the plausible candidates are Vector EHS, a Check It
      // incident module, or Guardian Tracking, and picking one here would be a
      // guess presented as a fact on a card that names dollar figures. So the
      // widget declares `sourceTodo` instead, which renders a visibly
      // unresolved chip. Replace it with the real source id (and drop
      // sourceTodo) once the product mapping is confirmed.
      //
      // viz stays 'scatter' (NOT a new kind) on purpose: the widget's wrapper
      // class is `.kx-pubwidget--` + kind, and index.html's ≤1070px rule keys
      // off `.kx-pubwidget--scatter` to hand a correlation the whole grid row
      // once the grid goes two-across. A new kind string would silently drop
      // that rule. The `scatter` field below is what selects the outlier
      // renderer over the generic metric-driven one.
      //
      // Range is last_90, not last_30: both axes are explicitly rolling-90-day
      // measures, and a control reading "Last 30 days" over a 90-day metric
      // would be stating something false in the one piece of card chrome a
      // viewer can act on.
      { id: 'ch1', viz: 'scatter', w: 5, source: ['sched'], sourceTodo: 'Injury / OSHA recordables',
        title: 'Overtime exposure × injury rate',
        subtitle: 'by battalion, rolling 90 days',
        scatter: otInjurySpec },
      { id: 'ch2', metricId: 'overdue_inspections', viz: 'bar',   w: 3, source: ['ci'] },
      { id: 'ch3', metricId: 'tasks_by_app',        viz: 'donut', w: 4,
        source: ['ts', 'ci', 'sched', 'gt', 'ev'] }
    ]
  };

  // The Firefighter's dashboard — the safe-by-default proposal. Ships as a Readiness Hub
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
    id: 'my-readiness',
    name: 'My Readiness', scope: 'Riley Brennan · FF / EMT',
    publisher: 'Training Officer Whitfield', ownerShort: 'Training',
    // The dashboard's ONE reporting window — see PD_RANGES.
    range: 'ytd',
    template: 'Readiness Hub starter template',
    failWidget: 'ff2',
    widgets: [
      { id: 'ff1', kind: 'kpi', w: 4, source: ['ts'], icon: 'school',
        title: 'My required training', num: '92%', delta: '2 courses remaining', tone: 'good',
        trend: [{ x: 'Feb', y: 61 }, { x: 'Mar', y: 68 }, { x: 'Apr', y: 74 },
                { x: 'May', y: 83 }, { x: 'Jun', y: 88 }, { x: 'Jul', y: 92 }] },
      { id: 'ff2', kind: 'kpi', w: 4, range: 'next_30', source: ['ts'], icon: 'workspace_premium',
        title: 'Next credential due', num: '18', unit: 'days',
        delta: 'Paramedic recert · renew by Jul 12', tone: 'warn' },
      { id: 'ff3', kind: 'progress', w: 4, source: ['ev'], icon: 'school',
        title: 'CEU progress', num: '38%', pct: 38, delta: '14 of 36 hours · due Dec 31',
        tone: 'neutral', color: 'var(--teal-400)' }
    ]
  };

  /* The Chief's SECOND dashboard — the one that makes the switcher a switcher.
     ---------------------------------------------------------------------
     Deliberately not another version of the first. Switching to it changes
     four things a reviewer should see change together:

       · who owns it   — published BY Training, not built by the Chief, so the
                         badge goes from "Your dashboard" to "Published to
                         you" and the footer goes read-only
       · what it covers — the whole department, not Battalion 1
       · its window     — quarter to date, not the last 90 days
       · what it draws on — compliance systems rather than scheduling

     Sources follow the canonical metric → product mapping in
     agency-intel-page-data.js (METRIC_SOURCE); none of them is invented here.

     One widget on it is DOWN on arrival (failWidget + failAlways, see
     pdFailed). It is the only widget on the dashboard backed by EV+, which is
     what makes "EV+ didn't respond" true rather than decorative — every other
     widget here reads from TargetSolutions and loads fine. It is also the
     widest, so the state is legible at a glance from the back of a room. */
  var DEPT_DASH = {
    id: 'dept-compliance',
    name: 'Department Compliance Review', scope: 'All stations · department-wide',
    publisher: 'Training Officer Whitfield', ownerShort: 'Training',
    range: 'qtd',
    // Down on load, every time this dashboard is opened — not gated on the
    // prototype panel's scenario switch.
    failWidget: 'dc4', failAlways: true,
    widgets: [
      { id: 'dc1', metricId: 'training_completion',    viz: 'kpi', w: 4, source: ['ts'],
        title: 'Department training complete' },
      // Title deliberately plain: this widget reports on its own forward
      // horizon and prints it under the value, so naming a window in the title
      // too would state the period twice, in two places, from two sources.
      { id: 'dc2', metricId: 'credential_expirations', viz: 'kpi', w: 4, source: ['ts'],
        title: 'Credentials expiring' },
      { id: 'dc3', metricId: 'policy_acks',            viz: 'kpi', w: 4, source: ['ts'],
        title: 'Policy acknowledgments' },
      // Titled by what the bars ACTUALLY are: ceu_progress's bar series is cut
      // by station (CEU_BAR), not by credential type.
      { id: 'dc4', metricId: 'ceu_progress',           viz: 'bar', w: 7, source: ['ev'],
        title: 'CEU standing by station' },
      // A donut, not a second by-station bar: two station bars side by side
      // read as one chart drawn twice. This cuts the same headline the other
      // way — compliant / in window / lapsed.
      { id: 'dc5', metricId: 'training_completion',    viz: 'donut', w: 5, source: ['ts'],
        title: 'Training compliance status' }
    ]
  };

  /* Which dashboards a role can move between, in menu order — the first is
     what they land on. Only the Chief has more than one today: they own one
     and have one published to them, which is the ordinary case the switcher
     exists for. */
  var DASH_SET = {
    chief: [CHIEF_DASH, DEPT_DASH],
    lieutenant: [LT_DASH],
    firefighter: [FF_DASH]
  };

  var pdPicked = {};   // variant -> id of the dashboard currently being viewed

  function pdDashesFor(variant) { return DASH_SET[variant] || [LT_DASH]; }

  function pdPickedDash(variant) {
    var list = pdDashesFor(variant);
    var id = pdPicked[variant];
    return list.filter(function (d) { return d.id === id; })[0] || list[0];
  }

  // Viewer-side override of the DASHBOARD's range. The viewer can explore,
  // but only the owner can save the default — the same rule as the builder's
  // preview, one level up now that the range belongs to the dashboard.
  // Keyed by the DASHBOARD's id, not the role viewing it: a role can now hold
  // more than one dashboard (see DASH_SET), and an exploration of the window on
  // one of them must not follow the reader onto the other.
  var pdOverrides = {};

  /* ---------------------------------------------------------------------
     A WIDGET THAT DIDN'T LOAD
     ---------------------------------------------------------------------
     This card reads from five separate products, so the realistic failure is
     not "the dashboard is down" — it is one source not answering while the
     other four are fine. The card has to say so rather than quietly leaving a
     hole, because every alternative reads as data: an empty chart looks like
     zero findings, a dash looks like a measured null, and a missing widget
     looks like a dashboard that was built without it.

     So a failed widget keeps its frame, its icon, its title and its place in
     the grid — the reader can see exactly WHICH number is missing — and
     replaces only the data with a stated failure, the name of the system that
     didn't answer, and a retry. The name matters: "Check It didn't respond"
     tells a battalion chief whether to chase it or wait; "something went
     wrong" tells them nothing.
     --------------------------------------------------------------------- */

  /* Which widget goes down is a property of the DASHBOARD (cfg.failWidget) —
     deliberately never its first widget, since the whole point of the state is
     that it sits among widgets that loaded fine.

     Two ways in, and the difference matters to whoever is demoing:

       · cfg.failAlways — the dashboard ships with it down and it fails on
         every load. Department Compliance Review does this, so switching to it
         puts you in front of the state with nothing to switch on first.
       · the prototype panel's scenario switch — turns the same failure on for
         whichever dashboard you are looking at. This is how the state is
         reached on dashboards that are otherwise healthy. */
  var loadFailure = false;   // demo switch — see hub.js mountPrototypeFab
  var pdRetrying = {};       // widget id -> true while a retry is in flight
  var pdRecovered = {};      // widget id -> true once a retry has succeeded

  function setLoadFailure(on) {
    loadFailure = !!on;
    pdRetrying = {};
    pdRecovered = {};        // re-arm, so the scenario demos the same each time
  }

  function pdFailed(w, cfg) {
    if (!cfg || cfg.failWidget !== w.id || pdRecovered[w.id]) return false;
    return !!cfg.failAlways || loadFailure;
  }

  function pdErrorBody(w, printing) {
    var src = (w.source || [])[0];
    var name = (src && KX.srcName(src)) || 'The source system';
    var retrying = !!pdRetrying[w.id];

    return '<div class="kx-pubwidget-err" role="status">' +
      '<span class="mark' + (retrying ? ' is-busy' : '') + '">' +
      micon(retrying ? 'progress_activity' : 'cloud_off',
            { size: 20, cls: retrying ? 'kx-spin' : '' }) + '</span>' +
      '<div class="t">' + (retrying ? 'Retrying…' : 'Couldn’t load this data') + '</div>' +
      '<div class="s">' + esc(name) + ' didn’t respond. Everything else on this ' +
      'dashboard loaded normally.</div>' +
      // On paper there is nothing to click, and the document has to say the
      // figure was missing at the time it was generated — not offer a retry.
      (printing
        ? '<div class="s" style="margin-top:4px">No data available when this was exported.</div>'
        : '<button class="kx-pubwidget-retry" data-pdw-retry="' + KX.attr(w.id) + '"' +
          (retrying ? ' disabled' : '') + '>' + micon('refresh', { size: 14 }) +
          (retrying ? 'Retrying' : 'Try again') + '</button>') +
      '</div>';
  }

  function pdCurrentRange(cfg) {
    var saved = pdDashRange(cfg);
    var local = pdOverrides[cfg.id];
    return (local != null && local !== saved) ? local : saved;
  }

  // The dashboard's one date picker. Lives in the card header cluster with
  // Export and Switch dashboard — controls that act on the whole card.
  function pdDashRangeControl(cfg) {
    var saved = pdDashRange(cfg);
    var local = pdOverrides[cfg.id];
    var dirty = local != null && local !== saved;
    var current = dirty ? local : saved;
    var owner = cfg.owned ? 'you' : esc(cfg.ownerShort || 'the owner');

    return '<span style="position:relative;display:inline-flex;align-items:center">' +
      '<button class="kx-dashrange-btn' + (dirty ? ' is-dirty' : '') + '" data-pd-range-toggle ' +
      'aria-haspopup="menu" aria-expanded="' + (openRangeMenu ? 'true' : 'false') + '" ' +
      'title="Date range for this dashboard — it scopes every widget on it">' +
      micon('calendar_today', { size: 14 }) +
      // Two labels, swapped by CSS. Every other control in this header goes
      // icon-only on a narrow card, but this one cannot — the WINDOW is the
      // information, and a bare calendar icon says nothing. So it shortens
      // instead ("Last 90 days" → "Last 90d") rather than disappearing.
      '<span class="lbl lbl-full">' + esc(rangeLabel(current)) + '</span>' +
      '<span class="lbl lbl-short">' + esc(rangeLabelShort(current)) + '</span>' +
      (dirty ? '<span title="Exploring — unsaved" style="width:5px;height:5px;border-radius:99px;' +
        'background:var(--amber-500);flex-shrink:0"></span>' : '') +
      micon('expand_more', { size: 15 }) + '</button>' +
      (dirty ? '<button data-pd-range-reset title="Reset to the saved range" ' +
        'style="margin-left:4px;background:none;border:none;color:var(--lumo-primary-text-color);' +
        'font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit">Reset</button>' : '') +
      (openRangeMenu
        ? '<div class="kx-menu kx-menu--right" role="menu" style="width:238px;top:calc(100% + 4px)">' +
          '<div class="kx-menu-label">Scopes every widget</div>' +
          PD_RANGES.map(function (r) {
            return '<button class="kx-menu-row" data-pd-range-pick="' + r.value + '">' +
              micon('calendar_today', { size: 14, color: r.value === current ? 'var(--amber-600)' : 'var(--ink-400)' }) +
              '<span class="label">' + esc(r.label) + '</span>' +
              (r.value === current ? micon('check', { size: 14, color: 'var(--amber-600)' }) : '') + '</button>';
          }).join('') +
          '<div style="display:flex;gap:6px;padding:8px 9px 4px;margin-top:4px;border-top:1px solid var(--ink-100);' +
          'font-size:10.5px;color:var(--ink-400);line-height:1.45">' + micon('info', { size: 13 }) +
          // Even the owner cannot save from here — this card is a read-only
          // view of a published dashboard; the saved range is set where the
          // dashboard is built.
          '<span>Exploring only — ' + (cfg.owned
            ? 'save the default in Agency Intelligence'
            : owner + ' saves the default') +
          '. Countdown widgets report ahead and ignore this window.</span></div></div>'
        : '') +
      '</span>';
  }

  // A widget that reports on a fixed forward window instead of the
  // dashboard's. Static text, deliberately not a control — see .kx-horizon.
  function pdHorizonLabel(w, compact) {
    var h = pdHorizonOf(w);
    if (!h) return '';
    return '<span class="kx-horizon" ' +
      'title="This widget looks forward on a fixed window and is not affected by the dashboard date range">' +
      micon('event_upcoming', { size: 13 }) +
      '<span>' + esc(compact ? rangeLabelShort(h) : rangeLabel(h)) + '</span></span>';
  }

  var openRangeMenu = false;   // the dashboard's range menu — one per card

  /* ---------------------------------------------------------------------
     EXPORT — dashboard-level and per-widget
     ---------------------------------------------------------------------
     A published dashboard is a deliverable, so it can leave the page: PDF for
     circulating it, CSV for working the numbers. Both live where the thing they
     act on lives — the whole dashboard exports from the card header, a single
     widget from its own kebab.

     The mechanics are NOT new. agency-intel-export.js already does both for the
     Agency Intelligence builder, so the Hub calls the same module: CSV is a real
     download via KXCharts.downloadCSV, and "PDF" is the browser's print-to-PDF
     over a report-framed copy of the dashboard. Same code path means the file a
     Chief exports from their home page is the file they'd get from the builder.

     What IS Hub-side is the flattening for hand-authored widgets — see pdWidgetTable().
     --------------------------------------------------------------------- */

  var openExportMenu = false;   // dashboard-level export menu
  var openWidgetMenu = null;    // id of the widget whose kebab menu is open

  // The dashboard being rendered right now. The click handlers need the cfg and
  // the variant, and they run long after publishedDashboard() returned, so the
  // render records them rather than the handlers re-deriving the role.
  var pdCurrent = null;

  // The title the CARD shows for this widget, which is what an exported file
  // should be named after. AGENCY_INTEL.widgetTitle() ignores an explicit
  // `title` and always derives from the metric, so ch1's short hand-written
  // title ("Overtime exposure × injury rate") has to win here — otherwise the
  // export is titled with the long derived string the user never saw.
  function pdTitleOf(w) {
    var CP = window.AGENCY_INTEL;
    return w.title || (CP && CP.widgetTitle ? CP.widgetTitle(w) : (w.id || 'Widget'));
  }

  // Widget → { title, columns, rows } for CSV.
  //
  // Metric-backed widgets (the Chief's, and anything the assistant adds) go
  // through the Agency Intelligence flattener so both surfaces export the same
  // shape. The Firefighter's are hand-authored — literal num/delta/pct with no
  // metricId — and that flattener has nothing to resolve for them, so it returns
  // "No exportable data". A CSV of three such notes is a bug in a trench coat,
  // so those kinds are flattened here from what the widget actually displays.
  function pdWidgetTable(w) {
    var CP = window.AGENCY_INTEL;
    var title = pdTitleOf(w);
    var kind = w.kind || w.viz;

    // A story-driven correlation carries its own points and never touches the
    // metric catalogue, so the Agency Intelligence flattener has nothing to
    // resolve for it. Flatten from the plotted field instead — and export the
    // encoded dimensions (division, headcount, call volume) too, since those
    // are what an analyst re-checking the outlier claim will want.
    if (kind === 'scatter' && w.scatter) {
      var os = typeof w.scatter === 'function' ? w.scatter() : w.scatter;
      var gLabel = {};
      (os.groups || []).forEach(function (g) { gLabel[g.id] = g.label; });
      return {
        title: title,
        columns: ['Battalion', 'Division', os.xLabel + ' (' + os.xUnit + ')',
                  os.yLabel + ' (' + os.yUnit + ')', 'Uniformed FTE', 'Responses/yr', 'Outlier'],
        rows: (os.points || []).map(function (pt) {
          return [pt.label, gLabel[pt.group] || '', pt.x, pt.y, pt.fte, pt.calls, pt.outlier ? 'yes' : ''];
        })
      };
    }

    if ((w.metricId || (w.metricIds && w.metricIds.length)) && CP && CP.widgetToTable) {
      var t = CP.widgetToTable(w);
      if (t && t.rows && t.rows.length) { t.title = title; return t; }
    }

    if (kind === 'progress') {
      // `num` on a progress widget is already the percentage ("38%"), so a
      // separate pct column would print the same figure twice.
      var pval = w.num != null ? String(w.num) : (w.pct != null ? w.pct + '%' : '');
      var pcols = ['Metric', 'Complete'], prow = [title, pval];
      if (w.pct != null && pval.indexOf(String(w.pct)) === -1) { pcols.push('Percent'); prow.push(w.pct + '%'); }
      if (w.delta) { pcols.push('Detail'); prow.push(w.delta); }
      return { title: title, columns: pcols, rows: [prow] };
    }
    if (kind === 'kpi') {
      var cols = ['Metric', 'Value'], row = [title, String(w.num != null ? w.num : '') + (w.unit ? ' ' + w.unit : '')];
      if (w.delta) { cols.push('Detail'); row.push(w.delta); }
      var out = { title: title, columns: cols, rows: [row] };
      // A KPI's sparkline is the part worth having in a spreadsheet, so the
      // trend becomes its own block rather than being dropped on the floor.
      if (w.trend && w.trend.length) {
        out.extra = { title: title + ' — trend', columns: ['Period', 'Value'],
          rows: w.trend.map(function (p) { return [p.x, p.y]; }) };
      }
      return out;
    }
    return { title: title, columns: [], rows: [], note: 'No exportable data.' };
  }

  // pdWidgetTable may hand back a companion block (a KPI's trend); flatten those in.
  function pdTables(widgets) {
    var tables = [];
    widgets.forEach(function (w) {
      var t = pdWidgetTable(w);
      var extra = t.extra;
      delete t.extra;
      tables.push(t);
      if (extra) tables.push(extra);
    });
    return tables;
  }

  function pdWidgetsOf(cfg) {
    return cfg.widgets;
  }

  function pdExportAvailable() {
    return !!(window.AGENCY_INTEL_EXPORT && window.KXCharts);
  }

  // Report framing for the printed page: a title block, then the same widgets
  // the card draws (real inline-SVG charts, not screenshots), then a footer. The
  // print stylesheet in index.html hides the app around #kxPrint and flattens
  // the widgets' interactive bits, so what prints is a document, not a UI.
  function pdPrintDoc(title, meta, widgets, ownerLabel) {
    return '<div class="kx-printdoc">' +
      '<div class="kx-printdoc-head">' +
      '<div><div class="kx-printdoc-title">' + esc(title) + '</div>' +
      '<div class="kx-printdoc-meta">' + esc(meta) + '</div></div>' +
      '<div class="kx-pubmark">' + micon('space_dashboard', { size: 17, fill: 1 }) + '</div></div>' +
      // Print stays content-sized whatever the author did: a fixed row track
      // slices cards across page breaks.
      '<div class="kx-pubgrid">' +
      // A widget that didn't load prints as "no data available" rather than
      // silently dropping out of the document — a printed dashboard with a
      // missing panel is indistinguishable from one that never had it.
      widgets.map(function (w) {
        return pubWidget(w, ownerLabel, {
          print: true,
          failed: !!(pdCurrent && pdFailed(w, pdCurrent.cfg))
        });
      }).join('') +
      '</div>' +
      '<div class="kx-printdoc-foot">Generated by the Readiness Hub · data as of ' +
      esc(KX.fmtDate(new Date())) + '</div></div>';
  }

  function pdExportDashboard(kind) {
    if (!pdCurrent || !pdExportAvailable()) return;
    var cfg = pdCurrent.cfg, widgets = pdWidgetsOf(cfg);
    // The window is load-bearing on paper: a printed number with no period
    // on it can't be checked. One dashboard range covers the lot, so it is
    // stated once here rather than under each widget.
    var meta = cfg.scope + ' · Readiness Hub · ' + KX.fmtDate(new Date()) +
      ' · ' + rangeLabel(pdCurrentRange(cfg));
    if (kind === 'csv') window.AGENCY_INTEL_EXPORT.csv(cfg.name, pdTables(widgets));
    else window.AGENCY_INTEL_EXPORT.print(pdPrintDoc(cfg.name, meta, widgets, cfg.ownerShort));
  }

  function pdExportWidget(id, kind) {
    if (!pdCurrent || !pdExportAvailable()) return;
    var cfg = pdCurrent.cfg;
    var w = pdWidgetsOf(cfg).find(function (x) { return x.id === id; });
    if (!w) return;
    var title = pdTitleOf(w);
    if (kind === 'csv') { window.AGENCY_INTEL_EXPORT.csv(title, pdTables([w])); return; }
    // One widget prints full-width — it is the whole document now, not a cell.
    var meta = cfg.name + ' · ' + cfg.scope + ' · ' + KX.fmtDate(new Date()) +
      ' · ' + rangeLabel(pdHorizonOf(w) || pdCurrentRange(cfg));
    window.AGENCY_INTEL_EXPORT.print(
      pdPrintDoc(title, meta, [Object.assign({}, w, { w: 12 })], cfg.ownerShort));
  }

  // Two rows, one job. Shared by the header control and every widget kebab so
  // the wording can never drift between "export this dashboard" and "export this
  // widget" — only the data attribute differs.
  function pdExportRows(attr, val) {
    return '<button class="kx-menu-row" role="menuitem" ' + attr + '="' + KX.attr(val) + '" data-pd-fmt="pdf">' +
      micon('picture_as_pdf', { size: 16 }) + '<span class="label">Export as PDF</span></button>' +
      '<button class="kx-menu-row" role="menuitem" ' + attr + '="' + KX.attr(val) + '" data-pd-fmt="csv">' +
      micon('table_view', { size: 16 }) + '<span class="label">Export as CSV</span></button>';
  }

  function pubWidget(w, ownerLabel, opts) {
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
      // w.color is the widget author's override; otherwise the metric's own
      // tone colour, so a rising failure count is never drawn in green.
      body = KXCharts.pdLine(w.data || (ls ? ls.data : []),
                             w.color || (ls ? ls.color : null), w.ySuffix);
    } else if (kind === 'bar') {
      var bs = w.metricId ? CC.buildSpec(w.metricId, 'bar') : null;
      icon = icon || (bs ? bs.icon : 'bar_chart');
      title = title || (bs ? bs.label : '');
      body = KXCharts.pdBar(w.data || (bs ? bs.data : []),
                            w.color || (bs ? bs.color : null), bs ? bs.tone : null);
    } else if (kind === 'donut') {
      var ds = w.metricId ? CC.buildSpec(w.metricId, 'donut') : null;
      icon = icon || (ds ? ds.icon : 'donut_large');
      title = title || (ds ? ds.label : '');
      body = KXCharts.pdDonut(w.donut || (ds ? ds.data : []), w.center);
    } else if (kind === 'scatter') {
      icon = icon || 'scatter_plot';
      if (w.scatter) {
        // A correlation with a WRITTEN story: the widget hands over its own
        // point set and copy, and pdOutlierScatter leads with the outlier gap
        // instead of a coefficient. See OT_INJURY_BATTALIONS above.
        var os = typeof w.scatter === 'function' ? w.scatter() : w.scatter;
        // Paper gets the statistics panel expanded — see pdOutlierScatter.
        if (os) os.expandStats = !!(opts && opts.print);
        title = title || (os ? os.xLabel + ' × ' + os.yLabel : '');
        body = os ? KXCharts.pdOutlierScatter(os) : '';
      } else {
        // Generic two-metric correlation. buildCorrelationSpec aligns them
        // on their shared station labels and returns the plotted points; a null
        // means fewer than three stations overlap, so there is nothing to plot.
        var sc = w.metricIds ? CC.buildCorrelationSpec(w.metricIds, 'scatter') : null;
        title = title || (sc ? sc.xLabel + ' × ' + sc.yLabel : '');
        body = sc ? KXCharts.pdScatter(sc) : '';
      }
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
      // Same engine the Agency Intelligence canvas uses — filter, sort, column
      // choice and paging (see KXCharts.tableWidget in charts.js). A published
      // dashboard is read-only, so every change a reader makes here is local
      // exploration flagged unsaved, exactly like the range control below.
      // On paper the engine drops its controls and prints every row.
      body = KXCharts.tableWidget(
        w,
        w.cols || (ts ? ts.cols : []),
        w.rows || (ts ? ts.rows : []),
        { interactive: !(opts && opts.print), report: !!(opts && opts.print) }
      );
    }

    // Didn't load. Title and icon are the widget's own metadata, not its data,
    // so they survive — only the body is replaced. See pdErrorBody above.
    var failed = !!(opts && opts.failed);
    if (failed) body = pdErrorBody(w, !!(opts && opts.print));

    var iconChip = '<span class="icon-chip' + (failed ? ' is-failed' : '') + '">' +
      micon(icon, { size: 14, fill: 1 }) + '</span>';

    // One header row at every widget width. Narrow (w:4) widgets used to stack
    // the title above a second row of source chips + range control, which cost
    // ~31px per widget — the difference between the card clearing the fold with
    // one task row visible and clearing it with four.
    //
    // At w:4 there is only ~330px to work with, so the title gets priority: the
    // per-widget source chip drops and the range label abbreviates. Wide
    // widgets keep both in full. (The card header used to repeat the union of
    // every widget's sources as a chip strip beside the title — five chips
    // that named products rather than saying anything about this dashboard's
    // numbers. It is gone; these per-widget chips, which do attach a source to
    // a specific figure, are the only source labelling left.)
    var narrow = (w.w || 6) <= 4;
    var srcs = narrow ? '' : (w.source || []).map(function (s) { return KX.srcChip(s); }).join('');

    // An UNRESOLVED source. A widget may legitimately know it draws on a
    // second system without yet knowing which product that is — see the
    // TODO(source) note on ch1. Rather than pick a plausible app and ship a
    // guess as a fact, the widget declares `sourceTodo` and gets a dashed,
    // neutral chip that reads as unfinished at a glance and names the missing
    // system on hover. Delete the field, not this branch, once it is mapped.
    if (!narrow && w.sourceTodo) {
      srcs += '<span class="kx-src-chip kx-src-chip--todo" title="' +
        KX.attr(w.sourceTodo) + ' — source system not confirmed yet">' +
        '<span class="dot"></span>TBD</span>';
    }

    // No remove control on any widget here. A published dashboard's widgets are
    // its content, decided by whoever built it; a reader of this card cannot
    // add one and cannot take one away. (This used to carry an ✕ for widgets
    // the assistant had dropped in from chat — that route is gone.)
    var rm = '';

    // Per-widget export, in the widget's own top-right corner. Same two options
    // as the card-level control, scoped to this widget alone — and the same
    // kebab-plus-menu shape the Agency Intelligence canvas uses for its widgets.
    // Suppressed in the print document: it is a control, and this is paper.
    // Nothing loaded, so there is nothing to export — the menu would hand back
    // an empty file and call it a report.
    var printing = !!(opts && opts.print);
    var kebab = printing || failed || !pdExportAvailable() ? '' :
      '<span style="position:relative;display:inline-flex">' +
      '<button class="kx-pubwidget-kebab" data-pdw-menu="' + KX.attr(w.id) + '" ' +
      'aria-haspopup="menu" aria-expanded="' + (openWidgetMenu === w.id) + '" ' +
      'title="Export this widget" aria-label="Options for the ' + KX.attr(title) + ' widget">' +
      micon('more_vert', { size: 17 }) + '</button>' +
      (openWidgetMenu === w.id
        ? '<div class="kx-menu kx-menu--right" role="menu" style="width:206px;top:calc(100% + 4px)">' +
          '<div class="kx-menu-label">This widget</div>' +
          pdExportRows('data-pdw-export', w.id) + '</div>'
        : '') + '</span>';

    // ✕ and kebab travel together in one right-aligned group, so the header's
    // flex:auto spacing lives on the group rather than fighting between them.
    var acts = (rm || kebab) ? '<span class="kx-pubwidget-acts">' + rm + kebab + '</span>' : '';

    // The range control sits BELOW the value, not beside the title. It used to
    // share the header row, where it took ~105px and forced every title into an
    // ellipsis once the Agency Intelligence panel claimed 320px of the body.
    // Giving the title its own row drops a widget's legible minimum from ~310px
    // to ~205px, which is what lets three widgets stay on one row at ordinary
    // laptop widths instead of wrapping to two.
    // A kind modifier class on the wrapper. Only the scatter needs one today:
    // index.html's ≤1070px rule gives .kx-pubwidget--scatter the whole grid row
    // so the correlation drawing keeps its designed scale once the grid drops to
    // two-across. Emitted for every kind so the hook is uniform, not special-cased.
    /* A published dashboard is reproduced as its author laid it out: the same
       12 columns and the same fixed row track they sized against on the Agency
       Intelligence canvas (KX.GRID, shared by both surfaces). Every widget gets
       an explicit row span — one auto-height card would stretch its whole track
       and knock the rest of its row out of alignment — with KX.widgetH falling
       back to a per-kind default for anything published before heights existed.

       This is the WIDE layout only. Below 1300px index.html's breakpoints take
       over: spans are overridden to two-across and then to one-per-row, and
       grid-auto-rows goes back to `auto` so a stacked card sizes to its content. */
    /* Row span only for a dashboard whose author actually sized things (see
       gridOpen below). Widgets published before heights existed carry no `h`,
       and giving those a per-kind default is not "reproducing the layout" — it
       is inventing one. Measured: it shrank the correlation scatter from 551px
       to 348px and clipped 191px of its content. Those keep auto heights. */
    var sized = !!(opts && opts.sized);

    return '<div class="kx-pubwidget kx-pubwidget--' + KX.attr(kind) +
      (failed ? ' is-failed' : '') + '" ' +
      'style="grid-column:span ' + (w.w || 6) +
      (sized ? ';grid-row:span ' + KX.widgetH(w) : '') + '">' +
      '<div class="kx-pubwidget-head">' + iconChip +
      '<span class="title">' + esc(title) + '</span>' +
      (srcs ? '<span class="srcs">' + srcs + '</span>' : '') +
      acts +
      '</div>' +
      // Optional subtitle — the unit of analysis and the window, which for a
      // correlation are load-bearing (a battalion-level 90-day rate and a
      // station-level 30-day one are different findings). Its own line rather
      // than appended to the title, which is already at its width budget.
      (w.subtitle ? '<div class="kx-pubwidget-sub">' + esc(w.subtitle) + '</div>' : '') +
      // Classed as well as styled: a table widget needs the body to start at
      // the top and span the full width, which styles.css overrides by class.
      '<div class="kx-pubwidget-body" ' +
      'style="margin-top:10px;flex:1;display:flex;flex-direction:column;justify-content:center">' + body + '</div>' +
      // Only widgets on their OWN forward horizon say anything here. The
      // dashboard's window is stated once, in the card header — repeating it
      // under every widget is chrome, and there is nothing to click either way.
      // A widget that didn't load states no window: naming the period of a
      // figure that never arrived reads as if the figure is there.
      (!failed && pdHorizonLabel(w, narrow)
        ? '<div class="kx-pubwidget-foot">' + pdHorizonLabel(w, narrow) + '</div>'
        : '') +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     THE TITLE IS THE SWITCHER
     ---------------------------------------------------------------------
     Switching dashboards used to be a quiet "Switch dashboard" button in the
     right-hand control cluster, sitting between Export and Agency Intelligence
     and reading like a third utility. Nobody found it: the control that
     changes WHICH dashboard you are looking at was the least prominent thing
     in the header, and it was on the opposite side of the card from the name
     of the dashboard it changes.

     So the name itself is the control now. "B-1 Coverage Snapshot" is a
     tinted, bordered pill with a chevron — the one warm-coloured element in an
     otherwise neutral header — and it opens the list of dashboards published
     to you. Nothing to hunt for: the thing you'd point at to say "this
     dashboard" is the thing you click to change it.

     Reads CC.loadDashboards() directly rather than going through the
     agency-intel layer, so nothing in that module needs to change.
     --------------------------------------------------------------------- */

  var openDashMenu = false;

  function pdSavedDashboards() {
    return (window.KEYSTONE_CUSTOM && window.KEYSTONE_CUSTOM.loadDashboards()) || [];
  }

  /* One row per dashboard the reader holds. Two kinds sit in this list and
     they behave differently, which the rows have to make obvious:

       · the dashboards this role is published (DASH_SET) swap IN PLACE — the
         card re-renders underneath the title and the page never moves. That is
         the switcher's real job, and it is what the check mark tracks.
       · dashboards the reader built in Agency Intelligence open THERE, in a
         new tab, because that is where they can be edited. Their rows carry an
         open-in-new glyph so the jump is never a surprise.

     Each built-in row names its scope and, when someone else publishes it, who
     — "all stations · Training" against "Battalion 1 · yours". Without that the
     two entries are just two names, and the thing a chief actually needs to
     know before switching is whose numbers they are about to be looking at. */
  function dashRow(d, current) {
    var on = d.id === current.id;
    return '<button class="kx-menu-row kx-dashrow' + (on ? ' is-current' : '') + '" ' +
      'role="menuitem" data-dash-pick="' + KX.attr(d.id) + '">' +
      micon(on ? 'check' : 'dashboard_customize',
            { size: 16, fill: on ? 1 : 0, color: on ? 'var(--amber-600)' : 'var(--ink-400)' }) +
      '<span class="label"><span class="n">' + esc(d.name) + '</span>' +
      '<span class="m">' + esc(d.scope) + ' · ' +
      esc(d.owned ? 'yours' : d.ownerShort || d.publisher || 'published to you') +
      '</span></span></button>';
  }

  function dashPicker(cfg, variant) {
    var isAdmin = variant === 'chief';
    // A dashboard that has just been unshared from you is not one you can
    // switch back to — leaving it in the list would offer back the thing the
    // notice above just said you lost.
    var mine = pdDashesFor(variant).filter(function (d) { return !isUnshared(variant, d); });
    var saved = pdSavedDashboards();
    // A switcher with nowhere to switch to is a control that lies. A role with
    // one dashboard and no way to build another keeps a plain title — same
    // type, no pill, nothing to click.
    if (mine.length < 2 && !isAdmin && !saved.length) {
      return '<span class="kx-pubtitle">' + esc(cfg.name) + '</span>';
    }

    var count = mine.length + saved.length;
    return '<span style="position:relative;display:inline-flex">' +
      '<button class="kx-dashpick" data-dash-toggle aria-haspopup="menu" ' +
      'aria-expanded="' + (openDashMenu ? 'true' : 'false') + '" ' +
      'title="Switch dashboard — ' + count + ' available">' +
      '<span class="kx-pubtitle">' + esc(cfg.name) + '</span>' +
      '<span class="chev">' + micon('expand_more', { size: 18 }) + '</span>' +
      '</button>' +
      (openDashMenu
        ? '<div class="kx-menu kx-menu--left" role="menu" style="width:300px;top:calc(100% + 6px)">' +
          '<div class="kx-menu-label">On your homepage</div>' +
          mine.map(function (d) { return dashRow(d, cfg); }).join('') +
          '<div class="kx-menu-divider"></div>' +
          '<div class="kx-menu-label">Built in Agency Intelligence</div>' +
          (saved.length
            ? saved.map(function (d) {
                return '<a class="kx-menu-row kx-dashrow" role="menuitem" ' +
                  'href="agency-intelligence-dashboard.html?custom=' +
                  encodeURIComponent(d.id) + '" target="_blank" rel="noreferrer">' +
                  micon('dashboard_customize', { size: 16, color: 'var(--ink-400)' }) +
                  '<span class="label"><span class="n">' + esc(d.name) + '</span>' +
                  '<span class="m">' + d.metrics.length + ' metric' +
                  (d.metrics.length === 1 ? '' : 's') + ' · opens in Agency Intelligence</span></span>' +
                  micon('open_in_new', { size: 13, color: 'var(--ink-400)' }) + '</a>';
              }).join('')
            : '<div style="padding:4px 9px 8px;font-size:11px;color:var(--ink-400);line-height:1.45">' +
              'None yet. Build one in Agency Intelligence.</div>') +
        '</div>'
        : '') + '</span>';
  }

  /* ---------------------------------------------------------------------
     HEADER CONTROL CLUSTER
     ---------------------------------------------------------------------
     What acts on the card as a whole: the reporting window, Export, and the
     way into Agency Intelligence. The dashboard switcher used to live here
     too — it is the title now (see dashPicker above).
     --------------------------------------------------------------------- */

  function pdHeaderControls(cfg, variant) {
    var isAdmin = variant === 'chief';

    var out = '<div class="kx-pubhead-ctl">';

    // The date range leads the cluster: it changes what every widget below is
    // SHOWING, where Export and the switcher act on the card as a whole. It is
    // also the only calendar on this card now — widgets have none.
    out += pdDashRangeControl(cfg);

    // Export acts on the dashboard you are looking at. Every published
    // dashboard gets it, owned or received.
    if (pdExportAvailable()) {
      out += '<span style="position:relative;display:inline-flex">' +
        '<button class="kx-pubhead-btn" data-pd-export-toggle aria-haspopup="menu" ' +
        'aria-expanded="' + openExportMenu + '" title="Export this dashboard">' +
        micon('download', { size: 14 }) +
        '<span class="lbl">Export</span>' + micon('expand_more', { size: 15 }) + '</button>' +
        (openExportMenu
          ? '<div class="kx-menu kx-menu--right" role="menu" style="width:230px;top:calc(100% + 4px)">' +
            '<div class="kx-menu-label">Whole dashboard</div>' +
            pdExportRows('data-pd-export', 'dash') + '</div>'
          : '') + '</span>';
    }

    if (isAdmin) {
      out += '<a class="kx-pubhead-btn" href="agency-intelligence-dashboard.html" target="_blank" rel="noreferrer" ' +
        'title="Open Agency Intelligence">' + micon('auto_awesome', { size: 14, fill: 1 }) +
        '<span class="lbl">Agency Intelligence</span>' + micon('open_in_new', { size: 13 }) + '</a>';
    }

    return out + '</div>';
  }

  // variant -> the role that renders it (see hub.js:843). Kept local because
  // window.KXHub does not exist yet during the first render: hub.js calls
  // setRole() -> render() at :1486, and only assigns window.KXHub at :1503.
  var VARIANT_ROLE = { chief: 'chief', firefighter: 'ff', lieutenant: 'lt' };

  // The dashboard body. Without a grant this is exactly the grid that shipped
  // before — no wrapper, no panel, no height change. The ungranted case is a
  // real no-op, not a hidden element.
  /* True once any widget carries an authored height. That is the signal that a
     human laid this dashboard out on the Agency Intelligence canvas, and the only
     case where reproducing exact heights is faithful rather than invented. A
     dashboard with none keeps the content-sized look it has always had. */
  function anySized(widgets) {
    return (widgets || []).some(function (w) { return !!w.h; });
  }

  function dashBody(cfg, variant) {
    var AI = window.KXAIPanel;
    var granted = AI && AI.hasAccess(VARIANT_ROLE[variant]);
    if (granted) AI.setContext(VARIANT_ROLE[variant], cfg);

    // Exactly the widgets the dashboard was built with. Chat used to be able to
    // append to this — it can't now, so there is no merge and no landing-zone
    // placeholder for answers to drop into.
    var all = cfg.widgets;
    var sized = anySized(all);
    var cells = all
      .map(function (w) {
        return pubWidget(w, cfg.ownerShort, { sized: sized, failed: pdFailed(w, cfg) });
      }).join('');

    // The modifier switches the grid onto the fixed row track. Without it the
    // grid keeps auto rows and nothing about the published look changes.
    var grid = '<div class="kx-pubgrid' + (sized ? ' kx-pubgrid--sized' : '') + '">' + cells + '</div>';
    if (!granted) return grid;

    return '<div class="kx-pubbody' + (AI.isExpanded() ? ' is-expanded' : '') + '">' +
      AI.html() + grid + '</div>';
  }

  /* ---------------------------------------------------------------------
     UNSHARED — what a viewer sees after the owner revokes their access
     ---------------------------------------------------------------------
     Removing someone from a dashboard's audience is now possible in Agency
     Intelligence, which raises the question that removal always raises and
     that this prototype previously had no answer for: what does the person on
     the other end see the next morning?

     Not a hole where their dashboard was, and not a dead card. They fall back
     to the starter dashboard for their role — the one the department publishes
     to everyone — with a one-time note saying what went and who to ask. The
     note is dismissible because it is news, not a permanent condition; the
     fallback underneath is simply their homepage from then on.
     --------------------------------------------------------------------- */
  var unshared = false;          // demo switch — see hub.js mountPrototypeFab
  var unsharedDismissed = false;
  function setUnshared(on) {
    unshared = !!on;
    if (on) unsharedDismissed = false;   // re-arm so the note shows each demo
  }

  // Only a RECEIVED dashboard can be taken away. The Chief owns theirs, so
  // there is nobody who could revoke it and the scenario does not apply.
  function isUnshared(variant, cfg) {
    return unshared && !cfg.owned;
  }

  /* What you land on depends on what you lost, and there are three cases —
     the last is easy to forget and is the one that actually strands someone.

     Lose a dashboard published to you when you also BUILD one, and you land on
     your own: the Chief losing the department's compliance review still has
     B-1 Coverage Snapshot. Lose one built for your crew with nothing of your
     own, and you fall back to the department starter — still a homepage, just
     a more general one. But the starter is the floor. Lose that and there is
     nothing underneath, so the honest answer is an empty state that says so
     and names who can give it back — not a blank region, and not a pretend
     dashboard with no data behind it. */
  function pdFallback(variant, cfg) {
    var mine = pdDashesFor(variant).filter(function (d) {
      return d.owned && d.id !== cfg.id;
    })[0];
    if (mine) return mine;
    return cfg.id !== FF_DASH.id ? FF_DASH : null;
  }

  function noDashboardState(cfg) {
    return '<div class="kx-nodash">' +
      '<span class="mark">' + micon('dashboard_customize', { size: 30 }) + '</span>' +
      '<div class="t">No dashboard on your homepage</div>' +
      '<div class="s">\u201c' + esc(cfg.name) + '\u201d was removed by ' +
      esc(cfg.publisher || cfg.ownerShort || 'its owner') + ', and you have no other ' +
      'dashboard published to you. Your tasks below are unaffected.</div>' +
      '<div class="s" style="margin-top:6px">Ask ' +
      esc(cfg.ownerShort || 'your training officer') + ' to publish one.</div>' +
      '</div>';
  }

  function unsharedNotice(cfg, fallback) {
    if (unsharedDismissed) return '';
    return '<div class="kx-unshared" role="status">' +
      '<span class="mark">' + micon('person_remove', { size: 17, fill: 1 }) + '</span>' +
      '<span class="body">' +
      '<span class="t">\u201c' + esc(cfg.name) + '\u201d is no longer shared with you</span>' +
      '<span class="s">' + esc(cfg.ownerShort || 'The owner') + ' removed it from your homepage. ' +
      // The second sentence has to match what is actually below the notice —
      // promising a replacement above an empty state is worse than saying
      // nothing — so it NAMES the dashboard they landed on rather than
      // describing it. Which one that is now depends on the reader: their own,
      // if they build one, and the department starter if they don't.
      (fallback
        ? 'You\u2019re seeing \u201c' + esc(fallback.name) + '\u201d instead \u2014 ' +
          'ask them if you still need it.'
        : 'Ask them if you still need it.') +
      '</span>' +
      '</span>' +
      '<button class="kx-unshared-x" data-unshared-dismiss aria-label="Dismiss">' +
      micon('close', { size: 16 }) + '</button></div>';
  }

  function publishedDashboard(variant) {
    // Whichever of this role's dashboards they last picked in the switcher —
    // the first one in their set until they pick another.
    var cfg = pdPickedDash(variant);
    // Access revoked: the dashboard they were sent is gone. Where that leaves
    // them depends on what else they hold — see pdFallback.
    var revoked = isUnshared(variant, cfg);
    var fallback = revoked ? pdFallback(variant, cfg) : null;
    var notice = revoked ? unsharedNotice(cfg, fallback) : '';
    // Nothing underneath: the starter is the floor, so this role is left with
    // no dashboard at all rather than a fallback.
    if (revoked && !fallback) return notice + noDashboardState(cfg);
    if (revoked) cfg = fallback;
    // Which dashboard the export handlers are acting on. Recorded here because
    // the handlers fire after the render, and the role can change under them.
    pdCurrent = { cfg: cfg, variant: variant };

    // The Chief builds their own, so the badge and footer say so — which is what
    // earns them the "Agency Intelligence" affordance. Everyone else is a consumer.
    var badge = cfg.owned
      ? '<span class="kx-pubbadge is-owned">' + micon('person', { size: 12, fill: 1 }) + ' Your dashboard</span>'
      : '<span class="kx-pubbadge">' + micon('campaign', { size: 12, fill: 1 }) + ' Published to you</span>';

    var meta = esc(cfg.scope) +
      (cfg.owned ? '' : ' · published by ' + esc(cfg.publisher)) +
      (cfg.template ? ' · ' + esc(cfg.template) : '');

    // Only an OWNED dashboard says anything down here. A received one used to
    // carry "Read-only · explore freely, only <owner> can edit" — a permission
    // notice under a card that offers no editing control in the first place,
    // so it answered a question nobody reading it had asked. Who published it
    // is already stated under the title, which is the part that matters.

    return notice +
      '<div class="kx-pubdash" data-pubdash="' + KX.attr(variant) + '">' +
      '<div class="kx-pubhead">' +
      '<span class="kx-pubmark">' + micon('dashboard_customize', { size: 18, fill: 1 }) + '</span>' +
      '<div style="min-width:0;flex:1">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      dashPicker(cfg, variant) + badge +
      '</div>' +
      '<div class="kx-pubmeta">' + meta + '</div></div>' +
      pdHeaderControls(cfg, variant) + '</div>' +

      dashBody(cfg, variant) +

      // Footer carries ownership only. It used to open with "Auto-refreshed
      // 2 min ago", which promised a refresh cycle nothing behind this card
      // actually runs — a claim about data freshness is the last thing to
      // leave unbacked on a dashboard people make staffing calls from.
      (cfg.owned
        ? '<div class="kx-pubfoot">' +
          '<span style="display:inline-flex;align-items:center;gap:4px;margin-left:auto">' +
          micon('edit', { size: 12 }) + ' You own this · edit in Agency Intelligence' +
          '</span></div>'
        : '') + '</div>';
  }

  /* =====================================================================
     WIRING — attached once; the Hub calls wire() after each render but the
     guard keeps handlers from stacking on the persistent document.
     ===================================================================== */
  var wired = false;
  function wire() {
    // hub.js calls this after EVERY render. The delegated listeners only need
    // attaching once, but the table pagers are new elements each time and need
    // their properties set, so that pass runs every call.
    pdHydrateTables();
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

      if (e.target.closest('[data-unshared-dismiss]')) {
        unsharedDismissed = true;
        window.KXHub.render();
        return;
      }

      /* -- published-dashboard range control --
         Dashboard-level, so it is keyed by the dashboard variant rather than
         by a widget. A published dashboard is read-only: the pick is always a
         local exploration, and Reset puts the owner's saved range back. */
      if (e.target.closest('[data-pd-range-toggle]')) {
        openRangeMenu = !openRangeMenu;
        pdCloseMenus({ keepRange: true });   // one menu open at a time, all directions
        window.KXHub.render();
        return;
      }
      var rp = e.target.closest('[data-pd-range-pick]');
      if (rp) {
        if (pdCurrent) pdOverrides[pdCurrent.cfg.id] = rp.getAttribute('data-pd-range-pick');
        openRangeMenu = false;
        window.KXHub.render();
        return;
      }
      if (e.target.closest('[data-pd-range-reset]')) {
        if (pdCurrent) delete pdOverrides[pdCurrent.cfg.id];
        window.KXHub.render();
        return;
      }

      /* -- table widget: columns, reset, clear filter --
         A published dashboard is read-only, so every one of these is a LOCAL
         override on the reader's side. Sorting and paging arrive as component
         events, handled below. */
      var tc = e.target.closest('[data-tbl-cols]');
      if (tc) {
        var tcid = tc.getAttribute('data-tbl-cols');
        var wasCols = KXCharts.getOpenCols() === tcid;
        pdCloseMenus();
        KXCharts.setOpenCols(wasCols ? null : tcid);
        window.KXHub.render();
        return;
      }
      var tct = e.target.closest('[data-tbl-col-toggle]');
      if (tct) {
        var ttid = tct.getAttribute('data-tbl-col-toggle');
        var tcol = parseInt(tct.getAttribute('data-tbl-col'), 10);
        var tw = pdWidgetById(ttid);
        if (tw) {
          var hid = KXCharts.tableSettings(tw).hidden.slice();
          var at = hid.indexOf(tcol);
          if (at === -1) hid.push(tcol); else hid.splice(at, 1);
          KXCharts.setLocalTable(ttid, 'hidden', hid);
          window.KXHub.render();
        }
        return;
      }
      var trs = e.target.closest('[data-tbl-reset]');
      if (trs) { KXCharts.resetTable(trs.getAttribute('data-tbl-reset')); window.KXHub.render(); return; }
      var tqc = e.target.closest('[data-tbl-qclear]');
      if (tqc) { KXCharts.setTableQuery(tqc.getAttribute('data-tbl-qclear'), ''); window.KXHub.render(); return; }

      /* -- published-dashboard header: dashboard switcher -- */
      if (e.target.closest('[data-dash-toggle]')) {
        var wasDash = openDashMenu;
        pdCloseMenus();
        openDashMenu = !wasDash;
        window.KXHub.render();
        return;
      }

      /* -- pick a dashboard from the title switcher --
         Swaps the card in place. Opening a dashboard runs its load, so a
         widget that fails on load fails again on every visit: a retry that
         succeeded a minute ago does not carry over to the next time you switch
         back, any more than it would survive a page refresh. */
      var dp = e.target.closest('[data-dash-pick]');
      if (dp) {
        if (pdCurrent) pdPicked[pdCurrent.variant] = dp.getAttribute('data-dash-pick');
        openDashMenu = false;
        pdRetrying = {};
        pdRecovered = {};
        window.KXHub.render();
        return;
      }

      /* -- retry a widget that didn't load --
         The prototype's retry always succeeds — the interesting question for
         a design review is what recovery looks like, not what a second
         failure looks like. It is deliberately NOT instant: a button that
         swaps straight to a chart reads as if it was never really loading. */
      var rt = e.target.closest('[data-pdw-retry]');
      if (rt) {
        var rid = rt.getAttribute('data-pdw-retry');
        if (pdRetrying[rid]) return;
        pdRetrying[rid] = true;
        window.KXHub.render();
        setTimeout(function () {
          delete pdRetrying[rid];
          pdRecovered[rid] = true;
          window.KXHub.render();
        }, 1100);
        return;
      }

      /* -- export: whole dashboard -- */
      if (e.target.closest('[data-pd-export-toggle]')) {
        var wasExport = openExportMenu;
        pdCloseMenus();
        openExportMenu = !wasExport;
        window.KXHub.render();
        return;
      }
      var xd = e.target.closest('[data-pd-export]');
      if (xd) {
        var dfmt = xd.getAttribute('data-pd-fmt');
        pdCloseMenus();
        window.KXHub.render();
        // After the render: print() measures the document it just wrote, and a
        // re-render mid-flight would pull the widgets out from under it.
        pdExportDashboard(dfmt);
        return;
      }

      /* -- export: one widget, from its kebab -- */
      var wm = e.target.closest('[data-pdw-menu]');
      if (wm) {
        var wid2 = wm.getAttribute('data-pdw-menu');
        var wasOpen = openWidgetMenu === wid2;
        pdCloseMenus();
        openWidgetMenu = wasOpen ? null : wid2;
        window.KXHub.render();
        return;
      }
      var xw = e.target.closest('[data-pdw-export]');
      if (xw) {
        var xwid = xw.getAttribute('data-pdw-export');
        var wfmt = xw.getAttribute('data-pd-fmt');
        pdCloseMenus();
        window.KXHub.render();
        pdExportWidget(xwid, wfmt);
        return;
      }

      if ((openRangeMenu || openDashMenu || openExportMenu || openWidgetMenu || KXCharts.getOpenCols()) &&
          !e.target.closest('.kx-menu')) {
        pdCloseMenus();
        window.KXHub.render();
      }
    });

    /* -- table filter --
       The hub re-renders wholesale, so the field this event came from is
       destroyed. Restore focus and caret afterwards, as the Agency
       Intelligence page does for the same control. */
    root.addEventListener('input', function (e) {
      var tq = e.target.closest && e.target.closest('[data-tbl-q]');
      if (!tq) return;
      var id = tq.getAttribute('data-tbl-q');
      var caret = tq.selectionStart;
      KXCharts.setTableQuery(id, e.target.value);
      window.KXHub.render();
      var back = document.querySelector('[data-tbl-q="' + CSS.escape(id) + '"]');
      if (back) {
        back.focus();
        try { back.setSelectionRange(caret, caret); } catch (err) { /* not selectable */ }
      }
    });

    /* -- table sort (vwc-sortable-header bubbles this) -- */
    root.addEventListener('sort-direction-change', function (e) {
      var h = e.target.closest('[data-tbl-sort]');
      if (!h) return;
      var id = h.getAttribute('data-tbl-sort');
      var dir = e.detail && e.detail.direction;
      // The component cycles asc → desc → null; null restores the seeded order.
      KXCharts.setLocalTable(id, 'sort', dir ? { col: +h.getAttribute('data-tbl-col'), dir: dir } : null);
      window.KXHub.render();
    });
  }

  // The widget object behind an id, across whichever dashboard is on screen.
  // The click handlers run long after publishedDashboard() returned, so they
  // re-derive from pdCurrent rather than closing over the widget list.
  function pdWidgetById(id) {
    if (!pdCurrent) return null;
    var ws = pdWidgetsOf(pdCurrent.cfg) || [];
    return ws.find(function (w) { return w.id === id; }) || null;
  }

  /**
   * Post-render wiring for the table pagers. pageSizeOptions and the
   * first/last buttons are properties, not attributes, so they have to be set
   * from script. page-change also fires on the component's FIRST render —
   * re-rendering on that would loop, so only act when a value actually moved.
   */
  function pdHydrateTables() {
    document.querySelectorAll('[data-tbl-pager]').forEach(function (p) {
      if (p.__kxWired) return;
      p.__kxWired = true;
      var id = p.getAttribute('data-tbl-pager');
      var w = pdWidgetById(id);
      if (!w) return;
      var st = KXCharts.tableSettings(w);
      p.pageSizeOptions = KXCharts.TABLE_PAGE_SIZES;
      p.firstLastPageButtonToggle = false;   // too wide for a widget card
      p.pageSize = st.pageSize;
      p.page = st.page;
      p.addEventListener('page-change', function (e) {
        var d = e.detail || {};
        var cur = KXCharts.tableSettings(w);
        if (d.pageSize != null && d.pageSize !== cur.pageSize) {
          KXCharts.setLocalTable(id, 'pageSize', d.pageSize);
          window.KXHub.render();
          return;
        }
        if (d.page != null && d.page !== cur.page) {
          KXCharts.setTablePage(id, d.page);
          window.KXHub.render();
        }
      });
    });
  }

  // Every menu on the published dashboard is mutually exclusive: opening one
  // closes the rest. Centralised because there are now four of them, and the
  // pairwise resets this used to do missed a combination each time one was added.
  function pdCloseMenus(keep) {
    if (!(keep && keep.keepRange)) openRangeMenu = false;
    openDashMenu = false;
    openExportMenu = false;
    openWidgetMenu = null;
    if (!(keep && keep.keepCols)) KXCharts.setOpenCols(null);
  }

  window.KXHero = {
    coverageHero: coverageHero,
    complianceHero: complianceHero,
    publishedDashboard: publishedDashboard,
    setUnshared: setUnshared,
    setLoadFailure: setLoadFailure,
    computePulse: computePulse,
    wire: wire
  };
})();
