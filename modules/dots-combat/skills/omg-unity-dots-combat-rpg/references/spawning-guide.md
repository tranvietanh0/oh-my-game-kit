---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Spawning — DOTSRPG.Spawning

> **Prerequisites:** `dots-ecs-core` (IComponentData, Baker, ECB, entity instantiation) · `dots-jobs-burst` (Burst, math — for formation calculations)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `FormationSpawnerConfig` | `Entity Prefab`, `int Count, Columns`, `byte TeamId, UnitClass`, `float3 SpawnCenter, SpawnForward`, `float Spacing`, `bool HasSpawned` | One-shot grid spawner; entity destroyed after spawn |
| `SpawnerConfig` | `Entity Prefab`, `float Interval`, `int MaxActive, SpawnedCount`, `float3 SpawnCenter`, `float SpawnRadius` | `SpawnedCount` maintained by `SpawnCleanupSystem` |
| `SpawnTimer` | `float Elapsed` | Ticked by `SpawnTimerSystem`; decremented by `Interval` on each spawn |
| `SpawnedBy` | `Entity Spawner` | On spawned entity; back-reference to spawner |
| `Respawn` | `float Delay, Elapsed`, `float3 RespawnPosition`, `bool Enabled, Initialized` | `RespawnPosition` self-inits on first tick |

## Cleanup Component

| Component | Fields | Notes |
|-----------|--------|-------|
| `SpawnedCleanup` | `Entity Spawner` | `ICleanupComponentData`; survives entity destruction; triggers `SpawnCleanupSystem` to decrement count |

## Systems (SpawningSystemGroup — OrderLast)

1. **SpawnTimerSystem** (`OrderFirst`) — parallel `SpawnTimerJob`; increments `SpawnTimer.Elapsed` each frame.
2. **SpawnSystem** (`after Timer`) — if `SpawnedCount < MaxActive` and `Elapsed >= Interval`: subtract `Interval` from `Elapsed`, increment `SpawnedCount`, instantiate prefab at `SpawnCenter + randomOffset`, add `SpawnedBy` + `SpawnedCleanup`.
3. **FormationSpawnerSystem** — one-shot grid spawner; runs when `HasSpawned == false`. Lays out `Count` units in a grid of `Columns` columns, spacing by `Spacing`. Sets `TeamId`, `UnitClass`, `HitFlashTimer`, `GameEntityTag` on each spawned unit. Destroys spawner entity after firing.
4. **SpawnCleanupSystem** (`after SpawnSystem`) — queries `SpawnedCleanup` without `SpawnedBy` (entity destroyed); decrements spawner's `SpawnedCount`; removes `SpawnedCleanup`; destroys entity remainder.
5. **RespawnSystem** (`after Cleanup`) — init pass sets `RespawnPosition` from current position; respawn pass counts `Elapsed` while dead, triggers respawn when `Elapsed >= Delay`.

## Respawn Reset Sequence

When `Respawn.Elapsed >= Delay`, `RespawnSystem` executes in order:

```
1. Reset Elapsed = 0
2. health.Current = health.Max                          // full HP restore
3. mana.Current = mana.Max (if Mana component)         // full MP restore
4. transform.Position = RespawnPosition                 // teleport
5. Disable DeadTag                                      // alive again
6. StatusEffect buffer.Clear() (if present)            // remove all status effects
7. Disable CCState (if present)                        // clear CC
8. Disable KnockbackState (if present)                 // clear knockback
9. CombatTarget = Entity.Null (if present)             // clear target
10. NavigationTarget = { HasTarget = false } (if present)
11. (AI state reset handled by behavior tree on respawn) // BDP manages AI state
12. AggroEntry buffer.Clear() (if present)             // clear aggro
13. Disable LootDroppedTag (IEnableableComponent)      // allow loot on next death
```

## Usage Examples

**Set up a spawner:**
```csharp
// Baker
AddComponent(entity, new SpawnerConfig
{
    Prefab = GetEntity(prefabAuthoring, TransformUsageFlags.Dynamic),
    Interval = 5f,
    MaxActive = 10,
    SpawnedCount = 0,
    SpawnCenter = float3.zero,
    SpawnRadius = 8f   // random within 8m of spawner
});
AddComponent(entity, new SpawnTimer { Elapsed = 0f });
```

**Set up entity respawn:**
```csharp
// Baker — add to character entities
AddComponent(entity, new Respawn
{
    Delay = 10f,          // 10 second respawn timer
    Elapsed = 0f,
    RespawnPosition = float3.zero, // overwritten by RespawnSystem on first tick
    Enabled = true,
    Initialized = false   // RespawnSystem will set position on first tick
});
```

**Check spawner status at runtime:**
```csharp
var config = SystemAPI.GetComponent<SpawnerConfig>(spawnerEntity);
int activeCount = config.SpawnedCount;
bool atCap = config.SpawnedCount >= config.MaxActive;
```

**Disable respawn (permanent death):**
```csharp
var respawn = SystemAPI.GetComponentRW<Respawn>(entity);
respawn.ValueRW.Enabled = false;
```

## Gotchas

- `SpawnedCleanup` is `ICleanupComponentData` — it persists after `DestroyEntity` until explicitly removed. `SpawnCleanupSystem` detects destroyed spawned entities by querying `SpawnedCleanup` without `SpawnedBy`.
- `SpawnTimer.Elapsed` is decremented by `Interval` (not reset to 0) — multiple spawns can occur in one frame if `Elapsed` accumulated past `2 * Interval`.
- `Respawn.RespawnPosition` is set from the entity's position on the **first simulation tick**, not at bake time — `Initialized = false` in baker.
- `LootDroppedTag` is `IEnableableComponent` — toggled via `SetComponentEnabled`, no structural changes. `InventoryRespawnResetSystem` disables it on respawn.
- `SpawnRadius = 0` spawns exactly at `SpawnCenter` — RNG is only invoked when `SpawnRadius > 0`.
- `SpawnedCount` can drift if you manually destroy spawned entities without their `SpawnedCleanup` being processed — always keep `SpawnedBy` + `SpawnedCleanup` paired.
- `FormationSpawnerConfig.HasSpawned` is set to `true` before the ECB runs — the spawner entity is destroyed at end of frame, not immediately.
- `FormationSpawnerSystem` reads the prefab's `LocalTransform.Scale` to preserve it on spawned units — ensure the prefab is baked before this system runs.
- `FormationSpawnerConfig.SpawnForward` must not be parallel to `(0,1,0)` — the system uses `cross(up, forward)` to compute right; zero result falls back to `(1,0,0)`.
