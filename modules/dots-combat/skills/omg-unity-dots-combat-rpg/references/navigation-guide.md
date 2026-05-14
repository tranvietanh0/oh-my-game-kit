---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Navigation — DOTSRPG.Navigation

> **Navigation Backend:** [Agents Navigation](https://lukaschod.github.io/agents-navigation-docs/manual/index.html) (`com.projectdawn.navigation` v4.4.4) provides NavMesh pathfinding, sonar avoidance, and locomotion. DOTSRPG.Navigation bridges AI intent → Agents Nav via `NavigationTarget`.

> **Prerequisites:** `dots-ecs-core` (ISystem, SystemAPI, Baker) · `dots-jobs-burst` (Burst, math, float3) · `agents-navigation` (AgentBody, AgentLocomotion, AgentShape)

## Architecture: Bridge Pattern

```
AI Systems → write NavigationTarget
  ↓
AgentNavigationBridgeSystem → reads NavigationTarget, writes AgentBody.Destination + AgentLocomotion.Speed
  ↓
Agents Navigation (FixedStep) → pathfinding, avoidance, locomotion → writes LocalTransform
  ↓
AgentCCOverrideSystem → applies CC/knockback overrides to AgentBody
```

**Key principle:** AI module stays unchanged (writes `NavigationTarget`). Agents Navigation handles the heavy lifting. CC/knockback still works via override system.

## Systems (NavigationSystemGroup order)

1. **AgentNavigationBridgeSystem** (`OrderFirst`) — reads `NavigationTarget` + `MoveSpeed`, writes `AgentBody.SetDestination()` + `AgentLocomotion.Speed`. Clamps speed non-negative, guards NaN positions. Filters: `[WithAll(Agent)]`, `[WithNone(DeadTag)]`.
2. **CrowdGroupAssignmentSystem** — assigns `AgentCrowdPath.Group` to entities with `AgentCrowdPath.Group == Entity.Null` based on `TeamId`. Builds `NativeHashMap<byte, Entity>` from `TeamCrowdGroup` singletons each frame (or on change). Required because prefabs can't reference SubScene CrowdGroup GameObjects at bake time.
3. **AgentCCOverrideSystem** (`OrderLast`) — reads `CCState`, `KnockbackState`, overrides `AgentBody` (Stop/Velocity) and `AgentLocomotion.Speed` (slow, clamped 0..1). Filters: `[WithAll(Agent)]`, `[WithNone(DeadTag)]`.

### Agents Navigation Internal Systems (FixedStepSimulationSystemGroup)

Run automatically via `AgentSystemGroup`:
- **AgentSeekingSystem** — calculates force toward destination
- **AgentSonarAvoidSystem** — cone-based local avoidance between agents
- **AgentLocomotionSystem** — applies velocity, acceleration, angular speed to transform
- **NavMeshPathSystem** — queries NavMesh for pathfinding around obstacles

## Components (RPG Bridge — written by DOTSRPG systems)

| Component | Namespace | Purpose |
|-----------|-----------|---------|
| `NavigationTarget` | DOTSRPG.Core | AI→Navigation bridge: `Position` + `HasTarget` |
| `MoveSpeed` | DOTSRPG.Core | RPG stat-derived speed, synced to `AgentLocomotion.Speed` |
| `MoveDirection` | DOTSRPG.Core | Used by projectile systems only (not by unit navigation) |

## Components (Agents Navigation — baked by NavigationAuthoring)

| Component | Purpose |
|-----------|---------|
| `Agent` | Tag component with `NavigationLayers` |
| `AgentBody` | Runtime state: `Destination`, `Velocity`, `Force`, `IsStopped` |
| `AgentLocomotion` | Config: `Speed`, `Acceleration`, `AngularSpeed`, `StoppingDistance` |
| `AgentShape` | `Radius`, `Height`, `ShapeType` (Cylinder for 3D) |
| `AgentSonarAvoid` | Local avoidance: `Radius`, `Angle`, `MaxAngle` (enableable) |
| `AgentCollider` | Physical displacement via spatial BVH (enableable, NOT O(N²)) |
| `NavMeshPath` | NavMesh pathfinding state (enableable) |
| `AgentCrowdPath` | `ISharedComponentData` — links agent to CrowdGroup entity; `Group = Entity.Null` until `CrowdGroupAssignmentSystem` runs |

## Components (DOTSRPG.Navigation — Crowd Assignment)

| Component | Namespace | Purpose |
|-----------|-----------|---------|
| `TeamCrowdGroup` | DOTSRPG.Navigation | On CrowdGroup entities: `byte TeamId` — maps team to crowd group for runtime binding |

## NavigationAuthoring Baker

```csharp
public class NavigationAuthoring : MonoBehaviour
{
    // Movement
    [Min(0f)] public float MoveSpeed = 5f;

    // Agent Shape
    [Min(0.01f)] public float AgentRadius = 0.5f;
    [Min(0.1f)] public float AgentHeight = 2f;

    // Locomotion
    public float Acceleration = 8f;
    public float AngularSpeed = 120f;
    public float StoppingDistance = 0.1f;
    public bool AutoBreaking = true;

    // Sonar Avoidance
    public bool EnableSonarAvoidance = true;
    [Min(0f)] public float SonarRadius = 2f;      // Use 1.0f for 2K+ units

    // Physical Collider Avoidance (spatial BVH, NOT O(N²))
    public bool EnableAgentCollider = false;        // Enable for anti-overlap at scale

    // NavMesh Pathfinding
    public bool EnableNavMeshPathing = true;

    // Crowds (com.projectdawn.navigation.crowds)
    public bool EnableCrowdNavigation = false;      // Assigned at runtime by CrowdGroupAssignmentSystem
    public GameObject CrowdGroupReference;          // Optional prefab-time binding (usually null for SubScene groups)
}
// Bakes: MoveSpeed, MoveDirection, NavigationTarget,
//        Agent, AgentBody, AgentLocomotion, AgentShape,
//        AgentSonarAvoid (optional), AgentCollider (optional),
//        NavMeshPath + NavMeshNode buffer (optional), AgentCrowdPath (optional)
```

## CC Override Logic (AgentCCOverrideSystem)

Priority order (highest blocks further checks):

```
KnockbackState enabled → body.Velocity = kb.Velocity * decay; body.IsStopped = false
CCState enabled:
  (Stun | Root | Freeze) → body.Stop()
  Slow → locomotion.Speed *= math.clamp(cc.SlowFactor, 0, 1)
```

## Usage Examples

**AI systems write NavigationTarget — bridge handles the rest:**
```csharp
navTarget.ValueRW.Position = enemyPosition;
navTarget.ValueRW.HasTarget = true;
// AgentNavigationBridgeSystem automatically calls body.SetDestination(position)
// and syncs locomotion.Speed = moveSpeed.Value
```

**Stop navigation:**
```csharp
navTarget.ValueRW.HasTarget = false;
// AgentNavigationBridgeSystem calls body.Stop()
```

**Apply knockback (unchanged from before):**
```csharp
var kbBuf = SystemAPI.GetBuffer<KnockbackEvent>(entity);
kbBuf.Add(new KnockbackEvent
{
    Direction = math.normalize(targetPos - sourcePos),
    Force = 8f,
    Duration = 0.5f
});
// AgentCCOverrideSystem reads KnockbackState and overrides AgentBody.Velocity
```

## Gotchas

- `NavigationAuthoring` bakes BOTH RPG primitives (MoveSpeed, NavigationTarget) AND Agents Nav components — do NOT add `AgentAuthoring` separately
- Old systems (PathFollowSystem, SteeringSystem, MovementSystem) are deleted — they no longer exist
- `MoveDirection` is only used by projectile systems (LinearProjectileSystem, HomingSystem) — NOT by unit navigation
- `SlowFactor` is a multiplier: `1.0 = full speed`, `0.5 = half speed`, `0.0 = stopped`
- `AgentSonarAvoid` prevents units from stacking — always enable it for crowd units
- `AgentSonarAvoid.Radius`: reduce to **1.0f** for 2K+ units — default 2.0f causes excessive CPU overlap at scale
- `AgentCrowdPath.Group` is `Entity.Null` until `CrowdGroupAssignmentSystem` runs — units default to individual NavMesh steering on first frames
- `AgentCrowdPath` is `ISharedComponentData` — batch-set via `EntityManager` (outside jobs); structural change invalidates chunk layout
- `AgentCollider` is spatial-partitioned (BVH), NOT O(N²) — safe to enable for all units at 2K+ scale
- Clear `Library/EntityScenes/` cache after SubScene changes to avoid stale baked data
