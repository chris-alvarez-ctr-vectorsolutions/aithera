/* =========================================================================
   WRITER STUDIO V2 — WIZARD SPEC FOR SCENE SWEEP
   Loaded ONLY by writer-studio-v2.html, AFTER the scene-sweep type module
   (needs AitheraStudio.get('scene-sweep')) and AFTER studio-wizard-craft.js
   (needs AitheraWizardCraft). Its own module — parallel to the ensemble
   wizard — because Scene Sweep's schema is bespoke (a visual scene + a
   perception rubric, not a character or footage).

   WHAT THIS SPEC GENERATES vs. WHAT STAYS A MANUAL EDITOR STEP:
     · GENERATED (4 calls): the scene canon + alt + opening reading + reflection
       (foundation); the observable-hazard RUBRIC + coverage (hazards); the two
       coaching beats — Observe → Diagnose & Remediate — with calibration and
       debriefs (beats); the guaranteed close — playbook + resources (close).
     · NOT GENERATED — the wizard cannot see or place pixels: the SCENE PHOTO
       (scene.src) and each hazard's HOTSPOT (hazard.spot). Those are placed by
       hand in the editor's photo canvas. start() leaves scene.src empty and
       every hotspot null; landNote() + the type's own lints send the author
       to upload the photo and click to place the tap-targets.

   THE ARC IT PRODUCES IS THE ALIGNED 2-BEAT SHAPE (HazCom POC deck, FINAL):
   Observe (spot) → Diagnose & Remediate (fix it now). Prevention is folded
   into the Remediate debrief and the close, NOT a third beat — so the beats
   task hard-codes that two-phase structure and only the model writes the copy.

   Same rules as the other specs: the interview asks SME questions in plain
   language (never prompt-writing); craft exemplars are pulled LIVE from the
   shipped DEFAULT ("Spot the Hazard") so "what good looks like" can't drift;
   provenance is never fabricated; every learner-facing line obeys the shared
   banned-phrase voice rules; start() builds a COMPLETE blank skeleton so no
   demo content leaks into a fresh scenario.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;

  const craft = window.AitheraWizardCraft;
  if (!craft) return;
  const { lines, depunct, str, sourceBlock,
          BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE } = craft;

  const T = window.AitheraStudio.get('scene-sweep');
  if (!T || T.wizard) return;
  const D = T.DEFAULT || {};

  // Live craft exemplars from the shipped "Spot the Hazard" build.
  const EX = {
    canon: str((D.scene || {}).canonDescription),
    alt: str((D.scene || {}).alt),
    opening: str(((D.intro || {}).audio || {}).text),
    hazards: JSON.stringify((D.hazards || []).slice(0, 2).map((h) => ({
      id: h.id, short: h.short, alt: h.alt, zone: h.zone, full: h.full, synonyms: h.synonyms, source: h.source, fix: h.fix, prevent: h.prevent,
    })), null, 1),
    decoys: JSON.stringify((D.decoys || []).slice(0, 2).map((d) => ({ alt: d.alt, note: d.note })), null, 1),
    observe: JSON.stringify((D.phases || []).find((p) => p.kind === 'spot') || {}, null, 1),
    playbook: JSON.stringify((D.playbook || []).slice(0, 2), null, 1),
  };

  /* ---- the craft spine: Scene Sweep's two-register framing, composed from the
     shared atoms. Learner-facing = the coach/narrator's spoken voice; guidance =
     the dense instructions the grader reads mid-sweep. */
  const CRAFT_COMMON =
