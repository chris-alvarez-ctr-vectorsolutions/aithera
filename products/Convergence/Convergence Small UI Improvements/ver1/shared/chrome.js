/* ===========================================================================
   Convergence Small UI Improvements - app shell
   ---------------------------------------------------------------------------
   Injects the redesigned chrome (Area 1 side nav, Area 2 top nav + location
   picker + page header) and the container markup for the four page views.

   Every page in this folder loads the same shell, so a chrome change is made
   once here rather than mirrored across the page files. Load order:
     shared/data.js -> shared/chrome.js -> shared/views.js -> shared/app.js
   ======================================================================== */
(function () {
  const SHELL = `
<div class="app" id="app">

  <!-- ======================= AREA 2 - TOP NAV ======================= -->
  <header class="topnav">
    <button class="nav-burger" id="burger" aria-label="Toggle navigation"><i class="fa-solid fa-bars"></i></button>

    <a class="brand" href="#" onclick="return false">
      <span class="brand-mark"><i class="fa-solid fa-arrows-to-dot"></i></span>
      <span class="brand-text">
        <span class="brand-name">Vector Solutions</span>
        <span class="brand-sub">Convergence LMS</span>
      </span>
    </a>

    <!-- Location picker, relocated out of the dark breadcrumb bar -->
    <button class="loc-trigger" id="locTrigger" aria-expanded="false" aria-haspopup="dialog">
      <i class="fa-solid fa-location-dot loc-pin"></i>
      <span class="loc-copy">
        <span class="loc-name" id="locName">UAT Environment</span>
        <span class="loc-path" id="locPath">Working location</span>
      </span>
      <span class="loc-away"><i class="fa-solid fa-circle-exclamation"></i> Away</span>
      <i class="fa-solid fa-chevron-down loc-caret"></i>
    </button>

    <div class="grow"></div>

    <nav class="tabs" id="tabs" aria-label="Primary">
      <button class="tab" data-route="home">Home</button>
      <button class="tab" data-route="training">Training</button>
      <button class="tab" data-route="catalog">Catalog</button>
      <button class="tab" data-route="insights">Insights <span class="beta">Beta</span></button>
      <button class="tab active" data-route="admin">Administration</button>
    </nav>

    <div class="nav-icons">
      <button class="icon-btn" title="Language"><i class="fa-solid fa-globe"></i></button>
      <button class="icon-btn" title="My account"><i class="fa-solid fa-user"></i></button>
      <button class="icon-btn" title="Sign out"><i class="fa-solid fa-right-from-bracket"></i></button>
    </div>
  </header>

  <div class="app-body">

    <!-- ======================= AREA 1 - SIDE NAV ======================= -->
    <aside class="sidenav" id="sidenav" aria-label="Administration">
      <div class="sn-head">
        <button class="icon-btn" id="navCollapse" title="Collapse navigation" aria-expanded="true"><i class="fa-solid fa-bars"></i></button>
        <div class="sn-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="navSearch" placeholder="Search navigation" aria-label="Search navigation">
        </div>
      </div>
      <div class="sn-list" id="navList"></div>
    </aside>

    <main class="main">

      <!-- ============ AREA 2 - PAGE HEADER (replaces the dark bar) ============ -->
      <div class="pagebar">
        <div>
          <div class="crumbs" id="crumbs"></div>
          <h1 class="page-title" id="pageTitle">Administration dashboard</h1>
        </div>

        <div class="pagebar-actions">
          <!-- Home -->
          <div class="action-group" data-for="home">
            <vaadin-button theme="secondary" class="btn-compact"><i class="fa-solid fa-rotate-right" style="margin-right:6px"></i>Refresh</vaadin-button>
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
          </div>
          <!-- Training -->
          <div class="action-group" data-for="training">
            <div class="searchbox"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search my training" aria-label="Search my training"></div>
            <div class="segmented" id="viewToggle" role="group" aria-label="View">
              <button data-view="list" aria-pressed="true" title="List view"><i class="fa-solid fa-list"></i></button>
              <button data-view="dense" aria-pressed="false" title="Compact cards"><i class="fa-solid fa-grip"></i></button>
              <button data-view="large" aria-pressed="false" title="Large cards"><i class="fa-solid fa-table-cells-large"></i></button>
            </div>
            <vaadin-button theme="secondary" class="btn-compact"><i class="fa-solid fa-rotate-right" style="margin-right:6px"></i>Refresh</vaadin-button>
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
          </div>
          <!-- Catalog -->
          <div class="action-group" data-for="catalog">
            <div class="searchbox"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search the catalog" aria-label="Search the catalog"></div>
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
            <vaadin-button theme="secondary" class="btn-compact"><i class="fa-solid fa-xmark" style="margin-right:6px"></i>Close</vaadin-button>
          </div>
          <!-- Wizard -->
          <div class="action-group" data-for="wizard">
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
          </div>
          <!-- Guide -->
          <div class="action-group" data-for="guide">
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
          </div>
        </div>
      </div>

      <div class="canvas" id="canvas">

        <!-- ===================== REVIEW GUIDE ===================== -->
        <section class="view" id="view-guide">
          <div class="view-scroll">
            <div class="guide">
              <p class="guide-lede">
                A styling pass across seven areas of Convergence. Type hierarchy, spacing, alignment,
                colour, borders, radius, shadow and interaction states are driven by one shared token
                set, so every area inherits the same visual language. Use the top nav and the side nav
                to move between the areas, exactly as a user would.
              </p>

              <div class="guide-grid">
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">1</span><h3>Side navigation</h3></div>
                  <p>Heavy row dividers removed, 40px rows, one selection language at every depth, carets tied to their labels, normalised icons and light section headers. The collapsed icon-only state is preserved.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="collapseDemo()">Toggle collapsed state</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">2</span><h3>Location picker in the top nav</h3></div>
                  <p>The bordered Location pin button becomes a top-nav dropdown that opens the location tree. The dark breadcrumb bar is replaced by a light page header carrying the breadcrumb, page title and page actions.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="openLoc()">Open the location tree</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">3</span><h3>Training plan accordion</h3></div>
                  <p>Four readable depth levels, a progress meter that replaces the empty capsule and its caption, standardised status pills, a shared column grid and one light row rhythm. Includes the left filter panel.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="go('training','list')">Open the list view</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">4</span><h3>Training plan card view</h3></div>
                  <p>One card component in two densities: a responsive grid with consistent gutters, a fixed 16:9 thumbnail, badge and duration placement, title truncation, and the same pills and buttons as the list view.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="go('training','large')">Open the card view</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">5</span><h3>Catalog table</h3></div>
                  <p>A proper 24px left gutter, one 56px row rhythm, a clearer header, standardised mobile yes and no glyphs, and columns aligned by intent with Name given priority width.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="go('catalog')">Open the catalog</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">6</span><h3>Content wizard</h3></div>
                  <p>The gray monitor frame is flattened into one centred panel used identically on all four steps, with equal selectable tiles, a labelled stepper, unified headings and standardised footer controls.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="go('wizard',1)">Open the wizard</vaadin-button></div>
                </div>
                <div class="panel guide-card">
                  <div class="guide-top"><span class="guide-num">7</span><h3>Home dashboard</h3></div>
                  <p>The legacy Home page restyled: one ring geometry and one arc colour for all three progress stats, a dashed neutral ring instead of 100% in orange for an empty list, the shared primary Launch button, a neutral empty state instead of the red error block, and card footers that cannot overlap the content.</p>
                  <div><vaadin-button theme="tertiary" class="btn-compact" onclick="go('home')">Open the home page</vaadin-button></div>
                </div>
              </div>

              <div class="panel tokens">
                <h3>Shared tokens applied across all seven areas</h3>
                <div class="token-row">
                  <span class="cap">Type scale</span>
                  <div class="type-sample">
                    <span style="font-size:var(--t-page);font-weight:600;color:var(--c-ink)">Page title, 20 / 600</span>
                    <span style="font-size:var(--t-section);font-weight:600;color:var(--c-ink)">Section header, 14 / 600</span>
                    <span style="font-size:var(--t-row);font-weight:500;color:var(--c-body)">Row label, 13.5 / 500</span>
                    <span style="font-size:var(--t-meta);color:var(--c-meta)">Secondary and meta, 12.5 / 400</span>
                  </div>
                </div>
                <div class="fp-divider"></div>
                <div class="token-row">
                  <span class="cap">Status pills</span>
                  <span class="pill pill-progress">In progress</span>
                  <span class="pill pill-incomplete">Incomplete</span>
                  <span class="pill pill-overdue">Overdue</span>
                  <span class="pill pill-complete">Complete</span>
                  <span class="pill pill-new no-dot">New</span>
                </div>
                <div class="token-row">
                  <span class="cap">Buttons</span>
                  <vaadin-button theme="primary" class="btn-compact">Primary</vaadin-button>
                  <vaadin-button theme="secondary" class="btn-compact">Secondary</vaadin-button>
                  <vaadin-button theme="tertiary" class="btn-compact">Tertiary</vaadin-button>
                  <vaadin-button theme="primary" class="btn-compact" disabled>Disabled</vaadin-button>
                </div>
                <div class="token-row">
                  <span class="cap">Colour</span>
                  <span class="swatch"><b style="background:var(--c-primary)"></b>Action</span>
                  <span class="swatch"><b style="background:var(--c-primary-soft)"></b>Selected</span>
                  <span class="swatch"><b style="background:var(--c-warn-dot)"></b>In progress</span>
                  <span class="swatch"><b style="background:var(--c-idle-dot)"></b>Incomplete</span>
                  <span class="swatch"><b style="background:var(--c-err-dot)"></b>Overdue</span>
                  <span class="swatch"><b style="background:var(--c-canvas)"></b>Canvas</span>
                </div>
                <div class="token-row">
                  <span class="cap">Spacing</span>
                  <span class="swatch">4 · 8 · 12 · 16 · 20 · 24 · 32 · 40</span>
                  <span class="cap" style="width:auto;margin-left:16px">Radius</span>
                  <span class="swatch">4 · 6 · 8 · 12 · pill</span>
                </div>
                <div class="token-row">
                  <span class="cap">Progress</span>
                  <span class="meter"><span class="meter-track"><span class="meter-fill" style="width:40%"></span></span><span class="meter-label"><strong>2 of 5</strong> <span class="meter-unit">qualifications</span></span></span>
                </div>
                <div class="token-row">
                  <span class="cap">Inline notice</span>
                  <span class="notice"><i class="fa-solid fa-circle-info"></i><span class="notice-text">Complete any 2 of the activities below.</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================== AREA 7 - HOME ================== -->
        <section class="view" id="view-home">
          <div class="view-scroll">
            <div class="dash">

              <section class="panel dash-progress">
                <header class="card-head">
                  <h2 class="card-title"><i class="fa-solid fa-chart-pie"></i>My overall progress</h2>
                </header>
                <div class="stat-row" id="homeProgress"></div>
              </section>

              <section class="panel dash-upcoming">
                <header class="card-head">
                  <h2 class="card-title"><i class="fa-solid fa-graduation-cap"></i>Upcoming training</h2>
                </header>
                <div class="card-body flush" id="homeUpcoming"></div>
                <footer class="card-foot">
                  <vaadin-button theme="tertiary" class="btn-compact">View all training</vaadin-button>
                </footer>
              </section>

              <section class="panel dash-classes">
                <header class="card-head">
                  <h2 class="card-title"><i class="fa-solid fa-calendar-days"></i>Upcoming classes</h2>
                </header>
                <div class="card-body flush" id="homeClasses"></div>
              </section>

              <section class="panel dash-news">
                <header class="card-head">
                  <h2 class="card-title"><i class="fa-regular fa-newspaper"></i>News feed</h2>
                </header>
                <div class="card-body flush" id="homeNews"></div>
                <footer class="card-foot">
                  <vaadin-button theme="tertiary" class="btn-compact">View all news</vaadin-button>
                </footer>
              </section>

            </div>
          </div>
        </section>

        <!-- ============== AREAS 3 + 4 - MY TRAINING ============== -->
        <section class="view" id="view-training">
          <aside class="filter-panel" id="filterPanel">
            <div class="fp-head">
              <button class="icon-btn" id="filterToggle" aria-pressed="false" aria-controls="fpBody"
                      title="Show filters"><i class="fa-solid fa-filter"></i></button>
              <span class="fp-head-label">Filters</span>
            </div>
            <div class="fp-body" id="fpBody">
            <div>
              <p class="fp-title">View by</p>
              <div class="fp-list" id="fpViews"></div>
            </div>
            <div class="fp-divider"></div>
            <div class="fp-group">
              <p class="fp-title" style="margin:0">Filter</p>
              <vaadin-combo-box theme="outlined" id="fType" label="Type" placeholder="All types"></vaadin-combo-box>
              <vaadin-combo-box theme="outlined" id="fStatus" label="Status" placeholder="All statuses"></vaadin-combo-box>
            </div>
            <div class="fp-divider"></div>
            <div class="fp-group">
              <p class="fp-title" style="margin:0">Layout</p>
              <div class="fp-row">
                <div class="segmented" id="viewToggle2" role="group" aria-label="View">
                  <button data-view="list" aria-pressed="true" title="List view"><i class="fa-solid fa-list"></i></button>
                  <button data-view="dense" aria-pressed="false" title="Compact cards"><i class="fa-solid fa-grip"></i></button>
                  <button data-view="large" aria-pressed="false" title="Large cards"><i class="fa-solid fa-table-cells-large"></i></button>
                </div>
                <button class="icon-btn bordered" title="Show hierarchy"><i class="fa-solid fa-sitemap"></i></button>
                <button class="icon-btn bordered" title="Favourites only"><i class="fa-regular fa-star"></i></button>
              </div>
              <vaadin-button theme="secondary" class="btn-compact" style="width:100%">
                <i class="fa-solid fa-floppy-disk" style="margin-right:6px"></i>Set as default
              </vaadin-button>
            </div>
            </div>
          </aside>

          <div class="view-scroll" id="trainingScroll">
            <div class="panel tp" id="tp"></div>
          </div>
        </section>

        <!-- ================== AREA 5 - CATALOG ================== -->
        <section class="view" id="view-catalog">
          <div class="view-scroll">
            <div class="panel">
              <table class="cat-table" id="catTable"></table>
            </div>
          </div>
        </section>

        <!-- ================ AREA 6 - CONTENT WIZARD ================ -->
        <section class="view" id="view-wizard">
          <div class="view-scroll wz-scroll">
            <div class="panel wz-card">
              <div class="wz-steps">
                <vwc-stepper id="wzStepper" static>
                  <vwc-stepper-step slot="step" id="s1">Add content</vwc-stepper-step>
                  <vwc-stepper-step slot="step" id="s2">Content type</vwc-stepper-step>
                  <vwc-stepper-step slot="step" id="s3">Save location</vwc-stepper-step>
                  <vwc-stepper-step slot="step" id="s4">Properties</vwc-stepper-step>
                </vwc-stepper>
              </div>
              <div class="wz-body" id="wzBody"></div>
              <div class="wz-foot" id="wzFoot"></div>
            </div>
          </div>
        </section>

      </div>
    </main>
  </div>
</div>

<!-- Location dropdown: the existing nest / tree view, restyled as a top-nav panel -->
<div class="loc-backdrop" id="locBackdrop"></div>
<div class="loc-panel" id="locPanel" role="dialog" aria-label="Change working location">
  <div class="loc-panel-head">
    <h2 class="loc-panel-title">Change working location</h2>
    <vaadin-text-field theme="outlined" id="locSearch" placeholder="Search locations" style="width:100%" clear-button-visible>
      <i class="fa-solid fa-magnifying-glass" slot="prefix" style="font-size:12px;color:#98a2b3"></i>
    </vaadin-text-field>
  </div>
  <div class="loc-panel-tree">
    <vwc-tree-list id="locTree"></vwc-tree-list>
  </div>
  <div class="loc-panel-foot">
    <span class="loc-viewing"><span class="dot-ok"></span>Viewing <strong id="locFoot">UAT Environment</strong></span>
    <vaadin-button theme="tertiary" class="btn-compact" id="locHome">
      <i class="fa-solid fa-house" style="margin-right:6px"></i>Return to home
    </vaadin-button>
  </div>
</div>
`;
  document.body.insertAdjacentHTML('afterbegin', SHELL);
})();
