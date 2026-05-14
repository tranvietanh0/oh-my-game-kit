---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Component Design Decisions

## Decision Tree: Create New vs Update Existing?

```
Need to store new data?
├─ Does an existing component already hold related fields?
│  ├─ YES → Are ALL entities with that component going to use the new field?
│  │  ├─ YES → ADD field to existing component
│  │  └─ NO → CREATE new component (avoids wasted memory per entity)
│  └─ NO → CREATE new component
└─ Is it a boolean state toggle?
   ├─ YES → CREATE tag component (IComponentData with zero fields)
   │  └─ Need runtime toggle without archetype change?
   │     └─ YES → Also implement IEnableableComponent
   └─ NO → CREATE data component
```

## Component Type Selection

| Need | Type | Example |
|------|------|---------|
| Simple data (1-6 fields, same concern) | `IComponentData` | `Health { Current, Max }` |
| Boolean flag / filter | Tag `IComponentData` (zero fields) | `DeadTag { }` |
| Runtime toggle without chunk move | `IComponentData` + `IEnableableComponent` | `CCState : IComponentData, IEnableableComponent` |
| Per-entity variable-length list | `IBufferElementData` | `DamageEvent { Source, Amount, Type }` |
| Shared across many entities (same value) | `ISharedComponentData` | `RenderMesh` |
| Detect entity destruction | `ICleanupComponentData` | `SpawnedCleanup { SpawnedEntity }` |
| Large read-only shared data | `BlobAssetReference<T>` (in component) | Lookup tables, curves |

## Granularity Rules

### Too Fat (Split It)
- Component has **8+ fields** → likely mixing concerns
- Some fields only used by **subset of entities** → unused fields waste chunk memory
- Fields serve **different update frequencies** (e.g., config vs runtime state)
- Component name contains **"And"** or **"Data"** with no specificity

### Too Thin (Merge It)
- Two components **always added and removed together** → merge
- Two components **always queried together** in every system → consider merge
- Single-field component that's **not independently useful** → merge into parent

### Right Size (4-8 fields)
- All fields serve **one concern** (health, attack config, movement state)
- All entities with component **use all fields**
- Fields change at **similar frequency**
- Component has a **clear, specific name** (`AttackConfig` not `UnitData`)

## Config vs Runtime vs Event Pattern

| Pattern | Mutability | Example |
|---------|-----------|---------|
| **Config** component | Set at bake, rarely changes | `AttackConfig { Range, Cooldown }` |
| **State** component | Updated every frame | `AttackTimer { Elapsed }` |
| **Event** buffer | Written by producer, consumed+cleared by consumer | `DamageEvent { Source, Amount }` |
| **Tag** component | Presence = state | `DeadTag`, `InvulnerableTag` |

**Rule**: Never mix config and state in one component. Config rarely changes → don't pollute hot-path cache lines.

## Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| Data component | Domain noun | `Health`, `AttackConfig`, `DetectionRange` |
| Tag component | Adjective/state + `Tag` | `DeadTag`, `InvulnerableTag`, `GameEntityTag` |
| Buffer element | Event noun or collection item | `DamageEvent`, `AggroEntry`, `PatrolWaypoint` |
| Enableable | State noun (no Tag suffix) | `CCState`, `KnockbackState` |

## Capacity Guidelines

| Buffer Type | Recommended `InternalBufferCapacity` |
|------------|--------------------------------------|
| Events (damage, heal, knockback) | 2-4 (processed+cleared each frame) |
| Tracking (aggro, perceived) | 8-16 (persistent, variable length) |
| Config lists (skills, waypoints) | 4-8 (set at bake, rarely modified) |
| Inventory slots | 0 (use heap, too variable) |

**Rule**: `InternalBufferCapacity` affects chunk size. High values waste memory when most entities use fewer slots.

## Tag vs Enum Dispatch (Critical OCP Pattern)

**BAD — Enum dispatch (violates OCP):**
```csharp
// Adding new class requires modifying THIS system + constants
if (unitClass.Value == UnitClassMelee) { /* melee logic */ }
else if (unitClass.Value == UnitClassRanger) { /* ranger logic */ }
```

**GOOD — Tag dispatch (OCP compliant):**
```csharp
// New class = new system + new tag. Zero existing code changes.
public struct MeleeAttackTag : IComponentData { }
public struct RangedAttackTag : IComponentData { }
// System: .WithAll<MeleeAttackTag>().WithNone<DeadTag>()
```

## Common Mistakes

- Storing `string` or `List<T>` in component → **must be unmanaged** (use `FixedString`, `DynamicBuffer`)
- Using `IEnableableComponent` without `IComponentData` → **must implement both**
- Putting game tuning in `GameplayConstants` → **use per-entity config component** (allows different prefabs)
- Creating `UnitData` mega-component → **split by concern** (Health, Attack, Movement)
- Buffer with no capacity hint → **always set `InternalBufferCapacity`**
