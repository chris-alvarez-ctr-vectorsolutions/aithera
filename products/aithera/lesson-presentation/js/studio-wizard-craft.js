/* =========================================================================
   AITHERA WRITER STUDIO — SHARED WIZARD CRAFT
   Loaded by scenario-editor/index.html BEFORE js/studio-wizard.js and the per-type
   wizard spec files (studio-v2-wizards.js, studio-v2-guided-arc.js,
   studio-v2-ensemble-wizard.js). Exposes window.AitheraWizardCraft.

   Why this exists: every wizard spec used to re-declare the same intake
   helpers, the same sourceBlock(), and — most dangerously — its own copy of
   the coach VOICE rules (the banned-phrase list and the JSON-output contract).
   Those invariants drifted across 3–4 files; a single edit to the voice rules
   meant editing them everywhere. They now live here, once.

   What is SHARED vs. what stays local to each spec:
     - SHARED (here): the intake helpers, sourceBlock, and the invariant PROMPT
       ATOMS — the banned-phrase list, the grounding rule, the citation rule,
       and the JSON-only output rule. These are identical for every type.
     - LOCAL (each spec): the two-register FRAMING that names what counts as a
       learner-facing line vs. guidance FOR THAT pedagogy. That framing is
       deliberately tailored per type, so each spec composes its own craft
       spine from the atoms below rather than importing one rigid string.

   No modules, no build step — a plain global, matching the rest of the studio.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- intake helpers (were triplicated verbatim across the spec files) --- */
  // Split a textarea value into trimmed, non-empty lines.
  const lines = (v) => String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
  // Cap pasted source material so one call can't blow the worker token budget.
  const trim = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n) + '\n[…source trimmed for length…]' : s; };
  // Strip trailing periods so a generated phrase drops cleanly into a sentence
  // the compiler builds around it.
  const depunct = (s) => String(s || '').trim().replace(/\.+$/, '');
  // Null-safe string coercion.
  const str = (v) => String(v == null ? '' : v);

  // The designer's pasted source, framed for the prompt (or a "none pasted"
  // note). Identical for every type — mine it, echo its facts, never contradict.
  function sourceBlock(intake, cap) {
    const s = trim(intake.sourceText, cap);
    return s
      ? `SOURCE MATERIAL (pasted by the designer — mine it for specifics, echo its facts, never contradict it):\n"""\n${s}\n"""`
      : 'SOURCE MATERIAL: none pasted — work from the interview alone.';
  }

  /* ---- invariant PROMPT ATOMS --------------------------------------------
     The parts of the craft spine that MUST read the same for every pedagogy.
     A spec interpolates these into its own two-register framing, e.g.:

       `...BANNED (and anything that pattern-matches them): ${BANNED_PHRASES}.`
       `${GROUNDING_BASE} ${CITATION_RULE}`   // or GROUNDING_BASE alone
       `${OUTPUT_JSON_RULE}`

     Edit the coach's forbidden voice ONCE, here. */

  // The forbidden AI-assistant tics — no trailing period (the spec adds one).
  const BANNED_PHRASES =
    '"I hear you", "that\'s valid", "sit with that", "here\'s the thing", "let\'s unpack", "lean into", "hold space", "great question", "you\'re not alone in that", "does that resonate", "I want to gently push"';

  // Grounding discipline every field must obey.
  const GROUNDING_BASE =
    'Ground every field in the designer\'s interview answers and source material. Invent plausible texture (names, small details) when needed, but NEVER invent laws, statistics, or policy specifics that aren\'t in the source or common knowledge. Write names literally (no placeholders).';

  // The extra sentence types append when a field carries a compliance citation.
  const CITATION_RULE =
    'NEVER fabricate a source citation — provenance is a compliance record; use an empty string when nothing specific grounds a point.';

  // The JSON-only output contract the worker's response must satisfy. Note the
  // literal backslash-n-backslash-n: it instructs the model to escape breaks.
  const OUTPUT_JSON_RULE =
    'OUTPUT — return ONLY one JSON object matching the requested shape: no markdown fences, no commentary, start with { and end with }. Never emit a raw line break inside a JSON string — escape paragraph breaks as \\n\\n.';

  window.AitheraWizardCraft = {
    lines, trim, depunct, str, sourceBlock,
    BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE,
  };
})();
