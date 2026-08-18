/* =============================================================================
   EHS record form workflow — shared record model
   =============================================================================
   All four concept versions render THIS model, so they can be compared honestly:
   same record, same sections, same fields, same starting completion state. Only
   the navigation / progress shell differs per version.

   Field shape
   -----------
     id     unique key
     label  sentence-case label (see products/EHS/CLAUDE.md — never all caps)
     type   text | textarea | select | date | number | readonly
     req    true when the field must be filled before the record can be submitted
     gate   'save' marks the small subset that blocks even saving a draft
     src    who requires it — drives the "Required by" breakdown in V3
     value  starting value ('' = empty). Edited live by the user.
     opts   options for type:'select'
     span   2 = field spans the full two-column grid width
     help   optional hint shown under the field

   Section shape
   -------------
     id, title, icon (Font Awesome), blurb
     fields   array of fields
     showIf   { field: '<field id>', equals: '<value>' } — conditional section.
              When the condition fails the section is "Not applicable": it drops
              out of the required counts entirely instead of reading as unfinished.
     repeat   true for list sections (witnesses, other vehicles, training)
     rows     starting rows for a repeat section
     system   true for read-only system sections (History) — never counted
     est      rough minutes to finish, used by the "time left" affordances
   ========================================================================== */

window.EHS_FORM = (function () {
  'use strict';

  /* ── The record being worked on ──────────────────────────────────────────── */
  var record = {
    id: 'FY26-00004',
    kind: 'Incident investigation',
    subtype: 'Hazardous material spill',
    occurred: '5/11/2026, 12:30 PM',
    facility: 'North Maintenance Yard',
    preparer: 'Andy Xia',
    status: 'Draft',
    dueDate: '5/18/2026',
    daysToDue: 4,
    lastSaved: '2 minutes ago'
  };

  /* Requirement sources. Order matters — it is the legend order in V3. */
  var SOURCES = [
    { id: 'osha301', label: 'OSHA 301', color: '#d94f45', note: 'Injury and illness incident report' },
    { id: 'osha300', label: 'OSHA 300', color: '#e9a13b', note: 'Recordable case log' },
    { id: 'wc',      label: 'Workers comp', color: '#3d78c8', note: 'First report of injury' },
    { id: 'policy',  label: 'Company policy', color: '#7c6ce0', note: 'Internal investigation standard' },
    { id: 'none',    label: 'Optional', color: '#9aa5b1', note: 'Helpful but not required' }
  ];

  var yesNo = ['Yes', 'No', 'Unknown'];

  /* ── Sections ────────────────────────────────────────────────────────────── */
  var sections = [
    {
      id: 'basic',
      title: 'Basic information',
      icon: 'fa-circle-info',
      blurb: 'Who is reporting, who was involved, and what kind of incident this was.',
      est: 4,
      fields: [
        { id: 'preparerName',   label: "Preparer's name", type: 'readonly', value: 'Andy Xia', src: 'none' },
        { id: 'preparerId',     label: "Preparer's ID", type: 'readonly', value: 'emp-ax-23872', req: true, src: 'policy' },
        { id: 'preparerTitle',  label: "Preparer's title", type: 'text', value: 'Maintenance Supervisor', src: 'none' },
        { id: 'incidentType',   label: 'Incident type', type: 'select', req: true, gate: 'save', src: 'osha301',
          value: 'Hazardous material spill',
          opts: ['Hazardous material spill', 'Slip, trip or fall', 'Struck by object', 'Vehicle collision', 'Ergonomic strain', 'Near miss'] },
        { id: 'dateOfIncident', label: 'Date of incident', type: 'date', req: true, gate: 'save', src: 'osha301', value: '2026-05-11' },
        { id: 'timeOfIncident', label: 'Time of incident', type: 'text', req: true, src: 'osha301', value: '12:30 PM', help: 'Use 12-hour time, for example 2:45 PM' },
        { id: 'workerType',     label: 'Worker type', type: 'select', req: true, src: 'osha301', value: 'Contractor',
          opts: ['Employee', 'Contractor', 'Temporary worker', 'Volunteer', 'Member of the public'] },
        { id: 'involvedEmpName',  label: 'Involved employee name', type: 'text', value: 'Tester Smith', src: 'none' },
        { id: 'involvedEmpId',    label: 'Involved employee ID', type: 'text', req: true, src: 'wc', value: '123456789' },
        { id: 'involvedEmpTitle', label: 'Involved employee title', type: 'text', value: '', src: 'none' },
        { id: 'supervisorName',  label: "Supervisor's name", type: 'text', value: 'Marta Reyes', src: 'none' },
        { id: 'supervisorId',    label: "Supervisor's ID", type: 'text', req: true, src: 'policy', value: 'emp-mr-4410' },
        { id: 'supervisorTitle', label: "Supervisor's title", type: 'text', value: '', src: 'none' },
        { id: 'vehicleInvolved',    label: 'Was a vehicle involved?', type: 'select', req: true, src: 'policy', value: 'Yes', opts: yesNo,
          help: 'Answering yes adds the vehicle sections to this record.' },
        { id: 'employeeInjured',    label: 'Was an employee or directly supervised contractor injured?', type: 'select', req: true, src: 'osha301', value: 'No', opts: yesNo,
          help: 'Answering yes adds the injury and OSHA recordability section.' },
        { id: 'nonEmployeeInjured', label: 'Was a non-employee injured?', type: 'select', req: true, src: 'policy', value: 'No', opts: yesNo },
        { id: 'propertyDamage',     label: 'Was property damage involved?', type: 'select', req: true, src: 'wc', value: 'No', opts: yesNo },
        { id: 'initialDescription', label: 'Initial incident description', type: 'textarea', req: true, gate: 'save', src: 'osha301', span: 2,
          value: 'A hazardous material spill occurred during routine maintenance procedures in the storage facility. Immediate containment protocols were initiated.' },
        { id: 'severity',    label: 'Severity', type: 'select', value: '', src: 'none', opts: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'] },
        { id: 'probability', label: 'Probability', type: 'select', value: '', src: 'none', opts: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'] },
        { id: 'riskAssessment', label: 'Risk assessment', type: 'readonly', value: '', src: 'none', help: 'Calculated from severity and probability' }
      ]
    },

    {
      id: 'details',
      title: 'Incident details',
      icon: 'fa-location-dot',
      blurb: 'Where it happened, who it was reported to, and the conditions at the time.',
      est: 6,
      fields: [
        { id: 'reportedToName',  label: 'Reported to: name', type: 'text', value: '', src: 'none' },
        { id: 'reportedToId',    label: 'Reported to: employee ID', type: 'text', req: true, src: 'policy', value: '' },
        { id: 'reportedToTitle', label: 'Reported to: title', type: 'text', value: '', src: 'none' },
        { id: 'dateReported',    label: 'Date reported', type: 'date', req: true, src: 'osha301', value: '2026-05-11' },
        { id: 'canTimeBeDetermined', label: 'Can time be determined?', type: 'select', req: true, src: 'osha301', value: 'Yes', opts: yesNo },
        { id: 'shift',      label: 'Shift', type: 'select', value: '', src: 'none', opts: ['First', 'Second', 'Third', 'Rotating'] },
        { id: 'division',   label: 'Division', type: 'select', req: true, gate: 'save', src: 'policy', value: 'Public Works',
          opts: ['Public Works', 'Utilities', 'Parks and Recreation', 'Transit', 'Facilities'] },
        { id: 'facility',   label: 'Facility', type: 'select', req: true, gate: 'save', src: 'policy', value: 'North Maintenance Yard',
          opts: ['North Maintenance Yard', 'South Depot', 'Water Treatment Plant 2', 'Central Garage'] },
        { id: 'department', label: 'Department', type: 'text', value: 'Fleet Maintenance', src: 'none' },
        { id: 'section',    label: 'Section', type: 'text', value: '', src: 'none' },
        { id: 'location',   label: 'Location', type: 'text', value: 'Bay 3', src: 'none' },
        { id: 'descriptionOfLocation', label: 'Description of location', type: 'textarea', req: true, src: 'osha301', span: 2, value: '',
          help: 'Be specific enough that someone unfamiliar with the site could find the spot.' },
        { id: 'descriptionOfIncident', label: 'Description of incident', type: 'textarea', req: true, src: 'osha301', span: 2,
          value: 'While transferring waste solvent between drums, the transfer hose coupling failed and roughly 12 gallons discharged onto the bay floor. The spill kit was deployed within four minutes and the area was bermed and ventilated.' },
        { id: 'weather',  label: 'Weather', type: 'select', value: '', src: 'none', opts: ['Clear', 'Cloudy', 'Rain', 'Snow', 'Fog', 'Not applicable, indoors'] },
        { id: 'lighting', label: 'Lighting', type: 'select', value: '', src: 'none', opts: ['Daylight', 'Artificial, adequate', 'Artificial, poor', 'Dark'] },
        { id: 'environmentalConditions', label: 'Description of environmental conditions', type: 'textarea', value: '', src: 'none', span: 2 }
      ]
    },

    {
      id: 'vehicle',
      title: 'Vehicle involved',
      icon: 'fa-truck',
      blurb: 'The company vehicle or mobile equipment involved in the incident.',
      est: 3,
      showIf: { field: 'vehicleInvolved', equals: 'Yes' },
      fields: [
        { id: 'unitNumber',  label: 'Unit number', type: 'text', req: true, src: 'policy', value: '' },
        { id: 'vehicleType', label: 'Vehicle type', type: 'select', req: true, src: 'policy', value: '',
          opts: ['Pickup truck', 'Box truck', 'Vacuum tanker', 'Forklift', 'Street sweeper', 'Passenger vehicle'] },
        { id: 'vehicleMake',   label: 'Vehicle make', type: 'text', value: '', src: 'none' },
        { id: 'licensePlate',  label: 'License plate number', type: 'text', value: '', src: 'none' },
        { id: 'vehicleAction', label: 'Vehicle action', type: 'select', value: '', src: 'none',
          opts: ['Parked', 'Idling', 'Moving forward', 'Backing', 'Turning', 'Loading or unloading'] },
        { id: 'driverEmployeeId', label: 'Driver employee ID', type: 'text', req: true, src: 'wc', value: '123456789' }
      ]
    },

    {
      id: 'otherVehicle',
      title: 'Other vehicle involved',
      icon: 'fa-car-burst',
      blurb: 'Third-party vehicles. Add one entry per vehicle.',
      est: 3,
      showIf: { field: 'vehicleInvolved', equals: 'Yes' },
      repeat: true, rows: [],
      rowLabel: 'vehicle',
      rowFields: ['Owner name', 'Plate', 'Insurer', 'Damage estimate']
    },

    {
      id: 'witnesses',
      title: 'Witness information',
      icon: 'fa-user-group',
      blurb: 'Anyone who saw the incident. Add one entry per witness.',
      est: 4,
      repeat: true, rows: [{ name: 'Dana Kim', detail: 'Fleet Maintenance, statement pending' }],
      rowLabel: 'witness',
      rowFields: ['Name', 'Employer', 'Phone', 'Statement']
    },

    {
      id: 'responders',
      title: 'Responders',
      icon: 'fa-truck-medical',
      blurb: 'Outside agencies that responded to the scene.',
      est: 2,
      fields: [
        { id: 'fireEms', label: 'Did fire or emergency medical services respond?', type: 'select', value: '', src: 'none', opts: yesNo },
        { id: 'police',  label: 'Did police or security respond?', type: 'select', value: '', src: 'none', opts: yesNo },
        { id: 'agencyReportNumber', label: 'Agency report number', type: 'text', value: '', src: 'none' },
        { id: 'responderNotes', label: 'Responder notes', type: 'textarea', value: '', src: 'none', span: 2 }
      ]
    },

    {
      id: 'injury',
      title: 'Injury and OSHA recordability',
      icon: 'fa-notes-medical',
      blurb: 'Case details that determine whether this incident lands on the OSHA 300 log.',
      est: 7,
      showIf: { field: 'employeeInjured', equals: 'Yes' },
      fields: [
        { id: 'bodyPart',   label: 'Part of body affected', type: 'select', req: true, src: 'osha301', value: '',
          opts: ['Head', 'Eyes', 'Respiratory system', 'Hand or fingers', 'Arm', 'Back', 'Leg', 'Foot', 'Multiple'] },
        { id: 'natureOfInjury', label: 'Nature of injury or illness', type: 'select', req: true, src: 'osha301', value: '',
          opts: ['Chemical burn', 'Inhalation exposure', 'Laceration', 'Fracture', 'Sprain or strain', 'Contusion'] },
        { id: 'treatmentType', label: 'Treatment provided', type: 'select', req: true, src: 'osha301', value: '',
          opts: ['First aid only', 'Medical treatment beyond first aid', 'Emergency room', 'Hospitalized overnight', 'None'] },
        { id: 'physicianName',  label: 'Physician or health care professional', type: 'text', value: '', src: 'none' },
        { id: 'facilityTreated', label: 'Treatment facility', type: 'text', value: '', src: 'none' },
        { id: 'caseClassification', label: 'Case classification', type: 'select', req: true, src: 'osha300', value: '',
          opts: ['Death', 'Days away from work', 'Job transfer or restriction', 'Other recordable case'] },
        { id: 'daysAway',      label: 'Days away from work', type: 'number', req: true, src: 'osha300', value: '' },
        { id: 'daysRestricted', label: 'Days on job transfer or restriction', type: 'number', req: true, src: 'osha300', value: '' },
        { id: 'privacyCase',   label: 'Is this a privacy concern case?', type: 'select', src: 'osha301', value: '', opts: yesNo }
      ]
    },

    {
      id: 'analysis',
      title: 'Incident analysis',
      icon: 'fa-magnifying-glass-chart',
      blurb: 'Why it happened and what will stop it happening again.',
      est: 8,
      fields: [
        { id: 'reportStatus', label: 'Report status', type: 'select', req: true, src: 'policy', value: '',
          opts: ['Open', 'Under investigation', 'Pending review', 'Closed'] },
        { id: 'rootCause', label: 'Root cause', type: 'select', req: true, src: 'policy', value: '',
          opts: ['Equipment failure', 'Inadequate procedure', 'Procedure not followed', 'Insufficient training', 'Housekeeping', 'Human factors'] },
        { id: 'contributingFactors', label: 'Contributing factors', type: 'textarea', value: '', src: 'none', span: 2 },
        { id: 'correctiveActionRequired', label: 'Is corrective action required?', type: 'select', req: true, src: 'policy', value: '', opts: yesNo },
        { id: 'retrainingRequired', label: 'Is retraining required?', type: 'select', req: true, src: 'policy', value: '', opts: yesNo,
          help: 'Answering yes turns on the training assignment section.' },
        { id: 'drugAlcoholTest', label: 'Was a drug or alcohol test performed?', type: 'select', value: '', src: 'none', opts: yesNo },
        { id: 'previousShift', label: 'Did the involved employee work the previous shift?', type: 'select', value: '', src: 'none', opts: yesNo },
        { id: 'preventiveMeasures', label: 'Preventive measures taken', type: 'textarea', req: true, src: 'policy', value: '', span: 2 }
      ]
    },

    {
      id: 'training',
      title: 'Recommended training and assignments',
      icon: 'fa-graduation-cap',
      blurb: 'Courses assigned as a result of this investigation.',
      est: 3,
      showIf: { field: 'retrainingRequired', equals: 'Yes' },
      repeat: true, rows: [],
      rowLabel: 'assignment',
      rowFields: ['Course', 'Assignee', 'Due date']
    },

    {
      id: 'attachments',
      title: 'Attachments and evidence',
      icon: 'fa-paperclip',
      blurb: 'Photos, statements, lab results, and anything else supporting the investigation.',
      est: 2,
      fields: [
        { id: 'photoNote', label: 'Attachment notes', type: 'textarea', value: '', src: 'none', span: 2 }
      ],
      attachments: [
        { name: 'spill-bay3-wide.jpg', size: '2.4 MB', kind: 'fa-image' },
        { name: 'coupling-failure.jpg', size: '1.8 MB', kind: 'fa-image' },
        { name: 'sds-waste-solvent.pdf', size: '340 KB', kind: 'fa-file-pdf' }
      ]
    },

    {
      id: 'history',
      title: 'History',
      icon: 'fa-clock-rotate-left',
      blurb: 'System record of every change to this report.',
      system: true,
      fields: [],
      history: [
        { when: '5/11/2026 12:52 PM', who: 'Andy Xia', what: 'Created report from mobile app' },
        { when: '5/11/2026 1:14 PM', who: 'Andy Xia', what: 'Added 3 attachments' },
        { when: '5/12/2026 8:31 AM', who: 'Marta Reyes', what: 'Updated description of incident' }
      ]
    }
  ];

  /* ── Derived helpers ─────────────────────────────────────────────────────── */

  /* Flat index of every field by id, so showIf conditions can be evaluated. */
  function fieldById(id) {
    for (var i = 0; i < sections.length; i++) {
      var fs = sections[i].fields || [];
      for (var j = 0; j < fs.length; j++) if (fs[j].id === id) return fs[j];
    }
    return null;
  }

  function valueOf(id) {
    var f = fieldById(id);
    return f ? f.value : '';
  }

  /* A section is "active" when its showIf condition passes (or it has none). */
  function isActive(section) {
    if (!section.showIf) return true;
    return valueOf(section.showIf.field) === section.showIf.equals;
  }

  function isFilled(f) {
    return String(f.value == null ? '' : f.value).trim() !== '';
  }

  /* Per-section rollup. This is the single source of truth every version's
     progress UI reads from, so all four agree on what "complete" means. */
  function statusOf(section) {
    var out = {
      id: section.id, title: section.title,
      active: isActive(section), system: !!section.system,
      reqTotal: 0, reqDone: 0, total: 0, done: 0,
      missing: [], state: 'empty'
    };

    if (!out.active) { out.state = 'na'; return out; }
    if (out.system)  { out.state = 'system'; return out; }

    if (section.repeat) {
      out.total = 1;
      out.done = (section.rows && section.rows.length) ? 1 : 0;
      out.state = out.done ? 'complete' : 'optional';
      out.rowCount = section.rows ? section.rows.length : 0;
      return out;
    }

    (section.fields || []).forEach(function (f) {
      if (f.type === 'readonly') return;              // system-filled, not the user's job
      out.total++;
      if (isFilled(f)) out.done++;
      if (f.req) {
        out.reqTotal++;
        if (isFilled(f)) out.reqDone++; else out.missing.push(f);
      }
    });
    if (section.attachments && section.attachments.length) out.done++, out.total++;

    if (out.reqTotal > 0 && out.reqDone === out.reqTotal) out.state = 'complete';
    else if (out.reqDone > 0 || out.done > 0) out.state = 'partial';
    else out.state = 'empty';
    if (out.reqTotal === 0) out.state = out.done > 0 ? 'complete' : 'optional';

    return out;
  }

  /* Whole-record rollup. */
  function summary() {
    var s = { reqTotal: 0, reqDone: 0, missing: [], gateMissing: [], sections: [],
              complete: 0, partial: 0, empty: 0, na: 0, optional: 0, minutesLeft: 0 };
    sections.forEach(function (sec) {
      var st = statusOf(sec);
      st.section = sec;
      s.sections.push(st);
      if (st.state === 'system') return;
      if (st.state === 'na') { s.na++; return; }
      s.reqTotal += st.reqTotal;
      s.reqDone += st.reqDone;
      st.missing.forEach(function (f) {
        s.missing.push({ section: sec, field: f });
        if (f.gate === 'save') s.gateMissing.push({ section: sec, field: f });
      });
      if (st.state === 'complete') s.complete++;
      else if (st.state === 'partial') { s.partial++; s.minutesLeft += Math.ceil((sec.est || 3) / 2); }
      else if (st.state === 'optional') s.optional++;
      else { s.empty++; s.minutesLeft += (sec.est || 3); }
    });
    s.pct = s.reqTotal ? Math.round((s.reqDone / s.reqTotal) * 100) : 100;
    s.canSubmit = s.reqDone === s.reqTotal;
    return s;
  }

  /* Counts by requirement source, for V3's "Required by" donut. */
  function bySource() {
    var map = {};
    SOURCES.forEach(function (src) { map[src.id] = { src: src, total: 0, done: 0 }; });
    sections.forEach(function (sec) {
      if (sec.system || !isActive(sec)) return;
      (sec.fields || []).forEach(function (f) {
        if (f.type === 'readonly' || !f.req) return;
        var key = map[f.src] ? f.src : 'policy';
        map[key].total++;
        if (isFilled(f)) map[key].done++;
      });
    });
    return SOURCES.map(function (s) { return map[s.id]; }).filter(function (e) { return e.total > 0; });
  }

  /* Change notification — versions subscribe to re-render their progress UI. */
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function setValue(id, val) {
    var f = fieldById(id);
    if (!f) return;
    f.value = val;
    listeners.forEach(function (fn) { try { fn(id, val); } catch (e) {} });
  }
  function notify() { listeners.forEach(function (fn) { try { fn(null, null); } catch (e) {} }); }

  return {
    record: record, sections: sections, SOURCES: SOURCES,
    fieldById: fieldById, valueOf: valueOf, isActive: isActive, isFilled: isFilled,
    statusOf: statusOf, summary: summary, bySource: bySource,
    onChange: onChange, setValue: setValue, notify: notify
  };
})();
