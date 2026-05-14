---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Gotchas — Inventory Grid, Passives & Set Bonuses

## G1 — Rotation Swap: Always Call GetEffectiveDimensions

`ItemRotation.RotationIndex` 1 and 3 swap `DefaultWidth` ↔ `DefaultHeight`. Reading fields directly when rotation is non-zero = wrong dimensions.

```csharp
// WRONG — ignores rotation
InventoryGridUtility.CanPlace(cells, gridW, gridH, gx, gy, shape.DefaultWidth, shape.DefaultHeight)

// CORRECT
var effDim = InventoryGridUtility.GetEffectiveDimensions(shape, rotation);
InventoryGridUtility.CanPlace(cells, gridW, gridH, gx, gy, effDim.x, effDim.y)
```

Applies to: `CanPlace`, `PlaceItem`, `RemoveItem`, `FindFirstFit`.

## G2 — Grid Buffer Pre-Filled at Bake Time; Never Resize at Runtime

Baker must pre-fill; forgetting → length 0 → `FindFirstFit` always false:
```csharp
var cells = AddBuffer<InventoryGridCell>(entity);
cells.Resize(width * height, NativeArrayOptions.ClearMemory);
```

## G3 — Unplaced Sentinel: GridX == -1

Guard before grid ops. UI removal must reset to `(-1, -1)` after `RemoveItem`:
```csharp
var pos = SystemAPI.GetComponent<ItemGridPosition>(itemEntity);
if (pos.GridX == -1) return;
```

## G4 — ItemPassive vs ModifierSource.Passive

`ModifierSource.ItemPassive` (PassiveEffectSystem) is distinct from `ModifierSource.Passive` (UpgradeSystem/TalentUnlockSystem). Each system clears only its own source. Never mix them.

## G5 — ItemSet vs ModifierSource.Synergy

`ModifierSource.ItemSet` (ItemSetBonusSystem) is distinct from `ModifierSource.Synergy` (SynergyResolutionSystem). Clearing the wrong source silently removes unrelated modifiers.

## G6 — Set Bonus Stacking Is Intentional

All qualifying thresholds apply simultaneously. 4 items → 2-piece AND 4-piece both ACTIVE. The buffer has two entries; the stat pipeline aggregates correctly. Do not deduplicate.

## G7 — GridPlacementSystem Does NOT Disable EquipmentDirtyTag

Only `EquipmentSystem` (last in chain) disables the tag. If `GridPlacementSystem` disables it, PassiveEffectSystem and ItemSetBonusSystem skip — passives and bonuses go stale.

## G8 — No Managed Types in Components

All grid/item components are blittable. No `string`, `class`, `List<T>`, or `object` fields.

## G9 — EquipmentSystem Duration Filter Collision

`EquipmentSystem` clears modifiers by `Duration == -1f`. Must filter by **both** `Duration == -1f` AND `Source == ModifierSource.Equipment` — otherwise erases item passives.

## G10 — ItemSetBonusSystem Requires Singleton

Has `RequireForUpdate<SetBonusDefinition>`. Missing singleton → system never runs, set bonuses silently do nothing. Verify `SetBonusDatabaseAuthoring` is in subscene with non-empty buffer.

→ See [gotchas-ui-drag.md](gotchas-ui-drag.md) for G11 (validate before move), G12 (drag offset), G13 (self-cell ignore).

## G14 — Enums Are Fields on Item Struct, Not IComponentData

```csharp
// WRONG — TypeManager error at runtime
if (em.HasComponent<ItemRarity>(e)) { ... }

// CORRECT
var item = em.GetComponentData<Item>(e);
var rarity = item.Rarity;
```

## G15 — IsActive Field: Check Before Placement

`InventoryGridCell.IsActive` (1=active, 0=inactive). Items only place on active cells.
- `InventoryGridCell.Empty` — active, no item
- `InventoryGridCell.Inactive` — inactive, no item
- `CanPlace` checks `IsActive` internally; check it in UI rendering to skip rendering inactive cells

**UI Gotcha:** Never `SetActive(false)` on grid cell GOs in `GridLayoutGroup` — collapses hidden children. Use `CanvasGroup.alpha = 0` instead.
