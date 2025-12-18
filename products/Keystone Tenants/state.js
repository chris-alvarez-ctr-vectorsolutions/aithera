/**
 * State Management Module
 * Handles application state, navigation, and cross-page data sharing
 */

/**
 * Save state to sessionStorage
 */
function saveState(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

/**
 * Load state from sessionStorage
 */
function loadState(key) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Failed to load state:', e);
    return null;
  }
}

/**
 * Clear specific state key
 */
function clearState(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear state:', e);
  }
}

/**
 * Navigate to tenant details page
 */
export function navigateToTenantDetails(tenantUuid) {
  console.log('Saving tenant UUID to sessionStorage:', tenantUuid);
  saveState('selectedTenantUuid', tenantUuid);
  console.log('Verifying saved UUID:', loadState('selectedTenantUuid'));
  window.location.href = 'tenant-details.html';
}

/**
 * Navigate back to tenant grid
 */
export function navigateToTenantGrid() {
  window.location.href = 'index.html';
}

/**
 * Get currently selected tenant UUID
 */
export function getSelectedTenantUuid() {
  const uuid = loadState('selectedTenantUuid');
  console.log('Retrieved tenant UUID from sessionStorage:', uuid);
  return uuid;
}

/**
 * Save grid state (filters, search, sort)
 */
export function saveGridState(gridState) {
  saveState('tenantGridState', gridState);
}

/**
 * Load grid state
 */
export function loadGridState() {
  return loadState('tenantGridState') || {
    searchQuery: '',
    sortColumn: 'name',
    sortDirection: 'asc',
    selectedRowIndex: -1
  };
}

/**
 * Track unsaved changes in forms
 */
let hasUnsavedChanges = false;

export function markFormDirty() {
  hasUnsavedChanges = true;
}

export function markFormClean() {
  hasUnsavedChanges = false;
}

export function checkUnsavedChanges() {
  return hasUnsavedChanges;
}

/**
 * Setup navigation guard for unsaved changes
 */
export function setupNavigationGuard() {
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
}

/**
 * Prompt user about unsaved changes before navigation
 */
export async function confirmNavigationWithUnsavedChanges() {
  if (!hasUnsavedChanges) {
    return true;
  }

  return new Promise((resolve) => {
    // Create confirmation dialog
    const dialog = document.createElement('vaadin-dialog');
    dialog.headerTitle = 'Unsaved Changes';

    dialog.renderer = function(root) {
      if (!root.firstElementChild) {
        const message = document.createElement('p');
        message.textContent = 'You have unsaved changes. Do you want to save them before leaving?';
        root.appendChild(message);
      }
    };

    dialog.footerRenderer = function(root) {
      if (!root.firstElementChild) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.justifyContent = 'flex-end';

        const discardButton = document.createElement('vaadin-button');
        discardButton.textContent = 'Discard Changes';
        discardButton.setAttribute('theme', 'tertiary error');
        discardButton.addEventListener('click', () => {
          markFormClean();
          dialog.opened = false;
          resolve('discard');
        });

        const cancelButton = document.createElement('vaadin-button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
          dialog.opened = false;
          resolve('cancel');
        });

        const saveButton = document.createElement('vaadin-button');
        saveButton.textContent = 'Save Changes';
        saveButton.setAttribute('theme', 'primary');
        saveButton.addEventListener('click', () => {
          dialog.opened = false;
          resolve('save');
        });

        buttonContainer.appendChild(discardButton);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        root.appendChild(buttonContainer);
      }
    };

    document.body.appendChild(dialog);
    dialog.opened = true;

    dialog.addEventListener('closed', () => {
      dialog.remove();
    });
  });
}
