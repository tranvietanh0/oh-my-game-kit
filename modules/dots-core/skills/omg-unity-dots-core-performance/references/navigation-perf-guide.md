---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Navigation Performance

## Agents Navigation Scaling (`com.projectdawn.navigation` v4.4.4)

- **Individual NavMesh agents don't scale past ~200** — each runs A* pathfinding. At 2K, use Crowds flow fields
- **Crowds extension** (`com.projectdawn.navigation.crowds`): Shared flow field per group, O(grid²) not O(agents). See `agents-navigation` skill crowds-guide.md
- **Hybrid LOD**: Tier 0 = individual NavMesh (in combat, ~200 units). Tier 1+ = Crowds flow field (idle/far, ~1800 units)
- `AgentLocomotion.Speed` sync: bridge system runs OrderFirst — no per-frame redundant writes

## Anti-Overlap Strategy (2K+ units)

**3-layer stack (recommended):**
1. **Crowds flow fields** — macro routing, density-aware, O(grid²) shared across all agents in group
2. **AgentSonarAvoid** — steering-level local avoid. **Reduce radius to 1.0f** (default 2.0f is too large at density; causes 4× avoidance checks per agent pair)
3. **AgentCollider** — physical displacement, spatial BVH, NOT O(N²). Enable on all units at any scale

**Anti-patterns at scale:**
| Anti-Pattern | Why | Fix |
|-------------|-----|-----|
| `AgentReciprocalAvoid` at 2K+ | O(N²) = 4M pair checks/frame | Use `AgentCollider` (BVH) instead |
| `AgentSonarAvoid.Radius = 2.0f` dense crowd | 4× CPU overlap checks per agent | Reduce to **1.0f** for 2K+ units |
| NavMesh-only at 2K (no Crowds) | Per-agent A* = NavMeshQuerySystem bottleneck | Enable Crowds flow fields for idle/far tiers |

## Dead Agent NavMesh Optimization (CRITICAL at 2K+)

Agents Navigation has NO game-state awareness — dead entities process through ALL nav systems (NavMeshPathSystem, NavMeshSteeringSystem, AgentSeekingSystem, AgentLocomotionSystem). At 2K scale with 200-500 dead entities at steady state, this wastes 10-25% of NavMesh CPU.

**Fix: DeadAgentStopSystem** (`DOTSRPG.Navigation`):
- Sets `AgentBody.IsStopped = true` (Agents Nav systems early-return)
- **Disables `NavMeshPath` component** — `NavMeshPath : IEnableableComponent`, so NavMeshPathSystem and NavMeshSteeringSystem skip the entity entirely
- Uses `IJobChunk` with `IgnoreComponentEnabledState` to access entities whose NavMeshPath may already be disabled
- Paired with **NavigationRespawnResetSystem** that re-enables NavMeshPath when entities respawn

## Tier-Based NavMesh Throttling

Tier 2 entities (far from combat) only need pathfinding every 8 frames. On skip frames, NavMesh queries are wasted CPU.

**Fix: NavMeshTierThrottleSystem** (`DOTSRPG.Navigation`):
- Disables `NavMeshPath` component on skip frames for Tier 2 entities
- Re-enables on active frames so they re-path normally
- Tier 0/1 always have NavMeshPath enabled
- At 2K entities with ~30% Tier 2, eliminates ~525 NavMesh queries on 7/8 frames

## FixedStep Catch-Up Reduction

Agents Navigation runs in `FixedStepSimulationSystemGroup`. At low FPS (2800ms/frame) with `fixedDeltaTime=0.05s`, engine runs up to 2 FixedUpdate ticks per frame, doubling ALL nav costs.

**Fix**: Set `fixedDeltaTime = maximumDeltaTime = 0.1s` (10 Hz). Guarantees at most 1 FixedUpdate per frame. Trade-off: slightly less smooth pathfinding (acceptable for 2D top-down).

## NavMesh Query Gotchas

- **NavMeshQuerySystem is single-threaded** — Unity NavMesh queries are NOT thread-safe. Even 600 queries with 1024 iterations each = 614K iterations on main thread. Fundamental scaling limit
- **NavMeshPathSystem uses `.Schedule()` (not `.ScheduleParallel()`)** — single-threaded by design
- **`WithNone<DeadTag>()` does NOT work with IEnableableComponent** — `WithNone` checks archetype presence, not enabled state. DeadTag is present in all archetypes (added at bake time, just disabled). Use `IgnoreComponentEnabledState` + manual `chunk.IsComponentEnabled()` check inside the job
- **Disabling NavMeshPath mid-query** — safe because NavMeshPathSystem checks `path.State` before processing. Disabled components are skipped by the query filter

## AI LOD Tier Gotchas

**AIUpdateTierSystem — always filter by team in distance checks:**
```csharp
// ANTI-PATTERN: counting allies as "nearby" → everything Tier 0
for (int i = 0; i < perceived.Length; i++) {
    float distSq = perceived[i].Distance * perceived[i].Distance;
    if (distSq < nearest) nearest = distSq; // allies at 1-5m → always Tier 0!
}

// FIX: skip same-team entries
byte myTeam = teamId.Value;
for (int i = 0; i < perceived.Length; i++) {
    if (perceived[i].TargetTeamId == myTeam) continue; // skip allies
    float distSq = perceived[i].Distance * perceived[i].Distance;
    if (distSq < nearest) nearest = distSq;
}
```

**Tier intervals for 2K+ entities:** Tier0=1 (every frame), Tier1=2, Tier2=**8** (not 4). At 2K scale, Tier 2 at every-4-frames is too aggressive — 500 BDP evaluations/frame. At every-8, it's ~250.

**Spawn gap vs DetectionRange:** Ensure front-line spawn distance < DetectionRange, otherwise no entity ever detects enemies and all stay Tier 2 (idle).
