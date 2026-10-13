/* ===========================================================================
   PAGE + STATE
   ---------------------------------------------------------------------------
   Each page file sets window.PAGE before loading the shared scripts, e.g.
     window.PAGE = { route: 'catalog', standalone: true };
   standalone:true means a route change is a real navigation to the sibling
   page file. index.html sets it false and swaps views in place instead.
   ======================================================================== */
const PAGE = window.PAGE || {};
const PAGE_FILES = {
  home:     'home.html',
  guide:    'dashboard.html',
  training: 'training-plan.html',
  catalog:  'catalog.html',
  wizard:   'content-wizard.html',
  insights: 'dashboard.html?view=insights',
};

const state = {
  route: PAGE.route || 'guide',   // guide | training | catalog | wizard
  trainingView: 'list',      // list | dense | large
  catalogView: 'cards',      // cards (category carousels) | table
  catalogCat: 'safety',      // category shown by the table view
  dismissedBanners: new Set(),   // banner ids dismissed this session
  showElectives: false,          // filter-panel toggle: elective activities
  search: '',                    // page-header search, matched against activity names
  fTypes: [], fStatuses: [],     // filter-panel multi-selects ([] = all)
  demoUnassigned: false,         // flow-map only: show the plan with nothing assigned
  allCollapsed: false,           // filter-panel toggle: collapse/expand all
  filterOpen: false,
  navOpen: new Set(['training']),
  navActive: 'dashboard',   // set per route by NAV_FOR_ROUTE in go()
  viewBy: 'qual',
  location: HOME_LOC,
  wizard: { step: 1, method: null, type: null, repo: null, displayName: '' },
  collapsed: new Set(),      // collapsed accordion node ids
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* ===========================================================================
   AREA 1 - SIDE NAV
   ======================================================================== */
function renderNav(filter = '') {
  const list = $('#navList');
  const q = filter.trim().toLowerCase();
  list.innerHTML = '';

  const nav = NAV_SETS[ROUTES[state.route].mode] || NAV_ADMIN;
  nav.forEach(node => {
    const kids = (node.children || []).map(c => typeof c === 'string' ? { label: c } : c);
    const hits = q ? kids.filter(c => c.label.toLowerCase().includes(q)) : kids;
    const selfHit = !q || node.label.toLowerCase().includes(q);
    if (q && !selfHit && !hits.length) return;

    const hasActiveChild = kids.some(c => c.id && c.id === state.navActive);
    const isSelected = node.id === state.navActive;
    const open = q ? true : state.navOpen.has(node.id);

    const row = document.createElement('button');
    row.className = 'sn-row'
      + (isSelected ? ' selected' : '')
      + (hasActiveChild && !open ? ' trail' : '')
      + (hasActiveChild ? ' trail' : '');
    row.title = node.label;
    if (kids.length) row.setAttribute('aria-expanded', String(open));
    row.innerHTML =
      `<span class="sn-icon"><i class="fa-solid ${node.icon}"></i></span>` +
      `<span class="sn-label">${esc(node.label)}</span>` +
      (kids.length ? `<i class="fa-solid fa-chevron-down sn-caret"></i>` : '');
    row.addEventListener('click', () => {
      if (!kids.length) {
        state.navActive = node.id;
        if (node.route) go(node.route);
        else renderNav($('#navSearch').value);
        return;
      }
      if (state.navOpen.has(node.id)) state.navOpen.delete(node.id);
      else state.navOpen.add(node.id);
      renderNav($('#navSearch').value);
    });
    list.appendChild(row);

    if (kids.length && open) {
      const wrap = document.createElement('div');
      wrap.className = 'sn-children';
      (q ? hits : kids).forEach(child => {
        const b = document.createElement('button');
        const active = child.id && child.id === state.navActive;
        b.className = 'sn-child' + (active ? ' selected' : '') + (child.route ? '' : ' inert');
        b.textContent = child.label;
        b.title = child.label;
        if (child.route) b.addEventListener('click', () => {
          state.navActive = child.id;
          go(child.route);
        });
        wrap.appendChild(b);
      });
      list.appendChild(wrap);
    }
  });
}

/* ===========================================================================
   AREA 2 - LOCATION PICKER
   ======================================================================== */
function buildLocMap(nodes, ancestors = [], map = {}) {
  nodes.forEach(n => {
    map[n.id] = { node: n, ancestors: [...ancestors] };
    if (n.children) buildLocMap(n.children, [...ancestors, n], map);
  });
  return map;
}
const LOC_MAP = buildLocMap(LOCATION_TREE);

function openLoc() {
  const search = $('#locSearch');
  if (!search || !search.value) filterLocTree('');
  const t = $('#locTrigger');
  const r = t.getBoundingClientRect();
  const p = $('#locPanel');
  p.style.top = (r.bottom + 6) + 'px';
  p.style.left = Math.max(12, r.left) + 'px';
  p.classList.add('open');
  $('#locBackdrop').classList.add('open');
  t.setAttribute('aria-expanded', 'true');
}
function closeLoc() {
  $('#locPanel').classList.remove('open');
  $('#locBackdrop').classList.remove('open');
  $('#locTrigger').setAttribute('aria-expanded', 'false');
  const s = $('#locSearch'); if (s) s.value = '';
  filterLocTree('');
}
/* Collect the branch nodes to open, down to `depth` levels. The panel opens
   with the organization and its regions already expanded so the nest view is
   scannable without a click, and a search opens every matching branch. */
function locBranches(nodes, depth, acc = []) {
  nodes.forEach(n => {
    if (n.children && n.children.length && depth > 0) {
      acc.push(n);
      locBranches(n.children, depth - 1, acc);
    }
  });
  return acc;
}
/* vwc-tree-list only recomputes its visible nodes from its own expand control,
   so branches are opened by driving that control rather than by assigning
   expandedItems (which leaves the rendered rows collapsed). */
function openLocBranches(ids, tries = 30) {
  const retry = () => { if (tries > 0) setTimeout(() => openLocBranches(ids, tries - 1), 60); };
  const tree = $('#locTree');
  const root = tree.shadowRoot;
  if (!root) { retry(); return; }
  const rows = root.querySelectorAll('li[data-item-id]');
  if (!rows.length) { retry(); return; }
  let pending = 0;
  rows.forEach(li => {
    if (!ids.has(li.dataset.itemId)) return;
    if (li.getAttribute('aria-expanded') !== 'false') return;
    const btn = li.querySelector(':scope > .vwc-tree-list--parent-label-wrapper > .vwc-tree-list--expand-button');
    if (btn) { btn.click(); pending++; }
  });
  if (pending) retry();
}
function setLocItems(items, depth) {
  const tree = $('#locTree');
  tree.items = items;
  tree.value = state.location;
  openLocBranches(new Set(locBranches(items, depth).map(n => n.id)));
}
function filterLocTree(q) {
  if (!q || !q.trim()) { setLocItems(LOCATION_TREE, 2); return; }
  const needle = q.toLowerCase();
  const keep = (nodes) => nodes.reduce((acc, n) => {
    const kids = keep(n.children || []);
    if (n.text.toLowerCase().includes(needle) || kids.length) acc.push({ ...n, children: kids });
    return acc;
  }, []);
  setLocItems(keep(LOCATION_TREE), 9);
}
function applyLocation(id) {
  const hit = LOC_MAP[id];
  if (!hit) return;
  state.location = id;
  const path = hit.ancestors.map(a => a.text);
  $('#locName').textContent = hit.node.text;
  $('#locPath').textContent = path.length ? path.join(' › ') : 'Working location';
  $('#locFoot').textContent = hit.node.text;
  $('#locTrigger').classList.toggle('is-away', id !== HOME_LOC);
  renderCrumbs();
}

/* ===========================================================================
   ROUTING + CHROME
   ======================================================================== */
/* Every route belongs to one top-nav tab and shows that tab's side nav (mode).
   Learner pages open with the nav as the 58px icon rail (dense content);
   Insights and admin pages open it expanded. A manual toggle sticks until the
   next navigation. */
const ROUTES = {
  home:     { tab:'home',     mode:'learner',  title:'Dashboard',                crumbs:['Home'],           sidenav:true, actions:'home',     navCollapsed:true },
  training: { tab:'training', mode:'learner',  title:'My training',              crumbs:['Training'],       sidenav:false, actions:'training', },
  catalog:  { tab:'catalog',  mode:'learner',  title:'Catalog',                  crumbs:['Catalog'],        sidenav:true, actions:'catalog',  navCollapsed:true },
  /* Drill-in from My training. virtual: it is a sub-page of the training
     route, so on a standalone page it never navigates to a sibling file. */
  details:  { tab:'training', mode:'learner',  title:'Details',                  crumbs:['Training'],       sidenav:false, actions:'details',  virtual:true },
  insights: { tab:'insights', mode:'insights', title:'Insights',                 crumbs:['Insights'],       sidenav:true, actions:'guide' },
  guide:    { tab:'admin',    mode:'admin',    title:'Administration dashboard', crumbs:['Administration'], sidenav:true, actions:'guide' },
  wizard:   { tab:'admin',    mode:'admin',    title:'Content wizard',           crumbs:['Administration','Training import and creation'], sidenav:true, actions:'wizard' },
};
/* Which side-nav item each route lights up. */
const NAV_FOR_ROUTE = { home:'l-dashboard', training:'l-training', details:'l-training', catalog:'l-catalog', insights:'', guide:'dashboard', wizard:'ti-content' };

function renderCrumbs() {
  const r = ROUTES[state.route];
  const loc = LOC_MAP[state.location].node.text;
  const sep = '<i class="fa-solid fa-chevron-right"></i>';
  if (state.route === 'details' && state.details) {
    const hit = tpIndex()[state.details.kind][state.details.id];
    /* Trail: location > Training (back to the plan) > qualification > requirement >
       the current item, named, as the last crumb. No separate "My training" crumb:
       Training already is that page. */
    const trail = [`<a href="#" onclick="return false">${esc(loc)}</a>`,
                   `<a href="#" class="crumb-up" data-up="list">Training</a>`];
    if (hit) {
      const k = state.details.kind;
      if (k !== 'qual' && hit.qual)
        trail.push(`<a href="#" class="crumb-up" data-up="qual:${hit.qual.id}" title="${esc(hit.qual.name)}">${esc(hit.qual.name)}</a>`);
      if (k === 'act' && hit.req && hit.qual.id !== 'q-indiv')
        trail.push(`<a href="#" class="crumb-up" data-up="req:${hit.req.id}" title="${esc(hit.req.name)}">${esc(hit.req.name)}</a>`);
      trail.push(`<span class="crumb-current" aria-current="page" title="${esc(hit.item.name)}">${esc(hit.item.name)}</span>`);
    }
    $('#crumbs').innerHTML = trail.join(sep);
    $('#pageTitle').textContent = detailsTitle();
    $$('#crumbs .crumb-up').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.dataset.up === 'list') { closeDetails(); return; }
      const [k, i] = a.dataset.up.split(':');
      showDetails(k, i);
    }));
    return;
  }
  const parts = [loc, ...r.crumbs];
  $('#crumbs').innerHTML = parts
    .map(p => `<a href="#" onclick="return false">${esc(p)}</a>`)
    .join(sep);
  $('#pageTitle').textContent = state.route === 'catalog' ? catalogTitle()
    : r.count ? `${r.title} (${r.count})` : r.title;
}

