/* ============================================================
   WATCHERS — who gets notified about a course variant

   A variant has ONE owner (the Course/Variant Owner field on the Details
   tab) and any number of WATCHERS. The difference is only how you get there:
   the owner is assigned to the variant, a watcher opts themselves in. Both
   receive the same notifications — new comments, publishes, reverts.

   So "watching" is not a second notification system. It is the self-serve
   door into the one the owner is already behind, for the people who care
   about a variant without owning it: the SME who wrote the content, the
   compliance lead who signed it off, the manager whose team takes it.

   ---- Shape ----
     WATCH_SEED[sku] = {
       watching: <bool>,        // is the CURRENT user watching
       others:   [ '<name>' ]   // other people watching, for the count
     }

   `others` exists so the UI can say "You and 3 others" rather than just
   "Watching" — knowing someone else is already watching is what tells you
   whether your change will be seen.

   ---- Persistence ----
   sessionStorage, keyed per course, matching version-data.js and
   comments-data.js: a walkthrough holds together across lookup -> overview
   -> back to lookup, and a fresh tab starts from the seed.
   ============================================================ */

const WATCH_STORE_KEY = 'ls-watchers-v1';

/* The current user, matching the author name used by the comments panel and
   the publish flow so one person runs through the whole prototype. */
const WATCH_ME = 'Dev Llama';

/* Seeded so the feature has a real state to look at rather than an empty
   one. The LOTO course is the one wired into this workflow; the others give
   the lookup table a mix of watched and unwatched rows. */
const WATCH_SEED = {
  '#DEMO-LOTO-101':            { watching: false, others: ['Priya Raman', 'Marcus Webb', 'Dana Cole'] },
  '#AUTO-15912898-2026-08-28': { watching: true,  others: ['Sofia Nunez'] },
  '#Test-456':                 { watching: false, others: ['Marcus Webb'] }
};

function watchLoad(sku) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(WATCH_STORE_KEY)); }
  catch (e) { saved = null; }

  const stored = saved && saved[sku];
  if (stored) return { watching: !!stored.watching, others: (stored.others || []).slice() };

  const seed = WATCH_SEED[sku];
  return seed
    ? { watching: !!seed.watching, others: seed.others.slice() }
    : { watching: false, others: [] };
}

function watchSave(sku, state) {
  try {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(WATCH_STORE_KEY)) || {}; }
    catch (e) { saved = {}; }
    saved[sku] = state;
    sessionStorage.setItem(WATCH_STORE_KEY, JSON.stringify(saved));
  } catch (e) { /* storage unavailable — the demo still works in-memory */ }
}

function watchAnnounce(sku, state) {
  document.dispatchEvent(new CustomEvent('watch:changed', {
    detail: { sku: sku, watching: state.watching }
  }));
}

/* Flips the current user's watch state and returns the new one.

   Fires `watch:changed` on document so every surface showing this variant
   re-renders off one event: the lookup row, the kebab's own label, and the
   Details tab's watcher field all read the same store. */
function watchToggle(sku) {
  const state = watchLoad(sku);
  state.watching = !state.watching;
  watchSave(sku, state);
  watchAnnounce(sku, state);
  return state;
}

/* ---- Managing other people's watching ----
   Available to roles that can add watchers beyond themselves. The current
   user is stored as the `watching` flag rather than as a name in `others`,
   so these two helpers translate between the full list the UI shows and
   that split representation. */

/* Every watcher as a flat list of names, the current user included. */
function watchAll(sku) {
  const state = watchLoad(sku);
  return (state.watching ? [WATCH_ME] : []).concat(state.others);
}

/* Replaces the whole watcher list. Whether the current user is in `names`
   decides their own flag, so a manager removing themselves from the list
   stops them watching — one list, one meaning. */
function watchSetAll(sku, names) {
  const state = watchLoad(sku);
  state.watching = names.indexOf(WATCH_ME) !== -1;
  state.others = names.filter(n => n !== WATCH_ME);
  watchSave(sku, state);
  watchAnnounce(sku, state);
  return state;
}

/* Total number of people notified about this variant, the current user
   included. The owner is counted separately by the caller — they are
   assigned, not watching. */
function watchCount(sku) {
  const state = watchLoad(sku);
  return state.others.length + (state.watching ? 1 : 0);
}

/* "You and 3 others" / "3 people" / "No one yet" — the one phrase both
   surfaces use, so the count never reads two different ways. */
function watchLabel(sku) {
  const state = watchLoad(sku);
  const n = state.others.length;
  if (state.watching) {
    if (n === 0) return 'You are watching';
    return 'You and ' + n + (n === 1 ? ' other' : ' others');
  }
  if (n === 0) return 'No one is watching';
  return n + (n === 1 ? ' person' : ' people') + ' watching';
}
