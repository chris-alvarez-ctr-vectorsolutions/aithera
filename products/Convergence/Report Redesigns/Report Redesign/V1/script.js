// ================================================================
// REPORTS SIDENAV — navigation between reports
// (v1: scheduled-report CREATION only — the saved-view / scheduled-report
//  management pages and their nav items have been removed.)
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
const ORD_LABEL = { '1': 'first', '2': 'second', '3': 'third', '4': 'fourth', '-1': 'last' };

// Build an iCalendar RRULE string from the form state.
function buildRRule(r) {
    const parts = ['FREQ=' + r.freq];
    if (r.interval && r.interval > 1) parts.push('INTERVAL=' + r.interval);
    if (r.freq === 'WEEKLY'  && r.byday.length) parts.push('BYDAY=' + r.byday.join(','));
    if (r.freq === 'MONTHLY') {
        if (r.monthMode === 'weekday') parts.push('BYDAY=' + r.monthOrdinal + r.monthWeekday);
        else if (r.bymonthday)         parts.push('BYMONTHDAY=' + r.bymonthday);
    }
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
        if (r.monthMode === 'weekday') {
            base = `Every month on the ${ORD_LABEL[r.monthOrdinal] || 'first'} ${DOW_NAME[r.monthWeekday] || ''}`;
        } else {
            base = `Every month on day ${r.bymonthday}`;
        }
    } else {
        base = r.interval > 1 ? `Every ${r.interval} years` : 'Every year';
    }
    return `${base} at ${formatTime(r.time)}`;
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
let emailDialogConfig = { reportName: 'Qualification Report', mode: 'once' };

function openEmailDialog(opts = {}) {
    emailDialogConfig = { reportName: opts.reportName || 'Qualification Report', mode: opts.mode || 'once' };
    currentRecipients = [];                      // creation always starts empty
    emailReportDialog.headerTitle = 'Send Report';
    emailReportDialog.overlayClass = 'send-report-overlay';
    emailReportDialog.opened = true;
    emailReportDialog.requestContentUpdate();
}

