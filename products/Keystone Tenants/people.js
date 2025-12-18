/**
 * People API Module for Keystone Tenants Application
 * Handles people data, mappings, and operations
 */

import { VECTOR_PRODUCTS } from './api.js';

// First names and last names for generating dummy data
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Timothy', 'Stephanie', 'Ronald', 'Dorothy', 'Edward', 'Rebecca', 'Jason', 'Sharon'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

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
 * Generate email from name
 */
function generateEmail(firstName, lastName, variation = 0) {
  const domain = randomItem(['vectorsolutions.com', 'example.com', 'company.com', 'business.org']);

  if (variation === 0) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  } else if (variation === 1) {
    return `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`;
  } else {
    return `${firstName.toLowerCase().charAt(0)}${lastName.toLowerCase()}@${domain}`;
  }
}

/**
 * Generate dummy people data
 */
function generatePeople(count) {
  const people = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const product = randomItem(VECTOR_PRODUCTS);

    const person = {
      id: `P-${String(i + 1).padStart(5, '0')}`,
      firstName: firstName,
      lastName: lastName,
      email: generateEmail(firstName, lastName, randomInt(0, 2)),
      product: product,
      productTenantId: `PT-${String(randomInt(1, 500)).padStart(5, '0')}`,
      isMapped: false, // Whether this person is part of a joined mapping
      mappingId: null // ID of the mapping group this person belongs to
    };

    people.push(person);
  }

  return people;
}

/**
 * Initialize or load people data from sessionStorage
 */
function initializePeopleData() {
  try {
    const storedPeople = sessionStorage.getItem('people');
    const storedPeopleMappings = sessionStorage.getItem('peopleMappings');

    if (storedPeople && storedPeopleMappings) {
      return {
        people: JSON.parse(storedPeople),
        peopleMappings: JSON.parse(storedPeopleMappings)
      };
    }
  } catch (e) {
    console.error('Failed to load people data from sessionStorage:', e);
  }

  // Generate new data
  const people = generatePeople(2000);
  const peopleMappings = {};

  // Create some initial mappings (about 5% of people are part of joined accounts)
  const peopleToMap = Math.floor(people.length * 0.05);
  let mappingIdCounter = 1;

  for (let i = 0; i < peopleToMap; i += randomInt(2, 4)) {
    const groupSize = Math.min(randomInt(2, 4), peopleToMap - i);
    if (groupSize < 2) break;

    const mappingId = `MAPPING-${String(mappingIdCounter++).padStart(4, '0')}`;
    const mappedPeople = people.slice(i, i + groupSize);

    // All people in the group get different emails but same first/last name
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);

    const personIds = [];
    mappedPeople.forEach((person, index) => {
      person.firstName = firstName;
      person.lastName = lastName;
      person.email = generateEmail(firstName, lastName, index);
      person.isMapped = true;
      person.mappingId = mappingId;
      personIds.push(person.id);
    });

    peopleMappings[mappingId] = {
      id: mappingId,
      personIds: personIds,
      primaryPersonId: personIds[0], // First one is primary by default
      createdAt: new Date().toISOString()
    };
  }

  // Save to sessionStorage
  try {
    sessionStorage.setItem('people', JSON.stringify(people));
    sessionStorage.setItem('peopleMappings', JSON.stringify(peopleMappings));
  } catch (e) {
    console.error('Failed to save people data to sessionStorage:', e);
  }

  return { people, peopleMappings };
}

// Initialize data storage
const data = initializePeopleData();
let people = data.people;
let peopleMappings = data.peopleMappings;

/**
 * Save people data to sessionStorage
 */
function savePeopleData() {
  try {
    sessionStorage.setItem('people', JSON.stringify(people));
    sessionStorage.setItem('peopleMappings', JSON.stringify(peopleMappings));
  } catch (e) {
    console.error('Failed to save people data to sessionStorage:', e);
  }
}

/**
 * API Methods
 */

/**
 * Get all people (returns unique records - joined mappings appear as single person)
 */
