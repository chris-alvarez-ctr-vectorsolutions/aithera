/* global KX, KEYSTONE, AGENCY_INTEL, AGENCY_INTEL_ROSTER */
/* =====================================================================
   agency-intel-audience.js — the "Who sees it live?" dialog.

   Two steps behind one dialog shell:
     1. Audience — three ways to pick people:
          • Job titles        — the 8 roles, as cards
          • Named individuals — the full roster, searchable
          • AI groups         — saved live rules, or build one by talking
     2. Review  — cadence + format, then publish.

   Selections UNION across all three tabs and de-duplicate by person, so
   "all Captains plus the HazMat crew" is one audience, counted once.

   All matching logic lives in agency-intel-roster.js; this file only
   renders and wires. Two traps this file is written around:
     • the dialog renders into a vaadin-dialog overlay outside #root, so
       every handler is delegated on the dialog body element;
     • the chat input writes to state WITHOUT a re-render, or the caret
       jumps mid-sentence.
   ===================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CP = window.AGENCY_INTEL;
  var R = window.AGENCY_INTEL_ROSTER;
  var esc = KX.esc, attr = KX.attr, micon = KX.micon;

  var NAME_CAP = 8;                       // names shown before "+ N more"

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
  /* Tab 1 — Job titles                                                */
  /* ---------------------------------------------------------------- */

  function titlesTab() {
    return '<div class="au-grid">' +
      (CP.JOB_TITLES || []).map(function (t) {
        var on = S.titles.indexOf(t.id) !== -1;
        return '<button class="au-card' + (on ? ' is-on' : '') + '" data-au-title="' + attr(t.id) + '">' +
          '<span class="au-check">' + (on ? micon('check', { size: 14 }) : '') + '</span>' +
          '<span class="au-card-body">' +
          '<span class="au-card-title">' + esc(t.label) + '</span>' +
          '<span class="au-card-sub">' + t.count + ' people</span>' +
          srcDots(t.entitlements) +
          '</span></button>';
      }).join('') + '</div>';
  }

  /* ---------------------------------------------------------------- */
  /* Tab 2 — Named individuals                                         */
  /* ---------------------------------------------------------------- */

  function individualsTab() {
    var q = S.search.trim().toLowerCase();
    var list = R.ROSTER.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + p.rank + ' ' + p.stationName + ' ' + p.stationLabel + ' ' +
        p.grade + ' ' + p.battalion).toLowerCase().indexOf(q) !== -1;
    });

    var chips = S.individuals.length
      ? '<div class="au-chips">' + S.individuals.map(function (id) {
          var p = R.personById(id);
          return p ? '<span class="au-chip">' + esc(p.name) +
            '<button data-au-unpick="' + attr(id) + '" aria-label="Remove ' + attr(p.name) + '">' +
            micon('close', { size: 13 }) + '</button></span>' : '';
        }).join('') + '</div>'
      : '';

    return chips +
      '<input class="au-search" id="auSearch" placeholder="Search 113 people — name, rank, station…" ' +
      'value="' + attr(S.search) + '">' +
      '<div class="au-list">' +
      (list.length
        ? list.map(function (p) {
            var on = S.individuals.indexOf(p.id) !== -1;
            return '<button class="au-row' + (on ? ' is-on' : '') + '" data-au-person="' + attr(p.id) + '">' +
              '<span class="au-check">' + (on ? micon('check', { size: 14 }) : '') + '</span>' +
              '<span style="flex:1;min-width:0">' +
              '<span class="au-row-name">' + esc(p.name) + '</span>' +
              '<span class="au-row-sub">' + personLine(p) + '</span></span>' +
              srcDots(p.entitlements) + '</button>';
          }).join('')
        : '<div class="au-empty">No one matches “' + esc(S.search) + '”.</div>') +
      '</div>';
  }

  /* ---------------------------------------------------------------- */
  /* Tab 3 — AI groups                                                 */
  /* ---------------------------------------------------------------- */

  function savedGroupsHtml() {
    if (!R.GROUPS.length) return '';

    // Once a conversation is under way the saved list collapses, so the
    // chat, chips and count stay above the fold — that's the part the
    // user is actually working in.
    if (S.thread.length && !S.showSaved) {
      return '<button class="au-saved-toggle" data-au-showsaved="1">' +
        micon('expand_more', { size: 16 }) + ' ' + R.GROUPS.length + ' saved groups' +
        (S.groups.length ? ' · ' + S.groups.length + ' selected' : '') + '</button>';
    }

    return '<div class="au-sec">Saved groups' +
      (S.thread.length
        ? '<button class="au-link" data-au-hidesaved="1" style="float:right;margin-top:-4px">Hide</button>'
        : '') + '</div>' +
      '<div class="au-saved">' + R.GROUPS.map(function (g) {
        var on = S.groups.indexOf(g.id) !== -1;
        var n = R.evaluate(g).count;
        return '<button class="au-row' + (on ? ' is-on' : '') + '" data-au-group="' + attr(g.id) + '">' +
          '<span class="au-check">' + (on ? micon('check', { size: 14 }) : '') + '</span>' +
          '<span style="flex:1;min-width:0">' +
          '<span class="au-row-name">' + micon('auto_awesome', { size: 13 }) + ' ' + esc(g.name) + '</span>' +
          '<span class="au-row-sub">Live rule · re-evaluates nightly · ' + n + ' today</span></span>' +
          '<span class="au-dup" data-au-edit="' + attr(g.id) + '" role="button" ' +
          'title="Change this group\'s rule or name">Edit</span>' +
          '<span class="au-dup" data-au-dup="' + attr(g.id) + '" role="button" ' +
          'title="Start a new group from this one">Duplicate</span>' +
          '</button>';
      }).join('') + '</div>';
  }

  var STARTERS = [
    'HazMat-certified engineers in B-2',
    'New hires in their first year',
    'Everyone at the Airport station on C shift'
  ];

  function chatHtml() {
    var res = R.evaluate(S.rule, S.required);
    var hasRule = (S.rule.clauses || []).length > 0;

    var thread = S.thread.map(function (m) {
      if (m.role === 'user') return '<div class="au-msg au-msg--me"><span>' + esc(m.text) + '</span></div>';
      return '<div class="au-msg"><span class="au-ai-mark">' + micon('auto_awesome', { size: 13 }) + '</span>' +
        '<span class="au-bubble">' + esc(m.text) +
        (m.choices
          ? '<span class="au-choices">' + m.choices.map(function (c, i) {
              return '<button data-au-choice="' + i + '">' + esc(c.label) + '</button>';
            }).join('') + '</span>'
          : '') +
        (m.offerDrop
          ? '<span class="au-choices"><button data-au-drop="1">Drop ' +
            esc(R.clauseLabel(m.offerDrop)) + '</button></span>'
          : '') +
        '</span></div>';
    }).join('');

    var starters = S.thread.length ? '' :
      '<div class="au-starters">' + STARTERS.map(function (s) {
        return '<button data-au-starter="' + attr(s) + '">' + micon('auto_awesome', { size: 12 }) +
          ' ' + esc(s) + '</button>';
      }).join('') + '</div>';

    var chips = hasRule
      ? '<div class="au-rule"><span class="au-rule-lbl">Rule</span>' +
        (S.rule.clauses || []).map(function (c, i) {
          return '<span class="au-chip' + (c.negate ? ' is-neg' : '') + '">' + esc(R.clauseLabel(c)) +
            '<button data-au-declause="' + i + '" aria-label="Remove criterion">' +
            micon('close', { size: 13 }) + '</button></span>';
        }).join('') + '</div>'
      : '';

    var count = hasRule
      ? '<div class="au-count' + (res.count ? '' : ' is-zero') + '">' +
        micon(res.count ? 'check_circle' : 'error', { size: 15, fill: 1 }) +
        '<span><b>' + res.count + '</b> ' + (res.count === 1 ? 'person' : 'people') + ' match</span>' +
        (res.count
          ? '<button class="au-link" data-au-names="1">' + (S.showNames ? 'hide' : 'show') + '</button>'
          : '') +
        (res.coverage.missing.length
          ? '<span class="au-warn">' + micon('info', { size: 13, fill: 1 }) + ' ' +
            res.coverage.missing.map(function (m) {
              return m.count + ' missing ' + ((K.SOURCES && K.SOURCES[m.source]) ?
                K.SOURCES[m.source].short : m.source);
            }).join(' · ') + '</span>'
          : '') +
        '</div>' +
        (S.showNames
          ? '<div class="au-names">' + res.people.slice(0, NAME_CAP).map(function (p) {
              return '<span>' + esc(p.name) + ' <i>' + personLine(p) + '</i></span>';
            }).join('') +
            (res.count > NAME_CAP
              ? '<span class="au-more">+ ' + (res.count - NAME_CAP) + ' more</span>' : '') +
            '</div>'
          : '')
      : '';

    // Editing an existing group edits a LIVE RULE — every dashboard already
    // published to it follows the change. Say so plainly, with the count,
    // before the user commits.
    var editing = S.editingId ? R.groupById(S.editingId) : null;
    var used = (editing && OPTS && OPTS.groupUsage) ? OPTS.groupUsage(S.editingId) : 0;
    var banner = editing
      ? '<div class="au-editing">' + micon('edit', { size: 14, fill: 1 }) +
        '<span>Editing <b>' + esc(editing.name) + '</b>' +
        (used
          ? ' — this rule is live on <b>' + used + '</b> other dashboard' + (used === 1 ? '' : 's') +
            ', which will follow this change.'
          : ' — not used by any other dashboard yet.') +
        '</span><button class="au-link" data-au-canceledit="1">Cancel</button></div>'
      : '';

    var save = (hasRule && res.count)
      ? '<div class="au-save">' +
        '<input class="au-search" id="auGroupName" value="' +
        attr(S.name || (editing ? editing.name : R.suggestName(S.rule))) + '">' +
        (editing
          ? '<vaadin-button theme="primary" id="auUpdateGroup">' + micon('check', { size: 16 }) +
            '<span class="kx-btn-label">Save changes</span></vaadin-button>' +
            '<vaadin-button theme="secondary" id="auSaveGroup">' +
            '<span>Save as new</span></vaadin-button>'
          : '<vaadin-button theme="primary" id="auSaveGroup">' + micon('bookmark_add', { size: 16 }) +
            '<span class="kx-btn-label">Save &amp; use</span></vaadin-button>') +
        '</div>'
      : '';

    return '<div class="au-sec">' +
      (S.editingId ? 'Editing a group' : S.thread.length ? 'Building a group' : 'Describe a new group') +
      '</div>' + banner +
      '<div class="au-chat">' +
      '<div class="au-thread" id="auThread">' +
      (S.thread.length ? thread :
        '<div class="au-hint">Describe who should see this — by rank, station, battalion, shift, ' +
        'pay grade, tenure, certification, employment type or assignment.</div>') +
      starters + '</div>' +
      chips + count + save +
      '<div class="au-input">' +
      '<textarea id="auDraft" rows="1" placeholder="e.g. hazmat engineers in B-2, excluding probationary"></textarea>' +
      '<button id="auSend" aria-label="Send">' + micon('arrow_upward', { size: 16 }) + '</button>' +
      '</div></div>';
  }

  function groupsTab() { return savedGroupsHtml() + chatHtml(); }

  /* ---------------------------------------------------------------- */
  /* Step 2 — review                                                   */
  /* ---------------------------------------------------------------- */

  function reviewHtml() {
    var ids = reach();
    var parts = [];
    if (S.titles.length) parts.push(S.titles.length + ' job title' + (S.titles.length === 1 ? '' : 's'));
    if (S.individuals.length) parts.push(S.individuals.length + ' named');
    if (S.groups.length) parts.push(S.groups.length + ' AI group' + (S.groups.length === 1 ? '' : 's'));

    return '<div class="au-sec">Audience</div>' +
      '<div class="au-review">' + micon('groups', { size: 18, fill: 1 }) +
      '<span><b>' + ids.length + ' people</b> — ' + esc(parts.join(' + ') || 'nothing selected') + '</span>' +
      '<button class="au-link" data-au-step="audience">Change</button></div>' +
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

  var TABS = [
    { id: 'titles', label: 'Job titles', icon: 'badge' },
    { id: 'individuals', label: 'Named individuals', icon: 'person' },
    { id: 'groups', label: 'AI groups', icon: 'auto_awesome' }
  ];

  function bodyHtml() {
    var n = reach().length;
    var summary = n
      ? 'Reaches <b>' + n + '</b> ' + (n === 1 ? 'person' : 'people')
      : 'No audience selected yet';

    return (S.step === 'audience'
      ? '<div class="au-tabs">' + TABS.map(function (t) {
          var on = S.tab === t.id;
          var count = t.id === 'titles' ? S.titles.length
            : t.id === 'individuals' ? S.individuals.length : S.groups.length;
          return '<button data-au-tab="' + t.id + '" class="' + (on ? 'is-on' : '') + '">' +
            micon(t.icon, { size: 15 }) + ' ' + esc(t.label) +
            (count ? '<span class="au-pip">' + count + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="au-promise">Everyone selected gets it on their homepage automatically — ' +
        'current and future.</div>' +
        '<div class="au-tabbody">' +
        (S.tab === 'titles' ? titlesTab() : S.tab === 'individuals' ? individualsTab() : groupsTab()) +
        '</div>'
      : '<div class="au-tabbody' + (CP.deliveryEnabled() ? '' : ' is-short') + '">' +
        reviewHtml() + '</div>') +
      '<div class="au-foot">' +
      '<span class="au-sum">' + summary + '</span>' +
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
    var thread = HOST.querySelector('#auThread');
    if (thread) thread.scrollTop = thread.scrollHeight;

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
  /* Conversation                                                      */
  /* ---------------------------------------------------------------- */

  function send(text) {
    var t = (text || '').trim();
    if (!t) return;
    S.thread.push({ role: 'user', text: t });
    var res = R.respond(t, S.rule);
    S.rule = res.rule;
    S.name = '';                                    // re-suggest a name
    S.thread.push({ role: 'ai', text: res.text, choices: res.choices || null,
      offerDrop: res.offerDrop || null });
    S.showNames = false;
    paint();
  }

  function applyChoice(ix) {
    var last = null;
    for (var i = S.thread.length - 1; i >= 0; i--) {
      if (S.thread[i].choices) { last = S.thread[i]; break; }
    }
    if (!last) return;
    var choice = last.choices[ix];
    if (!choice) return;
    S.rule = R.mergeClauses(S.rule, choice.clauses, 'only');
    last.choices = null;                            // question answered
    var res = R.evaluate(S.rule, S.required);
    S.thread.push({ role: 'ai',
      text: choice.label + ' — ' + res.count + ' ' + (res.count === 1 ? 'person' : 'people') + ' match.' });
    S.name = '';
    paint();
  }

  /* ---------------------------------------------------------------- */
  /* Open                                                              */
  /* ---------------------------------------------------------------- */

  function open(opts) {
    var d = opts.dashboard;
    var a = d.assignedTo || {};
    var del = CP.deliveryOf(d);

    OPTS = opts;
    S = {
      step: 'audience', tab: 'titles',
      titles: (a.titles || []).slice(),
      individuals: (a.individuals || []).slice(),
      groups: (a.groups || []).slice(),
      search: '',
      thread: [], rule: { clauses: [] }, showNames: false, name: '', showSaved: false, editingId: null,
      // Sources this dashboard's widgets actually read — scopes the
      // entitlement warning so it only fires on relevant gaps.
      required: (function () {
        var set = {};
        (d.widgets || []).forEach(function (w) {
          CP.widgetSources(w).forEach(function (s) { set[s] = true; });
        });
        return Object.keys(set);
      })(),
      cadence: (del || {}).cadence || CP.CADENCES[0].id,
      format: (del || {}).format || CP.REPORT_FORMATS[0].id,
      schedule: !!del
    };

    DLG = KX.openDialog({
      title: 'Who sees it live?',
      // Kept short on purpose: the dialog overlay sizes to its widest child,
      // and a long subtitle stretches it far past the 680px body.
      subtitle: 'Put “' + d.name + '” in front of the right people.',
      icon: 'groups',
      accent: 'var(--teal-400)',
      width: '680px',
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
            S.tab = el.getAttribute('data-au-tab'); paint(); return;
          }
          if ((el = e.target.closest('[data-au-step]'))) {
            S.step = el.getAttribute('data-au-step'); paint(); return;
          }
          if ((el = e.target.closest('[data-au-title]'))) {
            var tid = el.getAttribute('data-au-title');
            var ti = S.titles.indexOf(tid);
            if (ti === -1) S.titles.push(tid); else S.titles.splice(ti, 1);
            paint(); return;
          }
          if ((el = e.target.closest('[data-au-unpick]'))) {
            var uid = el.getAttribute('data-au-unpick');
            S.individuals = S.individuals.filter(function (x) { return x !== uid; });
            paint(); return;
          }
          if ((el = e.target.closest('[data-au-person]'))) {
            var pid = el.getAttribute('data-au-person');
            var pi = S.individuals.indexOf(pid);
            if (pi === -1) S.individuals.push(pid); else S.individuals.splice(pi, 1);
            paint(); return;
          }
          // Edit a saved group in place — loads its rule into the chat.
          if ((el = e.target.closest('[data-au-edit]'))) {
            e.stopPropagation();
            var eg = R.groupById(el.getAttribute('data-au-edit'));
            if (eg) {
              S.editingId = eg.id;
              S.rule = { clauses: eg.clauses.map(function (c) { return Object.assign({}, c); }) };
              S.name = eg.name;
              S.showSaved = false;
              S.thread = [{ role: 'ai', text: 'Editing “' + eg.name +
                '”. Tell me what to change, or edit the criteria directly.' }];
              paint();
            }
            return;
          }
          // "Duplicate & refine" sits inside the group row — check it first
          // so it doesn't also toggle selection.
          if ((el = e.target.closest('[data-au-dup]'))) {
            e.stopPropagation();
            var dg = R.groupById(el.getAttribute('data-au-dup'));
            if (dg) {
              S.rule = { clauses: dg.clauses.slice() };
              S.name = dg.name + ' (copy)';
              S.thread = [{ role: 'ai',
                text: 'Started from “' + dg.name + '”. Tell me what to change.' }];
              paint();
            }
            return;
          }
          if ((el = e.target.closest('[data-au-group]'))) {
            var gid = el.getAttribute('data-au-group');
            var gi = S.groups.indexOf(gid);
            if (gi === -1) S.groups.push(gid); else S.groups.splice(gi, 1);
            paint(); return;
          }
          if (e.target.closest('[data-au-canceledit]')) {
            S.editingId = null; S.rule = { clauses: [] }; S.thread = []; S.name = '';
            paint(); return;
          }
          if (e.target.closest('#auUpdateGroup')) {
            var upName = HOST.querySelector('#auGroupName');
            var updated = R.updateGroup(S.editingId,
              (upName && upName.value.trim()) || null, S.rule.clauses);
            if (updated) {
              var others = OPTS.groupUsage ? OPTS.groupUsage(updated.id) : 0;
              KX.pushToast({
                title: 'Group updated',
                body: updated.name + ' · ' + R.evaluate(updated).count + ' people today' +
                  (others ? ' · ' + others + ' other dashboard' + (others === 1 ? '' : 's') + ' updated' : ''),
                icon: 'edit', tone: 'success'
              });
              // Using the group here too is the common intent after editing.
              if (S.groups.indexOf(updated.id) === -1) S.groups.push(updated.id);
            }
            S.editingId = null; S.rule = { clauses: [] }; S.thread = []; S.name = '';
            S.showSaved = true;
            paint(); return;
          }
          if (e.target.closest('[data-au-showsaved]')) { S.showSaved = true; paint(); return; }
          if (e.target.closest('[data-au-hidesaved]')) { S.showSaved = false; paint(); return; }
          if ((el = e.target.closest('[data-au-starter]'))) {
            send(el.getAttribute('data-au-starter')); return;
          }
          if ((el = e.target.closest('[data-au-choice]'))) {
            applyChoice(+el.getAttribute('data-au-choice')); return;
          }
          if (e.target.closest('[data-au-drop]')) {
            var blame = null;
            for (var i = S.thread.length - 1; i >= 0; i--) {
              if (S.thread[i].offerDrop) { blame = S.thread[i]; break; }
            }
            if (blame) {
              S.rule = { clauses: (S.rule.clauses || []).filter(function (c) {
                return R.clauseLabel(c) !== R.clauseLabel(blame.offerDrop);
              }) };
              blame.offerDrop = null;
              var rr = R.evaluate(S.rule, S.required);
              S.thread.push({ role: 'ai', text: 'Dropped it — ' + rr.count + ' ' +
                (rr.count === 1 ? 'person' : 'people') + ' match now.' });
              paint();
            }
            return;
          }
          if ((el = e.target.closest('[data-au-declause]'))) {
            var ci = +el.getAttribute('data-au-declause');
            S.rule = { clauses: (S.rule.clauses || []).filter(function (_, j) { return j !== ci; }) };
            S.name = '';
            paint(); return;
          }
          if (e.target.closest('[data-au-names]')) { S.showNames = !S.showNames; paint(); return; }
          if (e.target.closest('#auSend')) {
            var ta = HOST.querySelector('#auDraft');
            send(ta ? ta.value : ''); return;
          }
          if (e.target.closest('#auSaveGroup')) {
            var nameEl = HOST.querySelector('#auGroupName');
            var g = R.saveGroup((nameEl && nameEl.value.trim()) || R.suggestName(S.rule),
              S.rule.clauses);
            S.groups.push(g.id);
            S.rule = { clauses: [] };
            S.thread = [];
            S.name = '';
            S.editingId = null;
            KX.pushToast({ title: 'Group saved', body: g.name + ' · ' + R.evaluate(g).count +
              ' people today', icon: 'bookmark_added', tone: 'success' });
            paint(); return;
          }
          if (e.target.closest('#auCancel')) { dlg.opened = false; return; }
          if (e.target.closest('#auNext')) {
            if (!reach().length) return;
            S.step = 'review'; paint(); return;
          }
          if (e.target.closest('#auPublish')) {
            var ids = reach();
            var live = ids.length > 0;
            opts.onPublish({
              audience: live
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

        // Search + chat draft: update state WITHOUT a re-render so the
        // caret stays put. The list re-renders only for search.
        body.addEventListener('input', function (e) {
          if (e.target.id === 'auSearch') {
            S.search = e.target.value;
            var scroll = HOST.querySelector('.au-list');
            var top = scroll ? scroll.scrollTop : 0;
            paint();
            var f = HOST.querySelector('#auSearch');
            if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
            var s2 = HOST.querySelector('.au-list');
            if (s2) s2.scrollTop = top;
            return;
          }
          if (e.target.id === 'auGroupName') { S.name = e.target.value; return; }
        });

        body.addEventListener('keydown', function (e) {
          if (e.target.id === 'auDraft' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e.target.value);
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
