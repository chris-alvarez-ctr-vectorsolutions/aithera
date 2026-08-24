/* =========================================================================
   AITHERA WRITER STUDIO — "START FROM SCRATCH" WIZARD (generic engine)
   Loaded ONLY by scenario-editor/index.html. Turns a scenario type's `wizard`
   spec into a guided, multi-step intake (brief → interview → generate) that
   ends with an AI-DRAFTED scenario landing in the normal editor.

   The design premise: half of a scenario's fields are really INSTRUCTIONS
   TO THE COACH AI (calibration tiers, escalation guidance, debrief points)
   — i.e. prompt engineering. A learning designer shouldn't have to write
   those. So the wizard asks the questions an instructional designer already
   asks an SME (what do people get wrong? what does strong look like?), and
   a generation pass — the same Worker proxy the playtest uses — translates
   the answers into the schema. The designer reviews and refines in the
   editor they already know; nothing downstream changes.

   A type opts in by exposing `type.wizard`:
     {
       title, intro,                    // copy for the wizard front door
       steps: [ { id, title, sub, fields: [FieldDef] } ],
       derive(intake),                  // fill defaults derived from answers
       start(type),                     // -> a COMPLETE blank draft to fill
       plan(intake, type) -> [ Task ],  // the ordered generation calls
       landNote(intake),                // toast shown when the draft lands
       describePlaceholder,             // BASIC mode: example one-liner copy
     }
   FieldDef: { key, kind: text|area|lines|chips|toggle|source, label,
               helper|placeholder|minRows|options|default, required,
               showIf(intake), noSeed } — helper/label may be fn(intake).

   TWO INTAKE MODES, chosen on step 0 — BASIC is the default every time the
   wizard opens; an Advanced pick lasts for that open only (never persisted):
   - ADVANCED — the designer answers the full interview themselves (the
     classic flow above, unchanged).
   - BASIC — the designer writes ONE free-form description (a sentence is
     the floor; more context = truer draft) plus optional source material.
     "Create outline" runs ONE extra model call that drafts every interview
     answer (same fields, same keys — built generically from the spec's own
     labels/helpers, so specs need no outline prompt), then the normal steps
     open PRE-FILLED for review and editing. The Generate step is identical
     in both modes. Fields with kind 'source' or `noSeed: true` are never
     drafted (no fabricated source text or URLs). Don't like the outline?
     Edit any field directly, or jump back via the drafted-pill's "Add
     context & redraft" link, enrich the description, and Redraft — it
     becomes the primary CTA whenever the description has changed, and the
     overwrite confirm only fires when drafted answers were hand-edited
     (tracked by `_outlineSig`). The intake keys `describe`, `_outlined`,
     `_outlinedFrom` and `_outlineSig` are reserved for this (a legacy
     stored `_mode` may exist in old intakes and is ignored).
   Task:     { id, label, build(intake, acc, type) -> {system,user,maxTokens},
               apply(json, draft, intake, acc) }
   Tasks run SEQUENTIALLY (later ones read earlier results via acc.results);
   each response must be ONE JSON object — a fence-stripping parse plus one
   "JSON only" retry nudge mirrors the playtest's recovery pattern.

   No modules, no build step: exposed as window.AitheraStudioWizard.
   ========================================================================= */
