/* global KX, KEYSTONE, AGENCY_INTEL, AGENCY_INTEL_ROSTER */
/* =====================================================================
   agency-intel-audience.js — the "Who sees it live?" dialog.

   Two steps behind one dialog shell:
     1. Audience — three ways to pick people, each a Selection List:
          • Job titles        — the 8 roles (v2, Future-functionality flag)
          • Named individuals — the full roster, searchable
          • AI groups         — saved live rules, pick only; groups are
                                MADE on the home screen's AI groups tab
                                (agency-intel-groups.js), and this tab
                                links there
     2. Review  — the itemised roster, cadence + format, then publish.

   Every audience tab is the Vector "Selection List" design pattern: a
   vaadin-grid with a selection column on the left and a vwc-drawer on
   the right that itemises what is picked, each entry removable. Ticking
   a row and removing it from the panel are the same state — the panel
   is the one place the whole selection can be read without scrolling.

   Selections UNION across all three tabs and de-duplicate by person, so
   "all Captains plus the HazMat crew" is one audience, counted once.

   All matching logic lives in agency-intel-roster.js; this file only
   renders and wires. Three traps this file is written around:
     • the dialog renders into a vaadin-dialog overlay outside #root, so
       every handler is delegated on the dialog body element;
     • vaadin-grid is a component, not markup — its items, renderers and
       selection are set in hydrate() after each paint, and a selection
       change updates the side panel in place rather than repainting the
       grid (a repaint would reset its scroll and drop the focused row);
     • the search input filters the grid in place for the same reason.
   ===================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CP = window.AGENCY_INTEL;
  var R = window.AGENCY_INTEL_ROSTER;
  var esc = KX.esc, attr = KX.attr, micon = KX.micon;

  var S = null;                           // per-open state
  var OPTS = null;                        // options passed to open()
  var HOST = null;                        // dialog body element
  var DLG = null;

  /* ---------------------------------------------------------------- */
  /* Shared bits                                                       */
  /* ---------------------------------------------------------------- */

  function srcDots(list) {
    return '<span style="display:inline-flex;gap:4px;flex-wrap:wrap">' +
      (list || []).map(function (s) { return KX.srcChip(s); }).join('') + '</span>';
  }

  function reach() {
    return R.resolveAudience({ titles: S.titles, individuals: S.individuals, groups: S.groups });
  }

  function personLine(p) {
    return esc(p.rank) + ' · ' + esc(p.stationName) + ' · ' + esc(p.grade);
  }

  /* ---------------------------------------------------------------- */
  /* Selection List — one renderer for all three tabs                  */
  /* ---------------------------------------------------------------- */

  /* A tab is described by a spec; the markup and the grid wiring are
     shared. `key` is the S[] array the tab reads and writes.

       key        'titles' | 'individuals' | 'groups'
       items      the full list, each with an `id`
       columns    [{ header, render(item) -> html, width?, grow? }]
       noun       'people' / 'job titles' / 'groups' — for the counts
       searchable show the search box (and what it filters on)
       haystack   (item) -> lowercase string the search matches
       side(item) -> html for the item's row in the selection panel
       above      optional html between the search box and the grid
       empty      html when the full list is empty */

  function visible(spec) {
    var q = (S.search || '').trim().toLowerCase();
    if (!q || !spec.searchable) return spec.items.slice();
    return spec.items.filter(function (it) { return spec.haystack(it).indexOf(q) !== -1; });
  }

  var SPECS = {
    titles: function () {
      return {
        key: 'titles',
        items: CP.JOB_TITLES || [],
        noun: 'job titles',
        searchable: false,
        columns: [
          { header: 'Job title', grow: 2, render: function (t) {
            return '<span class="au-cell-name">' + esc(t.label) + '</span>';
          } },
          { header: 'People', width: '90px', render: function (t) {
            return '<span class="au-cell-num">' + t.count + '</span>';
          } },
          { header: 'Entitlements', width: '232px', render: function (t) { return srcDots(t.entitlements); } }
        ],
        side: function (t) {
          return '<span class="au-side-name">' + esc(t.label) + '</span>' +
            '<span class="au-side-sub">Job title · ' + t.count + ' people</span>';
        }
      };
    },
    individuals: function () {
      return {
        key: 'individuals',
        items: R.ROSTER,
        noun: 'people',
        searchable: true,
        placeholder: 'Search ' + R.ROSTER.length + ' people — name, rank, station…',
        haystack: function (p) {
          return (p.name + ' ' + p.rank + ' ' + p.stationName + ' ' + p.stationLabel + ' ' +
            p.grade + ' ' + p.battalion).toLowerCase();
        },
        columns: [
          { header: 'Name', grow: 2, render: function (p) {
            return '<span class="au-cell-name">' + esc(p.name) + '</span>';
          } },
          { header: 'Rank', width: '125px', render: function (p) { return esc(p.rank); } },
          { header: 'Station', width: '135px', render: function (p) {
            return esc(p.stationName) + ' <span class="au-cell-dim">· ' + esc(p.grade) + '</span>';
          } },
          // Five chips need ~215px; a flexible column wraps them to two lines.
          { header: 'Entitlements', width: '232px', render: function (p) { return srcDots(p.entitlements); } }
        ],
        side: function (p) {
          return '<span class="au-side-name">' + esc(p.name) + '</span>' +
            '<span class="au-side-sub">' + personLine(p) + '</span>';
        }
      };
    },
    groups: function () {
      return {
        key: 'groups',
        items: R.GROUPS,
        noun: 'groups',
        searchable: false,
        // Groups are made elsewhere now — say so above the list, with the
        // way there, so the person who came here to BUILD one isn't stuck.
        above: '<div class="au-manage">' + micon('bolt', { size: 14, fill: 1 }) +
          '<span class="au-manage-text">AI groups are live rules — people who match later receive this automatically. ' +
          'Groups are created and edited on the home screen.</span>' +
          '<button class="au-link" data-au-manage="1">Manage groups ' +
          micon('arrow_outward', { size: 14 }) + '</button></div>',
        empty: '<div class="au-empty">No saved groups yet. ' +
          '<button class="au-link" data-au-manage="1">Create one on the AI groups tab</button></div>',
        columns: [
          { header: 'Group', grow: 2, render: function (g) {
            return '<span class="au-cell-name">' + micon('auto_awesome', { size: 13, color: 'var(--amber-700)' }) +
              ' ' + esc(g.name) + '</span>';
          } },
          { header: 'Rule', grow: 3, render: function (g) {
            return '<span class="au-cell-dim">' + esc(R.ruleLine(g)) + '</span>';
          } },
          { header: 'People today', width: '110px', render: function (g) {
            return '<span class="au-cell-num">' + R.evaluate(g).count + '</span>';
          } }
        ],
        side: function (g) {
          var n = R.evaluate(g).count;
          return '<span class="au-side-name">' + esc(g.name) + '</span>' +
            '<span class="au-side-sub">Live rule · ' + n + ' ' + (n === 1 ? 'person' : 'people') + ' today</span>';
        }
      };
    }
  };

  function currentSpec() { return SPECS[S.tab](); }

  function sideRows(spec) {
    var picked = S[spec.key];
    if (!picked.length) {
      return '<li class="au-side-empty">Nothing selected yet — tick a row to add it.</li>';
    }
    return picked.map(function (id) {
      var it = spec.items.find(function (x) { return x.id === id; });
      if (!it) return '';
      return '<li class="au-side-item">' +
        '<span style="flex:1;min-width:0">' + spec.side(it) + '</span>' +
        '<vaadin-button theme="icon tertiary small" data-au-unpick="' + attr(id) + '" ' +
        'aria-label="Remove">' + micon('close', { size: 15 }) + '</vaadin-button></li>';
    }).join('');
  }

  function sideCount(spec) {
    return S[spec.key].length + ' of ' + spec.items.length + ' selected';
  }

  function selectionListHtml(spec) {
    if (!spec.items.length) return (spec.above || '') + (spec.empty || '<div class="au-empty">Nothing to choose from.</div>');

    var cols = spec.columns.map(function (c, i) {
      return '<vaadin-grid-column header="' + attr(c.header) + '" data-au-col="' + i + '"' +
        (c.width ? ' width="' + c.width + '" flex-grow="0"' : '') +
        (c.grow ? ' flex-grow="' + c.grow + '"' : '') + '></vaadin-grid-column>';
    }).join('');

    return (spec.searchable
      ? '<input class="au-search" id="auSearch" placeholder="' + attr(spec.placeholder) + '" ' +
        'value="' + attr(S.search) + '" aria-label="Search">'
      : '') +
      (spec.above || '') +
      // The Selection List pattern: grid on the left, selection drawer on the
      // right. `relative-drawer` keeps the drawer inside this box instead of
      // the viewport; the breakpoint flips it to an overlay when the dialog
      // is too narrow to show both side by side.
      '<vwc-drawer class="au-sel" position="end" theme="no-padding relative-drawer" ' +
      (S.sideOpen ? 'open ' : '') + 'overlay-breakpoint="600">' +
      '<div slot="content" class="vwc-horizontal-container au-sel-content">' +
      '<vaadin-grid id="auGrid" class="vwc-horizontal-container--child-grow au-grid" item-id-path="id" theme="compact">' +
      '<vaadin-grid-selection-column auto-select></vaadin-grid-selection-column>' +
      cols + '</vaadin-grid>' +
      '<vaadin-button theme="primary small" class="au-sel-open" data-au-side="open" title="Show selection">' +
      micon('left_panel_open', { size: 16 }) + '<span class="kx-btn-label">Selection</span>' +
      '<span class="au-pip au-sel-open-pip" id="auSideBadge"' + (S[spec.key].length ? '' : ' hidden') + '>' +
      S[spec.key].length + '</span></vaadin-button>' +
      '</div>' +
      '<div slot="drawer-content" class="vwc-vertical-container au-side">' +
      '<vwc-headline heading-level="2" class="au-side-head vwc-vertical-container--sticky-header">' +
      '<span slot="icon" class="au-side-icon">' + micon('checklist', { size: 20 }) + '</span>' +
      '<span slot="header-text">Selection</span>' +
      '<vaadin-button slot="header-end" theme="icon tertiary small" data-au-side="close" ' +
      'aria-label="Hide selection" title="Hide selection">' + micon('arrow_forward', { size: 18 }) + '</vaadin-button>' +
      '<span slot="subtext" id="auSideCount">' + sideCount(spec) + '</span>' +
      '</vwc-headline>' +
      '<ul class="au-side-list vwc-vertical-container--child-grow" id="auSideList">' + sideRows(spec) + '</ul>' +
      '</div></vwc-drawer>';
  }

  /* After a selection change: refresh the parts that show the selection
     without touching the grid. The grid already reflects it. */
  function refreshSelection() {
    if (!HOST) return;
    var spec = currentSpec();
    var list = HOST.querySelector('#auSideList');
    if (list) list.innerHTML = sideRows(spec);
    var count = HOST.querySelector('#auSideCount');
    if (count) count.textContent = sideCount(spec);
    var badge = HOST.querySelector('#auSideBadge');
    if (badge) {
      badge.textContent = S[spec.key].length;
      if (S[spec.key].length) badge.removeAttribute('hidden'); else badge.setAttribute('hidden', '');
    }
    // Tab pips + footer summary + the Review button's enabled state.
    tabs().forEach(function (t) {
      var btn = HOST.querySelector('[data-au-tab="' + t.id + '"]');
      if (!btn) return;
      var pip = btn.querySelector('.au-pip');
      var n = S[t.id].length;
      if (n && !pip) {
        pip = document.createElement('span'); pip.className = 'au-pip'; btn.appendChild(pip);
      }
      if (pip) { if (n) pip.textContent = n; else pip.remove(); }
    });
    var sum = HOST.querySelector('.au-sum');
    var n = reach().length;
    if (sum) sum.innerHTML = summaryHtml(n);
    var next = HOST.querySelector('#auNext');
    if (next) { if (n) next.removeAttribute('disabled'); else next.setAttribute('disabled', ''); }
  }

  /* Wire the grid after a paint: items, column renderers, selection. */
  function mountGrid() {
    // The drawer's built-in close button is replaced by the headline's own
    // hide action, so the panel header reads as one row. `closable` is a
    // boolean property — an attribute of "false" would still count as present.
    var drawer = HOST.querySelector('.au-sel');
    if (drawer) drawer.closable = false;

    var grid = HOST.querySelector('#auGrid');
    if (!grid) return;
    var spec = currentSpec();

    spec.columns.forEach(function (c, i) {
      var col = grid.querySelector('[data-au-col="' + i + '"]');
      if (col) col.renderer = function (root, _col, model) { root.innerHTML = c.render(model.item); };
    });

    var vis = visible(spec);
    grid.items = vis;
    grid.selectedItems = vis.filter(function (it) { return S[spec.key].indexOf(it.id) !== -1; });

    // The grid only knows the rows it is showing, so a change there replaces
    // the VISIBLE part of the selection and keeps whatever the search is
    // hiding — "capt", select all, then clear the search must not lose the
    // Captains nor drop the Lieutenants picked before.
    grid.addEventListener('selected-items-changed', function (e) {
      var shown = {};
      (grid.items || []).forEach(function (it) { shown[it.id] = true; });
      var kept = S[spec.key].filter(function (id) { return !shown[id]; });
      var picked = (e.detail.value || []).map(function (it) { return it.id; });
      // Preserve the order people were picked in — the side panel lists in
      // that order, and a re-sort on every tick would make it jump.
      var next = S[spec.key].filter(function (id) { return picked.indexOf(id) !== -1 || !shown[id]; });
      picked.forEach(function (id) { if (next.indexOf(id) === -1) next.push(id); });
      kept.forEach(function (id) { if (next.indexOf(id) === -1) next.push(id); });
      S[spec.key] = next;
      refreshSelection();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Step 2 — review                                                   */
  /* ---------------------------------------------------------------- */

  /* Everything this dashboard is published to, itemised, each removable.

     Counting chips ("2 groups · 5 people") answered "how many" but never
     "who" — the only way to find out was to open a tab and read the ticks,
     and an AI group could not be taken off at all without hunting for its
     row. An audience you cannot enumerate is an audience you cannot revoke,
     so the review step lists every entry by name with its own Remove. */
  function audienceRows() {
    var rows = [];

    S.groups.forEach(function (id) {
      var g = R.groupById(id);
      var n = g ? R.evaluate(g).count : 0;
      rows.push({
        kind: 'group', id: id,
        name: g ? g.name : id,
        icon: 'auto_awesome',
        // A live rule's reach is today's count — it moves on its own, which is
        // exactly why the owner needs to see the number before dropping it.
        sub: 'Live rule · ' + n + ' ' + (n === 1 ? 'person' : 'people') + ' today',
        reach: n
      });
    });

    S.titles.forEach(function (id) {
      var t = CP.titleById(id);
      rows.push({
        kind: 'title', id: id,
        name: t ? t.label : id,
        icon: 'badge',
        sub: 'Job title · ' + ((t && t.count) || 0) + ' people',
        reach: (t && t.count) || 0
      });
    });

    S.individuals.forEach(function (id) {
      var p = R.personById(id) ||
        (CP.INDIVIDUALS || []).find(function (x) { return x.id === id; });
      rows.push({
        kind: 'person', id: id,
        name: p ? p.name : id,
        icon: 'person',
        sub: p ? personLine(p) : 'Named individual',
        reach: 1
      });
    });

    return rows;
  }

  function publishedToHtml() {
    var rows = audienceRows();
    if (!rows.length) {
      return '<div class="au-sec">Published to</div>' +
        '<div class="au-empty" style="margin-bottom:4px">Nobody yet — this stays a draft ' +
        'until you add someone.</div>';
    }
    // On a dashboard that has been unpublished this roster is a MEMORY, not a
    // statement of who has it — nobody does. Saying "Published to" over it
    // would be the one place this flow can mislead, so the heading changes and
    // the note says what pressing Publish will do.
    return '<div class="au-sec">' + (S.restoring ? 'Previously published to' : 'Published to') +
      '<span class="au-sec-n">' + rows.length + '</span></div>' +
      (S.restoring
        ? '<div class="au-note" style="margin-bottom:8px">' + micon('history', { size: 13, fill: 1 }) +
          ' This dashboard is unpublished — nobody sees it right now. Publishing ' +
          'puts it back in front of everyone listed here.</div>'
        : '') +
      '<div class="au-roster">' + rows.map(function (r) {
        return '<div class="au-rrow">' +
          '<span class="au-rmark au-rmark--' + r.kind + '">' + micon(r.icon, { size: 14, fill: 1 }) + '</span>' +
          '<span style="flex:1;min-width:0">' +
          '<span class="au-row-name">' + esc(r.name) + '</span>' +
          '<span class="au-row-sub">' + esc(r.sub) + '</span></span>' +
          '<button class="au-rdrop" data-au-remove="' + attr(r.kind) + '" ' +
          'data-au-remove-id="' + attr(r.id) + '" ' +
          'title="Remove from this dashboard" aria-label="Remove ' + attr(r.name) + '">' +
          micon('close', { size: 15 }) + '</button></div>';
      }).join('') + '</div>';
  }

  function reviewHtml() {
    var ids = reach();
    var parts = [];
    if (S.titles.length) parts.push(S.titles.length + ' job title' + (S.titles.length === 1 ? '' : 's'));
    if (S.individuals.length) parts.push(S.individuals.length + ' named');
    if (S.groups.length) parts.push(S.groups.length + ' AI group' + (S.groups.length === 1 ? '' : 's'));

    return publishedToHtml() +
      '<div class="au-sec" style="margin-top:14px">Reach</div>' +
      '<div class="au-review">' + micon('groups', { size: 18, fill: 1 }) +
      '<span><b>' + ids.length + ' people</b> — ' + esc(parts.join(' + ') || 'nothing selected') + '</span>' +
      '<button class="au-link" data-au-step="audience">Add more</button></div>' +
      (S.groups.length
        ? '<div class="au-note">' + micon('bolt', { size: 13, fill: 1 }) +
          ' AI groups are live rules — people who match later receive this automatically.</div>'
        : '') +
      // Emailed report delivery is NOT in v1 — the whole second destination
      // sits behind the Future-functionality flag (see deliveryOf() in
      // agency-intel-page-data.js). With the flag off, publishing live to the
      // audience above is the only outcome of this dialog. S.schedule is
      // already false in that case, because open() reads CP.deliveryOf().
      (CP.deliveryEnabled()
        ? '<div class="au-sec" style="margin-top:16px">Or deliver it as a report</div>' +
          '<label class="au-sched"><vaadin-checkbox id="auSchedule"' + (S.schedule ? ' checked' : '') +
          '></vaadin-checkbox><span><b>Schedule delivery</b>' +
          '<span>Sends on a cadence to the audience above.</span></span></label>' +
          '<div id="auSchedOpts" style="display:' + (S.schedule ? 'grid' : 'none') +
          ';grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
          '<vaadin-select theme="outlined" id="auCadence" label="Cadence" style="width:100%"></vaadin-select>' +
          '<vaadin-select theme="outlined" id="auFormat" label="Format" style="width:100%"></vaadin-select>' +
          '</div>'
        : '');
  }

  /* ---------------------------------------------------------------- */
  /* Shell                                                             */
  /* ---------------------------------------------------------------- */

  // Job titles are v2 only — see audienceOf() in agency-intel-page-data.js. The
  // tab drops out of the segmented control rather than rendering disabled: with
  // it gone the control reads as a straight two-way choice between naming people
  // and describing them, which is the whole v1 story.
  var ALL_TABS = [
    { id: 'titles', label: 'Job titles', icon: 'badge', gated: true },
    { id: 'individuals', label: 'Named individuals', icon: 'person' },
    { id: 'groups', label: 'AI groups', icon: 'auto_awesome' }
  ];
  function tabs() {
    return ALL_TABS.filter(function (t) { return !t.gated || CP.titlesEnabled(); });
  }

  function summaryHtml(n) {
    return n
      ? 'Reaches <b>' + n + '</b> ' + (n === 1 ? 'person' : 'people')
      : 'No audience selected yet';
  }

  function bodyHtml() {
    var n = reach().length;

    return (S.step === 'audience'
      ? '<div class="au-tabs">' + tabs().map(function (t) {
          var on = S.tab === t.id;
          var count = S[t.id].length;
          return '<button data-au-tab="' + t.id + '" class="' + (on ? 'is-on' : '') + '">' +
            micon(t.icon, { size: 15 }) + ' ' + esc(t.label) +
            (count ? '<span class="au-pip">' + count + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="au-promise">Everyone selected gets it on their homepage automatically — ' +
        'current and future.</div>' +
        '<div class="au-tabbody au-tabbody--list">' + selectionListHtml(currentSpec()) + '</div>'
      : '<div class="au-tabbody' + (CP.deliveryEnabled() ? '' : ' is-short') + '">' +
        reviewHtml() + '</div>') +
      '<div class="au-foot">' +
      '<span class="au-sum">' + summaryHtml(n) + '</span>' +
      (S.step === 'review'
        ? '<button class="au-link" data-au-step="audience">' + micon('arrow_back', { size: 14 }) +
          ' Back</button>' +
          '<vaadin-button theme="primary" id="auPublish">' + micon('campaign', { size: 16 }) +
          '<span class="kx-btn-label">Publish</span></vaadin-button>'
        : '<button class="au-link" id="auCancel">Cancel</button>' +
          '<vaadin-button theme="primary" id="auNext"' + (n ? '' : ' disabled') + '>' +
          '<span class="kx-btn-label">Review &amp; publish</span>' +
          micon('arrow_forward', { size: 16 }) + '</vaadin-button>') +
      '</div>';
  }

  function paint() {
    if (!HOST) return;
    HOST.innerHTML = bodyHtml();
    hydrate();
  }

  function hydrate() {
    mountGrid();

    var cad = HOST.querySelector('#auCadence');
    if (cad) {
      cad.items = CP.CADENCES.map(function (c) { return { label: c.label, value: c.id }; });
      cad.value = S.cadence;
      cad.addEventListener('value-changed', function (e) {
        if (e.detail.value) S.cadence = e.detail.value;
      });
    }
    var fmt = HOST.querySelector('#auFormat');
    if (fmt) {
      fmt.items = CP.REPORT_FORMATS.map(function (f) { return { label: f.label, value: f.id }; });
      fmt.value = S.format;
      fmt.addEventListener('value-changed', function (e) {
        if (e.detail.value) S.format = e.detail.value;
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Open                                                              */
  /* ---------------------------------------------------------------- */

  function open(opts) {
    var d = opts.dashboard;
    // audienceOf(), not d.assignedTo: with job titles behind the flag the dialog
    // must not carry title selections it has no tab to show. The dashboard keeps
    // them — assignDash() merges them back — so nothing is lost.
    //
    // Falling back to lastAudience is what makes Unpublish reversible: a
    // dashboard that has been taken down has no live audience, but the one it
    // HAD is remembered, and re-opening this dialog should offer to restore it
    // rather than make you rebuild three groups and twelve people by hand.
    // `restoring` is true only in that case, and the roster says so — otherwise
    // the review step would list people who do not currently have this.
    var live = CP.audienceOf(d);
    var restoring = !live && !!d.lastAudience;
    var a = live || (restoring ? d.lastAudience : null) || {};
    var del = CP.deliveryOf(d);

    OPTS = opts;
    S = {
      // Callers can open straight on the roster — see openAssignDialog.
      step: opts.step === 'review' ? 'review' : 'audience',
      tab: tabs()[0].id,
      titles: (a.titles || []).slice(),
      individuals: (a.individuals || []).slice(),
      groups: (a.groups || []).slice(),
      // Drives the "remembered, not live" note on the roster. Deliberately NOT
      // cleared when the person edits the list: it states that the DASHBOARD is
      // currently unpublished, which stays true until they publish, and the
      // note is worded about whoever is listed at that moment rather than about
      // the original audience. One less piece of state to keep honest.
      restoring: restoring,
      search: '',
      sideOpen: true,                         // the selection drawer, per open
      cadence: (del || {}).cadence || CP.CADENCES[0].id,
      format: (del || {}).format || CP.REPORT_FORMATS[0].id,
      schedule: !!del
    };

    DLG = KX.openDialog({
      title: 'Who sees it live?',
      // Kept short on purpose: the dialog overlay sizes to its widest child,
      // and a long subtitle stretches it past the body.
      subtitle: 'Put “' + d.name + '” in front of the right people.',
      icon: 'groups',
      accent: 'var(--teal-400)',
      // Wide enough for the grid and the selection panel side by side.
      width: '1040px',
      body: '<div id="auHost"></div>',
      onMount: function (body, dlg) {
        HOST = body.querySelector('#auHost');
        DLG = dlg;
        paint();

        // One delegated click handler — the dialog lives in an overlay
        // outside #root, so this must be bound to the dialog body.
        body.addEventListener('click', function (e) {
          var el;

          if ((el = e.target.closest('[data-au-tab]'))) {
            S.tab = el.getAttribute('data-au-tab'); S.search = ''; paint(); return;
          }
          if ((el = e.target.closest('[data-au-step]'))) {
            S.step = el.getAttribute('data-au-step'); paint(); return;
          }
          // Show / hide the selection panel. The drawer keeps its own open
          // state; S.sideOpen just makes the choice survive a tab switch.
          if ((el = e.target.closest('[data-au-side]'))) {
            var drawer = HOST.querySelector('.au-sel');
            S.sideOpen = el.getAttribute('data-au-side') === 'open';
            if (drawer) drawer.open = S.sideOpen;
            return;
          }
          // Hand-off to the AI groups tab on the home screen: close here,
          // land there. The page decides what that means.
          if (e.target.closest('[data-au-manage]')) {
            dlg.opened = false;
            if (OPTS.onManageGroups) OPTS.onManageGroups();
            return;
          }
          /* Remove one audience entry from the review roster.

             Nothing here is destructive on its own — the dialog still commits
             on Publish — but a group can carry a dozen people who lose the
             dashboard, and that number is not visible from a close button. So
             an entry with real reach asks first; an empty one just goes. */
          if ((el = e.target.closest('[data-au-remove]'))) {
            var rk = el.getAttribute('data-au-remove');
            var rid = el.getAttribute('data-au-remove-id');
            var row = audienceRows().find(function (x) {
              return x.kind === rk && x.id === rid;
            });
            var drop = function () {
              if (rk === 'group') S.groups = S.groups.filter(function (x) { return x !== rid; });
              else if (rk === 'title') S.titles = S.titles.filter(function (x) { return x !== rid; });
              else S.individuals = S.individuals.filter(function (x) { return x !== rid; });
              paint();
            };
            // One person removing themselves is self-evident; a rule that
            // covers fourteen is not.
            if (row && row.reach > 1) {
              KX.confirm({
                title: 'Remove “' + row.name + '”?',
                body: row.reach + ' people lose this dashboard from their homepage ' +
                  'when you publish. It falls back to their default.',
                confirmLabel: 'Remove',
                tone: 'warn',
                onConfirm: drop
              });
            } else {
              drop();
            }
            return;
          }
          // Remove from the selection panel: untick it in the grid, which
          // fires selected-items-changed and updates the panel from there.
          // If the search is hiding the row, drop it from state directly.
          if ((el = e.target.closest('[data-au-unpick]'))) {
            var uid = el.getAttribute('data-au-unpick');
            var grid = HOST.querySelector('#auGrid');
            var shownItem = grid && (grid.items || []).find(function (it) { return it.id === uid; });
            if (grid && shownItem) {
              grid.selectedItems = (grid.selectedItems || []).filter(function (it) { return it.id !== uid; });
            } else {
              var key = currentSpec().key;
              S[key] = S[key].filter(function (x) { return x !== uid; });
              refreshSelection();
            }
            return;
          }
          if (e.target.closest('#auCancel')) { dlg.opened = false; return; }
          if (e.target.closest('#auNext')) {
            if (!reach().length) return;
            S.step = 'review'; paint(); return;
          }
          if (e.target.closest('#auPublish')) {
            var ids = reach();
            var isLive = ids.length > 0;
            opts.onPublish({
              audience: isLive
                ? { titles: S.titles, individuals: S.individuals, groups: S.groups }
                : null,
              delivery: S.schedule
                ? { cadence: S.cadence, format: S.format, paused: false }
                : null,
              reach: ids.length
            });
            dlg.opened = false;
          }
        });

        // Search filters the grid IN PLACE — no repaint, so the caret stays
        // put and the grid keeps its scroll. Selection survives because the
        // grid is keyed on item id and the handler above keeps hidden picks.
        body.addEventListener('input', function (e) {
          if (e.target.id === 'auSearch') {
            S.search = e.target.value;
            var grid = HOST.querySelector('#auGrid');
            if (!grid) return;
            var spec = currentSpec();
            var vis = visible(spec);
            grid.items = vis;
            grid.selectedItems = vis.filter(function (it) { return S[spec.key].indexOf(it.id) !== -1; });
          }
        });

        body.addEventListener('change', function (e) {
          if (e.target.id === 'auSchedule') {
            S.schedule = !!e.target.checked;
            var opt = HOST.querySelector('#auSchedOpts');
            if (opt) opt.style.display = S.schedule ? 'grid' : 'none';
          }
        });
      }
    });
  }

  window.AGENCY_INTEL_AUDIENCE = { open: open };
})();
