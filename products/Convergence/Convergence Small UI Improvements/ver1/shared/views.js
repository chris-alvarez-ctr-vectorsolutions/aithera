/* ===========================================================================
   AREA 3 + 4 - MY TRAINING
   ======================================================================== */
const meter = (p) => p ? `
  <span class="meter">
    <span class="meter-track"><span class="meter-fill" style="width:${Math.round((p.done / p.total) * 100)}%"></span></span>
    <span class="meter-label"><strong>${p.done} of ${p.total}</strong> <span class="meter-unit">${p.unit}</span></span>
  </span>` : '';

const pill = (s) => `<span class="pill ${STATUS[s].cls}">${STATUS[s].label}</span>`;

/* Row actions. The details action is a circle-info (the chat bubble it
   replaces read as "comment", not "open the details page") and every use
   carries a data-open ref so the same wiring drives list rows, cards and
   the drill-in rows on the detail pages. Attachments get their own glyph. */
const detailsBtn = (kind, id, label) =>
  `<button class="icon-btn js-open" data-open="${kind}:${id}" title="View details: ${esc(label)}" aria-label="View details: ${esc(label)}"><i class="fa-solid fa-circle-info"></i></button>`;
const attachBtn = (kind, id, label) =>
  `<button class="icon-btn js-open" data-open="${kind}:${id}" title="View attachments: ${esc(label)}" aria-label="View attachments: ${esc(label)}"><i class="fa-solid fa-paperclip"></i></button>`;
/* A class that still needs a session cannot be launched; its action opens
   the details page where the session is chosen. */
const actionBtn = (a) => a.type === 'class'
  ? `<vaadin-button theme="secondary" class="btn-compact" data-open="act:${a.id}">Details</vaadin-button>`
  : `<vaadin-button theme="primary" class="btn-compact">Launch</vaadin-button>`;
function wireOpenRefs(root) {
  root.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', (e) => {
    if (e.target.closest('vaadin-button') && !el.matches('vaadin-button')) return;
    e.stopPropagation();
    const [kind, id] = el.dataset.open.split(':');
    showDetails(kind, id);
  }));
}

/* state.collapsed holds USER-TOGGLED nodes, so a default-collapsed group
   opens on its first click instead of being forced shut forever. */
function isOpen(id, dflt) {
  return state.collapsed.has(id) ? !dflt : dflt;
}
function toggleNode(id, dflt) {
  if (state.collapsed.has(id)) state.collapsed.delete(id);
  else state.collapsed.add(id);
  renderTraining();
}

function disc(id, open) {
  return `<button class="disc" data-node="${id}" aria-expanded="${open}" aria-label="${open ? 'Collapse' : 'Expand'}"><i class="fa-solid fa-chevron-down"></i></button>`;
}

function renderTraining() {
  const cards = state.trainingView !== 'list';
  const root = $('#tp');
  const out = [];

  if (!cards) {
    out.push(`<div class="tp-head">
      <span>Name</span>
      <span>Completion</span>
      <span class="col-dur">Duration</span>
      <span class="col-spent">Time spent</span>
      <span class="col-due">Due</span>
      <span class="col-actions">Actions</span>
    </div>`);
  }

  const planOpen = isOpen('plan', true);
  out.push(`<div class="tp-group">
    <span class="tp-name-cell">
      ${disc('plan', planOpen)}
      <span class="tp-name">${esc(TRAINING.name)}</span>
    </span>
    <span>${meter(TRAINING.progress)}</span>
    <span class="col-dur"></span><span class="col-spent"></span><span class="col-due"></span>
    <span class="tp-actions"></span>
  </div>`);

  if (planOpen) TRAINING.quals.forEach(q => {
    const qOpen = isOpen(q.id, q.open);
    out.push(`<div class="tp-qual">
      <span class="tp-name-cell">
        ${disc(q.id, qOpen)}
        <span class="tglyph"><i class="fa-solid fa-medal"></i></span>
        <span class="tp-name">${esc(q.name)}</span>
      </span>
      <span>${meter(q.progress)}</span>
      <span class="col-dur"></span><span class="col-spent"></span><span class="col-due"></span>
      <span class="tp-actions"><span class="row-acts">${detailsBtn('qual', q.id, q.name)}</span></span>
    </div>`);
    if (!qOpen) return;

    q.reqs.forEach(r => {
      const rOpen = isOpen(r.id, r.open);
      out.push(`<div class="tp-req">
        <span class="tp-name-cell">
          ${disc(r.id, rOpen)}
          <span class="tglyph"><i class="fa-solid fa-award"></i></span>
          <span class="tp-name">${esc(r.name)}</span>
          ${r.notice ? `<span class="notice"><i class="fa-solid fa-circle-info"></i><span class="notice-text">${esc(r.notice)}</span></span>` : ''}
        </span>
        <span>${meter(r.progress)}</span>
        <span class="col-dur"></span><span class="col-spent"></span><span class="col-due"></span>
        <span class="tp-actions"><span class="row-acts">${detailsBtn('req', r.id, r.name)}</span></span>
      </div>`);
      if (!rOpen) return;

      if (cards) {
        out.push(`<div class="tp-cardwrap">
          <div class="card-grid">${r.acts.map(cardHTML).join('')}</div>
        </div>`);
      } else {
        r.acts.forEach(a => out.push(rowHTML(a)));
      }
    });
  });

  root.innerHTML = out.join('');
  root.querySelectorAll('.disc').forEach(b =>
    b.addEventListener('click', () => toggleNode(b.dataset.node)));
  wireOpenRefs(root);
}

