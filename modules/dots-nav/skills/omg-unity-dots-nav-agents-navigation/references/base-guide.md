---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# Base Package — ProjectDawn.Navigation (com.projectdawn.navigation v4.4.4)

> **Prerequisites:** `dots-ecs-core` (IComponentData, ISystem, Baker) · `dots-jobs-burst` (Jobs, Burst, NativeContainers)

## Assembly Structure

| Assembly | Purpose |
|----------|---------|
| `ProjectDawn.Navigation` | Core ECS components, systems, system groups |
| `ProjectDawn.Navigation.Hybrid` | MonoBehaviour authoring + runtime bridge |
| `ProjectDawn.Navigation.Astar` | A* pathfinding extension |
| `ProjectDawn.LocalAvoidance` | Local avoidance math utilities |
| `ProjectDawn.ReciprocalAvoidance` | RVO-based reciprocal avoidance |

## Core Components

### Agent Identity & Motion

| Component | Key Fields | Notes |
|-----------|------------|-------|
| `Agent` | `NavigationLayers Layers` | Required tag on all agent entities |
| `AgentBody` | `float3 Force/Velocity/Destination`, `float RemainingDistance`, `bool IsStopped` | `SetDestination(float3)`, `Stop()` helpers |
| `AgentShape` | `float Radius/Height`, `ShapeType Type` | `Circle`=2D, `Cylinder`=3D |
| `AgentLocomotion` | `float Speed/Acceleration/AngularSpeed/StoppingDistance`, `bool AutoBreaking` | Replaces deprecated `AgentSteering` |

### Pathfinding

| Component | Key Fields | Notes |
|-----------|------------|-------|
| `NavMeshPath` | `NavMeshPathState State`, `int AgentTypeId/AreaMask`, `bool AutoRepath` | `IEnableableComponent`; `HasFullPath`, `HasPartialPath` props |
| `NavMeshNode` | `PolygonId Value` | `IBufferElementData` — path polygon buffer |
| `NavMeshAreaCost` | `float Value` | 32-element buffer for per-area cost overrides |
| `NavMeshBoundary` | `NavMeshLocation Location`, `float Radius` | Wall-query for sonar avoidance |
| `NavMeshWall` | `float3 Start/End` | NavMesh edge walls for sonar avoidance |
| `LinkTraversal` | — | `IEnableableComponent` — enabled during off-mesh link traversal |

### Avoidance, Separation & Grounding

| Component | Key Fields | Notes |
|-----------|------------|-------|
| `AgentSonarAvoid` | `float Radius/Angle/MaxAngle`, `SonarAvoidMode Mode` | `IEnableableComponent`; toggleable cone avoidance |
| `AgentSeparation` | `float Radius/Weight`, `NavigationLayers Layers` | `IEnableableComponent`; push-apart force |
| `AgentCollider` | `NavigationLayers Layers` | `IEnableableComponent`; physical collider tag |
| `AgentReciprocalAvoid` | `float Radius`, `NavigationLayers Layers` | RVO-based avoidance |
| `AgentGrounding` | `LayerMask Layers` | `IEnableableComponent`; snaps Y to physics surface |
| `AgentSmartStop` | `HiveMindStop`, `GiveUpStop` | `IEnableableComponent`; intelligent crowd stop |

### Flocking

| Component | Key Fields | Notes |
|-----------|------------|-------|
| `FlockGroup` | `Entity LeaderEntity`, `float Radius/Cohesion/Alignment` | One entity acts as flock leader |
| `FlockEntity` | `Entity Value` | `IBufferElementData` — member list on flock group |

## Enums

| Enum | Values |
|------|--------|
| `ShapeType` | `Circle` (2D/Z-up), `Cylinder` (3D/Y-up) |
| `NavigationLayers` | Flags: `None`, `Default`, `Layer1`…`Layer31`, `Everything` |
| `NavMeshPathState` | `WaitingNewPath`, `InProgress`, `FinishedFullPath`, `FinishedPartialPath`, `Failed`, `InValid` |
| `SonarAvoidMode` | `Default`, `IgnoreBehindAgents` (recommended) |
| `Grounded` | `None`, `XYZ`, `XZ` |

## System Groups (AgentSystemGroup)

Runs in `FixedStepSimulationSystemGroup` (before physics). Define `AGENTS_NAVIGATION_REGULAR_UPDATE` for `SimulationSystemGroup`.

