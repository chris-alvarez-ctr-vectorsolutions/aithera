/**
 * Tenants Module (Updated)
 *
 * Handles all tenant-related functionality:
 * - Creating tenants via modal
 * - Listing and filtering tenants
 * - Viewing tenant details in separate view
 * - Mapping/unmapping product tenants via searchable tables
 */

import {
  getKeystoneTenants,
  createKeystoneTenant,
  getProducts,
  getProductTenants,
  getTenantMappings,
  mapTenantToProduct,
  unmapTenantFromProduct
} from './api.js';

import {
  setTenantsList,
  getTenantsList,
  setSelectedTenant,
  getSelectedTenant,
  getTenantSearchTerm,
  setTenantSearchTerm,
  showNotification,
  showConfirmDialog
} from './state.js';

// ==========================================
// INITIALIZATION
// ==========================================

export function initTenants() {
  console.log('Initializing Tenants module...');

  // Set up event listeners
  setupCreateTenantModal();
  setupTenantSearch();

  // Load tenants
  loadTenants();
}

// ==========================================
// CREATE TENANT MODAL
// ==========================================

function setupCreateTenantModal() {
  const openBtn = document.querySelector('#openCreateTenantBtn');
  const dialog = document.querySelector('#createTenantDialog');

  if (!openBtn || !dialog) return;

  // Open modal button
  openBtn.addEventListener('click', () => {
    showCreateTenantModal();
  });
}

function showCreateTenantModal() {
  const dialog = document.querySelector('#createTenantDialog');

  // Set header
  dialog.headerTitle = 'Create New Keystone Tenant';

  // Render form content
  dialog.renderer = function(root) {
    if (!root.firstElementChild) {
      const form = document.createElement('div');
      form.className = 'create-tenant-modal-form';
      form.innerHTML = `
        <vaadin-text-field
          id="modalTenantName"
          label="Tenant Name"
          theme="outlined"
          required
          style="width: 100%; margin-bottom: 16px;">
        </vaadin-text-field>

        <vaadin-text-field
          id="modalTenantAddress1"
          label="Address Line 1"
          theme="outlined"
          required
          style="width: 100%; margin-bottom: 16px;">
        </vaadin-text-field>

        <vaadin-text-field
          id="modalTenantAddress2"
          label="Address Line 2"
          theme="outlined"
          style="width: 100%; margin-bottom: 16px;">
        </vaadin-text-field>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <vaadin-text-field
            id="modalTenantCity"
            label="City"
            theme="outlined"
            required>
          </vaadin-text-field>

          <vaadin-text-field
            id="modalTenantState"
            label="State/Province"
            theme="outlined"
            required>
          </vaadin-text-field>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <vaadin-text-field
            id="modalTenantPostalCode"
            label="Postal Code"
            theme="outlined">
          </vaadin-text-field>

          <vaadin-select
            id="modalTenantCountry"
            label="Country"
            theme="outlined">
          </vaadin-select>
        </div>
      `;
      root.appendChild(form);

      // Initialize country dropdown
      const countrySelect = root.querySelector('#modalTenantCountry');
      countrySelect.items = [
        { label: 'United States', value: 'USA' },
        { label: 'Canada', value: 'CAN' },
        { label: 'United Kingdom', value: 'GBR' },
        { label: 'Australia', value: 'AUS' },
        { label: 'Other', value: 'OTHER' }
      ];
      countrySelect.value = 'USA';
    }
  };

  // Render footer with buttons
  dialog.footerRenderer = function(root) {
    if (!root.firstElementChild) {
      const cancelBtn = document.createElement('vaadin-button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.setAttribute('theme', 'tertiary');
      cancelBtn.addEventListener('click', () => {
        dialog.opened = false;
      });

      const createBtn = document.createElement('vaadin-button');
      createBtn.setAttribute('theme', 'primary');
      createBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Create Tenant';
      createBtn.addEventListener('click', async () => {
        await handleCreateTenant(dialog);
      });

      root.appendChild(cancelBtn);
      root.appendChild(createBtn);
    }
  };

  // Open the dialog
  dialog.opened = true;
}

async function handleCreateTenant(dialog) {
  // Get form values
  const name = dialog.querySelector('#modalTenantName').value.trim();
  const address1 = dialog.querySelector('#modalTenantAddress1').value.trim();
  const address2 = dialog.querySelector('#modalTenantAddress2').value.trim();
  const city = dialog.querySelector('#modalTenantCity').value.trim();
  const state = dialog.querySelector('#modalTenantState').value.trim();
  const postalCode = dialog.querySelector('#modalTenantPostalCode').value.trim();
  const country = dialog.querySelector('#modalTenantCountry').value;

  // Validate
  if (!name || !address1 || !city || !state || !country) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  try {
    const newTenant = await createKeystoneTenant({
      name,
      address1,
      address2,
      city,
      state,
      postalCode,
      country
    });

    showNotification(`Tenant "${name}" created successfully!`, 'success');

    // Close dialog
    dialog.opened = false;

    // Reload tenants
    await loadTenants();

    // Navigate to detail view
    showTenantDetail(newTenant);

  } catch (error) {
    console.error('Error creating tenant:', error);
    showNotification('Failed to create tenant', 'error');
  }
}

// ==========================================
// SEARCH/FILTER FUNCTIONALITY
// ==========================================

function setupTenantSearch() {
  const searchField = document.querySelector('#tenantSearchField');

  if (!searchField) return;

  // Debounced search
  let searchTimeout;
  searchField.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setTenantSearchTerm(searchField.value.trim().toLowerCase());
      renderTenantsTable();
    }, 300);
  });

  // Enter key triggers immediate search
  searchField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchTimeout);
      setTenantSearchTerm(searchField.value.trim().toLowerCase());
      renderTenantsTable();
    }
  });
}