export function getAllPeople() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const uniquePeople = [];
      const processedMappings = new Set();

      people.forEach(person => {
        if (person.isMapped) {
          // Only include the primary person from each mapping
          if (!processedMappings.has(person.mappingId)) {
            const mapping = peopleMappings[person.mappingId];
            if (mapping && mapping.primaryPersonId === person.id) {
              uniquePeople.push({
                ...person,
                isJoinedAccount: true,
                groupedUserCount: mapping.personIds.length
              });
              processedMappings.add(person.mappingId);
            }
          }
        } else {
          uniquePeople.push({ ...person, isJoinedAccount: false, groupedUserCount: null });
        }
      });

      resolve(uniquePeople);
    }, 100);
  });
}

/**
 * Get person by ID
 */
export function getPerson(personId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const person = people.find(p => p.id === personId);
      if (person) {
        resolve({ ...person });
      } else {
        reject(new Error('Person not found'));
      }
    }, 100);
  });
}

/**
 * Get all people in a mapping group
 */
export function getPeopleMappingDetails(mappingId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mapping = peopleMappings[mappingId];
      if (!mapping) {
        reject(new Error('Mapping not found'));
        return;
      }

      const mappedPeople = people.filter(p => mapping.personIds.includes(p.id));
      resolve({
        mapping: { ...mapping },
        people: mappedPeople
      });
    }, 100);
  });
}

/**
 * Create a people mapping (join multiple people as one account)
 */
export function createPeopleMapping(personIds, primaryPersonId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (personIds.length < 2) {
        reject(new Error('At least 2 people are required for a mapping'));
        return;
      }

      if (!personIds.includes(primaryPersonId)) {
        reject(new Error('Primary person must be in the person list'));
        return;
      }

      // Check if any person is already mapped
      const alreadyMapped = people.filter(p =>
        personIds.includes(p.id) && p.isMapped
      );
      if (alreadyMapped.length > 0) {
        reject(new Error('One or more people are already part of a mapping'));
        return;
      }

      // Create the mapping
      const mappingId = `MAPPING-${String(Object.keys(peopleMappings).length + 1).padStart(4, '0')}`;

      peopleMappings[mappingId] = {
        id: mappingId,
        personIds: [...personIds],
        primaryPersonId: primaryPersonId,
        createdAt: new Date().toISOString()
      };

      // Update all people in the mapping
      personIds.forEach(personId => {
        const person = people.find(p => p.id === personId);
        if (person) {
          person.isMapped = true;
          person.mappingId = mappingId;
        }
      });

      savePeopleData();
      resolve({ ...peopleMappings[mappingId] });
    }, 200);
  });
}

/**
 * Unmap a person from a mapping group
 */
export function unmapPerson(personId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const person = people.find(p => p.id === personId);
      if (!person) {
        reject(new Error('Person not found'));
        return;
      }

      if (!person.isMapped) {
        reject(new Error('Person is not part of a mapping'));
        return;
      }

      const mapping = peopleMappings[person.mappingId];
      if (!mapping) {
        reject(new Error('Mapping not found'));
        return;
      }

      // Remove person from mapping
      mapping.personIds = mapping.personIds.filter(id => id !== personId);

      // Unmap the person
      person.isMapped = false;
      person.mappingId = null;

      // If this was the primary and there are still people left, set a new primary
      if (mapping.primaryPersonId === personId && mapping.personIds.length > 0) {
        mapping.primaryPersonId = mapping.personIds[0];
      }

      // If only one person left, unmap them too and delete the mapping
      if (mapping.personIds.length === 1) {
        const lastPerson = people.find(p => p.id === mapping.personIds[0]);
        if (lastPerson) {
          lastPerson.isMapped = false;
          lastPerson.mappingId = null;
        }
        delete peopleMappings[person.mappingId];
      } else if (mapping.personIds.length === 0) {
        delete peopleMappings[person.mappingId];
      }

      savePeopleData();
      resolve({ ...person });
    }, 200);
  });
}

/**
 * Update primary person in a mapping
 */
export function updatePrimaryPerson(mappingId, newPrimaryPersonId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mapping = peopleMappings[mappingId];
      if (!mapping) {
        reject(new Error('Mapping not found'));
        return;
      }

      if (!mapping.personIds.includes(newPrimaryPersonId)) {
        reject(new Error('Person is not part of this mapping'));
        return;
      }

      mapping.primaryPersonId = newPrimaryPersonId;
      savePeopleData();
      resolve({ ...mapping });
    }, 200);
  });
}
