/* =============================================================================
   TargetSolutions Mobile App (v2) — Record Completions
   =============================================================================
   Vanilla JS, no build step. Owns everything inside the Record tab: the two-
   step flow (Activities → Participants), the per-activity form with voice
   capture, the shared activity/participant picker (a mobile take on the User
   Selection Tool), validation, the confirmation screen, and the draft.

   The functional reference is the web platform's Record Completions plus its
   Figma "Mobile views" frame. Deliberate mobile-only changes, all agreed in
   review:
     • the bottom tab bar hides while the flow is open (it is a full-screen task)
     • the stepper IS the navigation — both steps are always tappable, and the
       only validation happens at Submit
     • participants are ONE list ("All 3 activities") with per-person
       exceptions, instead of the web's one-card-per-activity matrix
     • smart defaults: date = today, time = now, and the "apply to all"
       switches start on. Instructor is NOT pre-filled (the data model
       can't seed it from the logged-in user) — VoiceComplete or a manual pick
       fills it
     • the draft survives leaving the flow; only Cancel discards it
     • the confirmation screen offers "Same participants, new activities"

   Everything a designer is likely to change lives in the DATA block.
   Exposes window.RC = { openWith(activityName), applyState(id) } for the Quick
   Link tiles (app.js) and the Design Toolbox flow map (index.html).
   ========================================================================== */
