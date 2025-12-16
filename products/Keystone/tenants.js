/**
 * Tenants Module
 *
 * Handles all tenant-related functionality:
 * - Creating tenants
 * - Listing and filtering tenants
 * - Viewing tenant details
 * - Mapping/unmapping product tenants
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

  // Initialize country dropdown
  initCountryDropdown();

  // Set up event listeners
  setupCreateTenantForm();
  setupTenantSearch();

  // Load tenants
  loadTenants();
}

// ==========================================
// COUNTRY DROPDOWN INITIALIZATION
// ==========================================

function initCountryDropdown() {
  const countrySelect = document.querySelector('#newTenantCountry');
  if (countrySelect) {
    countrySelect.items = [
      { label: 'United States', value: 'USA' },
      { label: 'Canada', value: 'CAN' },
      { label: 'United Kingdom', value: 'GBR' },
      { label: 'Australia', value: 'AUS' },
      { label: 'Other', value: 'OTHER' }
    ];
    countrySelect.value = 'USA'; // Default
  }
}

// ==========================================
// CREATE TENANT FUNCTIONALITY
// ==========================================

function setupCreateTenantForm() {
  const createBtn = document.querySelector('#createTenantBtn');
  const form = document.querySelector('.create-tenant-form');

  if (!createBtn || !form) return;

  createBtn.addEventListener('click', async () => {
    // Get form values
    const name = document.querySelector('#newTenantName').value.trim();
    const address1 = document.querySelector('#newTenantAddress1').value.trim();
    const address2 = document.querySelector('#newTenantAddress2').value.trim();
    const city = document.querySelector('#newTenantCity').value.trim();
    const state = document.querySelector('#newTenantState').value.trim();
    const postalCode = document.querySelector('#newTenantPostalCode').value.trim();
    const country = document.querySelector('#newTenantCountry').value;

    // Validate required fields
    if (!name || !address1 || !city || !state || !country) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Create tenant
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

      // Clear form
      clearCreateTenantForm();

      // Reload tenants list
      await loadTenants();

      // Auto-select the newly created tenant
      selectTenant(newTenant);

      // Collapse the create form
      const detailsEl = document.querySelector('.create-tenant-form').closest('vaadin-details');
      if (detailsEl) {
        detailsEl.opened = false;
      }

    } catch (error) {
      console.error('Error creating tenant:', error);
      showNotification('Failed to create tenant', 'error');
    }
  });

  // Allow Enter key to trigger search in fields
  const textFields = form.querySelectorAll('vaadin-text-field');
  textFields.forEach(field => {
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        createBtn.click();
      }
    });
  });
}

function clearCreateTenantForm() {
  document.querySelector('#newTenantName').value = '';
  document.querySelector('#newTenantAddress1').value = '';
  document.querySelector('#newTenantAddress2').value = '';
  document.querySelector('#newTenantCity').value = '';
  document.querySelector('#newTenantState').value = '';
  document.querySelector('#newTenantPostalCode').value = '';
  document.querySelector('#newTenantCountry').value = 'USA';
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

    // Check if this is the selected tenant
    const selected = getSelectedTenant();
    if (selected && selected.id === tenant.id) {
      row.classList.add('selected');
    }

    row.innerHTML = `
      <td>${tenant.name}</td>
      <td>${tenant.city}</td>
      <td>${tenant.state}</td>
      <td>${tenant.country}</td>
      <td class="text-center">
        <vaadin-badge theme="badge primary">${mappingsCounts[index]}</vaadin-badge>
      </td>
    `;

    // Click to select
    row.addEventListener('click', () => {
      selectTenant(tenant);
    });

    // Keyboard navigation
    row.tabIndex = 0;
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        selectTenant(tenant);
      }
    });

    tbody.appendChild(row);
  });
}

// ==========================================
// SELECT TENANT
// ==========================================

function selectTenant(tenant) {
  setSelectedTenant(tenant);

  // Update selected row styling
  const allRows = document.querySelectorAll('#tenantsTableBody tr');
  allRows.forEach(row => {
    if (row.dataset.tenantId === tenant.id) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });

  // Render detail panel
  renderTenantDetail(tenant);
}

// ==========================================
// RENDER TENANT DETAIL PANEL
// ==========================================

async function renderTenantDetail(tenant) {
  const detailPanel = document.querySelector('#tenantDetailPanel');

  if (!detailPanel) return;

  // Show loading state
  detailPanel.innerHTML = `
    <div class="detail-loading">
      <vwc-spinner></vwc-spinner>
      <p>Loading tenant details...</p>
    </div>
  `;

  try {
    // Get mappings
    const mappings = await getTenantMappings(tenant.id);
    const products = getProducts();

    // Build detail HTML
    let html = `
      <div class="detail-content">
        <!-- Tenant Info Header -->
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

        <vwc-divider style="margin: 20px 0;"></vwc-divider>

        <!-- Product Mappings Section -->
        <div class="mappings-section">
          <h3>
            <i class="fa-solid fa-link"></i>
            Product Tenant Mappings
          </h3>
          <p class="section-help">
            Map this Keystone Tenant to product-specific tenants. Select a product tenant from the dropdown to create a mapping.
          </p>

          <div class="mappings-grid">
    `;

    // Render each product mapping row
    for (const product of products) {
      const mapping = mappings.find(m => {
        // Find the product tenant for this mapping
        // In a real app, we'd need to check product tenant details
        // For now, we'll need to get product tenants to find matches
        return false; // Placeholder - will implement below
      });

      html += `
        <div class="mapping-row" data-product-code="${product.code}">
          <div class="mapping-label">
            <strong>${product.name}</strong>
          </div>
          <div class="mapping-control" id="mapping-${product.code}">
            <!-- Will be populated by JS -->
          </div>
        </div>
      `;
    }

    html += `
          </div>
        </div>
      </div>
    `;

    detailPanel.innerHTML = html;

    // Now populate each mapping control
    for (const product of products) {
      await renderMappingControl(tenant, product, mappings);
    }

  } catch (error) {
    console.error('Error rendering tenant detail:', error);
    detailPanel.innerHTML = `
      <div class="detail-error">
        <i class="fa-solid fa-triangle-exclamation fa-2x"></i>
        <p>Failed to load tenant details</p>
      </div>
    `;
  }
}

// ==========================================
// RENDER MAPPING CONTROL FOR EACH PRODUCT
// ==========================================

async function renderMappingControl(tenant, product, existingMappings) {
  const container = document.querySelector(`#mapping-${product.code}`);
  if (!container) return;

  try {
    // Get all product tenants for this product
    const productTenants = await getProductTenants(product.code);

    // Find if there's an existing mapping
    const existingMapping = existingMappings.find(m => {
      const pt = productTenants.find(pt => pt.id === m.productTenantId);
      return pt !== undefined;
    });

    if (existingMapping) {
      // Show mapped product tenant with unmap button
      const mappedProductTenant = productTenants.find(pt => pt.id === existingMapping.productTenantId);

      container.innerHTML = `
        <div class="mapped-item">
          <span class="mapped-name">
            <i class="fa-solid fa-check-circle"></i>
            ${mappedProductTenant.name}
          </span>
          <vaadin-button
            theme="tertiary small error"
            class="unmap-btn"
            data-product-tenant-id="${mappedProductTenant.id}">
            <i class="fa-solid fa-xmark"></i>
            Unmap
          </vaadin-button>
        </div>
      `;

      // Add unmap handler
      const unmapBtn = container.querySelector('.unmap-btn');
      unmapBtn.addEventListener('click', () => {
        handleUnmap(tenant, mappedProductTenant, product);
      });

    } else {
      // Show select dropdown to map
      const select = document.createElement('vaadin-select');
      select.label = 'Select Product Tenant';
      select.setAttribute('theme', 'outlined');
      select.style.width = '100%';

      // Set items
      select.items = [
        { label: '-- Select --', value: '' },
        ...productTenants.map(pt => ({
          label: pt.name,
          value: pt.id
        }))
      ];

      // On selection, map it
      select.addEventListener('value-changed', async (e) => {
        const selectedProductTenantId = e.detail.value;
        if (selectedProductTenantId) {
          await handleMap(tenant, selectedProductTenantId, product);
        }
      });

      container.innerHTML = '';
      container.appendChild(select);
    }

  } catch (error) {
    console.error('Error rendering mapping control:', error);
    container.innerHTML = '<p class="error-text">Failed to load product tenants</p>';
  }
}

// ==========================================
// HANDLE MAP ACTION
// ==========================================

async function handleMap(tenant, productTenantId, product) {
  try {
    await mapTenantToProduct(tenant.id, productTenantId);
    showNotification(`Mapped to ${product.name}`, 'success');

    // Refresh the detail panel
    renderTenantDetail(tenant);

    // Update table to show new mapping count
    renderTenantsTable();

  } catch (error) {
    console.error('Error mapping tenant:', error);
    showNotification('Failed to create mapping', 'error');
  }
}

// ==========================================
// HANDLE UNMAP ACTION
// ==========================================

function handleUnmap(tenant, productTenant, product) {
  showConfirmDialog(
    'Confirm Unmapping',
    `Are you sure you want to unmap "${tenant.name}" from "${productTenant.name}"?`,
    async () => {
      try {
        await unmapTenantFromProduct(tenant.id, productTenant.id);
        showNotification(`Unmapped from ${product.name}`, 'success');

        // Refresh the detail panel
        renderTenantDetail(tenant);

        // Update table to show new mapping count
        renderTenantsTable();

      } catch (error) {
        console.error('Error unmapping tenant:', error);
        showNotification('Failed to remove mapping', 'error');
      }
    }
  );
}
