---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Collections Advanced Guide — ParallelWriter, NativeParallelMultiHashMap, Known Issues

## NativeList.ParallelWriter Pattern

Write to `NativeList` from parallel jobs using `AddNoResize` (from Unity Collections docs):

```csharp
[BurstCompile]
public struct GatherResultsJob : IJobParallelFor
{
    public NativeList<int>.ParallelWriter ResultsWriter;

    public void Execute(int i)
    {
        // AddNoResize is thread-safe but CANNOT grow capacity
        ResultsWriter.AddNoResize(i * 2);
    }
}

// Schedule — pre-allocate capacity before scheduling
var results = new NativeList<int>(maxCount, Allocator.TempJob);
results.SetCapacity(maxCount); // MUST set capacity >= expected writes
new GatherResultsJob { ResultsWriter = results.AsParallelWriter() }
    .Schedule(maxCount, 64).Complete();
results.Dispose();
```

**Rule:** `ParallelWriter.AddNoResize` throws `InvalidOperationException` if capacity exceeded — always pre-allocate.

---

## NativeParallelMultiHashMap

Multi-value hash map for spatial hashing, grouping, and many-to-one relationships:

```csharp
var multiMap = new NativeParallelMultiHashMap<int, float3>(capacity, Allocator.TempJob);

// Write (main thread)
multiMap.Add(cellKey, position);

// Parallel write
var pw = multiMap.AsParallelWriter();
pw.Add(cellKey, position);

// Read (iterate all values for a key)
if (multiMap.TryGetFirstValue(cellKey, out float3 val, out var it))
{
    do { /* process val */ }
    while (multiMap.TryGetNextValue(out val, ref it));
}

multiMap.Dispose();
```

---

## Known Issue: Temp Allocator Safety Handles

All containers allocated with `Allocator.Temp` on the same thread share a single `AtomicSafetyHandle`. This means invalidating one enumerator (e.g., resizing a `NativeList`) invalidates ALL other `Temp`-allocated enumerators on that thread. Use `Allocator.TempJob` for containers used alongside other `Temp` containers.

---

## Unresolved Questions

- `NativeStream` parallel write/read patterns not covered here
