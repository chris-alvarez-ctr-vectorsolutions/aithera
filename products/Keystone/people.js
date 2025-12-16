/**
 * People Module
 *
 * Handles all people-related functionality:
 * - Listing and filtering people
 * - Viewing person details
 * - Mapping/unmapping product users
 */

import {
  getKeystonePeople,
  getKeystoneTenants,
  getAllProductUsers,
  getPersonMappings,
  mapPersonToProductUser,
  unmapPersonFromProductUser,
  getProducts
} from './api.js';

import {
  setPeopleList,
  getPeopleList,
  setSelectedPerson,
  getSelectedPerson,
  getPeopleFilters,
  setPeopleFilters,
  showNotification,
  showConfirmDialog
} from './state.js';

// ==========================================
// INITIALIZATION
// ==========================================

export function initPeople() {
  console.log('Initializing People module...');

  // Initialize filters
  initPeopleFilters();

  // Set up event listeners
  setupPeopleFilters();

  // Load people
  loadPeople();
}

// ==========================================
// INITIALIZE FILTERS
// ==========================================

async function initPeopleFilters() {
  // Initialize tenant filter dropdown
  const tenantFilter = document.querySelector('#peopleTenantFilter');
  if (tenantFilter) {
    try {
      const tenants = await getKeystoneTenants();
      tenantFilter.items = [
        { label: '-- All Tenants --', value: '' },
        ...tenants.map(t => ({
          label: t.name,
          value: t.id
        }))
      ];
    } catch (error) {
      console.error('Error loading tenants for filter:', error);
    }
  }

  // Initialize product filter
  const productFilter = document.querySelector('#peopleProductFilter');
  if (productFilter) {
    const products = getProducts();
    productFilter.items = products.map(p => ({
      label: p.name,
      value: p.code
    }));
  }
}

// ==========================================
// SETUP FILTERS
// ==========================================

function setupPeopleFilters() {
  const applyBtn = document.querySelector('#peopleApplyFiltersBtn');
  const clearBtn = document.querySelector('#peopleClearFiltersBtn');

  // Apply filters
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyPeopleFilters();
    });
  }

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearPeopleFilters();
    });
  }

  // Allow Enter key in text fields
  const textFilters = [
    '#peopleFirstNameFilter',
    '#peopleLastNameFilter',
    '#peopleEmailFilter'
  ];

  textFilters.forEach(selector => {
    const field = document.querySelector(selector);
    if (field) {
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          applyPeopleFilters();
        }
      });
    }
  });
}

function applyPeopleFilters() {
  const firstName = document.querySelector('#peopleFirstNameFilter').value.trim().toLowerCase();
  const lastName = document.querySelector('#peopleLastNameFilter').value.trim().toLowerCase();
  const email = document.querySelector('#peopleEmailFilter').value.trim().toLowerCase();
  const tenantId = document.querySelector('#peopleTenantFilter').value;
  const productCodes = document.querySelector('#peopleProductFilter').selectedItems || [];

  setPeopleFilters({
    firstName,
    lastName,
    email,
    tenantId,
    productCodes: productCodes.map(item => item.value)
  });

  renderPeopleTable();
}

function clearPeopleFilters() {
  document.querySelector('#peopleFirstNameFilter').value = '';
  document.querySelector('#peopleLastNameFilter').value = '';
  document.querySelector('#peopleEmailFilter').value = '';
  document.querySelector('#peopleTenantFilter').value = '';
  document.querySelector('#peopleProductFilter').selectedItems = [];

  setPeopleFilters({
    firstName: '',
    lastName: '',
    email: '',
    tenantId: '',
    productCodes: []
  });

  renderPeopleTable();
}

// ==========================================
// LOAD PEOPLE
// ==========================================

async function loadPeople() {
  try {
    const people = await getKeystonePeople();
    setPeopleList(people);
    renderPeopleTable();
  } catch (error) {
    console.error('Error loading people:', error);
    showNotification('Failed to load people', 'error');
  }
}

// ==========================================
// RENDER PEOPLE TABLE
// ==========================================