function rowHTML(a) {
  const t = TYPES[a.type];
  const overdue = a.status === 'overdue';
  return `<div class="tp-act">
    <span class="tp-actname">
      <span class="tp-launch">${actionBtn(a)}</span>
      <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
      <span class="tp-title" title="${esc(a.name)}">${esc(a.name)}</span>
    </span>
    <span>${pill(a.status)}</span>
    <span class="col-num col-dur">${esc(a.dur || '')}</span>
    <span class="col-num col-spent ${a.spent ? '' : 'col-empty'}">${esc(a.spent || '-')}</span>
    <span class="col-num col-due ${overdue ? 'is-overdue' : (a.due ? '' : 'col-empty')}">${esc(a.due || '-')}</span>
    <span class="col-actions"><span class="row-acts">${a.attachment ? attachBtn('act', a.id, a.name) : ''}${detailsBtn('act', a.id, a.name)}</span></span>
  </div>`;
}

function cardHTML(a) {
  const t = TYPES[a.type];
  const overdue = a.status === 'overdue';
  return `<article class="tcard">
    <div class="thumb tcard-thumb ${t.thumb}">
      <i class="fa-solid ${t.icon}"></i>
      <span class="tcard-badge">${pill(a.status)}</span>
      ${a.dur ? `<span class="tcard-dur">${esc(a.dur)}</span>` : ''}
    </div>
    <div class="tcard-body">
      <h3 class="tcard-title">
        <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
        <span title="${esc(a.name)}">${esc(a.name)}</span>
      </h3>
      <p class="tcard-meta ${overdue ? 'is-overdue' : ''}">
        <i class="fa-regular fa-calendar"></i>${a.due ? 'Due ' + esc(a.due) : 'No due date'}
      </p>
    </div>
    <div class="tcard-foot">
      <span class="row-acts">${a.attachment ? attachBtn('act', a.id, a.name) : ''}${detailsBtn('act', a.id, a.name)}</span>
      ${actionBtn(a)}
    </div>
  </article>`;
}