/* Open one of the Area 3 detail pages (activity / requirement / qual). */
function showDetails(kind, id) {
  state.details = { kind, id };
  renderDetails();
  go('details');
  const scroll = $('#view-details .view-scroll');
  if (scroll) scroll.scrollTop = 0;
}
function closeDetails() {
  state.details = null;
  go('training', state.trainingView);
}

function go(route, arg) {
  if (route === 'admin') route = 'guide';   // the Administration tab lands on its dashboard

  // On a standalone page, leaving this route means opening the sibling file.
  if (PAGE.standalone && route !== PAGE.route && !(ROUTES[route] && ROUTES[route].virtual)) {
    let href = PAGE_FILES[route] || PAGE_FILES.guide;
    if ((route === 'training' || route === 'catalog') && typeof arg === 'string') href += '?view=' + arg;
    showLoading(ROUTES[route] ? ROUTES[route].title : '');   // stays up until the sibling page paints
    location.href = href;
    return;
  }

  state.route = route;
  const r = ROUTES[route];
  flashLoading(route === 'details' ? 'details' : r.title);

  $$('.tab').forEach(t => {
    const active = t.dataset.route === r.tab;
    t.classList.toggle('active', active);
    if (active) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  $('#sidenav').hidden = !r.sidenav;
  $('#sidenav').setAttribute('aria-label', { learner: 'Learner', insights: 'Insights', admin: 'Administration' }[r.mode]);
  /* Each route sets how wide the nav starts. Home shows the icon rail (the
     legacy page shows only the menu affordance); admin pages show it open.
     A manual toggle sticks until the next navigation. */
  setNavCollapsed(!!r.navCollapsed);
  $$('.action-group').forEach(g => g.classList.toggle('active', g.dataset.for === r.actions));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + (route === 'wizard' ? 'wizard' : route)));

  state.navActive = NAV_FOR_ROUTE[route] || '';
  if (route === 'wizard') state.navOpen.add('training');
  renderNav($('#navSearch').value);
  renderCrumbs();

  if (route === 'training') { setTrainingView(typeof arg === 'string' ? arg : state.trainingView); renderBanners(); }
  if (route === 'catalog')  setCatalogView(typeof arg === 'string' ? arg : state.catalogView);
  if (route === 'wizard' && typeof arg === 'number') { state.wizard.step = arg; renderWizard(); }
  $('#app').classList.remove('nav-open');
}

