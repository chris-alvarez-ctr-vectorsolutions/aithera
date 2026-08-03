/* ===========================================================================
   DATA
   ======================================================================== */

/* --- Area 1: admin navigation ------------------------------------------- */
const NAV = [
  { section: 'Overview' },
  { id:'dashboard', label:'Dashboard', icon:'fa-gauge-high', route:'home' },

  { section: 'Manage' },
  { id:'organization', label:'Organization', icon:'fa-sitemap', children:[
    'Users','Teams','Departments','Sites','Regions','Groups','Places','Contacts' ] },
  { id:'training', label:'Training Import And Creation', icon:'fa-file-import', children:[
    { id:'ti-content', label:'Content Wizard', route:'wizard' },
    'Quizzes','Surveys','Tasklists','Signatures','Classes' ] },
  { id:'files', label:'Files', icon:'fa-folder', children:['Repositories'] },
  { id:'activities', label:'Activities', icon:'fa-layer-group', children:['Activities'] },
  { id:'qualifications', label:'Qualifications', icon:'fa-medal', children:[
    'Requirements','Qualifications','Copy Qualifications' ] },
  { id:'assignments', label:'Assignments', icon:'fa-user-plus', children:[
    'Assign Training Wizard','Assignments' ] },
  { id:'electives', label:'Electives', icon:'fa-star', children:[
    'Elective Categories','Offer Electives','Approve Electives','Electives' ] },
  { id:'authorizations', label:'Authorizations', icon:'fa-unlock', children:[
    'Authorize Training','Authorizations' ] },
  { id:'tracking', label:'Tracking And Completions', icon:'fa-clipboard-check', children:[
    'Credit Wizard','Import Completions','Track Tasklist Completion','Take Class Attendance',
    'Approve Signatures','Completion Records' ] },

  { section: 'Insights' },
  { id:'reports', label:'Reports', icon:'fa-chart-column', children:[
    'My Recents','Frequently Used','All Reports','Scheduled Reports' ] },

  { section: 'Configuration' },
  { id:'security', label:'Security', icon:'fa-user-shield', children:[
    'Roles','Copy Roles','Assign Roles','Role Assignments' ] },
  { id:'system', label:'System', icon:'fa-gear', children:[
    'Jobs','Configuration','Notifications','User Connections' ] },
];

/* --- Area 2: location tree (the existing nest view) --------------------- */
const LOCATION_TREE = [
  { id:'uat', text:'UAT Environment', subtitle:'Organization', children:[
    { id:'r-ne', text:'NE Region', subtitle:'Region', children:[
      { id:'s-boston', text:'Boston Site', subtitle:'Site', children:[
        { id:'d-ops', text:'Operations', subtitle:'Department' },
        { id:'d-safety', text:'Safety and Compliance', subtitle:'Department' },
      ]},
      { id:'s-providence', text:'Providence Site', subtitle:'Site', children:[
        { id:'d-prov-ops', text:'Operations', subtitle:'Department' },
      ]},
    ]},
    { id:'r-sw', text:'SW Region', subtitle:'Region', children:[
      { id:'s-dallas', text:'Dallas Site', subtitle:'Site', children:[
        { id:'d-eng', text:'Engineering', subtitle:'Department' },
      ]},
      { id:'s-houston', text:'Houston Site', subtitle:'Site' },
    ]},
    { id:'r-training', text:'Training Center', subtitle:'Region', children:[
      { id:'s-lab', text:'Simulation Lab', subtitle:'Site' },
    ]},
  ]},
];
const HOME_LOC = 'uat';

/* --- Area 3 + 4: my training ------------------------------------------- */
const TYPES = {
  tasklist: { icon:'fa-list-check',  thumb:'t-tasklist', label:'Tasklist' },
  video:    { icon:'fa-video',       thumb:'t-video',    label:'Video' },
  doc:      { icon:'fa-file-lines',  thumb:'t-doc',      label:'Document' },
  cbt:      { icon:'fa-display',     thumb:'t-cbt',      label:'Course' },
  quiz:     { icon:'fa-circle-question', thumb:'t-quiz', label:'Quiz' },
};
const STATUS = {
  inprogress: { cls:'pill-progress',   label:'In progress' },
  incomplete: { cls:'pill-incomplete', label:'Incomplete' },
  overdue:    { cls:'pill-overdue',    label:'Overdue' },
  complete:   { cls:'pill-complete',   label:'Complete' },
};

