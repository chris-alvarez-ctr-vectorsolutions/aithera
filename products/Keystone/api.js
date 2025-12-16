/**
 * API Module
 *
 * Mock data and API functions for Keystone Admin UI
 * In production, these would call real backend endpoints
 */

// ==========================================
// MOCK DATA STORAGE
// ==========================================

// Product definitions (6 products)
const PRODUCTS = [
  { code: 'product_1', name: 'TargetSolutions' },
  { code: 'product_2', name: 'Vector LMS' },
  { code: 'product_3', name: 'Vector Training' },
  { code: 'product_4', name: 'Vector Compliance' },
  { code: 'product_5', name: 'Vector Scheduling' },
  { code: 'product_6', name: 'Vector Analytics' },
];

// Mock Keystone Tenants
let keystoneTenants = [
  {
    id: 'kt-001',
    name: 'Acme Corporation',
    address1: '123 Main Street',
    address2: 'Suite 100',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'USA',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 'kt-002',
    name: 'Global Enterprises Ltd',
    address1: '456 Oak Avenue',
    address2: '',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
    createdAt: '2025-02-20T14:15:00Z'
  },
  {
    id: 'kt-003',
    name: 'Tech Innovations Inc',
    address1: '789 Innovation Drive',
    address2: 'Building A',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'USA',
    createdAt: '2025-03-10T09:00:00Z'
  },
];

// Mock Product Tenants (for each product)
const productTenants = [
  // TargetSolutions
  { id: 'pt-001', productCode: 'product_1', name: 'Acme TS Tenant' },
  { id: 'pt-002', productCode: 'product_1', name: 'Global TS Tenant' },
  { id: 'pt-003', productCode: 'product_1', name: 'Tech TS Tenant' },
  // Vector LMS
  { id: 'pt-004', productCode: 'product_2', name: 'Acme LMS Tenant' },
  { id: 'pt-005', productCode: 'product_2', name: 'Global LMS Tenant' },
  // Vector Training
  { id: 'pt-006', productCode: 'product_3', name: 'Acme Training Tenant' },
  { id: 'pt-007', productCode: 'product_3', name: 'Tech Training Tenant' },
  // Vector Compliance
  { id: 'pt-008', productCode: 'product_4', name: 'Global Compliance Tenant' },
  // Vector Scheduling
  { id: 'pt-009', productCode: 'product_5', name: 'Tech Scheduling Tenant' },
  // Vector Analytics
  { id: 'pt-010', productCode: 'product_6', name: 'Acme Analytics Tenant' },
];

// Mock Keystone Tenant <> Product Tenant Mappings
let tenantMappings = [
  { keystoneTenantId: 'kt-001', productTenantId: 'pt-001' },
  { keystoneTenantId: 'kt-001', productTenantId: 'pt-004' },
  { keystoneTenantId: 'kt-001', productTenantId: 'pt-006' },
  { keystoneTenantId: 'kt-002', productTenantId: 'pt-002' },
  { keystoneTenantId: 'kt-002', productTenantId: 'pt-005' },
  { keystoneTenantId: 'kt-003', productTenantId: 'pt-003' },
  { keystoneTenantId: 'kt-003', productTenantId: 'pt-007' },
];

// Mock Keystone People
let keystonePeople = [
  {
    id: 'kp-001',
    firstName: 'John',
    lastName: 'Doe',
    emails: ['john.doe@acme.com', 'jdoe@acme.com'],
    keystoneTenantId: 'kt-001'
  },
  {
    id: 'kp-002',
    firstName: 'Jane',
    lastName: 'Smith',
    emails: ['jane.smith@global.com'],
    keystoneTenantId: 'kt-002'
  },
  {
    id: 'kp-003',
    firstName: 'Bob',
    lastName: 'Johnson',
    emails: ['bob.johnson@tech.com'],
    keystoneTenantId: 'kt-003'
  },
  {
    id: 'kp-004',
    firstName: 'Alice',
    lastName: 'Williams',
    emails: ['alice@acme.com'],
    keystoneTenantId: 'kt-001'
  },
];

// Mock Product Users
const productUsers = [
  // TargetSolutions users
  { id: 'pu-001', productTenantId: 'pt-001', firstName: 'John', lastName: 'Doe', emails: ['john.doe@acme.com'] },
  { id: 'pu-002', productTenantId: 'pt-001', firstName: 'Alice', lastName: 'Williams', emails: ['alice@acme.com'] },
  { id: 'pu-003', productTenantId: 'pt-002', firstName: 'Jane', lastName: 'Smith', emails: ['jane.smith@global.com'] },
  // Vector LMS users
  { id: 'pu-004', productTenantId: 'pt-004', firstName: 'John', lastName: 'Doe', emails: ['jdoe@acme.com'] },
  { id: 'pu-005', productTenantId: 'pt-005', firstName: 'Jane', lastName: 'Smith', emails: ['jsmith@global.com'] },
  // Vector Training users
  { id: 'pu-006', productTenantId: 'pt-006', firstName: 'John', lastName: 'Doe', emails: ['john.doe@acme.com'] },
  { id: 'pu-007', productTenantId: 'pt-007', firstName: 'Bob', lastName: 'Johnson', emails: ['bob.johnson@tech.com'] },
];

