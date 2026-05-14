---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# Avoidance Layers & System Ordering

## 3-Layer Avoidance Pattern

All demos use three complementary avoidance layers to prevent unit overlap at scale:

1. **Crowds flow fields** (macro) — `CrowdSurface` + `CrowdGroup` per team. Density-aware routing for Tier 1+ (idle/far) agents. Scalable to 10K+ units. Requires `TeamCrowdGroup` component on CrowdGroup entities for runtime assignment
2. **SonarAvoidance** (steering) — Local agent-agent avoidance. Reduced radius (`1.0f` instead of default `2.0f`) for 2K+ scale. Provides directional steering around nearby agents
3. **AgentCollider** (physical) — Spatial-partitioned displacement via `AgentColliderSystem`. Physically pushes overlapping agents apart. Efficient (uses spatial hash, NOT O(N²)). Enable via `NavigationAuthoring.EnableAgentCollider = true`

All three are enabled via `NavigationAuthoring` fields and baked automatically.

## Navigation System Ordering

```
PreFixedStepDeadAgentCleanupSystem (SimulationSystemGroup, OrderFirst + UpdateBefore FixedStep):
  Disables NavMeshPath + stops AgentBody for dead agents before Agents Nav runs

AgentSystemGroup (FixedStepSimulationSystemGroup):
  Agents Nav internal systems → pathfinding, seeking, avoidance, locomotion

NavigationSystemGroup (SimulationSystemGroup):
  CrowdGroupAssignmentSystem (OrderFirst) → NavigationRespawnResetSystem → DeadAgentStopSystem → AgentNavigationBridgeSystem → CrowdNavigationLODSystem → AgentCCOverrideSystem (OrderLast)
```

## System Ordering Constraints (Gotchas)

- **ISystem cannot [UpdateAfter/Before] a SystemBase** (or vice versa) — the attribute is silently ignored with no error or warning. Use `OrderFirst`/`OrderLast` or wrap both in the same group
- **OrderFirst/OrderLast overrides [UpdateBefore/After]** — if system A has `OrderFirst = true`, any `[UpdateBefore(typeof(A))]` on system B is ignored
- **FixedStepSimulationSystemGroup has OrderFirst** in SimulationSystemGroup — systems that need to run before it must ALSO have `OrderFirst = true` on their `[UpdateInGroup]`, plus `[UpdateBefore(typeof(FixedStepSimulationSystemGroup))]`. Without `OrderFirst`, the `[UpdateBefore]` is silently ignored
- **NavMeshPath must be disabled before FixedStep for dead agents** — otherwise `NavMeshSteeringSystem` generates "Failed to map agent destination" warnings. `PreFixedStepDeadAgentCleanupSystem` handles this
- **NavMeshPath.MappingExtent** must be proportional to arena size — default 10 is too small for large arenas (200x200). Set via `NavigationAuthoring.MappingExtent`
