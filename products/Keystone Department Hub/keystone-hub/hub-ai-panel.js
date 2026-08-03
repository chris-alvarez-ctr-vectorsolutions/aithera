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

  function isExpanded() { return state.thread.length > 0 || state.thinking; }
  function addedWidgets() { return state.added; }

  function mark(size) {
    size = size || 28;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  /* =====================================================================
     PANEL MARKUP
     ===================================================================== */

  function inputHtml() {
    var ready = !!state.draft.trim() && !state.thinking;
    return '<div class="kx-ai-input-wrap"><div class="kx-ai-input">' +
      '<textarea id="kxAiDraft" rows="1" ' +
      'placeholder="Ask Agency Intelligence about your data">' + esc(state.draft) + '</textarea>' +
      '<button class="kx-ai-send' + (ready ? ' is-ready' : '') + '" id="kxAiSend" ' +
      'title="Send" aria-label="Send"' + (ready ? '' : ' disabled') + '>' +
      micon('arrow_upward', { size: 17, weight: 500 }) + '</button>' +
      '</div>' +
      '<div class="kx-ai-legal">Charts land on the dashboard, never in chat. ' +
      'Agency Intelligence can be wrong — verify before acting.</div></div>';
  }

  function html(cfg) {
    return '<div class="kx-aipanel" id="kxAiPanel">' +
      '<div class="kx-ai-head">' + mark(28) +
      '<div style="flex:1;min-width:0">' +
      '<div class="t">Agency Intelligence</div>' +
      '<div class="s">Ask about ' + esc((cfg && cfg.name) || 'your dashboard') + '</div>' +
      '</div></div>' +
      inputHtml() +
      '</div>';
  }

  window.KXAIPanel = {
    hasAccess: hasAccess,
    personFor: personFor,
    html: html,
    isExpanded: isExpanded,
    addedWidgets: addedWidgets
  };
})();
