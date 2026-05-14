---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Demo, Shapes & Modifier Source Guide

## Polyomino Shapes (Backpack Hero-style)

Items can have **arbitrary polyomino shapes** (L, T, cross, zigzag, etc.) via `ItemShapeMask` buffer.

**How it works:**
- Each `ItemShapeMask` element is an `int2` offset relative to origin `(0,0)`
- If `ItemShapeMask` buffer is absent → item uses rectangular `DefaultWidth*DefaultHeight`
- Rotation transforms offsets: `RotateOffset(offset, rot)` — 0°/90°/180°/270° CW
- `FindFirstFitMask` tries all rotations (0-3) unless `ItemNoRotationTag` present

**Shape examples (offsets):**
```
L-shape:  (0,0),(0,1),(0,2),(1,2)     T-shape:  (0,0),(1,0),(2,0),(1,1)
Cross:    (1,0),(0,1),(1,1),(2,1),(1,2) Zigzag:  (0,0),(1,0),(1,1),(2,1)
```

**Key APIs:**
- `InventoryGridUtility.CanPlaceMask(grid, gridW, gridH, startX, startY, offsets)` — check fit
- `InventoryGridUtility.PlaceItemMask(grid, gridW, startX, startY, offsets, item)` — write cells
- `InventoryGridUtility.FindFirstFitMask(grid, gridW, gridH, mask, allowRot, ...)` — auto-fit
- `InventoryGridUtility.GetRotatedOffsets(mask, rotation, ref outOffsets)` — rotate + normalize
- `InventoryGridUtility.RotateOffset(offset, rotation)` — single offset rotation

**Authoring:** Add `Vector2Int[] ShapeMaskOffsets` to item authoring. Baker creates `ItemShapeMask` buffer.

---

## InventoryDemo (POC)

`Assets/Demos/InventoryDemo/` — Hybrid approach (ECS data + MonoBehaviour UI).

**Features:** WASD movement, click-to-pickup (world items), Canvas grid with drag-and-drop (rearrange cells, grab-offset aware), right-click to drop items to world, item float/rotate (ISystem), item type colors + labels. Drag to invalid/outside = cancel (item stays). Uses `InventoryGridUtility.ComputeDragOffset`/`ApplyDragOffset` for natural grab feel.

**Key files:**
- `InventoryDemoCanvasUI.cs` — Grid UI with drag ghost, ECS bridge (swap cells, drop-to-world)
- `InventoryDemoGridCell.cs` — Per-cell IBeginDrag/IDrag/IEndDrag/IDrop/IPointerClick
- `InventoryDemoItemFloatSystem.cs` — ISystem: Y bob + Y rotation for world items
- `InventoryDemoPlayerController.cs` — SystemBase: WASD + click-pickup (managed deps)

**Gotcha:** Use `== null` not `??` for Unity objects in editor scripts (see `unity-ugui` skill gotcha #9).

---

## ModifierSource Separation

| Source | Written by | Must NOT be cleared by |
|--------|-----------|------------------------|
| `ModifierSource.ItemPassive` | `PassiveEffectSystem` | Equipment / Upgrade / Talent / Synergy |
| `ModifierSource.ItemSet` | `ItemSetBonusSystem` | Same |
| `ModifierSource.Passive` | `UpgradeSystem`, `TalentUnlockSystem` | `PassiveEffectSystem` |
| `ModifierSource.Synergy` | `SynergyResolutionSystem` | `ItemSetBonusSystem` |

Each system clears only its own source tag before rebuilding. Never cross-clear.

→ See [gotchas.md](gotchas.md) for G4 (ItemPassive vs Passive) and G5 (ItemSet vs Synergy) for runtime consequences.
