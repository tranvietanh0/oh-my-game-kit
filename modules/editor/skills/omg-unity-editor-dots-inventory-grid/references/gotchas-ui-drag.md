---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Gotchas — UI Drag & Drop

## G11 — Validate Before Moving, Not After

**Never** call `MoveItemToCell` on invalid drops. The remove→try→fail→restore cycle triggers `EquipmentDirtyTag` → `GridPlacementSystem` auto-places unplaced items → phantom items appear.

**Wrong (move then restore on fail):**
```csharp
void OnCellDrop(cell) {
    MoveItemToCell(item, cell); // RemoveItem + TryPlace + restore on fail + dirty tag
    _dropHandled = true;
}
```

**Correct (check preview first, separate _dropHandled from move):**
```csharp
void OnCellDrop(cell) {
    _dropHandled = true;              // always: prevents DropItemToWorld fallback
    if (!_isPreviewValid) return;     // skip move if hover showed red
    MoveItemToCell(item, cell);       // only runs on valid (green) placement
}
```

Also: `OnCellEndDrag` should NOT call `DropItemToWorld` on drag-cancel. Use right-click for explicit drop-to-world. Drag-outside = item stays in original position.

---

## G12 — Drag Offset: Anchor Relative to Grabbed Cell, Not Top-Left

When dragging a multi-cell item, use `InventoryGridUtility.ComputeDragOffset` (OnBeginDrag) and `ApplyDragOffset` (OnHover/OnDrop) so items feel grabbed where clicked, not snapped to top-left.

```csharp
// OnBeginDrag: compute offset once
InventoryGridUtility.ComputeDragOffset(clickedCellIndex, gridW,
    itemPos.GridX, itemPos.GridY, out _dragOffsetX, out _dragOffsetY);

// OnHover / OnDrop: apply offset to get true anchor
InventoryGridUtility.ApplyDragOffset(hoveredCellIndex, gridW,
    _dragOffsetX, _dragOffsetY, out int targetX, out int targetY);
```

Also remove "dropped on self" early-return in OnDrop — with offset, dropping on a cell occupied by the same item is valid (item may be repositioning).

---

## G13 — Polyomino CanPlace Must Ignore Self-Occupied Cells

When checking if a dragged item can fit at a hover position, the item's own cells are already cleared by `RemoveItem`. But if checking BEFORE removing (e.g., hover preview), ignore cells occupied by the dragged item itself — otherwise the item blocks its own placement.
