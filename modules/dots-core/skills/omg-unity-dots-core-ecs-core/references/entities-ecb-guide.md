---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Entities & EntityCommandBuffer Guide — Unity DOTS ECS

## EntityManager

Direct structural changes on the main thread. Only safe outside jobs.

```csharp
// Access via ISystem
EntityManager em = state.EntityManager;

// Create / destroy
Entity entity = em.CreateEntity();
em.DestroyEntity(entity);
em.DestroyEntity(query); // bulk destroy matching query

// Add / remove components
em.AddComponent<Dead>(entity);
em.RemoveComponent<Health>(entity);
em.AddComponentData(entity, new Health { Current = 100, Max = 100 });

// Read / write components
Health h = em.GetComponentData<Health>(entity);
em.SetComponentData(entity, new Health { Current = 50, Max = 100 });

// Instantiate prefab
Entity instance = em.Instantiate(prefabEntity);
```

---

## EntityCommandBuffer

Defers structural changes (add/remove component, create/destroy entity) to be played back later. Required in jobs. Burst-compatible.

```csharp
// Get ECB from system singleton (most common pattern)
[BurstCompile]
public void OnUpdate(ref SystemState state)
{
    var ecb = SystemAPI
        .GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>()
        .CreateCommandBuffer(state.WorldUnmanaged);

    foreach (var (health, entity) in
        SystemAPI.Query<RefRO<Health>>().WithEntityAccess())
    {
        if (health.ValueRO.Current <= 0)
        {
            ecb.AddComponent<Dead>(entity);
            ecb.RemoveComponent<Health>(entity);
        }
    }
    // ECB plays back automatically at end of EndSimulationEntityCommandBufferSystem
}

// Manual ECB (dispose yourself)
var ecb = new EntityCommandBuffer(Allocator.TempJob);
ecb.CreateEntity();
ecb.Playback(state.EntityManager);
ecb.Dispose();
```

**Available ECB system singletons:**

```csharp
// BeginInitializationEntityCommandBufferSystem.Singleton
// EndInitializationEntityCommandBufferSystem.Singleton
// BeginSimulationEntityCommandBufferSystem.Singleton
// EndSimulationEntityCommandBufferSystem.Singleton
// BeginPresentationEntityCommandBufferSystem.Singleton
```

---

## ECB Parallel Writer

Use when scheduling `IJobEntity` with `ScheduleParallel`. Requires `[ChunkIndexInQuery]` sort key.

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

## Common Structural Change Patterns

```csharp
// Instantiate prefab via ECB
ecb.Instantiate(prefabEntity);

// Set component on newly instantiated entity
var instance = ecb.Instantiate(prefabEntity);
ecb.SetComponent(instance, new Health { Current = 100, Max = 100 });

// Add buffer element deferred
ecb.AppendToBuffer(entity, new Waypoint { Position = float3.zero });

// Set shared component (causes chunk move)
ecb.SetSharedComponent(entity, new RenderLayer { Layer = 2 });
```

---

## Deferred Entity Remapping

ECB methods like `CreateEntity()` and `Instantiate()` return **placeholder Entity values**. These deferred entities are only meaningful within the same ECB's recorded commands. During playback, all entity references in components/buffers are remapped to actual entities.

```csharp
// Create two linked entities in a single ECB
var parent = ecb.CreateEntity();
var child = ecb.Instantiate(prefabEntity);
ecb.AddComponent(child, new Parent { Value = parent }); // parent is deferred — remapped on playback
ecb.SetComponent(parent, new ChildRef { Value = child });
// Both references resolve correctly after Playback()
```

**Rule:** Never use deferred entity values outside the ECB that created them — they have no meaning after playback.

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| Structural change inside foreach | Use ECB, defer to end of frame |
| `state.EntityManager` in parallel job | Use `EntityCommandBuffer.ParallelWriter` |
| Query not matching entities | Check archetype viewer — component may not be added yet |
| Deferred entity used outside its ECB | Deferred entities only valid within the same ECB's commands |
| ECB playback order non-deterministic | Use `[ChunkIndexInQuery]` sort key with ParallelWriter |
| **`SetComponent` on instantiated entity fails** | **Use `AddComponent` for components not baked into the prefab. `SetComponent` requires the component to already exist on the entity archetype. If the prefab doesn't have MoveDirection/MoveSpeed/ProjectileData baked, `ecb.SetComponent()` throws `AppendRemovedComponentRecordError`. Always use `ecb.AddComponent()` for runtime-only components.** |
| **Structures invisible to AI detection** | **Structures need `GameEntityTag` in their Baker. DetectionSystem's spatial grid only includes entities with `GameEntityTag` — without it, AI units can never perceive or target structures.** |
