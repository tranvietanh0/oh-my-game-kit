---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Jobs Guide — Unity DOTS ECS (IJobEntity)

> **Canonical IJobEntity reference.** For IJobChunk, IJob, IJobParallelFor, and advanced scheduling, see the `dots-jobs-burst` skill.

## IJobEntity

Parallel job over entities. Burst-compiled, works with ISystem. Preferred for performance-critical iteration over `SystemAPI.Query` foreach.

```csharp
[BurstCompile]
public partial struct MoveJob : IJobEntity
{
    public float DeltaTime;

    // Attributes control chunk iteration behavior
    [Unity.Entities.LowLevel.Unsafe.EntityIndexInQuery]
    int _entityIndex; // optional: index within query results

    void Execute(ref LocalTransform transform, in Velocity velocity)
    {
        transform.Position += velocity.Value * DeltaTime;
    }
}
```

---

## Scheduling Options

```csharp
[BurstCompile]
public void OnUpdate(ref SystemState state)
{
    var job = new MoveJob { DeltaTime = SystemAPI.Time.DeltaTime };

    // ScheduleParallel — runs across worker threads (fastest)
    state.Dependency = job.ScheduleParallel(state.Dependency);

    // Schedule — single-threaded job (use when order matters)
    // state.Dependency = job.Schedule(state.Dependency);

    // Run — main thread, immediate (use for small jobs or debugging)
    // job.Run();
}
```

---

## IJobEntity with ECB Parallel Writer

Use `EntityCommandBuffer.ParallelWriter` when the job needs structural changes. The `[ChunkIndexInQuery]` sort key is required for deterministic playback.

```csharp
[BurstCompile]
public partial struct DestroyDeadJob : IJobEntity
{
    public EntityCommandBuffer.ParallelWriter Ecb;

    void Execute([ChunkIndexInQuery] int chunkIndex, Entity entity, in Health health)
    {
        if (health.Current <= 0)
            Ecb.DestroyEntity(chunkIndex, entity);
    }
}

// In system:
var ecb = SystemAPI
    .GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>()
    .CreateCommandBuffer(state.WorldUnmanaged)
    .AsParallelWriter();

state.Dependency = new DestroyDeadJob { Ecb = ecb }
    .ScheduleParallel(state.Dependency);
```

---

## Query Filtering in IJobEntity

To restrict which entities the job processes, pass an `EntityQuery` to the schedule call or use `WithAll`/`WithNone` attributes on the job struct.

```csharp
// Attribute-based filtering (source-generated query)
[WithAll(typeof(Player))]
[WithNone(typeof(Dead))]
[BurstCompile]
public partial struct PlayerMoveJob : IJobEntity
{
    public float DeltaTime;

    void Execute(ref LocalTransform transform, in Velocity velocity)
    {
        transform.Position += velocity.Value * DeltaTime;
    }
}

// Manual query passed at schedule time
var query = SystemAPI.QueryBuilder()
    .WithAll<Player, Velocity>()
    .WithNone<Dead>()
    .Build();

state.Dependency = new PlayerMoveJob { DeltaTime = dt }
    .ScheduleParallel(query, state.Dependency);
```

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `[BurstCompile]` not applied | Ensure job struct is `partial` and attribute is on the struct |
| Race condition in parallel job | Never write to shared `NativeArray` without `NativeDisableParallelForRestriction` |
| ECB in parallel job without sort key | Add `[ChunkIndexInQuery] int chunkIndex` to `Execute` and pass as first arg to ECB calls |
| Job reading stale component data | Pass `state.Dependency` correctly — never ignore the dependency handle |
| `ScheduleParallel` on job with managed fields | Managed fields are not Burst-compatible; use only blittable types in job structs |
