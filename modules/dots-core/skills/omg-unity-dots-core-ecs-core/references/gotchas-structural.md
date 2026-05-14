---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Structural Change Gotchas

## Stale Cache After Type Changes

**CRITICAL**: When adding new `IComponentData` types, renaming component types, or splitting components (e.g., `SpawnerConfig` → `SpawnerConfig` + `SpawnState`), Unity's Burst cache and compiled assemblies become stale. This causes **misleading test failures** with errors like:

```
ObjectDisposedException: Attempted to access ComponentTypeHandle<T> which has been invalidated by a structural change.
```

The component `T` in the error may NOT be the actual culprit — it changes randomly with each Burst recompile (e.g., `NativeText.ReadOnly`, then `LocalTransform`, then something else).

**Fix**: Clear all caches and force rebuild:
```bash
rm -rf Library/BurstCache Library/Bee/artifacts Library/ScriptAssemblies
```
Then trigger recompile via Unity Editor (or `refresh_unity` MCP tool with `mode=force, compile=request`).

**NEVER suppress these errors** with `LogAssert.Expect` or `LogAssert.ignoreFailingMessages`. Always investigate root cause first. After cache clear, any remaining failures are real bugs.

**Also beware**: `EnabledRefRW<T>` in `IJobEntity.Execute()` causes the query to ONLY match entities with `T` enabled. If you need to SET an enableable flag on entities regardless of its current state, use `ComponentLookup<T>.SetComponentEnabled()` instead.

## No Structural Changes During SystemAPI.Query Iteration

**CRITICAL**: Calling `EntityManager.RemoveComponent()`, `AddComponent()`, `CreateEntity()`, or `DestroyEntity()` INSIDE a `SystemAPI.Query` foreach loop throws:

```
InvalidOperationException: Structural changes are not allowed while iterating over entities.
```

This applies to ALL structural changes — including `RemoveComponent` on a DIFFERENT entity than the one being iterated.

**Bad** (crashes at runtime):
```csharp
foreach (var (_, entity) in SystemAPI.Query<RefRO<MyTag>>().WithEntityAccess())
    state.EntityManager.RemoveComponent<MyTag>(entity); // ILLEGAL
```

**Good** — use a pre-built EntityQuery for batch removal:
```csharp
// In OnCreate:
_query = state.GetEntityQuery(ComponentType.ReadOnly<MyTag>());

// In OnUpdate:
state.EntityManager.RemoveComponent<MyTag>(_query); // batch, no iteration
```

**Good** — use ECB for deferred structural changes:
```csharp
var ecb = new EntityCommandBuffer(Allocator.Temp);
foreach (var (_, entity) in SystemAPI.Query<RefRO<MyTag>>().WithEntityAccess())
    ecb.RemoveComponent<MyTag>(entity);
ecb.Playback(state.EntityManager);
ecb.Dispose();
```

**Note**: `EntityManager.CreateEntity()` and `AddComponentData()` OUTSIDE a `SystemAPI.Query` loop are fine — structural changes are only blocked during active iteration.

## SetComponentEnabled is a Structural Change

**CRITICAL**: `EntityManager.SetComponentEnabled<T>()` and `SystemAPI.SetComponentEnabled<T>()` are treated as structural changes by the Entities safety system. When this is called, all `BufferTypeHandle<T>` references become invalid and must be re-fetched.

**Pattern - Two-Pass Approach**:
If a system reads DynamicBuffers AND toggles enableable components, use two passes:
1. **First pass**: Read all buffers you need, cache data in a temp structure
2. **Second pass**: Call `SetComponentEnabled<T>()` to toggle components

Or use `.WithPresent<T>()` in your query to include entities regardless of `T`'s enabled state.

**Gotcha**: This is NOT explicitly documented in many code patterns but causes mysterious `InvalidOperationException` when `IJobEntity` tries to access a BufferTypeHandle that was invalidated by a prior `SetComponentEnabled()` call in the same system's `OnUpdate()`.

## Invalid [UpdateAfter/UpdateBefore] Targeting Non-Existent Systems

**Symptom**: Console spam: `Ignoring invalid [Unity.Entities.UpdateAfterAttribute] attribute on X targeting Y`

**Cause**: `[UpdateAfter(typeof(SomeSystem))]` references a system that:
- Was planned but never implemented
- Was deleted/renamed without updating dependents
- Is in a different system group (cross-group ordering is ignored)
- Is not registered in test worlds (only appears during test runs)

**Fix**: Remove the invalid `[UpdateAfter/Before]` attribute. ECS system ordering within a group is deterministic (alphabetical by default) — explicit ordering is only needed when alphabetical order is wrong.

**Prevention**: When deleting or renaming a system, grep for all `UpdateAfter(typeof(SystemName))` and `UpdateBefore(typeof(SystemName))` references and remove them.

## Missing RequireForUpdate Causes Runtime Exceptions

**CRITICAL**: Every ISystem that calls `SystemAPI.GetSingleton<T>()` or `SystemAPI.GetSingletonRW<T>()` MUST have `state.RequireForUpdate<T>()` in `OnCreate`. Without it, the system runs before SubScene loading completes and the singleton entity doesn't exist yet, causing:

