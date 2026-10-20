/* ============================================================================
   admin-ui.js — shared chrome + renderers for every admin page.
   Depends on data.js (window.BBP). Vanilla JS, no libraries.
   ========================================================================== */
(function () {
  'use strict';
  // ---- Stay on the page you were on when the browser is refreshed -----------------
  // The feature's loader always starts the frame at the Overview, so a refresh would
  // send you back there. Each page remembers itself for this tab (session only), and the
  // Overview, when it was opened by the loader rather than by clicking inside the
  // prototype, hands you back to the last page you were on. Clicking "Overview" in the
  // nav is unaffected: that arrives from another page in this folder.
  var KEY = 'bbp.lastPage';
  function here() { return location.pathname.split('/').pop() + location.search + location.hash; }
  function remember() { try { sessionStorage.setItem(KEY, here()); } catch (e) {} }
  try {
    var file = location.pathname.split('/').pop() || 'index.html';
    var last = sessionStorage.getItem(KEY);
    var fromInside = document.referrer.indexOf('/ver1/') >= 0;
    if ((file === 'index.html' || file === '') && last && !fromInside && last.split(/[?#]/)[0] !== 'index.html' && last.split(/[?#]/)[0] !== '') {
      location.replace(last);
    }
  } catch (e) {}
  remember();
  window.addEventListener('pagehide', remember);
  window.addEventListener('hashchange', remember);

  var B = window.BBP, S = B.sector;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }

  /* ---- Scope: which part of the org the report is looking at ------------- */
  function getScope() {
    var pn = new URLSearchParams(location.search).get('node');
    var id = (pn && B.node(pn)) ? pn : B.load('bbp.scope.' + B.sectorKey, S.tree.id);
    return B.node(id) ? id : S.tree.id;
  }
  function setScope(id) { B.save('bbp.scope.' + B.sectorKey, id); }

  function treeRows(n, depth, current, name) {
    var kids = n.kids || [];
    var html = '<button type="button" class="tree-row' + (n.id === current ? ' on' : '') + '" data-id="' + n.id +
      '" style="padding-left:' + (12 + depth * 18) + 'px">' +
      '<i class="fa-solid ' + (kids.length ? 'fa-folder-tree' : 'fa-user-group') + '"></i>' +
      '<span class="tree-name">' + esc(n.name) + '</span>' +
      '<span class="tree-lvl">' + esc(S.levels[depth] || '') + ' · ' + B.headcount(n.id) + '</span></button>';
    kids.forEach(function (k) { html += treeRows(k, depth + 1, current); });
    return html;
  }

  function scopeButton(onChange) {
    var cur = getScope(), n = B.node(cur);
    var wrap = document.createElement('span');
    wrap.className = 'pop-anchor scope';
    wrap.innerHTML =
      '<button type="button" class="scope-btn" aria-haspopup="true" aria-expanded="false">' +
        '<i class="fa-solid fa-sitemap"></i><span>' + esc(n.name) + '</span>' +
        '<small>' + B.headcount(cur) + '</small><i class="fa-solid fa-chevron-down chev"></i></button>' +
      '<div class="rp-pop scope-pop" role="menu">' + treeRows(S.tree, 0, cur) + '</div>';
    var btn = wrap.querySelector('.scope-btn'), pop = wrap.querySelector('.scope-pop');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pop.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target)) { pop.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    pop.querySelectorAll('.tree-row').forEach(function (r) {
      r.addEventListener('click', function () { setScope(r.dataset.id); onChange ? onChange(r.dataset.id) : location.reload(); });
    });
    return wrap;
  }

  /* ---- Page chrome -------------------------------------------------------- */
  var NAV = [
    { id: 'overview', label: 'Overview', href: 'index.html' },
    { id: 'courses',  label: 'Courses',  href: 'courses.html' },
    { id: 'learners', label: 'Learners', href: 'learners.html' },
    { id: 'settings', label: 'Settings', href: 'settings.html' }
  ];

  function demoBar() {
    var bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.innerHTML =
      '<span class="demo-tag">Demo</span>' +
      '<span class="demo-txt">Viewing as an admin at</span>' +
      '<span class="demo-seg" role="group" aria-label="Demo sector">' +
        Object.keys(B.SECTORS).map(function (k) {
          return '<button type="button" data-k="' + k + '" class="' + (k === B.sectorKey ? 'on' : '') + '">' +
            esc(B.SECTORS[k].org) + '</button>';
        }).join('') + '</span>' +
      '<span class="demo-note">Only here so reviewers can compare role versions. A real admin sees just their own sector’s version.</span>';
    bar.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.k === B.sectorKey) return;
        B.setSector(b.dataset.k);
        var u = new URL(location.href); u.searchParams.delete('sector'); u.hash = '';
        location.href = u.pathname.replace(/[^/]*$/, 'index.html'); // org shapes differ, so start from the overview
      });
    });
    return bar;
  }

  /* opts: { active, title, crumbs:[{label,href}], chips:[html], scope:bool, onScope, actions:[el|html] } */
  function head(opts) {
    document.body.insertBefore(demoBar(), document.body.firstChild);
    var h = document.createElement('header');
    h.className = 'rp-head';
    var crumb = '';
    if (opts.crumbs) {
      crumb = '<div class="rp-crumb">' + opts.crumbs.map(function (c, i) {
        return (i ? '<i class="fa-solid fa-chevron-right"></i>' : '') +
          (c.href ? '<a href="' + c.href + '">' + esc(c.label) + '</a>' : '<span>' + esc(c.label) + '</span>');
      }).join(' ') + '</div>';
    }
    // The section nav lives in a bar above the page, so a drill-down page
    // (a course, a learner) never looks like it contains the sections.
    h.innerHTML =
      '<div class="rp-top"><div class="rp-brand"><i class="fa-solid fa-layer-group"></i> Vector Training <small>· Admin</small></div>' +
        '<nav class="rp-nav" aria-label="Admin sections">' + NAV.map(function (n) {
          return '<a href="' + n.href + '"' + (n.id === opts.active ? ' class="active" aria-current="page"' : '') + '>' + n.label + '</a>';
        }).join('') + '</nav>' +
        '<span class="rp-org"><i class="fa-solid fa-building"></i>' + esc(S.org) + '</span></div>' +
      '<div class="rp-page">' + crumb +
      '<div class="rp-head-row"><h1>' + esc(opts.title) + '</h1><div class="rp-head-meta" id="headMeta"></div></div>' +
      (opts.sub ? '<div class="rp-head-sub">' + opts.sub + '</div>' : '') + '</div>';
    document.getElementById('head').replaceWith(h);
    var meta = h.querySelector('#headMeta');
    if (opts.scope) meta.appendChild(scopeButton(opts.onScope));
    (opts.chips || []).forEach(function (c) { meta.insertAdjacentHTML('beforeend', c); });
    if (opts.assign !== false) {
      var btn = document.createElement('vaadin-button');
      btn.setAttribute('theme', 'primary');
      btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:7px"></i>' + esc(opts.assignLabel || 'Assign a course');
      btn.addEventListener('click', function () { location.href = opts.assignHref || 'assign.html'; });
      meta.appendChild(btn);
    }
    return h;
  }

  // Keep a popover inside the viewport: default is right-aligned to its "?", flip to
  // left-aligned when that would run off the left edge (e.g. a "?" near the page's left margin).
  function place(pop) {
    pop.style.left = ''; pop.style.right = '';
    var r = pop.getBoundingClientRect();
    if (r.left < 12) { pop.style.left = '0'; pop.style.right = 'auto'; r = pop.getBoundingClientRect(); }
    if (r.right > window.innerWidth - 12) { pop.style.left = 'auto'; pop.style.right = '0'; }
  }
  function wirePops() {
    document.querySelectorAll('.rp-info').forEach(function (btn) {
      var pop = btn.nextElementSibling;
      if (!pop || !pop.classList.contains('rp-pop') || btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = pop.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open));
        if (open) place(pop);
      });
      document.addEventListener('click', function (e) {
        if (pop.classList.contains('open') && !pop.contains(e.target) && e.target !== btn) {
          pop.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
  function info(html, label) {
    return '<span class="pop-anchor"><button class="rp-info" aria-expanded="false" aria-label="' + esc(label || 'More info') +
      '">?</button><span class="rp-pop">' + html + '</span></span>';
  }

  /* ---- Learner renderers --------------------------------------------------- */
  function dots(profile) {
    if (!profile) return '<span class="dots-none">—</span>';
    var title = B.AREAS.map(function (a, i) { return a.name + ': ' + B.BAND[profile[i]].label; }).join(' · ');
    return '<span class="dotset" title="' + esc(title) + '">' +
      profile.map(function (b) { return '<span class="dot ' + B.BAND[b].dot + '"></span>'; }).join('') + '</span>';
  }
  function pathTag(p) {
    var m = {
      std:   ['std',    'Standard',       'Took the full course as written'],
      short: ['short',  'Skipped ahead',  'Skipped a lesson they already knew'],
      extra: ['recomp', 'Extra practice', 'A short targeted round was added after a miss'],
      up:    ['adv',    'Harder checks',  'Was ahead, so the checks were harder']
    }[p];
    return m ? '<span class="path-tag ' + m[0] + '" title="' + m[2] + '">' + m[1] + '</span>' : '<span class="dots-none">—</span>';
  }
  function statusChip(l) {
    if (l.status === 'demo' || l.status === 'followup') {
      var g = l.profile.filter(function (b) { return b >= 2; }).length;
      return l.status === 'demo'
        ? '<span class="band band-ok" title="Good or above in ' + g + ' of 5 areas">Demonstrated · ' + g + '/5</span>'
        : '<span class="band band-warn" title="A 30-day follow-up is queued">Follow-up · ' + g + '/5</span>';
    }
    return '<span class="band band-mut">' + (l.status === 'progress' ? 'In progress' : 'Not started') + '</span>';
  }
  function learnerHref(l) {
    return 'learner-report.html?learner=' + encodeURIComponent(l.name);
  }
  function learnerRow(l) {
    var u = B.node(l.unit);
    return '<tr class="row-link" data-href="' + learnerHref(l) + '">' +
      '<td class="rp-name"><span class="row-avatar">' + initials(l.name) + '</span><a href="' + learnerHref(l) + '">' + esc(l.name) + '</a>' +
        '<small class="row-role">' + esc(l.role) + ' · ' + esc(u.name) + '</small></td>' +
      '<td>' + dots(l.profile) + '</td><td>' + pathTag(l.path) + '</td><td>' + statusChip(l) + '</td></tr>';
  }
  function wireRows(root) {
    (root || document).querySelectorAll('.row-link').forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (!e.target.closest('a')) location.href = tr.dataset.href; });
    });
  }

  window.Admin = {
    esc: esc, initials: initials, head: head, wirePops: wirePops, info: info,
    getScope: getScope, setScope: setScope, scopeButton: scopeButton,
    dots: dots, pathTag: pathTag, statusChip: statusChip, learnerHref: learnerHref,
    learnerRow: learnerRow, wireRows: wireRows
  };
})();
