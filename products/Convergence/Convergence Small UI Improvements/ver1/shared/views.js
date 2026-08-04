/* ===========================================================================
   AREA 3 + 4 - MY TRAINING
   ======================================================================== */
const meter = (p) => p ? `
  <span class="meter">
    <span class="meter-track"><span class="meter-fill" style="width:${Math.round((p.done / p.total) * 100)}%"></span></span>
    <span class="meter-label"><strong>${p.done} of ${p.total}</strong> <span class="meter-unit">${p.unit}</span></span>
  </span>` : '';

const pill = (s) => `<span class="pill ${STATUS[s].cls}">${STATUS[s].label}</span>`;

const infoBtn = (label) =>
  `<button class="icon-btn" title="Details for ${esc(label)}" aria-label="Details for ${esc(label)}"><i class="fa-regular fa-comment-dots"></i></button>`;

function isOpen(id, dflt) {
  return state.collapsed.has(id) ? false : dflt;
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
      <span class="tp-actions">${infoBtn(q.name)}</span>
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
        <span class="tp-actions">${infoBtn(r.name)}</span>
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
}

function rowHTML(a) {
  const t = TYPES[a.type];
  const overdue = a.status === 'overdue';
  return `<div class="tp-act">
    <span class="tp-actname">
      <span class="tp-launch"><vaadin-button theme="primary" class="btn-compact">Launch</vaadin-button></span>
      <span class="tglyph" title="${t.label}"><i class="fa-solid ${t.icon}"></i></span>
      <span class="tp-title" title="${esc(a.name)}">${esc(a.name)}</span>
    </span>
    <span>${pill(a.status)}</span>
    <span class="col-num col-dur">${esc(a.dur || '')}</span>
    <span class="col-num col-spent ${a.spent ? '' : 'col-empty'}">${esc(a.spent || '-')}</span>
    <span class="col-num col-due ${overdue ? 'is-overdue' : (a.due ? '' : 'col-empty')}">${esc(a.due || '-')}</span>
    <span class="col-actions">${infoBtn(a.name)}</span>
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
      ${infoBtn(a.name)}
      <vaadin-button theme="primary" class="btn-compact">Launch</vaadin-button>
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

  const body = CATALOG.map(c => {
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
  const stepper = $('#wzStepper');
  if (stepper) {
    stepper.activeStepId = 's' + w.step;
    $$('vwc-stepper-step', stepper).forEach((el, i) => { el.complete = (i + 1) < w.step; });
  }

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
    <p class="stat-hint"><strong>${s.done} of ${s.total}</strong> done, ${left} to go</p>
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
