/* =========================================================================
   AITHERA WRITER STUDIO — GENERIC ENGINE
   Loaded ONLY by writer-studio.html (never by the learner-facing live
   pages). It provides the type-agnostic machinery the studio shell needs so
   a single studio can author MANY scenario "types":

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
  function list() { return Object.keys(TYPES).map((id) => TYPES[id]); }

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

  /* ---- the store — draft/published/library over one key set ------------
     Lifted from the helpers that used to live inline in js/scenario.js,
     parameterized by `keys` and the type's own {isValid, normalize} so every
     type gets identical persistence behavior. */
  function makeStore(keys, hooks) {
    const isValid = (hooks && hooks.isValid) || (() => true);
    const normalize = (hooks && hooks.normalize) || ((s) => s);

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
      localStorage.setItem(keys.published, JSON.stringify({
        savedAt: new Date().toISOString(), scenario,
      }));
    }
    function clearPublished() { localStorage.removeItem(keys.published); }

    /* named library — same-browser saved scenarios keyed by id */
    function readLibrary() {
      try { return JSON.parse(localStorage.getItem(keys.library)) || {}; }
      catch (e) { return {}; }
    }
    function listLibrary() {
      const lib = readLibrary();
      return Object.keys(lib)
        .map((id) => ({ id, savedAt: lib[id].savedAt, title: (lib[id].scenario || {}).title || '(untitled)' }))
        .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
    }
    function saveToLibrary(scenario, id) {
      const lib = readLibrary();
      const key = id || 'scn-' + Date.now().toString(36);
      lib[key] = { savedAt: new Date().toISOString(), scenario };
      localStorage.setItem(keys.library, JSON.stringify(lib));
      return key;
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
      listLibrary, saveToLibrary, loadFromLibrary, removeFromLibrary,
    };
  }

  window.AitheraStudio = { register, get, list, makeKeys, makeStore };
})();
