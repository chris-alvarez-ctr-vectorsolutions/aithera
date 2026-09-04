/* global window, document, KEYSTONE, KX, KXCanvas, AGENCY_INTEL */
/* ========================================================================
   agency-intel-explore.js — Data Explorer (admin-only, v2).
   ------------------------------------------------------------------------
   Ported from copilot-explore.jsx + SendReportModal/ReportStep in
   copilot-report.jsx.

   NOT IN V1. The Data Explorer tab only appears when the Future-functionality
   flag is on (see homeHtml() in agency-intel-page.js) — v1 ships Dashboards
   and AI access only. Everything below stays wired so the flag previews it.

   An open-ended exploration surface that does NOT have to end in a dashboard.
   Start from a blank prompt, or from a quick-start:

     · Uncover data correlations       — scans every metric pair that shares a
                                         categorical axis, ranks by |r|
     · Discover actionable opportunities — metrics moving the wrong way, plus
                                         where the problem concentrates
     · Summarize what changed recently

   Findings can be pinned to a new dashboard or sent out as a one-off report,
   but exploring for its own sake is the point — nothing is saved unless the
   admin says so.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CC = window.KEYSTONE_CUSTOM;
  var CP = window.AGENCY_INTEL;
  var esc = KX.esc, micon = KX.micon;

  /* =====================================================================
     SCANS
     ===================================================================== */

  // Pearson r for a set of {x, y} points.
  function corrR(points) {
    var n = points.length;
    if (n < 2) return 0;
    var mx = points.reduce(function (s, p) { return s + p.x; }, 0) / n;
    var my = points.reduce(function (s, p) { return s + p.y; }, 0) / n;
    var sxx = 0, syy = 0, sxy = 0;
    points.forEach(function (p) {
      sxx += Math.pow(p.x - mx, 2);
      syy += Math.pow(p.y - my, 2);
      sxy += (p.x - mx) * (p.y - my);
    });
    return (sxx && syy) ? sxy / Math.sqrt(sxx * syy) : 0;
  }

  // Every metric pair that shares a categorical axis, ranked by |r|. Pairs
  // reported on different breakdowns produce no spec and are skipped.
  var _corrCache = null;
  function scanCorrelations() {
    if (_corrCache) return _corrCache;
    var ids = CC.AVAILABLE_METRICS.map(function (m) { return m.id; });
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      for (var j = i + 1; j < ids.length; j++) {
        var spec = CC.buildCorrelationSpec([ids[i], ids[j]], 'scatter');
        if (!spec || !spec.points || spec.points.length < 3) continue;
        out.push({ a: ids[i], b: ids[j], r: corrR(spec.points) });
      }
    }
    _corrCache = out
      .filter(function (o) { return Math.abs(o.r) >= 0.35; })
      .sort(function (p, q) { return Math.abs(q.r) - Math.abs(p.r); });
    return _corrCache;
  }

  // Suggested next step per metric for the opportunities scan.
  var OPP_ACTIONS = {
    sick_leave: 'Redistribute coverage and check for burnout at the hardest-hit stations.',
    ot_trend: 'Review the schedule to curb overtime before it compounds.',
    overdue_inspections: 'Reassign inspection workload to clear the backlog.',
    equipment_failures: 'Prioritize preventive maintenance on the most-failing gear.',
    credential_expirations: 'Schedule renewals now, before credentials lapse.',
    apparatus_downtime: 'Escalate repairs on the most-affected apparatus.',
    response_time: 'Examine staffing and station placement in slow areas.',
    ceu_progress: 'Nudge the personnel who are furthest behind on CEUs.',
    incident_volume: 'Match crew capacity to the busiest stations.',
    policy_acks: 'Follow up on outstanding acknowledgments.'
  };

  var _oppCache = null;
  function scanOpportunities() {
    if (_oppCache) return _oppCache;
    var out = [];
    CC.AVAILABLE_METRICS.forEach(function (m) {
      var data = CC.METRIC_DATA[m.id];
      if (!data || !data.kpi) return;
      var tone = data.kpi.tone;
      // Only metrics moving the wrong way are opportunities.
      if (tone !== 'bad' && tone !== 'warn') return;
      var hot = null;
      if (data.bar && data.bar.length) {
        hot = data.bar.slice().sort(function (a, b) { return b.value - a.value; })[0];
      }
      out.push({
        metricId: m.id, label: m.label, icon: m.icon, tone: tone,
        value: data.kpi.num, delta: data.kpi.delta,
        hot: hot ? hot.label : null,
        action: OPP_ACTIONS[m.id] || 'Dig in to understand the driver and assign a follow-up.'
      });
    });
    var rank = { bad: 0, warn: 1 };
    _oppCache = out.sort(function (a, b) { return rank[a.tone] - rank[b.tone]; });
    return _oppCache;
  }

  /* =====================================================================
     STATE
     ===================================================================== */

  var state = {
    phase: 'start',     // start | results
    mode: null,         // correlations | opportunities | trends | ask
    query: '',
    submittedQ: ''
  };

  var QUICK_STARTS = [
    { id: 'correlations', icon: 'scatter_plot', title: 'Uncover data correlations',
      desc: 'Scan every metric pair and surface the strongest relationships, with a plain-English read.' },
    { id: 'opportunities', icon: 'lightbulb', title: 'Discover actionable opportunities',
      desc: 'Find the metrics moving the wrong way and where to focus first.' },
    { id: 'trends', icon: 'insights', title: 'Summarize what changed recently',
      desc: 'A quick brief on the biggest shifts across your connected apps.' }
  ];

  /* =====================================================================
     LANDING
     ===================================================================== */

  function startHtml() {
    return '<div style="max-width:760px;margin:0 auto;padding:8px 0 20px">' +
      '<div style="text-align:center;margin-bottom:22px">' + aiMark(52) +
      '<h2 style="font-family:var(--font-display);font-weight:600;font-size:27px;color:var(--ink-900);' +
      'margin:14px 0 6px">Explore your data</h2>' +
      '<p style="font-size:14px;color:var(--ink-500);margin:0;line-height:1.55">' +
      'Ask Agency Intelligence anything across your connected apps. Follow a thread wherever it leads — ' +
      'you don\'t have to build a dashboard.</p></div>' +

      '<div style="position:relative;margin-bottom:22px">' +
      '<vaadin-text-area theme="outlined" id="exQuery" style="width:100%" ' +
      'placeholder="e.g. Where is overtime rising fastest, and what\'s driving it?">' +
      esc(state.query) + '</vaadin-text-area>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:10px">' +
      '<vaadin-button theme="primary" id="exRun"' + (state.query.trim() ? '' : ' disabled') + '>' +
      micon('auto_awesome', { size: 16 }) +
      '<span class="kx-btn-label">Explore with Agency Intelligence</span></vaadin-button></div></div>' +

      '<div style="display:flex;align-items:center;gap:12px;margin:4px 0 16px">' +
      '<div style="flex:1;height:1px;background:var(--ink-100)"></div>' +
      '<span style="font-size:11.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;' +
      'color:var(--ink-400)">Or start with</span>' +
      '<div style="flex:1;height:1px;background:var(--ink-100)"></div></div>' +

      '<div style="display:flex;flex-direction:column;gap:10px">' +
      QUICK_STARTS.map(function (o) {
        return '<button class="ex-quickstart" data-ex-run="' + o.id + '">' +
          '<span class="ic">' + micon(o.icon, { size: 21, fill: 1 }) + '</span>' +
          '<span style="flex:1;min-width:0">' +
          '<span style="display:block;font-size:14.5px;font-weight:700;color:var(--ink-900)">' + esc(o.title) + '</span>' +
          '<span style="display:block;font-size:12.5px;color:var(--ink-500);line-height:1.5;margin-top:2px">' +
          esc(o.desc) + '</span></span>' +
          micon('arrow_forward', { size: 18, color: 'var(--ink-300)', style: 'align-self:center;flex-shrink:0' }) +
          '</button>';
      }).join('') + '</div></div>';
  }

  function aiMark(size) {
    size = size || 30;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  /* =====================================================================
     RESULTS
     ===================================================================== */

  function findingAction(o) {
    return '<button class="ex-action" data-ex-act="' + o.act + '" data-ex-arg="' + KX.attr(o.arg) +
      '" title="' + KX.attr(o.title) + '">' + micon(o.icon, { size: 13 }) + ' ' + esc(o.label) + '</button>';
  }

  function exploreCard(inner, tone) {
    return '<div class="ex-card"' + (tone ? ' style="border-left:3px solid ' + tone + '"' : '') + '>' + inner + '</div>';
  }

  function correlationsHtml() {
    var found = scanCorrelations();
    if (!found.length) {
      return exploreCard('<div style="font-size:13.5px;color:var(--ink-600)">' +
        'No strong correlations surfaced across the current data.</div>');
    }
    return '<div style="display:flex;flex-direction:column;gap:14px">' +
      found.slice(0, 4).map(function (f, i) {
        var widget = { id: 'exp_' + i, metricIds: [f.a, f.b], viz: 'scatter', state: 'live' };
        var la = CC.metricById(f.a).label, lb = CC.metricById(f.b).label;
        var tone = Math.abs(f.r) >= 0.6 ? 'var(--coral-400)' : 'var(--amber-400)';
        return exploreCard(
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
          micon('scatter_plot', { size: 18, fill: 1, color: 'var(--amber-600)' }) +
          '<span style="font-size:14px;font-weight:700;color:var(--ink-900);flex:1;min-width:0">' +
          esc(la) + ' &amp; ' + esc(lb) + '</span>' +
          findingAction({ act: 'send-corr', arg: i, icon: 'send', label: 'Send as report',
            title: 'Send this finding out without saving it' }) +
          findingAction({ act: 'pin-corr', arg: i, icon: 'push_pin', label: 'Pin to dashboard',
            title: 'Pin this to a new dashboard' }) +
          '</div>' +
          KXCanvas.widgetBody(widget), tone);
      }).join('') + '</div>';
  }

  function opportunitiesHtml() {
    var found = scanOpportunities();
    if (!found.length) {
      return exploreCard('<div style="font-size:13.5px;color:var(--ink-600)">' +
        'Nothing needs attention right now — every tracked metric is on track.</div>');
    }
    return '<div style="display:flex;flex-direction:column;gap:12px">' +
      found.map(function (o, i) {
        var tone = o.tone === 'bad' ? 'var(--coral-500)' : 'var(--amber-600)';
        var toneBg = o.tone === 'bad' ? 'var(--coral-50)' : 'var(--amber-50)';
        return exploreCard(
          '<div style="display:flex;gap:12px;align-items:flex-start">' +
          '<span style="width:38px;height:38px;border-radius:10px;background:' + toneBg + ';color:' + tone +
          ';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(o.icon, { size: 20, fill: 1 }) + '</span>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">' +
          '<span style="font-size:14.5px;font-weight:700;color:var(--ink-900)">' + esc(o.label) + '</span>' +
          '<span style="font-family:var(--font-mono);font-size:12px;color:' + tone + ';font-weight:600">' +
          esc(o.value) + ' · ' + esc(o.delta) + '</span>' +
          '<span style="margin-left:auto">' +
          findingAction({ act: 'send-opp', arg: i, icon: 'send', label: 'Send as report',
            title: 'Send this finding out without saving it' }) + '</span></div>' +
          (o.hot
            ? '<div style="font-size:12.5px;color:var(--ink-600);margin-top:3px">Concentrated at ' +
              '<b style="color:var(--ink-800)">' + esc(o.hot) + '</b>.</div>'
            : '') +
          '<div style="display:flex;gap:7px;align-items:flex-start;margin-top:8px;padding:9px 11px;' +
          'border-radius:9px;background:var(--surface-2);border:1px solid var(--ink-100)">' +
          micon('tips_and_updates', { size: 15, fill: 1, color: 'var(--amber-600)', style: 'flex-shrink:0;margin-top:1px' }) +
          '<span style="font-size:12.5px;line-height:1.5;color:var(--ink-800)">' + esc(o.action) + '</span>' +
          '</div></div></div>', tone);
      }).join('') + '</div>';
  }

  // A freeform ask routes to whichever scan the wording points at.
  function askHtml(q) {
    var s = (q || '').toLowerCase();
    if (/correl|relationship|relate|driv/.test(s)) return correlationsHtml();
    if (/opportun|action|improv|fix|reduce|focus|risk/.test(s)) return opportunitiesHtml();
    return exploreCard(
      '<div style="display:flex;gap:12px;align-items:flex-start">' + aiMark(30) +
      '<div style="font-size:13.5px;line-height:1.6;color:var(--ink-800)">' +
      'Here\'s what I found across your connected apps. Explore any thread below, or refine your question — ' +
      'nothing is saved unless you pin it.' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<span style="font-size:12.5px;color:var(--ink-500)">Try a quick-start to go deeper:</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      QUICK_STARTS.map(function (o) {
        return '<button class="ex-action" data-ex-run="' + o.id + '">' +
          micon(o.icon, { size: 13 }) + ' ' + esc(o.title) + '</button>';
      }).join('') + '</div></div></div>');
  }

  var HEADS = {
    correlations: { icon: 'scatter_plot', title: 'Correlations across your data' },
    opportunities: { icon: 'lightbulb', title: 'Opportunities to act on' },
    trends: { icon: 'insights', title: 'What changed recently' },
    ask: { icon: 'auto_awesome', title: 'Exploration' }
  };

  function resultsHtml() {
    var h = HEADS[state.mode] || HEADS.ask;
    var title = state.mode === 'ask' ? (state.submittedQ || h.title) : h.title;
    var body = state.mode === 'correlations' ? correlationsHtml()
      : state.mode === 'opportunities' ? opportunitiesHtml()
      : state.mode === 'trends' ? opportunitiesHtml()
      : askHtml(state.submittedQ);

    return '<div style="max-width:780px;margin:0 auto;padding:8px 0 24px">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<vaadin-button theme="secondary small" id="exReset">' + micon('arrow_back', { size: 15 }) +
      '<span class="kx-btn-label">New exploration</span></vaadin-button>' +
      '<span style="display:inline-flex;align-items:center;gap:8px;min-width:0">' +
      micon(h.icon, { size: 20, fill: 1, color: 'var(--amber-600)' }) +
      '<span style="font-family:var(--font-display);font-weight:600;font-size:20px;color:var(--ink-900);' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(title) + '</span></span></div>' +

      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12.5px;color:var(--ink-500)">' +
      aiMark(18) + ' Agency Intelligence explored your connected apps — nothing here is saved. ' +
      'Pin a finding to keep it as a dashboard, or send it out as a one-off report.</div>' +

      body + '</div>';
  }

  function html() {
    return '<div data-screen-label="Agency Intelligence — Data Explorer">' +
      (state.phase === 'start' ? startHtml() : resultsHtml()) + '</div>';
  }

  /* =====================================================================
     SEND-AS-REPORT DIALOG
     ---------------------------------------------------------------------
     A one-off delivery of a single finding — the same ReportStep the
     scheduling flow uses, defaulted to cadence "once".
     ===================================================================== */

  function openSendReport(title, widget) {
    var report = Object.assign({}, CP.defaultDelivery(), { cadence: 'once' });
    report.recipients = { titles: [], individuals: [], emails: [] };

    function reach() { return CP.reportReach(report); }
    function total() {
      var r = report.recipients;
      return r.titles.length + r.individuals.length + r.emails.length;
    }

    function cadenceGrid() {
      return CP.CADENCES.map(function (c) {
        var on = report.cadence === c.id;
        return '<button class="ex-cad' + (on ? ' is-on' : '') + '" data-sr-cad="' + KX.attr(c.id) +
          '" title="' + KX.attr(c.hint) + '">' +
          micon(c.icon, { size: 18, fill: on ? 1 : 0, color: on ? 'var(--amber-600)' : 'var(--ink-400)' }) +
          '<span style="font-size:12.5px;font-weight:700;color:var(--ink-900)">' + esc(c.label) + '</span>' +
          '<span style="font-size:10.5px;color:var(--ink-500);line-height:1.35">' + esc(c.hint) + '</span></button>';
      }).join('');
    }

    function titleChips() {
      return CP.JOB_TITLES.map(function (t) {
        var on = report.recipients.titles.indexOf(t.id) !== -1;
        return '<button class="ex-chip' + (on ? ' is-on' : '') + '" data-sr-title="' + KX.attr(t.id) + '">' +
          (on ? micon('check', { size: 13 }) : micon('badge', { size: 13 })) + ' ' + esc(t.label) +
          '<span style="opacity:0.6;margin-left:2px">' + t.count + '</span></button>';
      }).join('');
    }

    function peopleChips() {
      return (CP.INDIVIDUALS || []).slice(0, 10).map(function (p) {
        var on = report.recipients.individuals.indexOf(p.id) !== -1;
        return '<button class="ex-chip' + (on ? ' is-on' : '') + '" data-sr-person="' + KX.attr(p.id) + '">' +
          (on ? micon('check', { size: 13 }) : micon('person', { size: 13 })) + ' ' + esc(p.name) + '</button>';
      }).join('');
    }

    function emailChips() {
      return report.recipients.emails.map(function (e) {
        return '<span class="ex-chip is-on" style="cursor:default">' + micon('mail', { size: 13 }) + ' ' + esc(e) +
          '<button data-sr-email-rm="' + KX.attr(e) + '" aria-label="Remove" ' +
          'style="background:none;border:none;cursor:pointer;padding:0 0 0 4px;color:inherit;display:inline-flex">' +
          micon('close', { size: 12 }) + '</button></span>';
      }).join('');
    }

    function formatRadios() {
      return CP.REPORT_FORMATS.map(function (f) {
        var on = report.format === f.id;
        return '<button class="ex-fmt' + (on ? ' is-on' : '') + '" data-sr-fmt="' + KX.attr(f.id) + '">' +
          '<span class="radio">' + (on ? '<span class="dot"></span>' : '') + '</span>' +
          micon(f.icon, { size: 19, fill: 1, color: on ? 'var(--amber-600)' : 'var(--ink-400)' }) +
          '<span style="flex:1;min-width:0">' +
          '<span style="display:block;font-size:13px;font-weight:700;color:var(--ink-900)">' + esc(f.label) + '</span>' +
          '<span style="display:block;font-size:11.5px;color:var(--ink-500);margin-top:1px">' + esc(f.hint) + '</span>' +
          '</span></button>';
      }).join('');
    }

    var LBL = 'display:block;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;' +
      'color:var(--ink-500);margin-bottom:8px';

    var dlg = KX.openDialog({
      title: 'Set up the report',
      subtitle: 'Choose who receives “' + title + '”, how often, and in what shape. ' +
        'You can change or pause it any time.',
      icon: 'schedule_send',
      accent: 'var(--lumo-primary-color)',
      width: '620px',
      body:
        '<div id="srBody" style="display:flex;flex-direction:column;gap:20px">' +
        '<div><span style="' + LBL + '">How often</span>' +
        '<div id="srCad" style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px">' +
        cadenceGrid() + '</div></div>' +

        '<div><span style="' + LBL + '">Who gets it</span>' +
        '<div style="display:flex;flex-direction:column;gap:14px;padding:14px;border-radius:12px;' +
        'background:var(--surface-2);border:1px solid var(--ink-100)">' +
        '<div><div style="font-size:11.5px;font-weight:700;color:var(--ink-700);margin-bottom:7px">By job title</div>' +
        '<div id="srTitles" style="display:flex;flex-wrap:wrap;gap:6px">' + titleChips() + '</div></div>' +
        '<div><div style="font-size:11.5px;font-weight:700;color:var(--ink-700);margin-bottom:7px">Named people</div>' +
        '<div id="srPeople" style="display:flex;flex-wrap:wrap;gap:6px">' + peopleChips() + '</div></div>' +
        '<div><div style="font-size:11.5px;font-weight:700;color:var(--ink-700);margin-bottom:7px">' +
        'Outside the department</div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<vaadin-text-field theme="outlined small" id="srEmail" style="flex:1" ' +
        'placeholder="name@city.gov"></vaadin-text-field>' +
        '<vaadin-button theme="secondary small" id="srEmailAdd">Add</vaadin-button></div>' +
        '<div id="srEmails" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + emailChips() + '</div>' +
        '</div></div></div>' +

        '<div><span style="' + LBL + '">Format</span>' +
        '<div id="srFmt" style="display:flex;flex-direction:column;gap:7px">' + formatRadios() + '</div></div>' +

        '<label style="display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;' +
        'border:1px solid var(--ink-100);background:var(--surface-2);cursor:pointer">' +
        '<vaadin-checkbox id="srSummary" checked></vaadin-checkbox>' +
        '<span style="flex:1"><span style="display:block;font-weight:600;font-size:13px">' +
        'Include Agency Intelligence\'s written summary</span>' +
        '<span style="font-size:11.5px;color:var(--ink-500)">A short cover read of what changed this period, ' +
        'written fresh on every send.</span></span></label>' +

        // The reach/cadence summary lives in the body, not the dialog footer:
        // openDialog owns the footer node, and retro-fitting an id onto it was
        // fragile — a missing node silently blocked the whole refresh.
        '<div id="srFootNote" style="font-size:12.5px;color:var(--ink-600);padding-top:4px;' +
        'border-top:1px solid var(--ink-100)">No recipients yet</div>' +
        '</div>',
      onMount: function (body, d) {
        function refreshFooter() {
          var n = reach();
          var el = body.querySelector('#srFootNote');
          if (el) {
            el.innerHTML = total() === 0
              ? 'No recipients yet'
              : '<b style="color:var(--ink-900)">~' + n + '</b> recipient' + (n === 1 ? '' : 's') +
                '<span style="color:var(--ink-400)"> · </span>' +
                (report.cadence === 'once'
                  ? 'sends immediately'
                  : 'next ' + esc(report.nextSend || '') + ', then ' +
                    esc(CP.cadenceMeta(report.cadence).label.toLowerCase()));
          }
          // Button lookup and label are independent of the summary node, so a
          // missing element can never leave Send stuck disabled.
          var send = d.querySelector('#srSend') || document.getElementById('srSend');
          if (send) {
            if (total() === 0) send.setAttribute('disabled', ''); else send.removeAttribute('disabled');
            send.innerHTML = micon('send', { size: 16 }) +
              '<span class="kx-btn-label">' + (report.cadence === 'once' ? 'Send now' : 'Schedule') + '</span>';
          }
        }

        body.addEventListener('click', function (e) {
          var c = e.target.closest('[data-sr-cad]');
          if (c) {
            report.cadence = c.getAttribute('data-sr-cad');
            report.nextSend = CP.nextSendFrom(report.cadence);
            body.querySelector('#srCad').innerHTML = cadenceGrid();
            refreshFooter();
            return;
          }
          var t = e.target.closest('[data-sr-title]');
          if (t) {
            var tid = t.getAttribute('data-sr-title');
            var ti = report.recipients.titles.indexOf(tid);
            if (ti === -1) report.recipients.titles.push(tid); else report.recipients.titles.splice(ti, 1);
            body.querySelector('#srTitles').innerHTML = titleChips();
            refreshFooter();
            return;
          }
          var p = e.target.closest('[data-sr-person]');
          if (p) {
            var pid = p.getAttribute('data-sr-person');
            var pi = report.recipients.individuals.indexOf(pid);
            if (pi === -1) report.recipients.individuals.push(pid); else report.recipients.individuals.splice(pi, 1);
            body.querySelector('#srPeople').innerHTML = peopleChips();
            refreshFooter();
            return;
          }
          var rm = e.target.closest('[data-sr-email-rm]');
          if (rm) {
            var mail = rm.getAttribute('data-sr-email-rm');
            report.recipients.emails = report.recipients.emails.filter(function (x) { return x !== mail; });
            body.querySelector('#srEmails').innerHTML = emailChips();
            refreshFooter();
            return;
          }
          if (e.target.closest('#srEmailAdd')) {
            var field = body.querySelector('#srEmail');
            var v = (field.value || '').trim();
            if (v && report.recipients.emails.indexOf(v) === -1) {
              report.recipients.emails.push(v);
              field.value = '';
              body.querySelector('#srEmails').innerHTML = emailChips();
              refreshFooter();
            }
            return;
          }
          var f = e.target.closest('[data-sr-fmt]');
          if (f) {
            report.format = f.getAttribute('data-sr-fmt');
            body.querySelector('#srFmt').innerHTML = formatRadios();
            return;
          }
        });

        body.addEventListener('change', function (e) {
          if (e.target.id === 'srSummary') report.includeSummary = !!e.target.checked;
        });

        // Enter in the email field adds it.
        body.addEventListener('keydown', function (e) {
          if (e.target.id === 'srEmail' && e.key === 'Enter') {
            e.preventDefault();
            body.querySelector('#srEmailAdd').click();
          }
        });

        setTimeout(refreshFooter, 0);
      },
      actions: [
        { label: 'Cancel', theme: 'tertiary' },
        { label: 'Send now', theme: 'primary', icon: 'send', id: 'srSend', disabled: true, onClick: function () {
          if (total() === 0) return false;
          var n = reach();
          KX.pushToast({
            title: report.cadence === 'once' ? 'Report sent' : 'Report scheduled',
            body: '“' + title + '” went out to ~' + n + ' recipient' + (n === 1 ? '' : 's') +
              ' as a ' + CP.formatMeta(report.format).short + '.',
            icon: 'send', tone: 'success'
          });
        } }
      ]
    });

    return dlg;
  }

  /* =====================================================================
     ACTIONS
     ===================================================================== */

  function run(mode, q) {
    state.mode = mode;
    state.submittedQ = q || '';
    state.phase = 'results';
    window.scrollTo({ top: 0 });
    window.KXAgencyIntelPage.render();
  }

  function reset() {
    state.phase = 'start';
    state.mode = null;
    state.submittedQ = '';
    window.scrollTo({ top: 0 });
    window.KXAgencyIntelPage.render();
  }

  // Delegated once on document — the Explorer renders inside #root, but its
  // Send-report dialog lands in an overlay on <body>.
  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;

    document.addEventListener('click', function (e) {
      var qs = e.target.closest('[data-ex-run]');
      if (qs) { run(qs.getAttribute('data-ex-run')); return; }
      if (e.target.closest('#exRun')) {
        var q = state.query.trim();
        if (q) run('ask', q);
        return;
      }
      if (e.target.closest('#exReset')) { reset(); return; }

      var act = e.target.closest('[data-ex-act]');
      if (act) {
        var kind = act.getAttribute('data-ex-act');
        var idx = +act.getAttribute('data-ex-arg');
        if (kind === 'pin-corr') {
          var f = scanCorrelations()[idx];
          var la = CC.metricById(f.a).label, lb = CC.metricById(f.b).label;
          // Pinning creates a brand-new dashboard seeded with this finding.
          window.KXAgencyIntelPage.createDashboardWith(
            [CP.newWidget({ metricIds: [f.a, f.b], viz: 'scatter' })],
            la + ' × ' + lb
          );
          return;
        }
        if (kind === 'send-corr') {
          var fc = scanCorrelations()[idx];
          openSendReport(
            CC.metricById(fc.a).label + ' × ' + CC.metricById(fc.b).label,
            { id: 'exp_' + idx, metricIds: [fc.a, fc.b], viz: 'scatter', state: 'live' }
          );
          return;
        }
        if (kind === 'send-opp') {
          var o = scanOpportunities()[idx];
          openSendReport(o.label, { id: 'exp_' + o.metricId, metricId: o.metricId, viz: 'bar', state: 'live' });
          return;
        }
      }
    });

    // The prompt field: keep state without re-rendering (that would drop focus),
    // and just toggle the run button's disabled state.
    document.addEventListener('value-changed', function (e) {
      if (e.target.id !== 'exQuery') return;
      state.query = e.detail.value || '';
      var btn = document.getElementById('exRun');
      if (btn) {
        if (state.query.trim()) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', '');
      }
    });

    // Cmd/Ctrl+Enter runs the exploration from the prompt.
    document.addEventListener('keydown', function (e) {
      if (e.target.id === 'exQuery' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        var q = state.query.trim();
        if (q) run('ask', q);
      }
    });
  }

  wire();

  window.KXExplore = {
    html: html,
    state: state,
    scanCorrelations: scanCorrelations,
    scanOpportunities: scanOpportunities,
    openSendReport: openSendReport
  };
})();
