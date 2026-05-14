---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Core — DOTSRPG.Core

> **Prerequisites:** `dots-ecs-core` (IComponentData, ISystem, Baker, SystemAPI) · `dots-jobs-burst` (NativeList, Burst, math)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `GameEntityTag` | — | Marks entity as game entity for archetype filtering |
| `RangedAttackTag` | — | Marks entity as using ranged (projectile) auto-attacks; causes `AutoAttackSystem` to skip entity; `RangedAttackSystem` processes entities with this tag |
| `MageAttackTag` | — | Marks entity as using AOE magic auto-attacks; causes `AutoAttackSystem` to skip entity; `MageAttackSystem` processes entities with this tag |
| `HitFlashTimer` | `float Remaining, Duration, OriginalScale` | Scale pulse on damage; animated by `HitFlashAnimateSystem` |
| `Lifetime` | `float RemainingTime` | Destroyed by `LifetimeSystem` when reaches 0 |
| `MoveDirection` | `float3 Direction` | Normalized; set by Steering, consumed by MovementSystem |
| `MoveSpeed` | `float Value` | Scalar; synced from `DerivedStats.MoveSpeed` by `StatSyncSystem` |
| `NavigationTarget` | `float3 Position`, `bool HasTarget` | Set by AI; consumed by Navigation systems |
| `TeamId` | `byte Value` | Burst-compatible team identifier; `255` = no team |
| `OriginalSpriteColor` | `float4 Value` | Baked copy of `SpriteColor` at authoring time (via `SpriteAnimationBaker`). Read by `StatusEffectTintSystem` for tint blending and restoration. Never write at runtime — treat as read-only |

**Deleted components (do NOT use):**
- ~~`DisabledTag`~~ — Unity has built-in `Disabled` tag; use that instead
- ~~`UnitClass`~~ — replaced by `RangedAttackTag`/`MageAttackTag` tag dispatch
- ~~`PathBuffer`~~, ~~`PathState`~~, ~~`SteeringWeights`~~, ~~`WanderState`~~, ~~`NavigationEnums`~~ — old steering system deleted, replaced by Agents Navigation

## System Groups (SimulationSystemGroup order)

```
CoreSystemGroup        (OrderFirst)
StatsSystemGroup       (after Core)
AISystemGroup          (after Stats)
NavigationSystemGroup  (after AI)
SkillsSystemGroup      (after Navigation)
CombatSystemGroup      (after Skills)
InventorySystemGroup   (after Combat)
SpawningSystemGroup    (OrderLast)
```

## Systems

**LifetimeSystem** (`CoreSystemGroup`) — schedules `LifetimeJob` parallel; subtracts `DeltaTime` from `RemainingTime`, calls `Ecb.DestroyEntity` when <= 0.

**HitFlashAnimateSystem** (`CoreSystemGroup`) — ticks `HitFlashTimer.Remaining` each frame; scales entity with `OriginalScale * (1 + sin(t*PI) * HitFlashScaleAmount)`; resets scale when timer expires.

## Utilities

### GameplayConstants

| Constant | Value | Purpose |
|----------|-------|---------|
| `DirectionEpsilon` | `0.0001f` | float3 zero-vector check threshold |
| `NoTeam` | `255` | Sentinel for no team affiliation |
| `AutoAttackSkillId` | `-1` | Sentinel for non-skill damage |
| `MinAtkSpeed` | `0.1f` | Prevents div-by-zero in cooldown calc |
| `OverlapEpsilon` | `0.01f` | Proximity/overlap checks |
| `PermanentModifierDuration` | `-1f` | Equipment stat modifier sentinel |
| `DefenseScale` | `100f` | Armor formula divisor |
| `WaypointArrivalSq` | `1f` | Squared arrival distance for waypoints |
| `HitRadiusSq` | `1f` | Squared hit radius for projectiles |
| `HitFlashDuration` | `0.15f` | Seconds for hit flash scale pulse |
| `HitFlashScaleAmount` | `0.15f` | Scale overshoot multiplier for flash |
| `DeathAnimationDuration` | `0.5f` | Seconds for death shrink animation |
| `MageDomainSalt` | `0xCC` | RNG domain differentiator for mage damage |
| `ParabolicArcScalar` | `4f` | `4*t*(1-t)` reaches 1.0 at t=0.5 (math constant) |
| `ArcTangentStep` | `0.01f` | Time step for arc tangent approximation (math constant) |
| `CapsulePitchOffsetRad` | `π/2` | Capsule rotation offset (math constant) |
| `DefaultAoETickInterval` | `0.5f` | AOE damage tick rate authoring default |
| `MaxPerceivedEntities` | `32` | Max entities in perception buffer |
| `DefaultFleeDistance` | `10f` | Default flee distance for AI flee behavior |

