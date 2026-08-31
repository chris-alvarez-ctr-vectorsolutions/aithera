/* ============================================================================
   reporting-ui.js — shared data + renderers for the CLARA reporting surfaces:
   reporting.html (overview) · courses.html · course-report.html ·
   learners.html · learner-report.html.

   One dataset, many views — every page draws from the same arrays so the
   numbers agree everywhere. All figures are representative prototype data.
   ========================================================================== */
(function () {
  'use strict';

  // --- The construct framework (Individual Determinants of Behavior) --------
  var CONSTRUCTS = [
    { key: 'knowledge', name: 'Knowledge',                    icon: 'fa-book-open' },
    { key: 'beliefs',   name: 'Attitudes & beliefs',          icon: 'fa-scale-balanced' },
    { key: 'norms',     name: 'Social norms',                 icon: 'fa-users' },
    { key: 'skills',    name: 'Behavioral skills',            icon: 'fa-comment-dots' },
    { key: 'control',   name: 'Perceived behavioral control', icon: 'fa-gauge-high' }
  ];
  // Bands are an ORDERED scale: 1 Practice Needed · 2 Good · 3 Excellent.
  var BAND = {
    1: { label: 'Practice Needed', chip: 'band-warn', dot: 'dot-warn' },
    2: { label: 'Good',            chip: 'band-ok',   dot: 'dot-ok' },
    3: { label: 'Excellent',       chip: 'band-exc',  dot: 'dot-exc' }
  };

  // --- Courses ---------------------------------------------------------------
  var COURSES = [
    { id: 'bystander', name: 'Bystander Intervention', icon: 'fa-comments', iconCls: 'ci-blue',
      ai: true, due: 'Sep 15', assigned: 128, completed: 124, demonstrated: 89,
      recomposed: 62, growth: '+0.6', topGap: 'Behavioral skills',
      gapNote: '41% → 9% at Practice Needed', href: 'course-report.html', live: true },
    { id: 'hazcom', name: 'Hazard Communication: Spot the Hazard', icon: 'fa-triangle-exclamation', iconCls: 'ci-amber',
      ai: true, due: 'Oct 3', assigned: 128, completed: 41, demonstrated: 24,
      recomposed: 15, growth: '+0.4', topGap: 'Cues to action',
      gapNote: 'early signal — 41 of 128 in', live: false },
    { id: 'loto', name: 'Lockout/Tagout Essentials', icon: 'fa-bolt', iconCls: 'ci-violet',
      ai: false, due: 'Oct 20', assigned: 96, completed: 12, demonstrated: null,
      recomposed: null, growth: null, topGap: null,
      gapNote: 'standard course — completion only', live: false }
  ];

  // --- Learners ---------------------------------------------------------------
  // profile = Bystander Intervention bands [knowledge, beliefs, norms, skills,
  // control]. status: demo | followup | progress | notstarted.
  var LEARNERS = [
    { name: 'Rob Keller',     role: 'Shift lead',  done: 1, of: 3, profile: [3, 2, 2, 2, 2], mom: 'up',   path: 'recomp', status: 'demo',       completed: 'Aug 26', seat: 24 },
    { name: 'Dana Whitfield', role: 'Line tech',   done: 2, of: 3, profile: [3, 3, 2, 3, 3], mom: 'up',   path: 'short',  status: 'demo',       completed: 'Aug 25', seat: 18 },
    { name: 'Marcus Osei',    role: 'Operator',    done: 1, of: 3, profile: [2, 2, 1, 2, 2], mom: 'up',   path: 'recomp', status: 'demo',       completed: 'Aug 25', seat: 27 },
    { name: 'Priya Raman',    role: 'Supervisor',  done: 2, of: 3, profile: [3, 2, 2, 3, 2], mom: 'held', path: 'std',    status: 'demo',       completed: 'Aug 24', seat: 26 },
    { name: 'Tom Gallagher',  role: 'Operator',    done: 1, of: 3, profile: [2, 1, 1, 1, 2], mom: 'down', path: 'recomp', status: 'followup',   completed: 'Aug 24', seat: 31 },
    { name: 'Elena Vasquez',  role: 'Line tech',   done: 1, of: 3, profile: [2, 2, 2, 2, 1], mom: 'held', path: 'std',    status: 'demo',       completed: 'Aug 23', seat: 29 },
    { name: 'Jae-won Park',   role: 'Maintenance', done: 2, of: 3, profile: [3, 2, 3, 2, 3], mom: 'up',   path: 'short',  status: 'demo',       completed: 'Aug 22', seat: 17 },
    { name: 'Sandra Iwu',     role: 'Operator',    done: 1, of: 3, profile: [2, 2, 2, 1, 1], mom: 'held', path: 'recomp', status: 'followup',   completed: 'Aug 21', seat: 30 },
    { name: 'Grace Okafor',   role: 'Shift lead',  done: 2, of: 3, profile: [3, 3, 3, 2, 2], mom: 'up',   path: 'short',  status: 'demo',       completed: 'Aug 20', seat: 19 },
    { name: 'Miguel Santos',  role: 'Operator',    done: 0, of: 3, profile: null,            mom: null,   path: null,     status: 'progress',   completed: null,     seat: null },
    { name: 'Lena Kovacs',    role: 'Line tech',   done: 1, of: 3, profile: [2, 2, 2, 2, 2], mom: 'up',   path: 'std',    status: 'demo',       completed: 'Aug 19', seat: 25 },
    { name: 'Alex Romero',    role: 'Operator',    done: 0, of: 3, profile: null,            mom: null,   path: null,     status: 'notstarted', completed: null,     seat: null }
  ];

  // --- Tiny renderers ---------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function initials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }
  // Five construct dots (or an em-dash when no record yet). The title carries
  // the full reading, so the dots stay glanceable without a legend per row.
  function dots(profile) {
    if (!profile) return '<span class="dots-none">—</span>';
    var title = CONSTRUCTS.map(function (c, i) { return c.name + ': ' + BAND[profile[i]].label; }).join(' · ');
    return '<span class="dotset" title="' + esc(title) + '">' +
      profile.map(function (b) { return '<span class="dot ' + BAND[b].dot + '"></span>'; }).join('') +
      '</span>';
  }
  function momIcon(mom) {
    if (mom === 'up')   return '<span class="mom mom-up"   title="Improved since baseline"><i class="fa-solid fa-arrow-trend-up"></i></span>';
    if (mom === 'down') return '<span class="mom mom-down" title="Declined since baseline"><i class="fa-solid fa-arrow-trend-down"></i></span>';
    if (mom === 'held') return '<span class="mom mom-held" title="Held since baseline"><i class="fa-solid fa-arrows-left-right"></i></span>';
    return '<span class="dots-none">—</span>';
  }
  function pathTag(path) {
    if (path === 'recomp') return '<span class="path-tag recomp" title="The Knowledge Layer inserted targeted practice">Recomposed</span>';
    if (path === 'short')  return '<span class="path-tag short" title="Tested out of content already demonstrated">Shortened</span>';
    if (path === 'std')    return '<span class="path-tag std">Standard</span>';
    return '<span class="dots-none">—</span>';
  }
  function statusChip(l) {
    if (l.status === 'demo') {
      var atGood = l.profile.filter(function (b) { return b >= 2; }).length;
      return '<span class="band band-ok" title="Good or above on ' + atGood + ' of 5 objectives">Demonstrated · ' + atGood + '/5</span>';
    }
    if (l.status === 'followup') {
      var g = l.profile.filter(function (b) { return b >= 2; }).length;
      return '<span class="band band-warn" title="Reinforcement queued 30 days out">Follow-up · ' + g + '/5</span>';
    }
    if (l.status === 'progress') return '<span class="band band-mut">In progress</span>';
    return '<span class="band band-mut">Not started</span>';
  }
  function learnerHref(l) {
    return 'learner-report.html?learner=' + encodeURIComponent(l.name) +
           '&role=' + encodeURIComponent(l.role) + '&v=' + (l.status === 'followup' ? 'gap' : 'good');
  }

  // A learner row for the tables on learners.html / course-report.html.
  function learnerRowHTML(l, compact) {
    var cells =
      '<td class="rp-name"><span class="row-avatar">' + initials(l.name) + '</span>' +
        '<a href="' + learnerHref(l) + '">' + esc(l.name) + '</a>' +
        (compact ? '' : '<small class="row-role">' + esc(l.role) + '</small>') + '</td>' +
      (compact ? '' : '<td><span class="course-cells" title="Courses completed">' +
        [0, 1, 2].map(function (i) { return '<i class="ccell' + (i < l.done ? ' on' : '') + '"></i>'; }).join('') +
        '<span class="ccount">' + l.done + '/' + l.of + '</span></span></td>') +
      '<td>' + dots(l.profile) + '</td>' +
      '<td class="td-center">' + momIcon(l.mom) + '</td>' +
      '<td>' + pathTag(l.path) + '</td>' +
      '<td>' + statusChip(l) + '</td>';
    return '<tr class="row-link" data-href="' + learnerHref(l) + '">' + cells + '</tr>';
  }

  // Make whole rows clickable (the name stays a real link for a11y).
  function wireRowLinks(root) {
    (root || document).querySelectorAll('.row-link').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        window.location.href = tr.dataset.href;
      });
    });
  }

  // Highlight the active tab in the shared reporting sub-nav.
  function nav(active) {
    document.querySelectorAll('.rp-nav a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.nav === active);
    });
  }

  // The "?" info popovers — context on request, never on the page by default.
  function wireInfoPops() {
    document.querySelectorAll('.rp-info').forEach(function (btn) {
      var pop = btn.nextElementSibling;
      if (!pop || !pop.classList.contains('rp-pop')) return;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = pop.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) {
        if (pop.classList.contains('open') && !pop.contains(e.target) && e.target !== btn) {
          pop.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  window.ClaraReporting = {
    CONSTRUCTS: CONSTRUCTS, BAND: BAND, COURSES: COURSES, LEARNERS: LEARNERS,
    esc: esc, initials: initials, dots: dots, momIcon: momIcon, pathTag: pathTag,
    statusChip: statusChip, learnerHref: learnerHref, learnerRowHTML: learnerRowHTML,
    wireRowLinks: wireRowLinks, nav: nav, wireInfoPops: wireInfoPops
  };
})();
