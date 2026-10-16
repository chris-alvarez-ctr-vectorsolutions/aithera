/* global window, document, KEYSTONE, KX */
/* ========================================================================
   hub-ai-panel.js — Agency Intelligence, docked to the right of the page.
   ------------------------------------------------------------------------
   The DOCKED preset of the shared AI chat component (the "Reusable AI Chat
   Component" canvas: artboard 1, the anatomy sheet, and artboard 3, the
   Standard docked panel). A 400px rail that is a SIBLING of the page
   content and pushes it narrower — never a layer over it. Open on page load
   for every role; the collapse control in its header folds it to a ribbon on
   the right edge, and the ribbon reopens it.

   Slots carried over from the anatomy sheet (component A), in its fixed
   order. Anything not listed is OFF and leaves no gap:
     Header        signifier · agent name · scope label · new conversation ·
                   window controls (docked: collapse)
     Conversation  empty state (invitation line + suggested prompts) ·
                   user message · working line · agent message ·
                   per-response actions (copy, add to dashboard, thumbs) ·
                   disclosure line · error row with retry
     Composer      text input (grows to six lines) · send / stop
     Footer        privacy note · help link
   Off: history, overflow menu, close, context strip, action card, rich
   response, citations, confirmation, escalation, quick replies, capability
   icons (attach / select / voice). CLOSE is off on purpose: the standalone
   hub has no app bar to reopen from, so collapse is the one way out and the
   ribbon the way back. Expand-to-embedded (the Builder's left column) is the
   next step and is not here yet.

   Who sees it: roles the AI access tab has granted. The gate reads the same
   seedGrants() the tab manages, so there is one source of truth and no
   duplicated permission model. An ungranted role gets the page exactly as it
   was, with no drawer and no ribbon. The grants also shape what the
   assistant will ANSWER — suggestions are filtered by the asker's
   entitlements and a refused question says why.

   The drawer itself is the Vector <vwc-drawer> (core v1.5.1, the build this
   hub loads — read from the bundle, since that version predates the
   published CONTEXT.md): position="end", sidebar mode so it PUSHES the page,
   theme="no-padding", with the component's own collapse button as the
   window control. This file supplies the drawer-header and drawer-content
   slots and the ribbon the page shows while the drawer is closed; hub.js
   wraps the page in it (see wrap()).

   Text answers only. A chart never renders in the thread; an answer that
   resolves to a metric can be taken INTO the builder, which is the canvas.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var esc = KX.esc, micon = KX.micon;

  // roleId -> the AGENCY_INTEL.INDIVIDUALS entry for that role's person.
  function personFor(roleId) {
    var role = K.ROLES[roleId];
    var CP = window.AGENCY_INTEL;
    if (!role || !CP || !CP.INDIVIDUALS) return null;
    return CP.INDIVIDUALS.find(function (p) { return p.id === role.selfId; }) || null;
  }

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

  function hasAccess(roleId) {
    var person = personFor(roleId);
    if (!person) return false;
    var g = getGrants();
    if (ids(g.individuals).indexOf(person.id) !== -1) return true;
    return ids(g.titles).indexOf(person.titleId) !== -1;
  }

  /* =====================================================================
     STATE — session only. No localStorage, so every reviewer opens the
     same way: rail open on desktop, folded to the ribbon on a phone.
     ===================================================================== */

  // NOT SCOPED PER DASHBOARD OR ROLE — deliberate, and a real limitation to
  // carry into any implementation. state.thread is page-global, so switching
  // roles in the prototype panel shows the next role the previous one's
  // conversation. A production build must key the thread by user.
  var state = {
    thread: [],      // { role:'user', text } | { role:'assistant', text, metricId, denied, deniedNote, error, vote, q }
    draft: '',
    thinking: false,
    // Phones start folded: open, the rail would cover the whole page. Set
    // from the phone media query below once the viewport has a real width.
    open: true
  };

  // "Is the drawer beside the page right now" — open AND granted to the
  // role being drawn. dashBody() keys the grid's narrowing off this.
  var currentRole = null;
  function isOpen() { return state.open && hasAccess(currentRole); }

  /* The initial open/folded state follows the phone media query, but NOT
     at script load: inside the embedded product shells the hub's iframe is
     display:none until its tab is chosen, and a hidden iframe reports a
     0px viewport that matches "(max-width: 860px)". So the query is applied
     on every change too, until the reader touches the control themselves —
     after that it is their choice and the viewport stops deciding. */
  var MQ_PHONE = window.matchMedia ? window.matchMedia('(max-width: 860px)') : null;
  var userToggled = false;
  function applyPhoneDefault(render) {
    if (!MQ_PHONE || userToggled || window.innerWidth === 0) return;
    var want = !MQ_PHONE.matches;
    if (want === state.open) return;
    state.open = want;
    if (render && window.KXHub) window.KXHub.render();
  }
  applyPhoneDefault(false);
  if (MQ_PHONE && MQ_PHONE.addEventListener) {
    MQ_PHONE.addEventListener('change', function () { applyPhoneDefault(true); });
  }

  // The signifier: the three-sparkle mark in a filled rounded square. Three
  // sizes on the anatomy sheet — entry 48 / header 28 / avatar 24 — with the
  // radius stepping down alongside. Only the header and avatar sizes appear
  // on this surface.
  function mark(size) {
    size = size || 28;
    var radius = size <= 24 ? 7 : 8;
    return '<span class="agency-intel-mark" role="img" aria-label="Agency Intelligence" ' +
      'style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  // Set every render from the role the hub is drawing, so respond() and the
  // suggestion filter always use the right asker.
  var currentPerson = null;
  // Whether the reader owns the dashboard they are looking at. Decides whether
  // an answer offers the way INTO the builder: someone reading a dashboard
  // published to them has nothing there to edit.
  var currentOwned = false;
  function setContext(roleId, cfg) {
    currentRole = roleId;
    currentPerson = personFor(roleId);
    currentOwned = !!(cfg && cfg.owned);
  }

  /* =====================================================================
     SUGGESTED PROMPTS (anatomy slot 9, the config half of the empty state)
     ---------------------------------------------------------------------
     Filtered by the asker's entitlements. The system knows what it will
     refuse, so it must not suggest it — a prompt whose source app the asker
     lacks would open the thread on a refusal.

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
    { metricId: 'training_completion',    q: 'Which stations are behind on training?' },
    { metricId: 'overdue_inspections',    q: 'Which inspections are overdue at Station 4?' },
    { metricId: 'response_time',          q: 'What’s our average response time this quarter?' },
    { metricId: 'ceu_progress',           q: 'CEU completion by station?' },
    { metricId: 'credential_expirations', q: 'Whose paramedic cert expires in the next 60 days?' },
    { metricId: 'open_shifts',            q: 'Which shifts are open next week?' }
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

  /* =====================================================================
     MARKUP — zones in the system's fixed order:
     header → conversation → composer → footer
     ===================================================================== */

  function headerHtml() {
    var hasThread = state.thread.length > 0 || state.thinking;
    // Slotted into the drawer's header row. The component appends its own
    // collapse button after this (closable, the default), which is the
    // docked mode's window control — so none is drawn here.
    return '<div slot="drawer-header" class="kx-ai-head">' + mark(28) +
      '<div class="kx-ai-ident">' +
      '<div class="t">Agency Intelligence</div>' +
      // Scope label: one line, says what the agent can SEE, not what it can
      // do. Ellipsizes; the full text sits in the tooltip.
      '<div class="s" title="Your department’s data across Vector apps">Your department’s data across Vector apps</div>' +
      '</div>' +
      '<div class="kx-ai-actions">' +
      // New conversation is first of the header actions whenever present.
      // Disabled rather than hidden on an empty thread so the controls never
      // shift sideways when the first message lands.
      '<button class="kx-ai-iconbtn" id="kxAiNew" title="New conversation" ' +
      'aria-label="New conversation"' + (hasThread ? '' : ' disabled') + '>' +
      '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button>' +
      '<span class="kx-ai-sep" aria-hidden="true"></span>' +
      '</div></div>';
  }

  // The empty state. Two parts: the invitation line is a RULE — one sentence
  // derived from the scope, so the surface is never blank — and the prompts
  // are config. Replaced by the thread after the first message.
  function emptyHtml() {
    var list = suggestionsFor(currentPerson);
    return '<div class="kx-ai-surface kx-ai-empty">' +
      '<p class="kx-ai-invite">Ask about training, inspections, response times, ' +
      'or what’s due across your department.</p>' +
      (list.length
        ? '<div class="kx-ai-prompts">' +
          list.map(function (s, i) {
            return '<button class="kx-ai-prompt" data-kx-ai-chip="' + i + '">' + esc(s.q) + '</button>';
          }).join('') + '</div>'
        : '') +
      '</div>';
  }

  // Bold spans in the seeded answers arrive as **markdown**.
  function bubbleText(text) {
    return String(text).split('**').map(function (part, i) {
      return i % 2 ? '<strong>' + esc(part) + '</strong>' : esc(part);
    }).join('');
  }

  // One per response, always: the disclosure line. The instance picks the
  // level only; this surface uses the standard line, not the high-stakes band.
  function disclosureHtml() {
    return '<div class="kx-ai-disclosure">' +
      '<i class="fa-regular fa-circle-info" aria-hidden="true"></i>' +
      '<span>AI-generated · verify before use</span></div>';
  }

  // Per-response actions. Membership is config, ORDER is a rule:
  // copy → insert into field → add to dashboard → regenerate → thumbs.
  // Insert and regenerate are off here (no bound field; no model to re-run).
  function actionsHtml(msg, idx) {
    // The homepage is a VIEW of a published dashboard, never an editing
    // surface. Where an answer is chartable and the reader owns the dashboard,
    // "add to dashboard" points at the one place that CAN change it.
    var canBuild = !!(msg.metricId && currentOwned);
    return '<div class="kx-ai-resp-actions">' +
      '<button class="kx-ai-act' + (msg.copied ? ' is-on' : '') + '" data-kx-ai-copy="' + idx + '" ' +
      'title="' + (msg.copied ? 'Copied' : 'Copy') + '" aria-label="Copy response">' +
      '<i class="fa-regular ' + (msg.copied ? 'fa-check' : 'fa-copy') + '" aria-hidden="true"></i></button>' +
      (canBuild
        ? '<a class="kx-ai-act" href="agency-intelligence-dashboard.html" target="_blank" rel="noreferrer" ' +
          'title="Add to dashboard in Agency Intelligence" aria-label="Add to dashboard in Agency Intelligence">' +
          '<i class="fa-regular fa-square-plus" aria-hidden="true"></i></a>'
        : '') +
      '<span class="kx-ai-sep" aria-hidden="true"></span>' +
      '<button class="kx-ai-act' + (msg.vote === 'up' ? ' is-on' : '') + '" data-kx-ai-vote="up" data-kx-ai-idx="' + idx + '" ' +
      'title="Good response" aria-label="Good response" aria-pressed="' + (msg.vote === 'up') + '">' +
      '<i class="fa-' + (msg.vote === 'up' ? 'solid' : 'regular') + ' fa-thumbs-up" aria-hidden="true"></i></button>' +
      '<button class="kx-ai-act' + (msg.vote === 'down' ? ' is-on' : '') + '" data-kx-ai-vote="down" data-kx-ai-idx="' + idx + '" ' +
      'title="Poor response" aria-label="Poor response" aria-pressed="' + (msg.vote === 'down') + '">' +
      '<i class="fa-' + (msg.vote === 'down' ? 'solid' : 'regular') + ' fa-thumbs-down" aria-hidden="true"></i></button>' +
      '</div>';
  }

  function turnHtml(msg, idx) {
    if (msg.role === 'user') {
      // The ONLY bubble in the thread: right-aligned, neutral fill. Agent
      // text sits flush so the two never look alike.
      return '<div class="kx-ai-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    if (msg.error) {
      // Error with retry takes the agent row. Plain words; retry always offered.
      return '<div class="kx-ai-turn">' + mark(24) +
        '<div class="body"><div class="kx-ai-error">' +
        '<span>Couldn’t reach your Vector apps to answer that.</span>' +
        '<button class="kx-ai-retry" data-kx-ai-retry="' + idx + '">Retry</button>' +
        '</div></div></div>';
    }
    return '<div class="kx-ai-turn">' + mark(24) +
      '<div class="body">' +
      '<p class="kx-ai-text">' + bubbleText(msg.text) + '</p>' +
      (msg.denied
        ? '<div class="kx-ai-denied">' + micon('block', { size: 13, fill: 1 }) +
          '<span>' + esc(msg.deniedNote || 'Outside your data permissions.') + '</span></div>'
        : '') +
      actionsHtml(msg, idx) +
      disclosureHtml() +
      '</div></div>';
  }

  // Working / status line: verb + object, muted, with a progress ring. Never
  // styled like streaming text, which is body-coloured.
  function workingHtml() {
    return '<div class="kx-ai-working" aria-live="polite">' +
      '<span class="ring" aria-hidden="true"></span>' +
      '<span>Checking your Vector apps…</span></div>';
  }

  // role="log" + aria-live="polite" so an answer that arrives after the beat
  // is announced. Polite, not assertive: the user asked for it, so it must
  // not cut across whatever they are reading now.
  function threadHtml() {
    return '<div class="kx-ai-surface kx-ai-thread" id="kxAiThread" role="log" aria-live="polite">' +
      state.thread.map(turnHtml).join('') +
      (state.thinking ? workingHtml() : '') +
      '</div>';
  }

  // Composer: text input and ONE button that is Send at rest and Stop while
  // generating, in the same spot. No capability icons on this instance.
  function composerHtml() {
    var ready = !!state.draft.trim() && !state.thinking;
    return '<div class="kx-ai-composer"><div class="kx-ai-input">' +
      '<label class="kx-ai-sr" for="kxAiDraft">Message</label>' +
      '<textarea id="kxAiDraft" rows="1" placeholder="Ask about your department…">' + esc(state.draft) + '</textarea>' +
      (state.thinking
        ? '<button class="kx-ai-send is-stop" id="kxAiStop" title="Stop" aria-label="Stop generating">' +
          '<i class="fa-solid fa-stop" aria-hidden="true"></i></button>'
        : '<button class="kx-ai-send' + (ready ? ' is-ready' : '') + '" id="kxAiSend" ' +
          'title="Send" aria-label="Send"' + (ready ? '' : ' disabled') + '>' +
          '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>') +
      '</div></div>';
  }

  // Footer: one zone, on. Privacy note left, help right. Prototype links.
  function footerHtml() {
    return '<div class="kx-ai-foot">' +
      '<span>Private to your department · <a href="#" data-kx-ai-noop>Privacy</a></span>' +
      '<a href="#" data-kx-ai-noop><i class="fa-regular fa-circle-question" aria-hidden="true"></i>Help</a>' +
      '</div>';
  }

  // The ribbon the drawer folds to: a sibling of .kx-main inside .kx-shell,
  // drawn only while the drawer is closed. Same signifier, the name running
  // up the edge, and the chevron pointing the way it will open.
  function ribbonHtml(roleId) {
    if (state.open || !hasAccess(roleId)) return '';
    return '<aside class="kx-airib" aria-label="Agency Intelligence, collapsed">' +
      '<button class="kx-airib-open" id="kxAiExpand" title="Open Agency Intelligence" ' +
      'aria-label="Open Agency Intelligence" aria-expanded="false">' +
      mark(28) + '<span class="vlabel">Agency Intelligence</span>' +
      '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>' +
      '</button></aside>';
  }

  // Everything inside the drawer panel below its header row.
  function bodyHtml() {
    var hasThread = state.thread.length > 0 || state.thinking;
    return '<div slot="drawer-content" class="kx-ai-body" id="kxAiPanel">' +
      (hasThread ? threadHtml() : emptyHtml()) +
      composerHtml() +
      footerHtml() +
      '</div>';
  }

  /* Wrap the page in the Vector drawer. `content` is the page shell; it goes
     in the drawer's content slot so the component lays the two out side by
     side and the page reflows narrower. Returned unchanged when the role has
     no grant or the drawer is closed — then there is no drawer at all, only
     the ribbon ribbonHtml() put in the shell.

     Phones get the component's OVERLAY mode: a modal <dialog> over the page
     with a backdrop, closed by its own button or the backdrop. The `open`
     attribute is left off there and set as a property in afterRender(),
     because the component only calls showModal() when it SEES open change —
     an element created already-open never shows its dialog. Desktop keeps
     the attribute so a hub re-render never flashes the page full-width. */
  function wrap(content, roleId) {
    if (!state.open || !hasAccess(roleId)) return content;
    var phone = !!(MQ_PHONE && MQ_PHONE.matches);
    return '<vwc-drawer class="kx-aidrawer" id="kxAiDrawer" position="end" theme="no-padding"' +
      (phone ? ' overlay' : ' open') + '>' +
      '<div slot="content" class="kx-aidrawer-page">' + content + '</div>' +
      headerHtml() +
      bodyHtml() +
      '</vwc-drawer>';
  }

  /* =====================================================================
     ASKING
     ===================================================================== */

  function deniedNote(entry) {
    var srcs = (entry && entry.deniedSources) || [];
    if (!srcs.length) return 'Outside your data permissions.';
    var names = srcs.map(function (s) {
      return (K.SOURCES[s] || {}).name || s;
    }).join(', ');
    return 'Needs ' + names + ' — your account has no access. An administrator can grant it.';
  }

  /* ---------------------------------------------------------------------
     FOCUS AND SCROLL ACROSS RENDERS
     ---------------------------------------------------------------------
     hub.js replaces #root.innerHTML on every render, so the textarea the user
     was typing in is a DIFFERENT element afterwards and the caret is simply
     gone. The same render throws away the thread's scroll position. hub.js
     calls beforeRender()/afterRender() around the swap so both survive; the
     panel's own renders go through renderKeepingCaret() on top of that.
     --------------------------------------------------------------------- */

  var savedScroll = null;
  function beforeRender() {
    var t = document.getElementById('kxAiThread');
    savedScroll = t ? t.scrollTop : null;
  }
  function afterRender() {
    var t = document.getElementById('kxAiThread');
    if (t && savedScroll != null) t.scrollTop = savedScroll;
    savedScroll = null;
    fitDraft();
    wireDrawer();
    // The prototype FAB sits bottom-right; the drawer owns that corner now.
    document.body.classList.toggle('kx-airail-open', !!document.getElementById('kxAiDrawer'));
  }

  // The drawer element is new after every hub render, so its listener is
  // attached here each time. Its own collapse button (and, in overlay mode,
  // the backdrop) flips `open`; the component announces that with
  // open-changed and this folds the page to the ribbon in response.
  function wireDrawer() {
    var d = document.getElementById('kxAiDrawer');
    if (!d) return;
    d.addEventListener('open-changed', function (e) {
      if (e.detail === false && state.open) {
        userToggled = true;
        state.open = false;
        window.KXHub.render();
        var rib = document.getElementById('kxAiExpand');
        if (rib) rib.focus({ preventScroll: true });
      }
    });
    if (d.hasAttribute('overlay') && !d.open) {
      // After the element's FIRST update, not before: the component calls
      // showModal() only when its update cycle records open changing from a
      // defined value, and a property set before the first render is folded
      // into that render's "everything is new" cycle, so the dialog would
      // open non-modally, inline in the page.
      var show = function () {
        if (document.getElementById('kxAiDrawer') !== d) return;
        var ready = d.updateComplete || Promise.resolve();
        ready.then(function () { if (document.getElementById('kxAiDrawer') === d) d.open = true; });
      };
      if (window.customElements && customElements.get('vwc-drawer')) show();
      else if (window.customElements) customElements.whenDefined('vwc-drawer').then(show);
    }
  }

  // The input grows to six lines, then scrolls (max-height in CSS).
  function fitDraft() {
    var el = document.getElementById('kxAiDraft');
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // Only reclaim focus if nobody else has taken it. Focus inside the panel is
  // ours; focus on <body> is nobody's (usually our own previous render throwing
  // the element away). Anything else — a task row, an open menu — keeps it.
  function focusIsOurs() {
    var a = document.activeElement;
    if (!a || a === document.body) return true;
    return !!(a.closest && a.closest('#kxAiPanel'));
  }

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

  // Monotonic send id. The answer callback compares the epoch it captured
  // against the current one and drops itself if they differ, so an in-flight
  // beat can never land after the thread it belonged to is gone. New
  // conversation and Stop both bump it while the dots are still running.
  var sendEpoch = 0;

  function ask(q) {
    if (!q || state.thinking || !currentPerson) return;
    sendEpoch += 1;
    var epoch = sendEpoch;
    state.thread.push({ role: 'user', text: q });
    state.draft = '';
    state.thinking = true;
    renderKeepingCaret();
    scrollThread();

    // A beat of latency so the working line is legible; this is a prototype,
    // there is no request behind it.
    window.setTimeout(function () {
      if (epoch !== sendEpoch) return;
      // Guard the call so a throw can never leave `thinking` stuck true — that
      // would freeze the panel on the ring forever. Fall through to the error
      // row, which offers a retry.
      try {
        var res = window.AGENCY_INTEL_AI.homepageRespond(q, currentPerson, null);
        state.thinking = false;
        state.thread.push({
          role: 'assistant',
          text: res.text,
          metricId: (res.entry && res.entry.outcome === 'answered') ? res.entry.metricId : null,
          denied: !!res.denied,
          deniedNote: res.denied ? deniedNote(res.entry) : '',
          q: q
        });
      } catch (err) {
        state.thinking = false;
        state.thread.push({ role: 'assistant', error: true, q: q });
      }
      renderKeepingCaret();
      scrollThread();
    }, 620);
  }

  function send() { ask(state.draft.trim()); }

  function stop() {
    sendEpoch += 1;
    state.thinking = false;
    renderKeepingCaret();
  }

  function scrollThread() {
    var t = document.getElementById('kxAiThread');
    if (t) t.scrollTop = t.scrollHeight;
  }

  function copyText(msg, idx) {
    var plain = String(msg.text || '').replace(/\*\*/g, '');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(plain);
    } catch (e) { /* clipboard unavailable on file:// — the tick still shows */ }
    msg.copied = true;
    window.KXHub.render();
    window.setTimeout(function () {
      if (state.thread[idx] === msg) { msg.copied = false; window.KXHub.render(); }
    }, 1400);
  }

  /* =====================================================================
     WIRING — one delegated listener on #root, guarded so the hub's
     re-renders never stack handlers.
     ===================================================================== */

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    var root = document.getElementById('root');

    root.addEventListener('click', function (e) {
      if (e.target.closest('#kxAiExpand')) {
        userToggled = true;
        state.open = true;
        window.KXHub.render();
        var draft = document.getElementById('kxAiDraft');
        if (draft) draft.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('#kxAiNew')) {
        state.thread = [];
        state.draft = '';
        state.thinking = false;
        sendEpoch += 1;   // cancel a beat still in flight
        renderKeepingCaret();
        return;
      }
      if (e.target.closest('#kxAiStop')) { stop(); return; }
      if (e.target.closest('#kxAiSend')) { send(); return; }

      var chip = e.target.closest('[data-kx-ai-chip]');
      if (chip) {
        var list = suggestionsFor(currentPerson);
        var s = list[Number(chip.getAttribute('data-kx-ai-chip'))];
        if (s) ask(s.q);
        return;
      }
      var retry = e.target.closest('[data-kx-ai-retry]');
      if (retry) {
        var i = Number(retry.getAttribute('data-kx-ai-retry'));
        var failed = state.thread[i];
        // Drop the error row and the question above it, then ask again.
        state.thread.splice(i - 1 >= 0 && state.thread[i - 1].role === 'user' ? i - 1 : i, 2);
        if (failed && failed.q) ask(failed.q);
        return;
      }
      var copy = e.target.closest('[data-kx-ai-copy]');
      if (copy) {
        var ci = Number(copy.getAttribute('data-kx-ai-copy'));
        if (state.thread[ci]) copyText(state.thread[ci], ci);
        return;
      }
      var vote = e.target.closest('[data-kx-ai-vote]');
      if (vote) {
        var vi = Number(vote.getAttribute('data-kx-ai-idx'));
        var dir = vote.getAttribute('data-kx-ai-vote');
        var m = state.thread[vi];
        if (m) { m.vote = m.vote === dir ? null : dir; window.KXHub.render(); }
        return;
      }
      if (e.target.closest('[data-kx-ai-noop]')) { e.preventDefault(); return; }
    });

    root.addEventListener('input', function (e) {
      if (e.target.id === 'kxAiDraft') {
        state.draft = e.target.value;
        fitDraft();
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
    wrap: wrap,
    ribbonHtml: ribbonHtml,
    isOpen: isOpen,
    beforeRender: beforeRender,
    afterRender: afterRender,
    wire: wire
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
