---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Event Conventions Reference

Three patterns for inter-system communication in the DOTS library. Pick the right pattern based on payload and scope.

---

## Pattern 1: IEnableableComponent Events (stateless one-frame signals)

**When to use:** Signal that something happened — no payload needed.

**Naming:** `*Event` (auto-cleared by cleanup system) or `*DirtyTag` (consumer-cleared after reading).

**Component definition:**
```csharp
public struct LeveledUpEvent : IComponentData, IEnableableComponent { }
```

**Cleanup:** A `*EventCleanupSystem` in the same system group runs `OrderFirst` and disables the component via IJobEntity.

**Examples:** `LeveledUpEvent`, `WaveEvent`, `PhaseTransitionEvent`, `StatsDirtyTag`, `BuildEvent`, `DemolishEvent`, `SummonEvent`, `TalentEvent`, `UpgradeEvent`, `SaveComplete`, `LoadComplete`

---

## Pattern 2: DynamicBuffer Events — Per-Entity (payloaded one-frame queues)

**When to use:** Event with data payload scoped to a single entity (damage amount, knockback direction).

**Naming:** `*Event : IBufferElementData`

**Component definition:**
```csharp
public struct DamageEvent : IBufferElementData
{
    public float Amount;
    public float3 Direction;
    public Entity Source;
}
```

**Cleanup:** Consumer clears the buffer inline after processing, OR a dedicated IJobEntity job calls `buffer.Clear()` at OrderFirst.

**Examples:** `DamageEvent`, `HealEvent`, `KnockbackEvent`, `AudioEvent`, `ScoreEvent`

---

## Pattern 3: DynamicBuffer Events — Singleton (global event queues)

**When to use:** Cross-system global events with typed payloads. One singleton entity holds the buffer.

**Naming:** `EntityEvent` (generic) with `EntityEventType` enum discriminator.

**Component definition:**
```csharp
public struct EntityEvent : IBufferElementData
{
    public Entity Target;
    public EntityEventType Type; // OnDeath, OnSpawn, OnLevelUp, etc.
}
```

**Cleanup:** `CoreEventCleanupSystem` calls `buffer.Clear()` via IJobEntity at OrderFirst in `CoreSystemGroup`.

**Examples:** `EntityEvent` (OnDeath, OnSpawn, OnLevelUp, OnRespawn, etc.)

---

## Adding a New Event — Checklist

1. Define the component (`IComponentData + IEnableableComponent` OR `IBufferElementData`)
2. Add disable/clear job to the appropriate cleanup system — same assembly, same system group, `OrderFirst`
3. If no cleanup system exists for that system group: create `*EventCleanupSystem`
4. Use `JobHandle.CombineDependencies` if adding to a system that already cleans multiple events
5. Write tests — verify the event is disabled/cleared after the cleanup system runs (one-frame lifecycle)
6. Update `dots-rpg` skill system listing if adding a new cleanup system

---

## Convention Rules

| Rule | Detail |
|------|--------|
| Cleanup always uses IJobEntity | Parallel for multi-entity events. `.Run()` only for single-entity events (1-2 max) |
| Cleanup always runs OrderFirst | Exception: `RespawnReadyCleanupSystem` uses OrderLast (must survive one frame) |
| Same assembly as event type | Cross-assembly IJobEntity causes Burst source generation job safety errors — keep cleanup and component in same asmdef |
| `*Request` types are NOT auto-cleared | Consumer disables a `*Request` after processing it — do not add to cleanup systems |
| JobHandle.CombineDependencies | Use when one cleanup system handles multiple event types in parallel |

---

## Cleanup System Map

| Cleanup System | System Group | Events Cleared |
|---------------|-------------|----------------|
| `CoreEventCleanupSystem` | CoreSystemGroup OrderFirst | `EntityEvent` buffer, `AudioEvent` buffer, `SaveComplete`, `LoadComplete` |
| `CombatEventCleanupSystem` | CombatSystemGroup OrderFirst | `BuildEvent`, `DemolishEvent` |
| `BossEventCleanupSystem` | CombatSystemGroup OrderFirst | `PhaseTransitionEvent` (`.Run()` — boss entities are 1-2 max) |
| `SkillsEventCleanupSystem` | SkillsSystemGroup OrderFirst | `SummonEvent`, `TalentEvent` |
| `LeveledUpEventCleanupSystem` | StatsSystemGroup OrderFirst | `LeveledUpEvent` |
| `WaveEventCleanupSystem` | SpawningSystemGroup OrderFirst | `WaveEvent` |
| `UpgradeEventCleanupSystem` | ProgressionSystemGroup OrderFirst | `UpgradeEvent` |
| `PathEndEventCleanupSystem` | NavigationSystemGroup | `PathEndEvent` |
| `RespawnReadyCleanupSystem` | SimulationSystemGroup OrderLast | `RespawnReadyTag` |
