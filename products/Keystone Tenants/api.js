/**
 * API Module for Keystone Tenants Application
 * Handles all data operations and dummy data generation
 */

// List of Vector products
export const VECTOR_PRODUCTS = [
  'TargetSolutions',
  'Scheduling',
  'Check IT',
  'EV+',
  'Guardian Tracking',
  'Frontline'
];

// US States for dummy data
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

// Cities for dummy data
const CITIES = [
  'Springfield', 'Franklin', 'Clinton', 'Georgetown', 'Riverside',
  'Madison', 'Salem', 'Columbia', 'Manchester', 'Oakland',
  'Ashland', 'Burlington', 'Jackson', 'Dover', 'Newport',
  'Lexington', 'Monroe', 'Chester', 'Auburn', 'Bristol',
  'Clayton', 'Durham', 'Easton', 'Hamilton', 'Lincoln',
  'Milton', 'Oxford', 'Princeton', 'Richmond', 'Warren',
  'Winchester', 'Arlington', 'Bedford', 'Canton', 'Dayton'
];

// Organization name prefixes and suffixes
const ORG_PREFIXES = [
  'City of', 'Town of', 'Village of', 'County of', 'Township of',
  'Borough of', 'Metropolitan', 'Regional', 'District of'
];

const ORG_TYPES = [
  'Fire Department', 'Police Department', 'Public Safety', 'Emergency Services',
  'Fire District', 'Fire Protection District', 'Public Works', 'Municipal Services',
  'Sheriff\'s Office', 'Fire & Rescue', 'Emergency Management', 'Safety Services'
];

// Product tenant name templates
const PRODUCT_ORG_NAMES = [
  'Central Fire Authority', 'North District Fire', 'South County Safety',
  'East Regional Fire', 'West Side Emergency', 'Metro Fire Services',
  'Valley Fire District', 'Mountain Safety Services', 'Coastal Fire Department',
  'River City Fire', 'Lake County Emergency', 'Forest Safety District',
  'Prairie Fire Protection', 'Highland Emergency Services', 'Meadow Fire District',
  'Summit Safety Authority', 'Canyon Fire & Rescue', 'Plains Public Safety',
  'Ridge Emergency Services', 'Creek Fire Department'
];

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get random element from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate dummy Keystone Tenants
 */
function generateKeystoneTenants(count) {
  const tenants = [];

  for (let i = 0; i < count; i++) {
    const city = randomItem(CITIES);
    const state = randomItem(US_STATES);
    const orgPrefix = randomItem(ORG_PREFIXES);
    const orgType = randomItem(ORG_TYPES);

    const tenant = {
      uuid: generateUUID(),
      name: `${orgPrefix} ${city} ${orgType}`,
      address1: `${randomInt(100, 9999)} ${randomItem(['Main', 'Oak', 'Maple', 'Park', 'Washington', 'First', 'Second'])} ${randomItem(['Street', 'Avenue', 'Boulevard', 'Drive', 'Road'])}`,
      address2: Math.random() > 0.7 ? `Suite ${randomInt(100, 999)}` : '',
      city: city,
      state: state.code,
      postalCode: `${randomInt(10000, 99999)}`,
      country: 'United States',
      mappedProducts: {} // Will be populated with product mappings
    };

    tenants.push(tenant);
  }

  return tenants;
}

/**
 * Generate dummy Product Tenants
 */
function generateProductTenants(count) {
  const tenants = [];

  for (let i = 0; i < count; i++) {
    const product = randomItem(VECTOR_PRODUCTS);
    const city = randomItem(CITIES);
    const state = randomItem(US_STATES);

    // Mix of different naming patterns
    let name;
    const nameType = Math.random();
    if (nameType < 0.4) {
      name = `${randomItem(ORG_PREFIXES)} ${city} ${randomItem(ORG_TYPES)}`;
    } else if (nameType < 0.7) {
      name = `${city} ${randomItem(ORG_TYPES)}`;
    } else {
      name = `${randomItem(PRODUCT_ORG_NAMES)} - ${city}`;
    }

    const tenant = {
      id: `PT-${String(i + 1).padStart(5, '0')}`,
      product: product,
      name: name,
      city: city,
      state: state.code,
      isMapped: false, // Will be updated when mapped to KS tenant
      mappedToKsUuid: null
    };

    tenants.push(tenant);
  }

  return tenants;
}

/**
 * Initialize or load data from sessionStorage
 */
function initializeData() {
  try {
    const storedKsTenants = sessionStorage.getItem('keystoneTenants');
    const storedProductTenants = sessionStorage.getItem('productTenants');

    if (storedKsTenants && storedProductTenants) {
      // Load existing data
      return {
        keystoneTenants: JSON.parse(storedKsTenants),
        productTenants: JSON.parse(storedProductTenants)
      };
    }
  } catch (e) {
    console.error('Failed to load data from sessionStorage:', e);
  }

  // Generate new data
  const keystoneTenants = generateKeystoneTenants(100);
  const productTenants = generateProductTenants(500);

  // Create some initial mappings (about 20% of KS tenants have some mappings)
  const tenantsToMap = Math.floor(keystoneTenants.length * 0.2);
  for (let i = 0; i < tenantsToMap; i++) {
    const ksTenant = keystoneTenants[i];
    const numMappings = randomInt(1, 3); // Each mapped tenant has 1-3 product mappings

    for (let j = 0; j < numMappings; j++) {
      const product = VECTOR_PRODUCTS[j % VECTOR_PRODUCTS.length];

      // Find an unmapped product tenant for this product
      const availableProductTenants = productTenants.filter(pt =>
        pt.product === product && !pt.isMapped
      );

      if (availableProductTenants.length > 0) {
        const productTenant = randomItem(availableProductTenants);

        // Create the mapping
        ksTenant.mappedProducts[product] = {
          productTenantId: productTenant.id,
          productTenantName: productTenant.name
        };

        productTenant.isMapped = true;
        productTenant.mappedToKsUuid = ksTenant.uuid;
      }
    }
  }

  // Save to sessionStorage
  try {
    sessionStorage.setItem('keystoneTenants', JSON.stringify(keystoneTenants));
    sessionStorage.setItem('productTenants', JSON.stringify(productTenants));
  } catch (e) {
    console.error('Failed to save data to sessionStorage:', e);
  }

  return { keystoneTenants, productTenants };
}

