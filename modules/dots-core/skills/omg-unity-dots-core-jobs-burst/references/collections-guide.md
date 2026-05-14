---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Collections Guide — NativeArray, NativeList, NativeHashMap, Allocators, Disposal

## Allocators

| Allocator | Lifetime | Job-safe | Speed | Notes |
|-----------|----------|----------|-------|-------|
| `Allocator.Temp` | 1 frame (auto-freed) | NO | Fastest | Main-thread only |
| `Allocator.TempJob` | 4 frames max | YES | Fast | Must Dispose within 4 frames |
| `Allocator.Persistent` | Indefinite | YES | Slow (malloc) | Must Dispose manually |

**Pitfall:** Never pass `Allocator.Temp` to a job — it is not job-safe and will crash.
Use `Allocator.TempJob` with deferred disposal: `arr.Dispose(jobHandle)`.

---

## Collections Overview

| Type | Resizable | Parallel Write | Key/Value |
|------|-----------|----------------|-----------|
| `NativeArray` | No | With restriction | No |
| `NativeList` | Yes | No | No |
| `NativeHashMap` | Yes | Via ParallelWriter | Yes |
| `NativeHashSet` | Yes | Via ParallelWriter | No |
| `NativeQueue` | Yes | Via ParallelWriter | No |
| `NativeReference` | N/A | No | Single value |
| `FixedList32Bytes` | Yes (stack) | No | No |

---

## NativeArray — Fixed-Size Buffer

```csharp
var arr = new NativeArray<float3>(count, Allocator.TempJob);
arr[0] = new float3(1, 2, 3);
float3 val = arr[0];
NativeSlice<float3> slice = arr.Slice(10, 50); // view — no copy
arr.Dispose();                              // immediate
arr.Dispose(jobHandle);                     // deferred
using var arr2 = new NativeArray<int>(10, Allocator.Temp); // using (Temp only)
```

---

## NativeList — Resizable Array

```csharp
var list = new NativeList<int>(initialCapacity: 64, Allocator.Persistent);
list.Add(42);
list.AddRange(otherNativeArray);
list.RemoveAtSwapBack(0);           // O(1) unordered remove
NativeArray<int> view = list.AsArray(); // no copy
list.Dispose();
```

---

## NativeHashMap — Key/Value Store

```csharp
var map = new NativeHashMap<int, float3>(capacity: 128, Allocator.TempJob);
map.Add(entityId, position);
map.TryAdd(entityId, position);           // false if key exists
bool found = map.TryGetValue(key, out float3 pos);
map.Remove(key);
map[key] = newValue;                      // overwrite

// Parallel write
NativeHashMap<int, float3>.ParallelWriter pw = map.AsParallelWriter();
pw.TryAdd(index, value);                  // thread-safe; fails on duplicate
map.Dispose();
```

---

## NativeHashSet

```csharp
var set = new NativeHashSet<int>(64, Allocator.TempJob);
set.Add(id); set.Contains(id); set.Remove(id);
NativeHashSet<int>.ParallelWriter pw = set.AsParallelWriter();
pw.Add(id);
```

## NativeQueue

```csharp
var queue = new NativeQueue<int>(Allocator.Persistent);
queue.Enqueue(value);
bool ok = queue.TryDequeue(out int val);
NativeQueue<int>.ParallelWriter pw = queue.AsParallelWriter();
pw.Enqueue(value);
queue.Dispose();
```

## NativeReference — Single Value

```csharp
var counter = new NativeReference<int>(0, Allocator.TempJob);
counter.Value = 42;
counter.Dispose();
```

## FixedList — Stack-Allocated (No Disposal Needed)

```csharp
// Sizes: 32, 64, 128, 512, 4096 bytes
var list = new FixedList32Bytes<int>(); // ~7 ints; Burst-compatible
list.Add(1);
```

## Unsafe Variants (No Safety Checks — Advanced)

```csharp
using Unity.Collections.LowLevel.Unsafe;
var unsafeList = new UnsafeList<int>(64, Allocator.Persistent);
var unsafeMap  = new UnsafeHashMap<int, float>(64, Allocator.Persistent);
// Must Dispose manually
```

---

## Disposal Patterns

```csharp
array.Dispose();                                          // 1. immediate

JobHandle h = job.Schedule();
array.Dispose(h);                                         // 2. deferred after job

using var temp = new NativeArray<int>(64, Allocator.Temp); // 3. using (Temp only)

void OnCreate()  => _persistent = new NativeArray<float>(1000, Allocator.Persistent);
void OnDestroy() => _persistent.Dispose();                // 4. Persistent lifetime

if (array.IsCreated) array.Dispose();                     // 5. guard before disposing
```

---

-> See [collections-advanced-guide.md](collections-advanced-guide.md) for NativeList.ParallelWriter, NativeParallelMultiHashMap, and Temp allocator safety handle issue.