(function () {
  'use strict';

  const MODEL = 'claude-opus-4-8';
  const DEFAULT_WORKER = 'https://aithera-action-proxy.vector-aithera.workers.dev';
  const RETRY_NUDGE = '\n\n[Return ONLY the JSON object described above — start with { and end with }, no fences, no commentary.]';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const val = (v, intake) => (typeof v === 'function' ? v(intake) : v);

  /* ---- styles (uses the host page's CSS variables, so theming follows) --- */
  const CSS = `
  .wiz-overlay {
    position: fixed; inset: 0; z-index: 80;
    background: rgba(10, 14, 24, .55); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center; padding: 26px;
  }
  .wiz-modal {
    width: min(880px, 100%); height: min(88vh, 780px);
    background: var(--bg); border: 1px solid var(--line); border-radius: 16px;
    box-shadow: var(--shadow-md); display: flex; flex-direction: column; overflow: hidden;
  }
  .wiz-head {
    flex: 0 0 auto; display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; background: var(--surface); border-bottom: 1px solid var(--line);
  }
  .wiz-head .wiz-logo {
    width: 30px; height: 30px; border-radius: 9px; flex: 0 0 auto;
    display: grid; place-items: center; background: var(--accent); color: var(--on-accent); font-size: 13px;
  }
  .wiz-head .wiz-titles { min-width: 0; }
  .wiz-head .wiz-title { font-size: 14.5px; font-weight: 800; color: var(--ink); }
  .wiz-head .wiz-sub { font-size: 11.5px; color: var(--ink-faint); }
  .wiz-close {
    margin-left: auto; background: none; border: 1px solid var(--line); border-radius: 9px;
    color: var(--ink-soft); cursor: pointer; font: inherit; font-size: 13px; padding: 6px 10px;
  }
  .wiz-close:hover { color: var(--err); border-color: var(--err); }

  /* step rail across the top */
  .wiz-steps {
    flex: 0 0 auto; display: flex; gap: 4px; padding: 10px 18px;
    background: var(--surface); border-bottom: 1px solid var(--line); overflow-x: auto;
  }
  .wiz-step {
    display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
    font-size: 12px; font-weight: 600; color: var(--ink-faint);
    padding: 6px 12px; border-radius: 999px; border: 1px solid transparent;
  }
  .wiz-step .n {
    width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
    background: var(--surface-2); color: var(--ink-faint); font-size: 10.5px; font-weight: 800;
  }
  .wiz-step.is-active { color: var(--accent-strong); background: var(--accent-soft); border-color: var(--accent); }
  .wiz-step.is-active .n { background: var(--accent); color: var(--on-accent); }
  .wiz-step.is-done .n { background: var(--ok-soft); color: var(--ok); }

  .wiz-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 22px 26px; }
  /* One centered content column: the cards/fields sit mid-frame instead of
     hugging the left edge of a wide modal. Text inside stays LEFT-aligned
     (the column centers, prose never does). */
  .wiz-body { display: grid; grid-template-columns: minmax(0, 680px); justify-content: center; align-content: start; }
  .wiz-body > .wiz-ai-pill { justify-self: start; }
  .wiz-body .wiz-step-title { font-size: 19px; font-weight: 800; letter-spacing: -.01em; color: var(--ink); margin: 0; }
  .wiz-body .wiz-step-sub { font-size: 13px; color: var(--ink-soft); margin: 5px 0 0; max-width: 62ch; }
  .wiz-fields { display: grid; gap: 15px; margin-top: 18px; max-width: 680px; }
  .wiz-fields vaadin-text-field, .wiz-fields vaadin-text-area { width: 100%; }

  /* chips (single-select) */
  .wiz-chips { display: grid; gap: 8px; }
  .wiz-chips .wiz-chips-label { font-size: 13px; font-weight: 600; color: var(--ink); }
  .wiz-chips .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .wiz-chip {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left;
    border: 1px solid var(--line); border-radius: 11px; background: var(--surface);
    padding: 9px 13px; cursor: pointer; font: inherit; color: var(--ink); min-width: 150px;
  }
  .wiz-chip:hover { border-color: var(--accent); }
  .wiz-chip.is-on { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
  .wiz-chip .t { font-size: 13px; font-weight: 700; }
  .wiz-chip .d { font-size: 11.5px; color: var(--ink-faint); }

  /* source-material drop zone */
  .wiz-source { display: grid; gap: 8px; }
  .wiz-drop {
    border: 1.5px dashed var(--line); border-radius: 11px; padding: 10px 14px;
    display: flex; align-items: center; gap: 10px; color: var(--ink-faint); font-size: 12.5px;
    cursor: pointer; transition: border-color .12s, background .12s;
  }
  .wiz-drop:hover, .wiz-drop.is-over { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-strong); }
  .wiz-drop .fa-solid { font-size: 14px; }
  .wiz-srcmeta { font-size: 11.5px; color: var(--ink-faint); }
  .wiz-srcmeta b { color: var(--ok); }

  /* generation checklist */
  .wiz-gen { display: grid; gap: 10px; margin-top: 18px; max-width: 680px; }
  .wiz-task {
    display: flex; align-items: flex-start; gap: 11px;
    border: 1px solid var(--line); border-radius: 11px; background: var(--surface);
    padding: 11px 14px;
  }
  .wiz-task .st { flex: 0 0 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11px;
    background: var(--surface-2); color: var(--ink-faint); margin-top: 1px; }
  .wiz-task.run .st { background: var(--accent-soft); color: var(--accent); }
  .wiz-task.ok .st { background: var(--ok-soft); color: var(--ok); }
  .wiz-task.fail .st { background: var(--err-soft); color: var(--err); }
  .wiz-task .tx { min-width: 0; flex: 1; }
  .wiz-task .tl { font-size: 13px; font-weight: 700; color: var(--ink); }
  .wiz-task .td { font-size: 11.5px; color: var(--ink-faint); margin-top: 1px; }
  .wiz-task .terr { font-size: 11.5px; color: var(--err); margin-top: 4px; white-space: pre-wrap; word-break: break-word; }
  .wiz-task .st .fa-spinner { animation: wiz-spin 1s linear infinite; }
  @keyframes wiz-spin { to { transform: rotate(360deg); } }

  .wiz-note {
    display: flex; gap: 9px; align-items: flex-start; max-width: 680px;
    color: var(--ink-soft); font-size: 12.5px; margin-top: 14px;
  }
  .wiz-note .fa-solid { color: var(--ink-faint); margin-top: 2px; }
  .wiz-note b { color: var(--ink); }

  .wiz-foot {
    flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
    padding: 13px 18px; background: var(--surface); border-top: 1px solid var(--line);
  }
  .wiz-foot .spacer { flex: 1; }
  .wiz-btn {
    display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px;
    border-radius: 10px; border: 1px solid var(--line); background: var(--surface);
    color: var(--ink-soft); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .wiz-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .wiz-btn:disabled { opacity: .45; cursor: default; }
  .wiz-btn.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .wiz-btn.primary:hover:not(:disabled) { filter: brightness(1.06); color: var(--on-accent); }
  .wiz-reqnote { font-size: 11.5px; color: var(--ink-faint); }

  /* type chooser (step 0) — mirrors the editor's core-interaction cards */
  .wiz-types { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; max-width: 680px; }
  @media (max-width: 720px) { .wiz-types { grid-template-columns: 1fr; } }
  .wiz-typecard {
    display: flex; gap: 12px; align-items: flex-start; text-align: left;
    border: 1px solid var(--line); border-radius: 12px; background: var(--surface);
    padding: 13px 14px; cursor: pointer; font: inherit; color: var(--ink);
    transition: border-color .12s, background .12s, box-shadow .12s;
  }
  .wiz-typecard:hover:not(:disabled) { border-color: var(--accent); }
  .wiz-typecard.is-on { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
  .wiz-typecard.is-off { opacity: .55; cursor: default; }
  .wiz-typecard .ic {
    flex: 0 0 auto; width: 32px; height: 32px; border-radius: 9px;
    display: grid; place-items: center; background: var(--surface-2); color: var(--accent); font-size: 14px;
  }
  .wiz-typecard.is-on .ic { background: var(--accent); color: var(--on-accent); }
  .wiz-typecard .tx { min-width: 0; }
  .wiz-typecard .nm { display: block; font-size: 14px; font-weight: 700; }
  .wiz-typecard .tg { display: block; font-size: 12px; color: var(--ink-faint); margin-top: 2px; line-height: 1.45; }
  .wiz-typecard .ck { margin-left: auto; color: var(--accent); font-size: 14px; align-self: center; }
  /* Legacy marking (step 0) — the classic shapes stay pickable for editing
     existing scenarios, but new builds are steered to Universal Scenario */
  .wiz-lgc {
    display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
    vertical-align: 1px; background: var(--surface-2); color: var(--ink-faint); border: 1px solid var(--line);
  }
  .wiz-legacy-div {
    grid-column: 1 / -1; margin: 6px 0 0; font-size: 12px; font-weight: 600; color: var(--ink-faint);
    display: flex; align-items: center; gap: 10px;
  }
  .wiz-legacy-div::after { content: ''; flex: 1 1 auto; height: 1px; background: var(--line); }
  .wiz-legacy-note { max-width: 680px; margin: 10px 0 0; font-size: 12px; color: var(--ink-faint); }

  /* Templates / Custom toggle (step 0) — segmented pill over the card grid */
  .wiz-typetabs {
    display: inline-flex; gap: 4px; margin-top: 18px; padding: 4px;
    border-radius: 12px; background: var(--surface-2); border: 1px solid var(--line);
  }
  .wiz-typetab {
    display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 18px;
    border: 0; border-radius: 9px; background: transparent; color: var(--ink-soft);
    font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
    transition: background .12s, color .12s;
  }
  .wiz-typetab .fa-solid { font-size: 12px; }
  .wiz-typetab:hover:not(.is-on) { color: var(--ink); }
  .wiz-typetab.is-on { background: var(--bg); color: var(--accent); box-shadow: 0 1px 2px rgba(10, 14, 24, .16); }
  /* Custom tab: the single compose-your-own option, shown full width */
  .wiz-customcard { width: 100%; max-width: 680px; margin-top: 16px; }

  /* basic/advanced mode picker (step 0) */
  .wiz-modes { margin-top: 22px; max-width: 680px; }
  .wiz-modes .wiz-chip { flex: 1 1 240px; }
  .wiz-modes .wiz-chip .t { display: inline-flex; align-items: center; gap: 7px; }
  .wiz-modes .wiz-chip .t .fa-solid { color: var(--accent); font-size: 12px; }

  /* "drafted from your description" marker on pre-filled interview steps */
  .wiz-ai-pill {
    display: inline-flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 12px;
    padding: 5px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 600;
    background: var(--accent-soft); color: var(--accent-strong); border: 1px solid var(--accent);
  }
  .wiz-ai-pill .wiz-pill-btn {
    border: 0; background: none; padding: 0; margin: 0;
    font: inherit; font-weight: 700; color: var(--accent-strong); cursor: pointer;
    display: inline-flex; align-items: center; gap: 5px;
    text-decoration: underline; text-underline-offset: 2px;
  }
  .wiz-ai-pill .wiz-pill-btn:hover { filter: brightness(1.12); }

  /* outline-draft failure note (describe step) */
  .wiz-outline-err {
    display: flex; gap: 9px; align-items: flex-start;
    color: var(--err); font-size: 12.5px; white-space: pre-wrap; word-break: break-word;
  }
  .wiz-outline-err .fa-solid { margin-top: 2px; }

  @media (max-width: 720px) {
    .wiz-overlay { padding: 0; }
    .wiz-modal { height: 100%; border-radius: 0; }
  }`;

  /* ---- JSON extraction + model call --------------------------------------
     Mirrors the playtest's recovery pattern: strip fences, slice the outer
     {...}, parse; if that fails, ONE retry with a JSON-only nudge appended
     to the user message (roles stay a single user turn). */
  function extractJson(raw) {
    let t = String(raw || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a === -1 || b <= a) throw new Error('No JSON object in the response');
    return JSON.parse(t.slice(a, b + 1));
  }

  async function callOnce(workerUrl, { system, user, maxTokens }) {
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(maxTokens || 1800, 2000),   // the Worker caps at 2000
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error('Worker HTTP ' + res.status + (data && data.error ? ' — ' + JSON.stringify(data.error) : ''));
    return {
      raw: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
      truncated: data.stop_reason === 'max_tokens',   // cut off mid-JSON — a format nudge can't fix this
    };
  }

  const TERSE_NUDGE = '\n\n[Your previous attempt exceeded the length limit and was CUT OFF mid-JSON. Regenerate the SAME JSON object far more tersely — every string as short as it can be while keeping the craft. Nothing but the JSON.]';

  async function generateJson(workerUrl, req) {
    const first = await callOnce(workerUrl, req);
    if (!first.truncated) {
      try { return extractJson(first.raw); }
      catch (e) { /* fall through to one reformat retry, playtest-style */ }
    }
    // Truncated → retry demanding brevity; malformed → retry demanding JSON-only.
    const second = await callOnce(workerUrl, { ...req, user: req.user + (first.truncated ? TERSE_NUDGE : RETRY_NUDGE) });
    try { return extractJson(second.raw); }
    catch (e) {
      if (second.truncated) throw new Error('The response hit the length cap mid-JSON twice — this section is asking for too much at once.');
      throw e;   // parse error surfaces to the task row; Resume re-runs it
    }
  }

  /* ---- the wizard component ---------------------------------------------- */
  function open(ctx) {
    /* Every registered type with a `wizard` spec is buildable here — the
       author picks WHICH on the first step, exactly like the editor's
       core-interaction templates. The chosen type drives the interview,
       the generation plan, and where the draft lands. */
    /* NEW scenarios only — the classic types are still registered and still
       editable, but they cannot produce the V4 document that gets uploaded back,
       so they are not offered as a starting point. */
    const registry = (window.AitheraStudio && window.AitheraStudio.list)
      ? window.AitheraStudio.list({ goForwardOnly: true })
      : [ctx.type];
    if (!registry.some((t) => t && t.wizard)) return null;

    let chosen, spec, intakeKey, intake, gen, describeStep;
    let outlining = false;   // the BASIC-mode "Create outline" call is in flight
    let outlineErr = '';     // its last failure, shown inline on the describe step

    /* BASIC mode's one intake step: the free-form description (the only
       required answer in the whole mode) plus the spec's OWN source field —
       same key, so pasted material flows straight into the advanced steps. */
    function buildDescribeStep(t) {
      const srcField = (t.wizard.steps || []).flatMap((s) => s.fields || []).find((f) => f.kind === 'source') || null;
      return {
        id: '__describe',
        title: 'Describe it',
        sub: 'One sentence is enough to start. The more you add — the audience, the real story, the tone — the closer the first draft.',
        fields: [
          { key: 'describe', kind: 'area', required: true, minRows: 5,
            label: 'What do you want to build?',
            placeholder: t.wizard.describePlaceholder || 'The topic, who it’s for, and anything else that matters…',
            helper: 'One sentence minimum. More detail here means fewer edits later.' },
        ].concat(srcField ? [srcField] : []),
      };
    }

    function loadChosen(t) {
      chosen = t;
      spec = t.wizard;
      intakeKey = `aithera.writerStudio.wizard.${t.id}.v1`;
      /* intake: restore a half-finished interview (kept PER TYPE, so
         switching the choice never loses another interview's answers) */
      try { intake = JSON.parse(localStorage.getItem(intakeKey)) || {}; } catch (e) { intake = {}; }
      /* generation + outline state resets with the choice */
      gen = { running: false, done: false, draft: null, acc: { results: {} }, tasks: [], status: {} };
      describeStep = buildDescribeStep(t);
      outlining = false;
      outlineErr = '';
    }
    loadChosen((ctx.type && ctx.type.wizard) ? ctx.type : registry.find((t) => t && t.wizard));
    const persistIntake = () => { try { localStorage.setItem(intakeKey, JSON.stringify(intake)); } catch (e) { /* full/blocked storage is fine */ } };

    /* Step 0 groups the interaction types under a Templates / Custom toggle:
       Templates = the ready-made shapes; Custom = the Mix & Match beat-composer
       (the only compose-your-own type). Kept in sync with `chosen`. If no
       custom composer is registered we fall back to the flat grid of all types. */
    const CUSTOM_TYPE_ID = 'mix-arc';
    /* The go-forward format (type-supplied `goForward` flag, like blurb): NEW
       scenarios are steered to it — it leads the grid, and every classic type
       wears a "Legacy — for editing existing scenarios" badge. Picking a
       go-forward type without an interview spec navigates to its editor
       (Universal Scenario's template gallery is its starting point). */
    const isLegacyType = (t) => t && !t.goForward;
    // stable sort: Universal first, classic shapes after, registration order kept within each group
    const byFreshness = (a, b) => (isLegacyType(a) ? 1 : 0) - (isLegacyType(b) ? 1 : 0);
    const customType = registry.find((t) => t && t.id === CUSTOM_TYPE_ID && t.wizard) || null;
    const templateTypes = registry.filter((t) => t && t.id !== CUSTOM_TYPE_ID).sort(byFreshness);
    let typeTab = (customType && chosen.id === CUSTOM_TYPE_ID) ? 'custom' : 'templates';
    // The last TEMPLATE the author picked — flipping Custom→Templates restores
    // their shape instead of resetting to the first card.
    let lastTemplate = (chosen.id !== CUSTOM_TYPE_ID) ? chosen
                     : (templateTypes.find((t) => t && t.wizard) || null);

    /* Every spec field the outline call may draft — the description input,
       source material and anything flagged noSeed (e.g. video URLs) are
       never fabricated by the model. */
    function seedableFields() {
      const out = [];
      (spec.steps || []).forEach((s) => (s.fields || []).forEach((f) => {
        if (f.kind === 'source' || f.noSeed) return;
        out.push(f);
      }));
      return out;
    }
    const hasInterviewAnswers = () =>
      seedableFields().some((f) => (f.kind === 'text' || f.kind === 'area' || f.kind === 'lines') && String(intake[f.key] ?? '').trim());
    /* Fingerprint of every seedable answer — taken when an outline lands, so
       a Redraft only asks "overwrite?" when the designer actually hand-edited
       the drafted answers (a changed DESCRIPTION alone redrafts silently). */
    const outlineSig = () => JSON.stringify(seedableFields().map((f) => [f.key, intake[f.key] ?? '']));
    const describeChanged = () => String(intake.describe || '').trim() !== String(intake._outlinedFrom || '').trim();

    /* BASIC is the default EVERY time the wizard opens — the Advanced pick
       lasts for this open only (it survives type switches, but is never
       persisted; a legacy stored `_mode` is ignored). Answers typed in
       Advanced stay saved either way — switching modes reveals them. */
    let modeChoice = 'basic';
    const mode = () => (modeChoice === 'advanced' ? 'advanced' : 'basic');

    let stepIdx = 0;
    // Step 0 is the type choice; the rest belong to the CHOSEN spec.
    // BASIC mode swaps the spec's steps for the describe step until the
    // outline lands — then they open, pre-filled, between the two.
    const steps = () => {
      /* With one type on offer this step no longer asks what you are building — it
         only asks HOW to start, so the rail should not promise a choice of type. */
      const head = [{ id: '__type', title: registry.length > 1 ? 'What are you building?' : 'How to start', sub: '' }];
      const tail = [{ id: '__generate', title: 'Generate', sub: '' }];
      if (mode() === 'basic') return head.concat([describeStep], intake._outlined ? spec.steps : [], tail);
      return head.concat(spec.steps, tail);
    };

    /* ---- shell DOM ---- */
    if (!document.getElementById('wizStyles')) {
      const st = document.createElement('style');
      st.id = 'wizStyles';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const overlay = document.createElement('div');
    overlay.className = 'wiz-overlay';
    overlay.innerHTML = `
      <div class="wiz-modal" role="dialog" aria-modal="true" aria-label="${esc(spec.title)}">
        <div class="wiz-head">
          <span class="wiz-logo"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
          <span class="wiz-titles">
            <span class="wiz-title" id="wizTitle">${esc(spec.title)}</span><br>
            <span class="wiz-sub" id="wizSub">${esc(spec.intro || '')}</span>
          </span>
          <button class="wiz-close" id="wizClose"><i class="fa-solid fa-xmark"></i> Close</button>
        </div>
        <div class="wiz-steps" id="wizSteps"></div>
        <div class="wiz-body" id="wizBody"></div>
        <div class="wiz-foot" id="wizFoot"></div>
      </div>`;
    document.body.appendChild(overlay);
    const $w = (sel) => overlay.querySelector(sel);

    function close() {
      if ((gen.running || outlining) && !confirm('Generation is still running — close anyway?')) return;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $w('#wizClose').addEventListener('click', close);

    /* ---- step rail ---- */
    function renderSteps() {
      $w('#wizSteps').innerHTML = steps().map((s, i) =>
        `<span class="wiz-step${i === stepIdx ? ' is-active' : ''}${i < stepIdx ? ' is-done' : ''}">
          <span class="n">${i < stepIdx ? '<i class="fa-solid fa-check"></i>' : i + 1}</span> ${esc(s.title)}</span>`).join('');
    }

    /* ---- step 0: the type chooser -------------------------------------------
       A Templates / Custom toggle organizes the interaction types so the list
       reads as one decision instead of a wall of cards: Templates holds the
       ready-made shapes; Custom is the Mix & Match beat-composer. Flipping to
       Custom lands straight in its interview — one fewer click, since it's the
       only compose-your-own option. With no custom composer registered we fall
       back to the flat grid of every type. */
    function renderTypeStep() {
      const body = $w('#wizBody');

      /* ONE type on offer means the type "chooser" is a single card, pre-selected,
         that cannot be deselected — it looks like a decision and is not one. Since
         the editor went single-format that is the normal case, so the step drops
         the gallery and asks the only question actually left: Basic or Advanced.
         Conditional rather than deleted, so a second go-forward type brings the
         chooser back on its own. */
      if (registry.length < 2) {
        body.innerHTML = `<h2 class="wiz-step-title">How do you want to start?</h2>
          <p class="wiz-step-sub">You are authoring a ${esc((registry[0] || {}).label || 'scenario')}.
             Both routes end in the same editor — this only decides how much of the first draft you write yourself.</p>`;
        renderModePicker(body, { labelled: false });
        return;
      }

      body.innerHTML = `<h2 class="wiz-step-title">What are you building?</h2>
        <p class="wiz-step-sub">${esc(customType
          ? 'New scenarios start as a Universal Scenario. The classic shapes below stay available for editing existing ones. Switch anytime — nothing’s lost.'
          : 'Pick the core interaction. You can switch between types without losing progress.')}</p>`;

      // No dedicated custom composer → the original flat grid of every type.
      if (!customType || !templateTypes.length) { renderTypeGrid(body, registry); renderModePicker(body); return; }

      /* Templates / Custom segmented toggle */
      const tabs = document.createElement('div');
      tabs.className = 'wiz-typetabs';
      tabs.setAttribute('role', 'tablist');
      [{ id: 'templates', ic: 'fa-swatchbook', label: 'Templates' },
       { id: 'custom', ic: esc(customType.icon || 'fa-shapes'), label: 'Custom' }]
      .forEach((td) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wiz-typetab' + (typeTab === td.id ? ' is-on' : '');
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', typeTab === td.id ? 'true' : 'false');
        b.innerHTML = `<i class="fa-solid ${td.ic}"></i> ${esc(td.label)}`;
        b.addEventListener('click', () => selectTypeTab(td.id));
        tabs.appendChild(b);
      });
      body.appendChild(tabs);

      if (typeTab === 'custom') {
        // The single compose-your-own option, already selected — clicking it (or
        // the footer's Next) continues into the interview.
        if (chosen.id !== customType.id) loadChosen(customType);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'wiz-typecard wiz-customcard is-on';
        card.innerHTML = `<span class="ic"><i class="fa-solid ${esc(customType.icon || 'fa-shapes')}"></i></span>
          <span class="tx"><span class="nm">${esc(customType.label)}<span class="wiz-lgc">Legacy</span></span>
          <span class="tg">${esc((customType.wizard && (customType.wizard.tagline || customType.wizard.intro)) || customType.blurb || '')}</span></span>
          <span class="ck"><i class="fa-solid fa-circle-check"></i></span>`;
        card.addEventListener('click', () => { stepIdx = 1; renderAll(); });
        body.appendChild(card);
        const legacyNote = document.createElement('p');
        legacyNote.className = 'wiz-legacy-note';
        legacyNote.textContent = 'Legacy — for editing existing scenarios. New scenarios start as a Universal Scenario (first card under Templates).';
        body.appendChild(legacyNote);
      } else {
        renderTypeGrid(body, templateTypes);
      }
      renderModePicker(body);
    }

    /* the grid of type cards — Templates panel and the no-custom fallback */
    function renderTypeGrid(body, list) {
      const grid = document.createElement('div');
      grid.className = 'wiz-types';
      let divided = false;
      list.filter(Boolean).sort(byFreshness).forEach((t) => {
        const fresh = !isLegacyType(t);
        // one full-width rule ahead of the first classic card — names the group once
        if (!fresh && !divided) {
          divided = true;
          const div = document.createElement('p');
          div.className = 'wiz-legacy-div';
          div.textContent = 'Legacy — for editing existing scenarios';
          grid.appendChild(div);
        }
        const has = !!t.wizard;
        const pickable = has || fresh;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'wiz-typecard' + (t.id === chosen.id ? ' is-on' : '') + (pickable ? '' : ' is-off');
        card.disabled = !pickable;
        const tag = has ? (t.wizard.tagline || t.wizard.intro || '')
                  : fresh ? (t.blurb || '')
                  : 'Guided setup isn’t ready for this type yet.';
        card.innerHTML = `<span class="ic"><i class="fa-solid ${esc(t.icon || 'fa-cube')}"></i></span>
          <span class="tx"><span class="nm">${esc(t.label)}${fresh ? '' : '<span class="wiz-lgc">Legacy</span>'}</span>
          <span class="tg">${esc(tag)}</span></span>
          ${t.id === chosen.id ? '<span class="ck"><i class="fa-solid fa-circle-check"></i></span>' : ''}`;
        if (has) card.addEventListener('click', () => {
          if (t.id !== chosen.id) loadChosen(t);
          lastTemplate = t;
          renderAll();
        });
        else if (fresh) card.addEventListener('click', () => {
          // No interview spec — the Universal editor IS the starting point
          // (template gallery inside). Same reload-with-?type= move the shell's
          // own type switching uses.
          if ((gen.running || outlining) && !confirm('Generation is still running — leave anyway?')) return;
          location.href = 'scenario-editor/index.html?type=' + encodeURIComponent(t.id);
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    /* Basic / Advanced — how much of the interview the designer answers
       themselves. Remembered with the rest of this type's intake. */
    /* `labelled: false` when the step heading already asks the question — otherwise
       the standalone version of this step says "How do you want to start?" twice,
       once as the title and once as the picker's own label. */
    function renderModePicker(body, opts) {
      const modes = document.createElement('div');
      modes.className = 'wiz-chips wiz-modes';
      modes.innerHTML = (opts && opts.labelled === false)
        ? '' : '<span class="wiz-chips-label">How do you want to start?</span>';
      const mrow = document.createElement('div');
      mrow.className = 'row';
      [{ id: 'basic', ic: 'fa-bolt', t: 'Basic — we draft it for you',
         d: 'Describe it in a sentence. We draft every field for you to review and edit.' },
       { id: 'advanced', ic: 'fa-sliders', t: 'Advanced — fill it in yourself',
         d: 'Answer every question yourself. Best when you already know the story.' }]
      .forEach((m) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wiz-chip' + (mode() === m.id ? ' is-on' : '');
        b.innerHTML = `<span class="t"><i class="fa-solid ${m.ic}"></i> ${esc(m.t)}</span><span class="d">${esc(m.d)}</span>`;
        b.addEventListener('click', () => {
          if (mode() === m.id) return;
          modeChoice = m.id;   // session choice — next open starts on Basic again
          renderAll();         // the step rail changes shape with the mode
        });
        mrow.appendChild(b);
      });
      modes.appendChild(mrow);
      body.appendChild(modes);
    }

    /* the Templates / Custom toggle — a PURE view switch over step 0. It never
       navigates on its own (that made the same control behave two ways — panel
       on render, jump on tap — and re-toggling would leap a page). Forward is
       always the footer's Next, or clicking the option itself. Custom is still
       the shortest path: its one card is pre-selected, so Next alone reaches the
       interview — one click, fewer than the Templates pick-then-Next. Both keep
       `chosen` in sync: Custom == the Mix & Match composer; Templates restores
       the author's last shape. */
    function selectTypeTab(id) {
      if (id === typeTab) return;
      typeTab = id;
      const next = (id === 'custom') ? customType
        : ((lastTemplate && lastTemplate.wizard) ? lastTemplate : templateTypes.find((t) => t && t.wizard));
      if (next && chosen.id !== next.id) loadChosen(next);
      renderAll();   // stays on step 0 — the toggle only swaps the panel
    }

    /* ---- field renderers ---- */
    function fieldEl(f) {
      if (f.showIf && !f.showIf(intake)) return null;

      if (f.kind === 'chips') {
        const wrap = document.createElement('div');
        wrap.className = 'wiz-chips';
        wrap.innerHTML = `<span class="wiz-chips-label">${esc(val(f.label, intake))}</span>`;
        const row = document.createElement('div');
        row.className = 'row';
        if (intake[f.key] == null) intake[f.key] = val(f.default, intake);
        f.options.forEach((o) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'wiz-chip' + (intake[f.key] === o.value ? ' is-on' : '');
          b.innerHTML = `<span class="t">${esc(o.label)}</span>${o.desc ? `<span class="d">${esc(o.desc)}</span>` : ''}`;
          b.addEventListener('click', () => {
            intake[f.key] = o.value;
            if (spec.derive) spec.derive(intake);
            persistIntake();
            renderBody();   // chips can change derived fields / showIf — re-render the step
          });
          row.appendChild(b);
        });
        wrap.appendChild(row);
        return wrap;
      }

      if (f.kind === 'toggle') {
        const cb = document.createElement('vaadin-checkbox');
        cb.label = val(f.label, intake);
        if (intake[f.key] == null) intake[f.key] = !!val(f.default, intake);
        cb.checked = !!intake[f.key];
        const onT = () => {
          if (!!intake[f.key] === !!cb.checked) return;
          intake[f.key] = !!cb.checked;
          if (spec.derive) spec.derive(intake);
          persistIntake();
          renderBody();     // toggles gate showIf fields — re-render the step
        };
        cb.addEventListener('change', onT);
        cb.addEventListener('checked-changed', onT);
        return cb;
      }

      if (f.kind === 'source') {
        // Paste-anything box + a plain-text file drop. PPT/Docs can't be parsed
        // in a static page — the drop zone hint teaches the copy-out path.
        const wrap = document.createElement('div');
        wrap.className = 'wiz-source';
        const ta = document.createElement('vaadin-text-area');
        ta.setAttribute('theme', 'outlined');
        ta.label = val(f.label, intake);
        ta.helperText = val(f.helper, intake) || '';
        ta.placeholder = f.placeholder || '';
        ta.minRows = f.minRows || 6;
        ta.value = String(intake[f.key] ?? '');
        ta.addEventListener('input', () => { intake[f.key] = ta.value; persistIntake(); renderMeta(); });
        const drop = document.createElement('div');
        drop.className = 'wiz-drop';
        drop.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i><span><b>Drop a .txt or .md file</b>, or click to pick one. From PowerPoint, copy the outline (View → Outline) and paste above.</span>';
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = '.txt,.md,.markdown,text/plain,text/markdown';
        file.hidden = true;
        const readFile = (fl) => {
          if (!fl) return;
          const reader = new FileReader();
          reader.onload = () => {
            const text = String(reader.result || '');
            intake[f.key] = (intake[f.key] ? intake[f.key] + '\n\n' : '') + text;
            ta.value = intake[f.key];
            persistIntake();
            renderMeta();
          };
          reader.readAsText(fl);
        };
        drop.addEventListener('click', () => file.click());
        file.addEventListener('change', () => { readFile(file.files && file.files[0]); file.value = ''; });
        ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
        drop.addEventListener('drop', (e) => readFile(e.dataTransfer.files && e.dataTransfer.files[0]));
        const meta = document.createElement('div');
        meta.className = 'wiz-srcmeta';
        const renderMeta = () => {
          const n = String(intake[f.key] || '').length;
          meta.innerHTML = n ? `<b><i class="fa-solid fa-circle-check"></i></b> ${n.toLocaleString()} characters captured.` : 'Optional — the draft works fine without it.';
        };
        renderMeta();
        wrap.append(ta, drop, file, meta);
        return wrap;
      }

      /* text / area / lines */
      const el = document.createElement(f.kind === 'text' ? 'vaadin-text-field' : 'vaadin-text-area');
      el.setAttribute('theme', 'outlined');
      el.label = val(f.label, intake);
      const helper = val(f.helper, intake);
      if (helper) el.helperText = helper;
      if (f.placeholder) el.placeholder = f.placeholder;
      if (f.kind !== 'text') el.minRows = f.minRows || (f.kind === 'lines' ? 4 : 3);
      el.value = String(intake[f.key] ?? '');
      el.dataset.wizKey = f.key;
      el.addEventListener('input', () => { intake[f.key] = el.value; persistIntake(); });
      el.addEventListener('change', () => { intake[f.key] = el.value; persistIntake(); });
      return el;
    }

    /* ---- intake step body ---- */
    function renderIntakeStep(step) {
      const body = $w('#wizBody');
      // In BASIC mode the interview steps arrive pre-filled — say so once per step.
      const drafted = mode() === 'basic' && intake._outlined && step.id !== '__describe';
      body.innerHTML = `<h2 class="wiz-step-title">${esc(step.title)}</h2>
        <p class="wiz-step-sub">${esc(val(step.sub, intake) || '')}</p>` +
        (drafted ? `<span class="wiz-ai-pill"><i class="fa-solid fa-wand-magic-sparkles"></i> Drafted from your description. Edit anything — nothing’s final yet.
          <button type="button" class="wiz-pill-btn" id="wizJumpDescribe"><i class="fa-solid fa-rotate-left"></i> Add context &amp; redraft</button></span>` : '');
      const box = document.createElement('div');
      box.className = 'wiz-fields';
      step.fields.forEach((f) => {
        const el = fieldEl(f);
        if (el) box.appendChild(el);
      });
      // Outline failure lands HERE (not on a step the designer can't reach):
      // the error plus the Worker URL, so a bad proxy is fixable in place.
      if (step.id === '__describe' && outlineErr) {
        const err = document.createElement('div');
        err.className = 'wiz-outline-err';
        err.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>The outline draft failed: ${esc(outlineErr)}</span>`;
        const wf = document.createElement('vaadin-text-field');
        wf.setAttribute('theme', 'outlined');
        wf.label = 'Worker proxy URL';
        wf.helperText = 'The same Cloudflare Worker the playtest uses. Fix it if that’s the problem, then Create outline again.';
        wf.value = localStorage.getItem(ctx.workerUrlKey) || DEFAULT_WORKER;
        wf.addEventListener('input', () => { try { localStorage.setItem(ctx.workerUrlKey, wf.value.trim() || DEFAULT_WORKER); } catch (e) { /* storage best-effort */ } });
        box.append(err, wf);
      }
      body.appendChild(box);

      // The drafted pill's escape hatch — straight back to the description,
      // cursor ready, so "add a bit more context and redraft" is one click.
      const jump = $w('#wizJumpDescribe');
      if (jump) jump.addEventListener('click', () => {
        stepIdx = Math.max(1, steps().findIndex((s) => s.id === '__describe'));
        renderAll();
        const el = Array.from(overlay.querySelectorAll('vaadin-text-area')).find((n) => n.dataset.wizKey === 'describe');
        if (el && el.focus) el.focus();
      });
      // Editing the description flips the footer's primary to Redraft the
      // moment it drifts from what the outline was drafted from.
      if (step.id === '__describe' && intake._outlined) {
        const d = Array.from(box.querySelectorAll('vaadin-text-area')).find((n) => n.dataset.wizKey === 'describe');
        if (d) d.addEventListener('input', renderFoot);
      }
    }

    /* Required-field gate: on Next, focus the first missing one. */
    function firstMissing(step) {
      return (step.fields || []).find((f) => {
        if (!f.required) return false;
        if (f.showIf && !f.showIf(intake)) return false;
        return !String(intake[f.key] ?? '').trim();
      }) || null;
    }

    /* ---- BASIC mode: the outline pass ---------------------------------------
       ONE model call that answers the spec's whole interview from the
       designer's description. Built GENERICALLY: the spec's own field labels
       and helpers ARE the questions, so every type (and every future spec
       change) is covered with no per-type outline prompt. The result lands in
       `intake` under the same keys the advanced fields edit. */
    function buildOutlineReq() {
      if (spec.derive) spec.derive(intake);   // helpers may read derived defaults (e.g. suggested turn counts)
      const fs = seedableFields();
      const skel = '{ ' + fs.map((f) => {
        if (f.kind === 'chips') return `"${f.key}": ${f.options.map((o) => JSON.stringify(o.value)).join(' | ')}`;
        if (f.kind === 'toggle') return `"${f.key}": true | false`;
        if (f.kind === 'lines') return `"${f.key}": ["…", "…"]`;
        return `"${f.key}": "…"`;
      }).join(', ') + ' }';
      const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
      const notes = fs.map((f) => {
        let kind = 'a few plain sentences';
        if (f.kind === 'text') kind = 'one short line';
        if (f.kind === 'lines') kind = 'array of strings, each entry one list item';
        if (f.kind === 'toggle') kind = 'true or false';
        if (f.kind === 'chips') kind = 'exactly one of: ' + f.options.map((o) => JSON.stringify(o.value) + ' (' + oneLine(o.label + (o.desc ? ' — ' + o.desc : '')) + ')').join(', ');
        const helper = oneLine(val(f.helper, intake));
        return `- "${f.key}" (${kind}): ${oneLine(val(f.label, intake))}${helper ? ' · ' + helper : ''}${f.required ? '' : ' · optional — "" if the description gives you no basis'}`;
      }).join('\n');

      const system = `You are an expert learning-experience designer for Aithera's "${chosen.label}" format — ${oneLine(spec.tagline || spec.intro || '')} A learning content developer described what they want instead of filling in the full design interview. Draft the COMPLETE interview on their behalf: an opinionated, specific first pass they will review and edit before the scenario itself is generated.

HOW TO ANSWER
- Write as the developer would: plain language, concrete, committed — like briefing a colleague. No meta-commentary, no hedging between options; pick one strong take per question.
- Ground every answer in the description (and source material, if any). Where they're silent, choose what a seasoned designer would for this kind of training, and keep all answers consistent with each other — same names, same setting, same stakes.
- Invent plausible texture (names, places, small details) freely; NEVER invent laws, statistics, or policy specifics that aren't in the description, the source, or common knowledge.
- Keep it tight: prose answers 1-4 sentences; list fields 3-5 entries; the whole object must stay well under the length cap.

THE INTERVIEW — answer every key, in this order:
${notes}

OUTPUT — return ONLY one JSON object with exactly these keys:
${skel}
No markdown fences, no commentary — start with { and end with }. Never emit a raw line break inside a string; escape paragraph breaks as \\n\\n.`;

      const src = String(intake.sourceText || '').trim();
      const user = `THE DEVELOPER'S DESCRIPTION (everything they gave you):\n"""\n${String(intake.describe || '').trim()}\n"""\n\n`
        + (src ? `SOURCE MATERIAL (pasted by the developer — mine it for specifics, echo its facts, never contradict it):\n"""\n${src.length > 6000 ? src.slice(0, 6000) + '\n[…source trimmed for length…]' : src}\n"""` : 'SOURCE MATERIAL: none pasted — the description is all you have.')
        + '\n\nDraft the complete interview JSON now.';

      return { system, user, maxTokens: 2000 };
    }

    /* Outline JSON -> intake, coerced per field kind so the advanced fields
       render it exactly as if the designer had typed it. */
    function applyOutline(json) {
      seedableFields().forEach((f) => {
        if (!(f.key in json)) return;
        let v = json[f.key];
        if (f.kind === 'toggle') v = (v === true || v === 'true');
        else if (f.kind === 'chips') {
          const hit = (f.options || []).find((o) => o.value === v || String(o.value) === String(v));
          if (!hit) return;   // unrecognized pick — leave the field to its default
          v = hit.value;
        }
        else if (f.kind === 'lines') v = Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean).join('\n') : String(v ?? '').trim();
        else v = String(v ?? '').trim();
        intake[f.key] = v;
      });
      if (spec.derive) spec.derive(intake);
      persistIntake();
    }

    async function runOutline() {
      if (outlining) return;
      const missing = firstMissing(describeStep);
      if (missing) {
        ctx.toast('Add a description first — one sentence is enough.');
        const el = Array.from(overlay.querySelectorAll('vaadin-text-field,vaadin-text-area')).find((n) => n.dataset.wizKey === missing.key);
        if (el && el.focus) el.focus();
        return;
      }
      // Overwrite protection: a first draft only warns when answers were
      // typed by hand (in Advanced); a REDRAFT only warns when the designer
      // edited the drafted answers. Enrich-description-and-redraft — the
      // intended iteration loop — never nags.
      const edited = intake._outlined
        ? (intake._outlineSig != null && outlineSig() !== intake._outlineSig)
        : hasInterviewAnswers();
      if (edited && !confirm(intake._outlined
        ? 'Redraft the outline? Your hand-edits to the drafted fields will be rewritten.'
        : 'Create the outline from your description? The fields you already filled in will be rewritten.')) return;
      outlineErr = '';
      outlining = true;
      renderFoot();
      try {
        const workerUrl = localStorage.getItem(ctx.workerUrlKey) || DEFAULT_WORKER;
        const json = await generateJson(workerUrl, buildOutlineReq());
        applyOutline(json);
        intake._outlined = true;
        intake._outlinedFrom = String(intake.describe || '').trim();   // Redraft turns primary when this drifts
        intake._outlineSig = outlineSig();                             // hand-edits after this point re-arm the confirm
        persistIntake();
        outlining = false;
        stepIdx = 2;   // land on the first interview step (0 = type, 1 = describe)
        renderAll();
        ctx.toast('Outline drafted. Edit any field, then generate the full scenario.');
      } catch (err) {
        outlining = false;
        outlineErr = String((err && err.message) || err);
        renderAll();
      }
    }

    /* ---- generation step body ---- */
    function renderGenerateStep() {
      if (spec.derive) spec.derive(intake);
      gen.tasks = spec.plan(intake, chosen);
      const body = $w('#wizBody');
      const savedUrl = localStorage.getItem(ctx.workerUrlKey) || DEFAULT_WORKER;
      body.innerHTML = `
        <h2 class="wiz-step-title">Generate the draft</h2>
        <p class="wiz-step-sub">${gen.tasks.length} steps turn your answers into the full scenario. It lands in the editor as a draft — review it, then playtest and publish.</p>
        <div class="wiz-fields" style="margin-top:16px">
          <vaadin-text-field theme="outlined" id="wizWorker" label="Worker proxy URL" value="${esc(savedUrl)}"
            helper-text="The same Cloudflare Worker the playtest and live pages use. Model: ${esc(MODEL)}."></vaadin-text-field>
        </div>
        <div class="wiz-gen" id="wizGen"></div>
        <div class="wiz-note"><i class="fa-solid fa-shield-halved"></i><span>This is a <b>first draft</b> — check the guardrails and playtest before publishing. Your current draft is saved to the Library first.</span></div>`;
      renderTasks();
    }

    function renderTasks() {
      const box = $w('#wizGen');
      if (!box) return;
      box.innerHTML = gen.tasks.map((t) => {
        const st = gen.status[t.id] || { state: 'idle' };
        const icon = st.state === 'run' ? '<i class="fa-solid fa-spinner"></i>'
          : st.state === 'ok' ? '<i class="fa-solid fa-check"></i>'
          : st.state === 'fail' ? '<i class="fa-solid fa-xmark"></i>'
          : '<i class="fa-regular fa-circle"></i>';
        return `<div class="wiz-task ${st.state}" data-task="${esc(t.id)}">
          <span class="st">${icon}</span>
          <span class="tx">
            <span class="tl">${esc(t.label)}</span>
            ${st.note ? `<div class="td">${esc(st.note)}</div>` : (t.detail ? `<div class="td">${esc(t.detail)}</div>` : '')}
            ${st.error ? `<div class="terr">${esc(st.error)}</div>` : ''}
          </span>
        </div>`;
      }).join('');
    }

    async function runGeneration() {
      if (gen.running) return;
      const workerUrl = ($w('#wizWorker') ? $w('#wizWorker').value : '').trim() || DEFAULT_WORKER;
      localStorage.setItem(ctx.workerUrlKey, workerUrl);   // shared with the playtest
      gen.running = true;
      renderFoot();
      // First run (not a resume): start from the type's complete blank skeleton.
      if (!gen.draft) gen.draft = spec.start(chosen);
      for (const t of gen.tasks) {
        const st = gen.status[t.id] || {};
        if (st.state === 'ok') continue;   // resume: keep what already landed
        gen.status[t.id] = { state: 'run' };
        renderTasks();
        try {
          const req = t.build(intake, gen.acc, chosen);
          const json = await generateJson(workerUrl, req);
          gen.acc.results[t.id] = json;
          t.apply(json, gen.draft, intake, gen.acc);
          gen.status[t.id] = { state: 'ok', note: t.doneNote ? t.doneNote(json) : '' };
        } catch (err) {
          gen.status[t.id] = { state: 'fail', error: String(err && err.message || err) + ' — fix the Worker URL if needed, then Resume.' };
          renderTasks();
          break;   // later tasks depend on earlier results — stop and offer Resume
        }
        renderTasks();
      }
      gen.running = false;
      gen.done = gen.tasks.every((t) => (gen.status[t.id] || {}).state === 'ok');
      renderFoot();
    }

    function landDraft() {
      if (!gen.done || !gen.draft) return;
      const normalized = chosen.normalize(gen.draft);
      try { localStorage.removeItem(intakeKey); } catch (e) { /* nothing to clean */ }

      // Same type as the open studio → land in place, like always.
      if (ctx.type && chosen.id === ctx.type.id) {
        ctx.replaceScenario(normalized);
        ctx.toast(spec.landNote ? spec.landNote(intake) : 'Draft generated — review it, then playtest.');
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        return;
      }

      // CROSS-TYPE landing: write the draft into the CHOSEN type's own slot
      // (each type has its own draft/published/library), snapshotting that
      // type's existing draft to its Library first, then reload the studio
      // into the chosen mode — it boots straight into the new draft.
      try {
        const prevRaw = localStorage.getItem(chosen.store.keys.draft);
        if (prevRaw) {
          const prev = JSON.parse(prevRaw);
          if (prev && typeof prev === 'object') chosen.store.saveToLibrary(prev);
        }
      } catch (e) { /* snapshot is best-effort */ }
      localStorage.setItem(chosen.store.keys.draft, JSON.stringify(normalized));
      location.search = '?type=' + encodeURIComponent(chosen.id);
    }

    /* ---- footer ---- */
    function renderFoot() {
      const foot = $w('#wizFoot');
      const stepList = steps();
      const isGen = stepList[stepIdx].id === '__generate';
      const isDescribe = stepList[stepIdx].id === '__describe';
      foot.innerHTML = '';

      const back = document.createElement('button');
      back.className = 'wiz-btn';
      back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
      back.disabled = stepIdx === 0 || gen.running || outlining;
      back.addEventListener('click', () => { stepIdx -= 1; renderAll(); });

      const spacer = document.createElement('span');
      spacer.className = 'spacer';
      foot.append(back, spacer);

      if (isDescribe) {
        /* BASIC mode's pivot: before the outline exists, the ONLY way
           forward is Create outline; after it lands, forward is the normal
           pre-filled interview, with an explicit Redraft escape hatch. */
        const changed = intake._outlined && describeChanged();
        const note = document.createElement('span');
        note.className = 'wiz-reqnote';
        note.textContent = changed
          ? 'Description changed — Redraft rewrites every field from it.'
          : intake._outlined
            ? 'Redrafting rewrites every field from your description.'
            : 'We draft every field for you to review before anything is generated.';
        foot.append(note);
        const spin = '<i class="fa-solid fa-spinner" style="animation:wiz-spin 1s linear infinite"></i>';
        if (intake._outlined) {
          // A drifted description makes Redraft the obvious (primary) move.
          const re = document.createElement('button');
          re.className = 'wiz-btn' + (changed ? ' primary' : '');
          re.disabled = outlining;
          re.innerHTML = outlining ? spin + ' Redrafting…' : '<i class="fa-solid fa-rotate-right"></i> Redraft outline';
          re.addEventListener('click', runOutline);
          const next = document.createElement('button');
          next.className = 'wiz-btn' + (changed ? '' : ' primary');
          next.disabled = outlining;
          next.innerHTML = `Next: ${esc(stepList[stepIdx + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
          next.addEventListener('click', () => { stepIdx += 1; renderAll(); });
          foot.append(re, next);
        } else {
          const go = document.createElement('button');
          go.className = 'wiz-btn primary';
          go.disabled = outlining;
          go.innerHTML = outlining ? spin + ' Drafting the outline…' : '<i class="fa-solid fa-wand-magic-sparkles"></i> Create outline';
          go.addEventListener('click', runOutline);
          foot.append(go);
        }
      } else if (!isGen) {
        const note = document.createElement('span');
        note.className = 'wiz-reqnote';
        note.textContent = 'Answers save as you type — closing loses nothing.';
        const next = document.createElement('button');
        next.className = 'wiz-btn primary';
        next.innerHTML = `Next: ${esc(stepList[stepIdx + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
        next.addEventListener('click', () => {
          const missing = firstMissing(steps()[stepIdx]);
          if (missing) {
            ctx.toast(`“${val(missing.label, intake)}” is required.`);
            const el = overlay.querySelector(`[data-wiz-key="${missing.key}"], [data-wizKey="${missing.key}"]`) ||
                       Array.from(overlay.querySelectorAll('vaadin-text-field,vaadin-text-area')).find((n) => n.dataset.wizKey === missing.key);
            if (el && el.focus) el.focus();
            return;
          }
          stepIdx += 1;
          renderAll();
        });
        foot.append(note, next);
      } else if (!gen.done) {
        const failed = gen.tasks.some((t) => (gen.status[t.id] || {}).state === 'fail');
        const run = document.createElement('button');
        run.className = 'wiz-btn primary';
        run.disabled = gen.running;
        run.innerHTML = gen.running
          ? '<i class="fa-solid fa-spinner" style="animation:wiz-spin 1s linear infinite"></i> Generating…'
          : (failed ? '<i class="fa-solid fa-rotate-right"></i> Resume generation' : '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate the scenario');
        run.addEventListener('click', runGeneration);
        foot.append(run);
      } else {
        const openBtn = document.createElement('button');
        openBtn.className = 'wiz-btn primary';
        openBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Open it in the editor';
        openBtn.addEventListener('click', landDraft);
        foot.append(openBtn);
      }
    }

    function renderBody() {
      const step = steps()[stepIdx];
      if (spec.derive) spec.derive(intake);
      if (step.id === '__type') renderTypeStep();
      else if (step.id === '__generate') renderGenerateStep();
      else renderIntakeStep(step);
    }

    function renderAll() {
      // The header names the CHOSEN build, so switching types re-labels it.
      const t = $w('#wizTitle'); if (t) t.textContent = spec.title;
      const s = $w('#wizSub'); if (s) s.textContent = spec.intro || '';
      renderSteps();
      renderBody();
      renderFoot();
      $w('#wizBody').scrollTop = 0;
    }

    renderAll();
    return { close };
  }

  window.AitheraStudioWizard = { open, DEFAULT_WORKER, MODEL };
})();
