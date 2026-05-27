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

  // Map block-creator's `step.type` vocabulary → ceremony's `kind` vocabulary.
  // Block-creator stores: passfail | text | numeric | single | multi.
  // Ceremony renders:    check    | text | numeric | select | multi-select.
  // For legacy/seed records that still use `kind` directly (e.g. info, ack,
  // yes-no, signature, date, count, long-text), fall through to that value.
  function resolveKind(step) {
    if (step.type) {
      switch (step.type) {
        case 'passfail': return 'check';
        case 'single':   return 'select';
        case 'multi':    return 'multi-select';
        case 'text':     return 'text';
        case 'numeric':  return 'numeric';
        // Any future block-creator type lands here unchanged.
        default:         return step.type;
      }
    }
    return step.kind || 'check';
  }

  // Normalize a raw option entry from block-creator (flat string) into the
  // ceremony's { value, label } shape. Passes through if already an object.
  function normalizeOption(opt) {
    if (opt && typeof opt === 'object') {
      return { value: String(opt.value ?? opt.label ?? ''), label: String(opt.label ?? opt.value ?? '') };
    }
    const text = String(opt ?? '').trim();
    if (!text) return null;
    // value = slugged label so it's stable + URL-safe; label = original text.
    return { value: slug(text), label: text };
  }

  // Convert block-creator's flat `min` / `max` / `unit` (all strings) into
  // the ceremony's threshold object + separate unit string. Empty values are
  // dropped so the renderer treats the field as unbounded on that side.
  function buildNumericThreshold(step) {
    const min = step.min;
    const max = step.max;
    const hasMin = min !== '' && min != null && !Number.isNaN(Number(min));
    const hasMax = max !== '' && max != null && !Number.isNaN(Number(max));
    if (!hasMin && !hasMax) return null;
    const t = {};
    if (hasMin) t.min = Number(min);
    if (hasMax) t.max = Number(max);
    // Friendly label shown in the threshold pill.
    if (hasMin && hasMax) t.label = `${t.min}–${t.max}${step.unit ? ' ' + step.unit : ''}`;
    else if (hasMin)      t.label = `≥ ${t.min}${step.unit ? ' ' + step.unit : ''}`;
    else                   t.label = `≤ ${t.max}${step.unit ? ' ' + step.unit : ''}`;
    return t;
  }

  // Map a stored block-step → ceremony item.
  // Translates block-creator's `type` vocabulary to the ceremony's `kind`
  // vocabulary, and reshapes type-specific fields (numeric thresholds,
  // select options) to the shape the ceremony renderer expects.
  function blockStepToItem(step, keyBase) {
    const kind = resolveKind(step);
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

    // Numeric: prefer an existing threshold object (legacy/seed data), else
    // build one from block-creator's flat min/max/unit.
    if (kind === 'numeric') {
      if (step.unit) item.unit = step.unit;
      if (step.threshold && typeof step.threshold === 'object') {
        item.threshold = step.threshold;
      } else {
        const t = buildNumericThreshold(step);
        if (t) item.threshold = t;
      }
    } else if (step.unit) {
      // Non-numeric kinds that still want a unit pass it through.
      item.unit = step.unit;
    } else if (step.threshold) {
      // Preserve threshold on non-numeric (e.g. 'count') passthrough.
      item.threshold = step.threshold;
    }

    // Select / multi-select: normalize options to { value, label } objects.
    if ((kind === 'select' || kind === 'multi-select') && Array.isArray(step.options)) {
      const normalized = step.options.map(normalizeOption).filter(Boolean);
      if (normalized.length) item.options = normalized;
    } else if (Array.isArray(step.options)) {
      // Legacy kinds keep their original options array.
      item.options = step.options;
    }

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
    const item = {
      key:   keyBase + '-s' + (idx + 1),
      kind:  'check',
      label: step.label || '',
      sub:   '',
      severity: (step.sev || step.severity || 'none') !== 'none'
                  ? (step.sev || step.severity) : undefined,
      allowPhoto: !!step.allowPhoto,
      allowNote:  !!step.allowNote
    };
    if (step.optional) item.optional = true;
    return item;
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
          const compiled = {
            id:    keyBase,
            type:  'check',
            title: b.name || sectionName,
            meta:  sectionName,
            icon:  'fa-list-check',
            items: steps.map((st, i) => freestandingStepToItem(st, keyBase, i))
          };
          // Block-level optional carries through to the compiled section so
          // the ceremony can render an "Optional — skippable" affordance.
          if (b.optional) compiled.optional = true;
          out.push(compiled);
          return;
        }

        // ---- block reference ----------------------------------------
        const block = getBlock(b.blockId);
        if (!block || !Array.isArray(block.steps) || !block.steps.length) return; // skip missing/empty

        const keyBase = `s${section.id}-b${b.instanceId}`;
        const ctx = (b.contextLabel || '').trim();
        const title = ctx ? `${block.name} — ${ctx}` : block.name;

        const compiled = {
          id:    keyBase,
          type:  'check',
          title,
          meta:  sectionName,
          icon:  iconForBlock(block),
          items: block.steps.map(step => blockStepToItem(step, keyBase))
        };
        if (b.optional) compiled.optional = true;
        out.push(compiled);
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
