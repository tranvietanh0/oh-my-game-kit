---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# Agents Navigation — Performance & Anti-Patterns

## Performance Rules (MANDATORY)

Agents Navigation runs in `FixedStepSimulationSystemGroup` — every millisecond here reduces total frame time.

### Crowd System Performance
- **Minimize CrowdGroups** — `CrowdFlowSystem` computes full potential field per group. 2 groups = 2× cost (O(cells²))
- **Lower cell resolution first** — 64×64 before increasing. Doubling resolution = 4× flow cost
- **Use static obstacles** — dynamic `CrowdObstacle` re-splats every frame. Set `IsStatic = true`
- **Batch destination changes** — stagger `AgentBody.Destination` updates across frames
- **One CrowdSurface per arena** — multiple surfaces multiply entire pipeline

### Agent System Performance
- **`AgentSonarAvoid` is most expensive** — raycasts cones per agent. Disable for distant agents via `SetComponentEnabled<AgentSonarAvoid>(entity, false)`
- **`AgentSonarAvoid.Radius` scale tuning** — default 2.0f causes severe overlap at 2K+ units. Use **1.0f** for dense crowds; only raise if units clip through each other
- **`AgentSeparation` cheaper** — prefer for simple crowd spreading
- **`AgentCollider` is NOT O(N²)** — uses spatial partitioning (BVH). Safe to enable on all units at any scale. Recommended for physical anti-overlap displacement
- **`AgentReciprocalAvoid` is O(N²)** — do NOT use at scale. Replace with AgentCollider + SonarAvoid combo
- **`NavMeshPath` IEnableableComponent** — disable for stationary agents (avoids path query overhead)

### Bridge System Performance
- Bridge reads `NavigationTarget` once per frame — keep lean (read → write → done)
- `AgentCCOverrideSystem` runs OrderLast — CC/knockback after all navigation, minimal overhead
- Never poll `RemainingDistance` in parallel jobs — read in main-thread bridge only

### DOTS Grounding Performance
- Use `CollisionWorld.CastRay` — Burst-compiled, batch-friendly
- `CollisionFilter` narrowed to terrain layer only — reduces broadphase checks
- Keep `MaxRayDistance` small (50m default, less for flat terrains)

## Anti-Patterns (NEVER DO)

| Anti-Pattern | Why | Fix |
|-------------|-----|-----|
| Classic `RaycastCommand` for grounding | Can't see SubScene-baked PhysicsColliders | Use DOTS `CollisionWorld.CastRay()` |
| `UnityEngine.Physics.Raycast` in DOTS systems | Managed call, breaks Burst | Use `CollisionWorld.CastRay` |
| Spawning agents without disabling `AgentSonarAvoid` | Cost spike during mass spawn | Enable avoidance after spawn settles |
| Multiple `NavMeshSurface` in one scene | Erratic pathing, double queries | Single surface, `CollectObjects.Volume` |
| Changing `AgentLocomotion.Speed` every frame | Triggers internal recalculation | Update only when speed changes |
| `(StaticEditorFlags)8` + `SetNavMeshArea` for obstacles | Marks surface "Not Walkable" but doesn't carve NavMesh | Use `NavMeshObstacle.carving = true` |
| Default `MappingExtent = 10` for large arenas | 12K+ warnings for 200×200 arena | Set proportional to arena half-size (e.g., 50 for 200×200) |
| Dead agents with active `NavMeshPath` | 1-frame warning after death | Use `PreFixedStepDeadAgentCleanupSystem` (OrderFirst + UpdateBefore FixedStep) |
| `AgentReciprocalAvoid` at 2K+ agents | O(N²) — catastrophic CPU at scale | Use `AgentCollider` (spatial BVH) + reduced-radius `AgentSonarAvoid` instead |
| `AgentSonarAvoid.Radius = 2.0f` at 2K+ | Dense packing → 4× CPU overlap checks | Use 1.0f for 2K+; tune up only if units clip |
| Hardcoded `AgentCrowdPath.Group` on prefab | SubScene entities don't exist at prefab bake time | Use `CrowdGroupAssignmentSystem` to assign at runtime via `TeamCrowdGroup` lookup |

## Common Patterns

```csharp
// Set crowd goal from script (when CrowdGoalSource = Script)
var flow = SystemAPI.GetComponent<CrowdGroupFlow>(crowdGroupEntity);
// Use CrowdFlow.ParallelWriter in jobs for thread-safe goal addition

// Disable crowd pathing for specific agent
SystemAPI.SetComponentEnabled<AgentCrowdDisabled>(agentEntity, true);

// Check if agent is on crowd path
var crowdPath = SystemAPI.GetSharedComponent<AgentCrowdPath>(agentEntity);
```

## DOTS Physics Integration for Grounding

`AgentGrounding` uses classic `RaycastCommand` which cannot see SubScene-baked DOTS Physics colliders. Use `CollisionWorld.CastRay()` instead:

```csharp
// In AgentDisplacementSystemGroup — CollisionFilter narrowed to terrain layer
var physicsWorld = SystemAPI.GetSingleton<PhysicsWorldSingleton>();
var input = new RaycastInput
{
    Start  = position + new float3(0, halfHeight, 0),
    End    = position - new float3(0, maxRayDistance, 0),
    Filter = new CollisionFilter
    {
        BelongsTo    = ~0u,
        CollidesWith = environmentMask, // (1u<<6)|(1u<<7) = Terrain + Obstacle
        GroupIndex   = 0
    }
};
if (physicsWorld.CastRay(input, out var hit))
    position.y = hit.Position.y + halfHeight;
```

**Rule:** Never mix `AgentGrounding` (classic physics) with DOTS-based grounding on the same entity.
