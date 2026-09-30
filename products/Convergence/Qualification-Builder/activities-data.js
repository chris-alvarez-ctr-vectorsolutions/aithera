/* ============================================================
 * Convergence activity records: shared mock data.
 *
 * One list feeds every activity page so the two ways into the editor
 * (Activities grid, Quizzes grid) open the same record:
 *   Manage-Activities.html   all activities (AG Grid)
 *   Manage-Quizzes.html      Training Import And Creation > Quizzes
 *   Edit-Activity.html       the unified editor (Details / Content / Versions)
 *   Preview-Activity.html    read-only preview of a version
 *
 * Requires activity-types.js to be loaded first.
 *
 * Fields on every record (the mock's "data model"):
 *   id             url-safe slug; the editor is opened with ?id=<id>
 *   name, desc, type (a key from ACTIVITY_TYPES), version ("v2.1")
 *   status         Active | Inactive  (assignability; unchanged from the grid)
 *   publishStatus  Draft | Published  (NEW, separate from status: whether the
 *                  current content has been published to learners. The real
 *                  app has a distinct Save vs Publish step on content items,
 *                  which is what this maps to. Confirm with engineering.)
 *   location       org node the activity lives in (permissions)
 *   requirement    the requirement it belongs to (drives quals + delete impact)
 *   source         Custom | Vector Solutions | Learning Studio (derived)
 *   lsEditable     whether Learning Studio can customize it. Per the Learning Studio PRD:
 *                  Vector Solutions courses (except licensed third-party ones) and courses
 *                  already customized in Learning Studio, yes; uploaded SCORM packages, no
 *                  (Learning Studio customizes Vector's library, it does not author net-new).
 *   lsReason       why not, for the dash tooltip when lsEditable is false
 *   duration (min), mobile, displayWidth, displayHeight, file, license,
 *   createdOn, recompleteUsers, attachments[], attributes[{key,value}],
 *   versions[{version, notes, createdOn, author}]
 *   content        type-specific: for Quiz, { competencies:[{id,name,questions:[]}] }
 *
 * Edits made in the editor are kept in sessionStorage for the tab session so
 * a Save shows up in the grids on return. Nothing is persisted beyond that.
 * ============================================================ */