function setTrainingView(v) {
  state.trainingView = v;
  $$('#viewToggle button, #viewToggle2 button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  const wrap = $('#tp');
  wrap.classList.toggle('tp-cards', v !== 'list');
  wrap.classList.toggle('dense', v === 'dense');
  wrap.classList.toggle('large', v === 'large');
  renderTraining();
}

function renderFilterPanel() {
  $('#fpViews').innerHTML = VIEW_BY.map(v =>
    `<button class="fp-item ${v.id === state.viewBy ? 'selected' : ''}" data-view-by="${v.id}">
       <i class="fa-solid ${v.icon}"></i><span>${v.label}</span>
     </button>`).join('');
  $$('#fpViews .fp-item').forEach(b => b.addEventListener('click', () => {
    state.viewBy = b.dataset.viewBy;
    renderFilterPanel();
  }));
}

/* ===========================================================================
   AREA 5 - CATALOG
   ======================================================================== */
function catalogCat() {
  return CATALOG_CATS.find(c => c.id === state.catalogCat) || CATALOG_CATS[0];
}
function catalogTitle() {
  if (state.catalogView === 'cards') return 'Catalog';
  const cat = catalogCat();
  return `${cat.name} (${cat.count || cat.items.length})`;
}

function renderCatalog() {
  const head = `<thead><tr>
    <th style="width:96px">Type</th>
    <th class="col-w-name">Name</th>
    <th style="width:110px">Update status</th>
    <th class="c-nowrap" style="width:160px">Author</th>
    <th class="c-mid" style="width:80px">Mobile</th>
    <th class="c-nowrap" style="width:130px">Price</th>
    <th class="c-nowrap" style="width:130px">Duration</th>
    <th style="width:110px">Status</th>
    <th style="width:130px">Actions</th>
  </tr></thead>`;

  const body = catalogCat().items.map(c => {
    const t = TYPES[c.type];
    const st = c.status === 'Enrolled' ? 'pill-complete'
             : c.status === 'Retiring' ? 'pill-progress' : 'pill-incomplete';
    return `<tr>
      <td><span class="thumb cat-thumb ${t.thumb}"><i class="fa-solid ${t.icon}"></i></span></td>
      <td>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-name-sub">${esc(c.code)}</span>
      </td>
      <td>${c.isNew ? '<span class="pill pill-new no-dot">New</span>' : '<span style="color:var(--c-faint)">-</span>'}</td>
      <td class="c-nowrap">${esc(c.author)}</td>
      <td class="c-mid">${c.mobile
        ? '<span class="glyph glyph-yes" title="Available on mobile"><i class="fa-solid fa-check"></i></span>'
        : '<span class="glyph glyph-no" title="Not available on mobile"><i class="fa-solid fa-xmark"></i></span>'}</td>
      <td class="c-nowrap">${esc(c.price)}</td>
      <td class="cat-num">${esc(c.dur)}</td>
      <td><span class="pill ${st}">${esc(c.status)}</span></td>
      <td><vaadin-button theme="tertiary" class="btn-compact">View details</vaadin-button></td>
    </tr>`;
  }).join('');

  $('#catTable').innerHTML = head + '<tbody>' + body + '</tbody>';
}

/* ===========================================================================
   AREA 6 - CONTENT WIZARD
   ======================================================================== */
function tileHTML(t, selected) {
  return `<button class="wz-tile ${selected ? 'selected' : ''}" data-tile="${t.id}">
    <span class="wz-tile-check"><i class="fa-solid fa-check"></i></span>
    <span class="wz-tile-icon"><i class="fa-solid ${t.icon}"></i></span>
    <span class="wz-tile-label">${t.label}</span>
    <span class="wz-tile-sub">${t.sub}</span>
  </button>`;
}

function renderWizard() {
  const w = state.wizard;
  const body = $('#wzBody');
  const foot = $('#wzFoot');
  $$('#wzStepper .step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === w.step);
    el.classList.toggle('complete', i + 1 < w.step);
  });

  const typeLabel = w.type ? (WZ_TYPES.find(t => t.id === w.type) || {}).label : 'activity';

  if (w.step === 1) {
    const chosen = WZ_METHODS.find(m => m.id === w.method);
    body.innerHTML = `
      <div class="wz-head">
        <h2 class="wz-title">How do you want to add content?</h2>
        <p class="wz-help">${chosen ? esc(chosen.sub) : 'Select import, create or copy to get started.'}</p>
      </div>
      <div class="wz-tiles cols-3">${WZ_METHODS.map(m => tileHTML(m, m.id === w.method)).join('')}</div>`;
    foot.innerHTML = `
      <span class="wz-foot-hint">${w.method ? 'Ready to start.' : 'Choose one option to continue.'}</span>
      <vaadin-button theme="primary" id="wzNext" ${w.method ? '' : 'disabled'}>Start</vaadin-button>`;
  }

  if (w.step === 2) {
    const chosen = WZ_TYPES.find(t => t.id === w.type);
    body.innerHTML = `
      <div class="wz-head">
        <h2 class="wz-title">What type of content do you want to create?</h2>
        <p class="wz-help">${chosen ? `Create a ${esc(chosen.label)}. ${esc(chosen.sub)}` : 'Pick a content type to see what it does.'}</p>
      </div>
      <div class="wz-tiles cols-4">${WZ_TYPES.map(t => tileHTML(t, t.id === w.type)).join('')}</div>`;
    foot.innerHTML = `
      <vaadin-button theme="secondary" id="wzBack">Back</vaadin-button>
      <vaadin-button theme="primary" id="wzNext" ${w.type ? '' : 'disabled'}>Next</vaadin-button>`;
  }

  if (w.step === 3) {
    body.innerHTML = `
      <div class="wz-head">
        <h2 class="wz-title">Specify a save location</h2>
        <p class="wz-help">Where would you like to save this ${esc(typeLabel)}?</p>
      </div>
      <div class="wz-picker">
        ${w.repo ? `
          <div class="wz-picked">
            <i class="fa-solid fa-circle-check"></i>
            <span>${esc(w.repo)}</span>
          </div>
          <vaadin-button theme="tertiary" id="wzPick">Change repository</vaadin-button>
        ` : `
          <div class="wz-empty">
            <i class="fa-solid fa-folder-open"></i>
            <p>No repository selected yet. Repositories control who can find and reuse this ${esc(typeLabel)}.</p>
            <vaadin-button theme="secondary" id="wzPick">
              <i class="fa-solid fa-folder-open" style="margin-right:6px"></i>Select a repository
            </vaadin-button>
          </div>
        `}
      </div>`;
    foot.innerHTML = `
      <vaadin-button theme="secondary" id="wzBack">Back</vaadin-button>
      <vaadin-button theme="primary" id="wzNext" ${w.repo ? '' : 'disabled'}>Next</vaadin-button>`;
  }

  if (w.step === 4) {
    body.innerHTML = `
      <div class="wz-head">
        <h2 class="wz-title">Set activity properties</h2>
        <p class="wz-help">These properties can be edited later.</p>
      </div>
      <p class="wz-reqnote"><span class="req">*</span> Indicates a required field.</p>
      <div class="wz-form">
        <div class="wz-field">
          <label class="wz-label" for="wzName">Display name<span class="req">*</span></label>
          <vaadin-text-field theme="outlined" id="wzName" placeholder="For example, Lockout Tagout Quiz"
            style="width:100%" value="${esc(state.wizard.displayName)}"></vaadin-text-field>
        </div>
        <div class="wz-field">
          <label class="wz-label" for="wzDesc">Description</label>
          <vaadin-text-area theme="outlined" id="wzDesc" placeholder="What learners will do in this activity"
            style="width:100%"></vaadin-text-area>
          <span class="wz-hint">Shown to learners in the catalog and on the activity card.</span>
        </div>
        <div class="wz-field">
          <label class="wz-label" for="wzDur">Activity duration<span class="req">*</span></label>
          <div class="wz-inline">
            <vaadin-number-field theme="outlined" id="wzDur" value="15" min="1" style="width:120px"></vaadin-number-field>
            <span class="unit">minutes</span>
          </div>
        </div>
        <div class="wz-field">
          <label class="wz-label" for="wzPublic">Make public</label>
          <vaadin-combo-box theme="outlined" id="wzPublic" style="width:180px"></vaadin-combo-box>
          <span class="wz-hint">Public activities appear in the catalog for every location below the save location.</span>
        </div>
      </div>`;
    foot.innerHTML = `
      <vaadin-button theme="secondary" id="wzBack">Back</vaadin-button>
      <vaadin-button theme="primary" id="wzNext" ${state.wizard.displayName.trim() ? '' : 'disabled'}>Next</vaadin-button>`;

    const pub = $('#wzPublic');
    pub.items = ['No', 'Yes'];
    pub.value = 'No';
    const nameField = $('#wzName');
    nameField.addEventListener('input', () => {
      state.wizard.displayName = nameField.value || '';
      const next = $('#wzNext');
      if (next) next.disabled = !state.wizard.displayName.trim();
    });
  }

  // Wire tiles + footer for the current step
  $$('.wz-tile', body).forEach(t => t.addEventListener('click', () => {
    if (w.step === 1) w.method = t.dataset.tile;
    if (w.step === 2) w.type = t.dataset.tile;
    renderWizard();
  }));
  const pick = $('#wzPick');
  if (pick) pick.addEventListener('click', () => {
    state.wizard.repo = 'Safety › Quizzes (UAT Environment)';
    renderWizard();
  });
  const back = $('#wzBack');
  if (back) back.addEventListener('click', () => { w.step = Math.max(1, w.step - 1); renderWizard(); });
  const next = $('#wzNext');
  if (next) next.addEventListener('click', () => {
    if (next.disabled) return;
    if (w.step === 1 && w.method !== 'create') { w.step = 3; renderWizard(); return; }
    w.step = Math.min(4, w.step + 1);
    renderWizard();
  });
}

