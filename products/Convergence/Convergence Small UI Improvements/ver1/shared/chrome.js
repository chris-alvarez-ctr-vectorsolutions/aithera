/* ---------------------------------------------------------------------------
   CSS spec strips: the key CSS values for each screen, as a collapsed
   one-line <details> at the foot of the view. Dev reference, not product UI.
   Values mirror shared/styles.css; update BOTH when a value changes.
   ------------------------------------------------------------------------ */
const SPEC_NOTE = 'Dev reference (not product UI). Tokens: shared/styles.css §1 · type 22/18/16/14/12 · spacing 4-40 · radius 4/6/8/12/pill.';
function specHTML(rows) {
  return `<details class="spec">
    <summary><i class="fa-solid fa-chevron-right caret" aria-hidden="true"></i><i class="fa-solid fa-code" aria-hidden="true"></i>CSS spec for this screen</summary>
    <div class="spec-body">
      <div class="spec-grid">${rows.map(r => `<div class="spec-row"><span class="spec-k">${r[0]}</span><span class="spec-v">${r[1]}</span></div>`).join('')}</div>
      <p class="spec-note">${SPEC_NOTE}</p>
    </div>
  </details>`;
}
const SPECS = {
  guide: specHTML([
    ['Top nav height', '60px (--h-topnav)'],
    ['Page header', 'min 72px · title 22/600 · crumb 14'],
    ['Side nav width', '268px open · 58px rail'],
    ['Nav rows', 'min 44px parent · 38px child · radius 6'],
    ['Nav selected', '3px left rail + --c-primary-soft'],
    ['Nav icon column', '20px · 15px glyph · label clamp 2'],
    ['Location panel', '380px · radius 12 · --e-3'],
    ['Fin launcher', '30x30 · radius 15 0 0 15 · gutter 40px'],
  ]),
  home: specHTML([
    ['Dashboard grid', '12 cols · 24px gutters · spans 8+4, 4+8'],
    ['Card header', 'pad 16 20 · title 18/600 · icon --c-primary'],
    ['Card footer', 'pad 8 16 on --c-surface-alt'],
    ['Progress ring', '132px · stroke 12 · fill --c-primary'],
    ['Ring caption', 'count 14 · bold remainder on line 2'],
    ['Upcoming rows', 'min 52px · header 14/600 on --c-surface-alt'],
    ['News feed', 'date 12 · title 16/600 · excerpt 14 clamp 2'],
    ['Empty state', 'icon 44px circle · title 16/600 · body 14'],
  ]),
  training: specHTML([
    ['List columns', 'minmax(0,1fr) 248 96 96 108 84 · gap 12'],
    ['Depth indents', '16 / 32 / 40 / 56px'],
    ['Depth bands', '--c-surface-alt2 · -alt · #fbfcfe · --c-surface'],
    ['Activity rows', 'min 52px · hairline --c-line-soft'],
    ['Status pills', 'h 24 · text 12/600 · status tokens'],
    ['Progress meter', 'bar 72x6 · label 14'],
    ['Banners', 'pad 8 8 8 16 · radius 8 · stack gap 12 · max 3'],
    ['Cards (small)', 'tracks 184-224 · title 14/600'],
    ['Cards (large)', 'tracks 256-312 · title 16/600'],
    ['Card grid', 'gap 16 · thumb 16:9 · shadow --e-xs, no border'],
    ['Card badges', 'status top-left · duration bottom-right'],
    ['Row actions', 'info leftmost · icon-btn 34 · column 84'],
    ['Elective marker', '20px E tag inline · hidden until toggled'],
    ['Panel toggles', 'chevrons-up/down = all · square-star = electives'],
  ]),
  details: specHTML([
    ['Hero thumbnail', '232px wide · 16:9 · radius 8'],
    ['Kind chip', 'text 12/600 on --c-primary-soft'],
    ['Title', '20/600 · meta row 14'],
    ['Child rows', 'minmax(0,1fr) 168 84 100 22 · min 52px'],
    ['Nested indent', '+28px on activity rows'],
    ['Completions table', 'cols 130 90 120 1fr · rows min 40'],
    ['Back control', '16/500 --c-primary · hover soft fill'],
    ['Section titles', '18/600 · body pad 20'],
  ]),
  catalog: specHTML([
    ['Category module', 'pad 20 · radius 12 · --e-1 · gap 24'],
    ['Module header', 'title 18/600 · View all 14/600'],
    ['Arrow controls', '36px circles · border --c-line · top right'],
    ['Cards', '.tcard 208 wide · strip gap 16 · title clamp 2'],
    ['Elective tag', '22px square · radius 4 · --c-ink · top right'],
    ['Assigned badge', 'solid --c-ok-ink · white 12/600 · top left'],
    ['Table rows', '56px · edge cells pad 24'],
    ['Table header', '14/600 on --c-surface-alt · sticky'],
  ]),
  wizard: specHTML([
    ['Panel', 'max 780px · radius 12 · --e-1'],
    ['Stepper circles', '34px · border 1.5 · line 1.5'],
    ['Stepper states', 'active --c-primary · complete --c-ok-dot'],
    ['Tiles', 'radius 12 · icon 46px sq radius 8'],
    ['Tile selected', '--c-primary border + soft fill + check'],
    ['Body / footer', 'pad 24 24 32 · footer 16 24 on --c-surface-alt'],
    ['Form', 'max 480px · field gap 20 · label 16/600'],
    ['Required mark', '* in --c-err-ink'],
  ]),
};

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
      <button class="icon-btn" title="Language" aria-label="Language"><i class="fa-solid fa-globe" aria-hidden="true"></i></button>
      <button class="icon-btn" title="My account" aria-label="My account"><i class="fa-solid fa-user" aria-hidden="true"></i></button>
      <button class="icon-btn" title="Sign out" aria-label="Sign out"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></button>
    </div>
  </header>

  <div class="app-body">

    <!-- ======================= AREA 1 - SIDE NAV ======================= -->
    <aside class="sidenav" id="sidenav" aria-label="Administration">
      <div class="sn-head">
        <button class="icon-btn" id="navCollapse" title="Collapse navigation" aria-label="Collapse navigation" aria-expanded="true"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
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
          <!-- Details drill-in -->
          <div class="action-group" data-for="details">
            <vaadin-button theme="tertiary" class="btn-compact"><i class="fa-regular fa-circle-question" style="margin-right:6px"></i>Help</vaadin-button>
            <vaadin-button theme="secondary" class="btn-compact" id="detailsClose"><i class="fa-solid fa-xmark" style="margin-right:6px"></i>Close</vaadin-button>
          </div>
          <!-- Catalog -->
          <div class="action-group" data-for="catalog">
            <div class="searchbox"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search the catalog" aria-label="Search the catalog"></div>
            <div class="segmented" id="catViewToggle" role="group" aria-label="Catalog view">
              <button data-cview="cards" aria-pressed="true" title="Category cards"><i class="fa-solid fa-grip"></i></button>
              <button data-cview="table" aria-pressed="false" title="Table view"><i class="fa-solid fa-list"></i></button>
            </div>
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
            ${SPECS.guide}
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

            ${SPECS.home}
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
                <button class="icon-btn bordered" id="fpToggleAll" title="Collapse all" aria-label="Collapse all"
                        aria-pressed="false"><i class="fa-solid fa-chevrons-up" aria-hidden="true"></i></button>
                <button class="icon-btn bordered" id="fpElectives" title="Show electives" aria-label="Show electives"
                        aria-pressed="false"><i class="fa-solid fa-square-star" aria-hidden="true"></i></button>
              </div>
              <vaadin-button theme="secondary" class="btn-compact" style="width:100%">
                <i class="fa-solid fa-floppy-disk" style="margin-right:6px"></i>Set as default
              </vaadin-button>
            </div>
            </div>
          </aside>

          <div class="view-scroll" id="trainingScroll">
            <!-- Up to three stacked, dismissible notices. Rendered by
                 renderBanners() in views.js; variants share one construction. -->
            <div class="banner-stack" id="tpBanners"></div>
            <div class="panel tp" id="tp"></div>
            ${SPECS.training}
          </div>
        </section>

        <!-- ========= AREA 3 DETAILS - activity / requirement / qualification ========= -->
        <section class="view" id="view-details">
          <div class="view-scroll">
            <div class="details" id="detailsRoot"></div>
            ${SPECS.details}
          </div>
        </section>

        <!-- ================== AREA 5 - CATALOG ================== -->
        <section class="view" id="view-catalog">
          <div class="view-scroll">
            <!-- Round 2: the category-carousel card view is additive; the table
                 stays intact and View all opens it filtered to the category. -->
            <div id="catCards" class="cat-cats" hidden></div>
            <div class="panel" id="catTableWrap" hidden>
              <table class="cat-table" id="catTable"></table>
            </div>
            ${SPECS.catalog}
          </div>
        </section>

        <!-- ================ AREA 6 - CONTENT WIZARD ================ -->
        <section class="view" id="view-wizard">
          <div class="view-scroll wz-scroll">
            <div class="panel wz-card">
              <!-- Same stepper construction as the Assign Training Wizard -->
              <div class="wz-steps">
                <div class="stepper" id="wzStepper">
                  <div class="step"><div class="step-row"><div class="step-line left"></div><div class="step-circle">1</div><div class="step-line right"></div></div><div class="step-label">Add content</div></div>
                  <div class="step"><div class="step-row"><div class="step-line left"></div><div class="step-circle">2</div><div class="step-line right"></div></div><div class="step-label">Content type</div></div>
                  <div class="step"><div class="step-row"><div class="step-line left"></div><div class="step-circle">3</div><div class="step-line right"></div></div><div class="step-label">Save location</div></div>
                  <div class="step"><div class="step-row"><div class="step-line left"></div><div class="step-circle">4</div><div class="step-line right"></div></div><div class="step-label">Properties</div></div>
                </div>
              </div>
              <div class="wz-body" id="wzBody"></div>
              <div class="wz-foot" id="wzFoot"></div>
            </div>
            ${SPECS.wizard}
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

