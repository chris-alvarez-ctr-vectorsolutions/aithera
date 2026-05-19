// ================================================================
// REPORTS SIDENAV — navigation between reports
// ================================================================

const reportsSidenav = document.getElementById('reportsSidenav');
const navToggleBtn   = document.getElementById('navToggleBtn');

const REPORTS = {
    'activity-exception':   { title: 'Activity Exception Report',   breadcrumb: 'Activity Exception' },
    'qualification-report': { title: 'Qualification Reporting',     breadcrumb: 'Qualification Report' },
    'training-completion':  { title: 'Training Completion Report',  breadcrumb: 'Training Completion' },
    'training-hours':       { title: 'Training Hours Summary',      breadcrumb: 'Training Hours' },
    'incident-log':         { title: 'Incident Log Report',         breadcrumb: 'Incident Log' },
    'near-miss':            { title: 'Near Miss Report',            breadcrumb: 'Near Miss' },
    'manage-saved-views':   { title: 'Manage Saved Views',          breadcrumb: 'Manage Saved Views' },
};

const NAV_ITEMS = [
    {
        type: 'group', id: 'group-activity', text: 'Activity',
        children: [
            { type: 'button', id: 'activity-exception', text: 'Activity Exception Report' },
        ]
    },
    { type: 'divider' },
    {
        type: 'group', id: 'group-qualifications', text: 'Qualifications',
        children: [
            { type: 'button', id: 'qualification-report', text: 'Qualification Report' },
        ]
    },
    { type: 'divider' },
    {
        type: 'group', id: 'group-training', text: 'Training',
        children: [
            { type: 'button', id: 'training-completion', text: 'Training Completion Report' },
            { type: 'button', id: 'training-hours',      text: 'Training Hours Summary' },
        ]
    },
    { type: 'divider' },
    {
        type: 'group', id: 'group-safety', text: 'Safety',
        children: [
            { type: 'button', id: 'incident-log', text: 'Incident Log Report' },
            { type: 'button', id: 'near-miss',    text: 'Near Miss Report' },
        ]
    },
];

reportsSidenav.items        = NAV_ITEMS;
reportsSidenav.footerItems  = [{ type: 'button', id: 'manage-saved-views', text: 'Manage Saved Views' }];
reportsSidenav.expandedGroupIds = NAV_ITEMS.filter(i => i.type === 'group').map(i => i.id);
reportsSidenav.activeItemId = 'qualification-report';

reportsSidenav.addEventListener('item-click', (e) => {
    const id = e.detail.id;

    if (id === 'create-report') return;

    const report = REPORTS[id];
    if (!report) return;

    reportsSidenav.activeItemId = id;
    document.querySelector('.bc-current').textContent = report.breadcrumb;

    const isQual    = id === 'qualification-report';
    const isActEx   = id === 'activity-exception';
    const isManage  = id === 'manage-saved-views';

    document.getElementById('pageLayout').style.display              = isQual   ? '' : 'none';
    document.getElementById('actExLayout').style.display             = isActEx  ? '' : 'none';
    document.getElementById('manageSavedViewsLayout').style.display  = isManage ? '' : 'none';
    document.getElementById('reportPlaceholder').style.display       = (!isQual && !isActEx && !isManage) ? 'flex' : 'none';
    if (!isManage) document.getElementById('placeholderTitle').textContent = report.title;

    // Ensure qual filter toggle is hidden when switching away
    if (!isQual) filterToggleBtn.style.display = 'none';
});

// Toggle sidenav via hamburger button in top nav — always visible, always works
navToggleBtn.addEventListener('click', () => {
    reportsSidenav.classList.toggle('nav-hidden');
});

// Remove the blank icon placeholder gap from each vwc-item in the sidenav, and
// reduce the hardcoded font sizes. All of this is baked into shadow DOM and cannot
// be overridden via external CSS or documented custom properties.
function patchSidenavItemIcons() {
    const sidenav = document.getElementById('reportsSidenav');
    if (!sidenav?.shadowRoot) { setTimeout(patchSidenavItemIcons, 100); return; }
    const items = sidenav.shadowRoot.querySelectorAll('vwc-item');
    if (!items.length) { setTimeout(patchSidenavItemIcons, 100); return; }

    // Patch each vwc-item's shadow root: shrink font and collapse icon slot
    items.forEach(item => {
        if (!item.shadowRoot || item.shadowRoot.querySelector('#icon-gap-patch')) return;
        const style = document.createElement('style');
        style.id = 'icon-gap-patch';
        style.textContent = `
            :host { font-size: 13px !important; }
            .item { gap: 0 !important; font-size: 13px !important; }
            slot[name="graphic"], [part="graphic"], slot[name="icon"], slot[name="prefix"], slot[name="start"] {
                display: none !important;
                width: 0 !important;
                min-width: 0 !important;
                flex: 0 0 0 !important;
                overflow: hidden !important;
            }
        `;
        item.shadowRoot.prepend(style);
    });

    // Also patch the sidenav's own shadow root for group header label font size
    if (!sidenav.shadowRoot.querySelector('#sidenav-font-patch')) {
        const sidenavStyle = document.createElement('style');
        sidenavStyle.id = 'sidenav-font-patch';
        sidenavStyle.textContent = `
            .group-item-label, .nav-group-label, [part="group-label"], .sidenav-group__label {
                font-size: 11px !important;
            }
        `;
        sidenav.shadowRoot.prepend(sidenavStyle);
    }
}
setTimeout(patchSidenavItemIcons, 300);

// ================================================================
// ACCORDION — expand/collapse group rows
// ================================================================

function initAccordion(tbody) {
    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('.group-row');
        if (!row) return;
        toggleGroup(row, tbody);
    });
}

function toggleGroup(groupRow, tbody) {
    const groupId   = groupRow.dataset.group;
    const expanded  = groupRow.dataset.expanded === 'true';
    const icon      = groupRow.querySelector('.expand-cell i');
    const isL1      = groupRow.classList.contains('group-l1');

    // Flip state
    groupRow.dataset.expanded = !expanded;
    if (icon) {
        icon.className = expanded
            ? 'fa-solid fa-chevron-right'
            : 'fa-solid fa-chevron-down';
    }

    if (expanded) {
        // Collapsing L1 hides all direct data rows AND all L2 rows belonging to this group
        tbody.querySelectorAll(`[data-group="${groupId}"]`).forEach(row => {
            if (row === groupRow) return;
            row.style.display = 'none';
        });
        // Also collapse any L2 groups that are children of this L1
        if (isL1) {
            tbody.querySelectorAll(`.group-l2[data-parent="${groupId}"]`).forEach(l2row => {
                l2row.dataset.expanded = 'false';
                const l2icon = l2row.querySelector('.expand-cell i');
                if (l2icon) l2icon.className = 'fa-solid fa-chevron-right';
                // Hide L2 data rows
                const l2id = l2row.dataset.group;
                tbody.querySelectorAll(`[data-group="${l2id}"]`).forEach(r => {
                    if (r !== l2row) r.style.display = 'none';
                });
            });
        }
    } else {
        // Expanding
        tbody.querySelectorAll(`[data-group="${groupId}"]`).forEach(row => {
            if (row === groupRow) return;
            // Only show data rows whose L1 parent is also expanded (for L2 child rows)
            if (row.dataset.parent) {
                const parentRow = tbody.querySelector(`.group-l1[data-group="${row.dataset.parent}"]`);
                if (parentRow && parentRow.dataset.expanded !== 'true') return;
            }
            row.style.display = '';
        });
    }
}

initAccordion(document.getElementById('qualTbody'));
initAccordion(document.getElementById('trainingTbody'));

// ================================================================
// SORT PILLS — sort grouped table rows
// ================================================================

