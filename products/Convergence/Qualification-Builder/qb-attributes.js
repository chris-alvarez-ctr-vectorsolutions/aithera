/* ============================================================
 * Advanced Properties + Attributes: shared include.
 *
 * This is the exact accordion pair from the Qualification and Requirement
 * builders (Manual-Requirement-Builder.html, AI-Qualification-Builder-v3.html):
 * the "Advanced Properties" settings card with the system-admin demo toggle,
 * the read-only ID / External ID / SKU / dates grid, "View audit history", and
 * the nested "Attributes" accordion (count, bulk remove, typed inputs, and the
 * searchable Add Attributes modal fed by ATTR_CATALOG). CSS, markup and
 * behaviour are lifted verbatim so it renders identically wherever it mounts.
 *
 * Usage:
 *   <script src="qb-attributes.js"></script>
 *   <div class="builder-details"><div id="qb-advanced"></div></div>
 *   QBAttrs.mount(document.getElementById('qb-advanced'), {
 *     idLabel: 'Activity ID', recordId: 'ACT-10137', externalId: '...', sku: '...',
 *     createdOn: '12/17/2025, 3:42 PM', updatedOn: '2/01/2026, 9:15 AM',
 *     active: true, attributes: [{ key:'difficulty', value:'Intermediate' }],
 *     typeLabel: 'activity', onChange: () => {}   // fires on any attribute edit
 *   });
 *   QBAttrs.getAttributes()  -> [{ key, name, type, value }]
 *
 * The wrapper's `builder-details` class matters: the builders' spacing rules
 * for these cards are scoped to it. Requires --vblue / --vblue-10 CSS vars
 * (every Convergence page defines them) and the Vector theme for the badge.
 * Toasts go to window.showToast if the host page defines it, else window.toast.
 * ============================================================ */
