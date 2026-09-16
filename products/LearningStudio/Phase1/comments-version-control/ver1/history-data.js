/* ============================================================
   EDIT HISTORY — shared model

   The editor-wide undo stack. Loaded by BOTH pages, so a change made in
   the Object Manager is in the same list as one made on the Course
   Overview — the point of the widget is that it spans the whole editor
   session, not one screen.

   ---- What an entry is ----
   One action that TRIGGERED A SAVE. Not keystrokes: adding an image to a
   scene, saving a transcript, updating audio, adding a learning object,
   reordering sections. The unit is "a thing the user did that persisted".

     {
       id:       'h12',
       at:       ISO timestamp,
       label:    'Transcript updated',      // the verb
       target:   'Scene 3',                 // what it happened to
       page:     'object-manager',          // where it happened
       objectId: 's03-o08',                 // for the "View" deep link
       group:    'Conveyor Belt Lockout/Tagout'   // location header
     }

   Deliberately NO before/after delta: the save model stores whole fields,
   not diffs, so a truthful "X changed to Y" is not available. Labels are
   verb + target instead, which is what the data can actually support.

   ---- The pointer, and why entries are not popped ----
   `pointer` is the index of the state the editor is currently at. Undo
   moves it back, redo moves it forward — nothing is deleted, which is
   what makes redo possible.

   The ONE destructive move is editing while rewound: everything ahead of
   the pointer is discarded, because that future no longer follows from
   the present. Standard editor undo behaviour.

       e1 - e2 - e3 - e4 - e5      pointer 4 (tip)
       undo x2                     pointer 2, e4/e5 kept (redoable)
       new edit                    e4/e5 dropped, new entry at 3

   ---- Scope ----
   Course DETAILS fields are deliberately NOT tracked. Those are covered
   by "Discard changes" on the Publishing card, which resets to the last
   publish event — a bigger, unbounded scope than this lookback window.
   Two mechanisms on the same fields would only confuse; see hxClear().

   ---- Persistence ----
   sessionStorage, keyed per course, matching comments-data.js and
   version-data.js. One editor session; a new tab starts from the seed.
   ============================================================ */

/* Ten tracked actions. Once the cap is reached the OLDEST entry drops off
   as a new one arrives, so the window always covers the ten most recent
   saves rather than the first ten of the session. */
const HX_CAP = 10;

const HX_STORE_KEY = 'ls-cvc-edit-history';

function hxMinutesAgo(m) {
  return new Date(Date.now() - m * 60000).toISOString();
}

/* Seeded so the widget opens with a realistic session already in it —
   and, importantly, one that SPANS PAGES: Object Manager scene edits,
   Course Overview structure changes, all in one list. That cross-page
   mixing is the thing the seed exists to demonstrate.

   Oldest first; the panel renders newest at the top. */
const HX_SEED = {
  '#DEMO-LOTO-101': [
    { label: 'Learning object added', target: 'Group Lockout',
      page: 'course-overview', group: 'Course Overview', at: hxMinutesAgo(74) },
    { label: 'Sections reordered', target: 'Hazardous Energy moved up',
      page: 'course-overview', group: 'Course Overview', at: hxMinutesAgo(68) },
    { label: 'Transcript updated', target: 'Scene 1',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(55) },
    { label: 'Media updated', target: 'Scene 1',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(52) },
    { label: 'Audio updated', target: 'Scene 1',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(50) },
    { label: 'Transcript updated', target: 'Scene 3',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(41) },
    { label: 'Learning object renamed', target: 'Lockout Release',
      page: 'course-overview', group: 'Course Overview', at: hxMinutesAgo(33) },
    { label: 'Media updated', target: 'Scene 6',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(26) },
    { label: 'Transcript updated', target: 'Scene 2',
      page: 'object-manager', objectId: 's02-o02',
      group: 'The Hazardous Energy Problem', at: hxMinutesAgo(18) },
    { label: 'Audio updated', target: 'Scene 2',
      page: 'object-manager', objectId: 's02-o02',
      group: 'The Hazardous Energy Problem', at: hxMinutesAgo(15) },
    { label: 'Learning objects reordered', target: 'Lockout Administration moved up',
      page: 'course-overview', group: 'Course Overview', at: hxMinutesAgo(9) },
    { label: 'Media updated', target: 'Scene 9',
      page: 'object-manager', objectId: 's03-o08',
      group: 'Conveyor Belt Lockout/Tagout Procedure', at: hxMinutesAgo(4) }
  ]
};

/* ---- Store ------------------------------------------------- */

/* Whole state for one course: the entries AND where the pointer sits.
   Both are persisted — a rewound editor that forgot it was rewound would
   redo into the wrong place after a page change. */
