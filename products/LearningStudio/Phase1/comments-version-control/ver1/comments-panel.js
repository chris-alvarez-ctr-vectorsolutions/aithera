/* ============================================================
   COMMENTS PANEL — shared controller

   Drives the `vwc-drawer` comments panel on BOTH pages. The pages differ only
   in what they pass to CommentsPanel.init():

     course-overview.html   scope: { type: 'course' }
     object-manager.html    scope: { type: 'object', objectId: 's03-o01' }

   Everything else — scope bar, filter tabs, ordering, thread expand/collapse,
   posting, resolving, deep links — is identical, so the panel cannot drift
   between pages.

   ---- Relationship to Phase2/objectManager.html ----
   The thread UI follows that future-state prototype: threads render INLINE in
   one scrolling list, each collapsing to a header row and expanding to reveal
   its bubble, replies and reply box. Adopted from it: the collapse/expand
   chevron, the unread dot after the author name, the scope bar, and the
   All/Open/Resolved filter tabs.

   NOT adopted, deliberately: Phase 2's third scope level (Scene). Scope here
   is Course + learning object only. Also left out for now are search, sort,
   thread/reply overflow menus and the drill-in tag picker.

   Requires comments-data.js to be loaded first.
   ============================================================ */

const CommentsPanel = (function () {

  let threads = [];
  let pageScope = { type: 'course' };   // what THIS page is
  let course = null;                    // for naming learning objects
  let scopeFilter = 'all';              // 'all' (course) | 'current' (this LO)
  let stateFilter = 'all';              // 'all' | 'open' | 'resolved'
  let expanded = new Set();             // thread ids currently expanded
  let editingPath = null;               // "<threadId>:<index>" being edited, if any
  let openMenuPath = null;              // comment whose reaction menu is open, if any
  let els = {};

  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s).replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  /* Deterministic avatar colour per author, so the same person is the same
     colour everywhere without storing a colour on every comment. */
  const AVATAR_COLORS = ['#7c4ddb', '#0284c7', '#158444', '#e0782e', '#db2777', '#1f5fa9'];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  /* ---- Selection ---- */

  function inScope(t) {
    if (scopeFilter === 'all') return true;
    return pageScope.type === 'course'
      ? t.scope === 'course'
      : t.scope === 'object' && t.objectId === pageScope.objectId;
  }

  /* Is this thread attached to the page we are on? Decides whether a "Go to"
     jump is offered — on its own page there is nowhere to go. */
  function isLocal(t) {
    return pageScope.type === 'course'
      ? t.scope === 'course'
      : t.scope === 'object' && t.objectId === pageScope.objectId;
  }

  function visibleThreads() {
    return cmSortThreads(threads.filter(t => {
      if (!inScope(t)) return false;
      if (stateFilter === 'open') return !t.resolved;
      if (stateFilter === 'resolved') return t.resolved;
      return true;
    }));
  }

  /* ---- Rendering ---- */

  function renderBadge() {
    // Header badge counts UNRESOLVED threads course-wide, independent of the
    // panel's filters — it is a course-level signal, not a view of the list.
    const open = threads.filter(t => !t.resolved).length;
    document.querySelectorAll('[data-comment-count]').forEach(b => {
      b.textContent = open;
      b.classList.toggle('is-empty', !open);
    });
    els.headCount.textContent = open;
  }

  function renderTabs() {
    // Counts reflect the CURRENT scope, so the tabs describe the list below
    // them rather than the whole course.
    const scoped = threads.filter(inScope);
    const counts = {
      all: scoped.length,
      open: scoped.filter(t => !t.resolved).length,
      resolved: scoped.filter(t => t.resolved).length
    };
    els.tabs.querySelectorAll('.cm-filter-tab').forEach(tab => {
      const key = tab.dataset.state;
      const label = key === 'all' ? 'All' : key === 'open' ? 'Open' : 'Resolved';
      tab.textContent = label + ' (' + counts[key] + ')';
      tab.classList.toggle('is-active', key === stateFilter);
    });
  }

  function renderScopeBar() {
    // The LO crumb only exists on an object page.
    const onObject = pageScope.type === 'object';
    els.scopeSep.hidden = !onObject;
    els.scopeCurrent.hidden = !onObject;
    if (onObject && course) {
      els.scopeCurrentLabel.textContent = cmScopeLabel(
        { scope: 'object', objectId: pageScope.objectId }, course);
    }
    els.scope.querySelectorAll('.cm-scope-btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.scope === scopeFilter));

    // Unread pips per crumb.
    const courseUnread = threads.filter(t => !t.resolved && t.unread).length;
    const localUnread = threads.filter(t => !t.resolved && t.unread && isLocal(t)).length;
    els.unreadAll.textContent = courseUnread || '';
    els.unreadAll.hidden = !courseUnread;
    els.unreadCurrent.textContent = localUnread || '';
    els.unreadCurrent.hidden = !localUnread;
  }

  /* ---- Per-comment affordances -----------------------------------
     Reactions and Edit apply to EVERY comment — the thread's root comment
     and each reply alike. They are rendered from here rather than inline in
     two places so the root and the replies can't drift apart.

     `path` identifies which comment an action targets: "<threadId>:<index>".
     The index is into `thread.comments`, matching how reactions/edits are
     persisted (see comments-data.js). ---------------------------------- */

  /* The reaction row: every emoji already used, plus a button to add one.
     A chip the current user is part of is marked `is-mine` so it reads as
     "you reacted" and clicking it removes your reaction. */
  function reactionsHtml(c, path) {
    const rx = c.reactions || {};
    const chips = Object.keys(rx)
      .filter(e => rx[e] && rx[e].length)          // drop emptied entries
      .map(e => {
        const who = rx[e];
        const mine = who.indexOf(CM_ME) !== -1;
        return '<button class="cm-rx-chip' + (mine ? ' is-mine' : '') + '" type="button" ' +
                 'data-react="' + esc(path) + '" data-emoji="' + esc(e) + '" ' +
                 'title="' + esc(who.join(', ')) + '" ' +
                 'aria-label="' + esc(e + ' ' + who.length + ' — ' + who.join(', ')) + '" ' +
                 'aria-pressed="' + (mine ? 'true' : 'false') + '">' +
                 '<span class="cm-rx-emoji">' + esc(e) + '</span>' +
                 '<span class="cm-rx-count">' + who.length + '</span>' +
               '</button>';
      }).join('');

    /* A single smiley trigger that opens a menu of choices, matching
       production. One control at rest regardless of how many reactions the
       vocabulary holds, which is what lets CM_REACTIONS be wider than the
       four-emoji strip this replaced.

       Only ONE menu is open at a time (`openMenuPath`), so the panel never
       shows two grids at once. The menu is a sibling of the trigger inside a
       positioned wrapper, so it can overlay the thread without being clipped
       by the reaction row. */
    const menuOpen = openMenuPath === path;
    const menu = menuOpen
      ? '<div class="cm-rx-menu" role="menu" aria-label="Pick a reaction">' +
          CM_REACTIONS.map(e => {
            const who = rx[e] || [];
            const mine = who.indexOf(CM_ME) !== -1;
            return '<button class="cm-rx-opt' + (mine ? ' is-mine' : '') + '" type="button" ' +
                     'role="menuitemcheckbox" aria-checked="' + (mine ? 'true' : 'false') + '" ' +
                     'data-react="' + esc(path) + '" data-emoji="' + esc(e) + '" ' +
                     'title="' + esc(mine ? 'Remove ' + e : 'React ' + e) + '" ' +
                     'aria-label="' + esc(mine ? 'Remove your ' + e + ' reaction' : 'React with ' + e) + '">' +
                     esc(e) +
                   '</button>';
          }).join('') +
        '</div>'
      : '';

    const picker =
      '<span class="cm-rx-picker">' +
        '<button class="cm-rx-trigger' + (menuOpen ? ' is-open' : '') + '" type="button" ' +
                'data-rx-menu="' + esc(path) + '" ' +
                'aria-haspopup="true" aria-expanded="' + (menuOpen ? 'true' : 'false') + '" ' +
                'title="Add a reaction" aria-label="Add a reaction">' +
          '<i class="fa-regular fa-face-smile"></i>' +
        '</button>' +
        menu +
      '</span>';

    return '<div class="cm-reactions">' + chips + picker + '</div>';
  }

  /* Edit is offered only on your OWN comments, matching production. */
  function canEdit(c) { return c.author === CM_ME; }

  function editBtnHtml(c, path) {
    if (!canEdit(c)) return '';
    return '<button class="cm-edit-btn" type="button" data-edit="' + esc(path) + '" ' +
             'title="Edit comment" aria-label="Edit your comment">' +
             '<i class="fa-regular fa-pen-to-square"></i></button>';
  }

  /* Shown beside the timestamp once a comment has been changed, so an edited
     comment is never silently different from what someone replied to. */
  function editedMarkHtml(c) {
    return c.editedAt
      ? '<span class="cm-edited" title="Edited ' + esc(cmRelTime(c.editedAt)) + '">(edited)</span>'
      : '';
  }

  /* The inline editor that replaces a comment's text while editing. */
  function editorHtml(c, path) {
    return '<div class="cm-editor">' +
      '<textarea class="cm-editor-input" data-editor="' + esc(path) + '" ' +
                'aria-label="Edit comment">' + esc(c.text) + '</textarea>' +
      '<div class="cm-editor-actions">' +
        '<button class="cm-btn-text" type="button" data-edit-cancel="' + esc(path) + '">Cancel</button>' +
        '<button class="cm-btn-primary cm-btn-sm" type="button" data-edit-save="' + esc(path) + '">Save</button>' +
      '</div>' +
    '</div>';
  }

  /* A reply carries the same affordances as the root comment — reactions and
     (on your own) Edit. Previously it rendered text only, so reacting to or
     fixing a reply was impossible. `path` is "<threadId>:<index>". */
  function replyHtml(c, path) {
    const editing = editingPath === path;
    return '' +
      '<div class="cm-reply-item">' +
        '<span class="cm-reply-avatar" style="background:' + avatarColor(c.author) + '">' +
          esc(cmInitials(c.author)) + '</span>' +
        '<span class="cm-reply-body">' +
          '<span class="cm-reply-head">' +
            '<span class="cm-reply-author">' + esc(c.author) + '</span>' +
            '<span class="cm-reply-time">' + esc(cmRelTime(c.created)) + '</span>' +
            editedMarkHtml(c) +
            // Actions sit at the row's end, mirroring the root comment.
            '<span class="cm-c-actions">' + editBtnHtml(c, path) + '</span>' +
          '</span>' +
          (editing
            ? editorHtml(c, path)
            : '<span class="cm-reply-text">' + esc(c.text) + '</span>') +
          reactionsHtml(c, path) +
        '</span>' +
      '</div>';
  }

  function threadHtml(t) {
    const first = t.comments[0];
    const replies = t.comments.slice(1);
    const isOpen = expanded.has(t.id);
    const label = cmScopeLabel(t, course);

    return '' +
      '<div class="cm-thread' + (isOpen ? '' : ' is-collapsed') +
             (t.resolved ? ' is-resolved' : '') +
             (t.unread && !t.resolved ? ' is-unread' : '') + '" data-thread="' + esc(t.id) + '">' +

        /* ---- Header: always visible, toggles the thread ----
           Condensed: the attachment chip sits under the author/timestamp
           inside the meta block, so it lines up with them rather than
           occupying a full-width row of its own as it once did. The jump is
           an icon pinned top-right. */
        '<div class="cm-thread-head" role="button" tabindex="0" data-toggle="' + esc(t.id) + '">' +
          '<span class="cm-thread-chevron"><i class="fa-solid fa-chevron-down"></i></span>' +
          '<span class="cm-avatar" style="background:' + avatarColor(first.author) + '">' +
            esc(cmInitials(first.author)) + '</span>' +
          '<span class="cm-thread-meta">' +
            '<span class="cm-author-line">' +
              '<span class="cm-author">' + esc(first.author) + '</span>' +
            '</span>' +
            '<span class="cm-time">' + esc(cmRelTime(t.created)) +
              (replies.length ? ' · ' + replies.length +
                (replies.length === 1 ? ' reply' : ' replies') : '') +
            '</span>' +
            /* Where the thread is attached, as plain text under the
               timestamp rather than a filled pill.

               The header already carries an avatar, an unread dot and a
               chevron; a pill added a fourth competing shape for what is
               really just metadata. Text recedes appropriately, and it
               ellipsizes cleanly at any width — a pill's rounded background
               makes a truncated label look broken. The name is bolded so the
               location still reads at a glance. */
            '<span class="cm-source" title="' + esc(label) + '">' +
              'on <b>' + esc(label) + '</b></span>' +
          '</span>' +
          (t.resolved ? '<span class="cm-resolved-badge">' +
              '<i class="fa-regular fa-circle-check"></i>Resolved</span>' : '') +
        '</div>' +

        /* Icon-only jump, pinned top-right of the row.

           It is a SIBLING of the header, not a child. Nested inside, its box
           sat within the header's own click target — overlapping targets,
           which WCAG 2.5.8 (Target Size, Minimum) disallows. As a sibling the
           header's target stops short of it (see .cm-thread-head padding-right
           in the stylesheet), so the two are adjacent, each 24px+.

           Available on hover in BOTH states, expanded or collapsed. */
        (!isLocal(t)
          ? '<button class="cm-goto-icon" type="button" data-goto="' + esc(t.id) + '" ' +
                    'title="Go to ' + esc(label) + '" ' +
                    'aria-label="Go to ' + esc(label) + '">' +
              '<i class="fa-solid fa-arrow-up-right-from-square"></i>' +
            '</button>'
          : '') +

        // ---- Collapsed preview: one line, so a shut thread is still scannable
        '<div class="cm-thread-preview">' + esc(first.text) + '</div>' +

        // ---- Expanded body ----
        '<div class="cm-thread-body">' +
          // No context row here any more: the attachment chip and the jump
          // both live in the header, so the body opens straight onto content.
          /* Root comment.

             NO author/timestamp row here: the thread header directly above
             already shows this comment's author, avatar and time, so
             repeating them read as the same person posting twice. Only the
             things the header cannot carry live here — the "(edited)" mark
             and the Edit affordance — pinned right so they do not look like
             a second byline. */
          '<div class="cm-root">' +
            (editedMarkHtml(first) || canEdit(first)
              ? '<div class="cm-root-head">' +
                  editedMarkHtml(first) +
                  '<span class="cm-c-actions">' + editBtnHtml(first, t.id + ':0') + '</span>' +
                '</div>'
              : '') +
            (editingPath === t.id + ':0'
              ? editorHtml(first, t.id + ':0')
              : '<div class="cm-bubble' + (t.resolved ? ' is-resolved' : '') + '">' +
                  esc(first.text) + '</div>') +
            reactionsHtml(first, t.id + ':0') +
          '</div>' +

          (replies.length
            // +1 because index 0 is the root comment.
            ? '<div class="cm-replies">' +
                replies.map((c, i) => replyHtml(c, t.id + ':' + (i + 1))).join('') +
              '</div>'
            : '') +

          /* ---- Composer, matching production's anatomy ----
             A full-width reply field with LABELLED actions beneath it.

             This replaces an icon-only paper-plane + circle-check pair that
             sat inline with the field: two similarly-weighted glyphs where
             one sent and the other resolved, which is exactly the ambiguity
             production's text labels avoid.

             Production puts "Resolve Thread" top-right of the thread. Here
             it joins Reply in this row instead: the thread header already
             carries the resolved badge and the jump-to-location button, and
             a third control there would collide with both. Grouping by
             prominence keeps production's labels without the pile-up. */
          '<div class="cm-composer-row">' +
            '<textarea class="cm-reply-input" rows="1" placeholder="Reply to thread…" ' +
                      'data-reply="' + esc(t.id) + '" aria-label="Reply to thread"></textarea>' +
            '<div class="cm-composer-actions">' +
              '<button class="cm-btn-text" type="button" data-resolve="' + esc(t.id) + '">' +
                (t.resolved ? 'Reopen Thread' : 'Resolve Thread') +
              '</button>' +
              '<button class="cm-btn-primary" type="button" data-send="' + esc(t.id) + '">' +
                'Reply' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    const list = visibleThreads();
    els.empty.hidden = list.length !== 0;

    let sunk = false;   // have we crossed into the resolved block?
    els.threads.innerHTML = list.map(t => {
      // One divider introduces the resolved block, but only when the list
      // actually mixes the two — on the Resolved tab it would be noise.
      let divider = '';
      if (t.resolved && !sunk && stateFilter === 'all') {
        sunk = true; divider = '<div class="cm-divider">Resolved</div>';
      }
      return divider + threadHtml(t);
    }).join('');

    renderTabs();
    renderScopeBar();
    renderBadge();
  }

  /* ---- Actions ---- */

  function toggleThread(id) {
    if (expanded.has(id)) expanded.delete(id);
    else {
      expanded.add(id);
      // Opening a thread reads it.
      const t = threads.find(x => x.id === id);
      if (t && t.unread) { t.unread = false; cmSaveThreads(threads); }
    }
    render();
  }

  function goToThread(id) {
    const t = threads.find(x => x.id === id);
    if (t && !isLocal(t)) window.location = cmThreadHref(t);
  }

  function reply(id) {
    const input = els.threads.querySelector('[data-reply="' + id + '"]');
    const text = (input && input.value || '').trim();
    if (!text) return;
    const t = threads.find(x => x.id === id);
    t.comments.push({ author: CM_ME, created: new Date().toISOString(), text });
    t.resolved = false;                 // a new reply reopens the thread
    expanded.add(id);                   // keep it open so the reply is visible
    cmSaveThreads(threads);
    render();
  }

  function toggleResolve(id) {
    const t = threads.find(x => x.id === id);
    if (!t) return;
    t.resolved = !t.resolved;
    if (t.resolved) { t.unread = false; expanded.delete(id); }
    cmSaveThreads(threads);
    render();
  }

  /* ---- Reactions + editing ----------------------------------------
     Both address a single comment by "<threadId>:<index>". ------------ */

  function findComment(path) {
    const [tid, idx] = String(path).split(':');
    const t = threads.find(x => x.id === tid);
    if (!t) return null;
    const c = t.comments[Number(idx)];
    return c ? { thread: t, comment: c } : null;
  }

  /* The reaction menu. Only one is open at a time — opening another closes
     the first — so the panel never shows two grids competing. */
  function toggleReactionMenu(path) {
    openMenuPath = (openMenuPath === path) ? null : path;
    render();
    if (openMenuPath) {
      // Move focus into the menu so it is keyboard-operable immediately.
      const first = document.querySelector('[data-rx-menu="' + path + '"] + .cm-rx-menu .cm-rx-opt');
      if (first) first.focus();
    }
  }

  function closeReactionMenu(rerender) {
    if (openMenuPath === null) return;
    openMenuPath = null;
    if (rerender) render();
  }

  /* One reaction per person per emoji: picking one you already have removes
     it, so the same control is the undo. */
  function toggleReaction(path, emoji) {
    const hit = findComment(path);
    if (!hit) return;
    const c = hit.comment;
    if (!c.reactions) c.reactions = {};
    const who = c.reactions[emoji] || [];
    const i = who.indexOf(CM_ME);
    if (i === -1) who.push(CM_ME);
    else who.splice(i, 1);
    if (who.length) c.reactions[emoji] = who;
    else delete c.reactions[emoji];      // last reactor left — drop the chip
    cmSaveThreads(threads);
    openMenuPath = null;                 // picking one dismisses the menu
    render();
  }

  function startEdit(path) {
    const hit = findComment(path);
    if (!hit || !canEdit(hit.comment)) return;   // own comments only
    editingPath = path;
    render();
    // Put the caret in the editor and select nothing, ready to type.
    const ta = document.querySelector('[data-editor="' + path + '"]');
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }

  function cancelEdit() { editingPath = null; render(); }

  function saveEdit(path) {
    const hit = findComment(path);
    const ta = document.querySelector('[data-editor="' + path + '"]');
    if (!hit || !ta) return;
    const text = ta.value.trim();
    // An emptied comment is a delete, which this prototype does not model —
    // treat it as a cancel rather than silently blanking the thread.
    if (!text) { cancelEdit(); return; }
    if (text !== hit.comment.text) {
      hit.comment.text = text;
      hit.comment.editedAt = new Date().toISOString();
      cmSaveThreads(threads);
    }
    editingPath = null;
    render();
  }

  function compose() {
    const field = $('cmInput');
    const text = (field.value || '').trim();
    if (!text) return;
    const t = {
      id: 'n' + Date.now(),
      scope: pageScope.type,
      created: new Date().toISOString(),
      resolved: false, unread: false,
      comments: [{ author: CM_ME, created: new Date().toISOString(), text }]
    };
    if (pageScope.type === 'object') t.objectId = pageScope.objectId;
    threads.push(t);
    field.value = '';
    expanded.add(t.id);
    // A new thread must be visible after posting — the Resolved tab would
    // hide it, so fall back to All.
    if (stateFilter === 'resolved') stateFilter = 'all';
    cmSaveThreads(threads);
    render();
  }

  /* ---- Init ---- */

  function init(opts) {
    const drawer = $('commentsDrawer');
    const openBtn = $('btnComments');
    if (!drawer || !openBtn) return;

    pageScope = opts.scope;
    course = opts.course || null;
    threads = cmLoadThreads();

    // On an object page the useful default is that LO's own comments.
    scopeFilter = pageScope.type === 'object' ? 'current' : 'all';

    els = {
      drawer, threads: $('cmThreads'), empty: $('cmEmpty'),
      tabs: $('cmFilterTabs'), scope: $('cmScope'), scopeSep: $('cmScopeSep'),
      scopeCurrent: $('cmScopeCurrent'), scopeCurrentLabel: $('cmScopeCurrentLabel'),
      unreadAll: $('cmScopeUnreadAll'), unreadCurrent: $('cmScopeUnreadCurrent'),
      headCount: $('cmHeadCount')
    };

    /* Turn off the drawer's built-in collapse button — the header carries its
       own close control. MUST be a property: `closable="false"` as an
       attribute is a non-empty string, which is truthy, so the button stays
       rendered. */
    customElements.whenDefined('vwc-drawer').then(() => {
      drawer.closable = false;
      drawer.restoreFocusSelector = '#btnComments';
    });

    /* ── Publish the global header's height ─────────────────────────
       The header is hoisted OUT of the drawer so it stays clickable while
       the panel is open (it carries the Comments toggle itself). That makes
       it the drawer's previous sibling rather than one of the shell's flex
       rows, so the drawer has to be told how much vertical space the header
       takes: `--vwc-header-h` drives both the drawer's height and the top of
       the panel (see comments-panel.css).

       Measured rather than hard-coded because the two pages' headers differ
       (62px on the overview; 69px on the object manager, which adds a 5px
       accent strip above the row) and either can reflow to a taller row on a
       narrow viewport. */
    const header = document.querySelector('.ov-topbar, .topbar');
    function syncHeaderHeight() {
      if (!header) return;
      // bottom, not height, so anything above the header counts too.
      const h = Math.round(header.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty('--vwc-header-h', h + 'px');
    }
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);

    openBtn.addEventListener('click', () => {
      syncHeaderHeight();
      drawer.open = true;
      render();
    });
    $('cmClose').addEventListener('click', () => { drawer.open = false; });
    $('cmSend').addEventListener('click', compose);

    els.scope.addEventListener('click', (e) => {
      const btn = e.target.closest('.cm-scope-btn');
      if (!btn) return;
      scopeFilter = btn.dataset.scope;
      render();
    });

    els.tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.cm-filter-tab');
      if (!tab) return;
      stateFilter = tab.dataset.state;
      render();
    });

    /* One delegated handler for the whole list. Order matters: the specific
       controls sit INSIDE the header/body, so they are tested before the
       header's toggle, which would otherwise swallow them. */
    /* One delegated handler for the whole list. Order matters: every control
       below sits INSIDE the thread, and the collapsed header is itself a
       click target, so the specific actions are matched first and each
       returns — otherwise a click on Save or a reaction would bubble up and
       toggle the thread shut under the user. */
    els.threads.addEventListener('click', (e) => {
      const goto = e.target.closest('[data-goto]');
      if (goto) { goToThread(goto.dataset.goto); return; }

      // --- reactions + editing (both keyed "<threadId>:<index>") ---
      const rxMenu = e.target.closest('[data-rx-menu]');
      if (rxMenu) { toggleReactionMenu(rxMenu.dataset.rxMenu); return; }
      const rx = e.target.closest('[data-react]');
      if (rx) { toggleReaction(rx.dataset.react, rx.dataset.emoji); return; }
      const editSave = e.target.closest('[data-edit-save]');
      if (editSave) { saveEdit(editSave.dataset.editSave); return; }
      const editCancel = e.target.closest('[data-edit-cancel]');
      if (editCancel) { cancelEdit(); return; }
      const edit = e.target.closest('[data-edit]');
      if (edit) { startEdit(edit.dataset.edit); return; }

      const send = e.target.closest('[data-send]');
      if (send) { reply(send.dataset.send); return; }
      const res = e.target.closest('[data-resolve]');
      if (res) { toggleResolve(res.dataset.resolve); return; }

      // Any other click in the list dismisses an open reaction menu, the
      // same way clicking away from a popover closes it.
      closeReactionMenu(true);

      // The editor's own textarea must not toggle the thread either.
      if (e.target.closest('[data-editor], [data-reply]')) return;

      const head = e.target.closest('[data-toggle]');
      if (head) toggleThread(head.dataset.toggle);
    });

    els.threads.addEventListener('keydown', (e) => {
      // Escape closes an open reaction menu before anything else claims it,
      // and returns focus to the trigger that opened it.
      if (e.key === 'Escape' && openMenuPath) {
        e.preventDefault();
        const path = openMenuPath;
        closeReactionMenu(true);
        const trig = document.querySelector('[data-rx-menu="' + path + '"]');
        if (trig) trig.focus();
        return;
      }
      // Enter sends from a reply field rather than toggling the thread.
      // Shift+Enter falls through to insert a newline — the field is now a
      // textarea, so a multi-line reply is possible.
      if (e.key === 'Enter' && !e.shiftKey && e.target.matches('[data-reply]')) {
        e.preventDefault(); reply(e.target.dataset.reply); return;
      }
      // In the inline editor: Escape abandons, Cmd/Ctrl+Enter saves.
      if (e.target.matches('[data-editor]')) {
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault(); saveEdit(e.target.dataset.editor); return;
        }
        return;                      // otherwise type freely, incl. newlines
      }
      // The header is a div with role="button", so Enter/Space need wiring.
      const head = e.target.closest('[data-toggle]');
      if (head && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault(); toggleThread(head.dataset.toggle);
      }
    });

    /* A click anywhere ELSE in the panel — the filter tabs, the scope bar,
       the page-level composer — also dismisses an open reaction menu. The
       list's own handler covers clicks inside a thread; this covers the rest
       of the drawer, so the menu never lingers after attention moves on.
       Bound on the drawer rather than the document because an overlay drawer
       makes the page behind inert anyway. */
    drawer.addEventListener('click', (e) => {
      if (!openMenuPath) return;
      if (e.target.closest('[data-rx-menu], .cm-rx-menu')) return;  // handled
      if (els.threads.contains(e.target)) return;                   // ditto
      closeReactionMenu(true);
    });

    render();

    /* Deep link: ?thread=<id> opens the panel with that thread expanded, so a
       "Go to" jump lands on the right screen AND the right thread. */
    const wanted = new URLSearchParams(location.search).get('thread');
    if (wanted && threads.some(t => t.id === wanted)) {
      const t = threads.find(x => x.id === wanted);
      // Make sure the filters cannot hide the thread we were sent to.
      if (!inScope(t)) scopeFilter = 'all';
      if (stateFilter !== 'all') stateFilter = 'all';
      expanded.add(wanted);
      if (t.unread) { t.unread = false; cmSaveThreads(threads); }
      drawer.open = true;
      render();
      const el = els.threads.querySelector('[data-thread="' + wanted + '"]');
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }

  return { init: init };
})();
