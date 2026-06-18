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
    'scheduled-reports':    { title: 'Scheduled Reports',           breadcrumb: 'Scheduled Reports' },
    'views-schedules':      { title: 'Views & Schedules',           breadcrumb: 'Views & Schedules' },
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
    { type: 'divider' },
    { type: 'button', id: 'scheduled-reports',  text: 'Scheduled Reports' },
    { type: 'button', id: 'manage-saved-views', text: 'Manage Saved Views' },
    // EXPERIMENTAL: merged Views & Schedules page (self-contained trial)
    { type: 'button', id: 'views-schedules',    text: 'Views & Schedules' },
];

reportsSidenav.items        = NAV_ITEMS;
reportsSidenav.footerItems  = [];
reportsSidenav.expandedGroupIds = NAV_ITEMS.filter(i => i.type === 'group').map(i => i.id);
reportsSidenav.activeItemId = 'qualification-report';

// The report/page currently on screen, and a parked destination while the
// unsaved-changes guard is open.
let currentReportId = 'qualification-report';
let pendingNavId = null;

function performNavigation(id) {
    const report = REPORTS[id];
    if (!report) return;

    reportsSidenav.activeItemId = id;
    document.querySelector('.bc-current').textContent = report.breadcrumb;

    const isQual      = id === 'qualification-report';
    const isActEx     = id === 'activity-exception';
    const isManage    = id === 'manage-saved-views';
    const isScheduled = id === 'scheduled-reports';
    const isCombined  = id === 'views-schedules';   // EXPERIMENTAL merged page

    document.getElementById('pageLayout').style.display              = isQual      ? '' : 'none';
    document.getElementById('actExLayout').style.display            = isActEx     ? '' : 'none';
    document.getElementById('manageSavedViewsLayout').style.display  = isManage    ? '' : 'none';
    document.getElementById('scheduledReportsLayout').style.display  = isScheduled ? '' : 'none';
    document.getElementById('viewsSchedulesLayout').style.display    = isCombined  ? '' : 'none';
    document.getElementById('reportPlaceholder').style.display       = (!isQual && !isActEx && !isManage && !isScheduled && !isCombined) ? 'flex' : 'none';
    if (!isManage && !isScheduled && !isCombined) document.getElementById('placeholderTitle').textContent = report.title;

    if (isManage)    renderManageSavedViews();
    if (isScheduled) renderScheduledReports();
    if (isCombined && typeof renderCombinedViews === 'function') renderCombinedViews();
    if (isQual || isActEx) refreshActiveFilters();

    currentReportId = id;
}

// Guarded navigation: blocks leaving a report with unsaved edits to an applied view.
function requestNavigation(id) {
    if (!REPORTS[id]) return;
    const onReport = currentReportId === 'qualification-report' || currentReportId === 'activity-exception';
    if (onReport && appliedSavedView && filtersTouched && id !== currentReportId) {
        pendingNavId = id;
        reportsSidenav.activeItemId = currentReportId; // keep highlight in place
        openUnsavedChangesDialog('leave');
        return;
    }
    performNavigation(id);
}

reportsSidenav.addEventListener('item-click', (e) => {
    const id = e.detail.id;
    if (id === 'create-report') return;
    requestNavigation(id);
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
    filterToggleBtn.classList.remove('active');
});

filterToggleBtn.addEventListener('click', () => {
    const willOpen = filterPanel.classList.contains('collapsed');
    filterPanel.classList.toggle('collapsed', !willOpen);
    filterToggleBtn.classList.toggle('active', willOpen);   // stays visible, looks pressed
});

// ================================================================
// SAVE NEW VIEW DIALOG — Basic Info + Filter Summary
// ================================================================

const saveViewDialog = document.getElementById('saveViewDialog');
const saveViewBtn    = document.getElementById('saveViewBtn');

const FILTER_SUMMARY_ROWS = [
    { icon: 'fa-regular fa-calendar',     label: 'Date Range',       value: '04/01/26 – 04/07/26' },
    { icon: 'fa-solid fa-list',           label: 'Activities (2)',    pills: ['Safety Fundamentals', 'Safety Fundamentals 2'] },
    { icon: 'fa-solid fa-user',           label: 'Users (3)',         pills: ['User Name 1', 'User Name 2', 'User Name 3'] },
    { icon: 'fa-solid fa-tag',            label: 'Status Types',      value: 'All' },
    { icon: 'fa-solid fa-circle-dot',     label: 'Assigned Status',   pills: ['Assigned'] },
    { icon: 'fa-solid fa-table-columns',  label: 'Columns Shown',     value: 'Activity, User, Username, Status, Completion Date' },
];

// Context for the Save View dialog: 'create' | 'edit' | 'split' (save-as-new
// from a view that feeds scheduled reports — lets you pick which ones move).
let saveViewContext = { mode: 'create', sourceView: null };

function openSaveViewDialog(ctx) {
    saveViewContext = ctx || { mode: 'create', sourceView: null };
    saveViewDialog.headerTitle = saveViewContext.mode === 'split' ? 'Save as New View'
        : saveViewContext.mode === 'edit' ? 'Edit Saved View'
        : 'Create New Saved View';
    saveViewDialog.overlayClass = saveViewContext.mode === 'split' ? 'save-view-overlay-wide' : 'save-view-overlay';
    saveViewDialog.opened = true;
    saveViewDialog.requestContentUpdate();
}

function appendFilterSummary(root) {
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
}

saveViewDialog.renderer = (root) => {
    root.innerHTML = '';
    const ctx = saveViewContext;
    const src = ctx.sourceView;
    const split = ctx.mode === 'split' && !!src;

    root.style.minWidth = split ? '860px' : '600px';
    root.style.maxWidth = split ? '900px' : '680px';

    const subtitle = document.createElement('p');
    subtitle.className = 'sv-dialog-subtitle';
    subtitle.innerHTML = ctx.mode === 'split'
        ? 'Save your changes as a new saved view, then choose which scheduled reports should move to it.'
        : ctx.mode === 'edit'
            ? 'Update this saved view’s settings.'
            : 'Configure filter settings and meta data for this saved view.';
    root.appendChild(subtitle);

    // Builds Basic Information into a container
    const buildBasicInfo = (container) => {
        const basicHeading = document.createElement('p');
        basicHeading.className = 'sv-section-heading';
        basicHeading.textContent = 'Basic Information';
        container.appendChild(basicHeading);

        const nameField = document.createElement('vaadin-text-field');
        nameField.setAttribute('theme', 'outlined');
        nameField.setAttribute('label', 'Saved View Name');
        nameField.setAttribute('required', '');
        nameField.setAttribute('placeholder', 'e.g. Q4 Compliance Review');
        nameField.style.width = '100%';
        nameField.id = 'saveViewNameField';
        if (ctx.mode === 'split' && src) nameField.value = src.name + ' (Copy)';
        else if (ctx.mode === 'edit' && src) nameField.value = src.name;
        container.appendChild(nameField);

        const descArea = document.createElement('vaadin-text-area');
        descArea.setAttribute('theme', 'outlined');
        descArea.setAttribute('label', 'Saved View Description');
        descArea.setAttribute('placeholder', 'Describe the saved view...');
        descArea.style.cssText = 'width:100%; margin-top:12px';
        container.appendChild(descArea);

        const favRow = document.createElement('label');
        favRow.className = 'sv-fav-row';
        const favCb = document.createElement('vaadin-checkbox');
        favCb.setAttribute('label', 'Favorite this View');
        favRow.appendChild(favCb);
        container.appendChild(favRow);
    };

    // Builds the Filter Summary into a container
    const buildFilterSummary = (container, withRule) => {
        if (withRule) {
            const hr = document.createElement('hr');
            hr.className = 'sv-hr';
            container.appendChild(hr);
        }
        const filterHeading = document.createElement('p');
        filterHeading.className = 'sv-section-heading';
        filterHeading.textContent = 'Filter Summary';
        container.appendChild(filterHeading);
        appendFilterSummary(container);
    };

    // Builds the "Scheduled reports to move" section into a container
    const buildScheduleMove = (container) => {
        const schedHeading = document.createElement('p');
        schedHeading.className = 'sv-section-heading';
        schedHeading.textContent = 'Scheduled reports to move';
        container.appendChild(schedHeading);

        const help = document.createElement('p');
        help.className = 'sv-dialog-subtitle';
        help.style.marginTop = '0';
        help.innerHTML = `Selected reports switch to this new view. Unselected stay on <strong>${src.name}</strong> with its current filters.`;
        container.appendChild(help);

        const list = document.createElement('div');
        list.className = 'ved-list';
        SCHEDULED_REPORTS.filter(s => s.savedViewId === src.id).forEach(s => {
            const label = document.createElement('label');
            label.className = 'ved-row ved-pick';
            label.innerHTML = `<input type="checkbox" class="svd-move-cb" data-id="${s.id}">
                <i class="fa-regular fa-paper-plane"></i>
                <span class="ved-name">${s.name}</span>
                <span class="ved-sub">${formatSchedule(s)} · ${s.recipients.length} recipient${s.recipients.length > 1 ? 's' : ''}</span>`;
            list.appendChild(label);
        });
        container.appendChild(list);
    };

    if (split) {
        // Two columns: left = basic info + filter summary, right = schedules to move
        const grid = document.createElement('div');
        grid.className = 'sv-twocol';
        const left = document.createElement('div');
        left.className = 'sv-col-left';
        const right = document.createElement('div');
        right.className = 'sv-col-right';

        buildBasicInfo(left);
        buildFilterSummary(left, true);
        buildScheduleMove(right);

        grid.appendChild(left);
        grid.appendChild(right);
        root.appendChild(grid);
    } else {
        buildBasicInfo(root);
        buildFilterSummary(root, true);
    }
};

saveViewDialog.footerRenderer = (root) => {
    root.innerHTML = '';
    const ctx = saveViewContext;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { saveViewDialog.opened = false; });

    const primaryBtn = document.createElement('vaadin-button');
    primaryBtn.setAttribute('theme', 'primary');
    primaryBtn.textContent = ctx.mode === 'split' ? 'Save as new view'
        : ctx.mode === 'edit' ? 'Save Changes'
        : 'Create Saved View';
    primaryBtn.addEventListener('click', () => {
        const field = document.getElementById('saveViewNameField');
        const name = field?.value.trim();
        if (!name) {
            if (field) { field.invalid = true; field.errorMessage = 'Name is required'; }
            return;
        }

        if (ctx.mode === 'split' && ctx.sourceView) {
            const src = ctx.sourceView;
            const moveIds = [...document.querySelectorAll('.svd-move-cb:checked')].map(cb => cb.dataset.id);
            const copy = {
                ...src,
                id: 'view-' + (Date.now ? Date.now() : Math.floor(performance.now())),
                name,
                favorited: false,
            };
            SAVED_VIEWS.push(copy);
            moveIds.forEach(id => {
                const s = SCHEDULED_REPORTS.find(x => x.id === id);
                if (s) { s.savedViewId = copy.id; s.savedViewName = copy.name; }
            });
            renderManageSavedViews();
            renderScheduledReports();
            saveViewDialog.opened = false;
            showToast(`Created "${name}" — moved ${moveIds.length} scheduled report${moveIds.length === 1 ? '' : 's'}`);
            return;
        }

        saveViewDialog.opened = false;
        showToast(ctx.mode === 'edit' ? 'Saved view updated' : 'Saved view created');
    });

    root.appendChild(cancelBtn);
    root.appendChild(primaryBtn);
};

// "Save View" dropdown button — opens a menu with two choices:
//   • Save View      → update the applied view (warns if schedules depend on it)
//   • Save New View  → always create a brand-new saved view
const saveViewMenu     = document.getElementById('saveViewMenu');
const saveViewItem     = document.getElementById('saveViewItem');
const saveNewViewItem  = document.getElementById('saveNewViewItem');

saveViewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Default view → no dropdown; save straight away as a new view.
    if (!appliedSavedView) {
        openSaveViewDialog({ mode: 'create', sourceView: null });
        return;
    }
    // Applied saved view → toggle the Update / Save-new dropdown.
    saveViewMenu.style.display = saveViewMenu.style.display === 'none' ? 'block' : 'none';
});
saveViewItem.addEventListener('click', () => {
    saveViewMenu.style.display = 'none';
    if (appliedSavedView) {
        attemptEditView(appliedSavedView);
    } else {
        openSaveViewDialog({ mode: 'create', sourceView: null });
    }
});
saveNewViewItem.addEventListener('click', () => {
    saveViewMenu.style.display = 'none';
    // If the applied view feeds scheduled reports, open the editor in "split"
    // mode so the user can pick which reports move to the new view.
    if (appliedSavedView && scheduleCountForView(appliedSavedView.id) > 0) {
        openSaveViewDialog({ mode: 'split', sourceView: appliedSavedView });
    } else {
        openSaveViewDialog({ mode: 'create', sourceView: null });
    }
});
// Close the menu on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('#saveViewControl')) saveViewMenu.style.display = 'none';
});

// ================================================================
// SELECT SAVED VIEW DIALOG — list panel + filter preview panel
// ================================================================

const selectSavedViewDialog = document.getElementById('selectSavedViewDialog');

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

// The saved view currently applied to the report (null = ad-hoc filters)
let appliedSavedView = null;

// True once the user edits filters while a saved view is applied — drives the
// "modified" banner and gates the unsaved-changes guard on navigation.
let filtersTouched = false;

// Snapshot of the filter-panel control states captured when a view is applied,
// so "Restore saved view" can revert the user's manual edits.
let filterSnapshot = null;

// Whether the Activity Exception report is the one currently on screen.
function activeReportIsActEx() {
    return document.getElementById('actExLayout').style.display !== 'none';
}

// When a saved view is applied, the Save View buttons read "Update View"
function refreshSaveViewLabels() {
    const label = appliedSavedView ? 'Update View' : 'Save View';
    document.querySelectorAll('.sv-main-label, .sv-item-label')
        .forEach(el => { el.textContent = label; });
}

