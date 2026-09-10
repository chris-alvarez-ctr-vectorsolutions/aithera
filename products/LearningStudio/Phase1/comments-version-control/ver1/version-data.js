/* ============================================================
   PUBLISH HISTORY — shared model

   Loaded by index.html (the course lookup, where Version history opens from
   the row kebab) and by course-overview.html (where a publish ADDS an event).
   Both read and write the same store, so publishing a note on the overview
   shows up in the lookup's history without either page owning the data.

   ---- What an event is ----
   The timeline lists PUBLISH events only, not every save. That is the unit
   people reason about when they ask "which version went out for Title IX?",
   and it is what a revert targets.

     {
       id:      'v12',                  // the published version label
       at:      ISO timestamp,          // when it was published
       author:  'Dana Cole',
       note:    'Updated for Title IX…',// entered in the publish dialog
       current: true                    // the live version (exactly one)
     }

   ---- Why the note matters ----
   The note is the reason this screen is useful. Without it the timeline is a
   list of dates and someone has to open each version and search it to find
   the one they want; with it they read "DEI resolution for 2026" and go
   straight there. So the note is captured at publish time (see the publish
   dialog on the Course Overview) and is the most prominent thing on a row.

   ---- Persistence ----
   sessionStorage, keyed per course, matching comments-data.js: a walkthrough
   holds together across lookup -> overview -> publish -> back to lookup, and
   a fresh tab starts from the seed.
   ============================================================ */

/* Relative seeding, so a demo opened months from now still reads as recent
   rather than drifting into "published 8 months ago". */
function vhDaysAgo(d, h) {
  return new Date(Date.now() - d * 86400000 - (h || 0) * 3600000).toISOString();
}

/* Seed history for the one course wired into this workflow. Keyed by SKU so
   other courses can be given their own history later without changing any
   rendering code — a course with no entry shows the empty state. */
const VH_SEED = {
  '#DEMO-LOTO-101': [
    { id: 'v12', at: vhDaysAgo(0, 3), author: 'Dana Cole', current: true,
      note: 'Updated hardware photography in Lockout Hardware to the 2026 set. Replaces the old padlock images flagged in review.' },
    { id: 'v11', at: vhDaysAgo(6), author: 'Priya Raman',
      note: 'DEI resolution for 2026 — revised scenario names and narration in the Case Study to match the updated style guide.' },
    { id: 'v10', at: vhDaysAgo(24), author: 'Marcus Webb',
      note: 'Updated for Title IX. Reworked the reporting-obligations language in Program Requirements and added the new contact block.' },
    { id: 'v9', at: vhDaysAgo(58), author: 'Dana Cole',
      note: 'Annual compliance review. No content changes — re-published after the legal sign-off expired.' },
    { id: 'v8', at: vhDaysAgo(96), author: 'Sofia Nunez',
      note: 'Corrected "unexpected energization" phrasing throughout to the wording legal approved.' },
    { id: 'v7', at: vhDaysAgo(155), author: 'Marcus Webb',
      note: '' }   // an older event published before notes existed
  ]
};

const VH_STORE_KEY = 'ls-cvc-publish-history';

/* Load one course's history, newest first. Stored events are MERGED over the
   seed rather than replacing it, so editing VH_SEED above still shows up in a
   tab that already has stored state. */
function vhLoad(sku) {
  const seed = (VH_SEED[sku] || []).map(e => ({ ...e }));

  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(VH_STORE_KEY)); }
  catch (e) { saved = null; }                 // private mode / corrupt value

  const added = (saved && saved[sku]) || [];
  const all = added.map(e => ({ ...e })).concat(seed);

  // Newest first, and let the stored `current` flag win over the seed's.
  all.sort((a, b) => new Date(b.at) - new Date(a.at));
  if (added.length) all.forEach(e => { e.current = false; });
  if (added.length) {
    const live = all.find(e => added.some(a => a.id === e.id && a.current))
              || all[0];
    if (live) live.current = true;
  }
  return all;
}

/* Append a publish event. Called by the publish dialog on the Course
   Overview; the new event becomes current. */
function vhPublish(sku, note, author) {
  const all = vhLoad(sku);
  const next = vhNextId(all);
  const event = {
    id: next, at: new Date().toISOString(),
    author: author || 'Dev Llama', note: (note || '').trim(), current: true
  };
  vhSaveAdded(sku, [event].concat(vhAddedOnly(sku)));
  return event;
}

/* Revert: publishes a NEW event that restores an older one, rather than
   deleting history. Version control that erases the versions you reverted
   past is the thing people are afraid of — and the audit trail is the point
   of this screen, so going back has to be additive. */
function vhRevert(sku, id) {
  const all = vhLoad(sku);
  const from = all.find(e => e.id === id);
  if (!from) return null;
  const event = {
    id: vhNextId(all), at: new Date().toISOString(),
    author: 'Dev Llama', current: true,
    note: 'Reverted to ' + id + '.' + (from.note ? ' ' + from.note : ''),
    revertOf: id                              // drives the row's badge
  };
  vhSaveAdded(sku, [event].concat(vhAddedOnly(sku)));
  return event;
}

/* Next version label. Parses the numeric part so v9 -> v10, not v91. */
function vhNextId(all) {
  const highest = all.reduce((m, e) => {
    const n = parseInt(String(e.id).replace(/^v/, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return 'v' + (highest + 1);
}

function vhAddedOnly(sku) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(VH_STORE_KEY)); }
  catch (e) { saved = null; }
  return ((saved && saved[sku]) || []).map(e => ({ ...e }));
}

function vhSaveAdded(sku, events) {
  try {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(VH_STORE_KEY)) || {}; }
    catch (e) { saved = {}; }
    saved[sku] = events;
    sessionStorage.setItem(VH_STORE_KEY, JSON.stringify(saved));
  } catch (e) { /* storage unavailable — the demo still works in-memory */ }
}

/* ---- Display helpers ---- */

/* Absolute date plus a relative hint. The requirement calls date "key info",
   and for compliance work the absolute date is what matters ("what went out
   in August?"), with the relative form for recency at a glance. */
function vhWhen(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined,
    { year: 'numeric', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined,
    { hour: 'numeric', minute: '2-digit' });
  return { date, time, rel: vhRel(iso) };
}

function vhRel(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.round(hrs / 24);
  if (days < 30) return days + 'd ago';
  const mo = Math.round(days / 30);
  return mo < 12 ? mo + 'mo ago' : Math.round(mo / 12) + 'y ago';
}
