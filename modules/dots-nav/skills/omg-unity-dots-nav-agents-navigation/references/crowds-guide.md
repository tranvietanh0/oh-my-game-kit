---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# Crowds Extension — ProjectDawn.Navigation (com.projectdawn.navigation.crowds v1.2.0 / base v4.4.4)

> **Prerequisites:** `dots-ecs-core` (IComponentData, ISystem, ISharedComponentData, Baker) · `dots-jobs-burst` (Jobs, Burst, NativeContainers)

---

## Components (ProjectDawn.Navigation)

### Surface & Group

| Component | Interface | Key Fields | Notes |
|-----------|-----------|------------|-------|
| `CrowdSurface` | `IComponentData` | `float2 Size`, `int Width`, `int Height`, `float Density`, `float Slope`, `LayerMask Layers` | Defines walkable grid; Width×Height = cell count |
| `CrowdSurfaceData` | `ISharedComponentData` | `CrowdData Asset` | References baked CrowdData asset; shared across surface entities |
| `CrowdSurfaceWorld` | `ICleanupComponentData` | Runtime world container | Auto-managed by `CrowdSurfaceSystem`; do not add manually |
| `CrowdGroup` | `IComponentData` | `Entity Surface`, `Speed Speed`, `CostWeights CostWeights`, `CrowdGoalSource GoalSource`, `bool Grounded`, `float MappingRadius` | One group = one flow field; minimize groups for performance |
| `CrowdGroupFlow` | `ICleanupComponentData` | Runtime flow container | Auto-managed by `CrowdSurfaceSystem`; do not add manually |

### Agent

| Component | Interface | Notes |
|-----------|-----------|-------|
| `AgentCrowdPath` | `ISharedComponentData` | References crowd group entity; links agent to a CrowdGroup |
| `AgentCrowdDisabled` | `IEnableableComponent` | Toggle to disable crowd pathing per agent without removing component |

### Obstacles & Discomfort

| Component | Interface | Key Fields | Notes |
|-----------|-----------|------------|-------|
| `CrowdObstacle` | `IComponentData` | `CrowdObstacleType Type`, `float2 Size` | Marks unwalkable area; Type = Quad or Circle |
| `CrowdObstacleSplat` | `ICleanupComponentData` | Obstacle runtime state | Auto-managed; do not add manually |
| `CrowdDiscomfort` | `IComponentData, IEnableableComponent` | `CrowdDiscomfortType Type`, `float2 Size` | Soft avoidance zone; agents avoid but can enter |
| `CrowdDiscomfortSplat` | `ICleanupComponentData` | Discomfort runtime state | Auto-managed; do not add manually |

### Managed Containers (on surface entity)

| Component | Interface | Notes |
|-----------|-----------|-------|
| `CrowdWorlds` | Managed `IComponentData` | `List<CrowdWorld>` — one per surface |
| `CrowdFlows` | Managed `IComponentData` | `List<CrowdFlow>` — one per group on the surface |

---

## Enums

| Enum | Values | Notes |
|------|--------|-------|
| `CrowdGoalSource` | `Script`, `AgentDestination` | `AgentDestination` = auto from agent's destination component |
| `CrowdObstacleType` | `Quad`, `Circle` | Shape of obstacle footprint |
| `CrowdDiscomfortType` | `Quad`, `Circle` | Shape of discomfort footprint |

---

## Low-Level Types (ProjectDawn.ContinuumCrowds)

### Structs

| Type | Purpose | Key Members |
|------|---------|-------------|
| `CrowdFlow` | Per-group field container | `Compute()`, `ParallelWriter` for job-safe goal writing |
| `UnsafeCrowdFlow` | Unsafe variant of CrowdFlow | Direct pointer access; used internally by systems |
| `CrowdWorld` | Per-surface world state | Height, density, discomfort, obstacle fields |
| `UnsafeCrowdWorld` | Unsafe variant of CrowdWorld | Used internally by CrowdWorldSystem |
| `CostWeights` | Pathfinding cost balance | `float Distance`, `float Time`, `float Discomfort` |
| `Speed` | Agent speed config | `float Min`, `float Max` |
| `Density` | Crowd density thresholds | `float Min`, `float Max` |
| `Slope` | Walkable slope limits | `float Min`, `float Max` (tangent values) |