/* ===========================================================================
   AREA 7 - HOME DASHBOARD
   ======================================================================== */

/* One ring geometry for all three cards. The completed arc is always the
   action blue: three arbitrary colours (pale green / pale blue / orange) made
   the legacy cards look unrelated, and colour carried no meaning. State is
   carried by the label and the pill instead. */
function ringSVG(pct, empty) {
  const r = 54, c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * c;
  return `<svg class="ring${empty ? ' is-empty' : ''}" viewBox="0 0 132 132" aria-hidden="true">
    <circle class="ring-track" cx="66" cy="66" r="${r}"></circle>
    ${empty ? '' : `<circle class="ring-fill" cx="66" cy="66" r="${r}" stroke-dasharray="${dash} ${c}"></circle>`}
  </svg>`;
}

function statHTML(s) {
  if (s.empty) {
    return `<div class="stat">
      <h3 class="stat-label">${esc(s.label)}</h3>
      <div class="stat-ring">
        ${ringSVG(0, true)}
        <div class="stat-center">
          <span class="stat-none">None</span>
          <span class="stat-caption">assigned</span>
        </div>
      </div>
      <p class="stat-hint">${esc(s.hint)}</p>
      <vaadin-button theme="tertiary" class="btn-compact">Browse the catalog</vaadin-button>
    </div>`;
  }
  const pct = Math.round((s.done / s.total) * 100);
  const left = s.total - s.done;
  return `<div class="stat">
    <h3 class="stat-label">${esc(s.label)}</h3>
    <div class="stat-ring">
      ${ringSVG(pct)}
      <div class="stat-center">
        <span class="stat-pct">${pct}%</span>
        <span class="stat-caption">complete</span>
      </div>
    </div>
    <p class="stat-hint">${s.done} of ${s.total} done<br><strong>${left} to go</strong></p>
    <vaadin-button theme="tertiary" class="btn-compact">View incomplete items</vaadin-button>
  </div>`;
}

