/*
  sandbox-compile.js
  --------------------------------------------------------------
  Pure function: convert a sandbox checklist (sections[] of block refs)
  plus the store's block library into the ceremony renderer's STEPS shape.

  Decisions (from build-time questions, May 2026):
    - One ceremony section per block INSTANCE (so "Wheels & Tires — Driver
      Front" and "Wheels & Tires — Driver Rear" are separate sections,
      not flattened).
    - Empty sections / missing blocks are silently skipped.
    - Freestanding block instances (blockId: 'freestanding') use their
      inline `steps[]` and contribute a single ceremony section.

  Input shapes:
    checklist: {
      id, name, type, cadence, status,
      sections: [{
        id, name, blocks: [{
          instanceId, blockId, contextLabel,
          // freestanding only:
          name?, steps?: [{ label, sev }]
        }]
      }]
    }
    getBlock(blockId): returns { id, name, steps: [{ kind, label, severity, allowPhoto, allowNote, ... }] } | null

  Output shape (ceremony STEPS array):
    [
      {
        id:    string,            // unique per section, used as key prefix
        type:  'check',           // ceremony page only branches 'check' vs 'attest'
        title: string,            // shown in step header
        meta:  string,            // shown beneath title
        icon:  string,            // FA class (no leading "fa-solid")
        items: [
          {
            key:        string,   // globally unique across the whole STEPS array
            kind:       <14 step types>,
            label, sub,
            severity?, allowPhoto?, allowNote?,
            unit?, threshold?, options?, par?, default?, optional?
          }
        ]
      },
      // ... one final "attest" section appended (see below)
    ]

  Final section: every compiled ceremony ends with a single attest step
  so the renderer's existing attest-record flow still fires.
*/

(function () {
  'use strict';

  // ---- helpers --------------------------------------------------------

  function slug(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'x';
  }

  // Map a stored block-step → ceremony item.
  // The two shapes overlap mostly cleanly: kind, label, severity, options,
  // threshold, unit pass through; allowPhoto/allowNote stay as boolean slots.
  function blockStepToItem(step, keyBase) {
    const kind = step.kind || 'check';
    const item = {
      key:   keyBase + '-s' + step.id,
      kind:  kind,
      label: step.label || '',
      sub:   step.sub || ''
    };
    // Severity is carried but the ceremony renderer reads it only for some kinds.
    if (step.severity && step.severity !== 'none') item.severity = step.severity;
    if (step.allowPhoto) item.allowPhoto = true;
    if (step.allowNote)  item.allowNote  = true;
    if (step.unit)       item.unit       = step.unit;
    if (step.threshold)  item.threshold  = step.threshold;
    if (Array.isArray(step.options)) item.options = step.options;
    if (typeof step.par !== 'undefined')      item.par      = step.par;
    if (typeof step.default !== 'undefined')  item.default  = step.default;
    if (step.optional) item.optional = true;
    // Pass through any other fields without inventing semantics.
    ['assetTag','assetSn','variantKey','variantLabel','thresholdSource','expectedValue'].forEach(k => {
      if (typeof step[k] !== 'undefined') item[k] = step[k];
    });
    return item;
  }

  // Convert a freestanding block-instance's inline steps (which use
  // checklist-builder's { label, sev } shape) into ceremony items.
  function freestandingStepToItem(step, keyBase, idx) {
    return {
      key:   keyBase + '-s' + (idx + 1),
      kind:  'check',
      label: step.label || '',
      sub:   '',
      severity: (step.sev || step.severity || 'none') !== 'none'
                  ? (step.sev || step.severity) : undefined,
      allowPhoto: !!step.allowPhoto,
      allowNote:  !!step.allowNote
    };
  }

  // Choose a default icon for a compiled section. Block-side icons (the ones
  // shown in checklist-builder's BLOCK_LIBRARY) aren't carried on the block
  // record itself; we map from the block's domain instead.
  function iconForBlock(block) {
    if (!block) return 'fa-clipboard-list';
    switch ((block.domain || '').toLowerCase()) {
      case 'vehicle':   return 'fa-truck';
      case 'apparatus': return 'fa-truck-fast';
      case 'ems':       return 'fa-truck-medical';
      case 'cs':        return 'fa-flask';
      case 'facility':  return 'fa-building';
      case 'equipment': return 'fa-shield-halved';
      case 'le':        return 'fa-shield';
      case 'admin':     return 'fa-clipboard-list';
      default:          return 'fa-clipboard-list';
    }
  }

  // ---- main -----------------------------------------------------------

  function compileChecklistToSteps(checklist, getBlock, opts) {
    opts = opts || {};
    if (!checklist || !Array.isArray(checklist.sections)) return [];

    const out = [];

    checklist.sections.forEach((section, sIdx) => {
      const sectionName = section.name || `Section ${sIdx + 1}`;
      (section.blocks || []).forEach((b, bIdx) => {

        // ---- freestanding (inline steps) -----------------------------
        if (b.blockId === 'freestanding') {
          const steps = b.steps || [];
          if (!steps.length) return; // skip empty

          const keyBase = `s${section.id}-fs${b.instanceId}`;
          out.push({
            id:    keyBase,
            type:  'check',
            title: b.name || sectionName,
            meta:  sectionName,
            icon:  'fa-list-check',
            items: steps.map((st, i) => freestandingStepToItem(st, keyBase, i))
          });
          return;
        }

        // ---- block reference ----------------------------------------
        const block = getBlock(b.blockId);
        if (!block || !Array.isArray(block.steps) || !block.steps.length) return; // skip missing/empty

        const keyBase = `s${section.id}-b${b.instanceId}`;
        const ctx = (b.contextLabel || '').trim();
        const title = ctx ? `${block.name} — ${ctx}` : block.name;

        out.push({
          id:    keyBase,
          type:  'check',
          title,
          meta:  sectionName,
          icon:  iconForBlock(block),
          items: block.steps.map(step => blockStepToItem(step, keyBase))
        });
      });
    });

    // Append a final attest section so the existing whole-record sign-off
    // flow still fires. The ceremony renderer keys this off type:'attest'.
    if (out.length) {
      out.push({
        id:    'attest',
        type:  'attest',
        title: 'Attest & Submit',
        meta:  'Confirm and sign the completed record',
        icon:  'fa-signature',
        items: []
      });
    }

    return out;
  }

  window.SandboxCompile = { compileChecklistToSteps };
})();
