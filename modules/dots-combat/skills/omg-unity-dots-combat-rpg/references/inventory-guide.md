---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Inventory — DOTSRPG.Inventory

> **Prerequisites:** `dots-ecs-core` (IBufferElementData, IEnableableComponent, ECB, SystemAPI)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `EquipmentDirtyTag` | — | `IEnableableComponent`; enables when equipment changes; `EquipmentSystem` processes then disables |
| `InventoryCapacity` | `int MaxSlots` | Hard cap on `InventorySlot` buffer length |
| `Item` | `int ItemId`, `ItemType Type`, `ItemRarity Rarity`, `int StackMax` | On item entity |
| `PickupTag` | — | Marks item as pickup-able; removed on pickup |
| `LootDroppedTag` | — | `IEnableableComponent`; enabled by LootDropSystem on death, disabled by InventoryRespawnResetSystem on respawn. Prevents double drops |
| `PickupRadius` | `float Radius` | On player/character; trigger radius for auto-pickup |

## Buffers

| Buffer | Fields | Capacity | Notes |
|--------|--------|----------|-------|
| `EquipmentStatBonus` | `StatType Stat`, `ModifierType ModType`, `float Value` | 4 inline | On item entity |
| `EquippedItem` | `Entity ItemEntity`, `EquipSlotType SlotType` | 9 inline | On character entity |
| `InventorySlot` | `Entity ItemEntity`, `int StackCount` | 20 inline | On character entity |
| `LootTableEntry` | `int ItemId`, `float DropRate`, `int MinCount, MaxCount`, `ItemType Type`, `ItemRarity Rarity`, `int StackMax` | 8 inline | On mob entity |

## Enums

**ItemType** (6): `Consumable, Weapon, Armor, Accessory, Material, Quest`

**ItemRarity** (5): `Common, Uncommon, Rare, Epic, Legendary`

**EquipSlotType** (9): `Weapon, OffHand, Head, Chest, Legs, Feet, Ring1, Ring2, Necklace`

## Systems (InventorySystemGroup order)

1. **PickupSystem** (`OrderFirst`) — for each entity with `PickupRadius`, scans nearby `PickupTag` items within radius. Tries to stack with existing slot (same `ItemId`, `StackCount < StackMax`); else adds new slot. Sets `EquipmentDirtyTag` enabled.
2. **EquipmentSystem** (`after Pickup`) — runs only on `EquipmentDirtyTag`-enabled entities. Clears all permanent (`Duration == -1f`) `StatModifier` entries, then re-adds from all `EquippedItem` → `EquipmentStatBonus` buffers as new permanent modifiers. Disables tag when done.
3. **LootDropSystem** (`OrderLast`) — on `DeadTag` entities with `LootTableEntry` buffer (once per death via `LootDroppedTag`). RNG roll per entry; spawns item entities with `PickupTag` + `Lifetime(60s)`.

## Equipment → StatModifier Flow

```
Equip item:
  1. Add item to EquippedItem buffer
  2. Enable EquipmentDirtyTag

EquipmentSystem (next frame):
  1. Remove all StatModifiers where Duration == PermanentModifierDuration (-1f)
  2. For each EquippedItem → read EquipmentStatBonus buffer
  3. Add StatModifier { Duration = -1f, Value, Stat, Type } for each bonus
  4. Disable EquipmentDirtyTag

DerivedStatsSystem (next frame):
  → Permanent modifiers included in stat recalculation
```

## Usage Examples

**Equip an item:**
```csharp
// Add to equipped buffer
var equipped = SystemAPI.GetBuffer<EquippedItem>(playerEntity);
equipped.Add(new EquippedItem
{
    ItemEntity = swordEntity,
    SlotType = EquipSlotType.Weapon
});
// Signal dirty
SystemAPI.SetComponentEnabled<EquipmentDirtyTag>(playerEntity, true);
```

**Create a weapon item entity with stat bonuses:**
```csharp
var item = ecb.CreateEntity();
ecb.AddComponent(item, new Item
{
    ItemId = 1001,
    Type = ItemType.Weapon,
    Rarity = ItemRarity.Rare,
    StackMax = 1
});
var bonuses = ecb.AddBuffer<EquipmentStatBonus>(item);
bonuses.Add(new EquipmentStatBonus
{
    Stat = StatType.PhysAtk,
    ModType = ModifierType.Flat,
    Value = 80f
});
bonuses.Add(new EquipmentStatBonus
{
    Stat = StatType.CritRate,
    ModType = ModifierType.PercentAdd,
    Value = 0.05f
});
```

**Set up a mob loot table:**
```csharp
var loot = AddBuffer<LootTableEntry>(entity);
loot.Add(new LootTableEntry
{
    ItemId = 501, DropRate = 0.3f,
    MinCount = 1, MaxCount = 3,
    Type = ItemType.Material,
    Rarity = ItemRarity.Common,
    StackMax = 99
});
```

## Gotchas

- `EquipmentSystem` identifies equipment modifiers by `Duration == PermanentModifierDuration (-1f)` — do not use `-1f` for any other modifier purpose.
- `EquipmentDirtyTag` must be **enabled** (not just present) — use `SetComponentEnabled<EquipmentDirtyTag>(entity, true)`, not `AddComponent`.
- `PickupSystem` stacks by matching `ItemId`, not `ItemEntity` — different entities with the same `ItemId` will stack.
- `LootDroppedTag` is `IEnableableComponent` — `LootDropSystem` enables it (via `EnabledRefRW`) to prevent double drops, `InventoryRespawnResetSystem` disables it on respawn. No structural changes (no ECB add/remove).
- `LootDropSystem` creates new entities via ECB — spawned items have no mesh/renderer by default; add rendering components in the authoring prefab setup.
