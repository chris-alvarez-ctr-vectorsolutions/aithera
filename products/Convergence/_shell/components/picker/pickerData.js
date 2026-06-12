// Picker data + entity-type configurations
// Each entity type defines its columns, table renderers, and selected-card layout.

// ---------- Avatar color from name ----------
const avatarColors = [
  'var(--vwc-color-puerto-rico-500)',
  'var(--vwc-color-picton-blue-600)',
  'var(--vwc-color-vivid-violet-500)',
  'var(--vwc-color-ecstacy-500)',
  'var(--vwc-color-conifer-700)',
  'var(--vwc-color-cinnabar-500)',
];
function avatarColor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

// ---------- Helpers ----------
const ORDERS = ['Any Order', 'Specific Order'];
const COMP = ['All Items', '1 of 3', '2 of 4', '9 of 10', '3 of 5', 'All Items', 'All Items'];

function gen(seed, list) {
  // deterministic-ish pseudo-random
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

// ---------- Requirements ----------
const REQUIREMENT_NAMES = [
  'Architectural Design Software Proficiency',
  'Blueprint Reading and Interpretation',
  'Construction Safety Certification',
  'Factory Floor Management',
  'Industrial Equipment Operation',
  'Industrial Hygiene Practices',
  'Machinery Maintenance and Repair',
  'Occupational Health and Safety',
  'Structural Engineering Basics',
  'Welding and Metal Fabrication',
  'Confined Space Entry Procedures',
  'Crane and Rigging Operations',
  'Electrical Lockout/Tagout',
  'Fall Protection in Construction',
  'Hazard Communication Standards',
  'Heavy Equipment Pre-Inspection',
  'HVAC Systems Maintenance',
  'Job Hazard Analysis (JHA)',
  'Mobile Elevated Work Platforms',
  'Permit-Required Confined Spaces',
  'Personal Protective Equipment',
  'Powered Industrial Trucks',
  'Process Safety Management',
  'Respiratory Protection Program',
  'Scaffolding Safety',
  'Trenching and Excavation Safety',
  'Workplace Violence Prevention',
];
const requirements = REQUIREMENT_NAMES.map((name, i) => ({
  id: 'req-' + i,
  name,
  comp: gen(name, COMP),
  order: gen(name + 'o', ORDERS),
  activities: ((Math.abs(name.length * 7 + i * 3)) % 14) + 1,
  isNew: i < 3,
}));

// ---------- Activities ----------
const ACTIVITY_NAMES = [
  '3D Rendering Techniques',
  'Annual Fire Extinguisher Training',
  'Bloodborne Pathogens Refresher',
  'Cardiopulmonary Resuscitation (CPR)',
  'Defensive Driving Course',
  'Emergency Action Plan Briefing',
  'First Aid Certification',
  'Forklift Operator Practical',
  'Hazardous Materials Handling',
  'Incident Command System 100',
  'Ladder Safety Inspection Drill',
  'Material Safety Data Sheet Review',
  'Near-Miss Reporting Workshop',
  'OSHA 10-Hour General Industry',
  'Powered Tool Safety Walkthrough',
  'Pre-Shift Vehicle Inspection',
  'Respirator Fit Testing',
  'Safe Lifting Techniques',
  'Slip, Trip, and Fall Awareness',
  'Standard First Aid Skills Check',
  'Workplace Ergonomics Assessment',
];
const ACTIVITY_TYPES = ['Online Course', 'Computer-Based', 'Live Session', 'Document Review', 'Skill Assessment', 'Drill'];
const ACTIVITY_DURATIONS = ['15 min', '30 min', '45 min', '1 hr', '2 hrs', '4 hrs', '8 hours'];
const ACTIVITY_DESCRIPTIONS = [
  'Lorem ipsum dolor sit amet consectetur. Gravida ullamcorper vel id dictumst bibendum ultrices platea pharetra ornare. Lectus lacus convallis aliquam phasellus vulputate. Cursus netus sodales lectus in purus varius adipiscing purus. Pharetra scelerisque scelerisque varius magnis lectus suspendisse ornare. Vel nisl lectus lacus mollis enim eu. Fermentum diam amet ut pretium nibh massa pellentesque urna nisi. Ut vulputate diam risus cursus scelerisque aenean. Euismod in egestas adipiscing vestibulum aliquet. Nunc quam congue a nibh donec egestas facilisis risus convallis. Potenti sed quam dui semper nibh lectus. Dui egestas nisl urna faucibus neque risus.',
  'This activity covers the core competencies required by company policy and industry standards. Learners review the relevant regulations, walk through hands-on scenarios, and complete a short knowledge check to confirm understanding. Completion is recorded against the learner\u2019s training profile and counted toward any associated requirement.',
  'A structured walkthrough designed for both new hires and seasoned workers. The activity blends visual demonstrations with written reference material, then closes with a brief skills assessment. Supervisors can review pass/fail results in the LMS reporting view.',
];
const HERO_PALETTES = [
  ['#1B2B41', '#0271CE'],
  ['#22647F', '#3DB5E6'],
  ['#5A7534', '#A3D55F'],
  ['#7E398C', '#B150C5'],
  ['#B1651F', '#F98E2B'],
  ['#A43628', '#E74C39'],
];
const activities = ACTIVITY_NAMES.map((name, i) => ({
  id: 'act-' + i,
  name,
  // Match the reference image for the first activity so the demo lands on
  // "Computer-Based" / "8 hours" out of the box.
  type:     i === 0 ? 'Computer-Based' : gen(name, ACTIVITY_TYPES),
  duration: i === 0 ? '8 hours'        : gen(name + 'd', ACTIVITY_DURATIONS),
  credits: ((Math.abs(name.length * 3 + i * 2)) % 8) + 1,
  description: ACTIVITY_DESCRIPTIONS[i % ACTIVITY_DESCRIPTIONS.length],
  heroColors: HERO_PALETTES[i % HERO_PALETTES.length],
  isNew: i < 2,
}));

// ---------- Qualifications ----------
const QUAL_NAMES = [
  'Certified Industrial Hygienist',
  'Certified Safety Professional',
  'Construction Health & Safety Technician',
  'Crane Operator — NCCCO Mobile',
  'Electrical Journeyman License',
  'EMT-Basic Certification',
  'Fire Inspector I',
  'Forklift Operator Certification',
  'HAZWOPER 40-Hour',
  'HVAC Technician Level II',
  'Lead Renovator (RRP) Certification',
  'OSHA 30-Hour Construction',
  'Paramedic License',
  'Pesticide Applicator License',
  'Process Hazard Analysis Leader',
  'Professional Engineer (PE)',
  'Registered Nurse (RN)',
  'Welding Inspector — AWS CWI',
];
const QUAL_AUTHORITIES = ['BCSP', 'NCCER', 'AWS', 'ASSE', 'IAEI', 'State Board', 'Internal'];
const QUAL_VALIDITY = ['1 year', '2 years', '3 years', '5 years', 'Lifetime'];
const qualifications = QUAL_NAMES.map((name, i) => ({
  id: 'qual-' + i,
  name,
  authority: gen(name, QUAL_AUTHORITIES),
  validity: gen(name + 'v', QUAL_VALIDITY),
  reqs: ((Math.abs(name.length + i)) % 6) + 1,
  isNew: i < 2,
}));

// ---------- Users / Assignees ----------
const USER_NAMES = [
  'Aaron Whitfield', 'Adriana Vargas', 'Brennan O\u2019Neal', 'Camille Yamashita',
  'Damon Esposito', 'Elena Petrova', 'Felix Brunner', 'Grace Holloway',
  'Hiro Tanaka', 'Ingrid Solberg', 'Jamal Whitaker', 'Karina Delgado',
  'Lena Park', 'Marcus Brennan', 'Nadia Krause', 'Oliver Bashir',
  'Priya Shankar', 'Quinn Saunders', 'Rafael Moreno', 'Samira Khoury',
  'Tomasz Janicki', 'Una Vasquez', 'Vincent Okafor', 'Wendy Albright',
];
const USER_ROLES = ['Safety Officer', 'Field Supervisor', 'Crew Lead', 'Compliance Manager', 'Operations Tech', 'HSE Specialist'];
const USER_DEPTS = ['Operations', 'Maintenance', 'Field Services', 'Plant 3', 'EHS', 'Logistics'];
const users = USER_NAMES.map((name, i) => ({
  id: 'user-' + i,
  name,
  role: gen(name, USER_ROLES),
  dept: gen(name + 'd', USER_DEPTS),
  email: name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.+/g, '.') + '@vector.example',
  status: i % 5 === 0 ? 'inactive' : 'active',
  initials: initials(name),
  color: avatarColor(name),
}));