// ==========================================
// LOAD TENANTS
// ==========================================

async function loadTenants() {
  try {
    const tenants = await getKeystoneTenants();
    setTenantsList(tenants);
    renderTenantsTable();
  } catch (error) {
    console.error('Error loading tenants:', error);
    showNotification('Failed to load tenants', 'error');
  }
}

// ==========================================
// RENDER TENANTS TABLE
// ==========================================

async function renderTenantsTable() {
  const tbody = document.querySelector('#tenantsTableBody');
  const emptyState = document.querySelector('#tenantsEmptyState');

  if (!tbody) return;

  // Get filtered tenants
  const allTenants = getTenantsList();
  const searchTerm = getTenantSearchTerm();

  const filteredTenants = allTenants.filter(tenant => {
    if (!searchTerm) return true;

    return (
      tenant.name.toLowerCase().includes(searchTerm) ||
      tenant.city.toLowerCase().includes(searchTerm) ||
      tenant.state.toLowerCase().includes(searchTerm) ||
      tenant.country.toLowerCase().includes(searchTerm)
    );
  });

  // Clear table
  tbody.innerHTML = '';

  // Show/hide empty state
  if (filteredTenants.length === 0) {
    emptyState.style.display = 'flex';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  // Get mappings count for each tenant
  const mappingsCounts = await Promise.all(
    filteredTenants.map(async (tenant) => {
      const mappings = await getTenantMappings(tenant.id);
      return mappings.length;
    })
  );

  // Render rows
  filteredTenants.forEach((tenant, index) => {
    const row = document.createElement('tr');
    row.dataset.tenantId = tenant.id;

    row.innerHTML = `
      <td>${tenant.name}</td>
      <td>${tenant.city}</td>
      <td>${tenant.state}</td>
      <td>${tenant.country}</td>
      <td class="text-center">
        <vaadin-badge theme="badge primary">${mappingsCounts[index]}</vaadin-badge>
      </td>
    `;

    // Click to open detail view
    row.addEventListener('click', () => {
      showTenantDetail(tenant);
    });

    // Keyboard navigation
    row.tabIndex = 0;
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        showTenantDetail(tenant);
      }
    });

    tbody.appendChild(row);
  });
}

// ==========================================
// SHOW TENANT DETAIL VIEW
// ==========================================

