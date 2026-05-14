---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Baking Guide — Unity DOTS ECS

## Baker & Baking Overview

Convert GameObjects in a subscene into ECS entities at edit time or build time.
Bakers run on `MonoBehaviour` authoring components placed inside a SubScene.

---

## Basic Baker Pattern

```csharp
// 1. ECS component
public struct RotationSpeed : IComponentData
{
    public float RadiansPerSecond;
}

// 2. Authoring MonoBehaviour (Editor-visible)
public class RotationSpeedAuthoring : MonoBehaviour
{
    public float DegreesPerSecond = 360f;
}

// 3. Baker — nested class convention (or standalone)
class RotationSpeedBaker : Baker<RotationSpeedAuthoring>
{
    public override void Bake(RotationSpeedAuthoring authoring)
    {
        // TransformUsageFlags.Dynamic    → adds LocalTransform component
        // TransformUsageFlags.None       → no transform components
        // TransformUsageFlags.Renderable → read-only LocalToWorld
        var entity = GetEntity(authoring, TransformUsageFlags.Dynamic);

        AddComponent(entity, new RotationSpeed
        {
            RadiansPerSecond = math.radians(authoring.DegreesPerSecond)
        });
    }
}
```

---

## Baker with Dependencies and Multiple Entities

```csharp
class SpawnerBaker : Baker<SpawnerAuthoring>
{
    public override void Bake(SpawnerAuthoring authoring)
    {
        DependsOn(authoring.PrefabReference); // re-bake if prefab changes
        DependsOn(authoring.ConfigAsset);

        if (authoring.PrefabReference == null) return;

        var entity = GetEntity(authoring, TransformUsageFlags.None);
        AddComponent(entity, new Spawner
        {
            Prefab = GetEntity(authoring.PrefabReference, TransformUsageFlags.Dynamic),
            Rate = authoring.Rate
        });

        AddBuffer<Waypoint>(entity);

        // Additional entity for a sub-component
        var markerEntity = CreateAdditionalEntity(TransformUsageFlags.None,
            entityName: "SpawnMarker");
        AddComponent(markerEntity, new SpawnMarker());
    }
}
```

---

## Baking System

Post-baker pass — runs after all bakers, no access to authoring `MonoBehaviour`.
Use to initialize derived data or fill in values that depend on other baked components.

```csharp
[WorldSystemFilter(WorldSystemFilterFlags.BakingSystem)]
public partial struct InitHealthBakingSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        foreach (var health in SystemAPI.Query<RefRW<Health>>())
            health.ValueRW.Current = health.ValueRO.Max;
    }
}
```

---

## BlobAsset in Baker

To build a `BlobAsset` and register it so it survives baking and is tracked by the asset store:

```csharp
using var builder = new BlobBuilder(Allocator.Temp);
ref var root = ref builder.ConstructRoot<EnemyStats>();
root.Speed = 5f;

var curveArray = builder.Allocate(ref root.DamageCurve, 4);
curveArray[0] = 1f; curveArray[1] = 2f; curveArray[2] = 3f; curveArray[3] = 5f;

var blobRef = builder.CreateBlobAssetReference<EnemyStats>(Allocator.Persistent);
AddBlobAsset(ref blobRef, out _); // registers for dedup and lifecycle
AddComponent(entity, new EnemyStatsRef { Blob = blobRef });
```

---

## TransformUsageFlags Reference

| Flag | Effect | When to Use |
|------|--------|-------------|
| `Dynamic` | Adds `LocalTransform` + `LocalToWorld` (read-write) | Moving entities (agents, projectiles, pickups) |
| `Renderable` | Adds read-only `LocalToWorld` | Static rendered objects |
| `WorldSpace` | Adds `LocalToWorld` in world space | Objects not parented |
| `NonUniformScale` | Adds `PostTransformMatrix` for non-uniform scale | Stretched meshes |
| `None` | No transform components | Data-only entities (config singletons, spawners) |

**Rule:** Always pass `TransformUsageFlags.Dynamic` for entities that move at runtime. Missing this flag = no `LocalTransform` = entity stuck at origin.

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| Baking not running | Ensure GameObject is inside a SubScene (not a regular scene) |
| `LocalTransform` missing on baked entity | Baker must use `TransformUsageFlags.Dynamic` |
| Baker not re-running after asset change | Call `DependsOn(asset)` for every asset the baker reads |
| Additional entities not visible in inspector | Use `entityName` parameter in `CreateAdditionalEntity` |
| `SaveAsPrefabAsset()` strips components | Overwrites entire prefab — editor scripts must add ALL authorings (attack types, BDP trees, etc.) |
| SubScene not re-baking after prefab change | Use `AssetDatabase.ImportAsset(path, ForceUpdate \| ForceSynchronousImport)` on both prefabs AND SubScene |
