/* ============================================================
   COMMENT THREADS — shared model

   Loaded by BOTH course-overview.html and object-manager.html so the two
   pages can never disagree about what threads exist, what they are attached
   to, or which are resolved. Everything the panel renders is derived from
   THREADS; nothing is hand-typed in either page's markup.

   ---- Scope ----
   Every thread carries a `scope` that says what it is attached to:

     { scope: 'course' }                     -> the course as a whole
     { scope: 'object', objectId: 's03-o01' } -> one learning object

   This is what drives BOTH the "tied to" label in the all-comments list and
   the deep link that opens when a row is clicked:

     course  -> course-overview.html
     object  -> object-manager.html?object=<objectId>&thread=<threadId>

   Scene-level comments are deliberately NOT modelled yet — threads attach to
   a whole learning object. Adding them later means a third scope plus a
   `sceneId`, and the deep link gaining a scene fragment; nothing else here
   needs to change.

   ---- Persistence ----
   Resolves and replies are kept in sessionStorage so a walkthrough holds
   together across the overview -> object-manager -> back navigation. It
   resets on a new tab, which is the behaviour we want for a demo: a reload
   mid-review keeps your place, a fresh session starts clean.
   ============================================================ */

/* Minutes-ago helper, so seeded timestamps stay relative to when the demo is
   opened rather than drifting into "3 weeks ago" as the file ages. */
function cmMinsAgo(m) {
  return new Date(Date.now() - m * 60000).toISOString();
}

/* Seed data. `created` drives chronological order; `resolved` sinks a thread
   to the bottom of the list. Ordered here roughly newest-first for
   readability, but the panel sorts explicitly — this order is not load
   bearing. */
const THREAD_SEED = [
  {
    id: 't1',
    scope: 'course',
    created: cmMinsAgo(12),
    resolved: false, unread: true,
    comments: [
      { author: 'Dev Llama', created: cmMinsAgo(12),
        text: 'test comment' }
    ]
  },
  {
    id: 't2',
    scope: 'object', objectId: 's03-o01',
    created: cmMinsAgo(48),
    resolved: false, unread: true,
    comments: [
      { author: 'Priya Raman', created: cmMinsAgo(48),
        text: 'The program requirements intro runs long before it says anything concrete. Can we tighten the first two scenes?',
        /* `reactions` maps an emoji to the people who picked it — not a bare
           count — so the panel can tell whether YOU already reacted (to
           toggle it off) and can name the reactors on hover. */
        reactions: { '\u{1F44D}': ['Marcus Webb', 'Dev Llama'] } },
      { author: 'Marcus Webb', created: cmMinsAgo(35),
        text: 'Agreed. I can cut the second scene entirely and fold the one useful line into scene 1.',
        reactions: { '\u2705': ['Priya Raman'] } }
    ]
  },
  {
    id: 't3',
    scope: 'object', objectId: 's03-o03',
    created: cmMinsAgo(60 * 3),
    resolved: false, unread: false,
    comments: [
      { author: 'Dana Cole', created: cmMinsAgo(60 * 3),
        text: 'Lockout Hardware still shows the old padlock photography. Needs the updated hardware set before this ships.',
        /* Set when a comment has been changed after posting; the panel shows
           an "(edited)" marker beside the timestamp. */
        editedAt: cmMinsAgo(60 * 2) }
    ]
  },
  {
    id: 't4',
    scope: 'object', objectId: 's02-o02',
    created: cmMinsAgo(60 * 7),
    resolved: false, unread: false,
    comments: [
      { author: 'Sofia Nunez', created: cmMinsAgo(60 * 7),
        text: 'Is "unexpected energization" the phrasing legal signed off on? I remember a change request here.' }
    ]
  },
  {
    id: 't5',
    scope: 'course',
    created: cmMinsAgo(60 * 26),
    resolved: true,
    comments: [
      { author: 'Marcus Webb', created: cmMinsAgo(60 * 26),
        text: 'Course SKU on the overview did not match the one in the catalog.' },
      { author: 'Priya Raman', created: cmMinsAgo(60 * 25),
        text: 'Fixed — catalog was the stale one. Resolving.' }
    ]
  },
  {
    id: 't6',
    scope: 'object', objectId: 's05-o02',
    created: cmMinsAgo(60 * 40),
    resolved: true,
    comments: [
      { author: 'Dana Cole', created: cmMinsAgo(60 * 40),
        text: 'Summary repeats the same three bullets as the section intro.' },
      { author: 'Dev Llama', created: cmMinsAgo(60 * 38),
        text: 'Rewritten to lead with the on-the-job application instead.' }
    ]
  }
];

/* ---- Persistence -------------------------------------------------
   Only the mutable parts are stored, keyed by thread id, rather than a full
   copy of the seed. That way editing THREAD_SEED above still shows up in a
   tab that already has stored state, instead of being masked by a stale
   snapshot.

   Four things mutate: `resolved`, comments ADDED this session, and — on any
   comment, seeded or added — its `reactions` and an edit to its `text`.

   Reactions and edits are stored BY COMMENT INDEX in `edits`, because a
   seeded comment has no id to key on. Storing only `added` (as this did
   originally) meant a reaction or an edit applied to a SEEDED comment was
   dropped on reload — state visibly reverting part-way through a review
   walkthrough. Indexes are stable here: comments are only ever appended,
   never removed or reordered. */
