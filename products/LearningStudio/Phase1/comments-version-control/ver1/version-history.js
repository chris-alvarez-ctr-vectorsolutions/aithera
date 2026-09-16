/* ============================================================
   VERSION HISTORY — shared modal

   Extracted from index.html so BOTH pages can open it:
     - index.html            (course lookup -> row kebab -> Version history)
     - course-overview.html  (Course Details tab -> Publishing container)

   Pairs with version-history.css, and reads/writes the shared publish
   history in version-data.js — so a revert here and a publish there act on
   one store.

   USAGE:  openVersionHistory(sku, title)

   The markup is injected by this file, so a host page only needs to load
   version-data.js, version-history.css and this file. Everything is kept
   inside an IIFE and only the opener is exported: both host pages define
   their own `esc` and `say`, which would otherwise collide with these.

   Fires `vh:changed` on document after a revert, so a host page can
   re-render anything derived from the history.
   ============================================================ */

(function () {
'use strict';

/* Markup lives here rather than in each page, so the two cannot drift. */
const VH_MARKUP = "  <div class=\"modal-overlay\" id=\"vhModal\" role=\"dialog\" aria-modal=\"true\"\n       aria-labelledby=\"vhTitle\">\n    <div class=\"modal vh-modal\">\n      <div class=\"modal-head vh-head\">\n        <div class=\"vh-head-text\">\n          <!-- Title tracks the current view: \"Version History\" for the list,\n               \"Revert to vN?\" for the confirmation, so the dialog always says\n               what it is asking. -->\n          <h3 id=\"vhTitle\">Version History</h3>\n          <!-- Which course this history belongs to: the modal is opened from\n               a row in a fifty-row table, so naming the course is what makes\n               it verifiable that you opened the right one. It stays visible\n               on the confirm step too \u2014 you are still acting on this course. -->\n          <p class=\"vh-sub\"><span id=\"vhCourse\"></span><span class=\"vh-sku\" id=\"vhSku\"></span></p>\n        </div>\n        <!-- `theme=\"icon\"` renders the borderless icon button; the glyph is\n             Font Awesome, as everywhere else in this prototype. -->\n        <vaadin-button theme=\"icon\" id=\"vhClose\" aria-label=\"Close version history\">\n          <i class=\"fa-solid fa-xmark\"></i>\n        </vaadin-button>\n      </div>\n\n      <div class=\"modal-body vh-body\" id=\"vhListView\">\n        <ol class=\"vh-timeline\" id=\"vhTimeline\"></ol>\n\n        <!-- Shown only when a course has never been published. -->\n        <p class=\"vh-empty is-hidden\" id=\"vhEmpty\">\n          <i class=\"fa-regular fa-clock-rotate-left\"></i>\n          No publish events yet. A course's history starts at its first publish.\n        </p>\n      </div>\n\n      <div class=\"modal-foot vh-foot\" id=\"vhListFoot\">\n        <vaadin-button theme=\"secondary\" id=\"vhDone\">Close</vaadin-button>\n      </div>\n\n      <!-- ===== Version detail \u2014 a STEP inside this dialog =====\n           Same reasoning as the revert confirmation below: the panel\n           swaps its body rather than stacking a second overlay, so there\n           is one scrim and one Escape however deep you are.\n\n           The breadcrumb is what makes that swap legible \u2014 without a way\n           back that names where it goes, a body that changes under you\n           reads as the dialog having been replaced. -->\n      <div class=\"modal-body vh-detail-view is-hidden\" id=\"vhDetailView\">\n        <button class=\"vh-crumb\" id=\"vhDetailBack\" type=\"button\">\n          <i class=\"fa-solid fa-chevron-left\"></i> Back to all history\n        </button>\n\n        <!-- Badges only: the dialog header already names the version, so\n             repeating it here was the same word twice in two lines. -->\n        <div class=\"vh-detail-head\" id=\"vhDetailHead\">\n          <span class=\"vh-detail-badges\" id=\"vhDetailBadges\"></span>\n        </div>\n\n        <dl class=\"vh-detail-facts\" id=\"vhDetailFacts\"></dl>\n\n        <div class=\"vh-detail-section\">\n          <h4 class=\"vh-detail-label\">Publish note</h4>\n          <blockquote class=\"vh-note\" id=\"vhDetailNote\"></blockquote>\n        </div>\n\n        <div class=\"vh-detail-section\">\n          <h4 class=\"vh-detail-label\">Contents at this version</h4>\n          <ul class=\"vh-detail-list\" id=\"vhDetailContents\"></ul>\n        </div>\n      </div>\n\n      <div class=\"modal-foot vh-detail-foot is-hidden\" id=\"vhDetailFoot\">\n        <vaadin-button theme=\"secondary\" id=\"vhDetailPreview\">\n          <i class=\"fa-solid fa-play\"></i> Preview\n        </vaadin-button>\n        <vaadin-button theme=\"error secondary\" id=\"vhDetailRevert\">\n          <i class=\"fa-regular fa-clock-rotate-left\"></i> Revert\n        </vaadin-button>\n      </div>\n\n      <!-- ===== Revert confirmation \u2014 a STEP inside this dialog =====\n           Not a second modal. Stacking one overlay on another gave two\n           scrims and two dialogs, which reads as a stack to get out of\n           rather than one decision to make, and doubles the ways to dismiss\n           (two backdrops, two Escapes, two Cancels).\n\n           So the panel swaps to this view and back: one dialog, one scrim,\n           one Escape. The header changes with it, and Back returns to the\n           list exactly where it was. -->\n      <div class=\"modal-body vh-confirm-view is-hidden\" id=\"vhConfirmView\">\n        <div class=\"vh-warn-icon\"><i class=\"fa-solid fa-clock-rotate-left\"></i></div>\n        <p class=\"vh-confirm-lead\">\n          This publishes <b id=\"vhRevertVer2\"></b>'s content as a new version and\n          makes it what learners see.\n        </p>\n        <blockquote class=\"vh-confirm-note\" id=\"vhRevertNote\"></blockquote>\n        <!-- Says plainly that history is preserved: the fear with a revert is\n             that everything after the target is destroyed. -->\n        <p class=\"vh-confirm-keep\">\n          <i class=\"fa-regular fa-circle-check\"></i>\n          Nothing is deleted \u2014 every version between stays in this history.\n        </p>\n      </div>\n\n      <div class=\"modal-foot vh-confirm-foot is-hidden\" id=\"vhConfirmFoot\">\n        <vaadin-button theme=\"secondary\" id=\"vhRevertCancel\">Back</vaadin-button>\n        <!-- `error secondary` is the design system's own red-secondary\n             treatment; it replaces a hand-built .btn-danger-secondary class\n             with a hand-picked tint and focus ring. -->\n        <vaadin-button theme=\"error secondary\" id=\"vhRevertConfirm\">Revert and publish</vaadin-button>\n      </div>\n    </div>\n  </div>";

let vhListView = null;

function init() {
  if (document.getElementById('vhModal')) return;      // already injected
  const host = document.createElement('div');
  host.innerHTML = VH_MARKUP;
  /* Appended to <body>: the comments drawer marks its `content` slot inert
     while open, and the modal must stay usable. */
  while (host.firstElementChild) document.body.appendChild(host.firstElementChild);
  wire();
}

/* The lookup page shows a toast; elsewhere this is a no-op rather than a
   hard dependency on that page's helper. */
function vhSay(message) {
  if (typeof window.say === 'function') { window.say(message); return; }
  console.log('[version-history] ' + message);
}

/* ============================================================
   VERSION HISTORY

   A timeline of publish events for one course. Opened from the row kebab.

   Each row leads with its note, then the date, author and version. Three
   actions per event:

     View details — swaps the dialog to that version's own detail view,
               with a breadcrumb back to the list. Navigation happens
               INSIDE the dialog rather than by stacking a second overlay,
               so there is one scrim and one Escape at any depth.
     Preview  — opens that version in the learner-facing media player.
               STUBBED: the CTA is real so the affordance can be reviewed,
               but the player is not part of this prototype.
     Revert   — republishes that version's content as the live one, behind
               a confirmation.
   ============================================================ */

let vhModal = null;         // set once the markup is injected
let vhSku = null;           // course whose history is open
let vhPendingRevert = null; // version id awaiting confirmation

function openVersionHistory(sku, title) {
  vhSku = sku;
  /* Title is passed in rather than looked up: the lookup page resolves it
     from its COURSES array, the Course Overview from COURSE.title, and this
     module should not know about either. */
  document.getElementById('vhCourse').textContent = title || 'Course';
  document.getElementById('vhSku').textContent = sku;
  renderVersionHistory();
  vhDetailId = null;               // always open on the list view
  closeRevert();
  vhModal.classList.add('open');
  document.getElementById('vhClose').focus();
}

function closeVersionHistory() {
  vhModal.classList.remove('open');
  vhSku = null;
}

function renderVersionHistory() {
  const events = vhLoad(vhSku);
  const list = document.getElementById('vhTimeline');
  /* Exactly one of these shows: the start marker terminates a populated
     timeline, the empty state stands in for a course that has never been
     published. Toggled by class because both set `display`, which overrides
     the `hidden` attribute. */
  const hasEvents = events.length !== 0;
  document.getElementById('vhEmpty').classList.toggle('is-hidden', hasEvents);

  list.innerHTML = events.map(e => {
    const w = vhWhen(e.at);
    return '' +
      '<li class="vh-item' + (e.current ? ' is-current' : '') + '">' +
        // The timeline spine: a dot per event, filled for the live version.
        '<span class="vh-dot" aria-hidden="true"></span>' +

        '<div class="vh-card">' +
          '<div class="vh-meta">' +
            '<span class="vh-ver">' + esc(e.id) + '</span>' +
            /* Lumo badge styles, applied via `theme` on a <span> — they
               load with any VWC component and are the design system's own
               badge treatment, replacing two hand-rolled pill classes. */
            (e.current ? '<span theme="badge primary pill">Current</span>' : '') +
            (e.revertOf
              ? '<span theme="badge contrast pill">Reverted from ' + esc(e.revertOf) + '</span>'
              : '') +
            /* One "Published" field carrying WHEN and WHO together, rather
               than a labelled date and a labelled name at opposite ends of
               the row. They describe the same act, so splitting them meant
               two labels competing for the same idea.

               "Published" also disambiguates the date, which is the point:
               a course has a created date and a submitted-to-QA date too,
               and this one is when the version went live. The label is muted
               while the date and name carry the colour, so the row still
               scans by its values rather than its labels. */
            '<span class="vh-pub" title="Published ' + esc(w.date + ' at ' + w.time) +
                   ' by ' + esc(e.author) + '">' +
              '<span class="vh-pub-label">Published</span> ' +
              '<span class="vh-pub-date">' + esc(w.date) + '</span>' +
              '<span class="vh-pub-label"> by </span>' +
              '<span class="vh-pub-who">' + esc(e.author) + '</span>' +
            '</span>' +
          '</div>' +

          /* The note, or an explicit absence of one. Saying "No publish note"
             beats leaving a blank: it tells you the note is missing rather
             than that the row failed to render, and it makes the value of
             writing one obvious on the rows that have it. */
          (e.note
            ? '<p class="vh-note">' + esc(e.note) + '</p>'
            : '<p class="vh-note is-none">No publish note</p>') +

          /* Row actions use `secondary`, the documented default for most
             actions. `tertiary` was tried first — it is the variant for
             repeated actions in constrained spaces — but it renders as an
             underlined link, which in a list of cards read as body copy
             rather than a control.

             "View details" swaps the dialog to the detail view for this
             version; "Preview" opens it in the learner-facing player
             (stubbed). Revert keeps the `error` colour modifier and is
             offered only on versions that are not already live. */
          '<div class="vh-actions">' +
            '<vaadin-button theme="secondary" data-vh-detail="' + esc(e.id) + '">' +
              '<i class="fa-regular fa-file-lines"></i> View details' +
            '</vaadin-button>' +
            '<vaadin-button theme="secondary" data-vh-preview="' + esc(e.id) + '">' +
              '<i class="fa-solid fa-play"></i> Preview' +
            '</vaadin-button>' +
            // No point offering to revert to what is already live.
            (e.current
              ? ''
              : '<vaadin-button theme="error secondary" data-vh-revert="' + esc(e.id) + '">' +
                  '<i class="fa-regular fa-clock-rotate-left"></i> Revert' +
                '</vaadin-button>') +
          '</div>' +
        '</div>' +
      '</li>';
  }).join('') +

  /* Start-of-timeline marker, as the list's own final row so it inherits
     .vh-item's indent and lines up with the cards by construction — as a
     sibling <p> outside the <ol> it sat 28px to their left.

     It goes at the BOTTOM because the list runs newest-first, and it closes
     the spine off: on a course with a long history, reaching the first
     publish would otherwise be indistinguishable from the list being cut
     short at the bottom of the modal. */
  (hasEvents
    ? '<li class="vh-item vh-start">' +
        '<span class="vh-dot is-start" aria-hidden="true"></span>' +
        '<span class="vh-start-text">' +
          'Beginning of version history — this course\'s first publish.' +
        '</span>' +
      '</li>'
    : '');
}

/* Minimal escape — the notes and author names are author-entered text. */
function esc(v) {
  return String(v).replace(/[&<>"']/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ---- View switching ---- */

/* The dialog holds THREE views — the list, one version's detail, and the
   revert confirmation — and swaps between them in place. One modal, one
   scrim, one Escape however deep you are; see the markup for why this is
   not a stack of overlays.

   Each view owns a body and a footer, so they are toggled in pairs. */
const VH_VIEWS = {
  list:    ['vhListView', 'vhListFoot'],
  detail:  ['vhDetailView', 'vhDetailFoot'],
  confirm: ['vhConfirmView', 'vhConfirmFoot']
};

function vhShowView(which) {
  Object.keys(VH_VIEWS).forEach(name => {
    const hidden = name !== which;
    VH_VIEWS[name].forEach(id =>
      document.getElementById(id).classList.toggle('is-hidden', hidden));
  });

  // Lets the header emphasise the course identity while confirming.
  document.getElementById('vhModal').classList.toggle('is-confirming', which === 'confirm');

  /* Every view but the list starts at the top and is short enough not to
     scroll, so drop the sticky-header elevation on each swap rather than
     leaving a stale shadow behind. */
  if (which !== 'list') document.getElementById('vhModal').classList.remove('is-scrolled');
}

/* ---- Version detail ----
   A version's own page inside the dialog, reached from its row. The
   breadcrumb back to the list is the first thing in it: a body that
   changes under you needs a named way back, or it reads as the dialog
   having been replaced rather than navigated. */
let vhDetailId = null;

function openDetail(id) {
  const all = vhLoad(vhSku);
  const ev = all.find(x => x.id === id);
  if (!ev) return;

  vhDetailId = id;
  const w = vhWhen(ev.at);

  document.getElementById('vhTitle').textContent = 'Version ' + ev.id;
  const badges = 
    (ev.current ? '<span theme="badge primary pill">Current</span>' : '') +
    (ev.revertOf
      ? '<span theme="badge contrast pill">Reverted from ' + esc(ev.revertOf) + '</span>'
      : '');
  document.getElementById('vhDetailBadges').innerHTML = badges;
  // No badges on an ordinary superseded version — don't leave a gap.
  document.getElementById('vhDetailHead').hidden = !badges;

  /* The facts a version is identified by. Same vocabulary as the row it
     was opened from, so moving between them needs no re-reading. */
  const position = all.length - all.indexOf(ev);
  document.getElementById('vhDetailFacts').innerHTML =
    '<div class="vh-fact"><dt>Published</dt><dd>' + esc(w.date) + '</dd></div>' +
    '<div class="vh-fact"><dt>Time</dt><dd>' + esc(w.time) + '</dd></div>' +
    '<div class="vh-fact"><dt>Published by</dt><dd>' + esc(ev.author) + '</dd></div>' +
    '<div class="vh-fact"><dt>Status</dt><dd>' +
      (ev.current ? 'Live — what learners see now' : 'Superseded') +
    '</dd></div>' +
    '<div class="vh-fact"><dt>Version</dt><dd>' + position + ' of ' + all.length + '</dd></div>';

  const note = document.getElementById('vhDetailNote');
  note.textContent = ev.note || 'No publish note';
  note.classList.toggle('is-none', !ev.note);

  /* Course structure as it stood. Static in this prototype — the history
     stores publish events, not content snapshots — so it is rendered from
     the current COURSE and labelled as indicative rather than invented
     per version. */
  const course = (typeof COURSE !== 'undefined') ? COURSE : null;
  document.getElementById('vhDetailContents').innerHTML = course
    ? course.sections.map(sec =>
        '<li><span class="vh-detail-sec">' + esc(sec.name) + '</span>' +
        '<span class="vh-detail-cnt">' + sec.objects.filter(o => !o.hidden).length +
        ' learning objects</span></li>').join('')
    : '<li class="vh-detail-empty">Course outline unavailable on this page.</li>';

  // Revert is meaningless on the version that is already live.
  document.getElementById('vhDetailRevert').hidden = !!ev.current;

  vhShowView('detail');
  document.getElementById('vhDetailBack').focus();
}

function closeDetail() {
  vhDetailId = null;
  document.getElementById('vhTitle').textContent = 'Version History';
  vhShowView('list');
}

/* Stub: the learner-facing player is not part of this prototype. The CTA
   is real so the affordance can be reviewed; it reports instead of
   navigating, rather than being silently inert. */
function previewVersion(id) {
  vhSay('Preview ' + id + ' in the media player — not built in this prototype');
}

function askRevert(id) {
  const ev = vhLoad(vhSku).find(x => x.id === id);
  if (!ev) return;
  vhPendingRevert = id;
  document.getElementById('vhTitle').textContent = 'Revert to ' + id + '?';
  document.getElementById('vhRevertVer2').textContent = id;
  const note = document.getElementById('vhRevertNote');
  note.textContent = ev.note || 'No publish note';
  note.classList.toggle('is-none', !ev.note);
  vhShowView('confirm');
  document.getElementById('vhRevertConfirm').focus();
}

/* Back to wherever the revert was launched from — the list, or the
   detail view for that version. Returning always to the list would
   silently throw away the place the user was in. */
function closeRevert() {
  vhPendingRevert = null;
  if (vhDetailId) { openDetail(vhDetailId); return; }
  document.getElementById('vhTitle').textContent = 'Version History';
  vhShowView('list');
}


function wire() {
  vhModal = document.getElementById('vhModal');
  vhListView = document.getElementById('vhListView');

/* Lift the sticky header once the timeline has scrolled beneath it, so the
   shadow only appears when there is something to separate from. */
vhListView.addEventListener('scroll', () => {
  vhModal.classList.toggle('is-scrolled', vhListView.scrollTop > 2);
});

document.getElementById('vhTimeline').addEventListener('click', (e) => {
  const detail = e.target.closest('[data-vh-detail]');
  if (detail) { openDetail(detail.dataset.vhDetail); return; }

  const preview = e.target.closest('[data-vh-preview]');
  if (preview) { previewVersion(preview.dataset.vhPreview); return; }

  const revert = e.target.closest('[data-vh-revert]');
  if (revert) { askRevert(revert.dataset.vhRevert); return; }
});

/* Detail view controls. */
document.getElementById('vhDetailBack').addEventListener('click', closeDetail);
document.getElementById('vhDetailPreview').addEventListener('click', () => {
  if (vhDetailId) previewVersion(vhDetailId);
});
document.getElementById('vhDetailRevert').addEventListener('click', () => {
  if (vhDetailId) askRevert(vhDetailId);
});

document.getElementById('vhClose').addEventListener('click', closeVersionHistory);
document.getElementById('vhDone').addEventListener('click', closeVersionHistory);
vhModal.addEventListener('click', (e) => {
  if (e.target !== vhModal) return;                  // clicked inside
  /* From a sub-view the backdrop steps BACK one level rather than
     closing, so a stray click never silently abandons a revert you were
     mid-way through, or a detail view you were reading. */
  if (vhPendingRevert) { closeRevert(); return; }
  if (vhDetailId) { closeDetail(); return; }
  closeVersionHistory();
});

document.getElementById('vhRevertCancel').addEventListener('click', closeRevert);
document.getElementById('vhRevertConfirm').addEventListener('click', () => {
  const id = vhPendingRevert;
  const created = vhRevert(vhSku, id);
  /* Land on the LIST after a successful revert, even if the confirmation
     came from a detail view: a new version now exists and the timeline is
     what shows it. Clear the detail first so closeRevert doesn't return
     to the version that was just superseded. */
  vhDetailId = null;
  closeRevert();
  renderVersionHistory();          // the new event appears at the top
  if (created) vhSay('Reverted to ' + id + ' — published as ' + created.id);
  /* Let the host page re-render anything derived from the history — the
     Course Overview's publish container shows the live version. */
  document.dispatchEvent(new CustomEvent('vh:changed', { detail: { sku: vhSku } }));
});

/* Escape walks BACK one level at a time — confirmation to detail-or-list,
   detail to list, list to closed — so it never skips past a pending
   revert or an open version and shuts the whole dialog. */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !vhModal.classList.contains('open')) return;
  if (vhPendingRevert) { closeRevert(); return; }
  if (vhDetailId) { closeDetail(); return; }
  closeVersionHistory();
});

}   /* end wire() */

/* Exported so host pages can open the dialog. */
window.openVersionHistory = openVersionHistory;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