(function () {
  /* ─── CSS: verbatim from the builders. Button rules are scoped to
     .qb-attrs-scope so the host page's own .btn styling is untouched. ─── */
  const CSS = `
    /* Settings accordion (closed by default) */
    .sec-settings { border-top: 1px solid #f0f2f5; }
    .sec-settings-head { display: flex; align-items: center; gap: 9px; padding: 11px 16px; cursor: pointer; user-select: none; font-size: 12.5px; font-weight: 600; color: #374151; }
    .sec-settings-head .gear { color: #6b7280; font-size: 13px; }
    .sec-settings-head .caret { margin-left: auto; color: #9ca3af; font-size: 11px; transition: transform 0.18s; }
    .sec-settings.open .sec-settings-head .caret { transform: rotate(90deg); }
    .sec-settings-body { padding: 0 16px 14px 40px; display: none; }
    .sec-settings.open .sec-settings-body { display: block; }
    /* Settings shown as a nested card (not just whitespace) */
    .sec-settings.settings-card { border: 1px solid #e6e9f0; border-radius: 8px; background: #f8fafc; margin: 14px 16px; overflow: hidden; }
    .sec-settings.settings-card .sec-settings-head { padding: 12px 16px; }
    .sec-settings.settings-card .sec-settings-body { padding: 4px 16px 14px 38px; }
    /* Advanced Properties accordion grid */
    .adv-props { display: flex; flex-direction: column; gap: 12px; }
    .adv-prop { display: flex; align-items: center; gap: 12px; }
    .adv-prop .adv-label { font-size: 12px; font-weight: 600; color: #6b7280; width: 116px; flex-shrink: 0; text-align: right; }
    #advanced-props .sec-settings-body { padding-left: 16px; }
    /* Attributes accordion relocated to the bottom of Advanced Properties (low-use,
       tucked away): white card so it reads as distinct on the #f8fafc body. */
    #advanced-props #attrs-accordion { background: #fff; margin: 14px 0 0; }
    .adv-prop .adv-value { font-size: 13px; font-weight: 600; color: #374151; }
    /* Advanced Properties: system-admin demo toggle + inline editable fields (External ID / SKU) */
    .adv-demo-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 11px; margin-bottom: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 7px; font-size: 12px; font-weight: 600; color: #64748b; }
    .adv-demo-bar .adv-demo-label i { margin-right: 6px; }
    .adv-edit-input { width: 220px; max-width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 5px 9px; font-family: inherit; font-size: 13px; color: #374151; outline: none; }
    .adv-edit-input:focus { border-color: var(--vblue); box-shadow: 0 0 0 3px var(--vblue-10); }
    /* Settings + Attributes accordions: identical spacing, full width of the section */
    .builder-details .sec-settings.bh-accordion { margin: 0 0 12px; }
    .builder-details .sec-settings.bh-accordion:last-child { margin-bottom: 0; }

    /* Attributes */
    .attr-input-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .attr-input-row:last-child { border-bottom: none; }
    .attr-input-label { font-size: 12px; font-weight: 600; color: #374151; min-width: 130px; flex-shrink: 0; }
    .attr-input-row input[type=text], .attr-input-row select { flex: 1; border: 1px solid #d1d5db; border-radius: 5px; padding: 6px 10px; font-family: inherit; font-size: 12.5px; color: #374151; outline: none; transition: border-color 0.15s; background: #fff; }
    .attr-input-row input[type=text]:focus, .attr-input-row select:focus { border-color: #2563eb; }
    .attr-remove-btn { width: 24px; height: 24px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #d1d5db; font-size: 12px; transition: background 0.1s, color 0.1s; flex-shrink: 0; }
    .attr-remove-btn:hover { background: #fee2e2; color: #dc2626; }
    .attr-row-check { width: 16px; height: 16px; border: 1.5px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: transparent; font-size: 9px; cursor: pointer; }
    .attr-input-row.sel .attr-row-check { background: var(--vblue); border-color: var(--vblue); color: #fff; }
    .attr-bulk-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 12px; }
    .attr-bulk-bar.hidden { display: none; }
    .attr-input-row textarea { flex: 1; border: 1px solid #d1d5db; border-radius: 5px; padding: 6px 10px; font-family: inherit; font-size: 12.5px; color: #374151; outline: none; resize: vertical; min-height: 34px; }
    .attr-input-row input[type=number], .attr-input-row input[type=date] { flex: 1; border: 1px solid #d1d5db; border-radius: 5px; padding: 6px 10px; font-family: inherit; font-size: 12.5px; color: #374151; outline: none; }

    /* Add Attributes modal */
    .qb-attrs-scope.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 700; display: flex; align-items: center; justify-content: center; }
    .qb-attrs-scope.overlay.hidden { display: none; }
    .attr-modal { background: #fff; border-radius: 12px; width: 520px; max-width: calc(100vw - 48px); max-height: calc(100vh - 120px); display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.2); overflow: hidden; }
    .attr-modal-head { padding: 22px 24px 12px; }
    .attr-modal-head h3 { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .attr-modal-head p { font-size: 12.5px; color: #6b7280; margin: 4px 0 0; }
    .attr-modal-search { padding: 0 24px 12px; }
    .attr-modal-search input { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-family: inherit; font-size: 13px; outline: none; box-sizing: border-box; }
    .attr-modal-search input:focus { border-color: var(--vblue); }
    .attr-modal-list { flex: 1; overflow-y: auto; padding: 0 12px; border-top: 1px solid #eef0f3; border-bottom: 1px solid #eef0f3; }
    .attr-opt { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 6px; cursor: pointer; }
    .attr-opt:hover { background: #f8fafc; }
    .attr-opt.disabled { opacity: 0.45; cursor: not-allowed; }
    .attr-opt .attr-cb { width: 17px; height: 17px; border: 1.5px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: transparent; font-size: 10px; }
    .attr-opt.checked .attr-cb { background: var(--vblue); border-color: var(--vblue); color: #fff; }
    .attr-opt .attr-opt-name { font-size: 13px; color: #1a1a2e; flex: 1; }
    .attr-opt .attr-opt-type { font-size: 11px; color: #9ca3af; }
    .attr-opt .added-tag { font-size: 10px; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 2px 7px; border-radius: 10px; }
    .attr-modal-foot { padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .attr-modal-foot .sel-count { font-size: 12.5px; color: #6b7280; }

    /* Audit history modal */
    .audit-modal { background: #fff; border-radius: 12px; width: 760px; max-width: calc(100vw - 48px); padding: 26px 28px 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.22); }
    .audit-modal h3 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .audit-modal .audit-sub { font-size: 12.5px; color: #6b7280; margin-top: 3px; }
    .audit-table-wrap { border: 1px solid #eef0f3; border-radius: 8px; overflow: hidden; margin: 18px 0; }
    .audit-table { width: 100%; border-collapse: collapse; }
    .audit-table th { background: #f8fafc; text-align: left; padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #6b7280; border-bottom: 1px solid #eef0f3; }
    .audit-table td { padding: 11px 16px; font-size: 12.5px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .audit-table tr:last-child td { border-bottom: none; }
    .audit-user { color: #1a1a2e; }
    .audit-user small { display: block; color: #9ca3af; font-size: 11px; }
    .audit-footer { display: flex; justify-content: flex-end; gap: 10px; }

    /* Buttons: the builders' .btn family, scoped so the host page keeps its own */
    .qb-attrs-scope .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: background 0.1s; }
    .qb-attrs-scope .btn-primary { background: var(--vblue); color: #fff; }
    .qb-attrs-scope .btn-primary:hover { background: var(--vblue-hover); }
    .qb-attrs-scope .btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .qb-attrs-scope .btn-secondary:hover { background: #f9fafb; }
    .qb-attrs-scope .btn-ghost { background: transparent; color: #374151; }
    .qb-attrs-scope .btn-ghost:hover { background: #f3f4f6; }
    .qb-attrs-scope .btn-sm { padding: 5px 12px; font-size: 12px; }
    .qb-attrs-scope .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .qb-attrs-scope .hidden { display: none !important; }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-qb-attributes', '');
  style.textContent = CSS;
  document.head.appendChild(style);

  /* ─── Catalog (23 types): verbatim from the builders ─── */
  window.ATTR_CATALOG = [
    {key:'relatedAsset', name:'Related Asset',          type:'multiselect', options:[]},
    {key:'difficulty',   name:'Difficulty',             type:'select',  options:['Beginner','Intermediate','Advanced']},
    {key:'bodyHtml',     name:'Body HTML',              type:'html',    options:[]},
    {key:'department',   name:'Department',             type:'select',  options:['HR','Operations','Safety','Engineering','Maintenance']},
    {key:'jobFamily',    name:'Job Family',             type:'text',    options:[]},
    {key:'certification',name:'Certification Required', type:'select',  options:['Yes','No']},
    {key:'region',       name:'Region',                 type:'select',  options:['North America','EMEA','APAC','LATAM']},
    {key:'duration',     name:'Estimated Duration',     type:'text',    options:[]},
    {key:'compliance',   name:'Compliance Category',    type:'select',  options:['OSHA','ISO','FDA','Custom']},
    {key:'language',     name:'Language',               type:'select',  options:['English','Spanish','French','German']},
    {key:'provider',     name:'Provider',               type:'text',    options:[]},
    {key:'accreditation',name:'Accreditation Body',     type:'text',    options:[]},
    {key:'ceu',          name:'CEU Credits',            type:'number',  options:[]},
    {key:'version',      name:'Version',                type:'text',    options:[]},
    {key:'effectiveDate',name:'Effective Date',         type:'date',    options:[]},
    {key:'expiryDate',   name:'Expiration Date',        type:'date',    options:[]},
    {key:'renewal',      name:'Renewal Period (months)',type:'number',  options:[]},
    {key:'cost',         name:'Cost',                   type:'number',  options:[]},
    {key:'tags',         name:'Tags / Keywords',        type:'tags',    options:[]},
    {key:'audience',     name:'Audience',               type:'select',  options:['All Staff','Managers','Field','Office']},
    {key:'prerequisite', name:'Prerequisite',           type:'text',    options:[]},
    {key:'delivery',     name:'Delivery Method',        type:'select',  options:['Online','Instructor-Led','Blended']},
    {key:'externalRef',  name:'External Reference',     type:'text',    options:[]},
  ];

  /* ─── State (same names as the builders) ─── */
  let lpAttributes = [];
  let lpAttrSelected = new Set();
  let lpAttrModalSel = new Set();
  let attrIdCounter = 0;
  let sysAdmin = false;
  let cfg = { idLabel: 'Activity ID', recordId: '', externalId: '', sku: '', createdOn: '', updatedOn: '', active: true, typeLabel: 'activity', onChange: null };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showToast(msg){
    if (typeof window.showToast === 'function' && window.showToast !== showToast) return window.showToast(msg);
    if (typeof window.toast === 'function') return window.toast(msg);
  }
  function changed(){ if (typeof cfg.onChange === 'function') cfg.onChange(QBAttrs.getAttributes()); }

  /* ─── Markup: verbatim from the builders (labels parameterized) ─── */
  const ACCORDION = `
    <!-- Advanced Properties accordion (system metadata) -->
    <div class="sec-settings settings-card bh-accordion qb-attrs-scope" id="advanced-props">
      <div class="sec-settings-head" onclick="toggleAdvancedProps()">
        <i class="fa-solid fa-sliders gear"></i>
        <span>Advanced Properties</span>
        <i class="fa-solid fa-chevron-right caret"></i>
      </div>
      <div class="sec-settings-body">
        <div class="adv-demo-bar">
          <span class="adv-demo-label"><i class="fa-solid fa-flask"></i> Demo: permissions</span>
          <button class="btn btn-secondary btn-sm" id="sysadmin-toggle" onclick="toggleSysAdmin()">Enable system admin mode</button>
        </div>
        <div class="adv-props">
          <div class="adv-prop"><span class="adv-label">Status</span><span class="adv-value"><span theme="badge dot success" id="adv-status">Active</span></span></div>
          <div class="adv-prop"><span class="adv-label" id="adv-id-label">Activity ID</span><span class="adv-value" id="adv-id">—</span></div>
          <div class="adv-prop"><span class="adv-label">External ID (UID)</span><span class="adv-value" id="adv-extid">—</span></div>
          <div class="adv-prop"><span class="adv-label">SKU</span><span class="adv-value" id="adv-sku">—</span></div>
          <div class="adv-prop"><span class="adv-label">Created on</span><span class="adv-value" id="adv-created">—</span></div>
          <div class="adv-prop"><span class="adv-label">Updated on</span><span class="adv-value" id="adv-updated">—</span></div>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:14px" onclick="openAudit()"><i class="fa-solid fa-clock-rotate-left"></i> View audit history</button>
        <!-- Attributes (relocated here from the overview; low-use, tucked under Advanced Properties) -->
        <div class="sec-settings settings-card bh-accordion" id="attrs-accordion">
          <div class="sec-settings-head" onclick="toggleAttrs()">
            <i class="fa-solid fa-tags gear"></i>
            <span>Attributes</span>
            <span class="count-badge" id="attrs-count-badge" style="margin-left:8px">0</span>
            <i class="fa-solid fa-chevron-right caret" id="attrs-caret"></i>
          </div>
          <div class="sec-settings-body" id="attrs-body">
            <div class="attr-bulk-bar hidden" id="attr-bulk-bar">
              <span id="attr-bulk-count">0 selected</span>
              <button class="btn btn-secondary btn-sm" onclick="removeSelectedAttrs()"><i class="fa-regular fa-trash-can"></i> Remove Selected</button>
            </div>
            <div id="attrs-list"></div>
            <button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="openAttrModal()"><i class="fa-solid fa-plus"></i> Add Attribute</button>
          </div>
        </div>
      </div>
    </div>`;

  const MODALS = `
    <div class="overlay hidden qb-attrs-scope" id="attr-modal-overlay">
      <div class="attr-modal">
        <div class="attr-modal-head">
          <h3>Add Attributes</h3>
          <p>Select one or more attributes to attach to this activity. Attributes already added are disabled.</p>
        </div>
        <div class="attr-modal-search">
          <input type="text" id="attr-modal-search" placeholder="Search attributes..." oninput="renderAttrModalList(this.value)">
        </div>
        <div class="attr-modal-list" id="attr-modal-list"></div>
        <div class="attr-modal-foot">
          <span class="sel-count" id="attr-sel-count">0 selected</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" onclick="closeAttrModal()">Cancel</button>
            <button class="btn btn-primary" id="attr-modal-add-btn" disabled onclick="addSelectedAttrs()">Add</button>
          </div>
        </div>
      </div>
    </div>
    <div class="overlay hidden qb-attrs-scope" id="audit-overlay">
      <div class="audit-modal">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <h3 id="audit-title">Activity Audit History</h3>
            <div class="audit-sub" id="audit-sub">This is a record of what changes have been made to this activity.</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="closeAudit()" style="padding:4px 8px"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="audit-table-wrap">
          <table class="audit-table">
            <thead><tr><th>Username</th><th>Action</th><th>Date</th><th>Scope</th></tr></thead>
            <tbody>
              <tr><td class="audit-user">Andy Xia<small>andy.xia@vectorsolutions.com</small></td><td>Created</td><td>11/17/2025 5:29:43 PM</td><td>CreateActivity</td></tr>
              <tr><td class="audit-user">Andy Xia<small>andy.xia@vectorsolutions.com</small></td><td>Updated</td><td>12/17/2025 5:29:43 PM</td><td>UpdateActivity</td></tr>
              <tr><td class="audit-user">Clare Epstein<small>clare.epstein@vectorsolutions.com</small></td><td>Published</td><td>1/17/2026 4:23:13 PM</td><td>PublishActivity</td></tr>
              <tr><td class="audit-user">Andy Xia<small>andy.xia@vectorsolutions.com</small></td><td>Updated</td><td>2/1/2026 4:23:13 PM</td><td>UpdateActivity</td></tr>
            </tbody>
          </table>
        </div>
        <div class="audit-footer">
          <button class="btn btn-secondary" onclick="refreshAudit()"><i class="fa-solid fa-rotate"></i> Refresh</button>
          <button class="btn btn-primary" onclick="closeAudit()">Done</button>
        </div>
      </div>
    </div>`;

  /* ─── Advanced Properties (verbatim behaviour) ─── */
  window.toggleAdvancedProps = function(){ const a=document.getElementById('advanced-props'); if(a) a.classList.toggle('open'); };
  window.toggleSysAdmin = function(){
    sysAdmin = !sysAdmin;
    const btn=document.getElementById('sysadmin-toggle');
    if(btn) btn.textContent = sysAdmin ? 'Disable system admin mode' : 'Enable system admin mode';
    renderAdvancedProps();
  };
  function setAdvStatus(){
    const el=document.getElementById('adv-status'); if(!el) return;
    el.textContent = cfg.active ? 'Active' : 'Inactive';
    el.setAttribute('theme', cfg.active ? 'badge dot success' : 'badge dot contrast');
  }
  function renderAdvancedProps(){
    setAdvStatus();
    const lbl=document.getElementById('adv-id-label'); if(lbl) lbl.textContent = cfg.idLabel;
    const idEl=document.getElementById('adv-id'); if(idEl) idEl.textContent = cfg.recordId || 'Assigned on save';
    const extVal = cfg.externalId || 'Assigned on save';
    const skuVal = cfg.sku || 'Assigned on save';
    const editable = sysAdmin;   // a system admin can edit SKU / External ID; everyone else sees read-only text
    const ext=document.getElementById('adv-extid'); if(ext) ext.innerHTML = editable ? `<input class="adv-edit-input" id="adv-extid-input" value="${esc(cfg.externalId || '')}" placeholder="Auto-assigned on save">` : esc(extVal);
    const sku=document.getElementById('adv-sku'); if(sku) sku.innerHTML = editable ? `<input class="adv-edit-input" id="adv-sku-input" value="${esc(cfg.sku || '')}" placeholder="Auto-assigned on save">` : esc(skuVal);
    const c=document.getElementById('adv-created'); if(c) c.textContent = cfg.createdOn || 'Not saved yet';
    const u=document.getElementById('adv-updated'); if(u) u.textContent = cfg.updatedOn || 'Not saved yet';
  }
  window.openAudit = function(){
    const t=document.getElementById('audit-title'); if(t) t.textContent = cap(cfg.typeLabel) + ' Audit History';
    const s=document.getElementById('audit-sub'); if(s) s.textContent = 'This is a record of what changes have been made to this ' + cfg.typeLabel + '.';
    document.getElementById('audit-overlay').classList.remove('hidden');
  };
  window.closeAudit = function(){ document.getElementById('audit-overlay').classList.add('hidden'); };
  window.refreshAudit = function(){ showToast('Audit history refreshed'); };
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  /* ─── Attributes (verbatim behaviour) ─── */
  window.toggleAttrs = function(){ const a=document.getElementById('attrs-accordion'); if(a) a.classList.toggle('open'); };
  function attrInputHtml(attr){
    switch(attr.type){
      case 'select':
        return `<select onchange="updateAttrValue(${attr.id}, this.value)">${attr.options.map(o=>`<option ${attr.value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
      case 'number':
        return `<input type="number" value="${esc(attr.value)}" placeholder="0" oninput="updateAttrValue(${attr.id}, this.value)">`;
      case 'date':
        return `<input type="date" value="${esc(attr.value)}" oninput="updateAttrValue(${attr.id}, this.value)">`;
      case 'tags':
        return `<input type="text" value="${esc(attr.value)}" placeholder="Comma-separated tags…" oninput="updateAttrValue(${attr.id}, this.value)">`;
      case 'multiselect':
        return `<input type="text" value="${esc(attr.value)}" placeholder="Search assets by name, parent, or location…" oninput="updateAttrValue(${attr.id}, this.value)">`;
      case 'html':
        return `<textarea placeholder="Enter HTML / rich text…" oninput="updateAttrValue(${attr.id}, this.value)">${esc(attr.value)}</textarea>`;
      default:
        return `<input type="text" value="${esc(attr.value)}" placeholder="Enter ${esc(attr.name)}…" oninput="updateAttrValue(${attr.id}, this.value)">`;
    }
  }
  window.renderAttrs = function(){
    const list = document.getElementById('attrs-list');
    const badge = document.getElementById('attrs-count-badge');
    if(badge) badge.textContent = lpAttributes.length;
    if(!list) return;
    if(!lpAttributes.length){
      list.innerHTML='<div style="text-align:center;padding:16px;color:#9ca3af;font-size:12.5px">No attributes have been added to this ' + esc(cfg.typeLabel) + '.</div>';
      updateAttrBulkBar();
      return;
    }
    list.innerHTML = lpAttributes.map(attr =>
      `<div class="attr-input-row ${lpAttrSelected.has(attr.id)?'sel':''}">
        <div class="attr-row-check" onclick="toggleAttrRowSel(${attr.id})" title="Select for bulk remove"><i class="fa-solid fa-check"></i></div>
        <span class="attr-input-label">${esc(attr.name)}</span>
        ${attrInputHtml(attr)}
        <button class="attr-remove-btn" onclick="removeAttr(${attr.id})" title="Remove attribute"><i class="fa-solid fa-trash-can"></i></button>
      </div>`
    ).join('');
    updateAttrBulkBar();
  };
  window.updateAttrValue = function(id, val){ const attr = lpAttributes.find(a=>a.id===id); if(attr){ attr.value = val; changed(); } };
  window.removeAttr = function(id){ lpAttributes = lpAttributes.filter(a=>a.id!==id); lpAttrSelected.delete(id); renderAttrs(); showToast('Attribute removed'); changed(); };
  window.toggleAttrRowSel = function(id){ lpAttrSelected.has(id) ? lpAttrSelected.delete(id) : lpAttrSelected.add(id); renderAttrs(); };
  function updateAttrBulkBar(){
    const bar = document.getElementById('attr-bulk-bar');
    if(!bar) return;
    const n = lpAttrSelected.size;
    bar.classList.toggle('hidden', n===0);
    const c = document.getElementById('attr-bulk-count'); if(c) c.textContent = n + ' selected';
  }
  window.removeSelectedAttrs = function(){
    if(!lpAttrSelected.size) return;
    const n = lpAttrSelected.size;
    lpAttributes = lpAttributes.filter(a=>!lpAttrSelected.has(a.id));
    lpAttrSelected = new Set();
    renderAttrs();
    showToast(n + ' attribute' + (n!==1?'s':'') + ' removed');
    changed();
  };
  window.openAttrModal = function(){
    lpAttrModalSel = new Set();
    const s=document.getElementById('attr-modal-search'); if(s) s.value='';
    renderAttrModalList('');
    document.getElementById('attr-modal-overlay').classList.remove('hidden');
  };
  window.closeAttrModal = function(){ document.getElementById('attr-modal-overlay').classList.add('hidden'); };
  window.renderAttrModalList = function(search){
    const addedKeys = new Set(lpAttributes.map(a=>a.key));
    const q = (search||'').toLowerCase();
    const list = document.getElementById('attr-modal-list');
    const items = ATTR_CATALOG.filter(c=>!q || c.name.toLowerCase().includes(q));
    list.innerHTML = items.map(c => {
      const added = addedKeys.has(c.key);
      const checked = lpAttrModalSel.has(c.key);
      return `<div class="attr-opt ${added?'disabled':''} ${checked?'checked':''}" ${added?'':`onclick="toggleAttrSel('${c.key}')"`}>
        <div class="attr-cb"><i class="fa-solid fa-check"></i></div>
        <span class="attr-opt-name">${esc(c.name)}</span>
        ${added ? '<span class="added-tag">Added</span>' : `<span class="attr-opt-type">${esc(c.type)}</span>`}
      </div>`;
    }).join('') || '<div style="padding:18px;text-align:center;color:#9ca3af;font-size:12.5px">No matching attributes.</div>';
    updateAttrModalFoot();
  };
  window.toggleAttrSel = function(key){ lpAttrModalSel.has(key) ? lpAttrModalSel.delete(key) : lpAttrModalSel.add(key); renderAttrModalList(document.getElementById('attr-modal-search').value); };
  function updateAttrModalFoot(){
    const n = lpAttrModalSel.size;
    document.getElementById('attr-sel-count').textContent = n + ' selected';
    document.getElementById('attr-modal-add-btn').disabled = n===0;
  }
  window.addSelectedAttrs = function(){
    lpAttrModalSel.forEach(key => {
      const def = ATTR_CATALOG.find(c=>c.key===key);
      if(def && !lpAttributes.find(a=>a.key===key)){
        const defaultVal = def.type==='select' ? (def.options[0]||'') : '';
        lpAttributes.push({id:++attrIdCounter, key:def.key, name:def.name, type:def.type, options:def.options, value:defaultVal});
      }
    });
    const n = lpAttrModalSel.size;
    closeAttrModal();
    renderAttrs();
    const a = document.getElementById('attrs-accordion');
    if(a && !a.classList.contains('open')) a.classList.add('open');   // open the accordion so the new attributes are visible
    if(n) showToast(n + ' attribute' + (n!==1?'s':'') + ' added');
    changed();
  };

  /* ─── Public API ─── */
  let mounted = false;
  window.QBAttrs = {
    mount(container, options){
      cfg = Object.assign(cfg, options || {});
      container.innerHTML = ACCORDION;
      if (!mounted) {
        const host = document.createElement('div');
        host.innerHTML = MODALS;
        while (host.firstChild) document.body.appendChild(host.firstChild);
        mounted = true;
      }
      this.setAttributes(cfg.attributes || []);
      renderAdvancedProps();
    },
    /* Replace the attribute list from [{key, value}] (names/types resolved from the catalog). */
    setAttributes(list){
      lpAttributes = [];
      lpAttrSelected = new Set();
      (list || []).forEach(item => {
        const def = ATTR_CATALOG.find(c => c.key === item.key);
        if (!def) return;
        lpAttributes.push({ id: ++attrIdCounter, key: def.key, name: def.name, type: def.type, options: def.options, value: item.value == null ? (def.type === 'select' ? (def.options[0] || '') : '') : item.value });
      });
      renderAttrs();
    },
    getAttributes(){ return lpAttributes.map(a => ({ key: a.key, name: a.name, type: a.type, value: a.value })); },
    /* Update the read-only properties (for example after Save or Publish). */
    update(options){ cfg = Object.assign(cfg, options || {}); renderAdvancedProps(); },
    isSysAdmin(){ return sysAdmin; },
  };
})();
