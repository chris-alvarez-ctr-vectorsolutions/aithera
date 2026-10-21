/* =============================================================================
   TargetSolutions Mobile App (v2) — File Center
   =============================================================================
   Read-only mobile take on the web platform's File Center. Two doors in:

     • a File Center Quick Link tile (launch 'folder' or 'file') lands straight
       on its target — a folder listing, or the file itself;
     • the File Center row under More opens the department root.

   Both land on the same browse screen (#screen-files). There are no admin
   functions here — no upload, edit, move or delete — only browsing and opening.

   Opening an item depends on its type (see TYPES):
     view      PDF, image, text → full-screen in-app viewer (pinch / double-tap
               zoom; PDFs get a "3 of 12" page counter)
     download  PowerPoint, Word, Excel, ZIP … → a short sheet first (name,
               type, size), then a simulated download and a "Saved" toast
     browser   links → hand off to the native browser (same as external URLs)

   Navigation model: the app-bar back arrow always EXITS the File Center, to
   the screen the user came from (`origin`: Home or More). Moving around inside
   the tree is done in the tree itself — folder rows, "Up one level" and the
   breadcrumb — so a user who arrived by Quick Link can climb past the folder
   they started in and wander anywhere, and one tap on back is always the way
   out. (An earlier cut walked back through every folder visited; that read as
   confusing next to the in-tree navigation.)

   Exposes window.FC for app.js (Quick Links, More) and the flow map.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ===========================================================================
     DATA — edit these to change the prototype's content
     ======================================================================== */
  var DEPT = 'Springfield Fire Department';
  var IMPORTED = 'Imported From ' + DEPT;

  /* File types. `open` is the behavior on tap; `app` names the app a
     downloaded file would open in. Tone keys map to the .fc-ico--* tints. */
  var TYPES = {
    folder: { icon: 'fa-folder',          tone: 'folder', label: 'Folder',      open: 'browse' },
    pdf:    { icon: 'fa-file-pdf',        tone: 'pdf',    label: 'PDF',         open: 'view' },
    image:  { icon: 'fa-file-image',      tone: 'image',  label: 'Image',       open: 'view' },
    text:   { icon: 'fa-file-lines',      tone: 'text',   label: 'Text',        open: 'view' },
    pptx:   { icon: 'fa-file-powerpoint', tone: 'pptx',   label: 'PowerPoint',  open: 'download', app: 'PowerPoint' },
    xlsx:   { icon: 'fa-file-excel',      tone: 'xlsx',   label: 'Excel',       open: 'download', app: 'Excel' },
    docx:   { icon: 'fa-file-word',       tone: 'docx',   label: 'Word',        open: 'download', app: 'Word' },
    zip:    { icon: 'fa-file-zipper',     tone: 'zip',    label: 'ZIP archive', open: 'download', app: 'Files' },
    link:   { icon: 'fa-globe',           tone: 'link',   label: 'Link',        open: 'browser' }
  };

  /* The department's File Center. The root and "Imported Resources" mirror the
     web platform's admin view; the rest exists so every open behavior has
     something to tap. `sub` is the gray line under the name (the web's
     "Imported From …"); items without one show type · size instead. */
  var ROOT = {
    id: 'root', type: 'folder', name: DEPT + ' File Center', modified: '2026-10-15', items: [
      { id: 'imported', type: 'folder', name: 'Imported Resources', modified: '2026-09-30', items: [
        { id: 'ems-30-034',    type: 'pdf',  name: 'EMS 30-034 Double Sequential External Defibrillation [2024].pdf', sub: IMPORTED, size: '1.8 MB', pages: 12, modified: '2026-08-14' },
        { id: 'ics-100c',      type: 'pdf',  name: 'ICS-100C Student Manual', sub: IMPORTED, size: '6.2 MB', pages: 148, modified: '2026-07-02' },
        { id: 'roof-ladders',  type: 'pdf',  name: 'Mandatory Use of Roof Ladders on Peaked Roof Buildings OO 24-012.pdf', sub: IMPORTED, size: '640 KB', pages: 3, modified: '2026-09-11' },
        { id: 'policy-129',    type: 'link', name: 'Policy 129 (Infoportal Folder)', sub: IMPORTED, url: 'https://infoportal.springfieldfd.gov/policies/129', modified: '2026-06-20' },
        { id: 'ems-refresher', type: 'pptx', name: 'EMS Protocol Refresher 2026.pptx', sub: IMPORTED, size: '24.5 MB', modified: '2026-09-30' }
      ] },
      { id: 'policies', type: 'folder', name: 'Policies & SOGs', modified: '2026-10-15', items: [
        { id: 'sog-2026', type: 'folder', name: '2026 Updates', modified: '2026-10-15', items: [
          { id: 'wildland',     type: 'pdf',  name: 'Wildland Policy.pdf', size: '2.1 MB', pages: 18, modified: '2026-10-15' },
          { id: 'sog-template', type: 'docx', name: 'SOG Template.docx', size: '88 KB', modified: '2026-10-01' }
        ] },
        { id: 'radio',       type: 'text',  name: 'Radio Channel Assignments.txt', size: '3 KB', modified: '2026-09-18' },
        { id: 'bay-layout',  type: 'image', name: 'Station 3 Apparatus Bay Layout.jpg', size: '3.4 MB', modified: '2026-08-27' },
        { id: 'hydrant-log', type: 'xlsx',  name: 'Hydrant Flow Test Log.xlsx', size: '412 KB', modified: '2026-10-09' },
        { id: 'preplans',    type: 'zip',   name: 'Pre-Plan Maps (District 3).zip', size: '58 MB', modified: '2026-05-30' }
      ] },
      { id: 'overview-video', type: 'link', name: 'User Overview Video', url: 'https://vimeo.com/targetsolutions/user-overview', modified: '2026-05-05' }
    ]
  };

  /* Sort options for the list. Folders always sort ahead of files. */
  var SORTS = [
    { id: 'name-asc',  label: 'Name A–Z',     icon: 'fa-arrow-down-a-z' },
    { id: 'name-desc', label: 'Name Z–A',     icon: 'fa-arrow-up-z-a' },
    { id: 'type',      label: 'Type',         icon: 'fa-shapes' },
    { id: 'newest',    label: 'Newest first', icon: 'fa-clock' },
    { id: 'oldest',    label: 'Oldest first', icon: 'fa-clock-rotate-left' }
  ];

  /* Fake document bodies for the viewer */
  var TEXT_BODIES = {
    radio: 'SPRINGFIELD FIRE DEPARTMENT\nRADIO CHANNEL ASSIGNMENTS\nEffective 2026-09-18\n\n' +
           'CH 1   DISPATCH        Primary dispatch, all units\n' +
           'CH 2   TAC 1           First-alarm fireground\n' +
           'CH 3   TAC 2           Second-alarm / second incident\n' +
           'CH 4   TAC 3           EMS working channel\n' +
           'CH 5   STAGING         Staging area ops\n' +
           'CH 6   COMMAND         IC to Division / Group supervisors\n' +
           'CH 7   TRAINING        Drill grounds, Station 3\n' +
           'CH 8   MUTUAL AID      County interop (FIRE-MA)\n' +
           'CH 9   HAZMAT          Hazmat team ops\n' +
           'CH 10  ADMIN           Non-emergency, admin traffic\n\n' +
           'NOTES\n- Switch to the assigned TAC channel on dispatch; do not\n  stay on DISPATCH for fireground traffic.\n' +
           '- Mayday traffic stays on the fireground TAC channel.\n- Report channel problems to Communications (x4410).'
  };

  /* ===========================================================================
     INDEX + STATE
     ======================================================================== */
  var byId = {}, parentOf = {};
  (function index(node, parent) {
    byId[node.id] = node;
    if (parent) parentOf[node.id] = parent.id;
    (node.items || []).forEach(function (child) { index(child, node); });
  })(ROOT, null);

  var origin = 'home';   // screen the back arrow exits to (Home or More)
  var folderId = 'root'; // current folder
  var sortId = 'name-asc';
  var query  = '';
  var viewing = null;    // item open in the viewer
  var viewFrom = 'list'; // 'list' → X returns to the folder; 'origin' → to the Quick Link's screen
  var zoomHintShown = false;

  var listEl   = $('#fc-list'),
      emptyEl  = $('#fc-empty'),
      crumbsEl = $('#fc-crumbs'),
      searchEl = $('#fc-search'),
      sortBtn  = $('#fc-sort'),
      screenEl = $('#screen-files'),
      viewerEl = $('#screen-file-view'),
      stageEl  = $('#fc-viewer-stage'),
      pillEl   = $('#fc-viewer-pill'),
      sheetEl  = $('#fc-sheet'),
      menuEl   = $('#fc-menu'),
      toastEl  = $('#fc-toast');

  function current() { return byId[folderId] || ROOT; }
  function typeOf(item) { return TYPES[item.type]; }
  function isRoot(item) { return item.id === ROOT.id; }

  function prettyDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function domainOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
  function subOf(item) {
    if (item.sub) return item.sub;
    var t = typeOf(item);
    if (item.type === 'folder') return (item.items || []).length + ' item' + ((item.items || []).length === 1 ? '' : 's');
    if (item.type === 'link') return domainOf(item.url);
    return t.label + ' · ' + item.size;
  }
  function sizeMB(item) { var m = /([\d.]+)\s*MB/i.exec(item.size || ''); return m ? parseFloat(m[1]) : 0; }

  /* ===========================================================================
     RENDER — browse screen
     ======================================================================== */
  function sorted(items) {
    var list = items.slice();
    var byName = function (a, b) { return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }); };
    var cmp = {
      'name-asc':  byName,
      'name-desc': function (a, b) { return byName(b, a); },
      'type':      function (a, b) { return typeOf(a).label.localeCompare(typeOf(b).label) || byName(a, b); },
      'newest':    function (a, b) { return (b.modified || '').localeCompare(a.modified || '') || byName(a, b); },
      'oldest':    function (a, b) { return (a.modified || '').localeCompare(b.modified || '') || byName(a, b); }
    }[sortId] || byName;
    list.sort(function (a, b) {
      var fa = a.type === 'folder', fb = b.type === 'folder';
      if (fa !== fb) return fa ? -1 : 1;   // folders first, as the web platform lists them
      return cmp(a, b);
    });
    return list;
  }

  function afterIcon(item) {
    switch (typeOf(item).open) {
      case 'browse':   return 'fa-chevron-right';
      case 'download': return 'fa-arrow-down-to-line';
      case 'browser':  return 'fa-arrow-up-right-from-square';
      default:         return 'fa-chevron-right';
    }
  }

  function renderRow(item) {
    var t = typeOf(item);
    return '<button class="fc-row" type="button" data-item="' + item.id + '">' +
           '<span class="fc-ico fc-ico--' + t.tone + '"><i class="fa-solid ' + t.icon + '"></i></span>' +
           '<span class="fc-row__main">' +
             '<span class="fc-row__name">' + esc(item.name) + '</span>' +
             '<span class="fc-row__sub">' + esc(subOf(item)) + '</span>' +
           '</span>' +
           '<i class="fa-solid ' + afterIcon(item) + ' fc-row__after"></i>' +
           '</button>';
  }

  function renderCrumbs() {
    var chain = [], id = current().id;
    while (id) { chain.unshift(byId[id]); id = parentOf[id]; }
    crumbsEl.innerHTML = chain.map(function (node, i) {
      var last = i === chain.length - 1;
      return (i ? '<i class="fa-solid fa-chevron-right fc-crumbs__sep"></i>' : '') +
             (last ? '<span class="fc-crumbs__here">' + esc(node.name) + '</span>'
                   : '<button class="fc-crumbs__link" type="button" data-crumb="' + node.id + '">' + esc(node.name) + '</button>');
    }).join('');
    crumbsEl.scrollLeft = crumbsEl.scrollWidth;   // the current folder stays in view
  }

  function render() {
    var folder = current();
    screenEl.dataset.title = isRoot(folder) ? 'File Center' : folder.name;
    screenEl.dataset.tab = origin === 'more' ? 'more' : 'home';
    renderCrumbs();

    var q = query.trim().toLowerCase();
    var items = sorted((folder.items || []).filter(function (it) {
      return !q || it.name.toLowerCase().indexOf(q) !== -1;
    }));

    var parent = parentOf[folder.id];
    var up = parent
      ? '<button class="fc-row fc-row--up" type="button" data-up="1">' +
        '<span class="fc-ico fc-ico--up"><i class="fa-solid fa-turn-up"></i></span>' +
        '<span class="fc-row__main"><span class="fc-row__name">Up one level</span>' +
        '<span class="fc-row__sub">to ' + esc(isRoot(byId[parent]) ? 'File Center' : byId[parent].name) + '</span></span></button>'
      : '';
    listEl.innerHTML = up + items.map(renderRow).join('');
    listEl.hidden = !up && !items.length;
    emptyEl.hidden = !!items.length;
    emptyEl.textContent = q ? 'No files match “' + query.trim() + '”.' : 'This folder is empty.';

    var s = SORTS.filter(function (o) { return o.id === sortId; })[0];
    sortBtn.innerHTML = '<i class="fa-solid ' + s.icon + '"></i><span>' + s.label + '</span><i class="fa-solid fa-chevron-down fc-sort__caret"></i>';
    searchEl.value = query;
    $('#fc-search-clear').hidden = !query;
  }

  function show() {
    render();
    if (window.goTo) window.goTo('files');
  }

  /* ===========================================================================
     NAVIGATION
     ======================================================================== */
  function openRoot(from) {
    origin = from || 'more'; folderId = ROOT.id; query = ''; show();
  }
  function openFolder(id, from) {
    if (!byId[id] || byId[id].type !== 'folder') return openRoot(from);
    origin = from || 'home'; folderId = id; query = ''; show();
  }
  /* A file-targeted Quick Link: the viewer / download sheet opens directly
     over the screen the user is on; the current folder is set to the file's
     folder so the list is sensible if they go looking. */
  function openFile(id, from) {
    var item = byId[id];
    if (!item) return;
    origin = from || 'home'; folderId = parentOf[id] || ROOT.id; query = '';
    act(item, 'origin');
  }
  /* Every folder change goes through show(): goTo re-reads data-title / data-tab
     so the app bar follows the folder, and resets the scroll. */
  function go(id) { folderId = id; query = ''; show(); }
  function up()   { var p = parentOf[current().id]; if (p) go(p); }
  /* App-bar back: leave the File Center, back to where it was opened from. */
  function back() { if (window.goTo) window.goTo(origin); }

  /* Tap on an item: branch on its type's open behavior. */
  function act(item, from) {
    var t = typeOf(item);
    switch (t.open) {
      case 'browse':   go(item.id); break;
      case 'view':     openViewer(item, from || 'list'); break;
      case 'download': openDownload(item); break;
      case 'browser':
        if (window.APP && window.APP.openSheet) {
          window.APP.openSheet('External Link',
            '“' + item.name + '” is a link (' + domainOf(item.url) + '). It would open in your default mobile browser.');
        }
        break;
    }
  }

  /* ===========================================================================
     VIEWER — PDF / image / text
     ======================================================================== */
  function fakePage(item, n, total) {
    // A page of gray "text" bars, a heading on page 1, a figure block now and
    // then — enough to read as a rendered PDF page at phone size.
    var head = n === 1
      ? '<div class="fc-page__h1">' + esc(item.name.replace(/\.pdf$/i, '')) + '</div><div class="fc-page__meta">' + esc(DEPT) + ' · ' + prettyDate(item.modified) + '</div>'
      : '<div class="fc-page__h2"></div>';
    var paras = '', k = n === 1 ? 3 : 4;
    for (var i = 0; i < k; i++) {
      paras += '<div class="fc-page__p">' +
               '<span style="width:100%"></span><span style="width:96%"></span><span style="width:98%"></span><span style="width:' + (55 + ((n * 7 + i * 13) % 40)) + '%"></span>' +
               '</div>';
      if (i === 1 && n % 2 === 0) paras += '<div class="fc-page__fig"><i class="fa-regular fa-image"></i></div>';
    }
    return '<div class="fc-page">' + head + paras + '<div class="fc-page__num">' + n + ' / ' + total + '</div></div>';
  }

  function bayLayoutSvg() {
    // Inline placeholder "photo": a simple apparatus-bay floor plan.
    return '<svg class="fc-image" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Station 3 apparatus bay layout">' +
      '<rect width="360" height="480" fill="#f6f1e7"/>' +
      '<rect x="24" y="40" width="312" height="400" fill="#fff" stroke="#2b3648" stroke-width="4"/>' +
      '<text x="180" y="28" text-anchor="middle" font-family="Open Sans, sans-serif" font-size="13" font-weight="700" fill="#2b3648">STATION 3 — APPARATUS BAY</text>' +
      '<g fill="#eaf2fc" stroke="#0b5fbf" stroke-width="2">' +
      '<rect x="48" y="80" width="80" height="300"/><rect x="140" y="80" width="80" height="300"/><rect x="232" y="80" width="80" height="300"/></g>' +
      '<g font-family="Open Sans, sans-serif" font-size="11" font-weight="700" fill="#0b5fbf" text-anchor="middle">' +
      '<text x="88" y="236">ENGINE 3</text><text x="180" y="236">LADDER 3</text><text x="272" y="236">MEDIC 3</text></g>' +
      '<g stroke="#c8102e" stroke-width="3" stroke-dasharray="8 6"><line x1="24" y1="400" x2="336" y2="400"/></g>' +
      '<text x="180" y="422" text-anchor="middle" font-family="Open Sans, sans-serif" font-size="10" fill="#c8102e">BAY DOORS — KEEP CLEAR</text>' +
      '<rect x="40" y="48" width="60" height="20" fill="#fdf1dc" stroke="#b7791f"/><text x="70" y="62" text-anchor="middle" font-family="Open Sans, sans-serif" font-size="8" fill="#7a4e0f">SCBA FILL</text>' +
      '<rect x="260" y="48" width="60" height="20" fill="#e3f3e9" stroke="#158444"/><text x="290" y="62" text-anchor="middle" font-family="Open Sans, sans-serif" font-size="8" fill="#0a7637">TURNOUTS</text>' +
      '</svg>';
  }

  function openViewer(item, from) {
    viewing = item; viewFrom = from;
    $('#fc-viewer-title').textContent = item.name;
    viewerEl.dataset.kind = item.type;
    stageEl.classList.remove('is-zoomed');
    var html = '';
    if (item.type === 'pdf') {
      var total = item.pages || 1, shown = Math.min(total, 8);
      for (var n = 1; n <= shown; n++) html += fakePage(item, n, total);
      pillEl.textContent = '1 of ' + total;
    } else if (item.type === 'image') {
      html = '<div class="fc-image__wrap">' + bayLayoutSvg() + '</div>';
      pillEl.textContent = item.size;
    } else {
      html = '<pre class="fc-text">' + esc(TEXT_BODIES[item.id] || 'No preview available.') + '</pre>';
      pillEl.textContent = item.size;
    }
    stageEl.innerHTML = '<div class="fc-viewer__content">' + html + '</div>';
    stageEl.scrollTop = 0;
    if (window.goTo) window.goTo('file-view');
    if (!zoomHintShown) { zoomHintShown = true; toast('Pinch or double-tap to zoom'); }
  }

  function closeViewer() {
    viewing = null;
    if (viewFrom === 'origin') { if (window.goTo) window.goTo(origin); }
    else show();
  }

  function toggleZoom() {
    var on = stageEl.classList.toggle('is-zoomed');
    if (viewing && viewing.type !== 'pdf') pillEl.textContent = on ? '2×' : viewing.size;
  }

  /* Page counter follows the scroll (PDF only) */
  stageEl.addEventListener('scroll', function () {
    if (!viewing || viewing.type !== 'pdf') return;
    var page = stageEl.querySelector('.fc-page');
    if (!page) return;
    var h = page.offsetHeight + 12, n = Math.min(viewing.pages, Math.floor((stageEl.scrollTop + stageEl.clientHeight / 2) / h) + 1);
    pillEl.textContent = n + ' of ' + viewing.pages;
  });
  stageEl.addEventListener('dblclick', toggleZoom);

  function shareMenu() {
    if (!viewing) return;
    var t = typeOf(viewing);
    menu(viewing.name, [
      { icon: 'fa-arrow-up-from-bracket', label: 'Share…',               onPick: function () { toast('Would open the device share sheet'); } },
      { icon: 'fa-folder-arrow-down',     label: 'Save to device',        onPick: function () { toast('Saved to your device'); } },
      { icon: 'fa-arrow-up-right-from-square', label: 'Open in another app', onPick: function () { toast('Would open in ' + (t.app || 'another app')); } }
    ]);
  }

  /* ===========================================================================
     DOWNLOAD SHEET — file types that open outside the app
     ======================================================================== */
  var dlTimer = null, dlItem = null;
  function openDownload(item) {
    dlItem = item;
    var t = typeOf(item), big = sizeMB(item) >= 25;
    sheetEl.innerHTML =
      '<div class="t-Sheet__frame fc-dl">' +
        '<div class="t-Sheet__handle"></div>' +
        '<div class="fc-dl__file">' +
          '<span class="fc-ico fc-ico--lg fc-ico--' + t.tone + '"><i class="fa-solid ' + t.icon + '"></i></span>' +
          '<div class="fc-dl__text"><p class="fc-dl__name">' + esc(item.name) + '</p>' +
          '<p class="fc-dl__meta">' + t.label + ' · ' + esc(item.size) + '</p></div>' +
        '</div>' +
        '<p class="t-Paragraph">This file type opens outside the app. It will be saved to your device, where you can open it in ' + t.app + ' or share it.</p>' +
        (big ? '<p class="fc-dl__warn"><i class="fa-solid fa-wifi"></i> Large file — best on Wi‑Fi.</p>' : '') +
        '<div class="fc-dl__progress" id="fc-dl-progress" hidden>' +
          '<div class="fc-dl__bar"><span id="fc-dl-fill"></span></div>' +
          '<p class="fc-dl__pct" id="fc-dl-pct">Downloading… 0%</p>' +
        '</div>' +
        '<div class="fc-dl__actions" id="fc-dl-actions">' +
          '<button class="t-Button t-Button--primary" type="button" data-dl="go"><i class="fa-solid fa-arrow-down-to-line"></i> Download (' + esc(item.size) + ')</button>' +
          '<button class="t-Button t-Button--secondary" type="button" data-dl="x">Cancel</button>' +
        '</div>' +
      '</div>';
    sheetEl.classList.add('is-open');
  }
  function closeDownload() {
    clearTimeout(dlTimer); dlTimer = null;
    sheetEl.classList.remove('is-open');
  }
  function startDownload() {
    $('#fc-dl-actions').hidden = true;
    $('#fc-dl-progress').hidden = false;
    var pct = 0, fill = $('#fc-dl-fill'), label = $('#fc-dl-pct'), item = dlItem;
    (function tick() {
      pct = Math.min(100, pct + 6 + Math.round(Math.random() * 10));
      fill.style.width = pct + '%';
      label.textContent = pct < 100 ? 'Downloading… ' + pct + '%' : 'Done';
      if (pct < 100) { dlTimer = setTimeout(tick, 140); return; }
      dlTimer = setTimeout(function () {
        closeDownload();
        toast('Saved to your device', { label: 'Open', onPick: function () {
          if (window.APP && window.APP.openSheet) {
            window.APP.openSheet('Open in ' + typeOf(item).app,
              '“' + item.name + '” would open in ' + typeOf(item).app + ', or in the device’s share sheet if no app can open it.');
          }
        } });
      }, 350);
    })();
  }
  sheetEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dl]');
    if (btn && btn.dataset.dl === 'go') { startDownload(); return; }
    if (btn || e.target === sheetEl) closeDownload();
  });

  /* ===========================================================================
     MENU + TOAST (same look as record.js's)
     ======================================================================== */
  function menu(title, options, currentIdx) {
    menuEl.innerHTML = '<div class="t-Sheet__frame rc-menu"><div class="t-Sheet__handle"></div>' +
      (title ? '<p class="rc-menu__title">' + esc(title) + '</p>' : '') +
      options.map(function (o, i) {
        var on = i === currentIdx;
        return '<button class="rc-menu__item' + (on ? ' is-on' : '') + '" data-mnu="' + i + '" type="button">' +
               '<i class="fa-solid ' + o.icon + '"></i>' + esc(o.label) +
               (on ? '<i class="fa-solid fa-check rc-menu__check"></i>' : '') + '</button>';
      }).join('') +
      '<button class="t-Button t-Button--secondary" data-mnu="x" type="button" style="margin-top:var(--space-3)">Cancel</button></div>';
    menuEl.classList.add('is-open');
    menuEl.onclick = function (e) {
      var btn = e.target.closest('[data-mnu]');
      if (!btn && e.target !== menuEl) return;
      menuEl.classList.remove('is-open');
      if (btn && btn.dataset.mnu !== 'x') options[+btn.dataset.mnu].onPick();
    };
  }

  var toastTimer = null;
  function toast(text, action) {
    toastEl.innerHTML = '<span>' + esc(text) + '</span>' +
      (action ? '<button class="fc-toast__action" type="button">' + esc(action.label) + '</button>' : '');
    toastEl.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-open'); }, action ? 4500 : 2200);
    var btn = toastEl.querySelector('.fc-toast__action');
    if (btn) btn.onclick = function () { toastEl.classList.remove('is-open'); action.onPick(); };
  }

  function closeAll() {
    closeDownload();
    menuEl.classList.remove('is-open');
    toastEl.classList.remove('is-open');
  }

  /* ===========================================================================
     EVENTS
     ======================================================================== */
  listEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-up]')) { up(); return; }
    var row = e.target.closest('[data-item]');
    if (row) act(byId[row.dataset.item], 'list');
  });
  crumbsEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-crumb]');
    if (c) go(c.dataset.crumb);
  });
  searchEl.addEventListener('input', function () { query = searchEl.value; render(); });
  $('#fc-search-clear').addEventListener('click', function () { query = ''; render(); searchEl.focus(); });
  sortBtn.addEventListener('click', function () {
    var idx = SORTS.map(function (s) { return s.id; }).indexOf(sortId);
    menu('Sort by', SORTS.map(function (s) {
      return { icon: s.icon, label: s.label, onPick: function () { sortId = s.id; render(); } };
    }), idx);
  });
  viewerEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fc]');
    if (!b) return;
    if (b.dataset.fc === 'close') closeViewer();
    if (b.dataset.fc === 'share') shareMenu();
    if (b.dataset.fc === 'zoom')  toggleZoom();
  });

  /* ===========================================================================
     PUBLIC — app.js (Quick Links, More) + Design Toolbox flow map
     ======================================================================== */
  /* Flow-map states. Returns true when the id is a File Center state. */
  function applyState(id) {
    closeAll();
    switch (id) {
      case 'files':         openRoot('more'); return true;
      case 'files-folder':  openFolder('imported', 'home'); return true;
      case 'file-view':     openFolder('imported', 'home'); openViewer(byId['ems-30-034'], 'list'); return true;
      case 'file-download': openFolder('imported', 'home'); openDownload(byId['ems-refresher']); return true;
    }
    return false;
  }

  window.FC = { openRoot: openRoot, openFolder: openFolder, openFile: openFile, back: back, applyState: applyState, closeAll: closeAll };
})();