// ── Apply Saved View selector (replaces the button + persistent banner) ──
// Reflects the applied view on BOTH reports' selectors (one applies at a time).
function updateViewSelectors() {
    [['qualViewSelector', 'qualViewSelectorLabel', 'qualViewChip', 'qualViewPlaceholder', 'qualViewStar'],
     ['actExViewSelector', 'actExViewSelectorLabel', 'actExViewChip', 'actExViewPlaceholder', 'actExViewStar']]
    .forEach(([selId, labelId, chipId, phId, starId]) => {
        const sel = document.getElementById(selId);
        const label = document.getElementById(labelId);
        const chip = document.getElementById(chipId);
        const ph = document.getElementById(phId);
        const star = document.getElementById(starId);
        if (!sel || !label) return;
        if (appliedSavedView) {
            sel.classList.add('has-view');         // selected: show the pill chip
            label.textContent = appliedSavedView.name;
            if (chip) chip.style.display = '';
            if (ph) ph.style.display = 'none';
            if (star) {
                const fav = !!appliedSavedView.favorited;
                star.classList.toggle('active', fav);
                star.querySelector('i').className = (fav ? 'fa-solid' : 'fa-regular') + ' fa-star';
                star.title = fav ? 'Remove from favorites' : 'Favorite this view';
            }
        } else {
            sel.classList.remove('has-view');      // unselected: show the placeholder
            if (chip) chip.style.display = 'none';
            if (ph) ph.style.display = '';
        }
    });

    // Little green "clock + count" badge by the selector — only when the
    // applied view actually feeds scheduled reports.
    const n = appliedSavedView ? scheduleCountForView(appliedSavedView.id) : 0;
    [['qualViewSchedBtn', 'qualViewSchedLabel'], ['actExViewSchedBtn', 'actExViewSchedLabel']]
    .forEach(([btnId, lblId]) => {
        const btn = document.getElementById(btnId);
        const lbl = document.getElementById(lblId);
        if (!btn) return;
        btn.style.display = n > 0 ? '' : 'none';
        if (lbl) lbl.textContent = `${n} scheduled report${n === 1 ? '' : 's'}`;
        btn.title = `View ${n} scheduled report${n === 1 ? '' : 's'}`;
    });
}

// ── Modified banner — only visible once an applied view's filters are edited ──
function updateModifiedBanner() {
    const show = !!appliedSavedView && filtersTouched;
    [['appliedBanner', 'appliedBannerName'], ['actExAppliedBanner', 'actExAppliedBannerName']]
    .forEach(([bId, nId]) => {
        const banner = document.getElementById(bId);
        const name = document.getElementById(nId);
        if (banner) banner.style.display = show ? 'flex' : 'none';
        if (name && appliedSavedView) name.textContent = appliedSavedView.name;
    });
    document.getElementById('qualViewSelector')?.classList.toggle('edited', show);
    document.getElementById('actExViewSelector')?.classList.toggle('edited', show);
}

// ── Active filter badges shown on the report (add / subtract) ──
// Built from the applied view's contents, or the report defaults on "Select saved view".
const DEFAULT_FILTERS = {
    qual:  { dateRange: 'Apr 1 – Apr 7, 2026',  activities: ['All Activities'], users: ['All Users'], statusTypes: 'All' },
    actEx: { dateRange: 'Nov 1 – Nov 30, 2025', activities: ['All Activities'], users: ['All Users'], statusTypes: 'All' },
};
let activeFilters = [];

// Read the live filter-panel selections into chip descriptors (only filters
// that are actually set — "All"/"All dates" are skipped).
function liveFilterChips() {
    const reportName = activeReportIsActEx() ? 'Activity Exception Report' : 'Qualification Report';
    const chips = [];
    getReportFilterSummary(reportName).forEach(row => {
        if (row.value) {
            if (/^all\b/i.test(row.value.trim())) return;        // skip "All", "All dates"
            chips.push({ icon: row.icon, text: row.value });
        } else if (row.pills) {
            if (row.pills.length === 1 && /^all/i.test(row.pills[0])) return; // skip "All …"
            chips.push({ icon: row.icon, text: row.label });     // label already carries the count
        }
    });
    return chips;
}

function buildActiveFilters() {
    // Base badges = the applied saved view's filters (if any)
    const base = appliedSavedView
        ? viewContentFacets(appliedSavedView).filter(f => f.key !== 'cols').map(f => ({ icon: f.icon, text: f.text }))
        : [];
    // Additional badges = filters the user manually added on top (after Apply)
    const manual = filtersTouched ? liveFilterChips() : [];
    const seen = new Set(base.map(c => c.text));
    const extra = manual.filter(c => !seen.has(c.text));
    // applied-view filters first, then the new manual ones
    activeFilters = [...base, ...extra];
}

function renderActiveFilterChips() {
    ['qualActiveFilters', 'actExActiveFilters'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        // Hide the row entirely when there are no active filters (no phantom gap)
        el.style.display = activeFilters.length ? 'flex' : 'none';
        el.innerHTML = activeFilters.map((f, i) =>
            `<span class="filter-chip"><i class="${f.icon}"></i>` +
            `<span class="filter-chip-text" title="${f.text}">${f.text}</span>` +
            `<button type="button" class="filter-chip-x" data-i="${i}" aria-label="Remove filter">&times;</button></span>`
        ).join('')
        // "Clear All" badge — appears alongside the badges whenever any exist
        + (activeFilters.length
            ? `<button type="button" class="filter-chip-clear-all"><i class="fa-solid fa-xmark"></i> Clear All</button>`
            : '');
        el.querySelectorAll('.filter-chip-x').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilters.splice(Number(btn.dataset.i), 1);
                renderActiveFilterChips();
                markViewDirty();
            });
        });
        el.querySelector('.filter-chip-clear-all')
            ?.addEventListener('click', clearAllActiveFilters);
    });
}

function refreshActiveFilters() {
    buildActiveFilters();
    renderActiveFilterChips();
    updateFiltersBarVisibility();
}

// The filters bar holds the chips + Save/Update View. Show it whenever there
// are active filter chips or the view has unsaved edits; otherwise collapse it.
function updateFiltersBarVisibility() {
    const show = activeFilters.length > 0 || filtersTouched;
    ['qualFiltersBar', 'actExFiltersBar'].forEach(id => {
        const bar = document.getElementById(id);
        if (bar) bar.style.display = show ? 'flex' : 'none';
    });
}

// Capture / restore the filter-panel checkbox states
function snapshotFilters() {
    const boxes = document.querySelectorAll('#filterPanel vaadin-checkbox, #actExFilterPanel vaadin-checkbox');
    filterSnapshot = Array.from(boxes).map(b => ({ el: b, checked: !!b.checked }));
}
function restoreFilters() {
    if (!filterSnapshot) return;
    filterSnapshot.forEach(({ el, checked }) => { el.checked = checked; });
}

// The Save View control only appears once filters have actually been changed.
// On the Default view it's a single "Save View" button (always saves new);
// on an applied saved view it's "Update View" with a dropdown (update / save new).
function updateSaveViewControls() {
    [['saveViewControl', 'saveViewMenu'], ['actExSaveViewControl', 'actExSaveViewMenu']]
    .forEach(([ctrlId, menuId]) => {
        const ctrl = document.getElementById(ctrlId);
        if (!ctrl) return;
        ctrl.style.display = filtersTouched ? 'inline-flex' : 'none';
        const hasDropdown = !!appliedSavedView;   // dropdown only when editing a saved view
        ctrl.classList.toggle('no-dropdown', !hasDropdown);
        if (!hasDropdown) {
            const menu = document.getElementById(menuId);
            if (menu) menu.style.display = 'none';
        }
    });
    updateFiltersBarVisibility();
}

// Mark filters as changed → reveal the Save View button (+ banner if a view is applied)
function markViewDirty() {
    filtersTouched = true;
    updateModifiedBanner();
    updateSaveViewControls();
}

function applyView(view) {
    appliedSavedView = view;
    filtersTouched = false;
    selectedSavedViewId = view ? view.id : null;
    snapshotFilters();
    updateViewSelectors();
    updateModifiedBanner();
    refreshSaveViewLabels();
    updateSaveViewControls();
    refreshActiveFilters();
}

function clearAppliedView() {
    appliedSavedView = null;
    filtersTouched = false;
    selectedSavedViewId = null;
    document.getElementById('saveViewMenu')?.style && (document.getElementById('saveViewMenu').style.display = 'none');
    document.getElementById('actExSaveViewMenu')?.style && (document.getElementById('actExSaveViewMenu').style.display = 'none');
    updateViewSelectors();
    updateModifiedBanner();
    refreshSaveViewLabels();
    updateSaveViewControls();
    refreshActiveFilters();
}

// "Clear All" badge — wipe every active filter badge back to an unfiltered
// report, whether or not a saved view is applied.
function clearAllActiveFilters() {
    // Uncheck the filter-panel selections so the panel matches the cleared row
    document.querySelectorAll('#filterPanel vaadin-checkbox, #actExFilterPanel vaadin-checkbox')
        .forEach(b => { b.checked = false; });
    clearAppliedView();   // drops the applied view + manual edits → chip row empties
    showToast('Filters cleared');
}

// Restore the saved view's filters, discarding the user's manual edits
function restoreSavedView() {
    restoreFilters();
    filtersTouched = false;
    updateModifiedBanner();
    updateSaveViewControls();
    refreshActiveFilters();   // rebuild the chip row from the saved view only — drop the manual chips/pills
    showToast(appliedSavedView ? `Restored "${appliedSavedView.name}"` : 'Saved view restored');
}

// ── Saved-view picker as an anchored dropdown (replaces the modal + preview) ──
// Each row carries the view's name, description and filter facets, so no side
// preview is needed. Search + sort live at the top of the list.
let svDropdownEl = null;
let svDropdownSort = 'recent';

function ensureSavedViewDropdown() {
    if (svDropdownEl) return svDropdownEl;
    const dd = document.createElement('div');
    dd.className = 'sv-dropdown';
    dd.id = 'svDropdown';
    dd.hidden = true;
    dd.innerHTML = `
        <div class="sv-dd-search">
            <div class="sv-search-wrap">
                <i class="fa-solid fa-magnifying-glass sv-search-icon"></i>
                <input class="sv-search-input" id="svDdSearch" type="text" placeholder="Search saved views...">
            </div>
        </div>
        <div class="sv-dd-sortbar">
            <i class="fa-solid fa-arrow-down-wide-short sv-dd-sort-icon"></i>
            <span class="sv-dd-sort-label">Sort by</span>
            <select class="sv-dd-sort" id="svDdSort">
                <option value="recent">Recently updated</option>
                <option value="alpha">Alphabetical</option>
            </select>
        </div>
        <div class="sv-dd-list" id="svDdList"></div>`;
    document.body.appendChild(dd);
    svDropdownEl = dd;

    dd.querySelector('#svDdSearch').addEventListener('input', (e) => buildSavedViewDropdownList(e.target.value));
    dd.querySelector('#svDdSort').addEventListener('change', (e) => {
        svDropdownSort = e.target.value;
        buildSavedViewDropdownList(dd.querySelector('#svDdSearch').value);
    });
    // Don't let clicks inside bubble out to the document close handler
    dd.addEventListener('click', (e) => e.stopPropagation());
    return dd;
}

function buildSavedViewDropdownList(query) {
    const list = document.getElementById('svDdList');
    if (!list) return;
    list.innerHTML = '';

    const q = (query || '').toLowerCase();
    let filtered = SAVED_VIEWS.filter(v =>
        v.name.toLowerCase().includes(q) || (v.desc || '').toLowerCase().includes(q));
    if (svDropdownSort === 'alpha') {
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    const favorites = filtered.filter(v => v.favorited);
    const rest      = filtered.filter(v => !v.favorited);

    const section = (text) => {
        const el = document.createElement('div');
        el.className = 'sv-dd-section';
        el.textContent = text;
        list.appendChild(el);
    };

    if (favorites.length) { section('Favorites'); favorites.forEach(addItem); }
    section('All Saved Views');
    if (rest.length) rest.forEach(addItem);
    else if (!favorites.length) {
        const empty = document.createElement('p');
        empty.className = 'sv-dd-empty';
        empty.textContent = 'No saved views found';
        list.appendChild(empty);
    }

    function addItem(view) {
        const item = document.createElement('div');
        item.className = 'sv-dd-item' + (view.id === selectedSavedViewId ? ' selected' : '');
        item.dataset.id = view.id;
        item.innerHTML = `
            <div class="sv-dd-item-head">
                <button class="sv-dd-star ${view.favorited ? 'active' : ''}" data-id="${view.id}" title="Toggle favorite"><i class="${view.favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>
                <span class="sv-dd-name">${view.name}</span>
                <span class="${reportBadgeClass(view.report)}">${view.report}</span>
                ${view.id === selectedSavedViewId ? '<i class="fa-solid fa-check sv-dd-check"></i>' : ''}
            </div>
            ${view.desc ? `<p class="sv-dd-desc">${view.desc}</p>` : ''}
            ${viewFacetsHTML(view, ['date', 'acts', 'users', 'status'])}`;

        item.addEventListener('click', (e) => {
            if (e.target.closest('.sv-dd-star')) return;
            applyView(view);
            closeSavedViewDropdown();
        });
        item.querySelector('.sv-dd-star').addEventListener('click', (e) => {
            e.stopPropagation();
            view.favorited = !view.favorited;
            buildSavedViewDropdownList(document.getElementById('svDdSearch')?.value || '');
        });
        list.appendChild(item);
    }
}

function openSavedViewDropdown(anchorEl) {
    selectedSavedViewId = appliedSavedView ? appliedSavedView.id : null;
    const dd = ensureSavedViewDropdown();
    const search = dd.querySelector('#svDdSearch');
    search.value = '';
    buildSavedViewDropdownList('');
    dd.hidden = false;

    // Anchor under the selector, right edges aligned (selector sits top-right)
    const r = anchorEl.getBoundingClientRect();
    const width = dd.offsetWidth;
    dd.style.top  = (r.bottom + window.scrollY + 6) + 'px';
    dd.style.left = Math.max(8, r.right + window.scrollX - width) + 'px';
    setTimeout(() => search.focus(), 0);
}

function closeSavedViewDropdown() {
    if (svDropdownEl) svDropdownEl.hidden = true;
}

// Selector trigger / chip name → open the dropdown anchored to that selector
['qualViewSelectorTrigger', 'actExViewSelectorTrigger',
 'qualViewSelectorLabel', 'actExViewSelectorLabel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        const selector = e.currentTarget.closest('.view-selector');
        const dd = ensureSavedViewDropdown();
        if (!dd.hidden) { closeSavedViewDropdown(); return; }   // toggle
        openSavedViewDropdown(selector);
    });
});

