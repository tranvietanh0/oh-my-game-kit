---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# BDP ECS Task Gotchas & Performance Scaling

## ECS Task Gotchas

| Issue | Fix |
|-------|-----|
| **ComponentLookup not cached** | Cache via `state.GetComponentLookup<T>(isReadOnly)` in `OnCreate`, call `.Update(ref state)` in `OnUpdate` |
| **Flee: zero-direction edge case** | `math.normalize(delta)` returns `float3.zero` when enemy at same position. Default to `new float3(0, 0, -1)` |
| **WaitDuration: Elapsed not reset on interrupt** | Reset `task.Elapsed = 0` when `task.Status == TaskStatus.Queued` |
| **Custom EntityQuery must match Execute() params** | Query MUST include ALL component types in `Execute()` params — missing types → `InvalidOperationException` |
| **Parallel ComponentLookup writes** | Use `[NativeDisableParallelForRestriction]` when each entity only writes to its own data |
| **DynamicBuffer readonly in foreach** | `DynamicBuffer<T>` from `SystemAPI.Query` foreach is read-only. Use `SystemAPI.GetBuffer<T>(entity)` for writable access |
| **Repeater defaults to non-forever** | `new Repeater()` does NOT call `Reset()`. `m_RepeatForever` defaults to `false` — set explicitly |
| **IReevaluate vs IReevaluateResponder** | BDP requires `IReevaluateResponder` (NOT `IReevaluate`) for conditional abort reevaluation |
| **Trees silently don't execute** | Missing `Start` event node or `bt.Serialize()` → trees bake but never run. No errors logged |
| **EvaluateFlag re-enabled every frame** | `EvaluationCleanupSystem` uses `IgnoreComponentEnabledState` to re-enable. Throttle systems must run BEFORE BDP each frame |
| **[BurstCompile] on ISystem + cross-assembly types** | `[DisableAutoCreation]` systems aren't registered in Burst's entry point table until BDP instantiates them. If the ISystem struct or its `OnCreate`/`OnUpdate` reference types from assemblies not yet loaded, Burst emits "not a known Burst entry point" warnings. **Pattern**: keep `[BurstCompile]` on ISystem + methods when all referenced types (ComponentLookup, Lookups) come from same-assembly or always-loaded assemblies (Unity.Entities, Unity.Transforms, DOTSCore, DOTSCombat). If new task references an exotic cross-assembly type and warns, move that type access into the IJobEntity — the ISystem is just a scheduling wrapper with negligible Burst benefit. |

### BDP 3 Migration Gotchas

| Issue | Fix |
|-------|-----|
| **G11 — ISubtreeReference duplicate definition (BDP 3.0.2 vendor bug)** | BDP 3.0.2 ships `ISubtreeReference.cs` in the source that conflicts with the DLL version. Delete: `rm Packages/com.opsive.behaviordesigner/Runtime/Tasks/ISubtreeReference.cs` and its `.meta`. This re-applies on every Asset Store re-import. Pin stays at 3.0.2; remove if 3.0.3 ships the fix |
| **G12 — Burst cache invalidation on BDP package update** | After installing any new BDP version, clear stale Burst artifacts before entering Play mode: `rm -rf Library/BurstCache Library/Bee/artifacts Library/ScriptAssemblies`. Without this, Unity throws stale-Burst compile errors on first compile |
| **G13 — `Flag` property override no longer needed in BDP 3** | In BDP 2, each authoring class had `public override ComponentType Flag => typeof(XxxFlag);`. In BDP 3, the base class implements this via the 3rd generic `TComponentFlag`. Remove the override — keeping it causes a CS0108 warning. Pattern: `ECSActionTask<TSystem, TComponent, TComponentFlag>` |

## Performance Scaling

| Scale | Estimated CPU (ms/frame) | Strategy |
|-------|-------------------------|----------|
| <100 units | <0.5 | No throttling needed |
| 100-500 units | 0.5-5.0 | Optional: Tier 1/2 throttling |
| 500-2000 units | 5-20 | **Required**: EvaluateFlag throttling via AIUpdateTier |
| 2000+ units | 20+ | Throttling + simpler AI for distant units |

**Cost model**: O(tasks × entities) per frame. Burst + ScheduleParallel provides linear speedup per core.

-> See [performance-throttling-guide.md](performance-throttling-guide.md) for `BDPEvaluateFlagThrottleSystem` implementation and AIUpdateTier integration.
