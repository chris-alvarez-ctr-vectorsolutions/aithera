/* =========================================================================
   UNIVERSAL SCENARIO  ·  authoring POC V4 directly   (window.AitheraV4Universal)
   -------------------------------------------------------------------------
   The Writer Studio surface for POC V4 (Scenario CML v4) — the format the
   production Scenario Simulator engine runs on.

   WHY THIS IS ONE TYPE AND NOT EIGHT
   POC V4 has no scenario type field: a scenario is `content.phases[]`, and each
   phase's `practice.mode` picks coach_inquiry | roleplay | observe_react. What a
   scenario IS emerges from the modes it uses. So the eight UX Universal types do
   not become eight editors — they become TEMPLATES in the gallery
   (js/scenario-v4-templates.js, decision D7), and an LXD picks one and then edits
   anything. There is exactly one editor.

   WHAT THE LXD SEES
   The wizard is the guided path. Past it, every field is editable in granular
   detail — including the ones POC V4 requires that no LXD deck provides
   (`purpose`, the transition button labels, `final_word`). Those are deliberately
   NOT hidden: hiding them would leave an LXD unable to finish a scenario the
   format demands, and the lints below name each one.

   HOW IT CONNECTS
     authored POC V4 doc
       → ScenarioV4.validate()        live "would this load?" feedback (lints)
       → ScenarioV4Runtime.compile()  the runtime shape sim-player already reads
       → AitheraMixArc.compile()      the system prompt (same builder as before)

   ONE RULE WORTH KNOWING BEFORE EDITING THIS FILE
   POC V4 sets additionalProperties:false at every level, so ANY key this editor
   writes into the document must be a real v4 field. UI state (which step cards
   are expanded) therefore lives in a module-level Set, never on the phase —
   a stray `__open` would fail the production loader. normalize() also strips any
   `__`-prefixed key, so a draft saved by an older build cannot smuggle one into
   an export.
   ========================================================================= */
