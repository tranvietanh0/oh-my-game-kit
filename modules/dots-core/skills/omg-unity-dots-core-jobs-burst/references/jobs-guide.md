---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Jobs Guide — IJobEntity, IJobChunk, IJob, IJobParallelFor

> **Note:** For the canonical IJobEntity + ECS integration patterns, see `dots-ecs-core` skill (`references/jobs-guide.md`). This file covers IJobChunk, IJob, IJobParallelFor, and advanced scheduling.

## Job Types

| Type | Use Case | ECS? | Parallel? |
|------|----------|------|-----------|
| `IJobEntity` | Iterate ECS entities — preferred | Yes | Yes (ScheduleParallel) |
| `IJobChunk` | Manual chunk control, complex filtering | Yes | Yes |
| `IJob` | Single unit of work | No | No |
| `IJobParallelFor` | Non-ECS array processing | No | Yes |

## 1. IJobEntity (Preferred ECS Job)
> See `dots-ecs-core` skill (`references/jobs-guide.md`) for canonical IJobEntity patterns and ECB parallel writer usage.

Unique attributes not covered in ecs-core:
```csharp
[WithChangeFilter(typeof(A))]       // only chunks where A changed last frame
[WithOptions(EntityQueryOptions.IncludeDisabledEntities)]
```

To reuse a job with an explicit query (advanced scheduling):
```csharp
_query = new EntityQueryBuilder(Allocator.Temp)
    .WithAllRW<LocalTransform>().WithAll<Velocity, IsAliveTag>().Build(ref state);
new MoveJob { DeltaTime = dt }.ScheduleParallel(_query, state.Dependency);
```

## 2. IJobChunk (Manual Chunk Control)
Use when you need chunk metadata, order indices, or enableable-component logic.

```csharp
[BurstCompile]
public struct HealthRegenJob : IJobChunk
{
    public ComponentTypeHandle<Health> HealthHandle;
    [ReadOnly] public ComponentTypeHandle<RegenRate> RegenHandle;
    public float DeltaTime;
    [BurstCompile]
    public void Execute(in ArchetypeChunk chunk, int unfilteredChunkIndex,
                        bool useEnabledMask, in v128 chunkEnabledMask)
    {
        var healths    = chunk.GetNativeArray(ref HealthHandle);
        var regens     = chunk.GetNativeArray(ref RegenHandle);
        var enumerator = new ChunkEntityEnumerator(useEnabledMask, chunkEnabledMask, chunk.Count);
        while (enumerator.NextEntityIndex(out int i))
        { var h = healths[i]; h.Value = math.min(h.Max, h.Value + regens[i].PerSecond * DeltaTime); healths[i] = h; }
    }
}
// System scheduling — update ComponentTypeHandle every frame in OnUpdate, not OnCreate
Dependency = new HealthRegenJob
{
    HealthHandle = GetComponentTypeHandle<Health>(false),   // false = write
    RegenHandle  = GetComponentTypeHandle<RegenRate>(true), // true = read
    DeltaTime    = World.Time.DeltaTime
}.ScheduleParallel(_query, Dependency);
```

## 3. IJob (Single-Task)
```csharp
[BurstCompile]
public struct SumJob : IJob
{
    [ReadOnly] public NativeArray<float> Input;
    public NativeArray<float> Result; // length 1
    public void Execute() { float s = 0f; for (int i = 0; i < Input.Length; i++) s += Input[i]; Result[0] = s; }
}
var input  = new NativeArray<float>(1000, Allocator.TempJob);
var result = new NativeArray<float>(1, Allocator.TempJob);
new SumJob { Input = input, Result = result }.Schedule().Complete();
float total = result[0];
input.Dispose(); result.Dispose();
```

## 4. IJobParallelFor (Non-ECS Parallel)
```csharp
[BurstCompile]
public struct ScaleJob : IJobParallelFor
{
    [ReadOnly]  public NativeArray<float3> Positions;
    [WriteOnly] public NativeArray<float3> Scaled;
    public float Factor;
    public void Execute(int index) => Scaled[index] = Positions[index] * Factor;
}
// innerloopBatchCount: smaller = better load balance, more scheduling overhead
new ScaleJob { Positions = positions, Scaled = scaled, Factor = 2f }
    .Schedule(positions.Length, 64);
```

## 5. JobHandle Dependencies
```csharp
JobHandle hA = jobA.Schedule();
JobHandle hB = jobB.Schedule(hA);                                      // chain
JobHandle hC = jobC.Schedule(JobHandle.CombineDependencies(hA, hB));   // fan-in
hC.Complete();
new NativeList<int>(Allocator.TempJob).Dispose(fillJob.Schedule());    // deferred disposal
```

## 6. Job Safety Attributes
```csharp
[ReadOnly]                                // shared read access
[WriteOnly]                               // write-only (NativeArray only)
[NativeDisableParallelForRestriction]     // bypass parallel write safety
[NativeDisableContainerSafetyRestriction] // disable all safety (use sparingly)
[DeallocateOnJobCompletion]               // deprecated — use Dispose(handle)
```

## Full Pattern: System with Persistent Collection
```csharp
public partial struct EnemyAISystem : ISystem
{
    NativeList<float3> _targets;
    public void OnCreate(ref SystemState state) =>
        _targets = new NativeList<float3>(256, Allocator.Persistent);
    public void OnDestroy(ref SystemState state) => _targets.Dispose();
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        _targets.Clear();
        state.Dependency = new SeekJob
        {
            Targets = _targets.AsArray(), DeltaTime = SystemAPI.Time.DeltaTime
        }.ScheduleParallel(state.Dependency);
    }
}
```