### CrowdFlow.ParallelWriter
Thread-safe goal writer for use inside Burst jobs:
```csharp
// In job: add goal position atomically
flow.ParallelWriter.AddGoal(position);
```

---

## Systems (all ISystem, Burst-compiled, SimulationSystemGroup)

| System | Order | Responsibility |
|--------|-------|----------------|
| `CrowdSurfaceSystem` | First | Creates `CrowdWorld`/`CrowdFlow` on surface entity add; destroys on remove |
| `CrowdWorldSystem` | After Surface | Splats obstacles, discomfort, agent density into `CrowdWorld` fields |
| `CrowdGoalSystem` | After World | Updates flow goals: from agent destinations (`AgentDestination` source) or script |
| `CrowdFlowSystem` | After Goal | Computes Cost Field, Speed Field, Potential Field per group — most expensive system |
| `CrowdSteeringSystem` | After Flow | Samples velocity from potential field gradient; writes to agent steering |
| `CrowdDisplacementSystem` | After Steering | Maps agents onto surface grid; applies ground constraint when `Grounded = true` |

---

## Authoring (ProjectDawn.Navigation.Hybrid)

| Authoring MB | Baker | Adds to entity |
|-------------|-------|----------------|
| `CrowdSurfaceAuthoring` | `CrowdSurfaceAuthoring.Baker` | `CrowdSurface`, `CrowdSurfaceData` |
| `CrowdGroupAuthoring` | `CrowdGroupAuthoring.Baker` | `CrowdGroup` |
| `AgentCrowdPathingAuthoring` | `AgentCrowdPathingAuthoring.Baker` | `AgentCrowdPath` |
| `CrowdObstacleAuthoring` | `CrowdObstacleAuthoring.Baker` | `CrowdObstacle` |
| `CrowdDiscomfortAuthoring` | `CrowdDiscomfortAuthoring.Baker` | `CrowdDiscomfort` |

---

## Base Agent Integration

Crowd agents require base components (`Agent` + `AgentBody` + `AgentLocomotion` + `AgentShape`) plus `AgentCrowdPath`. See [base-guide.md](base-guide.md) for full base component reference.

## Runtime Usage Patterns

```csharp
// Baker: register agent for crowd group
public override void Bake(AgentCrowdPathingAuthoring authoring)
{
    var entity = GetEntity(TransformUsageFlags.Dynamic);
    AddSharedComponent(entity, new AgentCrowdPath
    {
        Entity = GetEntity(authoring.CrowdGroup, TransformUsageFlags.None)
    });
}

// System: disable crowd for one agent
SystemAPI.SetComponentEnabled<AgentCrowdDisabled>(agentEntity, true);

// System: script-driven goal (GoalSource = Script)
// Use CrowdFlow.ParallelWriter inside IJobEntity for thread safety
[BurstCompile]
partial struct SetGoalJob : IJobEntity
{
    public CrowdFlow.ParallelWriter FlowWriter;
    void Execute(in LocalTransform transform)
    {
        FlowWriter.AddGoal(transform.Position);
    }
}
```

---

## Gotchas

- `CrowdSurfaceWorld`, `CrowdGroupFlow`, `CrowdObstacleSplat`, `CrowdDiscomfortSplat` are cleanup components — never add manually; always present after system init
- `CrowdFlowSystem` recomputes all fields every frame — minimize `CrowdGroup` count
- `AgentCrowdPath` is `ISharedComponentData` — changing it moves entity to a new chunk (costly); batch group assignments
- `GoalSource = Script` requires manual goal injection via `CrowdFlow.ParallelWriter` each frame
- `Grounded = true` on `CrowdGroup` pins agents to surface height — required for non-flat terrain
- Each `CrowdGroup` references exactly one `CrowdSurface`; one surface can have many groups
