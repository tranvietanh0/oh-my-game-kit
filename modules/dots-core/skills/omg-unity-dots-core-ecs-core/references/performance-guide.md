---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Performance Priority — Unity DOTS ECS

**The entire point of DOTS is performance.** Every system, component, and query must be designed with performance as the primary concern.

## MCP Performance Profiling

Use `rendering_stats` MCP tool for automated perf profiling during Play mode:
- `rendering_stats(action="get_stats")` — draw calls, batches, triangles, vertices, FPS, batching breakdown
- `rendering_stats(action="get_memory")` — mono heap, graphics driver memory, reserved
- `rendering_stats(action="get_profiler")` — frame timing, GPU/CPU system info
- Combine with `manage_dots(action="performance_snapshot")` for ECS chunk utilization and archetype stats

## System Rules

- **Always use `ISystem` (struct)** — never `SystemBase` unless interfacing with managed APIs
- **Always add `[BurstCompile]`** on the struct AND each method (`OnUpdate`, `OnDestroy`, and `OnCreate` ONLY when `OnCreate` does no structural changes — see `gotchas-structural.md` → "Burst-Compiled OnCreate with Structural Changes Silently No-Ops")
- **Add `[RequireMatchingQueriesForUpdate]`** to skip `OnUpdate` when no matching entities exist
- **Always mark struct `partial`** — required for source generators

## Query Rules

- **Use `RefRO<T>` for read-only access** — better cache prefetching and parallel safety
- **Use `RefRW<T>` only when writing** — read-write has higher overhead
- **Use `in` for job parameters** that are read-only
- **Use `[WithAll]`, `[WithNone]`, `[WithAny]`** on `IJobEntity` for zero-cost filtering
- **Prefer `SystemAPI.Query`** for simple iteration; `IJobEntity` when parallelizable

## Component Rules

- **Keep components small** — fewer bytes = more entities per 16KB chunk = better cache
- **Use tag components (zero-size)** for flags
- **Use `IEnableableComponent`** instead of add/remove — avoids archetype moves
- **No managed types** — no `string`, `class`, `List<T>`, `Dictionary<K,V>`, delegates

## Structural Change Rules

- **Never make structural changes in hot loops** — use `EntityCommandBuffer`
- **Prefer `ECB.ParallelWriter`** in parallel jobs with `[ChunkIndexInQuery]` sort key
- **Prefer `IEnableableComponent`** toggle over add/remove for frequently changing states

## Common Gotchas

| Issue | Fix |
|-------|-----|
| Structural change inside foreach | Use ECB, defer to end of frame |
| `LocalTransform` missing on entity | Baker must use `TransformUsageFlags.Dynamic` |
| Baking not running | Ensure GameObject is inside a SubScene, not a regular scene |
| Query not matching entities | Check archetype viewer — component may not be added yet |
| Non-uniform scale has no effect | Use `TransformUsageFlags.NonUniformScale` to add `PostTransformMatrix` |
| **ISystem silently not registered** | Any managed API call in `[BurstCompile]` silently prevents registration. Replace with `private const` or Burst-safe alternatives |
| **Model pivot at center, not feet** | Create empty root GO with authoring; add primitive as child with `localPosition.y = meshHalfHeight * scale.y`. Never compensate in systems |
| **TickInterval guard** | Always `if (aoe.TickInterval <= 0f) continue;` before tick-timer logic |
| **Dual OrderFirst conflict** | Only ONE system per group should use `OrderFirst = true` |
| **Dead fields in jobs** | Remove unused job struct fields immediately |
| **SpatialHashGrid: use GetCellKeysStatic** | Instance method deleted — use `SpatialHashGrid.GetCellKeysStatic(center, radius, cellSize, keys)` |
| **CombatFormulas.IsTargetValid()** | Use helper for target validation — never duplicate the 4-line pattern |
| **ComponentLookup caching** | Cache in `OnCreate`, call `.Update(ref state)` in `OnUpdate`. Never call `GetComponentLookup` per frame |
| **ISystem can't [UpdateAfter/Before] SystemBase** | Cross-type ordering silently fails. Use `OrderFirst`/`OrderLast` or wrap in same group |
| **OrderFirst overrides [UpdateBefore/After]** | OrderFirst systems always sort before non-OrderFirst; `[UpdateBefore]` on non-OrderFirst vs OrderFirst is ignored |
| **CS1654: BufferLookup inside SystemAPI.Query foreach** | `DynamicBuffer<T>` obtained from `BufferLookup[entity]` inside a `SystemAPI.Query` foreach is treated as a foreach iteration variable — C# makes it immutable (CS1654). **Fix**: Collect entity data into `NativeList<T>` first, then process buffers in a separate `for` loop outside the `SystemAPI.Query` foreach |
| **RemoveAt() is O(n) on DynamicBuffer** | `DynamicBuffer<T>.RemoveAt(i)` shifts all subsequent elements — O(n). For backward-iteration removal, always use `RemoveAtSwapBack(i)` (O(1), swaps last element in). Never use `RemoveAt` inside loops over large buffers |
