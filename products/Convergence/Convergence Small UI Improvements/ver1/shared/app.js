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
};

const state = {
  route: PAGE.route || 'guide',   // guide | training | catalog | wizard
  trainingView: 'list',      // list | dense | large
  filterOpen: false,
  navOpen: new Set(['training']),
  navActive: 'dashboard',
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

  NAV.forEach(node => {
    if (node.section) {
      if (q) return;
      const h = document.createElement('div');
      h.className = 'sn-section';
      h.textContent = node.section;
      list.appendChild(h);
      return;
    }

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
const ROUTES = {
  home:     { tab:'home',       title:'Dashboard',                crumbs:['Home'],                               sidenav:true,  actions:'home', navCollapsed:true },
  guide:    { tab:'admin',      title:'Administration dashboard', crumbs:['Administration'],                     sidenav:true,  actions:'guide' },
  training: { tab:'training',   title:'My training',              crumbs:['Training'],                           sidenav:false, actions:'training' },
  catalog:  { tab:'catalog',    title:'Safety',                   crumbs:['Catalog'],                            sidenav:false, actions:'catalog', count:7 },
  wizard:   { tab:'admin',      title:'Content Wizard',           crumbs:['Administration','Training Import And Creation'], sidenav:true, actions:'wizard' },
};

function renderCrumbs() {
  const r = ROUTES[state.route];
  const loc = LOC_MAP[state.location].node.text;
  const parts = [loc, ...r.crumbs];
  $('#crumbs').innerHTML = parts
    .map(p => `<a href="#" onclick="return false">${esc(p)}</a>`)
    .join('<i class="fa-solid fa-chevron-right"></i>');
  $('#pageTitle').textContent = r.count ? `${r.title} (${r.count})` : r.title;
}

function go(route, arg) {
  if (route === 'insights') route = 'guide';
  if (route === 'admin') route = 'wizard';

  // On a standalone page, leaving this route means opening the sibling file.
  if (PAGE.standalone && route !== PAGE.route) {
    let href = PAGE_FILES[route] || PAGE_FILES.guide;
    if (route === 'training' && typeof arg === 'string') href += '?view=' + arg;
    location.href = href;
    return;
  }

  state.route = route;
  const r = ROUTES[route];

  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.route === r.tab
    || (r.tab === 'admin' && t.dataset.route === 'admin')));
  $('#sidenav').hidden = !r.sidenav;
  /* Each route sets how wide the nav starts. Home shows the icon rail (the
     legacy page shows only the menu affordance); admin pages show it open.
     A manual toggle sticks until the next navigation. */
  setNavCollapsed(!!r.navCollapsed);
  $$('.action-group').forEach(g => g.classList.toggle('active', g.dataset.for === r.actions));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + (route === 'wizard' ? 'wizard' : route)));

  if (route === 'home')   state.navActive = 'dashboard';
  if (route === 'guide')  state.navActive = '';   // the review guide is not a product page
  if (route === 'wizard') { state.navActive = 'ti-content'; state.navOpen.add('training'); }
  renderNav($('#navSearch').value);
  renderCrumbs();

  if (route === 'training') setTrainingView(typeof arg === 'string' ? arg : state.trainingView);
  if (route === 'wizard' && typeof arg === 'number') { state.wizard.step = arg; renderWizard(); }
  $('#app').classList.remove('nav-open');
}

/* The filter panel is always in the layout; this opens and closes it. */
function setFilters(open) {
  state.filterOpen = open;
  $('#view-training').classList.toggle('filters-closed', !open);
  const btn = $('#filterToggle');
  btn.setAttribute('aria-pressed', String(open));
  btn.title = open ? 'Hide filters' : 'Show filters';
}

function setNavCollapsed(collapsed) {
  $('#app').classList.toggle('nav-collapsed', collapsed);
  const btn = $('#navCollapse');
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
}

function collapseDemo() {
  setNavCollapsed(!$('#app').classList.contains('nav-collapsed'));
}

/* ===========================================================================
   BOOT
   ======================================================================== */
function boot() {
  renderNav();
  renderHome();
  renderFilterPanel();
  renderCatalog();
  renderWizard();
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

  // Nav
  $('#navSearch').addEventListener('input', e => renderNav(e.target.value));
  $('#navCollapse').addEventListener('click', collapseDemo);
  $('#burger').addEventListener('click', () => $('#app').classList.toggle('nav-open'));
  $$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.route)));

  // Training controls
  $$('#viewToggle button, #viewToggle2 button').forEach(b =>
    b.addEventListener('click', () => setTrainingView(b.dataset.view)));
  $('#filterToggle').addEventListener('click', () => setFilters(!state.filterOpen));
  const ft = $('#fType'), fs = $('#fStatus');
  ft.items = ['All types', 'Tasklist', 'Video', 'Course', 'Quiz', 'Document'];
  fs.items = ['All statuses', 'In progress', 'Incomplete', 'Overdue', 'Complete'];

  setFilters(false);

  const startView = new URLSearchParams(location.search).get('view');
  go(state.route, startView || undefined);
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
    case 'catalog':    go('catalog'); break;
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