// Close on outside click or Escape
document.addEventListener('click', () => closeSavedViewDropdown());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSavedViewDropdown(); });

// Selector clear (×) → remove the applied view entirely
['qualViewClear', 'actExViewClear'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        clearAppliedView();
    });
});

// Selector star (★) → toggle the applied view's favorited status (also reflected in Manage Saved Views)
['qualViewStar', 'actExViewStar'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!appliedSavedView) return;
        appliedSavedView.favorited = !appliedSavedView.favorited;
        updateViewSelectors();
        showToast(appliedSavedView.favorited
            ? `Added "${appliedSavedView.name}" to favorites`
            : `Removed "${appliedSavedView.name}" from favorites`);
    });
});

// "View Scheduled Reports (N)" button → jump to the Scheduled Reports page
['qualViewSchedBtn', 'actExViewSchedBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
        requestNavigation('scheduled-reports');
    });
});

// Restore-saved-view button → confirm via the unsaved-changes-style modal
['restoreViewBtn', 'actExRestoreViewBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => openUnsavedChangesDialog('restore'));
});

// Filters only count as "changed" once the user clicks Apply Filters — not on
// every checkbox toggle — so the Save/Update View button waits for Apply.
document.getElementById('applyFiltersBtn')?.addEventListener('click', markViewDirty);
document.getElementById('actExApplyFiltersBtn')?.addEventListener('click', markViewDirty);

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
    // Apply = refresh the active-filter badges and just close the panel
    refreshActiveFilters();
    filterPanel.classList.add('collapsed');
    filterToggleBtn.classList.remove('active');
});
document.getElementById('actExApplyFiltersBtn')?.addEventListener('click', () => {
    refreshActiveFilters();
    document.getElementById('actExFilterPanel')?.classList.add('collapsed');
    document.getElementById('actExFilterToggle')?.classList.remove('active');
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
    actExFilterToggle.classList.remove('active');
});

actExFilterToggle?.addEventListener('click', () => {
    const willOpen = actExFilterPanel.classList.contains('collapsed');
    actExFilterPanel.classList.toggle('collapsed', !willOpen);
    actExFilterToggle.classList.toggle('active', willOpen);
});

// Wire actEx Save View / Apply Saved View to the same dialogs
// Activity Exception Save View — split menu mirroring the Qualification report:
//   • Save View      → edit the applied view (or create if none applied)
//   • Save New View  → always create a brand-new saved view (split if it feeds schedules)
const actExSaveViewBtn     = document.getElementById('actExSaveViewBtn');
const actExSaveViewMenu    = document.getElementById('actExSaveViewMenu');
const actExSaveViewItem    = document.getElementById('actExSaveViewItem');
const actExSaveNewViewItem = document.getElementById('actExSaveNewViewItem');

actExSaveViewBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!appliedSavedView) {
        openSaveViewDialog({ mode: 'create', sourceView: null });
        return;
    }
    actExSaveViewMenu.style.display = actExSaveViewMenu.style.display === 'none' ? 'block' : 'none';
});
actExSaveViewItem?.addEventListener('click', () => {
    actExSaveViewMenu.style.display = 'none';
    if (appliedSavedView) {
        attemptEditView(appliedSavedView);
    } else {
        openSaveViewDialog({ mode: 'create', sourceView: null });
    }
});
actExSaveNewViewItem?.addEventListener('click', () => {
    actExSaveViewMenu.style.display = 'none';
    if (appliedSavedView && scheduleCountForView(appliedSavedView.id) > 0) {
        openSaveViewDialog({ mode: 'split', sourceView: appliedSavedView });
    } else {
        openSaveViewDialog({ mode: 'create', sourceView: null });
    }
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#actExSaveViewControl')) actExSaveViewMenu.style.display = 'none';
});

// (Apply Saved View is now the dropdown selector — wired near applyView().)

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

// Compact, human-readable facets describing a saved view's report content
// (date range, activities, users, status, columns). Surfaced directly on the
// Manage Saved Views + Scheduled Reports tables so a user can tell views apart
// without opening the editor / details dialog.
function viewContentFacets(view) {
    if (!view) return [];
    const allActs = !view.activities || view.activities[0] === 'All Activities';
    const acts = allActs ? 'All Activities'
        : (view.activities.length <= 2 ? view.activities.join(', ')
            : `${view.activityCount || view.activities.length} Activities`);
    const allUsers = !view.users || view.users[0] === 'All Users';
    const usrs = allUsers ? 'All Users' : `${view.userCount || view.users.length} Users`;
    const status = (view.statusTypes && view.statusTypes !== 'All') ? view.statusTypes : 'All statuses';
    return [
        { key: 'date',   icon: 'fa-regular fa-calendar',     text: view.dateRange },
        { key: 'acts',   icon: 'fa-solid fa-list-check',     text: acts },
        { key: 'users',  icon: 'fa-solid fa-user',           text: usrs },
        { key: 'status', icon: 'fa-solid fa-tag',            text: status },
        { key: 'cols',   icon: 'fa-solid fa-table-columns',  text: view.columns },
    ].filter(f => f.text);
}

// Render the facets as a plain, static line of copy (dot-separated, no pills).
function viewFacetsHTML(view, keys) {
    const facets = viewContentFacets(view).filter(f => !keys || keys.includes(f.key));
    if (!facets.length) return '';
    return `<div class="view-facets">` + facets.map(f =>
        `<span class="vf-item">${f.text}</span>`
    ).join('<span class="vf-sep">·</span>') + `</div>`;
}

// Small clock + count tag shown next to the view name when schedules exist
function schedNameTag(viewId) {
    const count = SCHEDULED_REPORTS.filter(s => s.savedViewId === viewId).length;
    if (!count) return '';
    return `<span class="msv-sched-tag" title="${count} scheduled report${count > 1 ? 's' : ''}"><i class="fa-regular fa-clock"></i> ${count}</span>`;
}

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
                ${schedNameTag(view.id)}
            </td>
            <td><span class="${reportBadgeClass(view.report)}">${view.report}</span></td>
            <td class="msv-desc" title="${view.desc}">${view.desc}</td>
            <td class="msv-filters-cell">
                <div class="msv-filters-inner">
                    ${viewFacetsHTML(view, ['date', 'acts', 'users', 'status'])}
                </div>
            </td>
            <td class="msv-row-actions">
                <button class="msv-edit-icon msv-edit-btn" data-id="${view.id}" title="Edit filters" aria-label="Edit filters">
                    <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="msv-delete-icon msv-delete-btn" data-id="${view.id}" title="Delete saved view" aria-label="Delete saved view">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
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

    // Delete — confirm via a modal first, to limit accidental deletions
    tbody.querySelectorAll('.msv-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteSavedViewDialog(btn.dataset.id));
    });

    // Edit — warns first if schedules are tied to this view (live link)
    tbody.querySelectorAll('.msv-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = SAVED_VIEWS.find(v => v.id === btn.dataset.id);
            if (view) attemptEditView(view);
        });
    });

    // Keep search/filter state (and the empty state) in sync after re-render
    if (window.applyMsvFilters) window.applyMsvFilters();
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
        const table = document.getElementById('msvTable');
        const empty = document.getElementById('msvEmpty');

        let visible = 0;
        document.querySelectorAll('#msvTbody .data-row').forEach(row => {
            const reportCell = row.querySelector('td:nth-child(3)')?.textContent.trim() ?? '';
            const matchReport = !reportFilter || reportCell === reportFilter;
            const matchSearch = !q || row.textContent.toLowerCase().includes(q);
            const show = matchReport && matchSearch;
            row.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        if (table) table.style.display = visible === 0 ? 'none' : '';
        if (empty) empty.style.display = visible === 0 ? '' : 'none';
    }

    // Re-apply filters whenever the page re-renders (delete, edit, etc.)
    window.applyMsvFilters = applyMsvFilters;
});

// (Manage Saved Views / Scheduled Reports re-render is handled in performNavigation.)


// ================================================================
// EMAIL / SCHEDULE REPORT
// ================================================================

// ── Mock data: existing scheduled reports ──────────────────────────
let SCHEDULED_REPORTS = [
    {
        id: 'sr1', name: 'Weekly Compliance Summary', report: 'Qualification Report',
        savedViewId: 'q1-compliance', savedViewName: 'Q1 Compliance Review',
        freqValue: 'weekly', days: ['Mon'], dayOfMonth: 1, startDate: '2026-04-06', endDate: '', timeValue: '08:00',
        recipients: ['Anthony Davis', 'Draymond Green', 'Fred VanVleet'], nextSend: 'Jun 8, 2026',
        subject: 'Weekly Compliance Summary — Q1 Compliance Review',
        message: 'Hi team,\n\nAttached is this week\'s Q1 compliance summary. Please review any outstanding qualifications and follow up with your group as needed.',
    },
    {
        id: 'sr2', name: 'Monthly Overdue Activities', report: 'Activity Exception Report',
        savedViewId: 'overdue-nov', savedViewName: 'Overdue Activities Nov',
        freqValue: 'monthly', days: [], dayOfMonth: 1, startDate: '2026-04-01', endDate: '2026-12-31', timeValue: '06:30',
        recipients: ['Gary Payton II', 'Jalen Green'], nextSend: 'Jul 1, 2026',
        subject: 'Monthly Overdue Activities — Action Needed',
        message: 'Attached is the monthly list of overdue activities. Please ensure these are completed before the end of the month.',
    },
    {
        id: 'sr3', name: 'Quarterly Safety Review', report: 'Qualification Report',
        savedViewId: 'fall-protection', savedViewName: 'Fall Protection Group',
        freqValue: 'quarterly', days: [], dayOfMonth: 1, startDate: '2026-07-01', endDate: '', timeValue: '09:00',
        recipients: ['Anthony Davis'], nextSend: 'Jul 1, 2026',
        subject: 'Quarterly Safety Review — Fall Protection',
        message: 'Please find the quarterly fall protection certification status attached for your review.',
        format: 'PDF',
    },
    {
        // Second delivery on the SAME view as sr1 — different audience + cadence.
        // Uses the "link to filtered report" delivery instead of an attachment.
        id: 'sr4', name: 'Exec Daily Digest', report: 'Qualification Report',
        savedViewId: 'q1-compliance', savedViewName: 'Q1 Compliance Review',
        freqValue: 'daily', days: [], dayOfMonth: 1, startDate: '2026-04-06', endDate: '', timeValue: '07:00',
        recipients: ['Draymond Green'], nextSend: 'Jun 10, 2026',
        subject: 'Exec Daily Digest — Compliance Snapshot',
        message: 'Daily snapshot of compliance status for leadership.',
        delivery: 'link',
    },
];

// Recipients of the current dialog (names and/or typed emails)
let currentRecipients = [];

function userFullName(u) { return `${u.firstName} ${u.lastName}`; }
function userEmail(u) {
    return `${u.firstName}.${u.lastName}`.replace(/\s+/g, '').toLowerCase() + '@vectorsolutions.com';
}

function addRecipients(str) {
    if (!str) return;
    str.split(',').map(s => s.trim()).filter(Boolean).forEach(token => {
        if (!currentRecipients.some(r => r.toLowerCase() === token.toLowerCase())) {
            currentRecipients.push(token);
        }
    });
    renderRecipientChips();
}

// A recipient is valid only if it resolves to a known user (by name or email).
// Anything else is flagged: bad email format, or a valid email not in the system.
function recipientStatus(token) {
    const t = token.trim().toLowerCase();
    const knownByName  = USERS_DATA.some(u => userFullName(u).toLowerCase() === t);
    const knownByEmail = USERS_DATA.some(u => userEmail(u).toLowerCase() === t);
    if (knownByName || knownByEmail) return { valid: true };
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(token.trim());
    if (looksLikeEmail) return { valid: false, reason: `${token} isn't a recognized user in the system` };
    return { valid: false, reason: `"${token}" isn't a valid email address` };
}

function renderRecipientChips() {
    const wrap = document.getElementById('recipChips');
    if (!wrap) return;
    wrap.innerHTML = '';
    let firstError = '';
    currentRecipients.forEach((r, idx) => {
        const status = recipientStatus(r);
        if (!status.valid && !firstError) firstError = status.reason;
        const chip = document.createElement('span');
        chip.className = 'recip-chip' + (status.valid ? '' : ' invalid');
        if (!status.valid) chip.title = status.reason;
        const label = document.createElement('span');
        if (!status.valid) {
            const warn = document.createElement('i');
            warn.className = 'fa-solid fa-circle-exclamation recip-chip-warn';
            chip.appendChild(warn);
        }
        label.textContent = r;
        chip.appendChild(label);
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'recip-chip-x';
        x.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        x.addEventListener('click', (e) => {
            e.stopPropagation();
            currentRecipients.splice(idx, 1);
            renderRecipientChips();
        });
        chip.appendChild(x);
        wrap.appendChild(chip);
    });
    const err = document.getElementById('recipError');
    if (err) err.textContent = firstError;
    const box = document.getElementById('recipBox');
    if (box) box.classList.toggle('invalid', !!firstError);
}

// ── Recipient picker ("Browse all users") ──────────────────────────
const recipientPickerDialog = document.getElementById('recipientPickerDialog');

function openRecipientPicker() {
    recipientPickerDialog.overlayClass = 'recip-picker-overlay';
    recipientPickerDialog.opened = true;
    recipientPickerDialog.requestContentUpdate();
}