// Toggle between "Send once" and "Schedule" modes
function applyEmailMode(mode) {
    emailDialogConfig.mode = mode;
    const sched = document.getElementById('emailScheduleFields');
    if (sched) sched.style.display = (mode === 'schedule') ? '' : 'none';
    document.querySelectorAll('#emailModeToggle .email-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    const primary = document.getElementById('emailPrimaryBtn');
    if (primary) primary.textContent = (mode === 'schedule') ? 'Schedule Report' : 'Send Report';
}

// Toggle the frequency-specific detail rows + interval unit label
function applyFreqDetail(freq) {
    const weekly  = document.getElementById('freq-weekly');
    const monthly = document.getElementById('freq-monthly');
    if (weekly)  weekly.style.display  = (freq === 'WEEKLY')  ? '' : 'none';
    if (monthly) monthly.style.display = (freq === 'MONTHLY') ? '' : 'none';
    // Weekly + Monthly imply an "every week / every month" cadence, so the
    // "Repeat every N" interval is hidden for them.
    const intervalField = document.getElementById('intervalField');
    if (intervalField) intervalField.style.display = (freq === 'WEEKLY' || freq === 'MONTHLY') ? 'none' : '';
    const unit = document.getElementById('emailIntervalUnit');
    if (unit) unit.textContent = (FREQ_UNIT[freq] || 'cycle') + '(s)';
    updateRecurPreview();
}

// Read the recurrence form into a rule object (used for preview + submit)
function readRecurState() {
    const freq     = document.getElementById('emailFrequency')?.value || 'WEEKLY';
    const interval = Math.max(1, parseInt(document.getElementById('emailInterval')?.value || '1', 10));
    const byday    = [...document.querySelectorAll('#dowRow .dow-btn.active')].map(b => b.dataset.code);
    const monthMode    = document.querySelector('input[name="monthMode"]:checked')?.value || 'weekday';
    const monthOrdinal = document.getElementById('emailMonthOrdinal')?.value || '1';
    const monthWeekday = document.getElementById('emailMonthWeekday')?.value || 'MO';
    const bymonthday   = document.getElementById('emailDayOfMonth')?.value || '1';
    const time     = document.getElementById('emailTime')?.value || '08:00';
    return { freq, interval, byday, monthMode, monthOrdinal, monthWeekday, bymonthday, time };
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
        <p class="sv-dialog-subtitle">Send <strong>${cfg.reportName}</strong> now, or schedule a recurring delivery.</p>

        <div class="email-mode-toggle" id="emailModeToggle">
            <button type="button" class="email-mode-btn" data-mode="once"><i class="fa-regular fa-paper-plane"></i> Send once</button>
            <button type="button" class="email-mode-btn" data-mode="schedule"><i class="fa-regular fa-clock"></i> Schedule</button>
        </div>

        <p class="sv-section-heading">Recipients</p>
        <div class="recip-box" id="recipBox">
            <div class="recip-chips" id="recipChips"></div>
            <span class="recip-empty" id="recipEmpty">No recipients selected yet.</span>
        </div>
        <div class="recip-tools">
            <vaadin-button theme="secondary small" id="recipPickBtn">
                <i class="fa-solid fa-user-plus" slot="prefix"></i> Select recipients
            </vaadin-button>
            <span class="recip-error" id="recipError"></span>
        </div>

        <div id="emailScheduleFields">
        <hr class="sv-hr">
        <p class="sv-section-heading">Scheduled report name</p>
        <vaadin-text-field theme="outlined" id="emailScheduleName" label="Name"
            placeholder="e.g. Exec team — weekly compliance" required style="width:100%"></vaadin-text-field>

        <hr class="sv-hr">

        <p class="sv-section-heading">Recurrence</p>
        <vaadin-select theme="outlined" id="emailFrequency" label="Frequency" style="width:200px"></vaadin-select>
        <div class="interval-field" id="intervalField" style="margin-top:12px">
            <vaadin-number-field theme="outlined" id="emailInterval" label="Repeat every"
                min="1" step="1" value="1" style="width:100%"></vaadin-number-field>
            <span class="interval-unit" id="emailIntervalUnit">day(s)</span>
        </div>

        <div id="freq-weekly" class="freq-detail">
            <label class="filter-label" style="display:block;margin:10px 0 6px">On these days</label>
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

        <div class="email-fieldrow" style="margin-top:12px">
            <vaadin-date-picker theme="outlined" id="emailStartDate" label="Start date" style="width:180px"></vaadin-date-picker>
            <vaadin-select theme="outlined" id="emailTime" label="Time" style="width:140px"></vaadin-select>
        </div>

        <div class="rrule-preview">
            <div class="rrule-human"><i class="fa-regular fa-calendar-check"></i> <span id="recurHuman"></span></div>
        </div>
        </div><!-- /emailScheduleFields -->

        <hr class="sv-hr">

        <p class="sv-section-heading">Email message</p>
        <vaadin-text-field theme="outlined" id="emailSubject" label="Subject"
            placeholder="${cfg.reportName}" style="width:100%"></vaadin-text-field>
        <vaadin-text-area theme="outlined" id="emailMessage" label="Body Message"
            placeholder="Add a message for recipients…" style="width:100%;margin-top:10px"></vaadin-text-area>

        <hr class="sv-hr">

        <p class="sv-section-heading">File format</p>
        <vaadin-select theme="outlined" id="emailFormat" label="File format"
            helper-text="Recipients get a Convergence link to download the report." style="width:240px"></vaadin-select>

        <hr class="sv-hr">

        <p class="sv-section-heading">Report contents</p>
        <p class="email-contents-note"><i class="fa-regular fa-circle-question"></i>
            The email uses the report's current filters, shown below.</p>
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

    // Time (15-minute intervals; formatTime shows AM/PM)
    const timeSel = root.querySelector('#emailTime');
    timeSel.items = Array.from({ length: 96 }, (_, i) => {
        const v = String(Math.floor(i / 4)).padStart(2, '0') + ':' + String((i % 4) * 15).padStart(2, '0');
        return { label: formatTime(v), value: v };
    });
    timeSel.value = '08:00';
    timeSel.addEventListener('value-changed', updateRecurPreview);

    // File format for the download link
    const fmtSel = root.querySelector('#emailFormat');
    fmtSel.items = [
        { label: 'Adobe PDF', value: 'PDF' },
        { label: 'Microsoft Excel', value: 'Excel' },
        { label: 'CSV', value: 'CSV' },
    ];
    fmtSel.value = 'PDF';

    // Monthly: ordinal + weekday selects, plus day-of-month (1–31)
    const ordSel = root.querySelector('#emailMonthOrdinal');
    ordSel.items = [
        { label: 'first', value: '1' }, { label: 'second', value: '2' },
        { label: 'third', value: '3' }, { label: 'fourth', value: '4' }, { label: 'last', value: '-1' },
    ];
    ordSel.value = '1';
    ordSel.addEventListener('value-changed', updateRecurPreview);

    const wdSel = root.querySelector('#emailMonthWeekday');
    wdSel.items = DOW.map(d => ({ label: d.name, value: d.code }));
    wdSel.value = 'MO';
    wdSel.addEventListener('value-changed', updateRecurPreview);

    const domSel = root.querySelector('#emailDayOfMonth');
    domSel.items = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
    domSel.value = '1';
    domSel.addEventListener('value-changed', updateRecurPreview);

    root.querySelectorAll('input[name="monthMode"]').forEach(rb =>
        rb.addEventListener('change', updateRecurPreview));

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

    // Mode toggle (Send once vs Schedule)
    root.querySelectorAll('#emailModeToggle .email-mode-btn').forEach(b =>
        b.addEventListener('click', () => applyEmailMode(b.dataset.mode)));

    // Initial state
    applyFreqDetail('WEEKLY');
    applyEmailMode(cfg.mode);
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
    primaryBtn.textContent = (emailDialogConfig.mode === 'schedule') ? 'Schedule Report' : 'Send Report';
    primaryBtn.addEventListener('click', submitEmailDialog);

    root.appendChild(cancelBtn);
    root.appendChild(primaryBtn);
};

function submitEmailDialog() {
    // Recipients — picker-only, must have at least one (both modes)
    if (currentRecipients.length === 0) {
        document.getElementById('recipBox')?.classList.add('invalid');
        const err = document.getElementById('recipError');
        if (err) err.textContent = 'Add at least one recipient';
        return;
    }

    const format = document.getElementById('emailFormat')?.value || 'PDF';

    // ── Send once ── no schedule/recurrence needed
    if (emailDialogConfig.mode === 'once') {
        emailReportDialog.opened = false;
        const n = currentRecipients.length;
        showToast(`Report sent to ${n} recipient${n !== 1 ? 's' : ''} (${format})`);
        return;
    }

    // ── Schedule ── delivery name + recurrence required
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

    const rrule = buildRRule(r);
    console.log('[v1] scheduled report', { name, reportName: emailDialogConfig.reportName,
        recipients: currentRecipients.slice(), format, rrule });

    emailReportDialog.opened = false;
    showToast(`Report scheduled — ${describeRecur(r)}`);
}

// ── Wire the "Schedule a Report" buttons on both reports ───────────
document.getElementById('emailBtn')?.addEventListener('click',
    () => openEmailDialog({ reportName: 'Qualification Report' }));
document.getElementById('actExEmailBtn')?.addEventListener('click',
    () => openEmailDialog({ reportName: 'Activity Exception Report' }));


// ================================================================
// SAVED VIEWS — Save View + Apply Saved View (ported from v2)
// ================================================================

// v1 is scheduling-only and doesn't track schedules per view, so this stays
// empty; scheduleCountForView therefore returns 0 and no schedule badge shows.
const SCHEDULED_REPORTS = [];
function scheduleCountForView(viewId) {
    return SCHEDULED_REPORTS.filter(s => s.savedViewId === viewId).length;
}

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
        activities: ['All Activities'], users: ['All Users'],
        statusTypes: 'All', columns: 'Activity, User, Status, Completion Date',
        activityCount: 0, userCount: 0, favorited: true,
    },
    {
        id: 'overdue-nov', name: 'Overdue Activities Nov',
        report: 'Activity Exception Report',
        desc: 'Filter showing only overdue activities in November',
        dateRange: '11/01/25 – 11/30/25',
        activities: ['All Activities'], users: ['All Users'],
        statusTypes: 'Overdue', columns: 'Activity, User, Status, Next Due Date',
        activityCount: 0, userCount: 0, favorited: false,
    },
];

