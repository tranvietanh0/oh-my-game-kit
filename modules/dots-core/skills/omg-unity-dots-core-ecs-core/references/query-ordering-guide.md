---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Query & System Ordering Guide — Unity DOTS ECS

## EntityQuery (Builder)

Use when you need to operate on a query outside of foreach (bulk operations, ToArray, etc.).

```csharp
// Build once in OnCreate, cache as field
EntityQuery _deadQuery;

public void OnCreate(ref SystemState state)
{
    _deadQuery = SystemAPI.QueryBuilder()
        .WithAll<Dead, Health>()
        .WithNone<Player>()
        .Build();

    state.RequireForUpdate(_deadQuery);
}

public void OnUpdate(ref SystemState state)
{
    // Bulk destroy all matching entities
    state.EntityManager.DestroyEntity(_deadQuery);

    NativeArray<Health> healths =
        _deadQuery.ToComponentDataArray<Health>(Allocator.Temp);

    NativeArray<Entity> entities =
        _deadQuery.ToEntityArray(Allocator.Temp);
}
```

---

## System Ordering

**Built-in group order:** `InitializationSystemGroup` → `SimulationSystemGroup` (contains `FixedStepSimulationSystemGroup`) → `PresentationSystemGroup`. Each has `Begin*` and `End*` ECB systems.

```csharp
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateBefore(typeof(PhysicsSystemGroup))]
[UpdateAfter(typeof(InputSystem))]
[BurstCompile]
public partial struct MySystem : ISystem { }

// Custom group
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial class AISystemGroup : ComponentSystemGroup { }

[UpdateInGroup(typeof(AISystemGroup), OrderFirst = true)]
public partial struct PerceptionSystem : ISystem { }

[UpdateInGroup(typeof(AISystemGroup), OrderLast = true)]
public partial struct DecisionSystem : ISystem { }

// Disable a system at startup
[DisableAutoCreation]
public partial struct OptionalSystem : ISystem { }
```

> For Worlds, bootstrap, and IAspect patterns, see [worlds-aspect-guide.md](worlds-aspect-guide.md).