function renderRecipientPickerRows(query) {
    const list = document.getElementById('recipPickerList');
    if (!list) return;
    const q = (query || '').trim().toLowerCase();
    list.innerHTML = '';
    USERS_DATA
        .filter(u => {
            if (!q) return true;
            return userFullName(u).toLowerCase().includes(q)
                || userEmail(u).toLowerCase().includes(q)
                || u.username.toLowerCase().includes(q);
        })
        .forEach(u => {
            const checked = currentRecipients.some(r => r.toLowerCase() === userFullName(u).toLowerCase());
            const row = document.createElement('label');
            row.className = 'recip-pick-row';
            row.innerHTML = `
                <input type="checkbox" class="recip-pick-cb" data-id="${u.id}" ${checked ? 'checked' : ''}>
                <span class="recip-pick-name">${userFullName(u)}</span>
                <span class="recip-pick-email">${userEmail(u)}</span>
                <span class="recip-pick-loc">${u.location}</span>
            `;
            list.appendChild(row);
        });
}

recipientPickerDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '560px';
    root.style.maxWidth = '100%';
    root.innerHTML = `
        <p class="sv-dialog-subtitle">Select people to add as recipients.</p>
        <div class="search-wrap recip-pick-search">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input class="search-input" type="text" id="recipPickerSearch" placeholder="Search by name, email, or username…">
        </div>
        <div class="recip-pick-list" id="recipPickerList"></div>
    `;
    renderRecipientPickerRows('');
    root.querySelector('#recipPickerSearch').addEventListener('input', (e) => {
        renderRecipientPickerRows(e.target.value);
    });
};

recipientPickerDialog.footerRenderer = (root) => {
    if (root.firstChild) return;
    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { recipientPickerDialog.opened = false; });

    const addBtn = document.createElement('vaadin-button');
    addBtn.setAttribute('theme', 'primary');
    addBtn.textContent = 'Add Selected';
    addBtn.addEventListener('click', () => {
        // Reconcile: drop user-name recipients, keep typed emails, add checked users
        const userNames = new Set(USERS_DATA.map(u => userFullName(u).toLowerCase()));
        currentRecipients = currentRecipients.filter(r => !userNames.has(r.toLowerCase()));
        document.querySelectorAll('#recipPickerList .recip-pick-cb:checked').forEach(cb => {
            const u = USERS_DATA.find(x => x.id === cb.dataset.id);
            if (u) currentRecipients.push(userFullName(u));
        });
        renderRecipientChips();
        recipientPickerDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(addBtn);
};

const DOW = [
    { v: 'Sun', l: 'S' }, { v: 'Mon', l: 'M' }, { v: 'Tue', l: 'T' }, { v: 'Wed', l: 'W' },
    { v: 'Thu', l: 'T' }, { v: 'Fri', l: 'F' }, { v: 'Sat', l: 'S' },
];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Formatting helpers ─────────────────────────────────────────────
function formatTime(t) {
    const [hStr, mStr] = (t || '08:00').split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${mStr} ${ampm}`;
}
function formatDateFriendly(iso) {
    if (!iso) return 'Pending';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return 'Pending';
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}
// Report-type ordering + badge styling for the Scheduled Reports page
const SR_REPORT_ORDER = ['Qualification Report', 'Activity Exception Report'];
function srReportRank(r) { const i = SR_REPORT_ORDER.indexOf(r); return i === -1 ? SR_REPORT_ORDER.length : i; }
function reportBadgeClass(report) {
    if (report === 'Qualification Report') return 'rt-badge rt-qual';
    if (report === 'Activity Exception Report') return 'rt-badge rt-actex';
    return 'rt-badge rt-other';
}

function formatSchedule(s) {
    let base;
    if (s.freqValue === 'daily')        base = 'Daily';
    else if (s.freqValue === 'weekly')  base = 'Weekly · ' + (s.days.length ? s.days.join(', ') : '—');
    else if (s.freqValue === 'monthly') base = 'Monthly · Day ' + s.dayOfMonth;
    else                                base = 'Quarterly';
    let out = `${base} at ${formatTime(s.timeValue)}`;
    if (s.endDate) out += ` · until ${formatDateFriendly(s.endDate)}`;
    return out;
}

// "Sent as" — either an attached file (surface the file format) or a link to
// the filtered report (a clickable "View report" that opens the report online
// with this view's filters applied).
function sentAsHTML(s) {
    if (s.delivery === 'link') {
        return `<button type="button" class="view-report-link" data-sid="${s.id}" title="Open this report with its filters applied"><i class="fa-solid fa-up-right-from-square"></i> View report</button>`;
    }
    const fmt = s.format || 'Excel';
    const icon = fmt === 'PDF' ? 'fa-file-pdf' : fmt === 'CSV' ? 'fa-file-csv' : 'fa-file-excel';
    return `<span class="sr-fmt" title="Emailed as ${fmt}"><i class="fa-regular ${icon}"></i> ${fmt}</span>`;
}

// Jump to the report tab for a scheduled report and prepopulate the filters
// from its saved view, so the user sees exactly what the delivered link shows.
function viewFilteredReport(scheduleId) {
    const s = SCHEDULED_REPORTS.find(x => x.id === scheduleId);
    if (!s) return;
    const view = SAVED_VIEWS.find(v => v.id === s.savedViewId);
    const reportTab = s.report === 'Activity Exception Report' ? 'activity-exception' : 'qualification-report';
    performNavigation(reportTab);
    if (view) applyView(view);
}

// Delegated so it works across every place the label is rendered
// (Scheduled Reports table, Views & Schedules grid, and the card layout).
document.addEventListener('click', (e) => {
    const link = e.target.closest('.view-report-link');
    if (!link) return;
    e.preventDefault();
    viewFilteredReport(link.dataset.sid);
});

// Schedule cell for the Scheduled Reports table: written as a single sentence
// (e.g. "Monthly on day 1 at 9:00 PM"), with the cadence word bolded as the
// anchor. End date is intentionally NOT shown here — it's lifecycle info that
// lives with "Next Send" instead. (Plain-text formatSchedule is still used for
// inline subtitles + search.)
function scheduleCellHTML(s) {
    const time = formatTime(s.timeValue);
    let cadence, when;
    if (s.freqValue === 'daily')        { cadence = 'Daily';     when = ''; }
    else if (s.freqValue === 'weekly')  { cadence = 'Weekly';    when = s.days.length ? ' on ' + s.days.join(', ') : ''; }
    else if (s.freqValue === 'monthly') { cadence = 'Monthly';   when = ' on day ' + s.dayOfMonth; }
    else                                { cadence = 'Quarterly'; when = ''; }
    return `<span class="sr-cadence">${cadence}</span>${when} at ${time}`;
}

// ── Read currently-applied filters into a read-only summary ─────────
function getReportFilterSummary(reportName) {
    if (reportName === 'Activity Exception Report') {
        return FILTER_SUMMARY_ROWS; // existing static summary for actEx
    }
    // Qualification Report — read live filter state
    const dateVal = document.querySelector('#filterPanel .date-input')?.value || 'All dates';

    const qualNames = [...pickerState.quals]
        .map(id => (QUALIFICATIONS_DATA.find(q => q.id === id) || {}).name)
        .filter(Boolean);
    const userNames = [...pickerState.qualUsers]
        .map(id => { const u = USERS_DATA.find(x => x.id === id); return u ? `${u.firstName} ${u.lastName}` : null; })
        .filter(Boolean);

    const statuses = [];
    if (document.getElementById('chk-completed')?.checked)   statuses.push('Completed');
    if (document.getElementById('chk-incomplete')?.checked)  statuses.push('Incomplete');
    if (document.getElementById('chk-in-progress')?.checked) statuses.push('In Progress');
    if (document.getElementById('chk-overdue')?.checked)     statuses.push('Overdue');

    const loc = document.getElementById('locTriggerLabel')?.textContent.trim() || 'All';

    return [
        { icon: 'fa-regular fa-calendar',  label: 'Date Range', value: dateVal },
        { icon: 'fa-solid fa-certificate', label: `Qualifications (${qualNames.length})`, pills: qualNames.length ? qualNames : ['All qualifications'] },
        { icon: 'fa-solid fa-user',        label: `Users (${userNames.length})`,          pills: userNames.length ? userNames : ['All users'] },
        { icon: 'fa-solid fa-tag',         label: 'Status Types', value: statuses.length ? statuses.join(', ') : 'All' },
        { icon: 'fa-solid fa-location-dot',label: 'Location',     value: loc },
    ];
}

// ── Toast helper ───────────────────────────────────────────────────
function showToast(msg) {
    let t = document.getElementById('appToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'appToast';
        t.className = 'app-toast';
        document.body.appendChild(t);
    }
    t.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${msg}</span>`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3400);
}

// ── Email / Schedule dialog ────────────────────────────────────────
const emailReportDialog = document.getElementById('emailReportDialog');
let emailDialogConfig = { mode: 'schedule', editId: null, reportName: 'Qualification Report' };

function openEmailDialog(opts = {}) {
    emailDialogConfig = {
        mode:         opts.editId ? 'schedule' : (opts.mode || 'schedule'),
        editId:       opts.editId || null,
        presetViewId: opts.presetViewId || null,
        reportName:   opts.reportName || 'Qualification Report',
        // focusEdit: a single-delivery edit (from Views & Schedules) — show only
        // this delivery's fields, titled by its name, with subject/message prefilled.
        focusEdit:    !!opts.focusEdit,
    };
    emailReportDialog.overlayClass = 'send-report-overlay';
    emailReportDialog.opened = true;
    refreshEmailDialog();
}

// Re-render the (already open) dialog after the config changes — e.g. when
// switching which delivery is being edited from the in-dialog list.
function refreshEmailDialog() {
    const editDeliv = emailDialogConfig.editId
        ? SCHEDULED_REPORTS.find(s => s.id === emailDialogConfig.editId)
        : null;
    emailReportDialog.headerTitle =
        (emailDialogConfig.focusEdit && editDeliv) ? `Edit: ${editDeliv.name}`
        : emailDialogConfig.editId ? 'Edit Scheduled Report'
        : (emailDialogConfig.presetViewId ? 'Schedule a report' : 'Send Report');
    emailReportDialog.requestContentUpdate();
}

function applyFreqDetail(value) {
    const repeating = !!value && value !== 'none';
    // Frequency-specific detail (day-of-week, day-of-month, quarterly note)
    ['weekly', 'monthly', 'quarterly'].forEach(f => {
        const el = document.getElementById('freq-' + f);
        if (el) el.style.display = (repeating && f === value) ? '' : 'none';
    });
    // Delivery name + end date only matter for a recurring schedule
    const recur = document.getElementById('recurOnly');
    if (recur) recur.style.display = repeating ? '' : 'none';
    // "Does not repeat" = a one-time send
    emailDialogConfig.mode = repeating ? 'schedule' : 'once';
    updateEmailPrimaryLabel();
}

function updateEmailPrimaryLabel() {
    const btn = document.getElementById('emailPrimaryBtn');
    if (!btn) return;
    if (emailDialogConfig.editId)            btn.textContent = 'Save Changes';
    else if (emailDialogConfig.mode === 'schedule') btn.textContent = 'Schedule Report';
    else                                     btn.textContent = 'Send Report';
}

// The saved view a schedule is (or will be) tied to:
//  - editing: the view stored on the schedule
//  - creating: the view currently applied to this report (or null = ad-hoc filters)
function getDialogSavedView(cfg) {
    if (cfg.editId) {
        const s = SCHEDULED_REPORTS.find(x => x.id === cfg.editId);
        if (s && s.savedViewId) {
            return SAVED_VIEWS.find(v => v.id === s.savedViewId)
                || { id: s.savedViewId, name: s.savedViewName, report: s.report };
        }
    }
    if (cfg.presetViewId) {
        const v = SAVED_VIEWS.find(x => x.id === cfg.presetViewId);
        if (v) return v;
    }
    if (appliedSavedView && appliedSavedView.report === cfg.reportName) return appliedSavedView;
    return null;
}

// Build the read-only contents summary from a saved view's stored filters
function getSavedViewSummary(view) {
    return [
        { icon: 'fa-regular fa-calendar',   label: 'Date Range', value: view.dateRange || 'All time' },
        { icon: 'fa-solid fa-certificate',  label: 'Qualifications', pills: (view.activities && view.activities.length) ? view.activities : ['All'] },
        { icon: 'fa-solid fa-user',         label: 'Users',          pills: (view.users && view.users.length) ? view.users : ['All'] },
        { icon: 'fa-solid fa-tag',          label: 'Status Types',   value: view.statusTypes || 'All' },
        { icon: 'fa-solid fa-table-columns',label: 'Columns Shown',  value: view.columns || '—' },
    ];
}

