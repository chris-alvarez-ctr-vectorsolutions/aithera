// ================================================================
// REPORTS SIDENAV — navigation between reports
// ================================================================

const reportsSidenav = document.getElementById('reportsSidenav');

// ── Top nav (vwc-topnav, matches Tasklist Report): set logo + keep the sticky
// offsets in sync with the component's rendered height via the --nav-h variable.
(function initTopnav() {
    const topnav = document.getElementById('topnav');
    if (!topnav) return;
    if (typeof topnav.logo !== 'undefined') {
        topnav.logo = { src: '../../../_shell/assets/vs-logo.png', alt: 'Vector Solutions' };
    }
    const syncNavHeight = () => {
        if (topnav.offsetHeight) {
            document.documentElement.style.setProperty('--nav-h', topnav.offsetHeight + 'px');
        }
    };
    syncNavHeight();
    window.addEventListener('load', syncNavHeight);
    window.addEventListener('resize', syncNavHeight);
    if (window.ResizeObserver) new ResizeObserver(syncNavHeight).observe(topnav);
    customElements.whenDefined('vwc-topnav').then(() => requestAnimationFrame(syncNavHeight));
})();

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
    { type: 'button', id: 'manage-saved-views',  text: 'Saved Views' },
    { type: 'button', id: 'scheduled-reports',   text: 'Scheduled Reports' },
];

reportsSidenav.items        = NAV_ITEMS;
reportsSidenav.footerItems  = [];
reportsSidenav.expandedGroupIds = NAV_ITEMS.filter(i => i.type === 'group').map(i => i.id);
reportsSidenav.activeItemId = 'qualification-report';

function navigateToReport(id) {
    const report = REPORTS[id];
    if (!report) return;

    reportsSidenav.activeItemId = id;
    document.querySelector('.bc-current').textContent = report.breadcrumb;

    const isQual      = id === 'qualification-report';
    const isActEx     = id === 'activity-exception';
    const isManage    = id === 'manage-saved-views';
    const isScheduled = id === 'scheduled-reports';
    const isCombined  = id === 'views-schedules';

    document.getElementById('pageLayout').style.display              = isQual      ? '' : 'none';
    document.getElementById('actExLayout').style.display            = isActEx     ? '' : 'none';
    document.getElementById('manageSavedViewsLayout').style.display  = isManage    ? '' : 'none';
    document.getElementById('scheduledReportsLayout').style.display  = isScheduled ? '' : 'none';
    document.getElementById('viewsSchedulesLayout').style.display    = isCombined  ? '' : 'none';
    document.getElementById('reportPlaceholder').style.display       = (!isQual && !isActEx && !isManage && !isScheduled && !isCombined) ? 'flex' : 'none';
    if (!isManage && !isScheduled && !isCombined) document.getElementById('placeholderTitle').textContent = report.title;

    if (isCombined) renderViewsSchedules();

    // Ensure qual filter toggle is hidden when switching away
    if (!isQual) filterToggleBtn.style.display = 'none';
}

reportsSidenav.addEventListener('item-click', (e) => {
    const id = e.detail.id;
    if (id === 'create-report') return;
    if (!REPORTS[id]) return;

    // Guard: leaving the report with unsaved edits to an applied saved view
    if (viewDirty && appliedSavedView && id !== 'qualification-report') {
        pendingNavId = id;
        reportsSidenav.activeItemId = 'qualification-report'; // keep highlight until resolved
        openUnsavedChangesDialog();
        return;
    }

    navigateToReport(id);
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

        if (ctx.mode === 'edit') viewDirty = false;   // updates saved → no longer dirty
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
selectSavedViewDialog.overlayClass = 'select-saved-view-overlay';   // fixed-size overlay (no resize on select)

const SAVED_VIEWS = [
    {
        id: 'q1-compliance', name: 'Q1 Compliance Review',
        report: 'Qualification Report',
        desc: 'Quarterly compliance tracking for all departments',
        dateRange: '01/01/26 – 03/31/26',
        qualIds: ['q12', 'q14'],
        activities: ['Hazardous Materials Handling', 'Lock-Out / Tag-Out (LOTO)'],
        userIds: ['u1', 'u5', 'u6'],
        users: ['Anthony Davis', 'Draymond Green', 'Fred VanVleet'],
        status: 'all', statusTypes: 'All', columns: 'Activity, User, Username, Status, Completion Date',
        activityCount: 2, userCount: 12, favorited: true,
    },
    {
        id: 'confined-space', name: 'Confined Space Teams',
        report: 'Qualification Report',
        desc: 'Tracking for confined space qualification teams',
        dateRange: '04/01/26 – 04/07/26',
        qualIds: ['q4'],
        activities: ['Confined Space Entry'],
        userIds: ['u3', 'u4'],
        users: ["D'Angelo Russell", 'Darvin Ham'],
        status: 'all', statusTypes: 'All', columns: 'Activity, User, Status, Due Date',
        activityCount: 1, userCount: 8, favorited: true,
    },
    {
        id: 'fall-protection', name: 'Fall Protection Group',
        report: 'Qualification Report',
        desc: 'Fall protection certification tracking',
        dateRange: 'All Time',
        qualIds: ['q8', 'q19'],
        activities: ['Fall Protection Training', 'Scaffolding Safety'],
        userIds: ['u1', 'u7'],
        users: ['Anthony Davis', 'Gary Payton II'],
        status: 'qualified', statusTypes: 'Qualified', columns: 'Activity, User, Status',
        activityCount: 3, userCount: 20, favorited: false,
    },
    {
        id: 'crane-ops', name: 'Crane Operations Report',
        report: 'Qualification Report',
        desc: 'Crane operator certification status',
        dateRange: '04/01/26 – 04/07/26',
        qualIds: ['q6'],
        activities: ['Crane Operations Training'],
        userIds: ['u8', 'u10'],
        users: ['Jalen Green', 'Klay Thompson'],
        status: 'all', statusTypes: 'All', columns: 'Activity, User, Status, Completion Date',
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
    /* Overlay width is fixed via the .select-saved-view-overlay class; fill it. */
    root.style.width = '100%';
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

// ── "Saved views" dropdown (replaces the old "Apply Saved View" button) ──
// Label reads "Saved views" when none applied, "Saved views: {name}" when active.
// Content facets for a saved view (date · activities/quals · users · status · columns)
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
        { key: 'date',   text: view.dateRange },
        { key: 'acts',   text: acts },
        { key: 'users',  text: usrs },
        { key: 'status', text: status },
        { key: 'cols',   text: view.columns },
    ].filter(f => f.text);
}
function viewFacetsHTML(view, keys) {
    const facets = viewContentFacets(view).filter(f => !keys || keys.includes(f.key));
    if (!facets.length) return '';
    return `<div class="view-facets">` + facets.map(f => `<span class="vf-item">${f.text}</span>`).join('<span class="vf-sep">·</span>') + `</div>`;
}

// "Saved views" dropdown — rich rows (star + name + desc + facets), no report-type
// badge, grouped Favorites / All (capped at 5 inline). The bottommost row is always
// "All saved views", which opens the full saved-views modal.
function buildSavedViewsDropdown(cfg) {
    const control = document.getElementById(cfg.controlId);
    const btn = document.getElementById(cfg.btnId);
    const menu = document.getElementById(cfg.menuId);
    if (!control || !btn || !menu) return;
    const MAX_INLINE = 5;

    function render() {
        const views = SAVED_VIEWS.filter(v => v.report === cfg.reportName);
        const activeId = (appliedSavedView && appliedSavedView.report === cfg.reportName) ? appliedSavedView.id : null;
        const favorites = views.filter(v => v.favorited);
        const rest      = views.filter(v => !v.favorited);
        const overCap   = views.length > MAX_INLINE;
        const shown     = overCap ? [...favorites, ...rest].slice(0, MAX_INLINE) : [...favorites, ...rest];
        const shownFav  = shown.filter(v => v.favorited);
        const shownRest = shown.filter(v => !v.favorited);

        const itemHTML = (v) => `
            <div class="sv-dd-item ${v.id === activeId ? 'selected' : ''}" data-id="${v.id}">
                <div class="sv-dd-item-head">
                    <span class="sv-dd-star ${v.favorited ? 'active' : ''}" aria-hidden="true" title="${v.favorited ? 'Favorited' : 'Not favorited'}"><i class="${v.favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i></span>
                    <span class="sv-dd-name">${v.name}</span>
                    ${v.id === activeId ? '<i class="fa-solid fa-check sv-dd-check"></i>' : ''}
                </div>
                ${v.desc ? `<p class="sv-dd-desc">${v.desc}</p>` : ''}
                ${viewFacetsHTML(v, ['date', 'acts', 'users', 'status'])}
            </div>`;

        let html = '';
        if (activeId) html += `<button type="button" class="sv-dd-clear"><i class="fa-solid fa-xmark"></i> Clear applied view</button>`;
        html += `<div class="sv-dd-list">`;
        if (!views.length) {
            html += `<div class="sv-dd-empty">No saved views for this report yet.</div>`;
        } else {
            if (shownFav.length)  html += `<div class="sv-dd-section">Favorites</div>` + shownFav.map(itemHTML).join('');
            if (shownRest.length) html += `<div class="sv-dd-section">All saved views</div>` + shownRest.map(itemHTML).join('');
        }
        html += `</div>`;
        // Bottommost row — always present; opens the full saved-views modal
        html += `<button type="button" class="sv-dd-browse"><i class="fa-regular fa-rectangle-list"></i> All saved views${views.length ? ` (${views.length})` : ''}</button>`;
        menu.innerHTML = html;

        menu.querySelector('.sv-dd-clear')?.addEventListener('click', () => { menu.style.display = 'none'; clearAppliedView(); });
        // Favorite is read-only here (the star is just an indicator) — favoriting
        // happens only in the Manage Saved Views grid and the saved-view modals.
        menu.querySelectorAll('.sv-dd-item').forEach(item => item.addEventListener('click', () => {
            const v = SAVED_VIEWS.find(x => x.id === item.dataset.id);
            menu.style.display = 'none';
            if (v) applyView(v);
        }));
        menu.querySelector('.sv-dd-browse')?.addEventListener('click', () => {
            menu.style.display = 'none';
            selectedSavedViewId = null;
            selectSavedViewDialog.opened = true;
        });
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu.style.display === 'none' || !menu.style.display) { render(); menu.style.display = 'block'; }
        else menu.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#' + cfg.controlId)) menu.style.display = 'none';
    });
}