(function () {
  const ACTS = [
    // Energy Isolation Fundamentals (3)
    { name:'Lockout/Tagout Basics',               desc:'Core training on energy isolation and tagout procedures',      type:'CBT',       version:'v2.1', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Energy Isolation Fundamentals' },
    { name:'LOTO Knowledge Check',                desc:'Knowledge assessment for lockout/tagout fundamentals',         type:'Quiz',      version:'v1.4', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Energy Isolation Fundamentals' },
    { name:'Energy Isolation Field Verification', desc:'Verify zero-energy state in the field before service',         type:'Tasklist',  version:'v1.0', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Energy Isolation Fundamentals' },
    // Lockout Device Application (3)
    { name:'Lockout Device Selection',            desc:'Choosing the correct lock and tag for each energy source',     type:'CBT',       version:'v1.2', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Lockout Device Application' },
    { name:'Device Application Demonstration',    desc:'Supervised demonstration of applying lockout devices',          type:'Tasklist',  version:'v1.0', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Lockout Device Application' },
    { name:'Lockout Device Quiz',                 desc:'Assessment on lockout device selection and use',               type:'Quiz',      version:'v1.1', status:'Active',   location:'Safety > Lockout/Tagout',         requirement:'Lockout Device Application' },
    // Confined Space Atmospheric Testing (2)
    { name:'Atmospheric Testing Procedure',       desc:'Gas monitoring, sampling order, and entry thresholds',         type:'CBT',       version:'v3.0', status:'Active',   location:'Safety > Confined Space',         requirement:'Confined Space Atmospheric Testing' },
    { name:'Gas Meter Calibration',               desc:'Calibrate and bump-test the multi-gas meter before entry',     type:'Tasklist',  version:'v1.3', status:'Active',   location:'Safety > Confined Space',         requirement:'Confined Space Atmospheric Testing' },
    // PPE Selection & Inspection (2)
    { name:'PPE Selection Fundamentals',          desc:'Choosing the right protective equipment for the hazard',       type:'CBT',       version:'v2.0', status:'Active',   location:'Safety > PPE',                    requirement:'PPE Selection & Inspection' },
    { name:'PPE Inspection Checklist',            desc:'Pre-use inspection of personal protective equipment',          type:'Tasklist',  version:'v1.5', status:'Active',   location:'Safety > PPE',                    requirement:'PPE Selection & Inspection' },
    // Forklift Pre-Operation Inspection (3)
    { name:'Forklift Daily Inspection',           desc:'Pre-shift inspection checklist for powered industrial trucks',  type:'Tasklist',  version:'v2.2', status:'Active',   location:'Operations > Forklift',           requirement:'Forklift Pre-Operation Inspection' },
    { name:'Forklift Safety Course',              desc:'Operating fundamentals and stability for forklifts',           type:'CBT',       version:'v4.1', status:'Active',   location:'Operations > Forklift',           requirement:'Forklift Pre-Operation Inspection' },
    { name:'Forklift Operation Quiz',             desc:'Assessment on safe forklift operation',                        type:'Quiz',      version:'v1.0', status:'Inactive', location:'Operations > Forklift',           requirement:'Forklift Pre-Operation Inspection' },
    // Fire Watch Procedures (1)
    { name:'Fire Watch Responsibilities',         desc:'Instructor-led walkthrough of fire-watch and permit steps',   type:'Classroom', version:'v1.1', status:'Inactive', location:'Safety > Hot Work',               requirement:'Fire Watch Procedures' },
    // Respirator Fit Test (2)
    { name:'Respirator Fit Test Record',          desc:'Capture and acknowledge respirator fit test results',          type:'Signature', version:'v2.0', status:'Active',   location:'Safety > Respiratory Protection', requirement:'Respirator Fit Test' },
    { name:'Respirator Selection Guide',          desc:'Reference for selecting the appropriate respirator',           type:'Document',  version:'v1.3', status:'Active',   location:'Safety > Respiratory Protection', requirement:'Respirator Fit Test' },
    // Rigging & Load Charts (3)
    { name:'Rigging Load Chart Reading',          desc:'Reading load charts and selecting rigging hardware',           type:'CBT',       version:'v2.3', status:'Active',   location:'Operations > Rigging',            requirement:'Rigging & Load Charts' },
    { name:'Sling & Hardware Inspection',         desc:'Inspect slings, shackles, and hardware before a lift',         type:'Tasklist',  version:'v1.2', status:'Active',   location:'Operations > Rigging',            requirement:'Rigging & Load Charts' },
    { name:'Rigging Safety Quiz',                 desc:'Assessment on rigging selection and load handling',            type:'Quiz',      version:'v1.0', status:'Active',   location:'Operations > Rigging',            requirement:'Rigging & Load Charts' },
    // Additional activity types: Event, Survey, Video
    { name:'Confined Space Rescue Drill',         desc:'Scheduled hands-on rescue drill for permit-required entries',      type:'Event',     version:'v1.0', status:'Active',   location:'Safety > Confined Space',         requirement:'Confined Space Atmospheric Testing' },
    { name:'PPE Program Feedback Survey',         desc:'Collect worker feedback on protective equipment fit and comfort',  type:'Survey',    version:'v1.2', status:'Active',   location:'Safety > PPE',                    requirement:'PPE Selection & Inspection' },
    { name:'Forklift Stability Overview',         desc:'Short video on load stability and the stability triangle',         type:'Video',     version:'v2.0', status:'Active',   location:'Operations > Forklift',           requirement:'Forklift Pre-Operation Inspection' },
    // A quiz that has never been published (Draft, custom): shows the draft path end to end
    { name:'Hot Work Permit Quiz',                desc:'Draft assessment covering permit steps and fire-watch duties',     type:'Quiz',      version:'v1.0', status:'Active',   location:'Safety > Hot Work',               requirement:'Fire Watch Procedures' },
    // An uploaded SCORM package (Custom CBT): configurable, but not editable in Learning Studio
    { name:'Crane Hand Signals Course',           desc:'Uploaded SCORM package covering the standard crane hand signals',  type:'CBT',       version:'v1.0', status:'Active',   location:'Operations > Rigging',            requirement:'Rigging & Load Charts' },
  ];

  /* Derived content-management columns (prototype values, varied across rows) */
  const ACT_SIZES = ['8 KB','512 KB','1.2 MB','3.4 MB','680 KB','12 MB','2.1 MB','46 KB','5.8 MB','920 KB'];
  /* Repository = the saved folder / collection in the content library where the file lives (a storage location).
     It is NOT the content source and NOT the tab the activity appears under. */
  const REPO_FOLDERS = ['Safety Training Library','Compliance and OSHA','Operations Library','Onboarding and Orientation','Equipment Training','Field Procedures'];
  /* Which qualifications include each requirement, so an activity's delete impact can list the qualifications it belongs to. */
  const REQ_TO_QUALS = {
    'Energy Isolation Fundamentals':      ['Lockout/Tagout Authorization', 'AC Motor Controller Operation'],
    'Lockout Device Application':         ['Lockout/Tagout Authorization'],
    'Confined Space Atmospheric Testing': ['Confined Space Entry'],
    'PPE Selection & Inspection':         ['OSHA 30-Hour General Industry', 'Fall Protection Competency'],
    'Forklift Pre-Operation Inspection':  ['Forklift Operator Certification'],
    'Fire Watch Procedures':              ['Hot Work Permit Authorization'],
    'Respirator Fit Test':                ['Respirator Fit & Use'],
    'Rigging & Load Charts':              ['Crane & Hoist Operation'],
  };
  /* Content source drives the tabs (All / Custom / Vector Solutions / Learning Studio):
     - Vector Solutions = accredited, pre-built content from Vector Solutions
     - Learning Studio   = content created or edited in Learning Studio
     - Custom            = everything the organization built itself */
  const LS_IDX       = new Set([8, 11, 16]);   // created/edited in Learning Studio (all CBT)
  const LS_DRAFT_IDX = new Set([8, 16]);       // Learning Studio content still being authored (not yet published)
  const VS_IDX       = new Set([0, 3, 6, 15]); // pre-built, accredited Vector Solutions content
  const LS_EXCLUDED_IDX = new Set([6]);        // licensed third-party course: excluded from Learning Studio customization
  /* Draft rows beyond the Learning Studio ones: a quiz with unpublished edits, a survey being
     rewritten, and the never-published Hot Work quiz. Everything else is Published. */
  const DRAFT_IDX    = new Set([12, 20, 22]);
  const AUTHORS      = ['Andy Xia', 'Clare Epstein', 'Misa Escalera', 'Brandon Orlando'];

  const isCbt = a => a.type === 'CBT';
  const slug  = s => String(s || 'activity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /* Deterministic dates so the mock is stable between reloads. */
  function isoDate(y, m, d, h, min){ return new Date(y, m - 1, d, h, min).toISOString(); }
  function genVersions(a, i){
    // "v2.1" becomes 1.0, 2.0, 2.1 with dates stepping forward, newest last.
    const m = /v(\d+)\.(\d+)/.exec(a.version || 'v1.0');
    const major = m ? +m[1] : 1, minor = m ? +m[2] : 0;
    const list = [];
    for (let j = 1; j <= major; j++) list.push(j + '.0');
    for (let j = 1; j <= minor; j++) list.push(major + '.' + j);
    return list.map((v, k) => ({
      version: v,
      notes: k === 0 ? 'Initial publish' : (k === list.length - 1 ? 'Updated wording and corrected answer keys' : 'Content refresh'),
      createdOn: isoDate(2025, 3 + ((i + k) % 9), 1 + ((i * 3 + k * 11) % 27), 9 + (k % 8), (i * 7) % 60),
      author: AUTHORS[(i + k) % AUTHORS.length],
    }));
  }

  ACTS.forEach((a, i) => {
    a.id     = slug(a.name);
    a.source = LS_IDX.has(i) ? 'Learning Studio' : (VS_IDX.has(i) ? 'Vector Solutions' : 'Custom');
    if (a.source === 'Vector Solutions') {
      a.fileType    = isCbt(a) ? 'SCORM' : 'VSP Content';
      a.licenseType = 'Commercial';
    } else if (a.source === 'Learning Studio') {
      a.fileType    = 'VSP Content';
      a.licenseType = 'None';
    } else {
      a.fileType    = 'VSP Content';
      a.licenseType = 'None';
    }
    /* Publish status is its own field now. Learning Studio drafts used to be encoded as
       status:'Draft'; they keep status Active and carry publishStatus:'Draft' instead. */
    a.publishStatus = (LS_DRAFT_IDX.has(i) || DRAFT_IDX.has(i)) ? 'Draft' : 'Published';
    a.repository   = REPO_FOLDERS[i % REPO_FOLDERS.length];
    a.configurable = isCbt(a) && a.publishStatus === 'Published';   // CBT only (THE RULE); a Learning Studio draft not yet released to Convergence cannot be configured
    /* Learning Studio eligibility (CBT only). Not every CBT qualifies: see the field notes above. */
    if (!isCbt(a))                         { a.lsEditable = false; a.lsReason = 'Only CBT activities can be edited in Learning Studio'; }
    else if (a.source === 'Learning Studio') { a.lsEditable = true;  a.lsReason = ''; }
    else if (a.source === 'Vector Solutions') {
      a.lsEditable = !LS_EXCLUDED_IDX.has(i);
      a.lsReason   = a.lsEditable ? '' : 'Licensed third-party course: excluded from Learning Studio customization';
    } else                                 { a.lsEditable = false; a.lsReason = 'Uploaded course package: Learning Studio customizes Vector courses only'; }
    a.editable     = (a.source !== 'Vector Solutions');  // accredited content opens read-only
    a.updateStatus = (i % 6 === 1) ? 'New' : 'Current';
    a.size         = ACT_SIZES[i % ACT_SIZES.length];
    a.quals        = REQ_TO_QUALS[a.requirement] || [];
    a.learners     = a.quals.length ? (40 + ((i * 7) % 9) * 55) : 0;

    /* Editor (Details tab) fields */
    a.duration       = [15, 10, 20, 12, 25, 8, 30, 15, 18, 10][i % 10];
    a.mobile         = (i % 4) !== 3;
    a.displayWidth   = a.type === 'Quiz' ? 800 : 640;
    a.displayHeight  = a.type === 'Quiz' ? 600 : 480;
    a.file           = a.name + (isCbt(a) ? '.zip' : (a.type === 'Video' ? '.mp4' : (a.type === 'Document' ? '.pdf' : '')));
    a.license        = a.source === 'Vector Solutions' ? 'Public' : 'Private';   // read-only in the editor
    a.createdOn      = isoDate(2025, 1 + (i % 12), 1 + ((i * 5) % 27), 8 + (i % 9), (i * 13) % 60);
    a.updatedOn      = isoDate(2026, 1 + (i % 9), 1 + ((i * 7) % 27), 8 + (i % 9), (i * 17) % 60);
    a.recompleteUsers = a.quals.length ? [1, 12, 4, 37, 0, 8][i % 6] : 0;
    a.recomplete     = false;
    a.attachments    = (i % 5 === 1) ? [{ name: a.name.replace(/[^A-Za-z0-9]+/g, '-') + '-answer-key.pdf', version: '1.1', createdOn: a.createdOn, updatedOn: a.updatedOn }] : [];
    a.attributes     = (i % 3 === 1) ? [{ key: 'difficulty', value: 'Intermediate' }, { key: 'compliance', value: 'OSHA' }] : ((i % 3 === 2) ? [{ key: 'language', value: 'English' }] : []);
    a.externalId     = String(1234567890 + i * 7);
    a.sku            = 'ACT-' + String(10000 + i * 137);
    /* Never-published drafts have no version history yet. */
    a.versions       = (i === 22) ? [] : genVersions(a, i);
    a.content        = null;   // filled in below for quizzes
  });

  /* ─── Quiz content ───
     Questions live inside competencies (sections). A new quiz starts with one
     competency named "Quiz Questions". Question shapes:
       tf      { prompt, answer:true|false }
       single  { prompt, choices:[{text, correct}] }  exactly one correct
       multi   { prompt, choices:[{text, correct}] }  one or more correct
       info    { title, text, media:{ kind:'image'|'video'|'', url } }
       link    { prompt (label), url }
     Any tf/single/multi may carry source:'bank' + bankId when it was picked
     from the Vector Question Bank. */
  let qSeq = 0;
  const q = (type, fields) => Object.assign({ id: 'q' + (++qSeq), type }, fields);
  const comp = (name, questions) => ({ id: 'c' + (++qSeq), name, collapsed: false, questions });

  const QUIZ_CONTENT = {
    'loto-knowledge-check': { competencies: [
      comp('Energy Sources', [
        q('info',   { title: 'Before you start', text: 'This check covers the six energy sources and the order of the lockout procedure. Read each question carefully; some have more than one correct answer.', media: { kind: 'image', url: 'loto-overview.png' } }),
        q('tf',     { prompt: 'Stored energy such as a compressed spring or a raised load must be released or restrained before work begins.', answer: true }),
        q('single', { prompt: 'Which of these is NOT one of the recognized hazardous energy sources?', choices: [ { text: 'Pneumatic', correct: false }, { text: 'Thermal', correct: false }, { text: 'Acoustic', correct: true }, { text: 'Hydraulic', correct: false } ] }),
        q('multi',  { prompt: 'Select every step that must happen before a lock is applied.', choices: [ { text: 'Notify affected employees', correct: true }, { text: 'Shut down the equipment', correct: true }, { text: 'Remove the tag from the previous shift', correct: false }, { text: 'Isolate every energy source', correct: true } ] }),
      ]),
      comp('Lockout Procedure', [
        q('single', { prompt: 'Who is allowed to remove a lockout device?', choices: [ { text: 'Any supervisor on shift', correct: false }, { text: 'The authorized employee who applied it', correct: true }, { text: 'The first person to arrive at the machine', correct: false } ] }),
        q('tf',     { prompt: 'A tag alone provides the same level of protection as a lock.', answer: false }),
        q('link',   { prompt: 'OSHA 1910.147 control of hazardous energy (reference)', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147' }),
      ]),
    ] },
    'lockout-device-quiz': { competencies: [
      comp('Quiz Questions', [
        q('single', { prompt: 'Which device is used when a breaker has no built-in lockout point?', choices: [ { text: 'Circuit breaker lockout clip', correct: true }, { text: 'Valve cover', correct: false }, { text: 'Cable lockout', correct: false } ] }),
        q('tf',     { prompt: 'One lock and one tag are required for each energy isolation point.', answer: true }),
        q('multi',  { prompt: 'Which of these are acceptable lockout devices for a gate valve?', choices: [ { text: 'Adjustable gate valve cover', correct: true }, { text: 'Cable lockout', correct: true }, { text: 'Duct tape', correct: false } ] }),
      ]),
    ] },
    'forklift-operation-quiz': { competencies: [
      comp('Quiz Questions', [
        q('single', { prompt: 'Where should the load be carried while travelling?', choices: [ { text: 'Raised to eye level', correct: false }, { text: 'Low, tilted back', correct: true }, { text: 'Level with the mast fully extended', correct: false } ] }),
        q('tf',     { prompt: 'It is acceptable to carry a passenger on the forks for short distances.', answer: false }),
        q('info',   { title: 'Stability triangle', text: 'The three-point suspension of a forklift forms a triangle. Keeping the combined center of gravity inside it is what keeps the truck upright.', media: { kind: 'video', url: 'stability-triangle.mp4' } }),
      ]),
    ] },
    'rigging-safety-quiz': { competencies: [
      comp('Quiz Questions', [
        q('single', { prompt: 'As the sling angle decreases, the tension on each leg', choices: [ { text: 'Decreases', correct: false }, { text: 'Stays the same', correct: false }, { text: 'Increases', correct: true } ] }),
        q('tf',     { prompt: 'A shackle pin should be moused or secured when the load may rotate.', answer: true }),
      ]),
    ] },
    'hot-work-permit-quiz': { competencies: [
      comp('Quiz Questions', []),
    ] },
  };
  ACTS.forEach(a => { if (a.type === 'Quiz') a.content = QUIZ_CONTENT[a.id] || { competencies: [comp('Quiz Questions', [])] }; });

  /* ─── Vector Question Bank (pick existing questions into a quiz) ─── */
  window.QUESTION_BANK = [
    { id: 'vb-101', category: 'Lockout/Tagout', type: 'tf',     prompt: 'Group lockout requires every authorized employee to apply their own lock.', answer: true },
    { id: 'vb-102', category: 'Lockout/Tagout', type: 'single', prompt: 'What is the first step of a lockout procedure?', choices: [ { text: 'Apply the lock', correct: false }, { text: 'Prepare for shutdown: identify all energy sources', correct: true }, { text: 'Verify zero energy', correct: false } ] },
    { id: 'vb-103', category: 'Lockout/Tagout', type: 'multi',  prompt: 'Which of the following count as stored energy?', choices: [ { text: 'A charged capacitor', correct: true }, { text: 'A raised load', correct: true }, { text: 'An unplugged hand drill', correct: false }, { text: 'Pressure in a hydraulic line', correct: true } ] },
    { id: 'vb-201', category: 'PPE',            type: 'single', prompt: 'Which hard hat class protects against high-voltage contact?', choices: [ { text: 'Class C', correct: false }, { text: 'Class E', correct: true }, { text: 'Class G', correct: false } ] },
    { id: 'vb-202', category: 'PPE',            type: 'tf',     prompt: 'Safety glasses with side shields meet the eye protection requirement for grinding.', answer: false },
    { id: 'vb-301', category: 'Forklift',       type: 'single', prompt: 'How far should the forks be inserted under a pallet before lifting?', choices: [ { text: 'One quarter of the way', correct: false }, { text: 'At least two thirds of the load length', correct: true }, { text: 'Just past the first board', correct: false } ] },
    { id: 'vb-302', category: 'Forklift',       type: 'tf',     prompt: 'Sound the horn at every blind corner and intersection.', answer: true },
    { id: 'vb-401', category: 'Confined Space', type: 'multi',  prompt: 'Which conditions make a space permit-required?', choices: [ { text: 'A hazardous atmosphere', correct: true }, { text: 'An engulfment hazard', correct: true }, { text: 'A door that opens inward', correct: false }, { text: 'An internal configuration that could trap an entrant', correct: true } ] },
    { id: 'vb-402', category: 'Confined Space', type: 'single', prompt: 'In what order should the atmosphere be tested?', choices: [ { text: 'Oxygen, flammables, toxics', correct: true }, { text: 'Toxics, oxygen, flammables', correct: false }, { text: 'Flammables, toxics, oxygen', correct: false } ] },
    { id: 'vb-501', category: 'Rigging',        type: 'tf',     prompt: 'A sling with a broken wire must be removed from service.', answer: true },
    { id: 'vb-502', category: 'Hot Work',       type: 'single', prompt: 'How long must a fire watch continue after hot work is finished?', choices: [ { text: '10 minutes', correct: false }, { text: 'At least 30 minutes', correct: true }, { text: 'Until the end of the shift', correct: false } ] },
    { id: 'vb-503', category: 'Hot Work',       type: 'multi',  prompt: 'Before issuing a hot work permit, confirm that', choices: [ { text: 'Combustibles are moved at least 35 feet away or shielded', correct: true }, { text: 'A fire extinguisher is at hand', correct: true }, { text: 'The area has been repainted', correct: false } ] },
  ];

  /* ─── Session overrides: edits saved in the editor survive within the tab session ─── */
  const OVR_KEY = 'cv-activity-overrides';
  function loadOverrides(){ try { return JSON.parse(sessionStorage.getItem(OVR_KEY) || '{}'); } catch (e) { return {}; } }
  function saveOverrides(o){ try { sessionStorage.setItem(OVR_KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable: edits live for this page only */ } }
  (function applyOverrides(){
    const o = loadOverrides();
    Object.keys(o).forEach(id => {
      const idx = ACTS.findIndex(a => a.id === id);
      if (idx >= 0) ACTS[idx] = o[id];
      else if (o[id] && o[id].__new) ACTS.push(o[id]);
    });
  })();

  window.ACTIVITIES = ACTS;
  window.findActivity = id => ACTS.find(a => a.id === id) || null;
  /* Store an edited record (call after Save / Publish). */
  window.persistActivity = function (a) {
    const idx = ACTS.findIndex(x => x.id === a.id);
    if (idx >= 0) ACTS[idx] = a; else { a.__new = true; ACTS.push(a); }
    const o = loadOverrides(); o[a.id] = a; saveOverrides(o);
  };
  window.deleteActivityRecord = function (id) {
    const idx = ACTS.findIndex(x => x.id === id);
    if (idx >= 0) ACTS.splice(idx, 1);
    const o = loadOverrides(); delete o[id]; saveOverrides(o);
  };
  window.resetActivityOverrides = function () { try { sessionStorage.removeItem(OVR_KEY); } catch (e) {} };

  /* A fresh quiz record (Draft, one empty competency). Not stored until the editor saves it. */
  window.createQuiz = function (name, location) {
    const nm = name || 'Untitled Quiz';
    const rec = {
      id: slug(nm) + '-' + Date.now().toString(36), name: nm, desc: '', type: 'Quiz', version: 'v1.0', status: 'Active',
      publishStatus: 'Draft', location: location || 'Safety > General', requirement: '', source: 'Custom',
      fileType: 'VSP Content', licenseType: 'None', repository: REPO_FOLDERS[0], configurable: false, lsEditable: false,
      editable: true, updateStatus: 'Current', size: '8 KB', quals: [], learners: 0,
      duration: 10, mobile: true, displayWidth: 800, displayHeight: 600, file: nm, license: 'Private',
      createdOn: new Date().toISOString(), updatedOn: new Date().toISOString(), recompleteUsers: 0, recomplete: false,
      attachments: [], attributes: [], externalId: '', sku: '', versions: [],
      content: { competencies: [ { id: 'c-' + Date.now().toString(36), name: 'Quiz Questions', collapsed: false, questions: [] } ] },
      __new: true,
    };
    return rec;
  };

  /* Link to the unified editor. `tab` = details | content (the entry point decides: a type-specific grid
     opens content, Manage Activities opens details); `from` = the list to return to. The name/type/source/location
     params are kept for backward compatibility with links that predate ?id=. */
  window.editActivityHref = function (a, tab, from) {
    return 'Edit-Activity.html?id=' + encodeURIComponent(a.id) +
           '&name=' + encodeURIComponent(a.name) +
           '&source=' + encodeURIComponent(a.source || '') +
           '&type=' + encodeURIComponent(a.type || '') +
           '&location=' + encodeURIComponent(a.location || '') +
           (a.editable === false ? '&mode=view' : '') +
           (tab ? '&tab=' + encodeURIComponent(tab) : '') +
           (from ? '&from=' + encodeURIComponent(from) : '');
  };
  window.previewActivityHref = function (a, version) {
    return 'Preview-Activity.html?id=' + encodeURIComponent(a.id) + (version ? '&version=' + encodeURIComponent(version) : '');
  };
  /* Quiz helpers shared by the grids and the editor */
  window.quizCounts = function (a) {
    const comps = (a.content && a.content.competencies) || [];
    return { competencies: comps.length, questions: comps.reduce((n, c) => n + c.questions.length, 0) };
  };
})();