function renderSavedViewNote(cfg) {
    const el = document.getElementById('emailSavedViewNote');
    if (!el) return;
    const view = getDialogSavedView(cfg);
    if (view) {
        el.className = 'email-sv-note has-view';
        el.innerHTML = `<i class="fa-solid fa-bookmark"></i>
            <span>Scheduled from saved view <strong>${view.name}</strong></span>`;
    } else {
        el.className = 'email-sv-note no-view';
        el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
            <span>These filters aren't saved yet. Scheduling requires a saved view — you'll be prompted to save them when you click Schedule Report.</span>`;
    }
}

emailReportDialog.renderer = (root) => {
    root.innerHTML = '';
    // Belt-and-suspenders width: the overlayClass CSS sizes the overlay, and this
    // fixed content width forces it wide even if that rule doesn't apply.
    root.style.width = '780px';
    root.style.maxWidth = '100%';

    const cfg  = emailDialogConfig;
    const edit = cfg.editId ? SCHEDULED_REPORTS.find(s => s.id === cfg.editId) : null;

    const subtitleHTML = (cfg.focusEdit && edit)
        ? `<p class="sv-dialog-subtitle">Editing the <strong>${edit.name}</strong> delivery for <strong>${edit.savedViewName || cfg.reportName}</strong>.</p>`
        : `<p class="sv-dialog-subtitle">Send this <strong>${cfg.reportName}</strong> to recipients now, or set up a recurring email delivery.</p>`;

    root.innerHTML = `
        ${subtitleHTML}

        <!-- 1 · Recipients -->
        <p class="sv-section-heading">Recipients</p>
        <div class="recip-box" id="recipBox">
            <div class="recip-chips" id="recipChips"></div>
            <input type="text" id="recipInput" class="recip-input"
                placeholder="Type a name or email, or paste comma-separated…">
        </div>
        <div class="recip-tools">
            <button type="button" class="recip-browse" id="recipBrowseBtn">
                <i class="fa-solid fa-address-book"></i> Browse all users
            </button>
            <span class="recip-error" id="recipError"></span>
        </div>

        <!-- 2 · Subject + Message (each marked optional inline) -->
        <vaadin-text-field theme="outlined" id="emailSubject" label="Subject" helper-text="Optional"
            placeholder="${cfg.reportName} export" style="width:100%"></vaadin-text-field>
        <vaadin-text-area theme="outlined" id="emailMessage" label="Message" helper-text="Optional"
            placeholder="Add a note for recipients..." style="width:100%;margin-top:12px"></vaadin-text-area>

        <!-- Delivery method — attach the report as a file, or send a link that
             opens the report online with these filters already applied -->
        <p class="sv-section-heading">Delivery</p>
        <div class="deliv-method" id="delivMethod">
            <label class="deliv-opt">
                <input type="radio" name="delivMethod" value="file" checked>
                <span class="deliv-opt-body">
                    <span class="deliv-opt-title"><i class="fa-regular fa-file-excel"></i> Attached file</span>
                    <span class="deliv-opt-desc">A file export of the report is attached to the email.</span>
                </span>
            </label>
            <label class="deliv-opt">
                <input type="radio" name="delivMethod" value="link">
                <span class="deliv-opt-body">
                    <span class="deliv-opt-title"><i class="fa-solid fa-link"></i> Link to filtered report</span>
                    <span class="deliv-opt-desc">The email includes a link that opens the report online with these filters already applied.</span>
                </span>
            </label>
        </div>

        <!-- Send as — file format, only relevant when delivering an attached file -->
        <vaadin-select theme="outlined" id="emailFormat" label="Send as" helper-text="Emailed to recipients as this file type"
            style="width:100%;margin-top:12px"></vaadin-select>

        <hr class="sv-hr">

        <!-- 3 · Delivery schedule — Teams style: date + time always; Repeat dropdown -->
        <div id="emailExistingDeliveries"></div>
        <p class="sv-section-heading" id="emailScheduleHeading">Delivery schedule</p>

        <div class="email-2col">
            <vaadin-date-picker theme="outlined" id="emailStartDate" label="Date" style="width:100%"></vaadin-date-picker>
            <vaadin-select theme="outlined" id="emailTime" label="Time" style="width:100%"></vaadin-select>
        </div>

        <vaadin-select theme="outlined" id="emailFrequency" label="Repeat" style="width:100%;margin-top:12px"></vaadin-select>

        <!-- Recurrence-only detail (hidden when "Does not repeat") -->
        <div id="freq-weekly" class="freq-detail">
            <label class="filter-label" style="display:block;margin-bottom:6px">Send on</label>
            <div class="dow-row" id="dowRow"></div>
        </div>
        <div id="freq-monthly" class="freq-detail">
            <vaadin-select theme="outlined" id="emailDayOfMonth" label="Day of month" style="width:100%"></vaadin-select>
        </div>
        <div id="freq-quarterly" class="freq-detail freq-note">
            <i class="fa-regular fa-circle-info"></i> Sends on the first day of each quarter (Jan, Apr, Jul, Oct).
        </div>
        <div id="recurOnly">
            <div class="email-2col" style="margin-top:12px">
                <vaadin-text-field theme="outlined" id="emailScheduleName" label="Delivery name"
                    placeholder="e.g. Exec team — weekly" style="width:100%"></vaadin-text-field>
                <vaadin-date-picker theme="outlined" id="emailEndDate" label="End date (optional)"
                    helper-text="Leave blank to run indefinitely" style="width:100%"></vaadin-date-picker>
            </div>
        </div>
    `;

    // Recipients — token input (type / paste) + browse
    currentRecipients = edit ? [...edit.recipients] : [];
    renderRecipientChips();
    const recipInput = root.querySelector('#recipInput');
    recipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addRecipients(recipInput.value);
            recipInput.value = '';
        } else if (e.key === 'Backspace' && !recipInput.value && currentRecipients.length) {
            currentRecipients.pop();
            renderRecipientChips();
        }
    });
    recipInput.addEventListener('input', () => {
        // Splits on comma as you type or paste
        if (recipInput.value.includes(',')) {
            addRecipients(recipInput.value);
            recipInput.value = '';
        }
    });
    recipInput.addEventListener('blur', () => {
        if (recipInput.value.trim()) { addRecipients(recipInput.value); recipInput.value = ''; }
    });
    root.querySelector('#recipBox').addEventListener('click', () => recipInput.focus());
    root.querySelector('#recipBrowseBtn').addEventListener('click', openRecipientPicker);

    // Send-as file format
    const fmtSel = root.querySelector('#emailFormat');
    fmtSel.items = [
        { label: 'Excel (.xlsx)', value: 'Excel' },
        { label: 'PDF (.pdf)',    value: 'PDF' },
        { label: 'CSV (.csv)',    value: 'CSV' },
    ];
    fmtSel.value = (edit && edit.format) ? edit.format : 'Excel';

    // Delivery method (attached file vs filtered-report link) — preselect on edit.
    // The "Send as" format only applies to a file delivery, so hide it for a link.
    const delivRadio = root.querySelector(`input[name="delivMethod"][value="${edit?.delivery || 'file'}"]`);
    if (delivRadio) delivRadio.checked = true;
    const syncDelivery = () => {
        const isLink = root.querySelector('input[name="delivMethod"]:checked')?.value === 'link';
        fmtSel.style.display = isLink ? 'none' : '';
    };
    root.querySelectorAll('input[name="delivMethod"]').forEach(r => r.addEventListener('change', syncDelivery));
    syncDelivery();

    // Repeat select — "Does not repeat" (one-time) is the default
    const freqSel = root.querySelector('#emailFrequency');
    freqSel.items = [
        { label: 'Does not repeat', value: 'none' },
        { label: 'Repeat daily', value: 'daily' },
        { label: 'Repeat weekly', value: 'weekly' },
        { label: 'Repeat monthly', value: 'monthly' },
        { label: 'Repeat quarterly', value: 'quarterly' },
    ];
    freqSel.value = edit ? edit.freqValue : 'none';
    freqSel.addEventListener('value-changed', () => applyFreqDetail(freqSel.value));

    // Time select (30-minute intervals)
    const timeSel = root.querySelector('#emailTime');
    timeSel.items = Array.from({ length: 48 }, (_, i) => {
        const v = String(Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 ? '30' : '00');
        return { label: formatTime(v), value: v };
    });
    timeSel.value = edit ? edit.timeValue : '08:00';

    // Day of month select
    const domSel = root.querySelector('#emailDayOfMonth');
    domSel.items = Array.from({ length: 28 }, (_, i) => ({ label: 'Day ' + (i + 1), value: String(i + 1) }));
    domSel.value = String(edit ? edit.dayOfMonth : 1);

    // Day-of-week buttons (single-select)
    const dowRow = root.querySelector('#dowRow');
    DOW.forEach(d => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dow-btn';
        btn.dataset.dow = d.v;
        btn.textContent = d.l;
        if (edit && edit.days[0] === d.v) btn.classList.add('active');
        if (!edit && d.v === 'Mon') btn.classList.add('active');
        btn.addEventListener('click', () => {
            dowRow.querySelectorAll('.dow-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        dowRow.appendChild(btn);
    });

    // Prefill schedule name / dates / subject / message in edit mode
    if (edit) {
        root.querySelector('#emailScheduleName').value = edit.name;
        root.querySelector('#emailStartDate').value = edit.startDate;
        root.querySelector('#emailEndDate').value = edit.endDate || '';
        if (edit.subject) root.querySelector('#emailSubject').value = edit.subject;
        if (edit.message) root.querySelector('#emailMessage').value = edit.message;
    }

    // (Repeat is driven by the frequency dropdown — "Does not repeat" = send once.)

    // (Report contents now live on the report itself, next to the filter — not here.)

    // Existing deliveries for this view (in-report management) + dynamic heading
    renderExistingDeliveries(cfg);
    const schedHeading = root.querySelector('#emailScheduleHeading');
    if (schedHeading) {
        const v = getDialogSavedView(cfg);
        const cnt = v ? SCHEDULED_REPORTS.filter(s => s.savedViewId === v.id).length : 0;
        schedHeading.textContent = cfg.editId ? 'Edit this delivery' : (cnt > 0 ? 'Add a new delivery' : 'Delivery schedule');
    }

    // Repeat dropdown drives mode (none = send once) + recurrence-only fields
    applyFreqDetail(freqSel.value);
};

// In-dialog list of deliveries already attached to this view
function renderExistingDeliveries(cfg) {
    const wrap = document.getElementById('emailExistingDeliveries');
    if (!wrap) return;
    // Focused single-delivery edit, or the "Add delivery" flow (presetViewId) —
    // keep the dialog on the one delivery being created/edited; don't list the
    // view's existing deliveries.
    if (cfg.focusEdit || cfg.presetViewId) { wrap.innerHTML = ''; wrap.style.display = 'none'; return; }
    const view = getDialogSavedView(cfg);
    const list = view ? SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id) : [];
    if (!view || list.length === 0) { wrap.innerHTML = ''; wrap.style.display = 'none'; return; }

    wrap.style.display = '';
    wrap.innerHTML = `<p class="ed-heading"><i class="fa-regular fa-clock"></i> This view has ${list.length} scheduled ${list.length > 1 ? 'deliveries' : 'delivery'}</p>`;
    const listEl = document.createElement('div');
    listEl.className = 'ed-list';
    list.forEach(s => {
        const row = document.createElement('div');
        row.className = 'ed-row' + (s.id === cfg.editId ? ' editing' : '');
        const main = document.createElement('div');
        main.className = 'ed-main';
        main.innerHTML = `<span class="ed-name">${s.name}</span>
                          <span class="ed-sub">${formatSchedule(s)} · ${s.recipients.length} recipient${s.recipients.length > 1 ? 's' : ''}</span>`;
        const actions = document.createElement('div');
        actions.className = 'ed-actions';
        const editBtn = document.createElement('button');
        editBtn.type = 'button'; editBtn.className = 'ed-btn'; editBtn.title = 'Edit this delivery';
        editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
        editBtn.addEventListener('click', () => { emailDialogConfig.editId = s.id; refreshEmailDialog(); });
        const delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.className = 'ed-btn ed-del'; delBtn.title = 'Delete this delivery';
        delBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        delBtn.addEventListener('click', () => openDeleteScheduleDialog(s.id));
        actions.appendChild(editBtn); actions.appendChild(delBtn);
        row.appendChild(main); row.appendChild(actions);
        listEl.appendChild(row);
    });
    wrap.appendChild(listEl);

    if (cfg.editId) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'ed-new-link';
        back.innerHTML = '<i class="fa-solid fa-plus"></i> Add a new delivery instead';
        back.addEventListener('click', () => { emailDialogConfig.editId = null; refreshEmailDialog(); });
        wrap.appendChild(back);
    }
}

emailReportDialog.footerRenderer = (root) => {
    root.innerHTML = '';

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { emailReportDialog.opened = false; });

    const primaryBtn = document.createElement('vaadin-button');
    primaryBtn.setAttribute('theme', 'primary');
    primaryBtn.id = 'emailPrimaryBtn';
    primaryBtn.textContent = 'Schedule Report';
    primaryBtn.addEventListener('click', submitEmailDialog);

    root.appendChild(cancelBtn);
    root.appendChild(primaryBtn);
    updateEmailPrimaryLabel();
};

function submitEmailDialog() {
    const cfg = emailDialogConfig;

    // Capture anything still sitting in the recipient input
    const recipInput = document.getElementById('recipInput');
    if (recipInput && recipInput.value.trim()) { addRecipients(recipInput.value); recipInput.value = ''; }
    const recipients = [...currentRecipients];

    // Require at least one recipient
    if (recipients.length === 0) {
        const box = document.getElementById('recipBox');
        const err = document.getElementById('recipError');
        if (box) box.classList.add('invalid');
        if (err) err.textContent = 'Add at least one recipient';
        return;
    }

    // Block if any recipient is invalid (bad email / not in the system)
    const badRecipient = recipients.find(r => !recipientStatus(r).valid);
    if (badRecipient) {
        const box = document.getElementById('recipBox');
        const err = document.getElementById('recipError');
        if (box) box.classList.add('invalid');
        if (err) err.textContent = recipientStatus(badRecipient).reason;
        return;
    }

    // ── Does not repeat → one-time send (still has a date + time) ──
    if (cfg.mode === 'once') {
        const startDate = document.getElementById('emailStartDate')?.value || '';
        emailReportDialog.opened = false;
        const when = startDate ? ` on ${formatDateFriendly(startDate)}` : '';
        showToast(`Report scheduled to send once${when} to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`);
        return;
    }

    // ── Schedule (create or edit) ──
    const nameField = document.getElementById('emailScheduleName');
    const name = nameField?.value.trim();
    if (!name) {
        if (nameField) { nameField.invalid = true; nameField.errorMessage = 'Schedule name is required'; }
        return;
    }

    const freqValue  = document.getElementById('emailFrequency')?.value || 'weekly';
    const timeValue  = document.getElementById('emailTime')?.value || '08:00';
    const startDate  = document.getElementById('emailStartDate')?.value || '';
    const endDate    = document.getElementById('emailEndDate')?.value || '';
    const dayOfMonth = parseInt(document.getElementById('emailDayOfMonth')?.value || '1', 10);
    const days = [...document.querySelectorAll('#dowRow .dow-btn.active')].map(b => b.dataset.dow);

    if (freqValue === 'weekly' && days.length === 0) {
        showToast('Select at least one day of the week');
        return;
    }
    if (endDate && startDate && endDate < startDate) {
        const ep = document.getElementById('emailEndDate');
        if (ep) { ep.invalid = true; ep.errorMessage = 'End date must be after the start date'; }
        return;
    }

    const subject = document.getElementById('emailSubject')?.value.trim() || '';
    const message = document.getElementById('emailMessage')?.value.trim() || '';
    const format  = document.getElementById('emailFormat')?.value || 'Excel';
    const delivery = document.querySelector('input[name="delivMethod"]:checked')?.value || 'file';

    const pending = {
        name, report: cfg.reportName, freqValue, days, dayOfMonth, startDate, endDate, timeValue,
        recipients: [...recipients], subject, message, format, delivery,
        nextSend: formatDateFriendly(startDate),
    };

    // A schedule must be tied to a saved view. If none exists for this report,
    // prompt to save the current filters as a saved view before continuing.
    const view = getDialogSavedView(cfg);
    if (!view) {
        pendingScheduleData = pending;
        openSaveViewForSchedule(name, cfg.reportName);
        return;
    }

    finalizeSchedule(pending, view);
}

// Commit a schedule (create or edit), tied to a saved view
function finalizeSchedule(pending, view) {
    const cfg = emailDialogConfig;
    const record = { ...pending, savedViewId: view.id, savedViewName: view.name };

    if (cfg.editId) {
        const idx = SCHEDULED_REPORTS.findIndex(s => s.id === cfg.editId);
        if (idx !== -1) SCHEDULED_REPORTS[idx] = { ...SCHEDULED_REPORTS[idx], ...record };
        showToast('Schedule updated');
    } else {
        record.id = 'sr' + (Date.now ? Date.now() : Math.floor(performance.now()));
        SCHEDULED_REPORTS.push(record);
        showToast('Report scheduled');
    }

    emailReportDialog.opened = false;
    renderScheduledReports();
}

// ── Save-view-to-schedule prompt ───────────────────────────────────
const saveViewForScheduleDialog = document.getElementById('saveViewForScheduleDialog');
let pendingScheduleData = null;

function openSaveViewForSchedule(suggestedName, reportName) {
    saveViewForScheduleDialog.overlayClass = 'recip-picker-overlay';
    saveViewForScheduleDialog.opened = true;
    saveViewForScheduleDialog.requestContentUpdate();
    // Defer so the field exists before we set its value
    setTimeout(() => {
        const f = document.getElementById('svsNameField');
        if (f) f.value = suggestedName || '';
    }, 0);
}

saveViewForScheduleDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '560px';
    root.style.maxWidth = '100%';
    const reportName = emailDialogConfig.reportName;
    const summaryRows = getReportFilterSummary(reportName);

    root.innerHTML = `
        <div class="svs-callout">
            <i class="fa-solid fa-circle-info"></i>
            <span>Scheduled reports run from a saved view. Save the current filters as a saved view to finish scheduling.</span>
        </div>
        <vaadin-text-field theme="outlined" id="svsNameField" label="Saved View Name" required
            placeholder="e.g. Weekly Compliance Review" style="width:100%;margin-top:14px"></vaadin-text-field>
        <p class="sv-section-heading">Filters to save</p>
        <div id="svsSummary"></div>
    `;

    const summaryEl = root.querySelector('#svsSummary');
    summaryRows.forEach(row => {
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
        summaryEl.appendChild(rowEl);
    });
};

saveViewForScheduleDialog.footerRenderer = (root) => {
    if (root.firstChild) return;
    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { saveViewForScheduleDialog.opened = false; });

    const saveBtn = document.createElement('vaadin-button');
    saveBtn.setAttribute('theme', 'primary');
    saveBtn.textContent = 'Save View & Schedule';
    saveBtn.addEventListener('click', () => {
        const field = document.getElementById('svsNameField');
        const viewName = field?.value.trim();
        if (!viewName) {
            if (field) { field.invalid = true; field.errorMessage = 'Name is required'; }
            return;
        }
        const reportName = emailDialogConfig.reportName;
        const summary = getReportFilterSummary(reportName);
        const dateRow = summary.find(r => /date/i.test(r.label));

        const newView = {
            id: 'view-' + (Date.now ? Date.now() : Math.floor(performance.now())),
            name: viewName,
            report: reportName,
            desc: 'Created while scheduling a report',
            dateRange: (dateRow && dateRow.value) || 'Custom range',
            activities: (summary.find(r => /qualif|activit/i.test(r.label)) || {}).pills || [],
            users: (summary.find(r => /user/i.test(r.label)) || {}).pills || [],
            statusTypes: (summary.find(r => /status/i.test(r.label)) || {}).value || 'All',
            columns: (summary.find(r => /column/i.test(r.label)) || {}).value || '—',
            activityCount: 0, userCount: 0, favorited: false,
        };
        SAVED_VIEWS.push(newView);

        // Reflect the new view as the applied view for this report
        appliedSavedView = newView;
        if (reportName === 'Qualification Report') applyView(newView);

        saveViewForScheduleDialog.opened = false;
        if (pendingScheduleData) {
            finalizeSchedule(pendingScheduleData, newView);
            pendingScheduleData = null;
        }
        renderManageSavedViews();
    });

    root.appendChild(cancelBtn);
    root.appendChild(saveBtn);
};

// Wire the Email buttons on both reports
document.getElementById('emailBtn')?.addEventListener('click',
    () => openEmailDialog({ mode: 'once', reportName: 'Qualification Report' }));
document.getElementById('actExEmailBtn')?.addEventListener('click',
    () => openEmailDialog({ mode: 'once', reportName: 'Activity Exception Report' }));


// ── Scheduled Reports page ─────────────────────────────────────────
function renderScheduledReports() {
    const tbody = document.getElementById('srTbody');
    const empty = document.getElementById('srEmpty');
    const table = document.getElementById('srTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (SCHEDULED_REPORTS.length === 0) {
        setSrEmptyMessage('No scheduled reports',
            'Apply a saved view to a report, then use the <strong>Send Report</strong> button to schedule a recurring delivery.');
        if (table) table.style.display = 'none';
        if (empty) empty.style.display = '';
        return;
    }
    if (table) table.style.display = '';
    if (empty) empty.style.display = 'none';

    // Group by saved view; each view carries its report type + schedule count
    const groups = [];
    const byView = {};
    SCHEDULED_REPORTS.forEach(s => {
        const key = s.savedViewId || ('__' + s.id);
        if (!byView[key]) {
            byView[key] = { viewId: s.savedViewId, viewName: s.savedViewName || '—', report: s.report, items: [] };
            groups.push(byView[key]);
        }
        byView[key].items.push(s);
    });

    // Sort the saved-view groups (default: by report type, Qualification first)
    const sortMode = document.getElementById('srSort')?.value || 'report';
    groups.sort((a, b) => {
        if (sortMode === 'name') return a.viewName.localeCompare(b.viewName);
        const r = srReportRank(a.report) - srReportRank(b.report);
        return r !== 0 ? r : a.viewName.localeCompare(b.viewName);
    });

    groups.forEach((g, gi) => {
        const gid = 'g' + gi;

        // Saved-view band — spans the full width, carries the report-type badge.
        const band = document.createElement('tr');
        band.className = 'sr-group-row';
        band.dataset.report = g.report;
        band.dataset.gid = gid;
        band.innerHTML = `
            <td colspan="6">
                <div class="sr-band">
                    <button type="button" class="sr-expand" aria-label="Expand or collapse"><i class="fa-solid fa-chevron-down"></i></button>
                    <div class="sr-band-main">
                        <div class="sr-band-titlerow">
                            <button type="button" class="sr-band-name sr-details-btn" data-view="${g.viewId || ''}" title="View saved view details">${g.viewName}</button>
                            <span class="${reportBadgeClass(g.report)}">${g.report}</span>
                        </div>
                    </div>
                </div>
            </td>`;
        tbody.appendChild(band);

        // Email rows — aligned under the shared column headers
        g.items.forEach(s => {
            const recipText = s.recipients.length <= 2
                ? s.recipients.join(', ')
                : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`;
            const tr = document.createElement('tr');
            tr.className = 'sr-delivery';
            tr.dataset.id = s.id;
            tr.dataset.report = g.report;
            tr.dataset.gid = gid;
            tr.innerHTML = `
                <td class="sr-dname"><i class="fa-regular fa-paper-plane sr-deliv-icon"></i> ${s.name}</td>
                <td class="sr-dim sr-schedule">${scheduleCellHTML(s)}</td>
                <td class="sr-dim" title="${s.recipients.join(', ')}">${recipText}</td>
                <td class="sr-dim">${sentAsHTML(s)}</td>
                <td class="sr-dim sr-nextsend">${s.nextSend}${s.endDate ? `<span class="sr-ends">Ends ${formatDateFriendly(s.endDate)}</span>` : ''}</td>
                <td class="msv-row-actions">
                    <button class="msv-edit-icon sr-edit-btn" data-id="${s.id}" title="Edit schedule" aria-label="Edit schedule">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="msv-delete-icon sr-delete-btn" data-id="${s.id}" title="Delete schedule" aria-label="Delete schedule">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });

        // Expand / collapse the rows belonging to this band
        band.querySelector('.sr-expand').addEventListener('click', (e) => {
            e.stopPropagation();
            band.classList.toggle('collapsed');
            const collapsed = band.classList.contains('collapsed');
            tbody.querySelectorAll(`.sr-delivery[data-gid="${gid}"]`).forEach(r => {
                r.style.display = collapsed ? 'none' : '';
            });
        });
    });

    // View saved-view details (click the view name in the band)
    tbody.querySelectorAll('.sr-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSavedViewDetails(btn.dataset.view);
        });
    });

    // Edit → reopen the email dialog in schedule mode, pre-filled
    tbody.querySelectorAll('.sr-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = SCHEDULED_REPORTS.find(x => x.id === btn.dataset.id);
            if (s) openEmailDialog({ editId: s.id, reportName: s.report });
        });
    });

    // Delete → confirmation dialog
    tbody.querySelectorAll('.sr-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteScheduleDialog(btn.dataset.id));
    });

    applySrFilters();
}

// ── Delete confirmation ────────────────────────────────────────────
const scheduleDeleteDialog = document.getElementById('scheduleDeleteDialog');
let pendingDeleteId = null;

function openDeleteScheduleDialog(id) {
    pendingDeleteId = id;
    scheduleDeleteDialog.opened = true;
    scheduleDeleteDialog.requestContentUpdate();
}

scheduleDeleteDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.maxWidth = '420px';
    const s = SCHEDULED_REPORTS.find(x => x.id === pendingDeleteId);
    const p = document.createElement('p');
    p.className = 'sv-dialog-subtitle';
    p.innerHTML = `Are you sure you want to delete <strong>${s ? s.name : 'this scheduled report'}</strong>?
                   This will stop all future deliveries. This action cannot be undone.`;
    root.appendChild(p);
};

scheduleDeleteDialog.footerRenderer = (root) => {
    if (root.firstChild) return;
    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { scheduleDeleteDialog.opened = false; });

    const deleteBtn = document.createElement('vaadin-button');
    deleteBtn.setAttribute('theme', 'error primary');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        const idx = SCHEDULED_REPORTS.findIndex(x => x.id === pendingDeleteId);
        if (idx !== -1) {
            const name = SCHEDULED_REPORTS[idx].name;
            const wasEditing = (pendingDeleteId === emailDialogConfig.editId);
            SCHEDULED_REPORTS.splice(idx, 1);
            renderScheduledReports();
            showToast(`Deleted "${name}"`);
            // If the delete happened from inside the open Send Report dialog, refresh it
            if (emailReportDialog.opened) {
                if (wasEditing) emailDialogConfig.editId = null;
                refreshEmailDialog();
            }
        }
        scheduleDeleteDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(deleteBtn);
};

// ── Saved-view delete confirmation (Manage Saved Views) ─────────────
const savedViewDeleteDialog = document.getElementById('savedViewDeleteDialog');
let pendingViewDeleteId = null;

function openDeleteSavedViewDialog(id) {
    pendingViewDeleteId = id;
    savedViewDeleteDialog.overlayClass = 'recip-picker-overlay';
    savedViewDeleteDialog.opened = true;
    savedViewDeleteDialog.requestContentUpdate();
}

if (savedViewDeleteDialog) {
    savedViewDeleteDialog.renderer = (root) => {
        root.innerHTML = '';
        root.style.maxWidth = '420px';
        const v = SAVED_VIEWS.find(x => x.id === pendingViewDeleteId);
        const n = v ? scheduleCountForView(v.id) : 0;
        const p = document.createElement('p');
        p.className = 'sv-dialog-subtitle';
        p.innerHTML = `Are you sure you want to delete <strong>${v ? v.name : 'this saved view'}</strong>? `
            + (n > 0
                ? `It feeds <strong>${n} scheduled report${n === 1 ? '' : 's'}</strong>, which will also stop. `
                : '')
            + 'This action cannot be undone.';
        root.appendChild(p);
    };

    savedViewDeleteDialog.footerRenderer = (root) => {
        if (root.firstChild) return;
        const cancelBtn = document.createElement('vaadin-button');
        cancelBtn.setAttribute('theme', 'secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => { savedViewDeleteDialog.opened = false; });

        const deleteBtn = document.createElement('vaadin-button');
        deleteBtn.setAttribute('theme', 'error primary');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            const idx = SAVED_VIEWS.findIndex(v => v.id === pendingViewDeleteId);
            if (idx !== -1) {
                const name = SAVED_VIEWS[idx].name;
                const row = document.querySelector(`#msvTbody tr[data-id="${pendingViewDeleteId}"]`);
                savedViewDeleteDialog.opened = false;
                if (row) {
                    row.classList.add('msv-removing');
                    setTimeout(() => { SAVED_VIEWS.splice(idx, 1); renderManageSavedViews(); }, 250);
                } else {
                    SAVED_VIEWS.splice(idx, 1);
                    renderManageSavedViews();
                }
                showToast(`Deleted "${name}"`);
                return;
            }
            savedViewDeleteDialog.opened = false;
        });

        root.appendChild(cancelBtn);
        root.appendChild(deleteBtn);
    };
}

