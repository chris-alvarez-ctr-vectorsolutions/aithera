/* ============================================================================
   credit.js — "Beyond this course". What proving things in this module did
   for the person's (or the group's) other required courses.

   Left column:  what was proved in this module.
   Right column: the other courses in the requirement set, objective by
                 objective; the ones this module already covered are checked.
   Between:      links from a proved area to every objective it also counts for.

   Credit['render'](el, { mode: 'learner', learner, first })   one person
   Credit['render'](el, { mode: 'cohort',  scope })            a group
   ========================================================================== */
(function () {
  'use strict';
  var B = window.BBP;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function ring(done, total, color, label) {
    var r = 17, c = 2 * Math.PI * r, f = total ? done / total : 0;
    return '<span class="cr-ring" role="img" aria-label="' + esc(label) + '"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="' + r + '" class="rg-bg"/>' +
      '<circle cx="22" cy="22" r="' + r + '" class="rg-fg" style="stroke:' + color + ';stroke-dasharray:' + (f * c).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 22 22)"/></svg>' +
      '<b>' + done + '<small>/' + total + '</small></b></span>';
  }

  function render(el, cfg) {
    var cohort = cfg.mode === 'cohort', cat = B.catalog();
    var data = cohort ? B.creditCohort(cfg.scope) : B.credit(cfg.learner);
    var profile = cohort ? null : cfg.learner.profile;
    var keys = B.AREAS.map(function (a) { return a.key; });
    var others = data.courses.filter(function (c) { return c.id !== 'bbp'; });
    var bbp = data.courses.filter(function (c) { return c.id === 'bbp'; })[0];
    var n = cohort ? data.completers : 0;

    // ---- summary ---------------------------------------------------------------
    var seen = {}, helped = 0;                       // unique objectives, so a shared one isn't counted twice
    others.forEach(function (c) {
      var k = c.items.filter(function (i) { return cohort ? i.people > 0 : i.credited; });
      k.forEach(function (i) { seen[i.id] = 1; }); if (k.length) helped++;
    });
    var sharedDone = Object.keys(seen).length;
    var summary;
    if (cohort) {
      summary = '<b>' + sharedDone + ' objectives</b> in ' + helped + ' other courses are already covered for most of the ' + n + ' people who finished, because they proved them here.';
    } else {
      summary = sharedDone === 0
        ? '<b>Nothing from this module counts in other courses yet.</b> ' + esc(cfg.first) + ' is still at Practice Needed on the areas they share, so those courses stay as assigned. ' + data.overall.done + ' of ' + data.overall.total + ' objectives toward ' + esc(cfg.role || 'the role') + ' requirements are done.'
        : '<b>' + esc(cfg.first) + ' proved ' + sharedDone + ' objectives here that also count in ' + helped + ' other course' + (helped === 1 ? '' : 's') + '</b>, so ' + data.overall.done + ' of ' + data.overall.total +
        ' objectives toward ' + esc(cfg.role || 'the role') + ' requirements are done.';
    }

    // ---- rings -----------------------------------------------------------------
    var bbpDone = cohort ? B.AREAS.length : (profile ? profile.filter(function (b) { return b >= 2; }).length : 0);
    var ringCards = '<div class="cr-ringcard here">' + ring(bbpDone, B.AREAS.length, '#0271ce', 'This module') +
      '<span><b>This module</b><small>Bloodborne Pathogens</small></span></div>' +
      others.map(function (c) {
        var lbl = cohort ? 'covered for most' : (c.done ? 'already covered' : 'nothing covered yet');
        return '<div class="cr-ringcard">' + ring(c.done, c.total, c.color, c.name) +
          '<span><b>' + esc(c.name) + '</b><small>' + (c.done + ' of ' + c.total + ' ' + lbl) + '</small></span></div>';
      }).join('');

    // ---- columns -----------------------------------------------------------------
    var left = B.AREAS.map(function (a, i) {
      var pr = cohort ? Math.round(B.PROOF_RATE[a.key] * 100) : null, ok = cohort ? true : profile && profile[i] >= 2;
      return '<li><button type="button" class="cr-item left ' + (ok ? 'ok' : 'open') + '" data-k="a:' + a.key + '">' +
        '<span class="cr-ico"><i class="fa-solid ' + a.icon + '"></i></span>' +
        '<span class="cr-name"><b>' + a.name + '</b><small>' + (cohort ? pr + '% proved it' : (ok ? 'Proved' : 'Not yet')) + '</small></span>' +
        '<span class="cr-port"></span></button></li>';
    }).join('');

    var right = others.map(function (c) {
      var items = c.items.map(function (it) {
        var ok = cohort ? it.people > 0 : it.credited;
        var area = it.proof ? B.AREAS.filter(function (a) { return a.key === it.proof; })[0].name : null;
        var sub = cohort ? (it.people ? it.people + ' people covered' : 'Still to do for everyone')
                         : (ok ? 'Already covered' : (it.proof ? 'Counts once ' + 'it’s proved' : 'Still to do'));
        return '<li><button type="button" class="cr-item right ' + (ok ? 'ok' : 'open') + '" data-k="o:' + it.id + ':' + c.id + '" style="--c:' + c.color + '">' +
          '<span class="cr-port"></span><span class="cr-check"><i class="fa-solid ' + (ok ? 'fa-check' : 'fa-circle') + '"></i></span>' +
          '<span class="cr-name"><b>' + esc(it.name) + '</b><small>' + sub + (area && ok ? ' · from ' + esc(area) : '') + '</small></span></button></li>';
      }).join('');
      return '<section class="cr-course" style="--c:' + c.color + '"><header><span class="cr-cico"><i class="fa-solid ' + c.icon + '"></i></span><b>' + esc(c.name) + '</b>' +
        '<small>' + (cohort ? c.items.filter(function (i) { return i.people > 0; }).length : c.done) + ' of ' + c.total + ' covered</small></header><ul>' + items + '</ul></section>';
    }).join('');

    el.innerHTML =
      '<p class="cr-summary">' + summary + '</p>' +
      '<div class="cr-rings">' + ringCards + '</div>' +
      '<div class="cr-map"><svg class="cr-links" aria-hidden="true"></svg>' +
        '<div class="cr-left"><h4>' + (cohort ? 'What people proved here' : 'What ' + esc(cfg.first) + ' proved here') + '</h4><ul>' + left + '</ul></div>' +
        '<div class="cr-right"><h4>Where it also counts</h4>' + right + '</div></div>' +
      '<p class="cr-note"><i class="fa-solid fa-circle-info"></i> Credit counts in a course only where skip-ahead is on, and stays valid for 12 months. Which objectives are shared is set by the course authors.</p>';

    // ---- links -------------------------------------------------------------------
    var map = el.querySelector('.cr-map'), svg = el.querySelector('.cr-links');
    var links = [];
    others.forEach(function (c) {
      c.items.forEach(function (it) {
        if (!it.proof) return;
        var ai = keys.indexOf(it.proof), ok = cohort ? it.people > 0 : it.credited;
        links.push({ from: 'a:' + it.proof, to: 'o:' + it.id + ':' + c.id, color: c.color, ok: ok, w: cohort ? 2 + (it.people / n) * 3.5 : 2.6 });
      });
    });
    function port(key) { var b = map.querySelector('[data-k="' + key + '"] .cr-port'); return b; }
    function draw() {
      var mr = map.getBoundingClientRect(), narrow = mr.width < 720;
      svg.style.display = narrow ? 'none' : '';
      if (narrow) return;
      svg.setAttribute('viewBox', '0 0 ' + mr.width + ' ' + mr.height);
      svg.setAttribute('width', mr.width); svg.setAttribute('height', mr.height);
      svg.innerHTML = links.map(function (l) {
        var a = port(l.from), b = port(l.to); if (!a || !b) return '';
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var x1 = ra.left + ra.width / 2 - mr.left, y1 = ra.top + ra.height / 2 - mr.top;
        var x2 = rb.left + rb.width / 2 - mr.left, y2 = rb.top + rb.height / 2 - mr.top;
        var dx = (x2 - x1) * 0.5;
        return '<path class="cr-link' + (l.ok ? ' ok' : '') + '" data-from="' + l.from + '" data-to="' + l.to + '" style="stroke:' + l.color + ';stroke-width:' + l.w + 'px" d="M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ',' + (x2 - dx) + ' ' + y2 + ',' + x2 + ' ' + y2 + '"/>';
      }).join('');
    }
    function focus(key) {
      var rel = {};
      if (key) {
        links.forEach(function (l) { if (l.from === key || l.to === key) { rel[l.from] = 1; rel[l.to] = 1; } });
        rel[key] = 1;
      }
      map.classList.toggle('has-focus', !!key);
      svg.querySelectorAll('.cr-link').forEach(function (p) { p.classList.toggle('hot', !!key && (p.dataset.from === key || p.dataset.to === key)); });
      map.querySelectorAll('.cr-item').forEach(function (b) { b.classList.toggle('hot', !!key && !!rel[b.dataset.k]); });
    }
    map.querySelectorAll('.cr-item').forEach(function (b) {
      ['mouseenter', 'focus'].forEach(function (ev) { b.addEventListener(ev, function () { focus(b.dataset.k); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { b.addEventListener(ev, function () { focus(null); }); });
    });
    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(map); else window.addEventListener('resize', draw);
  }

  window.Credit = { render: render };
})();
