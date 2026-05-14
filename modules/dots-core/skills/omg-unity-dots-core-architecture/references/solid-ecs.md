---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# SOLID Principles for ECS

## S — Single Responsibility

**ECS translation**: Each system performs exactly ONE data transformation. Each component holds ONE concern's data.

| Signal | Problem | Fix |
|--------|---------|-----|
| System > 150 lines | Too many responsibilities | Split into focused systems |
| System imports 5+ namespaces | Touching too many domains | Extract cross-domain logic |
| System has 2+ distinct loops | Multiple passes = multiple concerns | One system per pass |
| Component > 8 fields | Mixed concerns in one struct | Split into Config + State |

**Example violation** (from DOTS RPG):
```
DetectionSystem does BOTH:
  1. Populate PerceivedEntity buffer (perception)
  2. Add/refresh AggroEntry buffer (threat management)
Fix: Extract aggro logic into AggroInitSystem
```

## O — Open/Closed

**ECS translation**: Add new behavior by adding new systems + tag components. Never modify existing systems.

**BAD — Enum dispatch (must modify to extend):**
```csharp
if (unitClass == Melee) { /* ... */ }
else if (unitClass == Ranger) { /* ... */ }
// Adding Healer requires modifying THIS system
```

**GOOD — Tag dispatch (extend without modifying):**
```csharp
// MeleeAttackSystem:  .WithAll<MeleeAttackTag>()
// RangedAttackSystem: .WithAll<RangedAttackTag>()
// HealerSystem:       .WithAll<HealerTag>()  ← NEW system, zero changes
```

**Buffer/Event patterns are inherently OCP:**
- `DamageEvent` buffer: any system can ADD events, `DamageProcessingSystem` consumes ALL
- New damage sources = new producer systems, processor unchanged

## L — Liskov Substitution

**ECS translation**: Component interfaces are respected consistently.

| Interface | Contract | Violation Example |
|-----------|----------|-------------------|
| `IEnableableComponent` | Disabled = inactive, enabled = active | Using disabled to mean "pending" |
| `IBufferElementData` | Add-process-clear pattern | Keeping stale entries across frames |
| `ICleanupComponentData` | Survives destroy, must be explicitly removed | Forgetting cleanup → leaked entities |

**Rule**: If a component implements `IEnableableComponent`, ALL systems must respect the enabled/disabled semantics. Never bypass with `HasComponent` when you should check `IsComponentEnabled`.

## I — Interface Segregation

**ECS translation**: Components are small and focused. No entity carries unused data.

**BAD — Fat component:**
```csharp
struct SkillData : IComponentData {
    float Power, Range, CastTime, Cooldown, ManaCost;     // all types use
    Entity ProjectilePrefab; float ProjectileSpeed;         // projectile only
    float AoERadius, AoEDuration, KnockbackForce;          // AoE only
}
```

**GOOD — Focused components:**
```csharp
struct SkillConfig : IComponentData { float Power, Range, CastTime, Cooldown, ManaCost; }
struct ProjectileConfig : IComponentData { Entity Prefab; float Speed; }    // only on projectile skills
struct AoEConfig : IComponentData { float Radius, Duration, KnockbackForce; } // only on AoE skills
```

**Pragmatic exception**: In ECS, flat data with some unused fields is acceptable when:
- Buffer elements (splitting DynamicBuffer types is costly)
- Fields < 32 bytes unused
- All entities of that archetype use 80%+ of fields

## D — Dependency Inversion

**ECS translation**: Systems depend on component data (abstractions), not concrete implementations or external packages.

**Bridge pattern (gold standard):**
```
[AI Module] writes NavigationTarget     ← abstraction (DOTSRPG.Core)
[Bridge System] reads NavigationTarget, writes AgentBody  ← concrete (ProjectDawn)
[Nav Package] reads AgentBody           ← external
```

**Rules:**
1. Core systems never import external package namespaces
2. Bridge systems are the ONLY coupling point
3. Swapping external package = rewrite bridge only (1-2 files)
4. Bridge system lives in its own asmdef with both dependencies

**Applied to modules:**
```
DOTSRPG.Core (depends on: nothing)
DOTSRPG.Stats (depends on: Core)
DOTSRPG.Combat (depends on: Core, Stats)
DOTSRPG.AI (depends on: Core, Stats, Combat)
DOTSRPG.Navigation (depends on: Core, Combat, ProjectDawn.Navigation)
```

## Quick Audit Checklist

Before submitting any DOTS code, verify:

- [ ] Each system < 150 lines
- [ ] Each component < 8 fields
- [ ] No enum/byte dispatch for behavior routing (use tags)
- [ ] No game tuning values in constants (use config components)
- [ ] No external package imports outside bridge systems
- [ ] All `IEnableableComponent` checked with `IsComponentEnabled`
- [ ] All buffers have `InternalBufferCapacity` set
- [ ] No `SystemAPI.Get*` in nested loops (use `ComponentLookup<T>`)
- [ ] Each module can compile independently (or with explicit deps)
