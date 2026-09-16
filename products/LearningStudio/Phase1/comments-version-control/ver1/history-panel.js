/* ============================================================
   EDIT HISTORY PANEL — shared widget

   The editor-wide undo/redo list. Loaded by BOTH pages so the same panel
   and the same behaviour appear wherever the editor is.

   ---- Why it shares the Comments drawer ----
   `vwc-drawer` is a LAYOUT component: it wraps the page shell in its
   `content` slot and marks that slot inert while open. A second drawer
   would mean nesting one inside the other, giving two scrims, two
   Escapes and two inert regions fighting each other.

   So there is ONE drawer with TWO panels slotted into it, and exactly one
   is visible at a time. They are never needed simultaneously — both are
   side panels of editor metadata — and this keeps one scrim, one Escape,
   one restore-focus target. Same reasoning that kept the revert step
   inside the version-history modal rather than stacking a second overlay.

   ---- No "you are viewing an old state" framing ----
   Deliberately absent. This is a normal editor undo stack, not a revert
   flow: you step back, you step forward, and redo is always one click
   away. Warnings would make an ordinary interaction feel dangerous.

   USAGE:  HistoryPanel.init({ sku, page, onApply })
     sku      course key, shared with version-data/history-data
     page     'course-overview' | 'object-manager' — which entries this
              page can actually restore on screen
     onApply  optional; called with (entry, direction) so the host page can
              reflect a change it owns. Entries from the OTHER page still
              move the pointer — the data changes — and the panel says so
              rather than pretending nothing happened.
   ============================================================ */

