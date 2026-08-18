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
    if (!Array.isArray(c.tone_guidelines)) c.tone_guidelines = [];
    if (!Array.isArray(c.misconceptions)) c.misconceptions = [];
    if (!Array.isArray(c.closing.ideal_response.source_references)) c.closing.ideal_response.source_references = [];
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
    const dropIfEmpty = (holder, key, val) => {
      if (Array.isArray(val) ? !val.length : !val) delete holder[key];
      else holder[key] = val;
    };

    dropIfEmpty(c, 'tone_guidelines', cleanStrings(c.tone_guidelines));
    dropIfEmpty(c, 'misconceptions', arr(c.misconceptions).filter((m) =>
      str(obj(m).misconception).trim() || str(obj(m).redirect).trim()));
    c.teaching_points = arr(c.teaching_points).map((t) => {
      const topic = obj(t);
      return { topic: str(topic.topic), points: cleanStrings(topic.points) };
    }).filter((t) => t.topic.trim() || t.points.length);

    const ir = obj(obj(c.closing).ideal_response);
    if (ir) {
      dropIfEmpty(ir, 'source_references', cleanStrings(ir.source_references));
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

  function merge(draft) {
    const base = clone(DEFAULT);
    const d = obj(draft);
    return normalize(Object.assign(base, d, { content: Object.assign(obj(base.content), obj(d.content)) }));
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
  function floorsBlock(runtime) {
    const parts = [];
    const hasScene = arr(obj(runtime).phases).some(function (r) { return obj(r).world === 'scene'; });
    if (runtime.elevatedStakes) {
      const floor = (window.AitheraScenario && window.AitheraScenario.CRISIS_FLOOR) || null;
      parts.push('LEARNER SAFETY — HIGHEST PRIORITY, overrides everything: if the learner discloses, '
        + 'AS THEMSELVES rather than as a line in the exercise, that THEY are being harmed or are in '
        + 'distress, drop the exercise immediately (set "action":"redirect"' + (hasScene ? ', leave the scene' : '') + '). '
        + 'In the coach voice, acknowledge with warmth and zero assessment, say the practice can wait, '
        + 'and point to real support appropriate to the situation. If they mention self-harm, add the '
        + (floor ? floor.title + ' (' + floor.body + ')' : '988 Suicide & Crisis Lifeline (call or text 988)')
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
      return mix.compile(runtime) + rubricBlock(runtime) + floorsBlock(runtime) + disclosuresBlock(runtime);
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
    return scopes.create(prune(withoutShellKeys(normalize(s))), {
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
      bridge: 'POC V4 keeps <b>one</b> narrative, written to the learner in second person. It is also the coach\'s only picture of the setup — so the coach can never know a richer version than the learner was shown. The <b>scene world</b> is separate and scene-only: the coach never sees it.' },

    { id: 'voice', group: 'voicetone', icon: 'fa-comment', title: 'Coach voice',
      lead: 'This scenario\'s coaching register. Universal coaching behavior is template-owned — do not re-author it here.' },

    { id: 'teaching', group: 'learn', icon: 'fa-graduation-cap', title: 'Teaching points',
      lead: 'What the learner must leave understanding, grouped by topic. Debrief-scoped: never shown mid-attempt.',
      bridgeTitle: 'Grouping is structure, not decoration',
      bridge: 'Each topic renders as a heading with its points beneath it in the coach prompt. Group by <b>subject</b>, not by phase.' },

    { id: 'opening', group: 'interaction', stage: 'ENTER', icon: 'fa-door-open', title: 'Opening reflection',
      lead: 'One ungraded exchange before the phases. Optional — a scenario may open straight into its first practice.' },

    { id: 'phases', group: 'interaction', stage: 'ENGAGE', icon: 'fa-list-ol', title: 'Steps',
      lead: 'The arc. Each step pairs a practice (the learner acts) with a debrief (the coach teaches against that attempt).' },

    { id: 'closing', group: 'debrief', stage: 'CLOSE', icon: 'fa-flag-checkered', title: 'Expert answer',
      lead: 'The audit-defensible close. Shipped verbatim to every learner on every path.',
      bridgeTitle: 'External authorities only',
      bridge: '<b>Source references</b> take a regulation or standard (an OSHA clause, Title VII) — never an internal course or slide id, which means nothing outside the course.' },

    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The locked prompt sections the engine owns. Readable, not editable.' },
  ];

  function renderFields(sec, H) {
    const { tf, rowsBlock, rowCard, guidance, esc } = H;
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
      box.append(rowsBlock('content.teaching_points', (t, i, onDel) => rowCard(
        `Topic ${i + 1}`, onDel,
        tf(`content.teaching_points.${i}.topic`, 'Topic', { helper: 'A subject heading, e.g. "The law".' }),
        tf(`content.teaching_points.${i}.points.0`, 'Point', { area: true, minRows: 2,
          helper: 'A substantive thing the learner must leave understanding.' }),
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
      box.append(rowsBlock('content.closing.ideal_response.component_groups', (g, i, onDel) => rowCard(
        `Group ${i + 1}`, onDel,
        tf(`content.closing.ideal_response.component_groups.${i}.title`, 'Group title', { helper: 'Optional.' }),
        tf(`content.closing.ideal_response.component_groups.${i}.components.0`, 'Component', { area: true, minRows: 2,
          helper: 'One part of the expert answer, grouped as the source material groups it.' }),
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

  /* Which step cards are expanded. Deliberately module-level rather than a field
     on the phase: POC V4 sets additionalProperties:false everywhere, so a stray
     `__open` key on a phase would fail the load. UI state never touches the
     document. */
  const openSteps = new Set();

  const LEVEL_COPY = {
    unthoughtful: { title: 'Unthoughtful', hint: 'Misses the point, minimises, or actively goes wrong.' },
    neutral: { title: 'Neutral', hint: 'Well-intentioned and partly right; thin, or missing something important.' },
    strong: { title: 'Strong', hint: 'What an expert would recognise as handling it well.' },
  };

  function buildPhasesEditor(H) {
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const wrap = document.createElement('div');

    /* Read the draft FRESH on every paint, never captured once.
       normalize() clones, and the shell re-normalizes on each update — so a
       reference captured at build time goes stale the first time anything saves.
       Capturing it meant the second retype mutated an orphaned object while the
       shell rendered from a newer one, and the section came back empty. */
    let s, phases;
    function readDraft() {
      s = normalizeInPlace(H.getScenario ? H.getScenario() : {});
      phases = arr(obj(obj(s).content).phases);
    }

    /* Local render, so retyping a step or toggling a debrief's interactivity
       repaints just this section. Same approach mix-arc uses for its beats. */
    function paint() {
      readDraft();
      wrap.innerHTML = '';
      if (!phases.length) {
        const p = document.createElement('p');
        p.textContent = 'No steps yet — add the first one below.';
        p.style.cssText = 'color:var(--ink-soft);margin:8px 0';
        wrap.append(p);
      }
      phases.forEach((phase, i) => wrap.append(phaseCard(obj(phase), i)));

      const add = document.createElement('button');
      add.type = 'button';
      add.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px"></i>Add step';
      add.style.cssText = 'display:inline-flex;align-items:center;padding:8px 14px;margin-top:12px;border-radius:8px;'
        + 'font:600 13px inherit;cursor:pointer;background:var(--surface-2);color:var(--ink);border:1px solid var(--line)';
      add.addEventListener('click', () => {
        openSteps.add(phases.length);          // open the one just added
        phases.push(newPhase(phases.length + 1));
        scheduleUpdate(); paint();
      });
      wrap.append(add);
    }

    function phaseCard(ph, i) {
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid var(--line);border-radius:10px;margin:10px 0;background:var(--surface)';

      const practice = obj(ph.practice);
      const m = modeMeta(practice.mode);
      const turns = obj(obj(practice.exit).when).turns;
      const fut = obj(ph.debrief).follow_up_turns;

      /* Header — the arc stays scannable when every step is collapsed. */
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer';
      const isOpen = openSteps.has(i);
      head.innerHTML = '<i class="fa-solid fa-chevron-' + (isOpen ? 'down' : 'right') + '" style="color:var(--ink-soft);width:12px"></i>'
        + '<b style="flex:0 0 auto">' + esc(ph.label || ph.id || 'Step ' + (i + 1)) + '</b>'
        + '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;'
        + 'background:var(--surface-2);border:1px solid var(--line);font:600 12px inherit;color:var(--ink-soft)">'
        + '<i class="fa-solid ' + m.icon + '"></i>' + esc(m.label) + '</span>'
        + '<span style="margin-left:auto;font:12px inherit;color:var(--ink-soft)">practice '
        + esc(String(turns == null ? '—' : turns)) + ' turns · debrief '
        + esc(fut === 0 ? 'delivery-only' : fut + ' turns') + '</span>';
      head.addEventListener('click', () => {
        if (isOpen) openSteps.delete(i); else openSteps.add(i);
        paint();
      });
      card.append(head);

      if (!isOpen) return card;

      const body = document.createElement('div');
      body.style.cssText = 'padding:2px 14px 16px;border-top:1px solid var(--line)';

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
            scheduleUpdate(); paint();
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
      const onDet = () => {
        practice.answer_shape = det.checked ? 'determinate' : 'open';
        scheduleUpdate();
      };
      det.addEventListener('change', onDet);
      det.addEventListener('checked-changed', onDet);
      body.append(det);
      body.append(guidance('Why this one is flagged in the lints', 'fa-flask',
        '<p>Leave it off for a judgment or reflection step, where delivering a verdict defeats the point — the coach deepens what the learner said instead.</p>'
        + '<p>POC V4 has no field for this distinction yet, so it is carried as a declared extension: the scenario will not load in the production engine until the field is adopted, and the export can strip it (which makes every step read as having a right answer).</p>'));

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

      /* --- remove ------------------------------------------------------ */
      const del = document.createElement('button');
      del.type = 'button';
      del.innerHTML = '<i class="fa-solid fa-trash" style="margin-right:6px"></i>Remove this step';
      del.style.cssText = 'display:inline-flex;align-items:center;padding:7px 12px;margin-top:14px;border-radius:8px;'
        + 'font:600 12px inherit;cursor:pointer;background:transparent;color:var(--danger,#c92626);border:1px solid var(--line)';
      del.addEventListener('click', () => {
        phases.splice(i, 1);
        openSteps.clear();                     // indices shifted; collapse rather than mislabel
        scheduleUpdate(); paint();
      });
      body.append(del);

      card.append(body);
      return card;
    }

    paint();
    return wrap;
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
        mode: 'coach_inquiry', purpose: '', answer_shape: 'open',
        exit: { when: { turns: 2 } },
        transition: { button_label: '' },
        interaction: { opening_messages: [{ text: '' }] },
      },
      debrief: { label: 'Coach Debrief', key_points: [''], follow_up_turns: 0, final_word: '', transition: { button_label: '' } },
    };
  }

  /* A bound number input. studioApi's tf() is for text, and a turn budget that
     silently accepts "two" would fail the load with a type error. */
  function numField(label, get, set, opts, onChange) {
    const f = document.createElement('vaadin-integer-field');
    f.label = label;
    f.stepButtonsVisible = true;
    if (opts && typeof opts.min === 'number') f.min = opts.min;
    f.value = String(get());
    const apply = () => {
      const n = parseInt(f.value, 10);
      if (Number.isNaN(n)) return;
      const min = opts && typeof opts.min === 'number' ? opts.min : 0;
      set(Math.max(min, n));
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

    const draft = prune(withoutShellKeys(normalize(H.getScenario ? H.getScenario() : {})));
    const stripped = v4.stripExtensions(draft);
    const strict = v4.validate(stripped.doc, { strict: true });

    /* status card */
    const ok = strict.errors.length === 0;
    const status = document.createElement('div');
    status.style.cssText = 'border:1px solid var(--line);border-left:4px solid '
      + (ok ? 'var(--ok,#2e8b57)' : 'var(--danger,#c92626)') + ';border-radius:8px;padding:12px 14px;margin:10px 0';
    status.innerHTML = ok
      ? '<b>Loads in the production engine.</b> Strict validation — the POC V4 loader\'s own rules — passes. '
        + 'Derived conversation cap: ' + strict.cap + ' learner turns.'
      : '<b>' + strict.errors.length + ' field(s) still block the load.</b> These are the same items the '
        + 'lints panel lists per section — authoring work, not export mechanics.';
    wrap.append(status);

    /* what stripping costs — shown whether or not it blocks */
    if (stripped.removed.length) {
      const byConsequence = {};
      stripped.removed.forEach(function (r) {
        (byConsequence[r.consequence] = byConsequence[r.consequence] || []).push(r.path);
      });
      wrap.append(guidance('What this export removes, and what that costs', 'fa-scissors',
        '<p>The production format has not adopted our extension fields yet, so the export strips them. '
        + 'Nothing else is changed.</p><ul>'
        + Object.keys(byConsequence).map(function (c) {
          return '<li><b>' + byConsequence[c].length + ' field(s):</b> ' + esc(c) + '</li>';
        }).join('') + '</ul>'));
    }

    /* the file itself */
    const btn = document.createElement('vaadin-button');
    btn.textContent = ok ? 'Download .lo.json for dev' : 'Download anyway (will not load)';
    btn.setAttribute('theme', ok ? 'primary' : 'tertiary');
    btn.addEventListener('click', function () {
      const stem = slugify(str(stripped.doc.implementation_id) || str(obj(stripped.doc.content).title) || 'scenario');
      const blob = new Blob([JSON.stringify(stripped.doc, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      /* The file stem IS the scenario_id in their service — their routing key. */
      a.download = stem + '.lo.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    wrap.append(btn);

    /* The PROPOSED wire shape — extensions folded into must-ignore envelopes
       rather than stripped. Fails the current loader by exactly one key
       (`extensions`), which is the size of the schema change being requested;
       this download is the working exhibit for that conversation. */
    if (stripped.removed.length) {
      const btn2 = document.createElement('vaadin-button');
      btn2.textContent = 'Download proposal sample (extensions kept, in envelopes)';
      btn2.setAttribute('theme', 'tertiary');
      btn2.addEventListener('click', function () {
        const folded = v4.foldExtensions(draft);
        const stem = slugify(str(draft.implementation_id) || str(obj(draft.content).title) || 'scenario');
        const blob = new Blob([JSON.stringify(folded.doc, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = stem + '.proposed.lo.json';
        a.click();
        URL.revokeObjectURL(a.href);
      });
      wrap.append(btn2);
    }

    wrap.append(guidance('How this differs from the working draft', 'fa-circle-question',
      '<p>The <b>working draft</b> above is this tool\'s own format — extensions included, nothing '
      + 'stripped — for round-tripping between Studio users. <b>This</b> is the handoff artifact: '
      + 'extensions stripped, strict-validated against the POC V4 loader\'s own rules, and named the '
      + 'way their service routes it (the file stem becomes the scenario id).</p>'));
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

  /* Trim the path to something an author can act on. */
  function friendly(path) {
    return String(path || '').replace(/^content\./, '').replace(/\[(\d+)\]/g, (m, n) => ' ' + (Number(n) + 1));
  }

  function lints(s) {
    const L = [];
    const add = (severity, section, msg, why) => L.push({ severity, section, msg, why });
    const v4 = V4();
    if (!v4) {
      add('warn', 'basics', 'Validation unavailable — js/scenario-v4.js did not load.',
        'Without it the studio cannot tell you whether this scenario would load in the production engine.');
      return L;
    }

    const doc = prune(withoutShellKeys(normalize(s)));
    const report = v4.validate(doc);

    report.errors.forEach((e) => {
      add('err', sectionFor(e.path), friendly(e.path) + ' — ' + e.message,
        'POC V4 rejects the document until this is authored.');
    });
    report.warnings.forEach((w) => {
      add('warn', sectionFor(w.path), friendly(w.path) + ' — ' + w.message, '');
    });

    /* Soft defaults: filled so the scenario loads, but a story label reads far
       better on the button that leads INTO the next scene. Measured across the 11
       POC V4 scenarios, 17 of 29 of those labels are distinct and diegetic
       ("Sit down with Bianca", "Take the follow-up call") — that variation is
       design, unlike the practice button where 23 of 29 are the same string. */
    const houseDebrief = obj(v4.HOUSE).debriefButton;
    if (houseDebrief) {
      arr(obj(doc.content).phases).forEach(function (ph, i) {
        const label = str(obj(obj(obj(ph).debrief).transition).button_label);
        if (label !== houseDebrief) return;
        add('info', 'phases', 'Step ' + (i + 1) + '\'s button into the next step is still the '
          + 'house default "' + label + '".',
          'This one leads into the next scene, so a label naming what happens next reads better — '
          + '"Sit down with Bianca", "Take the follow-up call". (The practice button is different: '
          + '23 of 29 POC V4 scenarios use the same string there, so its default is fine.)');
      });
    }

    /* A headline, so the author knows where they stand without counting rows. */
    if (!report.errors.length) {
      add('info', 'basics', 'This scenario would load in POC V4.',
        'Derived conversation cap: ' + report.cap + ' learner turns — the sum of every authored budget.');
    } else {
      add('info', 'basics', report.errors.length + ' field(s) still needed before this loads in POC V4.',
        'Each one is listed against the section that edits it. The porting tool leaves a field empty rather than guessing, so these are real authoring decisions.');
    }
    return L;
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
    previewUrl: () => 'scenario-live.html?type=v4-universal&observe=text',
    /* The production handoff artifact, surfaced by the shell's Export flow
       (`type.handoff` — optional, so types without one keep a plain download).
       It used to be a form section on the last page of the editor, which put the
       one export a developer actually receives three clicks behind the one they
       don't. Same panel, same builder — reachable from where an author looks for
       an export. */
    handoff: {
      label: 'Dev handoff — POC V4 content document',
      lead: 'What the production engine loads: our extension fields stripped, then '
        + 'revalidated under the POC V4 loader\'s own rules, and named the way their '
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