// Initialize data storage
const data = initializeData();
let keystoneTenants = data.keystoneTenants;
let productTenants = data.productTenants;

/**
 * Save data to sessionStorage
 */
function saveData() {
  try {
    sessionStorage.setItem('keystoneTenants', JSON.stringify(keystoneTenants));
    sessionStorage.setItem('productTenants', JSON.stringify(productTenants));
  } catch (e) {
    console.error('Failed to save data to sessionStorage:', e);
  }
}

/**
 * API Methods
 */

/**
 * Get all Keystone Tenants
 */
export function getAllKeystoneTenants() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...keystoneTenants]);
    }, 100);
  });
}

/**
 * Get Keystone Tenant by UUID
 */
export function getKeystoneTenant(uuid) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const tenant = keystoneTenants.find(t => t.uuid === uuid);
      if (tenant) {
        resolve({ ...tenant });
      } else {
        reject(new Error('Tenant not found'));
      }
    }, 100);
  });
}

/**
 * Create new Keystone Tenant
 */
export function createKeystoneTenant(tenantData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTenant = {
        ...tenantData,
        uuid: tenantData.uuid || generateUUID(), // Use provided UUID or generate new one
        mappedProducts: {}
      };

      keystoneTenants.push(newTenant);
      saveData();
      resolve({ ...newTenant });
    }, 200);
  });
}

/**
 * Update Keystone Tenant
 */
export function updateKeystoneTenant(uuid, updates) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = keystoneTenants.findIndex(t => t.uuid === uuid);

      if (index === -1) {
        reject(new Error('Tenant not found'));
        return;
      }

      // Preserve mappedProducts when updating
      const mappedProducts = keystoneTenants[index].mappedProducts;
      keystoneTenants[index] = {
        ...keystoneTenants[index],
        ...updates,
        uuid: uuid, // UUID cannot be changed
        mappedProducts: mappedProducts
      };

      saveData();
      resolve({ ...keystoneTenants[index] });
    }, 200);
  });
}

/**
 * Get all Product Tenants for a specific product
 */
export function getProductTenants(productName, includeOnlyUnmapped = false) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = productTenants.filter(pt => pt.product === productName);

      if (includeOnlyUnmapped) {
        filtered = filtered.filter(pt => !pt.isMapped);
      }

      resolve([...filtered]);
    }, 100);
  });
}

/**
 * Map a Product Tenant to a Keystone Tenant
 */
export function mapProductTenant(ksUuid, productName, productTenantId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const ksTenant = keystoneTenants.find(t => t.uuid === ksUuid);
      if (!ksTenant) {
        reject(new Error('Keystone Tenant not found'));
        return;
      }

      const productTenant = productTenants.find(pt => pt.id === productTenantId);
      if (!productTenant) {
        reject(new Error('Product Tenant not found'));
        return;
      }

      if (productTenant.isMapped) {
        reject(new Error('Product Tenant is already mapped'));
        return;
      }

      // Create the mapping
      ksTenant.mappedProducts[productName] = {
        productTenantId: productTenant.id,
        productTenantName: productTenant.name
      };

      productTenant.isMapped = true;
      productTenant.mappedToKsUuid = ksUuid;

      saveData();
      resolve({ ...ksTenant });
    }, 200);
  });
}

/**
 * Unmap a Product Tenant from a Keystone Tenant
 */
export function unmapProductTenant(ksUuid, productName) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const ksTenant = keystoneTenants.find(t => t.uuid === ksUuid);
      if (!ksTenant) {
        reject(new Error('Keystone Tenant not found'));
        return;
      }

      const mapping = ksTenant.mappedProducts[productName];
      if (!mapping) {
        reject(new Error('No mapping found for this product'));
        return;
      }

      // Find the product tenant and unmap it
      const productTenant = productTenants.find(pt => pt.id === mapping.productTenantId);
      if (productTenant) {
        productTenant.isMapped = false;
        productTenant.mappedToKsUuid = null;
      }

      // Remove the mapping
      delete ksTenant.mappedProducts[productName];

      saveData();
      resolve({ ...ksTenant });
    }, 200);
  });
}

/**
 * Get count of mapped product tenants for a KS tenant
 */
export function getMappedProductCount(ksUuid) {
  const tenant = keystoneTenants.find(t => t.uuid === ksUuid);
  if (!tenant) return 0;
  return Object.keys(tenant.mappedProducts).length;
}

/**
 * Get list of US states for form dropdowns
 */
export function getStates() {
  return US_STATES;
}

/**
 * Get list of countries for form dropdowns
 */
export function getCountries() {
  return [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' }
  ];
}