function hxState(sku) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(HX_STORE_KEY)); }
  catch (e) { saved = null; }              // private mode / corrupt value

  const mine = saved && saved[sku];
  if (mine && Array.isArray(mine.entries)) {
    return { entries: mine.entries.map(e => ({ ...e })), pointer: mine.pointer };
  }

  /* First load for this course: materialise the seed with stable ids.
     Trimmed to the cap like any other push would be — the seed is longer
     than HX_CAP on purpose, so the panel opens already showing the
     "oldest entries fall off" behaviour rather than a short list. */
  const seeded = (HX_SEED[sku] || []).map((e, i) => ({ id: 'h' + (i + 1), ...e }));
  const entries = seeded.slice(Math.max(0, seeded.length - HX_CAP));
  return { entries, pointer: entries.length - 1 };
}

function hxSave(sku, state) {
  try {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(HX_STORE_KEY)) || {}; }
    catch (e) { saved = {}; }
    saved[sku] = state;
    sessionStorage.setItem(HX_STORE_KEY, JSON.stringify(saved));
  } catch (e) { /* storage unavailable — the demo still works in-memory */ }
  hxAnnounce(sku);
}

/* Both pages and several widgets read this store, so every mutation
   announces itself rather than each caller remembering to re-render. */
function hxAnnounce(sku) {
  document.dispatchEvent(new CustomEvent('hx:changed', { detail: { sku } }));
}

/* ---- Operations -------------------------------------------- */

/* Is the editor stepped back from the tip? While true, editing is the
   destructive move — it discards everything ahead — so the pages gate on
   this before committing a change. */
function hxIsRewound(sku) {
  const state = hxState(sku);
  return state.pointer < state.entries.length - 1;
}

/* How many entries would be lost by editing from here. */
function hxAheadCount(sku) {
  const state = hxState(sku);
  return Math.max(0, state.entries.length - 1 - state.pointer);
}

/* Record an action. If the editor is rewound, this is the destructive
   moment: the entries ahead of the pointer are dropped.

   Callers MUST clear the gate first (see hxIsRewound / the confirm flow
   in history-panel.js) — this function does the discarding without
   asking, because it is also the path a confirmed edit takes. */
function hxPush(sku, entry) {
  const state = hxState(sku);

  state.entries = state.entries.slice(0, state.pointer + 1);
  state.entries.push({
    id: 'h' + (Date.now() % 100000),
    at: new Date().toISOString(),
    ...entry
  });

  // Trim the oldest once past the cap; the pointer follows the tip.
  if (state.entries.length > HX_CAP) {
    state.entries = state.entries.slice(state.entries.length - HX_CAP);
  }
  state.pointer = state.entries.length - 1;

  hxSave(sku, state);
  return state.entries[state.pointer];
}

/* Move the pointer. Returns the entry that was undone/redone so the UI
   can say what just happened — the widget confirms in place rather than
   silently changing something on another page. */
function hxUndo(sku) {
  const state = hxState(sku);
  if (state.pointer < 0) return null;
  const undone = state.entries[state.pointer];
  state.pointer -= 1;
  hxSave(sku, state);
  return undone;
}

function hxRedo(sku) {
  const state = hxState(sku);
  if (state.pointer >= state.entries.length - 1) return null;
  state.pointer += 1;
  const redone = state.entries[state.pointer];
  hxSave(sku, state);
  return redone;
}

/* Jump straight to an entry by clicking its row. Moving to the entry
   BEFORE the oldest one (pointer -1) is legal — that is "undo everything
   in the window". */
function hxGoto(sku, id) {
  const state = hxState(sku);
  const idx = state.entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  state.pointer = idx;
  hxSave(sku, state);
  return state.entries[idx];
}

/* Empty the stack. Called on PUBLISH (the published state becomes the new
   baseline, so undoing past it would be incoherent) and on DISCARD (which
   resets to the last publish event — a wider reset than this window can
   express, so what is left to undo is nothing). */
function hxClear(sku) {
  hxSave(sku, { entries: [], pointer: -1 });
}

/* ---- Display helpers --------------------------------------- */

/* Entries are grouped under a location header in the panel, so
   consecutive changes to the same object read as one block rather than
   as unrelated rows. Preserves order; only ADJACENT entries group. */
function hxGrouped(entries) {
  const out = [];
  entries.forEach(e => {
    const last = out[out.length - 1];
    if (last && last.group === e.group) last.items.push(e);
    else out.push({ group: e.group, items: [e] });
  });
  return out;
}

/* Relative time. Unlike the publish history — where the absolute date
   answers "what went out in August?" — this is a single session, so
   "12 min ago" is the readable form. */
function hxAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? '1 hr ago' : hrs + ' hrs ago';
}

/* One icon per kind of change, matched on the verb. */
function hxIcon(label) {
  const l = label.toLowerCase();
  if (l.includes('transcript')) return 'fa-align-left';
  if (l.includes('media') || l.includes('image')) return 'fa-image';
  if (l.includes('audio')) return 'fa-volume-high';
  if (l.includes('reorder')) return 'fa-arrow-down-a-z';
  if (l.includes('renamed')) return 'fa-pen';
  if (l.includes('added')) return 'fa-plus';
  if (l.includes('removed') || l.includes('deleted')) return 'fa-trash';
  return 'fa-clock-rotate-left';
}