### SpatialHashGrid
Burst-compatible spatial partitioning via `NativeParallelMultiHashMap<int, Entity>`.

```csharp
// Lifecycle
var grid = new SpatialHashGrid(cellSize: 20f, capacity: 1024, Allocator.Persistent);
grid.Dispose(); // or grid.Dispose(jobHandle)

// Usage
grid.Clear();
grid.Add(position, entity);
int hash = grid.Hash(position);
var enumerator = grid.GetValuesForKey(hash);

// Radius query — get all cell keys overlapping a circle
// NOTE: Use GetCellKeysStatic for job compatibility (instance GetCellKeys was deleted)
var keys = new NativeList<int>(16, Allocator.Temp);
SpatialHashGrid.GetCellKeysStatic(center, radius, grid.CellSize, keys);
for (int k = 0; k < keys.Length; k++)
{
    var e = grid.GridMap.GetValuesForKey(keys[k]);
    while (e.MoveNext()) { /* e.Current = Entity */ }
}

// Parallel write
grid.AsParallelWriter().Add(position, entity);
```

**SpatialHashGrid Gotchas:**
- **GetCellKeys deleted**: The instance `GetCellKeys()` method was removed. Use `GetCellKeysStatic(center, radius, cellSize, keys)` with `grid.CellSize` and `grid.GridMap` properties exposed for job access.
- **Cell iteration order**: `GetCellKeysStatic` iterates x from minX to maxX, z from minZ to maxZ (left-to-right, bottom-to-top).
- **Entity order within cells**: `GridMap.GetValuesForKey` returns entities in non-deterministic order within each cell (`NativeParallelMultiHashMap` hashing).
- **Duplicate visits possible**: Entity radius may overlap multiple cells; callers should handle dedup if needed.
- **Capacity auto-resize**: If more entities exist than initial capacity, hashmap resizes automatically.
- **Cell size trade-off**: Too small = many cells per query; too large = more entities per cell to check (spatial locality decreases).

## Usage Examples

**Add Lifetime to a spawned entity:**
```csharp
ecb.AddComponent(entity, new Lifetime { RemainingTime = 5f });
```

**Team filtering in query:**
```csharp
foreach (var (teamId, ...) in SystemAPI.Query<RefRO<TeamId>, ...>())
{
    if (teamId.ValueRO.Value == myTeam) continue; // skip friendlies
}
```

**Toggle entity without structural change:**
```csharp
SystemAPI.SetComponentEnabled<DisabledTag>(entity, true);  // disable
SystemAPI.SetComponentEnabled<DisabledTag>(entity, false); // re-enable
```

## Gotchas

- `TeamData` was removed — use `TeamId` (unmanaged `IComponentData`) for all team identification.
- `SpatialHashGrid` must be `Dispose()`d in `OnDestroy`; it allocates `Persistent` memory.
- `MoveSpeed.Value` is overwritten every frame by `StatSyncSystem` — do not cache it.
- `NavigationTarget.HasTarget = false` is the signal to stop — don't just zero `Position`.
- `UnitClass` was deleted — use `RangedAttackTag`/`MageAttackTag` for role dispatch.
- `DisabledTag` was deleted — Unity has a built-in `Disabled` component; toggle via `EntityManager.SetEnabled()` or ECB.
- `MathUtilities.SafeNormalize` was deleted — use `math.normalizesafe(v)` directly (built-in Burst math).
- `HitFlashTimer` must be initialized with `OriginalScale` at spawn time — `HitFlashAnimateSystem` restores this scale when the timer expires.