// ── Live link: warn when editing a saved view that has schedules ────
const viewEditWarningDialog = document.getElementById('viewEditWarningDialog');
let pendingEditView = null;

function scheduleCountForView(viewId) {
    return SCHEDULED_REPORTS.filter(s => s.savedViewId === viewId).length;
}

// Open the saved-view editor (the Edit Saved View modal)
function openViewEditor(view) {
    openSaveViewDialog({ mode: 'edit', sourceView: view });
}

// Gate editing a view's filters: warn first if schedules depend on it
function attemptEditView(view) {
    if (scheduleCountForView(view.id) === 0) { openViewEditor(view); return; }
    pendingEditView = view;
    viewEditWarningDialog.headerTitle = 'Update Saved View?';
    viewEditWarningDialog.overlayClass = 'recip-picker-overlay';
    viewEditWarningDialog.opened = true;
    viewEditWarningDialog.requestContentUpdate();
}

viewEditWarningDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '560px';
    root.style.maxWidth = '100%';
    const v = pendingEditView;
    const n = v ? scheduleCountForView(v.id) : 0;
    const list = SCHEDULED_REPORTS.filter(s => s.savedViewId === (v && v.id));
    root.innerHTML = `
        <div class="svs-callout">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span><strong>${n}</strong> scheduled report${n > 1 ? 's' : ''} ${n > 1 ? 'use' : 'uses'}
            <strong>${v ? v.name : 'this view'}</strong>. Updating its filters changes what
            ${n > 1 ? 'they' : 'it'} send the next time ${n > 1 ? 'they' : 'it'} run${n > 1 ? '' : 's'}.</span>
        </div>
        <p class="sv-section-heading">Affected scheduled reports</p>
        <div class="ved-list">${list.map(s => `
            <div class="ved-row">
                <i class="fa-regular fa-paper-plane"></i>
                <span class="ved-name">${s.name}</span>
                <span class="ved-sub">${formatSchedule(s)} · ${s.recipients.length} recipient${s.recipients.length > 1 ? 's' : ''}</span>
            </div>`).join('')}</div>
        <p class="sv-dialog-subtitle" style="margin-top:14px">
            Want only some of these to change? <strong>Save as a new view</strong> and choose which reports move to it.</p>`;
};