// ── Save View dialog (create / edit metadata) ──────────────────────
// (reuses the existing FILTER_SUMMARY_ROWS defined earlier in this file)
const saveViewDialog = document.getElementById('saveViewDialog');
const saveViewBtn    = document.getElementById('saveViewBtn');
let saveViewContext  = { mode: 'create', sourceView: null };

function openSaveViewDialog(ctx) {
    saveViewContext = ctx || { mode: 'create', sourceView: null };
    saveViewDialog.headerTitle = saveViewContext.mode === 'edit' ? 'Edit Saved View' : 'Create New Saved View';
    saveViewDialog.overlayClass = 'save-view-overlay';
    saveViewDialog.opened = true;
    saveViewDialog.requestContentUpdate();
}

saveViewDialog.renderer = (root) => {
    root.innerHTML = '';
    root.style.minWidth = '600px';
    root.style.maxWidth = '680px';
    const ctx = saveViewContext;
    const src = ctx.sourceView;

    const subtitle = document.createElement('p');
    subtitle.className = 'sv-dialog-subtitle';
    subtitle.textContent = ctx.mode === 'edit'
        ? 'Update this saved view’s settings.'
        : 'Configure filter settings and meta data for this saved view.';
    root.appendChild(subtitle);

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
    if (ctx.mode === 'edit' && src) nameField.value = src.name;
    root.appendChild(nameField);

    const descArea = document.createElement('vaadin-text-area');
    descArea.setAttribute('theme', 'outlined');
    descArea.setAttribute('label', 'Saved View Description');
    descArea.setAttribute('placeholder', 'Describe the saved view...');
    descArea.style.cssText = 'width:100%; margin-top:12px';
    if (ctx.mode === 'edit' && src) descArea.value = src.desc || '';
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
    root.innerHTML = '';
    const ctx = saveViewContext;

    const cancelBtn = document.createElement('vaadin-button');
    cancelBtn.setAttribute('theme', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { saveViewDialog.opened = false; });

    const primaryBtn = document.createElement('vaadin-button');
    primaryBtn.setAttribute('theme', 'primary');
    primaryBtn.textContent = ctx.mode === 'edit' ? 'Save Changes' : 'Create Saved View';
    primaryBtn.addEventListener('click', () => {
        const field = document.getElementById('saveViewNameField');
        const name = field?.value.trim();
        if (!name) {
            if (field) { field.invalid = true; field.errorMessage = 'Name is required'; }
            return;
        }
        if (ctx.mode === 'edit') viewDirty = false;
        saveViewDialog.opened = false;
        showToast(ctx.mode === 'edit' ? 'Saved view updated' : 'Saved view created');
    });

    root.appendChild(cancelBtn);
    root.appendChild(primaryBtn);
};

