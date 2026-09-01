/* ============================================================================
   layered-sharps.js — Bloodborne Pathogens (RVCT-303B), Module 4 · BO-4
   "Contain the Sharp", built on js/layered-engine.js.

   The prototype module from the Knowledge Layer plan: eight objectives sitting
   in eight distinct sub-scales — two Know, three Feel, three Do — so every rule
   in the assessment strategy has something to act on.

       When I am about to use, handle, or dispose of a needle or sharp, I plan
       the disposal route before I start, activate the safety feature, and put
       it straight into a designated container — never into general waste.

   Instructional shape: OPTION B, the case set. Three short independent
   incidents, each isolating one failure mode, each ending in a judgment.
   Nothing depends on anything before it — which is what lets a case be
   dropped, hardened, or swapped for a sector-native one without touching the
   others, and is why the deck recommends it for regulated content.

   The thing this module demonstrates that the Bystander one does not:
   ASSESSMENT POLICY PER OBJECTIVE. Every objective carries a flag — gate,
   remediate, ask, never-skipped — and that flag, not the objective, decides
   where its question lives: the pre-module battery, in-flow, the simulation,
   or the follow-up after the module is over. Policy chips are shown on the
   beats themselves so a reviewer watches the rule fire.

   Loads AFTER js/layered-engine.js. See clara/sharps.html.
   ========================================================================== */
