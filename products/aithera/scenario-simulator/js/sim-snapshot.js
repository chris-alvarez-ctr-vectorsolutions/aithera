/* =========================================================================
   SIM SNAPSHOT — a reproducibility / cross-engine CONFORMANCE record for a
   scenario (window.SimSnapshot).
   -------------------------------------------------------------------------
   A scenario's authored SOURCE is the canonical artifact, but the two things
   that actually run — the runtime object the engine follows (type.toRuntime)
   and the system prompt the model follows (type.compile) — are DERIVED at load.
   So an exported source alone does not capture what ran: change toRuntime(),
   compile(), or normalize() and the same file behaves differently.

   SimSnapshot.of(type, source) captures that derivation as a small, hashable
   record:
     { type, sourceSchemaVersion, compilerVersion,
       runtimeHash, promptHash, promptChars, model, modelSettings, at }

   Why it matters here specifically: a second team is building the PRODUCTION
   engine from this prototype as the reference. Each side can snapshot the SAME
   authored source; equal hashes ⇒ both produce the same runtime and the same
   prompt (they conform). Unequal ⇒ diff the runtime/prompt to find where the
   two engines diverged. Hashes are taken over CANONICALIZED data (keys sorted),
   so key order never causes a false mismatch and a different language can
   reproduce the same hash from the same data.

   Pure, DOM-free, dependency-free. No build step. Companion doc:
   scenario-simulator-json-contract.html (§ Reproducibility & conformance).
   ========================================================================= */
(function () {
  'use strict';

  // Bump when toRuntime()/compile() SEMANTICS change — i.e. when the same
  // authored source would produce a different runtime object or compiled
  // prompt. This is the "which build produced this" stamp; the snapshot is
  // meaningless without it. Keep it in lockstep with the engine, not the date.
  const COMPILER_VERSION = '2026-08-06.1';

  // Deterministic JSON: object keys sorted recursively so two structurally
  // equal values serialize identically regardless of key insertion order.
  const stableStringify = (v) => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(v).sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(v[k]))
      .join(',') + '}';
  };

  // FNV-1a, 32-bit, zero-padded hex. Small and stable across engines/languages.
  const hash = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  /* of(type, source, meta?) — snapshot what `source` compiles to under THIS
     build. `type` is a scenario-type object (must expose id, toRuntime, compile;
     a recipe type without its own toRuntime is snapshotted through the type it
     funnels to). `meta` optionally records the runtime context that also shapes
     a run: { model, modelSettings, at }. Never throws — a broken toRuntime/
     compile is captured in the hash rather than aborting the record. */
  const of = (type, source, meta) => {
    meta = meta || {};
    let runtime, prompt;
    try { runtime = type.toRuntime(source); }
    catch (e) { runtime = { __error: String((e && e.message) || e) }; }
    try { const c = type.compile(source); prompt = (typeof c === 'string') ? c : stableStringify(c); }
    catch (e) { prompt = 'COMPILE_ERROR:' + String((e && e.message) || e); }
    const runtimeStr = stableStringify(runtime);
    prompt = String(prompt);
    return {
      type: (type && type.id) || null,
      sourceSchemaVersion: (source && source.v != null) ? source.v
        : (runtime && runtime.v != null ? runtime.v : null),
      compilerVersion: COMPILER_VERSION,
      runtimeHash: hash(runtimeStr),
      promptHash: hash(prompt),
      promptChars: prompt.length,
      model: meta.model != null ? meta.model : null,
      modelSettings: meta.modelSettings != null ? meta.modelSettings : null,
      at: meta.at != null ? meta.at : null,
    };
  };

  window.SimSnapshot = { COMPILER_VERSION, stableStringify, hash, of };
})();
