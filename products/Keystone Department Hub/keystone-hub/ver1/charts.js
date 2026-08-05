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
  //
  // This is the GENERIC correlation renderer — a two-metric scatter that leads
  // with `r`, for any correlation built from the metric catalogue. The Chief's
  // dashboard no longer uses it (its ch1 is now the overtime/injury widget, on
  // pdOutlierScatter below, which suppresses `r` on the card face); this stays
  // as the default for a correlation nobody has written a specific story for.
  //
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

  /* =====================================================================
     OUTLIER SCATTER — pdOutlierScatter
     =====================================================================
     A correlation chart whose MESSAGE is the outliers, not the slope.

     Why this exists alongside pdScatter(). pdScatter answers "is there a
     relationship?" and leads with `r`. That is the right chart for an analyst
     and the wrong one for a chief or a budget director: `r = 0.61` is not a
     decision, and on a home dashboard it invites exactly one of two errors —
     dismissing a real problem because the number "isn't that high", or
     reading a coefficient as causation. This renderer answers the question a
     chief actually has ("which of my battalions is the problem, and what is
     it costing me?") and files the statistics behind a disclosure for the
     analytics and accreditation staff who do need them.

     So, deliberately:
       · NO `r` on the card face. r / n / p live in the <details> panel only.
       · The headline is an outlier-and-gap sentence with a multiple, computed
         from the plotted data so it can never drift from the chart.
       · Median reference lines on both axes cut the field into quadrants;
         only the upper-right one is labelled, because it is the only one with
         an action attached to it.
       · Only outliers are direct-labelled. At 40+ points labelling everything
         is a hairball — the rest resolve on hover.
       · The trendline stays (the slope is real) but is deliberately quiet:
         1px --ink-400 long-dash, versus the 1.5px saturated --amber-400 that
         pdScatter uses. It is context, not the finding.

     Accessibility, and what each choice is actually for:
       · Division is encoded by SHAPE as well as colour (circle / square /
         triangle / diamond / inverted triangle), so the categorical read
         survives any colour-vision deficiency and greyscale printing — this
         card prints, via pdPrintDoc.
       · Outliers carry a non-colour differentiator too: a heavier stroke
         AND an outer ring, on top of their direct labels.
       · Contrast, measured against the card background (--surface-1, #fff),
         to WCAG 2.2 1.4.11 (3:1 non-text) and 1.4.3 (4.5:1 text):
             marks    teal-400 #1f7a6b 4.8:1 · status-due #2563eb 5.2:1 ·
                      amber-600 #b45309 4.8:1 · src-sched #7e22ce 7.6:1 ·
                      ink-600 #4b5966 7.3:1                      all pass 3:1
             ref/trend lines + axis rules  --ink-400 #8b949f      3.05:1 pass
             quadrant label + tick text    --ink-500 #69747f      4.75:1 pass
         --ink-300 (#b3bac4) is 1.96:1 and therefore NOT used for any line
         that carries meaning here; the median lines and the trendline are
         meaningful graphics, so they sit at --ink-400 and are separated from
         each other by dash pattern rather than by weight alone.
       · One colour is borrowed from a source-app token (--src-sched purple).
         The palette has no other distinct fifth hue. The collision is
         defused by the shape encoding and by the legend naming every series
         "Division N", but if a true categorical ramp is ever added to
         styles.css, DIVISION_SERIES below is the one place to repoint.

     Sizing follows pdScatter exactly — a 380-wide viewBox at width:100% with
     NO height attribute, so the box always fits the drawing and the scale
     tracks the container. index.html's ≤1070px rule (which keys off the
     .kx-pubwidget--scatter class, unchanged by this widget) still hands the
     chart the whole grid row once the grid goes two-across.

     spec: {
       points: [{ label, x, y, size (1-3), group, outlier }],
       groups: [{ id, label, color, shape }],
       xLabel, yLabel, xUnit, yUnit, quadrantLabel, costNote, sizeNote
     }
     ===================================================================== */

  // Five categorical series. Colour AND shape — never colour alone.
  var DIVISION_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'triangle-down'];

  // An SVG mark of the given shape centred on (cx, cy) with nominal radius r.
  function markShape(shape, cx, cy, r, fill, stroke, sw) {
    var common = ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw +
      '" stroke-linejoin="round"';
    if (shape === 'square') {
      var s = r * 1.72;
      return '<rect x="' + (cx - s / 2).toFixed(1) + '" y="' + (cy - s / 2).toFixed(1) +
        '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" rx="0.8"' + common + '/>';
    }
    if (shape === 'triangle' || shape === 'triangle-down') {
      var d = shape === 'triangle' ? -1 : 1;
      var h = r * 1.9;
      return '<polygon points="' +
        cx.toFixed(1) + ',' + (cy + d * h * 0.55).toFixed(1) + ' ' +
        (cx - h * 0.62).toFixed(1) + ',' + (cy - d * h * 0.42).toFixed(1) + ' ' +
        (cx + h * 0.62).toFixed(1) + ',' + (cy - d * h * 0.42).toFixed(1) + '"' + common + '/>';
    }
    if (shape === 'diamond') {
      var q = r * 1.28;
      return '<polygon points="' +
        cx.toFixed(1) + ',' + (cy - q).toFixed(1) + ' ' + (cx + q).toFixed(1) + ',' + cy.toFixed(1) + ' ' +
        cx.toFixed(1) + ',' + (cy + q).toFixed(1) + ' ' + (cx - q).toFixed(1) + ',' + cy.toFixed(1) +
        '"' + common + '/>';
    }
    return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '"' + common + '/>';
  }

  function medianOf(nums) {
    var v = nums.slice().sort(function (a, b) { return a - b; });
    var m = v.length >> 1;
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }

  // Two-tailed p for Pearson r via the t distribution, t = r√(n−2)/√(1−r²).
  // Regularised incomplete beta (Lentz continued fraction) — the same standard
  // routine a stats package uses, so the number in the detail panel is a real
  // p-value rather than a decorative one. Only ever rendered as a threshold
  // ("p < 0.001"), which is all a reviewer needs from a 45-point sample.
  function gammaln(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5, ser = 1.000000000190015;
    tmp -= (x + 0.5) * Math.log(tmp);
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, EPS = 3e-14;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 200; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;  if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;  if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pValueFor(r, n) {
    if (n < 3 || Math.abs(r) >= 1) return 0;
    var t = Math.abs(r) * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
    var df = n - 2;
    return betai(df / 2, 0.5, df / (df + t * t));
  }
  function pText(p) {
    if (p < 0.001) return 'p < 0.001';
    if (p < 0.01) return 'p < 0.01';
    if (p < 0.05) return 'p < 0.05';
    return 'p = ' + p.toFixed(3);
  }

  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function pdOutlierScatter(spec) {
    var pts = (spec.points || []).slice();
    if (pts.length < 3) {
      return '<div style="padding:20px 0;text-align:center;color:var(--ink-400);font-size:12px">' +
        'Not enough shared data points to plot a correlation.</div>';
    }
    var groups = spec.groups || [];
    var groupById = {};
    groups.forEach(function (g, i) {
      g.shape = g.shape || DIVISION_SHAPES[i % DIVISION_SHAPES.length];
      groupById[g.id] = g;
    });

    // --- geometry ------------------------------------------------------
    // W matches pdScatter's 380 so the widget's measured scale behaviour and
    // index.html's ≤1070px full-row rule carry over unchanged. H is taller
    // (232 vs 210) to buy vertical room for the quadrant label band without
    // squeezing the point field.
    // plotL is 44, not pdScatter's 40, to fit a TWO-LINE rotated y-axis title.
    // One line does not fit: "OSHA-recordable injuries per 100 FTE
    // (annualized)" is ~48 characters, which at 9.5px is ~230px against a
    // 186px plot height — the SVG root clips, and the axis silently loses its
    // last word. Two rotated lines at x=10 and x=20 are ~115px each and clear
    // the y tick labels, which anchor at plotL-5 and reach back to ~x28.
    var W = 380, H = 232;
    var plotL = 44, plotR = W - 12, plotT = 16, plotB = H - 30;
    var xs = pts.map(function (p) { return p.x; });
    var ys = pts.map(function (p) { return p.y; });
    var xLo = Math.min.apply(null, xs), xHi = Math.max.apply(null, xs);
    var yLo = Math.min.apply(null, ys), yHi = Math.max.apply(null, ys);
    var padX = (xHi - xLo) * 0.1 || 1, padY = (yHi - yLo) * 0.1 || 1;
    xLo -= padX; xHi += padX; yLo = Math.max(0, yLo - padY); yHi += padY;
    var sx = function (v) { return plotL + (plotR - plotL) * ((v - xLo) / (xHi - xLo)); };
    var sy = function (v) { return plotB - (plotB - plotT) * ((v - yLo) / (yHi - yLo)); };

    // --- the statistics, all derived from the plotted points -----------
    // Nothing below is hand-written into the copy: the multiple in the
    // headline, the named battalions, and the r/n/p in the detail panel all
    // come from `pts`, so editing the fixture can never leave the sentence
    // asserting something the chart does not show.
    var n = pts.length;
    var r = pearson(pts);
    var p = pValueFor(r, n);
    var xMed = medianOf(xs), yMed = medianOf(ys);

    var byX = pts.slice().sort(function (a, b) { return b.x - a.x; });
    var qN = Math.max(1, Math.round(n / 4));
    var topQ = byX.slice(0, qN);
    var qMeanY = topQ.reduce(function (a, q) { return a + q.y; }, 0) / qN;
    var multiple = yMed ? qMeanY / yMed : 0;

    // "at comparable call volume" is a CLAIM, so it is checked rather than
    // asserted: the top-OT quartile's median call volume against the
    // department's. Both are surfaced in the detail panel so a reviewer can
    // see the control rather than take it on faith.
    var haveCalls = pts.every(function (q) { return typeof q.calls === 'number'; });
    var callsQ = haveCalls ? medianOf(topQ.map(function (q) { return q.calls; })) : null;
    var callsAll = haveCalls ? medianOf(pts.map(function (q) { return q.calls; })) : null;

    var outliers = pts.filter(function (q) { return q.outlier; })
      .sort(function (a, b) { return a.order - b.order || a.x - b.x; });
    var outNames = outliers.map(function (q) { return q.short || q.label; });
    var namesSentence = outNames.length > 1
      ? outNames.slice(0, -1).join(', ') + ', and ' + outNames[outNames.length - 1]
      : outNames[0];

    // --- least-squares trend, deliberately quiet -----------------------
    var mx = xs.reduce(function (a, b) { return a + b; }, 0) / n;
    var my = ys.reduce(function (a, b) { return a + b; }, 0) / n;
    var num = 0, den = 0;
    pts.forEach(function (q) { num += (q.x - mx) * (q.y - my); den += (q.x - mx) * (q.x - mx); });
    var slope = den ? num / den : 0;
    var intercept = my - slope * mx;
    var trend = '<line x1="' + sx(xLo).toFixed(1) + '" y1="' + sy(slope * xLo + intercept).toFixed(1) +
      '" x2="' + sx(xHi).toFixed(1) + '" y2="' + sy(slope * xHi + intercept).toFixed(1) +
      '" stroke="var(--ink-400)" stroke-width="1" stroke-dasharray="7 5" opacity="0.85"/>';

    // --- axes ----------------------------------------------------------
    var yTicks = [0, 0.5, 1].map(function (t) {
      var yv = yLo + (yHi - yLo) * t, y = sy(yv);
      return '<line x1="' + plotL + '" x2="' + plotR + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) +
        '" stroke="var(--ink-100)" stroke-width="1"/>' +
        '<text x="' + (plotL - 5) + '" y="' + (y + 3).toFixed(1) + '" font-size="9" fill="var(--ink-500)" ' +
        'text-anchor="end">' + Math.round(yv) + '</text>';
    }).join('');
    var xTicks = [0, 0.5, 1].map(function (t) {
      var xv = xLo + (xHi - xLo) * t, x = sx(xv);
      return '<text x="' + x.toFixed(1) + '" y="' + (plotB + 12) + '" font-size="9" fill="var(--ink-500)" ' +
        'text-anchor="' + (t === 0 ? 'start' : t === 1 ? 'end' : 'middle') + '">' + Math.round(xv) + '</text>';
    }).join('');

    // --- median reference lines + the ONE labelled quadrant -------------
    // Four quadrants are drawn; only upper-right is named. The other three
    // ("low OT, low injury" and the two mixed cells) have no action attached
    // to them, and labelling them would turn a reference grid into a 2x2
    // framework the data does not support.
    var mxPx = sx(xMed), myPx = sy(yMed);
    var medians =
      '<line x1="' + mxPx.toFixed(1) + '" x2="' + mxPx.toFixed(1) + '" y1="' + plotT + '" y2="' + plotB +
      '" stroke="var(--ink-400)" stroke-width="0.8" stroke-dasharray="2 3"/>' +
      '<line x1="' + plotL + '" x2="' + plotR + '" y1="' + myPx.toFixed(1) + '" y2="' + myPx.toFixed(1) +
      '" stroke="var(--ink-400)" stroke-width="0.8" stroke-dasharray="2 3"/>' +
      '<text x="' + (mxPx + 5).toFixed(1) + '" y="' + (plotT + 1) + '" font-size="8.5" ' +
      'fill="var(--ink-500)" font-weight="600">' + esc(spec.quadrantLabel || 'High OT, high injury') + '</text>';

    // --- the point field ------------------------------------------------
    // Radius by size step (1-3 = headcount tercile). Ordered so outliers
    // paint last and are never occluded by the cloud.
    var RADII = [3.1, 4.2, 5.3];
    function markFor(q) {
      var g = groupById[q.group] || { color: 'var(--ink-600)', shape: 'circle', label: '' };
      var rad = RADII[Math.min(2, Math.max(0, (q.size || 1) - 1))];
      var title = '<title>' + esc(q.label) + ' · ' + esc(g.label) + ' — ' +
        esc(spec.xLabel) + ' ' + q.x + (spec.xUnit ? ' ' + esc(spec.xUnit) : '') + ' · ' +
        esc(spec.yLabel) + ' ' + q.y + (spec.yUnit ? ' ' + esc(spec.yUnit) : '') +
        (q.fte ? ' · ' + q.fte + ' uniformed FTE' : '') +
        (q.calls ? ' · ' + fmtInt(q.calls) + ' responses/yr' : '') +
        (q.outlier ? ' · flagged outlier' : '') + '</title>';
      // Outliers: heavier stroke AND an outer ring — two non-colour cues, so
      // the flag survives greyscale and colour-vision deficiency.
      var ring = q.outlier
        ? '<circle cx="' + sx(q.x).toFixed(1) + '" cy="' + sy(q.y).toFixed(1) + '" r="' + (rad + 3.6).toFixed(1) +
          '" fill="none" stroke="var(--ink-700)" stroke-width="1.1"/>'
        : '';
      return '<g>' + title + ring +
        markShape(g.shape, sx(q.x), sy(q.y), rad, g.color,
          q.outlier ? 'var(--ink-800)' : 'var(--surface-1)', q.outlier ? 2 : 1) + '</g>';
    }
    var field = pts.filter(function (q) { return !q.outlier; }).map(markFor).join('') +
      pts.filter(function (q) { return q.outlier; }).map(markFor).join('');

    // Direct labels, outliers only. Anchored to the LEFT of each mark: every
    // outlier sits against the right edge of the plot by definition (they are
    // the high-OT extremes), so right-side labels would run off the viewBox.
    //
    // Outliers also cluster vertically — they are the top of the y range too —
    // so the labels get a de-collision pass: walking top-down, any label
    // closer than LABEL_MIN_GAP to the one above is pushed down. Without it,
    // the two highest points here land 11px apart and their 8.5px labels
    // touch. The leader offset keeps each label tied to its own mark.
    var LABEL_MIN_GAP = 12;
    var placed = [];
    var outLabels = outliers.map(function (q) {
      return { q: q, rad: RADII[Math.min(2, Math.max(0, (q.size || 1) - 1))], py: sy(q.y) };
    }).sort(function (a, b) { return a.py - b.py; }).map(function (it) {
      var ty = it.py + 3;
      if (placed.length && ty - placed[placed.length - 1] < LABEL_MIN_GAP) {
        ty = placed[placed.length - 1] + LABEL_MIN_GAP;
      }
      placed.push(ty);
      var tx = sx(it.q.x) - it.rad - 6;
      // A leader only when the label had to move off its mark's own line.
      var leader = Math.abs(ty - (it.py + 3)) > 2
        ? '<line x1="' + (tx + 2).toFixed(1) + '" y1="' + (ty - 3).toFixed(1) + '" x2="' +
          (sx(it.q.x) - it.rad - 1).toFixed(1) + '" y2="' + it.py.toFixed(1) +
          '" stroke="var(--ink-400)" stroke-width="0.7"/>'
        : '';
      return leader + '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) +
        '" font-size="8.5" font-weight="700" fill="var(--ink-800)" text-anchor="end">' +
        esc(it.q.label) + '</text>';
    }).join('');

    // Rotated y-axis title, wrapped to at most two lines on word boundaries so
    // the full metric name survives. The plot is 186px tall and 9.5px glyphs
    // average ~4.8px, so ~38 characters is the single-line budget; the label
    // this widget uses is 48 and needs the second line.
    var yFull = spec.yLabel + (spec.yUnit ? ' (' + spec.yUnit + ')' : '');
    var yMid = (plotT + plotB) / 2;
    var yLines;
    if (yFull.length <= 38) {
      yLines = [yFull];
    } else {
      var words = yFull.split(' ');
      var a = '', b = '';
      words.forEach(function (word) {
        if ((a + ' ' + word).trim().length <= Math.ceil(yFull.length / 2)) a = (a + ' ' + word).trim();
        else b = (b + ' ' + word).trim();
      });
      yLines = b ? [a, b] : [a];
    }
    var yAxisTitle = yLines.map(function (line, i) {
      var x = yLines.length > 1 ? 10 + i * 9.5 : 10;
      return '<text x="' + x + '" y="' + yMid + '" font-size="9.5" fill="var(--ink-500)" ' +
        'text-anchor="middle" transform="rotate(-90 ' + x + ' ' + yMid + ')">' + esc(line) + '</text>';
    }).join('');

    // --- copy -----------------------------------------------------------
    var headline =
      '<div style="font-size:12.5px;color:var(--ink-700);line-height:1.5;margin-bottom:9px">' +
      'Battalions in the highest overtime quartile average ' +
      '<strong style="color:var(--ink-900);font-weight:700">' + multiple.toFixed(1) + '×</strong> ' +
      'the injury rate of the department median at comparable call volume. ' +
      'Battalions <strong style="color:var(--ink-900);font-weight:700">' + esc(namesSentence) + '</strong> ' +
      'are the widest gaps.</div>';

    var legend =
      '<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:9px;font-size:10.5px;color:var(--ink-600)">' +
      groups.map(function (g) {
        return '<span style="display:inline-flex;align-items:center;gap:5px">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="flex-shrink:0">' +
          markShape(g.shape, 6, 6, 4.2, g.color, 'var(--surface-1)', 1) + '</svg>' +
          esc(g.label) + '</span>';
      }).join('') +
      '<span style="display:inline-flex;align-items:center;gap:5px;color:var(--ink-500)">' +
      '<svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true" style="flex-shrink:0">' +
      markShape('circle', 4, 6, 2.6, 'var(--ink-300)', 'var(--surface-1)', 1) +
      markShape('circle', 12, 6, 3.6, 'var(--ink-300)', 'var(--surface-1)', 1) +
      markShape('circle', 21, 6, 4.6, 'var(--ink-300)', 'var(--surface-1)', 1) + '</svg>' +
      esc(spec.sizeNote || 'Battalion headcount') + '</span>' +
      '<span style="display:inline-flex;align-items:center;gap:5px;color:var(--ink-500)">' +
      '<svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" style="flex-shrink:0">' +
      '<circle cx="7" cy="6" r="5.2" fill="none" stroke="var(--ink-700)" stroke-width="1.1"/>' +
      markShape('circle', 7, 6, 2.6, 'var(--ink-500)', 'var(--ink-800)', 1.4) + '</svg>' +
      'Flagged outlier</span></div>';

    // Cost annotation. Sits in the card footer rather than in the upper-right
    // quadrant: at this scale the quadrant already carries the quadrant label
    // and three direct labels, and a fourth string in that corner made the
    // densest part of the chart the busiest part of the card.
    var cost = spec.costNote
      ? '<div style="display:flex;gap:6px;align-items:flex-start;margin-top:9px;padding-top:8px;' +
        'border-top:1px solid var(--ink-100);font-size:11.5px;color:var(--ink-600);line-height:1.45">' +
        micon('savings', { size: 14, style: 'color:var(--ink-500);flex-shrink:0;margin-top:1px' }) +
        '<span>' + esc(spec.costNote) + '</span></div>'
      : '';

    // The statistics, filed behind a disclosure. Analytics and accreditation
    // staff go looking for these; chiefs and budget directors should not have
    // to step over them to reach the finding.
    // On PAPER the panel is open. Collapsing it is a screen affordance — the
    // reader can expand it — but a printed PDF has no hover and no disclosure
    // triangle, and this document is exactly what gets circulated to the
    // analytics and accreditation staff who need r/n/p. Closed on paper would
    // not be "filed away", it would be deleted.
    var stats =
      '<details' + (spec.expandStats ? ' open' : '') + ' style="margin-top:7px">' +
      '<summary style="font-size:11px;color:var(--ink-500);cursor:pointer;list-style:none;' +
      'display:inline-flex;align-items:center;gap:4px;font-weight:600">' +
      micon('function', { size: 13 }) + 'Statistical detail</summary>' +
      '<div style="margin-top:6px;font-size:11px;color:var(--ink-600);line-height:1.6;' +
      'font-family:var(--font-mono)">' +
      'Pearson r = ' + r.toFixed(2) + ' · n = ' + n + ' battalions · ' + pText(p) + ' (two-tailed)' +
      (haveCalls
        ? '<br>Call volume — top-OT quartile median ' + fmtInt(callsQ) +
          ' vs. department median ' + fmtInt(callsAll) + ' responses/yr'
        : '') +
      // xUnit/yUnit are measurement WINDOWS ("rolling 90 days"), not units of
      // the quantity, so they cannot be appended to a median — "173 rolling 90
      // days" is nonsense. xShort/yShort carry the actual units for this line.
      '<br>Axis medians: ' + Math.round(xMed) + ' ' + esc(spec.xShort || '') + ' · ' +
      yMed.toFixed(1) + ' ' + esc(spec.yShort || '') +
      '</div>' +
      '<div style="margin-top:5px;font-size:10.5px;color:var(--ink-500);line-height:1.45">' +
      'Correlation is department-wide and descriptive; it does not establish that overtime ' +
      'caused these injuries. The finding is the outlier gap, not the slope.</div>' +
      '</details>';

    return '<div>' + headline +
      // No height attribute, and height:auto, so the viewBox ratio sets the
      // box height and the drawing never letterboxes. Same contract as
      // pdScatter — see the long note on that function.
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;height:auto" ' +
      'role="img" aria-label="' + esc(spec.yLabel + ' against ' + spec.xLabel + ' for ' + n +
        ' battalions. Battalions in the highest overtime quartile average ' + multiple.toFixed(1) +
        ' times the injury rate of the department median. Outliers: ' + namesSentence + '.') + '">' +
      yTicks + xTicks + medians + trend + field + outLabels +
      '<text x="' + ((plotL + plotR) / 2) + '" y="' + (H - 4) + '" font-size="9.5" fill="var(--ink-500)" ' +
      'text-anchor="middle">' + esc(spec.xLabel) + (spec.xUnit ? ' (' + esc(spec.xUnit) + ')' : '') + '</text>' +
      yAxisTitle +
      '</svg>' + legend + cost + stats + '</div>';
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
    pdKpi: pdKpi, pdLine: pdLine, pdBar: pdBar, pdDonut: pdDonut, pdScatter: pdScatter,
    pdOutlierScatter: pdOutlierScatter, pdTable: pdTable, pdSpark: pdSpark,
    downloadCSV: downloadCSV, TONE_FG: TONE_FG
  };
})();
