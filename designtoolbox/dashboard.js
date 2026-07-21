/* =========================================================================
   Product Dashboard — shared, drop-in prototype index
   =========================================================================

   ONE shared implementation of the per-product "Design Lab" dashboard. A
   product enrolls by dropping a tiny shell into `products/<Product>/dashboard/`:

       <!DOCTYPE html><html lang="en"><head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Prototype Index</title>
       </head><body>
         <script src="../../../designtoolbox/dashboard.js"></script>
         <script src="../../../designtoolbox/feedback-widget.js"></script>
       </body></html>

   The shell is IDENTICAL for every product — the product name is detected from
   the URL path (`/products/<Product>/dashboard/`), and the card list comes from
   the `meta.json` sitting next to the shell. Improve this file once and every
   product's dashboard updates.

   `meta.json` is regenerated automatically on push by
   `scripts/build-dashboards.js` (see `.github/workflows/dashboards.yml`) — new
   mock folders appear, deleted ones disappear, dev-handoff files are detected,
   and each card's activity log is rebuilt from git (commit date + time + subject,
   grouped onto the card whose folder the commit touched). Nobody hand-maintains it.

   To theme a new product, add an entry to PRODUCT_THEMES below.

   CARD DESCRIPTIONS — ONE TIGHT SENTENCE, ~150 CHARS MAX (fits two lines).
   A card's `description` comes from the mock's `desc` field in products.json
   (via meta.json), falling back to the auto-derived describe() guess. Author it
   as one factual sentence saying what the design shows and its key interaction.
   Longer than that gets cut off — the card clamps `.card-description` to 2
   lines as a backstop. This applies to EVERY product (SafeLMS, Scheduling, and
   any added later).
   ========================================================================= */

