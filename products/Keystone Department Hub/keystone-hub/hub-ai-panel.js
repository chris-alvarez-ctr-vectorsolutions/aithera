/* global window, document, KEYSTONE, KX */
/* ========================================================================
   hub-ai-panel.js — Homepage Agency Intelligence, docked inside the
   published-dashboard container.
   ------------------------------------------------------------------------
   Chat on the left of .kx-pubdash, widgets on the right. Visible only to
   roles the AI access tab has granted — the gate reads the same
   seedGrants() the tab manages, so there is one source of truth and no
   duplicated permission model.

   Text answers only. A chart never renders in the thread; an answer that
   resolves to a metric can be ADDED to the widget grid, which is the canvas
   on this surface.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;

  /* =====================================================================
     ACCESS GATE
     ---------------------------------------------------------------------
     A role is granted if the AI access tab names the person directly, or
     grants their job title. Same resolution the tab's own grant rows use.
     ===================================================================== */

  // Resolved once — seedGrants() is a pure seed with no session mutation.
  var grants = null;
  function getGrants() {
    var AI = window.AGENCY_INTEL_AI;
    if (!grants && AI && AI.seedGrants) grants = AI.seedGrants();
    return grants || { titles: [], individuals: [] };
  }

  // A grant record is { id, grantedAt, grantedBy }; tolerate a bare id too,
  // matching grantId() in agency-intel-page.js.
  function ids(list) {
    return (list || []).map(function (g) {
      return (g && typeof g === 'object') ? g.id : g;
    });
  }

  // roleId -> the AGENCY_INTEL.INDIVIDUALS entry for that role's person.
  function personFor(roleId) {
    var role = K.ROLES[roleId];
    var CP = window.AGENCY_INTEL;
    if (!role || !CP || !CP.INDIVIDUALS) return null;
    return CP.INDIVIDUALS.find(function (p) { return p.id === role.selfId; }) || null;
  }

  function hasAccess(roleId) {
    var person = personFor(roleId);
    if (!person) return false;
    var g = getGrants();
    if (ids(g.individuals).indexOf(person.id) !== -1) return true;
    return ids(g.titles).indexOf(person.titleId) !== -1;
  }

  var esc = KX.esc, micon = KX.micon;

  /* =====================================================================
     STATE — session only. No localStorage, so every reviewer opens the
     same way.
     ===================================================================== */

  var state = {
    thread: [],      // { role:'user', text } | { role:'assistant', text, metricId, denied }
    draft: '',
    thinking: false,
    collapsed: false,
    added: []        // widget specs added to the grid from chat
  };

  // A collapsed panel reports as not expanded, so the container returns to
  // compact height with no extra bookkeeping in the hero.
  function isExpanded() { return !state.collapsed && (state.thread.length > 0 || state.thinking); }
  function addedWidgets() { return state.added; }

  function mark(size) {
    size = size || 28;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  // Set every render from the variant the hero is drawing, so respond() and the
  // suggestion filter always use the right asker.
  var currentPerson = null;
  // Only the dashboard's owner may change it. A read-only published dashboard
  // ("only Training can edit") must never offer an edit affordance.
  var currentOwned = false;
  function setContext(roleId, cfg) {
    currentPerson = personFor(roleId);
    currentOwned = !!(cfg && cfg.owned);
  }

  /* =====================================================================
     SUGGESTIONS
     ---------------------------------------------------------------------
     Filtered by the asker's entitlements. The system knows what it will
     refuse, so it must not suggest it — the Chief lacks Scheduling, and a
     hand-picked "overtime risk" chip would open the panel on a refusal.

     Each entry's metricId MUST match what matchQuestion() in
     agency-intel-ai-data.js routes `q` to, or the filter lies. Verified:
       'behind on training'   -> training_completion
       'inspections overdue'  -> overdue_inspections
       'average response time'-> response_time
       'CEU completion'       -> ceu_progress
       'cert expires'         -> credential_expirations
       'shifts are open'      -> open_shifts
     ===================================================================== */

  var SUGGESTION_POOL = [
    { metricId: 'training_completion',    label: 'Training compliance',  q: 'Which stations are behind on training?' },
    { metricId: 'overdue_inspections',    label: 'Overdue inspections',  q: 'Which inspections are overdue at Station 4?' },
    { metricId: 'response_time',          label: 'Response time',        q: 'What’s our average response time this quarter?' },
    { metricId: 'ceu_progress',           label: 'CEU progress',         q: 'CEU completion by station?' },
    { metricId: 'credential_expirations', label: 'Credentials expiring', q: 'Whose paramedic cert expires in the next 60 days?' },
    { metricId: 'open_shifts',            label: 'Open shifts',          q: 'Which shifts are open next week?' }
  ];

  function suggestionsFor(person) {
    var CP = window.AGENCY_INTEL;
    var AI = window.AGENCY_INTEL_AI;
    if (!CP || !AI || !person) return [];
    var ent = AI.personEntitlements(person, null);
    return SUGGESTION_POOL.filter(function (s) {
      return CP.metricSources(s.metricId).every(function (src) {
        return ent.indexOf(src) !== -1;
      });
    }).slice(0, 3);
  }

  function chipsHtml(person) {
    var list = suggestionsFor(person);
    if (!list.length) return '';
    return '<div class="kx-ai-chips">' + list.map(function (s, i) {
      return '<button class="kx-ai-chip" data-kx-ai-chip="' + i + '" ' +
        'title="' + KX.attr(s.q) + '">' + esc(s.label) + '</button>';
    }).join('') + '</div>';
  }

  // Bold spans in the seeded answers arrive as **markdown**.
  function bubbleText(text) {
    return String(text).split('**').map(function (part, i) {
      return i % 2
        ? '<strong style="color:var(--ink-900)">' + esc(part) + '</strong>'
        : esc(part);
    }).join('');
  }

  function turnHtml(msg, idx) {
    if (msg.role === 'user') {
      return '<div class="kx-ai-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    var canAdd = msg.metricId && currentOwned && !msg.added;
    return '<div class="kx-ai-turn">' + mark(24) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">' +
      '<div class="bubble">' + bubbleText(msg.text) + '</div>' +
      (msg.denied
        ? '<div class="kx-ai-denied">' + micon('block', { size: 13, fill: 1 }) +
          '<span>' + esc(msg.deniedNote || 'Outside your data permissions.') + '</span></div>'
        : '') +
      (canAdd
        ? '<button class="kx-ai-add" data-kx-ai-add="' + KX.attr(msg.metricId) + '" ' +
          'data-kx-ai-add-turn="' + idx + '">' +
          micon('add_chart', { size: 14, fill: 1 }) + 'Add as a widget</button>'
        : '') +
      (msg.added
        ? '<div class="kx-ai-added">' + micon('check_circle', { size: 14, fill: 1 }) +
          'Added to ' + esc(msg.added) + '</div>'
        : '') +
      '</div></div>';
  }

  function thinkingHtml() {
    return '<div class="kx-ai-turn" style="align-items:center">' + mark(24) +
      '<div style="display:inline-flex;align-items:center;gap:5px;padding:8px 12px;' +
      'background:var(--surface-2);border:1px solid var(--ink-100);border-radius:13px 13px 13px 4px">' +
      '<span class="kx-ai-dot"></span>' +
      '<span class="kx-ai-dot" style="animation-delay:140ms"></span>' +
      '<span class="kx-ai-dot" style="animation-delay:280ms"></span>' +
      '<span style="font-size:11px;color:var(--ink-500);margin-left:4px;font-style:italic">' +
      'Querying your apps…</span></div></div>';
  }

  function threadHtml() {
    return '<div class="kx-ai-thread" id="kxAiThread">' +
      state.thread.map(turnHtml).join('') +
      (state.thinking ? thinkingHtml() : '') +
      '</div>';
  }

  /* =====================================================================
     PANEL MARKUP
     ===================================================================== */

  function inputHtml(expanded) {
    var ready = !!state.draft.trim() && !state.thinking;
    return '<div class="kx-ai-input-wrap"><div class="kx-ai-input">' +
      '<textarea id="kxAiDraft" rows="1" ' +
      'placeholder="Ask Agency Intelligence about your data">' + esc(state.draft) + '</textarea>' +
      '<button class="kx-ai-send' + (ready ? ' is-ready' : '') + '" id="kxAiSend" ' +
      'title="Send" aria-label="Send"' + (ready ? '' : ' disabled') + '>' +
      micon('arrow_upward', { size: 17, weight: 500 }) + '</button>' +
      '</div>' +
      // Only once there are answers to caveat. The compact panel spends that
      // vertical space on suggestion chips instead, and has none to spare.
      (expanded
        ? '<div class="kx-ai-legal">Charts land on the dashboard, never in chat. ' +
          'Agency Intelligence can be wrong — verify before acting.</div>'
        : '') +
      '</div>';
  }

  function html(cfg) {
    if (state.collapsed) {
      return '<button class="kx-ai-collapsed" id="kxAiExpand" ' +
        'title="Open Agency Intelligence" aria-label="Open Agency Intelligence">' +
        mark(24) + '<span class="vlabel">Agency Intelligence</span>' +
        micon('chevron_right', { size: 16, color: 'var(--ink-400)', style: 'margin-top:auto' }) +
        '</button>';
    }
    var person = currentPerson;
    return '<div class="kx-aipanel" id="kxAiPanel">' +
      '<div class="kx-ai-head">' + mark(28) +
      '<div style="flex:1;min-width:0">' +
      '<div class="t">Agency Intelligence</div>' +
      '<div class="s">Ask about ' + esc((cfg && cfg.name) || 'your dashboard') + '</div>' +
      '</div>' +
      (state.thread.length
        ? '<button class="kx-ai-iconbtn" id="kxAiNew" title="New chat" aria-label="New chat">' +
          micon('restart_alt', { size: 16 }) + '</button>'
        : '') +
      '<button class="kx-ai-iconbtn" id="kxAiCollapse" title="Collapse Agency Intelligence" ' +
      'aria-label="Collapse Agency Intelligence">' + micon('chevron_left', { size: 17 }) +
      '</button></div>' +
      (isExpanded() ? threadHtml() : chipsHtml(person)) +
      inputHtml(isExpanded()) +
      '</div>';
  }

  /* =====================================================================
     ASKING
     ===================================================================== */

  function deniedNote(entry) {
    var K2 = window.KEYSTONE;
    var srcs = (entry && entry.deniedSources) || [];
    if (!srcs.length) return 'Outside your data permissions.';
    var names = srcs.map(function (s) {
      return (K2.SOURCES[s] || {}).name || s;
    }).join(', ');
    return 'Needs ' + names + ' — your account has no access. An administrator can grant it.';
  }

  function send() {
    var q = state.draft.trim();
    if (!q || state.thinking || !currentPerson) return;
    state.thread.push({ role: 'user', text: q });
    state.draft = '';
    state.thinking = true;
    window.KXHub.render();

    // A beat of latency so the thinking state is legible; this is a prototype,
    // there is no request behind it.
    window.setTimeout(function () {
      // Guard the call so a throw can never leave `thinking` stuck true —
      // that would freeze the panel on the animated dots forever, silently
      // swallowing every message afterward (send() bails out while thinking
      // is true). Fall through to a plain assistant turn instead.
      try {
        var res = window.AGENCY_INTEL_AI.homepageRespond(q, currentPerson, null);
        state.thinking = false;
        state.thread.push({
          role: 'assistant',
          text: res.text,
          metricId: (res.entry && res.entry.outcome === 'answered') ? res.entry.metricId : null,
          denied: !!res.denied,
          deniedNote: res.denied ? deniedNote(res.entry) : ''
        });
      } catch (err) {
        state.thinking = false;
        state.thread.push({
          role: 'assistant',
          text: 'Something went wrong answering that — try asking again.',
          metricId: null,
          denied: false,
          deniedNote: ''
        });
      }
      window.KXHub.render();
      scrollThread();
    }, 620);
  }

  function scrollThread() {
    var t = document.getElementById('kxAiThread');
    if (t) t.scrollTop = t.scrollHeight;
  }

  /* =====================================================================
     WIRING — one delegated listener on #root, guarded so the hub's
     re-renders never stack handlers.
     ===================================================================== */

  var addSeq = 0;

  // buildSpec() supplies label, number, delta, tone and the sparkline; pubWidget()
  // renders it. This is wiring, not new machinery.
  function addWidget(metricId, turnIdx) {
    var CC = window.KEYSTONE_CUSTOM;
    var CP = window.AGENCY_INTEL;
    var spec = CC.buildSpec(metricId, 'kpi');
    if (!spec) return;
    addSeq += 1;
    state.added.push({
      id: 'ai' + addSeq,
      metricId: metricId,
      viz: 'kpi',
      w: 4,
      range: 'last_30',
      source: CP.metricSources(metricId)
    });
    var turn = state.thread[turnIdx];
    if (turn) turn.added = spec.label;
    window.KXHub.render();
  }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    var root = document.getElementById('root');

    root.addEventListener('click', function (e) {
      if (e.target.closest('#kxAiCollapse')) {
        state.collapsed = true;
        window.KXHub.render();
        return;
      }
      if (e.target.closest('#kxAiExpand')) {
        state.collapsed = false;
        window.KXHub.render();
        return;
      }
      if (e.target.closest('#kxAiNew')) {
        state.thread = [];
        state.draft = '';
        state.thinking = false;
        // Widgets already added stay on the dashboard — clearing the chat is
        // not undoing a publish.
        window.KXHub.render();
        return;
      }
      var chip = e.target.closest('[data-kx-ai-chip]');
      if (chip) {
        var list = suggestionsFor(currentPerson);
        var s = list[Number(chip.getAttribute('data-kx-ai-chip'))];
        if (s) { state.draft = s.q; send(); }
        return;
      }
      var add = e.target.closest('[data-kx-ai-add]');
      if (add) {
        addWidget(add.getAttribute('data-kx-ai-add'),
                  Number(add.getAttribute('data-kx-ai-add-turn')));
        return;
      }
      if (e.target.closest('#kxAiSend')) { send(); return; }
    });

    root.addEventListener('input', function (e) {
      if (e.target.id === 'kxAiDraft') {
        state.draft = e.target.value;
        // Toggle the send button in place — a full re-render would steal focus
        // and drop the caret mid-sentence.
        var btn = document.getElementById('kxAiSend');
        if (btn) {
          var ready = !!state.draft.trim() && !state.thinking;
          btn.classList.toggle('is-ready', ready);
          btn.disabled = !ready;
        }
      }
    });

    root.addEventListener('keydown', function (e) {
      if (e.target.id === 'kxAiDraft' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
  }

  window.KXAIPanel = {
    hasAccess: hasAccess,
    personFor: personFor,
    setContext: setContext,
    html: html,
    isExpanded: isExpanded,
    addedWidgets: addedWidgets,
    wire: wire
  };

  // The hub renders before this file's consumers exist, so wire on DOM ready
  // rather than from the hero's render path.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