(function () {
  'use strict';

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  const arr = (x) => Array.isArray(x) ? x : [];
  const str = (x) => typeof x === 'string' ? x : '';
  const empty = (v) => !String(v ?? '').trim();

  const V4 = () => window.ScenarioV4 || null;
  const V4RT = () => window.ScenarioV4Runtime || null;
  const TPL = () => window.ScenarioV4Templates || null;
  const MIX = () => window.AitheraMixArc || null;

  /* Keys the STUDIO SHELL writes onto every draft (ensureCtx() in
     studio-shell.js: contextSource, previousLO — its platform-level context
     plumbing). They are legitimate on the working draft, but they are not POC V4
     fields: left in place they show up as bogus validation errors (the mystery
     "+2" in the lints count) and would ride into a dev export and fail the
     loader. So validation and export run on a copy with them removed; normalize
     leaves them alone because the shell reads them off the live draft. */
  const SHELL_KEYS = ['contextSource', 'previousLO'];
  function withoutShellKeys(doc) {
    const d = clone(doc);
    SHELL_KEYS.forEach(function (k) { delete d[k]; });
    return d;
  }

  /* What withoutShellKeys() COSTS, in the same {path, consequence} shape
     stripExtensions() reports — so the handoff panel can list both together.
     -----------------------------------------------------------------------
     This exists because the export was silently lossy in exactly the place the
     panel promised it wasn't. The stripping happened BEFORE stripExtensions ran,
     so these removals never entered `removed`, and the panel then told the author
     "Nothing else is changed" while the prior-scenario context went out with the
     rubbish. That context is the one thing the 2026-08-18 alignment meeting said
     YES to (for the model, never learner-facing) — reporting it is the floor, and
     a field in the format is the fix. See docs/reference/V4-ALIGNMENT-NOTES.md.

     Reported only when the block would actually have compiled: an empty
     previousLO costs nothing, and warning about it would train authors to ignore
     the panel that matters. Same emptiness test as priorLoBlock(). */
  function shellKeysRemoved(doc) {
    const d = obj(doc);
    if (str(d.contextSource) !== 'previous-lo') return [];
    const lo = obj(d.previousLO);
    const authored = ['title', 'covered', 'handoff'].filter(function (k) { return str(lo[k]).trim(); });
    if (!authored.length) return [];
    return [{
      path: 'previousLO (' + authored.join(', ') + ')',
      value: lo,
      consequence: 'the coach loses what ran before this scenario — Scenario CML v4 has no field '
        + 'for prior-learning-object context, so the exported document carries no record that any '
        + 'was authored, and the production engine will open cold',
    }];
  }

  /* ---- the document skeleton -------------------------------------------
     normalize() must make a half-built draft SAFE TO RENDER without inventing
     content. Every container the editor binds into has to exist; not one string
     gets a made-up value. */
  function normalize(s) {
    const d = obj(clone(s || {}));
    if (typeof d.implementation_id !== 'string') d.implementation_id = '';
    d.modality = 'ai-conversational';                 // POC V4 rejects any other value
    if (!/^4\./.test(str(d.schema_version))) d.schema_version = '4.0';

    const c = d.content = obj(d.content);
    if (typeof c.title !== 'string') c.title = '';
    if (typeof c.coach_persona !== 'string') c.coach_persona = '';
    if (!Array.isArray(c.teaching_points)) c.teaching_points = [];
    if (!Array.isArray(c.phases)) c.phases = [];
    c.closing = obj(c.closing);
    c.closing.ideal_response = obj(c.closing.ideal_response);
    const ir = c.closing.ideal_response;
    if (!Array.isArray(ir.component_groups)) ir.component_groups = [];
    if (typeof ir.summary !== 'string') ir.summary = '';

    /* UI SCAFFOLDING — every container a section binds into MUST exist, or the
       shell's rowsBlock crashes on undefined and the whole page's form build
       dies with it (found the hard way: the Debrief & Close page rendered zero
       cards because source_references was absent). POC V4 treats an empty
       optional array as INVALID rather than absent — that conflict is resolved
       by prune() below, which strips empty scaffolding before anything
       validates, exports, or plays. normalize scaffolds; prune unscaffolds. */
    /* PROVENANCE — normalize records which of these optional arrays IT invented,
       so prune() can drop exactly those and leave an array the document ARRIVED
       with alone. Without this, an edit-free round trip of a production document
       silently loses `source_references: []`: their generator writes it, their
       schema permits it (the field carries no minItems), and we deleted it on the
       way back out — six of their eleven live documents differed by exactly that.
       The marker is cumulative on purpose: normalize runs again on every edit, and
       by the second pass the container already exists, so a fresh scan would find
       nothing to record and the provenance would evaporate. */
    const made = arr(d.__scaffolded).filter((x) => typeof x === 'string');
    const scaffoldArray = (holder, key, path) => {
      if (Array.isArray(holder[key])) return;
      holder[key] = [];
      if (made.indexOf(path) < 0) made.push(path);
    };
    scaffoldArray(c, 'tone_guidelines', 'tone_guidelines');
    scaffoldArray(c, 'misconceptions', 'misconceptions');
    scaffoldArray(c.closing.ideal_response, 'source_references', 'source_references');
    if (made.length) d.__scaffolded = made; else delete d.__scaffolded;
    c.scene_world = obj(c.scene_world);
    if (typeof c.scene_world.setting !== 'string') c.scene_world.setting = '';
    c.scene_world.canon = obj(c.scene_world.canon);
    if (!Array.isArray(c.scene_world.canon.facts)) c.scene_world.canon.facts = [];
    if (!Array.isArray(c.scene_world.characters)) c.scene_world.characters = [];
    c.opening = obj(c.opening);
    if (typeof c.opening.id !== 'string' || !c.opening.id) c.opening.id = 'opening_reflection';
    if (!Array.isArray(c.opening.opening_messages)) c.opening.opening_messages = [];
    c.opening.exit = obj(c.opening.exit);
    c.opening.exit.when = obj(c.opening.exit.when);
    c.opening.transition = obj(c.opening.transition);
    arr(c.phases).forEach((p) => {
      const ph = obj(p);
      Object.keys(ph).forEach((k) => { if (k.indexOf('__') === 0) delete ph[k]; });
      ph.practice = obj(ph.practice);
      ph.practice.exit = obj(ph.practice.exit);
      ph.practice.exit.when = obj(ph.practice.exit.when);
      ph.practice.transition = obj(ph.practice.transition);
      ph.practice.interaction = obj(ph.practice.interaction);
      ph.debrief = obj(ph.debrief);
      if (!Array.isArray(ph.debrief.key_points)) ph.debrief.key_points = [];
      ph.debrief.transition = obj(ph.debrief.transition);
      if (typeof ph.debrief.follow_up_turns !== 'number') ph.debrief.follow_up_turns = 0;
    });

    /* Fill the mechanical fields POC V4 requires that no LXD deck provides —
       button labels and the model-facing purposes. Done here rather than at
       export so the author SEES the default and can overwrite it; nothing
       authored is ever replaced. Teaching prose (final_word) is untouched. */
    const v4 = V4();
    if (v4 && typeof v4.applyHouseDefaults === 'function') v4.applyHouseDefaults(d);
    return d;
  }

  /* prune — strip UI scaffolding so the document is honest POC V4 again.
     The exact inverse of normalize's scaffolding: empty strings drop out of
     string arrays; empty optional arrays drop entirely; an opening or scene
     world that carries no authored text drops as a block. Runs on a COPY —
     the live draft keeps its scaffolding for the editor to bind to. */
  function prune(docIn) {
    const d = clone(docIn);
    const c = obj(d.content);
    const cleanStrings = (a) => arr(a).map(str).filter((x) => x.trim());
    /* Whether an empty array may survive is a question about THEIR schema, not a
       matter of taste, and the schema answers it per field: sixteen arrays carry
       `minItems: 1` (so `[]` is a hard load failure and must drop), and the rest
       permit empty. For the ones that permit it, the only remaining question is
       whose empty array it is — one the document ARRIVED with stays, one
       normalize() invented goes, per the provenance marker above. That is the
       whole difference between an edit-free export being byte-identical to its
       import and being off by a field, which six of their eleven live documents
       were. No marker means normalize invented nothing, so nothing is presumed
       ours.  emptyLegal=false → always drop; true → drop only what we made. */
    const scaffolded = arr(docIn.__scaffolded);
    const dropIfEmpty = (holder, key, val, path, emptyLegal) => {
      const isEmpty = Array.isArray(val) ? !val.length : !val;
      const ours = scaffolded.indexOf(path) >= 0;
      if (isEmpty && (!emptyLegal || ours)) delete holder[key];
      else holder[key] = val;
    };

    dropIfEmpty(c, 'tone_guidelines', cleanStrings(c.tone_guidelines), 'tone_guidelines', false);   // minItems: 1
    dropIfEmpty(c, 'misconceptions', arr(c.misconceptions).filter((m) =>
      str(obj(m).misconception).trim() || str(obj(m).redirect).trim()), 'misconceptions', true);
    c.teaching_points = arr(c.teaching_points).map((t) => {
      const topic = obj(t);
      return { topic: str(topic.topic), points: cleanStrings(topic.points) };
    }).filter((t) => t.topic.trim() || t.points.length);

    const ir = obj(obj(c.closing).ideal_response);
    if (ir) {
      dropIfEmpty(ir, 'source_references', cleanStrings(ir.source_references), 'source_references', true);
      ir.component_groups = arr(ir.component_groups).map((g) => {
        const group = obj(g);
        const out = { components: cleanStrings(group.components) };
        if (str(group.title).trim()) out.title = str(group.title);
        return out;
      }).filter((g) => g.components.length);
      if (!ir.component_groups.length) delete ir.component_groups;
    }

    const sw = obj(c.scene_world);
    const characters = arr(sw.characters).filter((ch) => str(obj(ch).name).trim() || str(obj(ch).id).trim());
    const facts = cleanStrings(obj(sw.canon).facts);
    const world = {};
    if (str(sw.setting).trim()) world.setting = str(sw.setting);
    if (facts.length) world.canon = { facts: facts };
    if (characters.length) world.characters = characters;
    if (Object.keys(world).length) c.scene_world = world; else delete c.scene_world;

    const op = obj(c.opening);
    const opMessages = arr(op.opening_messages).filter((m) => str(obj(m).text).trim());
    const openingAuthored = opMessages.length || str(op.label).trim() || str(op.purpose).trim();
    if (openingAuthored) {
      op.opening_messages = opMessages;
      if (!obj(obj(op.exit).when).turns) { op.exit = obj(op.exit); op.exit.when = { turns: 2 }; }
    } else {
      delete c.opening;
    }

    arr(c.phases).forEach((p) => {
      const ph = obj(p);
      const db = obj(ph.debrief);
      if (Array.isArray(db.key_points)) db.key_points = cleanStrings(db.key_points);
      const it = obj(obj(ph.practice).interaction);
      ['opening_messages', 'brief'].forEach((k) => {
        if (Array.isArray(it[k])) {
          it[k] = it[k].filter((m) => str(obj(m).text).trim());
          if (!it[k].length) delete it[k];
        }
      });
      if (Array.isArray(it.carryover)) {
        it.carryover = it.carryover.filter((cv) => str(obj(cv).from).trim());
        if (!it.carryover.length) delete it.carryover;
      }
      if (Array.isArray(it.rubric)) {
        it.rubric = it.rubric.filter((r) => str(obj(r).id).trim() || str(obj(r).name).trim());
        if (!it.rubric.length) delete it.rubric;
      }
      const ex = obj(it.exhibit);
      if (Array.isArray(ex.facts)) {
        ex.facts = cleanStrings(ex.facts);
        if (!ex.facts.length) delete ex.facts;
      }
      /* empty optional strings drop everywhere — "": is a minLength failure,
         absent is legal */
      const dropEmptyStr = (holder, keys) => keys.forEach((k) => {
        if (k in holder && !str(holder[k]).trim() && holder[k] !== null) delete holder[k];
      });
      dropEmptyStr(it, ['setting', 'character_id', 'emotion_hint', 'partner_label', 'input_placeholder', 'jot_placeholder']);
      dropEmptyStr(db, ['final_word', 'purpose', 'partner_label', 'requirement', 'input_placeholder']);
      dropEmptyStr(obj(db.transition), ['text']);
      dropEmptyStr(obj(ph.practice), ['label']);
      dropEmptyStr(obj(obj(ph.practice).exit), ['final_word']);
      dropEmptyStr(obj(obj(obj(ph.practice).exit).when), ['requirement']);
      dropEmptyStr(obj(obj(ph.practice).transition), ['text']);
      const probe = obj(db.probe);
      if ('probe' in db && !str(probe.text).trim()) delete db.probe;
      const media = obj(it.media);
      if ('media' in it && !str(media.src).trim()) delete it.media;
      const exhibit = obj(it.exhibit);
      if ('exhibit' in it && !str(exhibit.src).trim()) delete it.exhibit;
    });
    if ('narrative' in c && !str(c.narrative).trim()) delete c.narrative;
    if ('landing_cta_label' in c && !str(c.landing_cta_label).trim()) delete c.landing_cta_label;
    const opn = obj(c.opening);
    if (c.opening) {
      ['label', 'purpose', 'input_placeholder'].forEach((k) => {
        if (k in opn && !str(opn[k]).trim() && k !== 'label' && k !== 'purpose') delete opn[k];
      });
      if ('final_word' in obj(opn.exit) && !str(obj(opn.exit).final_word).trim()) delete opn.exit.final_word;
    }
    delete d.__scaffolded;   // ours, never theirs — never reaches validation or export
    return d;
  }

  /* A blank canvas is genuinely blank — never merged with a template, or the
     demo content leaks into what the author thinks is their own scenario. */
  function blank() {
    return normalize({
      implementation_id: '',
      schema_version: '4.0',
      content: {
        title: '', narrative: '', coach_persona: '',
        teaching_points: [{ topic: '', points: [''] }],
        phases: [{
          id: 'phase1', label: '', purpose: '',
          practice: {
            mode: 'coach_inquiry', purpose: '',
            exit: { when: { turns: 2 } },
            transition: { button_label: '' },
            interaction: { opening_messages: [{ text: '' }] },
          },
          debrief: { label: '', key_points: [''], follow_up_turns: 0, final_word: '', transition: { button_label: '' } },
        }],
        closing: { ideal_response: { component_groups: [{ title: '', components: [''] }], summary: '' } },
      },
    });
  }

  const DEFAULT = (function () {
    const t = TPL();
    /* Mix & Match is the template POC V4 is natively — one composable arc. */
    const doc = t && t.get('mix-arc');
    return normalize(doc || blank());
  }());

  /* merge — bring an INCOMING document up to the current editor shape. Two
     callers: restoring the saved draft on boot, and importing a file.

     It deliberately does NOT start from DEFAULT. DEFAULT is the Mix & Match demo
     template (see above), so basing the merge on it meant any document missing a
     top-level `content` key silently INHERITED that demo's authored prose. Most
     production scenarios have no opening reflection — bullying.lo.json does not —
     so importing one grafted the template's "gut read: what just happened in that
     stand-up" beat onto it, and the editor then reported three blocking errors
     about an opening the document never had. Under "edit the JSON and upload it
     back", that is one scenario's content shipped inside another.

     normalize() already scaffolds every container the editor binds to without
     authoring a single word, which is the whole job here. */
  function merge(draft) {
    const d = obj(clone(draft));
    /* Provenance is decided from the INCOMING document, before normalize scaffolds
       these containers — afterwards an empty array it arrived with is
       indistinguishable from one we supplied. */
    const dc = obj(d.content);
    const dir = obj(obj(dc.closing).ideal_response);
    const made = [];
    if (!Array.isArray(dc.tone_guidelines)) made.push('tone_guidelines');
    if (!Array.isArray(dc.misconceptions)) made.push('misconceptions');
    if (!Array.isArray(dir.source_references)) made.push('source_references');
    const out = normalize(d);
    arr(out.__scaffolded).forEach((k) => { if (made.indexOf(k) < 0) made.push(k); });
    if (made.length) out.__scaffolded = made; else delete out.__scaffolded;
    return out;
  }

  function isValid(s) {
    const d = obj(s);
    return !!d.content && typeof d.content === 'object' && Array.isArray(d.content.phases);
  }

  /* ---- compile ---------------------------------------------------------
     POC V4 → runtime → the existing prompt builder. Reusing mix-arc's builder is
     deliberate: the runtime compiler emits the field names it already reads, so
     the prompt is built by shipped, exercised code rather than a second
     implementation that could drift. */
  /* toRuntime — the player contract. scenario-live.html's resolver calls
     PLAY_TYPE.toRuntime(PLAY_SRC) on whatever ?type= resolves to, so exposing
     this is what makes ?type=v4-universal play with ZERO resolver edits. */
  function toRuntime(s) {
    const rt = V4RT();
    if (!rt) throw new Error('scenario-v4-runtime.js must load before v4-universal.js');
    /* prune, so UI scaffolding never plays — an opening with no authored text
       must not produce an empty reflection screen. */
    return rt.compile(prune(withoutShellKeys(normalize(s))));
  }

  /* The observe rubric, as a prompt section. mix-arc's compile knows nothing
     about hazards — the crediting INSTRUCTIONS come per turn from the spot
     surface (sim-observe-text's coverageBlock), but the rubric DEFINITIONS must
     already be in the system prompt or the model is told to credit ids it has
     never seen. Modeled on scene-sweep's compiled rubric section, the shipped
     and proven wording. */
  function rubricBlock(runtime) {
    const hazards = arr(obj(runtime).hazards).filter(function (h) { return obj(h).id; });
    if (!hazards.length) return '';
    const cov = obj(runtime.coverage);
    const scene = obj(runtime.scene);
    const parts = [];
    if (str(scene.canonDescription)) {
      parts.push('THE OBSERVED SCENE (what you are grounded to — the learner sees an image of exactly this; you do not):\n'
        + str(scene.canonDescription));
    }
    parts.push('THE OBSERVABLE RUBRIC — the ONLY findable items in the scene and the ONLY ones you credit. '
      + 'For each: its id, what it is, and where to nudge (never naming what is there):\n\n'
      + hazards.map(function (h) {
        return '· "' + h.id + '" — ' + (str(h.full) || str(h.short))
          + (str(h.zone) ? ' (nudge toward: ' + str(h.zone) + ')' : '');
      }).join('\n'));
    parts.push('SPOTTED FIELD — on every turn during the Observe step, set "spotted" to the array of rubric ids the '
      + 'learner has now CLEARLY named, CUMULATIVELY across the step. Valid ids: '
      + hazards.map(function (h) { return '"' + h.id + '"'; }).join(', ')
      + '. Credit generously in any phrasing; never credit or invent an item outside the rubric. '
      + 'The step completes at ' + (cov.required || hazards.length) + ' of ' + hazards.length
      + ' catches. Outside the Observe step, omit "spotted".');
    return '\n\n' + parts.join('\n\n');
  }

  /* The content-safety floors, appended for the flags mix-arc's builder does not
     consume. Found while verifying the debrief-rung change: mix-arc compiles
     THREAT_SECTION off threatContent, but carries elevatedStakes as data only —
     its own Kendra example says "the 988 crisis floor applies" and never got
     one — and the minor floor is ensemble-only. So on the v4 route two of the
     three safety flags armed NOTHING, which is precisely the silent regression
     the extension fields exist to prevent. Canonical sources, never re-authored
     here: the LEARNER SAFETY paragraph mirrors guided-arc's compile (the shipped
     wording), the 988 line is window.AitheraScenario.CRISIS_FLOOR, the minor
     floor is ensemble-arc's MINOR_SECTION.text(). */
  function floorsBlock(runtime, base) {
    const parts = [];
    const hasScene = arr(obj(runtime).phases).some(function (r) { return obj(r).world === 'scene'; });
    /* The crisis paragraph used to live HERE, gated on elevatedStakes — which
       meant an unflagged v4 scenario compiled with no learner-safety text at all,
       because the builder underneath had none either. It is now unconditional in
       mix-arc's compile (its "7) Locked floors" block, guided-arc's shipped
       wording, with the 988 sentence still added only when elevatedStakes is
       set). Removed from here rather than kept, so the paragraph has exactly one
       source and a flagged scenario does not receive it twice. */
    if (runtime.elevatedStakes && !/LEARNER SAFETY/.test(String(base || ''))) {
      /* Defensive only: if this page ever loads v4-universal WITHOUT the mix-arc
         builder that now owns the paragraph, a flagged scenario must not go out
         bare. Normal pages never take this branch. */
      parts.push('LEARNER SAFETY — HIGHEST PRIORITY, overrides everything: if the learner discloses, '
        + 'AS THEMSELVES rather than as a line in the exercise, that THEY are being harmed or are in '
        + 'distress, drop the exercise immediately (set "action":"redirect"' + (hasScene ? ', leave the scene' : '') + '). '
        + 'In the coach voice, acknowledge with warmth and zero assessment, say the practice can wait, '
        + 'and point to real support appropriate to the situation. If they mention self-harm, add the '
        + '988 Suicide & Crisis Lifeline (call or text 988)'
        + '. Ask nothing probing.');
    }
    if (runtime.involvesMinors) {
      const en = window.AitheraEnsembleArc;
      const section = en && arr(en.ENGINE_SECTIONS).find(function (x) { return obj(x).id === 'minor'; });
      if (section && typeof section.text === 'function') {
        parts.push(section.text());
      } else {
        /* Canonical source unavailable on this page — a minimal floor derived
           from the section's own note, never silence. */
        parts.push('MINOR-SAFEGUARDING FLOOR — this scenario involves minors: portray and protect them '
          + 'age-appropriately; consequences stay recoverable; nothing gratuitous.');
      }
    }
    return parts.length ? '\n\n' + parts.join('\n\n') : '';
  }

  /* ------------------------------------------------------------------------
     PRIOR LEARNING OBJECT — for the MODEL, never for the learner
     ------------------------------------------------------------------------
     Approved 2026-08-18: yes to carrying what the learner just completed, but
     "only for the LLM to understand what the learner just learned (not
     user-facing)" — and no media cold-open.

     The awkward part, recorded because it is a real gap rather than an
     oversight: v4 has NO field for this. The studio has had the authoring for a
     while (`contextSource: 'previous-lo'` plus `previousLO {title, covered,
     handoff}`) and observe-react and teach-back compile it, but this route
     listed both keys in SHELL_KEYS and stripped them before validation AND
     export — correctly, since the loader would reject them — with the result
     that the one thing the meeting said yes to was the one thing the go-forward
     path silently dropped.

     So it is read off the LIVE DRAFT here and appended to the prompt only. The
     stripping is unchanged: nothing about the exported document moves, so this
     buys the approved behaviour without inventing a field the format has not
     agreed to. If v4 later gains one, this block reads it instead and nothing
     else changes.
     --------------------------------------------------------------------- */
  function priorLoBlock(draft) {
    const d = obj(draft);
    if (str(d.contextSource) !== 'previous-lo') return '';
    const lo = obj(d.previousLO);
    const title = str(lo.title).trim();
    const covered = str(lo.covered).trim();
    const handoff = str(lo.handoff).trim();
    if (!title && !covered && !handoff) return '';
    /* Modality-neutral on purpose. What lands here is whatever came immediately
       before the scenario — a video the learner watched, a reading, a section of
       a course — so the labels must not assert "completed a module". Any one
       field on its own is a valid authoring, which is what makes the current
       "just a block of text" shape work: an author can describe a video in
       `covered` alone and the block still reads correctly. */
    const lines = [];
    if (title) lines.push('Just before this: ' + title);
    if (covered) lines.push('What it covered: ' + covered);
    if (handoff) lines.push('Where it left them: ' + handoff);
    return '\n\nWHAT THE LEARNER JUST SAW OR DID — context for YOU, never recited back. '
      + 'Immediately before this scenario they watched, read, or worked through what is '
      + 'described below, so treat it as already known: build on it, and do not re-teach it '
      + 'as though it were new. It is background for your judgement, NOT content to quote, '
      + 'summarise, or open with.\n'
      + lines.join('\n');
  }

  /* ------------------------------------------------------------------------
     PROGRESSIVE DISCLOSURE — v4 `characters[].canon_facts[]`
     ------------------------------------------------------------------------
     v4's canon_facts are exactly our earned disclosures: a fact the character
     holds back, plus `reveal_when` — the condition that earns it. We shipped
     this mechanic first (ensemble-arc's `cast[].disclosures[]`, its headline
     capability) and then never wired v4's field to it, so every canon_fact in
     the POC's content was dropped on our route.

     Appended here rather than taught to the mix-arc builder, which has no
     disclosure concept — the same shape the safety floors already use, with
     ensemble-arc's canonical wording so both routes instruct identically.
     --------------------------------------------------------------------- */
  function disclosuresBlock(runtime) {
    const chars = arr(obj(obj(runtime).sceneWorld).characters).filter(function (c) {
      return arr(obj(c).canon_facts).some(function (f) { return str(obj(f).fact).trim(); });
    });
    if (!chars.length) return '';
    return '\n\nPROGRESSIVE DISCLOSURE — the heart of this scenario. Each character holds parts of their story back and reveals a piece ONLY when the learner earns it. Never volunteer these in an opening turn, and never dump them all at once — a character gives up one thing at a time, in response to how they\u2019re being treated. If the learner doesn\u2019t earn a disclosure, the character KEEPS it; the debrief still makes sure the learner leaves knowing what mattered.\n\n' +
      chars.map(function (c) {
        return str(obj(c).name || obj(c).id) + ':\n' +
          arr(obj(c).canon_facts).filter(function (f) { return str(obj(f).fact).trim(); })
            .map(function (f) {
              return '- Holds back: ' + str(obj(f).fact).trim() +
                '\n  Earned by: ' + (str(obj(f).reveal_when).trim() ||
                  'the learner treating them with genuine care.');
            }).join('\n');
      }).join('\n\n');
  }

  function compileString(s) {
    const rt = V4RT();
    const mix = MIX();
    if (!rt || !mix) return 'Cannot compile: scenario-v4-runtime.js and mix-arc.js must load first.';
    try {
      const runtime = rt.compile(prune(withoutShellKeys(normalize(s))));
      /* base composed once so floorsBlock can SEE whether the builder already
         emitted the learner-safety paragraph (it now does, unconditionally) and
         skip its own defensive copy instead of duplicating it. */
      const base = mix.compile(runtime);
      return base + rubricBlock(runtime) + floorsBlock(runtime, base) + disclosuresBlock(runtime)
        + priorLoBlock(s);
    } catch (e) {
      return 'Compile failed: ' + (e && e.message ? e.message : String(e));
    }
  }

  /* The two-conversation scoping contract (§5 change #2) — the player calls
     this once and then asks it, per turn, for the active scope's system prompt
     and the scope-filtered history. Scopes are the SAME string builder above
     run over redacted copies of the document (see scenario-v4-scopes.js), so
     the engine contract is identical in every scope by construction. */
  function compileScopes(s, opts) {
    const scopes = window.ScenarioV4Scopes;
    if (!scopes) return null;
    /* Shell keys are NOT stripped at this boundary, deliberately. The scope
       module hands each redacted copy back to compileString, which is where the
       prior-LO block reads them — strip here and the approved context never
       reaches any scope's prompt. Nothing downstream is exposed to them:
       `create` only reads content.phases and calls toRuntime, and toRuntime
       strips them itself before the runtime compile, as do validate and export. */
    return scopes.create(prune(normalize(s)), {
      compile: compileString,
      toRuntime: toRuntime,
      runtime: opts && opts.runtime,
    });
  }

  /* The inspector's view: the ordered per-scope prompts (the shell's
     compiled-prompt tab renders {role,label,text} arrays — the teach-back
     precedent). Falls back to the monolith string when the scopes module is
     not loaded on a page. */
  function compile(s) {
    const scoped = compileScopes(s);
    if (!scoped) return compileString(s);
    try { return scoped.prompts(); }
    catch (e) { return compileString(s); }
  }

  /* POC V4 content carries no {{placeholders}} — the learner is always "you"
     (§4.1 writes the narrative in second person). Delegating anyway keeps any
     ported legacy string behaving as it did. */
  function fill(t, s) {
    const mix = MIX();
    return mix && typeof mix.fill === 'function' ? mix.fill(t, s) : str(t);
  }

  /* Authored strings, so the compiled-prompt tab can highlight what the designer
     wrote versus what the template contributes. */
  function highlightStrings(s) {
    const c = obj(obj(s).content);
    const out = [str(c.title), str(c.narrative), str(c.coach_persona)];
    arr(c.tone_guidelines).forEach((g) => out.push(str(g)));
    arr(c.teaching_points).forEach((t) => arr(obj(t).points).forEach((p) => out.push(str(p))));
    arr(c.misconceptions).forEach((m) => { out.push(str(obj(m).misconception)); out.push(str(obj(m).redirect)); });
    const sw = obj(c.scene_world);
    out.push(str(sw.setting));
    arr(obj(sw.canon).facts).forEach((f) => out.push(str(f)));
    arr(obj(c.opening).opening_messages).forEach((m) => out.push(str(obj(m).text)));
    arr(c.phases).forEach((p) => {
      const ph = obj(p);
      const it = obj(obj(ph.practice).interaction);
      arr(it.opening_messages).forEach((m) => out.push(str(obj(m).text)));
      arr(it.brief).forEach((m) => out.push(str(obj(m).text)));
      ['unthoughtful', 'neutral', 'strong'].forEach((k) => {
        const lv = obj(obj(it.levels)[k]);
        out.push(str(lv.look_for)); out.push(str(lv.response)); out.push(str(lv.progression));
      });
      arr(obj(ph.debrief).key_points).forEach((kp) => out.push(str(kp)));
      out.push(str(obj(obj(ph.debrief).probe).text));
    });
    const ir = obj(obj(c.closing).ideal_response);
    arr(ir.component_groups).forEach((g) => arr(obj(g).components).forEach((x) => out.push(str(x))));
    out.push(str(ir.summary));
    return out.filter((x) => String(x).trim().length > 2);
  }

  /* ---- sections --------------------------------------------------------- */
  const sections = [
    { id: 'basics', group: 'meta', icon: 'fa-id-card', title: 'Basics',
      lead: 'What the scenario is called, and how the production engine identifies it.' },

    { id: 'world', group: 'context', icon: 'fa-earth-americas', title: 'Situation & world',
      lead: 'The situation the learner is shown, plus the reality every scene shares.',
      bridgeTitle: 'One situation, two audiences',
      bridge: 'Scenario CML v4 keeps <b>one</b> narrative, written to the learner in second person. It is also the coach\'s only picture of the setup — so the coach can never know a richer version than the learner was shown. The <b>scene world</b> is separate and scene-only: the coach never sees it.' },

    { id: 'voice', group: 'voicetone', icon: 'fa-comment', title: 'Coach voice',
      lead: 'This scenario\'s coaching register. Universal coaching behavior is template-owned — do not re-author it here.' },

    { id: 'teaching', group: 'learn', icon: 'fa-graduation-cap', title: 'Teaching points',
      lead: 'What the learner must leave understanding, grouped by topic. Debrief-scoped: never shown mid-attempt.',
      bridgeTitle: 'Grouping is structure, not decoration',
      bridge: 'Each topic renders as a heading with its points beneath it in the coach prompt. Group by <b>subject</b>, not by phase.' },

    { id: 'opening', group: 'interaction', stage: 'ENTER', icon: 'fa-door-open', title: 'Opening reflection',
      lead: 'One ungraded exchange before the phases. Optional — a scenario may open straight into its first practice.' },

    /* The steps are a SECTION LIST (see studio-shell.js): each one is its own
       rail entry and gets the authoring pane to itself, rather than four
       accordions stacked in a single card. `list` is what opts in — the shell
       reads it and owns the rail, the focus view and the ⋯ commands; this type
       still owns what a step IS, and what moving or deleting one costs. */
    { id: 'phases', group: 'interaction', stage: 'ENGAGE', icon: 'fa-list-ol', title: 'Steps',
      lead: 'The arc. Each step pairs a practice (the learner acts) with a debrief (the coach teaches against that attempt).',
      list: {
        singular: 'step',
        pluralLabel: 'steps',
        addLabel: 'Add step',
        items: (H) => phasesOf(H).map((p, i) => {
          const ph = obj(p);
          const m = modeMeta(obj(ph.practice).mode);
          return {
            title: str(ph.label).trim() || str(ph.id).trim() || 'Step ' + (i + 1),
            meta: m.label,
            icon: m.icon,
          };
        }),
        render: (i, H) => buildStepEditor(i, H),
        add: (H) => { const ps = phasesOf(H); ps.push(newPhase(ps.length + 1)); return ps.length - 1; },
        move: (from, to, H) => {
          const ps = phasesOf(H);
          if (from === to || !ps[from]) return '';
          const before = brokenCarryover(ps).length;
          ps.splice(to, 0, ps.splice(from, 1)[0]);
          return carryoverWarning(ps, before);
        },
        duplicate: (i, H) => {
          const ps = phasesOf(H);
          const src = ps[i];
          if (!src) return i;
          const copy = JSON.parse(JSON.stringify(src));
          copy.id = uniquePhaseId(ps, str(src.id).trim() || 'step');
          copy.label = (str(src.label).trim() || 'Step ' + (i + 1)) + ' (copy)';
          /* Inserted directly after its original, so every carryover it holds
             still names a step that runs earlier than it does. */
          ps.splice(i + 1, 0, copy);
          return i + 1;
        },
        remove: (i, H) => {
          const ps = phasesOf(H);
          const gone = ps[i];
          if (!gone) return '';
          const goneId = str(obj(gone).id).trim();
          ps.splice(i, 1);
          /* A carryover naming a step that no longer exists is invalid by
             construction, so drop those references — and say how many, rather
             than quietly editing steps the author wasn't looking at. */
          let pruned = 0;
          ps.forEach((p) => {
            const inter = obj(obj(obj(p).practice).interaction);
            if (!Array.isArray(inter.carryover) || !goneId) return;
            const kept = inter.carryover.filter((c) => str(obj(c).from).trim() !== goneId);
            pruned += inter.carryover.length - kept.length;
            if (kept.length) inter.carryover = kept; else delete inter.carryover;
          });
          return pruned
            ? `Step deleted. ${pruned} carryover reference${pruned > 1 ? 's' : ''} to it removed.`
            : '';
        },
      } },

    { id: 'closing', group: 'debrief', stage: 'CLOSE', icon: 'fa-flag-checkered', title: 'Expert answer',
      lead: 'The audit-defensible close. Shipped verbatim to every learner on every path.',
      bridgeTitle: 'External authorities only',
      bridge: '<b>Source references</b> take a regulation or standard (an OSHA clause, Title VII) — never an internal course or slide id, which means nothing outside the course.' },

    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The locked prompt sections the engine owns. Readable, not editable.' },
  ];

  function renderFields(sec, H) {
    const { tf, rowsBlock, rowCard, subRows, guidance, esc } = H;
    const box = document.createElement('div');
    box.className = 'fields';

    if (sec.id === 'basics') {
      box.append(
        tf('content.title', 'Scenario title', { helper: 'The learner\'s header, and how it appears in listings.' }),
        tf('implementation_id', 'Implementation id', {
          helper: 'How the surrounding content system identifies this implementation. Trace metadata — not shown to the learner.' }),
        tf('content.landing_cta_label', 'Landing button label', {
          helper: 'Optional. The button that leaves the situation screen for the first step. Blank uses the player default.' }),
      );
    }

    if (sec.id === 'world') {
      box.append(
        tf('content.narrative', 'The situation', { area: true, minRows: 4,
          helper: 'Second person, present tense, addressed to the learner, ending at the moment the experience begins.' }),
        tf('content.scene_world.setting', 'Scene setting (one line)', {
          helper: 'Where and when scenes take place. Rendered at the top of every scene prompt.' }),
      );

      /* --- content safety flags — declared UX Universal extensions --------
         The same three toggles the wizard interview asks, with answer_shape's
         extension treatment. Written only when true and deleted when switched
         off, so an unset flag never adds a stripped-extension warning for
         nothing. These are the only way the preview's safety floors arm on a
         v4 document — an imported scenario's flags were invisible here before
         this block existed. */
      const SAFETY_FLAGS = [
        { key: 'elevated_stakes', label: 'Crisis-adjacent topic — arm the crisis support floor' },
        { key: 'involves_minors', label: 'A minor is involved — arm the minor-protection floor' },
        { key: 'threat_content', label: 'Carries threat or violence content — arm the threat floor' },
      ];
      const sc = H.getScenario ? H.getScenario() : {};
      sc.content = obj(sc.content);
      SAFETY_FLAGS.forEach(function (f) {
        const cb = document.createElement('vaadin-checkbox');
        cb.label = f.label;
        cb.checked = sc.content[f.key] === true;
        const onFlip = function () {
          const content = obj((H.getScenario ? H.getScenario() : sc).content);
          if (cb.checked) content[f.key] = true; else delete content[f.key];
          if (H.scheduleUpdate) H.scheduleUpdate();
        };
        cb.addEventListener('change', onFlip);
        cb.addEventListener('checked-changed', onFlip);
        box.append(cb);
      });
      box.append(guidance('Content safety — why these are flagged in the lints', 'fa-shield-halved',
        '<p>These flags classify the content, and they are the only way the safety floors arm: <b>crisis support</b> (if the learner discloses real distress, the coach drops the exercise and points to real support, including the 988 line), <b>minor safeguarding</b>, and the <b>threat floor</b>. The preview honors whichever are on; off means the floor never arms.</p>'
        + '<p>Scenario CML v4 has no fields for these yet, so they are carried as declared extensions: the Dev handoff export strips them to produce a loadable file and lists what each removal costs. A stripped scenario runs in the production engine with no floor and no trace one was declared — say so in the handoff.</p>'));

      box.append(guidance('What belongs in canon — and what does not', 'fa-circle-info',
        '<p>Canon facts are asserted as true in <b>every</b> scene, always. So canon carries background truth the learner could already know — never plot, never answers.</p>'
        + '<ul><li>Happens later in the story → write it into the opener of the step where it happens.</li>'
        + '<li>Depends on how the learner played an earlier step → that is carryover, not canon.</li>'
        + '<li>A character would only reveal it once earned → put it on that character with a reveal condition.</li></ul>'));
      box.append(rowsBlock('content.scene_world.canon.facts', (f, i, onDel) => rowCard(
        `Fact ${i + 1}`, onDel,
        tf(`content.scene_world.canon.facts.${i}`, 'Background truth', { area: true, minRows: 2 }),
      ), 'Add canon fact', () => ''));
      box.append(rowsBlock('content.scene_world.characters', (c, i, onDel) => rowCard(
        `Character ${i + 1}`, onDel,
        tf(`content.scene_world.characters.${i}.id`, 'Id', { helper: 'Referenced by a roleplay step and by opener lines. Lowercase, no spaces.' }),
        tf(`content.scene_world.characters.${i}.name`, 'Name'),
        tf(`content.scene_world.characters.${i}.role`, 'Role', { helper: 'Who they are in this world, e.g. "Sofia\'s mother".' }),
        tf(`content.scene_world.characters.${i}.behavior.baseline`, 'Baseline', { area: true, minRows: 2,
          helper: 'Who they are when a scene opens.' }),
        tf(`content.scene_world.characters.${i}.behavior.driver`, 'Driver', { area: true, minRows: 2,
          helper: 'What their behavior responds to — the hinge the learner can move.' }),
      ), 'Add character', () => ({ id: '', name: '', role: '', behavior: { baseline: '', driver: '' } })));
      box.append(guidance('Reactions live on each step, not on the card', 'fa-triangle-exclamation',
        '<p>How a character reacts to being handled well or badly belongs in that <b>step\'s</b> quality levels, because reactions differ per scene. A character card is identity and disposition only.</p>'));
    }

    if (sec.id === 'voice') {
      box.append(
        tf('content.coach_persona', 'Coach persona', { area: true, minRows: 2,
          helper: 'This scenario\'s register and expertise, as a phrase — e.g. "grounded in employment law".' }),
      );
      box.append(guidance('Do not author universal coaching behavior', 'fa-circle-info',
        '<p>"Affirm before correcting", "never invent facts" and similar are owned by the engine template. Re-authoring them here is rejected by review, and phrasing that describes the AI or the interface fails the content lint outright.</p>'));
      box.append(rowsBlock('content.tone_guidelines', (g, i, onDel) => rowCard(
        `Tone rule ${i + 1}`, onDel,
        tf(`content.tone_guidelines.${i}`, 'Rule', { area: true, minRows: 2,
          helper: 'Scenario-specific only. Rendered as a bullet in the coach prompt.' }),
      ), 'Add tone rule', () => ''));
    }

    if (sec.id === 'teaching') {
      /* `points` is a LIST, and it used to be bound as `points.0` — one field,
         showing the first point and hiding every other one. That is not a
         cosmetic limit: all 36 topics across the production documents carry more
         than one point (up to 10), so opening a real scenario showed an LXD a
         quarter of its teaching content with nothing on screen saying so. The
         hidden points survived export, which is why the round-trip check stayed
         green while the editor was lying about what the document contained. */
      box.append(rowsBlock('content.teaching_points', (t, i, onDel) => rowCard(
        `Topic ${i + 1}`, onDel,
        tf(`content.teaching_points.${i}.topic`, 'Topic', { helper: 'A subject heading, e.g. "The law".' }),
        subRows(`content.teaching_points.${i}.points`, 'Point', 'Add point',
          'A substantive thing the learner must leave understanding.'),
      ), 'Add topic', () => ({ topic: '', points: [''] })));
      box.append(rowsBlock('content.misconceptions', (m, i, onDel) => rowCard(
        `Misconception ${i + 1}`, onDel,
        tf(`content.misconceptions.${i}.misconception`, 'The wrong belief', { area: true, minRows: 2 }),
        tf(`content.misconceptions.${i}.redirect`, 'The correction', { area: true, minRows: 2 }),
      ), 'Add misconception', () => ({ misconception: '', redirect: '' })));
    }

    if (sec.id === 'opening') {
      box.append(
        tf('content.opening.label', 'Name of the exchange', { helper: 'Learner-facing, e.g. "First reaction".' }),
        tf('content.opening.purpose', 'Purpose', { area: true, minRows: 2,
          helper: 'Model-facing: what this exchange is for, in the coach\'s map of the arc.' }),
        tf('content.opening.exit.when.turns', 'Turn budget', {
          helper: 'How many learner turns this exchange gets. Shipped scenarios use 2.' }),
        tf('content.opening.exit.final_word', 'Final word', { area: true, minRows: 2,
          helper: 'The locked closing line, delivered verbatim when the exchange ends. Author it as a statement, never a question.' }),
        tf('content.opening.transition.button_label', 'Continue button label'),
      );
      box.append(rowsBlock('content.opening.opening_messages', (m, i, onDel) => rowCard(
        `Opening line ${i + 1}`, onDel,
        tf(`content.opening.opening_messages.${i}.text`, 'Line', { area: true, minRows: 2,
          helper: 'Locked — delivered verbatim, in order, with no model call.' }),
      ), 'Add line', () => ({ text: '' })));
      box.append(guidance('The opening is ungraded and cannot gate', 'fa-circle-info',
        '<p>It has no exit requirement by design — nothing the learner says holds them here. Its quality levels are partial on purpose: author only the tiers the source material actually grounds.</p>'));
    }

    if (sec.id === 'phases') {
      box.append(buildPhasesEditor(H));
    }

    if (sec.id === 'closing') {
      box.append(
        tf('content.closing.ideal_response.summary', 'Summation', { area: true, minRows: 3,
          helper: 'The expert answer in one paragraph. Shipped verbatim, on every path.' }),
        tf('content.closing.partner_label', 'Display name on the closing screen', { helper: 'Optional.' }),
      );
      /* Same list-bound-as-`.0` defect the teaching points had: 24 of the 37
         component groups in the production documents carry more than one
         component, so the expert answer an LXD could see and edit was 37 of 98
         parts. Every part now has a field. */
      box.append(rowsBlock('content.closing.ideal_response.component_groups', (g, i, onDel) => rowCard(
        `Group ${i + 1}`, onDel,
        tf(`content.closing.ideal_response.component_groups.${i}.title`, 'Group title', { helper: 'Optional.' }),
        subRows(`content.closing.ideal_response.component_groups.${i}.components`, 'Component', 'Add component',
          'One part of the expert answer, grouped as the source material groups it.'),
      ), 'Add group', () => ({ title: '', components: [''] })));
      box.append(rowsBlock('content.closing.ideal_response.source_references', (r, i, onDel) => rowCard(
        `Reference ${i + 1}`, onDel,
        tf(`content.closing.ideal_response.source_references.${i}`, 'External authority', {
          helper: 'A regulation, standard or statute — e.g. "29 CFR 1910.1200" or "Title VII". Never an internal course id.' }),
      ), 'Add reference', () => ''));
    }

    if (sec.id === 'guardrails') {
      const mix = MIX();
      const eng = (mix && arr(mix.ENGINE_SECTIONS)) || [];
      const d = document.createElement('div');
      d.innerHTML = eng.length
        ? eng.map((s2) => '<details><summary>' + esc(obj(s2).title || 'Locked section')
            + '</summary><pre>' + esc(obj(s2).body || '') + '</pre></details>').join('')
        : '<p class="v4-empty">Locked sections load with mix-arc.js.</p>';
      box.append(d);
    }

    return box;
  }

  /* =======================================================================
     The step editor (Pass B)
     -----------------------------------------------------------------------
     One card per phase. The mode selector RETYPES the step — it swaps which
     interaction shape is authored, because POC V4 selects the interaction from
     `practice.mode` (a real discriminated union, not a bag of optionals). So
     changing the mode is a structural edit, and the editor rebuilds the body
     rather than showing three sets of fields and hoping the author picks the
     right one.
     ==================================================================== */

  const MODES = [
    { id: 'coach_inquiry', label: 'Coach', icon: 'fa-comments',
      hint: 'The learner reasons it through with the coach. No scene.' },
    { id: 'roleplay', label: 'Roleplay', icon: 'fa-masks-theater',
      hint: 'The learner acts in a scene. The coach never interrupts mid-scene.' },
    { id: 'observe_react', label: 'Observe', icon: 'fa-eye',
      hint: 'The learner studies an exhibit and is credited for what they spot.' },
  ];
  const modeMeta = (id) => MODES.find((m) => m.id === id) || { label: id || '—', icon: 'fa-question', hint: '' };

  const LEVEL_COPY = {
    unthoughtful: { title: 'Unthoughtful', hint: 'Misses the point, minimises, or actively goes wrong.' },
    neutral: { title: 'Neutral', hint: 'Well-intentioned and partly right; thin, or missing something important.' },
    strong: { title: 'Strong', hint: 'What an expert would recognise as handling it well.' },
  };

  /* ---- list plumbing the section's `list` contract calls ------------------
     All of it reads the LIVE draft each time. normalize() clones and the shell
     re-normalizes on every update, so a phases array captured once goes stale
     the first time anything saves — and a move applied to an orphaned array is
     a reorder the author watches fail. */
  function phasesOf(H) {
    const s = normalizeInPlace(H && H.getScenario ? H.getScenario() : {});
    return arr(obj(obj(s).content).phases);
  }

  function uniquePhaseId(phases, base) {
    const taken = phases.map((p) => str(obj(p).id).trim());
    let id = base + '-copy';
    let n = 2;
    while (taken.includes(id)) { id = base + '-copy' + n; n += 1; }
    return id;
  }

  /* Every carryover must name an EARLIER step (scenario-v4.js rule 3: a scene
     starts blank, and carryover grants it a transcript that has already
     happened). Reordering can therefore invalidate a step the author was not
     looking at, so report which ones — repairing it silently would be editing
     their scenario on their behalf. */
  function brokenCarryover(phases) {
    const ids = phases.map((p) => str(obj(p).id).trim());
    const out = [];
    phases.forEach((p, i) => {
      arr(obj(obj(obj(p).practice).interaction).carryover).forEach((c) => {
        const from = str(obj(c).from).trim();
        if (!from) return;
        const j = ids.indexOf(from);
        if (j < 0 || j >= i) out.push({ i, from });
      });
    });
    return out;
  }

  function carryoverWarning(phases, before) {
    const now = brokenCarryover(phases);
    if (now.length <= before) return '';
    const first = now[now.length - 1];
    const ph = obj(phases[first.i]);
    const name = str(ph.label).trim() || str(ph.id).trim() || 'Step ' + (first.i + 1);
    return `Moved. “${name}” now carries over from “${first.from}”, which no longer runs before it — see Guardrails.`;
  }

  /* =======================================================================
     THE ARC SUMMARY — what is left of the Steps section
     -----------------------------------------------------------------------
     This was a list of the steps. So is the rail, three levels of it, sitting
     open on the same screen — and the same list twice is not an overview, it
     is a second thing to keep in sync in the reader's head.

     What survives is only what the rail CANNOT say: the order as one readable
     line, and the arc's cost — every turn budget added up, which is the
     conversation cap POC V4 derives (scenario-v4.js §2: the opening, every
     practice, every debrief). Nothing else on screen carries that number, and
     it is the one an author tunes pacing against.
     ==================================================================== */
  function buildPhasesEditor(H) {
    const { esc } = H;
    const wrap = document.createElement('div');
    const phases = phasesOf(H);

    if (!phases.length) {
      const p = document.createElement('p');
      p.className = 'arc-none';
      p.textContent = 'No steps yet — add the first one below, or from the list on the left.';
      wrap.append(p);
    } else {
      const box = document.createElement('div');
      box.className = 'arc-line';

      const seq = document.createElement('p');
      seq.className = 'arc-seq';
      phases.forEach((phase, i) => {
        const ph = obj(phase);
        if (i) {
          const arrow = document.createElement('i');
          arrow.className = 'fa-solid fa-arrow-right arc-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          seq.append(arrow);
        }
        const m = modeMeta(obj(ph.practice).mode);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'arc-chip';
        b.title = m.label + ' — open this step';
        b.innerHTML = '<span class="arc-n">' + (i + 1) + '</span>'
          + esc(str(ph.label).trim() || str(ph.id).trim() || 'Step ' + (i + 1));
        b.addEventListener('click', () => H.goToItem('phases', i));
        seq.append(b);
      });
      box.append(seq);

      const v4 = V4();
      const cap = v4 ? v4.validate(prune(withoutShellKeys(normalize(H.getScenario())))).cap : null;
      const foot = document.createElement('p');
      foot.className = 'arc-cost';
      foot.innerHTML = '<b>' + phases.length + ' step' + (phases.length > 1 ? 's' : '') + '</b>'
        + (cap == null ? '' : ' · <b>' + cap + ' learner turns</b> in total — the conversation cap the '
          + 'production engine derives from these budgets, opening reflection included.');
      box.append(foot);
      wrap.append(box);
    }

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'arc-add';
    add.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px"></i>Add step';
    add.addEventListener('click', () => {
      const ps = phasesOf(H);
      ps.push(newPhase(ps.length + 1));
      H.scheduleUpdate();
      H.refreshNav();
      H.goToItem('phases', ps.length - 1);     // straight into the step just made
    });
    wrap.append(add);
    return wrap;
  }

  /* =======================================================================
     ONE STEP — the focus pane the rail opens
     -----------------------------------------------------------------------
     The former accordion body, minus the accordion. It repaints itself in
     place when the step is RETYPED or the debrief's turn budget changes, both
     of which swap which fields exist; the rail is rebuilt alongside, because
     the mode it shows just changed too.
     ==================================================================== */
  function buildStepEditor(i, H) {
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const body = document.createElement('div');
    const repaint = () => { paint(); if (H.refreshNav) H.refreshNav(); };

    function paint() {
      const s = normalizeInPlace(H.getScenario ? H.getScenario() : {});
      const phases = arr(obj(obj(s).content).phases);
      body.innerHTML = '';
      if (!phases[i]) {
        body.textContent = 'This step is no longer part of the scenario.';
        return;
      }
      const ph = obj(phases[i]);
      const practice = obj(ph.practice);

      /* --- the mode selector: retypes the step ------------------------- */
      const modeRow = document.createElement('div');
      modeRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:14px 0';
      MODES.forEach((mode) => {
        const active = practice.mode === mode.id;
        const btn = document.createElement('button');
        btn.type = 'button'; btn.title = mode.hint;
        btn.innerHTML = '<i class="fa-solid ' + mode.icon + '" style="margin-right:6px"></i>' + mode.label;
        btn.style.cssText = 'display:inline-flex;align-items:center;padding:7px 13px;border-radius:8px;font:600 13px inherit;'
          + 'cursor:' + (active ? 'default' : 'pointer') + ';'
          + (active ? 'background:var(--accent);color:var(--on-accent);border:1px solid var(--accent)'
            : 'background:var(--surface-2);color:var(--ink-soft);border:1px solid var(--line)');
        if (!active) {
          btn.addEventListener('click', () => {
            practice.mode = mode.id;
            /* Retyping means a different interaction shape. Seed the new shape's
               required containers and drop keys the new mode rejects, so the
               document never sits in a state POC V4 would refuse. */
            practice.interaction = seedInteraction(mode.id, obj(practice.interaction));
            /* The rail shows the step's mode, so it is repainted too. */
            scheduleUpdate(); repaint();
          });
        }
        modeRow.append(btn);
      });
      body.append(modeRow);

      /* --- identity + framing ----------------------------------------- */
      body.append(
        tf(`content.phases.${i}.label`, 'Step name', {
          helper: 'Learner-facing. Use the source material\'s own name — do not restate the position ("Phase 1 —"), the player renders that from the order.' }),
        tf(`content.phases.${i}.id`, 'Step id', {
          helper: 'Referenced by carryover. Lowercase, no dots — "." is reserved for the derived debrief id.' }),
        tf(`content.phases.${i}.purpose`, 'Purpose of the step', { area: true, minRows: 2,
          helper: 'Model-facing: this step\'s role in the coach\'s map of the arc. Not shown to the learner.' }),
      );

      /* --- practice spine --------------------------------------------- */
      body.append(guidance('The practice — where the learner acts', 'fa-hand-pointer',
        '<p>A practice always opens with <b>locked</b> content, because it asks the learner for something. It ends when the exit requirement is met <b>or</b> the turn budget runs out, whichever comes first — advancement is server-owned and forward-only, so there is no way back.</p>'));
      body.append(
        tf(`content.phases.${i}.practice.purpose`, 'Purpose of the practice', { area: true, minRows: 2,
          helper: 'Model-facing: the practice\'s job.' }),
        numField('Turn budget — learner turns before the practice must close',
          () => Math.max(1, obj(obj(practice.exit).when).turns || 2),
          (n) => { obj(obj(practice.exit).when).turns = n; }, { min: 1 }, scheduleUpdate),
        tf(`content.phases.${i}.practice.exit.when.requirement`, 'Exit requirement (optional)', { area: true, minRows: 2,
          helper: 'What the learner must observably demonstrate to end this early. Omit when the step\'s job is simply to be had.' }),
        tf(`content.phases.${i}.practice.exit.final_word`, 'Final word (optional)', { area: true, minRows: 2,
          helper: 'The locked closing line, delivered verbatim by either route. Author it as a statement, never a question.' }),
        tf(`content.phases.${i}.practice.transition.button_label`, 'Button into the debrief'),
        tf(`content.phases.${i}.practice.transition.text`, 'Handoff line (optional)', { area: true, minRows: 2,
          helper: 'Appended as a locked line once the step advances.' }),
      );

      /* answer_shape — a declared UX Universal extension, labelled as such so an
         author knows it is not yet part of POC V4. */
      const det = document.createElement('vaadin-checkbox');
      det.label = 'This step has a right answer the coach must land plainly';
      det.checked = practice.answer_shape === 'determinate';
      /* Written only when TRUE, the same way the content-safety flags are — an
         unmarked practice already reads as open, so recording 'open' buys nothing
         and costs a warning plus a lossy export. */
      const onDet = () => {
        if (det.checked) practice.answer_shape = 'determinate';
        else delete practice.answer_shape;
        scheduleUpdate();
      };
      det.addEventListener('change', onDet);
      det.addEventListener('checked-changed', onDet);
      body.append(det);
      body.append(guidance('Why this one is flagged in the lints', 'fa-flask',
        '<p>Leave it off for a judgment or reflection step, where delivering a verdict defeats the point — the coach deepens what the learner said instead. Off is also the default, and it records nothing — only turning it ON writes a field.</p>'
        + '<p>Scenario CML v4 has no field for this distinction yet, so it is carried as a declared extension: the scenario will not load in the production engine until the field is adopted, and the export can strip it (which makes every step read as having a right answer).</p>'));

      /* --- the interaction, per mode ---------------------------------- */
      body.append(interactionFields(practice.mode, i, practice, s, H));

      /* --- quality levels: fixed at three ----------------------------- */
      body.append(guidance('Quality levels — fixed at three', 'fa-gauge',
        '<p>The vocabulary is set by the engine, not the author: <b>unthoughtful</b>, <b>neutral</b>, <b>strong</b>. You write each level\'s criteria. A level is never shown to the learner and never gates progress — it selects what happens next.</p>'
        + '<p><b>Look for</b> is how to recognise the level in what the learner wrote. <b>Response</b> is what the AI then does'
        + (practice.mode === 'roleplay' ? ' in scene, and <b>progression</b> is how far the scene gets and how it resolves.' : '.') + '</p>'));
      const levels = obj(practice.interaction).levels
        || (obj(practice.interaction).levels = { unthoughtful: {}, neutral: {}, strong: {} });
      Object.keys(LEVEL_COPY).forEach((key) => {
        if (!levels[key]) levels[key] = {};
        const c = LEVEL_COPY[key];
        const kids = [
          tf(`content.phases.${i}.practice.interaction.levels.${key}.look_for`, 'Look for', { area: true, minRows: 2,
            helper: c.hint }),
          tf(`content.phases.${i}.practice.interaction.levels.${key}.response`, 'Response', { area: true, minRows: 2,
            helper: practice.mode === 'roleplay' ? 'What the world or counterpart does. The character never coaches.'
              : practice.mode === 'observe_react' ? 'Credit generously; nudge only by the authored cue, and never name an item the learner has not found.'
                : 'Coach-voiced — a probe or acknowledgement at this level.' }),
        ];
        if (practice.mode === 'roleplay') {
          kids.push(tf(`content.phases.${i}.practice.interaction.levels.${key}.progression`, 'Progression', { area: true, minRows: 2,
            helper: 'How far the scene gets and how it resolves at this level. Legal only on a roleplay step.' }));
        }
        kids.push(
          tf(`content.phases.${i}.practice.interaction.levels.${key}.example.learner`, 'Example — what the learner says', { area: true, minRows: 2,
            helper: 'Optional. One short worked exchange calibrating the register.' }),
          tf(`content.phases.${i}.practice.interaction.levels.${key}.example.reply`, 'Example — the reply', { area: true, minRows: 2 }),
        );
        body.append(rowCard(c.title, null, ...kids));
      });

      /* --- the debrief ------------------------------------------------ */
      body.append(guidance('The debrief — where the coach teaches', 'fa-comment-dots',
        '<p>It reacts to the attempt, so it has <b>no locked opener</b> — a canned greeting here would be structurally backwards. Key points are delivered whether or not the learner got there.</p>'
        + '<p><b>Delivery-only is the default posture.</b> Set follow-up turns to 0 and the debrief speaks its key points then its final word, opening no composer. Give it turns only when the source material genuinely has the coach asking the learner something here.</p>'));
      const debrief = obj(ph.debrief);
      body.append(
        tf(`content.phases.${i}.debrief.label`, 'Debrief name', {
          helper: 'Learner-facing. Use the source deck\'s own name for it, e.g. "Coach Debrief".' }),
        tf(`content.phases.${i}.debrief.purpose`, 'Purpose (optional)', { area: true, minRows: 2 }),
      );
      body.append(rowsBlock(`content.phases.${i}.debrief.key_points`, (kp, k, onDel) => rowCard(
        `Key point ${k + 1}`, onDel,
        tf(`content.phases.${i}.debrief.key_points.${k}`, 'Statement', { area: true, minRows: 2,
          helper: 'Authored as a statement, not a topic. Landed regardless of how the learner did.' }),
      ), 'Add key point', () => ''));
      body.append(numField('Follow-up turns (0 = delivery-only)',
        () => Math.max(0, debrief.follow_up_turns || 0),
        (n) => {
          debrief.follow_up_turns = n;
          /* At 0, POC V4 forbids a probe, a requirement and a placeholder, and
             requires a final word. Enforce it here so the author cannot build an
             invalid step by lowering the budget. */
          if (n === 0) { delete debrief.probe; delete debrief.requirement; delete debrief.input_placeholder; }
        }, { min: 0 }, () => { scheduleUpdate(); paint(); }));

      if ((debrief.follow_up_turns || 0) >= 1) {
        if (!debrief.probe) debrief.probe = { text: '' };
        body.append(
          tf(`content.phases.${i}.debrief.probe.text`, 'Locked follow-up question (optional)', { area: true, minRows: 2,
            helper: 'Delivered verbatim on the debrief\'s first turn, after the feedback on the attempt. Use it when the source scripts an exact question and paraphrase would lose its precision.' }),
          tf(`content.phases.${i}.debrief.requirement`, 'Early-exit requirement (optional)', { area: true, minRows: 2 }),
          tf(`content.phases.${i}.debrief.input_placeholder`, 'Composer placeholder'),
        );
      }
      body.append(
        tf(`content.phases.${i}.debrief.final_word`, 'Final word'
          + ((debrief.follow_up_turns || 0) === 0 ? ' (required — this is a delivery-only debrief)' : ' (optional)'),
          { area: true, minRows: 2,
            helper: 'The locked closing line, delivered verbatim when the debrief ends.' }),
        tf(`content.phases.${i}.debrief.transition.button_label`, 'Button into the next step'),
      );

    }

    paint();
    return body;
  }

  /* Per-mode interaction fields. Each mode gets only its own shape — POC V4
     rejects a key that belongs to another mode. */
  function interactionFields(mode, i, practice, s, H) {
    const { tf, rowsBlock, rowCard, guidance, scheduleUpdate } = H;
    const base = `content.phases.${i}.practice.interaction`;
    const it = obj(practice.interaction);
    const holder = document.createElement('div');

    if (mode === 'roleplay') {
      holder.append(guidance('The scene', 'fa-masks-theater',
        '<p>Leave the counterpart blank for <b>narrator-driven</b> roleplay — a first-class pattern for a step about what the learner <i>does</i> rather than what they say to someone ("you round the corner; what do you do?").</p>'));
      const declared = arr(obj(obj(obj(s).content).scene_world).characters)
        .map((c) => obj(c).id).filter(Boolean);
      holder.append(
        tf(`${base}.setting`, 'Setting', { helper: 'Where and when this scene takes place.' }),
        tf(`${base}.character_id`, 'Counterpart character id (blank = narrator-driven)', {
          helper: declared.length ? 'Declared characters: ' + declared.join(', ') : 'No characters declared yet — add them under Situation & world.' }),
        tf(`${base}.emotion_hint`, 'Entering emotional state (optional)'),
        tf(`${base}.partner_label`, 'Chat header name', {
          helper: 'The character\'s name, "Narrator" on a narrator-driven scene, or a scene label when several characters share the thread.' }),
        tf(`${base}.input_placeholder`, 'Composer placeholder'),
        numField('Mid-scene coach help turns (0 hides the affordance)',
          () => (typeof it.help_turns === 'number' ? it.help_turns : 2),
          (n) => { it.help_turns = n; }, { min: 0 }, scheduleUpdate),
      );
      holder.append(rowsBlock(`${base}.opening_messages`, (m, k, onDel) => rowCard(
        `Opening line ${k + 1}`, onDel,
        tf(`${base}.opening_messages.${k}.text`, 'Line', { area: true, minRows: 2,
          helper: 'Locked scene-setting, delivered verbatim. One message per step of the establishing sequence.' }),
        tf(`${base}.opening_messages.${k}.character_id`, 'Spoken by (blank = narrator)'),
      ), 'Add opening line', () => ({ text: '' })));
      holder.append(carryoverBlock(base, i, s, H));
      return holder;
    }

    if (mode === 'observe_react') {
      holder.append(guidance('The exhibit and its rubric', 'fa-eye',
        '<p>The rubric is the fixed set of findable items. Each needs a stable <b>id</b> (the engine\'s crediting key), the <b>creditable phrasing</b> a learner\'s catch is matched against, and a <b>nudge</b> that says where to look — <b>never</b> the answer.</p>'
        + '<p>The learner\'s meter always shows the full rubric; <b>spot target</b> only decides how many catches complete the step.</p>'));
      holder.append(
        tf(`${base}.exhibit.src`, 'Exhibit source', { helper: 'Path relative to the media root.' }),
        tf(`${base}.exhibit.alt`, 'Exhibit description', { area: true, minRows: 3,
          helper: 'The full visual description. It must describe the exhibit well enough for the step to work without the image.' }),
        tf(`${base}.jot_placeholder`, 'Jot input placeholder'),
        tf(`${base}.partner_label`, 'Chat header name', {
          helper: 'Defaults to "Narrator". Author "Narrator / Coach" when the mixed voice is worth naming — the brief narrates, the crediting is coach-voiced.' }),
        numField('Spot target — catches needed to complete',
          () => Math.max(1, it.spot_target || 1),
          (n) => { it.spot_target = n; }, { min: 1 }, scheduleUpdate),
        numField('Mid-scene coach help turns (0 hides the affordance)',
          () => (typeof it.help_turns === 'number' ? it.help_turns : 2),
          (n) => { it.help_turns = n; }, { min: 0 }, scheduleUpdate),
      );
      holder.append(rowsBlock(`${base}.rubric`, (r, k, onDel) => rowCard(
        `Findable item ${k + 1}`, onDel,
        tf(`${base}.rubric.${k}.id`, 'Id', { helper: 'Stable crediting key. Unique within this rubric.' }),
        tf(`${base}.rubric.${k}.name`, 'Short name', { helper: 'Shown on the learner\'s coverage scorecard.' }),
        tf(`${base}.rubric.${k}.standard_term`, 'Creditable phrasing', { area: true, minRows: 2,
          helper: 'What a learner\'s catch is matched against, and the language the coach credits in.' }),
        tf(`${base}.rubric.${k}.nudge`, 'Nudge', { area: true, minRows: 2,
          helper: 'A cue toward where to look. Never the answer.' }),
      ), 'Add findable item', () => ({ id: '', name: '', standard_term: '', nudge: '' })));
      holder.append(rowsBlock(`${base}.brief`, (m, k, onDel) => rowCard(
        `Briefing line ${k + 1}`, onDel,
        tf(`${base}.brief.${k}.text`, 'Line', { area: true, minRows: 2,
          helper: 'Locked, narrator-voiced, shown over the exhibit before the learner starts looking. Not chat bubbles.' }),
      ), 'Add briefing line', () => ({ text: '' })));
      holder.append(rowsBlock(`${base}.exhibit.facts`, (f, k, onDel) => rowCard(
        `Exhibit fact ${k + 1}`, onDel,
        tf(`${base}.exhibit.facts.${k}`, 'Ground truth', { area: true, minRows: 2,
          helper: 'What may be asserted as true about what the exhibit shows. Model grounding, not learner text — it keeps the exhibit\'s contents out of scenes that cannot see it.' }),
      ), 'Add exhibit fact', () => ''));
      holder.append(carryoverBlock(base, i, s, H));
      return holder;
    }

    /* coach_inquiry */
    holder.append(guidance('The coach exchange', 'fa-comments',
      '<p>This step runs in the coach conversation, so it needs no apparatus — it is the conversation itself. The coach may probe to sharpen but does <b>not</b> teach here; teaching is the debrief.</p>'
      + '<p>There is no help budget: the learner is already talking to the coach, so a clarifying question is just a turn.</p>'));
    holder.append(
      tf(`${base}.input_placeholder`, 'Composer placeholder'),
      tf(`${base}.partner_label`, 'Chat header name', { helper: 'Defaults to the coach label.' }),
      tf(`${base}.media.src`, 'Ambient reference image (optional)', {
        helper: 'Pinned above the conversation for the whole step — e.g. the scene being remediated. Never graded.' }),
      tf(`${base}.media.alt`, 'Image description (optional)', { area: true, minRows: 2 }),
    );
    holder.append(rowsBlock(`${base}.opening_messages`, (m, k, onDel) => rowCard(
      `Opening bubble ${k + 1}`, onDel,
      tf(`${base}.opening_messages.${k}.text`, 'Line', { area: true, minRows: 2,
        helper: 'The coach\'s locked opener, delivered verbatim in order.' }),
    ), 'Add opening bubble', () => ({ text: '' })));
    return holder;
  }

  /* carryover — only EARLIER steps are offerable, because a later step has no
     transcript yet (POC V4 §9.1 rule 3). */
  function carryoverBlock(base, i, s, H) {
    const { tf, rowsBlock, rowCard, guidance } = H;
    const holder = document.createElement('div');
    const earlier = arr(obj(obj(s).content).phases).slice(0, i).map((p) => obj(p).id).filter(Boolean);
    holder.append(guidance('Carryover — what this scene has already witnessed', 'fa-clock-rotate-left',
      '<p>A fresh scene starts blank. Naming an <b>earlier</b> step hands this one the <b>verbatim transcript</b> of that attempt — never a summary, because summarising is where a model starts inventing.</p>'
      + (earlier.length ? '<p>Available: <b>' + earlier.join('</b>, <b>') + '</b></p>'
        : '<p>Nothing to carry yet — this is the first step.</p>')));
    if (earlier.length) {
      holder.append(rowsBlock(`${base}.carryover`, (c, k, onDel) => rowCard(
        `Carryover ${k + 1}`, onDel,
        tf(`${base}.carryover.${k}.from`, 'From step id', { helper: 'Must be an earlier step: ' + earlier.join(', ') }),
      ), 'Add carryover', () => ({ from: earlier[earlier.length - 1] })));
    }
    return holder;
  }

  /* Seed a mode's required containers when a step is retyped, and drop the keys
     the new mode does not have — an interaction carrying another mode's fields is
     a load error, not an ignored extra. */
  function seedInteraction(mode, prev) {
    /* Only genuinely shared keys survive a retype. `levels` and `partner_label`
       exist on all three interactions; the composer placeholder does NOT — coach
       and roleplay call it `input_placeholder`, observe calls it
       `jot_placeholder`, and carrying the wrong one across is a load error, not
       a harmless extra. (Caught by our own validator during Pass B testing.) */
    const carry = { levels: prev.levels, partner_label: prev.partner_label };
    const keep = {};
    Object.keys(carry).forEach((k) => { if (carry[k] !== undefined) keep[k] = carry[k]; });
    /* Rename the placeholder to whatever the destination mode calls it. */
    const placeholder = str(prev.input_placeholder) || str(prev.jot_placeholder);
    if (placeholder) {
      if (mode === 'observe_react') keep.jot_placeholder = placeholder;
      else keep.input_placeholder = placeholder;
    }

    if (mode === 'roleplay') {
      return Object.assign({
        setting: '', partner_label: keep.partner_label || 'Narrator',
        opening_messages: arr(prev.opening_messages).length ? prev.opening_messages : [{ text: '' }],
      }, keep);
    }
    if (mode === 'observe_react') {
      return Object.assign({
        exhibit: obj(prev.exhibit).src ? prev.exhibit : { type: 'image', src: '', alt: '' },
        rubric: arr(prev.rubric).length ? prev.rubric : [{ id: '', name: '', standard_term: '', nudge: '' }],
        spot_target: typeof prev.spot_target === 'number' ? prev.spot_target : 1,
        brief: arr(prev.brief).length ? prev.brief
          : (arr(prev.opening_messages).length ? prev.opening_messages.map((m) => ({ text: str(obj(m).text) })) : [{ text: '' }]),
      }, keep);
    }
    return Object.assign({
      opening_messages: arr(prev.opening_messages).length ? prev.opening_messages
        : (arr(prev.brief).length ? prev.brief.map((m) => ({ text: str(obj(m).text) })) : [{ text: '' }]),
    }, keep);
  }

  function newPhase(n) {
    return {
      id: 'step' + n, label: '', purpose: '',
      practice: {
        /* No `answer_shape`: absent IS open (scenario-v4-runtime reads
           `=== 'determinate'`), so writing 'open' declares an extension, earns a
           stripped-extension warning and makes the export lossy — all to say
           exactly what saying nothing says. */
        mode: 'coach_inquiry', purpose: '',
        exit: { when: { turns: 2 } },
        transition: { button_label: '' },
        interaction: { opening_messages: [{ text: '' }] },
      },
      debrief: { label: 'Coach Debrief', key_points: [''], follow_up_turns: 0, final_word: '', transition: { button_label: '' } },
    };
  }

  /* A bound number input. studioApi's tf() is for text, and a turn budget that
     silently accepts "two" would fail the load with a type error.
     -----------------------------------------------------------------------
     This was `vaadin-integer-field`, which the Vector core bundle does not
     register — not at v1.19.0, not at v1.22.3, and it is absent from the curated
     element list in the themes/core CONTEXT. So every field built here was an
     UNDEFINED custom element: 0px wide, no shadow root, no children, its label
     and value living as JS properties on an inert node. Five inputs rendered as
     nothing — the practice turn budget, a debrief's follow-up turns, both
     mid-scene help budgets and the spot target — and `practice.exit.when.turns`
     is REQUIRED, so the Validation panel demanded a field the author had no way
     to fill. Silent, because an unknown tag is not an error.
     `vaadin-number-field` is the registered one. `theme="outlined"` is not
     optional on a Vector input: without it Vaadin's default filled style renders,
     which is not the design system. */
  function numField(label, get, set, opts, onChange) {
    const f = document.createElement('vaadin-number-field');
    f.setAttribute('theme', 'outlined');
    f.label = label;
    f.stepButtonsVisible = true;
    if (opts && typeof opts.min === 'number') f.min = opts.min;
    f.value = String(get());
    /* A CHANGE HANDLER MUST NOT FIRE WHEN NOTHING CHANGED. `value-changed` is a
       property event, not a user event: Vaadin emits it asynchronously after the
       element upgrades, so the programmatic `f.value` above arrives back here
       AFTER these listeners attach. Any onChange that repaints then rebuilds this
       field, whose value is set again, which fires again — and the debrief's
       "Follow-up turns" does exactly that (its onChange calls paint(), because 0
       restructures the section). The result was twenty nested repaints and a
       `Maximum call stack size exceeded` from inside the component bundle, which
       marked every field built before it as failed: on screen, a step editor with
       no inputs at all.

       It never fired before because the tag used here was one the component
       library does not register, so the element was inert and set nothing. Making
       it a real field is what woke the loop up — worth remembering that a dead
       control can hide a live bug. */
    const apply = () => {
      const n = parseInt(f.value, 10);
      if (Number.isNaN(n)) return;
      const min = opts && typeof opts.min === 'number' ? opts.min : 0;
      const next = Math.max(min, n);
      if (next === get()) return;          // nothing moved — do not repaint
      set(next);
      if (typeof onChange === 'function') onChange();
    };
    f.addEventListener('change', apply);
    f.addEventListener('value-changed', apply);
    return f;
  }

  /* The editor mutates the live draft, so make sure the containers it writes into
     exist first — without inventing any authored text. */
  function normalizeInPlace(s) {
    const d = obj(s);
    d.content = obj(d.content);
    if (!Array.isArray(d.content.phases)) d.content.phases = [];
    d.content.phases.forEach((p) => {
      const ph = obj(p);
      ph.practice = obj(ph.practice);
      ph.practice.exit = obj(ph.practice.exit);
      ph.practice.exit.when = obj(ph.practice.exit.when);
      ph.practice.transition = obj(ph.practice.transition);
      ph.practice.interaction = obj(ph.practice.interaction);
      ph.debrief = obj(ph.debrief);
      ph.debrief.transition = obj(ph.debrief.transition);
      if (!Array.isArray(ph.debrief.key_points)) ph.debrief.key_points = [];
    });
    return d;
  }

  /* =======================================================================
     Dev handoff — export a document the POC V4 loader accepts
     -----------------------------------------------------------------------
     The shell's generic Export button dumps the raw draft, WITH our declared
     extensions (answer_shape, the safety flags) — which the POC V4 loader
     rejects outright (additionalProperties:false). This panel is the honest
     path: strip the extensions, revalidate in strict mode (their loader,
     exactly), say plainly what stripping cost, and only then hand over a file.
     A handoff is never silently lossy.
     ==================================================================== */
  function buildHandoffPanel(H) {
    const { guidance, esc } = H;
    const v4 = V4();
    const wrap = document.createElement('div');
    if (!v4) { wrap.textContent = 'scenario-v4.js did not load.'; return wrap; }

    const live = normalize(H.getScenario ? H.getScenario() : {});
    const draft = prune(withoutShellKeys(live));
    const stripped = v4.stripExtensions(draft);
    const strict = v4.validate(stripped.doc, { strict: true });
    /* Everything this export drops, from BOTH passes. The editor-only keys go
       first because they are removed first, and because that removal is the one
       an author cannot see anywhere else in the UI. */
    const removed = shellKeysRemoved(live).concat(stripped.removed);

    /* status card */
    const ok = strict.errors.length === 0;
    const status = document.createElement('div');
    status.style.cssText = 'border:1px solid var(--line);border-left:4px solid '
      + (ok ? 'var(--ok,#2e8b57)' : 'var(--danger,#c92626)') + ';border-radius:8px;padding:12px 14px;margin:10px 0';
    status.innerHTML = ok
      ? '<b>Loads in the production engine.</b> Strict validation — the production loader\'s own rules — passes. '
        + 'Derived conversation cap: ' + strict.cap + ' learner turns.'
      : '<b>' + strict.errors.length + ' field(s) still block the load.</b> These are the same items the '
        + 'lints panel lists per section — authoring work, not export mechanics.';
    wrap.append(status);

    /* What the export drops, and what that costs — shown whether or not it
       blocks. Opened by default when anything is listed: this is the difference
       between the file an author authored and the file they hand over, and the
       previous version hid it behind a closed disclosure whose summary did not
       say a field was going. */
    if (removed.length) {
      const byConsequence = {};
      removed.forEach(function (r) {
        (byConsequence[r.consequence] = byConsequence[r.consequence] || []).push(r.path);
      });
      const block = guidance('What this export removes, and what that costs', 'fa-scissors',
        '<p>Scenario CML v4 has no field for these yet, so the export drops them. Nothing else '
        + 'in the document is changed — but each line below is authored content that will not '
        + 'reach the production engine. Say so when you hand the file over.</p><ul>'
        + Object.keys(byConsequence).map(function (c) {
          return '<li><b>' + byConsequence[c].length + ' field(s):</b> ' + esc(c)
            + '<br><span class="v4-paths">' + esc(byConsequence[c].join(' · ')) + '</span></li>';
        }).join('') + '</ul>');
      block.open = true;
      wrap.append(block);
    }

    /* the file itself */
    const btn = document.createElement('vaadin-button');
    btn.textContent = ok ? 'Download .lo.json for dev' : 'Download anyway (will not load)';
    btn.setAttribute('theme', ok ? 'primary' : 'tertiary');
    btn.addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(stripped.doc, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      /* Named by the shell's shared scheme (see exportName) rather than a second
         one invented here, so the two artifacts an author downloads sort together
         and a re-export never overwrites the previous one. The document's own
         identity travels inside it, in `implementation_id`. */
      a.download = H.exportName
        ? H.exportName('', '.lo.json', stripped.doc)
        : slugify(str(stripped.doc.implementation_id) || str(obj(stripped.doc.content).title) || 'scenario') + '.lo.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    wrap.append(btn);

    /* There used to be a second download here: the same document with our
       extension fields folded into `extensions` envelopes instead of stripped —
       the working exhibit for that schema request. The request was DECLINED for
       V1 (a generic trauma-informed block instead), so the exhibit has no
       audience, and leaving it would be actively unsafe now that the workflow is
       "edit the JSON, upload it back into the system": it produced a file that
       fails their loader, one button away from the file that does not, under a
       near-identical name. What the export strips is still reported above — that
       information was the useful half. See docs/V4-ALIGNMENT-NOTES.md. */

    /* Was "named the way the service routes it — the file stem becomes the
       scenario id". True of their loader read straight off a content directory,
       misleading now: the document goes to the LMS, which owns storage and
       versioning, and the scenario's identity travels INSIDE the file. */
    wrap.append(guidance('This is the file you upload back', 'fa-circle-question',
      '<p>This is the document the production engine loads: our editor-only fields stripped and '
      + 'strict-validated against its own loader rules. Download it and upload it into the LMS, '
      + 'which handles versioning from there — the scenario\'s own id travels inside the file, so '
      + 'the filename is only for you.</p>'
      + '<p>Every export is stamped with the date and time, so downloading twice gives you two '
      + 'files rather than one overwriting the other.</p>'
      + '<p>It is not the same file as the <b>working draft</b>, which is this editor\'s own format '
      + 'and is only for passing a half-finished scenario to another editor user. If you are putting '
      + 'a scenario back into production, it is this one.</p>'));
    return wrap;
  }

  function slugify(s) {
    return str(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scenario';
  }

  /* ---- lints: the POC V4 validator, surfaced live ----------------------
     This is what makes the unfilled fields workable instead of daunting: an LXD
     sees the exact field POC V4 would reject, while they type, with extensions
     distinguished from real errors. */

  /* Map a validator JSON path onto the section that edits it. */
  function sectionFor(path) {
    const p = String(path || '');
    if (/^content\.phases/.test(p)) return 'phases';
    if (/^content\.opening/.test(p)) return 'opening';
    if (/^content\.closing/.test(p)) return 'closing';
    if (/^content\.(teaching_points|misconceptions)/.test(p)) return 'teaching';
    if (/^content\.(coach_persona|tone_guidelines)/.test(p)) return 'voice';
    if (/^content\.(narrative|scene_world)/.test(p)) return 'world';
    return 'basics';
  }

  /* Which STEP a validator path belongs to, or null. The steps are their own
     rail entries now, so a lint can carry a dot on the exact step it is about
     instead of one dot for the whole arc. */
  function itemFor(path) {
    const m = String(path || '').match(/^content\.phases\[(\d+)\]/);
    return m ? Number(m[1]) : null;
  }

  /* Trim the path to something an author can act on.
     A phase-scoped path is rewritten to NAME the step rather than index it:
     "phases 2.practice.interaction.exhibit" tells an author nothing about which
     card to open, and in a five-step arc that is a hunt. `doc` is optional so
     the function still works on a bare path. */
  function friendly(path, doc) {
    const raw = String(path || '');
    const m = raw.match(/^content\.phases\[(\d+)\]\.?(.*)$/);
    if (m) {
      const idx = Number(m[1]);
      const ph = obj(arr(obj(obj(doc).content).phases)[idx]);
      const name = str(ph.label).trim() || str(ph.id).trim();
      const rest = m[2] ? ' · ' + m[2] : '';
      return 'Step ' + (idx + 1) + (name ? ' \u201c' + name + '\u201d' : '') + rest;
    }
    return raw.replace(/^content\./, '').replace(/\[(\d+)\]/g, (mm, n) => ' ' + (Number(n) + 1));
  }

  /* The label the AUTHOR sees on the field, keyed by the tail of the validator's
     path. The validator speaks the schema ("practice.interaction.opening_messages");
     the editor speaks the form ("Opening bubble"). Showing the schema path made
     every message a translation exercise, in a panel whose whole job is telling an
     LXD which field to go and fill.

     Only the leaves worth naming are listed; anything absent falls through to a
     de-punctuated path, which is still better than raw JSON pointers. Keep this
     in step with the labels in renderFields — if the two ever disagree, the form
     wins and this is the stale one. */
  const FIELD_LABELS = {
    'label': 'Name',
    'purpose': 'Purpose',
    'id': 'Id',
    'name': 'Name',
    'role': 'Role',
    'fact': 'Background truth',
    'behavior.baseline': 'Baseline',
    'behavior.driver': 'Driver',
    'opening.label': 'Name of the exchange',
    'opening.purpose': 'Purpose of the exchange',
    'opening.exit.when.turns': 'Turn budget',
    'opening.exit.final_word': 'Final word',
    'opening.transition.button_label': 'Continue button label',
    'practice.answer_shape': 'Has a right answer',
    'practice.mode': 'Step type',
    'narrative': 'The situation',
    'coach_persona': 'Coach persona',
    'tone_guidelines': 'Tone rules',
    'teaching_points': 'Teaching points',
    'misconceptions': 'Misconceptions',
    'scene_world.setting': 'Scene setting',
    'scene_world.canon.facts': 'Canon facts',
    'scene_world.characters': 'Characters',
    'exit.when.turns': 'Turn budget',
    'exit.final_word': 'Final word',
    'transition.button_label': 'Continue button label',
    'transition.text': 'Handoff line',
    'practice.purpose': 'Purpose of the practice',
    'practice.exit.when.turns': 'Turn budget',
    'practice.exit.final_word': 'Final word',
    'practice.exit.requirement': 'Exit requirement',
    'practice.transition.button_label': 'Button into the debrief',
    'practice.interaction.setting': 'Scene setting',
    'practice.interaction.partner_label': 'Chat header name',
    'practice.interaction.opening_messages': 'Opening bubble',
    'practice.interaction.brief': 'Brief',
    'practice.interaction.exhibit': 'Exhibit image',
    'practice.interaction.rubric': 'Findable items',
    'practice.interaction.spot_target': 'How many catches complete it',
    'practice.interaction.jot_placeholder': 'Composer placeholder',
    'practice.interaction.carryover': 'Carried-over transcript',
    'debrief.label': 'Debrief name',
    'debrief.key_points': 'Key points',
    'debrief.final_word': 'Final word',
    'debrief.follow_up_turns': 'Follow-up turns',
    'debrief.probe': 'Probe',
    'debrief.transition.button_label': 'Button into the next step',
    'closing.ideal_response.summary': 'Summation',
    'closing.ideal_response.component_groups': 'Expert-answer groups',
    'closing.ideal_response.source_references': 'Source references',
    'closing.partner_label': 'Display name on the closing screen',
  };

  /* The singular of an indexed list, so a row can say "Character 2" rather than
     "characters 2". Only lists the validator actually indexes into. */
  const SINGULAR = {
    'scene_world.characters': 'Character',
    'scene_world.canon.facts': 'Canon fact',
    'teaching_points': 'Topic',
    'misconceptions': 'Misconception',
    'tone_guidelines': 'Tone rule',
    'closing.ideal_response.component_groups': 'Group',
    'closing.ideal_response.source_references': 'Source reference',
    'opening.opening_messages': 'Opening line',
    'practice.interaction.opening_messages': 'Opening bubble',
    'practice.interaction.brief': 'Brief line',
    'practice.interaction.rubric': 'Findable item',
    'practice.interaction.carryover': 'Carried-over step',
    'debrief.key_points': 'Key point',
  };

  /* Turn the tail of a validator path into the label the form puts on that field.
     Recursive on an index, so a nested path reads as position-then-field
     ("Character 2 · Role") instead of a flattened path with a number stuck on the
     end. */
  function leafLabel(tail) {
    const t = String(tail || '');
    /* A quality level keeps its tier: which tier is the entire point of the row. */
    const tier = t.match(/levels\.(unthoughtful|neutral|strong)\.?(look_for|response|progression)?/);
    if (tier) {
      const LEAF = { look_for: 'Look for', response: 'Response', progression: 'Progression' };
      const tierName = tier[1].charAt(0).toUpperCase() + tier[1].slice(1);
      return tier[2] ? tierName + ' \u00b7 ' + LEAF[tier[2]] : tierName + ' quality level';
    }
    const m = t.match(/^(.*?)\[(\d+)\]\.?(.*)$/);
    if (m) {
      const listPath = m[1];
      const one = SINGULAR[listPath]
        || (FIELD_LABELS[listPath] || listPath.replace(/[._]/g, ' ')).replace(/s$/, '');
      const rest = m[3] ? ' \u00b7 ' + leafLabel(m[3]) : '';
      return one + ' ' + (Number(m[2]) + 1) + rest;
    }
    return FIELD_LABELS[t] || t.replace(/[._]/g, ' ');
  }

  /* "Step 2 \u201cThe Person\u201d \u00b7 Key points" \u2014 the step by name (from
     `friendly`), then the field by the label the author sees on it. The validator
     speaks the schema; the panel's whole job is telling an LXD which field to go
     and fill, so it has to speak the form. */
  function labelled(path, doc) {
    const raw = String(path || '');
    const inPhase = /^content\.phases\[\d+\]/.test(raw);
    if (inPhase) {
      const prefix = friendly(raw, doc).split(' \u00b7 ')[0];
      const tail = raw.replace(/^content\.phases\[\d+\]\.?/, '');
      return tail ? prefix + ' \u00b7 ' + leafLabel(tail) : prefix;
    }
    return leafLabel(raw.replace(/^content\./, ''));
  }

  /* Collapse rows that say the SAME thing about different steps into one row
     that names them all. Three identical 60-word warnings, one per step, is not
     three times the information — it is the same information three times, and it
     pushes the rows that ARE different off the screen.

     A collapsible row carries `dedupe` (the message with the step prefix taken
     off — both the grouping key and the collapsed wording) and `who` (this
     instance's step name). Rows without `dedupe` pass through untouched. */
  function collapse(rows) {
    const groups = [];
    const index = {};
    rows.forEach((r) => {
      if (!r.dedupe) { groups.push({ row: r, who: [] }); return; }
      const key = r.severity + '\u0000' + r.section + '\u0000' + r.dedupe;
      if (index[key] === undefined) {
        index[key] = groups.length;
        groups.push({ row: r, who: r.who ? [r.who] : [] });
        return;
      }
      if (r.who) groups[index[key]].who.push(r.who);
    });
    return groups.map(({ row, who }) => {
      const base = { severity: row.severity, section: row.section, why: row.why };
      if (who.length < 2) return Object.assign(base, { msg: row.msg, item: row.item });
      /* One row standing for several steps cannot carry one step's dot, and must
         not open a step the author never pointed at. */
      return Object.assign(base, {
        msg: row.dedupe + ' \u2014 ' + who.length + ' steps: ' + who.join(', '),
        item: undefined,
      });
    });
  }

  /* The step a path belongs to, named — for the dedupe suffix ("3 steps: The
     Law, The Person, The conversation") rather than three separate rows. */
  function stepName(path, doc) {
    const i = itemFor(path);
    if (i === null) return '';
    const ph = obj(arr(obj(obj(doc).content).phases)[i]);
    return str(ph.label).trim() || str(ph.id).trim() || ('Step ' + (i + 1));
  }

  function lints(s) {
    const L = [];
    const add = (severity, section, msg, why, item, extra) =>
      L.push(Object.assign({ severity, section, msg, why, item }, extra || {}));
    const v4 = V4();
    if (!v4) {
      add('warn', 'basics', 'Validation unavailable — js/scenario-v4.js did not load.',
        'Without it the studio cannot tell you whether this scenario would load in the production engine.');
      return L;
    }

    const doc = prune(withoutShellKeys(normalize(s)));
    const report = v4.validate(doc);

    /* The blocking rows carried the same sentence — "POC V4 rejects the document
       until this is authored." — under every single one. Repeated on twelve rows
       it is wallpaper, and it spends the one line of explanation each row gets on
       something the red dot already said. The status line at the bottom of the
       panel says it once, which is where a fact about all of them belongs.
       "POC V4" is also not a phrase an LXD has any reason to know. */
    report.errors.forEach((e) => {
      add('err', sectionFor(e.path), labelled(e.path, doc) + ' — ' + e.message, '', itemFor(e.path));
    });
    /* Extension warnings are the same paragraph on every step, so they collapse
       into one row that lists the steps. */
    report.warnings.forEach((w) => {
      const full = labelled(w.path, doc);
      /* The collapsed wording drops the step prefix but must keep the FIELD, or
         the row opens mid-sentence ("is a Vector extension…"). */
      const parts = full.split(' \u00b7 ');
      const leaf = parts.length > 1 ? parts.slice(1).join(' \u00b7 ') : full;
      add('warn', sectionFor(w.path), full + ' — ' + w.message, '', itemFor(w.path),
        { dedupe: leaf + ' — ' + w.message, who: stepName(w.path, doc) });
    });

    /* Soft defaults: filled so the scenario loads, but a story label reads far
       better on the button that leads INTO the next scene. Measured across the 11
       POC V4 scenarios, 17 of 29 of those labels are distinct and diegetic
       ("Sit down with Bianca", "Take the follow-up call") — that variation is
       design, unlike the practice button where 23 of 29 are the same string. */
    const houseDebrief = obj(v4.HOUSE).debriefButton;
    if (houseDebrief) {
      const tip = 'The button into the next step is still the house default "' + houseDebrief + '".';
      arr(obj(doc.content).phases).forEach(function (ph, i) {
        const label = str(obj(obj(obj(ph).debrief).transition).button_label);
        if (label !== houseDebrief) return;
        const name = str(obj(ph).label).trim() || ('Step ' + (i + 1));
        add('info', 'phases', name + ' \u2014 ' + tip.charAt(0).toLowerCase() + tip.slice(1),
          'This one leads into the next scene, so a label naming what happens next reads better — '
          + '"Sit down with Bianca", "Take the follow-up call". (The button into the practice is '
          + 'different: 23 of 29 production scenarios use the same string there, so its default '
          + 'is fine.)', i, { dedupe: tip, who: name });
      });
    }

    /* Prior-scenario context has no field in v4, so it is dropped on export.
       Flagged HERE, at authoring time, and not only in the Export panel: an
       author fills that block, sees it honoured in Preview, and would otherwise
       have no reason to open Export before handing the file over. A warning
       rather than an error — the scenario loads fine without it; what is lost is
       the coach knowing what ran before. */
    arr(shellKeysRemoved(normalize(s))).forEach(function (r) {
      add('warn', 'basics', 'Prior-scenario context is authored, but Scenario CML v4 has no field for it — '
        + 'the Dev handoff export drops it.',
        'It reaches the coach in Preview, so the scenario you playtest is not the scenario production runs. '
        + 'Approved for the model on 2026-08-18; still waiting on a home in the format. '
        + 'Fields authored: ' + r.path.replace(/^previousLO \(|\)$/g, '') + '.');
    });

    /* A headline, so the author knows where they stand without counting rows. */
    if (!report.errors.length) {
      add('info', 'basics', 'This scenario would load in the production engine.',
        'Derived conversation cap: ' + report.cap + ' learner turns — the sum of every authored budget.');
    } else {
      add('info', 'basics', report.errors.length + ' field(s) still needed before the production engine will load this.',
        'Every red row above is one of them, listed against the section that edits it. Nothing is guessed on your behalf — an empty field is left empty, so each of these is a real authoring decision.');
    }
    return collapse(L);
  }

  const TYPE = {
    id: 'v4-universal',
    label: 'Universal Scenario',
    icon: 'fa-layer-group',
    blurb: 'Author directly in POC V4 — the format the production engine runs. Start from a template, then compose any arc.',
    /* The go-forward authoring format: the studio steers NEW scenarios here and
       badges every other type "Legacy — for editing existing scenarios". The
       flag lives on the type (like blurb) so the shell keeps zero per-type
       branches — a future format change flips one line, here. */
    goForward: true,
    DEFAULT,
    ENGINE_SECTIONS: (MIX() && arr(MIX().ENGINE_SECTIONS)) || [],
    isValid,
    normalize,
    blank,
    merge,
    compile,
    fill,
    highlightStrings,
    toRuntime,
    compileScopes,
    /* The universal player resolves ?type= from the Studio registry, so this
       type plays through the EXISTING resolver — no new route needed.
       ?observe=text routes any kind:'spot' phase to the text-observation
       surface, the faithful POC V4 observe_react loop (a v4 rubric carries no
       geometry, so the photo/hotspot canvas cannot hit-test). Harmless when the
       scenario has no observe step — the flag gates a surface that only mounts
       for kind:'spot'. */
    previewUrl: () => 'composed-scenarios/index.html?type=v4-universal&observe=text',
    /* The production handoff artifact, surfaced by the shell's Export flow
       (`type.handoff` — optional, so types without one keep a plain download).
       It used to be a form section on the last page of the editor, which put the
       one export a developer actually receives three clicks behind the one they
       don't. Same panel, same builder — reachable from where an author looks for
       an export. */
    handoff: {
      label: 'Dev handoff — POC V4 content document',
      lead: 'What the production engine loads: our extension fields stripped, then '
        + 'revalidated under the production loader\'s own rules, and named the way their '
        + 'service routes it. Not the same file as the working draft.',
      build: (H) => buildHandoffPanel(H),
    },
    sections,
    renderFields,
    lints,
    playtest: null,
    /* The template gallery (D7) — the studio reads this to offer starting points. */
    templates: () => (TPL() ? TPL().list() : []),
    template: (id) => (TPL() ? TPL().get(id) : null),
  };

  window.AitheraV4Universal = TYPE;

  if (window.AitheraStudio) {
    const S = window.AitheraStudio;
    TYPE.store = S.makeStore(S.makeKeys(TYPE.id), { isValid, normalize });
    S.register(TYPE);
  }
})();