async function showTenantDetail(tenant) {
  setSelectedTenant(tenant);

  // Hide tenants list view
  const tenantsView = document.querySelector('#tenantsView');
  const tenantDetailView = document.querySelector('#tenantDetailView');

  tenantsView.classList.remove('active');
  tenantDetailView.classList.add('active');

  // Render detail
  await renderTenantDetailView(tenant);
}

// ==========================================
// RENDER TENANT DETAIL VIEW
// ==========================================

async function renderTenantDetailView(tenant) {
  const container = document.querySelector('.detail-view-container');

  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div class="detail-loading" style="padding: 60px; text-align: center;">
      <vwc-spinner></vwc-spinner>
      <p>Loading tenant details...</p>
    </div>
  `;

  try {
    // Get mappings
    const mappings = await getTenantMappings(tenant.id);
    const products = getProducts();

    // Build HTML
    let html = `
      <!-- Header with back button -->
      <div class="detail-view-header">
        <vaadin-button theme="tertiary" id="backToTenantsBtn">
          <i class="fa-solid fa-arrow-left"></i>
          Back to Tenants
        </vaadin-button>
      </div>

      <!-- Content - Two Column Layout -->
      <div class="detail-view-content">
        <!-- Left Column: Tenant Info & Product List -->
        <div class="detail-view-left">
          <!-- Tenant Info -->
          <div class="detail-header">
            <h2>${tenant.name}</h2>
            <div class="detail-meta">
              <div class="meta-item">
                <i class="fa-solid fa-fingerprint"></i>
                <span class="meta-label">Keystone ID:</span>
                <code>${tenant.id}</code>
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-location-dot"></i>
                <span>${tenant.address1}${tenant.address2 ? ', ' + tenant.address2 : ''}</span>
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-city"></i>
                <span>${tenant.city}, ${tenant.state} ${tenant.postalCode || ''}</span>
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-globe"></i>
                <span>${tenant.country}</span>
              </div>
            </div>
          </div>

          <vwc-divider style="margin: 24px 0;"></vwc-divider>

          <!-- Product Mappings -->
          <div class="mappings-section">
            <h3>
              <i class="fa-solid fa-link"></i>
              Product Tenant Mappings
            </h3>
            <p class="section-help">
              Click on a product to search and map product-specific tenants in the panel on the right.
            </p>

            <div class="mappings-grid" id="productMappingsGrid">
              <!-- Product mapping rows will be inserted here -->
            </div>
          </div>
        </div>

        <!-- Right Column: Product Tenant Search -->
        <div class="detail-view-right" id="productSearchPanel">
          <div class="detail-view-right-empty">
            <i class="fa-solid fa-magnifying-glass fa-3x"></i>
            <p>Select a product to search and map<br>product tenants</p>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Add back button handler
    const backBtn = container.querySelector('#backToTenantsBtn');
    backBtn.addEventListener('click', () => {
      backToTenantsList();
    });

    // Render each product mapping row
    for (const product of products) {
      await renderProductMappingRow(tenant, product, mappings);
    }

  } catch (error) {
    console.error('Error rendering tenant detail:', error);
    container.innerHTML = `
      <div class="detail-error" style="padding: 60px; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation fa-2x"></i>
        <p>Failed to load tenant details</p>
      </div>
    `;
  }
}

// ==========================================
// RENDER PRODUCT MAPPING ROW
// ==========================================