function emptyHTML(icon, title, text, action) {
  return `<div class="empty">
    <span class="empty-icon"><i class="fa-solid ${icon}"></i></span>
    <p class="empty-title">${esc(title)}</p>
    <p class="empty-text">${esc(text)}</p>
    ${action ? `<vaadin-button theme="secondary" class="btn-compact">${esc(action)}</vaadin-button>` : ''}
  </div>`;
}

function renderHome() {
  /* My progress */
  $('#homeProgress').innerHTML = HOME.progress.map(statHTML).join('');

  /* Upcoming training: the same header and row treatment as the catalog
     table, and Launch is the shared primary button (the legacy green read as
     a success state and matched nothing else in the product). */
  const up = $('#homeUpcoming');
  if (!HOME.upcoming.length) {
    up.innerHTML = emptyHTML('fa-graduation-cap', 'Nothing coming up',
      'Training assigned to you will appear here with its due date.', 'Browse the catalog');
  } else {
    up.innerHTML = `<div class="mini-head"><span>Activity</span><span>Due</span><span></span></div>` +
      HOME.upcoming.map(a => {
        const t = TYPES[a.type];
        return `<div class="mini-row">
          <span class="mini-name">
            <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
            <span class="mini-title" title="${esc(a.name)}">${esc(a.name)}</span>
          </span>
          <span class="mini-due">${esc(a.due)}</span>
          <span class="mini-act"><vaadin-button theme="primary" class="btn-compact">Launch</vaadin-button></span>
        </div>`;
      }).join('');
  }

  /* Upcoming classes: a benign empty list, so it gets the neutral empty state
     rather than the legacy dark red error block. Red is reserved for overdue
     and errors across every area. */
  const cl = $('#homeClasses');
  if (!HOME.classes.length) {
    cl.innerHTML = emptyHTML('fa-calendar-days', 'No upcoming classes',
      'Instructor led sessions you are enrolled in will show here.', 'Find a class');
  }

  /* News feed */
  $('#homeNews').innerHTML = HOME.news.map(n => `<article class="feed-item">
    <p class="feed-date"><i class="fa-regular fa-calendar"></i>${esc(n.date)}</p>
    <h4 class="feed-title">${esc(n.title)}</h4>
    <p class="feed-text">${esc(n.excerpt)}</p>
  </article>`).join('');
}

/* ===========================================================================
   AREA 3 DETAIL PAGES - activity / requirement / qualification
   ---------------------------------------------------------------------------
   One drill-in surface replaces the three legacy "Details" pages. Every level
   states what it contains (counts + total duration in the hero) and lists its
   children as rows you can click into: qualification -> requirements ->
   activities, with parent links to climb back up. Launch stays available on
   every activity row, so drilling down never costs the primary action.
   ======================================================================== */

