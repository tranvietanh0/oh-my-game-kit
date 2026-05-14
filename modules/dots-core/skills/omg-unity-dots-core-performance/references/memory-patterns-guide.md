---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Memory Patterns & Collection Best Practices

## Memory Anti-Patterns

```csharp
// ANTI-PATTERN: allocating NativeList per entity per frame
foreach (var e in query) {
    var list = new NativeList<int>(Allocator.Temp); // OK in job Execute(), BAD in main-thread loop
}

// FIX: hoist before foreach
var list = new NativeList<int>(capacity, Allocator.Temp);
foreach (var e in query) { list.Clear(); ... }
list.Dispose();

// ANTI-PATTERN: StringBuilder per frame (BattleDebugUI pattern)
// FIX: cache StringBuilder as field, call Clear() each frame
```

## SharedStatic for Cross-System Data

Avoids duplicate grids across systems:
```csharp
public static readonly SharedStatic<SpatialHashGrid> SharedGrid =
    SharedStatic<SpatialHashGrid>.GetOrCreate<TargetGridSystem>();
// Access: SharedGrid.Data.Query(...)
// NOT: public static SpatialHashGrid (causes Burst BC1040 error)
```

## Spatial Hash vs Brute Force

Replace O(N*M) entity-pair checks with `SpatialHashGrid<T>`:
- Detection range queries: already uses SpatialHashGrid (DetectionSystem)
- Projectile collision, AOE, pickup: refactored to SpatialHashGrid (see MEMORY.md — Perf Audit)
- Rule: any system checking "is entity X within range of any entity Y" → use SpatialHashGrid

## Chunk Utilization (Anti-fragmentation)

Low chunk fill = wasted memory + cache misses. Target > 80% fill.

**Diagnoses from `performance_snapshot`:**
- Many archetypes with entity count < 10 → components too granular or tags added/removed mid-frame
- Archetype count growing over time → structural changes. Note: IEnableableComponent toggling does NOT create new archetypes — it uses a per-chunk bit

**Fixes:**
```csharp
// BEFORE: tag removal creates new archetype slot
ecb.RemoveComponent<AttackingTag>(entity);

// AFTER: use EnabledComponent (no archetype change)
SystemAPI.SetComponentEnabled<AttackingTag>(entity, false);
```

**InternalBufferCapacity tuning:**
- Default capacity = 8 elements inline in chunk
- Profile actual max buffer size → set `[InternalBufferCapacity(N)]` to match P95 usage
- Too large wastes chunk space; too small causes heap allocation per entity

## Collection Best Practices (from Unity Collections docs)

- `NativeList.ParallelWriter.AddNoResize()` — pre-allocate capacity; throws if exceeded
- `NativeParallelMultiHashMap` — use for spatial hashing, grouping; `AsParallelWriter()` for concurrent writes
- **Temp allocator shared safety handle** — all `Allocator.Temp` containers on same thread share one safety handle; resizing one invalidates all others. Use `TempJob` when mixing multiple temp containers