// ---------- Derived data: nested children ----------
// Each Requirement gets an activityList (the actual Activities that satisfy it).
// Each Qualification gets a `groups` array — each group is a sub-Requirement
// with its own activity list. This is what the accordion detail modal renders.

function pickN(arr, n, seedKey) {
  let h = 0; for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) | 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) | 0;
    out.push(arr[Math.abs(h) % arr.length]);
  }
  return out;
}

// Hydrate each Requirement with its actual activities
requirements.forEach((req, i) => {
  req.activityList = pickN(activities, req.activities, req.name);
});

// Group names that sit inside a Qualification (like "Cad Software Fundamentals")
const QUAL_GROUP_NAMES = [
  'Cad Software Fundamentals',
  '3D Modeling and Visualization',
  'Project Documentation Standards',
  'Building Codes & Compliance',
  'Site Survey Techniques',
  'Material Specifications',
  'Construction Drawing Review',
  'Structural Analysis Basics',
  'Renewable Energy Systems',
  'Sustainable Design Principles',
];

qualifications.forEach((q, i) => {
  // Use reqs count to determine how many groups this qualification has
  const groups = [];
  for (let g = 0; g < q.reqs; g++) {
    const groupSeed = q.name + '|g' + g;
    let gh = 0; for (let j = 0; j < groupSeed.length; j++) gh = (gh * 31 + groupSeed.charCodeAt(j)) | 0;
    const groupName = QUAL_GROUP_NAMES[Math.abs(gh) % QUAL_GROUP_NAMES.length];
    const activityCount = ((Math.abs(gh) >> 4) % 4) + 2; // 2-5 activities per group
    groups.push({
      id: q.id + '-g' + g,
      name: groupName,
      activityList: pickN(activities, activityCount, groupSeed),
    });
  }
  q.groups = groups;
  q.totalActivities = groups.reduce((s, g) => s + g.activityList.length, 0);
});


