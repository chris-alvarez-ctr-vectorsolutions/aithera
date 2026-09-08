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

  function replyHtml(c) {
    return '' +
      '<div class="cm-reply-item">' +
        '<span class="cm-reply-avatar" style="background:' + avatarColor(c.author) + '">' +
          esc(cmInitials(c.author)) + '</span>' +
        '<span class="cm-reply-body">' +
          '<span class="cm-reply-author">' + esc(c.author) + '</span>' +
          '<span class="cm-reply-time">' + esc(cmRelTime(c.created)) + '</span>' +
          '<span class="cm-reply-text">' + esc(c.text) + '</span>' +
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
          '<div class="cm-bubble' + (t.resolved ? ' is-resolved' : '') + '">' +
            esc(first.text) + '</div>' +

          (replies.length
            ? '<div class="cm-replies">' + replies.map(replyHtml).join('') + '</div>'
            : '') +

          // Reply field, send and resolve share ONE row — resolve used to take
          // a whole row to itself below this one.
          '<div class="cm-reply-row">' +
            '<input class="cm-reply-input" type="text" placeholder="Reply…" ' +
                   'data-reply="' + esc(t.id) + '" />' +
            '<button class="cm-reply-send" type="button" data-send="' + esc(t.id) + '" ' +
                    'aria-label="Send reply"><i class="fa-solid fa-paper-plane"></i></button>' +
            '<button class="cm-resolve-btn" type="button" data-resolve="' + esc(t.id) + '" ' +
                    'title="' + (t.resolved ? 'Reopen thread' : 'Resolve thread') + '" ' +
                    'aria-label="' + (t.resolved ? 'Reopen thread' : 'Resolve thread') + '">' +
              '<i class="fa-regular fa-circle-check"></i>' +
            '</button>' +
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
    t.comments.push({ author: 'Dev Llama', created: new Date().toISOString(), text });
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

  function compose() {
    const field = $('cmInput');
    const text = (field.value || '').trim();
    if (!text) return;
    const t = {
      id: 'n' + Date.now(),
      scope: pageScope.type,
      created: new Date().toISOString(),
      resolved: false, unread: false,
      comments: [{ author: 'Dev Llama', created: new Date().toISOString(), text }]
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

    /* The panel spans the full viewport height by design: the page shell is
       inside this drawer's `content` slot, so the drawer owns the whole
       viewport and the panel runs header-to-floor beside the inert page.
       Nothing to measure — the offset is zeroed in comments-panel.css. */
    openBtn.addEventListener('click', () => { drawer.open = true; render(); });
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
    els.threads.addEventListener('click', (e) => {
      const goto = e.target.closest('[data-goto]');
      if (goto) { goToThread(goto.dataset.goto); return; }
      const send = e.target.closest('[data-send]');
      if (send) { reply(send.dataset.send); return; }
      const res = e.target.closest('[data-resolve]');
      if (res) { toggleResolve(res.dataset.resolve); return; }
      const head = e.target.closest('[data-toggle]');
      if (head) toggleThread(head.dataset.toggle);
    });

    els.threads.addEventListener('keydown', (e) => {
      // Enter sends from a reply field rather than toggling the thread.
      if (e.key === 'Enter' && e.target.matches('[data-reply]')) {
        e.preventDefault(); reply(e.target.dataset.reply); return;
      }
      // The header is a div with role="button", so Enter/Space need wiring.
      const head = e.target.closest('[data-toggle]');
      if (head && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault(); toggleThread(head.dataset.toggle);
      }
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
