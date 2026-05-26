/*
  sandbox-store.js — v2 (simplified model)
  --------------------------------------------------------------
  Single LocalStorage blob for the CheckIt-2 checklist sandbox.

  Entities (intentionally small):
    - blocks      : reusable groups of ordered steps (the atom of authoring)
    - checklists  : compositions of blocks; each has a sections[] AND a
                    deployments[] array (a deployment binds the checklist
                    to a specific vehicle, with its own status/cadence).
    - vehicles    : mock rigs the user can deploy a checklist onto.

  Notes:
    - Templates / assignments / instances / assets are intentionally NOT
      separate entities. "Templates" and "checklists" are the same thing
      in the product vocabulary. "Assignments" are deployments inside a
      checklist. "Instances" are ephemeral run state (the ceremony page
      handles its own session state, not persisted here in v1).

  Public API:
    Store.load() / Store.save(data) / Store.reset()
    Store.exportJson() / Store.importJson(str)

    Block CRUD:
      Store.listBlocks() / getBlock(id) / upsertBlock(b) / deleteBlock(id)
      Store.setBlockStatus(id, 'draft' | 'published' | 'retired')

    Checklist CRUD:
      Store.listChecklists() / getChecklist(id) / upsertChecklist(c) / deleteChecklist(id)
      Store.setChecklistStatus(id, 'draft' | 'published' | 'retired')

    Deployment helpers (deployments live inside a checklist):
      Store.addDeployment(checklistId, { vehicleTag, status?, cadenceOverride? })
        → returns the saved deployment record
      Store.updateDeployment(checklistId, deploymentId, patch)
      Store.removeDeployment(checklistId, deploymentId)
      Store.listDeploymentsForVehicle(vehicleTag)
        → returns [{ checklist, deployment }] across all checklists
      Store.findDeployment(deploymentId)
        → returns { checklist, deployment } or null

    Vehicle (read-only in v1):
      Store.listVehicles() / getVehicle(tag)

  Event:
    window.addEventListener('checkit-sandbox-change', e => e.detail = { kind, action, id })
*/