// Keep the "Saved views" buttons in sync with the applied view. The button label
// always reads "Saved views"; when a view is applied its name shows as a removable
// chip inside the button.
function updateSavedViewsLabels() {
    const av = appliedSavedView;
    // When a view is applied, hide the "Saved views" text so only the chip shows.
    const apply = (active, labelId, chipId, nameId) => {
        const label = document.getElementById(labelId);
        const chip  = document.getElementById(chipId);
        const name  = document.getElementById(nameId);
        if (label) label.style.display = active ? 'none' : '';
        if (name && active) name.textContent = av.name;
        if (chip) chip.style.display = active ? '' : 'none';
    };
    apply(!!(av && av.report === 'Qualification Report'),      'savedViewsBtnLabel',      'savedViewsChip',      'savedViewsChipName');
    apply(!!(av && av.report === 'Activity Exception Report'), 'actExSavedViewsBtnLabel', 'actExSavedViewsChip', 'actExSavedViewsChipName');
}
// Clear the applied view straight from the Saved-views control (no need to open the menu)
document.getElementById('savedViewsClear')?.addEventListener('click', (e) => { e.stopPropagation(); clearAppliedView(); });
document.getElementById('actExSavedViewsClear')?.addEventListener('click', (e) => { e.stopPropagation(); clearAppliedView(); });

// The saved view currently applied to the report (null = ad-hoc filters)
let appliedSavedView = null;
let viewDirty = false;      // unsaved edits to the applied saved view
let pendingNavId = null;    // nav target awaiting the unsaved-changes decision

// When a view is applied, the Save controls become "Update View"
function setSaveViewLabels(applied) {
    const btnLabel  = document.getElementById('saveViewBtnLabel');
    const itemLabel = document.getElementById('saveViewItemLabel');
    if (btnLabel)  btnLabel.textContent  = applied ? 'Update View' : 'Save View';
    if (itemLabel) itemLabel.textContent = applied ? 'Update View' : 'Save View';
}

let suppressDirty = false;  // true while we programmatically populate the panel
function markViewDirty() { if (appliedSavedView && !suppressDirty) viewDirty = true; }

// Reflect a saved view's filters in the report filter panel
function populateFilterPanelFromView(view) {
    suppressDirty = true;
    // Date range — reflect the view's range in the dropdown trigger + hidden input
    if (view.dateRange && typeof syncDateRangeDisplay === 'function') {
        syncDateRangeDisplay('#filterPanel', view.dateRange);
    } else {
        const dateInput = document.querySelector('#filterPanel .date-input');
        if (dateInput && view.dateRange) dateInput.value = view.dateRange;
    }

    // Qualification + User chips (driven by pickerState + the picker data)
    if (typeof pickerState !== 'undefined') {
        pickerState.quals = new Set(view.qualIds || []);
        pickerState.qualUsers = new Set(view.userIds || []);
        const qChips = document.getElementById('qualChips');
        const qLabel = document.getElementById('qualFilterLabel');
        if (qChips && qLabel) renderChips(qChips, qLabel, QUALIFICATIONS_DATA, pickerState.quals, 'Qualifications');
        const uChips = document.getElementById('qualUsersChips');
        const uLabel = document.getElementById('qualUsersFilterLabel');
        if (uChips && uLabel) renderChips(uChips, uLabel, USERS_DATA, pickerState.qualUsers, 'Users');
    }

    // Qualification Status checkboxes
    const cq = document.getElementById('chk-qualified');
    const ci = document.getElementById('chk-incomplete');
    const st = view.status || 'all';
    if (cq) cq.checked = (st === 'qualified');
    if (ci) ci.checked = (st === 'incomplete');
    suppressDirty = false;
}

// Surface the applied saved view as an eyebrow ABOVE the report title (view name +
// scheduled-report count as metadata; clicking the count manages this view's
// schedules). The "Last updated" subtitle stays visible underneath the title.
function renderAppliedBanner() {
    [['Qualification Report', 'qualViewEyebrow'],
     ['Activity Exception Report', 'actExViewEyebrow']].forEach(([report, eyeId]) => {
        const eye = document.getElementById(eyeId);
        if (!eye) return;
        const active = appliedSavedView && appliedSavedView.report === report;
        if (!active) { eye.style.display = 'none'; eye.innerHTML = ''; return; }
        const n = scheduleCountForView(appliedSavedView.id);
        const schedHTML = n > 0
            ? `<span class="rvs-sep">·</span><button type="button" class="rvs-sched"><i class="fa-regular fa-clock"></i> ${n} scheduled report${n !== 1 ? 's' : ''}</button>`
            : `<span class="rvs-sep">·</span><span class="rvs-sched-static">No scheduled reports</span>`;
        eye.style.display = 'flex';
        eye.innerHTML = `<span class="rvs-name"><i class="fa-solid fa-bookmark"></i> ${appliedSavedView.name}</span>${schedHTML}`;
        const schedBtn = eye.querySelector('.rvs-sched');
        if (schedBtn) schedBtn.addEventListener('click', () => openManageSchedulesDialog(appliedSavedView));
    });
}

function applyView(view) {
    appliedSavedView = view;
    renderAppliedBanner();
    setSaveViewLabels(true);
    if (view.report === 'Qualification Report') populateFilterPanelFromView(view);
    viewDirty = false;   // freshly applied view is clean
    updateSavedViewsLabels();
}

// Map a saved view to its report page id
function reportIdForView(view) {
    return view.report === 'Activity Exception Report' ? 'activity-exception' : 'qualification-report';
}

// Edit a saved view by opening the report itself with the view applied, so the
// user always sees how filter changes affect the report (then Save View to update).
function openViewInReport(view) {
    const id = reportIdForView(view);
    reportsSidenav.activeItemId = id;
    navigateToReport(id);
    applyView(view);
    showToast(`Editing “${view.name}”. Adjust filters, then use Save View to update it.`);
}

function clearAppliedView() {
    appliedSavedView = null;
    viewDirty = false;
    const svMenu = document.getElementById('saveViewMenu');
    if (svMenu) svMenu.style.display = 'none';
    selectedSavedViewId = null;
    setSaveViewLabels(false);
    renderAppliedBanner();
    updateSavedViewsLabels();
}

// Mark the applied view dirty when its filters are changed
(() => {
    const qp = document.getElementById('filterPanel');
    if (!qp) return;
    qp.addEventListener('change', markViewDirty, true);
    qp.addEventListener('checked-changed', markViewDirty, true);
    qp.addEventListener('click', (e) => {
        if (e.target.closest('.loc-row, .filter-select-btn')) markViewDirty();
    });
})();

// ── Unsaved-changes guard dialog ───────────────────────────────────
const unsavedChangesDialog = document.getElementById('unsavedChangesDialog');

function openUnsavedChangesDialog() {
    unsavedChangesDialog.overlayClass = 'recip-picker-overlay';
    unsavedChangesDialog.opened = true;
    unsavedChangesDialog.requestContentUpdate();
}

function resolvePendingNav() {
    const id = pendingNavId;
    pendingNavId = null;
    if (id) navigateToReport(id);
}

unsavedChangesDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.maxWidth = '460px';
    const name = appliedSavedView ? appliedSavedView.name : 'this saved view';
    const p = document.createElement('p');
    p.className = 'sv-dialog-subtitle';
    p.innerHTML = `You have unsaved changes to <strong>${name}</strong>. Do you want to save them to the saved view, or discard them?`;
    root.appendChild(p);
};

unsavedChangesDialog.footerRenderer = (root) => {
    if (root.firstChild) return;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        pendingNavId = null;
        unsavedChangesDialog.opened = false;
    });

    const discardBtn = document.createElement('vaadin-button');
    discardBtn.setAttribute('theme', 'secondary');
    discardBtn.textContent = 'Discard changes';
    discardBtn.addEventListener('click', () => {
        viewDirty = false;
        unsavedChangesDialog.opened = false;
        showToast('Changes discarded');
        resolvePendingNav();
    });

    const saveBtn = document.createElement('vaadin-button');
    saveBtn.setAttribute('theme', 'primary');
    saveBtn.textContent = 'Save changes';
    saveBtn.addEventListener('click', () => {
        viewDirty = false;
        unsavedChangesDialog.opened = false;
        showToast(`Updated “${appliedSavedView ? appliedSavedView.name : 'saved view'}”`);
        resolvePendingNav();
    });

    root.appendChild(cancelBtn);
    root.appendChild(discardBtn);
    root.appendChild(saveBtn);
};

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
    openSaveViewDialog({ mode: 'create', sourceView: null });
});
// Wire the "Saved views" dropdowns on both reports
buildSavedViewsDropdown({ controlId: 'savedViewsControl',      btnId: 'savedViewsBtn',      menuId: 'savedViewsMenu',      reportName: 'Qualification Report' });
buildSavedViewsDropdown({ controlId: 'actExSavedViewsControl', btnId: 'actExSavedViewsBtn', menuId: 'actExSavedViewsMenu', reportName: 'Activity Exception Report' });
updateSavedViewsLabels();

// ================================================================
// LOCATION DROPDOWN — trigger open/close + tree select
// ================================================================

// Location filter removed from this report's filter panel.

// ================================================================
// MANAGE SAVED VIEWS PAGE
// ================================================================

// Small clock + count tag shown next to the view name when schedules exist
// Distinct report types across saved views + scheduled reports (CRUD multi-select filters)
function getReportTypeOptions() {
    const set = new Set();
    SAVED_VIEWS.forEach(v => set.add(v.report));
    SCHEDULED_REPORTS.forEach(s => set.add(s.report));
    return Array.from(set);
}
// Read selected values from a vaadin-multi-select-combo-box (string items)
function selectedReportTypes(el) {
    const sel = el && el.selectedItems;
    return Array.isArray(sel) ? sel.slice() : [];
}

