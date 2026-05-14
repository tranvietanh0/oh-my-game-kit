---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Queries & Raycasting Guide — Unity DOTS Physics

## Overview

All spatial queries go through `PhysicsWorldSingleton`, obtained via `SystemAPI.GetSingleton<PhysicsWorldSingleton>()`. Queries must run in `OnUpdate`, not `OnCreate`.

## Single Closest-Hit Raycast

```csharp
[BurstCompile]
[UpdateInGroup(typeof(FixedStepSimulationSystemGroup))]
[UpdateBefore(typeof(PhysicsSystemGroup))]
public partial struct RaycastSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var physicsWorld = SystemAPI.GetSingleton<PhysicsWorldSingleton>();

        var input = new RaycastInput
        {
            Start = float3.zero,
            End   = new float3(0, -10, 0),
            Filter = new CollisionFilter
            {
                BelongsTo    = ~0u,
                CollidesWith = PhysicsLayers.Terrain | PhysicsLayers.Enemy,
                GroupIndex   = 0
            }
        };

        if (physicsWorld.CastRay(input, out var hit))
        {
            // hit.Entity, hit.Position, hit.Normal, hit.Fraction, hit.RigidBodyIndex
        }
    }
}
```

## All-Hits Raycast

```csharp
var allHits = new NativeList<RaycastHit>(Allocator.Temp);
if (physicsWorld.CastRay(input, ref allHits))
{
    foreach (var h in allHits) { /* process */ }
}
allHits.Dispose();
```

## Sphere Cast (Collider Cast)

```csharp
var sphereGeo = new SphereGeometry { Center = float3.zero, Radius = 0.5f };
var sphereBlob = SphereCollider.Create(sphereGeo, CollisionFilter.Default);
unsafe
{
    var castInput = new ColliderCastInput
    {
        Collider    = (Collider*)sphereBlob.GetUnsafePtr(),
        Orientation = quaternion.identity,
        Start       = float3.zero,
        End         = new float3(0, -10, 0)
    };
    if (physicsWorld.CastCollider(castInput, out var castHit)) { /* use castHit */ }
}
sphereBlob.Dispose();
```

## Point Distance Query (Closest Object Within Radius)

```csharp
var distInput = new PointDistanceInput
{
    Position    = float3.zero,
    MaxDistance = 5f,
    Filter      = CollisionFilter.Default
};
if (physicsWorld.CalculateDistance(distInput, out var distHit))
{
    // distHit.Entity, distHit.Distance, distHit.Position
}
```

## Overlap — All Bodies Within Radius

```csharp
var overlapHits = new NativeList<DistanceHit>(Allocator.Temp);
var aabbInput = new PointDistanceInput
{
    Position    = float3.zero,
    MaxDistance = 3f,
    Filter      = CollisionFilter.Default
};
physicsWorld.CalculateDistance(aabbInput, ref overlapHits);
overlapHits.Dispose();
```

## Batched Raycasts (Burst Job — Preferred for Multiple Rays)

```csharp
[BurstCompile]
public struct BatchRaycastJob : IJobParallelFor
{
    [ReadOnly] public CollisionWorld World;
    [ReadOnly] public NativeArray<RaycastInput> Inputs;
    [WriteOnly] public NativeArray<RaycastHit> Results;

    public unsafe void Execute(int i)
    {
        World.CastRay(Inputs[i], out Results[i]);
    }
}
```

## CollisionFilter Reference

```csharp
public struct CollisionFilter
{
    public uint BelongsTo;    // Bitmask: which layers this collider is on
    public uint CollidesWith; // Bitmask: which layers this collider interacts with
    public int GroupIndex;    // Override: same positive = always collide, same negative = never collide
}

// Common patterns
CollisionFilter.Default       // BelongsTo = ~0u, CollidesWith = ~0u, GroupIndex = 0
new CollisionFilter { BelongsTo = 1u << 6, CollidesWith = 1u << 7, GroupIndex = 0 } // Terrain only hits Obstacle
```

**Optimization:** Always narrow `CollidesWith` to the minimum set of layers needed — reduces broadphase pair count.

-> See [events-guide.md](events-guide.md) for collision/trigger event systems and stateful enter/stay/exit patterns.
