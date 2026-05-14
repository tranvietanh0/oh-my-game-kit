---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# AI — DOTSRPG.AI (with Behavior Designer Pro)

> **Prerequisites:** `dots-ecs-core` (IComponentData, SystemAPI.Query, LocalTransform) · `dots-jobs-burst` (NativeList, Allocator) · `behavior-designer-pro` (BDP task authoring, entity baking)

## 3-Layer Architecture

```
Layer 1: PERCEPTION (AISystemGroup in SimulationSystemGroup)
  ├─ AILeashInitSystem (OrderFirst) → initialize leash
  ├─ DetectionSystem (OrderFirst) → SpatialHashGrid detection
  └─ AggroSystem → threat decay/management

Layer 2: BEHAVIOR (BehaviorTreeSystemGroup in SimulationSystemGroup)
  ├─ 8 Conditional Tasks (check perception state)
  └─ 9 Action Tasks (execute behaviors)
  All Burst-compiled, job-parallel

Layer 3: EXECUTION (other system groups)
  ├─ Navigation (AgentNavigationBridgeSystem, AgentCCOverrideSystem)
  ├─ Combat (AutoAttackSystem, MageAttackSystem)
  └─ Knockback/CC systems
```

## DOTS Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `AIConfig` | `bool RequireLineOfSight` | Opt-in LoS raycast in DetectionSystem |
| `AILeash` | `float3 HomePosition`, `float LeashRadius`, `bool Initialized` | Self-inits on first tick; 0 = no leash |
| `DetectionRange` | `float Range` | Detection radius (360° omnidirectional) |
| `PatrolWaypoint` | `float3 Position`, `float WaitTime` | `IBufferElementData` — used by Patrol action task |
| `PatrolState` | `int CurrentIndex`, `float WaitTimer` | Tracks patrol progress |

**Removed (FSM era):** ~~`AIState`~~, ~~`FleeThreshold`~~, ~~`AIEnums`~~ — replaced by BDP tasks.

## Buffers

| Buffer | Fields | Purpose |
|--------|--------|---------|
| `PerceivedEntity` | `Entity Target, float Distance, float3 Direction, byte TargetTeamId, float TargetHealthPct, float ThreatValue, bool IsVisible` | Rich perception data (rebuilt every frame) |
| `AggroEntry` | `Entity Target`, `float ThreatValue` | Threat tracking (max 16 per entity) |

## DOTS Systems (AISystemGroup)

| System | Order | Behavior |
|--------|-------|----------|
| `AILeashInitSystem` | OrderFirst | Sets `HomePosition` from `LocalTransform` on first tick (`Initialized=false→true`) |
| `DetectionSystem` | OrderFirst | Builds `SpatialHashGrid(20f,200,200)`, clears+rebuilds `PerceivedEntity` buffer, reads existing `AggroEntry.ThreatValue` for perceived threat (read-only) |
| `AggroInitSystem` | `after DetectionSystem`, `before AggroSystem` | Reads `PerceivedEntity` buffer; adds new `AggroEntry` for perceived enemies or refreshes threat floor to 1.0f; capped at 16 entries |
| `AggroSystem` | Default | Decays `ThreatValue` by `dt` per frame; removes entries at 0 or dead targets |

**DetectionSystem detail:** Two-pass architecture:
- **Pass 1**: Populate spatial hash grid with all alive game entities, tagged with `GameEntityTag`.
- **Pass 2**: For each AI entity with `DetectionRange`, query grid cells within radius. Enemy-priority insertion: enemies added directly to `PerceivedEntity` buffer; allies deferred to temp `NativeList`, then fill remaining buffer slots. All visible targets (or non-visibility-required by `AIConfig.RequireLineOfSight`) populated. For each perceived enemy, looks up existing `AggroEntry.ThreatValue` (read-only) to populate `PerceivedEntity.ThreatValue`. LOS raycast performed if `AIConfig.RequireLineOfSight=true` (uses vertical offset + collision filter for raycasting). Aggro ADD/REFRESH responsibility moved to `AggroInitSystem`.

## BDP Conditional Tasks (8)

| Task | Input | Returns |
|------|-------|---------|
| **HasEnemyInRange** | PerceivedEntity buffer | Success if enemy matching team+range (OverrideRange or DetectionRange)+IsVisible |
| **IsHealthBelow** | Health, Threshold | Success if health % < threshold |
| **HasReachedDestination** | NavigationTarget, LocalTransform | Success if within arrival distance |
| **IsLeashed** | AILeash, LocalTransform | Success if distance > LeashRadius |
| **HasAllyNearby** | PerceivedEntity buffer | Success if ally in range |
| **IsTargetDead** | CombatTarget, DeadTag | Success if target dead |
| **HasPatrolWaypoints** | Patrol waypoint buffer | Success if waypoints exist |
| **IsSummonReady** | SummonConfig, SummonState | Success if `CooldownRemaining <= 0 && ActiveCount < MaxActive` |