function renderManageSavedViews() {
    const tbody = document.getElementById('msvTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const q       = (document.getElementById('msvSearch')?.value || '').trim().toLowerCase();
    const favSel  = document.getElementById('msvFavFilter')?.value || 'all';
    const sortSel = document.getElementById('msvSort')?.value || 'name';
    const types   = selectedReportTypes(document.getElementById('msvReportFilter'));

    let rows = SAVED_VIEWS.filter(v => {
        if (types.length && !types.includes(v.report)) return false;
        if (favSel === 'fav'   && !v.favorited) return false;
        if (favSel === 'unfav' &&  v.favorited) return false;
        if (q && !`${v.name} ${v.report} ${v.desc} ${v.dateRange}`.toLowerCase().includes(q)) return false;
        return true;
    });
    rows.sort((a, b) => {
        if (sortSel === 'fav')   return (Number(b.favorited) - Number(a.favorited)) || a.name.localeCompare(b.name);
        if (sortSel === 'sched') return (scheduleCountForView(b.id) - scheduleCountForView(a.id)) || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
    });

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="msv-empty-row">No saved views match your filters.</td></tr>`;
        return;
    }

    rows.forEach(view => {
        const count = scheduleCountForView(view.id);
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        tr.dataset.id = view.id;
        tr.innerHTML = `
            <td>
                <button class="msv-star ${view.favorited ? 'active' : ''}" data-id="${view.id}" title="${view.favorited ? 'Unfavorite' : 'Favorite'}">
                    <i class="${view.favorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </button>
            </td>
            <td class="msv-name-cell"><span class="msv-view-name">${view.name}</span></td>
            <td><span class="${reportBadgeClass(view.report)}">${view.report}</span></td>
            <td class="msv-desc">${view.desc}</td>
            <td>${view.dateRange}</td>
            <td>${count
                ? `<button class="msv-sched-count" data-id="${view.id}" title="View these scheduled reports"><i class="fa-regular fa-clock"></i> ${count}</button>`
                : `<span class="msv-sched-count-zero" title="No scheduled reports">0</span>`}</td>
            <td>
                <div class="msv-actions">
                    <vaadin-button theme="tertiary small" class="msv-edit-btn" data-id="${view.id}">
                        <i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit
                    </vaadin-button>
                    <vaadin-button theme="tertiary small msv-delete" class="msv-delete-btn" data-id="${view.id}">
                        <i class="fa-regular fa-trash-can" slot="prefix"></i> Delete
                    </vaadin-button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });

    // Favorite toggle (re-render so it honors the active fav filter/sort)
    tbody.querySelectorAll('.msv-star').forEach(btn => btn.addEventListener('click', () => {
        const view = SAVED_VIEWS.find(v => v.id === btn.dataset.id);
        if (!view) return;
        view.favorited = !view.favorited;
        renderManageSavedViews();
    }));

    // Scheduled-reports count → cross-navigate to the Scheduled Reports page, filtered to this view
    tbody.querySelectorAll('.msv-sched-count').forEach(btn =>
        btn.addEventListener('click', () => openScheduledReportsForView(btn.dataset.id)));

    // Delete
    tbody.querySelectorAll('.msv-delete-btn').forEach(btn => btn.addEventListener('click', () => {
        const idx = SAVED_VIEWS.findIndex(v => v.id === btn.dataset.id);
        if (idx === -1) return;
        const row = btn.closest('tr');
        row.classList.add('msv-removing');
        setTimeout(() => { SAVED_VIEWS.splice(idx, 1); renderManageSavedViews(); }, 250);
    }));

    // Edit → open the report itself with this view applied (edit filters live)
    tbody.querySelectorAll('.msv-edit-btn').forEach(btn => btn.addEventListener('click', () => {
        const view = SAVED_VIEWS.find(v => v.id === btn.dataset.id);
        if (view) openViewInReport(view);
    }));
}

// Jump to the Scheduled Reports page, pre-filtered to a single saved view
function openScheduledReportsForView(viewId) {
    const view = SAVED_VIEWS.find(v => v.id === viewId);
    navigateToReport('scheduled-reports');
    reportsSidenav.activeItemId = 'scheduled-reports';
    // Drive the Saved view filter to this view; clear the report-type filter so
    // the view's rows aren't hidden by a stale type selection.
    const vf = document.getElementById('srViewFilter');
    const rf = document.getElementById('srReportFilter');
    if (rf) rf.selectedItems = [];
    if (vf && view) vf.selectedItems = [view.name];
    renderScheduledReports();
}

// Set up the Saved Views CRUD filters + initial render
document.addEventListener('DOMContentLoaded', () => {
    const rf = document.getElementById('msvReportFilter');
    if (rf) {
        rf.items = getReportTypeOptions();
        rf.addEventListener('selected-items-changed', renderManageSavedViews);
    }
    document.getElementById('msvFavFilter')?.addEventListener('change', renderManageSavedViews);
    document.getElementById('msvSort')?.addEventListener('change', renderManageSavedViews);
    document.getElementById('msvSearch')?.addEventListener('input', renderManageSavedViews);
    renderManageSavedViews();
});

// Also re-render whenever sidenav navigates to it
reportsSidenav.addEventListener('item-click', (e) => {
    if (e.detail.id === 'manage-saved-views') renderManageSavedViews();
    if (e.detail.id === 'scheduled-reports') renderScheduledReports();
}, { capture: false });


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
        deliveryTypes: ['file'], format: 'PDF',
    },
    {
        id: 'sr2', name: 'Monthly Overdue Activities', report: 'Activity Exception Report',
        savedViewId: 'overdue-nov', savedViewName: 'Overdue Activities Nov',
        freqValue: 'monthly', days: [], dayOfMonth: 1, startDate: '2026-04-01', endDate: '2026-12-31', timeValue: '06:30',
        recipients: ['Gary Payton II', 'Jalen Green'], nextSend: 'Jul 1, 2026',
        deliveryTypes: ['file'], format: 'Excel',
    },
    {
        id: 'sr3', name: 'Quarterly Safety Review', report: 'Qualification Report',
        savedViewId: 'fall-protection', savedViewName: 'Fall Protection Group',
        freqValue: 'quarterly', days: [], dayOfMonth: 1, startDate: '2026-07-01', endDate: '', timeValue: '09:00',
        recipients: ['Anthony Davis'], nextSend: 'Jul 1, 2026',
        deliveryTypes: ['file'], format: 'PDF',
    },
    {
        // Second delivery on the SAME view as sr1 — different audience + cadence.
        id: 'sr4', name: 'Exec Daily Digest', report: 'Qualification Report',
        savedViewId: 'q1-compliance', savedViewName: 'Q1 Compliance Review',
        freqValue: 'daily', days: [], dayOfMonth: 1, startDate: '2026-04-06', endDate: '', timeValue: '07:00',
        recipients: ['Draymond Green'], nextSend: 'Jun 10, 2026', deliveryTypes: ['file'], format: 'CSV',
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
// Compact report-type label for the narrow Scheduled Reports grid badge (full name in the title attr)
function srShortReport(report) {
    if (report === 'Qualification Report') return 'Qualification';
    if (report === 'Activity Exception Report') return 'Activity Exception';
    return report;
}

function formatSchedule(s) {
    let base;
    if (s.freqValue === 'daily')        base = 'Daily';
    else if (s.freqValue === 'weekly')  base = 'Weekly · ' + (s.days.length ? s.days.join(', ') : '—');
    else if (s.freqValue === 'monthly') base = (s.monthMode === 'weekday' && s.monthOrdinal)
        ? `Monthly · ${s.monthOrdinal} ${s.monthWeekday}`
        : 'Monthly · Day ' + s.dayOfMonth;
    else                                base = 'Quarterly';
    let out = `${base} at ${formatTime(s.timeValue)}`;
    if (s.endDate) out += ` · until ${formatDateFriendly(s.endDate)}`;
    return out;
}

// Delivery label — a downloadable report file in the chosen format.
// (Link-to-filtered-report delivery has been removed for now.)
function deliveryLabelHTML(s) {
    return `<span class="da-file"><i class="fa-solid fa-file-arrow-down da-file-icon"></i> ${s.format || 'PDF'}</span>`;
}

// Jump to the report tab for a scheduled report and prepopulate the filters
// from its saved view, so the user sees exactly what the delivered link shows.
function viewFilteredReport(scheduleId) {
    const s = SCHEDULED_REPORTS.find(x => x.id === scheduleId);
    if (!s) return;
    const view = SAVED_VIEWS.find(v => v.id === s.savedViewId);
    const reportTab = s.report === 'Activity Exception Report' ? 'activity-exception' : 'qualification-report';
    navigateToReport(reportTab);
    if (view) applyView(view);
}

// Delegated so it works across every place the label is rendered
// (Scheduled Reports table, Views & Schedules grid, and the card view).
document.addEventListener('click', (e) => {
    const link = e.target.closest('.view-report-link');
    if (!link) return;
    e.preventDefault();
    viewFilteredReport(link.dataset.sid);
});

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
    if (document.getElementById('chk-qualified')?.checked)  statuses.push('Qualified');
    if (document.getElementById('chk-incomplete')?.checked) statuses.push('Incomplete');

    return [
        { icon: 'fa-regular fa-calendar',  label: 'Date Range', value: dateVal },
        { icon: 'fa-solid fa-certificate', label: `Qualifications (${qualNames.length})`, pills: qualNames.length ? qualNames : ['All qualifications'] },
        { icon: 'fa-solid fa-user',        label: `Users (${userNames.length})`,          pills: userNames.length ? userNames : ['All users'] },
        { icon: 'fa-solid fa-tag',         label: 'Qualification Status', value: statuses.length ? statuses.join(', ') : 'All' },
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
    };
    emailReportDialog.overlayClass = 'send-report-overlay';
    emailReportDialog.opened = true;
    refreshEmailDialog();
}

// Re-render the (already open) dialog after the config changes — e.g. when
// switching which delivery is being edited from the in-dialog list.
function refreshEmailDialog() {
    emailReportDialog.headerTitle = emailDialogConfig.editId ? 'Edit Scheduled Report'
        : emailDialogConfig.mode === 'once' ? 'Email Report'
        : 'Schedule Report';
    emailReportDialog.requestContentUpdate();
}

