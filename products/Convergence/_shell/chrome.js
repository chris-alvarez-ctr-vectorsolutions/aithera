/* ============================================================
 * Convergence LMS — shared chrome injector
 *
 * Renders the topnav + admin sidenav + breadcrumb around a prototype, so each
 * Convergence prototype is a standalone file that shows the Convergence chrome
 * when opened directly. No iframe, no redirect.
 *
 * Usage (in a prototype file):
 *   <head> ... <link rel="stylesheet" href="../_shell/chrome.css"/> ... </head>
 *   <body>
 *     <div id="cv-page"> ...your page content... </div>
 *     <script>
 *       window.SHELL_CONFIG = {
 *         active: 'qual-builder',          // sidenav route id to highlight
 *         parent: 'Qualifications',         // breadcrumb parent label (optional)
 *         title:  'Qualification Builder (AI)', // breadcrumb current page title
 *         fullBleed: true                   // optional: remove content padding
 *       };
 *     </script>
 *     <script src="../_shell/chrome.js"></script>
 *     <script> ...your page logic (runs after chrome is built)... </script>
 *   </body>
 *
 * The sidenav links between sibling prototype files via real hrefs, so each page
 * is openable on its own. Add a new prototype by giving its NAV_TREE child an
 * `href` (relative to the prototype files' folder).
 * ============================================================ */