async function renderPeopleTable() {
  const tbody = document.querySelector('#peopleTableBody');
  const emptyState = document.querySelector('#peopleEmptyState');

  if (!tbody) return;

  // Get filtered people
  const allPeople = getPeopleList();
  const filters = getPeopleFilters();

  // Get all tenants for display
  const tenants = await getKeystoneTenants();
  const tenantsMap = {};
  tenants.forEach(t => {
    tenantsMap[t.id] = t;
  });

  // Get all mappings and product users if filtering by product
  let productUserMappings = [];
  if (filters.productCodes.length > 0) {
    const allProductUsers = await getAllProductUsers();
    const products = getProducts();

    // Get mappings for each person
    for (const person of allPeople) {
      const mappings = await getPersonMappings(person.id);
      mappings.forEach(m => {
        const productUser = allProductUsers.find(pu => pu.id === m.productUserId);
        if (productUser) {
          productUserMappings.push({
            keystonePersonId: person.id,
            productUserId: m.productUserId,
            productTenantId: productUser.productTenantId
          });
        }
      });
    }
  }

  // Filter people
  const filteredPeople = allPeople.filter(person => {
    // First name filter
    if (filters.firstName && !person.firstName.toLowerCase().includes(filters.firstName)) {
      return false;
    }

    // Last name filter
    if (filters.lastName && !person.lastName.toLowerCase().includes(filters.lastName)) {
      return false;
    }

    // Email filter
    if (filters.email) {
      const emailMatch = person.emails.some(e => e.toLowerCase().includes(filters.email));
      if (!emailMatch) return false;
    }

    // Tenant filter
    if (filters.tenantId && person.keystoneTenantId !== filters.tenantId) {
      return false;
    }

    // Product filter
    if (filters.productCodes.length > 0) {
      const personMappings = productUserMappings.filter(m => m.keystonePersonId === person.id);
      if (personMappings.length === 0) return false;

      // Check if person has mapping to any of the selected products
      // This is a simplified check - in real implementation would need to check product tenant's product code
      // For now, just show all people if product filter is active (this would need backend support)
    }

    return true;
  });

  // Clear table
  tbody.innerHTML = '';

  // Show/hide empty state
  if (filteredPeople.length === 0) {
    emptyState.style.display = 'flex';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  // Get mappings count for each person
  const mappingsCounts = await Promise.all(
    filteredPeople.map(async (person) => {
      const mappings = await getPersonMappings(person.id);
      return mappings.length;
    })
  );

  // Render rows
  filteredPeople.forEach((person, index) => {
    const row = document.createElement('tr');
    row.dataset.personId = person.id;

    // Check if this is the selected person
    const selected = getSelectedPerson();
    if (selected && selected.id === person.id) {
      row.classList.add('selected');
    }

    const tenant = tenantsMap[person.keystoneTenantId];
    const tenantName = tenant ? tenant.name : 'Unknown';

    row.innerHTML = `
      <td>${person.firstName}</td>
      <td>${person.lastName}</td>
      <td>${person.emails[0] || 'N/A'}</td>
      <td>${tenantName}</td>
      <td class="text-center">
        <vaadin-badge theme="badge primary">${mappingsCounts[index]}</vaadin-badge>
      </td>
    `;

    // Click to select
    row.addEventListener('click', () => {
      selectPerson(person);
    });

    // Keyboard navigation
    row.tabIndex = 0;
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        selectPerson(person);
      }
    });

    tbody.appendChild(row);
  });
}

// ==========================================
// SELECT PERSON
// ==========================================

function selectPerson(person) {
  setSelectedPerson(person);

  // Update selected row styling
  const allRows = document.querySelectorAll('#peopleTableBody tr');
  allRows.forEach(row => {
    if (row.dataset.personId === person.id) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });

  // Render detail panel
  renderPersonDetail(person);
}

// ==========================================
// RENDER PERSON DETAIL PANEL
// ==========================================