function applyEmailMode(mode) {
    emailDialogConfig.mode = mode;
    const sched = document.getElementById('emailScheduleFields');
    if (sched) sched.style.display = mode === 'schedule' ? '' : 'none';
    // The saved-view requirement only applies to scheduling
    const note = document.getElementById('emailSavedViewNote');
    if (note) note.style.display = mode === 'schedule' ? '' : 'none';
    // Inline "save as a saved view" — only when scheduling without an applied/tied view
    const inline = document.getElementById('emailSaveViewInline');
    if (inline) {
        const needsView = mode === 'schedule' && !getDialogSavedView(emailDialogConfig);
        inline.style.display = needsView ? '' : 'none';
    }
    document.querySelectorAll('#emailModeToggle .email-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    updateEmailPrimaryLabel();
}

function applyFreqDetail(value) {
    ['weekly', 'monthly', 'quarterly'].forEach(f => {
        const el = document.getElementById('freq-' + f);
        if (el) el.style.display = (f === value) ? '' : 'none';
    });
}

function updateEmailPrimaryLabel() {
    const btn = document.getElementById('emailPrimaryBtn');
    if (!btn) return;
    if (emailDialogConfig.editId)            btn.textContent = 'Save Changes';
    else if (emailDialogConfig.mode === 'schedule') btn.textContent = 'Schedule Report';
    else                                     btn.textContent = 'Send Email';
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
    root.style.width = '100%';
    root.style.maxWidth = '100%';

    const cfg  = emailDialogConfig;
    const edit = cfg.editId ? SCHEDULED_REPORTS.find(s => s.id === cfg.editId) : null;

    root.innerHTML = `
        <p class="sv-dialog-subtitle">Send this <strong>${cfg.reportName}</strong> now, or set up a recurring email delivery.</p>

        <div class="email-mode-toggle" id="emailModeToggle" style="display:none">
            <button type="button" class="email-mode-btn" data-mode="once"><i class="fa-regular fa-paper-plane"></i> Send Once</button>
            <button type="button" class="email-mode-btn" data-mode="schedule"><i class="fa-regular fa-clock"></i> Schedule</button>
        </div>

        <div class="email-two-col">
          <div class="email-col-main">
            <p class="sv-section-heading">Recipients <span class="sv-req">*</span></p>
            <div class="recip-box" id="recipBox">
                <div class="recip-chips" id="recipChips"></div>
                <input type="text" id="recipInput" class="recip-input" aria-label="Recipients"
                    placeholder="Type a name or email, or paste comma-separated…">
            </div>
            <div class="recip-tools">
                <button type="button" class="recip-browse" id="recipBrowseBtn">
                    <i class="fa-solid fa-address-book"></i> Browse all users
                </button>
                <span class="recip-error" id="recipError"></span>
            </div>

            <!-- SCHEDULE-ONLY FIELDS -->
            <div id="emailScheduleFields">
                <hr class="sv-hr">
                <p class="sv-section-heading">Scheduled report name <span class="sv-req">*</span></p>
                <vaadin-text-field theme="outlined" id="emailScheduleName" label="Name"
                    placeholder="e.g. Exec team weekly" required style="width:100%"></vaadin-text-field>

                <hr class="sv-hr">

                <p class="sv-section-heading">Recurrence</p>
                <vaadin-select theme="outlined" id="emailFrequency" label="Frequency" style="width:200px"></vaadin-select>

                <div id="freq-weekly" class="freq-detail">
                    <label class="filter-label" style="display:block;margin-bottom:6px">Send on</label>
                    <div class="dow-row" id="dowRow"></div>
                </div>
                <div id="freq-monthly" class="freq-detail">
                    <div class="month-mode">
                        <label class="month-mode-opt">
                            <input type="radio" name="monthMode" value="weekday" checked>
                            <span class="month-mode-row">On the
                                <vaadin-select theme="outlined small" id="emailMonthOrdinal" style="width:120px"></vaadin-select>
                                <vaadin-select theme="outlined small" id="emailMonthWeekday" style="width:150px"></vaadin-select>
                                of every month</span>
                        </label>
                        <label class="month-mode-opt">
                            <input type="radio" name="monthMode" value="day">
                            <span class="month-mode-row">On day
                                <vaadin-select theme="outlined small" id="emailDayOfMonth" style="width:104px"></vaadin-select>
                                of every month</span>
                        </label>
                        <p class="month-day-note">If a month doesn’t have that day (e.g. day 31 in February), the report sends on the month’s last day.</p>
                    </div>
                </div>
                <div id="freq-quarterly" class="freq-detail freq-note">
                    <i class="fa-regular fa-circle-info"></i> Sends on the first day of each quarter (Jan, Apr, Jul, Oct).
                </div>

                <div class="email-fieldrow">
                    <vaadin-date-picker theme="outlined" id="emailStartDate" label="Start date" required style="width:180px"></vaadin-date-picker>
                    <vaadin-select theme="outlined" id="emailTime" label="Time" style="width:140px"></vaadin-select>
                    <vaadin-date-picker theme="outlined" id="emailEndDate" label="End date (optional)"
                        helper-text="Leave blank to run indefinitely" style="width:180px"></vaadin-date-picker>
                </div>
            </div>

            <hr class="sv-hr">

            <!-- EMAIL CONTENT (both modes) -->
            <p class="sv-section-heading">Email message</p>
            <vaadin-text-field theme="outlined" id="emailSubject" label="Subject"
                placeholder="${cfg.reportName}" style="width:100%"></vaadin-text-field>
            <vaadin-text-area theme="outlined" id="emailMessage" label="Body message"
                placeholder="Add a message for recipients..." style="width:100%;margin-top:10px"></vaadin-text-area>

            <hr class="sv-hr">

            <p class="sv-section-heading">Delivery</p>
            <p class="deliv-single-note"><i class="fa-solid fa-file-arrow-down"></i> Recipients get a Convergence link to download the report file.</p>
            <vaadin-select theme="outlined" id="emailFormat" label="File format" style="width:100%;margin-top:10px"></vaadin-select>
          </div>

          <aside class="email-col-summary">
            <p class="sv-section-heading">Report contents</p>
            <div id="emailSavedViewNote" class="email-sv-note"></div>
            <div id="emailFilterSummary"></div>

            <!-- Inline "save as a saved view" — shown only when scheduling without an applied view -->
            <div class="email-saveview-inline" id="emailSaveViewInline" style="display:none">
                <hr class="sv-hr">
                <p class="sv-section-heading">Save as a saved view <span class="sv-req">*</span></p>
                <p class="email-saveview-helper"><i class="fa-solid fa-circle-info"></i> A saved view is required to schedule a report. Name it to save these filters and finish scheduling.</p>
                <vaadin-text-field theme="outlined" id="emailSaveViewName" label="Saved view name"
                    placeholder="e.g. Weekly Compliance Review" required style="width:100%"></vaadin-text-field>
                <vaadin-text-area theme="outlined" id="emailSaveViewDesc" label="Description (optional)"
                    placeholder="What this view shows..." style="width:100%;margin-top:10px"></vaadin-text-area>
            </div>
          </aside>
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

    // Delivery is a downloadable report file — pick the format.
    const fmtSel = root.querySelector('#emailFormat');
    fmtSel.items = [
        { label: 'Adobe PDF', value: 'PDF' },
        { label: 'Microsoft Excel', value: 'Excel' },
        { label: 'CSV', value: 'CSV' },
    ];
    fmtSel.value = (edit && edit.format) || 'PDF';

    // Email subject + body — prefill with sensible defaults. The subject auto-fills
    // as "[Report] - [Scheduled Report Name]" and live-syncs until the user edits it.
    const subjEl = root.querySelector('#emailSubject');
    const msgEl  = root.querySelector('#emailMessage');
    const BODY_TEMPLATE = `Your scheduled report "${cfg.reportName}" is ready. Click the attached Convergence link to download your report file. This is a legitimate email sent from Convergence because this report was scheduled for delivery to you. If you weren't expecting it, you can safely ignore this message or reach out to your administrator.`;
    let subjectEdited = false;
    if (edit) {
        if (subjEl) subjEl.value = edit.subject || `${cfg.reportName} - ${edit.name}`;
        if (msgEl)  msgEl.value  = edit.message || BODY_TEMPLATE;
        subjectEdited = !!edit.subject;
    } else {
        if (subjEl) subjEl.value = cfg.reportName;
        if (msgEl)  msgEl.value  = BODY_TEMPLATE;
    }
    if (subjEl) subjEl.addEventListener('input', () => { subjectEdited = true; });
    // Schedule-name field calls this to keep the subject in the prefill format
    root._syncSubject = (schedName) => {
        if (subjectEdited || !subjEl) return;
        subjEl.value = schedName ? `${cfg.reportName} - ${schedName}` : cfg.reportName;
    };

    // Frequency select
    const freqSel = root.querySelector('#emailFrequency');
    freqSel.items = [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
    ];
    freqSel.value = edit ? edit.freqValue : 'weekly';
    freqSel.addEventListener('value-changed', () => applyFreqDetail(freqSel.value));

    // Time select (15-minute intervals; formatTime shows AM/PM)
    const timeSel = root.querySelector('#emailTime');
    timeSel.items = Array.from({ length: 96 }, (_, i) => {
        const v = String(Math.floor(i / 4)).padStart(2, '0') + ':' + String((i % 4) * 15).padStart(2, '0');
        return { label: formatTime(v), value: v };
    });
    timeSel.value = edit ? edit.timeValue : '08:00';

    // Monthly: ordinal + weekday selects, day-of-month (1–31), and mode radios
    const ordSel = root.querySelector('#emailMonthOrdinal');
    ordSel.items = ['first', 'second', 'third', 'fourth', 'last'].map(x => ({ label: x, value: x }));
    ordSel.value = (edit && edit.monthOrdinal) || 'first';

    const wdSel = root.querySelector('#emailMonthWeekday');
    wdSel.items = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(x => ({ label: x, value: x }));
    wdSel.value = (edit && edit.monthWeekday) || 'Monday';

    const domSel = root.querySelector('#emailDayOfMonth');
    domSel.items = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
    domSel.value = String(edit ? edit.dayOfMonth : 1);

    const mMode = (edit && edit.monthMode) || 'weekday';
    const mr = root.querySelector(`input[name="monthMode"][value="${mMode}"]`);
    if (mr) mr.checked = true;

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

    // Prefill schedule name / dates in edit mode
    if (edit) {
        root.querySelector('#emailScheduleName').value = edit.name;
        root.querySelector('#emailStartDate').value = edit.startDate;
        root.querySelector('#emailEndDate').value = edit.endDate || '';
    }

    // Keep the subject in the "[Report] - [Name]" prefill format as the name is typed
    const schedNameEl = root.querySelector('#emailScheduleName');
    schedNameEl?.addEventListener('input', () => root._syncSubject(schedNameEl.value.trim()));
    if (!edit) root._syncSubject(schedNameEl?.value.trim() || '');

    // Mode toggle buttons
    root.querySelectorAll('#emailModeToggle .email-mode-btn').forEach(b => {
        b.addEventListener('click', () => applyEmailMode(b.dataset.mode));
    });

    // Saved-view note + filter summary
    renderSavedViewNote(cfg);
    const dialogView = getDialogSavedView(cfg);
    const summaryEl = root.querySelector('#emailFilterSummary');
    const summaryRows = dialogView ? getSavedViewSummary(dialogView) : getReportFilterSummary(cfg.reportName);
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

    // Apply initial mode + freq detail
    applyEmailMode(cfg.mode);
    applyFreqDetail(freqSel.value);
};

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

    // ── Send once ──
    if (cfg.mode === 'once') {
        emailReportDialog.opened = false;
        showToast(`Report sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`);
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
    const monthMode = document.querySelector('input[name="monthMode"]:checked')?.value || 'weekday';
    const monthOrdinal = document.getElementById('emailMonthOrdinal')?.value || 'first';
    const monthWeekday = document.getElementById('emailMonthWeekday')?.value || 'Monday';
    const days = [...document.querySelectorAll('#dowRow .dow-btn.active')].map(b => b.dataset.dow);

    if (freqValue === 'weekly' && days.length === 0) {
        showToast('Select at least one day of the week');
        return;
    }
    if (!startDate) {
        const sp = document.getElementById('emailStartDate');
        if (sp) { sp.invalid = true; sp.errorMessage = 'Start date is required'; }
        return;
    }
    if (endDate && startDate && endDate < startDate) {
        const ep = document.getElementById('emailEndDate');
        if (ep) { ep.invalid = true; ep.errorMessage = 'End date must be after the start date'; }
        return;
    }

    // Delivery is always a downloadable report file (link delivery removed)
    const deliveryTypes = ['file'];
    const format  = document.getElementById('emailFormat')?.value || 'PDF';
    const subject = document.getElementById('emailSubject')?.value || '';
    const message = document.getElementById('emailMessage')?.value || '';

    const pending = {
        name, report: cfg.reportName, freqValue, days, dayOfMonth,
        monthMode, monthOrdinal, monthWeekday, startDate, endDate, timeValue,
        recipients: [...recipients], deliveryTypes, format, subject, message,
        nextSend: formatDateFriendly(startDate),
    };

    // A schedule must be tied to a saved view. If none is applied, create one from
    // the inline name/description captured in the modal's summary column.
    let view = getDialogSavedView(cfg);
    if (!view) {
        const nameF = document.getElementById('emailSaveViewName');
        const viewName = nameF?.value.trim();
        if (!viewName) {
            if (nameF) { nameF.invalid = true; nameF.errorMessage = 'Saved view name is required'; }
            return;
        }
        const desc = document.getElementById('emailSaveViewDesc')?.value.trim() || 'Created while scheduling a report';
        view = createSavedViewFromFilters(viewName, desc, cfg.reportName);
        appliedSavedView = view;
        if (cfg.reportName === 'Qualification Report') applyView(view);
        renderManageSavedViews();
    }

    finalizeSchedule(pending, view);
}

// Build a saved view from the report's current filters (used when scheduling
// without an applied view — name/description come from the inline modal inputs).
function createSavedViewFromFilters(name, desc, reportName) {
    const summary = getReportFilterSummary(reportName);
    const dateRow = summary.find(r => /date/i.test(r.label));
    const curQualIds = (typeof pickerState !== 'undefined') ? [...pickerState.quals] : [];
    const curUserIds = (typeof pickerState !== 'undefined') ? [...pickerState.qualUsers] : [];
    const curStatus = document.getElementById('chk-qualified')?.checked ? 'qualified'
        : document.getElementById('chk-incomplete')?.checked ? 'incomplete' : 'all';
    const view = {
        id: 'view-' + (Date.now ? Date.now() : Math.floor(performance.now())),
        name, report: reportName, desc,
        dateRange: (dateRow && dateRow.value) || 'Custom range',
        qualIds: curQualIds,
        activities: (summary.find(r => /qualif|activit/i.test(r.label)) || {}).pills || [],
        userIds: curUserIds,
        users: (summary.find(r => /user/i.test(r.label)) || {}).pills || [],
        status: curStatus,
        statusTypes: (summary.find(r => /status/i.test(r.label)) || {}).value || 'All',
        columns: (summary.find(r => /column/i.test(r.label)) || {}).value || '—',
        activityCount: 0, userCount: 0, favorited: false,
    };
    SAVED_VIEWS.push(view);
    return view;
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
    renderAppliedBanner();   // keep the report-page schedule badge in sync
    if (manageSchedulesDialog.opened) manageSchedulesDialog.requestContentUpdate();
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

        const curQualIds = (typeof pickerState !== 'undefined') ? [...pickerState.quals] : [];
        const curUserIds = (typeof pickerState !== 'undefined') ? [...pickerState.qualUsers] : [];
        const curStatus = document.getElementById('chk-qualified')?.checked ? 'qualified'
            : document.getElementById('chk-incomplete')?.checked ? 'incomplete' : 'all';
        const newView = {
            id: 'view-' + (Date.now ? Date.now() : Math.floor(performance.now())),
            name: viewName,
            report: reportName,
            desc: 'Created while scheduling a report',
            dateRange: (dateRow && dateRow.value) || 'Custom range',
            qualIds: curQualIds,
            activities: (summary.find(r => /qualif|activit/i.test(r.label)) || {}).pills || [],
            userIds: curUserIds,
            users: (summary.find(r => /user/i.test(r.label)) || {}).pills || [],
            status: curStatus,
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

// Wire the "Schedule Report" buttons on both reports (recurring delivery)
document.getElementById('emailBtn')?.addEventListener('click',
    () => openEmailDialog({ mode: 'schedule', reportName: 'Qualification Report' }));
document.getElementById('actExEmailBtn')?.addEventListener('click',
    () => openEmailDialog({ mode: 'schedule', reportName: 'Activity Exception Report' }));

// Wire the "Share" dropdowns: one-time email vs download the report file
function wireShareControl(controlId, btnId, menuId, emailItemId, downloadItemId, reportName) {
    const control = document.getElementById(controlId);
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!control || !btn || !menu) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById(emailItemId)?.addEventListener('click', () => {
        menu.style.display = 'none';
        openEmailDialog({ mode: 'once', reportName });
    });
    document.getElementById(downloadItemId)?.addEventListener('click', () => {
        menu.style.display = 'none';
        showToast(`Downloading ${reportName} (PDF)…`);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#' + controlId)) menu.style.display = 'none';
    });
}
wireShareControl('shareControl', 'shareBtn', 'shareMenu', 'emailNowItem', 'downloadItem', 'Qualification Report');
wireShareControl('actExShareControl', 'actExShareBtn', 'actExShareMenu', 'actExEmailNowItem', 'actExDownloadItem', 'Activity Exception Report');


// ── Scheduled Reports page ─────────────────────────────────────────
// Filter state set when arriving from a saved view's "scheduled reports" count
// Distinct saved-view names that have scheduled reports (for the CRUD filter)
function getScheduledViewNames() {
    return [...new Set(SCHEDULED_REPORTS.map(s => s.savedViewName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
function selectedViewNames(el) {
    const sel = el && el.selectedItems;
    return Array.isArray(sel) ? sel.slice() : [];
}

// Flat, single-layer grid: one row per scheduled report, with Report Type and
// Saved View as their own columns (no grouping / expansion).
function renderScheduledReports() {
    const tbody = document.getElementById('srTbody');
    const empty = document.getElementById('srEmpty');
    const table = document.getElementById('srTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Keep the Saved view filter options in sync with the current schedules
    const vfEl = document.getElementById('srViewFilter');
    if (vfEl) {
        const names = getScheduledViewNames();
        if (JSON.stringify(vfEl.items || []) !== JSON.stringify(names)) vfEl.items = names;
    }

    const q         = (document.getElementById('srSearch')?.value || '').trim().toLowerCase();
    const sortSel   = document.getElementById('srSort')?.value || 'report';
    const types     = selectedReportTypes(document.getElementById('srReportFilter'));
    const viewNames = selectedViewNames(document.getElementById('srViewFilter'));

    let rows = SCHEDULED_REPORTS.filter(s => {
        if (types.length && !types.includes(s.report)) return false;
        if (viewNames.length && !viewNames.includes(s.savedViewName)) return false;
        if (q && !`${s.name} ${s.report} ${s.savedViewName || ''} ${s.recipients.join(' ')}`.toLowerCase().includes(q)) return false;
        return true;
    });
    rows.sort((a, b) => {
        if (sortSel === 'name') return a.name.localeCompare(b.name);
        if (sortSel === 'view') return (a.savedViewName || '').localeCompare(b.savedViewName || '') || a.name.localeCompare(b.name);
        if (sortSel === 'next') return a.name.localeCompare(b.name);
        return (srReportRank(a.report) - srReportRank(b.report)) || (a.savedViewName || '').localeCompare(b.savedViewName || '');
    });

    if (!rows.length) {
        if (table) table.style.display = 'none';
        if (empty) empty.style.display = '';
        return;
    }
    if (table) table.style.display = '';
    if (empty) empty.style.display = 'none';

    rows.forEach(s => {
        const recipText = s.recipients.length <= 2
            ? s.recipients.join(', ')
            : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`;
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        tr.dataset.id = s.id;
        tr.innerHTML = `
            <td class="sr-dname"><i class="fa-regular fa-paper-plane sr-deliv-icon"></i> ${s.name}</td>
            <td><span class="${reportBadgeClass(s.report)}" title="${s.report}">${srShortReport(s.report)}</span></td>
            <td>${s.savedViewId
                ? `<button class="sr-view-link" data-view="${s.savedViewId}" title="View saved view details">${s.savedViewName || '—'}</button>`
                : `<span class="sr-dim">—</span>`}</td>
            <td class="sr-dim">${formatSchedule(s)}</td>
            <td class="sr-dim" title="${s.recipients.join(', ')}">${recipText}</td>
            <td class="sr-dim">${deliveryLabelHTML(s)}</td>
            <td class="sr-dim">${s.nextSend}</td>
            <td>
                <div class="msv-actions">
                    <vaadin-button theme="tertiary small" class="sr-edit-btn" data-id="${s.id}">
                        <i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit
                    </vaadin-button>
                    <vaadin-button theme="tertiary small msv-delete" class="sr-delete-btn" data-id="${s.id}">
                        <i class="fa-regular fa-trash-can" slot="prefix"></i> Delete
                    </vaadin-button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });

    // Saved-view name → details
    tbody.querySelectorAll('.sr-view-link').forEach(btn =>
        btn.addEventListener('click', () => { if (btn.dataset.view) openSavedViewDetails(btn.dataset.view); }));
    // Edit → go to the report page, apply the view, then open the edit dialog there
    tbody.querySelectorAll('.sr-edit-btn').forEach(btn => btn.addEventListener('click', () => {
        const s = SCHEDULED_REPORTS.find(x => x.id === btn.dataset.id);
        if (s) openScheduleInReport(s);
    }));
    // Delete
    tbody.querySelectorAll('.sr-delete-btn').forEach(btn =>
        btn.addEventListener('click', () => openDeleteScheduleDialog(btn.dataset.id)));
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
            renderAppliedBanner();   // schedule count on the report page may have changed
            if (manageSchedulesDialog.opened) manageSchedulesDialog.requestContentUpdate();
            showToast(`Deleted "${name}"`);
            // If the delete happened from inside the open schedule dialog, refresh it
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

// ── Manage scheduled reports from the report page (the applied-view badge) ──
const manageSchedulesDialog = document.getElementById('manageSchedulesDialog');
let manageSchedulesViewId = null;

function openManageSchedulesDialog(view) {
    if (!view) return;
    manageSchedulesViewId = view.id;
    manageSchedulesDialog.opened = true;
    manageSchedulesDialog.requestContentUpdate();
}

manageSchedulesDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '640px';
    root.style.maxWidth = '100%';
    const view = SAVED_VIEWS.find(v => v.id === manageSchedulesViewId);
    const list = SCHEDULED_REPORTS.filter(s => s.savedViewId === manageSchedulesViewId);

    const sub = document.createElement('p');
    sub.className = 'sv-dialog-subtitle';
    sub.innerHTML = `Recurring deliveries for <strong>${view ? view.name : 'this view'}</strong>. Edit or remove a delivery, or schedule a new one.`;
    root.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'ms-list';
    if (list.length) {
        list.forEach(s => {
            const row = document.createElement('div');
            row.className = 'ms-row';
            row.innerHTML = `
                <div class="ms-row-main">
                    <span class="ms-row-name"><i class="fa-regular fa-paper-plane"></i> ${s.name}</span>
                    <span class="ms-row-sub">${formatSchedule(s)} · ${s.recipients.length} recipient${s.recipients.length > 1 ? 's' : ''} · ${s.format || 'PDF'}</span>
                </div>
                <div class="ms-row-actions">
                    <vaadin-button theme="tertiary small" class="ms-edit" data-id="${s.id}"><i class="fa-regular fa-pen-to-square" slot="prefix"></i> Edit</vaadin-button>
                    <vaadin-button theme="tertiary small msv-delete" class="ms-del" data-id="${s.id}"><i class="fa-regular fa-trash-can" slot="prefix"></i> Delete</vaadin-button>
                </div>`;
            wrap.appendChild(row);
        });
    } else {
        wrap.innerHTML = `<div class="ms-empty">No scheduled reports for this view yet.</div>`;
    }
    root.appendChild(wrap);

    wrap.querySelectorAll('.ms-edit').forEach(b => b.addEventListener('click', () => {
        const s = SCHEDULED_REPORTS.find(x => x.id === b.dataset.id);
        manageSchedulesDialog.opened = false;
        if (s) openEmailDialog({ editId: s.id, reportName: s.report });
    }));
    wrap.querySelectorAll('.ms-del').forEach(b => b.addEventListener('click', () => openDeleteScheduleDialog(b.dataset.id)));
};

manageSchedulesDialog.footerRenderer = (root) => {
    if (root.firstChild) return;
    const newBtn = document.createElement('vaadin-button');
    newBtn.setAttribute('theme', 'secondary');
    newBtn.innerHTML = '<i class="fa-regular fa-clock" slot="prefix"></i> Schedule new report';
    newBtn.addEventListener('click', () => {
        const view = SAVED_VIEWS.find(v => v.id === manageSchedulesViewId);
        manageSchedulesDialog.opened = false;
        openEmailDialog({ mode: 'schedule', reportName: view ? view.report : 'Qualification Report' });
    });
    const doneBtn = document.createElement('vaadin-button');
    doneBtn.setAttribute('theme', 'primary');
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', () => { manageSchedulesDialog.opened = false; });
    root.appendChild(newBtn);
    root.appendChild(doneBtn);
};

// (The report-page "scheduled reports" metadata link is wired per-render in
//  renderAppliedBanner, since the subtitle is rebuilt each time a view is applied.)

// Edit a scheduled report from the CRUD → go to its report page, apply the view,
// then open the schedule edit dialog (so editing happens on the report itself).
function openScheduleInReport(s) {
    const id = reportIdForView({ report: s.report });
    reportsSidenav.activeItemId = id;
    navigateToReport(id);
    const view = SAVED_VIEWS.find(v => v.id === s.savedViewId);
    if (view) applyView(view);
    openEmailDialog({ editId: s.id, reportName: s.report });
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
document.addEventListener('DOMContentLoaded', () => {
    const rf = document.getElementById('srReportFilter');
    if (rf) {
        rf.items = getReportTypeOptions();
        rf.addEventListener('selected-items-changed', renderScheduledReports);
    }
    const vf = document.getElementById('srViewFilter');
    if (vf) {
        vf.items = getScheduledViewNames();
        vf.addEventListener('selected-items-changed', renderScheduledReports);
    }
    document.getElementById('srSearch')?.addEventListener('input', renderScheduledReports);
    document.getElementById('srSort')?.addEventListener('change', renderScheduledReports);
    renderScheduledReports();
});


// ================================================================
// VIEWS & SCHEDULES — combined management page (DevExtreme-style)
// ================================================================

// Column model per report type (used by the saved-view editor's column chooser)
const REPORT_COLUMNS = {
    'Qualification Report':      ['Qualification', 'User', 'Username', 'Status', 'Completion Date', 'Due Date', 'Assigned Date', 'Location'],
    'Activity Exception Report': ['Activity', 'User', 'Username', 'Status', 'Completion Date', 'Next Due Date', 'Location'],
};
const STATUS_OPTIONS = {
    'Qualification Report':      ['Qualified', 'Incomplete'],
    'Activity Exception Report': ['Completed', 'In Progress', 'Overdue', 'Incomplete'],
};

// The qualifications/activities picker data for a given report type
function reportItemsData(report) {
    return report === 'Activity Exception Report' ? ACTIVITIES_DATA : QUALIFICATIONS_DATA;
}

// Resolve a saved view's visible columns (falls back to its columns string, then a default)
function viewVisibleColumns(view) {
    if (Array.isArray(view.visibleColumns) && view.visibleColumns.length) return view.visibleColumns.slice();
    const all = REPORT_COLUMNS[view.report] || [];
    if (view.columns) {
        let set = view.columns.split(',').map(s => s.trim());
        if (view.report === 'Qualification Report') set = set.map(s => (s === 'Activity' ? 'Qualification' : s));
        const matched = all.filter(c => set.includes(c));
        if (matched.length) return matched;
    }
    return all.slice(0, 5);
}

// One-line filter summary for the grid row
function vsFacetParts(view) {
    const parts = [];
    if (view.dateRange) parts.push(view.dateRange);
    const acts = view.activities || [];
    if (acts.length) parts.push(acts.length > 2 ? `${acts.length} ${view.report === 'Activity Exception Report' ? 'activities' : 'qualifications'}` : acts.join(', '));
    const us = view.users || [];
    if (us.length) parts.push(us.length > 2 ? `${us.length} users` : us.join(', '));
    if (view.statusTypes && view.statusTypes !== 'All') parts.push(view.statusTypes);
    return parts;
}
function vsFacetsText(view) {
    const parts = vsFacetParts(view);
    return parts.length ? parts.join('  ·  ') : 'No filters applied';
}

// Compact filter summary shown under the view name; collapses to the first few
// facets with a "more" toggle that reveals the rest in place.
const VS_FILTER_PREVIEW = 2;
function vsNameFiltersHTML(view) {
    const parts = vsFacetParts(view);
    if (!parts.length) {
        return `<span class="dx-name-filters dx-nf-empty"><i class="fa-solid fa-sliders dx-nf-icon"></i> No filters applied</span>`;
    }
    const expanded = vsFiltersExpanded.has(view.id);
    const hasMore = parts.length > VS_FILTER_PREVIEW;
    const shown = (expanded || !hasMore) ? parts : parts.slice(0, VS_FILTER_PREVIEW);
    const moreBtn = hasMore
        ? `<button type="button" class="dx-nf-more" data-id="${view.id}">${expanded ? 'less' : `+${parts.length - VS_FILTER_PREVIEW} more`}</button>`
        : '';
    return `<span class="dx-name-filters">
                <i class="fa-solid fa-sliders dx-nf-icon"></i>
                <span class="dx-nf-text">${shown.join('  ·  ')}</span>
                ${moreBtn}
            </span>`;
}

const vsCollapsed = new Set();        // view ids whose detail panel is collapsed
const vsFiltersExpanded = new Set();  // view ids whose name-row filters are expanded
let vsViewMode = 'grid';        // 'grid' (Andy's grid) | 'card' (alternate card layout)

function renderViewsSchedules() {
    const body  = document.getElementById('vsBody');
    const cards = document.getElementById('vsCards');
    const empty = document.getElementById('vsEmpty');
    const head  = document.querySelector('#vsGrid .dx-grid-head');
    if (!body) return;

    const reportFilter = document.getElementById('vsReportFilter')?.value || '';
    const q = (document.getElementById('vsSearch')?.value || '').trim().toLowerCase();

    const views = SAVED_VIEWS.filter(v => {
        if (reportFilter && v.report !== reportFilter) return false;
        if (!q) return true;
        const hay = [v.name, v.desc, vsFacetsText(v),
            ...SCHEDULED_REPORTS.filter(s => s.savedViewId === v.id).map(s => s.name)].join(' ').toLowerCase();
        return hay.includes(q);
    });

    // Toggle which layout is shown
    const cardMode = vsViewMode === 'card';
    // Empty state shows on its own — no column-header row behind it
    if (head)  head.style.display  = (cardMode || !views.length) ? 'none' : '';
    body.style.display  = cardMode ? 'none' : '';
    if (cards) cards.style.display = cardMode ? '' : 'none';
    if (empty) empty.style.display = views.length ? 'none' : '';

    if (cardMode) { renderVsCards(views); wireViewsSchedules(); return; }

    body.innerHTML = '';

    views.forEach(view => {
        const schedules = SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id);
        const collapsed = vsCollapsed.has(view.id);

        const row = document.createElement('div');
        row.className = 'dx-row' + (collapsed ? ' dx-collapsed' : '');
        row.dataset.id = view.id;

        const schedCell = schedules.length
            ? `<span class="msv-sched-tag"><i class="fa-regular fa-clock"></i> ${schedules.length}</span>`
            : `<span class="dx-sched-none">None</span>`;

        const delivRows = schedules.map(s => `
                <div class="dx-sub-row" data-sid="${s.id}">
                    <span class="dx-sub-cell dx-sub-name"><i class="fa-regular fa-paper-plane"></i> ${s.name}</span>
                    <span class="dx-sub-cell">${formatSchedule(s)}</span>
                    <span class="dx-sub-cell" title="${s.recipients.join(', ')}">${s.recipients.length <= 2 ? s.recipients.join(', ') : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`}</span>
                    <span class="dx-sub-cell">${deliveryLabelHTML(s)}</span>
                    <span class="dx-sub-cell">${s.nextSend}</span>
                    <span class="dx-sub-cell dx-sub-actions">
                        <button class="dx-icon-btn vs-sched-edit" data-sid="${s.id}" title="Edit scheduled report"><i class="fa-solid fa-pencil"></i></button>
                        <button class="dx-icon-btn vs-sched-del" data-sid="${s.id}" title="Delete scheduled report"><i class="fa-regular fa-trash-can"></i></button>
                    </span>
                </div>`).join('');

        // When a view has no scheduled reports, show just a message — not an
        // empty sub-grid with column headers.
        const schedBlock = schedules.length
            ? `<div class="dx-subgrid">
                    <div class="dx-sub-head">
                        <span class="dx-sub-cell">Name</span>
                        <span class="dx-sub-cell">Schedule</span>
                        <span class="dx-sub-cell">Recipients</span>
                        <span class="dx-sub-cell">Sent As</span>
                        <span class="dx-sub-cell">Next Send</span>
                        <span class="dx-sub-cell"></span>
                    </div>
                    ${delivRows}
                </div>`
            : `<div class="dx-sub-empty">No scheduled reports yet for this view.</div>`;

        row.innerHTML = `
            <div class="dx-master">
                <button class="dx-expand" title="Expand / collapse"><i class="fa-solid fa-chevron-down"></i></button>
                <span class="dx-cell dx-col-name">
                    <span class="dx-name-main"><i class="fa-solid fa-bookmark dx-name-icon"></i> ${view.name}</span>
                    ${vsNameFiltersHTML(view)}
                </span>
                <span class="dx-cell dx-col-report"><span class="${reportBadgeClass(view.report)}">${view.report}</span></span>
                <span class="dx-cell dx-col-sched">${schedCell}</span>
                <span class="dx-cell dx-col-actions">
                    <button class="dx-icon-btn vs-view-edit" data-id="${view.id}" title="Edit saved view"><i class="fa-solid fa-pencil"></i></button>
                    <button class="dx-icon-btn vs-view-del" data-id="${view.id}" title="Delete saved view"><i class="fa-regular fa-trash-can"></i></button>
                </span>
            </div>
            <div class="dx-detail">
                <div class="dx-detail-head">
                    <span class="dx-detail-title"><i class="fa-regular fa-clock"></i> Scheduled reports</span>
                </div>
                ${schedBlock}
                <button class="dx-add-btn vs-sched-add" data-id="${view.id}"><i class="fa-solid fa-plus"></i> Add scheduled report</button>
            </div>`;
        body.appendChild(row);
    });

    wireViewsSchedules();
}

// Card view — alternate layout for the same data: one full-width card per
// saved view, its filters inline in the header, scheduled reports as rows
// beneath. Shares all the same actions/handlers as the grid (wired below).
function renderVsCards(views) {
    const cards = document.getElementById('vsCards');
    if (!cards) return;
    cards.innerHTML = views.map(view => {
        const schedules = SCHEDULED_REPORTS.filter(s => s.savedViewId === view.id);
        const collapsed = vsCollapsed.has(view.id);
        const delivs = schedules.length
            ? schedules.map(s => {
                const recip = s.recipients.length <= 2
                    ? s.recipients.join(', ')
                    : `${s.recipients[0]}, ${s.recipients[1]} +${s.recipients.length - 2}`;
                return `
                <div class="vs-card-deliv" data-sid="${s.id}">
                    <span class="vs-cd-name"><i class="fa-regular fa-paper-plane"></i> ${s.name}</span>
                    <span class="vs-cd-field"><span class="vs-cd-label">Schedule</span>${formatSchedule(s)}</span>
                    <span class="vs-cd-field" title="${s.recipients.join(', ')}"><span class="vs-cd-label">Recipients</span>${recip}</span>
                    <span class="vs-cd-field vs-cd-sentas"><span class="vs-cd-label">Sent As</span><span class="vs-cd-sentas-val">${deliveryLabelHTML(s)}</span></span>
                    <span class="vs-cd-field"><span class="vs-cd-label">Next Send</span>${s.nextSend}</span>
                    <span class="vs-cd-actions">
                        <button class="dx-icon-btn vs-sched-edit" data-sid="${s.id}" title="Edit scheduled report"><i class="fa-solid fa-pencil"></i></button>
                        <button class="dx-icon-btn vs-sched-del" data-sid="${s.id}" title="Delete scheduled report"><i class="fa-regular fa-trash-can"></i></button>
                    </span>
                </div>`;
              }).join('')
            : `<div class="dx-sub-empty">No scheduled reports yet for this view.</div>`;
        return `
            <div class="vs-card ${collapsed ? 'vs-collapsed' : ''}" data-id="${view.id}">
                <div class="vs-card-head">
                    <button class="dx-expand vs-card-toggle" title="Expand / collapse"><i class="fa-solid fa-chevron-down"></i></button>
                    <i class="fa-solid fa-bookmark dx-name-icon"></i>
                    <span class="vs-card-title">${view.name}</span>
                    <span class="${reportBadgeClass(view.report)}">${view.report}</span>
                    <span class="vs-card-filters" title="${vsFacetsText(view)}"><i class="fa-solid fa-sliders vs-card-filters-icon"></i> ${vsFacetsText(view)}</span>
                    <span class="vs-card-actions">
                        <button class="dx-icon-btn vs-view-edit" data-id="${view.id}" title="Edit saved view"><i class="fa-solid fa-pencil"></i></button>
                        <button class="dx-icon-btn vs-view-del" data-id="${view.id}" title="Delete saved view"><i class="fa-regular fa-trash-can"></i></button>
                    </span>
                </div>
                <div class="vs-card-body">
                    ${delivs}
                    <button class="dx-add-btn vs-sched-add" data-id="${view.id}"><i class="fa-solid fa-plus"></i> Add scheduled report</button>
                </div>
            </div>`;
    }).join('');
}

function wireViewsSchedules() {
    // Wire across the whole page so both the grid and the cards are covered.
    const root = document.getElementById('viewsSchedulesLayout');
    if (!root) return;

    // Grid row collapse
    root.querySelectorAll('.dx-row .dx-expand').forEach(btn => btn.addEventListener('click', () => {
        const row = btn.closest('.dx-row');
        const id = row.dataset.id;
        if (vsCollapsed.has(id)) vsCollapsed.delete(id); else vsCollapsed.add(id);
        row.classList.toggle('dx-collapsed');
    }));
    // Card collapse
    root.querySelectorAll('.vs-card .vs-card-toggle').forEach(btn => btn.addEventListener('click', () => {
        const card = btn.closest('.vs-card');
        const id = card.dataset.id;
        if (vsCollapsed.has(id)) vsCollapsed.delete(id); else vsCollapsed.add(id);
        card.classList.toggle('vs-collapsed');
    }));

    // "more / less" toggle on the name-row filter preview
    root.querySelectorAll('.dx-nf-more').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (vsFiltersExpanded.has(id)) vsFiltersExpanded.delete(id); else vsFiltersExpanded.add(id);
        renderViewsSchedules();
    }));

    // Saved view: edit (rich editor) / delete
    root.querySelectorAll('.vs-view-edit').forEach(btn => btn.addEventListener('click', () => {
        const v = SAVED_VIEWS.find(x => x.id === btn.dataset.id);
        if (v) openSavedViewEditor(v);
    }));
    root.querySelectorAll('.vs-view-del').forEach(btn => btn.addEventListener('click', () => {
        openDeleteSavedViewDialog(btn.dataset.id);
    }));

    // Scheduled report: edit / add / delete
    root.querySelectorAll('.vs-sched-edit').forEach(btn => btn.addEventListener('click', () => {
        const s = SCHEDULED_REPORTS.find(x => x.id === btn.dataset.sid);
        if (s) openEmailDialog({ editId: s.id, reportName: s.report });
    }));
    root.querySelectorAll('.vs-sched-add').forEach(btn => btn.addEventListener('click', () => {
        const v = SAVED_VIEWS.find(x => x.id === btn.dataset.id);
        if (v) openEmailDialog({ mode: 'schedule', reportName: v.report, presetViewId: v.id });
    }));
    root.querySelectorAll('.vs-sched-del').forEach(btn => btn.addEventListener('click', () => {
        openDeleteScheduleDialog(btn.dataset.sid);
    }));
}

// ── Rich saved-view editor (filters + column chooser) ──────────────
const savedViewEditorDialog = document.getElementById('savedViewEditorDialog');
let editorView = null;

function openSavedViewEditor(view) {
    editorView = view;
    savedViewEditorDialog.headerTitle = 'Edit Saved View';
    savedViewEditorDialog.overlayClass = 'sv-editor-overlay';
    savedViewEditorDialog.opened = true;
    savedViewEditorDialog.requestContentUpdate();
}

savedViewEditorDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '880px';
    root.style.maxWidth = '100%';
    const v = editorView;
    if (!v) return;

    const itemsData = reportItemsData(v.report);
    const itemNames = itemsData.map(i => i.name);
    const userNames = USERS_DATA.map(u => `${u.firstName} ${u.lastName}`);
    const allCols = REPORT_COLUMNS[v.report] || [];
    const visibleCols = viewVisibleColumns(v);
    const statusOpts = STATUS_OPTIONS[v.report] || [];
    const curStatus = (v.statusTypes && v.statusTypes !== 'All')
        ? v.statusTypes.split(',').map(s => s.trim()) : [];
    const nSched = scheduleCountForView(v.id);

    root.innerHTML = `
        ${nSched > 0 ? `<div class="svs-callout sve-callout"><i class="fa-solid fa-circle-info"></i>
            <span>Changes apply to <strong>${nSched}</strong> scheduled report${nSched > 1 ? 's' : ''} delivered from this view.</span></div>` : ''}
        <div class="sve-grid">
            <div class="sve-col sve-col-main">
                <p class="sv-section-heading">Basic Information</p>
                <vaadin-text-field theme="outlined" id="sveName" label="Saved View Name" required style="width:100%"></vaadin-text-field>
                <vaadin-text-area theme="outlined" id="sveDesc" label="Description" style="width:100%;margin-top:12px"></vaadin-text-area>

                <p class="sv-section-heading">Filters</p>
                <vaadin-text-field theme="outlined" id="sveDate" label="Date Range" style="width:100%"></vaadin-text-field>
                <vaadin-multi-select-combo-box theme="outlined" id="sveActs" label="${v.report === 'Activity Exception Report' ? 'Activities' : 'Qualifications'}" style="width:100%;margin-top:12px"></vaadin-multi-select-combo-box>
                <vaadin-multi-select-combo-box theme="outlined" id="sveUsers" label="Users" style="width:100%;margin-top:12px"></vaadin-multi-select-combo-box>
                <vaadin-multi-select-combo-box theme="outlined" id="sveStatus" label="Status" style="width:100%;margin-top:12px"></vaadin-multi-select-combo-box>
            </div>
            <div class="sve-col sve-col-cols">
                <p class="sv-section-heading">Column Chooser</p>
                <p class="sve-hint">Choose which columns appear in this view’s report table.</p>
                <div class="sve-collist" id="sveColList"></div>
            </div>
        </div>`;

    root.querySelector('#sveName').value = v.name || '';
    root.querySelector('#sveDesc').value = v.desc || '';
    root.querySelector('#sveDate').value = v.dateRange || '';

    const acts = root.querySelector('#sveActs');
    acts.items = itemNames;
    acts.selectedItems = (v.activities || []).filter(n => itemNames.includes(n));

    const users = root.querySelector('#sveUsers');
    users.items = userNames;
    users.selectedItems = (v.users || []).filter(n => userNames.includes(n));

    const status = root.querySelector('#sveStatus');
    status.items = statusOpts;
    status.selectedItems = curStatus.filter(s => statusOpts.includes(s));

    // Column chooser checkboxes
    const colList = root.querySelector('#sveColList');
    allCols.forEach(col => {
        const row = document.createElement('label');
        row.className = 'sve-col-row';
        const checked = visibleCols.includes(col);
        row.innerHTML = `<input type="checkbox" class="sve-col-cb" value="${col}" ${checked ? 'checked' : ''}>
            <i class="fa-solid fa-table-columns sve-col-icon"></i>
            <span>${col}</span>`;
        colList.appendChild(row);
    });
};

savedViewEditorDialog.footerRenderer = (root) => {
    root.innerHTML = '';
    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { savedViewEditorDialog.opened = false; });

    const saveBtn = document.createElement('vaadin-button');
    saveBtn.setAttribute('theme', 'primary');
    saveBtn.textContent = 'Save Changes';
    saveBtn.addEventListener('click', () => {
        const v = editorView;
        if (!v) return;
        const nameField = document.getElementById('sveName');
        const name = nameField?.value.trim();
        if (!name) { if (nameField) { nameField.invalid = true; nameField.errorMessage = 'Name is required'; } return; }

        const itemsData = reportItemsData(v.report);
        const selActs = document.getElementById('sveActs')?.selectedItems || [];
        const selUsers = document.getElementById('sveUsers')?.selectedItems || [];
        const selStatus = document.getElementById('sveStatus')?.selectedItems || [];
        const selCols = [...document.querySelectorAll('.sve-col-cb:checked')].map(cb => cb.value);

        v.name = name;
        v.desc = document.getElementById('sveDesc')?.value.trim() || '';
        v.dateRange = document.getElementById('sveDate')?.value.trim() || 'All Time';

        v.activities = [...selActs];
        v.qualIds = itemsData.filter(i => selActs.includes(i.name)).map(i => i.id);
        v.activityCount = selActs.length;

        v.users = [...selUsers];
        v.userIds = USERS_DATA.filter(u => selUsers.includes(`${u.firstName} ${u.lastName}`)).map(u => u.id);
        v.userCount = selUsers.length;

        v.statusTypes = selStatus.length ? selStatus.join(', ') : 'All';
        v.status = selStatus.includes('Qualified') && !selStatus.includes('Incomplete') ? 'qualified'
            : (selStatus.includes('Incomplete') && !selStatus.includes('Qualified')) ? 'incomplete' : 'all';

        if (selCols.length) {
            v.visibleColumns = selCols;
            v.columns = selCols.join(', ');
        }

        // Keep schedules' cached view name in sync
        SCHEDULED_REPORTS.forEach(s => { if (s.savedViewId === v.id) s.savedViewName = v.name; });

        savedViewEditorDialog.opened = false;
        renderViewsSchedules();
        if (typeof renderManageSavedViews === 'function') renderManageSavedViews();
        if (typeof renderScheduledReports === 'function') renderScheduledReports();
        // If this view is currently applied on the report, reflect the edits
        if (appliedSavedView && appliedSavedView.id === v.id) applyView(v);
        showToast(`Saved view “${name}” updated`);
    });

    root.appendChild(cancelBtn);
    root.appendChild(saveBtn);
};

// ── Delete saved view (and its scheduled reports) ──────────────────
const savedViewDeleteDialog = document.getElementById('savedViewDeleteDialog');
let pendingDeleteViewId = null;

function openDeleteSavedViewDialog(viewId) {
    pendingDeleteViewId = viewId;
    savedViewDeleteDialog.overlayClass = 'recip-picker-overlay';
    savedViewDeleteDialog.opened = true;
    savedViewDeleteDialog.requestContentUpdate();
}

savedViewDeleteDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.maxWidth = '460px';
    const v = SAVED_VIEWS.find(x => x.id === pendingDeleteViewId);
    const n = v ? scheduleCountForView(v.id) : 0;
    const p = document.createElement('p');
    p.className = 'sv-dialog-subtitle';
    p.innerHTML = `Delete <strong>${v ? v.name : 'this saved view'}</strong>?`
        + (n > 0 ? ` This will also delete <strong>${n}</strong> scheduled report${n > 1 ? 's' : ''} delivered from it.` : '')
        + ' This action cannot be undone.';
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
        const idx = SAVED_VIEWS.findIndex(x => x.id === pendingDeleteViewId);
        if (idx !== -1) {
            const v = SAVED_VIEWS[idx];
            // Cascade: remove scheduled reports tied to this view
            for (let i = SCHEDULED_REPORTS.length - 1; i >= 0; i--) {
                if (SCHEDULED_REPORTS[i].savedViewId === v.id) SCHEDULED_REPORTS.splice(i, 1);
            }
            SAVED_VIEWS.splice(idx, 1);
            renderViewsSchedules();
            if (typeof renderManageSavedViews === 'function') renderManageSavedViews();
            if (typeof renderScheduledReports === 'function') renderScheduledReports();
            showToast(`Deleted “${v.name}”`);
        }
        savedViewDeleteDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(deleteBtn);
};

// ── Wiring: toolbar + re-render on related dialog close ────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('vsReportFilter')?.addEventListener('change', renderViewsSchedules);
    document.getElementById('vsSearch')?.addEventListener('input', renderViewsSchedules);

    // Grid / Card view toggle
    document.querySelectorAll('#vsViewMode .vs-vm-btn').forEach(btn => btn.addEventListener('click', () => {
        if (btn.dataset.mode === vsViewMode) return;
        vsViewMode = btn.dataset.mode;
        document.querySelectorAll('#vsViewMode .vs-vm-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderViewsSchedules();
    }));

    // When schedules change via the email/delete dialogs, refresh the combined page if visible
    const refreshIfVisible = () => {
        const layout = document.getElementById('viewsSchedulesLayout');
        if (layout && layout.style.display !== 'none') renderViewsSchedules();
    };
    document.getElementById('emailReportDialog')?.addEventListener('opened-changed', (e) => { if (!e.detail.value) refreshIfVisible(); });
    document.getElementById('scheduleDeleteDialog')?.addEventListener('opened-changed', (e) => { if (!e.detail.value) refreshIfVisible(); });
});


// ================================================================
// DATE RANGE — preset dropdown + custom calendar range (filter panel)
// Presets compute a real start/end from today (same calendar logic as v1);
// "Choose a date range" reveals two design-system date pickers. The hidden
// .date-input mirrors the displayed selection so getReportFilterSummary /
// saved views read it exactly as before.
// ================================================================
function drangePresetRange(key) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    let start = new Date(today);
    switch (key) {
        case 'today':                                               break;
        case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
        case 'last7':     start.setDate(today.getDate() - 6);       break;
        case 'last30':    start.setDate(today.getDate() - 29);      break;
        case 'last90':    start.setDate(today.getDate() - 89);      break;
        case 'lastyear':  start.setFullYear(today.getFullYear() - 1); start.setDate(start.getDate() + 1); break;
        case 'datetonow': start = null;                             break; // open-ended through today
        default: return null;
    }
    return { start, end };
}
function drangeFmt(d) { return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : null; }
function drangeParseIso(v) { if (!v) return null; const [y, m, d] = v.split('-').map(Number); return (y && m && d) ? new Date(y, m - 1, d) : null; }
// Explicit date-window text for the Completion Status Overview badge
function drangeBadgeText(s, e) {
    if (!s && e) return `Through ${drangeFmt(e)}`;
    if (s && e && drangeFmt(s) === drangeFmt(e)) return drangeFmt(s);
    if (s && e) return `${drangeFmt(s)} - ${drangeFmt(e)}`;
    return 'All dates';
}
// Update the overview date badge (only the qual report has #completionOverview)
function setOverviewDateBadge(box, text) {
    const badge = box.closest('.page-layout')?.querySelector('#completionOverview .date-badge');
    if (badge) badge.innerHTML = `<i class="fa-regular fa-calendar"></i> ${text}`;
}

function initDateRangeDD(box) {
    const trigger = box.querySelector('.drange-trigger');
    const triggerLabel = box.querySelector('.drange-trigger-label');
    const menu = box.querySelector('.drange-menu');
    const presetsWrap = box.querySelector('.drange-presets');
    const opts = box.querySelectorAll('.drange-opt');
    const custom = box.querySelector('.drange-custom');
    const backBtn = box.querySelector('.drange-back');
    const startP = box.querySelector('.drange-start');
    const endP = box.querySelector('.drange-end');
    const applyBtn = box.querySelector('.drange-apply');
    const hidden = box.querySelector('.date-input');

    // Two views inside the menu: the preset list, or the custom date pickers
    // (which REPLACE the list so Apply is visible without scrolling).
    const showPresets = () => { if (presetsWrap) presetsWrap.hidden = false; custom.hidden = true; };
    const showCustom  = () => { if (presetsWrap) presetsWrap.hidden = true;  custom.hidden = false; };
    const openMenu  = () => { showPresets(); menu.hidden = false; trigger.classList.add('open'); };
    const closeMenu = () => { menu.hidden = true; trigger.classList.remove('open'); };
    const setActive = (opt) => { opts.forEach(o => o.classList.remove('active')); if (opt) opt.classList.add('active'); };
    const setLabel  = (text) => { triggerLabel.textContent = text; hidden.value = text; };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu.hidden) openMenu(); else closeMenu();
    });

    opts.forEach(opt => opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = opt.dataset.range;
        if (key === 'custom') {
            setActive(opt);
            showCustom();     // swap the preset list for the date pickers
            return;
        }
        setActive(opt);
        setLabel(opt.textContent.trim());   // e.g. "Past 30 days"
        const r = drangePresetRange(key);
        if (r) setOverviewDateBadge(box, drangeBadgeText(r.start, r.end));
        closeMenu();
    }));

    backBtn?.addEventListener('click', (e) => { e.stopPropagation(); showPresets(); });

    function applyCustom() {
        const s  = drangeParseIso(startP.value);
        const en = drangeParseIso(endP.value);
        if (!s || !en) { endP.invalid = true; endP.errorMessage = 'Pick a start and end date'; return; }
        if (en < s)    { endP.invalid = true; endP.errorMessage = 'End date must be after the start date'; return; }
        endP.invalid = false;
        setLabel(`${drangeFmt(s)} - ${drangeFmt(en)}`);
        setOverviewDateBadge(box, `${drangeFmt(s)} - ${drangeFmt(en)}`);
        closeMenu();
    }
    applyBtn?.addEventListener('click', (e) => { e.stopPropagation(); applyCustom(); });

    document.addEventListener('click', (e) => { if (!box.contains(e.target)) closeMenu(); });

    // Sync the overview badge to the initially-active preset
    const initActive = box.querySelector('.drange-opt.active');
    if (initActive) {
        const r = drangePresetRange(initActive.dataset.range);
        if (r) setOverviewDateBadge(box, drangeBadgeText(r.start, r.end));
    }
}
document.querySelectorAll('.date-range-dd').forEach(initDateRangeDD);

// Keep the date-range trigger label (and overview badge) in sync when a saved view is applied
function syncDateRangeDisplay(scopeSel, text) {
    const dd = document.querySelector(`${scopeSel} .date-range-dd`);
    if (!dd) return;
    const lbl = dd.querySelector('.drange-trigger-label');
    if (lbl) lbl.textContent = text;
    dd.querySelectorAll('.drange-opt').forEach(o => o.classList.remove('active'));
    const hidden = dd.querySelector('.date-input');
    if (hidden) hidden.value = text;
    if (typeof setOverviewDateBadge === 'function') setOverviewDateBadge(dd, text);
}
