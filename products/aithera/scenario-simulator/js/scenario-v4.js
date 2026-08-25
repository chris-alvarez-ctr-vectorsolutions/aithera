/* ============================================================================
   scenario-v4.js — Scenario CML v4 shape, validator, and lint
   ----------------------------------------------------------------------------
   A vanilla-JS port of the POC V4 authoring contract, so Writer Studio
   can author v4 directly and prove an export will LOAD in the POC V4 engine before
   anyone hands a file over.

   Ported from three sources in VectorLearning/scenario-simulator-poc:
     · app/lo_schema/lo_cml_v4.schema.json  — the JSON Schema (shape + required)
     · docs/authoring/scenario-cml-spec.md  — §9.1 loader cross-field rules,
                                              §9.2 prompt-smell lint, §2 derived cap
     · app/content/*.lo.json                — 11 real scenarios used as fixtures

   Three things to know about v4 before reading further:

   1. THERE IS NO TYPE FIELD. A scenario is not "a branching arc" or "a scene
      sweep" — it is a list of phases, each of which picks a practice `mode`
      (coach_inquiry | roleplay | observe_react). What the scenario *is* emerges
      from the modes it uses. Our eight sim types are presets over this one shape.

   2. UNKNOWN FIELDS ARE ERRORS, NOT EXTENSIONS. Every object in the schema sets
      additionalProperties:false, so a stray key fails the load outright. That is
      why validateObject() below is strict by default — it is modelling a real
      rejection, not being fussy.

   3. AUTHORED CONTENT CARRIES NO PROMPT TEXT. §9.2's lint rejects strings that
      talk about the AI or the interface. Guidance like "CALIBRATION ONLY, do not
      evaluate" is a load error in v4, not a style preference.

   Usage in a page (Studio, a mock, anywhere):
       <script src="js/scenario-v4.js"></script>
       const report = ScenarioV4.validate(doc);
       if (report.errors.length) { … }        // would fail the POC V4 loader
       if (report.warnings.length) { … }      // would pass, but flagged

   Usage from a terminal, to check files:
       node js/scenario-v4.js path/to/scenario.lo.json […more files]

   ========================================================================== */