(function () {
  'use strict';

  var LE = window.Layered;
  var T = LE.T, esc = LE.esc, readCourse = LE.readCourse, saveResult = LE.saveResult,
      wireChat = LE.wireChat, typeFeedback = LE.typeFeedback,
      lens = LE.lens, visiblePath = LE.visiblePath;

  var COURSE = 'Bloodborne Pathogens';

  // ==========================================================================
  //  THE OBJECTIVES — the SME-signed substrate, with the metadata envelope
  //  that makes derivation safe. Nothing below is authored per permutation;
  //  every routing decision in this file reads these fields.
  //
  //  `policy` is the deck's Part Three: what the assessment strategy does with
  //  the objective, which is a different question from what the objective is.
  //    gate    — must be proven; asked before the module, drives test-out
  //    remediate — a low score adds a beat rather than removing one
  //    ask     — measured for the record, never routes anything
  //    never   — cannot be tested out of, in any profile
  //  `lock` is the compliance envelope: content-locked objectives are served
  //  harder rather than removed.
  // ==========================================================================
  var OBJECTIVES = [
    { id: 'K1', name: 'The safe handling procedure', domain: 'Know', sub: 'Remember', policy: 'gate', where: 'Pre-module battery',
      lock: 'test-out eligible', theory: 'Procedural Knowledge',
      text: 'Recall the safe sharps handling procedure: plan disposal in advance, use needle alternatives when possible, activate safety features, and immediately dispose of used sharps in a designated container.' },
    { id: 'K2', name: 'Spotting the conditions', domain: 'Know', sub: 'Observe', policy: 'remediate', where: 'In-flow',
      lock: 'content-locked · test-up', theory: 'Hazard Recognition',
      text: 'Recognize the conditions that produce most sharps injuries: an overfilled container, a sharp left on a work surface, a sharp concealed in linen or general waste.' },
    { id: 'F1', name: 'It protects your coworkers', domain: 'Feel', sub: 'Believe', policy: 'remediate', where: 'Pre + post',
      lock: 'reinforce only', theory: 'Professional Norm',
      text: 'Agree: safe sharps disposal is a professional responsibility that protects my coworkers, not just a procedural formality.' },
    { id: 'F2', name: 'Controls prevent the injury', domain: 'Feel', sub: 'Value', policy: 'ask', where: 'Course-level',
      lock: 'reinforce only', theory: 'Outcome Expectancy',
      text: 'Agree: using engineering controls for sharps disposal will prevent the serious injuries and infections that shortcuts cause.' },
    { id: 'F3', name: 'What your shift actually does', domain: 'Feel', sub: 'Perceive', policy: 'remediate', where: 'Pre + post',
      lock: 'reinforce only', theory: 'Social Norm Perception',
      text: 'Agree: most people on my shift use the container immediately rather than setting a sharp down.' },
    { id: 'D1', name: 'Acting while the moment is open', domain: 'Do', sub: 'Activate', policy: 'never', where: 'Simulation',
      lock: 'never skipped', theory: 'Behavioral Cueing',
      text: 'Recognize and act on the cue to dispose while the moment is still open.' },
    { id: 'D2', name: 'Doing it in context', domain: 'Do', sub: 'Apply', policy: 'gate', where: 'Simulation',
      lock: 'never skipped', theory: 'Behavioral Capability (Bandura)',
      text: 'Demonstrate safe sharps handling in context: plan disposal before use, activate safety features, and place used sharps in a designated container without recapping, bending, or placing in general waste.' },
    { id: 'D3', name: 'Keeping it up afterwards', domain: 'Do', sub: 'Sustain', policy: 'never', where: 'Follow-up',
      lock: 'never skipped', theory: 'Maintenance Self-Regulation',
      text: 'Keep the practice after the module ends — and raise a container or a hazard when you meet one.' }
  ];
  function obj(id) {
    for (var i = 0; i < OBJECTIVES.length; i++) if (OBJECTIVES[i].id === id) return OBJECTIVES[i];
    return null;
  }
  var POLICY_CHIP = {
    gate:      { cls: 'pol-gate',  icon: 'fa-key',              label: 'Gate' },
    remediate: { cls: 'pol-remed', icon: 'fa-wand-magic-sparkles', label: 'Remediate' },
    ask:       { cls: 'pol-ask',   icon: 'fa-clipboard-list',   label: 'Ask' },
    never:     { cls: 'pol-never', icon: 'fa-shield-halved',    label: 'Never skipped' }
  };
  // NOT shown to a learner. "Gate", "remediate", "K1 · Know / Remember" and
  // "pre-module battery" are how WE talk about routing; none of it answers a
  // question a learner has. The policy is demonstrated where it belongs — in
  // the step captions behind the footer "?", in the plain-English moves on the
  // adjustment screen (skipped / harder / kept), and in the Learning Layer
  // view. Kept here because those captions are generated from the same data.
  function policyRow(id) {
    var o = obj(id), c = POLICY_CHIP[o.policy];
    return '<div class="pol-row">' +
      '<span class="pol ' + c.cls + '"><i class="fa-solid ' + c.icon + '"></i> ' + c.label + '</span>' +
      (o.lock === 'content-locked · test-up'
        ? '<span class="pol pol-lock"><i class="fa-solid fa-lock"></i> Content-locked</span>' : '') +
      '<span class="pol-obj"><b>' + o.id + '</b> · ' + esc(o.domain + ' / ' + o.sub) + ' · ' + esc(o.where) + '</span>' +
    '</div>';
  }

  // ==========================================================================
  //  SECTORS — capability 2. Four, from the plan, and the reason there are
  //  four rather than one with swapped nouns: three of them FIND a sharp
  //  somebody else left, and only Public Sector routinely USES one. That is
  //  two premise families, not four coats of paint, and `premise` carries it.
  // ==========================================================================
  var LENSES = {
    education: {
      label: 'Education', premise: 'find',
      roles: 'teacher · administrator', org: 'Riverbend Unified School District',
      role: 'Classroom teacher', where: 'A middle-school classroom', when: 'End of the day',
      case1: 'You finish a diabetic student’s finger-stick in the health office and set the lancet on the counter — the phone is ringing and the container is across the room.',
      case2: 'The sharps container in the health office is packed to the neck. Someone has been pressing things down to make room.',
      case3: 'Clearing a classroom bin at the end of the day, you spot a used lancet sitting on top of the paper.',
      case4: 'A custodian emptying that same classroom bin at nine that night is stuck through the bag. He finds out whose lancet it was three weeks later, from a lab result.',
      simPremise: 'You have just finished a finger-stick in the health office. Before you can dispose of the lancet, a student comes to the door in tears.'
    },
    aec: {
      label: 'Commercial AEC', premise: 'find',
      roles: 'architect · engineer · construction', org: 'Halstead Build Group',
      role: 'Site supervisor', where: 'An occupied renovation', when: 'Punch-list walkthrough',
      case1: 'Mid-walkthrough you pull a syringe out of a wall cavity with your gloved hand and set it on a ledge — you will bag it on the way back.',
      case2: 'The first-aid kit’s small sharps container on this floor is full, and the spare is in the trailer two levels down.',
      case3: 'A needle is sitting in the demo debris pile the framing crew will clear at seven tomorrow morning.',
      case4: 'A labourer clearing that pile is stuck through his glove. The needle came out of a wall in an occupied building — nobody can say whose it was.',
      simPremise: 'You have just bagged a syringe found in a wall cavity. Before you reach the container, the site engineer calls you over about a load-bearing question.'
    },
    manufacturing: {
      label: 'Manufacturing', premise: 'find',
      roles: 'chemical · industrial', org: 'Acme Plant Operations',
      role: 'Line lead', where: 'The plant floor', when: 'Second shift',
      case1: 'You change a box-cutter blade at the line and set the old one on the bench — you will walk it to the container after this run.',
      case2: 'The container in the plant clinic is above its fill line, and the spare box is in the supply room.',
      case3: 'You find contaminated glass from the clinic bagged into general waste at the dock.',
      case4: 'A sanitation worker on second shift compresses that bag by hand and is cut through it. It was a blade change nobody logged.',
      simPremise: 'You have just changed a blade at the line. Before you reach the container, the shift lead calls you over about a jam on the next machine.'
    },
    public: {
      label: 'Public Sector', premise: 'use',
      roles: 'EMS · fire · law enforcement', org: 'Kell County EMS',
      role: 'Paramedic', where: 'The back of a moving ambulance', when: 'A transfer',
      case1: 'You place a line in the back of a moving ambulance and set the used catheter on the bench seat — both hands are on the patient.',
      case2: 'The jump-bag container is full, and the wall unit is behind the stretcher you cannot reach from here.',
      case3: 'At the ED doors you find a used needle loose on the gurney rail, left from the run before yours.',
      case4: 'Your partner, breaking down the gurney at the ED, is stuck by that needle. It was from the previous crew’s run, and nobody had cleared the rail.',
      simPremise: 'You have just placed a line in a moving ambulance. Before you can dispose of the catheter, the patient’s rhythm changes on the monitor.'
    }
  };

  // ==========================================================================
  //  Test-out state. K1 is the only objective the pre-module battery can buy
  //  anything with: it is mandated content, but D2 re-verifies it
  //  performatively in the simulation, so the beat may go and the floor holds.
  //  K2 is content-locked — a low score serves it HARDER, never removes it.
  // ==========================================================================
  function batteryResult() {
    try { var o = sessionStorage.getItem('sh-battery');
          if (o === 'proven' || o === 'unproven') return o; } catch (e) {}
    var b = readCourse().battery;
    if (b && b.k1) return b.k1 === 'proven' ? 'proven' : 'unproven';
    return 'unproven';
  }
  function k2TestUp() {
    var b = readCourse().battery;
    return !!(b && b.k2up);
  }
  function feelLow() {
    var b = readCourse().battery;
    return !!(b && (b.f1 <= 2 || b.f3 <= 2));
  }

  // ==========================================================================
  //  TITLE PAGE — the same LMS anatomy as the Bystander module, rendered from
  //  the live path so it foreshadows compression honestly.
  // ==========================================================================
  var DONE_KEYS = { battery: 'battery', adjust: 'battery', case1: 'case1', inflow: 'inflow',
                    case2: 'case2', case3: 'case3', case4: 'case4', debrief: 'debrief',
                    perform: 'perform', followup: 'followup', record: 'record' };
  function INTRO_CONTENT() { return '' +
    '<main class="ll-object">' +
      '<div class="cp-page">' +
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">Bloodborne Pathogens · Module 4 of 6</p>' +
            '<h1>Contain the Sharp</h1>' +
            '<p class="cp-desc">When I am about to use, handle, or dispose of a needle or sharp, I plan the ' +
              'disposal route before I start, activate the safety feature, and put it straight into a ' +
              'designated container — never into general waste.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar-day"></i> Required · due Oct 3</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> AI-guided · CLARA</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-briefcase"></i> ' + esc(lens().label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="cp-art"><i class="fa-solid fa-syringe" aria-hidden="true"></i></div>' +
        '</header>' +
        '<div class="cp-grid">' +
          '<section class="cp-sections">' +
            '<div class="cp-sec-head"><h2>Course sections</h2></div>' +
            '<div id="cpRows"></div>' +
            '<p class="cp-adapt-note" id="cpAdaptNote"><i class="fa-solid fa-wand-magic-sparkles"></i> ' +
              'Sections marked “adaptive” can be shortened based on what you show in the first four questions.</p>' +
          '</section>' +
          '<aside class="cp-rail">' +
            '<div class="cp-card"><h3>What you have to show</h3>' +
              '<ul class="cp-req">' +
                '<li><i class="fa-solid fa-key"></i><span>Two <b>gate</b> objectives — the procedure, and doing it in context.</span></li>' +
                '<li><i class="fa-solid fa-lock"></i><span><b>Recognizing the conditions</b> is content-locked. It is never removed; a weak answer makes it harder.</span></li>' +
                '<li><i class="fa-solid fa-shield-halved"></i><span>The simulation runs for <b>everyone</b>, whatever the first four questions say.</span></li>' +
              '</ul></div>' +
            '<div class="cp-card"><h3>Details</h3>' +
              '<div class="cp-kv">' +
                '<div class="kv"><b>Standard</b>1910.1030(g)(2)(vii)(E)</div>' +
                '<div class="kv"><b>Setting</b>' + esc(lens().where) + ' · ' + esc(lens().roles) + '</div>' +
                '<div class="kv"><b>Objectives</b>8 · Know 2 · Feel 3 · Do 3</div>' +
              '</div></div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</main>'; }
  function introInit(ctx) {
    var course = readCourse();
    var rows = visiblePath().filter(function (st) { return st.id !== 'intro'; });
    document.getElementById('cpRows').innerHTML = rows.map(function (st) {
      var done = !!course[DONE_KEYS[st.id]];
      var meta = [];
      if (st.stage) meta.push('<span class="stage">' + esc(st.stage) + '</span>');
      if (st.mins) meta.push('<span>About ' + st.mins + ' min' + (st.mins > 1 ? 's' : '') + '</span>');
      if (st.adaptive) meta.push('<span class="adapt"><i class="fa-solid fa-wand-magic-sparkles"></i>adaptive</span>');
      return '<div class="cp-row' + (done ? ' done' : '') + '">' +
        '<span class="cp-row-ico"><i class="fa-solid ' + (st.icon || 'fa-circle') + '"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(st.lesson) + '</b>' +
          '<span class="cp-row-meta">' + meta.join('') + '</span></span>' +
        '<span class="cp-row-state ' + (done ? 'done' : 'todo') + '">' + (done ? 'Done' : 'Not started') + '</span>' +
      '</div>';
    }).join('');
    ctx.floatClose();
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  PRE-MODULE BATTERY — four items, and the composition is the point:
  //  gate-flagged Know and remediate-flagged Feel. NEVER a Do objective,
  //  because a question cannot credibly measure behavior.
  // ==========================================================================
  var BATTERY_CONTENT =
    '<main class="ll-object">' +
      '<div class="bl-ask" id="blAsk">' +
        '<p class="ll-eyebrow" id="blStep">Answer: 4 questions</p>' +
        '<h2 class="bl-q" id="blQ"></h2>' +
        '<p class="bl-hint" id="blHint" hidden></p>' +
        '<div class="bl-options" id="blOptions" role="radiogroup" aria-labelledby="blQ"></div>' +
        '<p class="bl-next" id="blNext" aria-hidden="true">Next question' +
          '<span class="bl-next-track"><span class="bl-next-fill" id="blNextFill"></span></span></p>' +
      '</div>' +
    '</main>';
  var BATTERY = [
    // K1 is sequence recall, so the item is an actual ordering task rather
    // than a choice between three written sequences. Reading a sequence and
    // producing one are different things, and only the second is the
    // objective. Tap-to-place, not drag: it works on touch and by keyboard,
    // and the numbered slots make the affordance unambiguous.
    { obj: 'K1', type: 'order',
      stem: 'You have just used a sharp. Put the next three actions in order.',
      hint: 'Tap them in the order you would do them. Tap a slot to take one back.',
      correct: ['feature', 'move', 'dispose'],
      actions: [
        { id: 'move',    icon: 'fa-person-walking', t: 'Walk to the container' },
        { id: 'dispose', icon: 'fa-inbox',          t: 'Drop it in' },
        { id: 'feature', icon: 'fa-shield-halved',  t: 'Activate the safety feature' }
      ],
      okReply: 'That is the sequence, and the order is the whole point — the feature goes on before the sharp travels anywhere.',
      badReply: 'Not that order. The safety feature goes on FIRST, before the sharp moves: an unshielded point in transit is where most injuries happen.' },
    // All three options are things you can do with a used sharp, and exactly
    // one is never acceptable. The distractors are correct practice, so the
    // item tests the rule rather than reading comprehension.
    { obj: 'K1',
      stem: 'Which of these is never acceptable with a used sharp?',
      options: [
        { t: 'Recapping it by hand', icon: 'fa-ban', score: 2,
          reply: 'Right — recapping is the one absolute. Every other rule here has an “unless”; that one does not.' },
        { t: 'Carrying it to a container in the next room', icon: 'fa-person-walking', score: 0,
          reply: 'That one is allowed, and sometimes it is the only option — provided the safety feature is on and you planned the route. Recapping is the one that never is.' },
        { t: 'Sealing a container once it reaches the fill line', icon: 'fa-box-archive', score: 0,
          reply: 'That is correct practice, not a violation — a container at its fill line should be sealed. The one that is never acceptable is recapping by hand.' }
      ] },
    { obj: 'F1',
      stem: 'Safe sharps disposal protects your coworkers, not just you.',
      hint: 'Say what you actually think. This one adds instruction rather than removing it.',
      options: [
        { t: 'Strongly agree', icon: 'fa-heart', score: 3, reply: 'Good — that belief is the one that holds up when you are in a hurry.' },
        { t: 'Somewhat', icon: 'fa-scale-balanced', score: 2, reply: 'Fair. I will show you who actually ends up carrying the risk.' },
        { t: 'It is mostly a formality', icon: 'fa-file-lines', score: 1, reply: 'Worth testing that. There is a case in this module that answers it better than I can.' }
      ] },
    { obj: 'F3',
      stem: 'Most people you work alongside use the container straight away rather than setting a sharp down.',
      hint: 'Your read of the room, not the rule.',
      options: [
        { t: 'Most do', icon: 'fa-users', score: 3, reply: 'Noted — we will see how that compares to what your sector actually reports.' },
        { t: 'About half', icon: 'fa-users-slash', score: 2, reply: 'Noted. The real number surprises most people in both directions.' },
        { t: 'Hardly anyone', icon: 'fa-user-slash', score: 1, reply: 'Noted — and if that is true where you work, it matters more than the procedure does.' }
      ] }
  ];
  function batteryInit(ctx) {
    var res = { k1: 'unproven', k1score: 0, k2up: false, f1: 3, f3: 3 };
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var hintEl = document.getElementById('blHint');
    var optsEl = document.getElementById('blOptions');
    var nextEl = document.getElementById('blNext');
    var fillEl = document.getElementById('blNextFill');
    var k1 = [];

    ctx.setCoachSay('Four questions before we start. Two on the procedure, two on how you see it — nothing on doing it, because a question cannot measure that.');
    ctx.floatClose();
    render(0);

    function render(i) {
      var q = BATTERY[i];
      stepEl.textContent = 'Answer: question ' + (i + 1) + ' of 4';
      qEl.textContent = q.stem;
      hintEl.textContent = q.hint || '';
      hintEl.hidden = !q.hint;
      if (q.type === 'order') { renderOrder(i, q); return; }
      optsEl.className = 'bl-options';
      optsEl.innerHTML = '';
      var picked = false;
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'bl-option'; b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.innerHTML = '<i class="fa-solid ' + opt.icon + '" aria-hidden="true"></i>' +
                      '<span class="bl-option-label">' + esc(opt.t) + '</span>';
        b.addEventListener('click', function () {
          if (picked) return; picked = true;
          b.setAttribute('aria-checked', 'true');
          optsEl.classList.add('answered');
          optsEl.querySelectorAll('.bl-option').forEach(function (o) { if (o !== b) o.disabled = true; });
          if (q.obj === 'K1') k1.push(opt.score);
          if (q.obj === 'F1') res.f1 = opt.score;
          if (q.obj === 'F3') res.f3 = opt.score;
          ctx.floatOpen();
          ctx.setCoachSay(esc(opt.reply));
          ctx.positionOrb(true);
          if (i + 1 < BATTERY.length) {
            var dwell = T(2600);
            countdown(dwell);
            setTimeout(function () { swapTo(i + 1); }, dwell);
          } else { done(); }
        });
        optsEl.appendChild(b);
      });
      LE.pickGroup(optsEl);
    }
    // Tap-to-place ordering. `placed` is the answer; the pool is whatever is
    // not in it yet. Grading fires on the third placement — there is no submit
    // button because there is nothing left to decide once all three are down.
    function renderOrder(i, q) {
      optsEl.className = 'ord-wrap';
      var placed = [], settled = false;
      draw();

      function label(id) {
        for (var k = 0; k < q.actions.length; k++) if (q.actions[k].id === id) return q.actions[k];
        return null;
      }
      function draw() {
        var slots = '<ol class="ord-slots" id="ordSlots" aria-live="polite">';
        for (var n = 0; n < 3; n++) {
          var id = placed[n], a = id ? label(id) : null;
          var mark = '';
          if (settled) mark = (q.correct[n] === id) ? ' is-right' : ' is-wrong';
          slots += '<li class="ord-slot' + (a ? ' filled' : '') + mark + '">' +
            '<span class="ord-n">' + (n + 1) + '</span>' +
            (a ? '<button class="ord-chip" type="button" data-take="' + n + '"' + (settled ? ' disabled' : '') + '>' +
                   '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i> ' + esc(a.t) +
                   (settled ? '' : '<i class="fa-solid fa-xmark ord-x" aria-hidden="true"></i>') + '</button>'
               : '<span class="ord-empty">Tap an action below</span>') +
          '</li>';
        }
        slots += '</ol>';
        var pool = '<div class="ord-pool">' + q.actions.filter(function (a) {
          return placed.indexOf(a.id) === -1;
        }).map(function (a) {
          return '<button class="ord-card" type="button" data-put="' + a.id + '">' +
            '<i class="fa-solid ' + a.icon + '" aria-hidden="true"></i>' +
            '<span>' + esc(a.t) + '</span></button>';
        }).join('') + '</div>';
        optsEl.innerHTML = slots + pool + '<p class="ord-fb" id="ordFb"></p>';
        optsEl.querySelectorAll('[data-put]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (settled || placed.length >= 3) return;
            placed.push(b.dataset.put);
            draw();
            if (placed.length === 3) grade();
          });
        });
        optsEl.querySelectorAll('[data-take]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (settled) return;
            placed.splice(+b.dataset.take, 1);
            draw();
          });
        });
      }
      function grade() {
        settled = true;
        var right = placed.every(function (id, n) { return q.correct[n] === id; });
        draw();
        var fb = document.getElementById('ordFb');
        fb.className = 'ord-fb ' + (right ? 'ok' : 'bad');
        fb.textContent = right ? q.okReply : q.badReply;
        k1.push(right ? 2 : 0);
        ctx.floatOpen();
        ctx.setCoachSay(esc(right ? q.okReply : q.badReply));
        ctx.positionOrb(true);
        var dwell = T(3000);
        countdown(dwell);
        setTimeout(function () { swapTo(i + 1); }, dwell);
      }
    }

    function swapTo(i) {
      askEl.classList.add('swapping');
      setTimeout(function () {
        render(i);
        askEl.classList.remove('swapping');
        clearCountdown();
        ctx.floatClose();
        ctx.positionOrb(true);
      }, T(320));
    }
    function countdown(ms) {
      if (!ms) return;
      nextEl.classList.add('in');
      fillEl.style.transition = 'none'; fillEl.style.width = '0%';
      void fillEl.offsetWidth;
      fillEl.style.transition = 'width ' + ms + 'ms linear';
      fillEl.style.width = '100%';
    }
    function clearCountdown() {
      nextEl.style.transition = 'none';
      nextEl.classList.remove('in');
      fillEl.style.transition = 'none'; fillEl.style.width = '0%';
      void nextEl.offsetWidth;
      nextEl.style.transition = '';
    }
    function done() {
      // K1 is proven only on a clean sweep — it is mandated content, and the
      // simulation still re-verifies it performatively either way.
      res.k1score = k1.reduce(function (a, b) { return a + b; }, 0);
      res.k1 = (res.k1score >= 4) ? 'proven' : 'unproven';
      // K2 is content-locked: a strong Know result serves it HARDER rather
      // than removing it. That is test-UP, and it is the whole difference.
      res.k2up = res.k1 === 'proven';
      stepEl.textContent = 'Answer: 4 of 4 done';
      saveResult('battery', res);
      ctx.enableNext();
    }
  }

  // ==========================================================================
  //  WHAT CHANGES — the same adjustment screen as the Bystander module, but
  //  reporting a richer set of moves: a beat removed, a beat made HARDER, and
  //  a beat ADDED because a Feel score was low. Compression is only one of
  //  the three things a policy can do.
  // ==========================================================================
  var ADJUST_CONTENT =
    '<main class="ll-object ll-object--crowned" id="adjustObject">' +
      '<div class="adj">' +
        '<p class="ll-eyebrow" id="adjEyebrow">Your path</p>' +
        '<h2 class="adj-head" id="adjHead">Reading your answers…</h2>' +
        '<ol class="adj-stack" id="adjStack" aria-live="polite"></ol>' +
        '<p class="adj-saved" id="adjSaved">&nbsp;</p>' +
      '</div>' +
    '</main>';
  var ADJUST_CHIPS = {
    dropped: '<span class="adj-chip adj-chip--drop"><i class="fa-solid fa-forward"></i> Skipped</span>',
    harder:  '<span class="adj-chip adj-chip--harder"><i class="fa-solid fa-arrow-trend-up"></i> Harder</span>',
    added:   '<span class="adj-chip adj-chip--harder"><i class="fa-solid fa-plus"></i> Added</span>',
    kept:    '<span class="adj-chip adj-chip--keep">Kept</span>'
  };
  function adjustInit(ctx) {
    var stack = document.getElementById('adjStack');
    var proven = batteryResult() === 'proven';
    var rows = [];

    rows.push({ icon: 'fa-list-ol', label: 'The procedure',
      state: proven ? 'dropped' : 'kept',
      note: proven ? 'you sequenced it correctly' : 'not proven yet — 2 min' });
    rows.push({ icon: 'fa-eye', label: 'Spotting the conditions',
      state: k2TestUp() ? 'harder' : 'kept',
      note: k2TestUp() ? 'content-locked — served at the harder tier' : 'content-locked — never removed' });
    if (feelLow()) {
      rows.push({ icon: 'fa-heart-crack', label: 'The one that landed',
        state: 'added', note: 'a low Feel score adds a beat, never removes one' });
    }
    rows.push({ icon: 'fa-shield-halved', label: 'The simulation',
      state: 'kept', note: 'runs for everyone, in every profile' });

    ctx.setCoachSay('Here is what your four answers moved.');
    ctx.floatClose();

    stack.innerHTML = rows.map(function (r) {
      return '<li class="adj-row" data-state="pending">' +
               '<span class="adj-ico"><i class="fa-solid ' + r.icon + '" aria-hidden="true"></i></span>' +
               '<span class="adj-main"><span class="adj-label">' + esc(r.label) + '</span>' +
               '<span class="adj-note">checking…</span></span>' +
               '<span class="adj-state"><span class="adj-spin" aria-hidden="true"></span></span>' +
             '</li>';
    }).join('');
    var els = [].slice.call(stack.children);
    rows.forEach(function (r, i) {
      setTimeout(function () {
        var li = els[i];
        li.dataset.state = r.state === 'added' ? 'harder' : r.state;
        li.querySelector('.adj-note').textContent = r.note;
        li.querySelector('.adj-state').innerHTML = ADJUST_CHIPS[r.state];
      }, T(900 + i * 480));
    });
    setTimeout(function () {
      document.getElementById('adjEyebrow').textContent = 'Your path just changed';
      document.getElementById('adjHead').textContent = proven ? 'You can skip the procedure.' : 'You will do the full set.';
      var savedEl = document.getElementById('adjSaved');
      savedEl.textContent = proven
        ? 'One beat off — and one served harder, because locked content is never removed.'
        : 'Nothing removed. The locked beat and the simulation were never on the table anyway.';
      savedEl.classList.add('in');
      ctx.setCoachSay(proven
        ? 'Note what did NOT move: recognizing the conditions is content-locked, so proving the procedure made it harder rather than making it disappear.'
        : 'Nothing came off, and nothing was going to — the two Do objectives and the locked one can’t be answered away.');
      ctx.positionOrb(true);
      LE.refreshNav();
      ctx.enableNext();
    }, T(900 + rows.length * 480 + 300));
  }

  // ==========================================================================
  //  THE CASES — Option B. Each is a scene, a judgment, and a verdict; none
  //  refers to any other. `harder` swaps in the ambiguous variant when the
  //  battery earned test-up on the locked objective.
  // ==========================================================================
  function caseContent(cfg) {
    return function () {
      var L = lens();
      return '<main class="ll-object">' +
        '<div class="cs-wrap">' +
          '<p class="ll-eyebrow">' + esc(cfg.eyebrow) + '</p>' +
          '<div class="cs-scene">' +
            '<div class="cs-tag"><i class="fa-solid ' + cfg.icon + '"></i> ' + esc(L.where) + ' · ' + esc(L.when) + '</div>' +
            '<p>' + esc(L[cfg.scene]) + '</p>' +
          '</div>' +
          '<p class="cs-q">' + esc(cfg.question) + '</p>' +
          '<div class="cs-opts" id="csOpts"></div>' +
          '<p class="cs-fb" id="csFb"></p>' +
        '</div>' +
      '</main>';
    };
  }
  function caseInit(cfg) {
    return function (ctx) {
      var opts = cfg.harder && k2TestUp() ? cfg.harder : cfg.options;
      var wrap = document.getElementById('csOpts');
      var fb = document.getElementById('csFb');
      ctx.floatOpen();
      ctx.setCoachSay(cfg.harder && k2TestUp()
        ? 'You earned the harder version of this one — the answer is genuinely arguable here.'
        : cfg.coach);
      var settled = false;
      opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'cs-opt'; b.type = 'button'; b.textContent = o.t;
        b.addEventListener('click', function () {
          if (settled) return; settled = true;
          wrap.classList.add('answered');
          wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
          b.classList.add(o.grade === 'ok' ? 'pick-ok' : o.grade === 'near' ? 'pick-near' : 'pick-bad');
          fb.className = 'cs-fb ' + o.grade;
          fb.textContent = o.reply;
          ctx.setCoachSay(esc(o.coach || o.reply));
          saveResult(cfg.key, { grade: o.grade });
          ctx.enableNext();
          ctx.positionOrb(true);
        });
        wrap.appendChild(b);
      });
    };
  }

  var CASE1 = {
    key: 'case1', obj: 'K1', eyebrow: 'Decide: case 1 of 3', icon: 'fa-clock',
    scene: 'case1', question: 'What is wrong with this, specifically?',
    coach: 'Read it and tell me what the actual failure is — not what you would have done instead.',
    options: [
      { t: 'The sharp was set down instead of disposed at the point of use', grade: 'ok',
        reply: 'That is it. Everything that goes wrong later starts with the sharp existing somewhere it was not planned to be.' },
      { t: 'The container was too far away', grade: 'near',
        reply: 'That is the excuse, not the failure — the procedure says plan the route before you start, which makes distance a thing you solved earlier.' },
      { t: 'Nothing, as long as it gets disposed of eventually', grade: 'bad',
        reply: '“Eventually” is where the injury lives. Between setting it down and coming back, the sharp belongs to whoever finds it.' }
    ]
  };
  var CASE2 = {
    key: 'case2', obj: 'K2', eyebrow: 'Decide: case 2 of 3', icon: 'fa-box-open',
    scene: 'case2', question: 'What do you do?',
    coach: 'This one is about the container, not the sharp.',
    options: [
      { t: 'Stop using it, seal it, and get the replacement before anything else', grade: 'ok',
        reply: 'Right. An overfilled container is not a container — it is a hazard with a label on it.' },
      { t: 'Use it carefully until someone swaps it', grade: 'bad',
        reply: 'Careful does not help here. Above the fill line, the next thing in comes back out.' },
      { t: 'Press the contents down to make room', grade: 'bad',
        reply: 'That is the single most direct route to a stick in this whole module. Never a hand inside a container.' }
    ],
    // Content-locked → test-up. The harder variant makes the call arguable.
    harder: [
      { t: 'Seal it and go for the replacement, leaving the area uncovered for four minutes', grade: 'ok',
        reply: 'Correct, and the tension is real — four minutes uncovered beats one sharp going somewhere undesignated.' },
      { t: 'Seal it and wait for someone to bring the spare so the area stays covered', grade: 'near',
        reply: 'Defensible, and in some settings it is the standing rule. But nothing gets used in the meantime — the moment you accept “just this one”, you are back at case 1.' },
      { t: 'Use the unit in the next room until the spare arrives', grade: 'near',
        reply: 'Workable if the route is planned and everyone knows. It fails the moment somebody who was not told needs it.' }
    ]
  };
  var CASE3 = {
    key: 'case3', obj: 'K2', eyebrow: 'Decide: case 3 of 3', icon: 'fa-magnifying-glass',
    scene: 'case3', question: 'This one was not yours. What now?',
    coach: 'The interesting part of this case is that you did not cause it.',
    options: [
      { t: 'Secure it yourself, then report the condition that let it happen', grade: 'ok',
        reply: 'Both halves matter. Securing it protects the next person; reporting it is the only thing that stops the third one.' },
      { t: 'Secure it and move on — no harm done', grade: 'near',
        reply: 'You protected one person. The condition that put it there is still running, and it will produce another.' },
      { t: 'Leave it and tell whoever is responsible', grade: 'bad',
        reply: 'Between now and them, it is in reach of whoever comes next. Secure first, report second.' }
    ]
  };

  // ==========================================================================
  //  IN-FLOW CHECK — the deck's Part Three, middle band: everyone is checked
  //  on what gates. Two attempts, a different explanation on a miss.
  // ==========================================================================
  var INFLOW_CONTENT =
    '<main class="ll-object">' +
      '<div class="cs-wrap">' +
        '<p class="ll-eyebrow">Check: 1 question</p>' +
        '<h2 class="bl-q" style="max-width:30ch">Before you pick anything up — what have you already decided?</h2>' +
        '<div class="cs-opts" id="ifOpts"></div>' +
        '<p class="cs-fb" id="ifFb"></p>' +
      '</div>' +
    '</main>';
  function inflowInit(ctx) {
    var wrap = document.getElementById('ifOpts');
    var fb = document.getElementById('ifFb');
    ctx.floatOpen();
    ctx.setCoachSay('Everyone gets this one — it is the objective that gates the module. Two goes at it.');
    var tries = 0, settled = false;
    [
      { t: 'Where it is going, before I start', ok: true,
        reply: 'That is the whole procedure in one line. The disposal route is a decision you make before the sharp is in your hand.' },
      { t: 'How to carry it safely once I am done', ok: false,
        reply: 'Carrying is already the risky part — the procedure exists so there is as little carrying as possible.' },
      { t: 'Who to tell if something goes wrong', ok: false,
        reply: 'That matters afterwards. The thing decided in advance is the route.' }
    ].forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'cs-opt'; b.type = 'button'; b.textContent = o.t;
      b.addEventListener('click', function () {
        if (settled) return;
        if (o.ok) {
          settled = true;
          wrap.classList.add('answered');
          wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
          b.classList.add('pick-ok');
          fb.className = 'cs-fb ok'; fb.textContent = o.reply;
          saveResult('inflow', { passed: true, attempts: tries + 1 });
          ctx.setCoachSay(esc(o.reply));
          ctx.enableNext();
        } else {
          tries++;
          b.classList.add('pick-bad'); b.disabled = true;
          fb.className = 'cs-fb bad';
          fb.textContent = tries === 1 ? o.reply
            : 'Let me put it another way: the reason it is decided in advance is that afterwards, both your hands are full.';
          if (tries >= 2) {
            saveResult('inflow', { passed: false, attempts: tries });
            ctx.enableNext();
          }
        }
        ctx.positionOrb(true);
      });
      wrap.appendChild(b);
    });
  }

  // ==========================================================================
  //  THE ONE THAT LANDED — F1. Added by the adjustment when a Feel score was
  //  low, and otherwise run anyway: Feel never routes past content. No
  //  judgment here; the case IS the argument.
  // ==========================================================================
  function CASE4_CONTENT() {
    var L = lens();
    return '<main class="ll-object">' +
      '<div class="cs-wrap">' +
        '<p class="ll-eyebrow">Read: 1 minute</p>' +
        '<div class="cs-scene">' +
          '<div class="cs-tag"><i class="fa-solid fa-triangle-exclamation"></i> The one that landed</div>' +
          '<p>' + esc(L.case4) + '</p>' +
        '</div>' +
        '<p class="fu-note" style="margin-top:18px">The person who was hurt did not use the sharp, did not leave it, and ' +
          'had no way to know it was there. That is the whole reason this is a professional responsibility and not a ' +
          'personal-safety rule — the risk you create is almost never carried by you.</p>' +
      '</div>' +
    '</main>';
  }
  function case4Init(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('No question on this one. Read it, and notice who got hurt.');
    setTimeout(function () {
      saveResult('case4', { read: true });
      ctx.enableNext();
    }, T(1200));
  }

  // ==========================================================================
  //  COHORT DEBRIEF — F3. Their read of the room, then the sector's real
  //  number. The gap IS the teaching, and the numbers are lensed because the
  //  norm genuinely differs by sector.
  // ==========================================================================
  var DEBRIEF_DATA = {
    education:     [{ k: 'most', label: 'Use the container immediately', pct: 62 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 29 },
                    { k: 'few',  label: 'Routinely set it down', pct: 9 }],
    aec:           [{ k: 'most', label: 'Use the container immediately', pct: 48 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 37 },
                    { k: 'few',  label: 'Routinely set it down', pct: 15 }],
    manufacturing: [{ k: 'most', label: 'Use the container immediately', pct: 55 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 33 },
                    { k: 'few',  label: 'Routinely set it down', pct: 12 }],
    public:        [{ k: 'most', label: 'Use the container immediately', pct: 71 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 22 },
                    { k: 'few',  label: 'Routinely set it down', pct: 7 }]
  };
  function debriefRows() { return DEBRIEF_DATA[LE.lensId()] || DEBRIEF_DATA.manufacturing; }
  function DEBRIEF_CONTENT() {
    return '<main class="ll-object">' +
      '<p class="ll-eyebrow">Compare: 1 question</p>' +
      '<h2>What does your shift actually do?</h2>' +
      '<p class="ll-sub">Answer honestly and then we’ll display the real numbers for ' + esc(lens().label) + '.</p>' +
      '<div class="pr-wrap">' +
        '<div class="pr-choices" id="prChoices">' +
          debriefRows().map(function (d) {
            return '<button class="pr-choice" type="button" data-k="' + d.k + '">' +
              '<span class="pr-head">' +
                '<span class="pr-lab">' + esc(d.label) + '</span>' +
                '<span class="pr-tag">Your guess</span>' +
                '<span class="pr-pct">' + d.pct + '%</span>' +
              '</span>' +
              '<span class="pr-track"><span class="pr-fill" data-w="' + d.pct + '"></span></span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<p class="pr-src" id="prSrc" hidden><i class="fa-solid fa-users" aria-hidden="true"></i> ' +
          'Anonymous survey · ' + esc(lens().org) + ' · 214 responses · representative data</p>' +
      '</div>' +
    '</main>';
  }
  function debriefInit(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('Which of these is closest to your shift? Your read, not the rule.');
    var picked = null;
    var choices = document.getElementById('prChoices');
    var top = debriefRows()[0];
    choices.querySelectorAll('.pr-choice').forEach(function (b) {
      b.addEventListener('click', function () {
        if (picked) return;
        picked = b.dataset.k;
        b.classList.add('picked');
        choices.classList.add('answered');
        choices.querySelectorAll('.pr-choice').forEach(function (c) { c.disabled = true; });
        debriefRows().forEach(function (d) {
          var el = choices.querySelector('.pr-choice[data-k="' + d.k + '"]');
          if (el && d.pct >= 50) el.classList.add('is-top');
        });
        document.getElementById('prSrc').hidden = false;
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          choices.querySelectorAll('.pr-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
        }); });
        setTimeout(function () {
          ctx.setCoachSay(picked === 'most'
            ? 'Your read matches the data — <strong>' + top.pct + '%</strong>. Which means the person who sets one down is the outlier, not the norm.'
            : 'The real figure is <strong>' + top.pct + '%</strong> — higher than most people guess. The shortcut feels normal because you notice it; it is not what most of your shift does.');
          saveResult('debrief', { guess: picked });
          ctx.enableNext();
          ctx.positionOrb(true);
        }, T(1300));
      });
    });
  }

  // ==========================================================================
  //  THE CULMINATING ACTIVITY — the deck's four beats. Beat 1 is the cue and
  //  it runs in real time: the interruption lands BEFORE the sharp is
  //  disposed of, and the decision and its latency are both captured. Nobody
  //  tests out of this, and it doubles as verification for a learner who
  //  tested out of the procedure.
  // ==========================================================================
  function PERFORM_CONTENT() {
    return '<main class="ll-object">' +
      '<div class="ac-wrap">' +
        '<p class="ll-eyebrow">Do it: 1 moment</p>' +
        '<h2 class="bl-q" style="max-width:28ch">Dispose first, or set it down?</h2>' +
        '<p class="ll-sub">This runs in real time. When the sharp needs to be gone, act — the moment won’t wait.</p>' +
        '<div class="ac-stage" id="acStage"><div class="ac-lines" id="acLines"></div></div>' +
        '<div class="ac-window" id="acWindow" hidden>' +
          '<div class="ac-track"><div class="ac-fill" id="acFill"></div></div>' +
        '</div>' +
        '<button class="ac-go" id="acGo" type="button" disabled>' +
          '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Dispose it now</button>' +
        '<p class="ac-verdict" id="acVerdict" hidden></p>' +
      '</div>' +
    '</main>';
  }
  var PERFORM_WINDOW = 6000;
  function performInit(ctx) {
    var L = lens();
    var lines = document.getElementById('acLines');
    var go = document.getElementById('acGo');
    var win = document.getElementById('acWindow');
    var fill = document.getElementById('acFill');
    var verdict = document.getElementById('acVerdict');
    var cueAt = null, done = false, timers = [];

    ctx.floatOpen();
    ctx.setCoachSay('Nobody skips this one. It also re-checks the procedure, so it stands in for the beat you tested out of.');

    var scene = [
      { at: 0,    text: L.simPremise, mute: false, who: 'Scene' },
      { at: 2200, text: '(the sharp is in your hand, unshielded)', mute: true },
      { at: 3400, text: 'The safety feature clicks home. The container is four steps away.', who: 'You', cue: true },
      { at: 5200, text: '(the interruption is still going. Nobody is looking at the sharp.)', mute: true },
      { at: 7400, text: 'The moment settles. The sharp is wherever you left it.', who: 'Scene' }
    ];
    scene.forEach(function (l) {
      timers.push(setTimeout(function () {
        var d = document.createElement('p');
        d.className = 'ac-line' + (l.mute ? ' is-mute' : '');
        d.innerHTML = l.mute ? esc(l.text) : '<b>' + esc(l.who) + '</b> ' + esc(l.text);
        lines.appendChild(d);
        lines.scrollTop = lines.scrollHeight;
        if (l.cue) openWindow();
      }, T(l.at)));
    });

    function openWindow() {
      cueAt = Date.now();
      go.disabled = false;
      win.hidden = false;
      fill.style.transition = 'none'; fill.style.width = '100%';
      void fill.offsetWidth;
      fill.style.transition = 'width ' + T(PERFORM_WINDOW) + 'ms linear';
      fill.style.width = '0%';
      timers.push(setTimeout(missed, T(PERFORM_WINDOW)));
    }
    go.addEventListener('click', function () {
      if (done || cueAt === null) return;
      done = true;
      var ms = Date.now() - cueAt;
      timers.forEach(clearTimeout);
      go.disabled = true; win.hidden = true;
      settle(true, ms);
    });
    function missed() {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      go.disabled = true; win.hidden = true;
      settle(false, null);
    }
    function settle(inTime, ms) {
      document.getElementById('acStage').classList.add(inTime ? 'is-hit' : 'is-missed');
      verdict.hidden = false;
      verdict.className = 'ac-verdict ' + (inTime ? 'ok' : 'late');
      verdict.innerHTML = inTime
        ? '<i class="fa-solid fa-circle-check"></i> Disposed <b>' + (ms / 1000).toFixed(1) + ' seconds</b> after the feature was activated — at the point of use, not deferred to the end of the task.'
        : '<i class="fa-solid fa-clock"></i> The sharp was set down. That is how every one of the three cases you just judged began.';
      ctx.setCoachSay(inTime
        ? 'Timing, technique and route all held. That is the objective — not knowing the procedure, doing it while something else was pulling at you.'
        : 'Honest outcome, and the common one. The interruption is not the failure — the sharp existing outside a container is. That is what the follow-up is for.');
      saveResult('perform', { disposed: inTime, ms: ms });
      ctx.enableNext();
      ctx.positionOrb(true);
    }
  }

  // ==========================================================================
  //  FOLLOW-UP — D3, Do / Sustain. The only objective whose evidence arrives
  //  after the module ends, so the module schedules it rather than teaching
  //  it. This is the 30/60/90 leg of the measurement path.
  // ==========================================================================
  var FOLLOWUP_CONTENT =
    '<main class="ll-object">' +
      '<div class="fu-wrap">' +
        '<p class="ll-eyebrow">Set it up: 1 choice</p>' +
        '<h2 class="bl-q" style="max-width:26ch">When should I check back?</h2>' +
        '<p class="ll-sub">One question, once, about something you actually did at work. It is how this objective gets evidenced at all.</p>' +
        '<div class="fu-opts" id="fuOpts">' +
          '<button class="fu-card" type="button" data-d="30"><span class="day">30</span>' +
            '<span><b>In 30 days</b><small>Soon enough that the procedure is still fresh</small></span></button>' +
          '<button class="fu-card" type="button" data-d="60"><span class="day">60</span>' +
            '<span><b>In 60 days</b><small>Long enough that the habit has been tested</small></span></button>' +
          '<button class="fu-card" type="button" data-d="90"><span class="day">90</span>' +
            '<span><b>In 90 days</b><small>The standard interval for this objective</small></span></button>' +
        '</div>' +
        '<p class="fu-note" id="fuNote" hidden></p>' +
      '</div>' +
    '</main>';
  function followupInit(ctx) {
    var opts = document.getElementById('fuOpts');
    var note = document.getElementById('fuNote');
    ctx.floatOpen();
    ctx.setCoachSay('Last thing. This objective can’t be finished today — it is about what you keep doing.');
    var picked = false;
    opts.querySelectorAll('.fu-card').forEach(function (b) {
      b.addEventListener('click', function () {
        if (picked) return; picked = true;
        b.classList.add('picked');
        opts.classList.add('answered');
        opts.querySelectorAll('.fu-card').forEach(function (x) { x.disabled = true; });
        var d = b.dataset.d;
        note.hidden = false;
        note.innerHTML = 'Scheduled for <b>' + d + ' days</b>. One question: <i>“Since the module, has a container ' +
          'or a loose sharp needed raising — and did you raise it?”</i> The answer is the evidence for this ' +
          'objective; nothing before today can be.';
        ctx.setCoachSay('Set for ' + d + ' days. Until then this objective sits open on your record — honestly, rather than being marked complete because you watched something.');
        saveResult('followup', { days: +d });
        ctx.enableNext();
        ctx.positionOrb(true);
      });
    });
  }

  // ==========================================================================
  //  THE RECORD — eight objectives, each with the policy that governed it and
  //  where its evidence actually came from. D3 is deliberately still open.
  // ==========================================================================
  var RECORD_CONTENT =
    '<main class="ll-object" id="recordObject">' +
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="recHead">Here’s what you showed.</h2>' +
      '<p class="ll-sub">Eight objectives, and where the evidence for each one came from — not a completion tick.</p>' +
      '<ul class="apt-list" id="recList" aria-label="Objective-by-objective record"></ul>' +
      '<p class="res-basis" id="recBasis"></p>' +
    '</main>';
  function recordInit(ctx) {
    var c = readCourse();
    var proven = batteryResult() === 'proven';
    var state = {
      K1: proven ? ['Verified', 'band-exc', 'Sequenced correctly in the pre-module battery, then re-verified performatively in the simulation.']
                 : ['Instructed', 'band-ok', 'Taught in the module and re-checked in flow; the simulation verified it in context.'],
      K2: [k2TestUp() ? 'Verified · harder tier' : 'Instructed', k2TestUp() ? 'band-exc' : 'band-ok',
           k2TestUp() ? 'Content-locked, so a strong result served the ambiguous variant rather than removing the beat.'
                      : 'Content-locked — served in full, as it is for every learner in every profile.'],
      F1: [(c.case4 && c.case4.read) ? 'Reinforced' : 'Not shown', 'band-ok',
           'Feel objectives never route past content. Rated before the module, and the consequence case ran regardless.'],
      F2: ['Asked', 'band-ok', 'Measured for the record at course level. It routes nothing on its own — that is what “ask” means.'],
      F3: [(c.debrief) ? 'Reinforced' : 'Not shown', 'band-ok',
           'Your read of the room, corrected against what your sector actually reports.'],
      D1: [(c.perform && c.perform.disposed) ? 'Demonstrated' : 'Attempted',
           (c.perform && c.perform.disposed) ? 'band-exc' : 'band-warn',
           (c.perform && c.perform.disposed)
             ? 'Disposed at the point of use, ' + ((c.perform.ms || 0) / 1000).toFixed(1) + 's after the safety feature engaged, while interrupted.'
             : 'The window closed with the sharp still in hand. Recorded as attempted — this objective is never skipped and never assumed.'],
      D2: [(c.perform && c.perform.disposed) ? 'Demonstrated' : 'Partial',
           (c.perform && c.perform.disposed) ? 'band-exc' : 'band-warn',
           'Rubric-scored against the SME-validated standard: timing, technique, route, recovery.'],
      D3: ['Open · ' + ((c.followup && c.followup.days) || 90) + ' days', 'band-warn',
           'Cannot be evidenced today. Scheduled, and it stays open on the record until it answers.']
    };
    document.getElementById('recList').innerHTML = OBJECTIVES.map(function (o) {
      var s = state[o.id];
      return '<li class="apt-row">' +
        '<span class="apt-ico"><i class="fa-solid ' +
          (o.domain === 'Know' ? 'fa-book-open' : o.domain === 'Feel' ? 'fa-heart' : 'fa-bolt') + '"></i></span>' +
        '<div class="apt-main">' +
          '<div class="apt-head"><h3>' + esc(o.name) + '</h3></div>' +
          '<div class="apt-class">' +
            '<span class="apt-dom ' + (o.domain === 'Know' ? 'dom-know' : o.domain === 'Feel' ? 'dom-feel' : 'dom-do') + '">' +
              esc(o.domain + ' / ' + o.sub) + '</span>' +
            '<span class="apt-theory">' + esc(o.theory) + '</span>' +
          '</div>' +
          '<div class="apt-bands"><span class="band ' + s[1] + '">' + esc(s[0]) + '</span></div>' +
          '<p class="apt-evidence">' + esc(s[2]) + '</p>' +
        '</div>' +
      '</li>';
    }).join('');
    document.getElementById('recBasis').innerHTML =
      '<i class="fa-solid fa-circle-info"></i> Every row traces to a policy the SME signed and a moment in this ' +
      'module where it fired. Seven objectives are closed; <b>Do / Sustain stays open by design</b> — it is the one ' +
      'thing a module cannot evidence on the day it is taken.';
    typeFeedback(ctx, [
      'Seven of eight closed, Rob — and the eighth is open on purpose rather than rounded up.',
      'The part worth noticing: proving the procedure removed a beat, but made the locked one harder. Compression and lock are different rules.',
      'Ask me about any row and I will show you which policy put the question where it was.'
    ]);
    wireChat(ctx, [
      'That row traces to the pre-module battery — a gate-flagged Know objective, which is the only kind that can buy you anything.',
      'Content-locked means the regulation names it. We can serve it harder for a strong learner, but never remove it.',
      '“Ask” objectives are measured and reported, and route nothing. F2 is one — it tells your administrator something without changing your path.',
      'Do / Sustain is scheduled rather than scored. Anything else would be evidence we do not have.'
    ]);
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  THE PATH. Entry → Learn → Check → Perform → Record, with the assessment
  //  policy deciding what is here at all.
  // ==========================================================================
  var STEPS = [
    { id: 'intro', mode: 'floating', lesson: 'Welcome', cover: true, nextLabel: 'Start module',
      caption: { title: 'Course title page', note: 'Module 4 of six behavioral outcomes decomposed from Bloodborne Pathogens (RVCT-303B). The sections list renders from the live path, so it foreshadows what the battery can remove.' },
      coach: { say: 'This is the sharps module. Four questions first — they decide how much of it you actually have to sit through.' },
      content: INTRO_CONTENT, init: introInit },

    { id: 'battery', icon: 'fa-list-check', mins: 1, stage: 'Entry', lesson: 'Four Questions', mode: 'floating', gate: true,
      caption: { title: 'ENTRY · Pre-module battery', note: 'Four items: two gate-flagged Know and two remediate-flagged Feel. NEVER a Do objective — a question cannot credibly measure behavior. The policy chip above each item shows which rule put it here. K1 clean sweep = test-out; it also sets test-up on the content-locked K2.' },
      coach: { say: 'Loading…' },
      content: BATTERY_CONTENT, init: batteryInit,
      onSkip: function () { saveResult('battery', { k1: 'unproven', skipped: true }); } },

    { id: 'adjust', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', lesson: 'What Changed', mode: 'crown', gate: true, interstitial: true,
      caption: { title: 'ENTRY · Knowledge Layer', note: 'Three different moves in one screen, which is the point: a beat REMOVED (test-out), a beat made HARDER (content-locked → test-up), and — on a low Feel score — a beat ADDED. Compression is only one of the things an assessment policy can do.' },
      coach: { say: '' },
      content: ADJUST_CONTENT, init: adjustInit },

    { id: 'case1', icon: 'fa-clock', mins: 1, stage: 'Learn', lesson: 'Deferred Disposal', mode: 'floating', gate: true, adaptive: true,
      when: function () { return batteryResult() !== 'proven'; },
      caption: { title: 'LEARN · Case 1 (K1)', note: 'The procedure case. Compressed out when the battery proved K1 — the only beat in the module that test-out can remove, and only because the simulation re-verifies it performatively.' },
      coach: { say: 'Loading…' },
      content: caseContent(CASE1), init: caseInit(CASE1),
      onSkip: function () { saveResult('case1', { skipped: true }); } },

    { id: 'inflow', icon: 'fa-clipboard-check', mins: 1, stage: 'Learn', lesson: 'Quick Check', mode: 'floating', gate: true,
      caption: { title: 'LEARN · In-flow check (K1)', note: 'Asked of everyone, because K1 gates. Two attempts with a different explanation on a miss — the deck’s in-flow band. A learner who tested out still meets it here, so test-out never means unverified.' },
      coach: { say: 'Loading…' },
      content: INFLOW_CONTENT, init: inflowInit },

    { id: 'case2', icon: 'fa-box-open', mins: 1, stage: 'Learn', lesson: 'The Overfilled Container', mode: 'floating', gate: true, adaptive: true,
      caption: { title: 'LEARN · Case 2 (K2, content-locked)', note: 'Never removed. On test-up the three options are replaced with genuinely arguable ones — the same objective, served harder. 1910.1030(g)(2)(vii)(E): recognition is sector-specific, so a generic pass does not satisfy it.' },
      coach: { say: 'Loading…' },
      content: caseContent(CASE2), init: caseInit(CASE2) },

    { id: 'case3', icon: 'fa-magnifying-glass', mins: 1, stage: 'Learn', lesson: 'Left by Someone Else', mode: 'floating', gate: true,
      caption: { title: 'LEARN · Case 3 (K2)', note: 'The second half of the locked objective: recognizing a condition you did not create. Independent of the other cases — this is what makes Option B compressible without editorial repair.' },
      coach: { say: 'Loading…' },
      content: caseContent(CASE3), init: caseInit(CASE3) },

    { id: 'case4', icon: 'fa-triangle-exclamation', mins: 1, stage: 'Learn', lesson: 'The One That Landed', mode: 'floating', gate: true,
      caption: { title: 'LEARN · Case 4 (F1)', note: 'The Feel load. No judgment — the case is the argument. Runs on every path: Feel never routes past content, and a low F1 in the battery makes this beat heavier rather than absent. NOTE the deck’s own caution: F1 and the debrief carry the module’s entire Feel load, so cutting either for time reverts this to a Know course.' },
      coach: { say: 'Loading…' },
      content: CASE4_CONTENT, init: case4Init },

    { id: 'debrief', icon: 'fa-users', mins: 1, stage: 'Learn', lesson: 'What Your Shift Does', mode: 'floating', gate: true,
      caption: { title: 'LEARN · Cohort debrief (F3)', note: 'The norm correction. Figures are lensed because the norm genuinely differs by sector — Public Sector runs highest, AEC lowest. Where a customer has their own cohort data it swaps in here.' },
      coach: { say: 'Loading…' },
      content: DEBRIEF_CONTENT, init: debriefInit },

    { id: 'perform', icon: 'fa-shield-halved', mins: 2, stage: 'Perform', lesson: 'The Moment', mode: 'floating', gate: true,
      caption: { title: 'PERFORM · Culminating activity, beat 1 (D1/D2)', note: 'The deck’s Beat 1: the interruption lands BEFORE the sharp is disposed of, and the decision and its latency are both captured. Nobody tests out. Doubles as verification for a learner who tested out of the procedure. Beats 2–4 (the walked disposal, the adaptive complication, the open-ended close) are the full Scenario Simulator build.' },
      coach: { say: 'Loading…' },
      content: PERFORM_CONTENT, init: performInit,
      onSkip: function () { saveResult('perform', { disposed: false, skipped: true }); } },

    { id: 'followup', icon: 'fa-calendar-check', mins: 1, stage: 'Record', lesson: 'The Check-Back', mode: 'floating', gate: true,
      caption: { title: 'RECORD · Follow-up (D3, Do / Sustain)', note: 'The 30/60/90 leg of the measurement path. This objective cannot be evidenced on the day the module is taken, so the module schedules it and the record carries it OPEN rather than marking it complete.' },
      coach: { say: 'Loading…' },
      content: FOLLOWUP_CONTENT, init: followupInit },

    { id: 'record', icon: 'fa-chart-simple', mins: 1, stage: 'Record', lesson: 'Your Record', mode: 'sidebar',
      caption: { title: 'RECORD · Objective-level record', note: 'Eight objectives, each with the policy that governed it and where its evidence came from. Seven closed, one deliberately open — objective-level performance data from day one, which is what turns provenance into evidence without re-authoring anything.' },
      coach: { say: '', ask: 'Ask CLARA about your record…' },
      content: RECORD_CONTENT, init: recordInit }
  ];

  // ==========================================================================
  //  Hand it to the engine.
  // ==========================================================================
  LE.register({
    course: COURSE,
    steps: STEPS,
    storageKey: 'sh-course',
    lenses: LENSES,
    lensOrder: ['manufacturing', 'education', 'aec', 'public'],
    // Every beat with a scene in it moves with the sector.
    lensedSteps: { intro: 1, case1: 1, case2: 1, case3: 1, case4: 1, debrief: 1, perform: 1 },
    replies: [
      'Short version: the sharp should never exist outside a container for longer than it takes to walk there — and you decide that route before you start.',
      'Recapping is the one absolute. Every other rule has a “unless”; that one does not.',
      'If a container is at its fill line it is already a hazard. Sealing it and walking is always better than one more.',
      'I am recording which objective each answer evidenced, not a score. Your administrator sees the same chain you do.'
    ],
    demoControls: [{
      id: 'shBatteryBtn',
      title: 'Demo: force the pre-module battery result (proven ↔ not proven) and replay the routing.',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      label: function () {
        return '<i class="fa-solid fa-shuffle"></i> Demo: battery — ' +
               (batteryResult() === 'proven' ? 'procedure proven' : 'not proven');
      },
      onClick: function (api) {
        var next = batteryResult() === 'proven' ? 'unproven' : 'proven';
        try { sessionStorage.setItem('sh-battery', next); } catch (e) {}
        var c = readCourse();
        if (c.battery) saveResult('battery', { k1: next, k2up: next === 'proven', f1: c.battery.f1, f3: c.battery.f3 });
        if (api.step && api.step.id === 'adjust') { api.replay(); return; }
        api.refresh();
      }
    }]
  });
})();
