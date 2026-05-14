---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Runtime Patterns Guide

## Pattern: Runtime Entity Creation (Main Thread)

Use for prototype setup; clone with ECB for bulk spawning.

```csharp
// Usings: Unity.Entities, Unity.Rendering, Unity.Transforms, Unity.Mathematics,
//         UnityEngine, UnityEngine.Rendering, Unity.Collections, Unity.Jobs
public class RenderableSpawner : MonoBehaviour
{
    public Mesh mesh; public Material material; public int count = 1000;
    void Start()
    {
        var em = World.DefaultGameObjectInjectionWorld.EntityManager;
        var desc = new RenderMeshDescription(ShadowCastingMode.On, receiveShadows: true);
        var rma  = new RenderMeshArray(new[] { material }, new[] { mesh });

        var prototype = em.CreateEntity();
        RenderMeshUtility.AddComponents(prototype, em, desc, rma,
            MaterialMeshInfo.FromRenderMeshArrayIndices(0, 0));
        em.AddComponentData(prototype, new LocalToWorld());

        using var ecb = new EntityCommandBuffer(Allocator.TempJob);
        new SpawnJob { Prototype = prototype, Ecb = ecb.AsParallelWriter() }
            .Schedule(count, 128).Complete();
        ecb.Playback(em);
        em.DestroyEntity(prototype);
    }

    [Unity.Burst.BurstCompile]
    struct SpawnJob : IJobParallelFor
    {
        public Entity Prototype;
        public EntityCommandBuffer.ParallelWriter Ecb;
        public void Execute(int i)
        {
            var e = Ecb.Instantiate(i, Prototype);
            Ecb.SetComponent(i, e, new LocalToWorld
                { Value = float4x4.Translate(new float3(i % 32, 0, i / 32)) });
        }
    }
}
```

## Pattern: Prefab-Based Spawning (Most Efficient)

```csharp
// Authoring: expose prefab Entity reference
public class SpawnerAuthoring : MonoBehaviour
{
    public GameObject prefab; // must be in SubScene or as reference
}

public class SpawnerBaker : Baker<SpawnerAuthoring>
{
    public override void Bake(SpawnerAuthoring src)
    {
        var e = GetEntity(TransformUsageFlags.None);
        AddComponent(e, new SpawnerData
        {
            Prefab = GetEntity(src.prefab, TransformUsageFlags.Dynamic)
        });
    }
}

public struct SpawnerData : IComponentData
{
    public Entity Prefab;
}

// Runtime: Instantiate from prefab (all rendering components included)
[BurstCompile]
public partial struct SpawnSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.Temp);
        foreach (var spawner in SystemAPI.Query<RefRO<SpawnerData>>())
        {
            var e = ecb.Instantiate(spawner.ValueRO.Prefab);
            ecb.SetComponent(e, LocalTransform.FromPosition(new float3(0, 0, 0)));
        }
        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}
```

## Pattern: Swap Mesh / Material at Runtime

```csharp
// Method A: Change indices into existing RenderMeshArray (preferred — no structural change)
em.SetComponentData(entity, MaterialMeshInfo.FromRenderMeshArrayIndices(
    materialIndex: 1,
    meshIndex: 0,
    subMesh: 0));

// Method B: Replace entire RenderMeshArray (structural change — expensive)
em.SetSharedComponentManaged(entity, new RenderMeshArray(
    new[] { newMaterial },
    new[] { newMesh }));
em.SetComponentData(entity, MaterialMeshInfo.FromRenderMeshArrayIndices(0, 0));
```

Prefer Method A — changing `MaterialMeshInfo` is a simple component write with no structural change.

## Pattern: Enable / Disable Rendering (and Pooling)

`DisableRendering` is a zero-size tag — no cost. More efficient than Destroy/Create for frequent toggling.

```csharp
// Hide / show via EntityManager
em.AddComponent<DisableRendering>(entity);
em.RemoveComponent<DisableRendering>(entity);

// Hide / show via ECB (Burst-safe, preferred in systems)
ecb.AddComponent<DisableRendering>(entity);
ecb.RemoveComponent<DisableRendering>(entity);

// NOTE: DisableRendering only stops rendering — physics/logic still runs.
// For full disable, use SetEnabled(entity, false) which cascades.

// Pooling pattern: pair with a logic-gate tag
public struct Inactive : IComponentData { }

ecb.AddComponent<DisableRendering>(entity);  // deactivate
ecb.AddComponent<Inactive>(entity);

ecb.RemoveComponent<DisableRendering>(entity); // activate
ecb.RemoveComponent<Inactive>(entity);
```