function sortGroupedTbody(tbody, col, dir) {
    const mult = dir === 'asc' ? 1 : -1;
    const hasNesting = !!tbody.querySelector('.group-l1');

    if (col === 'qualification') {
        if (hasNesting) {
            // trainingTbody: reorder L1 blocks; each block = L1 row + all rows with data-parent=L1id
            const l1Rows = Array.from(tbody.querySelectorAll('.group-l1'));
            const blocks = l1Rows.map(l1 => {
                const label = l1.querySelector('.group-label')?.textContent.replace(/^Qualification:\s*/i, '').trim() || '';
                const children = Array.from(tbody.querySelectorAll(`[data-parent="${l1.dataset.group}"]`));
                return { label, rows: [l1, ...children] };
            });
            blocks.sort((a, b) => mult * a.label.localeCompare(b.label));
            blocks.forEach(b => b.rows.forEach(r => tbody.appendChild(r)));
        } else {
            // qualTbody: reorder flat groups; each block = group row + matching data rows
            const groupRows = Array.from(tbody.querySelectorAll('.group-row'));
            const blocks = groupRows.map(gr => {
                const label = gr.querySelector('.group-label')?.textContent.replace(/^Qualification:\s*/i, '').trim() || '';
                const children = Array.from(tbody.querySelectorAll(`.data-row[data-group="${gr.dataset.group}"]`));
                return { label, rows: [gr, ...children] };
            });
            blocks.sort((a, b) => mult * a.label.localeCompare(b.label));
            blocks.forEach(b => b.rows.forEach(r => tbody.appendChild(r)));
        }

    } else if (col === 'requirement') {
        // trainingTbody: within each L1, reorder L2 blocks
        const l1Rows = Array.from(tbody.querySelectorAll('.group-l1'));
        l1Rows.forEach(l1 => {
            const l2Rows = Array.from(tbody.querySelectorAll(`.group-l2[data-parent="${l1.dataset.group}"]`));
            const blocks = l2Rows.map(l2 => {
                const label = l2.querySelector('.group-label-l2')?.textContent.replace(/^Requirement:\s*/i, '').trim() || '';
                const children = Array.from(tbody.querySelectorAll(`.data-row[data-group="${l2.dataset.group}"]`));
                return { label, rows: [l2, ...children] };
            });
            blocks.sort((a, b) => mult * a.label.localeCompare(b.label));
            blocks.forEach(b => b.rows.forEach(r => tbody.appendChild(r)));
        });
    }
}

document.querySelectorAll('.sort-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        const toolbarLeft = pill.closest('.toolbar-left');
        const siblings = toolbarLeft.querySelectorAll('.sort-pill');

        // Toggle direction if this pill is already active, else start asc
        const wasActive = pill.classList.contains('active-sort');
        const dir = wasActive ? (pill.dataset.dir === 'asc' ? 'desc' : 'asc') : 'asc';

        siblings.forEach(s => s.classList.remove('active-sort'));
        pill.classList.add('active-sort');
        pill.dataset.dir = dir;
        const icon = pill.querySelector('i');
        if (icon) icon.className = dir === 'asc' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';

        // Find this pill's tbody and sort it
        const card  = pill.closest('.report-card');
        const tbody = card?.querySelector('tbody');
        if (tbody) sortGroupedTbody(tbody, pill.dataset.col, dir);
    });
});

// ================================================================
// FILTER PANEL — open / close
// ================================================================

const filterPanel      = document.getElementById('filterPanel');
const closePanelBtn    = document.getElementById('closePanelBtn');
const filterToggleBtn  = document.getElementById('filterToggleBtn');

closePanelBtn.addEventListener('click', () => {
    filterPanel.classList.add('collapsed');
    filterToggleBtn.style.display = 'flex';
});

filterToggleBtn.addEventListener('click', () => {
    filterPanel.classList.remove('collapsed');
    filterToggleBtn.style.display = 'none';
});

// ================================================================
// SAVE NEW VIEW DIALOG — Basic Info + Filter Summary
// ================================================================

const saveViewDialog = document.getElementById('saveViewDialog');
const saveNewViewBtn = document.getElementById('saveNewViewBtn');

const FILTER_SUMMARY_ROWS = [
    { icon: 'fa-regular fa-calendar',     label: 'Date Range',       value: '04/01/26 – 04/07/26' },
    { icon: 'fa-solid fa-list',           label: 'Activities (2)',    pills: ['Safety Fundamentals', 'Safety Fundamentals 2'] },
    { icon: 'fa-solid fa-user',           label: 'Users (3)',         pills: ['User Name 1', 'User Name 2', 'User Name 3'] },
    { icon: 'fa-solid fa-tag',            label: 'Status Types',      value: 'All' },
    { icon: 'fa-solid fa-circle-dot',     label: 'Assigned Status',   pills: ['Assigned'] },
    { icon: 'fa-solid fa-table-columns',  label: 'Columns Shown',     value: 'Activity, User, Username, Status, Completion Date' },
];

saveViewDialog.renderer = (root) => {
    if (root.firstChild) return;
    root.style.minWidth = '480px';
    root.style.maxWidth = '560px';

    const subtitle = document.createElement('p');
    subtitle.className = 'sv-dialog-subtitle';
    subtitle.textContent = 'Configure filter settings and meta data for this saved view.';
    root.appendChild(subtitle);

    // ── Basic Information
    const basicHeading = document.createElement('p');
    basicHeading.className = 'sv-section-heading';
    basicHeading.textContent = 'Basic Information';
    root.appendChild(basicHeading);

    const nameField = document.createElement('vaadin-text-field');
    nameField.setAttribute('theme', 'outlined');
    nameField.setAttribute('label', 'Saved View Name');
    nameField.setAttribute('required', '');
    nameField.setAttribute('placeholder', 'e.g. Q4 Compliance Review');
    nameField.style.width = '100%';
    nameField.id = 'saveViewNameField';
    root.appendChild(nameField);

    const descArea = document.createElement('vaadin-text-area');
    descArea.setAttribute('theme', 'outlined');
    descArea.setAttribute('label', 'Saved View Description');
    descArea.setAttribute('placeholder', 'Describe the saved view...');
    descArea.style.cssText = 'width:100%; margin-top:12px';
    root.appendChild(descArea);

    const favRow = document.createElement('label');
    favRow.className = 'sv-fav-row';
    const favCb = document.createElement('vaadin-checkbox');
    favCb.setAttribute('label', 'Favorite this View');
    favRow.appendChild(favCb);
    root.appendChild(favRow);

    const hr = document.createElement('hr');
    hr.className = 'sv-hr';
    root.appendChild(hr);

    // ── Filter Summary (read-only)
    const filterHeading = document.createElement('p');
    filterHeading.className = 'sv-section-heading';
    filterHeading.textContent = 'Filter Summary';
    root.appendChild(filterHeading);

    FILTER_SUMMARY_ROWS.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'sv-filter-row';

        rowEl.innerHTML = `<span class="sv-fr-icon"><i class="${row.icon}"></i></span>
                           <span class="sv-fr-label">${row.label}</span>`;

        if (row.value) {
            const val = document.createElement('span');
            val.className = 'sv-fr-value';
            val.textContent = row.value;
            rowEl.appendChild(val);
        }
        if (row.pills) {
            const pillsEl = document.createElement('div');
            pillsEl.className = 'sv-fr-pills';
            row.pills.forEach(p => {
                const pill = document.createElement('span');
                pill.className = 'sv-pill';
                pill.textContent = p;
                pillsEl.appendChild(pill);
            });
            rowEl.appendChild(pillsEl);
        }
        root.appendChild(rowEl);
    });
};