`You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING LINES (the opening scene reading, the first-impression prompt, each beat's on-screen hand-off + task prompt, each debrief's opening line): the coach/narrator's SPOKEN voice — a knowledgeable, plain-spoken safety trainer walking the floor with the learner. Short, warm, direct, contractions; authority plus genuine concern, NEVER an AI assistant or a quiz machine. BANNED (and anything that pattern-matches them): ${BANNED_PHRASES}.
- GUIDANCE TO THE AI (each hazard's full/synonyms/zone/fix/prevent, the calibration tiers, the debrief points, the reflection feedback): dense INSTRUCTIONS a grader reads mid-conversation. Imperative, specific, semicolon-packed; name WHERE each hazard sits and the exact bar to hold.

SCENE-SWEEP LAW: the coach never sees the illustration — it grounds ONLY to the scene canon and the hazard rubric you write. Nudges point to WHERE to look (a hazard's zone), never to WHAT is there. Only the listed hazards exist and only they are credited; clutter/"messy" is never a hazard. Keep the opening reading evocative but do NOT hand the learner every hazard's tell in a checklist — the whole point is that THEY spot them.

${GROUNDING_BASE} ${CITATION_RULE}

${OUTPUT_JSON_RULE}`;

  const SYS = `You are an expert learning-experience designer for Aithera's SCENE SWEEP engine: the learner is THEMSELVES (no character), looking at ONE persistent illustrated work area, free-writing everything that looks wrong. A live grader credits each catch against a fixed OBSERVABLE-HAZARD RUBRIC, tracks coverage (spotted N of M), and nudges spatially toward the misses. Then the scene is worked through two beats — OBSERVE (spot what's wrong) and DIAGNOSE & REMEDIATE (fix it right now) — each Practice then Learn, before a guaranteed SME close. A designer has answered a plain-language interview; you translate it into the exercise's fields with shipped-quality craft.

${CRAFT_COMMON}`;

  function briefBlock(ik) {
    return `THE BRIEF
- What the learner is spotting: ${ik.topic || '(unspecified)'}
- Working title: ${str(ik.title).trim() || '(none — propose one)'}
- Course it applies: ${str(ik.course).trim() || '(unspecified — propose a name)'}`;
  }
  function sceneBlock(ik) {
    return `THE SCENE (designer's words — the coach grounds ONLY to this; never contradict it):
${str(ik.sceneDescription).trim() || '(unspecified)'}`;
  }

  T.wizard = {
    title: 'Start from scratch — Scene Sweep',
    tagline: 'The learner sweeps a photo of a real work area for hazards, then talks each one through.',
    intro: 'Describe the scene and its hazards; a draft lands in the editor. You’ll add the photo and place the tap-targets there.',
    describePlaceholder: 'e.g. Workers who just finished HazCom walk up to a finishing bench and spot what’s unsafe — an unlabeled jug, a bare-handed coworker, an out-of-date SDS, a torn drum label.',

    steps: [
      { id: 'brief', title: 'The brief', sub: 'The work area, at the highest level. You can change any of this later in the editor.',
        fields: [
          { key: 'topic', kind: 'text', required: true, label: 'What is the learner walking up to, and what are they there to spot?',
            placeholder: 'e.g. A finishing bench on a shop floor — HazCom hazards', helper: 'One line. Everything else builds on this.' },
          { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
          { key: 'course', kind: 'text', label: 'The course it applies (optional)',
            placeholder: 'e.g. Hazard Communication GHS (RVCT-479)', helper: 'The training the learner just finished. Grounds the coach’s framing.' },
          { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste the standard, slides, or SME notes (optional)',
            placeholder: 'The regulation’s required elements, slide text, an SME’s hazard list…',
            helper: 'We’ll pull hazards and specifics from here instead of inventing them.' },
        ] },
      { id: 'interview', title: 'The scene & the hazards', sub: 'Describe what the learner sees and what’s wrong in it. Plain language — no prompt-writing.',
        fields: [
          { key: 'sceneDescription', kind: 'area', required: true, minRows: 5, label: 'Describe the work area — the setting and everything in it, hazards included.',
            helper: 'Be concrete about WHERE each thing sits (left of the bench, on the drum to the right…). The coach never sees the photo — it grounds to your words.' },
          { key: 'hazardsList', kind: 'lines', minRows: 5, label: 'The observable hazards — one per line',
            helper: 'Leave blank to let the draft propose them from your scene + source material.' },
          { key: 'remediateFocus', kind: 'area', minRows: 3, label: 'For each hazard — what should the learner do RIGHT NOW, in the moment?',
            helper: 'The immediate corrective action: stop the unsafe work, get PPE on, quarantine the unknown, pull a current sheet, relabel it.' },
          { key: 'preventFocus', kind: 'area', minRows: 2, label: 'What systemic changes keep these from coming back? (optional)',
            helper: 'Feeds the guaranteed close — labeling standards, review cadences, scheduled checks. Prevention is folded into the close, not a separate beat.' },
          { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
            placeholder: 'e.g. a plain-spoken safety veteran — authority and genuine concern, never a quiz machine' },
          { key: 'elevatedStakes', kind: 'toggle', default: false,
            label: 'Higher-stakes scene — treat the hazards as live risk, not housekeeping' },
        ] },
    ],

    start(type) {
      const d = type.blank();
      d.learnerName = 'you';
      d.scene = { src: '', alt: '', canonDescription: '' };
      d.hazards = [];
      d.decoys = [];
      d.phases = [];
      d.playbook = [];
      d.resources = { lead: '', items: [] };
      return d;
    },

    plan() {
      return [
        /* 1) FOUNDATION — framing, the scene the model grounds to, the reading,
              the reflection, the coach voice. */
        { id: 'foundation', label: 'Foundation — the scene, the reading & the coach',
          detail: 'Framing, the scene canon + alt text, the opening reading, the first-impression prompt, coach voice.',
          build(ik) {
            return { maxTokens: 1900,
              system: SYS + `

YOUR TASK — the SCENE FOUNDATION. Return this exact JSON shape:
{
 "title": "learner-facing title, short (e.g. 'Spot the Hazard')",
 "courseName": "the course name as the coach should say it (propose one if the brief left it blank)",
 "framing": "lowercase phrase starting 'a …' naming the exercise — e.g. 'a hands-on hazard-recognition exercise: applying a just-completed course to a real work area'",
 "learnerRole": "who the learner is — ALWAYS themselves, no character (e.g. 'THEMSELVES — a worker who just finished the course, looking at their own work area; there is no one to talk to but you, the coach')",
 "establishingTitle": "2-4 words naming the scene, shown big on the pre-entry card (e.g. 'The finishing bench')",
 "establishingSub": "1-2 short sentences under it — second person, present tense: they just finished the training; now they're on the floor; spot what's wrong",
 "sceneCanon": "the MODEL GROUNDING — a complete, present-tense description of the work area AND every hazard, each with WHERE it sits, addressed to the AI as fixed canon it must never contradict or add to. Names all hazards and their zones. 90-160 words. Escape paragraph breaks as \\n\\n.",
 "sceneAlt": "the photo's accessibility ALT TEXT — a full plain description of the scene and its hazards for a screen-reader user, second person",
 "openingText": "the FIRST-PERSON reading the learner sees on the landing. Evocative, sets the floor, present tense — but does NOT enumerate every hazard's tell in a checklist (the learner must spot them). 80-140 words. Escape paragraph breaks as \\n\\n.",
 "reflectionPrompt": "a no-scoring first-impression gut check before the structured sweep — invites their read of the space, ends in a question mark",
 "reflectionFeedback": "brief TO the coach: calibration ONLY — acknowledge their confidence (wary vs. 'looks fine'), do NOT credit or list any hazards; the app opens the Observe beat next",
 "coachPersona": "one line — who the coach is",
 "coachGuidance": "optional extra voice guidance, or an empty string"
}

CRAFT EXEMPLARS (the shipped gold-standard build — match craft and density, NOT topic):
- sceneCanon: ${JSON.stringify(EX.canon)}
- sceneAlt: ${JSON.stringify(EX.alt)}
- openingText: ${JSON.stringify(EX.opening)}`,
              user: `${briefBlock(ik)}\n\n${sceneBlock(ik)}\n\nHAZARDS THE DESIGNER NAMED (for grounding — you'll expand them in the next step):\n${lines(ik.hazardsList).map((x) => '- ' + x).join('\n') || '(none listed — you may infer them from the scene + source)'}\n\nCoach vibe: ${ik.coachVibe || '(a knowledgeable, plain-spoken safety trainer — authority and genuine concern)'}\n\n${sourceBlock(ik, 5000)}\n\nWrite the foundation JSON now.` };
          },
          apply(json, draft, ik) {
            draft.title = str(ik.title).trim() || str(json.title);
            draft.course = str(ik.course).trim() || str(json.courseName);
            draft.framing = depunct(json.framing);
            draft.learnerRole = str(json.learnerRole);
            draft.elevatedStakes = !!ik.elevatedStakes;
            draft.establishing = { eyebrow: 'The scene', title: depunct(json.establishingTitle), sub: str(json.establishingSub) };
            draft.scene = { src: '', alt: str(json.sceneAlt), canonDescription: str(json.sceneCanon) };
            draft.intro = {
              type: 'reading',
              audio: { eyebrow: 'The scene · read', title: depunct(json.establishingTitle) || 'On the floor', text: str(json.openingText), continueLabel: 'Take a look around' },
            };
            draft.voice = { persona: depunct(json.coachPersona), guidance: str(json.coachGuidance) };
            draft.reflection = { prompt: str(json.reflectionPrompt), feedbackGuidance: str(json.reflectionFeedback) };
          },
          doneNote(json) { return `“${json.title || 'untitled'}” — scene canon & reading set`; } },

        /* 2) HAZARDS — the observable-hazard rubric + coverage. The teach-back
              pattern: expand the author's lines (or derive from source). */
        { id: 'hazards', label: 'The observable-hazard rubric',
          detail: 'Each hazard: label, where it is, why it’s a hazard, phrasings to credit, the right-now fix, the systemic fix.',
          build(ik, acc) {
            const authored = lines(ik.hazardsList);
            const f = acc.results.foundation || {};
            return { maxTokens: 2000,
              system: SYS + `

YOUR TASK — the OBSERVABLE-HAZARD RUBRIC plus a few SAFE DECOYS. The hazards are the ONLY things the coach credits; the decoys are safe objects that make the accessible list/keyboard/free-text paths a real "which are unsafe?" judgment (not a walk down the answers). Return this exact JSON shape:
{
 "hazards": [ {"id": "short lowercase slug, unique (e.g. 'jug','ppe','sds','label')", "short": "3-6 word label — names the pin and the coverage chip", "alt": "NEUTRAL one-line description of what's VISIBLY there — state the visual facts (a blank jug, bare hands) but NEVER the verdict that it's a hazard; this is the screen-reader name + the on-screen reference", "zone": "WHERE it sits in the scene — the coach nudges toward this without naming the hazard", "full": "what it is and why it's a hazard, 1-2 sentences — what the coach grounds to", "synonyms": "comma-separated plain-language phrasings that earn credit, in any words", "source": "a citation like 'RVCT-479 P017' if one grounds it, else empty string", "fix": "the RIGHT-NOW corrective action (the Diagnose & Remediate beat)", "prevent": "the systemic change that keeps it from returning (feeds the close)"} ],
 "decoys": [ {"alt": "NEUTRAL description of a SAFE / neutral object also in the scene (a properly-labeled container, a fire extinguisher in place, machined parts on the bench)", "note": "the friendly 'that one's actually fine' line shown if a learner marks it — say plainly why it's safe"} ]
}
${authored.length ? `The designer named ${authored.length} hazards — keep their ORDER and MEANING; expand each into a full rubric row grounded in the scene.` : 'The designer named NO hazards — derive them from the scene description and source material. 3-6 observable hazards a trained eye should catch.'}
Every hazard must be OBSERVABLE in the scene canon and have a distinct zone. Add 2-4 decoys that PLAUSIBLY sit in this scene and are genuinely safe (grounded in the canon — do not invent objects that aren't there). HARD LENGTH BUDGET — stay under 1700 tokens: strings tight; synonyms 4-8 phrases; decoys 2-4.

CRAFT EXEMPLARS (shipped build — match craft, NOT topic):\nHAZARDS (first 2 of 4):\n${EX.hazards}\nDECOYS (first 2):\n${EX.decoys}`,
              user: `THE SCENE CANON (ground every hazard's zone AND every decoy in this):\n${str(f.sceneCanon) || sceneBlock(ik)}\n\n${authored.length ? 'THE DESIGNER\'S HAZARDS (one per line, keep order):\n' + authored.map((t, i) => `${i + 1}. ${t}`).join('\n') + '\n\n' : ''}RIGHT-NOW FIXES the designer noted: ${ik.remediateFocus || '(propose per hazard — stop-work, PPE, quarantine, pull a current sheet, relabel)'}\nSYSTEMIC FIXES the designer noted: ${ik.preventFocus || '(propose per hazard — standards, review cadences, scheduled checks)'}\n\n${sourceBlock(ik, 4000)}\n\nWrite the hazards + decoys JSON now.` };
          },
          apply(json, draft) {
            const seen = {};
            const slug = (s, pfx) => { let id = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || (pfx || 'hazard'); while (seen[id]) id += 'x'; seen[id] = 1; return id; };
            draft.hazards = Array.isArray(json.hazards) ? json.hazards.map((h) => {
              h = h || {};
              return {
                id: slug(h.id || h.short, 'hazard'),
                short: str(h.short), alt: str(h.alt), zone: str(h.zone), full: str(h.full),
                synonyms: str(h.synonyms), source: str(h.source),
                fix: str(h.fix), prevent: str(h.prevent),
                spot: null,   // outlined by hand in the editor's photo canvas
              };
            }) : [];
            draft.decoys = Array.isArray(json.decoys) ? json.decoys.map((d, i) => {
              d = d || {};
              return { id: slug(d.alt || ('decoy' + (i + 1)), 'decoy'), alt: str(d.alt), note: str(d.note), spot: null };
            }) : [];
            const n = draft.hazards.length;
            draft.coverage = { total: n, required: Math.max(1, n - 1) };
          },
          doneNote(json) { return `${(json.hazards || []).length} hazards, ${((json.decoys || []).length)} decoys — outline them in the editor`; } },

        /* 3) BEATS — the aligned 2-beat shape. Structure is hard-coded (Observe →
              Diagnose & Remediate); the model writes only the copy. */
        { id: 'beats', label: 'The two coaching beats',
          detail: 'Observe (spot) → Diagnose & Remediate (fix it now): hand-offs, prompts, calibration, debriefs.',
          build(ik, acc) {
            const h = acc.results.hazards || {};
            const rubric = (h.hazards || []).map((x, i) => `  ${i + 1}. [${(x || {}).id}] ${(x || {}).short} — ${(x || {}).zone}`).join('\n');
            return { maxTokens: 1900,
              system: SYS + `

YOUR TASK — the TWO coaching beats, in the fixed shape Observe → Diagnose & Remediate. Each beat is Practice (the learner works it) then Learn (the coach debriefs). Return this exact JSON shape:
{
 "observe": {
   "signpost": "the locked hand-off line shown when the Observe beat opens (e.g. 'Let's take a closer look and walk the area properly. Take your time.')",
   "prompt": "the locked task prompt — invite them to name everything wrong they can spot",
   "exitCriteria": "when the beat is done — e.g. 'the learner has named the coverage target — or has had one look-again nudge'",
   "calibration": [ {"tier":"UNTHOUGHTFUL","guidance":"spots 0-1 or only 'it's messy'; credit any real catch, cue a LOCATION without naming the hazard"}, {"tier":"NEUTRAL","guidance":"catches the obvious ones, misses the subtle ones; credit each, nudge spatially toward the misses"}, {"tier":"STRONG","guidance":"names them all and why each is a hazard; validate, read them back in standard terms, move to fixing"} ],
   "debriefOpener": "the EXACT first Learn bubble (e.g. 'Good eyes. Let's line up everything that's actually here.')",
   "debriefPoints": "what the debrief lands: the full observable-hazard rubric in standard terms so every learner leaves seeing all of them; name any they missed without judgment"
 },
 "remediate": {
   "signpost": "the locked hand-off line into the fix beat (e.g. 'Now let's do something about it. Back to the scene.')",
   "prompt": "the locked task prompt — for each hazard, what would you do right now, before anyone keeps working?",
   "exitCriteria": "when the beat is done — immediate corrective action across the hazards, or one follow-up",
   "calibration": [ {"tier":"UNTHOUGHTFUL","guidance":"defers ('clean it up later'); press the immediacy — the unsafe work is happening now; redirect to stop-work + PPE"}, {"tier":"NEUTRAL","guidance":"fixes one or two, misses stop-work/PPE or making the chemical identifiable; affirm, extend to the live risk"}, {"tier":"STRONG","guidance":"stops unsafe work, PPE on, contains the unknown, pulls a current sheet, relabels — all before work resumes; name the protective-measures layers in action"} ],
   "debriefOpener": "the EXACT first Learn bubble (e.g. 'Let's go over what to do right now.')",
   "debriefPoints": "the immediate corrective actions mapped to the protective-measures layers (PPE + safe handling); note briefly that a durable record keeps the fix from slipping — but the systemic program is the close's job, not this beat's"
 }
}

CRAFT EXEMPLAR (the shipped Observe beat — match craft, NOT topic):\n${EX.observe}`,
              user: `THE HAZARD RUBRIC (${(h.hazards || []).length} hazards — the beats work exactly these):\n${rubric || '(none)'}\n\nRIGHT-NOW FIXES the designer noted: ${ik.remediateFocus || '(infer from the rubric)'}\n\nWrite the beats JSON now.` };
          },
          apply(json, draft) {
            const tiers = (list) => (Array.isArray(list) ? list : []).map((t) => ({ tier: str((t || {}).tier), guidance: str((t || {}).guidance) })).filter((t) => t.tier);
            const o = json.observe || {}, r = json.remediate || {};
            draft.phases = [
              { id: 'observe', kind: 'spot', label: 'Observe', level: 'Beat 1 · spot the hazards', maxTurns: 2,
                signpost: str(o.signpost), prompt: str(o.prompt), exitCriteria: str(o.exitCriteria),
                calibration: tiers(o.calibration),
                debrief: { talkItThrough: str(o.debriefOpener), points: str(o.debriefPoints) },
                transitions: [{ onTier: '', next: 'remediate', set: {} }] },
              { id: 'remediate', kind: 'act', label: 'Diagnose & Remediate', level: 'Beat 2 · fix it now', maxTurns: 2,
                signpost: str(r.signpost), prompt: str(r.prompt), exitCriteria: str(r.exitCriteria),
                calibration: tiers(r.calibration),
                debrief: { talkItThrough: str(r.debriefOpener), points: str(r.debriefPoints) },
                transitions: [] },
            ];
          },
          doneNote() { return 'Observe → Diagnose & Remediate beats set'; } },

        /* 4) CLOSE — the guaranteed SME-validated playbook + resources. */
        { id: 'close', label: 'The close — playbook & resources',
          detail: 'The expert close every learner sees on completion, and where to turn on the floor.',
          build(ik, acc) {
            const h = acc.results.hazards || {};
            const f = acc.results.foundation || {};
            return { maxTokens: 1500,
              system: SYS + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner after the sweep, regardless of what they spotted. This is where PREVENTION lives (it is not its own beat). Return this exact JSON shape:
{
 "playbook": [ {"title": "short point", "body": "1-2 sentences", "source": "AUDIT TRAIL — the source/standard line this traces to; empty string if general craft"} ],
 "resources": {"lead": "one coach sentence introducing where to turn on the floor", "items": [ {"title": "the reference/person/tool", "body": "what it offers"} ]}
}
4-6 playbook components: the observable red flags, the right-now fixes, the SYSTEMIC fixes (make it stick), the protective-measures layers, and what a complete program covers. 2-4 REAL resources for this world — never invent URLs or organizations.

CRAFT EXEMPLAR (shipped build — first 2 of 5; match craft, NOT topic):\n${EX.playbook}`,
              user: `THE EXERCISE SO FAR\n- Title: ${f.title || ''} · Course: ${f.courseName || str(ik.course) || ''}\n- Hazards:\n${(h.hazards || []).map((x, i) => `  ${i + 1}. ${(x || {}).short}`).join('\n') || '(none)'}\n- Systemic fixes noted: ${ik.preventFocus || '(propose them)'}\n\n${sourceBlock(ik, 3000)}\n\nWrite the close JSON now.` };
          },
          apply(json, draft) {
            draft.playbook = Array.isArray(json.playbook) ? json.playbook.map((p) => ({ title: str((p || {}).title), body: str((p || {}).body), source: str((p || {}).source) })) : [];
            const r = json.resources || {};
            draft.resources = { lead: str(r.lead), items: Array.isArray(r.items) ? r.items.map((i) => ({ title: str((i || {}).title), body: str((i || {}).body) })) : [] };
          },
          doneNote(json) { return `${(json.playbook || []).length} playbook components, ${((json.resources || {}).items || []).length} resources`; } },
      ];
    },

    landNote() { return 'Scene Sweep drafted — now upload the work-area photo and outline each hazard AND each decoy on it in the editor (the outlines are what learners tap, key, and list), then run the guardrails.'; },
  };
})();