// ── Save View split-button dropdown ────────────────────────────────
const saveViewMenu    = document.getElementById('saveViewMenu');
const saveViewItem    = document.getElementById('saveViewItem');
const saveNewViewItem = document.getElementById('saveNewViewItem');

saveViewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveViewMenu.style.display = saveViewMenu.style.display === 'none' ? 'block' : 'none';
});
saveViewItem.addEventListener('click', () => {
    saveViewMenu.style.display = 'none';
    if (appliedSavedView) attemptEditView(appliedSavedView);
    else openSaveViewDialog({ mode: 'create', sourceView: null });
});
saveNewViewItem.addEventListener('click', () => {
    saveViewMenu.style.display = 'none';
    openSaveViewDialog({ mode: 'create', sourceView: null });
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#saveViewControl')) saveViewMenu.style.display = 'none';
});

function openViewEditor(view) { openSaveViewDialog({ mode: 'edit', sourceView: view }); }
function attemptEditView(view) { openViewEditor(view); }

// ── Apply Saved View dialog (list + preview) ───────────────────────
const selectSavedViewDialog = document.getElementById('selectSavedViewDialog');
const applySavedViewBtn     = document.getElementById('applySavedViewBtn');
let selectedSavedViewId = null;

selectSavedViewDialog.renderer = (root) => {
    if (root.firstChild) return;
    root.style.width = '800px';
    root.style.maxWidth = '100%';
    root.style.boxSizing = 'border-box';

    const subtitle = document.createElement('p');
    subtitle.className = 'sv-dialog-subtitle';
    subtitle.textContent = 'Select a saved view to apply its filters to the current report.';
    root.appendChild(subtitle);

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
    searchRow.querySelector('#svSearchInput').addEventListener('input', (e) => buildSavedViewList(e.target.value));
};