saveViewDialog.footerRenderer = (root) => {
    if (root.firstChild) return;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { saveViewDialog.opened = false; });

    const createBtn = document.createElement('vaadin-button');
    createBtn.setAttribute('theme', 'primary');
    createBtn.textContent = 'Create Saved View';
    createBtn.addEventListener('click', () => {
        const field = document.getElementById('saveViewNameField');
        if (!field || !field.value.trim()) {
            if (field) { field.invalid = true; field.errorMessage = 'Name is required'; }
            return;
        }
        saveViewDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(createBtn);
};

saveNewViewBtn.addEventListener('click', () => { saveViewDialog.opened = true; });

// ================================================================
// SELECT SAVED VIEW DIALOG — list panel + filter preview panel
// ================================================================

const selectSavedViewDialog = document.getElementById('selectSavedViewDialog');
const applySavedViewBtn     = document.getElementById('applySavedViewBtn');

const SAVED_VIEWS = [
    {
        id: 'q1-compliance', name: 'Q1 Compliance Review',
        report: 'Qualification Report',
        desc: 'Quarterly compliance tracking for all departments',
        dateRange: '01/01/26 – 03/31/26',
        activities: ['Safety Fundamentals', 'Advanced Safety'],
        users: ['User Name 1', 'User Name 2', 'User Name 3'],
        statusTypes: 'All', columns: 'Activity, User, Username, Status, Completion Date',
        activityCount: 2, userCount: 12, favorited: true,
    },
    {
        id: 'confined-space', name: 'Confined Space Teams',
        report: 'Qualification Report',
        desc: 'Tracking for confined space qualification teams',
        dateRange: '04/01/26 – 04/07/26',
        activities: ['Confined Space Entry'],
        users: ['User Name 4', 'User Name 5'],
        statusTypes: 'All', columns: 'Activity, User, Status, Due Date',
        activityCount: 1, userCount: 8, favorited: true,
    },
    {
        id: 'fall-protection', name: 'Fall Protection Group',
        report: 'Qualification Report',
        desc: 'Fall protection certification tracking',
        dateRange: 'All Time',
        activities: ['Fall Protection Training', 'Safety Basics', 'Advanced Safety'],
        users: ['User Name 1', 'User Name 6'],
        statusTypes: 'Completed, In Progress', columns: 'Activity, User, Status',
        activityCount: 3, userCount: 20, favorited: false,
    },
    {
        id: 'crane-ops', name: 'Crane Operations Report',
        report: 'Qualification Report',
        desc: 'Crane operator certification status',
        dateRange: '04/01/26 – 04/07/26',
        activities: ['Crane Operations Training'],
        users: ['User Name 7', 'User Name 8'],
        statusTypes: 'All', columns: 'Activity, User, Status, Completion Date',
        activityCount: 1, userCount: 6, favorited: false,
    },
    {
        id: 'nov-activity', name: 'November Activity Overview',
        report: 'Activity Exception Report',
        desc: 'Activity completion snapshot for November 2025',
        dateRange: '11/01/25 – 11/30/25',
        activities: ['All Activities'],
        users: ['All Users'],
        statusTypes: 'All', columns: 'Activity, User, Status, Completion Date',
        activityCount: 0, userCount: 0, favorited: true,
    },
    {
        id: 'overdue-nov', name: 'Overdue Activities Nov',
        report: 'Activity Exception Report',
        desc: 'Filter showing only overdue activities in November',
        dateRange: '11/01/25 – 11/30/25',
        activities: ['All Activities'],
        users: ['All Users'],
        statusTypes: 'Overdue', columns: 'Activity, User, Status, Next Due Date',
        activityCount: 0, userCount: 0, favorited: false,
    },
];

let selectedSavedViewId = null;

selectSavedViewDialog.renderer = (root) => {
    if (root.firstChild) return;
    /* Fixed width so switching views never resizes the dialog */
    root.style.width = '800px';
    root.style.maxWidth = '100%';
    root.style.boxSizing = 'border-box';

    const subtitle = document.createElement('p');
    subtitle.className = 'sv-dialog-subtitle';
    subtitle.textContent = 'Select a saved view to apply its filters to the current report.';
    root.appendChild(subtitle);

    // Search + sort row
    const searchRow = document.createElement('div');
    searchRow.className = 'sv-search-row';
    searchRow.innerHTML = `
        <div class="sv-search-wrap">
            <i class="fa-solid fa-magnifying-glass sv-search-icon"></i>
            <input class="sv-search-input" id="svSearchInput" type="text" placeholder="Search saved views...">
        </div>
        <select class="sv-sort-select">
            <option>Recently Updated</option>
            <option>Alphabetical</option>
        </select>`;
    root.appendChild(searchRow);

    // Two-panel body
    const body = document.createElement('div');
    body.className = 'sv-two-panel';

    const listPanel = document.createElement('div');
    listPanel.className = 'sv-list-panel';
    listPanel.id = 'svListPanel';

    const previewPanel = document.createElement('div');
    previewPanel.className = 'sv-preview-panel';
    previewPanel.id = 'svPreviewPanel';
    previewPanel.innerHTML = `<div class="sv-preview-empty">
        <i class="fa-regular fa-bookmark sv-preview-empty-icon"></i>
        <p>Select a saved view to preview its filters</p>
    </div>`;

    body.appendChild(listPanel);
    body.appendChild(previewPanel);
    root.appendChild(body);

    buildSavedViewList('');

    searchRow.querySelector('#svSearchInput').addEventListener('input', (e) => {
        buildSavedViewList(e.target.value);
    });
};

function buildSavedViewList(query) {
    const listPanel = document.getElementById('svListPanel');
    if (!listPanel) return;
    listPanel.innerHTML = '';

    const q = query.toLowerCase();
    const filtered = SAVED_VIEWS.filter(v =>
        v.name.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)
    );
    const favorites = filtered.filter(v => v.favorited);
    const rest      = filtered.filter(v => !v.favorited);

    if (favorites.length) {
        listPanel.appendChild(makeSectionLabel('Favorites'));
        favorites.forEach(v => listPanel.appendChild(buildViewCard(v)));
    }
    listPanel.appendChild(makeSectionLabel('All Saved Views'));
    if (rest.length) {
        rest.forEach(v => listPanel.appendChild(buildViewCard(v)));
    } else if (!favorites.length) {
        const empty = document.createElement('p');
        empty.className = 'sv-list-empty';
        empty.textContent = 'No saved views found';
        listPanel.appendChild(empty);
    }
}

function makeSectionLabel(text) {
    const el = document.createElement('div');
    el.className = 'sv-list-section-label';
    el.textContent = text;
    return el;
}

function buildViewCard(view) {
    const card = document.createElement('div');
    card.className = 'sv-card' + (view.id === selectedSavedViewId ? ' selected' : '');
    card.dataset.id = view.id;
    card.innerHTML = `
        <div class="sv-card-header">
            <span class="sv-card-name">${view.name}</span>
            <button class="sv-star-btn ${view.favorited ? 'active' : ''}" data-id="${view.id}">
                <i class="${view.favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
        </div>
        <p class="sv-card-desc">${view.desc}</p>
        <div class="sv-card-meta">
            <span><i class="fa-regular fa-calendar"></i> ${view.dateRange}</span>
            <span>${view.activityCount} Activities</span>
            <span>${view.userCount} Users</span>
        </div>`;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.sv-star-btn')) return;
        selectedSavedViewId = view.id;
        document.querySelectorAll('.sv-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        showViewPreview(view);
        const btn = document.getElementById('selectSavedViewBtn');
        if (btn) btn.disabled = false;
    });

    card.querySelector('.sv-star-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        view.favorited = !view.favorited;
        buildSavedViewList(document.getElementById('svSearchInput')?.value || '');
    });

    return card;
}

function showViewPreview(view) {
    const panel = document.getElementById('svPreviewPanel');
    if (!panel) return;
    panel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'sv-preview-header';
    header.innerHTML = `<span class="sv-preview-name">${view.name}</span>
        <button class="sv-kebab-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>`;
    panel.appendChild(header);

    const rows = [
        { icon: 'fa-regular fa-calendar',    label: 'Date Range',                    value: view.dateRange },
        { icon: 'fa-solid fa-list',           label: `Activities (${view.activityCount})`, pills: view.activities },
        { icon: 'fa-solid fa-user',           label: `Users (${view.userCount})`,    pills: view.users },
        { icon: 'fa-solid fa-tag',            label: 'Status Types',                 value: view.statusTypes },
        { icon: 'fa-solid fa-table-columns',  label: 'Columns Shown',                value: view.columns },
    ];
    rows.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'sv-pf-row';
        rowEl.innerHTML = `<span class="sv-pf-label"><i class="${row.icon}"></i> ${row.label}</span>`;
        if (row.value) {
            const val = document.createElement('span');
            val.className = 'sv-pf-value';
            val.textContent = row.value;
            rowEl.appendChild(val);
        }
        if (row.pills) {
            const pillsEl = document.createElement('div');
            pillsEl.className = 'sv-pf-pills';
            row.pills.forEach(p => {
                const pill = document.createElement('span');
                pill.className = 'sv-pill';
                pill.textContent = p;
                pillsEl.appendChild(pill);
            });
            rowEl.appendChild(pillsEl);
        }
        panel.appendChild(rowEl);
    });
}