## BDP Action Tasks (9)

| Task | Output | TaskStatus |
|------|--------|------------|
| **SelectHighestThreat** | Writes CombatTarget (distance tie-break) | Success / Failure (Failure if aggro table empty or all targets destroyed) |
| **SetNavigationToTarget** | Writes NavigationTarget | Running (in engage range) / Success |
| **Patrol** | Writes NavigationTarget, advances PatrolState | Running (loops forever) |
| **Flee** | Writes NavigationTarget (away), clears CombatTarget | Success |
| **ReturnHome** | Writes NavigationTarget (home), clears CombatTarget+AggroEntry | Success |
| **StopMovement** | Writes NavigationTarget.HasTarget=false | Success |
| **ClearCombatTarget** | Writes CombatTarget.Target=Entity.Null | Success |
| **WaitDuration** | None | Running → Success after timeout |
| **EnableSummonRequest** | Calls `SetComponentEnabled(entity, true)` on `SummonRequest` | Success immediately |

## Tree Structure (Melee example)

```
Repeater(RepeatForever=true)
└─ Selector
   ├─ Sequence: IsHealthBelow(20%) → Flee(15f) → WaitDuration(2s)
   ├─ Sequence: HasEnemyInRange → SelectHighestThreat → Inverter(IsTargetDead) → SetNavigationToTarget
   ├─ Sequence: HasPatrolWaypoints → Patrol
   └─ WaitDuration(0.5s) [idle fallback]
```

## Common Patterns

```csharp
// Check enemy in range
var perceived = SystemAPI.GetBuffer<PerceivedEntity>(entity);
bool hasEnemy = false;
for (int i = 0; i < perceived.Length; i++)
    if (perceived[i].TargetTeamId != myTeam && perceived[i].IsVisible) { hasEnemy = true; break; }

// Get highest-threat target (with distance tie-break)
// SelectHighestThreatTaskSystem uses ThreatTieEpsilon (0.1f):
// - Higher threat always wins (beyond epsilon)
// - When threats are within epsilon, closer target wins
var aggro = SystemAPI.GetBuffer<AggroEntry>(entity);
Entity best = Entity.Null; float maxThreat = 0;
for (int i = 0; i < aggro.Length; i++)
    if (aggro[i].ThreatValue > maxThreat) { maxThreat = aggro[i].ThreatValue; best = aggro[i].Target; }

// Increase threat on attack
for (int i = 0; i < aggro.Length; i++)
    if (aggro[i].Target == attacker)
    { aggro[i] = new AggroEntry { Target = attacker, ThreatValue = aggro[i].ThreatValue + 10f }; break; }
```

## Gotchas

- `AILeash.HomePosition` set on **first tick**, not bake time — bake `Initialized = false`
- `PerceivedEntity` buffer rebuilt every frame — cleared at start of each tick
- **PerceivedEntity enemy-priority**: Buffer uses enemy-priority insertion to prevent spatial hash grid iteration order from starving enemy detection. Grid cell iteration is non-deterministic (hash-based). When buffer reaches `MaxPerceivedEntities` (32), remaining entities of that category silently dropped.
- **SpatialHashGrid iteration order**: `GetCellKeys` returns cells left-to-right (x), bottom-to-top (z). `GetValuesForKey` returns entities in non-deterministic order within cell. Any system filling fixed-capacity buffer from grid MUST prioritize important entries (e.g., enemies over allies).
- **AggroEntry cap**: Max 16 entries per entity; excess silently dropped on threat table overflow.
- **InitialThreat constant**: Hardcoded to 1.0f as private const in `AggroInitSystem` (not in `GameplayConstants` — intentional system-local).
- **Distance tie-breaking**: `SelectHighestThreatTaskSystem` uses `ThreatTieEpsilon = 0.1f` — when two threats are within this epsilon, the closer target (by `LocalTransform` distance) wins. This prevents non-deterministic targeting when all enemies start at equal threat.
- Threat decays 1 unit/sec; refresh on re-detection prevents decay-to-zero between frames
- BDP tasks are independent — no shared state between them
- All BDP tasks are Burst-compiled — no managed types
- **System ordering**: `BehaviorTreeSystemGroup` MUST run after `AISystemGroup` and before `NavigationSystemGroup`. Enforced by `BDPAfterPerceptionBridge`/`BDPBeforeNavigationBridge` bridge systems
- **Distance constraint: ChaseDistance >= DetectionRange**: `SetNavigationToTargetTaskSystem` returns Failure when `distSq > ChaseDistance²`. If `ChaseDistance < DetectionRange`, units detect enemies but refuse to chase them → idle in WaitDuration. Similarly `LeashRadius` must cover the full arena diagonal or units abort mid-chase. Rule of thumb: `ChaseDistance ≥ 1.5× DetectionRange`, `LeashRadius ≥ arena diagonal`
