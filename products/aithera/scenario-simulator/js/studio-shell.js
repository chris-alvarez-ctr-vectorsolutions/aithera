/* =========================================================================
   AITHERA WRITER STUDIO — SHELL APP LOGIC
   Extracted verbatim from scenario-editor/index.html (was an inline <script>).
   The type-agnostic authoring shell: renders the phase rail, drives the
   type contract (type.sections / renderFields / lints / compile / previewUrl
   / playtest / wizard), and wires publish/export/import + the wizard.
   Vanilla JS, no build step. See js/README.writer-studio.md.
   ========================================================================= */
  /* =======================================================================
     WRITER STUDIO — app logic (vanilla, no framework)
     ======================================================================= */
  'use strict';

  /* ---- which scenario type are we editing? ------------------------------
     The studio is generic: a scenario TYPE (registered into AitheraStudio by
     js/scenario.js, js/scenario-types/*.js) supplies the schema, the form
     sections, the compiler, the lints and the playtest. ?type= picks one;
     absent/unknown falls back to action-practice so old bookmarks keep
     working. Everything below talks to `type`, never to one pedagogy. */
  const TYPE_ID = new URLSearchParams(location.search).get('type');
  /* Resolve ?type=, and NEVER end up with null. The editor no longer loads the
     retired types' modules, so a link someone bookmarked months ago —
     ?type=guided-arc, ?type=scene-sweep, ?type=teach-back — asks for a type that
     is not registered here any more. That used to hand back null and crash on the
     next line, which is a hostile way to retire a format: a blank screen and a
     console error, from a URL that worked yesterday.

     Fall back to the go-forward type, and say so once the UI exists to say it in.
     The old default was 'guided-arc', which is itself now one of the retired
     ones. */
  const RETIRED_TYPE = !!(TYPE_ID && !window.AitheraStudio.get(TYPE_ID));
  const type = window.AitheraStudio.get(TYPE_ID)
    || window.AitheraStudio.list({ goForwardOnly: true })[0]
    || window.AitheraStudio.list()[0];

  /* ---- draft state ------------------------------------------------------ */
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Merge a stored draft over the type's shipped default (the type owns the
  // rules; this is just a thin call so old call-sites read the same).
  function mergeScenario(draft) { return type.merge(draft); }

  /* Did this session boot with nothing — no saved draft, no deep link? That is a
     first visit in this browser, and it is a different situation from opening a
     scenario: there is nothing to lose, and nothing to edit either. Recorded here
     because two places downstream need to know it (the New scenario front door
     below, and snapshotDraft, which must not park an untouched empty document in
     Local drafts as a phantom "(untitled)" entry). */
  let bootedEmpty = false;

  let scenario = (() => {
    // ?example=<id> opens a curated example (e.g. the WPV FINAL "reading-the-warning-signs")
    // straight into the editor. Non-destructive: it becomes the working draft but
    // doesn't touch the saved draft until the author explicitly saves.
    const exId = new URLSearchParams(location.search).get('example');
    const ex = exId && type.EXAMPLES && type.EXAMPLES[exId];
    if (ex) return type.normalize(clone(ex));
    /* READ THE STRING FIRST, and test it. This used to be
       `mergeScenario(JSON.parse(localStorage.getItem(...)))` inside a try/catch
       that fell back to the type's DEFAULT — but with no stored draft
       `getItem` returns null and `JSON.parse(null)` returns null WITHOUT
       throwing, so the catch never ran and merge(null) produced an empty
       document. The intended fallback was dead code for the one case it existed
       for, and a first-time author landed on a blank three-column form with a
       red dot on every section and nothing telling them where to start. */
    let raw = null;
    try { raw = localStorage.getItem(type.store.keys.draft); } catch (e) { raw = null; }
    if (raw) {
      try { return mergeScenario(JSON.parse(raw)); }
      /* A corrupt draft is a real failure and must not silently become a blank
         page either — say so, and hand back an empty document to work in. */
      catch (e) { bootedEmpty = true; return type.normalize(type.blank ? type.blank() : clone(type.DEFAULT)); }
    }
    bootedEmpty = true;
    /* Empty, not DEFAULT. DEFAULT is one of the seven starting templates (Mix &
       Match), fully written demo prose — booting into it hands a first-time
       author someone else's scenario to edit and no way to tell. The New scenario
       panel is the front door instead; it opens itself below. */
    return type.normalize(type.blank ? type.blank() : clone(type.DEFAULT));
  })();

  /* ---- "has anyone actually authored anything yet?" ----------------------
     Asked before a New scenario / template / wizard pick overwrites the draft:
     an in-progress draft gets snapshotted into Local drafts first, an untouched
     starting point does not.

     It has to be measured with the SHELL'S OWN keys set aside. `ensureCtx()`
     writes `contextSource` and `previousLO` into the draft the moment the form
     builds, so a document nobody has typed a character into is already not
     byte-equal to the baseline it booted from. Comparing raw is what parked a
     phantom "(untitled)" snapshot in Local drafts on the first New scenario click
     of every fresh browser.

     Prior-scenario context is still counted as work when it has text in it —
     the shell made the container, the author made the content. */
  const SHELL_OWNED = ['contextSource', 'previousLO'];
  function shellNeutral(doc) {
    const d = clone(doc);
    SHELL_OWNED.forEach((k) => { delete d[k]; });
    return d;
  }
  const UNTOUCHED = (() => {
    const bases = [clone(type.DEFAULT)].concat(type.blank ? [type.blank()] : []);
    return bases.map((b) => { try { return JSON.stringify(shellNeutral(type.normalize(b))); } catch (e) { return null; } })
      .filter(Boolean);
  })();
  function draftIsUntouched() {
    const lo = (scenario && scenario.previousLO) || {};
    if (['title', 'covered', 'handoff'].some((k) => String(lo[k] || '').trim())) return false;
    try { return UNTOUCHED.indexOf(JSON.stringify(shellNeutral(type.normalize(clone(scenario))))) >= 0; }
    catch (e) { return false; }   // can't tell ⇒ assume there is work to protect
  }

  /* How many guardrail ERRORS currently block publishing. Written by the lint
     pass, read by the publish status line. Declared up here with the rest of the
     module state on purpose: `let` in the temporal dead zone throws a confusing
     ReferenceError if a future reordering ever makes the lint pass run before the
     declaration, and the two are far apart in this file. */
  let blockedCount = 0;

  /* ---- tiny helpers ------------------------------------------------------ */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    /* Create missing intermediates rather than throwing. A type may bind to a
       path whose parent is itself optional (an observe exhibit's `facts`), and
       the write only ever happens because the author asked for the row. */
    const target = keys.reduce((o, k) => {
      if (o[k] == null) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---- ask before something irreversible --------------------------------
     NOT window.confirm(). A native dialog is suppressed outright in an
     embedded browser — it returns false without ever prompting — and every
     call site here reads that false as the author's answer. Which way it
     fails depends on how the guard is written: deleting a saved draft did
     nothing at all, while a wizard guard refused to let the author leave.
     Both look like a broken button, and neither leaves a trace.

     So the question is asked in the page, and the answer arrives by callback.
     Uses the same overlay/modal idiom as the export and new-scenario dialogs. */
  window.AitheraConfirm = function askConfirm(opts, onYes) {
    const o = opts || {};
    const overlay = document.createElement('div');
    overlay.className = 'exp-overlay';
    overlay.innerHTML =
      `<div class="exp-modal is-compact ask-modal" role="alertdialog" aria-modal="true">
         <div class="exp-head">
           <div class="exp-titles">
             <div class="exp-title">${esc(o.title || 'Are you sure?')}</div>
             ${o.body ? `<p class="exp-sub">${esc(o.body)}</p>` : ''}
           </div>
         </div>
         <div class="ask-actions">
           <button type="button" class="ask-no">${esc(o.cancelLabel || 'Cancel')}</button>
           <button type="button" class="ask-yes${o.danger ? ' is-danger' : ''}">${esc(o.confirmLabel || 'Continue')}</button>
         </div>
       </div>`;
    const done = (yes) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (yes && typeof onYes === 'function') onYes();
    };
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); done(false); }
      if (e.key === 'Enter' && document.activeElement === $('.ask-yes', overlay)) { e.stopPropagation(); done(true); }
    }
    overlay.addEventListener('click', (e) => { if (e.target === overlay) done(false); });
    $('.ask-no', overlay).addEventListener('click', () => done(false));
    $('.ask-yes', overlay).addEventListener('click', () => done(true));
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    $('.ask-yes', overlay).focus();
  };
  const askConfirm = window.AitheraConfirm;

  /* =======================================================================
     FORM DEFINITION lives in the TYPE now (type.sections + type.renderFields).
     The shell only provides the DOM field-builder helpers below and hands
     them to the type as `studioApi` so a type can render its inputs without
     re-implementing the plumbing.
     ======================================================================= */

  /* Per-section field renderers (generic — used by every type) ------------ */
  function tf(path, label, opts = {}) {
    const el = document.createElement(opts.area ? 'vaadin-text-area' : 'vaadin-text-field');
    el.setAttribute('theme', 'outlined');
    el.label = label;
    if (opts.helper) el.helperText = opts.helper;
    if (opts.placeholder) el.placeholder = opts.placeholder;
    if (opts.minRows) el.minRows = opts.minRows;
    el.value = String(getByPath(scenario, path) ?? '');
    el.dataset.path = path;
    el.addEventListener('input', onField);
    el.addEventListener('change', onField);
    return el;
  }

  /* Collapsed guidance disclosure — the READ layer. The summary line names
     what's inside; the body is a click away instead of pushing the fields
     down the page. */
  function guidance(summaryText, icon, bodyHTML) {
    const d = document.createElement('details');
    d.className = 'bridge';
    d.innerHTML = `<summary><i class="fa-solid ${esc(icon)}" aria-hidden="true"></i>${esc(summaryText)}</summary>
      <div class="bridge-body">${bodyHTML}</div>`;
    return d;
  }

  // makeItem() returns the blank row a type wants when "Add" is clicked, so
  // this helper no longer needs to know any type's list shapes.
  function rowsBlock(listPath, renderRow, addLabel, makeItem) {
    const wrap = document.createElement('div');
    wrap.className = 'rows';
    wrap.dataset.list = listPath;
    /* An OPTIONAL list is simply ABSENT from the draft, not empty — and a type
       binding to one used to take the entire form down with it: getByPath
       returned undefined, .forEach threw, and because the throw escaped
       mid-loop every card after it never got appended. On screen that reads as
       "the steps vanished when I expanded one", which is a long way from the
       actual cause. Absent and empty now render identically, and the array is
       created lazily on Add so a document never carries an empty one it never
       asked for (several formats, v4 among them, treat an empty optional array
       as invalid). */
    const readList = () => {
      const list = getByPath(scenario, listPath);
      return Array.isArray(list) ? list : null;
    };
    const render = () => {
      wrap.innerHTML = '';
      const list = readList() || [];
      list.forEach((item, i) => wrap.appendChild(renderRow(item, i, () => {
        list.splice(i, 1);
        render();
        scheduleUpdate();
      })));
      const add = document.createElement('button');
      add.className = 'addrow';
      add.innerHTML = `<i class="fa-solid fa-plus"></i> ${esc(addLabel)}`;
      add.addEventListener('click', () => {
        let target = readList();
        if (!target) {
          setByPath(scenario, listPath, []);
          target = readList() || [];
        }
        target.push(makeItem ? makeItem() : {});
        render();
        scheduleUpdate();
      });
      wrap.appendChild(add);
    };
    render();
    return wrap;
  }

  /* A NESTED list of plain strings — the points inside a teaching topic, the
     parts of an expert-answer group. Deliberately NOT rowsBlock + rowCard: that
     pair gives every entry its own bordered card, and one level down that reads
     as a card inside a card. What repeats here is a single field, not a record,
     so it gets a field per entry and one shared line of guidance above them.

     Why the helper exists at all: two of these lists were bound as
     `<path>.<index>` with the index hard-coded to 0, which showed the first
     entry and silently hid the rest — 152 authored fields across the eleven
     production documents, invisible and un-editable, and preserved on export so
     nothing ever failed. A type binding a nested string array should reach for
     this instead of an index. */
  function subRows(listPath, itemLabel, addLabel, helper) {
    const wrap = document.createElement('div');
    wrap.className = 'subrows';
    wrap.dataset.list = listPath;
    /* Absent and empty render identically, and the array is created lazily on
       Add — v4 treats an empty optional array as invalid rather than absent. */
    const readList = () => {
      const list = getByPath(scenario, listPath);
      return Array.isArray(list) ? list : null;
    };
    const render = () => {
      wrap.innerHTML = '';
      if (helper) {
        const note = document.createElement('div');
        note.className = 'subrows-help';
        note.textContent = helper;
        wrap.appendChild(note);
      }
      const list = readList() || [];
      list.forEach((_, i) => {
        const row = document.createElement('div');
        row.className = 'subrow';
        /* Numbered only when there is more than one — "Point 1" over a solitary
           field claims a list the author cannot see. */
        row.appendChild(tf(`${listPath}.${i}`, list.length > 1 ? `${itemLabel} ${i + 1}` : itemLabel,
          { area: true, minRows: 2 }));
        /* No remove on the last remaining entry: these lists are `minItems: 1`
           in v4, so emptying one is a load failure, not a cleared field. */
        if (list.length > 1) {
          const del = document.createElement('button');
          del.className = 'subdel';
          del.type = 'button';
          const name = `${itemLabel.toLowerCase()} ${i + 1}`;
          del.title = `Remove ${name}`;
          del.setAttribute('aria-label', `Remove ${name}`);
          del.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
          del.addEventListener('click', () => { list.splice(i, 1); render(); scheduleUpdate(); });
          row.appendChild(del);
        }
        wrap.appendChild(row);
      });
      const add = document.createElement('button');
      add.className = 'addrow addrow-sub';
      add.type = 'button';
      add.innerHTML = `<i class="fa-solid fa-plus"></i> ${esc(addLabel)}`;
      add.addEventListener('click', () => {
        let target = readList();
        if (!target) { setByPath(scenario, listPath, []); target = readList() || []; }
        target.push('');
        render();
        scheduleUpdate();
      });
      wrap.appendChild(add);
    };
    render();
    return wrap;
  }

  function rowCard(title, onDelete, ...fields) {
    const card = document.createElement('div');
    card.className = 'rowcard';
    const head = document.createElement('div');
    head.className = 'rowhead';
    head.innerHTML = `<span>${esc(title)}</span>`;
    /* No handler, no control. A card in a FIXED set has nothing to delete — the
       three quality levels are the engine's vocabulary, not a list an author
       adds to — and rendering the bin anyway offered an action that silently did
       nothing on twelve cards. `addEventListener('click', null)` is legal, which
       is why this went unnoticed. */
    if (typeof onDelete === 'function') {
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Remove';
      del.setAttribute('aria-label', `Remove ${title}`);   // icon-only button needs a real name
      del.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
      del.addEventListener('click', onDelete);
      head.appendChild(del);
    }
    card.appendChild(head);
    fields.forEach((f) => card.appendChild(f));
    return card;
  }

  /* ---- ONE naming scheme for every file this tool hands out ---------------
     Every working-draft export used to be called `scenario.json`. Two scenarios,
     two exports, two files called the same thing — so the second landed in
     Downloads as "scenario (1).json" and nothing on either one said which
     scenario it held or which was newer. Re-exporting after an edit was worse:
     same name again, and the browser silently picks.

     `<slug>-<kind>-<stamp>` fixes all three: the scenario by name, which of the
     two artifacts it is, and when it left. Repeat exports sort chronologically
     and never collide.

     The filename is for PEOPLE. The document carries its own identity inside it
     (`implementation_id`), so nothing downstream should be parsing this — which
     is what makes stamping it safe. Worth knowing, though: the production
     loader resolves a scenario_id from the FILE STEM today, so if a document is
     ever handed to that service directly rather than through the LMS, the stamp
     is the part to drop. */
  function exportStamp() {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
  }
  function exportSlug(scenarioObj) {
    const s2 = scenarioObj || scenario;
    const raw = (s2 && s2.implementation_id)
      || (type.store && type.store.titleOf ? type.store.titleOf(s2) : '')
      || 'scenario';
    const slug = String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    /* A long title makes an unreadable filename; the stamp is what disambiguates,
       so the slug only has to be recognisable. */
    return (slug || 'scenario').slice(0, 48).replace(/-$/, '');
  }
  /* kind: 'draft' | '' — an empty kind is the handoff, whose stem stays as close
     to the scenario id as the stamp allows. */
  function exportName(kind, ext, scenarioObj) {
    const bits = [exportSlug(scenarioObj), kind, exportStamp()].filter(Boolean);
    return bits.join('-') + ext;
  }

  /* The helper bundle handed to type.renderFields — DOM plumbing plus live
     access to the current draft. A type builds its inputs with these and
     never re-implements them. */
  const studioApi = {
    tf, rowsBlock, rowCard, subRows, guidance, esc,
    /* Shared so a type's own export (the Dev handoff) is named by the same
       scheme as the shell's, rather than inventing a second one. */
    exportName,
    getScenario: () => scenario,
    scheduleUpdate,
    /* Open one item of a SECTION LIST (see below) in the form. A type's own
       overview rows call this, so clicking a row and clicking the matching
       rail entry land in exactly the same place. */
    goToItem: (secId, idx) => setItem(secId, idx),
    /* The ⋯ menu for one list item — move / duplicate / delete — built by the
       shell so the rail and a type's overview offer the identical actions. */
    itemMenu: (secId, idx) => itemMenu(secId, idx),
    /* Rebuild the rail. A type calls this after it changes one of its own
       list items, because the rail is showing that list. */
    refreshNav: () => buildNav(),
    toast,
  };

  /* ---- the three-section spine, presented as PHASES ----------------------
     Authors work one phase at a time (a stepper they can also jump around),
     so a phase-level decision (which context modality? which core
     interaction?) is presented at its own altitude instead of buried in one
     long scroll. Each section declares its `group`; groups map onto the three
     phases below. Basics (meta) rides in with Context; reference material and
     the locked engine ride out with the Debrief. */
  const groupOf = (sec) => sec.group || 'meta';

  /* The author's flow is a "Start" pre-flight (choose the interaction + the
     basics — the decisions that shape everything) followed by the three phases
     that mirror the LEARNER's experience. A phase only appears if the current
     mode actually uses it (Start always does), so e.g. Teach-Back — which has
     no intro modality — shows Start → ② Interaction → ③ Debrief, skipping ①. */
  /* [V2] The rail speaks Learn/Practice. A mode whose sections declare the new
     groups (today: v4-universal, in its own `sections`) gets
     ② Learn / ③ Practice / ④ Voice & Tone; a mode still on the generic
     'interaction' group keeps its single Interaction step. computePhases()
     filters to whichever groups the current mode actually uses, and badge
     numbers are POSITIONAL (phaseBadge below), not hardcoded. */
  const ALL_PHASES = [
    { id: 'start',       icon: 'fa-wand-magic-sparkles', title: 'Start',            rail: 'Interaction + basics',
      eyebrow: 'First — what are you building?',
      sub: 'Choose the core interaction, then the basics. This shapes every field that follows.',
      groups: ['meta'], isStart: true },
    /* Was "Scenario Context — the intro modality". Context is never set inside a
       scenario any more (the surrounding learning object owns that), so what is
       left in this step is the WORLD the scenario happens in: setting, canon and
       characters. Retitled to say so. This step used to disappear whenever the
       context was inherited, which quietly took the scene world with it. */
    { id: 'context',     title: 'Situation & World', rail: 'The scene and its canon',
      eyebrow: 'Where this happens',
      sub: 'The world the scenario plays out in — the setting, the facts that are true of it, and who is in it.',
      groups: ['context'] },
    /* Was "Learn — Warm-up + topic turns", with a lede about gut-reaction
       warm-ups and topic turns. That described GUIDED ARC's shape, and guided-arc
       is not authored here any more. What this step actually holds is the teaching
       points — which the type's own card says are debrief-scoped and never shown
       mid-attempt, so the rail was contradicting the card on the same screen.
       Named for what is on it. */
    { id: 'learn',       title: 'Teaching',         rail: 'What they must leave knowing',
      eyebrow: 'The point of the whole thing',
      sub: 'What the learner must leave understanding, grouped by subject — plus the wrong beliefs worth correcting. Released when the coach teaches, never mid-attempt.',
      groups: ['learn'] },
    /* The 'practice' step is GONE. It was Guided Arc's separate live-scene page;
       no authored type declares a `practice` group, so it never rendered — dead
       rail config that read like a missing feature. A composed arc's practice
       lives inside each step, on Interaction. */
    { id: 'interaction', title: 'Interaction',      rail: 'The core loop',
      eyebrow: 'What the learner actually does',
      sub: 'The arc, step by step: each one gives the learner something to do, then has the coach teach against how they did it.',
      groups: ['interaction'] },
    { id: 'voicetone',   title: 'Voice & Tone',     rail: 'How the coach sounds',
      eyebrow: 'The coach, tuned',
      sub: 'Who the coach is and how it sounds — one stance carried through every step. The detailed voice rules stay locked.',
      groups: ['voicetone'] },
    { id: 'debrief',     title: 'Debrief & Close',  rail: 'Results & takeaways',
      eyebrow: 'The learner’s close',
      sub: 'Results and the guaranteed takeaways — plus reference material and the locked engine.',
      groups: ['debrief', 'reference'] },
  ];
  // Badge by POSITION in the filtered list (Start shows its icon instead),
  // so hiding a step never leaves a numbering gap.
  const PHASE_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
  const phaseBadge = (i) => PHASE_NUMS[i - 1] || '•';
  // Platform-level context fields live on the scenario; the shell owns their
  // authoring UI (the Start step) and defaults them so every mode inherits them.
  function ensureCtx() {
    /* Context is ALWAYS inherited from whatever ran before. Setting it inside a
       scenario — the old 'in-scenario' choice with its video / audio / reading
       intro — is not something the product does: the surrounding learning object
       owns the learner's run-up, and the only thing the scenario needs is a
       coach-facing summary of it. Left as a field rather than deleted because the
       three types that compile a previous-LO block read it, and because a legacy
       scenario's own intro fields stay in its JSON untouched — nothing here
       destroys them, and the player never read this key to decide what to show. */
    scenario.contextSource = 'previous-lo';
    if (!scenario.previousLO || typeof scenario.previousLO !== 'object') scenario.previousLO = { title: '', covered: '', handoff: '' };
  }

  /* A phase shows only if this mode uses it (Start always shows).
     The Situation & World phase used to drop out whenever the context was
     inherited, on the reasoning that there was nothing left to author. That was
     wrong: this phase also carries the type's world section — setting, canon
     facts, characters — so choosing "inherited" made the scene world
     unreachable. Now that context is ALWAYS inherited, dropping it would have
     hidden those fields permanently. The two were never the same question. */
  function computePhases() {
    return ALL_PHASES.filter((p) => {
      if (p.isStart) return true;
      return type.sections.some((s) => p.groups.includes(groupOf(s)));
    });
  }
  let PHASES = computePhases();
  // Secondary groups inside a phase get a light labeled divider; the phase's
  // lead group does not (the phase header already names it).
  const SUBBANDS = { reference: 'Reference & guardrails' };
  // The one-line mode descriptor now lives on the type (type.blurb) so the
  // shell holds no per-type knowledge — a new type ships its own blurb.
  const PHASE_KEY = 'aithera.writerStudio.v2.phase';   // [V2] own key — V1's stored step ids don't all exist here

  // -1 when this section's phase isn't currently shown (e.g. a context section
  // while context is inherited) — such sections render in NO phase, rather than
  // falling back into Start.
  const phaseIndexOf = (sec) => PHASES.findIndex((p) => p.groups.includes(groupOf(sec)));
  const sectionsInPhase = (i) => type.sections.filter((sec) => phaseIndexOf(sec) === i);

  // Which phase opens first — restored across a mode switch (which reloads the
  // page), so choosing a new interaction lands the author back on Interaction.
  let activePhase = (() => {
    const idx = PHASES.findIndex((p) => p.id === sessionStorage.getItem(PHASE_KEY));
    return idx >= 0 ? idx : 0;
  })();

  function setPhase(i) {
    if (i < 0 || i >= PHASES.length) return;
    activePhase = i;
    activeItem = null;                 // leaving the phase leaves any open list item
    sessionStorage.setItem(PHASE_KEY, PHASES[i].id);
    buildNav();
    buildForm();
    const form = $('#form');
    if (form) form.scrollTop = 0;
    renderLints();
  }

  /* =======================================================================
     SECTION LISTS — a section whose items are their own rail entries
     -----------------------------------------------------------------------
     Most sections hold a handful of fields. A few hold an ordered LIST of
     substantial things, and the scenario's steps are the case in point: four
     steps, each carrying a practice, three quality levels and a debrief, all
     stacked into one card the author scrolled through to reach the fourth.

     A section can opt out of that by declaring `sec.list`. The shell then
     gives the list its own altitude: one rail entry per item nested under the
     section, ONE item at a time in the form when an entry is picked, and the
     add / reorder / delete affordances in the rail where the order is visible.

     The contract — all functions, so the type always reads the live draft:
       items(H)          → [{ title, meta, icon }] one per item, in order
       render(i, H)      → the element that edits item i
       add(H)            → append an item; returns the new index
       move(from, to, H) → reorder; may return a string to say what it cost
       duplicate(i, H)   → copy item i in after it; returns the new index
       remove(i, H)      → delete item i; may return a string to say what it cost
       addLabel          → 'Add step'
       singular          → 'step'
     Anything a type leaves out is simply not offered — a list with no `move`
     gets no drag handle and no move commands.
     ======================================================================= */
  /* An open ⋯ menu freezes the rail. update() rebuilds the nav on every
     debounced save so a renamed step keeps its rail label current — but that
     also destroys whatever menu is open, and a Vaadin field can fire a change
     on first paint, so a menu could vanish a moment after being opened with
     nobody having touched anything. The rebuild is deferred to the close. */
  let openMenuClose = null;
  let navDeferred = false;

  const listOf = (sec) => (sec && sec.list) || null;
  const sectionById = (id) => type.sections.find((s) => s.id === id);
  const listItems = (L) => { try { return L.items(studioApi) || []; } catch (e) { return []; } };

  /* Which list item is open, as { sec, idx } — null means the phase page.
     Deliberately NOT persisted: it is a position inside an editing session,
     and restoring it would drop an author into step 3 of a scenario they
     opened to read from the top. */
  let activeItem = null;

  function setItem(secId, idx) {
    const sec = sectionById(secId);
    const L = listOf(sec);
    if (!L) return;
    const p = phaseIndexOf(sec);
    if (p < 0) return;
    if (p !== activePhase) {
      activePhase = p;
      sessionStorage.setItem(PHASE_KEY, PHASES[p].id);
    }
    const n = listItems(L).length;
    activeItem = (idx == null || idx < 0 || idx >= n) ? null : { sec: secId, idx };
    buildNav();
    buildForm();
    const form = $('#form');
    if (form) form.scrollTop = 0;
    renderLints();
  }

  /* Follow the OPEN item through a reorder. Whichever way the list moved, the
     author stays on the thing they were editing — an index that quietly points
     at a different step is how someone types into the wrong one. */
  function reindexActive(secId, from, to) {
    if (!activeItem || activeItem.sec !== secId) return;
    if (activeItem.idx === from) activeItem.idx = to;
    else if (from < activeItem.idx && to >= activeItem.idx) activeItem.idx -= 1;
    else if (from > activeItem.idx && to <= activeItem.idx) activeItem.idx += 1;
  }

  /* One list edit, applied: run it, say what it cost, and repaint everything
     that was showing the list (the rail, the form, the guardrails). */
  function applyListAction(secId, fn) {
    const sec = sectionById(secId);
    const L = listOf(sec);
    if (!L) return;
    const msg = fn(L);
    scheduleUpdate();
    buildNav();
    buildForm();
    renderLints();
    if (typeof msg === 'string' && msg) toast(msg);
  }

  /* The ⋯ menu shared by the rail and by a type's own overview rows. Returns
     the button with its popup attached, so a caller just appends it. */
  function itemMenu(secId, idx) {
    const sec = sectionById(secId);
    const L = listOf(sec);
    const wrap = document.createElement('span');
    wrap.className = 'item-menu';
    if (!L) return wrap;
    const count = listItems(L).length;
    const one = L.singular || 'item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item-menu-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', `Actions for ${one} ${idx + 1}`);
    btn.innerHTML = '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>';

    const pop = document.createElement('div');
    pop.className = 'item-menu-pop';
    pop.setAttribute('role', 'menu');
    pop.hidden = true;

    /* The menu has two faces: the commands, and the delete confirmation that
       replaces them in place. */
    const list = document.createElement('div');
    list.className = 'item-menu-list';
    const confirmPane = document.createElement('div');
    confirmPane.className = 'item-menu-confirm';
    confirmPane.hidden = true;
    pop.append(list, confirmPane);

    const cmd = (label, icon, enabled, run, danger, keepOpen) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      if (danger) b.className = 'danger';
      b.disabled = !enabled;
      b.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${esc(label)}`;
      b.addEventListener('click', () => { if (!keepOpen) close(); run(); });
      list.appendChild(b);
    };

    if (L.move) {
      const moveTo = (to) => applyListAction(secId, (l) => {
        const m = l.move(idx, to, studioApi);
        reindexActive(secId, idx, to);
        return m;
      });
      cmd('Move up', 'fa-arrow-up', idx > 0, () => moveTo(idx - 1));
      cmd('Move down', 'fa-arrow-down', idx < count - 1, () => moveTo(idx + 1));
    }
    if (L.duplicate) {
      cmd('Duplicate', 'fa-clone', true, () => {
        let at = idx;
        applyListAction(secId, (l) => { at = l.duplicate(idx, studioApi); return ''; });
        setItem(secId, typeof at === 'number' ? at : idx + 1);
      });
    }
    if (L.remove) {
      /* Deleting a step is not a formatting change — later steps can name it,
         and the scenario is the only copy — so it is asked, by name, first.
         Asked IN THE MENU, not with window.confirm(): a native dialog is
         suppressed outright in an embedded browser (it returns false without
         ever prompting), which turns Delete into a button that silently does
         nothing. The confirmation has to be part of the page. */
      cmd(`Delete ${one}`, 'fa-trash-can', true, () => {
        const it = listItems(L)[idx] || {};
        const name = it.title || `${one} ${idx + 1}`;
        confirmPane.innerHTML =
          `<p class="cf-q">Delete “${esc(name)}”?</p>` +
          `<p class="cf-note">The whole ${esc(one)} goes — its practice, its levels and its debrief. This cannot be undone.</p>`;
        const row = document.createElement('div');
        row.className = 'cf-actions';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'cf-cancel';
        cancel.textContent = 'Cancel';
        cancel.addEventListener('click', close);
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'cf-go';
        go.innerHTML = `<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Delete`;
        go.addEventListener('click', () => {
          close();
          applyListAction(secId, (l) => {
            const msg = l.remove(idx, studioApi);
            /* Whatever was open is now at a different index, or gone. Deleting
               the step someone else was editing should land them on a neighbour,
               not on the phase page, and deleting an EARLIER step should leave
               them exactly where they were. */
            if (activeItem && activeItem.sec === secId) {
              if (activeItem.idx === idx) {
                const n = listItems(l).length;
                activeItem = n ? { sec: secId, idx: Math.min(idx, n - 1) } : null;
              } else if (activeItem.idx > idx) activeItem.idx -= 1;
            }
            return msg;
          });
        });
        row.append(cancel, go);
        confirmPane.append(row);
        list.hidden = true;
        confirmPane.hidden = false;
        go.focus();
      }, true, true);
    }

    function close() {
      if (pop.hidden) return;
      pop.hidden = true;
      list.hidden = false;                 // next open starts on the commands
      confirmPane.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDoc, true);
      document.removeEventListener('keydown', onKey, true);
      if (openMenuClose === close) openMenuClose = null;
      if (!openMenuClose && navDeferred) { navDeferred = false; buildNav(); }
    }
    function onDoc(e) { if (!e.composedPath().includes(wrap)) close(); }
    function onKey(e) { if (e.key === 'Escape') { close(); btn.focus(); } }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!pop.hidden) return close();
      if (openMenuClose) openMenuClose();          // only ever one menu open
      const box = btn.getBoundingClientRect();
      pop.classList.toggle('up', box.bottom > window.innerHeight - 210);
      pop.hidden = false;
      openMenuClose = close;
      btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDoc, true);
      document.addEventListener('keydown', onKey, true);
    });

    wrap.append(btn, pop);
    return wrap;
  }

  /* ---- the Start step's core-interaction display -------------------------
     The interaction TYPE is picked ONCE, in the "Start from scratch" wizard —
     never switched one-click in the editor. A live swap reloads into a
     different type's structure and silently breaks the scenario, so here we
     only SHOW the current type, read-only, with a Change affordance. Changing
     it will open a guided restructure flow (not built yet); until then Change
     just explains where type selection lives. */
  function buildModeChooser() {
    const wrap = document.createElement('div');
    wrap.className = 'mode-choose';
    wrap.innerHTML = '<p class="mc-head">Core interaction</p>';

    const card = document.createElement('div');
    card.className = 'mode-card is-active mode-current';
    // Every type not flagged goForward (a type-supplied flag, like blurb — the
    // shell stays free of per-type branches) is marked legacy here: new
    // scenarios are steered to the go-forward format (the wizard's first card);
    // the classics stay first-class for editing what already exists.
    const legacyChip = type.goForward ? ''
      : '<span class="mc-legacy">Legacy — for editing existing scenarios</span>';
    card.innerHTML =
      `<span class="mci"><i class="fa-solid ${esc(type.icon || 'fa-cube')}"></i></span>` +
      `<span class="mcb"><span class="mcn">${esc(type.label)}${legacyChip}</span><span class="mcd">${esc(type.blurb || '')}</span></span>`;
    const change = document.createElement('button');
    change.type = 'button';
    change.className = 'mode-change';
    change.innerHTML = '<i class="fa-solid fa-arrow-right-arrow-left"></i> Change';
    change.addEventListener('click', () => {
      toast('Changing the core interaction opens a guided flow — coming soon. New scenarios pick their type in the “Start from scratch” wizard.');
    });
    card.appendChild(change);
    wrap.appendChild(card);

    const note = document.createElement('p');
    note.className = 'mode-current-note';
    note.textContent = 'Set when the scenario was created — it shapes every field below. Switching type restructures the scenario, so it’s a guided step, not a one-click change here.';
    wrap.appendChild(note);
    return wrap;
  }

  /* ---- the Start step's previous-lesson handoff -------------------------
     This used to be a choice: set the learner's context inside the scenario (an
     intro modality) or inherit it from whatever ran before. The choice is gone —
     the product never sets context in-scenario, so the surrounding learning
     object owns the run-up and the only thing a scenario needs is a description
     of it for the coach.

     Note what this block is NOT: it is not learner-facing. Every field here
     reaches the coach's prompt only, so it can avoid re-teaching what the learner
     just saw. Nothing typed here is shown to anyone. */
  function buildContextSource() {
    ensureCtx();
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'sec-contextsource';
    card.innerHTML =
      '<h2><i class="fa-solid fa-diagram-predecessor"></i> What came before this scenario?</h2>' +
      '<p class="lead">The learner arrives from something else — a video, a reading, a section of a course. Describe it so the coach knows what they have already seen.</p>';
    const box = document.createElement('div');
    box.className = 'fields';
    const note = document.createElement('div');
    note.className = 'fieldnote';
    note.innerHTML = '<i class="fa-solid fa-diagram-project"></i><span>In production this is pulled in automatically — you are filling it in here so the AI can hand off cleanly. It reaches the <b>coach only, never the learner</b>. A single block of prose in <b>What it covered</b> is a complete authoring; leave it all blank if nothing ran before.</span>';
    box.append(note,
      tf('previousLO.title', 'What came just before', { helper: 'A video, a reading, or a section of a course — by name. Optional if you describe it below.' }),
      tf('previousLO.covered', 'What it covered', { area: true, minRows: 3, helper: 'Plain prose is fine, and this field alone is enough — describe the video or the section so the coach knows what the learner already saw and doesn\u2019t re-teach it.' }),
      tf('previousLO.handoff', 'Where it left them', { area: true, minRows: 2, helper: 'Optional. The state they land in — what they just did or produced, and the thread this scenario picks up.' }));
    card.append(box);
    return card;
  }

  /* ---- build the form + nav (one phase at a time) ------------------------ */
  function buildForm() {
    const form = $('#form');
    form.innerHTML = '';
    if (typeof clearAside === 'function') clearAside();   // drop any pinned aside from the last phase
    ensureCtx();
    const p = PHASES[activePhase];

    // One list item picked from the rail — that item gets the pane to itself.
    if (activeItem) { buildItemForm(form); return; }

    const header = document.createElement('div');
    header.className = 'phase-header';
    header.innerHTML =
      `<p class="ph-eyebrow">${esc(p.eyebrow || '')}</p>` +
      `<h1><span class="badge">${p.isStart ? `<i class="fa-solid ${esc(p.icon || 'fa-play')}"></i>` : phaseBadge(activePhase)}</span> ${esc(p.title)}</h1>` +
      `<p>${esc(p.sub)}</p>`;
    form.appendChild(header);

    // The Start step leads with the core-interaction choice (it shapes the rest).
    if (p.isStart) form.appendChild(buildModeChooser());

    let lastGroup = null;
    sectionsInPhase(activePhase).forEach((sec) => {
      const g = groupOf(sec);
      if (g !== lastGroup && SUBBANDS[g]) {
        const sb = document.createElement('div');
        sb.className = 'sub-band';
        sb.textContent = SUBBANDS[g];
        form.appendChild(sb);
      }
      lastGroup = g;

      const card = document.createElement('section');
      card.className = 'card' + (sec.locked ? ' locked' : '');
      card.id = 'sec-' + sec.id;
      card.innerHTML = `
        <h2><i class="fa-solid ${esc(sec.icon)}"></i> ${esc(sec.title)}${sec.stage ? `<span class="stage">${esc(sec.stage)}</span>` : ''}</h2>
        <p class="lead">${esc(sec.lead)}</p>`;
      if (sec.bridge) {
        card.appendChild(guidance(sec.bridgeTitle || 'How this maps to your old craft', 'fa-graduation-cap', sec.bridge));
      }
      card.appendChild(type.renderFields(sec, studioApi));
      form.appendChild(card);
      spy.observe(card);
    });

    // The Start step closes with the context-source decision — it bridges into
    // the ① Context phase, or (for 'previous-lo') replaces it.
    if (p.isStart) form.appendChild(buildContextSource());

    // Back / Next footer — the natural forward path (jumping is via the rail).
    const foot = document.createElement('div');
    foot.className = 'phase-foot';
    const back = document.createElement('button');
    back.className = 'pf-btn';
    back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
    back.disabled = activePhase === 0;
    back.addEventListener('click', () => setPhase(activePhase - 1));
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    const next = document.createElement('button');
    next.className = 'pf-btn next';
    if (activePhase < PHASES.length - 1) {
      next.innerHTML = `Next: ${esc(PHASES[activePhase + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
      next.addEventListener('click', () => setPhase(activePhase + 1));
    } else {
      next.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Ready to publish';
      next.addEventListener('click', () => { const b = $('#previewBtn'); if (b) b.focus(); });
    }
    foot.append(back, spacer, next);
    form.appendChild(foot);

    refreshGuardrailText();
  }

  /* ---- the focus view: one list item, alone -----------------------------
     Deliberately not "the same page, scrolled to the right card". The whole
     point of promoting steps into the rail is that the author is editing ONE
     step; leaving its four siblings under it would put the scroll straight
     back. The crumb and the footer are what carry the arc instead. */
  function buildItemForm(form) {
    const sec = sectionById(activeItem.sec);
    const L = listOf(sec);
    const items = listItems(L);
    const i = activeItem.idx;
    const it = items[i];
    if (!it) { activeItem = null; buildForm(); return; }
    const one = L.singular || 'item';
    const p = PHASES[activePhase];

    const crumb = document.createElement('div');
    crumb.className = 'item-crumb';
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'crumb-up';
    up.innerHTML = `<i class="fa-solid fa-arrow-left"></i> All ${esc((L.pluralLabel || one + 's'))}`;
    up.addEventListener('click', () => {
      const secId = sec.id;
      setItem(secId, null);
      const el = $('#sec-' + secId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const trail = document.createElement('span');
    trail.className = 'crumb-trail';
    trail.innerHTML = `${esc(p.title)} <i class="fa-solid fa-angle-right"></i> ${esc(sec.title)}`;
    crumb.append(up, trail);
    form.appendChild(crumb);

    const header = document.createElement('div');
    header.className = 'phase-header item-header';
    const htext = document.createElement('div');
    htext.innerHTML =
      `<p class="ph-eyebrow">${esc(one)} ${i + 1} of ${items.length}${it.meta ? ' · ' + esc(it.meta) : ''}</p>` +
      `<h1><span class="badge">${i + 1}</span> ${esc(it.title || one + ' ' + (i + 1))}</h1>`;
    header.appendChild(htext);
    // Same ⋯ commands as the rail — an author working inside a step shouldn't
    // have to travel back to the list to reorder or delete it.
    header.appendChild(itemMenu(sec.id, i));
    form.appendChild(header);

    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'sec-' + sec.id + '-item';
    card.appendChild(L.render(i, studioApi));
    form.appendChild(card);

    // Footer walks the LIST, not the phases — the arc is the sequence here.
    const foot = document.createElement('div');
    foot.className = 'phase-foot';
    const back = document.createElement('button');
    back.className = 'pf-btn';
    back.disabled = i === 0;
    back.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Previous ${esc(one)}`;
    back.addEventListener('click', () => setItem(sec.id, i - 1));
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    const next = document.createElement('button');
    next.className = 'pf-btn next';
    if (i < items.length - 1) {
      const nx = items[i + 1] || {};
      next.innerHTML = `Next: ${esc(nx.title || one + ' ' + (i + 2))} <i class="fa-solid fa-arrow-right"></i>`;
      next.addEventListener('click', () => setItem(sec.id, i + 1));
    } else {
      next.innerHTML = `Back to all ${esc(L.pluralLabel || one + 's')} <i class="fa-solid fa-arrow-right"></i>`;
      next.addEventListener('click', () => setItem(sec.id, null));
    }
    foot.append(back, spacer, next);
    form.appendChild(foot);

    refreshGuardrailText();
  }

  function buildNav() {
    if (openMenuClose) { navDeferred = true; return; }
    const nav = $('#secNav');
    nav.innerHTML = '';
    const steps = document.createElement('div');
    steps.className = 'phase-steps';
    PHASES.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'phase-step' + (i === activePhase ? ' is-active' : '');
      btn.dataset.phase = String(i);
      btn.innerHTML =
        `<span class="pnum">${p.isStart ? `<i class="fa-solid ${esc(p.icon || 'fa-play')}"></i>` : phaseBadge(i)}</span>` +
        `<span class="pt"><span class="ptt">${esc(p.title)}</span><span class="pdesc">${esc(p.rail)}</span></span>` +
        `<span class="pstatus" data-phasedot="${p.id}"></span>`;
      btn.addEventListener('click', () => setPhase(i));
      steps.appendChild(btn);

      if (i === activePhase) {
        const sub = document.createElement('div');
        sub.className = 'phase-sections';
        sectionsInPhase(i).forEach((sec) => {
          const b = document.createElement('button');
          b.dataset.sec = sec.id;
          b.innerHTML = `<i class="fa-solid ${esc(sec.icon)}" style="width:16px;text-align:center;color:var(--ink-faint);font-size:11.5px"></i>
            <span>${esc(sec.title)}</span><span class="status" data-dot="${esc(sec.id)}"></span>`;
          b.addEventListener('click', () => {
            /* From inside a list item this is a way OUT of the focus view, so
               rebuild the phase page first — otherwise the card being scrolled
               to isn't on screen at all. */
            if (activeItem) setItem(sec.id, null);
            const el = $('#sec-' + sec.id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            $$('.phase-sections > button').forEach((x) => x.classList.toggle('is-active', x === b));
          });
          sub.appendChild(b);
          const L = listOf(sec);
          if (L) sub.appendChild(buildItemRail(sec, L));
        });
        steps.appendChild(sub);
      }
    });
    nav.appendChild(steps);
  }

  /* ---- one section's items, as rail entries ------------------------------
     Two ways to reorder on purpose. Dragging is the gesture people reach for
     when a list is a sequence, but it is mouse-only and invisible until you
     try it, so the same moves are also spelled out in each row's ⋯ menu —
     which is what a keyboard reaches, and what tells a first-time author the
     order is theirs to change at all. */
  function buildItemRail(sec, L) {
    const wrap = document.createElement('div');
    wrap.className = 'item-list';
    const items = listItems(L);
    const one = L.singular || 'item';
    let dragFrom = null;

    const clearDrop = () => $$('.item-row', wrap).forEach((r) => r.classList.remove('drop-before', 'drop-after'));

    items.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row'
        + (activeItem && activeItem.sec === sec.id && activeItem.idx === idx ? ' is-active' : '');
      row.dataset.idx = String(idx);

      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'item-open';
      // A long step name ellipsises in a 250px rail, so the full one is on hover.
      open.title = (it.title || one + ' ' + (idx + 1)) + (it.meta ? ' — ' + it.meta : '');
      open.innerHTML =
        `<span class="ihandle"><span class="inum">${idx + 1}</span>`
        + (L.move ? '<i class="fa-solid fa-grip-vertical grip" aria-hidden="true"></i>' : '')
        + '</span>'
        + `<span class="ittl">${esc(it.title || one + ' ' + (idx + 1))}</span>`
        + (it.icon ? `<i class="fa-solid ${esc(it.icon)} imode" title="${esc(it.meta || '')}" aria-hidden="true"></i>` : '')
        + `<span class="status" data-itemdot="${esc(sec.id)}:${idx}"></span>`;
      open.addEventListener('click', () => setItem(sec.id, idx));
      row.appendChild(open);
      row.appendChild(itemMenu(sec.id, idx));

      if (L.move) {
        row.draggable = true;
        row.addEventListener('dragstart', (e) => {
          dragFrom = idx;
          row.classList.add('dragging');
          try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); } catch (err) { /* Safari */ }
        });
        row.addEventListener('dragend', () => { dragFrom = null; row.classList.remove('dragging'); clearDrop(); });
        row.addEventListener('dragover', (e) => {
          if (dragFrom == null || dragFrom === idx) return;
          e.preventDefault();
          clearDrop();
          row.classList.add(idx < dragFrom ? 'drop-before' : 'drop-after');
        });
        row.addEventListener('drop', (e) => {
          e.preventDefault();
          const from = dragFrom;
          clearDrop();
          if (from == null || from === idx) return;
          applyListAction(sec.id, (l) => {
            const msg = l.move(from, idx, studioApi);
            reindexActive(sec.id, from, idx);
            return msg;
          });
        });
      }
      wrap.appendChild(row);
    });

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'item-empty';
      empty.textContent = `No ${L.pluralLabel || one + 's'} yet.`;
      wrap.appendChild(empty);
    }

    if (L.add) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'item-add';
      add.innerHTML = `<i class="fa-solid fa-plus"></i> ${esc(L.addLabel || 'Add ' + one)}`;
      add.addEventListener('click', () => {
        let at = items.length;
        applyListAction(sec.id, (l) => { at = l.add(studioApi); return ''; });
        setItem(sec.id, typeof at === 'number' ? at : items.length);
      });
      wrap.appendChild(add);
    }
    return wrap;
  }

  function refreshGuardrailText() {
    (type.ENGINE_SECTIONS || []).forEach((g) => {
      const pre = $(`pre[data-guardrail="${g.id}"]`);
      if (pre) pre.textContent = g.text(scenario);
    });
  }

  /* ---- field change → debounced recompute -------------------------------- */
  let updateTimer;
  function onField(e) {
    const host = e.currentTarget;
    setByPath(scenario, host.dataset.path, host.value);
    scheduleUpdate();
  }
  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(update, 350);
  }

  function saveDraft() {
    localStorage.setItem(type.store.keys.draft, JSON.stringify(scenario));
    const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#saveStatus').innerHTML = `<i class="fa-solid fa-circle-check"></i> Draft saved ${esc(t)}`;
  }

  /* =======================================================================
     LINTS + prompt highlighting live in the TYPE now (type.lints /
     type.highlightStrings). The shell only renders what they return.
     ======================================================================= */

  /* ---- render lints + nav dots + publish state --------------------------- */
  const SEVERITY_ICON = { err: 'fa-circle-xmark', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const SEVERITY_RANK = { err: 0, warn: 1, info: 2 };
  let currentLints = [];

  function renderLints() {
    currentLints = type.lints(scenario, studioApi).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
    const errs = currentLints.filter((l) => l.severity === 'err').length;
    const warns = currentLints.filter((l) => l.severity === 'warn').length;
    const infos = currentLints.filter((l) => l.severity === 'info').length;

    // Tab label count
    /* "Validation", not "Guardrails" — the rail already has a section called
       System guardrails (the locked prompt sections), and two different things
       wearing one word on the same screen is a question an author has to answer
       every time they look. This tab is the validator's output, which is also
       what the production service calls it (its authoring API returns
       `failures[]` and its own inspector tab is Validation), so the two tools
       now name the same thing the same way. */
    $('#lintTab').innerHTML = `<i class="fa-solid fa-circle-check" style="margin-right:7px"></i> Validation${errs + warns ? ` (${errs + warns})` : ''}`;

    // Panel
    const box = $('#tabLints');
    let html = '<div class="lintsummary">';
    html += errs ? `<span class="pill err"><i class="fa-solid fa-circle-xmark"></i> ${errs} blocking</span>` : '';
    html += warns ? `<span class="pill warn"><i class="fa-solid fa-triangle-exclamation"></i> ${warns} warnings</span>` : '';
    html += infos ? `<span class="pill info"><i class="fa-solid fa-circle-info"></i> ${infos} tips</span>` : '';
    html += !currentLints.length ? `<span class="pill ok"><i class="fa-solid fa-circle-check"></i> All checks pass</span>` : '';
    html += '</div>';
    if (!currentLints.length) {
      html += '<div class="lintclean"><i class="fa-solid fa-circle-check"></i>Nothing to flag. Publish when the playtest holds up.</div>';
    } else {
      html += currentLints.map((l, i) => {
        const sec = type.sections.find((x) => x.id === l.section);
        const item = (listOf(sec) && typeof l.item === 'number') ? ` data-item="${l.item}"` : '';
        return `<div class="lint ${l.severity}" data-goto="${esc(l.section)}"${item} role="button" tabindex="0">
          <i class="fa-solid ${SEVERITY_ICON[l.severity]} icon"></i>
          <div><div class="msg">${esc(l.msg)}</div>${l.why ? `<div class="why">${esc(l.why)}</div>` : ''}
          <div class="sec">${esc(sec ? sec.title : l.section)}</div></div>
        </div>`;
      }).join('');
    }
    box.innerHTML = html;
    $$('[data-goto]', box).forEach((n) => n.addEventListener('click', () => {
      const secId = n.dataset.goto;
      /* A lint against one item of a list opens that item — landing on the
         section card would leave the author to find which step it meant. */
      if (n.dataset.item != null) { setItem(secId, Number(n.dataset.item)); return; }
      const sec = sectionById(secId);
      const p = phaseIndexOf(sec);
      if (p >= 0 && (p !== activePhase || activeItem)) setPhase(p);
      const el = $('#sec-' + secId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    // Nav dots: worst severity per section
    type.sections.forEach((sec) => {
      const dot = $(`[data-dot="${sec.id}"]`);
      if (!dot) return;
      const worst = currentLints.filter((l) => l.section === sec.id)
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
      dot.className = 'status ' + (sec.locked ? '' : worst ? (worst.severity === 'err' ? 'err' : worst.severity === 'warn' ? 'warn' : '') : 'ok');
      dot.innerHTML = sec.locked ? '<i class="fa-solid fa-lock locknote"></i>'
        : worst && worst.severity !== 'info' ? '<i class="fa-solid fa-circle"></i>'
        : '<i class="fa-solid fa-circle-check"></i>';
    });

    /* Per-ITEM dots for sections presented as lists. A lint says which item it
       belongs to (`l.item`); without that the whole list would carry one dot
       and an author would still be opening steps to find the empty field. */
    type.sections.forEach((sec) => {
      const L = listOf(sec);
      if (!L) return;
      listItems(L).forEach((it, i) => {
        const dot = $(`[data-itemdot="${sec.id}:${i}"]`);
        if (!dot) return;
        const worst = currentLints.filter((l) => l.section === sec.id && l.item === i)
          .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
        const sev = worst && worst.severity !== 'info' ? worst.severity : '';
        dot.className = 'status ' + (sev === 'err' ? 'err' : sev === 'warn' ? 'warn' : 'ok');
        dot.innerHTML = sev ? '<i class="fa-solid fa-circle"></i>' : '<i class="fa-solid fa-circle-check"></i>';
      });
    });

    // Phase-step aggregate dots: the worst non-info severity in each phase, so
    // a collapsed phase still signals it has a blocking issue or a warning.
    PHASES.forEach((p, i) => {
      const dot = $(`[data-phasedot="${p.id}"]`);
      if (!dot) return;
      const ids = sectionsInPhase(i).map((s) => s.id);
      const worst = currentLints.filter((l) => ids.includes(l.section))
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
      const sev = worst && worst.severity !== 'info' ? worst.severity : '';
      dot.className = 'pstatus ' + sev;
      dot.innerHTML = sev ? '<i class="fa-solid fa-circle"></i>' : '';
    });

    /* Preview is NOT gated on the guardrails. It used to be — it was Publish, and
       publishing a document the engine would reject made no sense. But previewing
       a half-built scenario is the main reason to preview at all, and the player
       handles an incomplete draft (normalize scaffolds, prune strips, compile
       runs). So the count is recorded for the status line and the toast, and the
       button always works. */
    blockedCount = errs;
    renderPubState();
  }

  /* ---- compiled prompt pane ----------------------------------------------
     type.compile(scenario) returns EITHER one prompt string or an ordered
     list of named prompts [{label, text}] (teach-back has three). When there
     is more than one, a small sub-tab strip lets the writer switch between
     them; a single prompt renders exactly as before with no strip. */
  let activePromptIdx = 0;
  let activePromptText = '';
  // Sentinels that can't appear in real prompt text — used to defer wrapping
  // highlighted spans until after all substring matches, so overlaps never
  // produce nested/broken tags.
  const WR_S = '', WR_E = '';

  function renderPrompt() {
    const out = type.compile(scenario);
    const prompts = (typeof out === 'string') ? [{ label: 'System prompt', text: out }] : (out || []);
    if (activePromptIdx >= prompts.length) activePromptIdx = 0;

    // Sub-tab strip — only when the type compiles to more than one prompt.
    let strip = $('#promptSubtabs');
    if (prompts.length > 1) {
      if (!strip) {
        strip = document.createElement('div');
        strip.id = 'promptSubtabs';
        strip.className = 'prompt-subtabs';
        strip.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap';
        $('#promptView').parentNode.insertBefore(strip, $('#promptView'));
      }
      strip.hidden = false;
      strip.innerHTML = prompts.map((p, i) => {
        const on = i === activePromptIdx;
        return `<button data-pi="${i}" style="padding:4px 11px;border:1px solid var(--line);border-radius:999px;cursor:pointer;font-size:12px;${on ? 'background:#2563eb;color:#fff;border-color:#2563eb' : 'background:transparent;color:var(--ink-faint)'}">${esc(p.label)}</button>`;
      }).join('');
      $$('[data-pi]', strip).forEach((b) => b.addEventListener('click', () => {
        activePromptIdx = Number(b.dataset.pi);
        renderPrompt();
      }));
    } else if (strip) {
      strip.hidden = true;
    }

    const prompt = (prompts[activePromptIdx] || { text: '' }).text || '';
    activePromptText = prompt;
    $('#promptChars').textContent = prompt.length.toLocaleString() + ' chars';
    $('#promptTokens').textContent = '~' + Math.round(prompt.length / 4).toLocaleString() + ' tokens';

    let html = esc(prompt);
    (type.highlightStrings ? type.highlightStrings(scenario) : []).forEach((t) => {
      const needle = esc(t);
      html = html.split(needle).join(WR_S + needle + WR_E);
    });
    // Resolve sentinels after all replacements so overlaps can't nest tags badly.
    html = html.split(WR_S).join('<span class="wr">').split(WR_E).join('</span>');
    $('#promptView').innerHTML = html;
  }

  /* ---- publish state strip ------------------------------------------------ */
  function renderPubState() {
    const strip = $('#pubStrip');
    const text = $('#pubText');
    const unpub = $('#unpublishBtn');
    const pub = type.store.loadPublished();
    strip.classList.remove('is-live', 'is-stale');
    /* Reworded away from publish vocabulary. An author does not care whether a
       thing is "published"; they care whether the player is showing what they just
       wrote, and whether the tab they already have open is stale. */
    const blocked = blockedCount > 0
      ? ` ${blockedCount} field${blockedCount > 1 ? 's' : ''} still missing — see Validation.`
      : '';
    if (!pub) {
      text.textContent = 'The player is showing the shipped scenario. Preview to load this draft into it.' + blocked;
      unpub.hidden = true;
      return;
    }
    unpub.hidden = false;
    const when = pub.savedAt ? new Date(pub.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    if (JSON.stringify(pub.scenario) === JSON.stringify(scenario)) {
      strip.classList.add('is-live');
      text.textContent = `The player is running this exact draft (loaded ${when}).` + blocked;
    } else {
      strip.classList.add('is-stale');
      text.textContent = `The player is running an older version of this draft (${when}) — preview again to update it.` + blocked;
    }
  }

  /* ---- the one update pipeline ------------------------------------------- */
  function update() {
    saveDraft();
    /* The rail now shows list items by NAME, so it goes stale the moment an
       author renames a step. Rebuilding it here keeps the label the author is
       typing and the label in the rail the same string; the rail is a separate
       subtree from the form, so focus and caret are untouched. */
    buildNav();
    renderPrompt();
    renderLints();
    renderPubState();
    refreshGuardrailText();
    if (playtestHandle) playtestHandle.refreshTarget();
    // The type still decides which learner page Preview opens; it is read at
    // click time now rather than kept in an href.
  }

  /* =======================================================================
     PLAYTEST — the driver lives in the type (type.playtest). The shell builds
     it into the Playtest tab once and keeps a handle so update()/reset can
     poke it. A type with no playtest (playtest:null) simply skips this.
     ======================================================================= */
  let playtestHandle = null;
  function buildPlaytest() {
    if (!type.playtest) return;
    playtestHandle = type.playtest.build($('#tabPlaytest'), {
      $, $$, esc, toast,
      getScenario: () => scenario,
      compile: (s) => type.compile(s),
      fill: (t, s) => type.fill(t, s),
      workerUrlKey: type.store.keys.workerUrl,
    });
  }

  /* ---- Say/Do Split sandbox ----------------------------------------------
     A standalone tester for the scene-move splitter (js/say-do-split.js): type
     a move as a learner would and see it split into what they DO (an action
     line) and what they SAY (a bubble). Shows the instant deterministic pass
     and the fast-model AI pass side by side, so the split can be tuned in
     isolation without running a whole playtest conversation. Reuses the
     Playtest tab's worker URL for the AI call. */
  const SPLIT_DEFAULT_WORKER = 'https://aithera-action-proxy.vector-aithera.workers.dev';
  const SPLIT_SAMPLES = [
    "I'd punch Jake, tell him to shove off and then run away",
    'I step in beside them and say "knock it off"',
    "I'd tell him to drop it and then check on her after",
    'knock it off',
    'I look over at her',
    "I'd calmly ask him to please stop",
  ];
  function buildSplitSandbox() {
    const box = $('#tabSplit');
    if (!box) return;
    if (!window.AitheraSayDoSplit) { box.innerHTML = '<p class="split-intro">Split module not loaded.</p>'; return; }
    const SDS = window.AitheraSayDoSplit;
    box.innerHTML = `
      <div class="split-pad">
        <p class="split-intro">See how a learner's scene move splits into an ordered sequence of what they <b>do</b> (centered action lines) and what they <b>say</b> (amber bubbles) — multiple of each, kept in the order the learner meant, so "punch, tell him to shove off, then run" stays punch → "Shove off" → run. Same split the live page and playtest scene turns use. The <b>instant</b> pass is deterministic; the <b>AI</b> pass (the reliable one for free-form moves) uses the fast model via the Playtest worker.</p>
        <vaadin-text-area theme="outlined" id="splitInput" label="A move, the way a learner would type it" min-rows="2" placeholder="e.g. I step in beside them and say &quot;knock it off&quot;"></vaadin-text-area>
        <div class="split-actions">
          <vaadin-button theme="primary" id="splitRunBtn"><i class="fa-solid fa-scissors" style="margin-right:6px"></i> Split it</vaadin-button>
        </div>
        <div class="split-samples" id="splitSamples"><span class="label">Try:</span></div>
        <div class="split-results" id="splitResults"></div>
      </div>`;
    const input = $('#splitInput');
    const results = $('#splitResults');
    const beatsHtml = (beats) => (!beats || !beats.length)
      ? '<div class="split-empty">— nothing —</div>'
      : beats.map((b) => `<div class="split-beat ${b.kind === 'narration' ? 'do' : 'say'}"><span class="split-lbl">${b.kind === 'narration' ? 'DO' : 'SAY'}</span><span class="split-txt">${esc(b.text)}</span></div>`).join('');
    const card = (title, inner) => `<div class="split-card"><div class="split-card-h">${esc(title)}</div>${inner}</div>`;
    const run = async () => {
      const text = (input.value || '').trim();
      if (!text) { toast('Type a move to split'); return; }
      const det = SDS.splitSceneInput(text);
      results.innerHTML = card('Instant · deterministic', beatsHtml(det)) + card('AI · fast model', '<div class="split-loading"><span></span><span></span><span></span></div>');
      const workerUrl = (($('#ptWorkerUrl') && $('#ptWorkerUrl').value) || SPLIT_DEFAULT_WORKER).trim();
      let ai, failed = false;
      try { ai = await SDS.splitSceneInputAI(text, { workerUrl }); } catch (e) { failed = true; }
      const aiInner = failed
        ? '<div class="split-empty">AI split failed — check the Playtest worker URL. Deterministic pass still applies.</div>'
        : beatsHtml(ai || SDS.splitSceneInput(text));
      results.innerHTML = card('Instant · deterministic', beatsHtml(det)) + card('AI · fast model', aiInner);
    };
    $('#splitRunBtn').addEventListener('click', run);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); } });
    const samples = $('#splitSamples');
    SPLIT_SAMPLES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'split-sample'; b.textContent = t;
      b.addEventListener('click', () => { input.value = t; input.focus(); });
      samples.appendChild(b);
    });
  }

  /* ---- inspector tabs ----------------------------------------------------
     A type with no playtest (playtest:null) drops the Playtest tab + body, so
     the body list is built from whatever survives. */
  // Tab <-> body mapping is DATA-DRIVEN (each vaadin-tab's data-body names its
  // body id), so tabs can be added/removed — the Playtest tab, or a type's
  // pinned "aside" panel (setAside below) — without any index math.
  const inspTabs = () => Array.from($('#inspectorTabs').querySelectorAll('vaadin-tab'));
  const INSP_BODIES = ['tabAside', 'tabPrompt', 'tabLints', 'tabPlaytest', 'tabSplit'];
  function activateInspBody(bodyId) {
    INSP_BODIES.forEach((id) => { const el = $('#' + id); if (el) el.classList.toggle('is-active', id === bodyId); });
  }
  function selectInspTab(tab) {
    const i = inspTabs().indexOf(tab);
    if (i >= 0) { $('#inspectorTabs').selected = i; activateInspBody(tab.dataset.body); }
  }
  if (!type.playtest) {
    const pt = inspTabs().find((t) => t.dataset.body === 'tabPlaytest');
    if (pt) pt.remove();
    const ptBody = $('#tabPlaytest');
    if (ptBody) ptBody.remove();
  }
  $('#inspectorTabs').addEventListener('selected-changed', (e) => {
    const tab = inspTabs()[e.detail.value];
    if (tab) activateInspBody(tab.dataset.body);
  });

  /* ---- pinned inspector "aside" (type-agnostic) --------------------------
     A type can pin a node into the inspector for the CURRENT phase via
     studioApi.setAside(node, {title, icon}) — e.g. Scene Sweep pins its photo
     canvas beside the hazard cards so drawing and editing sit side-by-side. The
     shell owns the tab lifecycle; the type just hands over a DOM node. Cleared
     at the top of every buildForm(), so it only lives on the phase that set it. */
  let asideTab = null, asideBody = null;
  function clearAside() {
    const wasActive = asideBody && asideBody.classList.contains('is-active');
    if (asideBody) { asideBody.remove(); asideBody = null; }
    if (asideTab) { asideTab.remove(); asideTab = null; }
    if (wasActive) { const first = inspTabs()[0]; if (first) selectInspTab(first); }
  }
  function setAside(node, opts) {
    clearAside();
    opts = opts || {};
    const tabsEl = $('#inspectorTabs');
    asideTab = document.createElement('vaadin-tab');
    asideTab.dataset.body = 'tabAside';
    asideTab.innerHTML = `<i class="fa-solid ${esc(opts.icon || 'fa-image')}" style="margin-right:7px"></i> ${esc(opts.title || 'Preview')}`;
    tabsEl.insertBefore(asideTab, tabsEl.firstElementChild);
    asideBody = document.createElement('div');
    asideBody.className = 'tabbody is-aside';
    asideBody.id = 'tabAside';
    asideBody.appendChild(node);
    tabsEl.parentNode.insertBefore(asideBody, tabsEl.nextSibling);
    selectInspTab(asideTab);
  }
  studioApi.setAside = setAside;

  /* ---- top bar actions ----------------------------------------------------- */
  /* PREVIEW — one step, because the two it replaces were a trap. "Learner
     preview" opened the player, and the player reads the PUBLISHED copy, not the
     draft — so previewing without publishing first showed you the shipped
     scenario and none of your work. The only way to find that out was to notice
     your edits missing. Publishing is the mechanism, not the intent; the intent is
     "let me see this". So: write the draft to the slot the player reads, then open
     it, in one click. */
  $('#previewBtn').addEventListener('click', () => {
    renderLints();
    type.store.publish(scenario);
    renderPubState();
    const url = type.previewUrl(scenario);
    window.open(url, '_blank', 'noopener');
    toast(blockedCount
      ? `Previewing with ${blockedCount} field${blockedCount > 1 ? 's' : ''} still missing — it may not run cleanly`
      : 'Preview opened in a new tab');
  });

  $('#unpublishBtn').addEventListener('click', () => {
    askConfirm({
      title: 'Clear this draft from the player?',
      body: 'The player goes back to the shipped scenario. Your draft here is untouched.',
      confirmLabel: 'Clear it',
    }, () => {
      type.store.clearPublished();
      renderPubState();
      toast('Cleared — the player is back on the shipped scenario');
    });
  });

  /* "Reset to shipped" is gone. It restored type.DEFAULT — which IS one of the
     seven templates (Mix & Match) — so once the New scenario panel offered every
     template by name, this was a fourth way to start over wearing a label that
     told an author nothing about what they would get. DEFAULT itself stays: it is
     the boot fallback and the pristine-draft check.

     Note it was never related to Unpublish above, despite both saying "shipped":
     that one reverts the learner prototype, this one overwrote your draft. Two
     different meanings of the same word in adjacent buttons, which is its own
     argument for dropping one. */

  /* Start fresh — a blank canvas for authoring a NEW scenario in this mode.
     Non-destructive: the published copy and the library are untouched (this
     only replaces the working draft), so it's the safe "author a new course"
     entry point. Each type supplies a blank template; older types fall back
     to an emptied default. */
  /* startBlank / startFromTemplate — the two non-AI ways to begin. Both go
     through the same door (openNewScenario below), and both snapshot an
     in-progress draft into the library first, the way the wizard already did:
     losing unsaved work to a "New scenario" click is a worse outcome than an
     extra library entry.

     The old handler also redirected a CLASSIC type to the go-forward editor.
     That branch is gone because it cannot be reached any more — an unknown or
     retired ?type= now resolves to the go-forward type before this runs. */
  function snapshotDraft() {
    try {
      if (!draftIsUntouched()) { type.store.saveToLibrary(clone(scenario)); return true; }
    } catch (e) { /* best effort — never block starting a new scenario */ }
    return false;
  }
  function adoptScenario(next, message) {
    const saved = snapshotDraft();
    scenario = next;
    buildForm();
    if (playtestHandle) playtestHandle.reset();
    setPhase(0);
    update();
    toast(message + (saved ? ' — your previous draft is snapshotted in Local drafts' : ''));
  }
  function startBlank() {
    adoptScenario(type.normalize(type.blank ? type.blank() : clone(type.DEFAULT)), 'Blank scenario');
  }
  function startFromTemplate(t) {
    const doc = typeof type.template === 'function' ? type.template(t.id) : null;
    if (!doc) { toast('That template could not be loaded'); return; }
    adoptScenario(type.normalize(doc), `Started from ${t.label || t.id}`);
  }

  /* [V2] Start from scratch — the guided wizard (js/studio-wizard.js).
     Brief → interview → staged generation; the drafted scenario lands here
     as the working draft. Non-destructive: whatever was in the editor is
     snapshotted to the Library first. Modes without a wizard spec fall back
     to a pointer at Blank canvas. */
  function openWizard() {
    // The wizard now opens with its own type chooser — any registered type
    // with a wizard spec is buildable, whichever mode this page is on.
    const anyWizard = window.AitheraStudio.list().some((t) => t && t.wizard);
    if (!(window.AitheraStudioWizard && anyWizard)) {
      toast('Guided setup isn\'t available — Blank canvas is the manual path.');
      return;
    }
    window.AitheraStudioWizard.open({
      type, toast, esc,
      workerUrlKey: type.store.keys.workerUrl,
      getScenario: () => scenario,
      replaceScenario: (next) => {
        /* Same question, same answer as snapshotDraft — routed through the one
           helper so the wizard and the New scenario panel can never disagree
           about whether there was work to protect. */
        try {
          if (!draftIsUntouched()) type.store.saveToLibrary(clone(scenario));   // never eat an in-progress draft
        } catch (e) { /* snapshot is best-effort */ }
        scenario = next;
        PHASES = computePhases();
        setPhase(0);
        update();
        if (playtestHandle) playtestHandle.reset();
      },
    });
  }
  $('#newBtn').addEventListener('click', openNewScenario);

  /* ---- Export ------------------------------------------------------------
     A scenario can have TWO honest export artifacts: the working draft (this
     tool's own round-trip format, extensions and all) and a production handoff
     (whatever the target engine actually loads). They are not interchangeable,
     and the moment an author clicks Export is exactly when the difference needs
     stating — which it cannot be if one of them is a panel buried on the last
     page of the form.

     A type opts in by declaring `type.handoff = { label, lead, build(studioApi) }`.
     When it does, Export opens a dialog offering both side by side; when it does
     not, Export stays the one-click download it has always been. That keeps this
     a generic capability of the TYPE contract rather than a per-type branch —
     the shell still never asks which pedagogy it is editing. */
  function downloadWorkingDraft() {
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = exportName('draft', '.json');
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Working draft downloaded');
  }

  /* ---- NEW SCENARIO — one door ------------------------------------------
     The type ships a gallery of starting points (type.templates() / .template(id),
     the same optional-capability shape as type.handoff — the shell still never asks
     which pedagogy it is editing). Nothing surfaced it, so in practice an author
     got exactly ONE of them: whichever is the type's default document. The other six
     were reachable only from code.

     A template is a starting point, not an example to study: picking one REPLACES
     the draft, so it confirms first. `.template(id)` already hands back a deep copy,
     so the gallery can never be edited by accident. */
  const SHAPE_STEP = { C: 'Coach', R: 'Roleplay', O: 'Observe' };
  const shapeChain = (shape) => String(shape || '').split('')
    .map((c) => SHAPE_STEP[c]).filter(Boolean).join(' → ');

  let tplOverlay = null;
  const onTplKey = (e) => { if (e.key === 'Escape') closeNewScenario(); };
  function closeNewScenario() {
    if (!tplOverlay) return;
    tplOverlay.remove();
    tplOverlay = null;
    document.removeEventListener('keydown', onTplKey);
  }

  function openNewScenario() {
    closeNewScenario();
    const templates = (typeof type.templates === 'function' && type.templates()) || [];
    const canWizard = !!(window.AitheraStudioWizard
      && window.AitheraStudio.list({ goForwardOnly: true }).some((t) => t && t.wizard));

    tplOverlay = document.createElement('div');
    tplOverlay.className = 'exp-overlay';
    tplOverlay.innerHTML = `
      <div class="exp-modal is-compact" role="dialog" aria-modal="true" aria-label="New scenario">
        <div class="exp-head">
          <div class="exp-titles"><div class="exp-title" id="nsTitle"><i class="fa-solid fa-plus"></i> New scenario</div></div>
          <button class="exp-close" type="button" aria-label="Close">Close</button>
        </div>
        <div class="ns-panel" id="nsPanel"></div>
      </div>`;
    const panel = tplOverlay.querySelector('#nsPanel');
    const titleEl = tplOverlay.querySelector('#nsTitle');

    /* A MENU, not a form. The previous version put an action button on the right
       of every route, which meant three buttons of three different widths in a
       ragged column — and the template route needed a select as well, so its
       button floated beside the heading while its control sat underneath. Making
       the whole row the target removes the column entirely: every route is one
       full-width row that behaves the same way, and the one route with a further
       decision drills into it rather than growing an extra control in place. */
    const menuRow = (opts) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ns-item';
      b.innerHTML =
        `<span class="ns-ico"><i class="fa-solid ${esc(opts.icon)}"></i></span>`
        + `<span class="ns-body">`
        + `<span class="ns-name">${esc(opts.title)}`
        + (opts.tag ? ` <span class="exp-tag">${esc(opts.tag)}</span>` : '') + `</span>`
        + `<span class="ns-lede">${esc(opts.lede)}</span></span>`
        + `<span class="ns-chev"><i class="fa-solid fa-chevron-right"></i></span>`;
      if (opts.more) b.title = opts.more;
      b.addEventListener('click', opts.onClick);
      return b;
    };

    function showMenu() {
      titleEl.innerHTML = '<i class="fa-solid fa-plus"></i> New scenario';
      panel.innerHTML = '';
      const list = document.createElement('div');
      list.className = 'ns-list';
      if (canWizard) {
        list.appendChild(menuRow({
          icon: 'fa-wand-magic-sparkles', title: 'Draft it with AI',
          lede: 'A sentence or two in, a complete first draft out.',
          more: 'Describe the situation, answer a short interview, and the wizard writes every beat, '
              + 'rubric and piece of coach guidance for you to refine.',
          onClick: () => { closeNewScenario(); openWizard(); }
        }));
      }
      if (templates.length) {
        list.appendChild(menuRow({
          icon: 'fa-shapes', title: 'Start from a template', tag: `${templates.length} shapes`,
          lede: 'The shape is decided; the writing is yours.',
          more: 'Each template is a complete, valid scenario with the teaching content left blank.',
          onClick: showTemplates
        }));
      }
      list.appendChild(menuRow({
        icon: 'fa-file-import', title: 'Open an existing scenario', tag: 'JSON',
        lede: 'Edit a production scenario, then export it back.',
        /* The tag used to read `.lo.json`, which named the wrong one of the two
           files this accepts: the editor file is what you re-open to continue
           work, and the player file has had the editor's own fields stripped. */
        more: 'Pick a scenario file — one exported from the production system, or one a colleague '
            + 'sent you. Editing here and exporting produces the files you upload back.',
        onClick: () => { closeNewScenario(); const f = $('#importFile'); if (f) f.click(); }
      }));
      panel.appendChild(list);

      const foot = document.createElement('div');
      foot.className = 'ns-foot';
      const blank = document.createElement('button');
      blank.type = 'button';
      blank.className = 'ns-blank';
      blank.innerHTML = '<i class="fa-solid fa-file"></i> Or start from a blank canvas';
      blank.title = 'An empty scenario. The guardrails panel lists what the production engine still needs.';
      blank.addEventListener('click', () => { closeNewScenario(); startBlank(); });
      foot.appendChild(blank);
      panel.appendChild(foot);
    }

    /* Second step, same modal: the seven shapes get the full width instead of
       being squeezed into a select beside a button. */
    function showTemplates() {
      titleEl.innerHTML = '<i class="fa-solid fa-shapes"></i> Start from a template';
      panel.innerHTML = '';
      const list = document.createElement('div');
      list.className = 'ns-list';
      templates.forEach((t) => {
        list.appendChild(menuRow({
          icon: t.icon || 'fa-cube',
          title: t.label || t.id,
          tag: shapeChain(t.shape),
          /* the blurbs already end in a full stop, so a "·" after one reads as a typo */
          lede: [t.blurb || '', typeof t.toFill === 'number' ? `~${t.toFill} fields to fill.` : '']
            .filter(Boolean).join(' '),
          onClick: () => { closeNewScenario(); startFromTemplate(t); }
        }));
      });
      panel.appendChild(list);

      const foot = document.createElement('div');
      foot.className = 'ns-foot';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'ns-blank';
      back.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Back';
      back.addEventListener('click', showMenu);
      foot.appendChild(back);
      panel.appendChild(foot);
    }

    showMenu();
    tplOverlay.querySelector('.exp-close').addEventListener('click', closeNewScenario);
    tplOverlay.addEventListener('click', (e) => { if (e.target === tplOverlay) closeNewScenario(); });
    document.addEventListener('keydown', onTplKey);
    document.body.append(tplOverlay);
  }

  /* The button only exists for a type that ships a gallery. */
  /* Say what happened to a retired ?type= link, rather than silently showing a
     different format than the URL asked for. */
  if (RETIRED_TYPE) {
    setTimeout(() => toast(`"${TYPE_ID}" is no longer authored here — opened ${type.label} instead. Existing scenarios of that shape still play in the player.`), 400);
  }


  let exportOverlay = null;
  const onExportKey = (e) => { if (e.key === 'Escape') closeExport(); };
  function closeExport() {
    if (!exportOverlay) return;
    exportOverlay.remove();
    exportOverlay = null;
    document.removeEventListener('keydown', onExportKey);
  }

  function openExport() {
    closeExport();
    const ho = type.handoff || {};
    exportOverlay = document.createElement('div');
    exportOverlay.className = 'exp-overlay';
    exportOverlay.innerHTML = `
      <div class="exp-modal" role="dialog" aria-modal="true" aria-label="Export scenario">
        <div class="exp-head">
          <div class="exp-titles">
            <div class="exp-title"><i class="fa-solid fa-file-export"></i> Export</div>
            <div class="exp-sub">Two artifacts, and they are not interchangeable — pick by who receives it.</div>
          </div>
          <button class="exp-close" type="button" aria-label="Close">Close</button>
        </div>
        <div class="exp-body">
          <section class="exp-card">
            <h3>Working draft <span class="exp-tag">.json</span></h3>
            <p>The draft exactly as it sits here, nothing stripped — for round-tripping
               between Studio users, or for a colleague to open with <b>New scenario → Open an
               existing scenario</b>. Stamped with the date and time, so a second download
               sits beside the first instead of replacing it.</p>
            <div class="exp-act" id="expDraftAct"></div>
          </section>
          <section class="exp-card is-primary">
            <h3>${esc(ho.label || 'Dev handoff')}</h3>
            ${ho.lead ? `<p>${esc(ho.lead)}</p>` : ''}
            <div class="exp-panel" id="expPanel"></div>
          </section>
        </div>
      </div>`;

    const draftBtn = document.createElement('vaadin-button');
    draftBtn.textContent = 'Download the editor file';
    draftBtn.setAttribute('theme', 'tertiary');
    draftBtn.addEventListener('click', downloadWorkingDraft);
    $('#expDraftAct', exportOverlay).append(draftBtn);

    /* The type builds its own handoff panel — the shell renders it and knows
       nothing about what is inside. A panel that throws must not take the whole
       dialog with it, so the working-draft path stays usable either way. */
    try {
      $('#expPanel', exportOverlay).append(ho.build(studioApi));
    } catch (err) {
      const oops = document.createElement('p');
      oops.className = 'exp-err';
      oops.textContent = 'This handoff panel failed to build: ' + String((err && err.message) || err);
      $('#expPanel', exportOverlay).append(oops);
    }

    $('.exp-close', exportOverlay).addEventListener('click', closeExport);
    exportOverlay.addEventListener('mousedown', (e) => { if (e.target === exportOverlay) closeExport(); });
    document.addEventListener('keydown', onExportKey);
    document.body.append(exportOverlay);
  }

  $('#exportBtn').addEventListener('click', () => {
    if (type.handoff && typeof type.handoff.build === 'function') openExport();
    else downloadWorkingDraft();
  });

  /* Import JSON — load a scenario file a colleague sent you into the editor.
     Runs the parsed object through mergeScenario (which normalizes it), so
     partial or older-schema files still load. Replaces the draft after a
     confirm, exactly like loading from the library. */
  const importFile = $('#importFile');
  /* No toolbar button any more — "Open an existing scenario" in the New scenario
     panel triggers this same input. Opening a file IS starting on a scenario, so
     it belongs with the other ways to start rather than beside Export. */
  importFile.addEventListener('change', () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let obj;
      try {
        obj = JSON.parse(reader.result);
      } catch (err) {
        toast('That file isn\'t valid JSON — nothing changed');
        importFile.value = '';
        return;
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        toast('That JSON isn\'t a scenario — nothing changed');
        importFile.value = '';
        return;
      }
      /* Same contract as every other way of starting: snapshot whatever is here,
         then adopt. The confirm this used to show was asking the author to accept
         losing work — now there is nothing to lose, so there is nothing to ask. */
      const incoming = mergeScenario(obj);
      adoptScenario(incoming, `Opened "${incoming.title || file.name}"`);
      importFile.value = '';   // allow re-opening the same filename twice in a row
    };
    reader.onerror = () => { toast('Couldn\'t read that file'); importFile.value = ''; };
    reader.readAsText(file);
  });

  $('#copyPromptBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(activePromptText);
    toast('Compiled prompt copied');
  });

  /* ---- scenario library (topbar popover) ----------------------------------
     Named saved scenarios in this browser. "Save current" snapshots the
     draft under its title; loading an entry REPLACES the draft (after
     confirm). The published slot is separate and untouched by all of this. */
  const libBtn = $('#libraryBtn');
  const libPanel = $('#libPanel');

  /* "Library" oversold this. It is not a library and it is not a preview: it is a
     set of draft snapshots in ONE browser's localStorage, gone if site data is
     cleared, invisible to everyone else. Now that a finished scenario leaves as an
     exported .lo.json, the honest framing is that these are working copies and the
     FILE is the real one — so the panel says that rather than implying this is
     where scenarios live. */
  function renderLibrary() {
    const entries = type.store.listLibrary();
    let html = '<div class="libhead">Local drafts — this browser only</div>';
    if (!entries.length) {
      html += '<div class="libempty">Nothing saved yet. Snapshots let you park a draft and start another without losing it. They live in this browser only — to keep a scenario properly, Export it and upload the file back.</div>';
    } else {
      html += entries.map((e) => {
        const when = e.savedAt ? new Date(e.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        return `<div class="librow">
          <button class="meta" data-load="${esc(e.id)}" data-title="${esc(e.title)}" title="Load into the editor"><span class="t">${esc(e.title)}</span><span class="d">Saved ${esc(when)}</span></button>
          <button class="rm" data-remove="${esc(e.id)}" data-title="${esc(e.title)}" aria-label="Delete ${esc(e.title)} from library"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
        </div>`;
      }).join('');
    }
    html += `<button class="libsave" id="libSaveBtn"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Snapshot this draft</button>`;
    libPanel.innerHTML = html;

    $('#libSaveBtn', libPanel).addEventListener('click', () => {
      type.store.saveToLibrary(clone(scenario));
      renderLibrary();
      toast(`Snapshot saved — "${type.store.titleOf ? type.store.titleOf(scenario) : (scenario.title || 'untitled')}"`);
    });
    $$('[data-load]', libPanel).forEach((b) => b.addEventListener('click', () => {
      const s = type.store.loadFromLibrary(b.dataset.load);
      if (!s) { toast('That entry could not be loaded'); return; }
      /* Named from the ROW, not from s.title — a POC V4 document keeps its title
         under `content`, so the top-level read was undefined and the dialog
         asked about "undefined". The row already shows the right name. */
      const name = b.dataset.title || 'this draft';
      askConfirm({
        title: `Open “${name}”?`,
        body: 'It replaces what you are editing now. Snapshot the current draft first if you want to keep it.',
        confirmLabel: 'Open it',
      }, () => {
        scenario = mergeScenario(s);
        activeItem = null;              // the new document has different steps
        buildNav();
        buildForm();
        update();
        if (playtestHandle) playtestHandle.reset();
        closeLibrary();
        toast(`Loaded "${name}"`);
      });
    }));
    $$('[data-remove]', libPanel).forEach((b) => b.addEventListener('click', () => {
      askConfirm({
        title: `Delete “${b.dataset.title || 'this snapshot'}”?`,
        body: 'Snapshots live in this browser only, so there is no other copy of it. This cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      }, () => {
        type.store.removeFromLibrary(b.dataset.remove);
        renderLibrary();
        toast('Snapshot deleted');
      });
    }));
  }

  function openLibrary() {
    renderLibrary();
    libPanel.hidden = false;
    libBtn.setAttribute('aria-expanded', 'true');
  }
  function closeLibrary() {
    libPanel.hidden = true;
    libBtn.setAttribute('aria-expanded', 'false');
  }
  libBtn.addEventListener('click', () => (libPanel.hidden ? openLibrary() : closeLibrary()));
  document.addEventListener('click', (e) => {
    if (!libPanel.hidden && !e.composedPath().includes(libPanel) && !e.composedPath().includes(libBtn)) closeLibrary();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !libPanel.hidden) closeLibrary(); });

  /* ---- scroll spy: keep the nav highlighting the visible section ---------- */
  const spy = new IntersectionObserver((entries) => {
    // Only the section buttons — a list's item rows live inside the same
    // container and are selected by the author, never by the scroll position.
    if (activeItem) return;
    entries.forEach((en) => {
      if (en.isIntersecting) {
        $$('.phase-sections > button').forEach((b) =>
          b.classList.toggle('is-active', b.dataset.sec === en.target.id.replace('sec-', '')));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  /* ---- type label + switcher ----------------------------------------------
     The sub-title names the pedagogy being edited. When more than one type is
     registered, a small dropdown switches between them (each type has its own
     draft/published/library, so switching just reloads with ?type=). */
  (function initModeLabel() {
    // The sub-title just orients the author; the interactive mode CHOICE now
    // lives inside the Interaction phase (buildModeChooser), so a phase-level
    // decision sits with the other phase-level decisions.
    const sub = $('#subTitle');
    if (sub) sub.textContent = 'Scenario Simulator · ' + type.label;
  })();

  /* ---- inspector collapse ------------------------------------------------
     The prompt/guardrails/playtest panel is powerful but space-hungry, so it
     collapses to a slim rail. The choice is remembered across sessions. */
  (function initInspectorToggle() {
    const cols = $('.cols');
    const KEY = 'aithera.writerStudio.inspector';
    const setCollapsed = (collapsed) => {
      cols.classList.toggle('insp-collapsed', collapsed);
      const t = $('#inspToggle');
      if (t) t.setAttribute('aria-expanded', String(!collapsed));
      localStorage.setItem(KEY, collapsed ? 'collapsed' : 'open');
    };
    if (localStorage.getItem(KEY) === 'collapsed') setCollapsed(true);
    $('#inspToggle').addEventListener('click', () => setCollapsed(true));
    $('#inspRail').addEventListener('click', () => setCollapsed(false));
  })();

  /* ---- boot ---------------------------------------------------------------- */
  buildNav();
  buildForm();
  buildPlaytest();
  buildSplitSandbox();
  update();
  // [V2] deep link: ?wizard=1 opens the start-from-scratch wizard directly.
  if (new URLSearchParams(location.search).get('wizard') === '1') openWizard();
  /* First visit in this browser: show the front door rather than an empty form.
     An author who boots with nothing has no scenario to edit, so the three-column
     editor behind this is a lint dot on every section and no way to tell what to
     do about it — the four ways to start are the answer, and they already exist.
     Gated on `bootedEmpty` so it fires once per browser and never over a deep
     link (?example=, ?wizard=) or a draft in progress. */
  else if (bootedEmpty && !RETIRED_TYPE) openNewScenario();