```
AgentSystemGroup
  AgentSpatialSystemGroup → AgentActionSystemGroup → AgentSeekingSystemGroup
    → AgentPathingSystemGroup → AgentForceSystemGroup → AgentLocomotionSystemGroup
      → AgentDisplacementSystemGroup
```

## Key Systems

| System | Group | Responsibility |
|--------|-------|----------------|
| `AgentSpatialPartitioningSystem` | Spatial | BVH tree for agent lookups |
| `NavMeshQuerySystem` | Pathing | Async NavMesh path queries (singleton) |
| `NavMeshPathSystem` | Pathing | Issues/polls paths; writes NavMeshNode buffer |
| `NavMeshSteeringSystem` | Seeking | Samples next waypoint; writes AgentBody.Force |
| `NavMeshDisplacementSystem` | Displacement | Snaps agent to NavMesh surface |
| `AgentSonarAvoidSystem` | Force | Sonar cone avoidance force |
| `AgentSeparationSystem` | Force | Separation push force |
| `AgentLocomotionSystem` | Locomotion | Moves transform; braking, rotation |
| `AgentGroundingSystem` | Displacement | Physics raycast Y-snap |

## Authoring (ProjectDawn.Navigation.Hybrid)

| MB Authoring | ECS Result |
|-------------|------------|
| `AgentAuthoring` | `Agent` + `AgentBody` + `AgentLocomotion` |
| `AgentNavMeshAuthoring` | `NavMeshPath` + `NavMeshNode` buffer |
| `AgentAvoidAuthoring` | `AgentSonarAvoid` (+ boundary/wall if UseWalls) |
| `AgentSeparationAuthoring` | `AgentSeparation` |
| `AgentColliderAuthoring` | `AgentCollider` |
| `AgentGroundingAuthoring` | `AgentGrounding` |
| `AgentSmartStopAuthoring` | `AgentSmartStop` |
| `FlockGroupAuthoring` | `FlockGroup` + `FlockEntity` buffer |

## Runtime Usage

```csharp
// Set destination
SystemAPI.GetComponentRW<AgentBody>(entity).ValueRW.SetDestination(targetPos);
// Stop agent
SystemAPI.GetComponentRW<AgentBody>(entity).ValueRW.Stop();
// Toggle avoidance
SystemAPI.SetComponentEnabled<AgentSonarAvoid>(entity, false);
// Check path status
if (SystemAPI.GetComponent<NavMeshPath>(entity).HasFullPath) { /* ready */ }
// MonoBehaviour bridge (deferred, thread-safe)
agentAuthoring.SetDestinationDeferred(targetPosition);
```

## Terrain Integration (AgentGrounding)

`AgentGrounding` is **required** when using procedural terrain or any surface with elevation. Without it, agents stay at their spawn Y and clip through terrain.

**How it works:** `AgentGroundingSystem` (in `AgentDisplacementSystemGroup`) does a physics raycast downward per agent, snapping `LocalTransform.Position.y` to the hit surface.

**Setup in this project:**
- `NavigationAuthoring` (dots-rpg) bakes `AgentGrounding` when `EnableGrounding = true` (default)
- `GroundingLayers` defaults to `Everything` (`~0`) — covers Default layer where terrain mesh lives
- `NavMeshSurface` must use `CollectObjects.Volume` (not `Children`) when terrain mesh is on the root GO
- Only ONE `NavMeshSurface` should exist per scene — remove stale ones from old "Ground" GOs

**Gotcha:** If using `CollectObjects.Volume`, set `surface.size` and `surface.center` to cover the full arena. If using `CollectObjects.Children`, the root GO's own MeshCollider is excluded from the bake.

## Gotchas

- `AgentSteering` is obsolete — use `AgentLocomotion`
- `NavMeshPath.State == Finished` is obsolete — check `FinishedFullPath`/`FinishedPartialPath`
- `AgentSystemGroup` runs in `FixedStepSimulationSystemGroup`, not `SimulationSystemGroup`
- `AgentShape.Type` determines rotation axis: `Cylinder`=Y, `Circle`=Z
- Minimum agent components: `Agent` + `AgentBody` + `AgentLocomotion` + `AgentShape`
- NavMesh area costs require `m_OverrideAreaCosts = true` in `AgentNavMeshAuthoring`
- **AgentGrounding required for terrain** — without it, agents ignore Y height changes and clip through elevated surfaces
- **Single NavMeshSurface** — multiple NavMeshSurface components in one scene cause erratic pathfinding; remove duplicates