selectSavedViewDialog.footerRenderer = (root) => {
    if (root.firstChild) return;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { selectSavedViewDialog.opened = false; });

    const selectBtn = document.createElement('vaadin-button');
    selectBtn.setAttribute('theme', 'primary');
    selectBtn.id = 'selectSavedViewBtn';
    selectBtn.disabled = true;
    selectBtn.textContent = 'Select Saved View';
    selectBtn.addEventListener('click', () => {
        if (!selectedSavedViewId) return;
        const view = SAVED_VIEWS.find(v => v.id === selectedSavedViewId);
        if (view) applyView(view);
        selectSavedViewDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(selectBtn);
};

applySavedViewBtn.addEventListener('click', () => {
    selectedSavedViewId = null;
    selectSavedViewDialog.opened = true;
});

function applyView(view) {
    document.getElementById('appliedBanner').style.display = 'flex';
    document.getElementById('appliedBannerName').textContent = view.name;
    saveNewViewBtn.innerHTML = '<i class="fa-solid fa-rotate" slot="prefix"></i> Update View';
}

document.getElementById('clearAppliedViewBtn').addEventListener('click', () => {
    document.getElementById('appliedBanner').style.display = 'none';
    saveNewViewBtn.innerHTML = '<i class="fa-regular fa-bookmark" slot="prefix"></i> Save New View';
    selectedSavedViewId = null;
});

// ================================================================
// PICKER DIALOGS — Select Qualifications / Activities / Users
// ================================================================

// ── Data ──────────────────────────────────────────────────────────

const QUALIFICATIONS_DATA = [
    { id: 'q1',  name: 'Advanced Shooting Mechanics',      duration: '2h 30m', type: 'Online',    location: 'Bay Area' },
    { id: 'q2',  name: 'Agility and Speed Training',       duration: '1h 45m', type: 'Blended',   location: 'San Francisco' },
    { id: 'q3',  name: 'Championship Mindset',             duration: '3h 00m', type: 'Online',    location: 'All' },
    { id: 'q4',  name: 'Confined Space Entry',             duration: '4h 10m', type: 'Instructor',location: 'Bay Area' },
    { id: 'q5',  name: 'Core Strength Development',        duration: '2h 00m', type: 'Online',    location: 'San Francisco' },
    { id: 'q6',  name: 'Crane Operations Training',        duration: '5h 00m', type: 'Instructor',location: 'Bay Area' },
    { id: 'q7',  name: 'Defensive Positioning Fundamentals',duration: '1h 30m',type: 'Online',    location: 'All' },
    { id: 'q8',  name: 'Fall Protection Training',         duration: '3h 20m', type: 'Blended',   location: 'San Francisco' },
    { id: 'q9',  name: 'First Aid & CPR',                  duration: '6h 00m', type: 'Instructor',location: 'All' },
    { id: 'q10', name: 'Forklift Operator Certification',  duration: '8h 00m', type: 'Instructor',location: 'Bay Area' },
    { id: 'q11', name: 'Game Situation Decision Making',   duration: '2h 15m', type: 'Online',    location: 'All' },
    { id: 'q12', name: 'Hazardous Materials Handling',     duration: '4h 30m', type: 'Blended',   location: 'San Francisco' },
    { id: 'q13', name: 'Injury Prevention Program',        duration: '3h 00m', type: 'Online',    location: 'All' },
    { id: 'q14', name: 'Lock-Out / Tag-Out (LOTO)',        duration: '2h 00m', type: 'Instructor',location: 'Bay Area' },
    { id: 'q15', name: 'Mental Toughness Training',        duration: '1h 00m', type: 'Online',    location: 'All' },
    { id: 'q16', name: 'Motion Offense Principles',        duration: '1h 45m', type: 'Online',    location: 'San Francisco' },
    { id: 'q17', name: 'Offensive Play Recognition',       duration: '2h 30m', type: 'Blended',   location: 'All' },
    { id: 'q18', name: 'Pick and Roll Execution',          duration: '1h 30m', type: 'Online',    location: 'Bay Area' },
    { id: 'q19', name: 'Scaffolding Safety',               duration: '3h 00m', type: 'Instructor',location: 'San Francisco' },
    { id: 'q20', name: 'Team Leadership Development',      duration: '2h 00m', type: 'Online',    location: 'All' },
];

const ACTIVITIES_DATA = [
    { id: 'a1',  name: 'Advanced Shooting Mechanics',      duration: '2h 30m', type: 'Online',    location: 'Bay Area' },
    { id: 'a2',  name: 'Agility and Speed Training',       duration: '1h 45m', type: 'Blended',   location: 'San Francisco' },
    { id: 'a3',  name: 'Championship Mindset',             duration: '3h 00m', type: 'Online',    location: 'All' },
    { id: 'a4',  name: 'Communication on Court',           duration: '1h 00m', type: 'Online',    location: 'Bay Area' },
    { id: 'a5',  name: 'Core Strength Development',        duration: '2h 00m', type: 'Blended',   location: 'San Francisco' },
    { id: 'a6',  name: 'Defensive Positioning Fundamentals',duration:'1h 30m', type: 'Online',    location: 'All' },
    { id: 'a7',  name: 'Endurance and Stamina Building',   duration: '4h 00m', type: 'Instructor',location: 'Bay Area' },
    { id: 'a8',  name: 'Fast Break Strategies',            duration: '1h 15m', type: 'Online',    location: 'San Francisco' },
    { id: 'a9',  name: 'Game Situation Decision Making',   duration: '2h 15m', type: 'Online',    location: 'All' },
    { id: 'a10', name: 'Help Defense Rotations',           duration: '1h 30m', type: 'Blended',   location: 'Bay Area' },
    { id: 'a11', name: 'Injury Prevention Program',        duration: '3h 00m', type: 'Online',    location: 'All' },
    { id: 'a12', name: 'Mental Toughness Training',        duration: '1h 00m', type: 'Online',    location: 'San Francisco' },
    { id: 'a13', name: 'Motion Offense Principles',        duration: '1h 45m', type: 'Online',    location: 'All' },
    { id: 'a14', name: 'Offensive Play Recognition',       duration: '2h 30m', type: 'Blended',   location: 'Bay Area' },
    { id: 'a15', name: 'Pick and Roll Execution',          duration: '1h 30m', type: 'Online',    location: 'San Francisco' },
    { id: 'a16', name: 'Plyometric Exercises',             duration: '0h 45m', type: 'Online',    location: 'All' },
    { id: 'a17', name: 'Pressure Management',              duration: '1h 00m', type: 'Blended',   location: 'Bay Area' },
    { id: 'a18', name: 'Team Leadership Development',      duration: '2h 00m', type: 'Online',    location: 'All' },
    { id: 'a19', name: 'Transition Defense',               duration: '1h 30m', type: 'Online',    location: 'San Francisco' },
    { id: 'a20', name: 'Zone Defense Tactics',             duration: '1h 15m', type: 'Blended',   location: 'Bay Area' },
];

const USERS_DATA = [
    { id: 'u1',  username: 'AnthonyDavis',    firstName: 'Anthony',  lastName: 'Davis',      location: 'Bay Area' },
    { id: 'u2',  username: 'BrandinPodziemski',firstName: 'Brandin', lastName: 'Podziemski', location: 'San Francisco' },
    { id: 'u3',  username: 'DAngeloRussell',  firstName: "D'Angelo", lastName: 'Russell',    location: 'Bay Area' },
    { id: 'u4',  username: 'DarvinHam',       firstName: 'Darvin',   lastName: 'Ham',        location: 'All' },
    { id: 'u5',  username: 'DraymondGreen',   firstName: 'Draymond', lastName: 'Green',      location: 'Bay Area' },
    { id: 'u6',  username: 'FredVanVleet',    firstName: 'Fred',     lastName: 'VanVleet',   location: 'San Francisco' },
    { id: 'u7',  username: 'GaryPaytonII',    firstName: 'Gary',     lastName: 'Payton II',  location: 'Bay Area' },
    { id: 'u8',  username: 'JalenGreen',      firstName: 'Jalen',    lastName: 'Green',      location: 'San Francisco' },
    { id: 'u9',  username: 'JarredVanderbilt',firstName: 'Jarred',   lastName: 'Vanderbilt', location: 'Bay Area' },
    { id: 'u10', username: 'KlayThompson',    firstName: 'Klay',     lastName: 'Thompson',   location: 'Bay Area' },
    { id: 'u11', username: 'LeBronJames',     firstName: 'LeBron',   lastName: 'James',      location: 'San Francisco' },
    { id: 'u12', username: 'MikeBrown',       firstName: 'Mike',     lastName: 'Brown',      location: 'All' },
    { id: 'u13', username: 'QuentinPost',     firstName: 'Quentin',  lastName: 'Post',       location: 'Bay Area' },
    { id: 'u14', username: 'AlperenSengun',   firstName: 'Alperen',  lastName: 'Sengun',     location: 'San Francisco' },
    { id: 'u15', username: 'AustinReaves',    firstName: 'Austin',   lastName: 'Reaves',     location: 'Bay Area' },
    { id: 'u16', username: 'AndreIguodala',   firstName: 'Andre',    lastName: 'Iguodala',   location: 'All' },
    { id: 'u17', username: 'RuiHachimura',    firstName: 'Rui',      lastName: 'Hachimura',  location: 'San Francisco' },
    { id: 'u18', username: 'AndrewWiggins',   firstName: 'Andrew',   lastName: 'Wiggins',    location: 'Bay Area' },
    { id: 'u19', username: 'StephenCurry',    firstName: 'Stephen',  lastName: 'Curry',      location: 'Bay Area' },
    { id: 'u20', username: 'SteveKerr',       firstName: 'Steve',    lastName: 'Kerr',       location: 'All' },
];

// ── Qualification ↔ User assignment map ───────────────────────────
// Maps qualification ID → array of user IDs who have it assigned

const QUAL_USER_ASSIGNMENTS = {
    'q1':  ['u1', 'u5', 'u10', 'u13', 'u19'],
    'q2':  ['u2', 'u6', 'u11', 'u14'],
    'q3':  ['u3', 'u4', 'u7', 'u12', 'u16', 'u20'],
    'q4':  ['u1', 'u9', 'u13', 'u18'],
    'q5':  ['u5', 'u10', 'u15', 'u19'],
    'q6':  ['u1', 'u7', 'u9', 'u13'],
    'q7':  ['u2', 'u5', 'u6', 'u11', 'u14', 'u17'],
    'q8':  ['u3', 'u8', 'u12', 'u16'],
    'q9':  ['u4', 'u9', 'u13', 'u18', 'u20'],
    'q10': ['u1', 'u7', 'u13', 'u18'],
    'q11': ['u2', 'u6', 'u14', 'u19'],
    'q12': ['u3', 'u8', 'u11', 'u15'],
    'q13': ['u4', 'u9', 'u12', 'u16', 'u20'],
    'q14': ['u1', 'u5', 'u13', 'u18'],
    'q15': ['u2', 'u7', 'u10', 'u14', 'u19'],
    'q16': ['u3', 'u6', 'u11', 'u17'],
    'q17': ['u4', 'u8', 'u12', 'u15', 'u20'],
    'q18': ['u1', 'u5', 'u9', 'u13'],
    'q19': ['u2', 'u7', 'u11', 'u16'],
    'q20': ['u3', 'u8', 'u12', 'u14', 'u18'],
};

// ── Selection state ────────────────────────────────────────────────

const pickerState = {
    quals:       new Set(),  // selected IDs for qual report qualifications
    qualUsers:   new Set(),  // selected IDs for qual report users
    actExActs:   new Set(),  // selected IDs for actEx activities
    actExUsers:  new Set(),  // selected IDs for actEx users
};

// ── Chip rendering ─────────────────────────────────────────────────

function renderChips(containerEl, labelEl, items, selectedIds, baseLabel, onRemove) {
    containerEl.innerHTML = '';
    if (selectedIds.size === 0) {
        labelEl.textContent = baseLabel;
        return;
    }
    labelEl.textContent = `${baseLabel} (${selectedIds.size})`;
    selectedIds.forEach(id => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const name = item.name || `${item.firstName} ${item.lastName}`;
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<span>${name}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'filter-chip-remove';
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.addEventListener('click', () => {
            selectedIds.delete(id);
            renderChips(containerEl, labelEl, items, selectedIds, baseLabel, onRemove);
            if (onRemove) onRemove();
        });
        chip.appendChild(removeBtn);
        containerEl.appendChild(chip);
    });
}