```
InvalidOperationException: GetSingleton<T>() requires that exactly one entity exists that match this query, but there are none.
```

**Pattern — ALWAYS add OnCreate for singleton dependencies**:
```csharp
[BurstCompile]
public void OnCreate(ref SystemState state)
{
    state.RequireForUpdate<MySingletonComponent>();
}
```

**Note**: `[RequireMatchingQueriesForUpdate]` only protects systems that use `SystemAPI.Query<>` — it does NOT protect `GetSingleton<>` calls. You MUST explicitly call `RequireForUpdate<T>()` for each singleton dependency.

**Prevention**: Treat every `GetSingleton`/`GetSingletonRW` call as requiring a corresponding `RequireForUpdate` in `OnCreate`. This is a mandatory code review check.

### Exception — ECB System Singletons Are Auto-Created

ECB system singletons (`EndSimulationEntityCommandBufferSystem.Singleton`, `BeginSimulationEntityCommandBufferSystem.Singleton`, `EndInitializationEntityCommandBufferSystem.Singleton`, etc.) are auto-created by their respective ECB systems and do NOT require `RequireForUpdate<T>()`.

```csharp
// CORRECT — no RequireForUpdate needed for ECB singletons
public void OnUpdate(ref SystemState state)
{
    var ecb = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>()
        .CreateCommandBuffer(state.WorldUnmanaged);
    // ...
}
```

Only USER/SubScene-baked singletons (config blobs, world state, registry entities) need `RequireForUpdate<T>()`.

## Burst-Compiled OnCreate with Structural Changes Silently No-Ops

**CRITICAL**: `[BurstCompile]` on `ISystem.OnCreate` cannot reliably execute `EntityManager` structural changes (`CreateEntity`, `AddComponent`, `DestroyEntity`, etc.). The body of `OnCreate` appears to run but the entity is never actually created. There is no exception, no warning — the call is silently skipped.

**Symptom** (the failure surfaces later in `OnUpdate` or in tests):
```
InvalidOperationException: GetSingleton<T>() requires that exactly one entity exists that match this query, but there are 0.
```

This appears in any system or test that depends on the singleton — even though the system's `OnCreate` clearly contains:
```csharp
[BurstCompile]
public void OnCreate(ref SystemState state)
{
    var e = state.EntityManager.CreateEntity();
    state.EntityManager.AddComponentData(e, new RuntimeStateSingleton { ... });
}
```

**Cause**: Burst on `OnCreate` cannot safely emit structural-change calls. Unlike `OnUpdate` (where Burst-safe ECB / EntityQuery batch APIs work), the direct `EntityManager.CreateEntity()` path is not Burst-supported in `OnCreate` and gets eliminated.

**Fix**: Remove `[BurstCompile]` from any `OnCreate` that performs structural changes. Keep `[BurstCompile]` on `OnUpdate` and `OnDestroy` if they don't do structural changes themselves. Burst on `OnCreate` is rarely useful anyway — `OnCreate` runs once per world.

```csharp
// CORRECT — no [BurstCompile] on OnCreate that creates entities
public void OnCreate(ref SystemState state)
{
    var e = state.EntityManager.CreateEntity();
    state.EntityManager.AddComponentData(e, new RuntimeStateSingleton { ... });
    state.RequireForUpdate<RuntimeStateSingleton>();
}

[BurstCompile]
public void OnUpdate(ref SystemState state) { ... }   // Burst is fine here

[BurstCompile]
public void OnDestroy(ref SystemState state) { ... }  // Burst is fine here
```

**Verification**: Discovered 2026-05-07 in DOTS-AI Phase 4 Slice D. `HardModeMultiplierSystem` and `DailyChallengeSeedSystem` both had `[BurstCompile]` on `OnCreate` that called `state.EntityManager.CreateEntity()` to set up runtime-state singletons. 9/9 Slice D tests failed with the `GetSingleton` error. Removing the attribute from `OnCreate` (5-character fix per system) made all 9 tests pass with no other changes.

**Note on `performance-guide.md`**: That guide recommends `[BurstCompile]` on the struct AND each method including `OnCreate`. That recommendation holds ONLY when `OnCreate` does no structural changes. If `OnCreate` calls `CreateEntity`/`AddComponent`/`DestroyEntity`, drop `[BurstCompile]` from `OnCreate` specifically.

### Evidence — Systems That Hit This in Production

These systems in the dots-rpg library all hit `InvalidOperationException` from missing `RequireForUpdate` before the Round 1 audit (2026-04-26):
- `WorldTimeSystem` — read `WorldTimeConfig` singleton without guard
- `WeatherTransitionSystem` — read `WeatherConfig` singleton without guard
- `BossPhaseShakeSystem` — read `CameraAccessibility` singleton without guard

All three failed on frame 1 because their config singletons live in SubScenes that hadn't finished loading. The pairing rule is non-negotiable for any user/SubScene-baked type.
