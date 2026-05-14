---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Passive Effects Guide

## PassiveCondition Enum

| Value | When active |
|-------|-------------|
| `InInventory` | Item is in any `InventorySlot` on the owner (equipped or not) |
| `EquippedOnly` | Item must also be in the owner's `EquippedItem` buffer |

## Clear-and-Rebuild Pattern

`PassiveEffectSystem` runs on every `EquipmentDirtyTag`-enabled entity. It does NOT track deltas — it clears all `ModifierSource.ItemPassive` modifiers and rebuilds from scratch each time.

```csharp
// PassiveEffectSystem inner loop (simplified)
var modifiers = SystemAPI.GetBuffer<StatModifier>(ownerEntity);
var slots = SystemAPI.GetBuffer<InventorySlot>(ownerEntity);
var equipped = SystemAPI.GetBuffer<EquippedItem>(ownerEntity);

// 1. Clear only ItemPassive source
for (int i = modifiers.Length - 1; i >= 0; i--)
    if (modifiers[i].Source == ModifierSource.ItemPassive)
        modifiers.RemoveAt(i);

// 2. Rebuild from all items in inventory
foreach (var slot in slots)
{
    if (!passiveLookup.HasBuffer(slot.ItemEntity)) continue;
    var passives = passiveLookup[slot.ItemEntity];

    bool isEquipped = IsEquipped(slot.ItemEntity, equipped); // helper

    foreach (var passive in passives)
    {
        if (passive.Condition == PassiveCondition.EquippedOnly && !isEquipped)
            continue;

        modifiers.Add(new StatModifier
        {
            Stat = passive.Stat,
            Type = passive.ModType,
            Value = passive.Value,
            Duration = -1f,                        // permanent
            Source = ModifierSource.ItemPassive
        });
    }
}
```

`DerivedStatsSystem` (next frame) picks up the new modifiers automatically via the standard stat pipeline.

## Bake Setup

Add `ItemPassiveEffect` buffer in the item Baker. The buffer is on the **item entity**, not the owner.

```csharp
public class ItemPassiveAuthoring : MonoBehaviour
{
    [Serializable]
    public struct PassiveEntry
    {
        public StatType Stat;
        public ModifierType ModType;
        public float Value;
        public PassiveCondition Condition;
    }
    public List<PassiveEntry> Passives;
}

class Baker : Baker<ItemPassiveAuthoring>
{
    public override void Bake(ItemPassiveAuthoring a)
    {
        var entity = GetEntity(TransformUsageFlags.None);
        var buf = AddBuffer<ItemPassiveEffect>(entity);
        foreach (var p in a.Passives)
            buf.Add(new ItemPassiveEffect
            {
                Stat = p.Stat, ModType = p.ModType,
                Value = p.Value, Condition = p.Condition
            });
    }
}
```

## Integration with Stat Pipeline

```
PickupSystem → EquipmentDirtyTag enabled
  → PassiveEffectSystem: clear ItemPassive modifiers, rebuild from inventory
  → EquipmentSystem: clear Permanent (-1f) modifiers, rebuild from EquippedItem
  → (both run same frame, Equipment runs after Passive)

Next frame:
  → DerivedStatsSystem: reads all StatModifiers → writes DerivedCombatStats/DerivedLocomotion
  → StatSyncSystem: syncs to Health.Max, Mana.Max, MoveSpeed.Value
```

## Key Rules

- `PassiveEffectSystem` clears by `ModifierSource.ItemPassive` only — upgrade/talent/synergy passives (source `ModifierSource.Passive` or `.Synergy`) are untouched.
- `EquipmentSystem` clears by `Duration == -1f` — it will overwrite equipment stat bonuses but NOT `ItemPassive` modifiers (they also have `Duration == -1f`). **Avoid this collision**: `EquipmentSystem` must filter by `ModifierSource.Equipment`, not duration alone, if both run on the same entity.
- If an item is removed from inventory (slot removed), triggering `EquipmentDirtyTag` ensures the next `PassiveEffectSystem` pass drops it.
- Zero passives on an item = no `ItemPassiveEffect` buffer needed. Use `HasBuffer` guard before reading.
