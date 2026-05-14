---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Systems Advanced Guide — SharedStatic, Static Helpers, QueryBuilder

## Sharing Data Between Systems (Burst-Safe) — continued

```csharp
// Reader system — same frame, guaranteed ordering via [UpdateAfter]
[UpdateAfter(typeof(ProducerSystem))]
public partial struct ConsumerSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        int val = ProducerSystem.Shared.Data.Value; // Burst-safe read
    }
}
```

**Rules**:
- `T` must be an unmanaged struct (blittable)
- `NativeContainer` fields (e.g., `NativeParallelMultiHashMap`) are fine — they're just handles
- Use system ordering (`OrderFirst`, `[UpdateAfter]`) to ensure write-before-read
- **NEVER** use `public static SpatialHashGrid grid;` — Burst error BC1040

## Static Helper Methods — What's Safe

**Safe** (pure math, no SystemAPI):
```csharp
[BurstCompile]
public static class CombatFormulas
{
    public static float HealthPercent(float current, float max)
        => max > 0f ? current / max : 1f;
}
```

**UNSAFE** (SystemAPI calls depend on entity existence):
```csharp
// NEVER DO THIS — SystemAPI.HasComponent on Entity.Null causes NullRef in Burst
public static bool IsTargetValid(Entity target) // WRONG
{
    return SystemAPI.HasComponent<DeadTag>(target); // crashes if target == Entity.Null
}
```

**Rule**: Static helpers must NEVER wrap SystemAPI calls that depend on entity validity. The caller must check `Entity.Null` / `SystemAPI.Exists()` BEFORE calling `SystemAPI.HasComponent`.

---

## SystemAPI.QueryBuilder (Manual EntityQuery)

When you need a cached query beyond what `SystemAPI.Query<T>` provides (e.g., for job scheduling with explicit query):

```csharp
// SystemAPI.QueryBuilder compiles to OnCreate cache + OnUpdate reuse
EntityQuery _healthQuery;

[BurstCompile]
public void OnCreate(ref SystemState state)
{
    _healthQuery = SystemAPI.QueryBuilder()
        .WithAll<Health>()
        .WithNone<DeadTag>()
        .Build();
    state.RequireForUpdate(_healthQuery);
}

[BurstCompile]
public void OnUpdate(ref SystemState state)
{
    // Use with IJobEntity scheduling
    new ProcessHealthJob().ScheduleParallel(_healthQuery, state.Dependency);
}
```

**Note:** `SystemAPI.QueryBuilder()` is equivalent to `new EntityQueryBuilder(state.WorldUpdateAllocator)` but auto-managed by the source generator.

---

> For EntityQuery builder, system ordering, and group attributes, see [query-ordering-guide.md](query-ordering-guide.md).
> For Worlds, bootstrap, and IAspect patterns, see [worlds-aspect-guide.md](worlds-aspect-guide.md).