(function () {
  'use strict';

  const STORAGE_KEY    = 'checkit-sandbox-v1';   // shared key; schemaVersion gates compat
  const SCHEMA_VERSION = 3;                       // bumped: blocks + checklists gained status/version fields
  const CHANGE_EVENT   = 'checkit-sandbox-change';

  // ---------- helpers --------------------------------------------------

  function ulidish() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function newId(kind) { return `${kind}_${ulidish()}`; }
  function nowIso() { return new Date().toISOString(); }

  function emptyBlob() {
    return {
      schemaVersion: SCHEMA_VERSION,
      blocks: {},
      checklists: {},
      vehicles: {},
      meta: { seededAt: null, lastModified: null }
    };
  }

  function emit(kind, action, id) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { kind, action, id } }));
  }

  // ---------- core load / save ----------------------------------------

  function load() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch (e) { console.warn('[sandbox-store] localStorage unavailable', e); return emptyBlob(); }

    if (!raw) {
      const seeded = (window.SandboxSeed && typeof window.SandboxSeed.build === 'function')
        ? window.SandboxSeed.build({ newId, nowIso })
        : emptyBlob();
      seeded.meta.seededAt    = nowIso();
      seeded.meta.lastModified = nowIso();
      save(seeded, { silent: true });
      return seeded;
    }

    try {
      const parsed = JSON.parse(raw);
      // If a stale v1 blob exists, wipe + reseed (we said we'd wipe on rebuild).
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        console.warn(`[sandbox-store] stored schemaVersion=${parsed.schemaVersion}, current=${SCHEMA_VERSION}; resetting.`);
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        return load(); // re-enter; will hit the seed branch
      }
      const blob = Object.assign(emptyBlob(), parsed);
      ['blocks','checklists','vehicles'].forEach(k => {
        if (!blob[k] || typeof blob[k] !== 'object') blob[k] = {};
      });
      // Defensive: every checklist gets a deployments array.
      Object.values(blob.checklists).forEach(c => {
        if (!Array.isArray(c.deployments)) c.deployments = [];
      });
      return blob;
    } catch (e) {
      console.error('[sandbox-store] failed to parse stored blob; resetting', e);
      const fresh = emptyBlob();
      save(fresh, { silent: true });
      return fresh;
    }
  }

  function save(data, opts) {
    data.meta = data.meta || {};
    data.meta.lastModified = nowIso();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.error('[sandbox-store] save failed', e); return false; }
    if (!opts || !opts.silent) emit('store', 'save', null);
    return true;
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    const fresh = load(); // triggers re-seed
    emit('store', 'reset', null);
    return fresh;
  }

  function exportJson() { return JSON.stringify(load(), null, 2); }

  function importJson(str) {
    let parsed;
    try { parsed = JSON.parse(str); }
    catch (e) { alert('Import failed: not valid JSON.\n' + e.message); return false; }
    if (!parsed || typeof parsed !== 'object') {
      alert('Import failed: JSON root must be an object.'); return false;
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const proceed = confirm(
        `This sandbox file uses schemaVersion=${parsed.schemaVersion}, ` +
        `but this page expects ${SCHEMA_VERSION}. Import anyway?`
      );
      if (!proceed) return false;
    }
    const blob = Object.assign(emptyBlob(), parsed);
    save(blob);
    emit('store', 'import', null);
    return true;
  }

  // ---------- generic CRUD --------------------------------------------

  function makeCrud(kind, storeKey) {
    return {
      list:   () => Object.values(load()[storeKey]),
      get:    (id) => load()[storeKey][id] || null,
      upsert: (record) => {
        const blob = load();
        const isNew = !record.id;
        const id = record.id || newId(kind);
        const now = nowIso();
        const existing = blob[storeKey][id] || {};
        const merged = Object.assign({}, existing, record, {
          id,
          createdAt: existing.createdAt || record.createdAt || now,
          updatedAt: now
        });
        // Defensive: checklists must carry a deployments array.
        if (kind === 'checklist' && !Array.isArray(merged.deployments)) merged.deployments = [];
        blob[storeKey][id] = merged;
        save(blob, { silent: true });
        emit(kind, isNew ? 'create' : 'update', id);
        return merged;
      },
      remove: (id) => {
        const blob = load();
        if (!blob[storeKey][id]) return false;
        delete blob[storeKey][id];
        save(blob, { silent: true });
        emit(kind, 'delete', id);
        return true;
      }
    };
  }

  const blocks     = makeCrud('block',     'blocks');
  const checklists = makeCrud('checklist', 'checklists');

  // ---------- status helpers ------------------------------------------
  // Shared lifecycle: 'draft' -> 'published' -> 'retired'.
  // Going draft -> published bumps `version` (and `publishedAt`); other
  // transitions just update the field. Production behavior would create a
  // separate immutable revision on publish (see sandbox-seed.js header
  // comment); this prototype mutates in place.
  function setStatus(storeKey, kind, id, status) {
    const allowed = ['draft', 'published', 'retired'];
    if (!allowed.includes(status)) return null;
    const blob = load();
    const rec = blob[storeKey][id];
    if (!rec) return null;
    const prev = rec.status || 'draft';
    if (prev === status) return rec;
    if (prev === 'draft' && status === 'published') {
      rec.version = (rec.version || 0) + 1;
      rec.publishedAt = nowIso();
    }
    rec.status = status;
    rec.updatedAt = nowIso();
    save(blob, { silent: true });
    emit(kind, 'update', id);
    return rec;
  }
  function setBlockStatus(id, status)     { return setStatus('blocks',     'block',     id, status); }
  function setChecklistStatus(id, status) { return setStatus('checklists', 'checklist', id, status); }

  // ---------- deployment helpers --------------------------------------
  // Deployments live inside a checklist's `deployments[]` array. These
  // helpers wrap the mutation so callers don't have to remember the shape.

  function addDeployment(checklistId, { vehicleTag, status, cadenceOverride }) {
    const blob = load();
    const cl = blob.checklists[checklistId];
    if (!cl) return null;
    if (!Array.isArray(cl.deployments)) cl.deployments = [];
    const dep = {
      id: newId('deploy'),
      vehicleTag,
      status: status || 'active',
      cadenceOverride: cadenceOverride || null,
      deployedAt: nowIso(),
      lastRunAt: null
    };
    cl.deployments.push(dep);
    cl.updatedAt = nowIso();
    save(blob, { silent: true });
    emit('deployment', 'create', dep.id);
    return dep;
  }

  function updateDeployment(checklistId, deploymentId, patch) {
    const blob = load();
    const cl = blob.checklists[checklistId];
    if (!cl || !Array.isArray(cl.deployments)) return null;
    const idx = cl.deployments.findIndex(d => d.id === deploymentId);
    if (idx === -1) return null;
    cl.deployments[idx] = Object.assign({}, cl.deployments[idx], patch);
    cl.updatedAt = nowIso();
    save(blob, { silent: true });
    emit('deployment', 'update', deploymentId);
    return cl.deployments[idx];
  }

  function removeDeployment(checklistId, deploymentId) {
    const blob = load();
    const cl = blob.checklists[checklistId];
    if (!cl || !Array.isArray(cl.deployments)) return false;
    const before = cl.deployments.length;
    cl.deployments = cl.deployments.filter(d => d.id !== deploymentId);
    if (cl.deployments.length === before) return false;
    cl.updatedAt = nowIso();
    save(blob, { silent: true });
    emit('deployment', 'delete', deploymentId);
    return true;
  }

  function listDeploymentsForVehicle(vehicleTag) {
    const blob = load();
    const out = [];
    Object.values(blob.checklists).forEach(cl => {
      (cl.deployments || []).forEach(d => {
        if (d.vehicleTag === vehicleTag) out.push({ checklist: cl, deployment: d });
      });
    });
    return out;
  }

  function findDeployment(deploymentId) {
    const blob = load();
    for (const cl of Object.values(blob.checklists)) {
      const dep = (cl.deployments || []).find(d => d.id === deploymentId);
      if (dep) return { checklist: cl, deployment: dep };
    }
    return null;
  }

  // ---------- vehicle (read-only in v1) -------------------------------

  function listVehicles() { return Object.values(load().vehicles); }
  function getVehicle(tag) { return load().vehicles[tag] || null; }

  // ---------- public surface ------------------------------------------

  window.Store = {
    SCHEMA_VERSION, STORAGE_KEY, CHANGE_EVENT,
    load, save, reset, exportJson, importJson,
    newId, nowIso,

    // blocks
    listBlocks:   blocks.list,
    getBlock:     blocks.get,
    upsertBlock:  blocks.upsert,
    deleteBlock:  blocks.remove,
    setBlockStatus,

    // checklists
    listChecklists:  checklists.list,
    getChecklist:    checklists.get,
    upsertChecklist: checklists.upsert,
    deleteChecklist: checklists.remove,
    setChecklistStatus,

    // deployments (inside checklists)
    addDeployment, updateDeployment, removeDeployment,
    listDeploymentsForVehicle, findDeployment,

    // vehicles
    listVehicles, getVehicle
  };
})();