/* ============================================================================
   FIN LAUNCHER (Vectoria) - shared rollout include, docked presentation
   ----------------------------------------------------------------------------
   Loads the shared products/Convergence/ai-chat-widget/fin-widget.js (the
   Fin rollout include: launcher + Vectoria chat window + unread badge), then
   overrides ONLY its presentation for this prototype, per designer spec:

     - docked flush to the RIGHT EDGE of the screen (not a corner FAB)
     - 30 x 30px, 15px corner radius (left corners; the right side is flush)
     - draggable up and down the edge (pointer drag; arrow keys when focused;
       the position persists locally)
     - unread badge sits top-LEFT, since the right side is off-screen
     - the chat window opens beside the launcher, vertically near it
     - main scroll areas keep a --fin-gutter right lane so content never
       sits under the launcher (the rollout's gutter contract)

   The shared widget file is untouched: other consumers keep the corner FAB.
   ============================================================================ */
(function () {
  const loader = document.createElement('script');
  loader.src = '../../ai-chat-widget/fin-widget.js';
  loader.onload = dock;
  document.body.appendChild(loader);

  function dock() {
    const rootEl = document.getElementById('fin-root');
    if (!rootEl) return;
    const fab = rootEl.querySelector('.fin-fab');
    const win = rootEl.querySelector('.fin-window');

    /* Presentation overrides. Injected after the widget's own style tag so
       equal-specificity rules win without !important. */
    const st = document.createElement('style');
    st.textContent = `
      :root { --fin-fab-size: 30px; --fin-gutter: 40px; }
      .view-scroll:not(.flush) { padding-right: var(--fin-gutter); }
      .fin-fab {
        right: 0; bottom: auto;
        border-radius: 15px 0 0 15px;
        cursor: grab; touch-action: none;
      }
      .fin-fab:active { cursor: grabbing; }
      .fin-fab:hover { background: #015ba6; transform: translateX(-2px); box-shadow: 0 10px 22px rgba(2,113,206,.48); }
      .fin-fab .fin-badge { right: auto; left: -6px; top: -5px; }
      .fin-window { right: 12px; }
    `;
    document.head.appendChild(st);

    /* Drag along the edge. A real drag (>4px) never toggles the chat: the
       document-capture click handler swallows the click that follows it. */
    const KEY = 'fin-dock-top';
    const clampTop = (t) => Math.min(Math.max(t, 8), innerHeight - 38);
    const setTop = (t) => { fab.style.top = clampTop(t) + 'px'; };
    const saved = parseFloat(localStorage.getItem(KEY));
    setTop(isNaN(saved) ? innerHeight - 180 : saved);

    let dragging = false, moved = false, startY = 0, startTop = 0;
    fab.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false;
      startY = e.clientY; startTop = fab.getBoundingClientRect().top;
      fab.setPointerCapture(e.pointerId);
    });
    fab.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (Math.abs(e.clientY - startY) > 4) moved = true;
      if (moved) setTop(startTop + (e.clientY - startY));
    });
    fab.addEventListener('pointerup', () => {
      dragging = false;
      if (moved) localStorage.setItem(KEY, String(fab.getBoundingClientRect().top));
    });
    window.addEventListener('resize', () => setTop(fab.getBoundingClientRect().top));

    /* Focused launcher: arrow keys nudge it along the edge (24px steps). */
    fab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const t = fab.getBoundingClientRect().top + (e.key === 'ArrowUp' ? -24 : 24);
      setTop(t);
      localStorage.setItem(KEY, String(fab.getBoundingClientRect().top));
    });

    /* Runs in document capture, BEFORE the widget's own toggle: swallow the
       post-drag click, and place the window vertically beside the launcher. */
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target)) return;
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; return; }
      const wh = Math.min(620, innerHeight - 24);
      const top = Math.min(Math.max(fab.getBoundingClientRect().top + 15 - wh / 2, 12), innerHeight - wh - 12);
      win.style.top = top + 'px';
      win.style.bottom = 'auto';
      win.style.height = wh + 'px';
    }, true);
  }
})();