async function renderProductMappingRow(tenant, product, existingMappings) {
  const grid = document.querySelector('#productMappingsGrid');
  if (!grid) return;

  // Get all product tenants for this product
  const productTenants = await getProductTenants(product.code);

  // Find existing mapping
  const existingMapping = existingMappings.find(m => {
    const pt = productTenants.find(pt => pt.id === m.productTenantId);
    return pt !== undefined;
  });

  const mappingRow = document.createElement('div');
  mappingRow.className = 'mapping-row';
  mappingRow.dataset.productCode = product.code;

  // Header section
  const headerHtml = `
    <div class="mapping-row-header">
      <div class="mapping-label">
        <strong>${product.name}</strong>
        ${existingMapping ? '<span style="color: var(--lumo-success-color); margin-left: 8px; font-size: 12px;"><i class="fa-solid fa-check-circle"></i> Mapped</span>' : '<span style="color: var(--lumo-secondary-text-color); margin-left: 8px; font-size: 12px;">Not mapped</span>'}
      </div>
      <div>
        ${existingMapping
          ? `<vaadin-button theme="tertiary small error" class="unmap-product-btn" data-product-tenant-id="${productTenants.find(pt => pt.id === existingMapping.productTenantId)?.id}">
               <i class="fa-solid fa-xmark"></i> Unmap
             </vaadin-button>`
          : `<vaadin-button theme="secondary small" class="search-product-btn">
               Map
             </vaadin-button>`
        }
      </div>
    </div>
  `;

  mappingRow.innerHTML = headerHtml;

  // Add to grid
  grid.appendChild(mappingRow);

  // Handle search button
  const searchBtn = mappingRow.querySelector('.search-product-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      toggleProductSearch(tenant, product, mappingRow, productTenants);
    });
  }

  // Handle unmap button
  const unmapBtn = mappingRow.querySelector('.unmap-product-btn');
  if (unmapBtn) {
    const productTenantId = unmapBtn.dataset.productTenantId;
    const productTenant = productTenants.find(pt => pt.id === productTenantId);
    unmapBtn.addEventListener('click', () => {
      handleUnmapProduct(tenant, productTenant, product);
    });
  }

  // Show current mapping if exists
  if (existingMapping) {
    const mappedTenant = productTenants.find(pt => pt.id === existingMapping.productTenantId);
    if (mappedTenant) {
      const mappedInfo = document.createElement('div');
      mappedInfo.style.marginTop = '4px';
      mappedInfo.style.padding = '8px';
      mappedInfo.style.backgroundColor = 'var(--lumo-success-color-10pct, #e6f7f0)';
      mappedInfo.style.borderRadius = '4px';
      mappedInfo.style.fontSize = '13px';
      mappedInfo.innerHTML = `
        <strong>${mappedTenant.name}</strong><br>
        <span style="font-size: 11px; color: var(--lumo-secondary-text-color);">${mappedTenant.city}, ${mappedTenant.state}</span>
      `;
      mappingRow.appendChild(mappedInfo);
    }
  }
}

// ==========================================
// TOGGLE PRODUCT SEARCH PANEL
// ==========================================

function toggleProductSearch(tenant, product, mappingRow, productTenants) {
  const rightPanel = document.querySelector('#productSearchPanel');
  if (!rightPanel) return;

  // Check if this product is already selected
  const currentProduct = mappingRow.dataset.productCode;
  const isCurrentlySelected = mappingRow.classList.contains('expanded');

  // Remove expanded state from all rows
  const allRows = document.querySelectorAll('.mapping-row');
  allRows.forEach(row => row.classList.remove('expanded'));

  // If clicking the same product, close the panel
  if (isCurrentlySelected) {
    rightPanel.innerHTML = `
      <div class="detail-view-right-empty">
        <i class="fa-solid fa-magnifying-glass fa-3x"></i>
        <p>Select a product to search and map<br>product tenants</p>
      </div>
    `;
    return;
  }

  // Mark this row as expanded
  mappingRow.classList.add('expanded');

  // Create search panel in right column
  const searchId = `productSearch_${product.code}`;
  const tableId = `productTable_${product.code}`;

  rightPanel.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 24px; box-sizing: border-box;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
        <i class="fa-solid fa-building"></i>
        ${product.name} Tenants
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--lumo-secondary-text-color);">
        Search and select a product tenant to map to this Keystone Tenant. Showing up to 50 results at a time.
      </p>

      <vaadin-text-field
        id="${searchId}"
        placeholder="Search by name, city, or state..."
        theme="outlined"
        clearButtonVisible
        style="width: 100%; margin-bottom: 16px;">
        <i class="fa-solid fa-magnifying-glass" slot="prefix"></i>
      </vaadin-text-field>

      <div style="flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--lumo-contrast-10pct); border-radius: 4px; background: white;">
        <table style="width: 100%; min-width: 100%; border-collapse: collapse;">
          <thead style="background-color: var(--lumo-contrast-5pct); position: sticky; top: 0; z-index: 5;">
            <tr>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid var(--lumo-contrast-10pct);">Product Tenant Name</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid var(--lumo-contrast-10pct);">City</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid var(--lumo-contrast-10pct);">State</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid var(--lumo-contrast-10pct); width: 100px;"></th>
            </tr>
          </thead>
          <tbody id="${tableId}" style="font-size: 13px;">
            <!-- Rows will be inserted here -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render table
  renderProductTenantTable(tenant, product, productTenants, tableId, searchId);

  // Setup search
  const searchField = rightPanel.querySelector(`#${searchId}`);
  let searchTimeout;
  searchField.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderProductTenantTable(tenant, product, productTenants, tableId, searchId);
    }, 300);
  });
}

