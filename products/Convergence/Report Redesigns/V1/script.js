// ================================================================
// REPORTS SIDENAV — navigation between reports
// (v1: scheduled-report CREATION only — the saved-view / scheduled-report
//  management pages and their nav items have been removed.)
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
reportsSidenav.footerItems  = [];
reportsSidenav.expandedGroupIds = NAV_ITEMS.filter(i => i.type === 'group').map(i => i.id);
reportsSidenav.activeItemId = 'qualification-report';

function navigateToReport(id) {
    const report = REPORTS[id];
    if (!report) return;

    reportsSidenav.activeItemId = id;
    document.querySelector('.bc-current').textContent = report.breadcrumb;

    const isQual  = id === 'qualification-report';
    const isActEx = id === 'activity-exception';

    document.getElementById('pageLayout').style.display        = isQual  ? '' : 'none';
    document.getElementById('actExLayout').style.display       = isActEx ? '' : 'none';
    document.getElementById('reportPlaceholder').style.display = (!isQual && !isActEx) ? 'flex' : 'none';
    if (!isQual && !isActEx) document.getElementById('placeholderTitle').textContent = report.title;

    // Ensure qual filter toggle is hidden when switching away
    if (!isQual) filterToggleBtn.style.display = 'none';
}

reportsSidenav.addEventListener('item-click', (e) => {
    const id = e.detail.id;
    if (!REPORTS[id]) return;
    navigateToReport(id);
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

// ================================================================
// LOCATION DROPDOWN — trigger open/close + tree select
// ================================================================

// Location filter removed from this report's filter panel.


// ================================================================
// ROBUST DATE RANGE — filter-panel control (relative presets + custom)
// The hidden .date-input mirrors a readable range string so the schedule
// dialog's "Report contents" summary can read it, exactly as before.
// ================================================================

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseIso(v) {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}
function fmtFriendly(v) {
    const d = (v instanceof Date) ? v : parseIso(v);
    if (!d) return 'Pending';
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function rangeStr(s, e) {
    if (!s && !e) return 'All dates';
    if (s && e)   return `${fmtFriendly(s)} – ${fmtFriendly(e)}`;
    if (s)        return `From ${fmtFriendly(s)}`;
    return `Until ${fmtFriendly(e)}`;
}

// Relative presets are computed from today's date.
function presetRange(key) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    let start = new Date(today);
    switch (key) {
        case 'today':                                              break;
        case 'last7':     start.setDate(today.getDate() - 6);      break;
        case 'last30':    start.setDate(today.getDate() - 29);     break;
        case 'thismonth': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case 'thisyear':  start = new Date(today.getFullYear(), 0, 1); break;
        default: return null;
    }
    return { start, end };
}

function initDateRange(box) {
    const presets = box.querySelectorAll('.drange-preset');
    const custom  = box.querySelector('.drange-custom');
    const startP  = box.querySelector('.drange-start');
    const endP    = box.querySelector('.drange-end');
    const sumText = box.querySelector('.drange-summary-text');
    const hidden  = box.querySelector('.date-input');

    function setSummary(label, s, e) {
        const rs = rangeStr(s, e);
        sumText.textContent = (label === 'Custom') ? rs : `${label} · ${rs}`;
        hidden.value = rs;
    }
    function applyCustom() {
        const s = parseIso(startP.value);
        const e = parseIso(endP.value);
        if (s && e && e < s) { endP.invalid = true; endP.errorMessage = 'End date must be after the start date'; return; }
        endP.invalid = false;
        setSummary('Custom', s, e);
    }

    presets.forEach(btn => btn.addEventListener('click', () => {
        presets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.dataset.range;
        if (key === 'custom') { custom.hidden = false; applyCustom(); return; }
        custom.hidden = true;
        const r = presetRange(key);
        if (r) setSummary(btn.textContent.trim(), r.start, r.end);
    }));
    startP?.addEventListener('value-changed', applyCustom);
    endP?.addEventListener('value-changed', applyCustom);

    // Initialise from the preset marked active in the markup
    const active = box.querySelector('.drange-preset.active') || presets[0];
    if (active) {
        const r = presetRange(active.dataset.range);
        if (r) setSummary(active.textContent.trim(), r.start, r.end);
    }
}

document.querySelectorAll('.date-range').forEach(initDateRange);

// ================================================================
// SCHEDULE A REPORT  (v1: scheduled-report CREATION only)
//   • Recipients added ONLY via the user picker (no free-text email)
//   • Subject + Message live in the scheduling portion
//   • Recurrence follows iCalendar RRULE concepts (FREQ / INTERVAL /
//     BYDAY / BYMONTHDAY / UNTIL / COUNT)
//   • No Delivery section, no edit/delete, no saved-view management
// ================================================================

// ── Recipients — selected only through the picker, stored as user ids ──
let currentRecipients = [];

function userFullName(u) { return `${u.firstName} ${u.lastName}`; }
function userEmail(u) {
    return `${u.firstName}.${u.lastName}`.replace(/\s+/g, '').toLowerCase() + '@vectorsolutions.com';
}

function renderRecipientChips() {
    const wrap  = document.getElementById('recipChips');
    const empty = document.getElementById('recipEmpty');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (empty) empty.style.display = currentRecipients.length ? 'none' : '';
    currentRecipients.forEach(id => {
        const u = USERS_DATA.find(x => x.id === id);
        if (!u) return;
        const chip = document.createElement('span');
        chip.className = 'recip-chip';
        const label = document.createElement('span');
        label.textContent = userFullName(u);
        chip.appendChild(label);
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'recip-chip-x';
        x.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        x.addEventListener('click', (e) => {
            e.stopPropagation();
            currentRecipients = currentRecipients.filter(r => r !== id);
            renderRecipientChips();
            clearRecipError();
        });
        chip.appendChild(x);
        wrap.appendChild(chip);
    });
}
function clearRecipError() {
    if (!currentRecipients.length) return;
    document.getElementById('recipBox')?.classList.remove('invalid');
    const err = document.getElementById('recipError');
    if (err) err.textContent = '';
}

// ── Recipient picker dialog ("Select recipients" button → user picker) ──
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
        .filter(u => !q
            || userFullName(u).toLowerCase().includes(q)
            || userEmail(u).toLowerCase().includes(q)
            || u.username.toLowerCase().includes(q))
        .forEach(u => {
            const checked = currentRecipients.includes(u.id);
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
        const picked = [...document.querySelectorAll('#recipPickerList .recip-pick-cb:checked')].map(cb => cb.dataset.id);
        // Replace with the current picker selection (checked = in, unchecked = out)
        const visibleIds = [...document.querySelectorAll('#recipPickerList .recip-pick-cb')].map(cb => cb.dataset.id);
        currentRecipients = currentRecipients.filter(id => !visibleIds.includes(id));
        picked.forEach(id => { if (!currentRecipients.includes(id)) currentRecipients.push(id); });
        renderRecipientChips();
        clearRecipError();
        recipientPickerDialog.opened = false;
    });

    root.appendChild(cancelBtn);
    root.appendChild(addBtn);
};

// ── Time + recurrence helpers ──────────────────────────────────────
function formatTime(t) {
    const [hStr, mStr] = (t || '08:00').split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${mStr} ${ampm}`;
}

// iCalendar BYDAY codes
const DOW = [
    { code: 'SU', short: 'S', name: 'Sunday' },
    { code: 'MO', short: 'M', name: 'Monday' },
    { code: 'TU', short: 'T', name: 'Tuesday' },
    { code: 'WE', short: 'W', name: 'Wednesday' },
    { code: 'TH', short: 'T', name: 'Thursday' },
    { code: 'FR', short: 'F', name: 'Friday' },
    { code: 'SA', short: 'S', name: 'Saturday' },
];
const DOW_NAME = Object.fromEntries(DOW.map(d => [d.code, d.name]));
const FREQ_UNIT = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };

// Build an iCalendar RRULE string from the form state.
function buildRRule(r) {
    const parts = ['FREQ=' + r.freq];
    if (r.interval && r.interval > 1) parts.push('INTERVAL=' + r.interval);
    if (r.freq === 'WEEKLY'  && r.byday.length) parts.push('BYDAY=' + r.byday.join(','));
    if (r.freq === 'MONTHLY' && r.bymonthday)   parts.push('BYMONTHDAY=' + r.bymonthday);
    if (r.until)      parts.push('UNTIL=' + r.until.replace(/-/g, ''));
    else if (r.count) parts.push('COUNT=' + r.count);
    return 'RRULE:' + parts.join(';');
}

// Add an ordinal suffix: 1 → "1st", 22 → "22nd", etc.
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
// Join a list naturally: ["Mon"] → "Mon"; ["Mon","Wed"] → "Mon and Wed";
// ["Mon","Wed","Fri"] → "Mon, Wed, and Fri".
function joinList(arr) {
    if (arr.length <= 1) return arr.join('');
    if (arr.length === 2) return arr.join(' and ');
    return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
}

// Plain-language summary of the recurrence (shown to the user instead of the
// raw iCalendar RRULE). The RRULE itself is still built for the saved record.
function describeRecur(r) {
    let base;
    if (r.freq === 'DAILY') {
        base = r.interval > 1 ? `Every ${r.interval} days` : 'Every day';
    } else if (r.freq === 'WEEKLY') {
        const days = joinList(r.byday.map(c => DOW_NAME[c]));
        base = (r.interval > 1 ? `Every ${r.interval} weeks` : 'Every week') + (days ? ` on ${days}` : '');
    } else if (r.freq === 'MONTHLY') {
        base = (r.interval > 1 ? `Every ${r.interval} months` : 'Every month') + ` on the ${ordinal(parseInt(r.bymonthday, 10))}`;
    } else {
        base = r.interval > 1 ? `Every ${r.interval} years` : 'Every year';
    }
    let out = `${base} at ${formatTime(r.time)}`;
    if (r.until)      out += `, until ${fmtFriendly(r.until)}`;
    else if (r.count) out += `, ${r.count} time${r.count > 1 ? 's' : ''} in total`;
    else              out += `, with no end date`;
    return out;
}

// ── Read currently-applied filters into a read-only "Report contents" summary ──
const FILTER_SUMMARY_ROWS = [
    { icon: 'fa-regular fa-calendar',    label: 'Date Range',     value: 'Last 30 days' },
    { icon: 'fa-solid fa-list',          label: 'Activities',     value: 'All activities' },
    { icon: 'fa-solid fa-user',          label: 'Users',          value: 'All users' },
    { icon: 'fa-solid fa-tag',           label: 'Status Types',   value: 'All' },
];

function getReportFilterSummary(reportName) {
    if (reportName === 'Activity Exception Report') return FILTER_SUMMARY_ROWS;

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

// ── Schedule dialog ────────────────────────────────────────────────
const emailReportDialog = document.getElementById('emailReportDialog');
let emailDialogConfig = { reportName: 'Qualification Report' };

function openEmailDialog(opts = {}) {
    emailDialogConfig = { reportName: opts.reportName || 'Qualification Report' };
    currentRecipients = [];                      // creation always starts empty
    emailReportDialog.headerTitle = 'Schedule a Report';
    emailReportDialog.overlayClass = 'send-report-overlay';
    emailReportDialog.opened = true;
    emailReportDialog.requestContentUpdate();
}

// Toggle the frequency-specific detail rows + interval unit label
function applyFreqDetail(freq) {
    const weekly  = document.getElementById('freq-weekly');
    const monthly = document.getElementById('freq-monthly');
    if (weekly)  weekly.style.display  = (freq === 'WEEKLY')  ? '' : 'none';
    if (monthly) monthly.style.display = (freq === 'MONTHLY') ? '' : 'none';
    const unit = document.getElementById('emailIntervalUnit');
    if (unit) unit.textContent = (FREQ_UNIT[freq] || 'cycle') + '(s)';
    updateRecurPreview();
}

// Toggle the "Ends" inputs
function applyEndMode(mode) {
    const until = document.getElementById('emailUntil');
    const count = document.getElementById('emailCount');
    if (until) until.style.display = (mode === 'on')    ? '' : 'none';
    if (count) count.style.display = (mode === 'after') ? '' : 'none';
    updateRecurPreview();
}

// Read the recurrence form into a rule object (used for preview + submit)
function readRecurState() {
    const freq     = document.getElementById('emailFrequency')?.value || 'WEEKLY';
    const interval = Math.max(1, parseInt(document.getElementById('emailInterval')?.value || '1', 10));
    const byday    = [...document.querySelectorAll('#dowRow .dow-btn.active')].map(b => b.dataset.code);
    const bymonthday = document.getElementById('emailDayOfMonth')?.value || '1';
    const time     = document.getElementById('emailTime')?.value || '08:00';
    const endMode  = document.querySelector('input[name="endMode"]:checked')?.value || 'never';
    const until    = endMode === 'on'    ? (document.getElementById('emailUntil')?.value || '')   : '';
    const count    = endMode === 'after' ? Math.max(1, parseInt(document.getElementById('emailCount')?.value || '1', 10)) : 0;
    return { freq, interval, byday, bymonthday, time, until, count };
}

function updateRecurPreview() {
    const r = readRecurState();
    const human = document.getElementById('recurHuman');
    if (human) human.textContent = describeRecur(r);
}

emailReportDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.width = '780px';
    root.style.maxWidth = '100%';

    const cfg = emailDialogConfig;
    root.innerHTML = `
        <p class="sv-dialog-subtitle">Set up a recurring emailed delivery of <strong>${cfg.reportName}</strong>.</p>

        <p class="sv-section-heading">Recipients</p>
        <div class="recip-box" id="recipBox">
            <div class="recip-chips" id="recipChips"></div>
            <span class="recip-empty" id="recipEmpty">No recipients yet — use “Select recipients” to add people.</span>
        </div>
        <div class="recip-tools">
            <vaadin-button theme="secondary small" id="recipPickBtn">
                <i class="fa-solid fa-user-plus" slot="prefix"></i> Select recipients
            </vaadin-button>
            <span class="recip-error" id="recipError"></span>
        </div>

        <p class="sv-section-heading">Schedule details</p>
        <vaadin-text-field theme="outlined" id="emailScheduleName" label="Delivery name"
            placeholder="e.g. Exec team — weekly compliance" required style="width:100%"></vaadin-text-field>
        <vaadin-text-field theme="outlined" id="emailSubject" label="Subject"
            placeholder="${cfg.reportName}" style="width:100%;margin-top:12px"></vaadin-text-field>
        <vaadin-text-area theme="outlined" id="emailMessage" label="Message"
            placeholder="Add a note for recipients (optional)…" style="width:100%;margin-top:12px"></vaadin-text-area>

        <p class="sv-section-heading">Recurrence</p>
        <div class="email-2col">
            <vaadin-select theme="outlined" id="emailFrequency" label="Frequency" style="width:100%"></vaadin-select>
            <div class="interval-field">
                <vaadin-number-field theme="outlined" id="emailInterval" label="Repeat every"
                    min="1" step="1" value="1" style="width:100%"></vaadin-number-field>
                <span class="interval-unit" id="emailIntervalUnit">week(s)</span>
            </div>
        </div>

        <div id="freq-weekly" class="freq-detail">
            <label class="filter-label" style="display:block;margin:10px 0 6px">On these days</label>
            <div class="dow-row" id="dowRow"></div>
        </div>
        <div id="freq-monthly" class="freq-detail">
            <vaadin-select theme="outlined" id="emailDayOfMonth" label="Day of month" style="width:100%;margin-top:10px"></vaadin-select>
        </div>

        <div class="email-2col" style="margin-top:12px">
            <vaadin-date-picker theme="outlined" id="emailStartDate" label="Start date" style="width:100%"></vaadin-date-picker>
            <vaadin-select theme="outlined" id="emailTime" label="Time" style="width:100%"></vaadin-select>
        </div>

        <label class="filter-label" style="display:block;margin:14px 0 6px">Ends</label>
        <div class="recur-end">
            <label class="recur-end-opt">
                <input type="radio" name="endMode" value="never" checked> <span>Never</span>
            </label>
            <label class="recur-end-opt">
                <input type="radio" name="endMode" value="on"> <span>On date</span>
                <vaadin-date-picker theme="outlined small" id="emailUntil" style="display:none;width:180px"></vaadin-date-picker>
            </label>
            <label class="recur-end-opt">
                <input type="radio" name="endMode" value="after"> <span>After</span>
                <vaadin-number-field theme="outlined small" id="emailCount" min="1" step="1" value="12"
                    style="display:none;width:110px"></vaadin-number-field>
                <span class="recur-end-suffix">occurrences</span>
            </label>
        </div>

        <div class="rrule-preview">
            <div class="rrule-human"><i class="fa-regular fa-calendar-check"></i> <span id="recurHuman"></span></div>
        </div>

        <hr class="sv-hr">

        <p class="sv-section-heading">Report contents</p>
        <p class="email-contents-note"><i class="fa-regular fa-circle-question"></i>
            The scheduled email uses the report's current filters, shown below.</p>
        <div id="emailFilterSummary"></div>
    `;

    // Recipients
    renderRecipientChips();
    root.querySelector('#recipPickBtn').addEventListener('click', openRecipientPicker);

    // Frequency
    const freqSel = root.querySelector('#emailFrequency');
    freqSel.items = [
        { label: 'Daily',   value: 'DAILY' },
        { label: 'Weekly',  value: 'WEEKLY' },
        { label: 'Monthly', value: 'MONTHLY' },
        { label: 'Yearly',  value: 'YEARLY' },
    ];
    freqSel.value = 'WEEKLY';
    freqSel.addEventListener('value-changed', () => applyFreqDetail(freqSel.value));

    // Interval
    root.querySelector('#emailInterval').addEventListener('value-changed', updateRecurPreview);

    // Time (30-minute intervals)
    const timeSel = root.querySelector('#emailTime');
    timeSel.items = Array.from({ length: 48 }, (_, i) => {
        const v = String(Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 ? '30' : '00');
        return { label: formatTime(v), value: v };
    });
    timeSel.value = '08:00';
    timeSel.addEventListener('value-changed', updateRecurPreview);

    // Day of month
    const domSel = root.querySelector('#emailDayOfMonth');
    domSel.items = Array.from({ length: 28 }, (_, i) => ({ label: 'Day ' + (i + 1), value: String(i + 1) }));
    domSel.value = '1';
    domSel.addEventListener('value-changed', updateRecurPreview);

    // Day-of-week buttons (multi-select for BYDAY)
    const dowRow = root.querySelector('#dowRow');
    DOW.forEach(d => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dow-btn';
        btn.dataset.code = d.code;
        btn.textContent = d.short;
        btn.title = d.name;
        if (d.code === 'MO') btn.classList.add('active');
        btn.addEventListener('click', () => { btn.classList.toggle('active'); updateRecurPreview(); });
        dowRow.appendChild(btn);
    });

    // Ends radios
    root.querySelectorAll('input[name="endMode"]').forEach(rb => {
        rb.addEventListener('change', () => applyEndMode(rb.value));
    });
    root.querySelector('#emailUntil').addEventListener('value-changed', updateRecurPreview);
    root.querySelector('#emailCount').addEventListener('value-changed', updateRecurPreview);

    // Report contents summary (read-only, from the live filters)
    const summaryEl = root.querySelector('#emailFilterSummary');
    getReportFilterSummary(cfg.reportName).forEach(row => {
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

    // Initial state
    applyFreqDetail('WEEKLY');
    applyEndMode('never');
};

emailReportDialog.footerRenderer = (root) => {
    root.innerHTML = '';

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { emailReportDialog.opened = false; });

    const primaryBtn = document.createElement('vaadin-button');
    primaryBtn.setAttribute('theme', 'primary');
    primaryBtn.textContent = 'Schedule Report';
    primaryBtn.addEventListener('click', submitEmailDialog);

    root.appendChild(cancelBtn);
    root.appendChild(primaryBtn);
};

function submitEmailDialog() {
    // Recipients — picker-only, must have at least one
    if (currentRecipients.length === 0) {
        document.getElementById('recipBox')?.classList.add('invalid');
        const err = document.getElementById('recipError');
        if (err) err.textContent = 'Add at least one recipient';
        return;
    }

    // Delivery name required
    const nameField = document.getElementById('emailScheduleName');
    const name = nameField?.value.trim();
    if (!name) {
        if (nameField) { nameField.invalid = true; nameField.errorMessage = 'Delivery name is required'; }
        return;
    }

    const r = readRecurState();

    // Weekly recurrence needs at least one weekday (BYDAY)
    if (r.freq === 'WEEKLY' && r.byday.length === 0) {
        showToast('Select at least one day of the week');
        return;
    }
    // "Ends on" needs a valid date after the start
    const startDate = document.getElementById('emailStartDate')?.value || '';
    if (r.until && startDate && r.until < startDate) {
        const ep = document.getElementById('emailUntil');
        if (ep) { ep.invalid = true; ep.errorMessage = 'End date must be after the start date'; }
        return;
    }

    const rrule = buildRRule(r);
    console.log('[v1] scheduled report', { name, reportName: emailDialogConfig.reportName,
        recipients: currentRecipients.slice(), rrule });

    emailReportDialog.opened = false;
    showToast(`Report scheduled — ${describeRecur(r)}`);
}

// ── Wire the "Schedule a Report" buttons on both reports ───────────
document.getElementById('emailBtn')?.addEventListener('click',
    () => openEmailDialog({ reportName: 'Qualification Report' }));
document.getElementById('actExEmailBtn')?.addEventListener('click',
    () => openEmailDialog({ reportName: 'Activity Exception Report' }));