(function (root, factory) {
  'use strict';
  /* Works as a browser global and as a node module — no build step either way. */
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScenarioV4 = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* --- Fixed vocabularies -------------------------------------------------
     These are set by the POC V4 engine's templates and assessment schema. An author
     writes each level's criteria; nobody gets to rename or extend the set. Our
     own custom tiers (CONNECTS / VAGUE / CONFRONTS) must normalize onto these. */

  const MODES = ['coach_inquiry', 'roleplay', 'observe_react'];
  const LEVELS = ['unthoughtful', 'neutral', 'strong'];
  const MODALITY = 'ai-conversational';

  /* --- declared extensions -------------------------------------------------
     Fields WE author that are not yet in Scenario CML v4.

     v4 sets additionalProperties:false at every level, so an extension is not a
     free addition — the POC V4 loader rejects the whole document. We therefore treat
     extensions as first-class in our own source of truth while being loud about
     the consequence:

       validate(doc)                  → extension is valid, reported as a warning
       validate(doc, {strict: true})  → extension is an ERROR (the POC V4 loader, exactly)
       stripExtensions(doc)           → a loadable copy + what was removed

     Each entry names the proposal we are making to the dev team, so the reason a
     field exists never has to be reconstructed from a diff.

     · practice.answer_shape — "does this practice have a determinate answer the
       coach must land, or is it open judgment?" Our engine has steered on this
       since the guided-arc build (`hasRightAnswer` + `throughLine`): a
       determinate practice makes the coach state the conclusion plainly and never
       hedge, an open one makes it deepen what the learner said instead. v4 has no
       equivalent — its per-phase teaching carrier, debrief.key_points, is
       REQUIRED on every debrief and so cannot distinguish the two. Without the
       marker every beat is treated as having a verdict to deliver, which defeats
       reflection beats. It is content structure, not prompt text, so it does not
       violate the POC V4 "no prompt text in content" constraint. */
  const EXTENSIONS = {
    'practice.answer_shape': {
      values: ['determinate', 'open'],
      because: 'v4 cannot distinguish a graded practice from an open judgment one; '
        + 'debrief.key_points is required on every debrief, so its presence carries no signal.',
      consequence: 'stripped, every practice reads as determinate — the coach delivers a '
        + 'verdict on reflection beats instead of deepening the learner\'s own answer.',
    },

    /* --- content safety triggers -------------------------------------------
       UX Universal runs content-triggered safety floors — CRISIS_FLOOR
       (js/scenario.js), the branching threat floor, the ensemble minor floor.
       Each is switched on by an authored flag on the scenario. POC V4 has no
       field for any of them, so on a v4 document the floors never arm: the
       scenario plays without them and nothing says so. That is the one gap in
       this set that is a SILENT SAFETY REGRESSION rather than a lost nicety,
       which is why the flags are declared here rather than waiting for the
       format conversation. They are content classification, not prompt text. */
    'content.elevated_stakes': {
      type: 'boolean',
      because: 'POC V4 has no field to declare that a scenario runs at elevated stakes.',
      consequence: 'stripped, the crisis floor never arms on this scenario.',
    },
    'content.involves_minors': {
      type: 'boolean',
      because: 'POC V4 has no field to declare that a scenario involves minors.',
      consequence: 'stripped, the minor-protection floor never arms on this scenario.',
    },
    'content.threat_content': {
      type: 'boolean',
      because: 'POC V4 has no field to declare that a scenario carries threat content.',
      consequence: 'stripped, the threat floor never arms on this scenario.',
    },
  };

  /* Set per validate() call; read by extension field validators. */
  let strictMode = false;

  function extensionField(key, opts) {
    const spec = EXTENSIONS[key];
    return function (rep, path, value) {
      if (spec.type === 'boolean' && typeof value !== 'boolean') {
        rep.err(path, 'must be true or false (got ' + describe(value) + ').');
        return;
      }
      if (spec.values && spec.values.indexOf(value) < 0) {
        rep.err(path, 'must be one of: ' + spec.values.join(', ') + ' (got ' + JSON.stringify(value) + ').');
        return;
      }
      if (strictMode) {
        rep.err(path, 'is a Vector extension, not a field in Scenario CML v4 — the production loader '
          + 'rejects it (additionalProperties:false). ' + spec.because);
        return;
      }
      rep.warn(path, 'is a Vector extension, not yet in Scenario CML v4 — this document will '
        + 'NOT load in the production engine until the field is adopted. If ' + spec.consequence);
    };
  }

  /* §9.2 — the prompt-smell needles, checked case-insensitively against every
     string value in `content`. Dict KEYS are exempt (a key named "the_ui" is
     fine); only values are scanned. */
  const SMELL_NEEDLES = [
    '[[', ']]', 'the interface', 'the ui', 'the chat window',
    'the ai coach will', 'the ai will', 'the model does not',
  ];

  /* §7.1 — a phase label must not restate its own position, because the player
     already renders "Phase N of M". Enforced by POC V4's scripts/check_content.py
     rather than the loader, so we report it as a warning: the document still
     loads, but POC V4 content check would bounce it back. */
  const POSITION_LABEL_RE = /^\s*(phase|part|step|section|beat|module|chapter)\s*\d+\s*(?:[—–\-:.)]|\bof\b)/i;

  /* ==========================================================================
     Error plumbing
     Every problem carries the JSON path that caused it, so a Studio field can
     light up without guessing which phase went wrong.
     ====================================================================== */

  function Report() {
    this.errors = [];
    this.warnings = [];
  }
  Report.prototype.err = function (path, message) {
    this.errors.push({ path: path, message: message });
    return this;
  };
  Report.prototype.warn = function (path, message) {
    this.warnings.push({ path: path, message: message });
    return this;
  };
  /* --- primitive checks --------------------------------------------------- */

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  /* Plain coercion for cross-field checks. Distinct from str/str1 below, which
     are field VALIDATORS rather than value readers. */
  function asStr(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function checkString(rep, path, value, opts) {
    const o = opts || {};
    if (typeof value !== 'string') {
      rep.err(path, 'must be a string (got ' + describe(value) + ').');
      return false;
    }
    if (o.minLength && value.length < o.minLength) {
      rep.err(path, 'must be a non-empty string.');
      return false;
    }
    if (o.pattern && !o.pattern.test(value)) {
      rep.err(path, 'does not match the required form ' + o.patternLabel + '.');
      return false;
    }
    if (o.enum && o.enum.indexOf(value) < 0) {
      rep.err(path, 'must be one of: ' + o.enum.join(', ') + ' (got "' + value + '").');
      return false;
    }
    if (o.const && value !== o.const) {
      rep.err(path, 'must be exactly "' + o.const + '" (got "' + value + '").');
      return false;
    }
    return true;
  }

  function checkInteger(rep, path, value, opts) {
    const o = opts || {};
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      rep.err(path, 'must be a whole number (got ' + describe(value) + ').');
      return false;
    }
    if (typeof o.minimum === 'number' && value < o.minimum) {
      rep.err(path, 'must be at least ' + o.minimum + ' (got ' + value + ').');
      return false;
    }
    return true;
  }

  /* An array of items, each validated by `itemFn`. */
  function checkArray(rep, path, value, opts, itemFn) {
    const o = opts || {};
    if (!Array.isArray(value)) {
      rep.err(path, 'must be an array (got ' + describe(value) + ').');
      return false;
    }
    if (o.minItems && value.length < o.minItems) {
      rep.err(path, o.minItems === 1
        ? 'must have at least one entry — omit the field rather than authoring an empty array.'
        : 'must have at least ' + o.minItems + ' entries.');
      return false;
    }
    value.forEach(function (item, i) { itemFn(rep, path + '[' + i + ']', item); });
    return true;
  }

  function checkStringArray(rep, path, value, opts) {
    return checkArray(rep, path, value, opts, function (r, p, item) {
      checkString(r, p, item, { minLength: (opts && opts.itemMinLength) || 0 });
    });
  }

  function describe(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'an array';
    if (v === undefined) return 'nothing';
    return typeof v;
  }

  /* --- the strict-object workhorse ---------------------------------------
     Mirrors additionalProperties:false plus a required list. `fields` maps a
     key to a validator fn(rep, path, value). Anything not in `fields` is an
     unknown-field error, which is what the POC V4 loader actually does. */

  function validateObject(rep, path, value, spec) {
    if (!isPlainObject(value)) {
      rep.err(path, 'must be an object (got ' + describe(value) + ').');
      return false;
    }
    (spec.required || []).forEach(function (key) {
      if (!(key in value)) rep.err(path === '' ? key : path + '.' + key, 'is required.');
    });
    Object.keys(value).forEach(function (key) {
      const child = path === '' ? key : path + '.' + key;
      const fn = spec.fields[key];
      if (!fn) {
        rep.err(child, 'is not a field in Scenario CML v4 — unknown fields are '
          + 'rejected at every level (additionalProperties:false), so this fails the load.');
        return;
      }
      if (value[key] === undefined) return;   // an explicit undefined reads as absent
      fn(rep, child, value[key]);
    });
    if (spec.minProperties && Object.keys(value).length < spec.minProperties) {
      rep.err(path, 'must set at least ' + spec.minProperties + ' field(s).');
    }
    return true;
  }

  /* Small helpers so the field tables below read like the schema. */
  const str1 = function (rep, p, v) { checkString(rep, p, v, { minLength: 1 }); };
  const str = function (rep, p, v) { checkString(rep, p, v, {}); };
  const strArray1 = function (rep, p, v) { checkStringArray(rep, p, v, { minItems: 1, itemMinLength: 1 }); };

  /* ==========================================================================
     $defs — one validator per schema definition, in schema order
     ====================================================================== */

  function vMedia(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['type', 'src'],
      fields: {
        type: function (r, pp, vv) { checkString(r, pp, vv, { enum: ['image', 'video'] }); },
        src: str1,
        alt: str,
      },
    });
  }

  /* An exhibit is a media asset plus its own ground-truth `facts`. Those facts
     are why an observe practice does not need global canon: they scope the
     exhibit's contents to the one scene that can see it. */
  function vExhibit(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['type', 'src'],
      fields: {
        type: function (r, pp, vv) { checkString(r, pp, vv, { enum: ['image', 'video'] }); },
        src: str1,
        alt: str,
        facts: strArray1,
      },
    });
  }

  function vTeachingTopic(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['topic', 'points'],
      fields: { topic: str, points: strArray1 },
    });
  }

  function vMisconception(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['misconception', 'redirect'],
      fields: { misconception: str, redirect: str },
    });
  }

  function vCanon(rep, p, v) {
    validateObject(rep, p, v, { required: ['facts'], fields: { facts: strArray1 } });
  }

  function vBehavior(rep, p, v) {
    validateObject(rep, p, v, {
      required: [],
      fields: {
        driver: str,
        baseline: str,
        guardrails: function (r, pp, vv) { checkStringArray(r, pp, vv, {}); },
      },
    });
  }

  function vCanonFact(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['fact'],
      fields: { fact: str, reveal_when: str },
    });
  }

  /* A character is identity and disposition only. How they REACT to being
     handled well or badly lives in each practice's `levels`, because reactions
     differ per scene — do not look for reactions here. */
  function vCharacter(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['id', 'name', 'role'],
      fields: {
        id: str,
        name: str,
        role: str,
        behavior: vBehavior,
        canon_facts: function (r, pp, vv) { checkArray(r, pp, vv, {}, vCanonFact); },
      },
    });
  }

  function vSceneWorld(rep, p, v) {
    validateObject(rep, p, v, {
      required: [],
      minProperties: 1,
      fields: {
        setting: str1,
        canon: vCanon,
        characters: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vCharacter); },
      },
    });
  }

  function vOpeningMessage(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['text'],
      fields: { text: str1, character_id: str, emotion: str },
    });
  }

  /* An observe brief is text ONLY — no character_id, no emotion. It is a locked
     briefing over the exhibit, not a chat bubble. */
  function vBriefMessage(rep, p, v) {
    validateObject(rep, p, v, { required: ['text'], fields: { text: str1 } });
  }

  function vExample(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['learner', 'reply'],
      fields: { learner: str1, reply: str1 },
    });
  }

  /* `allowProgression` carries §9.1 rule 5: `progression` is legal only inside a
     roleplay interaction's levels, because only a scene has something to
     resolve. Everywhere else it is a loader error, not an ignored key. */
  function makeLevel(allowProgression) {
    return function (rep, p, v) {
      validateObject(rep, p, v, {
        required: ['look_for', 'response'],
        fields: {
          look_for: str1,
          response: str1,
          example: vExample,
          progression: function (r, pp, vv) {
            if (!allowProgression) {
              r.err(pp, 'is only legal inside a roleplay interaction\'s levels (spec §9.1 rule 5) — '
                + 'there is no scene here for it to resolve.');
              return;
            }
            checkString(r, pp, vv, { minLength: 1 });
          },
        },
      });
    };
  }

  /* Full levels: the two POLES are required; NEUTRAL is optional.
     Decided 2026-08-18. The open-ended 1–9 form K&A proposed was declined for
     complexity and prompt volume, but the middle tier becoming optional was
     granted in the same breath — a binary step ("safe / unsafe") has no neutral
     to author, and requiring one is how the POC's own port came to "invent
     middle tiers just to satisfy the schema". Dev is updating the spec; this is
     our side of it.
     Nothing downstream needed changing: calibrationFromLevels already iterates
     LEVELS and skips any tier with no look_for and no response, so an absent
     neutral simply produces a two-rung calibration. Present-but-empty is still
     caught, because `fields` keeps validating neutral whenever it appears. */
  function makeLevels(allowProgression) {
    const level = makeLevel(allowProgression);
    return function (rep, p, v) {
      validateObject(rep, p, v, {
        required: ['unthoughtful', 'strong'],
        fields: { unthoughtful: level, neutral: level, strong: level },
      });
    };
  }

  const vLevelsScene = makeLevels(true);    // roleplay interactions
  const vLevelsPlain = makeLevels(false);   // everywhere else

  /* The opening's levels are a RESTRICTED, PARTIAL type: no progression (no
     scene), and only as many tiers as the source material actually grounds —
     at least one. An unauthored tier is absent, not an error. */
  function vOpeningLevels(rep, p, v) {
    const openingLevel = function (r, pp, vv) {
      validateObject(r, pp, vv, {
        required: ['look_for', 'response'],
        fields: { look_for: str1, response: str1, example: vExample },
      });
    };
    if (!validateObject(rep, p, v, {
      required: [],
      fields: { unthoughtful: openingLevel, neutral: openingLevel, strong: openingLevel },
    })) return;
    const present = LEVELS.filter(function (k) { return k in v; });
    if (!present.length) {
      rep.err(p, 'must author at least one of: ' + LEVELS.join(', ') + '.');
    }
  }

  /* The opening's exit has NO `requirement` key at all — the opening cannot
     author an exit gate. That is a different type from a practice's exit. */
  function vOpeningExit(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['when'],
      fields: {
        when: function (r, pp, vv) {
          validateObject(r, pp, vv, {
            required: ['turns'],
            fields: { turns: function (r2, p2, v2) { checkInteger(r2, p2, v2, { minimum: 1 }); } },
          });
        },
        final_word: str1,
      },
    });
  }

  function vPracticeExit(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['when'],
      fields: {
        when: function (r, pp, vv) {
          validateObject(r, pp, vv, {
            required: ['turns'],
            fields: {
              requirement: str1,
              turns: function (r2, p2, v2) { checkInteger(r2, p2, v2, { minimum: 1 }); },
            },
          });
        },
        final_word: str1,
      },
    });
  }

  function vRubricItem(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['id', 'name', 'standard_term', 'nudge'],
      fields: { id: str, name: str, standard_term: str, nudge: str },
    });
  }

  function vConditionalProbe(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['required_concepts', 'probe'],
      fields: { required_concepts: strArray1, probe: str },
    });
  }

  function vCarryoverItem(rep, p, v) {
    validateObject(rep, p, v, { required: ['from'], fields: { from: str } });
  }

  function vTransition(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['button_label'],
      fields: { button_label: str1, text: str },
    });
  }

  function vIdealResponse(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['component_groups', 'summary'],
      fields: {
        component_groups: function (r, pp, vv) {
          checkArray(r, pp, vv, { minItems: 1 }, function (r2, p2, v2) {
            validateObject(r2, p2, v2, {
              required: ['components'],
              fields: { title: str, components: strArray1 },
            });
          });
        },
        summary: str1,
        /* External authorities only — an OSHA standard, Title VII. Never an
           internal course/slide id: the close's defensibility rests on shipping
           the verbatim ideal_response, and an internal citation means nothing
           outside the course. */
        source_references: function (r, pp, vv) { checkStringArray(r, pp, vv, {}); },
      },
    });
  }

  /* --- the three interaction shapes -------------------------------------- */

  function vCoachInteraction(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['opening_messages'],
      fields: {
        opening_messages: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vOpeningMessage); },
        levels: vLevelsPlain,
        input_placeholder: str,
        partner_label: str,
        media: vMedia,
      },
    });
  }

  function vRoleplayInteraction(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['setting', 'partner_label', 'opening_messages'],
      fields: {
        setting: str1,
        /* null or omitted = narrator-driven roleplay, a first-class pattern for
           a practice about what the learner DOES rather than what they say. */
        character_id: function (r, pp, vv) {
          if (vv === null) return;
          checkString(r, pp, vv, {});
        },
        emotion_hint: str,
        partner_label: str1,
        opening_messages: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vOpeningMessage); },
        levels: vLevelsScene,   // the one place `progression` is legal
        input_placeholder: str,
        help_turns: function (r, pp, vv) { checkInteger(r, pp, vv, { minimum: 0 }); },
        carryover: function (r, pp, vv) { checkArray(r, pp, vv, {}, vCarryoverItem); },
      },
    });
  }

  function vObserveInteraction(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['exhibit', 'rubric', 'spot_target', 'brief'],
      fields: {
        exhibit: vExhibit,
        rubric: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vRubricItem); },
        spot_target: function (r, pp, vv) { checkInteger(r, pp, vv, { minimum: 1 }); },
        brief: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vBriefMessage); },
        levels: vLevelsPlain,
        jot_placeholder: str,
        partner_label: str,
        help_turns: function (r, pp, vv) { checkInteger(r, pp, vv, { minimum: 0 }); },
        carryover: function (r, pp, vv) { checkArray(r, pp, vv, {}, vCarryoverItem); },
      },
    });
  }

  const INTERACTION_BY_MODE = {
    coach_inquiry: vCoachInteraction,
    roleplay: vRoleplayInteraction,
    observe_react: vObserveInteraction,
  };

  /* --- practice: one spine, plus the mode's interaction ------------------ */

  function vPractice(rep, p, v) {
    if (!isPlainObject(v)) {
      rep.err(p, 'must be an object (got ' + describe(v) + ').');
      return;
    }
    /* The interaction's shape is selected by `mode`, so resolve the mode first
       and let the wrong-shape errors point at real fields. */
    const mode = v.mode;
    const interactionFn = INTERACTION_BY_MODE[mode];
    validateObject(rep, p, v, {
      required: ['mode', 'purpose', 'exit', 'transition', 'interaction'],
      fields: {
        mode: function (r, pp, vv) { checkString(r, pp, vv, { enum: MODES }); },
        label: str1,
        purpose: str1,
        exit: vPracticeExit,
        transition: vTransition,
        /* Vector extension — see EXTENSIONS above. */
        answer_shape: extensionField('practice.answer_shape'),
        interaction: function (r, pp, vv) {
          if (!interactionFn) {
            /* Without a valid mode we cannot know which shape to enforce; the
               mode error above already names the problem. */
            if (!isPlainObject(vv)) r.err(pp, 'must be an object.');
            return;
          }
          interactionFn(r, pp, vv);
        },
      },
    });
  }

  /* --- debrief: a first-class turn-owning unit --------------------------- */

  function vProbe(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['text'],
      fields: { text: str1, levels: vLevelsPlain },
    });
  }

  function vDebrief(rep, p, v) {
    if (!validateObject(rep, p, v, {
      required: ['label', 'key_points', 'follow_up_turns', 'transition'],
      fields: {
        label: str1,
        purpose: str1,
        partner_label: str,
        key_points: strArray1,
        levels: vLevelsPlain,
        probe: vProbe,
        follow_up_turns: function (r, pp, vv) { checkInteger(r, pp, vv, { minimum: 0 }); },
        requirement: str1,
        input_placeholder: str,
        final_word: str1,
        transition: vTransition,
      },
    })) return;

    /* follow_up_turns: 0 is delivery-only and the DEFAULT posture — the debrief
       speaks its key_points then its final_word and opens no composer. There is
       nothing left to ask, so a probe/requirement/placeholder there is an
       error, and final_word becomes the unit's entire remaining content. */
    if (v.follow_up_turns === 0) {
      if (!('final_word' in v)) {
        rep.err(p + '.final_word', 'is required when follow_up_turns is 0 — it is the whole '
          + 'content of a delivery-only debrief after key_points.');
      }
      ['probe', 'requirement', 'input_placeholder'].forEach(function (key) {
        if (key in v) {
          rep.err(p + '.' + key, 'is not allowed when follow_up_turns is 0 — a delivery-only '
            + 'debrief speaks once and never waits for an answer.');
        }
      });
    }
  }

  /* --- phase, opening, closing ------------------------------------------ */

  function vPhase(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['id', 'label', 'purpose', 'practice', 'debrief'],
      fields: {
        id: str1,
        label: str1,
        purpose: str1,
        practice: vPractice,
        debrief: vDebrief,
      },
    });
    /* Their content check bounces a label that restates its own position, since
       the player already renders "Phase N of M" from the array index. */
    if (v && typeof v.label === 'string' && POSITION_LABEL_RE.test(v.label)) {
      rep.warn(p + '.label', 'restates the phase\'s own position ("' + v.label + '"). The player '
        + 'renders "Phase N of M" already; the POC V4 content check rejects this. '
        + 'Use the source material\'s own name for the segment.');
    }
  }

  function vOpening(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['id', 'label', 'purpose', 'opening_messages', 'exit', 'transition'],
      fields: {
        id: str1,
        label: str1,
        input_placeholder: str,
        purpose: str1,
        opening_messages: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vOpeningMessage); },
        levels: vOpeningLevels,
        exit: vOpeningExit,
        conditional_probes: function (r, pp, vv) { checkArray(r, pp, vv, {}, vConditionalProbe); },
        transition: vTransition,
      },
    });
  }

  function vClosing(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['ideal_response'],
      fields: { partner_label: str, ideal_response: vIdealResponse },
    });
  }

  function vContent(rep, p, v) {
    validateObject(rep, p, v, {
      required: ['title', 'coach_persona', 'teaching_points', 'phases', 'closing'],
      fields: {
        title: str1,
        narrative: str1,
        scene_world: vSceneWorld,
        coach_persona: str1,
        tone_guidelines: strArray1,
        teaching_points: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vTeachingTopic); },
        misconceptions: function (r, pp, vv) { checkArray(r, pp, vv, {}, vMisconception); },
        opening: vOpening,
        phases: function (r, pp, vv) { checkArray(r, pp, vv, { minItems: 1 }, vPhase); },
        closing: vClosing,
        landing_cta_label: str1,
        /* UX Universal extensions — see EXTENSIONS above. */
        elevated_stakes: extensionField('content.elevated_stakes'),
        involves_minors: extensionField('content.involves_minors'),
        threat_content: extensionField('content.threat_content'),
      },
    });
  }

  /* ==========================================================================
     §9.1 — loader cross-field rules the JSON Schema cannot express
     ====================================================================== */

  function checkCrossFieldRules(rep, content) {
    if (!isPlainObject(content)) return;
    const phases = Array.isArray(content.phases) ? content.phases : [];

    /* Rules 1 & 2 — phase ids unique, and no "." (reserved for the derived
       debrief id "{phase_id}.debrief", so a collision would be ambiguous). */
    const seen = Object.create(null);
    const indexOfPhase = Object.create(null);
    phases.forEach(function (ph, i) {
      const id = ph && ph.id;
      if (typeof id !== 'string' || !id) return;
      if (seen[id]) {
        rep.err('content.phases[' + i + '].id', 'duplicates the id "' + id + '" already used by '
          + 'phase ' + seen[id].i + ' — phase ids must be unique (§9.1 rule 1).');
      } else {
        seen[id] = { i: i };
        indexOfPhase[id] = i;
      }
      if (id.indexOf('.') >= 0) {
        rep.err('content.phases[' + i + '].id', 'must not contain "." — that character is reserved '
          + 'for the derived debrief id "' + id + '.debrief" (§9.1 rule 2).');
      }
    });

    const declaredCharacters = Object.create(null);
    const sw = content.scene_world;
    if (isPlainObject(sw) && Array.isArray(sw.characters)) {
      sw.characters.forEach(function (c) {
        if (c && typeof c.id === 'string') declaredCharacters[c.id] = true;
      });
    }

    phases.forEach(function (ph, i) {
      if (!isPlainObject(ph)) return;
      const practice = ph.practice;
      if (!isPlainObject(practice)) return;
      const inter = practice.interaction;
      const base = 'content.phases[' + i + '].practice.interaction';

      /* Rule 3 — carryover names an EARLIER phase in authored order. A scene
         starts blank; carryover grants it the verbatim transcript of a prior
         attempt, which can only exist if that phase already ran. */
      if (isPlainObject(inter) && Array.isArray(inter.carryover)) {
        inter.carryover.forEach(function (entry, k) {
          const from = entry && entry.from;
          if (typeof from !== 'string' || !from) return;
          const at = indexOfPhase[from];
          if (at === undefined) {
            rep.err(base + '.carryover[' + k + '].from', 'names "' + from + '", which is not a phase '
              + 'in this scenario (§9.1 rule 3).');
          } else if (at >= i) {
            rep.err(base + '.carryover[' + k + '].from', 'names "' + from + '", which is not an '
              + 'EARLIER phase (it is at position ' + at + ', this phase is at ' + i + ') — '
              + 'there is no transcript to carry yet (§9.1 rule 3).');
          }
        });
      }

      /* Rule 4 — a roleplay character_id must name a declared character. */
      if (practice.mode === 'roleplay' && isPlainObject(inter)) {
        const cid = inter.character_id;
        if (typeof cid === 'string' && cid && !declaredCharacters[cid]) {
          rep.err(base + '.character_id', 'names "' + cid + '", which is not declared in '
            + 'content.scene_world.characters (§9.1 rule 4).');
        }
      }

      /* Rule 6 — spot_target within the rubric, and unique rubric ids. */
      if (practice.mode === 'observe_react' && isPlainObject(inter)) {
        const rubric = Array.isArray(inter.rubric) ? inter.rubric : [];
        if (typeof inter.spot_target === 'number' && rubric.length
            && inter.spot_target > rubric.length) {
          rep.err(base + '.spot_target', 'is ' + inter.spot_target + ', which exceeds the rubric\'s '
            + rubric.length + ' item(s) — the practice could never complete (§9.1 rule 6).');
        }
        const ids = Object.create(null);
        rubric.forEach(function (item, k) {
          const id = item && item.id;
          if (typeof id !== 'string' || !id) return;
          if (ids[id]) {
            rep.err(base + '.rubric[' + k + '].id', 'duplicates "' + id + '" — rubric ids are the '
              + 'engine\'s crediting keys and must be unique within the rubric (§9.1 rule 6).');
          }
          ids[id] = true;
        });
      }

      /* Not a v4 rule — ours. A determinate practice (see the answer_shape
         extension) needs a conclusion for the coach to land, and our compiler
         finds it by matching a teaching_points topic to the phase's label. v4
         keeps teaching_points at content level, grouped by subject rather than by
         phase, so that match can miss — and a miss means the coach hedges on a
         graded step with nothing to state plainly. Warn rather than fail: the
         document is still valid v4, it just would not behave as authored. */
      if (practice.answer_shape === 'determinate') {
        const label = asStr(ph.label);
        const matched = (Array.isArray(content.teaching_points) ? content.teaching_points : [])
          .some(function (t) { return isPlainObject(t) && asStr(t.topic) === label; });
        if (label && !matched) {
          rep.warn('content.phases[' + i + ']', 'is marked answer_shape "determinate" but no '
            + 'teaching_points topic matches its label "' + label + '", so the coach has no '
            + 'conclusion to land on a graded step. Either add a topic named for this phase or '
            + 'mark the practice "open".');
        }
      }

      /* Rule 7 — a probe needs somewhere to be answered. (The schema's
         follow_up_turns:0 branch also forbids it; this catches the inverse
         phrasing and gives the rule-numbered message.) */
      const debrief = ph.debrief;
      if (isPlainObject(debrief) && isPlainObject(debrief.probe)
          && typeof debrief.follow_up_turns === 'number' && debrief.follow_up_turns < 1) {
        rep.err('content.phases[' + i + '].debrief.probe', 'requires follow_up_turns >= 1 — a '
          + 'delivery-only debrief never waits for an answer, so the probe could never be '
          + 'asked (§9.1 rule 7).');
      }
    });
  }

  /* ==========================================================================
     §9.2 — prompt-smell lint over every string VALUE in content
     ====================================================================== */

  function lintPromptSmell(rep, content) {
    walkStrings(content, 'content', function (path, s) {
      const hay = s.toLowerCase();
      SMELL_NEEDLES.forEach(function (needle) {
        if (hay.indexOf(needle) >= 0) {
          rep.err(path, 'contains "' + needle + '", which the prompt-smell lint rejects (§9.2). '
            + 'Authored content carries no prompt text, control directives, or '
            + 'interface/AI-mechanics language.');
        }
      });
    });
  }

  function walkStrings(node, path, fn) {
    if (typeof node === 'string') { fn(path, node); return; }
    if (Array.isArray(node)) {
      node.forEach(function (item, i) { walkStrings(item, path + '[' + i + ']', fn); });
      return;
    }
    if (isPlainObject(node)) {
      /* Dict keys are exempt — only values are scanned. */
      Object.keys(node).forEach(function (k) { walkStrings(node[k], path + '.' + k, fn); });
    }
  }

  /* ==========================================================================
     §2 — the derived conversation cap
     Never authored: it is the sum of every authored budget, which is exactly why
     it can never be small enough to strand a later phase. Coach-help turns are
     budget-inert and deliberately excluded.
     ====================================================================== */

  function deriveCap(content) {
    if (!isPlainObject(content)) return 0;
    let cap = 0;
    const opening = content.opening;
    if (isPlainObject(opening) && isPlainObject(opening.exit) && isPlainObject(opening.exit.when)
        && typeof opening.exit.when.turns === 'number') {
      cap += opening.exit.when.turns;
    }
    (Array.isArray(content.phases) ? content.phases : []).forEach(function (ph) {
      if (!isPlainObject(ph)) return;
      const pr = ph.practice;
      if (isPlainObject(pr) && isPlainObject(pr.exit) && isPlainObject(pr.exit.when)
          && typeof pr.exit.when.turns === 'number') {
        cap += pr.exit.when.turns;
      }
      const db = ph.debrief;
      if (isPlainObject(db) && typeof db.follow_up_turns === 'number') cap += db.follow_up_turns;
    });
    return cap;
  }

  /* The flattened arc order the engine runs: the opening, then each phase's
     practice and debrief in phase order. The closing owns no turns. A debrief's
     unit id is DERIVED — "{phase_id}.debrief" — never authored. */
  function unitSequence(content) {
    const units = [];
    if (!isPlainObject(content)) return units;
    if (isPlainObject(content.opening)) {
      units.push({ id: content.opening.id, kind: 'opening', turns: budgetOf(content.opening) });
    }
    (Array.isArray(content.phases) ? content.phases : []).forEach(function (ph) {
      if (!isPlainObject(ph)) return;
      const pr = isPlainObject(ph.practice) ? ph.practice : null;
      units.push({
        id: ph.id,
        kind: 'practice',
        mode: pr ? pr.mode : undefined,
        turns: pr ? budgetOf(pr) : 0,
      });
      units.push({
        id: ph.id + '.debrief',
        kind: 'debrief',
        turns: isPlainObject(ph.debrief) && typeof ph.debrief.follow_up_turns === 'number'
          ? ph.debrief.follow_up_turns : 0,
      });
    });
    return units;
  }

  function budgetOf(unit) {
    return isPlainObject(unit) && isPlainObject(unit.exit) && isPlainObject(unit.exit.when)
      && typeof unit.exit.when.turns === 'number' ? unit.exit.when.turns : 0;
  }

  /* ==========================================================================
     Public entry point
     ====================================================================== */

  /* opts.strict — reproduce the POC V4 loader exactly, so declared extensions become
     errors rather than warnings. Use it to answer "would this load today?" */
  function validate(doc, opts) {
    const rep = new Report();
    strictMode = !!(opts && opts.strict);
    validateObject(rep, '', doc, {
      required: ['implementation_id', 'modality', 'schema_version', 'content'],
      fields: {
        implementation_id: str1,
        modality: function (r, p, v) { checkString(r, p, v, { const: MODALITY }); },
        schema_version: function (r, p, v) {
          checkString(r, p, v, { pattern: /^4\./, patternLabel: '"4.x"' });
        },
        content: vContent,
      },
    });
    if (isPlainObject(doc) && isPlainObject(doc.content)) {
      checkCrossFieldRules(rep, doc.content);
      lintPromptSmell(rep, doc.content);
    }
    strictMode = false;
    return {
      ok: rep.errors.length === 0,
      errors: rep.errors,
      warnings: rep.warnings,
      cap: isPlainObject(doc) ? deriveCap(doc.content) : 0,
    };
  }

  /* A one-line human summary, handy for a Studio status bar or a console. */
  function formatReport(report) {
    const lines = [];
    report.errors.forEach(function (e) { lines.push('ERROR  ' + (e.path || '(root)') + ' — ' + e.message); });
    report.warnings.forEach(function (w) { lines.push('WARN   ' + (w.path || '(root)') + ' — ' + w.message); });
    if (!lines.length) lines.push('valid — derived conversation cap: ' + report.cap + ' turns');
    return lines.join('\n');
  }

  /* ==========================================================================
     House defaults — for fields POC V4 requires that no LXD deck provides
     --------------------------------------------------------------------------
     Rather than have an author invent content to satisfy a schema slot (which is
     how the POC V4 Marshall scenario ended up with an invented compliance claim),
     fill the mechanical ones centrally, once.

     WHICH FIELDS QUALIFY was decided by measuring the 11 POC V4 scenarios, and
     the two transition slots turned out to behave differently:

       practice → debrief   29 authored, 23 of them the identical string
                            "Talk it through". This button always does the same
                            thing — leave the attempt, hear the coach. The six
                            exceptions include "Talk it out": the same words
                            rearranged. That is drift, so it gets a default.

       debrief → next step  29 authored, 17 distinct. "Sit down with Bianca",
                            "Take the follow-up call", "Find Marco" — these name
                            what happens next, so the label carries story. A
                            default here would flatten real design, so it gets a
                            neutral fallback and the report flags it as worth
                            replacing.

     WHAT IS DELIBERATELY NOT DEFAULTED: `final_word`, and any debrief teaching
     content. A final word is the last thing a learner hears, authored prose in
     the coach's voice — inventing it is precisely the failure this function
     exists to avoid. It stays a real authoring task.
     ====================================================================== */

  const HOUSE = {
    practiceButton: 'Talk it through',      // the POC V4 convention, 23 of 29
    debriefButton: 'Continue',              // neutral fallback; a story label is better
    openingButton: 'Begin practicing',      // the POC V4 convention, 2 of 5
  };

  /* A model-facing purpose is not learner-visible prose, so a formulaic sentence
     is honest rather than invented — it states the unit's structural job, which
     is all the field is read for. */
  const PURPOSE_BY_MODE = {
    coach_inquiry: 'The learner reasons this through with the coach before any teaching lands.',
    roleplay: 'The learner acts in the scene and lives with how it reacts.',
    observe_react: 'The learner studies the exhibit and is credited for what they spot.',
  };

  function applyHouseDefaults(doc) {
    const filled = [];
    const soft = [];        // defaulted, but a human should probably replace it
    if (!isPlainObject(doc) || !isPlainObject(doc.content)) return { doc: doc, filled: filled, soft: soft };
    const content = doc.content;
    const set = (target, key, value, path, isSoft) => {
      if (!isPlainObject(target)) return;
      if (asStr(target[key])) return;               // never overwrite authored text
      target[key] = value;
      filled.push({ path: path, value: value });
      if (isSoft) soft.push({ path: path, value: value });
    };

    const opening = content.opening;
    if (isPlainObject(opening)) {
      if (!isPlainObject(opening.transition)) opening.transition = {};
      set(opening.transition, 'button_label', HOUSE.openingButton, 'content.opening.transition.button_label');
    }

    (Array.isArray(content.phases) ? content.phases : []).forEach(function (ph, i) {
      if (!isPlainObject(ph)) return;
      const at = 'content.phases[' + i + ']';
      const practice = isPlainObject(ph.practice) ? ph.practice : null;
      if (practice) {
        if (!isPlainObject(practice.transition)) practice.transition = {};
        set(practice.transition, 'button_label', HOUSE.practiceButton, at + '.practice.transition.button_label');
        set(practice, 'purpose', PURPOSE_BY_MODE[practice.mode] || PURPOSE_BY_MODE.coach_inquiry,
          at + '.practice.purpose');
      }
      const label = asStr(ph.label);
      set(ph, 'purpose', label
        ? 'This segment of the story covers "' + label + '".'
        : 'A segment of the story the learner works through in order.', at + '.purpose');

      const debrief = isPlainObject(ph.debrief) ? ph.debrief : null;
      if (debrief) {
        if (!isPlainObject(debrief.transition)) debrief.transition = {};
        /* soft: this one leads into the next scene, so a story label beats "Continue". */
        set(debrief.transition, 'button_label', HOUSE.debriefButton,
          at + '.debrief.transition.button_label', true);
      }
    });
    return { doc: doc, filled: filled, soft: soft };
  }

  /* ==========================================================================
     foldExtensions — the PROPOSED wire shape: must-ignore extension envelopes
     --------------------------------------------------------------------------
     The ask to the POC V4 team (notes §7-H): keep additionalProperties:false
     everywhere EXCEPT one sanctioned `extensions` container on `content` and on
     each `practice`, holding namespaced keys (`vector:answer_shape`), under
     must-ignore semantics — an engine MUST load what it does not implement and
     MUST ignore it. Strictness keeps catching typos (there is exactly one place
     vendor data may live); adoption stops being binary (load now, honor when
     implemented); and each extension ships with a behavioral contract whose
     reference implementation is the UX Universal player.

     This function emits that shape so a WORKING SAMPLE can sit in front of the
     dev team: same document, extensions folded instead of stripped. It fails
     their loader today by exactly ONE kind of key — `extensions` — which is the
     size of the schema change being requested.
     ====================================================================== */

  function foldExtensions(doc) {
    const copy = JSON.parse(JSON.stringify(doc));
    const folded = [];
    const content = isPlainObject(copy) ? copy.content : null;
    if (!isPlainObject(content)) return { doc: copy, folded: folded };

    const fold = (holder, key, holderPath) => {
      if (!(key in holder)) return;
      holder.extensions = holder.extensions || {};
      holder.extensions['vector:' + key] = holder[key];
      delete holder[key];
      folded.push(holderPath + '.' + key + ' → ' + holderPath + '.extensions["vector:' + key + '"]');
    };

    Object.keys(EXTENSIONS).forEach(function (spec) {
      const field = spec.split('.')[1];
      if (spec.indexOf('content.') === 0) fold(content, field, 'content');
    });
    (Array.isArray(content.phases) ? content.phases : []).forEach(function (ph, i) {
      const practice = isPlainObject(ph) ? ph.practice : null;
      if (!isPlainObject(practice)) return;
      Object.keys(EXTENSIONS).forEach(function (spec) {
        const field = spec.split('.')[1];
        if (spec.indexOf('practice.') === 0) fold(practice, field, 'content.phases[' + i + '].practice');
      });
    });
    return { doc: copy, folded: folded };
  }

  /* ==========================================================================
     stripExtensions — produce a copy the POC V4 loader will accept
     Returns the cleaned document plus exactly what was removed and what that
     costs, so a handover is never silently lossy.
     ====================================================================== */

  function stripExtensions(doc) {
    const copy = JSON.parse(JSON.stringify(doc));
    const removed = [];
    const content = isPlainObject(copy) ? copy.content : null;
    if (!isPlainObject(content)) return { doc: copy, removed: removed };

    Object.keys(EXTENSIONS).forEach(function (key) {
      if (key.indexOf('content.') !== 0) return;
      const field = key.slice('content.'.length);
      if (!(field in content)) return;
      removed.push({ path: key, value: content[field], consequence: EXTENSIONS[key].consequence });
      delete content[field];
    });

    (Array.isArray(content.phases) ? content.phases : []).forEach(function (ph, i) {
      const practice = isPlainObject(ph) ? ph.practice : null;
      if (!isPlainObject(practice)) return;
      Object.keys(EXTENSIONS).forEach(function (key) {
        const field = key.split('.')[1];
        if (key.indexOf('practice.') !== 0 || !(field in practice)) return;
        removed.push({
          path: 'content.phases[' + i + '].practice.' + field,
          value: practice[field],
          consequence: EXTENSIONS[key].consequence,
        });
        delete practice[field];
      });
    });
    return { doc: copy, removed: removed };
  }

  return {
    MODES: MODES,
    LEVELS: LEVELS,
    MODALITY: MODALITY,
    SMELL_NEEDLES: SMELL_NEEDLES,
    EXTENSIONS: EXTENSIONS,
    validate: validate,
    formatReport: formatReport,
    deriveCap: deriveCap,
    unitSequence: unitSequence,
    stripExtensions: stripExtensions,
    foldExtensions: foldExtensions,
    applyHouseDefaults: applyHouseDefaults,
    HOUSE: HOUSE,
  };
}));

/* --- terminal entry point -------------------------------------------------
   node js/scenario-v4.js file.lo.json […]   → validates each file, exits 1 on
   any error. Used to check ported examples against the same rules the POC V4
   loader applies. */
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const V4 = module.exports;
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node scenario-v4.js <scenario.lo.json> [...]');
    process.exit(2);
  }
  let failed = 0;
  files.forEach(function (file) {
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.log(file + '\n  ERROR  could not parse — ' + e.message + '\n');
      failed++;
      return;
    }
    const report = V4.validate(doc);
    if (!report.ok) failed++;
    const status = report.ok
      ? (report.warnings.length ? 'VALID (' + report.warnings.length + ' warning(s))' : 'VALID')
      : 'INVALID (' + report.errors.length + ' error(s))';
    console.log(file + '  →  ' + status + '   cap=' + report.cap);
    if (!report.ok || report.warnings.length) {
      console.log(V4.formatReport(report).split('\n').map(function (l) { return '  ' + l; }).join('\n'));
    }
    console.log('');
  });
  process.exit(failed ? 1 : 0);
}
