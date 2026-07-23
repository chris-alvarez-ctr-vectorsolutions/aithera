/* =========================================================================
   AITHERA WRITER STUDIO — "START FROM SCRATCH" WIZARD (generic engine)
   Loaded ONLY by writer-studio-v2.html. Turns a scenario type's `wizard`
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

   TWO INTAKE MODES, chosen on step 0 and remembered per type:
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
     (tracked by `_outlineSig`). The intake keys `describe`, `_mode`,
     `_outlined`, `_outlinedFrom` and `_outlineSig` are reserved for this.
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
    const registry = (window.AitheraStudio && window.AitheraStudio.list) ? window.AitheraStudio.list() : [ctx.type];
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
        sub: 'The one question that matters. A sentence is enough — “Create outline” drafts every field that follows for your review. The more you give it (audience, the real story, must-knows, tone), the truer the draft.',
        fields: [
          { key: 'describe', kind: 'area', required: true, minRows: 5,
            label: 'Describe the scenario simulation you want to build',
            placeholder: t.wizard.describePlaceholder || 'The topic, who it’s for, and anything else that matters…',
            helper: 'Minimum one sentence — everything else can be drafted. More context here means fewer edits later.' },
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

    /* BASIC unless chosen otherwise — but an interview already in progress
       from before this mode existed keeps the classic flow (its steps would
       otherwise vanish behind an un-clicked "Create outline"). */
    const mode = () => (intake._mode === 'advanced' || intake._mode === 'basic') ? intake._mode
      : (intake._outlined || !hasInterviewAnswers()) ? 'basic' : 'advanced';

    let stepIdx = 0;
    // Step 0 is the type choice; the rest belong to the CHOSEN spec.
    // BASIC mode swaps the spec's steps for the describe step until the
    // outline lands — then they open, pre-filled, between the two.
    const steps = () => {
      const head = [{ id: '__type', title: 'What are you building?', sub: '' }];
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

    /* ---- step 0: the type chooser ---- */
    function renderTypeStep() {
      const body = $w('#wizBody');
      body.innerHTML = `<h2 class="wiz-step-title">What are you building?</h2>
        <p class="wiz-step-sub">Pick the core interaction — the questions and the generated draft are shaped by it, just like the editor's interaction templates. Each choice keeps its own saved answers, so switching loses nothing.</p>`;
      const grid = document.createElement('div');
      grid.className = 'wiz-types';
      registry.forEach((t) => {
        if (!t) return;
        const has = !!t.wizard;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'wiz-typecard' + (t.id === chosen.id ? ' is-on' : '') + (has ? '' : ' is-off');
        card.disabled = !has;
        card.innerHTML = `<span class="ic"><i class="fa-solid ${esc(t.icon || 'fa-cube')}"></i></span>
          <span class="tx"><span class="nm">${esc(t.label)}</span>
          <span class="tg">${esc(has ? (t.wizard.tagline || t.wizard.intro || '') : 'Guided setup isn’t built for this mode yet.')}</span></span>
          ${t.id === chosen.id ? '<span class="ck"><i class="fa-solid fa-circle-check"></i></span>' : ''}`;
        if (has) card.addEventListener('click', () => {
          if (t.id !== chosen.id) loadChosen(t);
          renderAll();
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);

      /* Basic / Advanced — how much of the interview the designer answers
         themselves. Remembered with the rest of this type's intake. */
      const modes = document.createElement('div');
      modes.className = 'wiz-chips wiz-modes';
      modes.innerHTML = '<span class="wiz-chips-label">How do you want to start?</span>';
      const mrow = document.createElement('div');
      mrow.className = 'row';
      [{ id: 'basic', ic: 'fa-bolt', t: 'Basic — describe it, we draft the outline',
         d: 'One sentence minimum. “Create outline” fills every field for you — you review and edit before anything is generated.' },
       { id: 'advanced', ic: 'fa-sliders', t: 'Advanced — fill it in yourself',
         d: 'Answer every design question yourself, brief-a-colleague style. Best when you already know the story, the misconceptions and the bar.' }]
      .forEach((m) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wiz-chip' + (mode() === m.id ? ' is-on' : '');
        b.innerHTML = `<span class="t"><i class="fa-solid ${m.ic}"></i> ${esc(m.t)}</span><span class="d">${esc(m.d)}</span>`;
        b.addEventListener('click', () => {
          if (mode() === m.id) return;
          intake._mode = m.id;
          persistIntake();
          renderAll();   // the step rail changes shape with the mode
        });
        mrow.appendChild(b);
      });
      modes.appendChild(mrow);
      body.appendChild(modes);
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
        drop.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i><span><b>Drop a .txt / .md file</b> or click to pick one. From PowerPoint: View → Outline, select all, copy — then paste above.</span>';
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
          meta.innerHTML = n ? `<b><i class="fa-solid fa-circle-check"></i></b> ${n.toLocaleString()} characters of source material captured.` : 'Nothing pasted yet — the draft still works from your answers alone.';
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
        (drafted ? `<span class="wiz-ai-pill"><i class="fa-solid fa-wand-magic-sparkles"></i> Drafted from your description — edit anything; nothing is final until Generate.
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
        ctx.toast('Describe the scenario simulation first — one sentence is enough.');
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
        intake._mode = 'basic';   // pre-filled answers must not flip the default back to advanced
        intake._outlinedFrom = String(intake.describe || '').trim();   // Redraft turns primary when this drifts
        intake._outlineSig = outlineSig();                             // hand-edits after this point re-arm the confirm
        persistIntake();
        outlining = false;
        stepIdx = 2;   // land on the first interview step (0 = type, 1 = describe)
        renderAll();
        ctx.toast('Outline drafted — every field is editable. The last step still generates the full scenario.');
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
        <p class="wiz-step-sub">${gen.tasks.length} model calls translate your answers into the full scenario — every verbatim coach line, the coaching guidance behind each turn, and the close. It lands in the editor as a normal draft: review it, run the guardrails, playtest it, then publish.</p>
        <div class="wiz-fields" style="margin-top:16px">
          <vaadin-text-field theme="outlined" id="wizWorker" label="Worker proxy URL" value="${esc(savedUrl)}"
            helper-text="The same Cloudflare Worker the playtest and live pages use. Model: ${esc(MODEL)}."></vaadin-text-field>
        </div>
        <div class="wiz-gen" id="wizGen"></div>
        <div class="wiz-note"><i class="fa-solid fa-shield-halved"></i><span>Generated content is a <b>first draft by design</b> — the guardrails tab and a playtest are still the quality gate before publishing. Your current editor draft is snapshotted to the Library before this one lands.</span></div>`;
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
        ctx.toast(spec.landNote ? spec.landNote(intake) : 'Draft generated — review it section by section, then playtest.');
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
          ? 'The description changed — Redraft rewrites every field from it.'
          : intake._outlined
            ? 'Redrafting rewrites every drafted field from the description.'
            : 'One model call drafts every field in the wizard — you review everything before the scenario is generated.';
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
            ctx.toast(`“${val(missing.label, intake)}” is needed before the draft can be generated.`);
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