const TRAINING = {
  name: 'My assigned training (sorted by qualification)',
  progress: { done:0, total:5, unit:'qualifications' },
  quals: [
    { id:'q-indiv', name:'Individually Assigned Activities', open:false,
      progress:{ done:2, total:3, unit:'activities' }, reqs:[
      { id:'r-indiv', name:'Assigned directly to you', open:true, acts:[
        { name:'Hazard Communication Refresher', type:'cbt', status:'complete', dur:'20 mins', spent:'20 mins', due:'' },
        { name:'Emergency Action Plan Review', type:'doc', status:'complete', dur:'10 mins', spent:'11 mins', due:'' },
        { name:'Annual Policy Signature', type:'doc', status:'incomplete', dur:'5 mins', spent:'', due:'12-31-2026' },
      ]},
    ]},
    { id:'q-nhs', name:'New Hire Safety Qualification', open:true,
      progress:{ done:0, total:2, unit:'requirements' }, reqs:[
      { id:'r-loto', name:'LOTO Requirement', open:true,
        progress:{ done:0, total:2, unit:'activities' },
        notice:'Complete any 2 of the activities below.', acts:[
        { name:'LOTO Tasklist Affected Employees', type:'tasklist', status:'inprogress', dur:'15 mins', spent:'4 mins', due:'' },
        { name:'LOTO Tasklist Authorized Employees', type:'tasklist', status:'incomplete', dur:'15 mins', spent:'', due:'' },
        { name:'02 Phil Knight Lockout-Tagout Video', type:'video', status:'incomplete', dur:'5 mins', spent:'', due:'' },
      ]},
      { id:'r-ppe', name:'PPE Requirement', open:true,
        progress:{ done:0, total:3, unit:'activities' }, acts:[
        { name:'01 Phil Knight Personal Protective Equipment Policy', type:'doc', status:'incomplete', dur:'30 mins', spent:'', due:'' },
        { name:'03 Phil Knight PPE CBT', type:'cbt', status:'incomplete', dur:'15 mins', spent:'', due:'' },
        { name:'PPE Quiz', type:'quiz', status:'incomplete', dur:'10 mins', spent:'', due:'' },
      ]},
    ]},
    { id:'q-hse', name:'RV - HSE Microlearning', open:true,
      progress:{ done:0, total:14, unit:'requirements' }, reqs:[
      { id:'r-cranes', name:'RV - HSEML - Cranes and Rigging', open:true,
        progress:{ done:0, total:4, unit:'activities' }, acts:[
        { name:'Microlearning Course - Inspecting of Rigging Components', type:'cbt', status:'overdue', dur:'6 mins', spent:'', due:'04-08-2026' },
        { name:'Microlearning Course - Overhead Crane Safe Loading', type:'cbt', status:'overdue', dur:'8 mins', spent:'', due:'04-08-2026' },
        { name:'Microlearning Course - Safety Inspections for Overhead Cranes', type:'cbt', status:'overdue', dur:'8 mins', spent:'', due:'04-08-2026' },
        { name:'Safety Case Study - Inspecting Rigging Components', type:'cbt', status:'overdue', dur:'5 mins', spent:'', due:'04-08-2026' },
      ]},
      { id:'r-driving', name:'RV - HSEML - Driving Safety', open:false,
        progress:{ done:0, total:6, unit:'activities' }, acts:[
        { name:'Microlearning Course - Defensive Driving Basics', type:'cbt', status:'incomplete', dur:'7 mins', spent:'', due:'06-30-2026' },
        { name:'Microlearning Course - Distracted Driving', type:'cbt', status:'incomplete', dur:'6 mins', spent:'', due:'06-30-2026' },
      ]},
    ]},
  ],
};

const VIEW_BY = [
  { id:'qual',   icon:'fa-medal',            label:'Qualification' },
  { id:'alpha',  icon:'fa-arrow-down-a-z',   label:'Alphabetical list' },
  { id:'status', icon:'fa-circle-half-stroke', label:'Completion status' },
  { id:'due',    icon:'fa-calendar-days',    label:'Due date' },
  { id:'type',   icon:'fa-shapes',           label:'Activity type' },
];

