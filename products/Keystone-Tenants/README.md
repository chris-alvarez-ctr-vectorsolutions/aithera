# Keystone Tenants Admin UI

Internal admin tool for managing Keystone Tenants and mapping them to product-level tenants across Vector Solutions products.

## Overview

This application allows CX and Implementation teams to:
- View and search all Keystone Tenants
- Create new Keystone Tenants
- Edit tenant details
- Map product tenants to Keystone Tenants
- Unmap product tenants

## Files

- **[index.html](index.html)** - Main page with Keystone Tenant grid
- **[tenant-details.html](tenant-details.html)** - Tenant details and product mapping page
- **[api.js](api.js)** - API module with dummy data and data operations
- **[state.js](state.js)** - State management module for navigation and persistence
- **[styles.css](styles.css)** - Custom CSS styles
- **[CLAUDE.md](CLAUDE.md)** - Project-specific instructions
- **[VECTOR_COMPONENTS_REFERENCE.md](VECTOR_COMPONENTS_REFERENCE.md)** - Vector Web Components reference

## Getting Started

Simply open [index.html](index.html) in a web browser. No build process or server required.

## Features

### Keystone Tenant Grid ([index.html](index.html))

- **Search**: Search tenants by name, city, or state
- **Sortable Columns**: Click column headers to sort (name, city, state, UUID, mapped products)
- **Create New Tenant**: Modal dialog with form validation
- **Navigation**: Click any row to view tenant details
- **Keyboard Navigation**:
  - Tab through table rows
  - Arrow keys to navigate up/down
  - Enter to open tenant details

### Tenant Details Page ([tenant-details.html](tenant-details.html))

#### Left Pane: Tenant Information

- **View Mode**: Display all tenant details in readonly format
- **Edit Mode**: Click "Edit" button to modify tenant information
- **Unsaved Changes Warning**: Prompts user before navigating away with unsaved changes
- **Required Fields**: Name, Address Line 1, City, State, Country

#### Product Mappings

- **6 Vector Products**: TargetSolutions, Scheduling, Check IT, EV+, Guardian Tracking, Frontline
- **Visual Status**: Clearly shows which products are mapped vs unmapped
- **Click to Map**: Click unmapped product to open mapping interface
- **Unmap**: Click "Unmap" button on mapped products to remove mapping

#### Right Pane: Product Mapping

- **Product Tenant Grid**: Shows all available unmapped tenants for selected product
- **Search**: Filter product tenants by name, city, or state
- **Click to Map**: Click any row to create the mapping
- **Auto-close**: Mapping pane closes automatically after mapping
- **Keyboard Navigation**: Full keyboard support with arrow keys and Enter

## CX Efficiency Features

The application is designed for high-volume mapping work:

### Keyboard-Friendly
- Logical tab order throughout
- Arrow key navigation in grids
- Enter key to select/activate
- Escape key to close dialogs/drawers
- All interactive elements keyboard accessible

### Batch-Friendly Workflow
- Grid state persistence (search, sort, selected row)
- Returns to exact position after editing
- Filters remain intact during operations
- Quick successive mappings without losing context

### Persistent Context
- Search and sort preferences saved in session
- Selected row remains highlighted after navigation
- Grid position maintained across page transitions

## Dummy Data

The application includes:
- **100 Keystone Tenants** with realistic organization names and addresses
- **500 Product Tenants** distributed across 6 Vector products
- **~20% Pre-mapped**: Some Keystone Tenants have existing product mappings

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox and Grid
- **Vanilla JavaScript** - ES6+ modules
- **Vector Web Components v1.5.1** - UI component library
- **Font Awesome 6** - Icon library
- **No build tools** - Runs directly in browser

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development Notes

### Data Persistence
- Uses `sessionStorage` for grid state
- All data is in-memory (resets on page reload)
- Can be easily connected to real backend APIs

### Adding Real APIs
Replace the stub functions in [api.js](api.js) with actual API calls. The interface is already defined and used throughout the application.

### Styling Customization
- Vector theme variables defined in `styles.js` CDN
- Custom overrides in [styles.css](styles.css)
- Follows Vector design system conventions

## Future Enhancements

Potential additions:
- Bulk mapping operations
- Export to CSV
- Audit log of mapping changes
- Advanced filtering (by mapped status, product type)
- Tenant merge functionality
- Import from spreadsheet
