---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Systems Guide — Unity DOTS ECS

## ISystem (Preferred)

Unmanaged struct — supports `[BurstCompile]` on all methods. Preferred over SystemBase.

```csharp
using Unity.Burst;
using Unity.Entities;
using Unity.Mathematics;

namespace DOTSAI
{
    [BurstCompile]
    [UpdateInGroup(typeof(SimulationSystemGroup))]
    public partial struct MovementSystem : ISystem
    {
        [BurstCompile]
        public void OnCreate(ref SystemState state)
        {
            // Require at least one entity with these components before updating
            state.RequireForUpdate<Health>();
        }

        [BurstCompile]
        public void OnUpdate(ref SystemState state)
        {
            float dt = SystemAPI.Time.DeltaTime;

            foreach (var (transform, velocity) in
                SystemAPI.Query<RefRW<LocalTransform>, RefRO<Velocity>>())
            {
                transform.ValueRW.Position += velocity.ValueRO.Value * dt;
            }
        }

        [BurstCompile]
        public void OnDestroy(ref SystemState state) { }
    }
}
```

**Access EntityManager in ISystem:**
```csharp
// Direct structural changes (only safe outside jobs, use ECB in jobs)
state.EntityManager.AddComponent<Dead>(entity);
state.EntityManager.DestroyEntity(entity);
```

---

## SystemBase

Managed class — simpler API, no `[BurstCompile]` on methods.

```csharp
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial class SpawnSystem : SystemBase
{
    protected override void OnUpdate()
    {
        var ecb = SystemAPI
            .GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>()
            .CreateCommandBuffer(World.Unmanaged);

        foreach (var (spawner, entity) in
            SystemAPI.Query<RefRO<Spawner>>().WithEntityAccess())
        {
            var instance = ecb.Instantiate(spawner.ValueRO.Prefab);
            ecb.AddComponent(instance, new Health { Current = 100, Max = 100 });
        }
    }
}
```

---

## SystemAPI.Query

The idiomatic iteration pattern. Source-generator caches the underlying EntityQuery.

**How caching works (from Unity docs):** When you invoke `SystemAPI.Query<T>`, the source generator creates an `EntityQuery` field on the system and caches it. During compilation, the invocation is replaced with an enumerator that iterates through the cached query's data. Type handles are cached and `TypeHandle.Update` is auto-injected before each `foreach`. Dependencies are auto-completed before iteration.

```csharp
// Basic: RefRW = read-write, RefRO = read-only
foreach (var (health, entity) in
    SystemAPI.Query<RefRW<Health>>().WithEntityAccess())
{
    if (health.ValueRO.Current <= 0)
        ecb.AddComponent<Dead>(entity);
}

// Multiple components with filters
foreach (var (transform, speed, health) in
    SystemAPI.Query<RefRW<LocalTransform>, RefRO<Speed>, RefRO<Health>>()
    .WithAll<Player>()          // must have Player (tag filter)
    .WithNone<Dead>()           // must NOT have Dead
    .WithAny<Stunned, Frozen>() // must have at least one of these
    .WithDisabled<Invisible>()) // match disabled Invisible
{
    transform.ValueRW.Position += speed.ValueRO.Value * dt;
}

// DynamicBuffer in query
foreach (var (waypoints, transform) in
    SystemAPI.Query<DynamicBuffer<Waypoint>, RefRW<LocalTransform>>())
{
    if (waypoints.Length > 0)
        transform.ValueRW.Position = waypoints[0].Position;
}

// EnabledRef for enableable components
foreach (var (stunnedEnabled, stunned) in
    SystemAPI.Query<EnabledRefRW<Stunned>, RefRW<Stunned>>())
{
    stunned.ValueRW.Duration -= dt;
    if (stunned.ValueRO.Duration <= 0)
        stunnedEnabled.ValueRW = false;
}
```

---

## Sharing Data Between Systems (Burst-Safe)

**Problem**: `public static` mutable fields cause Burst error BC1040 — Burst cannot load non-readonly static fields.

**Solution**: Use `SharedStatic<T>` from `Unity.Burst` for cross-system data sharing:

```csharp
using Unity.Burst;

[BurstCompile]
public partial struct ProducerSystem : ISystem
{
    // SharedStatic is Burst-compatible — readonly reference, mutable .Data
    public static readonly SharedStatic<MyData> Shared =
        SharedStatic<MyData>.GetOrCreate<ProducerSystem>();

    public void OnCreate(ref SystemState state)
    {
        Shared.Data = new MyData { /* init */ };
    }

    public void OnUpdate(ref SystemState state)
    {
        Shared.Data.Value = 42; // write
    }
}
-> See [systems-advanced-guide.md](systems-advanced-guide.md) for SharedStatic consumer pattern, static helper rules, and SystemAPI.QueryBuilder.