viewEditWarningDialog.footerRenderer = (root) => {
    root.innerHTML = '';
    const v = pendingEditView;
    const n = v ? scheduleCountForView(v.id) : 0;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { viewEditWarningDialog.opened = false; });

    const saveNewBtn = document.createElement('vaadin-button');
    saveNewBtn.setAttribute('theme', 'secondary');
    saveNewBtn.textContent = 'Save as new view';
    saveNewBtn.addEventListener('click', () => {
        // Hand off to the Edit Saved View modal, which hosts the schedule selection
        viewEditWarningDialog.opened = false;
        openSaveViewDialog({ mode: 'split', sourceView: v });
    });

    const proceedBtn = document.createElement('vaadin-button');
    proceedBtn.setAttribute('theme', 'warning primary');
    proceedBtn.textContent = `Update all ${n}`;
    proceedBtn.addEventListener('click', () => {
        viewEditWarningDialog.opened = false;
        openViewEditor(v);
        showToast(`Editing filters — ${n} scheduled report${n > 1 ? 's' : ''} will update`);
    });

    root.appendChild(cancelBtn);
    root.appendChild(saveNewBtn);
    root.appendChild(proceedBtn);
};

// ── Saved view details (opened from the schedules table) ───────────
const savedViewDetailsDialog = document.getElementById('savedViewDetailsDialog');
let pendingDetailsView = null;

function openSavedViewDetails(viewId) {
    pendingDetailsView = SAVED_VIEWS.find(v => v.id === viewId) || null;
    if (!pendingDetailsView) {
        const s = SCHEDULED_REPORTS.find(x => x.savedViewId === viewId);
        if (s) pendingDetailsView = { id: viewId, name: s.savedViewName, report: s.report };
    }
    savedViewDetailsDialog.headerTitle = pendingDetailsView ? pendingDetailsView.name : 'Saved View';
    savedViewDetailsDialog.overlayClass = 'recip-picker-overlay';
    savedViewDetailsDialog.opened = true;
    savedViewDetailsDialog.requestContentUpdate();
}

savedViewDetailsDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '560px';
    root.style.maxWidth = '100%';
    const v = pendingDetailsView;
    if (!v) { root.innerHTML = '<p class="sv-dialog-subtitle">Saved view not found.</p>'; return; }

    const count = scheduleCountForView(v.id);
    const top = document.createElement('div');
    top.className = 'svd-top';
    top.innerHTML = `<span class="${reportBadgeClass(v.report)}">${v.report}</span>
                     <span class="svd-count"><i class="fa-regular fa-clock"></i> ${count} scheduled report${count !== 1 ? 's' : ''}</span>`;
    root.appendChild(top);

    const heading = document.createElement('p');
    heading.className = 'sv-section-heading';
    heading.textContent = 'Filters';
    root.appendChild(heading);

    const summaryEl = document.createElement('div');
    getSavedViewSummary(v).forEach(row => {
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
        summaryEl.appendChild(rowEl);
    });
    root.appendChild(summaryEl);
};

savedViewDetailsDialog.footerRenderer = (root) => {
    root.innerHTML = '';
    const closeBtn = document.createElement('vaadin-button');
    closeBtn.setAttribute('theme', 'secondary');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => { savedViewDetailsDialog.opened = false; });

    const editBtn = document.createElement('vaadin-button');
    editBtn.setAttribute('theme', 'primary');
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit filters';
    editBtn.addEventListener('click', () => {
        const v = pendingDetailsView;
        savedViewDetailsDialog.opened = false;
        if (v) attemptEditView(SAVED_VIEWS.find(x => x.id === v.id) || v);
    });

    root.appendChild(closeBtn);
    root.appendChild(editBtn);
};

// ── Scheduled Reports search + report filter ───────────────────────
function applySrFilters() {
    const reportFilter = document.getElementById('srReportFilter')?.value ?? '';
    const q = document.getElementById('srSearch')?.value.trim().toLowerCase() ?? '';
    const tbody = document.getElementById('srTbody');
    if (!tbody) return;

    // Each band row is followed by its email rows (same data-gid)
    let visibleBands = 0;
    tbody.querySelectorAll('.sr-group-row').forEach(band => {
        const gid = band.dataset.gid;
        const collapsed = band.classList.contains('collapsed');
        const matchReport = !reportFilter || band.dataset.report === reportFilter;
        const viewName = band.querySelector('.sr-band-name')?.textContent.toLowerCase() || '';
        let visible = 0;
        tbody.querySelectorAll(`.sr-delivery[data-gid="${gid}"]`).forEach(row => {
            const matchSearch = !q || row.textContent.toLowerCase().includes(q) || viewName.includes(q);
            const show = matchReport && matchSearch;
            row.style.display = (show && !collapsed) ? '' : 'none';
            if (show) visible++;
        });
        const bandShown = matchReport && visible > 0;
        band.style.display = bandShown ? '' : 'none';
        if (bandShown) visibleBands++;
    });

    // No-results empty state (only when there IS data, but filters hide it all)
    const table = document.getElementById('srTable');
    const empty = document.getElementById('srEmpty');
    const isFiltering = !!reportFilter || !!q;
    if (SCHEDULED_REPORTS.length > 0 && visibleBands === 0 && isFiltering) {
        setSrEmptyMessage('No matching scheduled reports',
            'No scheduled reports match your search or report filter. Try clearing the filters above.');
        if (table) table.style.display = 'none';
        if (empty) empty.style.display = '';
    } else if (SCHEDULED_REPORTS.length > 0) {
        if (table) table.style.display = '';
        if (empty) empty.style.display = 'none';
    }
}

// Swap the Scheduled Reports empty-state copy between zero-data and no-results
function setSrEmptyMessage(title, sub) {
    const empty = document.getElementById('srEmpty');
    if (!empty) return;
    const t = empty.querySelector('.sr-empty-title');
    const s = empty.querySelector('.sr-empty-sub');
    if (t) t.textContent = title;
    if (s) s.innerHTML = sub;
}

document.addEventListener('DOMContentLoaded', () => {
    renderScheduledReports();
    document.getElementById('srReportFilter')?.addEventListener('change', applySrFilters);
    document.getElementById('srSearch')?.addEventListener('input', applySrFilters);
    // Sorting changes DOM order, so re-render
    document.getElementById('srSort')?.addEventListener('change', renderScheduledReports);
    // Initial active-filter badges on the report
    refreshActiveFilters();
});

// ================================================================
// UNSAVED-CHANGES GUARD DIALOG
// Shown when navigating away from a report that has unsaved edits to
// an applied saved view. Forces a Save or Discard decision.
// ================================================================
const unsavedChangesDialog = document.getElementById('unsavedChangesDialog');

// mode: 'leave' (navigation guard) | 'restore' (Restore saved view from the banner)
let unsavedDialogMode = 'leave';

function openUnsavedChangesDialog(mode) {
    unsavedDialogMode = mode || 'leave';
    if (!unsavedChangesDialog) {
        if (unsavedDialogMode === 'leave' && pendingNavId) { performNavigation(pendingNavId); pendingNavId = null; }
        return;
    }
    unsavedChangesDialog.headerTitle = unsavedDialogMode === 'restore' ? 'Back to saved view?' : 'Unsaved Changes';
    unsavedChangesDialog.overlayClass = 'recip-picker-overlay';
    unsavedChangesDialog.noCloseOnEsc = true;
    unsavedChangesDialog.noCloseOnOutsideClick = true;
    unsavedChangesDialog.opened = true;
    unsavedChangesDialog.requestContentUpdate();
}

if (unsavedChangesDialog) {
    unsavedChangesDialog.renderer = (root) => {
        root.innerHTML = '';
        const name = appliedSavedView ? appliedSavedView.name : 'this view';
        const wrap = document.createElement('div');
        wrap.className = 'unsaved-dialog-body';
        const sub = unsavedDialogMode === 'restore'
            ? 'This drops the filter changes you made and returns the report to the saved view.'
            : 'Save or discard your changes before leaving this report.';
        wrap.innerHTML = `
            <div class="unsaved-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div>
                <p class="unsaved-msg">You've changed the filters for <strong>"${name}"</strong> and these edits aren't saved.</p>
                <p class="unsaved-sub">${sub}</p>
            </div>`;
        root.appendChild(wrap);
    };

    unsavedChangesDialog.footerRenderer = (root) => {
        root.innerHTML = '';

        if (unsavedDialogMode === 'restore') {
            // Restore mode — two choices: keep edits, or discard & restore the view
            const keep = document.createElement('vaadin-button');
            keep.setAttribute('theme', 'tertiary');
            keep.textContent = 'Keep My Changes';
            keep.addEventListener('click', () => { unsavedChangesDialog.opened = false; });

            const restore = document.createElement('vaadin-button');
            restore.setAttribute('theme', 'primary');
            restore.innerHTML = '<i class="fa-solid fa-rotate-left" slot="prefix"></i> Back to saved view';
            restore.addEventListener('click', () => {
                unsavedChangesDialog.opened = false;
                restoreSavedView();
            });

            root.appendChild(keep);
            root.appendChild(restore);
            return;
        }

        // Leave mode — keep editing, discard, or save
        const keep = document.createElement('vaadin-button');
        keep.setAttribute('theme', 'tertiary');
        keep.textContent = 'Keep Editing';
        keep.addEventListener('click', () => {
            unsavedChangesDialog.opened = false;
            pendingNavId = null;
        });

        const discard = document.createElement('vaadin-button');
        discard.setAttribute('theme', 'error secondary');
        discard.innerHTML = '<i class="fa-regular fa-trash-can" slot="prefix"></i> Discard Changes';
        discard.addEventListener('click', () => {
            filtersTouched = false;
            restoreFilters();
            updateModifiedBanner();
            refreshActiveFilters();   // revert the chip row to the saved view's filters
            unsavedChangesDialog.opened = false;
            const target = pendingNavId; pendingNavId = null;
            if (target) performNavigation(target);
        });

        const save = document.createElement('vaadin-button');
        save.setAttribute('theme', 'primary');
        save.innerHTML = '<i class="fa-solid fa-floppy-disk" slot="prefix"></i> Save Changes';
        save.addEventListener('click', () => {
            const name = appliedSavedView ? appliedSavedView.name : 'view';
            filtersTouched = false;
            updateModifiedBanner();
            unsavedChangesDialog.opened = false;
            showToast(`Updated "${name}"`);
            const target = pendingNavId; pendingNavId = null;
            if (target) performNavigation(target);
        });

        root.appendChild(keep);
        root.appendChild(discard);
        root.appendChild(save);
    };
}