let TP_INDEX = null;
function tpIndex() {
  if (TP_INDEX) return TP_INDEX;
  const ix = { qual: {}, req: {}, act: {} };
  TRAINING.quals.forEach(q => {
    ix.qual[q.id] = { item: q };
    q.reqs.forEach(r => {
      ix.req[r.id] = { item: r, qual: q };
      r.acts.forEach(a => { ix.act[a.id] = { item: a, req: r, qual: q }; });
    });
  });
  TP_INDEX = ix;
  return ix;
}

/* '15 mins' / '1 hr' strings -> total minutes -> '1 hr 25 mins' */
function minsOf(dur) {
  const h = /(\d+)\s*hr/.exec(dur || ''), m = /(\d+)\s*min/.exec(dur || '');
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}
function fmtMins(total) {
  if (!total) return '';
  const h = Math.floor(total / 60), m = total % 60;
  return [h ? `${h} hr${h > 1 ? 's' : ''}` : '', m ? `${m} mins` : ''].filter(Boolean).join(' ');
}
const sumActs = (acts) => fmtMins(acts.reduce((t, a) => t + minsOf(a.dur), 0));

function detailsTitle() {
  const d = state.details;
  if (!d) return 'Details';
  const hit = tpIndex()[d.kind][d.id];
  return hit ? hit.item.name : 'Details';
}

const parentLink = (kind, id, label) =>
  `<a href="#" class="d-link" data-open="${kind}:${id}" onclick="return false">${esc(label)}</a>`;

function dMeta(items) {
  return `<div class="d-meta">${items.filter(Boolean).map(i => `<span>${i}</span>`).join('')}</div>`;
}

function dActRow(a, indent) {
  const t = TYPES[a.type];
  return `<div class="d-row ${indent ? 'indent' : ''}" data-open="act:${a.id}" role="link" tabindex="0"
       aria-label="Open details: ${esc(a.name)}">
    <span class="d-name">
      <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
      <span class="d-row-title">${esc(a.name)}</span>
      ${a.attachment ? '<i class="fa-solid fa-paperclip d-clip" title="Has attachments"></i>' : ''}
    </span>
    <span>${pill(a.status)}</span>
    <span class="d-num d-dur">${esc(a.dur || '')}</span>
    <span class="d-launch">${a.type === 'class' ? '' : actionBtn(a)}</span>
    <i class="fa-solid fa-chevron-right d-chev" aria-hidden="true"></i>
  </div>`;
}

function dReqRow(r) {
  return `<div class="d-row group" data-open="req:${r.id}" role="link" tabindex="0"
       aria-label="Open details: ${esc(r.name)}">
    <span class="d-name">
      <span class="tglyph"><i class="fa-solid fa-award"></i></span>
      <span class="d-row-title">${esc(r.name)}</span>
    </span>
    <span>${meter(r.progress)}</span>
    <span class="d-dur"></span>
    <span class="d-launch"></span>
    <i class="fa-solid fa-chevron-right d-chev" aria-hidden="true"></i>
  </div>`;
}

function dHero(kindLabel, item, metaHTML, parentHTML, actionsHTML, thumbClass, thumbIcon) {
  return `<div class="d-hero">
    <span class="thumb d-thumb ${thumbClass}"><i class="fa-solid ${thumbIcon}"></i></span>
    <div class="d-info">
      <span class="d-kind">${kindLabel}</span>
      <h2 class="d-title">${esc(item.name)}</h2>
      ${metaHTML}
      ${parentHTML || ''}
      ${actionsHTML ? `<div class="d-actions">${actionsHTML}</div>` : ''}
    </div>
  </div>
  <p class="d-desc ${item.desc ? '' : 'none'}">${item.desc ? esc(item.desc) : 'No description provided.'}</p>`;
}

