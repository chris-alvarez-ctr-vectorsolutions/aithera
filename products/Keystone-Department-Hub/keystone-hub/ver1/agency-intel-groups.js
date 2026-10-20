/* global KX, KEYSTONE, AGENCY_INTEL, AGENCY_INTEL_ROSTER */
/* =====================================================================
   agency-intel-groups.js — the "AI groups" tab on the Agency Intelligence
   home screen, and the group builder dialog it opens.

   AI groups are LIVE RULES ("HazMat-certified engineers in B-2") that a
   dashboard can be published to. They used to be created inside the
   publish dialog, which meant the only way to see or change a group was
   to start publishing something. This tab is the one place groups are
   made, edited, duplicated and deleted; the publish dialog
   (agency-intel-audience.js) now only PICKS from the saved list and
   links back here.

   Two pieces:
     1. html()  — the tab body: every saved group as a row, with reach
                  and usage, plus the New group action.
     2. the builder dialog — the same describe-it-in-words conversation
                  the publish dialog used to host, now standalone, for
                  New / Edit / Duplicate.

   All rule parsing and matching lives in agency-intel-roster.js; this
   file only renders and wires. The page passes a small context on
   init() so this file never reaches into page state directly:
     ctx.usage(gid)      -> how many dashboards are published to the group
     ctx.usingNames(gid) -> those dashboards' names
     ctx.onDelete(gid)   -> strip the group from every audience, re-render
     ctx.rerender()      -> re-render the page after a save
   ===================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CP = window.AGENCY_INTEL;
  var R = window.AGENCY_INTEL_ROSTER;
  var esc = KX.esc, attr = KX.attr, micon = KX.micon;

  var NAME_CAP = 8;                       // names shown before "+ N more"

  var ctx = { usage: function () { return 0; }, usingNames: function () { return []; },
              onDelete: function () {}, rerender: function () {} };

  /* ---------------------------------------------------------------- */
  /* Tab body                                                          */
  /* ---------------------------------------------------------------- */

  function personLine(p) {
    return esc(p.rank) + ' · ' + esc(p.stationName) + ' · ' + esc(p.grade);
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function groupRow(g) {
    var n = R.evaluate(g).count;
    var used = ctx.usage(g.id);
    return '<div class="cp-grant-row cp-group-row" data-group-row="' + attr(g.id) + '">' +
      '<span class="cp-group-mark">' + micon('auto_awesome', { size: 16, fill: 1 }) + '</span>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:13px;font-weight:600;color:var(--ink-900)">' + esc(g.name) + '</div>' +
      '<div class="cp-group-rule">' + esc(R.ruleLine(g) || 'No criteria') + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink-500);margin-top:3px">' +
      '<b style="font-family:var(--font-numeric);color:var(--ink-700)">' + n + '</b> ' +
      (n === 1 ? 'person' : 'people') + ' today · ' +
      (used
        ? 'live on <b style="font-family:var(--font-numeric);color:var(--ink-700)">' + used + '</b> dashboard' + (used === 1 ? '' : 's')
        : 'not used by any dashboard yet') +
      (g.createdAt ? ' · created ' + esc(fmtDate(g.createdAt)) : '') +
      '</div></div>' +
      '<div class="cp-group-actions">' +
      '<vaadin-button theme="tertiary small" data-group-edit="' + attr(g.id) + '">' +
      micon('edit', { size: 15 }) + '<span class="kx-btn-label">Edit</span></vaadin-button>' +
      '<vaadin-button theme="icon tertiary small" data-group-dup="' + attr(g.id) + '" ' +
      'aria-label="Duplicate" title="Start a new group from this one">' + micon('content_copy', { size: 16 }) + '</vaadin-button>' +
      '<vaadin-button theme="icon tertiary small" data-group-del="' + attr(g.id) + '" ' +
      'aria-label="Delete" title="Delete this group">' + micon('delete', { size: 16 }) + '</vaadin-button>' +
      '</div></div>';
  }

  function html() {
    var groups = R.GROUPS;
    var covered = R.resolveAudience({ groups: groups.map(function (g) { return g.id; }) }).length;
    var inUse = groups.filter(function (g) { return ctx.usage(g.id) > 0; }).length;

    return '<div class="cp-panel cp-groups-panel">' +
      '<div class="cp-panel-head" style="display:flex;align-items:flex-start;gap:12px">' +
      '<div style="flex:1"><h3>AI groups</h3>' +
      '<p>Live rules that pick people by rank, station, shift, certification, tenure or assignment. ' +
      'A dashboard published to a group follows the rule — whoever matches tomorrow gets it tomorrow, ' +
      'and whoever stops matching loses it. Editing a group changes every dashboard that uses it.</p></div>' +
      '<vaadin-button theme="primary small" id="cpNewGroup">' + micon('add', { size: 16 }) +
      '<span class="kx-btn-label">New group</span></vaadin-button></div>' +
      '<div style="display:flex;align-items:center;gap:14px;padding:12px 18px;background:var(--surface-2);' +
      'border-bottom:1px solid var(--ink-100)">' +
      '<span style="font-size:12px;color:var(--ink-600)"><b style="font-family:var(--font-numeric);font-size:15px">' +
      groups.length + '</b> group' + (groups.length === 1 ? '' : 's') + '</span>' +
      '<span style="font-size:12px;color:var(--ink-600)"><b style="font-family:var(--font-numeric);font-size:15px">' +
      covered + '</b> people covered</span>' +
      '<span style="font-size:12px;color:var(--ink-600)"><b style="font-family:var(--font-numeric);font-size:15px">' +
      inUse + '</b> in use</span>' +
      '<span style="margin-left:auto;font-size:11px;color:var(--ink-500)">Rules re-evaluate nightly</span></div>' +
      (groups.length
        ? groups.map(groupRow).join('')
        : '<div style="padding:36px 20px;text-align:center">' +
          micon('auto_awesome', { size: 28, color: 'var(--ink-300)' }) +
          '<div style="font-size:13.5px;font-weight:600;margin-top:8px;color:var(--ink-700)">No groups yet</div>' +
          '<div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">' +
          'Describe who should see a dashboard — by rank, station, shift or certification — and save it as a group.</div></div>') +
      '</div>';
  }

  /* ---------------------------------------------------------------- */
  /* Builder dialog                                                    */
  /* ---------------------------------------------------------------- */

  var S = null;                           // per-open builder state
  var HOST = null;                        // dialog body element

  var STARTERS = [
    'HazMat-certified engineers in B-2',
    'New hires in their first year',
    'Everyone at the Airport station on C shift'
  ];

  function builderHtml() {
    var res = R.evaluate(S.rule);
    var hasRule = (S.rule.clauses || []).length > 0;

    var thread = S.thread.map(function (m) {
      if (m.role === 'user') return '<div class="au-msg au-msg--me"><span>' + esc(m.text) + '</span></div>';
      return '<div class="au-msg"><span class="au-ai-mark">' + micon('auto_awesome', { size: 13 }) + '</span>' +
        '<span class="au-bubble">' + esc(m.text) +
        (m.choices
          ? '<span class="au-choices">' + m.choices.map(function (c, i) {
              return '<button data-gb-choice="' + i + '">' + esc(c.label) + '</button>';
            }).join('') + '</span>'
          : '') +
        (m.offerDrop
          ? '<span class="au-choices"><button data-gb-drop="1">Drop ' +
            esc(R.clauseLabel(m.offerDrop)) + '</button></span>'
          : '') +
        '</span></div>';
    }).join('');

    var starters = S.thread.length ? '' :
      '<div class="au-starters">' + STARTERS.map(function (s) {
        return '<button data-gb-starter="' + attr(s) + '">' + micon('auto_awesome', { size: 12 }) +
          ' ' + esc(s) + '</button>';
      }).join('') + '</div>';

    var chips = hasRule
      ? '<div class="au-rule"><span class="au-rule-lbl">Rule</span>' +
        (S.rule.clauses || []).map(function (c, i) {
          return '<span class="au-chip' + (c.negate ? ' is-neg' : '') + '">' + esc(R.clauseLabel(c)) +
            '<button data-gb-declause="' + i + '" aria-label="Remove criterion">' +
            micon('close', { size: 13 }) + '</button></span>';
        }).join('') + '</div>'
      : '';

    var count = hasRule
      ? '<div class="au-count' + (res.count ? '' : ' is-zero') + '">' +
        micon(res.count ? 'check_circle' : 'error', { size: 15, fill: 1 }) +
        '<span><b>' + res.count + '</b> ' + (res.count === 1 ? 'person' : 'people') + ' match today</span>' +
        (res.count
          ? '<button class="au-link" data-gb-names="1">' + (S.showNames ? 'hide' : 'show') + '</button>'
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
    var used = editing ? ctx.usage(S.editingId) : 0;
    var banner = editing
      ? '<div class="au-editing">' + micon('edit', { size: 14, fill: 1 }) +
        '<span class="au-editing-text">Editing <b>' + esc(editing.name) + '</b>' +
        (used
          ? ' — this rule is live on <b>' + used + '</b> dashboard' + (used === 1 ? '' : 's') +
            ', which will follow this change.'
          : ' — not used by any dashboard yet.') +
        '</span></div>'
      : '';

    var save = (hasRule && res.count)
      ? '<div class="au-save">' +
        '<input class="au-search" id="gbName" aria-label="Group name" value="' +
        attr(S.name || (editing ? editing.name : R.suggestName(S.rule))) + '">' +
        (editing
          ? '<vaadin-button theme="primary" id="gbUpdate">' + micon('check', { size: 16 }) +
            '<span class="kx-btn-label">Save changes</span></vaadin-button>' +
            '<vaadin-button theme="secondary" id="gbSave">' +
            '<span>Save as new</span></vaadin-button>'
          : '<vaadin-button theme="primary" id="gbSave">' + micon('bookmark_add', { size: 16 }) +
            '<span class="kx-btn-label">Save group</span></vaadin-button>')
        + '</div>'
      : '';

    return banner +
      '<div class="au-chat">' +
      '<div class="au-thread" id="gbThread">' +
      (S.thread.length ? thread :
        '<div class="au-hint">Describe who should be in this group — by rank, station, battalion, shift, ' +
        'pay grade, tenure, certification, employment type or assignment.</div>') +
      starters + '</div>' +
      chips + count + save +
      '<div class="au-input">' +
      '<textarea id="gbDraft" rows="1" placeholder="e.g. hazmat engineers in B-2, excluding probationary"></textarea>' +
      '<button id="gbSend" aria-label="Send">' + micon('arrow_upward', { size: 16 }) + '</button>' +
      '</div></div>' +
      '<div class="au-foot"><span class="au-sum">' +
      (hasRule
        ? 'Groups are live rules — saving changes who sees every dashboard published to it.'
        : 'Start by describing the people, or pick a starter above.') +
      '</span><button class="au-link" id="gbCancel">Cancel</button></div>';
  }

  function paint() {
    if (!HOST) return;
    HOST.innerHTML = builderHtml();
    var thread = HOST.querySelector('#gbThread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

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
    var res = R.evaluate(S.rule);
    S.thread.push({ role: 'ai',
      text: choice.label + ' — ' + res.count + ' ' + (res.count === 1 ? 'person' : 'people') + ' match.' });
    S.name = '';
    paint();
  }

  // mode: 'new' | 'edit' | 'dup'; `g` is the source group for edit / dup.
  function openBuilder(mode, g) {
    S = {
      editingId: mode === 'edit' ? g.id : null,
      rule: { clauses: g ? g.clauses.map(function (c) { return Object.assign({}, c); }) : [] },
      name: mode === 'edit' ? g.name : mode === 'dup' ? g.name + ' (copy)' : '',
      thread: mode === 'edit'
        ? [{ role: 'ai', text: 'Editing “' + g.name + '”. Tell me what to change, or edit the criteria directly.' }]
        : mode === 'dup'
          ? [{ role: 'ai', text: 'Started from “' + g.name + '”. Tell me what to change.' }]
          : [],
      showNames: false
    };

    KX.openDialog({
      title: mode === 'edit' ? 'Edit group' : 'New AI group',
      subtitle: mode === 'edit'
        ? 'Changes apply to every dashboard published to this group.'
        : 'Describe the people in plain words — the rule stays live as the roster changes.',
      icon: 'auto_awesome',
      accent: 'var(--amber-500)',
      width: '620px',
      body: '<div id="gbHost"></div>',
      onMount: function (body, dlg) {
        HOST = body.querySelector('#gbHost');
        paint();

        // One delegated click handler — the dialog lives in an overlay
        // outside #root, so this must be bound to the dialog body.
        body.addEventListener('click', function (e) {
          var el;
          if ((el = e.target.closest('[data-gb-starter]'))) {
            send(el.getAttribute('data-gb-starter')); return;
          }
          if ((el = e.target.closest('[data-gb-choice]'))) {
            applyChoice(+el.getAttribute('data-gb-choice')); return;
          }
          if (e.target.closest('[data-gb-drop]')) {
            var blame = null;
            for (var i = S.thread.length - 1; i >= 0; i--) {
              if (S.thread[i].offerDrop) { blame = S.thread[i]; break; }
            }
            if (blame) {
              S.rule = { clauses: (S.rule.clauses || []).filter(function (c) {
                return R.clauseLabel(c) !== R.clauseLabel(blame.offerDrop);
              }) };
              blame.offerDrop = null;
              var rr = R.evaluate(S.rule);
              S.thread.push({ role: 'ai', text: 'Dropped it — ' + rr.count + ' ' +
                (rr.count === 1 ? 'person' : 'people') + ' match now.' });
              paint();
            }
            return;
          }
          if ((el = e.target.closest('[data-gb-declause]'))) {
            var ci = +el.getAttribute('data-gb-declause');
            S.rule = { clauses: (S.rule.clauses || []).filter(function (_, j) { return j !== ci; }) };
            S.name = '';
            paint(); return;
          }
          if (e.target.closest('[data-gb-names]')) { S.showNames = !S.showNames; paint(); return; }
          if (e.target.closest('#gbSend')) {
            var ta = HOST.querySelector('#gbDraft');
            send(ta ? ta.value : ''); return;
          }
          if (e.target.closest('#gbUpdate')) {
            var upName = HOST.querySelector('#gbName');
            var updated = R.updateGroup(S.editingId,
              (upName && upName.value.trim()) || null, S.rule.clauses);
            if (updated) {
              var others = ctx.usage(updated.id);
              KX.pushToast({
                title: 'Group updated',
                body: updated.name + ' · ' + R.evaluate(updated).count + ' people today' +
                  (others ? ' · ' + others + ' dashboard' + (others === 1 ? '' : 's') + ' updated' : ''),
                icon: 'edit', tone: 'success'
              });
            }
            dlg.opened = false;
            ctx.rerender();
            return;
          }
          if (e.target.closest('#gbSave')) {
            var nameEl = HOST.querySelector('#gbName');
            var saved = R.saveGroup((nameEl && nameEl.value.trim()) || R.suggestName(S.rule),
              S.rule.clauses);
            KX.pushToast({ title: 'Group saved', body: saved.name + ' · ' + R.evaluate(saved).count +
              ' people today', icon: 'bookmark_added', tone: 'success' });
            dlg.opened = false;
            ctx.rerender();
            return;
          }
          if (e.target.closest('#gbCancel')) { dlg.opened = false; return; }
        });

        // The draft and the name write to state WITHOUT a re-render, or the
        // caret jumps mid-sentence.
        body.addEventListener('input', function (e) {
          if (e.target.id === 'gbName') S.name = e.target.value;
        });
        body.addEventListener('keydown', function (e) {
          if (e.target.id === 'gbDraft' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e.target.value);
          }
        });
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Delete                                                            */
  /* ---------------------------------------------------------------- */

  function confirmDelete(g) {
    var names = ctx.usingNames(g.id);
    var n = R.evaluate(g).count;
    var body = names.length
      ? 'This group is live on <b>' + names.length + '</b> dashboard' + (names.length === 1 ? '' : 's') +
        ' — ' + names.map(function (x) { return '<b>' + esc(x) + '</b>'; }).join(', ') +
        '. ' + (names.length === 1 ? 'It drops' : 'They drop') + ' this group from ' +
        (names.length === 1 ? 'its' : 'their') + ' audience, and the <b>' + n + '</b> ' +
        (n === 1 ? 'person' : 'people') + ' who match it today lose ' +
        (names.length === 1 ? 'that dashboard' : 'those dashboards') +
        ' from their homepage unless they are reached another way.'
      : 'No dashboard is published to this group, so nobody loses anything. This cannot be undone.';
    KX.confirm({
      title: 'Delete “' + g.name + '”?',
      body: body,
      confirmLabel: 'Delete group',
      tone: 'danger',
      onConfirm: function () {
        ctx.onDelete(g.id);
        R.deleteGroup(g.id);
        KX.pushToast({ title: 'Group deleted', body: g.name +
          (names.length ? ' · removed from ' + names.length + ' dashboard' + (names.length === 1 ? '' : 's') : ''),
          icon: 'delete', tone: 'neutral' });
        ctx.rerender();
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Wiring                                                            */
  /* ---------------------------------------------------------------- */

  function init(c) {
    ctx = Object.assign(ctx, c || {});
    // Delegate on document, like the page: every handler is keyed on its own
    // data attribute, so a document-wide listener is safe.
    document.addEventListener('click', function (e) {
      var el;
      if (e.target.closest('#cpNewGroup')) { openBuilder('new'); return; }
      if ((el = e.target.closest('[data-group-edit]'))) {
        var eg = R.groupById(el.getAttribute('data-group-edit'));
        if (eg) openBuilder('edit', eg);
        return;
      }
      if ((el = e.target.closest('[data-group-dup]'))) {
        var dg = R.groupById(el.getAttribute('data-group-dup'));
        if (dg) openBuilder('dup', dg);
        return;
      }
      if ((el = e.target.closest('[data-group-del]'))) {
        var xg = R.groupById(el.getAttribute('data-group-del'));
        if (xg) confirmDelete(xg);
        return;
      }
    });
  }

  window.KXGroups = { init: init, html: html, openBuilder: openBuilder };
})();
