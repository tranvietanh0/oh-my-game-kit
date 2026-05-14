---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Set Bonuses Guide

## Components

**`ItemSetMembership`** (on item entity) — declares which set the item belongs to:
```csharp
ecb.AddComponent(itemEntity, new ItemSetMembership { SetId = 1 });
```

**`SetBonusDefinition`** (buffer on world singleton) — declares thresholds and rewards:
```csharp
// Authoring: add all definitions to a singleton entity
var defs = AddBuffer<SetBonusDefinition>(singleton);
// SetId 1 — "Dragon Slayer" set
defs.Add(new SetBonusDefinition { SetId = 1, RequiredCount = 2,
    Stat = StatType.CritRate, ModType = ModifierType.PercentAdd, Value = 0.05f });
defs.Add(new SetBonusDefinition { SetId = 1, RequiredCount = 4,
    Stat = StatType.PhysAtk,  ModType = ModifierType.PercentMul, Value = 0.20f });
defs.Add(new SetBonusDefinition { SetId = 1, RequiredCount = 6,
    Stat = StatType.MaxHP,    ModType = ModifierType.Flat,       Value = 500f  });
```

## Counting Logic (ItemSetBonusSystem)

For each character with `EquipmentDirtyTag` enabled:

1. Iterate `InventorySlot` buffer — count `ItemSetMembership.SetId` per set using a `NativeHashMap<int, int>`.
2. Read `SetBonusDefinition` buffer from singleton.
3. Clear all `ModifierSource.ItemSet` modifiers from the character's `StatModifier` buffer.
4. For each definition where `countMap[SetId] >= RequiredCount` → add a new `StatModifier` with `Source = ModifierSource.ItemSet, Duration = -1f`.

```csharp
// Pseudocode — ItemSetBonusSystem inner loop
var countMap = new NativeHashMap<int, int>(16, Allocator.Temp);

foreach (var slot in slots)
{
    if (!setLookup.HasComponent(slot.ItemEntity)) continue;
    int setId = setLookup[slot.ItemEntity].SetId;
    countMap.TryGetValue(setId, out int c);
    countMap[setId] = c + 1;
}

// Clear old set modifiers
for (int i = modifiers.Length - 1; i >= 0; i--)
    if (modifiers[i].Source == ModifierSource.ItemSet)
        modifiers.RemoveAt(i);

// Apply qualifying thresholds
foreach (var def in bonusDefs)
{
    countMap.TryGetValue(def.SetId, out int owned);
    if (owned >= def.RequiredCount)
        modifiers.Add(new StatModifier
        {
            Stat = def.Stat, Type = def.ModType,
            Value = def.Value, Duration = -1f,
            Source = ModifierSource.ItemSet
        });
}
countMap.Dispose();
```

## Threshold Stacking (ARPG Standard)

ALL qualifying thresholds for the same set are active simultaneously. With 4 items from set 1:
- 2-piece bonus: ACTIVE (4 >= 2)
- 4-piece bonus: ACTIVE (4 >= 4)
- 6-piece bonus: INACTIVE (4 < 6)

This is intentional ARPG behavior. Each threshold adds its own `StatModifier` entry — the stat system aggregates them normally.

## Singleton Setup

`ItemSetBonusSystem` uses `RequireForUpdate<SetBonusDefinition>`. To activate it, a singleton entity with that buffer must exist in the subscene:

```csharp
// Authoring MonoBehaviour baked to singleton
class SetBonusDatabaseAuthoring : MonoBehaviour { /* ... */ }

class Baker : Baker<SetBonusDatabaseAuthoring>
{
    public override void Bake(SetBonusDatabaseAuthoring a)
    {
        var entity = GetEntity(TransformUsageFlags.None);
        var buf = AddBuffer<SetBonusDefinition>(entity);
        foreach (var entry in a.Entries)
            buf.Add(new SetBonusDefinition
            {
                SetId = entry.SetId,
                RequiredCount = entry.RequiredCount,
                Stat = entry.Stat,
                ModType = entry.ModType,
                Value = entry.Value
            });
    }
}
```

If no singleton exists, `ItemSetBonusSystem` skips silently — no error.

## SetId Conventions

- Use positive integers. `0` = no set (reserve as sentinel / unassigned).
- Define set IDs in a shared constants class — never inline integers in authoring fields.
- One item = one set. `ItemSetMembership` holds a single `SetId`; multi-set membership requires multiple components (not supported by default).

## Counted by InventorySlot, Not EquippedItem

The count includes ALL items in inventory (including unequipped). To restrict to equipped-only sets, filter `InventorySlot` against the `EquippedItem` buffer before counting. This is a game-design decision — implement the filter in `ItemSetBonusSystem` if required.