function renderDetails() {
  const d = state.details;
  const root = $('#detailsRoot');
  if (!d) { root.innerHTML = ''; return; }
  const ix = tpIndex();
  const hit = ix[d.kind][d.id];
  if (!hit) { root.innerHTML = ''; return; }
  const out = [];

  /* One level up, always visible above the panel. */
  const up = d.kind === 'qual' ? { label: 'My training', ref: 'list' }
           : d.kind === 'req'  ? { label: hit.qual.name, ref: 'qual:' + hit.qual.id }
           : hit.qual.id === 'q-indiv'
             ? { label: hit.qual.name, ref: 'qual:' + hit.qual.id }
             : { label: hit.req.name,  ref: 'req:' + hit.req.id };
  out.push(`<button class="d-back ${up.ref === 'list' ? 'js-back' : ''}" ${up.ref === 'list' ? '' : `data-open="${up.ref}"`}
       title="Back to ${esc(up.label)}">
    <i class="fa-solid fa-arrow-left"></i><span>Back to <strong>${esc(up.label)}</strong></span>
  </button>`);

  if (d.kind === 'qual') {
    const q = hit.item;
    const acts = q.reqs.flatMap(r => r.acts);
    out.push(`<section class="panel">`);
    out.push(dHero('Qualification', q,
      dMeta([`${q.reqs.length} requirement${q.reqs.length > 1 ? 's' : ''}`,
             `${acts.length} activities`,
             sumActs(acts) ? sumActs(acts) + ' total' : '',
             meter(q.progress)]),
      '', '', 't-qual', 'fa-medal'));
    out.push(`<div class="d-section">
      <h3 class="d-sec-title">What this qualification contains</h3>
      <p class="d-sec-hint">Each requirement below has its own rules; open one for its activities, or launch an activity directly.</p>`);
    q.reqs.forEach(r => {
      out.push(dReqRow(r));
      if (r.notice) out.push(`<div class="d-row-note"><span class="notice"><i class="fa-solid fa-circle-info"></i><span class="notice-text">${esc(r.notice)}</span></span></div>`);
      r.acts.forEach(a => out.push(dActRow(a, true)));
    });
    out.push(`</div></section>`);
  }

  if (d.kind === 'req') {
    const r = hit.item, q = hit.qual;
    out.push(`<section class="panel">`);
    out.push(dHero('Requirement', r,
      dMeta([`${r.acts.length} activities`,
             sumActs(r.acts) ? sumActs(r.acts) + ' total' : '',
             meter(r.progress)]),
      `<p class="d-parent">Part of ${parentLink('qual', q.id, q.name)}</p>`,
      '', 't-req', 'fa-award'));
    if (r.notice) out.push(`<div class="d-notice"><span class="notice"><i class="fa-solid fa-circle-info"></i><span class="notice-text">${esc(r.notice)}</span></span></div>`);
    out.push(`<div class="d-section">
      <h3 class="d-sec-title">Activities in this requirement</h3>`);
    r.acts.forEach(a => out.push(dActRow(a)));
    out.push(`</div></section>`);
  }

  if (d.kind === 'act') {
    const a = hit.item, r = hit.req, q = hit.qual;
    const t = TYPES[a.type];
    const indiv = q.id === 'q-indiv';
    out.push(`<section class="panel">`);
    out.push(dHero(t.label, a,
      dMeta([pill(a.status),
             a.dur ? `<i class="fa-regular fa-clock"></i> ${esc(a.dur)}` : '',
             a.spent ? `${esc(a.spent)} spent` : '',
             a.due ? `<span class="${a.status === 'overdue' ? 'd-overdue' : ''}"><i class="fa-regular fa-calendar"></i> Due ${esc(a.due)}</span>` : '']),
      indiv
        ? `<p class="d-parent">Assigned individually, from ${parentLink('qual', q.id, q.name)}</p>`
        : `<p class="d-parent">Part of ${parentLink('req', r.id, r.name)} in ${parentLink('qual', q.id, q.name)}</p>`,
      a.type === 'class' ? `<vaadin-button theme="secondary">Select a session</vaadin-button>` : `<vaadin-button theme="primary">Launch</vaadin-button>`,
      t.thumb, t.icon));

    if (a.attachment) {
      out.push(`<div class="d-section">
        <h3 class="d-sec-title">Attachments</h3>
        <div class="d-file">
          <span class="d-file-icon"><i class="fa-solid fa-file-pdf"></i></span>
          <span class="d-file-name">${esc(a.attachment.name)}</span>
          <span class="d-file-size">${esc(a.attachment.size)}</span>
          <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-solid fa-download" style="margin-right:6px"></i>Download</vaadin-button>
        </div>
      </div>`);
    }

    out.push(`<div class="d-section">
      <h3 class="d-sec-title">Past completions</h3>`);
    if (a.completions && a.completions.length) {
      out.push(`<div class="d-table">
        <div class="d-trow d-thead"><span>Completed</span><span>Version</span><span>Time spent</span><span>Score</span></div>
        ${a.completions.map(c => `<div class="d-trow">
          <span class="d-num">${esc(c.date)}</span><span class="d-num">${esc(c.version)}</span>
          <span class="d-num">${esc(c.spent)}</span><span>${esc(c.score)}</span>
        </div>`).join('')}
      </div>`);
    } else {
      out.push(`<div class="empty tight">
        <span class="empty-icon"><i class="fa-regular fa-clipboard"></i></span>
        <p class="empty-title">No completions yet</p>
        <p class="empty-text">Finish the activity and each completion will be recorded here with its score and time spent.</p>
      </div>`);
    }
    out.push(`</div></section>`);
  }

  root.innerHTML = out.join('');
  wireOpenRefs(root);
  const back = root.querySelector('.js-back');
  if (back) back.addEventListener('click', () => closeDetails());
  root.querySelectorAll('.d-row').forEach(row => row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
  }));
}