/* --- Area 5: catalog ---------------------------------------------------- */
const CATALOG = [
  { name:'OSHA 10-Hour Construction Program', code:'CS-OSHA10-CON', type:'video', isNew:true,  author:'Vector Solutions', mobile:true,  price:'Free elective', dur:'10 hrs', status:'Available' },
  { name:'Krista Quiz Test', code:'QZ-1042', type:'quiz', isNew:false, author:'K. Reynolds', mobile:true,  price:'Free elective', dur:'15 mins', status:'Available' },
  { name:'OSHA 10 Hour Construction Program', code:'CS-OSHA10-LEG', type:'video', isNew:false, author:'Vector Solutions', mobile:false, price:'Free elective', dur:'10 hrs', status:'Retiring' },
  { name:'OSHA 10-Hour General Industry Program', code:'CS-OSHA10-GI', type:'video', isNew:false, author:'Vector Solutions', mobile:true,  price:'Free elective', dur:'10 hrs', status:'Available' },
  { name:'OSHA 10-Hour Road Construction', code:'CS-OSHA10-RC', type:'video', isNew:false, author:'Vector Solutions', mobile:true,  price:'Free elective', dur:'10 hrs 15 mins', status:'Available' },
  { name:'OSHA 30 Hour Construction Program (CS-OSHA30-NFb)', code:'CS-OSHA30-NFb', type:'video', isNew:false, author:'Vector Solutions', mobile:true, price:'Free elective', dur:'30 hrs', status:'Enrolled' },
  { name:'OSHA Electrical General Requirements', code:'CS-OSHA-ELEC', type:'video', isNew:false, author:'Vector Solutions', mobile:true,  price:'Free elective', dur:'31 mins', status:'Available' },
];

/* --- Area 6: wizard ---------------------------------------------------- */
const WZ_METHODS = [
  { id:'import', icon:'fa-file-import',  label:'Import', sub:'Bring in a SCORM, AICC or video package.' },
  { id:'create', icon:'fa-pen-to-square', label:'Create', sub:'Build new content inside Convergence.' },
  { id:'copy',   icon:'fa-copy',          label:'Copy',   sub:'Start from an existing activity.' },
];
const WZ_TYPES = [
  { id:'quiz',      icon:'fa-circle-check',  label:'Quiz',      sub:'Multiple choice, true or false, information slides.' },
  { id:'tasklist',  icon:'fa-list-ol',       label:'Tasklist',  sub:'A checklist completed on the job.' },
  { id:'class',     icon:'fa-calendar-days', label:'Class',     sub:'Instructor led sessions with rosters.' },
  { id:'event',     icon:'fa-clock',         label:'Event',     sub:'A one off scheduled activity.' },
  { id:'survey',    icon:'fa-clipboard-list',label:'Survey',    sub:'Collect feedback with no pass or fail.' },
  { id:'signature', icon:'fa-signature',     label:'Signature', sub:'Acknowledge a policy or document.' },
];

/* --- Area 7: home dashboard -------------------------------------------- */
/* Mirrors the legacy Home page: three progress rings, upcoming training,
   upcoming classes and the news feed. Counts are illustrative; the ring,
   label and empty-state treatments are what is being specified. Optional
   training keeps the legacy "no items" state so its corrected empty
   treatment is visible next to two populated rings. */
const HOME = {
  progress: [
    { id:'all',       label:'All training',       done:11, total:18,
      hint:'Everything assigned to you' },
    { id:'mandatory', label:'Mandatory training', done:9,  total:11,
      hint:'Required for your qualifications' },
    { id:'optional',  label:'Optional training',  empty:true,
      hint:'Nothing optional is assigned to you right now' },
  ],
  upcoming: [
    { name:'2023 NEC Changes - Branch Circuits', type:'video', due:'08/30/26' },
    { name:'Fall Protection Refresher',          type:'cbt',   due:'09/12/26' },
    { name:'Confined Space Entry Quiz',          type:'quiz',  due:'09/20/26' },
  ],
  classes: [],
  news: [
    { date:'07/30/26', title:'The Next Evolution of Vector Scheduling: Connecting Training to the Field',
      excerpt:'Scheduling now reads straight from the training record, so crews are only rostered onto work they are qualified for.' },
    { date:'07/24/26', title:'What Actually Supports Digital Signatures and Records',
      excerpt:'For emergency telecommunicators, having comprehensive knowledge of what a signature has to capture matters more than the format.' },
    { date:'07/23/26', title:'DOT Compliance: Requirements, Training, and Penalties',
      excerpt:'A walk through the requirements that apply to drivers, the training that satisfies them, and what non-compliance costs.' },
    { date:'07/23/26', title:'What Is the ROI of EHS Software? How to Calculate It',
      excerpt:'Incident cost, time recovered and audit preparation are the three inputs most teams already have to hand.' },
  ],
};
