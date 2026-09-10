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

  // NOT SCOPED PER DASHBOARD — deliberate, and a real limitation to carry into
  // any implementation. state.thread is page-global, so granting the assistant
  // to a second role — a pure seedGrants() data change, no code involved —
  // would show that role the Chief's conversation. A production build must key
  // the thread by dashboard identity.
  //
  // (This used to be the more serious of two leaks: chat-added widgets were
  // page-global too, so they could render on a role's read-only dashboard.
  // Adding from chat is gone, so only the thread remains.)
  //
  // The same applies to every other piece of module state in this file. The full
  // list: state.draft, state.thinking, state.collapsed, the currentPerson /
  // currentOwned pair below, and sendEpoch (the monotonic send id, near send())
  // are all one-per-page, not one-per-dashboard. If you add module state here,
  // add it to this list too.
  //
  // And setContext() is
  // called only from the granted branch of dashBody(), so currentPerson /
  // currentOwned are never reset when an ungranted role renders — they keep
  // whatever the last granted role left behind. Harmless today because nothing
  // reads them without a panel on screen, and left as-is by explicit ruling.
  var state = {
    thread: [],      // { role:'user', text } | { role:'assistant', text, metricId, denied }
    draft: '',
    thinking: false,
    collapsed: false
  };

  // A collapsed panel reports as not expanded, so the container returns to
  // compact height with no extra bookkeeping in the hero.
  function isExpanded() { return !state.collapsed && (state.thread.length > 0 || state.thinking); }

  function mark(size) {
    size = size || 28;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  // Set every render from the variant the hero is drawing, so respond() and the
  // suggestion filter always use the right asker.
  var currentPerson = null;
  // Whether the reader owns the dashboard they are looking at. It no longer
  // gates an edit — nothing on this page edits a dashboard — but it still
  // decides whether we offer the way INTO the builder, since someone reading a
  // dashboard published to them has nothing there to edit. Matches the
  // Agency Intelligence link in the card header, which is owner-only too.
  var currentOwned = false;
  function setContext(roleId, cfg) {
    currentPerson = personFor(roleId);
    currentOwned = !!(cfg && cfg.owned);
  }

  /* =====================================================================
     SUGGESTIONS
     ---------------------------------------------------------------------
     Filtered by the asker's entitlements. The system knows what it will
     refuse, so it must not suggest it — a hand-picked chip whose source app the
     asker lacks would open the panel on a refusal. The filter is live rather
     than hard-coded per role precisely because entitlements are data: the
     Battalion Chief now holds all five sources, so all six chips qualify and the
     slice(0, 3) decides; a Training Officer's pool shrinks to what they can see.

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
    // Stacked, not a scrolling row: the compact panel is as tall as the widget
    // row beside it, so there is vertical room to spare and none horizontally —
    // a 320px row clipped the third chip.
    return '<div class="kx-ai-chips">' +
      '<div class="kx-ai-chips-label">Try asking</div>' +
      list.map(function (s, i) {
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

  function turnHtml(msg) {
    if (msg.role === 'user') {
      return '<div class="kx-ai-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    // The homepage is a VIEW of a published dashboard, never an editing
    // surface — nothing here changes which widgets it carries. Where an answer
    // is chartable and the reader owns the dashboard, point at the one place
    // that CAN change it rather than doing it from the card.
    var canBuild = msg.metricId && currentOwned;
    return '<div class="kx-ai-turn">' + mark(24) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">' +
      '<div class="bubble">' + bubbleText(msg.text) + '</div>' +
      (msg.denied
        ? '<div class="kx-ai-denied">' + micon('block', { size: 13, fill: 1 }) +
          '<span>' + esc(msg.deniedNote || 'Outside your data permissions.') + '</span></div>'
        : '') +
      (canBuild
        ? '<a class="kx-ai-build" href="agency-intelligence-dashboard.html" ' +
          'target="_blank" rel="noreferrer" ' +
          'title="Build this into a widget in Agency Intelligence">' +
          micon('auto_awesome', { size: 14, fill: 1 }) +
          '<span>Open in Agency Intelligence</span>' +
          micon('open_in_new', { size: 13 }) + '</a>'
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

  // role="log" + aria-live="polite" so an answer that arrives after the 620ms
  // beat is announced. Polite, not assertive: the user asked for it, so it must
  // not cut across whatever they are reading now.
  function threadHtml() {
    return '<div class="kx-ai-thread" id="kxAiThread" role="log" aria-live="polite">' +
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
        ? '<div class="kx-ai-legal">Answers here don\'t change the dashboard — ' +
          'widgets are added in Agency Intelligence. ' +
          'Agency Intelligence can be wrong — verify before acting.</div>'
        : '') +
      '</div>';
  }

  // No `cfg` argument any more: the header used to name the dashboard
  // ("Ask about B-1 Coverage Snapshot"), which framed the assistant as
  // scoped to that one card. It isn't — you can ask it about anything in
  // the suite — so the subtitle is gone and nothing here needs the config.
  function html() {
    if (state.collapsed) {
      return '<button class="kx-ai-collapsed" id="kxAiExpand" ' +
        'title="Open Agency Intelligence" aria-label="Open Agency Intelligence">' +
        mark(24) + '<span class="vlabel">Agency Intelligence</span>' +
        micon('chevron_right', { size: 16, color: 'var(--ink-400)', cls: 'kx-ai-collapsed-chev' }) +
        '</button>';
    }
    var person = currentPerson;
    return '<div class="kx-aipanel" id="kxAiPanel">' +
      '<div class="kx-ai-head">' + mark(28) +
      '<div style="flex:1;min-width:0">' +
      '<div class="t">Agency Intelligence</div>' +
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

  /* ---------------------------------------------------------------------
     FOCUS ACROSS RENDERS
     ---------------------------------------------------------------------
     hub.js replaces #root.innerHTML on every render, so the textarea the user
     was typing in is a DIFFERENT element afterwards and the caret is simply
     gone — activeElement falls back to <body>. Without this, every follow-up
     question costs a click, and typing while the dots animate loses the caret
     the moment the answer lands.
     --------------------------------------------------------------------- */

  // Only reclaim focus if nobody else has taken it. Focus inside the panel is
  // ours; focus on <body> is nobody's (usually our own previous render throwing
  // the element away). Anything else — a task row, an open menu — keeps it.
  function focusIsOurs() {
    var a = document.activeElement;
    if (!a || a === document.body) return true;
    return !!(a.closest && a.closest('#kxAiPanel'));
  }

  // Render, then hand the caret back to the draft box at the same offsets.
  // Silently does nothing when the panel is collapsed or absent — there is no
  // textarea to focus then — and never scrolls the page to do it.
  function renderKeepingCaret() {
    var before = document.getElementById('kxAiDraft');
    var selStart = before ? before.selectionStart : null;
    var selEnd = before ? before.selectionEnd : null;
    var ours = focusIsOurs();
    window.KXHub.render();
    if (!ours) return;
    var after = document.getElementById('kxAiDraft');
    if (!after) return;
    after.focus({ preventScroll: true });
    if (selStart != null) {
      try { after.setSelectionRange(selStart, selEnd); } catch (e) { /* clamped by UA */ }
    }
  }

  // Monotonic send id. The answer callback compares the epoch it captured against
  // the current one and drops itself if they differ, so an in-flight beat can no
  // longer land after the thread it belonged to is gone.
  //
  // The ONE path that gets there: "New chat" while the dots are still animating.
  // It clears state.thread and state.thinking, and the timer then fired into an
  // empty thread — an orphan answer with a live Add button and no question above
  // it. Clearing state.thinking is also what re-opens send()'s own guard, so a
  // message typed straight after New chat could start a SECOND timer while the
  // first was still pending, and the two could land out of order.
  //
  // Note what this is NOT for: a plain second send cannot reach a second timer.
  // send() returns early while state.thinking is true, and the Send button is
  // disabled for the same reason, so there is only ever one timer in flight
  // unless something clears thinking mid-beat. New chat is the only thing that
  // does. (An earlier version of this comment credited the guard with fixing the
  // plain-double-send case; that case was already impossible. The guard is right,
  // the reason was wrong.)
  var sendEpoch = 0;

  function send() {
    var q = state.draft.trim();
    if (!q || state.thinking || !currentPerson) return;
    sendEpoch += 1;
    var epoch = sendEpoch;
    state.thread.push({ role: 'user', text: q });
    state.draft = '';
    state.thinking = true;
    renderKeepingCaret();

    // A beat of latency so the thinking state is legible; this is a prototype,
    // there is no request behind it.
    window.setTimeout(function () {
      // Superseded — New chat or a later send happened while this beat ran.
      if (epoch !== sendEpoch) return;
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
      renderKeepingCaret();
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

  // NOTE: this file used to build widget specs here (makeWidgetSpec /
  // addWidget / removeWidget, plus a METRIC_RANGE table) so a chat answer could
  // land on the published grid. All of it is gone: a dashboard's widgets are
  // decided by whoever built it, while they are editing it in Agency
  // Intelligence. The homepage reads a dashboard; it does not compose one.

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
        // The button is live during the thinking beat, so cancel that beat too —
        // otherwise the answer lands in the fresh thread a moment later.
        sendEpoch += 1;
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