// ── Generic table-based picker builder ────────────────────────────

function buildPickerDialog(config) {
    /*
     * config = {
     *   dialog,           // vaadin-dialog element
     *   openBtn / openBtns, // button(s) that open it
     *   data,             // array of item objects
     *   selectedIds,      // Set<string> — shared state
     *   columns,          // [{key, label, render?}]
     *   nameKey,          // key for the right-panel card title
     *   typeLabel,        // string shown under name in right panel ("Activity", "User", etc.)
     *   addLabel,         // "Add N Activities" etc. (N replaced at runtime)
     *   hasViewSelect,    // bool — show "View by Assignee Type" dropdown
     *   chipsContainerId, // id of chips div in filter panel
     *   filterLabelId,    // id of label el in filter panel
     *   baseFilterLabel,  // e.g. "Qualifications"
     *   getCrossFilter,   // () => { ids: Set<string>, sourceCount: number, sourceLabel: string } | null
     *                     //   When non-null, table is pre-filtered to these IDs and a banner is shown
     * }
     */
    const PAGE_SIZE = 20;
    let currentPage = 0;
    let searchQuery = '';
    let selectedIds = config.selectedIds; // reference to shared Set

    // Returns { baseData, crossFilter } where baseData is data after cross-filter applied
    function getCrossFilteredBase() {
        if (!config.getCrossFilter) return { baseData: config.data, crossFilter: null };
        const cf = config.getCrossFilter();
        if (!cf || cf.ids.size === 0) return { baseData: config.data, crossFilter: null };
        return {
            baseData: config.data.filter(item => cf.ids.has(item.id)),
            crossFilter: cf,
        };
    }

    function filteredData() {
        const { baseData } = getCrossFilteredBase();
        const q = searchQuery.toLowerCase();
        if (!q) return baseData;
        return baseData.filter(item => {
            return config.columns.some(col => {
                const val = item[col.key];
                return val && String(val).toLowerCase().includes(q);
            }) || (item.name || `${item.firstName||''} ${item.lastName||''}`).toLowerCase().includes(q);
        });
    }

    function rebuildDialog() {
        // Force renderer to re-run by clearing and reopening
        // Instead we update the mutable parts directly
        refreshTable();
        refreshRightPanel();
        refreshFooter();
    }

    let rootRef = null;

    config.dialog.renderer = (root) => {
        if (root.firstChild) return;
        rootRef = root;
        root.style.minWidth = '0';

        const subtitle = document.createElement('p');
        subtitle.className = 'sv-dialog-subtitle';
        subtitle.textContent = config.subtitle || 'Browse and select items to apply as filters.';
        root.appendChild(subtitle);

        const outer = document.createElement('div');
        outer.className = 'picker-outer';
        outer.id = `${config.idPrefix}-outer`;
        root.appendChild(outer);

        // ── Left panel
        const left = document.createElement('div');
        left.className = 'picker-left';
        left.id = `${config.idPrefix}-left`;

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'picker-toolbar';

        const searchWrap = document.createElement('div');
        searchWrap.className = 'picker-search-wrap';
        searchWrap.innerHTML = '<i class="fa-solid fa-magnifying-glass picker-search-icon"></i>';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'picker-search-input';
        searchInput.placeholder = 'Search...';
        searchInput.id = `${config.idPrefix}-search`;
        searchWrap.appendChild(searchInput);
        toolbar.appendChild(searchWrap);

        if (config.hasViewSelect) {
            const viewSel = document.createElement('select');
            viewSel.className = 'picker-view-select';
            ['Users', 'Groups', 'Teams', 'Departments'].forEach(opt => {
                const o = document.createElement('option');
                o.textContent = opt;
                viewSel.appendChild(o);
            });
            toolbar.appendChild(viewSel);
        }

        left.appendChild(toolbar);

        // Cross-filter banner (hidden initially, shown when getCrossFilter returns data)
        if (config.getCrossFilter) {
            const banner = document.createElement('div');
            banner.className = 'picker-xf-banner';
            banner.id = `${config.idPrefix}-xf-banner`;
            banner.style.display = 'none';
            banner.innerHTML = `
                <i class="fa-solid fa-filter picker-xf-icon"></i>
                <span class="picker-xf-text" id="${config.idPrefix}-xf-text"></span>`;
            left.appendChild(banner);
        }

        // Table
        const tableWrap = document.createElement('div');
        tableWrap.className = 'picker-table-wrap';
        const table = document.createElement('table');
        table.className = 'picker-table';
        table.id = `${config.idPrefix}-table`;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Checkbox header
        const thCheck = document.createElement('th');
        thCheck.className = 'th-check';
        const allCb = document.createElement('vaadin-checkbox');
        allCb.id = `${config.idPrefix}-all-cb`;
        thCheck.appendChild(allCb);
        headerRow.appendChild(thCheck);

        config.columns.forEach((col, idx) => {
            const th = document.createElement('th');
            if (col.isAction) {
                th.className = 'th-action';
                th.textContent = '';
            } else {
                const sortLabel = document.createElement('span');
                sortLabel.className = 'picker-sort-label';
                sortLabel.innerHTML = `${col.label}${idx === 0 ? ' <i class="fa-solid fa-arrow-up"></i>' : ''}`;
                th.appendChild(sortLabel);
            }
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.id = `${config.idPrefix}-tbody`;
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        left.appendChild(tableWrap);

        // Paginator
        const paginator = document.createElement('div');
        paginator.className = 'picker-paginator';
        paginator.id = `${config.idPrefix}-paginator`;
        paginator.innerHTML = `
            <span class="picker-page-size-label">Page Size</span>
            <select class="picker-page-size-select" id="${config.idPrefix}-page-size">
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <span class="picker-range" id="${config.idPrefix}-range"></span>
            <div class="picker-page-nav">
                <button class="picker-page-btn" id="${config.idPrefix}-first" title="First page"><i class="fa-solid fa-angles-left"></i></button>
                <button class="picker-page-btn" id="${config.idPrefix}-prev"  title="Previous"><i class="fa-solid fa-angle-left"></i></button>
                <span class="picker-page-info" id="${config.idPrefix}-page-info"></span>
                <button class="picker-page-btn" id="${config.idPrefix}-next"  title="Next"><i class="fa-solid fa-angle-right"></i></button>
                <button class="picker-page-btn" id="${config.idPrefix}-last"  title="Last page"><i class="fa-solid fa-angles-right"></i></button>
            </div>`;
        left.appendChild(paginator);

        outer.appendChild(left);

        // ── Right panel (always visible — fixed width keeps modal stable)
        const right = document.createElement('div');
        right.className = 'picker-right';
        right.id = `${config.idPrefix}-right`;

        right.innerHTML = `
            <div class="picker-right-header">
                <span class="picker-right-title">Selected ${config.typeLabel}s</span>
                <span class="picker-right-count" id="${config.idPrefix}-count">0</span>
            </div>
            <div class="picker-right-search-wrap">
                <i class="fa-solid fa-magnifying-glass picker-right-search-icon"></i>
                <input class="picker-right-search" id="${config.idPrefix}-right-search" type="text" placeholder="Search selected...">
            </div>
            <div class="picker-selected-list" id="${config.idPrefix}-selected-list"></div>`;
        outer.appendChild(right);

        // ── Wire events
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            currentPage = 0;
            refreshTable();
        });

        allCb.addEventListener('checked-changed', (e) => {
            const visible = filteredData().slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
            visible.forEach(item => {
                if (e.detail.value) selectedIds.add(item.id);
                else selectedIds.delete(item.id);
            });
            refreshTable();
            refreshRightPanel();
            refreshFooter();
        });

        root.querySelectorAll(`#${config.idPrefix}-first, #${config.idPrefix}-prev, #${config.idPrefix}-next, #${config.idPrefix}-last`).forEach(btn => {
            btn.addEventListener('click', () => {
                const total = filteredData().length;
                const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                if (btn.id.endsWith('-first')) currentPage = 0;
                if (btn.id.endsWith('-prev'))  currentPage = Math.max(0, currentPage - 1);
                if (btn.id.endsWith('-next'))  currentPage = Math.min(pages - 1, currentPage + 1);
                if (btn.id.endsWith('-last'))  currentPage = pages - 1;
                refreshTable();
            });
        });

        root.querySelector(`#${config.idPrefix}-right-search`)?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            root.querySelectorAll(`#${config.idPrefix}-selected-list .picker-sel-card`).forEach(card => {
                const nameEl = card.querySelector('.picker-sel-name');
                card.style.display = (!q || nameEl?.textContent.toLowerCase().includes(q)) ? '' : 'none';
            });
        });

        refreshTable();
        refreshRightPanel();
        refreshFooter();
    };

    function refreshTable() {
        const tbody = document.getElementById(`${config.idPrefix}-tbody`);
        const rangeEl = document.getElementById(`${config.idPrefix}-range`);
        const pageInfoEl = document.getElementById(`${config.idPrefix}-page-info`);
        const firstBtn = document.getElementById(`${config.idPrefix}-first`);
        const prevBtn  = document.getElementById(`${config.idPrefix}-prev`);
        const nextBtn  = document.getElementById(`${config.idPrefix}-next`);
        const lastBtn  = document.getElementById(`${config.idPrefix}-last`);
        if (!tbody) return;

        const data = filteredData();
        const total = data.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage >= pages) currentPage = pages - 1;
        const start = currentPage * PAGE_SIZE;
        const end   = Math.min(start + PAGE_SIZE, total);
        const pageItems = data.slice(start, end);

        tbody.innerHTML = '';
        pageItems.forEach(item => {
            const tr = document.createElement('tr');
            if (selectedIds.has(item.id)) tr.classList.add('picker-row-selected');

            const tdCheck = document.createElement('td');
            tdCheck.className = 'td-check';
            const cb = document.createElement('vaadin-checkbox');
            cb.checked = selectedIds.has(item.id);
            tdCheck.appendChild(cb);
            tr.appendChild(tdCheck);

            config.columns.forEach(col => {
                const td = document.createElement('td');
                if (col.isAction) {
                    td.className = 'td-action';
                    const btn = document.createElement('button');
                    btn.className = 'picker-view-details';
                    btn.textContent = 'View Details';
                    btn.addEventListener('click', (e) => e.stopPropagation());
                    td.appendChild(btn);
                } else if (col.key === (config.nameKey || config.columns[0].key)) {
                    td.className = 'picker-name-col';
                    td.textContent = item[col.key] || (col.render ? col.render(item) : '');
                } else {
                    td.textContent = item[col.key] || (col.render ? col.render(item) : '');
                }
                tr.appendChild(td);
            });

            // Row click = toggle selection
            tr.addEventListener('click', (e) => {
                if (e.target.closest('vaadin-checkbox') || e.target.closest('.picker-view-details')) return;
                cb.checked = !cb.checked;
                if (cb.checked) selectedIds.add(item.id);
                else selectedIds.delete(item.id);
                tr.classList.toggle('picker-row-selected', cb.checked);
                refreshRightPanel();
                refreshFooter();
            });
            cb.addEventListener('checked-changed', (e) => {
                if (e.detail.value) selectedIds.add(item.id);
                else selectedIds.delete(item.id);
                tr.classList.toggle('picker-row-selected', e.detail.value);
                refreshRightPanel();
                refreshFooter();
            });

            tbody.appendChild(tr);
        });

        if (rangeEl)    rangeEl.textContent = total ? `${start + 1} to ${end} of ${total}` : '0 results';
        if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage + 1} of ${pages}`;
        if (firstBtn) firstBtn.disabled = currentPage === 0;
        if (prevBtn)  prevBtn.disabled  = currentPage === 0;
        if (nextBtn)  nextBtn.disabled  = currentPage >= pages - 1;
        if (lastBtn)  lastBtn.disabled  = currentPage >= pages - 1;

        // Update cross-filter banner
        const banner  = document.getElementById(`${config.idPrefix}-xf-banner`);
        const bannerText = document.getElementById(`${config.idPrefix}-xf-text`);
        if (banner && bannerText) {
            const { baseData, crossFilter } = getCrossFilteredBase();
            if (crossFilter) {
                const visibleCount = baseData.length;
                const totalCount   = config.data.length;
                const hidden       = totalCount - visibleCount;
                bannerText.textContent =
                    `Filtered by ${crossFilter.sourceCount} selected ${crossFilter.sourceLabel}${crossFilter.sourceCount !== 1 ? 's' : ''} — showing ${visibleCount} of ${totalCount} ${config.typeLabel}${totalCount !== 1 ? 's' : ''} (${hidden} hidden)`;
                banner.style.display = '';
            } else {
                banner.style.display = 'none';
            }
        }
    }

    function refreshRightPanel() {
        const countEl = document.getElementById(`${config.idPrefix}-count`);
        const list = document.getElementById(`${config.idPrefix}-selected-list`);
        if (!list) return;

        if (countEl) countEl.textContent = selectedIds.size;

        list.innerHTML = '';

        if (selectedIds.size === 0) {
            list.innerHTML = `<div class="picker-right-empty">
                <i class="fa-regular fa-square-check picker-right-empty-icon"></i>
                <p>Select items from the table to add them here.</p>
            </div>`;
            return;
        }

        selectedIds.forEach(id => {
            const item = config.data.find(i => i.id === id);
            if (!item) return;
            const name = item[config.nameKey] || `${item.firstName || ''} ${item.lastName || ''}`.trim();

            const card = document.createElement('div');
            card.className = 'picker-sel-card';
            card.innerHTML = `
                <div class="picker-sel-card-body">
                    <div class="picker-sel-name">${name}</div>
                    <div class="picker-sel-type">${config.typeLabel}</div>
                    <button class="picker-sel-detail-btn">View Details</button>
                </div>`;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'picker-sel-remove';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.addEventListener('click', () => {
                selectedIds.delete(id);
                refreshTable();
                refreshRightPanel();
                refreshFooter();
            });
            card.appendChild(removeBtn);
            list.appendChild(card);
        });
    }

    function refreshFooter() {
        const addBtn = document.getElementById(`${config.idPrefix}-add-btn`);
        if (!addBtn) return;
        const n = selectedIds.size;
        addBtn.disabled = n === 0;
        addBtn.textContent = n > 0 ? `Add ${n} ${config.typeLabel}${n !== 1 ? 's' : ''}` : `Add ${config.addLabel}`;
    }

    config.dialog.footerRenderer = (root) => {
        if (root.firstChild) return;

        const prevBtn = document.createElement('vaadin-button');
        prevBtn.setAttribute('theme', 'secondary');
        prevBtn.disabled = true;
        prevBtn.textContent = 'Previous';

        const addBtn = document.createElement('vaadin-button');
        addBtn.setAttribute('theme', 'primary');
        addBtn.id = `${config.idPrefix}-add-btn`;
        addBtn.disabled = true;
        addBtn.textContent = `Add ${config.addLabel}`;

        addBtn.addEventListener('click', () => {
            config.dialog.opened = false;
            // Refresh chips in filter panel
            const chipsEl  = document.getElementById(config.chipsContainerId);
            const labelEl  = document.getElementById(config.filterLabelId);
            if (chipsEl && labelEl) {
                renderChips(chipsEl, labelEl, config.data, selectedIds, config.baseFilterLabel);
            }
        });

        root.appendChild(prevBtn);
        root.appendChild(addBtn);
    };

    // Wire open buttons
    const openBtns = config.openBtns || (config.openBtn ? [config.openBtn] : []);
    openBtns.forEach(btn => {
        btn?.addEventListener('click', () => {
            searchQuery = '';
            currentPage = 0;
            // Reset and reopen renderer
            config.dialog.opened = true;
            // Reset search field if already rendered
            const searchEl = document.getElementById(`${config.idPrefix}-search`);
            if (searchEl) { searchEl.value = ''; refreshTable(); refreshRightPanel(); refreshFooter(); }
        });
    });
}

// ── Wire up all picker dialogs ─────────────────────────────────────

buildPickerDialog({
    dialog:            document.getElementById('selectQualsDialog'),
    idPrefix:          'quals',
    openBtn:           document.getElementById('selectQualsBtn'),
    data:              QUALIFICATIONS_DATA,
    selectedIds:       pickerState.quals,
    nameKey:           'name',
    typeLabel:         'Qualification',
    addLabel:          'Qualifications',
    subtitle:          'Search and select qualifications to filter the report.',
    columns: [
        { key: 'name',     label: 'Qualification Name' },
        { key: 'duration', label: 'Duration' },
        { key: 'type',     label: 'Type' },
        { key: 'location', label: 'Location' },
        { isAction: true },
    ],
    chipsContainerId:  'qualChips',
    filterLabelId:     'qualFilterLabel',
    baseFilterLabel:   'Qualifications',
    getCrossFilter: () => {
        if (pickerState.qualUsers.size === 0) return null;
        // Build set of qual IDs that any selected user has assigned
        const qualIds = new Set();
        Object.entries(QUAL_USER_ASSIGNMENTS).forEach(([qualId, userIds]) => {
            if (userIds.some(uid => pickerState.qualUsers.has(uid))) qualIds.add(qualId);
        });
        return { ids: qualIds, sourceCount: pickerState.qualUsers.size, sourceLabel: 'User' };
    },
});

buildPickerDialog({
    dialog:            document.getElementById('selectActivitiesDialog'),
    idPrefix:          'actexacts',
    openBtn:           document.getElementById('actExSelectActivitiesBtn'),
    data:              ACTIVITIES_DATA,
    selectedIds:       pickerState.actExActs,
    nameKey:           'name',
    typeLabel:         'Activity',
    addLabel:          'Activities',
    subtitle:          'Search and select activities to filter the report.',
    columns: [
        { key: 'name',     label: 'Activity Name' },
        { key: 'duration', label: 'Duration' },
        { key: 'type',     label: 'Type' },
        { key: 'location', label: 'Location' },
        { isAction: true },
    ],
    chipsContainerId:  'actExActivitiesChips',
    filterLabelId:     'actExActivitiesFilterLabel',
    baseFilterLabel:   'Activities',
});

buildPickerDialog({
    dialog:            document.getElementById('selectUsersDialog'),
    idPrefix:          'users',
    openBtn:           document.getElementById('selectUsersBtn'),
    data:              USERS_DATA,
    selectedIds:       pickerState.qualUsers,
    nameKey:           'username',
    typeLabel:         'User',
    addLabel:          'Users',
    hasViewSelect:     true,
    subtitle:          'Search and select users to filter the report.',
    columns: [
        { key: 'username',  label: 'Username' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName',  label: 'Last Name' },
        { key: 'location',  label: 'Location' },
        { isAction: true },
    ],
    chipsContainerId:  'qualUsersChips',
    filterLabelId:     'qualUsersFilterLabel',
    baseFilterLabel:   'Users',
    getCrossFilter: () => {
        if (pickerState.quals.size === 0) return null;
        // Build set of user IDs assigned to any selected qualification
        const userIds = new Set();
        pickerState.quals.forEach(qualId => {
            (QUAL_USER_ASSIGNMENTS[qualId] || []).forEach(uid => userIds.add(uid));
        });
        return { ids: userIds, sourceCount: pickerState.quals.size, sourceLabel: 'Qualification' };
    },
});

buildPickerDialog({
    dialog:            document.getElementById('selectActExUsersDialog'),
    idPrefix:          'actexusers',
    openBtn:           document.getElementById('actExSelectUsersBtn'),
    data:              USERS_DATA,
    selectedIds:       pickerState.actExUsers,
    nameKey:           'username',
    typeLabel:         'User',
    addLabel:          'Users',
    hasViewSelect:     true,
    subtitle:          'Search and select users to filter the report.',
    columns: [
        { key: 'username',  label: 'Username' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName',  label: 'Last Name' },
        { key: 'location',  label: 'Location' },
        { isAction: true },
    ],
    chipsContainerId:  'actExUsersChips',
    filterLabelId:     'actExUsersFilterLabel',
    baseFilterLabel:   'Users',
});

// ================================================================
// APPLY FILTERS button (demo — just closes panel on mobile-ish)
// ================================================================

document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    // Prototype: just visual feedback
    const btn = document.getElementById('applyFiltersBtn');
    const orig = btn.textContent;
    btn.textContent = 'Filters Applied';
    setTimeout(() => { btn.textContent = orig; }, 1500);
});

// ================================================================
// SEARCH — basic client-side row filter per table
// ================================================================

function initTableSearch(inputId, tbodyId) {
    const input = document.getElementById(inputId);
    const tbody = document.getElementById(tbodyId);
    if (!input || !tbody) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        tbody.querySelectorAll('.group-row').forEach(groupRow => {
            const groupId = groupRow.dataset.group;
            if (!groupId) return;

            const dataRows = tbody.querySelectorAll(`.data-row[data-group="${groupId}"]`);
            let anyMatch = false;
            dataRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const match = !q || text.includes(q);
                // Only affect visibility if the group is expanded
                const expanded = groupRow.dataset.expanded === 'true';
                if (expanded) row.style.display = match ? '' : 'none';
                if (match) anyMatch = true;
            });

            // Also match on the group label itself
            const groupText = groupRow.textContent.toLowerCase();
            if (groupText.includes(q)) anyMatch = true;

            groupRow.style.display = (!q || anyMatch) ? '' : 'none';
        });
    });
}

initTableSearch('qualSearch', 'qualTbody');
initTableSearch('trainingSearch', 'trainingTbody');

// ================================================================
// ACTIVITY EXCEPTION REPORT — chart toggle + filter panel
// ================================================================

// Chart type toggle (Pie / Bar / Line)
document.querySelector('#actExLayout')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.chart-type-btn');
    if (!btn) return;

    const chartType = btn.dataset.chart;
    const vizCard   = btn.closest('.report-card');

    // Update active button
    vizCard.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show matching chart view
    document.getElementById('actExPieView').style.display  = chartType === 'pie'  ? '' : 'none';
    document.getElementById('actExBarView').style.display  = chartType === 'bar'  ? '' : 'none';
    document.getElementById('actExLineView').style.display = chartType === 'line' ? '' : 'none';
});

// Filter panel open/close
const actExFilterPanel  = document.getElementById('actExFilterPanel');
const actExFilterToggle = document.getElementById('actExFilterToggle');
const actExClosePanelBtn = document.getElementById('actExClosePanelBtn');

actExClosePanelBtn?.addEventListener('click', () => {
    actExFilterPanel.classList.add('collapsed');
    actExFilterToggle.style.display = 'flex';
});

actExFilterToggle?.addEventListener('click', () => {
    actExFilterPanel.classList.remove('collapsed');
    actExFilterToggle.style.display = 'none';
});

// Wire actEx Save View / Apply Saved View to the same dialogs
document.getElementById('actExSaveViewBtn')?.addEventListener('click', () => {
    document.getElementById('saveViewDialog').opened = true;
});
document.getElementById('actExApplySavedViewBtn')?.addEventListener('click', () => {
    document.getElementById('selectSavedViewDialog').opened = true;
});

// ================================================================
// LOCATION DROPDOWN — trigger open/close + tree select
// ================================================================

const locTrigger = document.getElementById('locTrigger');
const locPanel   = document.getElementById('locPanel');
const locLabel   = document.getElementById('locTriggerLabel');

locTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = locPanel.style.display !== 'none';
    locPanel.style.display = open ? 'none' : '';
    locTrigger.classList.toggle('open', !open);
});

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (!document.getElementById('locDropdown')?.contains(e.target)) {
        locPanel.style.display = 'none';
        locTrigger?.classList.remove('open');
    }
});

// Tree interaction: expand/collapse chevrons + select rows
document.getElementById('locPanel')?.addEventListener('click', (e) => {
    const chevronBtn = e.target.closest('.loc-chevron');
    if (chevronBtn) {
        e.stopPropagation();
        const children = document.getElementById(chevronBtn.dataset.controls);
        if (!children) return;
        const isHidden = children.style.display === 'none';
        children.style.display = isHidden ? '' : 'none';
        chevronBtn.querySelector('i').className = isHidden
            ? 'fa-solid fa-chevron-down'
            : 'fa-solid fa-chevron-right';
        return;
    }
    const row = e.target.closest('.loc-row');
    if (!row) return;
    document.querySelectorAll('#locTree .loc-row').forEach(r => r.classList.remove('loc-selected'));
    row.classList.add('loc-selected');
    const name = row.querySelector('.loc-row-name')?.textContent.trim() || 'All';
    if (locLabel) locLabel.textContent = name;
    locPanel.style.display = 'none';
    locTrigger?.classList.remove('open');
});

// ================================================================
// MANAGE SAVED VIEWS PAGE
// ================================================================

function renderManageSavedViews() {
    const tbody = document.getElementById('msvTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    SAVED_VIEWS.forEach(view => {
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        tr.dataset.id = view.id;
        tr.innerHTML = `
            <td>
                <button class="msv-star ${view.favorited ? 'active' : ''}" data-id="${view.id}" title="Toggle favorite">
                    <i class="${view.favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </button>
            </td>
            <td class="msv-name-cell">
                <span class="msv-view-name">${view.name}</span>
            </td>
            <td><span class="msv-report-badge">${view.report}</span></td>
            <td class="msv-desc">${view.desc}</td>
            <td>${view.dateRange}</td>
            <td>
                <div class="msv-actions">
                    <vaadin-button theme="tertiary small" class="msv-edit-btn" data-id="${view.id}">
                        <i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit
                    </vaadin-button>
                    <vaadin-button theme="tertiary small msv-delete" class="msv-delete-btn" data-id="${view.id}">
                        <i class="fa-regular fa-trash-can" slot="prefix"></i> Delete
                    </vaadin-button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Star toggle
    tbody.querySelectorAll('.msv-star').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = SAVED_VIEWS.find(v => v.id === btn.dataset.id);
            if (!view) return;
            view.favorited = !view.favorited;
            btn.classList.toggle('active', view.favorited);
            btn.querySelector('i').className = view.favorited ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
    });

    // Delete
    tbody.querySelectorAll('.msv-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = SAVED_VIEWS.findIndex(v => v.id === btn.dataset.id);
            if (idx === -1) return;
            const row = btn.closest('tr');
            row.classList.add('msv-removing');
            setTimeout(() => {
                SAVED_VIEWS.splice(idx, 1);
                renderManageSavedViews();
            }, 250);
        });
    });

    // Edit — opens save view dialog for now
    tbody.querySelectorAll('.msv-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('saveViewDialog').opened = true;
        });
    });
}

// Render when the manage page is first shown
document.addEventListener('DOMContentLoaded', () => {
    renderManageSavedViews();

    // Report filter dropdown
    document.getElementById('msvReportFilter')?.addEventListener('change', applyMsvFilters);

    // Search filter
    document.getElementById('msvSearch')?.addEventListener('input', applyMsvFilters);

    function applyMsvFilters() {
        const reportFilter = document.getElementById('msvReportFilter')?.value ?? '';
        const q = document.getElementById('msvSearch')?.value.trim().toLowerCase() ?? '';

        document.querySelectorAll('#msvTbody .data-row').forEach(row => {
            const reportCell = row.querySelector('td:nth-child(3)')?.textContent.trim() ?? '';
            const matchReport = !reportFilter || reportCell === reportFilter;
            const matchSearch = !q || row.textContent.toLowerCase().includes(q);
            row.style.display = (matchReport && matchSearch) ? '' : 'none';
        });
    }
});

// Also re-render whenever sidenav navigates to it
reportsSidenav.addEventListener('item-click', (e) => {
    if (e.detail.id === 'manage-saved-views') renderManageSavedViews();
}, { capture: false });