/* Swap the catalog between the category carousels and the table. */
function setCatalogView(v) {
  state.catalogView = v;
  $$('#catViewToggle button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.cview === v)));
  $('#catCards').hidden = v !== 'cards';
  $('#catTableWrap').hidden = v !== 'table';
  if (v === 'table') renderCatalog(); else renderCatalogCards();
  renderCrumbs();
  // View all is usually clicked part-way down the category rows: start the swapped view at the top
  const sc = $('#view-catalog .view-scroll'); if (sc) sc.scrollTop = 0;
}

/* The filter panel is always in the layout; this opens and closes it. */
function setFilters(open) {
  state.filterOpen = open;
  $('#view-training').classList.toggle('filters-closed', !open);
  const btn = $('#filterToggle');
  btn.setAttribute('aria-pressed', String(open));
  btn.title = open ? 'Hide filters' : 'Show filters';
}

/* Reset search + filters (the empty state's action). */
function clearTrainingFilters() {
  state.search = ''; state.fTypes = []; state.fStatuses = [];
  $('[data-for="training"] .searchbox input').value = '';
  $('#fType').selectedItems = []; $('#fStatus').selectedItems = [];
  syncFilterControls();
  renderTraining();
}

const FILTER_ITEMS = {
  fType:   ['Tasklist', 'Video', 'Course', 'Quiz', 'Document', 'Class'],
  fStatus: ['In progress', 'Incomplete', 'Overdue', 'Complete', 'Needs scheduling'],
};
const FILTER_STATE = { fType: 'fTypes', fStatus: 'fStatuses' };
/* Keep the quick-clear controls and each field's Select all / Clear toggle in step
   with the current filters. */
function syncFilterControls() {
  const n = state.fTypes.length + state.fStatuses.length;
  const searching = !!(state.search || '').trim();
  const count = $('#fpCount'); count.hidden = !n; count.textContent = n ? `(${n})` : '';
  $('#fpClearAll').disabled = !n;
  const quick = $('#tpClearFilters'); quick.hidden = !(n || searching);
  $('#tpClearLabel').textContent = n ? `Clear filters (${n})` : 'Clear search';
  $$('.fp-all').forEach(b => {
    const all = state[FILTER_STATE[b.dataset.for]].length === FILTER_ITEMS[b.dataset.for].length;
    b.textContent = all ? 'Clear' : 'Select all';
    b.setAttribute('aria-label', (all ? 'Clear ' : 'Select all ') + b.dataset.for.replace('f', '').toLowerCase() + ' filters');
  });
}

function setNavCollapsed(collapsed) {
  $('#app').classList.toggle('nav-collapsed', collapsed);
  const btn = $('#navCollapse');
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
  btn.setAttribute('aria-label', btn.title);
}

function collapseDemo() {
  setNavCollapsed(!$('#app').classList.contains('nav-collapsed'));
}

/* ===========================================================================
   BOOT
   ======================================================================== */
/* ===========================================================================
   LOADING STATES
   1. Between states: a skeleton layer over the canvas (chrome stays put)
      that flashes on every route change and on page load. In the product
      it stays up until the next screen's data has arrived.
   2. Loading content: the modal shown when a training is launched, up
      until the content window opens. Prototype: auto-closes after 2.4s.
   ======================================================================== */
let loadingTimer = null;
function showLoading(label) {
  $('#loadingLabel').textContent = label ? 'Loading ' + label.toLowerCase() : 'Loading';
  $('#loading').hidden = false;
}
function hideLoading() { clearTimeout(loadingTimer); $('#loading').hidden = true; }
function flashLoading(label, ms = 500) {
  showLoading(label);
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => { $('#loading').hidden = true; }, ms);
}

