/* global window, document */
/* ========================================================================
   charts.js — SVG/CSS chart renderers shared by the Hub's Agency Intelligence card, the
   published-dashboard heroes, and the Agency Intelligence Dashboard page.
   ------------------------------------------------------------------------
   Ported from copilot.jsx (inline charts + mini viz) and
   published-dashboard.jsx (widget-scale viz). Everything returns an HTML
   string; no framework, no chart library.

   Three scales:
     · mini*   — widget-tile scale (~150×50), used in the widgets rail
     · inline* — chat-bubble scale (~360×150), used in Agency Intelligence answers
     · pd*     — published-dashboard scale (~380×148)
   ======================================================================== */

(function () {
  'use strict';

  var esc = window.KX.esc;
  var micon = window.KX.micon;

  // SVG gradient ids must be unique per instance or the browser reuses the
  // first definition it saw. A monotonic counter beats Math.random here —
  // it's deterministic, which keeps re-renders diff-stable.
  var uid = 0;
  function nextId(prefix) { return prefix + '-' + (++uid); }

  var TONE_FG = {
    bad: 'var(--coral-500)',
    warn: 'var(--amber-600)',
    good: 'var(--teal-500)',
    neutral: 'var(--ink-800)'
  };

  /* =====================================================================
     MINI SCALE — widget tiles
     ===================================================================== */

  function miniKpi(spec) {
    var tone = TONE_FG[spec.tone] || 'var(--ink-900)';
    return '<div style="width:100%;text-align:left">' +
      '<div style="font-family:var(--font-numeric);font-weight:700;font-size:28px;line-height:1;' +
      'color:var(--ink-900);font-variant-numeric:tabular-nums">' + esc(spec.num) + '</div>' +
      (spec.delta ? '<div style="font-size:10.5px;color:' + tone +
        ';margin-top:5px;font-family:var(--font-mono)">' + esc(spec.delta) + '</div>' : '') +
      '</div>';
  }

  function miniLine(data) {
    var W = 150, H = 50, P = 4;
    var ys = data.map(function (d) { return d.y; });
    var yHi = Math.max.apply(null, ys) * 1.15 || 1;
    var xStep = (W - P * 2) / Math.max(1, data.length - 1);
    var yPos = function (v) { return P + (H - P * 2) * (1 - v / yHi); };
    var pts = data.map(function (d, i) { return [P + xStep * i, yPos(d.y)]; });
    var projIdx = data.findIndex(function (d) { return d.projected; });
    var solidEnd = projIdx >= 0 ? projIdx : pts.length;
    var solid = pts.slice(0, solidEnd).map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    var dashed = projIdx > 0
      ? 'M' + pts[projIdx - 1][0] + ',' + pts[projIdx - 1][1] + ' L' + pts[projIdx][0] + ',' + pts[projIdx][1]
      : '';
    var color = 'var(--teal-400)';
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      '<path d="' + solid + ' L' + pts[solidEnd - 1][0] + ',' + (H - P) + ' L' + pts[0][0] + ',' + (H - P) + ' Z" ' +
      'fill="' + color + '" fill-opacity="0.1"/>' +
      '<path d="' + solid + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      (dashed ? '<path d="' + dashed + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-dasharray="3 2" stroke-linecap="round"/>' : '') +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.5" fill="' +
      (data[data.length - 1].projected ? 'var(--surface-1)' : color) + '" stroke="' + color + '" stroke-width="1.5"/>' +
      '</svg>';
  }

  function miniBar(data) {
    var top = data.slice(0, 4);
    var max = Math.max.apply(null, top.map(function (d) { return d.value; })) * 1.1 || 1;
    return '<div style="width:100%;display:flex;flex-direction:column;gap:3px">' +
      top.map(function (d, i) {
        return '<div style="display:flex;align-items:center;gap:6px;font-size:10px">' +
          '<span style="width:42px;color:var(--ink-600);font-weight:500;overflow:hidden;' +
          'text-overflow:ellipsis;white-space:nowrap;flex-shrink:0">' + esc(d.label) + '</span>' +
          '<div style="flex:1;height:8px;background:var(--ink-100);border-radius:3px;overflow:hidden">' +
          '<div style="width:' + (d.value / max * 100) + '%;height:100%;background:' +
          (i === 0 ? 'var(--coral-300)' : 'var(--teal-300)') + '"></div></div>' +
          '<span style="font-family:var(--font-mono);color:var(--ink-700);font-variant-numeric:tabular-nums;' +
          'width:24px;text-align:right">' + esc(d.value) + '</span></div>';
      }).join('') + '</div>';
  }

  // Paired-bars correlation, capped to the first 4 categories.
  function miniBarPair(data, labels) {
    var top = data.slice(0, 4);
    var vals = [];
    top.forEach(function (d) { vals.push(d.a, d.b); });
    var max = Math.max.apply(null, vals) * 1.1 || 1;
    var colors = ['var(--amber-400)', 'var(--teal-300)'];
    return '<div style="width:100%;display:flex;flex-direction:column;gap:4px">' +
      '<div style="display:flex;gap:8px;font-size:8.5px;color:var(--ink-500)">' +
      labels.slice(0, 2).map(function (l, i) {
        return '<div style="display:flex;align-items:center;gap:3px;min-width:0;flex:1">' +
          '<span style="width:7px;height:7px;border-radius:2px;background:' + colors[i] + ';flex-shrink:0"></span>' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(l) + '</span></div>';
      }).join('') + '</div>' +
      top.map(function (d) {
        return '<div style="display:flex;align-items:center;gap:5px;font-size:9.5px">' +
          '<span style="width:36px;color:var(--ink-600);font-weight:500;overflow:hidden;' +
          'text-overflow:ellipsis;white-space:nowrap;flex-shrink:0">' + esc(d.label) + '</span>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0">' +
          '<div style="height:5px;background:var(--ink-100);border-radius:2px;overflow:hidden">' +
          '<div style="width:' + (d.a / max * 100) + '%;height:100%;background:' + colors[0] + '"></div></div>' +
          '<div style="height:5px;background:var(--ink-100);border-radius:2px;overflow:hidden">' +
          '<div style="width:' + (d.b / max * 100) + '%;height:100%;background:' + colors[1] + '"></div></div>' +
          '</div></div>';
      }).join('') + '</div>';
  }

  // Dual-line correlation — two metrics on the same axis.
  function miniLineDual(series, labels) {
    var W = 150, H = 60, P = 4;
    var colors = ['var(--amber-400)', 'var(--teal-400)'];
    var allYs = [];
    series.forEach(function (s) { s.data.forEach(function (d) { allYs.push(d.y); }); });
    var yHi = Math.max.apply(null, allYs) * 1.15 || 1;
    var paths = series.map(function (s) {
      var xStep = (W - P * 2) / Math.max(1, s.data.length - 1);
      return s.data.map(function (d, i) {
        return [P + xStep * i, P + (H - P * 2) * (1 - d.y / yHi)];
      });
    });
    return '<div style="width:100%;display:flex;flex-direction:column;gap:3px">' +
      '<div style="display:flex;gap:8px;font-size:8.5px;color:var(--ink-500)">' +
      labels.slice(0, 2).map(function (l, i) {
        return '<div style="display:flex;align-items:center;gap:3px;min-width:0;flex:1">' +
          '<span style="width:9px;height:2px;background:' + colors[i] + ';flex-shrink:0"></span>' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(l) + '</span></div>';
      }).join('') + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      paths.map(function (ps, i) {
        return '<path d="' + ps.map(function (p, j) { return (j ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ') +
          '" fill="none" stroke="' + colors[i] + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>';
      }).join('') +
      paths.map(function (ps, i) {
        var last = ps[ps.length - 1];
        return '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.2" fill="' + colors[i] + '"/>';
      }).join('') +
      '</svg></div>';
  }

  function miniDonut(data) {
    var total = data.reduce(function (s, d) { return s + d.value; }, 0) || 1;
    var R = 22, CX = 28, CY = 28;
    var cum = -Math.PI / 2;
    var segs = data.map(function (d) {
      var angle = (d.value / total) * Math.PI * 2;
      var x1 = CX + R * Math.cos(cum), y1 = CY + R * Math.sin(cum);
      var x2 = CX + R * Math.cos(cum + angle), y2 = CY + R * Math.sin(cum + angle);
      var large = angle > Math.PI ? 1 : 0;
      var path = 'M' + CX + ',' + CY + ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) +
        ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z';
      cum += angle;
      return '<path d="' + path + '" fill="' + d.color + '"/>';
    }).join('');
    return '<div style="display:flex;align-items:center;gap:8px;width:100%">' +
      '<svg viewBox="0 0 56 56" width="56" height="56" style="flex-shrink:0">' + segs +
      '<circle cx="' + CX + '" cy="' + CY + '" r="10" fill="var(--surface-1)"/>' +
      '<text x="' + CX + '" y="' + (CY + 3) + '" text-anchor="middle" font-size="10" font-weight="700" ' +
      'fill="var(--ink-900)" font-family="var(--font-numeric)">' + total + '</text></svg>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:2px;font-size:9.5px;min-width:0">' +
      data.slice(0, 3).map(function (d) {
        return '<div style="display:flex;align-items:center;gap:4px">' +
          '<span style="width:7px;height:7px;border-radius:2px;background:' + d.color + ';flex-shrink:0"></span>' +
          '<span style="flex:1;color:var(--ink-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          esc(d.label) + '</span>' +
          '<span style="font-family:var(--font-mono);color:var(--ink-800)">' + esc(d.value) + '</span></div>';
      }).join('') + '</div></div>';
  }

  // Dispatcher for widget-tile specs. Correlation specs carry `kind`
  // (bar-pair / line-dual) instead of `viz`.
  function miniViz(spec) {
    if (!spec) return '';
    if (spec.kind === 'bar-pair') return miniBarPair(spec.data, spec.labels);
    if (spec.kind === 'line-dual') return miniLineDual(spec.series, spec.labels);
    if (spec.viz === 'kpi') return miniKpi(spec);
    if (spec.viz === 'line') return miniLine(spec.data);
    if (spec.viz === 'bar') return miniBar(spec.data);
    if (spec.viz === 'donut') return miniDonut(spec.data);
    // Fall back to KPI rendering if a non-widget viz was somehow picked.
    var fallback = window.KEYSTONE_CUSTOM.buildSpec(spec.metric, 'kpi');
    return fallback ? miniKpi(fallback) : '';
  }

  /* =====================================================================
     INLINE SCALE — Agency Intelligence chat answers
     ===================================================================== */

  function chartLegend(legend) {
    if (!legend) return '';
    return '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">' +
      legend.map(function (l) {
        return '<div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--ink-600)">' +
          '<span style="width:9px;height:9px;border-radius:2px;background:' + l.color + '"></span>' +
          esc(l.label) + '</div>';
      }).join('') + '</div>';
  }

  function inlineBarPair(spec) {
    var data = spec.data, legend = spec.legend;
    var W = 360, H = 140, P = 18, maxV = 100;
    var groupW = (W - P * 2) / data.length;
    var barW = (groupW - 6) / 2;
    var grid = [0, 25, 50, 75, 100].map(function (v) {
      var y = P + (H - P * 2) * (1 - v / maxV);
      return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y + '" stroke="var(--ink-100)" stroke-width="1"/>' +
        '<text x="' + (P - 4) + '" y="' + (y + 3) + '" font-size="8" fill="var(--ink-400)" text-anchor="end">' + v + '</text>';
    }).join('');
    var bars = data.map(function (d, i) {
      var gx = P + groupW * i + 3;
      var ha = (H - P * 2) * (d.a / maxV);
      var hb = (H - P * 2) * (d.b / maxV);
      return '<rect x="' + gx + '" y="' + (H - P - ha) + '" width="' + barW + '" height="' + ha + '" rx="2" fill="' + legend[0].color + '"/>' +
        '<rect x="' + (gx + barW + 2) + '" y="' + (H - P - hb) + '" width="' + barW + '" height="' + hb + '" rx="2" fill="' + legend[1].color + '"/>' +
        '<text x="' + (gx + barW + 1) + '" y="' + (H - 4) + '" font-size="9" fill="var(--ink-500)" text-anchor="middle">' + esc(d.label) + '</text>';
    }).join('');
    return '<div>' + chartLegend(legend) +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      grid + bars + '</svg></div>';
  }

  function inlineStack(spec) {
    var legend = spec.legend;
    return '<div>' + chartLegend(legend) +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      spec.data.map(function (d) {
        var total = d.a + d.b;
        var pa = (d.a / total) * 100;
        return '<div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-700);margin-bottom:3px">' +
          '<span style="font-weight:500">' + esc(d.label) + '</span>' +
          '<span style="font-family:var(--font-mono);color:var(--coral-500)">' + d.a +
          ' <span style="color:var(--ink-400)">/ ' + total + '</span></span></div>' +
          '<div style="height:10px;border-radius:6px;background:var(--ink-100);overflow:hidden;display:flex">' +
          '<div style="width:' + pa + '%;background:' + legend[0].color + ';transition:width 0.5s"></div>' +
          '<div style="flex:1;background:' + legend[1].color + ';opacity:0.5"></div></div></div>';
      }).join('') + '</div></div>';
  }

  function inlineLine(spec) {
    var data = spec.data;
    var color = spec.color || 'var(--teal-400)';
    var ySuffix = spec.ySuffix || '';
    var W = 360, H = 150, P = 24;
    var ys = data.map(function (d) { return d.y; });
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var pad = (maxY - minY) * 0.1 || 1;
    var yLo = minY - pad, yHi = maxY + pad;
    var xStep = (W - P * 2) / Math.max(1, data.length - 1);
    var yPos = function (v) { return P + (H - P * 2) * (1 - (v - yLo) / (yHi - yLo)); };
    var pts = data.map(function (d, i) { return [P + xStep * i, yPos(d.y)]; });
    var projIdx = data.findIndex(function (d) { return d.projected; });
    var solid = projIdx > 0
      ? pts.slice(0, projIdx).map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; })
          .concat(['L' + pts[projIdx][0] + ',' + pts[projIdx][1]]).join(' ')
      : pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    var dashed = projIdx > 0
      ? 'M' + pts[projIdx - 1][0] + ',' + pts[projIdx - 1][1] + ' L' + pts[projIdx][0] + ',' + pts[projIdx][1]
      : '';
    var endIdx = projIdx > 0 ? projIdx : pts.length - 1;
    var area = solid + ' L' + pts[endIdx][0] + ',' + (H - P) + ' L' + pts[0][0] + ',' + (H - P) + ' Z';
    var gid = nextId('cp-line-fill');
    var grid = [0, 0.5, 1].map(function (t) {
      var y = P + (H - P * 2) * t;
      var v = Math.round(yHi - (yHi - yLo) * t);
      return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y + '" stroke="var(--ink-100)" stroke-width="1"/>' +
        '<text x="' + (P - 4) + '" y="' + (y + 3) + '" font-size="9" fill="var(--ink-400)" text-anchor="end">' +
        v + esc(ySuffix) + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.18"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + solid + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      (dashed ? '<path d="' + dashed + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>' : '') +
      pts.map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="' +
          (data[i].projected ? 'var(--surface-1)' : color) + '" stroke="' + color + '" stroke-width="2"/>';
      }).join('') +
      data.map(function (d, i) {
        return '<text x="' + pts[i][0] + '" y="' + (H - 6) + '" font-size="9" fill="var(--ink-500)" ' +
          'text-anchor="middle" font-weight="' + (d.projected ? 700 : 400) + '">' + esc(d.x) + '</text>';
      }).join('') + '</svg>';
  }

  function inlineHBar(spec) {
    var data = spec.data, max = spec.max;
    return '<div style="display:flex;flex-direction:column;gap:6px">' +
      data.map(function (d, i) {
        var isWorst = i === data.length - 1;
        return '<div style="display:flex;align-items:center;gap:8px;font-size:11px">' +
          '<span style="width:96px;color:var(--ink-700);font-weight:500;flex-shrink:0">' + esc(d.label) + '</span>' +
          '<div style="flex:1;height:14px;background:var(--ink-100);border-radius:4px;position:relative;overflow:hidden">' +
          '<div style="position:absolute;inset:0;width:' + (d.value / max * 100) + '%;background:' +
          (isWorst ? 'var(--coral-300)' : 'var(--teal-300)') + ';border-radius:4px;transition:width 0.5s"></div></div>' +
          '<span style="font-family:var(--font-mono);color:var(--ink-700);width:38px;text-align:right">' +
          esc(d.fmt) + '</span></div>';
      }).join('') + '</div>';
  }

  function inlineChart(spec) {
    if (!spec) return '';
    var inner = '';
    if (spec.kind === 'bar-pair') inner = inlineBarPair(spec);
    else if (spec.kind === 'stack') inner = inlineStack(spec);
    else if (spec.kind === 'line') inner = inlineLine(spec);
    else if (spec.kind === 'hbar') inner = inlineHBar(spec);
    else return '';
    return '<div class="cp-chart">' + inner + '</div>';
  }

  /* =====================================================================
     PUBLISHED-DASHBOARD SCALE
     ===================================================================== */

  function pdSpark(data, color) {
    if (!data || data.length < 2) return '';
    var ys = data.map(function (d) { return d.y; });
    var min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
    var range = Math.max(1, max - min);
    var w = 100, h = 26, step = w / (data.length - 1);
    var pts = data.map(function (d, i) {
      return (i * step).toFixed(1) + ',' + (h - (d.y - min) / range * h).toFixed(1);
    }).join(' ');
    return '<svg width="100%" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" ' +
      'preserveAspectRatio="none" style="display:block">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5" ' +
      'vector-effect="non-scaling-stroke" opacity="0.65"/></svg>';
  }

  function pdKpi(o) {
    var fg = TONE_FG[o.tone] || TONE_FG.neutral;
    return '<div style="display:flex;flex-direction:column;gap:6px;height:100%">' +
      '<div style="display:flex;align-items:baseline;gap:5px">' +
      '<span class="kx-kpi-num" style="color:' + fg + '">' + esc(o.num) + '</span>' +
      (o.unit ? '<span style="font-size:14px;font-weight:600;color:var(--ink-500)">' + esc(o.unit) + '</span>' : '') +
      '</div>' +
      (o.delta ? '<div style="font-size:11.5px;color:var(--ink-500);font-weight:500">' + esc(o.delta) + '</div>' : '') +
      (o.trend ? '<div style="margin-top:auto">' + pdSpark(o.trend, o.trendColor || fg) + '</div>' : '') +
      '</div>';
  }

  function pdLine(data, color, ySuffix) {
    color = color || 'var(--teal-400)';
    var W = 380, H = 148, P = 26;
    var ys = data.map(function (d) { return d.y; });
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var pad = (maxY - minY) * 0.12 || 1;
    var yLo = minY - pad, yHi = maxY + pad;
    var xStep = (W - P * 2) / Math.max(1, data.length - 1);
    var yPos = function (v) { return P + (H - P * 2) * (1 - (v - yLo) / (yHi - yLo)); };
    var pts = data.map(function (d, i) { return [P + xStep * i, yPos(d.y)]; });
    var projIdx = data.findIndex(function (d) { return d.projected; });
    var solid = projIdx > 0
      ? pts.slice(0, projIdx + 1).map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ')
      : pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    var dashed = projIdx > 0
      ? 'M' + pts[projIdx - 1][0] + ',' + pts[projIdx - 1][1] + ' L' + pts[projIdx][0] + ',' + pts[projIdx][1]
      : '';
    var endIdx = projIdx > 0 ? projIdx : pts.length - 1;
    var area = solid + ' L' + pts[endIdx][0] + ',' + (H - P) + ' L' + pts[0][0] + ',' + (H - P) + ' Z';
    var gid = nextId('pd-line');
    var grid = [0, 0.5, 1].map(function (t) {
      var y = P + (H - P * 2) * t;
      var v = Math.round(yHi - (yHi - yLo) * t);
      return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y + '" stroke="var(--ink-100)" stroke-width="1"/>' +
        '<text x="' + (P - 4) + '" y="' + (y + 3) + '" font-size="9" fill="var(--ink-400)" text-anchor="end">' +
        v + esc(ySuffix || '') + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" style="display:block">' +
      '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.18"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + solid + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      (dashed ? '<path d="' + dashed + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>' : '') +
      pts.map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="' +
          (data[i].projected ? 'var(--surface-1)' : color) + '" stroke="' + color + '" stroke-width="1.5"/>';
      }).join('') +
      data.map(function (d, i) {
        return '<text x="' + pts[i][0] + '" y="' + (H - 6) + '" font-size="9" fill="var(--ink-500)" ' +
          'text-anchor="middle" font-weight="' + (d.projected ? 700 : 400) + '">' + esc(d.x) + '</text>';
      }).join('') + '</svg>';
  }

  // Pearson r over the plotted points — the scatter's headline sentence
  // states the relationship in words so the chart isn't the only read.
  // Ported from agency-intel-canvas.js's vizScatter helpers.
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

  // Correlation scatter + least-squares trend line, published-dashboard scale.
  // Ported from agency-intel-canvas.js's vizScatter so the Agency Intelligence
  // Dashboard page and the hub's published-dashboard widgets draw correlations
  // identically. viewBox-driven sizing (width="100%") lets it scale inside
  // whatever grid-column span the widget spec gives it, rather than assuming
  // a fixed 380px widget.
  //
  // The <svg> deliberately sets NO height attribute. It used to carry
  // height="210" to match the viewBox, which meant that in any container
  // narrower than 380px the default preserveAspectRatio scaled the whole
  // drawing down to fit the width while the box stayed 210px tall — a vertical
  // letterbox plus shrunken text (at a 235px container: scale 0.62, so the
  // 8.5px station labels rendered at ~5.3px). With height omitted the SVG's
  // intrinsic viewBox ratio sets the height, so the box always fits the drawing
  // exactly and there is never a letterbox in either axis. The scale still
  // tracks the container width, so a caller that needs the labels at full size
  // has to give this chart enough width — see index.html's ≤1070px rule, which
  // hands the hub's scatter the whole grid row once the grid goes two-across.
  function pdScatter(spec) {
    var pts = spec.points || [];
    if (pts.length < 3) {
      return '<div style="padding:20px 0;text-align:center;color:var(--ink-400);font-size:12px">' +
        'Not enough shared data points to plot a correlation.</div>';
    }
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
      // No height attribute, and height:auto, so the viewBox ratio sets the box
      // height and the drawing never letterboxes. See the note on this function.
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;height:auto">' +
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

  function pdBar(data) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    return '<div style="display:flex;flex-direction:column;gap:8px;width:100%">' +
      data.map(function (d) {
        var worst = d.value === max && max > 0;
        return '<div style="display:flex;align-items:center;gap:10px;font-size:12px">' +
          '<span style="width:64px;color:var(--ink-600);font-weight:500;flex-shrink:0;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis">' + esc(d.label) + '</span>' +
          '<div style="flex:1;height:16px;background:var(--ink-100);border-radius:5px;overflow:hidden">' +
          '<div style="width:' + (d.value / max * 100) + '%;height:100%;background:' +
          (worst ? 'var(--coral-300)' : 'var(--teal-300)') + ';border-radius:5px;transition:width 0.6s"></div></div>' +
          '<span style="font-family:var(--font-numeric);font-weight:700;color:var(--ink-700);width:32px;' +
          'text-align:right;font-variant-numeric:tabular-nums">' + esc(d.value) + '</span></div>';
      }).join('') + '</div>';
  }

  // ⚠ FRAGILE COUPLING — index.html keys two `!important` overrides off the
  // LITERAL inline `style` strings emitted below (`div[style*="gap:18px"]` for
  // the arc-to-legend gap and `div[style*="gap:8px;font-size:12px"]` for the
  // within-row swatch/label/percentage gap), which is how the hub's donut legend
  // fits its widest row inside a w:4 widget. Editing those two style strings —
  // even reordering the declarations inside them — silently breaks the hub's
  // donut legend with no error anywhere. If you must change them, grep
  // index.html for `style*=` first and update the selectors in the same commit.
  function pdDonut(data, center) {
    var total = data.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    var R = 50, SW = 14, C = 2 * Math.PI * R;
    var offset = 0;
    var arcs = data.map(function (d) {
      var len = C * (d.value / total);
      var el = '<circle cx="63" cy="63" r="' + R + '" fill="none" stroke="' + d.color + '" stroke-width="' + SW +
        '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
      offset += len;
      return el;
    }).join('');
    return '<div style="display:flex;align-items:center;gap:18px;width:100%">' +
      '<svg width="126" height="126" viewBox="0 0 126 126" style="flex-shrink:0">' +
      '<g transform="rotate(-90 63 63)">' +
      '<circle cx="63" cy="63" r="' + R + '" fill="none" stroke="var(--ink-100)" stroke-width="' + SW + '"/>' +
      arcs + '</g>' +
      (center ? '<text x="63" y="63" text-anchor="middle" dominant-baseline="central" ' +
        'font-family="var(--font-numeric)" font-weight="700" font-size="27" fill="var(--ink-800)">' +
        esc(center) + '</text>' : '') +
      '</svg>' +
      '<div style="display:flex;flex-direction:column;gap:9px;min-width:0">' +
      data.map(function (d) {
        return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-700)">' +
          '<span style="width:10px;height:10px;border-radius:3px;background:' + d.color + ';flex-shrink:0"></span>' +
          '<span style="font-weight:500">' + esc(d.label) + '</span>' +
          '<span style="margin-left:auto;font-family:var(--font-numeric);font-weight:700;color:var(--ink-800);' +
          'padding-left:10px">' + Math.round(d.value / total * 100) + '%</span></div>';
      }).join('') + '</div></div>';
  }

  function pdTable(cols, rows) {
    return '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr>' +
      cols.map(function (c, i) {
        return '<th style="text-align:' + (i === 0 ? 'left' : 'right') + ';padding:6px 8px;color:var(--ink-500);' +
          'font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:0.4px;' +
          'border-bottom:1px solid var(--ink-100)">' + esc(c) + '</th>';
      }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, ri) {
        return '<tr>' + r.map(function (cell, ci) {
          return '<td style="text-align:' + (ci === 0 ? 'left' : 'right') + ';padding:7px 8px;color:' +
            (ci === 0 ? 'var(--ink-800)' : 'var(--ink-600)') + ';font-weight:' + (ci === 0 ? 600 : 500) +
            ';border-bottom:' + (ri < rows.length - 1 ? '1px solid var(--ink-100)' : 'none') +
            ';font-family:' + (ci === 0 ? 'inherit' : 'var(--font-numeric)') + ';white-space:nowrap">' +
            esc(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }

  /* =====================================================================
     CSV EXPORT
     ===================================================================== */
  function downloadCSV(prompt, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        return /[,"\n]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c;
      }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var slug = String(prompt).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-|-$/g, '');
    a.href = url;
    a.download = 'agency-intel-' + (slug || 'export') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    window.KX.pushToast({
      title: 'CSV downloaded',
      body: (rows.length - 1) + ' rows exported.',
      icon: 'download', tone: 'success'
    });
  }

  window.KXCharts = {
    miniViz: miniViz, miniKpi: miniKpi, miniLine: miniLine, miniBar: miniBar,
    miniBarPair: miniBarPair, miniLineDual: miniLineDual, miniDonut: miniDonut,
    inlineChart: inlineChart, chartLegend: chartLegend,
    inlineLine: inlineLine, inlineBarPair: inlineBarPair, inlineStack: inlineStack, inlineHBar: inlineHBar,
    pdKpi: pdKpi, pdLine: pdLine, pdBar: pdBar, pdDonut: pdDonut, pdScatter: pdScatter, pdTable: pdTable, pdSpark: pdSpark,
    downloadCSV: downloadCSV, TONE_FG: TONE_FG
  };
})();