async function renderPersonDetail(person) {
  const detailPanel = document.querySelector('#personDetailPanel');

  if (!detailPanel) return;

  // Show loading state
  detailPanel.innerHTML = `
    <div class="detail-loading">
      <vwc-spinner></vwc-spinner>
      <p>Loading person details...</p>
    </div>
  `;

  try {
    // Get tenant info
    const tenants = await getKeystoneTenants();
    const tenant = tenants.find(t => t.id === person.keystoneTenantId);

    // Get mappings
    const mappings = await getPersonMappings(person.id);

    // Get all product users to resolve mappings
    const allProductUsers = await getAllProductUsers();

    // Build detail HTML
    let html = `
      <div class="detail-content">
        <!-- Person Info Header -->
        <div class="detail-header">
          <h2>${person.firstName} ${person.lastName}</h2>
          <div class="detail-meta">
            <div class="meta-item">
              <i class="fa-solid fa-fingerprint"></i>
              <span class="meta-label">Keystone ID:</span>
              <code>${person.id}</code>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-building"></i>
              <span class="meta-label">Tenant:</span>
              <span>${tenant ? tenant.name : 'Unknown'}</span>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-envelope"></i>
              <span class="meta-label">Emails:</span>
              <span>${person.emails.join(', ')}</span>
            </div>
          </div>
        </div>

        <vwc-divider style="margin: 20px 0;"></vwc-divider>

        <!-- Product User Mappings Section -->
        <div class="mappings-section">
          <h3>
            <i class="fa-solid fa-link"></i>
            Product User Mappings
          </h3>
          <p class="section-help">
            Map this Keystone Person to product-specific users. Search for users by email or name to create mappings.
          </p>

          <!-- Existing Mappings -->
          <div class="existing-mappings">
            <h4>Current Mappings</h4>
    `;

    if (mappings.length === 0) {
      html += `<p class="empty-message">No product user mappings yet</p>`;
    } else {
      html += `<div class="mappings-list">`;
      for (const mapping of mappings) {
        const productUser = allProductUsers.find(pu => pu.id === mapping.productUserId);
        if (productUser) {
          const product = getProducts().find(p => {
            // Find product by checking if any product tenant belongs to this product
            // This is simplified - in real app would need better lookup
            return true; // Placeholder
          });

          html += `
            <div class="mapping-item" data-product-user-id="${productUser.id}">
              <div class="mapping-info">
                <strong>${productUser.firstName} ${productUser.lastName}</strong>
                <span class="mapping-email">${productUser.emails.join(', ')}</span>
              </div>
              <vaadin-button
                theme="tertiary small error"
                class="unmap-person-btn"
                data-product-user-id="${productUser.id}">
                <i class="fa-solid fa-xmark"></i>
                Unmap
              </vaadin-button>
            </div>
          `;
        }
      }
      html += `</div>`;
    }

    html += `
          </div>

          <vwc-divider style="margin: 20px 0;"></vwc-divider>

          <!-- Add New Mapping -->
          <div class="add-mapping">
            <h4>Add New Mapping</h4>
            <div class="add-mapping-form">
              <vaadin-select
                id="selectProductUserDropdown"
                label="Search Product Users"
                placeholder="Select a product user..."
                theme="outlined"
                style="width: 100%;">
              </vaadin-select>
              <vaadin-button
                theme="primary"
                id="addMappingBtn">
                <i class="fa-solid fa-plus"></i>
                Add Mapping
              </vaadin-button>
            </div>
          </div>
        </div>
      </div>
    `;

    detailPanel.innerHTML = html;

    // Populate product user dropdown
    const dropdown = document.querySelector('#selectProductUserDropdown');
    if (dropdown) {
      const items = [
        { label: '-- Select Product User --', value: '' },
        ...allProductUsers.map(pu => ({
          label: `${pu.firstName} ${pu.lastName} (${pu.emails[0]})`,
          value: pu.id
        }))
      ];
      dropdown.items = items;
    }

    // Add mapping button handler
    const addBtn = document.querySelector('#addMappingBtn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const selectedUserId = dropdown.value;
        if (!selectedUserId) {
          showNotification('Please select a product user', 'warning');
          return;
        }
        await handleAddMapping(person, selectedUserId);
      });
    }

    // Unmap button handlers
    const unmapBtns = detailPanel.querySelectorAll('.unmap-person-btn');
    unmapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const productUserId = btn.dataset.productUserId;
        const productUser = allProductUsers.find(pu => pu.id === productUserId);
        handleUnmapPerson(person, productUser);
      });
    });

  } catch (error) {
    console.error('Error rendering person detail:', error);
    detailPanel.innerHTML = `
      <div class="detail-error">
        <i class="fa-solid fa-triangle-exclamation fa-2x"></i>
        <p>Failed to load person details</p>
      </div>
    `;
  }
}

// ==========================================
// HANDLE ADD MAPPING
// ==========================================

async function handleAddMapping(person, productUserId) {
  try {
    await mapPersonToProductUser(person.id, productUserId);
    showNotification('Product user mapping created', 'success');

    // Refresh the detail panel
    renderPersonDetail(person);

    // Update table to show new mapping count
    renderPeopleTable();

  } catch (error) {
    console.error('Error mapping person:', error);
    if (error.message.includes('already exists')) {
      showNotification('This mapping already exists', 'warning');
    } else {
      showNotification('Failed to create mapping', 'error');
    }
  }
}

// ==========================================
// HANDLE UNMAP PERSON
// ==========================================

function handleUnmapPerson(person, productUser) {
  showConfirmDialog(
    'Confirm Unmapping',
    `Are you sure you want to unmap "${person.firstName} ${person.lastName}" from product user "${productUser.firstName} ${productUser.lastName}"?`,
    async () => {
      try {
        await unmapPersonFromProductUser(person.id, productUser.id);
        showNotification('Product user unmapped', 'success');

        // Refresh the detail panel
        renderPersonDetail(person);

        // Update table to show new mapping count
        renderPeopleTable();

      } catch (error) {
        console.error('Error unmapping person:', error);
        showNotification('Failed to remove mapping', 'error');
      }
    }
  );
}