const HistoryPanel = (function () {

  let sku = null;
  let page = null;
  let onApply = null;
  let drawer = null;

  const $ = (id) => document.getElementById(id);

  /* ---- Markup, injected as siblings of the comments panel ----
     Both panels live in the same drawer's slots; `hidden` picks one. */
  const MARKUP =
    '<div slot="drawer-header" class="cm-head hx-head" id="hxHead" hidden>' +
      '<h2 class="cm-title">History</h2>' +
      '<div class="hx-head-actions">' +
        '<button class="hx-step" id="hxUndoBtn" type="button" title="Undo (⌘Z)" aria-label="Undo">' +
          '<i class="fa-solid fa-rotate-left"></i>' +
        '</button>' +
        '<button class="hx-step" id="hxRedoBtn" type="button" title="Redo (⌘⇧Z)" aria-label="Redo">' +
          '<i class="fa-solid fa-rotate-right"></i>' +
        '</button>' +
        /* How the list works — specifically the one rule that cannot be
           discovered safely by experimenting, since finding it out the
           hard way destroys work. */
        '<button class="hx-step hx-help-btn" id="hxHelpBtn" type="button" ' +
                'aria-haspopup="dialog" aria-label="How history works">' +
          '<i class="fa-regular fa-circle-question"></i>' +
        '</button>' +
      '</div>' +
      '<button class="cm-close" id="hxClose" type="button" aria-label="Close history">' +
        '<i class="fa-solid fa-xmark"></i>' +
      '</button>' +
    '</div>' +
    '<div slot="drawer-content" class="hx-body" id="hxBody" hidden>' +
      '<div class="hx-list" id="hxList"></div>' +
    '</div>';

  function init(opts) {
    drawer = $('commentsDrawer');
    const openBtn = $('btnHistory');
    if (!drawer || !openBtn) return;

    sku = opts.sku;
    page = opts.page;
    onApply = opts.onApply || null;

    // Slot content must be a direct child of the drawer element.
    const host = document.createElement('div');
    host.innerHTML = MARKUP;
    while (host.firstElementChild) drawer.appendChild(host.firstElementChild);

    openBtn.addEventListener('click', () => {
      showPanel('history');
      drawer.open = true;
      render();
    });

    $('hxClose').addEventListener('click', () => { drawer.open = false; });

    $('hxHelpBtn').addEventListener('click', openHelp);
    $('hxUndoBtn').addEventListener('click', () => step('undo'));
    $('hxRedoBtn').addEventListener('click', () => step('redo'));

    /* Clicking a row jumps the pointer there. Undoing everything in the
       window is legal, so the "start" row targets pointer -1. */
    $('hxList').addEventListener('click', (e) => {
      const jump = e.target.closest('[data-hx-goto]');
      if (jump) { gotoEntry(jump.dataset.hxGoto); return; }
    });

    /* Opening Comments hides this panel, and vice versa — one drawer. */
    const cmBtn = $('btnComments');
    if (cmBtn) cmBtn.addEventListener('click', () => showPanel('comments'));

    document.addEventListener('hx:changed', () => { if (isOpen()) render(); });

    /* Standard editor shortcuts, active whether or not the panel is open —
       that is what makes this feel like undo rather than a panel feature. */
    document.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      // Never hijack undo inside a text field the user is typing in.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      step(e.shiftKey ? 'redo' : 'undo');
    });

    updateBadge();
  }

  /* ---- Edit gate ----
     While the editor is stepped back, the next edit is destructive: it
     discards every change ahead of where you are. That is standard undo
     behaviour, but it is irreversible and invisible — nothing on the page
     otherwise says you are not at the latest state.

     So two things guard it. A persistent BANNER on the page says you are
     viewing an earlier state (see hxSyncRewoundBanner on each host page),
     and this CONFIRM runs once, on the first edit attempt, naming exactly
     what will be lost.

     Host pages call HistoryPanel.confirmEdit(cb): cb runs if the edit may
     proceed, and is not called at all if the user backs out. */
  let editGateDialog = null;

  function confirmEdit(proceed) {
    // Not rewound: nothing to lose, so no interruption.
    if (!hxIsRewound(sku)) { proceed(); return; }

    const n = hxAheadCount(sku);

    if (!editGateDialog) {
      editGateDialog = document.createElement('vaadin-dialog');
      document.body.appendChild(editGateDialog);
    }

    editGateDialog.headerTitle = 'Edit from this earlier state?';
    editGateDialog.renderer = (root) => {
      root.innerHTML =
        '<p class="hx-gate-lead">' +
          'You are viewing the course as it was <b>' + n +
          (n === 1 ? ' change' : ' changes') + '</b> ago. Editing from here ' +
          'keeps this version and <b>permanently discards</b> the ' + n +
          ' change' + (n === 1 ? '' : 's') + ' you undid — they can no longer ' +
          'be redone.' +
        '</p>' +
        '<p class="hx-gate-alt">' +
          'To keep them, redo your changes first from the History panel.' +
        '</p>';
    };
    editGateDialog.footerRenderer = (root) => {
      root.innerHTML = '';

      const cancel = document.createElement('vaadin-button');
      cancel.setAttribute('theme', 'secondary');
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', () => { editGateDialog.opened = false; });

      const go = document.createElement('vaadin-button');
      go.setAttribute('theme', 'error primary');
      go.textContent = 'Discard and edit';
      go.addEventListener('click', () => {
        editGateDialog.opened = false;
        proceed();
      });

      root.appendChild(cancel);
      root.appendChild(go);
    };

    editGateDialog.opened = true;
  }

  /* ---- Help dialog ----
     `vaadin-dialog`, the design system component, matching the discard
     dialog on the Course Overview. It renders to a top-level overlay,
     which also means it is NOT inside the drawer's `content` slot — the
     drawer marks that slot inert while open, so an in-slot dialog would
     be unclickable with the panel showing.

     Created on first use rather than at init: most sessions never open
     it, and it keeps the injected panel markup to what is always shown. */
  let helpDialog = null;

  function openHelp() {
    if (!helpDialog) {
      helpDialog = document.createElement('vaadin-dialog');
      helpDialog.headerTitle = 'How history works';
      helpDialog.renderer = (root) => {
        root.innerHTML =
          '<div class="hx-help">' +
            '<p class="hx-help-line">' +
              '<b>Undo and redo freely.</b> Stepping back does not delete ' +
              'anything — undone changes stay in the list, greyed out, and ' +
              'clicking one brings the course back to that point.' +
            '</p>' +
            '<p class="hx-help-line hx-help-warn">' +
              /* An icon, not a colour: the amber text failed to stand out
                 once every line moved to the primary text token, and a
                 glyph distinguishes this line without relying on hue. */
              '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
              '<b>Making a new change locks it in.</b> If you edit the course ' +
              'while stepped back, the undone changes after that point are ' +
              'discarded and can no longer be redone.' +
            '</p>' +
          '</div>';
      };
      helpDialog.footerRenderer = (root) => {
        root.innerHTML = '';
        const done = document.createElement('vaadin-button');
        done.setAttribute('theme', 'primary');
        done.textContent = 'Got it';
        done.addEventListener('click', () => { helpDialog.opened = false; });
        root.appendChild(done);
      };
      document.body.appendChild(helpDialog);
    }
    helpDialog.opened = true;
  }

  function isOpen() { return drawer && drawer.open && !$('hxBody').hidden; }

  /* Swap which panel occupies the shared drawer. */
  function showPanel(which) {
    const history = which === 'history';
    ['hxHead', 'hxBody'].forEach(id => { const el = $(id); if (el) el.hidden = !history; });
    document.querySelectorAll('[slot="drawer-header"].cm-head:not(.hx-head), ' +
                              '[slot="drawer-content"].cm-body, ' +
                              '[slot="drawer-content"].cm-composer')
      .forEach(el => { el.hidden = history; });
    if (drawer) drawer.restoreFocusSelector = history ? '#btnHistory' : '#btnComments';
  }

  /* ---- Moving through the stack ---- */

  function step(direction) {
    const entry = direction === 'undo' ? hxUndo(sku) : hxRedo(sku);
    if (!entry) return;                       // at an end of the stack
    apply(entry, direction);
    if (!isOpen()) { showPanel('history'); drawer.open = true; }
    render();
  }

  function gotoEntry(id) {
    const before = hxState(sku).pointer;

    /* The start row undoes everything in the window: step back to
       pointer -1 rather than targeting an entry that does not exist. */
    if (id === '__start__') {
      let undone = null, step;
      while ((step = hxUndo(sku))) undone = step;
      if (undone) apply(undone, 'undo');
      render();
      return;
    }

    const entry = hxGoto(sku, id);
    if (!entry) return;
    const after = hxState(sku).pointer;
    apply(entry, after < before ? 'undo' : 'redo');
    render();
  }

  /* Hand the change to the host page if it owns it. An entry from the
     other page still moved the pointer — the underlying data changed —
     and the confirmation below reports it. */
  function apply(entry, direction) {
    if (onApply && entry.page === page) onApply(entry, direction);
  }

  /* ---- Render ---- */

  function render() {
    const state = hxState(sku);
    const entries = state.entries;

    $('hxUndoBtn').disabled = state.pointer < 0;
    $('hxRedoBtn').disabled = state.pointer >= entries.length - 1;

    const list = $('hxList');
    if (!entries.length) {
      /* Says WHAT is tracked, so an empty list after editing Course
         Details reads as intentional rather than broken. */
      list.innerHTML =
        '<div class="hx-empty">' +
          '<i class="fa-regular fa-clock-rotate-left"></i>' +
          '<p class="hx-empty-title">No changes yet</p>' +
          '<p class="hx-empty-text">Content edits — transcripts, media, audio, ' +
            'and course structure — appear here as you make them. ' +
            'Course details are covered by Discard changes instead.</p>' +
        '</div>';
      return;
    }

    /* Newest first, grouped by where the change happened, so consecutive
       edits to one object read as a block instead of unrelated rows. */
    const ordered = entries.map((e, i) => ({ ...e, index: i })).reverse();
    const groups = hxGrouped(ordered);

    /* A whole group sitting ahead of the pointer is dimmed as a unit, so
       the undone region reads as one block rather than as rows that
       happen to be faded. */
    const html = groups.map(g => {
      const allAhead = g.items.every(e => e.index > state.pointer);
      return '<section class="hx-group' + (allAhead ? ' is-ahead' : '') + '">' +
        '<h3 class="hx-group-head">' +
          '<span class="hx-group-name">' + esc(g.group) + '</span>' +
          '<span class="hx-group-count">' + g.items.length + '</span>' +
        '</h3>' +
        '<div class="hx-group-rows">' +
          g.items.map(e => row(e, state.pointer)).join('') +
        '</div>' +
      '</section>';
    }).join('');

    /* An explicit line between "undone" and "current" — the single most
       useful thing in the list is knowing where you are, and opacity
       alone was not carrying it. Placed before the group containing the
       pointer, i.e. after every entry that has been undone. */
    const undoneCount = entries.length - 1 - state.pointer;

    list.innerHTML =
      /* Labels the boundary rather than instructing: a caption over the
         undone block names what it is, and the divider names what sits
         below it. How to ACT on either is in the help dialog. */
      (undoneCount > 0
        ? '<div class="hx-region-label">' +
            '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i>' +
            'Undone — not in the course' +
          '</div>'
        : '') +
      html +
      /* Terminates the list, and doubles as the target for "undo
         everything in the window". */
      '<button class="hx-start' + (state.pointer < 0 ? ' is-current' : '') + '" ' +
              'type="button" data-hx-goto="__start__">' +
        '<span class="hx-start-dot" aria-hidden="true"></span>' +
        'Start of this editing session' +
      '</button>';

    /* Insert the divider at the TRUE boundary — immediately above the
       first live row, which may sit partway through a group when only
       some of that group's changes are undone. Placing it at the group
       edge instead put an undone row under the "Current version" label. */
    const firstLive = list.querySelector('.hx-row:not(.is-ahead)');
    if (undoneCount > 0 && firstLive) {
      const divider = document.createElement('div');
      divider.className = 'hx-divider';
      divider.innerHTML = '<span>Current version</span>';

      const group = firstLive.closest('.hx-group');
      const rows = group.querySelector('.hx-group-rows');
      /* Whole group is live -> the divider goes above its heading.
         Group is split -> it goes inside, right before the first live
         row, so the label always sits exactly on the boundary. */
      if (rows.firstElementChild === firstLive) list.insertBefore(divider, group);
      else rows.insertBefore(divider, firstLive);
    }
  }

  function row(e, pointer) {
    const isCurrent = e.index === pointer;
    const isAhead = e.index > pointer;        // undone; redoable
    return '' +
      '<button class="hx-row' + (isCurrent ? ' is-current' : '') +
              (isAhead ? ' is-ahead' : '') + '" type="button" ' +
              'data-hx-goto="' + esc(e.id) + '">' +
        '<span class="hx-dot" aria-hidden="true"></span>' +
        '<span class="hx-icon"><i class="fa-solid ' + hxIcon(e.label) + '"></i></span>' +
        '<span class="hx-text">' +
          '<span class="hx-label">' + esc(e.label) + '</span>' +
          (e.target ? '<span class="hx-target">' + esc(e.target) + '</span>' : '') +
        '</span>' +
        '<span class="hx-when">' + esc(hxAgo(e.at)) + '</span>' +
      '</button>';
  }

  /* The inline confirmation. This is the answer to "how do I know what
     happened?" for a change on a page I am not looking at: it names the
     change, and offers the route rather than navigating for me. */
  /* Count of changes that can still be undone, on the header button. */
  function updateBadge() {
    const badge = document.querySelector('[data-history-count]');
    if (!badge) return;
    const n = hxState(sku).pointer + 1;
    badge.textContent = n;
    badge.classList.toggle('is-empty', n === 0);
  }

  function esc(v) {
    return String(v).replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  document.addEventListener('hx:changed', updateBadge);

  return { init: init, render: render, confirmEdit: confirmEdit };
})();
