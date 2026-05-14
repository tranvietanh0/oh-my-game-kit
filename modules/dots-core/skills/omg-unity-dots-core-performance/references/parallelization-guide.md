---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Job Parallelization & Query Optimization

## Job Decision Tree

```
Is work per-entity independent?
  YES → IJobEntity + ScheduleParallel
    Does it write to other entities' components?
      YES → ECB.AsParallelWriter (deferred) or [NativeDisableParallelForRestriction] (if truly safe)
      NO  → direct RefRW, no restriction needed
  NO (global state, ordering matters) → main-thread foreach or IJobEntity + Schedule (single-thread)

Is work over chunks with filtered queries?
  YES → IJobChunk (more control over chunk iteration)
  NO  → IJobEntity (simpler, preferred)

Is the loop < ~1000 entities?
  YES → main-thread foreach is acceptable; skip job overhead
  NO  → always use IJobEntity + ScheduleParallel
```

## Entity Query Optimization

```csharp
// Avoid: query evaluated every frame with no early-out
[RequireMatchingQueriesForUpdate]  // MANDATORY on stateless systems

// Avoid: broad queries that iterate dead/irrelevant entities
// Fix: add exclusion filters
query.WithNone<DeadTag>()
query.WithAll<RequiredTag>()

// Avoid: creating EntityQuery in OnUpdate (allocates)
// Fix: cache in OnCreate via GetEntityQuery()
private EntityQuery _query;
public void OnCreate(ref SystemState state) {
    _query = SystemAPI.QueryBuilder().WithAll<MyComp>().Build();
}
```

## SystemAPI Random Access Anti-Pattern (CRITICAL)

**Anti-pattern**: Using `SystemAPI.HasComponent/GetComponent/Exists/IsComponentEnabled` inside `foreach` loops. Each call resolves type handles + random chunk access — expensive at scale (224 units x 5+ lookups = 1000+ random accesses/frame).

**Fix**: Cache `ComponentLookup<T>` / `BufferLookup<T>` / `EntityStorageInfoLookup` in `OnCreate`, call `.Update(ref state)` in `OnUpdate`.

```csharp
// ANTI-PATTERN: per-entity SystemAPI random access
foreach (var (target, entity) in SystemAPI.Query<RefRO<CombatTarget>>().WithEntityAccess())
{
    if (!SystemAPI.Exists(target.ValueRO.Target)) continue;           // random access
    if (SystemAPI.HasComponent<DeadTag>(target.ValueRO.Target)) ...   // random access
    float3 pos = SystemAPI.GetComponent<LocalTransform>(target.ValueRO.Target).Position; // random access
}

// FIX: cached lookups — resolved once per frame
private ComponentLookup<DeadTag> _deadLookup;
private ComponentLookup<LocalTransform> _transformLookup;
private EntityStorageInfoLookup _existsLookup;

public void OnCreate(ref SystemState state) {
    _deadLookup = state.GetComponentLookup<DeadTag>(true);
    _transformLookup = state.GetComponentLookup<LocalTransform>(true);
    _existsLookup = state.GetEntityStorageInfoLookup();
}
public void OnUpdate(ref SystemState state) {
    _deadLookup.Update(ref state);
    _transformLookup.Update(ref state);
    _existsLookup.Update(ref state);
    foreach (...) {
        if (!_existsLookup.Exists(target)) continue;
        if (_deadLookup.HasComponent(target) && _deadLookup.IsComponentEnabled(target)) continue;
        float3 pos = _transformLookup[target].Position;
    }
}
```

**Apply to**: any system with per-entity lookups in a foreach loop (attack, reward, collision, area effect systems). Also hoist `SystemAPI.Time.ElapsedTime` before foreach.

## SystemAPI.Query Optimization

`SystemAPI.Query<T>` is source-generated: the underlying `EntityQuery` is created once in `OnCreate` and cached. Type handles are auto-updated. Dependencies auto-completed before each `foreach`.

**Key insight:** No need to manually cache queries when using `SystemAPI.Query` — the source generator handles it. Manual `EntityQueryBuilder` is only needed for job scheduling with explicit queries.

## Burst Job Tips

- **FloatMode.Fast** — allows reordering float ops for SIMD vectorization; use when precision is not critical
- **CompileSynchronously = false** (default) — async compilation avoids blocking main thread
- **Batch function pointers** — process arrays via `FunctionPointer<T>` with batched data
- **IJobParallelForBatch** — processes contiguous ranges per worker thread, enabling SIMD within each batch
