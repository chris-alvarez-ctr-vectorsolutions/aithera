/* =========================================================================
   AITHERA WRITER STUDIO — GENERIC ENGINE
   Loaded by the Writer Studio (scenario-editor/index.html) AND by the learner-facing
   live pages — the live pages use makeStore/makeKeys for the publish→live
   handoff, even though only the studio calls register/list. It provides the
   type-agnostic machinery the studio shell needs so a single studio can author
   MANY scenario "types":

     - a REGISTRY of scenario types (register / get / list)
     - per-type localStorage key sets (makeKeys)
     - a per-type STORE for draft/published/library (makeStore)

   A "scenario type" is a plain object a type module registers (see
   js/scenario.js for the action-practice type, js/scenario-types/*.js for
   others). The shell reads only the type's public surface — it never knows
   which pedagogy it is editing.

   No modules, no build step: exposed as the global window.AitheraStudio.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- the registry ----------------------------------------------------- */
  const TYPES = {};

  // A type module calls this once at load. Order of registration == the order
  // types appear in the switcher (list() preserves insertion order).
  function register(type) {
    if (!type || !type.id) throw new Error('AitheraStudio.register: a type needs an id');
    TYPES[type.id] = type;
    return type;
  }
  function get(id) { return TYPES[id] || null; }
  /* list() — every registered type, in registration order.
     list({ goForwardOnly: true }) — only types a NEW scenario may be authored in.

     The distinction matters because of where the output goes. A scenario is
     authored here and then uploaded back into the production system as a V4
     document, and only the go-forward type can produce one: the classic types
     have no handoff build at all. Offering them for new work lets someone spend
     an afternoon in a format that cannot leave the tool. They stay registered —
     existing links, saved drafts and the scenarios they already describe keep
     working — they are just no longer on offer for something new. */
  function list(opts) {
    const all = Object.keys(TYPES).map((id) => TYPES[id]);
    if (!opts || !opts.goForwardOnly) return all;
    const fwd = all.filter((t) => t && t.goForward === true);
    return fwd.length ? fwd : all;      // never leave the caller with nothing
  }

  /* ---- per-type localStorage keys --------------------------------------
     Namespaced by type id so publishing one type never collides with
     another. The action-practice type deliberately passes the ORIGINAL
     un-namespaced literals instead of calling this (so its already-shipped
     live pages keep reading the same key) — see js/scenario.js. workerUrl is
     intentionally SHARED across every type (one playtest proxy). */
  function makeKeys(id) {
    return {
      draft:     `aithera.writerStudio.draft.${id}.v1`,
      published: `aithera.scenario.published.${id}.v1`,
      library:   `aithera.writerStudio.library.${id}.v1`,
      workerUrl: 'aithera.writerStudio.workerUrl',
    };
  }

  /* ---- CHANNEL — keeping an experiment off an author's real work ---------
     localStorage is per ORIGIN, not per page, so two builds of the studio served
     from the same host share every key by default. That is fine while there is
     one studio and fatal the moment there are two: an experimental build writing
     a half-finished draft, or a new wizard stomping the draft on open, reaches
     straight into a scenario someone is actually authoring — and the browser
     library is the only copy that scenario has.

     A page declares its channel BEFORE loading this file:
         <script>window.STUDIO_CHANNEL = 'sandbox';</script>
     Absent or 'stable' means today's keys, unchanged — so the stable tool keeps
     reading the drafts and libraries that already exist and nobody loses a
     library on the day the second link appears.

     Scoped deliberately to DRAFT and LIBRARY, the author's work product.
     `published` stays shared: it is the transient publish→live handoff buffer
     that the learner-facing pages read, and channelizing it would mean a
     sandbox playtest silently publishing somewhere no player looks. A sandbox
     publish overwriting that buffer costs a re-publish; a sandbox overwriting a
     library costs the work. `workerUrl` is a machine-level setting and stays
     shared for the same reason it is shared across types. */
  const CHANNELED = ['draft', 'library'];
  function channelize(keys) {
    const ch = String((typeof window !== 'undefined' && window.STUDIO_CHANNEL) || '').trim();
    if (!ch || ch === 'stable') return keys;
    const out = {};
    Object.keys(keys).forEach((k) => {
      out[k] = CHANNELED.indexOf(k) >= 0 ? `${keys[k]}.ch-${ch}` : keys[k];
    });
    return out;
  }

  /* ---- the store — draft/published/library over one key set ------------
     Lifted from the helpers that used to live inline in js/scenario.js,
     parameterized by `keys` and the type's own {isValid, normalize} so every
     type gets identical persistence behavior.

     Channelized HERE rather than in makeKeys so the isolation covers every
     caller — including js/scenario.js, which deliberately hand-passes the
     original un-namespaced literals to keep its already-shipped live pages
     reading the same keys, and would otherwise be the one type an experiment
     could still clobber. */
  function makeStore(keysIn, hooks) {
    const keys = channelize(keysIn);
    const isValid = (hooks && hooks.isValid) || (() => true);
    const normalize = (hooks && hooks.normalize) || ((s) => s);

    // localStorage is ~5MB/origin. A scenario that embeds an uploaded photo (a
    // base64 data URL) can approach that, and setItem throws on overflow — so
    // guard writes and surface a plain, actionable message instead of a silent
    // uncaught throw. Returns true on success.
    function safeSet(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch (e) {
        const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
        alert(quota
          ? 'This scenario is too large to save in the browser — usually an embedded photo. Use a smaller image, or paste an image path/URL instead of uploading it.'
          : 'Could not save to browser storage: ' + ((e && e.message) || e));
        return false;
      }
    }

    /* published slot — the live page reads this */
    function loadPublished() {
      try {
        const raw = localStorage.getItem(keys.published);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        if (!isValid(payload.scenario)) return null;
        payload.scenario = normalize(payload.scenario);
        return payload;
      } catch (e) { return null; }
    }
    function publish(scenario) {
      return safeSet(keys.published, JSON.stringify({
        savedAt: new Date().toISOString(), scenario,
      }));
    }
    function clearPublished() { localStorage.removeItem(keys.published); }

    /* named library — same-browser saved scenarios keyed by id */
    function readLibrary() {
      try { return JSON.parse(localStorage.getItem(keys.library)) || {}; }
      catch (e) { return {}; }
    }
    /* Where a scenario keeps its name depends on the format: the classic types
       put it at the top level, POC V4 puts it under `content`. Reading only the
       top level listed every V4 snapshot as "(untitled)", which made the drafts
       panel a column of identical rows — nothing to tell them apart by, in the
       one place whose whole job is telling them apart. */
    function titleOf(scenario) {
      const s = scenario || {};
      const t = String(s.title || (s.content || {}).title || '').trim();
      return t || '(untitled)';
    }
    function listLibrary() {
      const lib = readLibrary();
      return Object.keys(lib)
        .map((id) => ({ id, savedAt: lib[id].savedAt, title: titleOf(lib[id].scenario) }))
        .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
    }
    function saveToLibrary(scenario, id) {
      const lib = readLibrary();
      const key = id || 'scn-' + Date.now().toString(36);
      lib[key] = { savedAt: new Date().toISOString(), scenario };
      return safeSet(keys.library, JSON.stringify(lib)) ? key : null;
    }
    function loadFromLibrary(id) {
      const entry = readLibrary()[id];
      return entry && isValid(entry.scenario) ? normalize(entry.scenario) : null;
    }
    function removeFromLibrary(id) {
      const lib = readLibrary();
      delete lib[id];
      localStorage.setItem(keys.library, JSON.stringify(lib));
    }

    return {
      keys,
      loadPublished, publish, clearPublished,
      listLibrary, saveToLibrary, loadFromLibrary, removeFromLibrary, titleOf,
    };
  }

  window.AitheraStudio = {
    register, get, list, makeKeys, makeStore,
    /* what channel this page resolved to — a sandbox build reads this to label
       itself, so an author can never be unsure which tool they are typing in */
    channel: () => String((typeof window !== 'undefined' && window.STUDIO_CHANNEL) || 'stable').trim() || 'stable',
  };
})();
