/**
 * State Management Module
 *
 * Simple in-memory state management for the Keystone Admin UI
 */

// ==========================================
// APPLICATION STATE
// ==========================================

const state = {
  // Current active view
  activeView: 'tenants', // 'tenants' or 'people'

  // Tenants state
  tenants: {
    list: [],
    selectedTenant: null,
    searchTerm: '',
  },

  // People state
  people: {
    list: [],
    selectedPerson: null,
    filters: {
      firstName: '',
      lastName: '',
      email: '',
      tenantId: '',
      productCodes: []
    }
  },

  // Loading states
  loading: {
    tenants: false,
    people: false,
  }
};

// ==========================================
// STATE GETTERS
// ==========================================

export function getState() {
  return state;
}

export function getSelectedTenant() {
  return state.tenants.selectedTenant;
}

export function setSelectedTenant(tenant) {
  state.tenants.selectedTenant = tenant;
}

export function getTenantsList() {
  return state.tenants.list;
}

export function setTenantsList(tenants) {
  state.tenants.list = tenants;
}

export function getSelectedPerson() {
  return state.people.selectedPerson;
}

export function setSelectedPerson(person) {
  state.people.selectedPerson = person;
}

export function getPeopleList() {
  return state.people.list;
}

export function setPeopleList(people) {
  state.people.list = people;
}

export function getPeopleFilters() {
  return state.people.filters;
}

export function setPeopleFilters(filters) {
  state.people.filters = { ...state.people.filters, ...filters };
}

export function getTenantSearchTerm() {
  return state.tenants.searchTerm;
}

export function setTenantSearchTerm(term) {
  state.tenants.searchTerm = term;
}

// ==========================================
// NOTIFICATION HELPER
// ==========================================

/**
 * Show a notification toast
 * @param {string} message - The notification message
 * @param {string} theme - The theme: 'success', 'error', 'warning', 'primary'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showNotification(message, theme = 'primary', duration = 3000) {
  const notification = document.querySelector('#appNotification');

  if (!notification) {
    console.error('Notification component not found');
    return;
  }

  // Clear existing content
  notification.innerHTML = '';

  // Create message container
  const messageDiv = document.createElement('div');
  messageDiv.style.display = 'flex';
  messageDiv.style.alignItems = 'center';
  messageDiv.style.gap = '8px';

  // Add icon based on theme
  const icon = document.createElement('i');
  switch (theme) {
    case 'success':
      icon.className = 'fa-solid fa-circle-check';
      break;
    case 'error':
      icon.className = 'fa-solid fa-circle-xmark';
      break;
    case 'warning':
      icon.className = 'fa-solid fa-triangle-exclamation';
      break;
    default:
      icon.className = 'fa-solid fa-circle-info';
  }

  const text = document.createElement('span');
  text.textContent = message;

  messageDiv.appendChild(icon);
  messageDiv.appendChild(text);
  notification.appendChild(messageDiv);

  // Set theme and duration
  notification.setAttribute('theme', theme);
  notification.duration = duration;

  // Open the notification
  notification.opened = true;
}

// ==========================================
// CONFIRMATION DIALOG HELPER
// ==========================================

/**
 * Show a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Optional callback when user cancels
 */
export function showConfirmDialog(title, message, onConfirm, onCancel = null) {
  const dialog = document.querySelector('#confirmDialog');

  if (!dialog) {
    console.error('Confirmation dialog not found');
    return;
  }

  // Set header title
  dialog.headerTitle = title;

  // Main content renderer
  dialog.renderer = function(root) {
    if (!root.firstElementChild) {
      const messageP = document.createElement('p');
      messageP.textContent = message;
      messageP.style.margin = '0';
      root.appendChild(messageP);
    }
  };

  // Footer renderer with action buttons
  dialog.footerRenderer = function(root) {
    if (!root.firstElementChild) {
      const cancelButton = document.createElement('vaadin-button');
      cancelButton.textContent = 'Cancel';
      cancelButton.setAttribute('theme', 'tertiary');
      cancelButton.addEventListener('click', () => {
        dialog.opened = false;
        if (onCancel) onCancel();
      });

      const confirmButton = document.createElement('vaadin-button');
      confirmButton.setAttribute('theme', 'primary error');
      confirmButton.textContent = 'Confirm';
      confirmButton.addEventListener('click', () => {
        dialog.opened = false;
        onConfirm();
      });

      root.appendChild(cancelButton);
      root.appendChild(confirmButton);
    }
  };

  // Open dialog
  dialog.opened = true;
}

// ==========================================
// LOADING STATE HELPERS
// ==========================================

export function setLoading(key, value) {
  state.loading[key] = value;
}

export function isLoading(key) {
  return state.loading[key];
}