let ldTimer = null;
function openLoadingModal(name, opts = {}) {
  $('#ldName').textContent = name;
  $('#ldOverlay').hidden = false;
  $('#ldCancel').focus();
  clearTimeout(ldTimer);
  // Prototype stand-in for the content window opening.
  if (!opts.hold) ldTimer = setTimeout(closeLoadingModal, 2400);
}
function closeLoadingModal() { clearTimeout(ldTimer); $('#ldOverlay').hidden = true; }

function boot() {
  renderNav();
  renderHome();
  renderFilterPanel();
  renderWizard();
  $$('#catViewToggle button').forEach(b =>
    b.addEventListener('click', () => setCatalogView(b.dataset.cview)));
  setTrainingView('list');

  // Location picker
  $('#locTrigger').addEventListener('click', () =>
    $('#locPanel').classList.contains('open') ? closeLoc() : openLoc());
  $('#locBackdrop').addEventListener('click', closeLoc);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLoc(); });
  $('#locHome').addEventListener('click', () => { applyLocation(HOME_LOC); closeLoc(); });
  const locSearch = $('#locSearch');
  locSearch.addEventListener('input', () => filterLocTree(locSearch.value));
  const tree = $('#locTree');
  tree.addEventListener('value-change', e => {
    const id = Array.isArray(e.detail) ? e.detail[0] : e.detail;
    if (id) { applyLocation(id); closeLoc(); }
  });
  filterLocTree('');
  applyLocation(HOME_LOC);

  // Loading content modal: every Launch on the page opens it. Delegated, so
  // list rows, cards, the detail hero and the Home list all share one path.
  document.addEventListener('click', e => {
    const b = e.target.closest('vaadin-button');
    if (!b || b.textContent.trim() !== 'Launch') return;
    const row = b.closest('.tp-act, .tcard, .d-hero, .up-row, tr, .d-row');
    const nameEl = row && row.querySelector('.tp-title, .tcard-title span, .d-title, .up-name, .d-row-title');
    openLoadingModal(nameEl ? nameEl.textContent.trim() : 'your training');
  });
  $('#ldCancel').addEventListener('click', closeLoadingModal);
  $('#ldOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeLoadingModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLoadingModal(); });

  // Nav
  $('#navSearch').addEventListener('input', e => renderNav(e.target.value));
  $('#navCollapse').addEventListener('click', collapseDemo);
  $('#burger').addEventListener('click', () => $('#app').classList.toggle('nav-open'));
  $$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.route)));

  // Training controls
  $$('#viewToggle button, #viewToggle2 button').forEach(b =>
    b.addEventListener('click', () => setTrainingView(b.dataset.view)));
  $('#filterToggle').addEventListener('click', () => setFilters(!state.filterOpen));
  // Collapse/expand all: one control, icon and name follow its next action.
  $('#fpToggleAll').addEventListener('click', () => {
    state.allCollapsed = !state.allCollapsed;
    setAllOpen(!state.allCollapsed);
    const b = $('#fpToggleAll');
    b.title = state.allCollapsed ? 'Expand all' : 'Collapse all';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(state.allCollapsed));
    b.querySelector('i').className = state.allCollapsed
      ? 'fa-solid fa-chevrons-down' : 'fa-solid fa-chevrons-up';
  });


  // Show electives: reveals elective activities (E-tagged) in the plan.
  $('#fpElectives').addEventListener('click', () => {
    state.showElectives = !state.showElectives;
    const b = $('#fpElectives');
    b.setAttribute('aria-pressed', String(state.showElectives));
    b.title = state.showElectives ? 'Hide electives' : 'Show electives';
    b.setAttribute('aria-label', b.title);
    renderTraining();
  });

  // Multi-select filters: any number of values per field, none = all. They and the
  // header search narrow the plan live.
  Object.keys(FILTER_ITEMS).forEach(id => {
    const el = $('#' + id);
    el.items = FILTER_ITEMS[id];
    el.addEventListener('selected-items-changed', e => {
      state[FILTER_STATE[id]] = [...(e.detail.value || [])];
      syncFilterControls(); renderTraining();
    });
  });
  $$('.fp-all').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.for, el = $('#' + id);
    const all = state[FILTER_STATE[id]].length === FILTER_ITEMS[id].length;
    el.selectedItems = all ? [] : [...FILTER_ITEMS[id]];
  }));
  $('#fpClearAll').addEventListener('click', clearTrainingFilters);
  $('#tpClearFilters').addEventListener('click', clearTrainingFilters);
  const search = $('[data-for="training"] .searchbox input');
  search.addEventListener('input', () => { state.search = search.value; syncFilterControls(); renderTraining(); });
  syncFilterControls();

  setFilters(false);

  $('#detailsClose').addEventListener('click', closeDetails);

  const params = new URLSearchParams(location.search);
  // The Insights tab shares the admin page file: ?view=insights opens it there.
  if (params.get('view') === 'insights' && PAGE.route === 'guide') { state.route = 'insights'; PAGE.route = 'insights'; }
  go(state.route, state.route === 'insights' ? undefined : (params.get('view') || undefined));

  // Deep link straight into a detail page: ?details=qual:q-nhs / req:r-loto / act:a4
  const dl = params.get('details');
  if (dl && dl.includes(':')) {
    const [k, i] = dl.split(':');
    if (tpIndex()[k] && tpIndex()[k][i]) showDetails(k, i);
  }
}