function buildSavedViewList(query) {
    const listPanel = document.getElementById('svListPanel');
    if (!listPanel) return;
    listPanel.innerHTML = '';
    const q = query.toLowerCase();
    const filtered = SAVED_VIEWS.filter(v => v.name.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q));
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
        { icon: 'fa-regular fa-calendar',    label: 'Date Range',                         value: view.dateRange },
        { icon: 'fa-solid fa-list',           label: `Activities (${view.activityCount})`, pills: view.activities },
        { icon: 'fa-solid fa-user',           label: `Users (${view.userCount})`,          pills: view.users },
        { icon: 'fa-solid fa-tag',            label: 'Status Types',                       value: view.statusTypes },
        { icon: 'fa-solid fa-table-columns',  label: 'Columns Shown',                      value: view.columns },
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

// ── Applied view state + reflecting filters into the panel ─────────
let appliedSavedView = null;
let viewDirty = false;
let suppressDirty = false;

function setSaveViewLabels(applied) {
    const btnLabel  = document.getElementById('saveViewBtnLabel');
    const itemLabel = document.getElementById('saveViewItemLabel');
    if (btnLabel)  btnLabel.textContent  = applied ? 'Update View' : 'Save View';
    if (itemLabel) itemLabel.textContent = applied ? 'Update View' : 'Save View';
}

function markViewDirty() { if (appliedSavedView && !suppressDirty) viewDirty = true; }

function populateFilterPanelFromView(view) {
    suppressDirty = true;
    if (view.dateRange && typeof syncDateRangeDisplay === 'function') {
        syncDateRangeDisplay('#filterPanel', view.dateRange);
    } else {
        const dateInput = document.querySelector('#filterPanel .date-input');
        if (dateInput && view.dateRange) dateInput.value = view.dateRange;
    }

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

    const cq = document.getElementById('chk-qualified');
    const ci = document.getElementById('chk-incomplete');
    const st = view.status || 'all';
    if (cq) cq.checked = (st === 'qualified');
    if (ci) ci.checked = (st === 'incomplete');
    suppressDirty = false;
}

function applyView(view) {
    appliedSavedView = view;
    document.getElementById('appliedBanner').style.display = 'flex';
    document.getElementById('appliedBannerName').textContent = view.name;
    const schedTag = document.getElementById('appliedBannerSched');
    if (schedTag) {
        const n = scheduleCountForView(view.id);
        if (n > 0) {
            schedTag.innerHTML = `<i class="fa-regular fa-clock"></i> ${n} scheduled report${n !== 1 ? 's' : ''}`;
            schedTag.style.display = '';
        } else {
            schedTag.style.display = 'none';
        }
    }
    setSaveViewLabels(true);
    if (view.report === 'Qualification Report') populateFilterPanelFromView(view);
    viewDirty = false;
}

document.getElementById('clearAppliedViewBtn').addEventListener('click', () => {
    appliedSavedView = null;
    viewDirty = false;
    document.getElementById('appliedBanner').style.display = 'none';
    const schedTag = document.getElementById('appliedBannerSched');
    if (schedTag) schedTag.style.display = 'none';
    document.getElementById('saveViewMenu').style.display = 'none';
    selectedSavedViewId = null;
    setSaveViewLabels(false);
});

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


// ================================================================
// DATE RANGE — preset dropdown + custom calendar range (filter panel)
// Replaces v1's inline chip control. Presets compute a real start/end from
// today; "Custom date range" swaps the preset list for two design-system date
// pickers so Apply stays visible. Hidden .date-input mirrors the selection.
// (Reuses the MONTHS constant already defined above.)
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
        case 'datetonow': start = null;                             break;
        default: return null;
    }
    return { start, end };
}
function drangeFmt(d) { return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : null; }
function drangeParseIso(v) { if (!v) return null; const [y, m, d] = v.split('-').map(Number); return (y && m && d) ? new Date(y, m - 1, d) : null; }
function drangeBadgeText(s, e) {
    if (!s && e) return `Through ${drangeFmt(e)}`;
    if (s && e && drangeFmt(s) === drangeFmt(e)) return drangeFmt(s);
    if (s && e) return `${drangeFmt(s)} - ${drangeFmt(e)}`;
    return 'All dates';
}
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
        if (key === 'custom') { setActive(opt); showCustom(); return; }
        setActive(opt);
        setLabel(opt.textContent.trim());
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