// ==========================================
// RENDER PRODUCT TENANT TABLE
// ==========================================

function renderProductTenantTable(tenant, product, allProductTenants, tableId, searchId) {
  const tbody = document.getElementById(tableId);
  const searchField = document.getElementById(searchId);

  if (!tbody || !searchField) return;

  const searchTerm = searchField.value.trim().toLowerCase();

  // Filter product tenants
  const filtered = allProductTenants.filter(pt => {
    if (!searchTerm) return true;
    return (
      pt.name.toLowerCase().includes(searchTerm) ||
      pt.city.toLowerCase().includes(searchTerm) ||
      pt.state.toLowerCase().includes(searchTerm)
    );
  });

  // Clear table
  tbody.innerHTML = '';

  // Show limited results (first 50)
  const limited = filtered.slice(0, 50);

  if (limited.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="product-tenant-empty">
          No product tenants found. Try a different search term.
        </td>
      </tr>
    `;
    return;
  }

  // Render rows
  limited.forEach(pt => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${pt.name}</td>
      <td>${pt.city}</td>
      <td>${pt.state}</td>
      <td>
        <vaadin-button theme="primary small" class="map-btn" data-product-tenant-id="${pt.id}">
          Map
        </vaadin-button>
      </td>
    `;

    // Map button handler
    const mapBtn = row.querySelector('.map-btn');
    mapBtn.addEventListener('click', async () => {
      await handleMapProduct(tenant, pt, product);
    });

    tbody.appendChild(row);
  });

  // Show count message
  if (filtered.length > 50) {
    const infoRow = document.createElement('tr');
    infoRow.innerHTML = `
      <td colspan="4" style="text-align: center; padding: 16px; color: var(--lumo-secondary-text-color); font-style: italic;">
        Showing 50 of ${filtered.length} results. Use search to narrow down.
      </td>
    `;
    tbody.appendChild(infoRow);
  }
}

// ==========================================
// HANDLE MAP PRODUCT
// ==========================================

async function handleMapProduct(tenant, productTenant, product) {
  try {
    await mapTenantToProduct(tenant.id, productTenant.id);
    showNotification(`Mapped to ${productTenant.name}`, 'success');

    // Refresh detail view
    await renderTenantDetailView(tenant);

  } catch (error) {
    console.error('Error mapping:', error);
    showNotification('Failed to create mapping', 'error');
  }
}

// ==========================================
// HANDLE UNMAP PRODUCT
// ==========================================

function handleUnmapProduct(tenant, productTenant, product) {
  showConfirmDialog(
    'Confirm Unmapping',
    `Are you sure you want to unmap "${tenant.name}" from "${productTenant.name}"?`,
    async () => {
      try {
        await unmapTenantFromProduct(tenant.id, productTenant.id);
        showNotification(`Unmapped from ${product.name}`, 'success');

        // Refresh detail view
        await renderTenantDetailView(tenant);

      } catch (error) {
        console.error('Error unmapping:', error);
        showNotification('Failed to remove mapping', 'error');
      }
    }
  );
}

// ==========================================
// BACK TO TENANTS LIST
// ==========================================

function backToTenantsList() {
  const tenantsView = document.querySelector('#tenantsView');
  const tenantDetailView = document.querySelector('#tenantDetailView');

  tenantDetailView.classList.remove('active');
  tenantsView.classList.add('active');

  // Refresh table in case mappings changed
  renderTenantsTable();
}
