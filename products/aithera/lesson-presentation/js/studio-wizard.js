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
     }
   FieldDef: { key, kind: text|area|lines|chips|toggle|source, label,
               helper|placeholder|minRows|options|default, required,
               showIf(intake) } — helper/label may be fn(intake).
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
    const type = ctx.type;
    const spec = type.wizard;
    if (!spec) return null;

    const intakeKey = `aithera.writerStudio.wizard.${type.id}.v1`;

    /* intake: restore a half-finished interview from this browser */
    let intake = {};
    try { intake = JSON.parse(localStorage.getItem(intakeKey)) || {}; } catch (e) { intake = {}; }
    const persistIntake = () => { try { localStorage.setItem(intakeKey, JSON.stringify(intake)); } catch (e) { /* full/blocked storage is fine */ } };

    /* generation state */
    const gen = { running: false, done: false, draft: null, acc: { results: {} }, tasks: [], status: {} };

    let stepIdx = 0;
    const steps = spec.steps.concat([{ id: '__generate', title: 'Generate', sub: '' }]);

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
            <span class="wiz-title">${esc(spec.title)}</span><br>
            <span class="wiz-sub">${esc(spec.intro || '')}</span>
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
      if (gen.running && !confirm('Generation is still running — close anyway?')) return;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $w('#wizClose').addEventListener('click', close);

    /* ---- step rail ---- */
    function renderSteps() {
      $w('#wizSteps').innerHTML = steps.map((s, i) =>
        `<span class="wiz-step${i === stepIdx ? ' is-active' : ''}${i < stepIdx ? ' is-done' : ''}">
          <span class="n">${i < stepIdx ? '<i class="fa-solid fa-check"></i>' : i + 1}</span> ${esc(s.title)}</span>`).join('');
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
          meta.innerHTML = n ? `<b><i class="fa-solid fa-circle-check"></i></b> ${n.toLocaleString()} characters of source material captured.` : 'Nothing pasted yet — the draft still works from your interview answers alone.';
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
      body.innerHTML = `<h2 class="wiz-step-title">${esc(step.title)}</h2>
        <p class="wiz-step-sub">${esc(val(step.sub, intake) || '')}</p>`;
      const box = document.createElement('div');
      box.className = 'wiz-fields';
      step.fields.forEach((f) => {
        const el = fieldEl(f);
        if (el) box.appendChild(el);
      });
      body.appendChild(box);
    }

    /* Required-field gate: on Next, focus the first missing one. */
    function firstMissing(step) {
      return (step.fields || []).find((f) => {
        if (!f.required) return false;
        if (f.showIf && !f.showIf(intake)) return false;
        return !String(intake[f.key] ?? '').trim();
      }) || null;
    }

    /* ---- generation step body ---- */
    function renderGenerateStep() {
      if (spec.derive) spec.derive(intake);
      gen.tasks = spec.plan(intake, type);
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
      if (!gen.draft) gen.draft = spec.start(type);
      for (const t of gen.tasks) {
        const st = gen.status[t.id] || {};
        if (st.state === 'ok') continue;   // resume: keep what already landed
        gen.status[t.id] = { state: 'run' };
        renderTasks();
        try {
          const req = t.build(intake, gen.acc, type);
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
      ctx.replaceScenario(type.normalize(gen.draft));
      try { localStorage.removeItem(intakeKey); } catch (e) { /* nothing to clean */ }
      ctx.toast(spec.landNote ? spec.landNote(intake) : 'Draft generated — review it section by section, then playtest.');
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }

    /* ---- footer ---- */
    function renderFoot() {
      const foot = $w('#wizFoot');
      const isGen = steps[stepIdx].id === '__generate';
      foot.innerHTML = '';

      const back = document.createElement('button');
      back.className = 'wiz-btn';
      back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
      back.disabled = stepIdx === 0 || gen.running;
      back.addEventListener('click', () => { stepIdx -= 1; renderAll(); });

      const spacer = document.createElement('span');
      spacer.className = 'spacer';
      foot.append(back, spacer);

      if (!isGen) {
        const note = document.createElement('span');
        note.className = 'wiz-reqnote';
        note.textContent = 'Answers save as you type — closing loses nothing.';
        const next = document.createElement('button');
        next.className = 'wiz-btn primary';
        next.innerHTML = `Next: ${esc(steps[stepIdx + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
        next.addEventListener('click', () => {
          const missing = firstMissing(steps[stepIdx]);
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
      const step = steps[stepIdx];
      if (spec.derive) spec.derive(intake);
      if (step.id === '__generate') renderGenerateStep();
      else renderIntakeStep(step);
    }

    function renderAll() {
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