(function () {
  'use strict';

  /* ===========================================================================
     DATA — edit these to change the prototype's content
     ======================================================================== */

  /* Activities an officer can record. `components` is the admin-configured
     part of each activity's form (the web calls these "components"); an
     activity with components:null renders the "hasn't been configured" notice.
     `recent` puts it in the picker's Recent group. Names match the RCA Quick
     Link tiles on Home so a tile can open the flow with its activity added. */
  var ACTIVITIES = [
    { id: 'district',   name: 'District Familiarization', category: 'Firefighter Physical Fitness', recent: true,
      components: { objectives: ['Familiarize with building layouts', 'Learn hydrant locations', 'Identify access points',
                                 'Recognize fire hazards', 'Review response routes', 'Practice communication protocols'],
                    techniques: true, areas: true, notes: true } },
    { id: 'ladders',    name: 'Throwing Ladders',          category: 'Rescue Techniques', recent: true,
      components: { objectives: ['Select the correct ladder', 'Carry and raise safely', 'Set the climbing angle', 'Heel and secure', 'Climb and dismount'],
                    techniques: true, areas: false, notes: true } },
    { id: 'hydrant',    name: 'Hydrant Training',          category: 'Wildfire Management', recent: true,
      components: { objectives: ['Locate and inspect hydrant', 'Flush before connecting', 'Connect supply line', 'Open and close under control'],
                    techniques: true, areas: true, notes: true } },
    { id: 'extinguisher', name: 'Extinguisher Training',   category: 'Hazardous Materials', recent: true,
      components: { objectives: ['Identify extinguisher classes', 'Use the PASS technique', 'Check pressure and tags'],
                    techniques: true, areas: false, notes: true } },
    { id: 'firebasics', name: 'Fire Basics',               category: 'Fire Equipment Maintenance',
      components: { objectives: ['Fire behavior and stages', 'PPE donning and doffing', 'Radio procedures'],
                    techniques: true, areas: false, notes: true } },
    { id: 'firewalls',  name: 'Firewalls',                 category: 'Fire Investigation',
      components: null },   /* unconfigured on purpose — shows the notice */
    { id: 'sprinkler',  name: 'Sprinkler System Basics',   category: 'Fire Equipment Maintenance',
      components: { objectives: ['Identify system types', 'Locate control valves', 'Shut down and restore'],
                    techniques: true, areas: true, notes: true } },
    { id: 'sprinklers', name: 'Sprinkler Systems',         category: 'Fire Equipment Maintenance',
      components: { objectives: ['Walk the riser room', 'Trace supply to heads', 'Document impairments'],
                    techniques: true, areas: true, notes: true } },
    { id: 'vehicle',    name: 'Vehicle Stabilization',     category: 'Rescue Techniques',
      components: { objectives: ['Size up the vehicle', 'Crib and strut', 'Verify stability before entry'],
                    techniques: true, areas: false, notes: true } },
    { id: 'facilities', name: 'Facilities Training',       category: 'Emergency Response',
      components: { objectives: ['Tour utility shutoffs', 'Review evacuation routes', 'Check alarm panels'],
                    techniques: true, areas: true, notes: true } },
    { id: 'harbor',     name: 'Harbor Familiarization',    category: 'Emergency Response',
      components: { objectives: ['Identify pier access points', 'Locate fire boat berths', 'Review marine hazards'],
                    techniques: true, areas: true, notes: true } },
    { id: 'laddertrn',  name: 'Ladder Training',           category: 'Rescue Techniques',
      components: { objectives: ['Aerial positioning', 'Tip placement', 'Victim removal'],
                    techniques: true, areas: false, notes: true } },
    { id: 'offshore',   name: 'Offshore Basics',           category: 'Search and Rescue',
      components: { objectives: ['Survival suit donning', 'Raft boarding', 'Signaling'],
                    techniques: true, areas: false, notes: true } },
    { id: 'dumpster',   name: 'Dumpster Fires',            category: 'Fire Safety Drills',
      components: { objectives: ['Approach and size-up', 'Extinguishment tactics', 'Overhaul'],
                    techniques: true, areas: false, notes: true } },
    { id: 'dive',       name: 'Dive Training',             category: 'Fire Safety Drills',
      components: { objectives: ['Equipment check', 'Descent and ascent', 'Search pattern'],
                    techniques: true, areas: true, notes: true } }
  ];

  /* Techniques are admin-configured and can run long, so the form shows them
     in a searchable bottom sheet rather than inline chips. */
  var TECHNIQUES = ['Hands-on practice', 'Classroom instruction', 'Live drill',
                    'Simulation exercise', 'Equipment familiarization', 'Team coordination',
                    'Demonstration', 'Tabletop exercise', 'Case study review', 'Video / e-learning',
                    'Skills station rotation', 'Scenario-based training', 'Peer instruction',
                    'Written assessment', 'Apparatus operation', 'Radio procedure'];

  /* First entry is the signed-in officer. It is NOT the default — the field
     starts empty and is filled by VoiceComplete or a manual pick. */
  var INSTRUCTORS = ['Jordan Lee (you)', 'Captain Johnson', 'Lieutenant Smith', 'Captain Brown', 'Battalion Chief Davis'];

  /* People the officer can add. `recent` = the picker's "Last used" group: the
     exact roster from the officer's last submission (re-synced on every Submit),
     not an arbitrary time window. The other filterable attributes (status,
     shift, rank, EMS…) are seeded below the list. */
  var PEOPLE = [
    { id: 'p01', name: 'Cox, Sandra',        uid: '100000104', station: 'Station 3', recent: true },
    { id: 'p02', name: 'Diaz, Sharon',       uid: '100000167', station: 'Station 3', recent: true },
    { id: 'p03', name: 'Jones, Ryan',        uid: '100000034', station: 'Station 3', recent: true },
    { id: 'p04', name: 'Kelly, Christopher', uid: '100000015', station: 'Station 3', recent: true },
    { id: 'p05', name: 'Kim, Kevin',         uid: '100000086', station: 'Station 1', recent: true },
    { id: 'p06', name: 'Rivera, William',    uid: '100000168', station: 'Station 1', recent: true },
    { id: 'p07', name: 'Thompson, Cynthia',  uid: '100000107', station: 'Station 1', recent: true },
    { id: 'p08', name: 'Ward, Stephen',      uid: '100000194', station: 'Station 1', recent: true },
    { id: 'p09', name: 'Adams, Ashley',      uid: '100000028', station: 'Station 2' },
    { id: 'p10', name: 'Adams, Ronald',      uid: '100000036', station: 'Station 2' },
    { id: 'p11', name: 'Allen, Ryan',        uid: '100000065', station: 'Station 2' },
    { id: 'p12', name: 'Anderson, Jason',    uid: '100000189', station: 'Station 4' },
    { id: 'p13', name: 'Bailey, Elizabeth',  uid: '100000119', station: 'Station 4' },
    { id: 'p14', name: 'Baker, Deborah',     uid: '100000073', station: 'Station 4' },
    { id: 'p15', name: 'Brown, Mark',        uid: '100000017', station: 'Station 1' },
    { id: 'p16', name: 'Brown, Jessica',     uid: '100000177', station: 'Station 2' },
    { id: 'p17', name: 'Campbell, Margaret', uid: '100000101', station: 'Station 3' },
    { id: 'p18', name: 'Carter, Andrew',     uid: '100000003', station: 'Station 4' },
    { id: 'p19', name: 'Clark, Michelle',    uid: '100000192', station: 'Station 1' },
    { id: 'p20', name: 'Collins, Susan',     uid: '100000024', station: 'Station 2' },
    { id: 'p21', name: 'Cook, Helen',        uid: '100000044', station: 'Station 3' },
    { id: 'p22', name: 'Cooper, Amy',        uid: '100000143', station: 'Station 4' },
    { id: 'p23', name: 'Cruz, Kenneth',      uid: '100000035', station: 'Station 1' },
    { id: 'p24', name: 'Davis, Brian',       uid: '100000053', station: 'Station 2' },
    { id: 'p25', name: 'Edwards, Karen',     uid: '100000011', station: 'Station 3' },
    { id: 'p26', name: 'Green, David',       uid: '100000109', station: 'Station 4' },
    { id: 'p27', name: 'Hernandez, David',   uid: '100000175', station: 'Station 1' },
    { id: 'p28', name: 'Lee, Jordan',        uid: '100000001', station: 'Station 3' },   /* the officer — must add themselves explicitly */
    { id: 'p29', name: 'Martinez, Donna',    uid: '100000088', station: 'Station 2' },
    { id: 'p30', name: 'Wright, Sean',       uid: '100000142', station: 'Station 4' }
  ];
  var STATIONS = ['Station 1', 'Station 2', 'Station 3', 'Station 4'];

  /* Filter fields for each picker, mirroring the web User Selection Tool. Every
     field is a working multi-select; the attribute values are spread across
     the mock data below so each one actually narrows the list. */
  var FILTER_FIELDS = {
    activities: [
      { field: 'category',   label: 'Category' },
      { field: 'type',       label: 'Activity type' },
      { field: 'credential', label: 'Credential' }
    ],
    people: [
      { field: 'status',     label: 'User Status' },
      { field: 'station',    label: 'Station' },
      { field: 'shift',      label: 'Shift' },
      { field: 'rank',       label: 'Rank' },
      { field: 'ems',        label: 'EMS' },
      { field: 'specialty',  label: 'Specialty' },
      { field: 'region',     label: 'Region',     group: 'CAL FIRE Enterprise' },
      { field: 'department', label: 'Department', group: 'CAL FIRE Enterprise' }
    ]
  };
  (function seedFilterData() {
    var cyc = function (arr, i) { return arr[i % arr.length]; };
    PEOPLE.forEach(function (p, i) {
      p.status     = (i >= 8 && i % 7 === 3) ? 'Inactive' : 'Active';   // a few inactive accounts outside Last used
      p.shift      = cyc(['A Shift', 'B Shift', 'C Shift'], i);
      p.rank       = cyc(['Firefighter', 'Engineer', 'Lieutenant', 'Captain', 'Firefighter'], i);
      p.ems        = cyc(['EMT', 'Paramedic', 'None'], i * 2);
      p.specialty  = cyc(['Hazmat', 'Technical Rescue', 'Wildland', 'Dive', 'None'], i * 3);
      p.region     = cyc(['Northern', 'Southern'], Math.floor(i / 5));
      p.department = cyc(['Springfield Fire', 'Springfield EMS'], Math.floor(i / 8));
    });
    ACTIVITIES.forEach(function (a, i) {
      a.type       = cyc(['Drill', 'Classroom', 'Field exercise'], i);
      a.credential = cyc(['None', 'EMT-B', 'Hazmat Ops', 'Driver/Operator'], i * 2);
    });
  })();

  /* What the voice capture "hears". One transcript per activity, with a
     generic fallback. Analyze reads `fills` to populate the form. */
  var TRANSCRIPTS = {
    district: {
      text: 'District familiarization today from two to four with Captain Johnson. Focused on key areas like Maple Street, ' +
            'Oak Avenue, and the Riverside Industrial Park. We examined the layout, identified potential hazards, and noted ' +
            'important access routes and emergency exits. We also reviewed local resources, including Lincoln High School ' +
            'and City Hospital, which are vital for our emergency response.',
      fills: { duration: '2', instructor: 'Captain Johnson', objectives: [0, 1, 2, 3], techniques: ['Hands-on practice'],
               areas: 'Maple Street, Oak Avenue, Riverside Industrial Park, Lincoln High School, City Hospital.',
               notes: 'Crew navigated the district without maps by the end of the session.' }
    },
    fallback: {
      text: 'We ran this as a hands-on drill at the station for about an hour and a half. Everyone rotated through each ' +
            'position and we debriefed at the end. No injuries, no equipment issues.',
      fills: { duration: '1.5', objectives: [0, 1], techniques: ['Hands-on practice', 'Live drill'],
               areas: 'Station apparatus bay and drill yard.',
               notes: 'Full rotation completed; debrief held after.' }
    }
  };

  /* ===========================================================================
     STATE
     ======================================================================== */
  var draft = freshDraft();
  var lastSubmission = null;    // powers "Same participants, new activities"
  var voiceTimer = null;
  var picker = null;            // { kind:'activities'|'people', selected:{}, query, filters:{...}, view:'list'|'filters'|'selected', sort:'asc'|'desc', lastUsedOpen }

  function freshDraft() {
    return { step: 'activities', activities: [], people: [], expandedPerson: null, dirty: false };
  }

  function newActivityEntry(def) {
    var now = new Date();
    return {
      id: def.id, open: false,
      date: isoDate(now), time: pad(now.getHours()) + ':' + pad(now.getMinutes()), duration: '',
      instructor: '', applyDate: true, applyInstructor: true,
      objectives: [], techniques: [], areas: '', notes: '',
      voice: { status: 'idle', text: '', editing: false }
    };
  }
  function defOf(id) { return ACTIVITIES.filter(function (a) { return a.id === id; })[0]; }
  function personOf(id) { return PEOPLE.filter(function (p) { return p.id === id; })[0]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function isFilled(a) {
    return !!(a.duration || a.objectives.length || a.techniques.length || a.areas || a.notes || a.voice.status === 'done');
  }
  function prettyDate(iso) {
    if (!iso) return '';
    if (iso === isoDate(new Date())) return 'Today';
    var p = iso.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function shortName(n) { return n.replace(' (you)', ''); }
  /* "Cox, Sandra" → "Sandra Cox" for the participant list */
  function displayName(p) { var parts = p.name.split(', '); return parts.length === 2 ? parts[1] + ' ' + parts[0] : p.name; }

  /* ===========================================================================
     ELEMENTS
     ======================================================================== */
  var $ = function (sel) { return document.querySelector(sel); };
  var body    = $('#rc-body');
  var footer  = $('#rc-footer');
  var scroller = $('#rc-scroll');
  var pickerEl = $('#rc-picker');
  var dialogEl = $('#rc-dialog');
  var menuEl   = $('#rc-menu');
  var toastEl  = $('#rc-toast');
  var doneEl   = $('#rc-done');
  var tabDot   = $('#tab-record-dot');

  /* ===========================================================================
     RENDER — the flow
     ======================================================================== */
  function render() {
    body.innerHTML = renderTitle() + renderStepper() + (draft.step === 'activities' ? renderActivities() : renderParticipants());
    footer.innerHTML = draft.step === 'activities'
      ? '<button class="t-Button t-Button--secondary rc-footer__btn" data-rc="cancel" type="button">Cancel</button>' +
        '<button class="t-Button t-Button--primary rc-footer__btn" data-rc="next" type="button">Next <i class="fa-solid fa-chevron-right"></i></button>'
      : '<button class="t-Button t-Button--secondary rc-footer__btn" data-rc="back" type="button">Back</button>' +
        '<button class="t-Button t-Button--primary rc-footer__btn" data-rc="submit" type="button">Submit</button>';
    tabDot.hidden = !(draft.activities.length || draft.people.length);
  }

  /* No app bar on this screen — the title row carries the X (leave, keep the
     draft; app.js handles data-task-leave) and the Vector AI badge. */
  function renderTitle() {
    return '<div class="rc-title">' +
           '<button class="rc-iconbtn" data-task-leave type="button" aria-label="Close and keep draft"><i class="fa-solid fa-xmark"></i></button>' +
           '<h1 class="rc-title__text">Record Completions</h1>' +
           '<span class="ai-badge ai-badge--tint"><i class="fa-solid fa-sparkles"></i> Vector AI</span></div>';
  }

  function renderStepper() {
    var nA = draft.activities.length, nP = draft.people.length;
    var subA = nA ? nA + (nA === 1 ? ' activity' : ' activities') : 'None added yet';
    var subP = nP ? nP + (nP === 1 ? ' participant' : ' participants') : 'None added yet';
    return '<div class="rc-stepper">' +
      step('activities', 1, 'Activities', subA, nA > 0) +
      '<span class="rc-stepper__line"></span>' +
      step('participants', 2, 'Participants', subP, nP > 0) +
      '</div>';
    function step(id, n, label, sub, done) {
      var cls = 'rc-step' + (draft.step === id ? ' is-current' : '') + (done ? ' is-done' : '');
      return '<button class="' + cls + '" data-rc="step" data-step="' + id + '" type="button">' +
             '<span class="rc-step__dot">' + (done ? '<i class="fa-solid fa-check"></i>' : n) + '</span>' +
             '<span class="rc-step__label">' + label + ' <em>*</em></span>' +
             '<span class="rc-step__sub">' + sub + '</span></button>';
    }
  }

  /* --- Step 1: Activities ------------------------------------------------ */
  function renderActivities() {
    if (!draft.activities.length) {
      return '<div class="rc-hero"><h2 class="rc-hero__title">Activities</h2>' +
             '<button class="rc-pill" data-rc="add-activities" type="button"><i class="fa-solid fa-plus"></i> Add Activities</button>' +
             '<p class="rc-hero__hint">Pick the trainings you ran. Quick Links on Home add one for you.</p></div>';
    }
    return '<div class="rc-hero rc-hero--list">' +
           '<div class="rc-hero__bar"><h2 class="rc-hero__title">Activities</h2>' +
           '<button class="rc-pill rc-pill--sm" data-rc="add-activities" type="button"><i class="fa-solid fa-plus"></i> Add Activities</button></div>' +
           draft.activities.map(renderPanel).join('') + '</div>';
  }

  function renderPanel(a, idx) {
    var def = defOf(a.id), n = draft.activities.length, filled = isFilled(a);
    var head = '<button class="rc-panel__head" data-rc="toggle" data-idx="' + idx + '" type="button" aria-expanded="' + a.open + '">' +
               '<i class="fa-solid ' + (a.open ? 'fa-chevron-down' : 'fa-chevron-right') + '"></i>' +
               '<span class="rc-panel__name">' + esc(def.name) + '</span>' +
               (filled ? '<i class="fa-solid fa-check rc-panel__check" aria-label="Filled in"></i>' : '') +
               '<span class="rc-panel__count">' + (idx + 1) + '/' + n + '</span></button>';
    if (!a.open) {
      var summary = filled
        ? '<div class="rc-panel__summary"><span>' + prettyDate(a.date) + '</span>' +
          (a.duration ? '<span>' + esc(a.duration) + ' hrs</span>' : '') +
          (a.instructor ? '<span class="rc-panel__summary-end">' + esc(shortName(a.instructor)) + '</span>' : '') + '</div>'
        : '';
      return '<div class="rc-panel' + (filled ? ' is-filled' : '') + '">' + head + summary + '</div>';
    }
    return '<div class="rc-panel is-open' + (filled ? ' is-filled' : '') + '">' + head +
           '<div class="rc-panel__body">' + (def.components ? renderForm(a, def, idx) : renderUnconfigured(idx)) + '</div></div>';
  }

  function renderUnconfigured(idx) {
    return '<div class="rc-unconfigured">' +
           '<button class="rc-iconbtn rc-iconbtn--danger" data-rc="delete" data-idx="' + idx + '" type="button" aria-label="Delete activity"><i class="fa-solid fa-trash-can"></i></button>' +
           '<p>This activity hasn’t been configured.<br>Please remove it and contact your administrator for assistance.</p></div>';
  }

  function renderForm(a, def, idx) {
    var c = def.components, many = draft.activities.length > 1;
    var h = '';

    /* Voice capture — button, live box, or the "filled" strip */
    h += renderVoice(a, idx);

    /* Fixed fields — one per row (the earlier two-up rows tested poorly).
       Each "apply to all" checkbox sits directly under the field it copies. */
    h += '<div class="rc-stack">' +
         field('Date', '<input class="t-Input" type="date" data-field="date" data-idx="' + idx + '" value="' + a.date + '">') +
         field('Time', '<input class="t-Input" type="time" data-field="time" data-idx="' + idx + '" value="' + a.time + '">') +
         (many ? '<div class="rc-applyrow">' + check('applyDate', a.applyDate, 'Apply date &amp; time to all activities', idx) + '</div>' : '') +
         field('Duration (hrs)', '<input class="t-Input" type="number" inputmode="decimal" step="0.25" min="0" placeholder="e.g. 1.5" data-field="duration" data-idx="' + idx + '" value="' + esc(a.duration) + '">') +
         // Instructor starts empty: the placeholder option is the only "unset" state
         field('Instructor', '<select class="t-Input' + (a.instructor ? '' : ' is-placeholder') + '" data-field="instructor" data-idx="' + idx + '">' +
               '<option value="" disabled' + (a.instructor ? '' : ' selected') + '>Select instructor…</option>' +
               INSTRUCTORS.map(function (i) { return '<option' + (i === a.instructor ? ' selected' : '') + '>' + i + '</option>'; }).join('') + '</select>') +
         (many ? '<div class="rc-applyrow">' + check('applyInstructor', a.applyInstructor, 'Apply instructor to all activities', idx) + '</div>' : '') +
         '</div>';

    /* Admin-configured components */
    if (c.objectives && c.objectives.length) {
      h += '<div class="rc-group"><span class="rc-group__label">Training objectives</span>' +
           c.objectives.map(function (o, i) {
             return '<label class="rc-check"><input type="checkbox" data-field="objective" data-i="' + i + '" data-idx="' + idx + '"' +
                    (a.objectives.indexOf(i) > -1 ? ' checked' : '') + '><span class="rc-check__box"></span><span>' + esc(o) + '</span></label>';
           }).join('') + '</div>';
    }
    if (c.techniques) {
      // Multi-select: a field-shaped trigger that shows the picks as chips and
      // opens a searchable checklist sheet (the list is admin-configured and can run long)
      var nT = a.techniques.length;
      h += '<div class="t-Fieldset rc-field"><span class="t-Label">Techniques used</span>' +
           '<button class="rc-multi' + (nT ? ' has-value' : '') + '" data-rc="techniques" data-idx="' + idx + '" type="button" aria-haspopup="dialog">' +
           (nT ? '<span class="rc-multi__chips">' + a.techniques.map(function (t) { return '<span class="rc-multi__chip">' + esc(t) + '</span>'; }).join('') + '</span>'
               : '<span class="rc-multi__ph">Select techniques…</span>') +
           '<i class="fa-solid fa-chevron-down"></i></button>' +
           (nT ? '<span class="rc-multi__hint">' + nT + ' selected · tap to add or remove</span>' : '') + '</div>';
    }
    if (c.areas) h += textarea('Areas covered', 'areas', a.areas, idx, 'Enter areas covered…');
    if (c.notes) h += textarea('Notes', 'notes', a.notes, idx, 'Add any additional notes…');
    return h;

    function field(label, control) {
      return '<label class="t-Fieldset rc-field"><span class="t-Label">' + label + '</span>' + control + '</label>';
    }
    /* "Apply to all" is a setting that changes how the form behaves, not an item
       being recorded — so it is a switch (label left, track right), and the
       objectives stay checkboxes. Same change handler: the input is a checkbox. */
    function check(f, on, label, i) {
      return '<label class="rc-switch"><span class="rc-switch__label">' + label + '</span>' +
             '<input type="checkbox" role="switch" data-field="' + f + '" data-idx="' + i + '"' + (on ? ' checked' : '') +
             '><span class="rc-switch__track" aria-hidden="true"></span></label>';
    }
    function textarea(label, f, val, i, ph) {
      return '<label class="t-Fieldset rc-field rc-field--area"><span class="t-Label">' + label + '</span>' +
             '<span class="rc-area"><textarea class="t-Input" rows="3" placeholder="' + ph + '" data-field="' + f + '" data-idx="' + i + '">' + esc(val) + '</textarea>' +
             '<button class="rc-mic" data-rc="mic" data-idx="' + i + '" data-field="' + f + '" type="button" aria-label="Dictate ' + label + '"><i class="fa-solid fa-microphone"></i></button></span></label>';
    }
  }

  /* Voice capture states: idle → listening/paused → analyzing → done.
     While listening the box is position:sticky under the panel header, so the
     transcript stays visible as the user scrolls the form (see styles.css). */
  function renderVoice(a, idx) {
    var v = a.voice;
    if (v.status === 'idle') {
      return '<div class="rc-toolbar">' +
             '<button class="rc-voicebtn" data-rc="voice-start" data-idx="' + idx + '" type="button"><i class="fa-solid fa-microphone"></i> VoiceComplete</button>' +
             '<button class="rc-iconbtn" data-rc="menu" data-idx="' + idx + '" type="button" aria-label="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>';
    }
    if (v.status === 'listening' || v.status === 'paused' || v.status === 'analyzing') {
      var listening = v.status === 'listening';
      return '<div class="rc-voice is-live" id="rc-voice-' + idx + '">' +
             '<div class="rc-voice__row"><span class="rc-voice__mic' + (listening ? ' is-pulsing' : '') + '"><i class="fa-solid fa-microphone"></i></span>' +
             '<p class="rc-voice__text" id="rc-voice-text-' + idx + '">' + (v.text ? esc(v.text) : '<span class="rc-voice__hint">' + (listening ? 'Listening…' : 'Paused') + '</span>') + '</p></div>' +
             '<div class="rc-voice__actions">' +
             (v.status === 'analyzing'
               ? '<span class="rc-voice__status"><i class="fa-solid fa-sparkles"></i> Vector AI is filling the form…</span>'
               : '<button class="t-Button t-Button--ghost rc-voice__ghost" data-rc="voice-pause" data-idx="' + idx + '" type="button">' + (listening ? 'Pause' : 'Resume') + '</button>' +
                 '<button class="rc-voice__analyze" data-rc="voice-analyze" data-idx="' + idx + '" type="button"><i class="fa-solid fa-sparkles"></i> Analyze</button>') +
             '</div></div>';
    }
    /* done — compact strip; the form fields below stay directly editable */
    return '<div class="rc-voice is-done">' +
           '<div class="rc-voice__row"><span class="rc-voice__mic is-done"><i class="fa-solid fa-check"></i></span>' +
           '<p class="rc-voice__text"><strong>Filled in from your recording.</strong> Check the fields below and change anything that’s off.</p>' +
           '<button class="rc-iconbtn" data-rc="menu" data-idx="' + idx + '" type="button" aria-label="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>' +
           (v.editing
             ? '<textarea class="t-Input rc-voice__edit" rows="4" data-field="voiceText" data-idx="' + idx + '">' + esc(v.text) + '</textarea>'
             : '') +
           '<div class="rc-voice__actions">' +
           '<button class="t-Button t-Button--ghost rc-voice__ghost" data-rc="voice-restart" data-idx="' + idx + '" type="button"><i class="fa-solid fa-rotate-left"></i> Re-record</button>' +
           (v.editing
             ? '<button class="rc-voice__analyze" data-rc="voice-analyze" data-idx="' + idx + '" type="button"><i class="fa-solid fa-sparkles"></i> Re-analyze</button>'
             : '<button class="t-Button t-Button--ghost rc-voice__ghost" data-rc="voice-edit" data-idx="' + idx + '" type="button"><i class="fa-solid fa-pen"></i> Edit transcript</button>') +
           '</div></div>';
  }

  /* --- Step 2: Participants --------------------------------------------- */
  function renderParticipants() {
    if (!draft.people.length) {
      return '<div class="rc-hero"><h2 class="rc-hero__title">Participants</h2>' +
             '<button class="rc-pill" data-rc="add-people" type="button"><i class="fa-solid fa-plus"></i> Add Participants</button>' +
             '<p class="rc-hero__hint">Everyone you add gets a completion for every activity unless you say otherwise. Add yourself if you took part.</p></div>';
    }
    var nA = draft.activities.length;
    return '<div class="rc-hero rc-hero--list">' +
      '<div class="rc-hero__bar"><h2 class="rc-hero__title">Participants</h2>' +
      '<button class="rc-pill rc-pill--sm" data-rc="add-people" type="button"><i class="fa-solid fa-plus"></i> Add</button>' +
      '<button class="rc-iconbtn rc-iconbtn--light" data-rc="people-menu" type="button" aria-label="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>' +
      '<div class="rc-list">' + draft.people.map(function (p, i) {
        var person = personOf(p.id), did = nA - p.except.length, open = draft.expandedPerson === p.id;
        var sub = !nA ? 'No activities added yet'
                : did === nA ? 'All ' + nA + (nA === 1 ? ' activity' : ' activities')
                : did === 0 ? 'No activities — will not be recorded'
                : did + ' of ' + nA + ' activities';
        var h = '<div class="rc-person' + (open ? ' is-open' : '') + (did === 0 && nA ? ' is-none' : '') + '">' +
                '<button class="rc-person__row" data-rc="person" data-pid="' + p.id + '" type="button" aria-expanded="' + open + '">' +
                '<span class="t-Avatar rc-person__avatar">' + initials(person) + '</span>' +
                '<span class="rc-person__main"><span class="rc-person__name">' + esc(displayName(person)) + '</span>' +
                '<span class="rc-person__sub">' + sub + '</span></span>' +
                '<i class="fa-solid ' + (open ? 'fa-chevron-up' : 'fa-chevron-down') + ' rc-person__chev"></i></button>';
        if (open) {
          h += '<div class="rc-person__detail">' +
               draft.activities.map(function (a) {
                 var def = defOf(a.id), on = p.except.indexOf(a.id) === -1;
                 return '<label class="rc-check"><input type="checkbox" data-field="took" data-pid="' + p.id + '" data-aid="' + a.id + '"' + (on ? ' checked' : '') +
                        '><span class="rc-check__box"></span><span>' + esc(def.name) + '</span></label>';
               }).join('') +
               (!nA ? '<p class="t-SizableText">Add activities on step 1 to choose which ones this person completed.</p>' : '') +
               '<button class="t-Button t-Button--ghost rc-person__remove" data-rc="remove-person" data-pid="' + p.id + '" type="button"><i class="fa-solid fa-user-minus"></i> Remove participant</button>' +
               '</div>';
        }
        return h + '</div>';
      }).join('') + '</div></div>';
  }
  function initials(p) { var parts = p.name.split(', '); return ((parts[1] || '')[0] || '') + (parts[0][0] || ''); }

  /* ===========================================================================
     RENDER — the picker (mobile User Selection Tool)
     ======================================================================== */
  function openPicker(kind) {
    picker = { kind: kind, query: '', view: 'list', selected: {}, filters: {}, pendingFilters: {}, sort: 'asc', lastUsedOpen: true };
    (kind === 'activities' ? draft.activities : draft.people).forEach(function (x) { picker.selected[x.id] = true; });
    // Participants: an empty step opens with the whole Last used roster pre-checked —
    // the common case is recording the same crew again. Once the draft has people,
    // their choices win (reopening never re-checks someone they removed).
    if (kind === 'people' && !draft.people.length) PEOPLE.forEach(function (p) { if (p.recent) picker.selected[p.id] = true; });
    renderPicker();
    pickerEl.classList.add('is-open');
    setTimeout(function () { var s = pickerEl.querySelector('.rc-picker__search input'); if (s) s.focus(); }, 260);
  }
  function closePicker() { picker = null; pickerEl.classList.remove('is-open'); }

  function pickerItems() {
    var isAct = picker.kind === 'activities';
    var src = isAct ? ACTIVITIES : PEOPLE;
    var q = picker.query.trim().toLowerCase();
    var f = picker.filters;
    return src.filter(function (x) {
      if (q && x.name.toLowerCase().indexOf(q) === -1 && !(x.uid && x.uid.indexOf(q) > -1)) return false;
      // every active filter field must match (values within a field are OR'd)
      return Object.keys(f).every(function (field) {
        return !f[field] || !f[field].length || f[field].indexOf(x[field]) > -1;
      });
    });
  }

  function renderPicker() {
    var isAct = picker.kind === 'activities';
    var title = isAct ? 'Select Activities' : 'Select Participants';
    var selectedIds = Object.keys(picker.selected).filter(function (k) { return picker.selected[k]; });
    var n = selectedIds.length;
    var h = '<div class="rc-picker__head"><h2 class="t-H3">' + title + '</h2>' +
            '<button class="rc-iconbtn" data-pk="close" type="button" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>';

    if (picker.view === 'filters') { pickerEl.innerHTML = h + renderPickerFilters(isAct); return; }
    if (picker.view === 'selected') { pickerEl.innerHTML = h + renderPickerSelected(isAct, selectedIds); return; }

    var chips = activeFilterChips(isAct);
    h += '<div class="rc-picker__tools">' +
         '<label class="rc-picker__search"><i class="fa-solid fa-magnifying-glass"></i>' +
         '<input class="t-Input" type="search" placeholder="' + (isAct ? 'Search activities…' : 'Search individuals…') + '" value="' + esc(picker.query) + '" data-pk="query"></label>' +
         '<button class="rc-picker__filter' + (chips.length ? ' is-on' : '') + '" data-pk="filters" type="button"><i class="fa-solid fa-filter"></i> Filters' + (chips.length ? ' (' + chips.length + ')' : '') + '</button></div>' +
         (chips.length ? '<div class="rc-picker__chips">' + chips.map(function (c) {
           return '<span class="rc-filterchip">' + esc(c.label) + '<button data-pk="chip-x" data-f="' + c.field + '" data-v="' + esc(c.value) + '" type="button" aria-label="Remove filter"><i class="fa-solid fa-xmark"></i></button></span>';
         }).join('') + '</div>' : '');

    var items = pickerItems();
    // Recent / Last used group only when browsing; a search shows one flat list.
    // The A–Z / Z–A toggle in the "All" header sorts every group.
    var asc = picker.sort !== 'desc';
    var byName = function (a, b) { return (asc ? 1 : -1) * a.name.localeCompare(b.name); };
    var grouped = !picker.query;
    var recent = grouped ? items.filter(function (x) { return x.recent; }).sort(byName) : [];
    var rest = items.filter(function (x) { return !grouped || !x.recent; }).sort(byName);
    var sortBtn = '<button class="rc-picker__groupbtn rc-picker__sort" data-pk="sort" type="button" aria-label="Sort ' + (asc ? 'Z to A' : 'A to Z') + '">' +
                  '<i class="fa-solid ' + (asc ? 'fa-arrow-down-a-z' : 'fa-arrow-down-z-a') + '"></i> ' + (asc ? 'A–Z' : 'Z–A') + '</button>';
    h += '<div class="rc-picker__list js-scroll">';
    if (!items.length) h += '<p class="rc-picker__empty">No matches. Try a different search or clear the filters.</p>';
    if (recent.length) {
      if (isAct) {
        h += '<div class="rc-picker__group">Recent</div>' + recent.map(row).join('');
      } else {
        // Participants: collapsible "Last used" header with a Select / Deselect all toggle
        var open = picker.lastUsedOpen;
        h += '<div class="rc-picker__group rc-picker__group--bar">' +
             '<button class="rc-picker__grouptoggle" data-pk="lu-toggle" type="button" aria-expanded="' + open + '">' +
             '<i class="fa-solid ' + (open ? 'fa-chevron-down' : 'fa-chevron-right') + '"></i> Last used (' + recent.length + ')</button>' +
             '<button class="rc-picker__groupbtn" data-pk="lu-all" type="button">' + lastUsedLabel(recent) + '</button></div>' +
             (open ? recent.map(row).join('') : '');
      }
    }
    if (rest.length) {
      h += '<div class="rc-picker__group rc-picker__group--bar"><span>' + (grouped ? 'All' : 'Results') + ' (' + rest.length + ')</span>' + sortBtn + '</div>' + rest.map(row).join('');
    }
    h += '</div>';
    h += '<div class="rc-picker__foot">' +
         '<button class="t-Button t-Button--secondary rc-footer__btn" data-pk="view-selected" type="button"' + (n ? '' : ' disabled') + '>View Selected (' + n + ')</button>' +
         '<button class="t-Button t-Button--primary rc-footer__btn" data-pk="save" type="button">Save Selection</button></div>';
    pickerEl.innerHTML = h;

    function row(x) {
      var on = !!picker.selected[x.id];
      return '<label class="rc-pickrow' + (on ? ' is-on' : '') + '"><input type="checkbox" data-pk="check" data-id="' + x.id + '"' + (on ? ' checked' : '') + '>' +
             '<span class="rc-check__box"></span><span class="rc-pickrow__main"><span class="rc-pickrow__name">' + esc(x.name) + '</span>' +
             '<span class="rc-pickrow__sub">' + esc(isAct ? x.category : x.uid) + '</span></span></label>';
    }
  }
  /* "Deselect all" while any of the Last used roster is checked, else "Select all". */
  function lastUsedLabel(list) {
    return list.some(function (x) { return picker.selected[x.id]; }) ? 'Deselect all' : 'Select all';
  }
  function lastUsedVisible() { return pickerItems().filter(function (x) { return x.recent; }); }

  function activeFilterChips(isAct) {
    var out = [], f = picker.filters;
    Object.keys(f).forEach(function (field) {
      (f[field] || []).forEach(function (v) { out.push({ field: field, value: v, label: v }); });
    });
    return out;
  }

  /* The filter panel mirrors the UST prototype's field list. Each field is a
     collapsible multi-select: tap the select-shaped header to open its chips. */
  function renderPickerFilters(isAct) {
    var pf = picker.pendingFilters, src = isAct ? ACTIVITIES : PEOPLE;
    var fields = FILTER_FIELDS[isAct ? 'activities' : 'people'];
    var nPending = Object.keys(pf).reduce(function (t, k) { return t + (pf[k] || []).length; }, 0);
    var lastGroup = null;
    var h = '<div class="rc-picker__subhead"><span class="t-H4">Filters</span>' +
            '<button class="t-Button t-Button--ghost rc-picker__clear" data-pk="pf-clear" type="button"' + (nPending ? '' : ' disabled') + '>Clear all</button></div>' +
            '<div class="rc-picker__list js-scroll rc-picker__filters">';
    fields.forEach(function (fd) {
      if (fd.group && fd.group !== lastGroup) { h += '<span class="rc-group__label" style="margin-top:var(--space-2)">' + esc(fd.group) + '</span>'; lastGroup = fd.group; }
      var chosen = pf[fd.field] || [], open = picker.openFilter === fd.field;
      var options = uniq(src.map(function (x) { return x[fd.field]; }).filter(Boolean));
      h += '<div class="rc-filterfield' + (open ? ' is-open' : '') + (chosen.length ? ' is-set' : '') + '">' +
           '<button class="rc-filterfield__head" data-pk="pf-open" data-f="' + fd.field + '" type="button" aria-expanded="' + open + '">' +
           '<span><span class="rc-filterfield__label">' + esc(fd.label) + '</span>' +
           '<span class="rc-filterfield__value">' + (chosen.length ? esc(chosen.join(', ')) : 'Select ' + fd.label.toLowerCase() + '…') + '</span></span>' +
           '<i class="fa-solid ' + (open ? 'fa-chevron-up' : 'fa-chevron-down') + '"></i></button>' +
           (open ? '<div class="rc-filterfield__options rc-chips">' + options.map(function (o) {
             var on = chosen.indexOf(o) > -1;
             return '<button class="rc-chip' + (on ? ' is-on' : '') + '" data-pk="pf" data-f="' + fd.field + '" data-v="' + esc(o) + '" type="button" aria-pressed="' + on + '">' + (on ? '<i class="fa-solid fa-check"></i>' : '') + esc(o) + '</button>';
           }).join('') + '</div>' : '') +
           '</div>';
    });
    h += '</div><div class="rc-picker__foot">' +
         '<button class="t-Button t-Button--secondary rc-footer__btn" data-pk="filters-cancel" type="button">Cancel</button>' +
         '<button class="t-Button t-Button--primary rc-footer__btn" data-pk="filters-apply" type="button">Apply' + (nPending ? ' (' + nPending + ')' : '') + '</button></div>';
    return h;
  }
  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }).sort(); }

  function renderPickerSelected(isAct, ids) {
    var src = isAct ? ACTIVITIES : PEOPLE;
    var items = src.filter(function (x) { return ids.indexOf(x.id) > -1; });
    return '<div class="rc-picker__subhead"><span class="t-H4">Selected (' + items.length + ')</span>' +
           '<button class="t-Button t-Button--ghost rc-picker__clear" data-pk="clear-all" type="button">Clear All</button></div>' +
           '<div class="rc-picker__list js-scroll">' +
           (items.length ? items.map(function (x) {
             return '<div class="rc-selrow"><span>' + esc(x.name) + '</span>' +
                    '<button class="rc-iconbtn" data-pk="unselect" data-id="' + x.id + '" type="button" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button></div>';
           }).join('') : '<p class="rc-picker__empty">Nothing selected yet.</p>') + '</div>' +
           '<div class="rc-picker__foot"><span class="rc-picker__count">' + items.length + ' selected</span>' +
           '<button class="t-Button t-Button--secondary rc-footer__btn" data-pk="back-to-list" type="button">Back</button>' +
           '<button class="t-Button t-Button--primary rc-footer__btn" data-pk="save" type="button">Save Selection</button></div>';
  }

  function savePicker() {
    var ids = Object.keys(picker.selected).filter(function (k) { return picker.selected[k]; });
    if (picker.kind === 'activities') {
      var kept = draft.activities.filter(function (a) { return ids.indexOf(a.id) > -1; });
      var added = ids.filter(function (id) { return !kept.some(function (a) { return a.id === id; }); });
      added.forEach(function (id) { kept.push(newActivityEntry(defOf(id))); });
      draft.activities = kept;
      // drop exceptions that point at removed activities
      draft.people.forEach(function (p) { p.except = p.except.filter(function (aid) { return ids.indexOf(aid) > -1; }); });
      if (draft.activities.length && !draft.activities.some(function (a) { return a.open; })) {
        (added.length ? draft.activities.filter(function (a) { return a.id === added[0]; })[0] : draft.activities[0]).open = true;
      }
    } else {
      var keptP = draft.people.filter(function (p) { return ids.indexOf(p.id) > -1; });
      ids.forEach(function (id) { if (!keptP.some(function (p) { return p.id === id; })) keptP.push({ id: id, except: [] }); });
      draft.people = keptP;
    }
    draft.dirty = true;
    closePicker();
    render();
  }

  /* The participant picker's "Last used" group is exactly the roster of the
     last submission — no recency window. Re-flag PEOPLE after every Submit. */
  function syncLastUsed() {
    if (!lastSubmission) return;
    PEOPLE.forEach(function (p) { p.recent = lastSubmission.people.indexOf(p.id) > -1; });
  }

  /* ===========================================================================
     VOICE CAPTURE (simulated — no real microphone API)
     ======================================================================== */
  function voiceStart(idx) {
    var a = draft.activities[idx];
    // Only one activity records at a time: close any other live capture.
    draft.activities.forEach(function (o, i) { if (i !== idx && o.voice.status !== 'idle' && o.voice.status !== 'done') o.voice = { status: 'idle', text: '', editing: false }; });
    a.voice = { status: 'listening', text: '', editing: false };
    draft.dirty = true;
    render();
    streamTranscript(idx);
  }
  function streamTranscript(idx) {
    stopStream();
    var a = draft.activities[idx];
    var words = (TRANSCRIPTS[a.id] || TRANSCRIPTS.fallback).text.split(' ');
    var have = a.voice.text ? a.voice.text.split(' ').length : 0;
    voiceTimer = setInterval(function () {
      if (a.voice.status !== 'listening') return;
      if (have >= words.length) { stopStream(); return; }
      have += 1;
      a.voice.text = words.slice(0, have).join(' ');
      var el = $('#rc-voice-text-' + idx);
      if (el) el.textContent = a.voice.text;
    }, 140);
  }
  function stopStream() { if (voiceTimer) { clearInterval(voiceTimer); voiceTimer = null; } }
  function voicePause(idx) {
    var a = draft.activities[idx];
    a.voice.status = a.voice.status === 'listening' ? 'paused' : 'listening';
    render();
    if (a.voice.status === 'listening') streamTranscript(idx);
  }
  function voiceAnalyze(idx) {
    var a = draft.activities[idx];
    stopStream();
    if (!a.voice.text) a.voice.text = (TRANSCRIPTS[a.id] || TRANSCRIPTS.fallback).text;
    var editedText = a.voice.editing ? (body.querySelector('[data-field="voiceText"][data-idx="' + idx + '"]') || {}).value : null;
    if (editedText != null) a.voice.text = editedText;
    a.voice.status = 'analyzing'; a.voice.editing = false;
    render();
    setTimeout(function () {
      var fills = (TRANSCRIPTS[a.id] || TRANSCRIPTS.fallback).fills;
      var def = defOf(a.id);
      a.duration = fills.duration || a.duration;
      if (fills.instructor && INSTRUCTORS.indexOf(fills.instructor) > -1) a.instructor = fills.instructor;
      a.objectives = (fills.objectives || []).filter(function (i) { return def.components && i < def.components.objectives.length; });
      a.techniques = fills.techniques || [];
      if (def.components && def.components.areas) a.areas = fills.areas || '';
      if (def.components && def.components.notes) a.notes = fills.notes || '';
      if (a.applyDate) propagate(a, ['date', 'time']);
      if (a.applyInstructor) propagate(a, ['instructor']);
      a.voice.status = 'done';
      render();
      scrollToOpenPanel(true);
    }, 1100);
  }
  /* Bring the open panel's header to the top of the scroller (just under the app bar) */
  function scrollToOpenPanel(smooth) {
    var panel = body.querySelector('.rc-panel.is-open');
    if (!panel) return;
    var top = panel.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8;
    scroller.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  }

  function voiceRestart(idx) {
    draft.activities[idx].voice = { status: 'idle', text: '', editing: false };
    voiceStart(idx);
  }

  /* "Apply to all" — copy this activity's date/time or instructor onto the rest.
     Instructor only propagates once it has a value, so an empty field never
     wipes a sibling that VoiceComplete already filled. */
  function propagate(from, fields) {
    draft.activities.forEach(function (o) { if (o !== from) fields.forEach(function (f) { if (f !== 'instructor' || from.instructor) o[f] = from[f]; }); });
  }

  /* ===========================================================================
     TECHNIQUES SHEET — searchable multi-select checklist in a bottom sheet.
     Picks apply immediately (like the objectives checklist); Done just closes.
     ======================================================================== */
  var tsheet = null;   // { idx, query }
  function openTechniques(idx) {
    tsheet = { idx: idx, query: '' };
    renderTechniques();
    menuEl.classList.add('is-open');
  }
  function closeTechniques() {
    menuEl.classList.remove('is-open');
    menuEl.onchange = menuEl.oninput = null;
    tsheet = null;
    render();
  }
  function techniqueRows() {
    var a = draft.activities[tsheet.idx], q = tsheet.query.trim().toLowerCase();
    var list = TECHNIQUES.slice().sort(function (x, y) { return x.localeCompare(y); })
                         .filter(function (t) { return !q || t.toLowerCase().indexOf(q) > -1; });
    if (!list.length) return '<p class="rc-picker__empty">No matches.</p>';
    return list.map(function (t) {
      var on = a.techniques.indexOf(t) > -1;
      return '<label class="rc-check rc-tsheet__row"><input type="checkbox" data-ts="t" data-t="' + esc(t) + '"' + (on ? ' checked' : '') +
             '><span class="rc-check__box"></span><span>' + esc(t) + '</span></label>';
    }).join('');
  }
  function renderTechniques() {
    var a = draft.activities[tsheet.idx], n = a.techniques.length;
    menuEl.innerHTML = '<div class="t-Sheet__frame rc-menu rc-tsheet"><div class="t-Sheet__handle"></div>' +
      '<div class="rc-tsheet__head"><span class="t-H4">Techniques used</span>' +
      '<button class="rc-picker__groupbtn" data-ts="clear" type="button"' + (n ? '' : ' disabled') + '>Clear</button></div>' +
      '<label class="rc-picker__search rc-tsheet__search"><i class="fa-solid fa-magnifying-glass"></i>' +
      '<input class="t-Input" type="search" placeholder="Search techniques…" value="' + esc(tsheet.query) + '" data-ts="q"></label>' +
      '<div class="rc-tsheet__list js-scroll">' + techniqueRows() + '</div>' +
      '<button class="t-Button t-Button--primary rc-tsheet__done" data-ts="done" type="button">Done' + (n ? ' (' + n + ')' : '') + '</button></div>';
    menuEl.onclick = function (e) {
      var btn = e.target.closest('[data-ts]');
      if (e.target === menuEl || (btn && btn.dataset.ts === 'done')) { closeTechniques(); return; }
      if (btn && btn.dataset.ts === 'clear') { a.techniques = []; draft.dirty = true; renderTechniques(); }
    };
    menuEl.onchange = function (e) {
      if (e.target.dataset.ts !== 't') return;
      var t = e.target.dataset.t, pos = a.techniques.indexOf(t);
      if (e.target.checked && pos === -1) a.techniques.push(t);
      if (!e.target.checked && pos > -1) a.techniques.splice(pos, 1);
      draft.dirty = true;
      var k = a.techniques.length;
      menuEl.querySelector('[data-ts="done"]').textContent = 'Done' + (k ? ' (' + k + ')' : '');
      menuEl.querySelector('[data-ts="clear"]').disabled = !k;
    };
    menuEl.oninput = function (e) {
      if (e.target.dataset.ts !== 'q') return;
      tsheet.query = e.target.value;
      menuEl.querySelector('.rc-tsheet__list').innerHTML = techniqueRows();   // list only, so the search keeps focus
    };
  }

  /* ===========================================================================
     DIALOGS, MENUS, TOAST
     ======================================================================== */
  function dialog(title, text, buttons) {
    dialogEl.innerHTML = '<div class="rc-dialog"><h3 class="t-H3">' + title + '</h3><p class="t-Paragraph">' + text + '</p>' +
      '<div class="rc-dialog__actions">' + buttons.map(function (b, i) {
        return '<button class="t-Button ' + (b.danger ? 't-Button--danger' : b.primary ? 't-Button--primary' : 't-Button--ghost') + '" data-dlg="' + i + '" type="button">' + b.label + '</button>';
      }).join('') + '</div></div>';
    dialogEl.classList.add('is-open');
    dialogEl.onclick = function (e) {
      var btn = e.target.closest('[data-dlg]');
      if (!btn && e.target !== dialogEl) return;
      dialogEl.classList.remove('is-open');
      if (btn && buttons[+btn.dataset.dlg].onPick) buttons[+btn.dataset.dlg].onPick();
    };
  }

  function menu(title, options) {
    menuEl.innerHTML = '<div class="t-Sheet__frame rc-menu"><div class="t-Sheet__handle"></div>' +
      (title ? '<p class="rc-menu__title">' + esc(title) + '</p>' : '') +
      options.map(function (o, i) {
        return '<button class="rc-menu__item' + (o.danger ? ' is-danger' : '') + '" data-mnu="' + i + '" type="button"><i class="fa-solid ' + o.icon + '"></i>' + o.label + '</button>';
      }).join('') +
      '<button class="t-Button t-Button--secondary" data-mnu="x" type="button" style="margin-top:var(--space-3)">Cancel</button></div>';
    menuEl.classList.add('is-open');
    menuEl.onclick = function (e) {
      var btn = e.target.closest('[data-mnu]');
      if (!btn && e.target !== menuEl) return;
      menuEl.classList.remove('is-open');
      if (btn && btn.dataset.mnu !== 'x') options[+btn.dataset.mnu].onPick();
    };
  }

  var toastTimer = null;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-open'); }, 2200);
  }

  /* ===========================================================================
     FLOW ACTIONS
     ======================================================================== */
  function go(step) { draft.step = step; draft.expandedPerson = null; render(); scroller.scrollTop = 0; }

  function submit() {
    var nA = draft.activities.length;
    var counted = draft.people.filter(function (p) { return p.except.length < nA; });
    var missing = [];
    if (!nA) missing.push('activity');
    if (!counted.length) missing.push('participant');
    if (missing.length) {
      dialog('Missing required fields',
             'Please select at least one ' + missing.join(' and one ') + ' before submitting.',
             [{ label: 'OK', primary: true }]);
      return;
    }
    var unconfigured = draft.activities.filter(function (a) { return !defOf(a.id).components; });
    if (unconfigured.length) {
      dialog('Unconfigured activity',
             '“' + esc(defOf(unconfigured[0].id).name) + '” hasn’t been configured and can’t be recorded. Remove it, or contact your administrator.',
             [{ label: 'OK', primary: true }]);
      return;
    }
    var completions = 0;
    counted.forEach(function (p) { completions += nA - p.except.length; });
    lastSubmission = { activities: draft.activities.map(function (a) { return defOf(a.id).name; }),
                       people: draft.people.map(function (p) { return p.id; }), completions: completions,
                       participants: counted.length };
    syncLastUsed();
    draft = freshDraft();
    render();
    renderDone();
    window.goTo('record-done');
  }

  function renderDone() {
    var s = lastSubmission;
    var actList = s.activities.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('');
    doneEl.innerHTML =
      '<div class="rc-done__icon"><i class="fa-solid fa-check"></i></div>' +
      '<h1 class="t-H1">Completions recorded</h1>' +
      '<p class="t-Paragraph">' + s.completions + ' completion' + (s.completions === 1 ? '' : 's') + ' saved for ' +
      s.participants + ' participant' + (s.participants === 1 ? '' : 's') + ' across ' + s.activities.length +
      (s.activities.length === 1 ? ' activity' : ' activities') + '.</p>' +
      '<ul class="rc-done__list">' + actList + '</ul>' +
      '<div class="t-YStack" style="gap:var(--space-2);width:100%">' +
      '<button class="t-Button t-Button--primary" data-rc="done-more" type="button">Record more</button>' +
      '<button class="t-Button t-Button--secondary" data-rc="done-same" type="button"><i class="fa-solid fa-users"></i> Same participants, new activities</button>' +
      '<button class="t-Button t-Button--ghost" data-goto="home" type="button">Go to Home</button></div>';
  }

  function cancel() {
    if (!draft.dirty) { leave(true); return; }
    dialog('Unsaved changes', 'Are you sure you want to cancel? Your changes will be lost.',
      [{ label: 'Go Back' }, { label: 'Yes, Cancel', danger: true, onPick: function () { leave(true); } }]);
  }
  /* Leave the flow. discard=false keeps the draft (header X); true throws it away (Cancel). */
  function leave(discard) {
    stopStream();
    if (discard) { draft = freshDraft(); render(); }
    else if (draft.activities.length || draft.people.length) toast('Draft saved — pick up where you left off from the Record tab.');
    window.goTo('home');
  }

  /* Quick Link tile → open the flow with that activity added (and its panel open).
     A draft in progress keeps everything already in it. */
  function openWith(name) {
    var def = ACTIVITIES.filter(function (a) { return a.name.toLowerCase() === name.toLowerCase(); })[0];
    if (!def) {   // a tile we have no mock data for — treat it as a simple, configured activity
      def = { id: 'ql-' + name.toLowerCase().replace(/\W+/g, '-'), name: name, category: 'Quick Link',
              components: { objectives: ['Reviewed procedure', 'Completed practical'], techniques: true, areas: false, notes: true } };
      ACTIVITIES.push(def);
    }
    draft.activities.forEach(function (a) { a.open = false; });
    var existing = draft.activities.filter(function (a) { return a.id === def.id; })[0];
    if (existing) existing.open = true;
    else { var entry = newActivityEntry(def); entry.open = true; draft.activities.push(entry); }
    draft.step = 'activities'; draft.dirty = true;
    toastEl.classList.remove('is-open');
    render();
    window.goTo('record');
    // With several activities the opened panel may sit well down the list;
    // a lone activity stays put so the stepper gives context.
    if (draft.activities.length > 1) scrollToOpenPanel(false);
  }

  /* ===========================================================================
     EVENTS
     ======================================================================== */
  // Clicks inside the flow, the footer and the confirmation screen
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-rc]');
    if (!el) return;
    var idx = +el.dataset.idx, a = draft.activities[idx];
    switch (el.dataset.rc) {
      case 'step': go(el.dataset.step); break;
      case 'next': go('participants'); break;
      case 'back': go('activities'); break;
      case 'cancel': cancel(); break;
      case 'submit': submit(); break;
      case 'add-activities': openPicker('activities'); break;
      case 'add-people': openPicker('people'); break;
      case 'toggle':
        draft.activities.forEach(function (o, i) { o.open = i === idx ? !o.open : false; });
        render();
        break;
      case 'delete': deleteActivity(idx); break;
      case 'menu':
        menu(defOf(a.id).name, [
          { icon: 'fa-eraser', label: 'Clear form', onPick: function () {
              var fresh = newActivityEntry(defOf(a.id)); fresh.open = true;
              draft.activities[idx] = fresh; stopStream(); render(); } },
          { icon: 'fa-trash-can', label: 'Delete activity', danger: true, onPick: function () { deleteActivity(idx); } }
        ]);
        break;
      case 'techniques': openTechniques(idx); break;
      case 'mic':
        toast('Dictation would fill this field. Use VoiceComplete to fill the whole form.');
        break;
      case 'voice-start': voiceStart(idx); break;
      case 'voice-pause': voicePause(idx); break;
      case 'voice-analyze': voiceAnalyze(idx); break;
      case 'voice-restart': voiceRestart(idx); break;
      case 'voice-edit': a.voice.editing = true; render(); break;
      case 'person':
        draft.expandedPerson = draft.expandedPerson === el.dataset.pid ? null : el.dataset.pid;
        render();
        break;
      case 'remove-person':
        draft.people = draft.people.filter(function (p) { return p.id !== el.dataset.pid; });
        draft.expandedPerson = null; draft.dirty = true; render();
        break;
      case 'people-menu':
        menu('Participants', [
          { icon: 'fa-user-plus', label: 'Add participants', onPick: function () { openPicker('people'); } },
          { icon: 'fa-users-slash', label: 'Delete all participants', danger: true, onPick: function () {
              dialog('Delete all participants?', 'Everyone on this list will be removed. Activities are kept.',
                [{ label: 'Keep them' }, { label: 'Delete all', danger: true, onPick: function () { draft.people = []; draft.dirty = true; render(); } }]); } }
        ]);
        break;
      case 'done-more':
        window.goTo('record');
        break;
      case 'done-same':
        draft = freshDraft();
        draft.people = lastSubmission.people.map(function (id) { return { id: id, except: [] }; });
        draft.dirty = true;
        render();
        window.goTo('record');
        break;
    }
  });

  function deleteActivity(idx) {
    var a = draft.activities[idx];
    draft.activities.splice(idx, 1);
    draft.people.forEach(function (p) { p.except = p.except.filter(function (id) { return id !== a.id; }); });
    if (draft.activities.length && !draft.activities.some(function (o) { return o.open; })) draft.activities[Math.min(idx, draft.activities.length - 1)].open = true;
    stopStream(); draft.dirty = true; render();
  }

  // Form inputs update state in place (no re-render, so focus is kept)
  body.addEventListener('input', onField);
  body.addEventListener('change', onField);
  function onField(e) {
    var el = e.target, f = el.dataset.field;
    if (!f) return;
    draft.dirty = true;
    if (f === 'took') {
      var p = draft.people.filter(function (x) { return x.id === el.dataset.pid; })[0];
      var pos = p.except.indexOf(el.dataset.aid);
      if (el.checked && pos > -1) p.except.splice(pos, 1);
      if (!el.checked && pos === -1) p.except.push(el.dataset.aid);
      if (e.type === 'change') render();
      return;
    }
    var a = draft.activities[+el.dataset.idx];
    if (!a) return;
    if (f === 'objective') {
      var i = +el.dataset.i, at = a.objectives.indexOf(i);
      if (el.checked && at === -1) a.objectives.push(i);
      if (!el.checked && at > -1) a.objectives.splice(at, 1);
      if (e.type === 'change') refreshPanelHead(+el.dataset.idx);
      return;
    }
    if (f === 'applyDate' || f === 'applyInstructor') {
      a[f] = el.checked;
      if (el.checked) propagate(a, f === 'applyDate' ? ['date', 'time'] : ['instructor']);
      return;
    }
    if (f === 'voiceText') { a.voice.text = el.value; return; }
    a[f] = el.value;
    if (f === 'instructor') el.classList.toggle('is-placeholder', !el.value);
    if ((f === 'date' || f === 'time') && a.applyDate) propagate(a, ['date', 'time']);
    if (f === 'instructor' && a.applyInstructor) propagate(a, ['instructor']);
    if (e.type === 'change') refreshPanelHead(+el.dataset.idx);
  }
  /* Update just the filled-check on the open panel's header without re-rendering the form */
  function refreshPanelHead(idx) {
    var head = body.querySelector('.rc-panel.is-open .rc-panel__head');
    if (!head) return;
    var filled = isFilled(draft.activities[idx]);
    head.parentNode.classList.toggle('is-filled', filled);
    var check = head.querySelector('.rc-panel__check');
    if (filled && !check) head.querySelector('.rc-panel__name').insertAdjacentHTML('afterend', '<i class="fa-solid fa-check rc-panel__check" aria-label="Filled in"></i>');
    if (!filled && check) check.remove();
  }

  // Picker
  pickerEl.addEventListener('click', function (e) {
    var el = e.target.closest('[data-pk]');
    if (!el || !picker) return;
    switch (el.dataset.pk) {
      case 'close': closePicker(); break;
      case 'save': savePicker(); break;
      case 'filters': picker.pendingFilters = JSON.parse(JSON.stringify(picker.filters)); picker.openFilter = null; picker.view = 'filters'; renderPicker(); break;
      case 'pf-open': picker.openFilter = picker.openFilter === el.dataset.f ? null : el.dataset.f; renderPicker(); break;
      case 'filters-cancel': picker.view = 'list'; renderPicker(); break;
      case 'filters-apply': picker.filters = picker.pendingFilters; picker.view = 'list'; renderPicker(); break;
      case 'pf-clear': picker.pendingFilters = {}; picker.openFilter = null; renderPicker(); break;
      case 'sort': picker.sort = picker.sort === 'desc' ? 'asc' : 'desc'; renderPicker(); break;
      case 'lu-toggle': picker.lastUsedOpen = !picker.lastUsedOpen; renderPicker(); break;
      case 'lu-all':
        var lu = lastUsedVisible(), on = lastUsedLabel(lu) === 'Select all';
        lu.forEach(function (x) { picker.selected[x.id] = on; });
        renderPicker();
        break;
      case 'pf':
        var list = picker.pendingFilters[el.dataset.f] || (picker.pendingFilters[el.dataset.f] = []);
        var at = list.indexOf(el.dataset.v);
        if (at > -1) list.splice(at, 1); else list.push(el.dataset.v);
        renderPicker();
        break;
      case 'chip-x':
        picker.filters[el.dataset.f] = (picker.filters[el.dataset.f] || []).filter(function (v) { return v !== el.dataset.v; });
        renderPicker();
        break;
      case 'view-selected': picker.view = 'selected'; renderPicker(); break;
      case 'back-to-list': picker.view = 'list'; renderPicker(); break;
      case 'clear-all': picker.selected = {}; renderPicker(); break;
      case 'unselect': delete picker.selected[el.dataset.id]; renderPicker(); break;
    }
  });
  pickerEl.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.pk === 'check') {
      picker.selected[el.dataset.id] = el.checked;
      el.closest('.rc-pickrow').classList.toggle('is-on', el.checked);
      var n = Object.keys(picker.selected).filter(function (k) { return picker.selected[k]; }).length;
      var vs = pickerEl.querySelector('[data-pk="view-selected"]');
      if (vs) { vs.textContent = 'View Selected (' + n + ')'; vs.disabled = !n; }
      var lu = pickerEl.querySelector('[data-pk="lu-all"]');
      if (lu) lu.textContent = lastUsedLabel(lastUsedVisible());
    }
  });
  pickerEl.addEventListener('input', function (e) {
    if (e.target.dataset.pk === 'query') {
      picker.query = e.target.value;
      // re-render the list only, so the search box keeps focus and caret
      var listEl = pickerEl.querySelector('.rc-picker__list');
      var caret = e.target.selectionStart;
      renderPicker();
      var input = pickerEl.querySelector('[data-pk="query"]');
      input.focus(); input.setSelectionRange(caret, caret);
    }
  });

  /* ===========================================================================
     PUBLIC — Quick Links + Design Toolbox flow map
     ======================================================================== */
  /* Flow-map states drive real screen states so the thumbnails are live. */
  function applyState(id) {
    stopStream();
    var d = function () { draft = freshDraft(); draft.activities = ['district', 'ladders', 'hydrant'].map(function (k) { return newActivityEntry(defOf(k)); }); draft.dirty = true; };
    switch (id) {
      case 'record':               draft = freshDraft(); render(); window.goTo('record'); break;
      case 'record-form':          d(); draft.activities[0].open = true; render(); window.goTo('record'); break;
      case 'record-voice':         d(); draft.activities[0].open = true; draft.activities[0].voice = { status: 'listening', text: TRANSCRIPTS.district.text.slice(0, 140), editing: false }; render(); window.goTo('record'); break;
      case 'record-filled':        d(); draft.activities[0].open = true; render(); window.goTo('record'); a0fill(); break;
      case 'record-picker':        d(); render(); window.goTo('record'); openPicker('activities'); break;
      case 'record-participants':  d(); draft.step = 'participants'; draft.people = ['p01', 'p02', 'p03', 'p28'].map(function (id) { return { id: id, except: [] }; }); draft.people[1].except = ['hydrant']; render(); window.goTo('record'); break;
      case 'record-done':          lastSubmission = { activities: ['District Familiarization', 'Throwing Ladders', 'Hydrant Training'], people: ['p01', 'p02', 'p03', 'p28'], completions: 11, participants: 4 }; syncLastUsed(); renderDone(); window.goTo('record-done'); break;
      default: window.goTo(id);
    }
    function a0fill() {
      var a = draft.activities[0], f = TRANSCRIPTS.district.fills;
      a.voice = { status: 'done', text: TRANSCRIPTS.district.text, editing: false };
      a.duration = f.duration; a.instructor = f.instructor; a.objectives = f.objectives.slice(); a.techniques = f.techniques.slice(); a.areas = f.areas; a.notes = f.notes;
      render();
    }
  }

  window.RC = { openWith: openWith, applyState: applyState, leave: leave, cancel: cancel };

  /* ===========================================================================
     INIT
     ======================================================================== */
  render();
})();