const CONFIGS = {
  requirements: {
    key: 'requirements',
    singular: 'Requirement',
    plural: 'Requirements',
    title: 'Select Requirements',
    subtitle: 'Select which Requirements you want to add to this Stage.',
    items: requirements,
    filterChip: 'View All',
    columns: [
      { key: 'name',       label: 'Requirement Name', sortable: true,  align: 'left' },
      { key: 'comp',       label: 'Comp. Needed',     divider: true,   align: 'left' },
      { key: 'order',      label: 'Comp. Order',      divider: true,   align: 'left' },
      { key: 'activities', label: 'Act.',             divider: true,   align: 'left' },
      { key: 'action',     label: 'Action',           divider: true,   align: 'left' },
    ],
    renderCell: (col, row) => {
      if (col.key === 'name') return row.name;
      if (col.key === 'comp') return row.comp;
      if (col.key === 'order') return row.order;
      if (col.key === 'activities') return row.activities;
      return null;
    },
    cardMeta: (row) => ([{ key: 'Requirement', value: row.activities + ' Activities' }]),
    detail: (row) => ({
      kind: 'list',
      title: row.name,
      subtitle: 'Showing ' + row.activityList.length + ' total activities',
      activities: row.activityList,
    }),
  },

  activities: {
    key: 'activities',
    singular: 'Activity',
    plural: 'Activities',
    title: 'Select Activities',
    subtitle: 'Select which Activities you want to add to this Requirement.',
    items: activities,
    filterChip: 'View All',
    columns: [
      { key: 'name',     label: 'Activity Name', sortable: true,  align: 'left' },
      { key: 'type',     label: 'Type',          divider: true,   align: 'left' },
      { key: 'duration', label: 'Duration',      divider: true,   align: 'left' },
      { key: 'credits',  label: 'Credits',       divider: true,   align: 'left' },
      { key: 'action',   label: 'Action',        divider: true,   align: 'left' },
    ],
    renderCell: (col, row) => {
      if (col.key === 'name')     return row.name;
      if (col.key === 'type')     return row.type;
      if (col.key === 'duration') return row.duration;
      if (col.key === 'credits')  return row.credits;
      return null;
    },
    cardMeta: (row) => ([
      { key: 'Activity', value: row.type },
      { key: '', value: row.duration },
    ]),
    detail: (row) => ({
      title: row.name,
      hero: { kind: 'gradient', colors: row.heroColors, label: row.name },
      meta: [
        { icon: 'monitor', label: row.type },
        { icon: 'clock',   label: row.duration },
      ],
      description: row.description,
    }),
  },

  qualifications: {
    key: 'qualifications',
    singular: 'Qualification',
    plural: 'Qualifications',
    title: 'Select Qualifications',
    subtitle: 'Select which Qualifications you want to add to this Role.',
    items: qualifications,
    filterChip: 'View All',
    columns: [
      { key: 'name',      label: 'Qualification Name', sortable: true,  align: 'left' },
      { key: 'authority', label: 'Authority',          divider: true,   align: 'left' },
      { key: 'validity',  label: 'Valid For',          divider: true,   align: 'left' },
      { key: 'reqs',      label: 'Req.',               divider: true,   align: 'left' },
      { key: 'action',    label: 'Action',             divider: true,   align: 'left' },
    ],
    renderCell: (col, row) => {
      if (col.key === 'name')      return row.name;
      if (col.key === 'authority') return row.authority;
      if (col.key === 'validity')  return row.validity;
      if (col.key === 'reqs')      return row.reqs;
      return null;
    },
    cardMeta: (row) => ([
      { key: 'Qualification', value: row.reqs + ' Requirements' },
      { key: '', value: row.authority },
    ]),
    detail: (row) => ({
      kind: 'groups',
      title: row.name,
      subtitle: 'Showing ' + row.totalActivities + ' total activities',
      groups: row.groups,
    }),
  },

  users: {
    key: 'users',
    singular: 'User',
    plural: 'Users',
    title: 'Select Assignees',
    subtitle: 'Select people to assign to this task.',
    items: users,
    filterChip: 'All Departments',
    addLabel: (n) => 'Assign ' + n + (n === 1 ? ' User' : ' Users'),
    columns: [
      { key: 'name',   label: 'Name',       sortable: true,  align: 'left' },
      { key: 'role',   label: 'Role',       divider: true,   align: 'left' },
      { key: 'dept',   label: 'Department', divider: true,   align: 'left' },
      { key: 'status', label: 'Status',     divider: true,   align: 'left' },
      { key: 'action', label: 'Action',     divider: true,   align: 'left' },
    ],
    renderCell: (col, row) => {
      if (col.key === 'name') return { avatar: { initials: row.initials, color: row.color }, text: row.name, subtext: row.email };
      if (col.key === 'role') return row.role;
      if (col.key === 'dept') return row.dept;
      if (col.key === 'status') return { badge: row.status === 'active' ? 'success' : 'neutral', label: row.status === 'active' ? 'Active' : 'Inactive' };
      return null;
    },
    cardMeta: (row) => ([
      { key: 'User', value: row.role },
      { key: '', value: row.dept },
    ]),
    cardAvatar: (row) => ({ initials: row.initials, color: row.color }),
    detail: (row) => ({
      title: row.name,
      hero: { kind: 'avatar', initials: row.initials, color: row.color },
      meta: [
        { icon: 'user',     label: row.role },
        { icon: 'building', label: row.dept },
      ],
      description: row.name + ' is a ' + row.role + ' in ' + row.dept + '. Assigning a task here adds it to their training queue; they will receive a notification and the activity will appear in their personal dashboard.',
      sections: [
        { title: 'Contact', body: row.email },
      ],
    }),
  },
};

window.PICKER_CONFIGS = CONFIGS;
