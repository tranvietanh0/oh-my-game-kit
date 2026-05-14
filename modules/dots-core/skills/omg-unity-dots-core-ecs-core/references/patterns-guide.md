---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ECS Patterns Guide

## IEnableableComponent Pattern

Use `IEnableableComponent` for boolean config flags that toggle behavior:

```csharp
// Before (boolean field = runtime cost)
public struct Respawn : IComponentData
{
    public bool Enabled;  // ← costs storage even when unused
    public float Delay;
}

// After (toggle via SetComponentEnabled — no archetype move!)
public struct RespawnConfig : IEnableableComponent
{
    public float Delay;
    public float RespawnPosition;
    public bool Initialized;
}

// Usage
SystemAPI.SetComponentEnabled<RespawnConfig>(entity, true);  // Enable respawn
if (SystemAPI.IsComponentEnabled<RespawnConfig>(entity)) { /* respawn active */ }
```

**Benefits**:
- No archetype move — toggles directly without syncing
- Query filter: `.WithAll<RespawnConfig>()` or `.WithNone<RespawnConfig>()`
- Lower memory: disabled instances don't waste RAM (no payload required)
- Example: RespawnConfig, HasSpawnedTag (Phase 3-5 refactor)

**NEVER use `GetSingletonEntity<T>()`, `HasSingleton<T>()`, or `TryGetSingletonEntity<T>()` on `IEnableableComponent` types** — throws `InvalidOperationException`. Use `SystemAPI.Query<RefRW<T>>().WithPresent<T>().WithEntityAccess()` instead.

→ See `gotchas-structural.md` for `SetComponentEnabled` structural change gotcha and two-pass pattern.

---

## LINQ Policy (MANDATORY)

**NEVER use `System.Linq` in runtime DOTS code.** It allocates on every call (delegates, iterators, closures), is not Burst-compatible, and causes GC spikes at 60fps.

| Context | Use | Why |
|---------|-----|-----|
| `[BurstCompile]` systems/jobs | `foreach` / manual loops | Burst can't compile delegates |
| `SystemAPI.Query` | `foreach` (already zero-alloc) | Built-in ECS iteration |
| Non-Burst managed code (UI, spawners) | `ZLinq` (`AsValueEnumerable()`) | Zero-alloc LINQ alternative |
| Editor tools, tests | `System.Linq` or `ZLinq` | No perf concern |

> See `zlinq` skill for API patterns. See `zstring` skill for zero-alloc string formatting.

---

## Performance Priority (MANDATORY)

**The entire point of DOTS is performance.** Every system, component, and query must be designed with performance as the primary concern.

Key rules:
- `ISystem` always (never `SystemBase`)
- `[BurstCompile]` on struct + each method
- `[RequireMatchingQueriesForUpdate]`
- `partial` struct
- Use `RefRO<T>` for reads, `RefRW<T>` for writes
- Keep components small
- Use `IEnableableComponent` over add/remove
- Defer structural changes to ECB

→ See [performance-guide.md](performance-guide.md) for full rules, MCP profiling steps, and gotcha table (15 entries including silent ISystem failure, model pivot, OrderFirst conflicts).
