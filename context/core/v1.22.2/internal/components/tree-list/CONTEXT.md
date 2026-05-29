# `vwc-tree-list` / `TreeList`

A keyboard-navigable tree widget. Data-driven (not slot-based).

## Usage

```typescript
const tree = document.querySelector('vwc-tree-list');
tree.items = [
  {
    id: 'root',
    text: 'Root',
    children: [
      { id: 'leaf-1', text: 'Leaf 1' },
      { id: 'leaf-2', text: 'Leaf 2', subtitle: 'optional' }
    ]
  }
];
tree.value = 'leaf-1';
tree.addEventListener('value-change', (e) => console.log(e.detail));
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `VectorTreeListItem[]` | `[]` | Tree data (supports recursive `children`). |
| `value` | `string \| string[] \| null` | `null` | Selected item ID(s). |
| `multi` | `boolean` | `false` | Allow multiple selection. |
| `accessibleName` | `string` | â | `aria-label` for the tree. |
| `accessibleNameRef` | `string` | â | `aria-labelledby` for the tree. |

### `VectorTreeListItem`

```typescript
{
  id: string;        // unique identifier
  text: string;      // display label
  icon?: VectorIcon; // optional icon
  subtitle?: string; // optional secondary text
  children?: VectorTreeListItem[]; // makes this item a parent node
}
```

## Events

| Event | `detail` | Notes |
|---|---|---|
| `value-change` | `string \| string[] \| null` | Fires when selection changes. |

## Gotchas

- Switching `multi` from `true` to `false` when multiple items are selected auto-selects only the first selected item.
- Items without `children` are leaf nodes (no expand/collapse). Items with `children` show an expand button.
- Keyboard navigation follows ARIA tree pattern (arrow keys, Home/End, Enter/Space) via `TreeListKeyboardMixin`.
- `value` can be a JSON string when set as an HTML attribute: `value='"item-id"'` or `value='["id1","id2"]'`.