// Mock Keystone Person <> Product User Mappings
let personMappings = [
  { keystonePersonId: 'kp-001', productUserId: 'pu-001' },
  { keystonePersonId: 'kp-001', productUserId: 'pu-004' },
  { keystonePersonId: 'kp-001', productUserId: 'pu-006' },
  { keystonePersonId: 'kp-002', productUserId: 'pu-003' },
  { keystonePersonId: 'kp-002', productUserId: 'pu-005' },
  { keystonePersonId: 'kp-003', productUserId: 'pu-007' },
  { keystonePersonId: 'kp-004', productUserId: 'pu-002' },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a mock UUID
 */
function generateId(prefix = 'kt') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Simulate network delay
 */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// TENANT API FUNCTIONS
// ==========================================

/**
 * Get all Keystone Tenants
 */
export async function getKeystoneTenants() {
  await delay(200);
  return [...keystoneTenants];
}

/**
 * Create a new Keystone Tenant
 */
export async function createKeystoneTenant(tenantData) {
  await delay(300);

  const newTenant = {
    id: generateId('kt'),
    ...tenantData,
    createdAt: new Date().toISOString()
  };

  keystoneTenants.push(newTenant);
  return newTenant;
}

/**
 * Get all Product Tenants for a specific product
 */
export async function getProductTenants(productCode) {
  await delay(100);
  return productTenants.filter(pt => pt.productCode === productCode);
}

/**
 * Get mappings for a Keystone Tenant
 */
export async function getTenantMappings(keystoneTenantId) {
  await delay(100);
  return tenantMappings.filter(m => m.keystoneTenantId === keystoneTenantId);
}

/**
 * Map a Keystone Tenant to a Product Tenant
 */
export async function mapTenantToProduct(keystoneTenantId, productTenantId) {
  await delay(200);

  // Check if mapping already exists
  const exists = tenantMappings.some(
    m => m.keystoneTenantId === keystoneTenantId && m.productTenantId === productTenantId
  );

  if (exists) {
    throw new Error('Mapping already exists');
  }

  const mapping = { keystoneTenantId, productTenantId };
  tenantMappings.push(mapping);
  return mapping;
}

/**
 * Unmap a Keystone Tenant from a Product Tenant
 */
export async function unmapTenantFromProduct(keystoneTenantId, productTenantId) {
  await delay(200);

  const index = tenantMappings.findIndex(
    m => m.keystoneTenantId === keystoneTenantId && m.productTenantId === productTenantId
  );

  if (index === -1) {
    throw new Error('Mapping not found');
  }

  tenantMappings.splice(index, 1);
  return true;
}

// ==========================================
// PEOPLE API FUNCTIONS
// ==========================================

/**
 * Get all Keystone People
 */
export async function getKeystonePeople() {
  await delay(200);
  return [...keystonePeople];
}

/**
 * Get all Product Users for a specific product tenant
 */
export async function getProductUsers(productTenantId) {
  await delay(100);
  return productUsers.filter(pu => pu.productTenantId === productTenantId);
}

/**
 * Get all Product Users (for searching across all products)
 */
export async function getAllProductUsers() {
  await delay(100);
  return [...productUsers];
}

/**
 * Get mappings for a Keystone Person
 */
export async function getPersonMappings(keystonePersonId) {
  await delay(100);
  return personMappings.filter(m => m.keystonePersonId === keystonePersonId);
}

/**
 * Map a Keystone Person to a Product User
 */
export async function mapPersonToProductUser(keystonePersonId, productUserId) {
  await delay(200);

  // Check if mapping already exists
  const exists = personMappings.some(
    m => m.keystonePersonId === keystonePersonId && m.productUserId === productUserId
  );

  if (exists) {
    throw new Error('Mapping already exists');
  }

  const mapping = { keystonePersonId, productUserId };
  personMappings.push(mapping);
  return mapping;
}

/**
 * Unmap a Keystone Person from a Product User
 */
export async function unmapPersonFromProductUser(keystonePersonId, productUserId) {
  await delay(200);

  const index = personMappings.findIndex(
    m => m.keystonePersonId === keystonePersonId && m.productUserId === productUserId
  );

  if (index === -1) {
    throw new Error('Mapping not found');
  }

  personMappings.splice(index, 1);
  return true;
}

// ==========================================
// EXPORT PRODUCTS
// ==========================================

export function getProducts() {
  return [...PRODUCTS];
}

export function getProductByCode(code) {
  return PRODUCTS.find(p => p.code === code);
}
