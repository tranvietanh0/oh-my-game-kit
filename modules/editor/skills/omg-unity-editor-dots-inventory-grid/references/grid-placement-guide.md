---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Grid Placement Guide

> Prerequisite: `InventoryGridDimension` present on owner entity (opt-in gate).

## InventoryGridUtility — Static Burst-Safe API

All methods are `static` and `[BurstCompile]`-compatible (blittable params only).

| Method | Signature | Returns |
|--------|-----------|---------|
| `GetEffectiveDimensions` | `(ItemGridShape shape, ItemRotation rot)` | `int2(w, h)` — swaps w/h for rot 1 or 3 |
| `CanPlace` | `(cells, gridW, gridH, gx, gy, w, h)` | `bool` — true if all cells are Entity.Null |
| `PlaceItem` | `(cells, gridW, gx, gy, w, h, itemEntity)` | `void` — writes itemEntity to all covered cells |
| `RemoveItem` | `(cells, gridW, gx, gy, w, h)` | `void` — writes Entity.Null to covered cells |
| `FindFirstFit` | `(cells, gridW, gridH, w, h, out gx, out gy)` | `bool` — top-left scan, first fitting cell |
| `GetAdjacentItems` | `(cells, gridW, gridH, gx, gy, w, h, result)` | `void` — fills NativeList with bordering entities |
| `CellIndex` | `(gridW, gx, gy)` | `int` — flat index: gy * gridW + gx |
| `ComputeDragOffset` | `(clickedCellIndex, gridW, anchorX, anchorY, out offsetX, out offsetY)` | `void` — UI drag: offset from grab point to item anchor |
| `ApplyDragOffset` | `(hoveredCellIndex, gridW, offsetX, offsetY, out targetX, out targetY)` | `void` — UI drag: convert hovered cell to item anchor pos |

## Rotation Rules

`ItemRotation.RotationIndex` values:

| Index | Orientation | Effective size |
|-------|-------------|---------------|
| 0 | Default (0°) | DefaultWidth × DefaultHeight |
| 1 | 90° CW | DefaultHeight × DefaultWidth (swapped) |
| 2 | 180° | DefaultWidth × DefaultHeight (same as 0) |
| 3 | 270° CW | DefaultHeight × DefaultWidth (swapped) |

**Always call `GetEffectiveDimensions` before any placement check.** Never read `DefaultWidth`/`DefaultHeight` directly when an item may be rotated.

Items with `ItemNoRotationTag` must keep `RotationIndex == 0`. Validate on input; skip rotation UI for these items.

## Grid Buffer Layout

`InventoryGridCell` is a **flat row-major array** of length W×H baked at authoring time:

```
Cell index = GridY * GridWidth + GridX
```

The buffer is **never resized at runtime**. Pre-fill all W×H slots with `Entity.Null` in the baker:

```csharp
// Baker — pre-fill grid
var cells = AddBuffer<InventoryGridCell>(entity);
cells.Resize(width * height, NativeArrayOptions.ClearMemory);
// NativeArrayOptions.ClearMemory zero-initializes → Entity.Null == default
```

## Auto-Placement Algorithm (GridPlacementSystem)

`GridPlacementSystem` runs `[UpdateAfter(PickupSystem)]`. For each character with `EquipmentDirtyTag` enabled and `InventoryGridDimension`:

1. Query all `InventorySlot` entries on the character.
2. For each slot where `ItemGridPosition.GridX == -1` (unplaced sentinel):
   a. Read `ItemGridShape` + `ItemRotation` → call `GetEffectiveDimensions`.
   b. Call `FindFirstFit` → if true, call `PlaceItem` + set `ItemGridPosition`.
   c. If false and item has no `ItemNoRotationTag`, try all 4 rotations (skip equivalent ones for symmetric shapes).
   d. If still no fit → item stays unplaced (GridX == -1); log warning in editor.
3. Does **not** disable `EquipmentDirtyTag` — `PassiveEffectSystem` and `ItemSetBonusSystem` need it.

## Manual Placement (UI-driven)

To move an already-placed item:

```csharp
// 1. Remove from old position
var oldPos = SystemAPI.GetComponent<ItemGridPosition>(itemEntity);
var oldShape = SystemAPI.GetComponent<ItemGridShape>(itemEntity);
var rot = SystemAPI.GetComponent<ItemRotation>(itemEntity);
var effDim = InventoryGridUtility.GetEffectiveDimensions(oldShape, rot);
InventoryGridUtility.RemoveItem(cells, gridW, oldPos.GridX, oldPos.GridY, effDim.x, effDim.y);

// 2. Try new position
if (InventoryGridUtility.CanPlace(cells, gridW, gridH, newGx, newGy, effDim.x, effDim.y))
{
    InventoryGridUtility.PlaceItem(cells, gridW, newGx, newGy, effDim.x, effDim.y, itemEntity);
    SystemAPI.SetComponent(itemEntity, new ItemGridPosition { GridX = newGx, GridY = newGy });
    SystemAPI.SetComponentEnabled<EquipmentDirtyTag>(ownerEntity, true);
}
else
{
    // Restore original position
    InventoryGridUtility.PlaceItem(cells, gridW, oldPos.GridX, oldPos.GridY, effDim.x, effDim.y, itemEntity);
}
```

Items with `ItemLockedTag` must be skipped by the UI layer before attempting move.
