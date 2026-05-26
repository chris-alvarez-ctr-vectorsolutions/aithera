/*
  sandbox-seed.js — v2 (simplified model)
  --------------------------------------------------------------
  Seed data for the sandbox:
    - 4 blocks (cover variety of step types, including cs-count)
    - 1 checklist (composes the blocks into 3 sections) with one
      active deployment on Engine 7
    - 5 vehicles (matches the flavor of fleet.html: engines, ladder,
      medic, brush)
*/

(function () {
  'use strict';

  function build({ newId, nowIso }) {
    const now = nowIso();

    // ---------- vehicles --------------------------------------------------
    const vehicleList = [
      { tag: 'E-7',  name: 'Engine 7',  type: 'Engine',    station: 'Station 7 — Bay A',  year: 2019, make: 'Pierce',  model: 'Enforcer',  status: 'ok',   lastCheckLabel: 'Today, 06:12' },
      { tag: 'E-12', name: 'Engine 12', type: 'Engine',    station: 'Station 12 — Bay 1', year: 2022, make: 'Pierce',  model: 'Velocity',  status: 'ok',   lastCheckLabel: 'Today, 06:30' },
      { tag: 'L-3',  name: 'Ladder 3',  type: 'Ladder',    station: 'Station 3 — Bay A',  year: 2018, make: 'Sutphen', model: 'SP 70',     status: 'warn', lastCheckLabel: 'Yesterday' },
      { tag: 'M-4',  name: 'Medic 4',   type: 'Ambulance', station: 'Station 4 — Bay 2',  year: 2021, make: 'Braun',   model: 'Chief XL',  status: 'ok',   lastCheckLabel: 'Today, 06:48' },
      { tag: 'BR-1', name: 'Brush 1',   type: 'Brush',     station: 'Station 7 — Bay B',  year: 2017, make: 'Ford',    model: 'F-550',     status: 'oos',  lastCheckLabel: 'May 11' }
    ];
    const vehicles = {};
    vehicleList.forEach(v => { vehicles[v.tag] = Object.assign({}, v, { createdAt: now, updatedAt: now }); });

    // ---------- blocks ---------------------------------------------------
    // Block step shape (matches block-creator.html + the 14 step types):
    //   { id, kind, label, severity: 'critical'|'warning'|'none', allowPhoto?, allowNote?, ...kind-specific }
    //
    // Status / version model (also applies to checklists below):
    //   status:  'draft' | 'published' | 'retired'
    //   version: integer, starts at 1, increments on each publish.
    //
    // PRODUCTION TARGET (not modeled in this prototype):
    //   Draft is a separate revision layered on top of the published version,
    //   not an in-place status field. Editing a published block creates a
    //   draft revision; the published version stays immutable and live for
    //   existing deployments until the draft is itself published, replacing
    //   the prior version. Old checklist deployments pin to specific block
    //   versions so editing a block doesn't silently mutate live checklists.
    //   The prototype simplifies this to a single in-place status field —
    //   good enough for demoing the filter UX but not the editing model.

    const blockTires = {
      id: newId('block'),
      name: 'Wheels & Tires',
      domain: 'vehicle',
      description: 'Visual condition of tires, wheels, lugs, and pressures.',
      multiUse: true,
      status: 'published',
      version: 2,
      steps: [
        { id: 1, kind: 'check',   label: 'Tire tread depth ≥ 4/32"', severity: 'critical', allowPhoto: true, allowNote: true },
        { id: 2, kind: 'check',   label: 'Sidewalls — no cuts, bulges, weather cracking', severity: 'critical', allowPhoto: true },
        { id: 3, kind: 'numeric', label: 'Tire pressure', unit: 'psi', threshold: { min: 110, label: 'Min 110 psi (cold)' }, severity: 'warning' },
        { id: 4, kind: 'check',   label: 'Lug nuts tight, indicator arrows aligned', severity: 'warning', allowPhoto: true }
      ],
      createdAt: now, updatedAt: now
    };

    const blockFluids = {
      id: newId('block'),
      name: 'Fluid Levels',
      domain: 'apparatus',
      description: 'Engine, transmission, coolant, pump primer checks.',
      multiUse: false,
      status: 'published',
      version: 1,
      steps: [
        { id: 1, kind: 'check',  label: 'Engine oil — between min and max',  severity: 'critical', allowPhoto: true },
        { id: 2, kind: 'check',  label: 'Coolant level',                     severity: 'critical', allowPhoto: true },
        { id: 3, kind: 'check',  label: 'Transmission fluid',                severity: 'warning' },
        { id: 4, kind: 'yes-no', label: 'Any visible leaks under apparatus?', severity: 'critical', allowPhoto: true, allowNote: true }
      ],
      createdAt: now, updatedAt: now
    };

    const blockScba = {
      id: newId('block'),
      name: 'SCBA Readiness',
      domain: 'equipment',
      description: 'Self-contained breathing apparatus per seat.',
      multiUse: true,
      status: 'published',
      version: 3,
      steps: [
        { id: 1, kind: 'numeric',     label: 'Cylinder pressure', unit: 'psi', threshold: { min: 4275, label: '≥ 95% of 4500 psi' }, severity: 'critical' },
        { id: 2, kind: 'check',       label: 'Mask + regulator — clean, no cracks', severity: 'critical', allowPhoto: true },
        { id: 3, kind: 'yes-no',      label: 'Heads-up display lit on activation?', severity: 'warning' },
        { id: 4, kind: 'date',        label: 'Last hydrostatic test date',           severity: 'warning', optional: true },
        { id: 5, kind: 'acknowledge', label: 'SCBA confirmed mission-ready',         severity: 'none' }
      ],
      createdAt: now, updatedAt: now
    };

    // A block currently being authored — not yet published.
    const blockHydrant = {
      id: newId('block'),
      name: 'Hydrant Inspection',
      domain: 'facility',
      description: 'Annual hydrant flow + visual condition check.',
      multiUse: true,
      status: 'draft',
      version: 1,
      steps: [
        { id: 1, kind: 'check',   label: 'Caps present and removable', severity: 'warning', allowPhoto: true },
        { id: 2, kind: 'numeric', label: 'Static pressure', unit: 'psi', threshold: { min: 20, label: 'Min 20 psi static' }, severity: 'critical' },
        { id: 3, kind: 'check',   label: 'Drain valve operates correctly', severity: 'warning' }
      ],
      createdAt: now, updatedAt: now
    };

    // A block superseded by a newer process — retired.
    const blockRadios = {
      id: newId('block'),
      name: 'Mobile Radio Check (legacy)',
      domain: 'equipment',
      description: 'Pre-replacement radio check; superseded by MDT-integrated routine.',
      multiUse: false,
      status: 'retired',
      version: 4,
      steps: [
        { id: 1, kind: 'check', label: 'Primary radio powers on', severity: 'critical' },
        { id: 2, kind: 'check', label: 'All channels programmed', severity: 'warning' }
      ],
      createdAt: now, updatedAt: now
    };

    // ---------- checklists (templates) + deployments ---------------------
    // Status/version model identical to blocks above — see the production
    // target comment near the block definitions.
    //
    // Only `published` checklists can be deployed. Drafts and retired
    // checklists have no deployments.

    const checklist = {
      id: newId('checklist'),
      name: 'Apparatus Morning Check',
      type: 'apparatus',          // drives the colored icon (apparatus|ems|facility|pm)
      cadence: 'daily',
      status: 'published',        // 'draft' | 'published' | 'retired'
      version: 5,
      origin: 'scratch',
      sections: [
        {
          id: 1, name: 'Walkaround', collapsed: false,
          blocks: [
            { instanceId: 1, blockId: blockTires.id,  contextLabel: 'Driver Front',    expanded: false },
            { instanceId: 2, blockId: blockTires.id,  contextLabel: 'Passenger Front', expanded: false, optional: true },
            { instanceId: 3, blockId: blockFluids.id, contextLabel: '',                expanded: false }
          ]
        },
        {
          id: 2, name: 'Equipment', collapsed: false,
          blocks: [ { instanceId: 4, blockId: blockScba.id, contextLabel: 'Officer Seat', expanded: false } ]
        }
      ],
      deployments: [
        {
          id: newId('deploy'),
          vehicleTag: 'E-7',
          status: 'active',           // 'active'|'paused'|'pending'
          cadenceOverride: null,      // null = inherits checklist.cadence
          deployedAt: now,
          lastRunAt: null
        }
      ],
      createdAt: now, updatedAt: now
    };

    // A new checklist being built — not yet published, no deployments.
    const checklistDraft = {
      id: newId('checklist'),
      name: 'Quarterly Hydrant Check',
      type: 'facility',
      cadence: 'quarterly',
      status: 'draft',
      version: 1,
      origin: 'scratch',
      sections: [
        {
          id: 1, name: 'Inspection', collapsed: false,
          blocks: [
            { instanceId: 1, blockId: blockHydrant.id, contextLabel: '', expanded: false }
          ]
        }
      ],
      deployments: [],
      createdAt: now, updatedAt: now
    };

    // A retired checklist — kept for historical run records, no deployments.
    const checklistRetired = {
      id: newId('checklist'),
      name: 'Pre-Shift Radio Check (legacy)',
      type: 'apparatus',
      cadence: 'daily',
      status: 'retired',
      version: 7,
      origin: 'scratch',
      sections: [
        {
          id: 1, name: 'Radios', collapsed: false,
          blocks: [
            { instanceId: 1, blockId: blockRadios.id, contextLabel: '', expanded: false }
          ]
        }
      ],
      deployments: [],
      createdAt: now, updatedAt: now
    };

    // ---------- assemble blob --------------------------------------------
    const blocksById = {};
    [blockTires, blockFluids, blockScba, blockHydrant, blockRadios]
      .forEach(b => { blocksById[b.id] = b; });

    const checklistsById = {};
    [checklist, checklistDraft, checklistRetired]
      .forEach(c => { checklistsById[c.id] = c; });

    return {
      schemaVersion: 2,
      blocks:      blocksById,
      checklists:  checklistsById,
      vehicles,
      meta: { seededAt: now, lastModified: now }
    };
  }

  window.SandboxSeed = { build };
})();
