---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# DOTS RPG Integration — Behavior Designer Pro

> **Prerequisites:** `dots-rpg` skill (RPG systems) · `dots-ecs-core` (ECS fundamentals)

## Assembly & Namespace

**DOTSBDP** — 17 BDP task implementations at `Packages/com.the1studio.dots-bdp/Runtime/`:

```
BehaviorTrees/
├── Conditionals/
│   ├── HasEnemyInRange/          (5 files: task + system + reevaluate)
│   ├── IsHealthBelow/
│   ├── HasReachedDestination/
│   ├── IsLeashed/
│   ├── HasAllyNearby/
│   ├── IsTargetDead/
│   ├── HasPatrolWaypoints/
│   └── IsSummonReady/            (4 files: task + system, no reevaluate)
├── Actions/
│   ├── SelectHighestThreat/      (4 files: task + system)
│   ├── SetNavigationToTarget/
│   ├── Patrol/
│   ├── Flee/
│   ├── ReturnHome/
│   ├── StopMovement/
│   ├── ClearCombatTarget/
│   ├── WaitDuration/
│   └── EnableSummonRequest/      (4 files: task + system)
├── BDPSystemOrderingBridge.cs
└── DOTSBDP.asmdef
```

## Conditional Tasks (8)

| Task | Reads | Outputs |
|------|-------|---------|
| **HasEnemyInRange** | PerceivedEntity, DetectionRange, TeamId | Success if visible enemy in range |
| **IsHealthBelow** | Health, Threshold | Success if health % < threshold |
| **HasReachedDestination** | NavigationTarget, LocalTransform | Success if within arrival distance |
| **IsLeashed** | AILeash, LocalTransform | Success if distance > LeashRadius |
| **HasAllyNearby** | PerceivedEntity buffer | Success if any ally in range |
| **IsTargetDead** | CombatTarget, DeadTag | Success if target dead |
| **HasPatrolWaypoints** | Patrol waypoints buffer | Success if waypoints exist |
| **IsSummonReady** | SummonConfig, SummonState | Success if `CooldownRemaining <= 0 && ActiveCount < MaxActive` |

## Action Tasks (9)

| Task | Writes | TaskStatus |
|------|--------|-----------|
| **SelectHighestThreat** | CombatTarget | Success on selection |
| **SetNavigationToTarget** | NavigationTarget | Success/Running |
| **Patrol** | NavigationTarget, PatrolState | Running indefinitely |
| **Flee** | NavigationTarget (away from enemy), CombatTarget | Success immediately. Defaults to `(0,0,-1)` direction if enemy at exact same position (zero-distance guard) |
| **ReturnHome** | NavigationTarget, CombatTarget, AggroEntry | Success immediately |
| **StopMovement** | NavigationTarget.HasTarget | Success immediately |
| **ClearCombatTarget** | CombatTarget | Success immediately |
| **WaitDuration** | None | Running → Success on timeout |
| **EnableSummonRequest** | `SummonRequest` (SetComponentEnabled=true) | Success immediately |

## 3-Layer Architecture

System ordering enforced by `BDPSystemOrderingBridge.cs`:

```
Layer 1: PERCEPTION (AISystemGroup)
  └─ DetectionSystem, AggroSystem → writes PerceivedEntity + AggroEntry
      ↓ [BDPAfterPerceptionBridge]

Layer 2: BEHAVIOR (BehaviorTreeSystemGroup)
  └─ BDP Task Systems read perception, write decisions
      ↓ [BDPBeforeNavigationBridge]

Layer 3: EXECUTION (Navigation + Combat)
  └─ Consume NavigationTarget + CombatTarget
```

> **Critical**: Without ordering bridges, BDP may read stale perception data.
> Bridge systems are empty ISystem structs creating transitive ordering edges.

## Data Flow (enemy detection → combat)

1. `DetectionSystem` populates `PerceivedEntity` buffer
2. `HasEnemyInRange?` reads buffer → Success
3. `SelectHighestThreat` reads `AggroEntry` → writes `CombatTarget`
4. `SetNavigationToTarget` reads `CombatTarget` → writes `NavigationTarget`
5. `AgentNavigationBridgeSystem` reads `NavigationTarget` → moves unit
6. `AutoAttackSystem` reads `CombatTarget` → attacks when in range

## Common Task Patterns

**ComponentLookup caching (all 17 tasks follow this pattern):**
```csharp
// In ISystem struct:
ComponentLookup<SomeComponent> _lookup;

public void OnCreate(ref SystemState state)
{
    _lookup = state.GetComponentLookup<SomeComponent>(isReadOnly: true);
}

public void OnUpdate(ref SystemState state)
{
    _lookup.Update(ref state); // MUST call every frame before scheduling job
    // ... schedule job passing _lookup
}
```

**Conditional (perception buffer check):**
```csharp
bool found = false;
for (int p = 0; p < perceived.Length; ++p)
{
    var pe = perceived[p];
    if (pe.TargetTeamId != myTeam && pe.Distance <= range && pe.IsVisible)
    { found = true; break; }
}
task.Status = found ? TaskStatus.Success : TaskStatus.Failure;
```

**Action (navigation write):**
```csharp
var navTarget = new NavigationTarget { Position = targetPos, HasTarget = true };
```

**Reevaluation (conditional abort):**
```csharp
public ComponentType ReevaluateFlag => typeof(IsLeashedReevaluateFlag);
```
