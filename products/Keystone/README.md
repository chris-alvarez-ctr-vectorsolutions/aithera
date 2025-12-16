# Keystone Admin - Tenant & Person Mapping Tool

An internal admin UI for mapping Keystone Tenants to product-specific tenants and Keystone People to product-specific users across Vector Solutions products.

## Overview

This is a lightweight, browser-based admin tool built for CX and Implementations teams to manage cross-product customer identity mappings during the Keystone rollout.

## Features

### Keystone Tenant Management
- ✅ Create new Keystone Tenants with full address details
- ✅ Search and filter tenants by name, city, or country
- ✅ View tenant details with full address and Keystone ID
- ✅ Map tenants to product-specific tenants (6 products supported)
- ✅ Unmap product tenants with confirmation
- ✅ Real-time mapping count display

### Keystone Person Management
- ✅ View all Keystone People with associated tenant information
- ✅ Advanced filtering by:
  - First Name
  - Last Name
  - Email
  - Keystone Tenant
  - Associated Products
- ✅ View person details with emails and tenant association
- ✅ Map people to product-specific users
- ✅ Unmap product users with confirmation
- ✅ Real-time mapping count display

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styles with Vector design tokens
- **Vanilla JavaScript** - ES6 modules, no frameworks
- **Vector Web Components** - Complete component library
- **Font Awesome 6** - Icon library

## CX-Optimized Features

This tool is designed for high-volume mapping work:

1. **Minimal Clicks**
   - Single-click row selection
   - Inline mapping controls
   - Auto-select new tenants after creation

2. **Minimal Mouse Travel**
   - Two-pane layout keeps everything visible
   - Controls positioned close to related data
   - Consistent action button placement

3. **Keyboard-Friendly**
   - Tab navigation through all controls
   - Enter key triggers search and actions
   - Arrow key navigation in tables
   - Clear focus indicators

4. **Persistent Context**
   - Filters remain active during work
   - Selection state maintained
   - Scroll position preserved

5. **Non-blocking Feedback**
   - Toast notifications for success/errors
   - Small confirmation dialogs positioned near controls
   - Loading indicators for async operations

## File Structure

```
/products/Keystone/
├── index.html              # Main application HTML
├── styles.css              # Custom CSS styles
├── api.js                  # Mock API and data management
├── state.js                # Application state management
├── tenants.js              # Tenant functionality
├── people.js               # People functionality
├── CLAUDE.md               # Project instructions
├── VECTOR_COMPONENTS_REFERENCE.md  # Component reference
└── README.md               # This file
```

## Getting Started

### Opening the Application

Simply open `index.html` in a modern web browser:

```bash
open index.html
```

Or double-click the file in Finder/Explorer.

### Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Web Components and ES6 modules are required.

## Using the Application

### Tenant Workflow

1. **Create a Tenant** (optional)
   - Click "Create New Tenant" to expand the form
   - Fill in required fields (marked with asterisk)
   - Click "Create Tenant"
   - New tenant will be auto-selected

2. **Select a Tenant**
   - Click any row in the table or use keyboard navigation
   - Tenant details appear in the right panel

3. **Map Product Tenants**
   - In the right panel, each product has a dropdown
   - Select a product tenant from the list
   - Mapping is saved immediately
   - Green checkmark indicates mapped tenant

4. **Unmap Product Tenants**
   - Click "Unmap" next to any mapped tenant
   - Confirm the action
   - Mapping is removed immediately

### People Workflow

1. **Apply Filters** (optional)
   - Expand "Filters" section
   - Enter filter criteria
   - Click "Apply Filters" or press Enter
   - Click "Clear" to reset

2. **Select a Person**
   - Click any row in the table or use keyboard navigation
   - Person details appear in the right panel

3. **Add Product User Mapping**
   - Scroll to "Add New Mapping" section
   - Select a product user from the dropdown
   - Click "Add Mapping"
   - New mapping appears in "Current Mappings"

4. **Remove Product User Mapping**
   - In "Current Mappings", click "Unmap" next to any mapping
   - Confirm the action
   - Mapping is removed immediately

## Mock Data

The application includes mock data for demonstration:

- **3 Keystone Tenants**: Acme Corporation, Global Enterprises Ltd, Tech Innovations Inc
- **4 Keystone People**: John Doe, Jane Smith, Bob Johnson, Alice Williams
- **10 Product Tenants** across 6 products
- **7 Product Users** across various product tenants
- Pre-existing mappings for demonstration

All data is stored in memory and resets on page reload.

## Products Supported

1. TargetSolutions
2. Vector LMS
3. Vector Training
4. Vector Compliance
5. Vector Scheduling
6. Vector Analytics

## Customization

### Adding More Products

Edit `api.js` and update the `PRODUCTS` array:

```javascript
const PRODUCTS = [
  { code: 'product_7', name: 'New Product' },
  // ...
];
```

### Changing Mock Data

Edit the mock data arrays in `api.js`:
- `keystoneTenants`
- `productTenants`
- `keystonePeople`
- `productUsers`
- `tenantMappings`
- `personMappings`

### Styling

Customize appearance in `styles.css`. The app uses Vector design tokens:

```css
/* Example: Change primary color */
--lumo-primary-color: #0271ce;
```

## Browser Console

Open the browser console (F12) to see:
- Initialization logs
- API call activity
- Error messages (if any)

## Known Limitations

1. **No Backend** - All data is in-memory and resets on reload
2. **Product Filter** - People product filtering is simplified (backend support needed)
3. **No Authentication** - This is a prototype, no login required
4. **No Data Persistence** - Changes don't persist across sessions

## Future Enhancements

- [ ] Connect to real backend APIs
- [ ] Add user authentication
- [ ] Implement bulk operations
- [ ] Export mappings to CSV
- [ ] Add audit log/history
- [ ] Implement undo/redo
- [ ] Add keyboard shortcuts reference
- [ ] Add search within dropdowns
- [ ] Pagination for large datasets

## Support

For issues or questions, contact the UX team or check the project documentation.

## License

Internal use only - Vector Solutions