/* Who "I" am in this prototype. Drives which comments show an Edit affordance
   (own comments only) and whose name is attached to a new reply or reaction.
   Declared once here because the panel needs it in four places. */
const CM_ME = 'Dev Llama';

/* The reaction vocabulary, offered from a menu behind a single smiley
   trigger (matching production) rather than an always-visible strip.

   Because the set no longer competes for room in the thread, it can be
   wider than the four one-tap choices it replaced — these cover the range
   of review responses: agree / disagree, celebrate, done, seen, thanks,
   needs-thought, blocked. Still a curated list rather than a full emoji
   keyboard: no search field to build, every choice is one tap, and the grid
   cannot overflow a 420px panel.

   Adding to this array is all it takes to extend the menu; the grid wraps. */
const CM_REACTIONS = [
  '\u{1F44D}',   // thumbs up      — agree
  '\u{1F44E}',   // thumbs down    — disagree
  '\u{1F389}',   // party popper   — celebrate
  '\u2705',      // check mark     — done
  '\u{1F440}',   // eyes           — seen / looking
  '\u{1F64F}',   // folded hands   — thanks
  '\u{1F914}',   // thinking face  — needs thought
  '\u{1F6A7}'    // construction   — blocked / in progress
];

const CM_STORE_KEY = 'ls-cvc-comment-threads';

function cmLoadThreads() {
  const threads = THREAD_SEED.map(t => ({
    ...t,
    comments: t.comments.map(c => ({ ...c }))
  }));

  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(CM_STORE_KEY)); }
  catch (e) { saved = null; }               // private mode / corrupt value
  if (!saved) return threads;

  threads.forEach(t => {
    const s = saved[t.id];
    if (!s) return;
    if (typeof s.resolved === 'boolean') t.resolved = s.resolved;
    if (Array.isArray(s.added)) t.comments.push(...s.added);
    // Applied AFTER `added`, so an edit or reaction on a comment posted this
    // session lands on the right index.
    if (s.edits) {
      Object.keys(s.edits).forEach(i => {
        const c = t.comments[Number(i)];
        if (!c) return;                       // seed shrank since it was saved
        const e = s.edits[i];
        if (typeof e.text === 'string') c.text = e.text;
        if (e.editedAt) c.editedAt = e.editedAt;
        if (e.reactions) c.reactions = e.reactions;
      });
    }
  });
  return threads;
}

function cmSaveThreads(threads) {
  try {
    const out = {};
    threads.forEach(t => {
      // Anything beyond the seed's comment count was added this session.
      const seed = THREAD_SEED.find(s => s.id === t.id);
      const seedCount = seed ? seed.comments.length : 0;
      const added = t.comments.slice(seedCount);

      /* Reactions and edits on ANY comment — seeded ones included, which is
         the case the original `added`-only store lost. A comment is recorded
         only when it actually differs from its seed, so the store stays small
         and an untouched thread writes nothing. */
      const edits = {};
      t.comments.forEach((c, i) => {
        const sc = seed && seed.comments[i];   // undefined for added comments
        const e = {};
        if (c.reactions && Object.keys(c.reactions).length) e.reactions = c.reactions;
        if (sc && c.text !== sc.text) { e.text = c.text; }
        if (c.editedAt && (!sc || c.editedAt !== sc.editedAt)) e.editedAt = c.editedAt;
        if (Object.keys(e).length) edits[i] = e;
      });

      const dirty = t.resolved !== (seed ? seed.resolved : false)
                 || added.length
                 || Object.keys(edits).length;
      if (dirty) {
        out[t.id] = { resolved: t.resolved, added, edits };
      }
    });
    sessionStorage.setItem(CM_STORE_KEY, JSON.stringify(out));
  } catch (e) { /* storage unavailable — the demo still works in-memory */ }
}

/* ---- Derived helpers --------------------------------------------- */

/* Sort for the list: unresolved first in chronological order (newest first),
   then every resolved thread beneath them, also newest first. */
function cmSortThreads(threads) {
  return threads.slice().sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return new Date(b.created) - new Date(a.created);
  });
}

/* What a thread is attached to, as a human label for the all-comments list.
   Needs COURSE to name the learning object, so it is passed in rather than
   assumed global — object-manager.html and course-overview.html both define
   COURSE, but this file loads before either is guaranteed to have run. */
function cmScopeLabel(thread, course) {
  if (thread.scope === 'course') return 'Course';
  if (!course) return 'Learning object';
  for (const section of course.sections) {
    const obj = section.objects.find(o => o.id === thread.objectId);
    if (obj) return obj.name;
  }
  return 'Learning object';
}

/* Where clicking a thread should take the reviewer. Course threads live on
   the overview; object threads open that LO in the object manager. The
   `thread` param lets the destination page open the panel on that thread. */
function cmThreadHref(thread) {
  if (thread.scope === 'course') {
    return 'course-overview.html?thread=' + encodeURIComponent(thread.id);
  }
  return 'object-manager.html?object=' + encodeURIComponent(thread.objectId) +
         '&thread=' + encodeURIComponent(thread.id);
}

/* "2h ago" / "3d ago". Kept short so it fits the thread rows. */
function cmRelTime(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.round(hrs / 24) + 'd ago';
}

/* "Dev Llama" -> "DL"; falls back to the first two characters for a
   single-word name so the avatar bubble is never blank. */
function cmInitials(name) {
  const parts = String(name).trim().split(/\s+/);
  return (parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : String(name).slice(0, 2)).toUpperCase();
}