(function () {
  // Base path of this script, used to resolve chrome assets (logo).
  const SELF = document.currentScript;
  const BASE = SELF ? SELF.src.replace(/chrome\.js(\?.*)?$/, '') : '../_shell/';

  const CFG = window.SHELL_CONFIG || {};
  const ACTIVE = CFG.active || '';

  // ─── Material Design icon paths ─────────────────────────────────────────────
  const ICONS = {
    search:        "M9.5 3a6.5 6.5 0 0 1 5.249 10.347l4.452 4.452-1.414 1.414-4.452-4.452A6.5 6.5 0 1 1 9.5 3zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z",
    menu:          "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z",
    chevronDown:   "M7 10l5 5 5-5z",
    chevronRight:  "M10 17l5-5-5-5v10z",
    dashboard:     "M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z",
    organization:  "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
    trainingImport:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    files:         "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
    activities:    "M18 2H6c-1.1 0-2 .9-2 2v16l4-2 4 2 4-2 4 2V4c0-1.1-.9-2-2-2zm0 17-4-2-4 2-4-2V4h12v15z",
    qualifications:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z",
    assignments:   "M15 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-9-2c1.66 0 3-1.34 3-3S7.66 4 6 4 3 5.34 3 7s1.34 3 3 3zm9 4c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5zm-9 0c-2.33 0-7 1.17-7 3.5V20h7v-2.5c0-.85.33-2.34 2.37-3.47C7.5 13.84 6.71 14 6 14z",
    electives:     "M12 2 8.5 5.5 9.91 7l1.59-1.59V15h1V5.41L14.09 7 15.5 5.5 12 2zM4 17.5C4 20 8.13 22 12 22s8-2 8-4.5V13c0-2.5-4.13-4.5-8-4.5S4 10.5 4 13v4.5zm14-3.5c0 .89-2.54 2-6 2s-6-1.11-6-2v-.94c1.55.59 3.69.94 6 .94s4.45-.35 6-.94V14zm0 3.5c0 .89-2.54 2-6 2s-6-1.11-6-2v-.94c1.55.59 3.69.94 6 .94s4.45-.35 6-.94v.94z",
    authorizations:"M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6zm9 14H6V10h12v10zm-6-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    tracking:      "M20 6h-4V4l-2-2h-4L8 4v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11zm-9-7H7v2h4v3h2v-3h4v-2h-4V9h-2v3z",
    reports:       "M19 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h11v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm12 4H9V8h7v2zm0 3H9v-2h7v2zm-3 3H9v-2h4v2z",
    assets:        "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 4l6.5 3.74L12 11.48 5.5 7.74 12 4zM5 16.27V9.34l6 3.46v6.96l-6-3.49zm14 0-6 3.49v-6.96l6-3.46v6.93z",
    security:      "M12 2c1.66 0 3 1.34 3 3a3 3 0 1 1-6 0c0-1.66 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
    system:        "M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.27 7.27 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65a7.97 7.97 0 0 0 0 1.96l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65A.49.49 0 0 0 10 22h4a.49.49 0 0 0 .49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z",
    location:      "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
    globe:         "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.03 8zM12 19.96A13.45 13.45 0 0 1 10.09 16h3.82A13.45 13.45 0 0 1 12 19.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.34.16-2h4.68c.09.66.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a7.99 7.99 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z",
    user:          "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    help:          "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2v2zm2.07-7.75-.9.92A3.4 3.4 0 0 0 13 14.5h-2v-.5a4 4 0 0 1 1.17-2.83l1.24-1.26A1.96 1.96 0 0 0 14 8.5a2 2 0 1 0-4 0H8a4 4 0 1 1 7.07 2.75z",
  };

  // ─── Admin navigation tree ──────────────────────────────────────────────────
  // Children with an `href` link to a sibling prototype file. Children without
  // are placeholders (inert). The whole tree is shown for realism.
  const NAV_TREE = [
    { id:"dashboard",    label:"Dashboard",                    icon:"dashboard", solo:true },
    { id:"organization", label:"Organization",                 icon:"organization", children:[
      {id:"org-users",label:"Users"},{id:"org-teams",label:"Teams"},{id:"org-departments",label:"Departments"},
      {id:"org-sites",label:"Sites"},{id:"org-regions",label:"Regions"},{id:"org-groups",label:"Groups"},
      {id:"org-places",label:"Places"},{id:"org-contacts",label:"Contacts"},
    ]},
    { id:"training", label:"Training Import And Creation", icon:"trainingImport", children:[
      {id:"ti-content",label:"Content Wizard"},{id:"ti-quizzes",label:"Quizzes"},{id:"ti-surveys",label:"Surveys"},
      {id:"ti-tasklists",label:"Tasklists"},{id:"ti-signatures",label:"Signatures"},{id:"ti-classes",label:"Classes"},
    ]},
    { id:"files", label:"Files", icon:"files", children:[ {id:"files-repos",label:"Repositories"} ]},
    { id:"activities", label:"Activities", icon:"activities", children:[
      {id:"act-activities", label:"Activities", href:"Manage-Activities.html"},
    ]},
    { id:"qualifications", label:"Qualifications", icon:"qualifications", children:[
      {id:"qual-requirements",    label:"Requirements",                  href:"Manage-Requirements.html"},
      {id:"qual-quals",           label:"Qualifications",                href:"Manage-Qualifications.html"},
      {id:"qual-builder",         label:"Qualification Builder (AI)",    href:"AI-Qualification-Builder.html"},
      {id:"qual-builder-manual",  label:"Qualification Builder (Manual)",href:"Manual-Qualification-Builder.html"},
      {id:"qual-req-builder-ai",  label:"Requirement Builder (AI)",      href:"AI-Requirement-Builder.html"},
      {id:"qual-req-builder",     label:"Requirement Builder (Manual)",  href:"Manual-Requirement-Builder.html"},
      {id:"qual-copy",            label:"Copy Qualifications"},
    ]},
    { id:"assignments", label:"Assignments", icon:"assignments", children:[
      {id:"asn-wizard",label:"Assign Training Wizard"},{id:"asn-list",label:"Assignments"},
    ]},
    { id:"electives", label:"Electives", icon:"electives", children:[
      {id:"elec-categories",label:"Elective Categories"},{id:"elec-offer",label:"Offer Electives"},
      {id:"elec-approve",label:"Approve Electives"},{id:"elec-list",label:"Electives"},
    ]},
    { id:"authorizations", label:"Authorizations", icon:"authorizations", children:[
      {id:"auth-authorize",label:"Authorize Training"},{id:"auth-list",label:"Authorizations"},
    ]},
    { id:"tracking", label:"Tracking And Completions", icon:"tracking", children:[
      {id:"trk-credit",label:"Credit Wizard"},{id:"trk-import",label:"Import Completions"},
      {id:"trk-tasklist",label:"Track Tasklist Completion"},{id:"trk-attendance",label:"Take Class Attendance"},
      {id:"trk-signatures",label:"Approve Signatures"},{id:"trk-records",label:"Completion Records"},
      {id:"trk-duplicate",label:"Duplicate Completions"},
    ]},
    { id:"reports", label:"Reports", icon:"reports", children:[
      {id:"rep-recents",label:"My Recents"},{id:"rep-frequent",label:"Frequently Used"},{id:"rep-all",label:"All Reports"},
      {id:"rep-activity",label:"Activity Reports"},{id:"rep-qualification",label:"Qualification Reports"},
      {id:"rep-user",label:"User Reports"},{id:"rep-org",label:"Organizational Reports"},{id:"rep-scheduled",label:"Scheduled Reports"},
    ]},
    { id:"assets", label:"Assets", icon:"assets", children:[ {id:"ast-groups",label:"Asset Groups"},{id:"ast-list",label:"Assets"} ]},
    { id:"security", label:"Security", icon:"security", children:[
      {id:"sec-roles",label:"Roles"},{id:"sec-copy",label:"Copy Roles"},{id:"sec-assign",label:"Assign Roles"},{id:"sec-assignments",label:"Role Assignments"},
    ]},
    { id:"system", label:"System", icon:"system", children:[
      {id:"sys-jobs",label:"Jobs"},{id:"sys-config",label:"Configuration"},{id:"sys-notifications",label:"Notifications"},{id:"sys-connections",label:"User Connections"},
    ]},
  ];

  const svg = (name) =>
    `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICONS[name]||''}"/></svg>`;

  // Which top-level group contains the active child? Open it by default.
  let activeParentId = null, activeParentLabel = CFG.parent || null;
  NAV_TREE.forEach(n => {
    if (n.children && n.children.some(c => c.id === ACTIVE)) {
      activeParentId = n.id;
      if (!activeParentLabel) activeParentLabel = n.label;
    }
  });
  const openGroups = new Set(activeParentId ? [activeParentId] : ['qualifications']);

  // ─── Build chrome DOM ───────────────────────────────────────────────────────
  function buildChrome() {
    // Capture page content (everything currently in body that isn't a script/style).
    const page = document.getElementById('cv-page');

    const app = document.createElement('div');
    app.className = 'app';
    app.id = 'cv-app';
    app.innerHTML = `
      <header class="topnav">
        <div class="brand"><img src="${BASE}assets/vs-logo.png" alt="Vector Solutions"/></div>
        <div class="spacer"></div>
        <nav class="tabs" role="tablist">
          <a role="tab" class="tab" data-tab="home">Home</a>
          <a role="tab" class="tab" data-tab="training">Training</a>
          <a role="tab" class="tab" data-tab="catalog">Catalog</a>
          <a role="tab" class="tab" data-tab="insights">Insights <span class="badge">BETA</span></a>
          <a role="tab" class="tab active" data-tab="administration">Administration</a>
        </nav>
        <div class="icon-tabs">
          <div class="icon-tab" title="Select language">${svg('globe')}</div>
          <div class="icon-tab" title="User profile">${svg('user')}</div>
        </div>
      </header>
      <div class="app-body">
        <aside class="sidenav" id="cv-sidenav">
          <div class="sn-search-row">
            <div class="sn-search-input-wrap">
              <span class="sn-search-icon">${svg('search')}</span>
              <input class="sn-search-input" type="text" placeholder="Search" aria-label="Search navigation" id="cv-search"/>
            </div>
            <div class="sn-burger" id="cv-burger" title="Collapse menu">${svg('menu')}</div>
          </div>
          <div class="sidenav-list" id="cv-nav-list"></div>
        </aside>
        <main class="main">
          <div class="breadcrumb-bar" id="cv-breadcrumb">
            <div class="ContextPath">
              <span class="SelectButtonWrapper">
                <a class="ButtonSmall ButtonSmallBlue" href="#" onclick="return false" title="Click to change working location">
                  <span class="ButtonInner NoImg">${svg('location')}<span>Location</span></span>
                </a>
              </span>
              <a class="LinkButton" href="#" onclick="return false">${CFG.context || 'Orlando Organization'}</a>
              ${activeParentLabel ? `
              <span class="bc-sep" aria-hidden="true">${svg('chevronRight')}</span>
              <a class="LinkButton" href="#" onclick="return false">${activeParentLabel}</a>` : ''}
              <span class="bc-sep" aria-hidden="true">${svg('chevronRight')}</span>
              <h1 class="PageActionTitle">${CFG.title || 'Administration'}</h1>
            </div>
            <button class="help-btn">${svg('help')}<span>Help</span></button>
          </div>
          <div class="content" id="cv-content"></div>
        </main>
      </div>`;

    document.body.appendChild(app);

    // Relocate page content into the content area.
    const content = app.querySelector('#cv-content');
    if (CFG.fullBleed) content.classList.add('no-pad');
    if (page) content.appendChild(page);

    renderNav('');
    wireEvents();
  }

  // ─── Sidenav render ─────────────────────────────────────────────────────────
  function renderNav(filter) {
    const list = document.getElementById('cv-nav-list');
    list.innerHTML = '';
    const q = (filter || '').toLowerCase();

    NAV_TREE.forEach(node => {
      const isOpen = openGroups.has(node.id);
      const isActive = node.solo && ACTIVE === node.id;

      const matchingChildren = q
        ? (node.children || []).filter(c => c.label.toLowerCase().includes(q))
        : (node.children || []);
      const nodeMatches = !q || node.label.toLowerCase().includes(q) || matchingChildren.length > 0;
      if (!nodeMatches) return;

      const row = document.createElement('div');
      row.className = 'sn-row' + (isActive ? ' active' : '') + (isOpen ? ' expanded' : '');
      row.innerHTML = `<span class="sn-icon">${svg(node.icon)}</span>`
        + `<span class="sn-label">${node.label}</span>`
        + (!node.solo ? `<span class="sn-chevron">${svg('chevronDown')}</span>` : '');
      row.addEventListener('click', () => {
        if (node.solo) return; // dashboard placeholder
        if (openGroups.has(node.id)) openGroups.delete(node.id); else openGroups.add(node.id);
        renderNav(document.getElementById('cv-search').value);
      });
      list.appendChild(row);

      if (!node.solo && (isOpen || q)) {
        const sub = document.createElement('div');
        sub.className = 'sn-sub';
        matchingChildren.forEach(child => {
          const active = ACTIVE === child.id;
          let cr;
          if (child.href && !active) {
            cr = document.createElement('a');
            cr.href = child.href;
          } else {
            cr = document.createElement('div');
            if (!child.href) cr.classList.add('inert');
          }
          cr.className = ('sn-sub-row' + (active ? ' active' : '') + (!child.href ? ' inert' : '')).trim();
          cr.textContent = child.label;
          sub.appendChild(cr);
        });
        list.appendChild(sub);
      }
    });
  }

  // ─── Events ─────────────────────────────────────────────────────────────────
  function wireEvents() {
    document.getElementById('cv-burger').addEventListener('click', () => {
      document.getElementById('cv-app').classList.toggle('sidenav-collapsed');
    });
    document.getElementById('cv-search').addEventListener('input', (e) => {
      const v = e.target.value;
      if (v) NAV_TREE.forEach(n => { if (!n.solo) openGroups.add(n.id); });
      renderNav(v);
    });
  }

  // Build now (script is at end of body, so #cv-page already exists).
  if (document.getElementById('cv-page')) buildChrome();
  else document.addEventListener('DOMContentLoaded', buildChrome);
})();
