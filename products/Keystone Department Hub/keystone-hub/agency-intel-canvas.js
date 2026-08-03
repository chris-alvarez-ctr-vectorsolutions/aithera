/* global window, document, KEYSTONE, KX, KXCharts */
/* ========================================================================
   agency-intel-canvas.js — dashboard-canvas widget rendering for the Agency Intelligence page.
   ------------------------------------------------------------------------
   Ported from copilot-widgets.jsx. A "widget" is a spec the canvas renders:

     { id, metricId | metricIds[], viz, w, dateRange, include, state, kind }

   `state` drives the lifecycle chrome:
     loading    → shimmer skeleton
     refreshing → the live chart under a "Refreshing…" veil
     access     → "Access required" (the audience lacks the source entitlement)
     nodata     → "No data for this query"
     live       → the chart

   Canvas-scale viz set (larger than the mini/inline scales in charts.js):
     kpi · bar · pair · scatter · line · stack · donut · table ·
     metrics_table · summary · text
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CC = window.KEYSTONE_CUSTOM;
  var esc = KX.esc, micon = KX.micon;

  var TONE = {
    bad: 'var(--coral-500)', warn: 'var(--amber-600)',
    good: 'var(--teal-500)', neutral: 'var(--ink-800)'
  };
  function toneColor(t) { return TONE[t] || TONE.neutral; }

  /* =====================================================================
     VIZ RENDERERS
     ===================================================================== */

  function vizKpi(spec) {
    return '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<div style="display:flex;align-items:baseline;gap:6px">' +
      '<span style="font-family:var(--font-numeric);font-weight:700;font-size:42px;line-height:1;' +
      'letter-spacing:-1.5px;color:' + toneColor(spec.tone) + ';font-variant-numeric:tabular-nums">' +
      esc(spec.num) + '</span>' +
      (spec.unit ? '<span style="font-size:14px;font-weight:600;color:var(--ink-500)">' + esc(spec.unit) + '</span>' : '') +
      '</div>' +
      (spec.delta ? '<div style="font-size:12.5px;color:var(--ink-500);font-weight:500">' + esc(spec.delta) + '</div>' : '') +
      '</div>';
  }

  function vizBar(spec) {
    var data = spec.data || [];
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    return '<div style="display:flex;flex-direction:column;gap:9px">' +
      data.map(function (d) {
        var worst = d.value === max && max > 0;
        return '<div style="display:flex;align-items:center;gap:10px;font-size:12.5px">' +
          '<span style="width:72px;flex-shrink:0;color:var(--ink-600);font-weight:500;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis">' + esc(d.label) + '</span>' +
          '<div style="flex:1;height:18px;background:var(--ink-100);border-radius:5px;overflow:hidden">' +
          '<div style="width:' + (d.value / max * 100) + '%;height:100%;border-radius:5px;transition:width .6s;background:' +
          (worst ? 'var(--coral-300)' : 'var(--teal-300)') + '"></div></div>' +
          '<span style="width:38px;text-align:right;font-family:var(--font-numeric);font-weight:700;' +
          'color:var(--ink-700);font-variant-numeric:tabular-nums">' + esc(d.value) + '</span></div>';
      }).join('') + '</div>';
  }

  // Paired bars — two metrics side by side on a shared category axis.
  function vizPair(spec) {
    var data = spec.data || [];
    var labels = spec.labels || [];
    var colors = ['var(--amber-400)', 'var(--teal-300)'];
    var vals = [];
    data.forEach(function (d) { vals.push(d.a, d.b); });
    var max = Math.max.apply(null, vals) * 1.05 || 1;
    return '<div>' +
      KXCharts.chartLegend(labels.slice(0, 2).map(function (l, i) { return { label: l, color: colors[i] }; })) +
      '<div style="display:flex;flex-direction:column;gap:11px">' +
      data.map(function (d) {
        return '<div style="display:flex;align-items:center;gap:10px;font-size:12px">' +
          '<span style="width:66px;flex-shrink:0;color:var(--ink-600);font-weight:500;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis">' + esc(d.label) + '</span>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:3px;min-width:0">' +
          [d.a, d.b].map(function (v, i) {
            return '<div style="display:flex;align-items:center;gap:7px">' +
              '<div style="flex:1;height:9px;background:var(--ink-100);border-radius:3px;overflow:hidden">' +
              '<div style="width:' + (v / max * 100) + '%;height:100%;background:' + colors[i] + '"></div></div>' +
              '<span style="width:32px;text-align:right;font-family:var(--font-numeric);font-size:11px;' +
              'font-weight:700;color:var(--ink-600);font-variant-numeric:tabular-nums">' + v + '</span></div>';
          }).join('') +
          '</div></div>';
      }).join('') + '</div></div>';
  }

  // Pearson r over the plotted points — the scatter's headline sentence
  // states the relationship in words so the chart isn't the only read.
  function pearson(points) {
    var n = points.length;
    if (n < 3) return 0;
    var sx = 0, sy = 0;
    points.forEach(function (p) { sx += p.x; sy += p.y; });
    var mx = sx / n, my = sy / n;
    var num = 0, dx = 0, dy = 0;
    points.forEach(function (p) {
      num += (p.x - mx) * (p.y - my);
      dx += (p.x - mx) * (p.x - mx);
      dy += (p.y - my) * (p.y - my);
    });
    var den = Math.sqrt(dx * dy);
    return den ? num / den : 0;
  }

  function scatterSentence(r, xLabel, yLabel) {
    var mag = Math.abs(r);
    var strength = mag >= 0.7 ? 'strong' : mag >= 0.4 ? 'moderate' : mag >= 0.2 ? 'weak' : 'no meaningful';
    var dir = r > 0 ? 'positive' : 'negative';
    if (strength === 'no meaningful') {
      return 'No meaningful relationship between ' + xLabel + ' and ' + yLabel + ' in this data.';
    }
    return 'A ' + strength + ' ' + dir + ' relationship: as ' + xLabel +
      (r > 0 ? ' rises, ' : ' rises, ') + yLabel + (r > 0 ? ' tends to rise too.' : ' tends to fall.');
  }

  function vizScatter(spec) {
    var pts = spec.points || [];
    if (pts.length < 3) return noDataState();
    var W = 380, H = 210, P = 40;
    var xs = pts.map(function (p) { return p.x; });
    var ys = pts.map(function (p) { return p.y; });
    var xLo = Math.min.apply(null, xs), xHi = Math.max.apply(null, xs);
    var yLo = Math.min.apply(null, ys), yHi = Math.max.apply(null, ys);
    var padX = (xHi - xLo) * 0.12 || 1, padY = (yHi - yLo) * 0.12 || 1;
    xLo -= padX; xHi += padX; yLo -= padY; yHi += padY;
    var sx = function (v) { return P + (W - P - 12) * ((v - xLo) / (xHi - xLo)); };
    var sy = function (v) { return (H - P) - (H - P - 14) * ((v - yLo) / (yHi - yLo)); };

    var r = pearson(pts);
    // Least-squares trend line across the plotted range.
    var n = pts.length;
    var mx = xs.reduce(function (a, b) { return a + b; }, 0) / n;
    var my = ys.reduce(function (a, b) { return a + b; }, 0) / n;
    var num = 0, den = 0;
    pts.forEach(function (p) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) * (p.x - mx); });
    var slope = den ? num / den : 0;
    var intercept = my - slope * mx;
    var trend = '<line x1="' + sx(xLo) + '" y1="' + sy(slope * xLo + intercept) + '" x2="' + sx(xHi) +
      '" y2="' + sy(slope * xHi + intercept) + '" stroke="var(--amber-400)" stroke-width="1.5" ' +
      'stroke-dasharray="5 3" opacity="0.9"/>';

    var grid = [0, 0.5, 1].map(function (t) {
      var y = (H - P) - (H - P - 14) * t;
      var v = Math.round(yLo + (yHi - yLo) * t);
      return '<line x1="' + P + '" x2="' + (W - 12) + '" y1="' + y + '" y2="' + y +
        '" stroke="var(--ink-100)" stroke-width="1"/>' +
        '<text x="' + (P - 6) + '" y="' + (y + 3) + '" font-size="9" fill="var(--ink-400)" text-anchor="end">' + v + '</text>';
    }).join('');

    return '<div>' +
      '<div style="font-size:12.5px;color:var(--ink-700);line-height:1.5;margin-bottom:10px">' +
      esc(scatterSentence(r, spec.xLabel, spec.yLabel)) +
      ' <span style="font-family:var(--font-mono);color:var(--ink-500)">r = ' + r.toFixed(2) + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      grid + trend +
      pts.map(function (p) {
        return '<circle cx="' + sx(p.x) + '" cy="' + sy(p.y) + '" r="5" fill="var(--teal-300)" ' +
          'stroke="var(--teal-500)" stroke-width="1.5"><title>' + esc(p.label) + ': ' +
          esc(spec.xLabel) + ' ' + p.x + ', ' + esc(spec.yLabel) + ' ' + p.y + '</title></circle>' +
          '<text x="' + sx(p.x) + '" y="' + (sy(p.y) - 9) + '" font-size="8.5" fill="var(--ink-500)" ' +
          'text-anchor="middle">' + esc(p.label) + '</text>';
      }).join('') +
      '<text x="' + (W / 2) + '" y="' + (H - 4) + '" font-size="9.5" fill="var(--ink-500)" text-anchor="middle">' +
      esc(spec.xLabel) + (spec.xUnit ? ' (' + esc(spec.xUnit) + ')' : '') + '</text>' +
      '<text x="10" y="' + (H / 2) + '" font-size="9.5" fill="var(--ink-500)" text-anchor="middle" ' +
      'transform="rotate(-90 10 ' + (H / 2) + ')">' + esc(spec.yLabel) +
      (spec.yUnit ? ' (' + esc(spec.yUnit) + ')' : '') + '</text>' +
      '</svg></div>';
  }

  function vizLine(spec) {
    // Dual-series correlation line vs. a single series.
    if (spec.series) {
      var colors = ['var(--amber-400)', 'var(--teal-400)'];
      var W = 380, H = 190, P = 30;
      var allY = [];
      spec.series.forEach(function (s) { s.data.forEach(function (d) { allY.push(d.y); }); });
      var lo = Math.min.apply(null, allY), hi = Math.max.apply(null, allY);
      var pad = (hi - lo) * 0.12 || 1;
      lo -= pad; hi += pad;
      var paths = spec.series.map(function (s, i) {
        var step = (W - P * 2) / Math.max(1, s.data.length - 1);
        var pts = s.data.map(function (d, j) {
          return [P + step * j, P + (H - P * 2) * (1 - (d.y - lo) / (hi - lo))];
        });
        return '<path d="' + pts.map(function (p, j) { return (j ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') +
          '" fill="none" stroke="' + colors[i] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
          pts.map(function (p) {
            return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + colors[i] + '"/>';
          }).join('');
      }).join('');
      var xLabels = spec.series[0].data.map(function (d, j) {
        var step = (W - P * 2) / Math.max(1, spec.series[0].data.length - 1);
        return '<text x="' + (P + step * j) + '" y="' + (H - 6) + '" font-size="9" fill="var(--ink-500)" ' +
          'text-anchor="middle">' + esc(d.x) + '</text>';
      }).join('');
      return '<div>' +
        KXCharts.chartLegend((spec.labels || []).slice(0, 2).map(function (l, i) { return { label: l, color: colors[i] }; })) +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
        [0, 0.5, 1].map(function (t) {
          var y = P + (H - P * 2) * t;
          return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y +
            '" stroke="var(--ink-100)" stroke-width="1"/>' +
            '<text x="' + (P - 5) + '" y="' + (y + 3) + '" font-size="9" fill="var(--ink-400)" text-anchor="end">' +
            Math.round(hi - (hi - lo) * t) + '</text>';
        }).join('') + paths + xLabels + '</svg></div>';
    }
    return KXCharts.pdLine(spec.data || [], 'var(--teal-400)', spec.unit === '%' ? '%' : '');
  }

  function vizStack(spec) {
    var legend = (spec.legend || []).map(function (l, i) {
      return { label: l, color: i === 0 ? 'var(--coral-400)' : 'var(--teal-300)' };
    });
    return '<div>' + KXCharts.chartLegend(legend) +
      '<div style="display:flex;flex-direction:column;gap:9px">' +
      (spec.data || []).map(function (d) {
        var total = d.a + d.b + (d.c || 0);
        return '<div><div style="display:flex;justify-content:space-between;font-size:11.5px;' +
          'color:var(--ink-700);margin-bottom:4px">' +
          '<span style="font-weight:500">' + esc(d.label) + '</span>' +
          '<span style="font-family:var(--font-mono);color:var(--coral-500)">' + d.a +
          ' <span style="color:var(--ink-400)">/ ' + total + '</span></span></div>' +
          '<div style="height:12px;border-radius:6px;background:var(--ink-100);overflow:hidden;display:flex">' +
          '<div style="width:' + (d.a / total * 100) + '%;background:var(--coral-400)"></div>' +
          '<div style="flex:1;background:var(--teal-300);opacity:0.5"></div></div></div>';
      }).join('') + '</div></div>';
  }

  function vizDonut(spec) { return KXCharts.pdDonut(spec.data || [], null); }

  function vizTable(spec) { return KXCharts.pdTable(spec.cols || [], spec.rows || []); }

  // Cross-metric read: one row per metric with its value, change, and a plain
  // status word. Lets a dashboard read as a report rather than a wall of charts.
  function vizMetricsTable(spec) {
    var rows = spec.rows || [];
    if (!rows.length) {
      return noDataState('No metrics selected', 'Pick the metrics this summary table should cover.');
    }
    return '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr>' +
      ['Metric', 'Now', 'Change', 'Status'].map(function (c, i) {
        return '<th style="text-align:' + (i === 0 ? 'left' : i === 3 ? 'right' : 'right') + ';padding:6px 8px;' +
          'color:var(--ink-500);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:0.4px;' +
          'border-bottom:1px solid var(--ink-100)">' + c + '</th>';
      }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, i) {
        var last = i === rows.length - 1;
        var bd = last ? 'none' : '1px solid var(--ink-100)';
        return '<tr>' +
          '<td style="padding:8px;border-bottom:' + bd + '">' +
          '<span style="display:inline-flex;align-items:center;gap:8px">' +
          '<span style="width:22px;height:22px;border-radius:6px;background:var(--amber-100);color:var(--amber-700);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(r.icon, { size: 13, fill: 1 }) + '</span>' +
          '<span style="font-weight:600;color:var(--ink-800)">' + esc(r.label) + '</span></span></td>' +
          '<td style="padding:8px;text-align:right;border-bottom:' + bd + ';font-family:var(--font-numeric);' +
          'font-weight:700;color:' + toneColor(r.tone) + '">' + esc(r.num) + '</td>' +
          '<td style="padding:8px;text-align:right;border-bottom:' + bd + ';color:var(--ink-500);font-size:11.5px">' +
          esc(r.delta) + '</td>' +
          '<td style="padding:8px;text-align:right;border-bottom:' + bd + '">' +
          '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;' +
          'font-size:11px;font-weight:700;background:' +
          (r.tone === 'bad' ? 'var(--coral-50)' : r.tone === 'warn' ? 'var(--amber-50)' :
            r.tone === 'good' ? 'var(--teal-50)' : 'var(--surface-3)') + ';color:' + toneColor(r.tone) + '">' +
          esc(r.status) + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }

  // Narrative summary of a single metric — the "explain it to me" block.
  function vizSummary(metricId) {
    var text = window.AGENCY_INTEL.summaryText
      ? window.AGENCY_INTEL.summaryText(metricId)
      : 'No summary available for this metric.';
    return '<div style="font-size:13px;color:var(--ink-700);line-height:1.6">' +
      String(text).split('**').map(function (p, i) {
        return i % 2 ? '<strong style="color:var(--ink-900)">' + esc(p) + '</strong>' : esc(p);
      }).join('') + '</div>';
  }

  // Editable prose block — the only widget the owner types into directly.
  function vizText(widget, editable) {
    // `body` is the canonical key — it's what the seed data, the report/CSV
    // export and the builder all write. (`text` is tolerated as a fallback.)
    var body = widget.body || widget.text || '';
    if (editable) {
      // The value goes on the attribute, not in the light DOM — vaadin-text-area
      // reads `value`, so slotted text content would render as an empty field.
      return '<vaadin-text-area theme="outlined" class="cpw-text" data-text-widget="' + KX.attr(widget.id) +
        '" style="width:100%" placeholder="Add context, a caveat, or the ask — this block travels with the report."' +
        ' value="' + KX.attr(body) + '"></vaadin-text-area>';
    }
    return body
      ? '<div style="font-size:13px;color:var(--ink-700);line-height:1.6;white-space:pre-wrap">' + esc(body) + '</div>'
      : '<div style="font-size:12.5px;color:var(--ink-400);font-style:italic">No text yet.</div>';
  }

  /* =====================================================================
     LIFECYCLE STATES
     ===================================================================== */

  function skeleton() {
    var bars = [0, 1, 2, 3].map(function (i) {
      return '<div class="cpw-shimmer" style="height:14px;width:' + (90 - i * 12) + '%;border-radius:6px"></div>';
    }).join('');
    return '<div style="padding:8px 0;display:flex;flex-direction:column;gap:10px" aria-busy="true">' + bars +
      '<div class="cpw-shimmer" style="height:70px;width:100%;border-radius:8px;margin-top:4px"></div></div>';
  }

  function accessRequiredState(widget) {
    var srcs = window.AGENCY_INTEL.widgetSources(widget)
      .map(function (s) { return K.SOURCES[s] ? K.SOURCES[s].name : null; }).filter(Boolean);
    return '<div style="padding:22px 14px;text-align:center;background:var(--surface-2);border-radius:10px;' +
      'border:1px dashed var(--ink-200)">' +
      '<span style="width:40px;height:40px;border-radius:10px;background:var(--amber-50);color:var(--amber-600);' +
      'display:inline-flex;align-items:center;justify-content:center">' + micon('lock', { size: 20, fill: 1 }) + '</span>' +
      '<div style="font-size:13.5px;font-weight:700;color:var(--ink-800);margin-top:8px">Access required</div>' +
      '<div style="font-size:12px;color:var(--ink-500);margin-top:3px;line-height:1.5;max-width:320px;margin-inline:auto">' +
      'This widget reads from <b>' + esc(srcs.join(' & ') || 'a source') + '</b>, which isn\'t in your data ' +
      'permissions. Ask an administrator to grant access.</div></div>';
  }

  function noDataState(title, body) {
    return '<div style="padding:22px 14px;text-align:center">' +
      '<span style="width:40px;height:40px;border-radius:10px;background:var(--surface-3);color:var(--ink-400);' +
      'display:inline-flex;align-items:center;justify-content:center">' + micon('search_off', { size: 20 }) + '</span>' +
      '<div style="font-size:13.5px;font-weight:700;color:var(--ink-800);margin-top:8px">' +
      esc(title || 'No data for this query') + '</div>' +
      '<div style="font-size:12px;color:var(--ink-500);margin-top:3px;line-height:1.5;max-width:320px;margin-inline:auto">' +
      esc(body || 'Agency Intelligence understood the question, but no connected app carries this data yet. ' +
        'Connect a source and it\'ll populate automatically.') + '</div></div>';
  }

  /* =====================================================================
     SPEC BUILD + BODY
     ===================================================================== */

  function buildWidgetSpec(widget) {
    if (widget.kind === 'text' || widget.viz === 'text') return { viz: 'text' };
    if (widget.viz === 'metrics_table') return CC.buildMetricsTableSpec(widget.metricIds || []);
    if (widget.kind === 'summary') return { viz: 'summary', metricId: widget.metricId };
    if (widget.metricIds && widget.metricIds.length >= 2) {
      // A null correlation spec means the two metrics don't share a category
      // axis — surface that rather than silently falling back to one metric.
      if (widget.viz === 'pair') return CC.buildCorrelationSpec(widget.metricIds, 'pair');
      if (widget.viz === 'scatter') return CC.buildCorrelationSpec(widget.metricIds, 'scatter');
      if (widget.viz === 'line') return CC.buildCorrelationSpec(widget.metricIds, 'line');
      return CC.buildSpec(widget.metricIds[0], widget.viz);
    }
    return CC.buildSpec(widget.metricId, widget.viz, { include: widget.include });
  }

  function widgetBody(widget, opts) {
    opts = opts || {};
    if (widget.state === 'loading') return skeleton();
    if (widget.state === 'access') return accessRequiredState(widget);
    if (widget.state === 'nodata') return noDataState();

    var spec = buildWidgetSpec(widget);
    if (!spec) {
      return (widget.metricIds && widget.metricIds.length >= 2)
        ? noDataState('These measures don\'t share a breakdown',
            'They\'re reported on different axes, so there\'s no common ground to plot them against. ' +
            'Pick two that break down the same way — by station, for instance.')
        : noDataState();
    }

    var viz = widget.viz, inner;
    if (viz === 'text') inner = vizText(widget, opts.editable);
    else if (viz === 'metrics_table') inner = vizMetricsTable(spec);
    else if (viz === 'summary') inner = vizSummary(widget.metricId);
    else if (viz === 'kpi') inner = vizKpi(spec);
    else if (viz === 'bar') inner = vizBar(spec);
    else if (viz === 'pair') inner = vizPair(spec);
    else if (viz === 'scatter') inner = vizScatter(spec);
    else if (viz === 'line') inner = vizLine(spec);
    else if (viz === 'stack') inner = vizStack(spec);
    else if (viz === 'donut') inner = vizDonut(spec);
    else if (viz === 'table') inner = vizTable(spec);
    else inner = vizBar(spec);

    return '<div style="position:relative">' + inner +
      (widget.state === 'refreshing'
        ? '<div style="position:absolute;inset:-4px;background:rgba(255,255,255,0.62);border-radius:10px;' +
          'display:flex;align-items:center;justify-content:center;gap:8px">' +
          '<span class="spinner" style="border-top-color:var(--amber-500)"></span>' +
          '<span style="font-size:12px;font-weight:600;color:var(--ink-600)">Refreshing…</span></div>'
        : '') +
      '</div>';
  }

  /* =====================================================================
     DATE-RANGE CONTROL
     ---------------------------------------------------------------------
     The owner's choice persists; a viewer can change it to explore, but the
     change stays local and is flagged as unsaved. `openRange` / `localRange`
     are module state keyed by widget id, since the canvas re-renders wholesale.
     ===================================================================== */

  var openRange = null;
  var localRange = {};

  function dateRangeControl(widget, canSave) {
    var saved = widget.dateRange || window.AGENCY_INTEL.DEFAULT_RANGE;
    var local = localRange[widget.id];
    var dirty = local != null && local !== saved;
    var current = dirty ? local : saved;

    return '<span style="position:relative;display:inline-flex;min-width:0;max-width:100%">' +
      '<button data-range-open="' + KX.attr(widget.id) + '" class="kx-range-btn' + (dirty ? ' is-dirty' : '') + '" ' +
      'title="' + (canSave
        ? 'Set the default date range for this widget'
        : 'Change date range (exploring — only the owner can save the default)') + '">' +
      micon('calendar_today', { size: 13 }) +
      '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      esc(window.AGENCY_INTEL.rangeLabel(current)) + '</span>' +
      (dirty ? '<span title="Unsaved — exploring" style="width:5px;height:5px;border-radius:99px;' +
        'background:var(--amber-500);flex-shrink:0"></span>' : '') +
      micon('expand_more', { size: 14 }) + '</button>' +
      (dirty ? '<button data-range-clear="' + KX.attr(widget.id) + '" title="Reset to the saved default" ' +
        'style="margin-left:2px;background:none;border:none;color:var(--lumo-primary-text-color);font-size:11px;' +
        'font-weight:600;cursor:pointer;font-family:inherit">Reset</button>' : '') +
      (openRange === widget.id
        ? '<div class="kx-menu kx-menu--left" style="width:200px;top:calc(100% + 4px)">' +
          window.AGENCY_INTEL.DATE_RANGES.map(function (r) {
            return '<button class="kx-menu-row" data-range-set="' + KX.attr(widget.id) + '" data-range-val="' +
              KX.attr(r.value) + '">' +
              micon('calendar_today', { size: 14, color: r.value === current ? 'var(--amber-600)' : 'var(--ink-400)' }) +
              '<span class="label">' + esc(r.label) + '</span>' +
              (r.value === current ? micon('check', { size: 14, color: 'var(--amber-600)' }) : '') + '</button>';
          }).join('') +
          (!canSave
            ? '<div style="display:flex;gap:6px;padding:7px 8px 3px;margin-top:4px;border-top:1px solid var(--ink-100);' +
              'font-size:10.5px;color:var(--ink-400);line-height:1.45">' + micon('info', { size: 13 }) +
              '<span>Only the dashboard owner can save this as the default.</span></div>'
            : '') +
          '</div>'
        : '') +
      '</span>';
  }

  /* =====================================================================
     WIDGET CARD
     ===================================================================== */

  var openMenu = null;

  var SIZE_OPTIONS = [
    { w: 4, label: 'Third' },
    { w: 6, label: 'Half' },
    { w: 8, label: 'Two-thirds' },
    { w: 12, label: 'Full width' }
  ];

  function widgetCard(widget, o) {
    o = o || {};
    var editable = !!o.editable;
    var title = window.AGENCY_INTEL.widgetTitle(widget);
    var icon = window.AGENCY_INTEL.widgetIcon(widget);
    var srcs = window.AGENCY_INTEL.widgetSources(widget).map(function (s) { return KX.srcChip(s); }).join('');
    var supportsRange = window.AGENCY_INTEL.widgetSupportsRange(widget);
    var selected = o.selected;

    var menu = openMenu === widget.id
      ? '<div class="kx-menu kx-menu--right" style="width:210px">' +
        '<button class="kx-menu-row" data-w-ask="' + KX.attr(widget.id) + '">' +
        micon('auto_awesome', { size: 16 }) + '<span class="label">Ask Agency Intelligence to change…</span></button>' +
        '<div class="kx-menu-label">Width</div>' +
        SIZE_OPTIONS.map(function (s) {
          return '<button class="kx-menu-row" data-w-size="' + KX.attr(widget.id) + '" data-w-size-val="' + s.w + '">' +
            micon(s.w === 12 ? 'width_full' : 'width_normal', { size: 16 }) +
            '<span class="label">' + s.label + '</span>' +
            ((widget.w || 6) === s.w ? micon('check', { size: 14, color: 'var(--amber-600)' }) : '') + '</button>';
        }).join('') +
        '<div class="kx-menu-divider"></div>' +
        '<div class="kx-menu-label">Export</div>' +
        '<button class="kx-menu-row" data-w-pdf="' + KX.attr(widget.id) + '">' +
        micon('picture_as_pdf', { size: 16 }) + '<span class="label">Export as PDF</span></button>' +
        '<button class="kx-menu-row" data-w-csv="' + KX.attr(widget.id) + '">' +
        micon('table_view', { size: 16 }) + '<span class="label">Export as CSV</span></button>' +
        '<div class="kx-menu-divider"></div>' +
        '<button class="kx-menu-row" data-w-remove="' + KX.attr(widget.id) + '" style="color:var(--coral-500)">' +
        micon('delete', { size: 16 }) + '<span class="label">Remove widget</span></button>' +
        '</div>'
      : '';

    return '<div class="cpw-card' + (selected ? ' is-selected' : '') + '" data-widget-id="' + KX.attr(widget.id) + '" ' +
      'style="grid-column:span ' + (widget.w || 6) + '" tabindex="0">' +
      '<div class="cpw-card-head">' +
      '<span class="cpw-icon">' + micon(icon, { size: 15, fill: 1 }) + '</span>' +
      '<span class="cpw-title">' + esc(title) + '</span>' +
      '<span style="display:flex;gap:6px;flex-shrink:0">' + srcs + '</span>' +
      (editable
        ? '<span style="position:relative;margin-left:auto;flex-shrink:0">' +
          '<button class="cpw-kebab" data-w-menu="' + KX.attr(widget.id) + '" aria-label="Widget options">' +
          micon('more_vert', { size: 18 }) + '</button>' + menu + '</span>'
        : '<span style="margin-left:auto"></span>') +
      '</div>' +
      (supportsRange ? '<div class="cpw-range">' + dateRangeControl(widget, editable) + '</div>' : '') +
      '<div class="cpw-body">' + widgetBody(widget, { editable: editable, interactive: true }) + '</div>' +
      '</div>';
  }

  window.KXCanvas = {
    widgetCard: widgetCard,
    widgetBody: widgetBody,
    buildWidgetSpec: buildWidgetSpec,
    dateRangeControl: dateRangeControl,
    noDataState: noDataState,
    SIZE_OPTIONS: SIZE_OPTIONS,
    // Menu/range state accessors so the page layer can drive them.
    setOpenMenu: function (id) { openMenu = id; },
    getOpenMenu: function () { return openMenu; },
    setOpenRange: function (id) { openRange = id; },
    getOpenRange: function () { return openRange; },
    setLocalRange: function (id, v) { if (v == null) delete localRange[id]; else localRange[id] = v; }
  };
})();