/* ===========================================================================
   AREA 5 ROUND 2 - CATALOG CATEGORY CAROUSELS
   Stacked category rows of cards (the reference layout). Each strip is a
   roving-focus listbox: focus the strip, then the left/right arrow keys move
   through its cards; Home/End jump. "View all" opens the existing table
   filtered to that category. Additive - the table stays intact.
   ======================================================================== */
function ccardHTML(c) {
  const t = TYPES[c.type];
  const labels = [c.assigned ? 'assigned' : '', c.elective ? 'elective' : ''].filter(Boolean).join(', ');
  return `<article class="ccard" role="listitem" tabindex="-1"
       aria-label="${esc(c.name)}${labels ? ', ' + labels : ''}">
    <div class="thumb ccard-thumb ${t.thumb}">
      <i class="fa-solid ${t.icon}"></i>
      ${c.assigned ? '<span class="pill pill-assigned no-dot ccard-badge">Assigned</span>' : ''}
      ${c.elective ? '<span class="etag" title="Elective">E</span>' : ''}
    </div>
    <div class="ccard-body">
      <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
      <span class="ccard-title" title="${esc(c.name)}">${esc(c.name)}</span>
    </div>
  </article>`;
}

function renderCatalogCards() {
  const root = $('#catCards');
  root.innerHTML = CATALOG_CATS.map(cat => `<section class="cat-cat">
    <header class="cat-row-head">
      <h2 class="cat-row-title">${esc(cat.name)} (${cat.count || cat.items.length})</h2>
      <button class="link-btn js-viewall" data-cat="${cat.id}" aria-label="View all in ${esc(cat.name)}">
        View all <i class="fa-solid fa-chevron-right"></i>
      </button>
    </header>
    <div class="cat-strip-row">
      <button class="cat-nav prev" aria-label="Scroll ${esc(cat.name)} backward" disabled><i class="fa-solid fa-chevron-left"></i></button>
      <div class="cat-strip" role="list" tabindex="0" data-cat="${cat.id}"
           aria-label="${esc(cat.name)}, ${cat.count || cat.items.length} items, use the left and right arrow keys to browse">
        ${cat.items.map(ccardHTML).join('')}
      </div>
      <button class="cat-nav next" aria-label="Scroll ${esc(cat.name)} forward"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
  </section>`).join('');

  root.querySelectorAll('.js-viewall').forEach(b => b.addEventListener('click', () => {
    state.catalogCat = b.dataset.cat;
    setCatalogView('table');
  }));

  // Arrow paging: the strip never shows a horizontal scrollbar; the flanking
  // buttons page it by roughly one viewport (disabled at either end) and the
  // arrow keys walk card to card.
  root.querySelectorAll('.cat-strip-row').forEach(rowEl => {
    const strip = rowEl.querySelector('.cat-strip');
    const prev = rowEl.querySelector('.cat-nav.prev');
    const next = rowEl.querySelector('.cat-nav.next');
    const page = () => Math.max(strip.clientWidth - 120, 200);
    const update = () => {
      prev.disabled = strip.scrollLeft <= 4;
      next.disabled = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 4;
    };
    prev.addEventListener('click', () => { strip.scrollBy({ left: -page(), behavior: 'smooth' }); });
    next.addEventListener('click', () => { strip.scrollBy({ left: page(), behavior: 'smooth' }); });
    strip.addEventListener('scroll', update);
    update();
  });

  root.querySelectorAll('.cat-strip').forEach(strip => {
    let idx = -1;
    const cards = Array.from(strip.querySelectorAll('.ccard'));
    const focusCard = (i) => {
      idx = Math.max(0, Math.min(cards.length - 1, i));
      cards[idx].focus();
      cards[idx].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    };
    strip.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight')     { e.preventDefault(); focusCard(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); focusCard(idx - 1); }
      else if (e.key === 'Home')      { e.preventDefault(); focusCard(0); }
      else if (e.key === 'End')       { e.preventDefault(); focusCard(cards.length - 1); }
    });
    strip.addEventListener('focus', () => { if (idx === -1) idx = 0; });
  });
}