(function () {
  'use strict';

  // Product dashboards never take comments. dashboard.js runs before toolbox.js
  // (plain <script>s execute in document order) and only ever loads on dashboard
  // pages, so setting this here turns the comment widget OFF for every product
  // dashboard — current and future — without touching the per-product shells.
  window.TOOLBOX = window.TOOLBOX || {};
  window.TOOLBOX.comments = false;

  // ----------------------------------------------------------------------
  // Inject the head resources this dashboard needs (so the shell can stay
  // minimal and identical across products).
  // ----------------------------------------------------------------------
  function injectHead() {
    const links = [
      // Font Awesome (icons)
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css' },
      // Open Sans (body)
      { rel: 'stylesheet', href: 'https://cdn.vsp-prod.com/web-components/@vector-web-components/assets/v1.0.0/fonts/open-sans/v43/open-sans.css' },
      // Fraunces (display serif) + Space Grotesk (UI) for a characterful look
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,700&family=Space+Grotesk:wght@500;600;700&display=swap' },
    ];
    links.forEach(spec => {
      const el = document.createElement('link');
      Object.keys(spec).forEach(k => {
        if (k === 'crossOrigin') el.crossOrigin = spec[k];
        else el.setAttribute(k, spec[k]);
      });
      document.head.appendChild(el);
    });

    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------------------
  // Markup — injected at the top of <body>.
  // ----------------------------------------------------------------------
  const MARKUP = `
    <header class="page-header">
      <div class="header-inner">
        <span class="product-tag">
          <span class="emoji" id="productEmoji">🎨</span>
          <span id="productName">Product</span>
        </span>
        <h1 class="page-title">Design <em>Lab</em></h1>
        <p class="page-subtitle">
          Every in-progress prototype, one click away. Bookmark this page — it stays in sync as the design team ships new work.
        </p>
        <div class="meta-bar">
          <span class="live-indicator"><span class="live-dot"></span> Auto-updated on every push</span>
          <span class="dot-sep">·</span>
          <span id="lastUpdated"></span>
        </div>
      </div>
    </header>

    <div class="toolbar" id="toolbar" hidden>
      <div class="toolbar-row">
        <div class="search-wrapper" id="searchWrapper">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" class="search-input" id="searchInput" placeholder="Search prototypes by name, description, or ticket…" autocomplete="off" spellcheck="false" />
          <button class="search-clear" id="searchClear" type="button" aria-label="Clear search">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="sort-control">
          <i class="fa-solid fa-arrow-down-wide-short sort-icon"></i>
          <label class="sort-label" for="sortSelect">Sort</label>
          <select class="sort-select" id="sortSelect" aria-label="Sort prototypes"></select>
        </div>
        <div class="view-switcher" id="viewSwitcher" role="group" aria-label="Switch layout">
          <button class="view-toggle" type="button" data-view="card" title="Card view" aria-label="Card view" aria-pressed="true"><i class="fa-solid fa-table-cells-large"></i></button>
          <button class="view-toggle" type="button" data-view="list" title="List view" aria-label="List view" aria-pressed="false"><i class="fa-solid fa-list"></i></button>
        </div>
      </div>
      <div class="filter-chips" id="filterChips" role="group" aria-label="Filter by status"></div>
    </div>

    <main class="content">
      <div class="state" id="loadingState">
        <div class="spinner"></div>
        <p style="margin-top: 18px;">Loading the prototype index…</p>
      </div>

      <div id="contentRoot"></div>

      <div class="state" id="errorState" hidden>
        <i class="fa-solid fa-circle-exclamation"></i>
        <h3>Couldn't load the prototype index</h3>
        <p id="errorMessage"></p>
        <button class="retry" id="retryBtn" type="button">Try again</button>
      </div>

      <div class="state" id="emptyState" hidden>
        <i class="fa-regular fa-folder-open"></i>
        <h3>No prototypes yet</h3>
        <p id="emptyMessage"></p>
      </div>
    </main>

    <footer class="page-footer">
      This index is driven by <code>dashboard/meta.json</code>, which is regenerated automatically on every push — no manual upkeep.
    </footer>
  `;

  // ----------------------------------------------------------------------
  // Config
  // ----------------------------------------------------------------------
  const REPO_BASE = 'https://github.com/VectorLearning/ux-mockups/blob/main/products';
  const PAGES_BASE = 'https://vectorlearning.github.io/ux-mockups/products';

  // Detect product from URL — works on file://, localhost, and Pages
  const productMatch = window.location.pathname.match(/\/products\/([^/]+)\/dashboard/i);
  const PRODUCT = productMatch ? decodeURIComponent(productMatch[1]) : 'SafeLMS';

  // Per-product theme, keyed by the product folder name (as it appears in the
  // URL). `label` is the display name shown in the header; `emoji` sits in the
  // product pill; the accent + gradient trio color the whole page. To enroll a
  // new product, add it to products.json and drop an entry here.
  // Palettes are sampled from each product's own mocks (dominant non-neutral
  // accent across its feature designs) so the dashboard echoes the product.
  const PRODUCT_THEMES = {
    'aithera': {
      label: 'Aithera', emoji: '🧠',
      accent: '#916213', accentSoft: '#faeed3', accentDeep: '#7b4f0c',
      accentGlow: 'rgba(227, 160, 47, 0.20)',
      gradStart: '#a26b0d', gradMid: '#916213', gradEnd: '#4b63e6',
    },
    'Bridge': {
      label: 'Bridge', emoji: '🌉',
      accent: '#0057b8', accentSoft: '#d9e8f8', accentDeep: '#003d80',
      accentGlow: 'rgba(0, 87, 184, 0.18)',
      gradStart: '#1d4ed8', gradMid: '#0057b8', gradEnd: '#003d80',
    },
    'check-it': {
      label: 'Check It', emoji: '✅',
      accent: '#4e51ef', accentSoft: '#e0e7ff', accentDeep: '#4338ca',
      accentGlow: 'rgba(99, 102, 241, 0.18)',
      gradStart: '#6164f1', gradMid: '#4338ca', gradEnd: '#23a475',
    },
    'Convergence': {
      label: 'Convergence', emoji: '🔀',
      accent: '#1c5cea', accentSoft: '#dbeafe', accentDeep: '#1d4ed8',
      accentGlow: 'rgba(37, 99, 235, 0.18)',
      gradStart: '#1e6ff5', gradMid: '#2563eb', gradEnd: '#7c3aed',
    },
    'design-system': {
      label: 'Design System', emoji: '🎨',
      accent: '#475569', accentSoft: '#f1f5f9', accentDeep: '#1e293b',
      accentGlow: 'rgba(100, 116, 139, 0.16)',
      gradStart: '#64748b', gradMid: '#475569', gradEnd: '#0d99d8',
    },
    'EHS': {
      label: 'EHS', emoji: '🦺',
      accent: '#0267bc', accentSoft: '#d7e9fb', accentDeep: '#00549b',
      accentGlow: 'rgba(2, 113, 206, 0.18)',
      gradStart: '#2571ed', gradMid: '#0271ce', gradEnd: '#0a7637',
    },
    'Evaluations': {
      label: 'Evaluations', emoji: '📋',
      accent: '#8a6500', accentSoft: '#f7edc9', accentDeep: '#6b4e00',
      accentGlow: 'rgba(240, 192, 64, 0.24)',
      gradStart: '#95700c', gradMid: '#8a6500', gradEnd: '#6b4e00',
    },
    'Keystone-Tenants': {
      label: 'Keystone Tenants', emoji: '🏢',
      accent: '#1e40af', accentSoft: '#dbeafe', accentDeep: '#1e3a8a',
      accentGlow: 'rgba(30, 64, 175, 0.18)',
      gradStart: '#1e6ff5', gradMid: '#1e40af', gradEnd: '#1e3a8a',
    },
    'LearningStudio': {
      label: 'LearningStudio', emoji: '📐',
      accent: '#0a74a3', accentSoft: '#e0f2fe', accentDeep: '#035f92',
      accentGlow: 'rgba(14, 165, 233, 0.18)',
      gradStart: '#0b7eb2', gradMid: '#0c70f2', gradEnd: '#7c3aed',
    },
    'Pathways': {
      label: 'Pathways', emoji: '🧭',
      accent: '#a95000', accentSoft: '#f3e9cf', accentDeep: '#8a4000',
      accentGlow: 'rgba(179, 85, 0, 0.18)',
      gradStart: '#907125', gradMid: '#b35500', gradEnd: '#8a4000',
    },
    'SafeLMS': {
      label: 'SafeLMS', emoji: '🛡️',
      accent: '#0b56fc', accentSoft: '#dce7ff', accentDeep: '#1f4596',
      accentGlow: 'rgba(21, 93, 252, 0.18)',
      gradStart: '#155dfc', gradMid: '#1447e6', gradEnd: '#21a366',
    },
    'Scheduling': {
      label: 'Scheduling', emoji: '📅',
      accent: '#7c3aed', accentSoft: '#ede9fe', accentDeep: '#5b21b6',
      accentGlow: 'rgba(124, 58, 237, 0.18)',
      gradStart: '#7c3aed', gradMid: '#6d28d9', gradEnd: '#158444',
    },
    'target-solutions': {
      label: 'Target Solutions', emoji: '🎯',
      accent: '#0065d1', accentSoft: '#d9ebff', accentDeep: '#0056b3',
      accentGlow: 'rgba(0, 123, 255, 0.18)',
      gradStart: '#0072eb', gradMid: '#0065d1', gradEnd: '#0056b3',
    },
  };

  // Fallback for any product without an explicit theme — keeps the page styled.
  const FALLBACK_THEME = {
    label: PRODUCT, emoji: '🧩',
    accent: '#4338ca', accentSoft: '#e0e7ff', accentDeep: '#3730a3',
    accentGlow: 'rgba(99, 102, 241, 0.18)',
    gradStart: '#5558ef', gradMid: '#7c3aed', gradEnd: '#ec4899',
  };

  // ----------------------------------------------------------------------
  // Folder-name humanizer + fallback describer
  // ----------------------------------------------------------------------
  const ACRONYMS = new Set(['AI', 'AR', 'VR', 'UX', 'UI', 'API', 'LMS', 'EHS', 'CRM', 'HR', 'IT', 'PDF']);

  function humanize(folder) {
    const ticketMatch = folder.match(/\s+([A-Z]{2,}-\d+)$/);
    let ticket = null;
    let base = folder;
    if (ticketMatch) {
      ticket = ticketMatch[1];
      base = folder.slice(0, ticketMatch.index);
    }
    const looksKebab = /-/.test(base) && !/\s/.test(base);
    const looksSnake = /_/.test(base) && !/\s/.test(base);
    if (looksKebab) base = base.replace(/-/g, ' ');
    if (looksSnake) base = base.replace(/_/g, ' ');
    const titled = base
      .split(/\s+/)
      .filter(Boolean)
      .map(w => {
        const up = w.toUpperCase();
        if (ACRONYMS.has(up)) return up;
        if (w === w.toUpperCase() && w.length <= 4) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
    return { title: titled.trim(), ticket };
  }

  function describe(folder, sectionName) {
    const lower = folder.toLowerCase();
    if (lower.includes('dashboard')) return 'Dashboard prototype for this view.';
    if (lower.includes('modal') || lower.includes('dialog')) return 'Modal / dialog interaction prototype.';
    if (lower.includes('report')) return 'Reports prototype with tables and exports.';
    if (lower.includes('search')) return 'Search experience prototype.';
    if (lower.includes('rule') || lower.includes('engine')) return 'Rules engine configuration UI.';
    if (lower.includes('theme') || lower.includes('color')) return 'Theme & color customization prototype.';
    if (lower.includes('event') || lower.includes('indicator')) return 'Event / indicator UX exploration.';
    if (lower.includes('timeout') || lower.includes('session')) return 'Session lifecycle prototype.';
    if (lower.includes('settings')) return 'Settings page prototype.';
    if (lower.includes('test') || lower.includes('scratch')) return 'Experimental scratch space for in-flight work.';
    if (sectionName) return `${sectionName} prototype.`;
    return 'In-progress prototype mock.';
  }

  const STATUS_LABELS = {
    'concept': 'Concept',
    'in-progress': 'In Progress',
    'review': 'In Review',
    'ready-for-dev': 'Ready for Dev',
    'archived': 'Archived',
  };
  const DEFAULT_STATUS = 'in-progress';
  const STATUS_ORDER = ['ready-for-dev', 'review', 'in-progress', 'concept', 'archived'];
  // Font Awesome icon per status — shown in the status pill instead of a dot.
  const STATUS_ICONS = {
    'concept': 'fa-lightbulb',
    'in-progress': 'fa-pencil',
    'review': 'fa-eye',
    'ready-for-dev': 'fa-code',
    'archived': 'fa-box-archive',
  };
  function statusIcon(status) { return STATUS_ICONS[status] || 'fa-circle'; }

  const VIEW_KEY = 'designlab-view';
  const SORT_KEY = 'designlab-sort';
  // Cards are ALWAYS grouped by status; the sort controls ordering WITHIN each
  // status group (there is no standalone "by status" sort — grouping is implicit).
  const SORTS = {
    updated: 'Recently updated',
    oldest:  'Oldest updated',
    az:      'Name (A–Z)',
    za:      'Name (Z–A)',
  };
  const state = {
    allMocks: [],
    search: '',
    statuses: new Set(),
    view: readStoredView(), // 'card' | 'list' — persisted per browser
    sort: readStoredSort(), // one of SORTS keys — persisted per browser
  };

  function readStoredView() {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'card';
    } catch { return 'card'; }
  }
  function readStoredSort() {
    try {
      const s = localStorage.getItem(SORT_KEY);
      return SORTS[s] ? s : 'updated';
    } catch { return 'updated'; }
  }

  // Comparator for the current sort — applied WITHIN each status group (both
  // views always group by status first). Defaults to newest-updated.
  function mockComparator(sort) {
    const byName = (a, b) => a.title.localeCompare(b.title);
    // Newest first / oldest first; mocks with no history sort last either way.
    const byDate = dir => (a, b) => {
      const av = a.lastUpdated || '', bv = b.lastUpdated || '';
      if (!av && !bv) return byName(a, b);
      if (!av) return 1;
      if (!bv) return -1;
      return av === bv ? byName(a, b) : (dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av));
    };
    switch (sort) {
      case 'az': return byName;
      case 'za': return (a, b) => byName(b, a);
      case 'oldest': return byDate('asc');
      case 'updated':
      default: return byDate('desc');
    }
  }

  // ----------------------------------------------------------------------
  // Data fetch — meta.json is the single source of truth
  // ----------------------------------------------------------------------
  async function loadMocks() {
    byId('errorState').hidden = true;
    byId('emptyState').hidden = true;
    byId('toolbar').hidden = true;
    byId('contentRoot').innerHTML = '';
    byId('loadingState').hidden = false;

    try {
      // Cache-bust: GitHub Pages edge-caches meta.json for 10 min and ignores
      // custom headers, so a changing query string is the only reliable way to
      // show a just-pushed date/status/dev-handoff instead of a stale copy.
      const res = await fetch('./meta.json?cb=' + Date.now(), { cache: 'no-cache' });
      if (!res.ok) throw new Error(`meta.json returned ${res.status} ${res.statusText}`);
      const meta = await res.json();
      if (!meta || typeof meta.mocks !== 'object' || meta.mocks === null) {
        throw new Error('meta.json is missing a "mocks" object.');
      }

      state.allMocks = computeMocks(meta);
      attachChanges(state.allMocks, meta);

      if (state.allMocks.length === 0) {
        byId('loadingState').hidden = true;
        byId('emptyMessage').textContent =
          `No prototype folders found under products/${PRODUCT}/ yet — add a mock folder with an index.html and it'll appear here on the next push.`;
        byId('emptyState').hidden = false;
        updateLastFetched();
        return;
      }

      byId('loadingState').hidden = true;
      renderFilterChips();
      byId('toolbar').hidden = false;
      applyFiltersAndRender();
      updateLastFetched();
    } catch (err) {
      showError(err);
    }
  }

  function computeMocks(meta) {
    const jiraBase = (meta.jiraBaseUrl || '').trim();
    const jiraBaseNorm = jiraBase ? (jiraBase.endsWith('/') ? jiraBase : jiraBase + '/') : '';

    const productEnc = encodeURIComponent(PRODUCT);
    // GitHub "commits for this path" base — used for the per-card "full history"
    // link. Same repo/branch as the blob links, just the commits view.
    const COMMITS_BASE = REPO_BASE.replace('/blob/main/', '/commits/main/');

    return Object.keys(meta.mocks).map(key => {
      const m = meta.mocks[key] || {};

      // Three mock shapes share this dashboard:
      //   "."             → the product root (products/<Product>/index.html)
      //   "path/foo.html" → a standalone-file mock (the .html IS the prototype)
      //   "foo" / "a/b"   → a folder mock (folder/index.html is the prototype)
      const isRoot = key === '.';
      const isFile = key.endsWith('.html');

      const parts = key.split('/');
      const lastSeg = parts[parts.length - 1];
      const folder = isRoot ? PRODUCT : (isFile ? lastSeg.replace(/\.html$/i, '') : lastSeg);
      const parent = isRoot ? null : (parts.length > 1 ? parts.slice(0, -1).join('/') : null);
      const auto = humanize(folder);

      // The Pages/GitHub path to the actual prototype file.
      const relEnc = isRoot ? '' : key.split('/').map(encodeURIComponent).join('/');
      const base = relEnc ? `${productEnc}/${relEnc}` : productEnc;
      // File mocks point straight at the file; root/folder mocks at the folder
      // (Pages serves its index.html).
      const pagesUrl = isFile ? `${PAGES_BASE}/${base}` : `${PAGES_BASE}/${base}/`;
      const blobUrl = isFile ? `${REPO_BASE}/${base}` : `${REPO_BASE}/${base}/index.html`;

      const ticket = m.ticket || auto.ticket;
      const ticketUrl = m.ticketUrl || (ticket && jiraBaseNorm ? jiraBaseNorm + ticket : null);

      // Dev handoff only applies to folder/root mocks (a folder that can hold a
      // dev_handoff.html); file mocks never carry one.
      const devHandoff = !isFile && !!m.devHandoff;
      const devFile = (typeof m.devHandoff === 'string' && m.devHandoff.trim()) ? m.devHandoff.trim() : 'dev_handoff.html';
      const devFileEnc = devFile.split('/').map(encodeURIComponent).join('/');

      return {
        relKey: key,
        folder,
        parent,
        title: m.title || auto.title,
        ticket,
        ticketUrl,
        description: m.description || describe(folder, parent),
        modified: m.modified || null,
        status: m.status || (devHandoff ? 'ready-for-dev' : DEFAULT_STATUS),
        blobUrl,
        pagesUrl,
        // Full commit history for this prototype on GitHub (the "show more" target
        // for the per-card log). Mirrors what the inline log counts.
        historyUrl: `${COMMITS_BASE}/${isRoot ? `${productEnc}/index.html` : base}`,
        devHandoff,
        devBlobUrl: devHandoff ? `${REPO_BASE}/${base}/${devFileEnc}` : null,
        devPagesUrl: devHandoff ? `${PAGES_BASE}/${base}/${devFileEnc}` : null,
        extraLinks: Array.isArray(m.extraLinks) ? m.extraLinks.map(l => {
          const fileEnc = String(l.file || '').split('/').map(encodeURIComponent).join('/');
          return {
            label: l.label || l.file,
            pagesUrl: `${PAGES_BASE}/${base}/${fileEnc}`,
            blobUrl: `${REPO_BASE}/${base}/${fileEnc}`,
          };
        }) : [],
      };
    });
  }

  // ----------------------------------------------------------------------
  // Toolbar
  // ----------------------------------------------------------------------
  function renderFilterChips() {
    const counts = {};
    state.allMocks.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });
    const chipsEl = byId('filterChips');
    // Show EVERY status so the team can see the full set of stages at a glance,
    // even ones with no prototypes yet. Empty statuses render dimmed + disabled
    // (a "0" that can't be clicked into an empty view).
    const chips = [
      { status: 'all', label: 'All', count: state.allMocks.length },
      ...STATUS_ORDER.map(s => ({ status: s, label: STATUS_LABELS[s], count: counts[s] || 0 })),
    ];
    chipsEl.innerHTML = chips.map(c => {
      const empty = c.status !== 'all' && c.count === 0;
      return `
      <button class="filter-chip" type="button" data-status="${escapeHtml(c.status)}" data-active="false"${empty ? ' data-empty="true" disabled' : ''}>
        ${c.status !== 'all' ? '<span class="chip-dot"></span>' : ''}
        <span>${escapeHtml(c.label)}</span>
        <span class="chip-count">${c.count}</span>
      </button>`;
    }).join('');
    updateChipActiveState();
  }

  function updateChipActiveState() {
    const chips = document.querySelectorAll('.filter-chip');
    const noneSelected = state.statuses.size === 0;
    chips.forEach(chip => {
      const s = chip.dataset.status;
      const active = s === 'all' ? noneSelected : state.statuses.has(s);
      chip.dataset.active = active ? 'true' : 'false';
    });
  }

  // ----------------------------------------------------------------------
  // Filter + render
  // ----------------------------------------------------------------------
  function applyFiltersAndRender() {
    const root = byId('contentRoot');
    root.innerHTML = '';

    const search = state.search.toLowerCase().trim();
    const statusFilter = state.statuses;

    let filtered = state.allMocks;
    if (statusFilter.size > 0) filtered = filtered.filter(m => statusFilter.has(m.status));
    if (search) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(search) ||
        (m.description || '').toLowerCase().includes(search) ||
        (m.ticket || '').toLowerCase().includes(search) ||
        m.relKey.toLowerCase().includes(search)
      );
    }

    if (filtered.length === 0) { renderNoResults(); return; }

    // Same filtered set, two layouts — the view switcher just picks the renderer.
    if (state.view === 'list') renderListView(filtered, root);
    else renderCardView(filtered, root);
  }

  // Group the filtered mocks by status, in STATUS_ORDER, with each group's
  // members ordered by the active within-group sort. Shared by both views.
  function groupByStatus(filtered) {
    const grouped = {};
    filtered.forEach(m => { (grouped[m.status] = grouped[m.status] || []).push(m); });
    const cmp = mockComparator(state.sort);
    return STATUS_ORDER
      .filter(status => grouped[status])
      .map(status => ({ status, mocks: grouped[status].slice().sort(cmp) }));
  }

  function renderCardView(filtered, root) {
    let cardIdx = 0;
    groupByStatus(filtered).forEach(({ status, mocks }) => {
      const wrap = document.createElement('section');
      wrap.className = 'section';
      wrap.appendChild(statusSectionHeader(status, mocks.length));
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      mocks.forEach(m => grid.appendChild(buildCard(m, cardIdx++)));
      wrap.appendChild(grid);
      root.appendChild(wrap);
    });
  }

  // Compact table layout mirroring the top-level product index list — also
  // grouped by status, with rows inside each group following the active sort.
  function renderListView(filtered, root) {
    groupByStatus(filtered).forEach(({ status, mocks }) => {
      const wrap = document.createElement('section');
      wrap.className = 'section';
      wrap.appendChild(statusSectionHeader(status, mocks.length));
      const tableWrap = document.createElement('div');
      tableWrap.className = 'proto-table-wrap';
      tableWrap.innerHTML = `
        <table class="proto-table">
          <thead>
            <tr>
              <th>Prototype</th>
              <th class="col-status">Status</th>
              <th class="col-jira">Jira</th>
              <th class="col-date">Last updated</th>
            </tr>
          </thead>
          <tbody>${mocks.map(listRow).join('')}</tbody>
        </table>`;
      wrap.appendChild(tableWrap);
      root.appendChild(wrap);
    });
  }

  function listRow(mock) {
    const statusLabel = STATUS_LABELS[mock.status] || STATUS_LABELS[DEFAULT_STATUS];
    const href = mock.devHandoff ? mock.devPagesUrl : mock.pagesUrl;

    // Plain-text Jira link when a ticket is set; blank cell when it isn't.
    const jiraCell = (mock.ticket && mock.ticketUrl)
      ? `<a class="jira-plain" href="${escapeHtml(mock.ticketUrl)}" target="_blank" rel="noopener">${escapeHtml(mock.ticket)}</a>`
      : mock.ticket
        ? `<span class="jira-plain">${escapeHtml(mock.ticket)}</span>`
        : '';

    const updated = mock.lastUpdated ? escapeHtml(formatDateTime(mock.lastUpdated)) : '—';

    return `
          <tr class="proto-row">
            <td>
              <a class="proto-name" href="${href}" target="_blank" rel="noopener">
                <i class="fa-regular fa-file-lines file-icon"></i>
                <span>${escapeHtml(mock.title)}</span>
                ${recencyTag(mock)}
                ${mock.devHandoff ? '<span class="proto-dev-tag">Dev</span>' : ''}
                <i class="fa-solid fa-arrow-up-right-from-square ext-icon"></i>
              </a>
            </td>
            <td><span class="status-badge" data-status="${escapeHtml(mock.status)}"><i class="fa-solid ${statusIcon(mock.status)} status-icon"></i>${escapeHtml(statusLabel)}</span></td>
            <td>${jiraCell}</td>
            <td class="date-cell">${updated}</td>
          </tr>`;
  }

  function renderNoResults() {
    const root = byId('contentRoot');
    const wrap = document.createElement('div');
    wrap.className = 'no-results';
    wrap.innerHTML = `
      <i class="fa-solid fa-magnifying-glass"></i>
      <h3>No matches</h3>
      <p>Nothing matches your search or filters. Try a different keyword or clear the active status filter.</p>
      <button class="clear-filters-btn" type="button" id="clearFiltersBtn">Clear filters</button>
    `;
    root.appendChild(wrap);
    byId('clearFiltersBtn').addEventListener('click', clearFilters);
  }

  function clearFilters() {
    state.search = '';
    state.statuses.clear();
    const input = byId('searchInput');
    input.value = '';
    byId('searchWrapper').classList.remove('has-value');
    updateChipActiveState();
    applyFiltersAndRender();
  }

  function statusSectionHeader(status, count) {
    const el = document.createElement('div');
    el.className = 'section-header';
    const label = STATUS_LABELS[status] || status;
    el.innerHTML = `
      <h2 class="section-title">${escapeHtml(label)}</h2>
      <span class="status-badge" data-status="${escapeHtml(status)}">
        <i class="fa-solid ${statusIcon(status)} status-icon"></i>${count}
      </span>
    `;
    return el;
  }

  // ----------------------------------------------------------------------
  // Card construction
  // ----------------------------------------------------------------------

  // A single link row: a click-to-copy field (a dark "Copy" chip appears over
  // its right edge on hover) plus a dedicated Open button that opens the link in
  // a new tab. Used for every Pages / GitHub / dev / extra link on a card.
  function urlRow(icon, label, url, extraClass) {
    const u = escapeHtml(url);
    return `
        <div class="url-row${extraClass ? ' ' + extraClass : ''}">
          <span class="url-label"><i class="${icon}"></i> ${escapeHtml(label)}</span>
          <button class="url-copy" type="button" data-copy="${u}" title="Click to copy this link">
            <span class="url-copy-text">${u}</span>
            <span class="url-copy-chip"><i class="fa-regular fa-copy"></i> Copy</span>
          </button>
          <a class="url-open" href="${u}" target="_blank" rel="noopener" title="Open in a new tab">Open <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>`;
  }

  function buildCard(mock, idx) {
    const { title, ticket, ticketUrl, description, status, blobUrl, pagesUrl, devHandoff, devBlobUrl, devPagesUrl, extraLinks } = mock;
    const statusLabel = STATUS_LABELS[status] || STATUS_LABELS[DEFAULT_STATUS];

    let ticketHtml = '';
    if (ticket && ticketUrl) {
      ticketHtml = `<a class="ticket-badge ticket-badge--link" href="${escapeHtml(ticketUrl)}" target="_blank" rel="noopener" title="Open ${escapeHtml(ticket)} in Jira"><i class="fa-solid fa-link ticket-link-icon"></i>${escapeHtml(ticket)}</a>`;
    } else if (ticket) {
      ticketHtml = `<span class="ticket-badge"><i class="fa-solid fa-link ticket-link-icon"></i>${escapeHtml(ticket)}</span>`;
    } else {
      ticketHtml = `<span class="ticket-badge ticket-badge--missing" title="No Jira ticket is linked to this prototype yet">Jira link needed</span>`;
    }

    // The click-to-copy Pages row for the designer's working file. Only
    // ready-for-dev cards expose the GitHub source link (see below) — before
    // then, developers don't need the code, only the live Pages preview.
    const designPages = urlRow('fa-solid fa-globe', 'Pages', pagesUrl);

    let boxHtml;
    if (devHandoff) {
      // Ready-for-dev card: two separate boxes. The dev-handoff duplicates are
      // the primary links (Pages + GitHub, in a labelled cyan box); the working
      // designer file sits in its own box below, collapsed into a drawer.
      const devPages = urlRow('fa-solid fa-globe', 'Pages', devPagesUrl, 'url-row--dev');
      const devGithub = urlRow('fa-brands fa-github', 'GitHub', devBlobUrl, 'url-row--dev');
      boxHtml = `
      <div class="url-list url-list--dev">
        <div class="url-list-header">For Dev — Ready-for-Dev Duplicates</div>
        ${devPages}${devGithub}
      </div>
      <div class="url-list url-list--designer">
        <details class="design-links-drawer">
          <summary><i class="fa-solid fa-chevron-right drawer-chevron"></i> Designer Versions <span class="drawer-note">working files — Pages only</span></summary>
          <div class="drawer-rows">${designPages}
          </div>
        </details>
      </div>`;
    } else {
      // Not yet ready for dev (concept / in progress / review / archived):
      // Pages preview only — the GitHub source link appears at the dev handoff.
      boxHtml = `<div class="url-list">${designPages}</div>`;
    }

    // Extra curated links (rare) — their own click-to-copy / Open rows.
    const extras = extraLinks || [];
    const extraBox = extras.length
      ? `<div class="url-list">${extras.map(l => urlRow('fa-solid fa-eye', l.label, l.pagesUrl)).join('')}</div>`
      : '';

    // --- Footer: LOG + last-updated -----------------------------------------
    // The "Updated" timestamp lives in the log header row (always visible, even
    // when the log is collapsed). Within the last 24h it becomes a highlighted
    // violet pill; otherwise a plain clock + time. Cards with no git history
    // still show the header row so the timestamp is never lost.
    const changes = mock.changes || [];
    const LOG_SHOWN = 10;
    const recentCount = changes.filter(c => isWithin24h(c.date)).length;
    const logNotif = recentCount
      ? `<span class="log-notif" title="${recentCount} change${recentCount !== 1 ? 's' : ''} in the last 24 hours"></span>`
      : '';

    const updatedPill = mock.lastUpdated
      ? (mock.recentlyUpdated
          ? `<span class="log-updated log-updated--recent" title="Changed in the last 24 hours"><span class="recency-dot"></span>${mock.isNew ? 'New' : 'Updated'} ${escapeHtml(formatDateTime(mock.lastUpdated))}</span>`
          : `<span class="log-updated" title="Most recent change to this prototype"><i class="fa-regular fa-clock"></i> Updated ${escapeHtml(formatDateTime(mock.lastUpdated))}</span>`)
      : '';

    const logRow = entry => `
          <li class="log-item${isWithin24h(entry.date) ? ' log-item--recent' : ''}">
            <span class="log-date">${escapeHtml(formatDate(entry.date))}</span>
            <span class="log-summary">${escapeHtml(entry.summary || '')}</span>
          </li>`;
    const shownRows = changes.slice(0, LOG_SHOWN).map(logRow).join('');
    const hiddenCount = Math.max(0, changes.length - LOG_SHOWN);
    const fullLogLabel = hiddenCount ? `View full log (${hiddenCount} more)` : 'View full log';

    let logHtml;
    if (changes.length) {
      logHtml = `
      <details class="card-log">
        <summary>
          <span class="log-icon-wrap"><i class="fa-solid fa-clock-rotate-left"></i>${logNotif}</span>
          <span class="log-title">Log</span>
          <span class="log-count">${changes.length}</span>
          ${updatedPill}
          <i class="fa-solid fa-chevron-right log-chevron"></i>
        </summary>
        <ul class="log-list">${shownRows}
        </ul>
        <a class="log-full-btn" href="${mock.historyUrl}" target="_blank" rel="noopener">${escapeHtml(fullLogLabel)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </details>`;
    } else {
      // No git history for this mock — static header row, no expander.
      logHtml = `
      <div class="card-log card-log--empty">
        <span class="log-icon-wrap"><i class="fa-solid fa-clock-rotate-left"></i></span>
        <span class="log-title">Log</span>
        ${updatedPill || '<span class="log-updated">No recorded changes yet</span>'}
      </div>`;
    }

    const card = document.createElement('div');
    card.className = 'mock-card' + (mock.recentlyUpdated ? ' mock-card--recent' : '');
    card.style.animationDelay = `${Math.min(idx * 0.05, 0.5)}s`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-badge-row">
          <span class="status-badge" data-status="${escapeHtml(status)}"><i class="fa-solid ${statusIcon(status)} status-icon"></i>${escapeHtml(statusLabel)}</span>
          ${ticketHtml}
        </div>
        <h2 class="card-title">${escapeHtml(title)}</h2>
      </div>
      <p class="card-description">${escapeHtml(description)}</p>
      ${boxHtml}
      ${extraBox}
      ${logHtml}
    `;
    return card;
  }

  // ----------------------------------------------------------------------
  // Per-mock activity log
  // ----------------------------------------------------------------------
  // Assign each recentChanges entry to the mock it belongs to. Entry paths are
  // relative to the product folder (e.g. "osha-report/index.html"); a mock's
  // relKey is its folder path (e.g. "osha-report"). When one mock nests inside
  // another, the entry goes to the most specific (longest matching) relKey so a
  // change isn't double-counted on a parent card.
  function attachChanges(mocks, meta) {
    mocks.forEach(m => { m.changes = []; });
    const all = Array.isArray(meta && meta.recentChanges) ? meta.recentChanges : [];
    // Longest relKey first so the most specific mock claims the entry.
    const byDepth = [...mocks].sort((a, b) => b.relKey.length - a.relKey.length);

    all.forEach(entry => {
      const p = entry && entry.path ? String(entry.path) : '';
      const owner = byDepth.find(m => {
        if (m.relKey === '.') return p === 'index.html';        // product-root mock
        if (m.relKey.endsWith('.html')) return p === m.relKey;   // standalone-file mock
        return p === m.relKey || p.startsWith(m.relKey + '/');   // folder mock
      });
      if (owner) {
        // One commit may emit several file entries under the same mock —
        // collapse them so the card's log shows the commit once.
        const dup = owner.changes.some(c => c.date === entry.date && c.summary === entry.summary);
        if (!dup) owner.changes.push(entry);
      }
    });

    // "Recent" is measured against when the user opens the page, so the highlight
    // is always relative to access time. A prototype whose FIRST commit is also
    // within the window reads as brand "New"; otherwise it's an "Updated" one.
    const now = Date.now();
    const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
    mocks.forEach(m => {
      m.changes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      // Prefer the newest attributed commit; fall back to the curated
      // `modified` date from products.json when git history has nothing.
      m.lastUpdated = m.changes.length ? m.changes[0].date : (m.modified || null);
      const newest = parseDate(m.lastUpdated);
      const oldest = m.changes.length ? parseDate(m.changes[m.changes.length - 1].date) : null;
      m.recentlyUpdated = !!newest && (now - newest.getTime()) <= WINDOW_MS;
      m.isNew = m.recentlyUpdated && !!oldest && (now - oldest.getTime()) <= WINDOW_MS;
    });
  }

  // Small inline "New" / "Updated" pill (used in the LIST view) for a prototype
  // changed within the last 24h. Single notification-violet for both.
  function recencyTag(mock) {
    if (!mock.recentlyUpdated) return '';
    const label = mock.isNew ? 'New' : 'Updated';
    const when = mock.lastUpdated ? ` ${escapeHtml(formatDateTime(mock.lastUpdated))}` : '';
    return `<span class="recency-tag" title="Changed in the last 24 hours —${when}"><span class="recency-dot"></span>${label}</span>`;
  }

  // True when a change timestamp falls inside the 24h "recent" window, measured
  // from now (page-open time).
  function isWithin24h(iso) {
    const d = parseDate(iso);
    return !!d && (Date.now() - d.getTime()) <= 24 * 60 * 60 * 1000;
  }

  // Relative day label for the per-entry log rows ("Today", "3d ago", "Mar 4").
  function formatDate(iso) {
    const d = parseDate(iso);
    if (!d) return iso || '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - day) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Absolute date + time for the "last updated" line next to the status pill.
  function formatDateTime(iso) {
    const d = parseDate(iso);
    if (!d) return '';
    const hasTime = typeof iso === 'string' && iso.includes('T');
    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    if (!hasTime) return datePart;
    const timePart = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  // Accepts full ISO timestamps ("2026-07-16T14:23:45-05:00") and legacy
  // date-only strings ("2026-07-16"); returns a Date or null.
  function parseDate(iso) {
    if (!iso) return null;
    const s = String(iso);
    const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function showError(err) {
    byId('loadingState').hidden = true;
    byId('errorState').hidden = false;
    const msg = err.message || String(err);
    let friendly = msg;
    if (/404|not found/i.test(msg)) {
      friendly = "Couldn't find meta.json. Make sure dashboard/meta.json exists alongside this file.";
    } else if (/JSON|Unexpected/i.test(msg)) {
      friendly = "meta.json couldn't be parsed. Open the file and check for valid JSON (trailing commas, missing quotes, etc.).";
    } else if (/Failed to fetch|NetworkError/i.test(msg)) {
      friendly = "Couldn't fetch meta.json. If you're viewing this file via file:// locally, your browser may block fetch — run a small local server (e.g. `python3 -m http.server` from the repo root) and open via http://localhost.";
    }
    byId('errorMessage').textContent = friendly;
  }

  function updateLastFetched() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    byId('lastUpdated').textContent = `Refreshed ${time}`;
  }

  // ----------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------
  function byId(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ----------------------------------------------------------------------
  // Boot
  // ----------------------------------------------------------------------
  function boot() {
    injectHead();
    document.body.insertAdjacentHTML('afterbegin', MARKUP);

    // Apply theme
    const theme = PRODUCT_THEMES[PRODUCT] || FALLBACK_THEME;
    const displayName = theme.label || PRODUCT;
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-soft', theme.accentSoft);
    root.style.setProperty('--accent-deep', theme.accentDeep);
    root.style.setProperty('--accent-glow', theme.accentGlow);
    root.style.setProperty('--gradient-start', theme.gradStart);
    root.style.setProperty('--gradient-mid', theme.gradMid);
    root.style.setProperty('--gradient-end', theme.gradEnd);

    document.title = `${displayName} — Prototype Index`;
    byId('productName').textContent = displayName;
    byId('productEmoji').textContent = theme.emoji;

    // Retry button
    byId('retryBtn').addEventListener('click', loadMocks);

    // Copy handlers (delegated). New card layout: the URL field itself copies —
    // its "Copy" chip flips to "Copied!" briefly. (Legacy .copy-btn kept as a
    // fallback in case any older markup remains.)
    document.addEventListener('click', (e) => {
      const field = e.target.closest('.url-copy');
      if (field) {
        navigator.clipboard.writeText(field.dataset.copy).then(() => {
          const chip = field.querySelector('.url-copy-chip');
          if (!chip) return;
          if (!field._orig) field._orig = chip.innerHTML;
          chip.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          field.classList.add('copied');
          clearTimeout(field._t);
          field._t = setTimeout(() => { chip.innerHTML = field._orig; field.classList.remove('copied'); }, 1500);
        });
        return;
      }
      const btn = e.target.closest('.copy-btn');
      if (!btn) return;
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1500);
      });
    });

    // Toolbar wiring
    const searchInput = byId('searchInput');
    const searchWrapper = byId('searchWrapper');
    const searchClear = byId('searchClear');
    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      searchWrapper.classList.toggle('has-value', value.length > 0);
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => { state.search = value; applyFiltersAndRender(); }, 80);
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchWrapper.classList.remove('has-value');
      state.search = '';
      applyFiltersAndRender();
      searchInput.focus();
    });
    byId('filterChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      const status = chip.dataset.status;
      if (status === 'all') state.statuses.clear();
      else if (state.statuses.has(status)) state.statuses.delete(status);
      else state.statuses.add(status);
      updateChipActiveState();
      applyFiltersAndRender();
    });

    // Sort dropdown
    const sortSelect = byId('sortSelect');
    sortSelect.innerHTML = Object.keys(SORTS)
      .map(k => `<option value="${k}">${SORTS[k]}</option>`).join('');
    sortSelect.value = state.sort;
    sortSelect.addEventListener('change', () => setSort(sortSelect.value));

    // View switcher (card / list)
    byId('viewSwitcher').addEventListener('click', (e) => {
      const btn = e.target.closest('.view-toggle');
      if (!btn) return;
      setView(btn.dataset.view);
    });
    updateViewToggle();

    loadMocks();
  }

  function setSort(sort) {
    if (!SORTS[sort] || state.sort === sort) return;
    state.sort = sort;
    try { localStorage.setItem(SORT_KEY, sort); } catch { /* storage may be blocked */ }
    if (state.allMocks.length) applyFiltersAndRender();
  }

  function setView(view) {
    if (view !== 'card' && view !== 'list') return;
    if (state.view === view) return;
    state.view = view;
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* storage may be blocked */ }
    updateViewToggle();
    if (state.allMocks.length) applyFiltersAndRender();
  }

  function updateViewToggle() {
    document.querySelectorAll('.view-toggle').forEach(btn => {
      const active = btn.dataset.view === state.view;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('is-active', active);
    });
  }

  // ----------------------------------------------------------------------
  // Styles (injected into <head>)
  // ----------------------------------------------------------------------
  const STYLES = `
      :root {
        --accent: #4338ca;
        --accent-soft: #e0e7ff;
        --accent-deep: #3730a3;
        --accent-glow: rgba(99, 102, 241, 0.18);
        --gradient-start: #5558ef;
        --gradient-mid: #7c3aed;
        --gradient-end: #ec4899;

        --bg: #fafafa;
        --card-bg: #ffffff;
        --border: #ececec;
        --border-strong: #d4d4d8;
        --text: #18181b;
        --text-muted: #71717a;
        --text-soft: #52525b;
        --code-bg: #fafafa;
        --status-bg: #fef3c7;
        --status-fg: #92400e;
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 10px 24px -8px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 20px 40px -12px rgba(0, 0, 0, 0.18);

        --serif: 'Fraunces', Georgia, serif;
        --display: 'Space Grotesk', 'Open Sans', sans-serif;
        --body: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        --mono: 'SF Mono', Menlo, Consolas, monospace;
      }

      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }

      body {
        font-family: var(--body);
        background:
          radial-gradient(circle at top right, var(--accent-glow), transparent 45%),
          radial-gradient(circle at 0% 80%, rgba(236, 72, 153, 0.06), transparent 40%),
          var(--bg);
        background-attachment: fixed;
        color: var(--text);
        min-height: 100vh;
      }

      .page-header { position: relative; padding: 56px 32px 48px; overflow: hidden; }
      .page-header::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.10) 0%, rgba(139, 92, 246, 0.06) 50%, rgba(236, 72, 153, 0.04) 100%);
        pointer-events: none;
      }
      .page-header::after {
        content: ''; position: absolute; right: -120px; top: -120px;
        width: 360px; height: 360px; border-radius: 50%;
        background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
        opacity: 0.18; filter: blur(80px); pointer-events: none;
        animation: float 14s ease-in-out infinite;
      }
      @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-30px, 20px) scale(1.1); } }

      .header-inner { max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }

      .product-tag {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        color: var(--accent-deep); font-family: var(--display);
        font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;
        padding: 6px 14px; border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); margin-bottom: 18px;
      }
      .product-tag .emoji { font-size: 14px; line-height: 1; }

      .page-title {
        font-family: var(--serif); font-size: clamp(40px, 6vw, 64px); font-weight: 900;
        margin: 0 0 12px; line-height: 1.0; letter-spacing: -0.02em; font-variation-settings: "opsz" 96;
      }
      .page-title em {
        font-style: italic; font-weight: 700;
        background: linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        font-variation-settings: "opsz" 144;
      }
      .page-subtitle { font-size: 14px; color: var(--text-soft); margin: 0; max-width: none; line-height: 1.5; white-space: nowrap; }

      .meta-bar {
        margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center;
        font-size: 13px; color: var(--text-muted); font-family: var(--display); font-weight: 500;
      }
      .meta-bar .dot-sep { opacity: 0.4; }
      .live-indicator { display: inline-flex; align-items: center; gap: 6px; }
      .live-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #10b981;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); animation: live-pulse 2s ease-in-out infinite;
      }
      @keyframes live-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); } }

      .content { max-width: 1400px; margin: 0 auto; padding: 0 32px 64px; }

      .state { text-align: center; padding: 64px 24px; color: var(--text-muted); }
      .state h3 { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--text); margin: 16px 0 8px; }
      .state p { margin: 0 auto; max-width: 380px; font-size: 14px; line-height: 1.55; }
      .state .retry {
        margin-top: 16px; font-family: var(--display); font-weight: 600;
        background: var(--accent); color: #fff; border: none; padding: 10px 20px;
        border-radius: 8px; cursor: pointer; transition: background 0.15s ease, transform 0.15s ease;
      }
      .state .retry:hover { background: var(--accent-deep); transform: translateY(-1px); }
      .spinner {
        width: 44px; height: 44px; border: 3px solid var(--accent-soft); border-top-color: var(--accent);
        border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .state i.fa-solid { font-size: 38px; color: var(--accent); opacity: 0.7; }

      .section { margin-top: 40px; }
      .section:first-of-type { margin-top: 8px; }
      .section-header {
        display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px;
        padding-bottom: 10px; border-bottom: 1px solid var(--border);
      }
      .section-title {
        font-family: var(--serif); font-size: 24px; font-weight: 700; font-style: italic;
        margin: 0; color: var(--text); letter-spacing: -0.01em;
      }
      .section-count {
        font-family: var(--display); font-size: 12px; font-weight: 600;
        background: var(--accent-soft); color: var(--accent-deep);
        padding: 2px 10px; border-radius: 999px;
      }

      .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px; }

      .mock-card {
        position: relative; background: var(--card-bg); border: 1px solid var(--border);
        border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
        box-shadow: var(--shadow-sm);
        transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        opacity: 0; animation: rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; overflow: hidden;
      }
      @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      .mock-card::after {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
        transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .mock-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); border-color: var(--border-strong); }
      .mock-card:hover::after { transform: scaleX(1); }

      /* Recently-changed prototypes get a subtle red outline so they're easy to
         spot in the grid — the same notification violet as the LOG dot + hot rows. */
      .mock-card--recent { border-color: #a78bfa; box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.15), var(--shadow-sm); }

      /* Card header: a badge row (status pill + Jira ticket) sits above the
         title on its own full-width row (room for long titles). */
      .card-header { display: block; }
      .card-title {
        font-family: var(--serif); font-size: 20px; font-weight: 700; margin: 0;
        line-height: 1.25; color: var(--text); letter-spacing: -0.01em;
        /* Reserve two lines so a single-line title leaves the same gap before the
           body as a two-line title — keeps the body / Pages box aligned across a
           row instead of the shorter-title cards riding up. */
        min-height: 2.5em;
      }

      /* Recency label — deliberately NOT a filled pill, so it doesn't read as a
         workflow status. Just the pulsing violet dot + uppercase text. */
      .recency-tag {
        display: inline-flex; align-items: center; gap: 5px; font-family: var(--display);
        font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        white-space: nowrap; color: #6d28d9;
      }
      .recency-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #7c3aed; flex-shrink: 0;
        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); animation: notif-pulse 2s ease-in-out infinite;
      }
      @keyframes notif-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
        50% { box-shadow: 0 0 0 4px rgba(124, 58, 237, 0); }
      }

      .ticket-badge {
        display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono);
        font-size: 10.5px; font-weight: 600; color: var(--accent-deep); background: var(--accent-soft);
        padding: 2px 8px; border-radius: 4px; letter-spacing: 0.3px; text-decoration: none;
        transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
      }
      a.ticket-badge--link { cursor: pointer; }
      a.ticket-badge--link:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
      .ticket-link-icon { font-size: 8px; opacity: 0.65; }
      a.ticket-badge--link:hover .ticket-link-icon { opacity: 1; }

      .status-badge {
        display: inline-flex; align-items: center; gap: 7px; background: var(--status-bg); color: var(--status-fg);
        padding: 5px 11px; border-radius: 999px; font-family: var(--display); font-size: 11px; font-weight: 600;
        white-space: nowrap; flex-shrink: 0;
      }
      /* Status icon (Font Awesome) — inherits the pill's text color per status. */
      .status-icon { font-size: 10px; }

      .status-badge[data-status="concept"]       { background: #e0e7ff; color: #3730a3; }
      .status-badge[data-status="in-progress"]   { background: #fef3c7; color: #92400e; }
      .status-badge[data-status="review"]        { background: #dbeafe; color: #1e40af; }
      .status-badge[data-status="ready"]         { background: #d1fae5; color: #065f46; }
      .status-badge[data-status="archived"]      { background: #f4f4f5; color: #52525b; }
      .status-badge[data-status="ready-for-dev"] { background: #cffafe; color: #155e75; }

      /* "Jira link needed" badge — shown when a mock has no ticket linked yet.
         Neutral gray, no warning icon — informational, not an alert. */
      .ticket-badge--missing {
        color: #52525b; background: #e4e4e7; font-family: var(--display);
        font-size: 10.5px; font-weight: 600; letter-spacing: 0.2px;
      }

      /* Per-card activity log — this prototype's own commit history, collapsed. */
      .card-log { margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px; }
      .card-log > summary {
        display: flex; align-items: center; gap: 8px; cursor: pointer; list-style: none;
        font-family: var(--display); font-size: 12px; font-weight: 600; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.6px; transition: color 0.15s ease;
      }
      .card-log > summary::-webkit-details-marker { display: none; }
      .card-log > summary:hover { color: var(--text); }
      .log-icon-wrap { position: relative; display: inline-flex; }
      .log-icon-wrap > i { color: var(--accent); font-size: 12px; }
      /* Violet push-notification dot on the LOG icon (no number) — signals changes
         within the last 24h. */
      .log-notif {
        position: absolute; top: -3px; right: -4px; width: 8px; height: 8px; border-radius: 50%;
        background: #7c3aed; border: 1.5px solid var(--card-bg);
        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); animation: notif-pulse 2s ease-in-out infinite;
      }
      .log-count {
        font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--accent-deep);
        background: var(--accent-soft); padding: 1px 7px; border-radius: 999px; letter-spacing: 0;
      }
      .log-chevron { margin-left: auto; transition: transform 0.2s ease; font-size: 10px; }
      .card-log[open] > summary .log-chevron { transform: rotate(90deg); }
      .log-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
      .log-item {
        display: grid; grid-template-columns: 78px 1fr; gap: 12px; padding: 6px 8px;
        border-radius: 7px; font-size: 13px; align-items: baseline; transition: background 0.12s ease;
      }
      .log-item:hover { background: var(--code-bg); }
      .log-date { font-family: var(--display); font-weight: 600; color: var(--text-muted); font-size: 11.5px; white-space: nowrap; }
      .log-summary { color: var(--text-soft); line-height: 1.45; min-width: 0; }
      /* The changes within the last 24h — emphasized with a violet bar + tint, the
         same notification violet as the LOG dot. */
      .log-item--recent {
        background: #f5f3ff;
        box-shadow: inset 3px 0 0 #7c3aed;
      }
      .log-item--recent:hover { background: #ede9fe; }
      .log-item--recent .log-date { color: #6d28d9; }
      .log-item--recent .log-summary { color: var(--text); font-weight: 600; }
      .log-more-item { margin-top: 4px; border-top: 1px dashed var(--border); padding-top: 6px; }
      .log-more-link {
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px;
        font-family: var(--display); font-size: 11.5px; font-weight: 600; text-decoration: none;
        color: var(--accent-deep); transition: background 0.12s ease, color 0.12s ease;
      }
      .log-more-link:hover { background: var(--accent-soft); color: var(--accent); }
      .log-more-link i { font-size: 9px; opacity: 0.8; }

      /* Log header row: "LOG" title + count + the always-visible Updated pill. */
      .card-log--empty { display: flex; align-items: center; gap: 8px; }
      .log-title { flex-shrink: 0; }
      /* The "Updated <time>" indicator that now lives in the log header. Reset the
         summary's uppercase transform so the timestamp reads in normal case. */
      .log-updated {
        display: inline-flex; align-items: center; gap: 6px; font-family: var(--display);
        font-size: 11px; font-weight: 500; color: var(--text-muted);
        text-transform: none; letter-spacing: 0;
      }
      .log-updated i { font-size: 10px; opacity: 0.7; }
      /* Recent (within 24h): highlighted violet pill with a pulsing dot. */
      .log-updated--recent {
        padding: 3px 10px; border-radius: 999px; background: #f5f3ff; color: #6d28d9; font-weight: 700;
      }
      /* "View full log" button inside the expanded log. */
      .log-full-btn {
        display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
        padding: 7px 14px; border: 1px solid var(--border-strong); border-radius: 8px; background: #fff;
        font-family: var(--display); font-size: 12px; font-weight: 600; color: var(--text-soft);
        text-decoration: none; cursor: pointer; transition: all 0.15s ease;
      }
      .log-full-btn:hover { border-color: var(--accent); color: var(--accent-deep); background: var(--accent-soft); }
      .log-full-btn i { font-size: 10px; opacity: 0.8; }

      .card-description {
        font-size: 13.5px; color: var(--text-soft); margin: 0; line-height: 1.55;
        /* Keep cards uniform: descriptions are meant to fit two lines; clamp as a
           safety net so a stray long one can't blow out the card, and reserve two
           lines so a one-line description still aligns the Pages box across a row. */
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        min-height: 3.1em;
      }

      .url-list {
        display: flex; flex-direction: column; gap: 8px; background: var(--code-bg);
        border: 1px solid var(--border); border-radius: 8px; padding: 10px;
      }
      .url-row { display: flex; align-items: center; gap: 8px; }
      .url-label {
        font-family: var(--display); font-size: 10px; font-weight: 700; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.7px; min-width: 70px; display: flex; align-items: center; gap: 5px;
      }
      /* .copy-btn is kept only as a fallback for any legacy markup — the current
         card uses the .url-copy click-to-copy field defined below. */
      .copy-btn {
        background: #fff; border: 1px solid var(--border-strong); border-radius: 6px; padding: 6px 12px;
        font-size: 11.5px; font-weight: 600; cursor: pointer; color: var(--text-soft);
        transition: all 0.15s ease; white-space: nowrap; font-family: var(--display);
        display: inline-flex; align-items: center; gap: 5px;
      }
      .copy-btn:hover { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-deep); transform: translateY(-1px); }
      .copy-btn.copied { background: #d1fae5; border-color: #10b981; color: #065f46; }

      /* ---- Card header: status + ticket badges above the title ------------ */
      .card-badge-row {
        display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;
      }

      /* ---- Link rows: click-to-copy field + Open button ------------------- */
      .url-list-header {
        font-family: var(--display); font-size: 10.5px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.7px; color: var(--text-muted); margin-bottom: 2px;
      }
      .url-copy {
        flex: 1; min-width: 0; position: relative; text-align: left; cursor: pointer;
        font-family: var(--mono); font-size: 11.5px; color: var(--text); background: #fff;
        border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px;
        transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
      }
      .url-copy-text { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .url-copy:hover { border-color: var(--accent); color: var(--accent); }
      .url-copy:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      /* Dark "Copy" chip, revealed over the right edge on hover / focus. */
      .url-copy-chip {
        position: absolute; top: 50%; right: 5px; transform: translateY(-50%);
        display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        background: #18181b; color: #fff; font-family: var(--display); font-size: 11px; font-weight: 600;
        padding: 4px 9px; border-radius: 6px; opacity: 0; pointer-events: none;
        transition: opacity 0.12s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
      }
      .url-copy-chip i { font-size: 10px; }
      .url-copy:hover .url-copy-chip, .url-copy:focus-visible .url-copy-chip { opacity: 1; }
      .url-copy.copied { border-color: #10b981; background: #ecfdf5; color: #065f46; }
      .url-copy.copied .url-copy-chip { opacity: 1; background: #059669; box-shadow: none; }

      .url-open {
        flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
        background: var(--accent); color: #fff; border: none; border-radius: 6px; padding: 7px 14px;
        font-family: var(--display); font-size: 12px; font-weight: 600; cursor: pointer;
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .url-open:hover { background: var(--accent-deep); transform: translateY(-1px); }
      .url-open i { font-size: 10px; transition: transform 0.2s ease; }
      .url-open:hover i { transform: translate(1px, -1px); }

      /* Ready-for-dev box: cyan tint matching the "Ready for Dev" status pill. */
      .url-list--dev { background: #ecfeff; border-color: #a5f3fc; }
      .url-list--dev .url-list-header { color: #0e7490; }
      .url-row--dev .url-label { color: #0e7490; }
      .url-row--dev .url-copy { border-color: #a5f3fc; }
      .url-row--dev .url-copy:hover { border-color: #06b6d4; color: #0e7490; }
      .url-row--dev .url-open { background: #0891b2; }
      .url-row--dev .url-open:hover { background: #0e7490; }

      /* Designer working-file box — its own separate container below the dev
         box. The drawer inside is borderless so the box provides the one frame. */
      .url-list--designer { background: #fff; }
      .url-list--designer .design-links-drawer { border: none; padding: 0; background: transparent; }

      .design-links-drawer { border: 1px dashed var(--border-strong); border-radius: 6px; padding: 2px 8px; background: #fff; }
      .design-links-drawer > summary {
        list-style: none; cursor: pointer; display: flex; align-items: center; gap: 7px; padding: 6px 2px;
        font-family: var(--display); font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.6px; color: var(--text-muted); user-select: none;
      }
      .design-links-drawer > summary::-webkit-details-marker { display: none; }
      .design-links-drawer > summary:hover { color: var(--text); }
      .drawer-note { text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--text-muted); }
      .drawer-chevron { transition: transform 0.2s ease; font-size: 10px; }
      .design-links-drawer[open] > summary .drawer-chevron { transform: rotate(90deg); }
      .drawer-rows { display: flex; flex-direction: column; gap: 8px; padding: 6px 0 8px; }

      .page-footer {
        max-width: 1400px; margin: 56px auto 0; padding: 24px 32px 32px; border-top: 1px solid var(--border);
        font-family: var(--display); font-size: 12px; color: var(--text-muted); text-align: center;
      }
      .page-footer code {
        font-family: var(--mono); background: var(--code-bg); border: 1px solid var(--border);
        padding: 1px 6px; border-radius: 4px; font-size: 11.5px;
      }

      .toolbar { max-width: 1400px; margin: -8px auto 28px; padding: 0 32px; display: flex; flex-direction: column; gap: 14px; }
      /* Row 1: search grows and pushes sort + view switcher to the right. */
      .toolbar-row { display: flex; align-items: center; gap: 14px; }
      .search-wrapper { position: relative; flex: 1 1 auto; min-width: 200px; }
      .search-wrapper i.fa-magnifying-glass {
        position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
        color: var(--text-muted); font-size: 13px; pointer-events: none;
      }
      .search-input {
        width: 100%; font-family: var(--body); font-size: 14px; padding: 11px 40px 11px 38px;
        border: 1px solid var(--border-strong); border-radius: 10px; background: #fff; color: var(--text);
        box-shadow: var(--shadow-sm); transition: border-color 0.15s ease, box-shadow 0.15s ease; -webkit-appearance: none;
      }
      .search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
      .search-input::placeholder { color: var(--text-muted); }
      .search-clear {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent;
        border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; padding: 6px 8px;
        border-radius: 6px; line-height: 1; display: none;
      }
      .search-clear:hover { background: var(--code-bg); color: var(--text); }
      .search-wrapper.has-value .search-clear { display: block; }

      .filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .filter-chip {
        font-family: var(--display); font-size: 12px; font-weight: 600; padding: 7px 13px;
        border: 1px solid var(--border-strong); background: #fff; color: var(--text-soft);
        border-radius: 999px; cursor: pointer; transition: all 0.15s ease;
        display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
      }
      .filter-chip:hover { border-color: var(--accent); color: var(--accent-deep); transform: translateY(-1px); }
      /* Empty statuses: visible for reference, but dimmed and non-interactive. */
      .filter-chip[data-empty="true"] {
        opacity: 0.5; cursor: default; border-style: dashed; background: transparent;
      }
      .filter-chip[data-empty="true"]:hover { border-color: var(--border-strong); color: var(--text-soft); transform: none; }
      .filter-chip[data-empty="true"] .chip-dot { opacity: 0.5; }
      .filter-chip .chip-count {
        font-size: 11px; font-weight: 700; color: var(--text-muted); background: var(--code-bg);
        padding: 1px 7px; border-radius: 999px; min-width: 22px; text-align: center;
      }
      .filter-chip[data-active="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-deep); box-shadow: 0 2px 6px var(--accent-glow); }
      .filter-chip[data-active="true"] .chip-count { background: rgba(255, 255, 255, 0.6); color: var(--accent-deep); }

      .filter-chip[data-status="concept"][data-active="true"]     { border-color: #6366f1; background: #e0e7ff; color: #3730a3; }
      .filter-chip[data-status="in-progress"][data-active="true"] { border-color: #f59e0b; background: #fef3c7; color: #92400e; }
      .filter-chip[data-status="review"][data-active="true"]      { border-color: #3b82f6; background: #dbeafe; color: #1e40af; }
      .filter-chip[data-status="ready"][data-active="true"]       { border-color: #10b981; background: #d1fae5; color: #065f46; }
      .filter-chip[data-status="archived"][data-active="true"]    { border-color: #a1a1aa; background: #f4f4f5; color: #52525b; }
      .filter-chip[data-status="ready-for-dev"][data-active="true"] { border-color: #06b6d4; background: #cffafe; color: #155e75; }

      .filter-chip .chip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); }
      .filter-chip[data-status="concept"] .chip-dot     { background: #6366f1; }
      .filter-chip[data-status="in-progress"] .chip-dot { background: #f59e0b; }
      .filter-chip[data-status="review"] .chip-dot      { background: #3b82f6; }
      .filter-chip[data-status="ready"] .chip-dot       { background: #10b981; }
      .filter-chip[data-status="archived"] .chip-dot    { background: #a1a1aa; }
      .filter-chip[data-status="ready-for-dev"] .chip-dot { background: #06b6d4; }

      /* View switcher — icon buttons that flip between the card and list layouts. */
      /* Sort dropdown — sits with the view switcher on the right of the toolbar. */
      .sort-control {
        display: inline-flex; align-items: center; gap: 7px; margin-left: auto;
        background: var(--card-bg); border: 1px solid var(--border-strong);
        border-radius: 9px; padding: 4px 10px; height: 34px;
      }
      .sort-icon { color: var(--text-muted); font-size: 12px; }
      .sort-label {
        font-family: var(--display); font-size: 12px; font-weight: 600; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .sort-select {
        border: none; background: none; font-family: var(--display); font-size: 13px;
        font-weight: 600; color: var(--text); cursor: pointer; outline: none;
        padding-right: 2px; max-width: 160px;
      }
      .sort-select:focus-visible { outline: 2px solid var(--accent); border-radius: 4px; }

      .view-switcher {
        display: inline-flex; background: var(--card-bg);
        border: 1px solid var(--border-strong); border-radius: 9px; padding: 2px; gap: 2px;
      }
      .view-toggle {
        display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 30px;
        border: none; background: none; border-radius: 7px; cursor: pointer; color: var(--text-muted);
        font-size: 14px; transition: background 0.15s ease, color 0.15s ease;
      }
      .view-toggle:hover { color: var(--accent-deep); background: var(--accent-soft); }
      .view-toggle.is-active { background: var(--accent); color: #fff; }
      .view-toggle.is-active:hover { background: var(--accent); color: #fff; }

      /* List view — compact table mirroring the top-level product index. */
      .proto-table-wrap {
        background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
        overflow: hidden; box-shadow: var(--shadow-sm); margin-top: 8px;
      }
      .proto-table { width: 100%; border-collapse: collapse; }
      .proto-table thead th {
        text-align: left; font-family: var(--display); font-size: 11px; font-weight: 700;
        color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;
        padding: 12px 18px; background: var(--code-bg); border-bottom: 1px solid var(--border);
      }
      .proto-table th.col-status { width: 150px; }
      .proto-table th.col-jira { width: 170px; }
      .proto-table th.col-date { width: 190px; }
      .proto-table tbody tr.proto-row { border-top: 1px solid var(--border); transition: background 0.1s ease; }
      .proto-table tbody tr.proto-row:first-child { border-top: none; }
      .proto-table tbody tr.proto-row:hover { background: var(--accent-soft); }
      .proto-table td { padding: 11px 18px; font-size: 13.5px; vertical-align: middle; }
      .proto-name {
        display: inline-flex; align-items: center; gap: 9px; color: var(--text);
        text-decoration: none; font-family: var(--display); font-weight: 600;
      }
      .proto-name .file-icon { color: var(--text-muted); font-size: 13px; }
      .proto-row:hover .proto-name { color: var(--accent-deep); }
      .proto-row:hover .proto-name .file-icon { color: var(--accent); }
      .proto-name .ext-icon { color: var(--text-muted); font-size: 10px; opacity: 0; transition: opacity 0.1s ease; }
      .proto-row:hover .proto-name .ext-icon { opacity: 1; color: var(--accent); }
      .proto-dev-tag {
        font-family: var(--display); font-size: 9.5px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.5px; color: #155e75; background: #cffafe; padding: 1px 6px; border-radius: 4px;
      }
      .jira-plain {
        font-family: var(--mono); font-size: 12px; color: var(--accent-deep); text-decoration: none;
      }
      a.jira-plain:hover { text-decoration: underline; }
      .date-cell { color: var(--text-muted); font-family: var(--display); font-size: 12.5px; white-space: nowrap; }

      .no-results { text-align: center; padding: 56px 24px; color: var(--text-muted); }
      .no-results h3 { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
      .no-results p { margin: 0 auto 18px; max-width: 360px; font-size: 14px; line-height: 1.55; }
      .no-results i.fa-magnifying-glass { font-size: 32px; color: var(--accent); opacity: 0.6; }
      .no-results .clear-filters-btn {
        font-family: var(--display); font-size: 13px; font-weight: 600; padding: 9px 18px;
        border: 1px solid var(--accent); background: #fff; color: var(--accent-deep); border-radius: 8px;
        cursor: pointer; transition: background 0.15s ease;
      }
      .no-results .clear-filters-btn:hover { background: var(--accent-soft); }

      .section-header .status-badge { padding: 4px 12px; }
      .section-header .status-badge .status-icon { font-size: 9px; }
  `;

  // Kick off — STYLES is now defined, so injectHead() inside boot() is safe.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