// ═══════════════════════════════════════════════════════════════════════
// EXPERIMENTAL combined view (Views & Schedules) — self-contained trial.
// Its own sidenav page that merges each saved view's filter setup with its
// scheduled deliveries, manageable in one place. To remove the trial, delete
// this block plus: the #viewsSchedulesLayout HTML, the 'views-schedules'
// entries in REPORTS + NAV_ITEMS, the isCombined branch in performNavigation,
// and the matching CSS block.
// ═══════════════════════════════════════════════════════════════════════
(function initCombinedViewsPage() {
    const layout = document.getElementById('viewsSchedulesLayout');
    const empty = document.getElementById('cmbEmpty');
    if (!layout) return;

    function combinedVisible() { return layout.style.display !== 'none'; }

    const tableEl = document.getElementById('cmbTable');
    const listEl  = document.getElementById('cmbList');
    let viewMode = 'table';   // 'table' | 'card'
    let cmbQuery = '';
    let cmbReport = '';       // report-type filter ('' = all)

    // Collapse state, persisted across re-renders by view id.
    // collapsedDelivs — the deliveries under a view are hidden (filters stay visible).
    const collapsedDelivs = new Set();

    function starBtn(view) {
        const fav = !!view.favorited;
        return `<button type="button" class="msv-star ${fav ? 'active' : ''}" data-id="${view.id}" title="Toggle favorite"><i class="${fav ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>`;
    }

    // ── Table view ──
    // One shared table. Each saved view gets a full-width band (name, report
    // badge, and its filters pulled out into the band — not a column) followed
    // by its scheduled deliveries as clean rows. A view with no deliveries shows
    // an inline message instead of an empty grid. Reuses the Scheduled Reports
    // table styling (.sr-table / .sr-band) so the columns read cleanly.
    function renderTable(views) {
        const body = views.map(view => {
            const schedules = SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id);
            const collapsed = collapsedDelivs.has(view.id);
            const rowAttr = `data-gid="${view.id}"${collapsed ? ' style="display:none"' : ''}`;

            // Saved-view band — the original slim band (chevron + bookmark + name
            // + report badge), with the view's filters added as a muted sub-line.
            const band = `
                <tr class="sr-group-row cmb-band-row ${collapsed ? 'collapsed' : ''}" data-gid="${view.id}">
                    <td colspan="6">
                        <div class="sr-band cmb-tbl-band">
                            <button type="button" class="sr-expand cmb-tbl-toggle" data-id="${view.id}" aria-label="Expand or collapse deliveries"><i class="fa-solid fa-chevron-down"></i></button>
                            <i class="fa-solid fa-bookmark sr-band-icon"></i>
                            <div class="cmb-tbl-band-main">
                                <div class="cmb-tbl-band-titlerow">
                                    <button type="button" class="sr-band-name sr-details-btn cmb-view-details" data-id="${view.id}" title="View saved-view details">${view.name}</button>
                                    <span class="${reportBadgeClass(view.report)}">${view.report}</span>
                                </div>
                                <div class="cmb-tbl-band-filters">${listFiltersHTML(view)}</div>
                            </div>
                            <div class="cmb-band-actions">
                                <button type="button" class="cmb-view-edit" data-id="${view.id}" title="Edit saved view" aria-label="Edit saved view"><i class="fa-solid fa-pencil"></i></button>
                                <button type="button" class="cmb-view-del" data-id="${view.id}" title="Delete saved view" aria-label="Delete saved view"><i class="fa-regular fa-trash-can"></i></button>
                            </div>
                        </div>
                    </td>
                </tr>`;

            const delivRows = schedules.length
                ? schedules.map(s => {
                    const recipText = s.recipients.length <= 2
                        ? s.recipients.join(', ')
                        : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`;
                    return `
                        <tr class="sr-delivery cmb-tbl-row" ${rowAttr}>
                            <td class="sr-dname"><i class="fa-regular fa-paper-plane sr-deliv-icon"></i> ${s.name}</td>
                            <td class="sr-dim">${formatSchedule(s)}</td>
                            <td class="sr-dim" title="${s.recipients.join(', ')}">${recipText}</td>
                            <td class="sr-dim"><span class="sr-sentas"><i class="fa-regular fa-envelope"></i> Email</span> <span class="sr-fmt"><i class="fa-regular fa-file-excel"></i> Excel</span></td>
                            <td class="sr-dim">${s.nextSend}</td>
                            <td>
                                <div class="msv-actions">
                                    <vaadin-button theme="tertiary small" class="cmb-deliv-edit" data-sid="${s.id}">
                                        <i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit
                                    </vaadin-button>
                                    <vaadin-button theme="tertiary small msv-delete" class="cmb-deliv-del" data-sid="${s.id}">
                                        <i class="fa-regular fa-trash-can" slot="prefix"></i> Delete
                                    </vaadin-button>
                                </div>
                            </td>
                        </tr>`;
                  }).join('')
                : `<tr class="cmb-tbl-row cmb-tbl-noschedule" ${rowAttr}><td colspan="6"><span class="cmb-tbl-empty">No deliveries scheduled for this view yet.</span></td></tr>`;

            const addRow = `
                <tr class="cmb-tbl-row cmb-tbl-addrow" ${rowAttr}>
                    <td colspan="6"><button type="button" class="cmb-add-deliv" data-id="${view.id}"><i class="fa-solid fa-plus"></i> Schedule a report</button></td>
                </tr>`;

            return band + delivRows + addRow;
        }).join('');

        tableEl.innerHTML = `
            <table class="report-table sr-table cmb-sched-table">
                <thead>
                    <tr>
                        <th style="width:22%">Name</th>
                        <th style="width:19%">Schedule</th>
                        <th style="width:17%">Recipients</th>
                        <th style="width:16%">Sent As</th>
                        <th style="width:12%">Next Send</th>
                        <th style="width:14%"></th>
                    </tr>
                </thead>
                <tbody>${body}</tbody>
            </table>`;
    }

    // Inline filter summary for the list header — a filter icon then the
    // facets on one line, separated by semicolons.
    function listFiltersHTML(view) {
        const text = viewContentFacets(view)
            .filter(f => ['date', 'acts', 'users', 'status'].includes(f.key))
            .map(f => f.text)
            .join('  ·  ');
        return `<i class="fa-solid fa-sliders cmb-filters-icon"></i><span class="cmb-filters-text">${text}</span>`;
    }

    // A delivery laid out horizontally — the same fields as the detailed block
    // but across the width so each row stays short (used by the list view).
    function delivBlockRow(s) {
        const recipText = s.recipients.length <= 2
            ? s.recipients.join(', ')
            : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`;
        return `
            <div class="cmb-deliv cmb-deliv-rowblock" data-sid="${s.id}">
                <div class="cmb-drow-name"><i class="fa-regular fa-paper-plane cmb-deliv-icon"></i> ${s.name}</div>
                <div class="cmb-drow-field"><span class="cmb-df-label">Schedule</span><span class="cmb-df-value">${formatSchedule(s)}</span></div>
                <div class="cmb-drow-field"><span class="cmb-df-label">Recipients</span><span class="cmb-df-value" title="${s.recipients.join(', ')}">${recipText}</span></div>
                <div class="cmb-drow-field"><span class="cmb-df-label">Sent as</span><span class="cmb-df-value">${sentAsHTML(s)}</span></div>
                <div class="cmb-drow-field"><span class="cmb-df-label">Next send</span><span class="cmb-df-value">${s.nextSend}</span></div>
                <div class="cmb-deliv-actions">
                    <button class="cmb-deliv-edit" data-sid="${s.id}" title="Edit delivery" aria-label="Edit delivery"><i class="fa-solid fa-pencil"></i></button>
                    <button class="cmb-deliv-del" data-sid="${s.id}" title="Delete delivery" aria-label="Delete delivery"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>`;
    }

    // ── Card view: full-width stacked cards (not a table). The view's filters
    // sit inline in the header next to the report type; the deliveries show
    // below as short, horizontal rows. (Same UI the old List view used.) ──
    function renderList(views) {
        listEl.innerHTML = views.map(view => {
            const schedules = SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id);
            const blocks = schedules.length
                ? schedules.map(delivBlockRow).join('')
                : `<div class="cmb-no-deliv">No deliveries scheduled yet.</div>`;
            const delivCollapsed = collapsedDelivs.has(view.id);
            return `
                <div class="cmb-listrow ${delivCollapsed ? 'cmb-delivs-collapsed' : ''}">
                    <div class="cmb-listrow-head">
                        <button type="button" class="cmb-collapse-btn cmb-listrow-toggle" data-id="${view.id}" title="Collapse / expand deliveries" aria-label="Collapse or expand deliveries"><i class="fa-solid fa-chevron-down"></i></button>
                        ${starBtn(view)}
                        <span class="cmb-listrow-title">${view.name}</span>
                        <span class="${reportBadgeClass(view.report)}">${view.report}</span>
                        <div class="cmb-listrow-filters">${listFiltersHTML(view)}</div>
                        <div class="cmb-band-actions">
                            <button type="button" class="cmb-view-edit" data-id="${view.id}" title="Edit saved view" aria-label="Edit saved view"><i class="fa-solid fa-pencil"></i></button>
                            <button type="button" class="cmb-view-del" data-id="${view.id}" title="Delete saved view" aria-label="Delete saved view"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </div>
                    <div class="cmb-delivs">
                        ${blocks}
                        <button type="button" class="cmb-add-deliv" data-id="${view.id}"><i class="fa-solid fa-plus"></i> Schedule a report</button>
                    </div>
                </div>`;
        }).join('');
    }

    // Match a view against the search box: its name, description, report,
    // filter facets, and the names/recipients/schedule of its deliveries.
    function matchesQuery(view, q) {
        if (!q) return true;
        if (view.name.toLowerCase().includes(q)) return true;
        if ((view.desc || '').toLowerCase().includes(q)) return true;
        if ((view.report || '').toLowerCase().includes(q)) return true;
        if (viewContentFacets(view).map(f => f.text).join(' ').toLowerCase().includes(q)) return true;
        return SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id).some(s =>
            s.name.toLowerCase().includes(q)
            || s.recipients.join(' ').toLowerCase().includes(q)
            || formatSchedule(s).toLowerCase().includes(q));
    }

    function renderCombined() {
        const q = cmbQuery.trim().toLowerCase();
        const views = SAVED_VIEWS.filter(v =>
            (!cmbReport || v.report === cmbReport) && matchesQuery(v, q));
        const cardMode = viewMode === 'card';

        tableEl.innerHTML = '';
        listEl.innerHTML = '';
        // When there's nothing to show we hide the table/list entirely (no empty
        // table chrome) and surface the empty state instead.
        tableEl.style.display = (!cardMode && views.length) ? '' : 'none';
        listEl.style.display  = (cardMode && views.length) ? '' : 'none';

        if (empty) {
            empty.style.display = views.length ? 'none' : '';
            const title = empty.querySelector('.sr-empty-title');
            const sub = empty.querySelector('.sr-empty-sub');
            if (!SAVED_VIEWS.length) {
                if (title) title.textContent = 'No saved views yet';
                if (sub) sub.textContent = 'Create a saved view from any report, then schedule deliveries for it here.';
            } else {
                if (title) title.textContent = 'No matches';
                if (sub) sub.textContent = 'Nothing matches your search or report-type filter. Try clearing them.';
            }
        }

        if (views.length) { if (cardMode) renderList(views); else renderTable(views); }
        wire();
    }

    // Wire actions across whichever view is in the DOM (query the whole page)
    function wire() {
        layout.querySelectorAll('.msv-star').forEach(btn => btn.addEventListener('click', () => {
            const v = SAVED_VIEWS.find(x => x.id === btn.dataset.id);
            if (!v) return;
            v.favorited = !v.favorited;
            btn.classList.toggle('active', v.favorited);
            btn.querySelector('i').className = v.favorited ? 'fa-solid fa-star' : 'fa-regular fa-star';
        }));
        layout.querySelectorAll('.cmb-view-edit').forEach(btn => btn.addEventListener('click', () => {
            const v = SAVED_VIEWS.find(x => x.id === btn.dataset.id);
            if (v) attemptEditView(v);
        }));
        layout.querySelectorAll('.cmb-view-del').forEach(btn => btn.addEventListener('click', () => {
            openDeleteSavedViewDialog(btn.dataset.id);
        }));
        // Edit / delete / add a delivery — same modal + behavior as the index
        // Scheduled Reports table (openEmailDialog with editId, no focus mode).
        layout.querySelectorAll('.cmb-deliv-edit').forEach(btn => btn.addEventListener('click', () => {
            const s = SCHEDULED_REPORTS.find(x => x.id === btn.dataset.sid);
            if (s) openEmailDialog({ editId: s.id, reportName: s.report });
        }));
        layout.querySelectorAll('.cmb-deliv-del').forEach(btn => btn.addEventListener('click', () => {
            openDeleteScheduleDialog(btn.dataset.sid);
        }));
        layout.querySelectorAll('.cmb-add-deliv').forEach(btn => btn.addEventListener('click', () => {
            const v = SAVED_VIEWS.find(x => x.id === btn.dataset.id);
            if (v) openEmailDialog({ presetViewId: v.id, reportName: v.report });
        }));
        // View the saved view's details (click the view name in the table band)
        layout.querySelectorAll('.cmb-view-details').forEach(btn => btn.addEventListener('click', () => {
            openSavedViewDetails(btn.dataset.id);
        }));
        // Collapse the deliveries under a table band — hide all rows in the group
        layout.querySelectorAll('.cmb-tbl-toggle').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const collapsed = !collapsedDelivs.has(id);
            if (collapsed) collapsedDelivs.add(id); else collapsedDelivs.delete(id);
            btn.closest('.cmb-band-row')?.classList.toggle('collapsed', collapsed);
            tableEl.querySelectorAll(`.cmb-tbl-row[data-gid="${id}"]`).forEach(r => {
                r.style.display = collapsed ? 'none' : '';
            });
        }));
        // Collapse the deliveries (card view)
        layout.querySelectorAll('.cmb-listrow-toggle').forEach(btn => btn.addEventListener('click', () => {
            const row = btn.closest('.cmb-listrow');
            const collapsed = row.classList.toggle('cmb-delivs-collapsed');
            if (collapsed) collapsedDelivs.add(btn.dataset.id); else collapsedDelivs.delete(btn.dataset.id);
        }));
    }

    // Search box — filters the table/cards as you type
    document.getElementById('cmbSearch')?.addEventListener('input', (e) => {
        cmbQuery = e.target.value;
        renderCombined();
    });

    // Report-type filter
    document.getElementById('cmbReportFilter')?.addEventListener('change', (e) => {
        cmbReport = e.target.value;
        renderCombined();
    });

    // Table / Card toggle
    const vmCtrl = document.getElementById('cmbViewMode');
    vmCtrl?.querySelectorAll('.cmb-vm-btn').forEach(btn => btn.addEventListener('click', () => {
        if (btn.dataset.mode === viewMode) return;
        viewMode = btn.dataset.mode;
        vmCtrl.querySelectorAll('.cmb-vm-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderCombined();
    }));

    // Exposed for performNavigation() to call when the page is opened
    window.renderCombinedViews = renderCombined;

    // Keep the merged table fresh after edits/deletes done through the shared
    // dialogs — re-render when a relevant dialog closes while this page is open.
    [emailReportDialog, scheduleDeleteDialog, savedViewDeleteDialog, saveViewDialog]
        .forEach(dlg => dlg?.addEventListener('opened-changed', (e) => {
            if (!e.detail.value && combinedVisible()) renderCombined();
        }));
})();
