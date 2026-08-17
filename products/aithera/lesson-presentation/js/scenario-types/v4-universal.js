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

   Pass A (this file, today): the contract, live validation, and the
   scenario-level editors. The per-phase editor — mode selector, the three-tier
   quality block, the observe rubric — is Pass B and marked below.
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

    /* Optional blocks: create the container only when the author has started
       one, so an untouched scenario does not ship empty arrays — POC V4 treats an
       empty tone_guidelines as invalid rather than absent. */
    if (c.scene_world !== undefined) {
      c.scene_world = obj(c.scene_world);
      if (c.scene_world.canon !== undefined) {
        c.scene_world.canon = obj(c.scene_world.canon);
        if (!Array.isArray(c.scene_world.canon.facts)) c.scene_world.canon.facts = [];
      }
      if (c.scene_world.characters !== undefined && !Array.isArray(c.scene_world.characters)) {
        c.scene_world.characters = [];
      }
    }
    if (c.opening !== undefined) {
      c.opening = obj(c.opening);
      if (!Array.isArray(c.opening.opening_messages)) c.opening.opening_messages = [];
      c.opening.exit = obj(c.opening.exit);
      c.opening.exit.when = obj(c.opening.exit.when);
      c.opening.transition = obj(c.opening.transition);
    }
    arr(c.phases).forEach((p) => {
      const ph = obj(p);
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
  function compile(s) {
    const rt = V4RT();
    const mix = MIX();
    if (!rt || !mix) return 'Cannot compile: scenario-v4-runtime.js and mix-arc.js must load first.';
    try {
      return mix.compile(rt.compile(normalize(s)));
    } catch (e) {
      return 'Compile failed: ' + (e && e.message ? e.message : String(e));
    }
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
      /* Pass B builds the real per-step editor. Until then, show the arc that is
         authored so the section is honest rather than empty, and say plainly
         where to edit. */
      const s = H.getScenario ? H.getScenario() : {};
      const phases = arr(obj(obj(s).content).phases);
      const MODE = {
        coach_inquiry: { label: 'Coach', icon: 'fa-comments' },
        roleplay: { label: 'Roleplay', icon: 'fa-masks-theater' },
        observe_react: { label: 'Observe', icon: 'fa-eye' },
      };
      const wrap = document.createElement('div');
      wrap.className = 'v4-arc';
      wrap.innerHTML = phases.length
        ? '<ol class="v4-arc-list">' + phases.map((p, i) => {
          const ph = obj(p);
          const m = MODE[obj(ph.practice).mode] || { label: obj(ph.practice).mode || '—', icon: 'fa-question' };
          const turns = obj(obj(obj(ph.practice).exit).when).turns;
          const fut = obj(ph.debrief).follow_up_turns;
          return '<li><b>' + esc(ph.label || ph.id || 'Step ' + (i + 1)) + '</b>'
            + ' <span class="v4-mode"><i class="fa-solid ' + m.icon + '"></i> ' + m.label + '</span>'
            + ' <span class="v4-meta">practice ' + esc(String(turns == null ? '—' : turns)) + ' turns · debrief '
            + esc(String(fut === 0 ? 'delivery-only' : fut + ' turns')) + '</span></li>';
        }).join('') + '</ol>'
        : '<p class="v4-empty">No steps yet.</p>';
      box.append(wrap);
      box.append(guidance('Per-step editing is the next build (Pass B)', 'fa-screwdriver-wrench',
        '<p>The step editor — mode selector, the three quality levels with <b>look for</b> and <b>response</b> separated, the observe rubric, and the debrief block — lands next. Until then a step can be edited by loading a template and using the JSON export, and the lints panel still names every field that needs authoring.</p>'));
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

    const doc = normalize(s);
    const report = v4.validate(doc);

    report.errors.forEach((e) => {
      add('err', sectionFor(e.path), friendly(e.path) + ' — ' + e.message,
        'POC V4 rejects the document until this is authored.');
    });
    report.warnings.forEach((w) => {
      add('warn', sectionFor(w.path), friendly(w.path) + ' — ' + w.message, '');
    });

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
    DEFAULT,
    ENGINE_SECTIONS: (MIX() && arr(MIX().ENGINE_SECTIONS)) || [],
    isValid,
    normalize,
    blank,
    merge,
    compile,
    fill,
    highlightStrings,
    /* Stage 5 adds the ?schema=v4 route; until then the preview button lands on
       the universal player, which still boots the native path. */
    previewUrl: () => 'scenario-live.html?schema=v4',
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