/* ---------------------------------------------------------------------------
   Design Toolbox flow map driver
   ------------------------------------------------------------------------ */
function applyFlowState(id, opts) {
  const instant = opts && opts.instant;
  closeLoc();
  $('#app').classList.remove('nav-collapsed');
  setFilters(false);

  switch (id) {
    case 'home':       go('home'); break;
    case 'nav':        go('guide'); break;
    case 'loc':        go('guide'); openLoc(); break;
    case 't-list':     go('training', 'list'); break;
    case 't-filter':
      go('training', 'list');
      setFilters(true);
      break;
    case 't-cards-s':  go('training', 'dense'); break;
    case 't-cards-l':  go('training', 'large'); break;
    case 't-empty':
      go('training', 'list');
      state.search = 'Forklift inspection'; $('[data-for="training"] .searchbox input').value = state.search; syncFilterControls();
      renderTraining();
      break;
    case 't-unassigned': state.demoUnassigned = true; go('training', 'list'); break;
    case 'd-qual':     go('training', 'list'); showDetails('qual', 'q-nhs'); break;
    case 'd-req':      go('training', 'list'); showDetails('req', 'r-loto'); break;
    case 'd-act':      go('training', 'list'); showDetails('act', 'a5'); break;  // LOTO Tasklist Affected Employees
    case 'catalog':    state.catalogCat = 'safety'; go('catalog', 'table'); break;
    case 'cat-cards':  go('catalog', 'cards'); break;
    case 'loading':    go('training', 'list'); showLoading('My training'); break;
    case 'load-modal': go('training', 'list'); openLoadingModal('LOTO Tasklist Affected Employees', { hold: true }); break;
    case 'wz1':        go('wizard', 1); break;
    case 'wz2':        state.wizard.method = 'create'; state.wizard.type = 'quiz'; go('wizard', 2); break;
    case 'wz3':        state.wizard.method = 'create'; state.wizard.type = 'quiz'; go('wizard', 3); break;
    case 'wz4':
      state.wizard.method = 'create'; state.wizard.type = 'quiz';
      state.wizard.repo = 'Safety › Quizzes (UAT Environment)';
      go('wizard', 4);
      break;
    default: go('guide');
  }
  if (id !== 't-empty') clearTrainingFilters();
  if (id !== 't-unassigned') { state.demoUnassigned = false; if (state.route === 'training') renderTraining(); }
  if (id !== 'loading') hideLoading();
  if (id !== 'load-modal') closeLoadingModal();
  if (instant) window.scrollTo(0, 0);
}
window.applyFlowState = applyFlowState;

function bootFromHash() {
  const m = (location.hash || '').match(/fm=([\w-]+)/);
  if (m) applyFlowState(decodeURIComponent(m[1]), { instant: true });
}

boot();
bootFromHash();
window.addEventListener('hashchange', bootFromHash);
