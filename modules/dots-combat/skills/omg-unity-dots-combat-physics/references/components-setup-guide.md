---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Components & Entity Setup Guide — Unity DOTS Physics

## Required Components

### Static Body
| Component | Purpose |
|-----------|---------|
| `LocalTransform` | Position/rotation |
| `LocalToWorld` | World transform |
| `PhysicsCollider` | Collision shape (required for all) |
| `PhysicsWorldIndex` | World assignment (default = 0) |

### Dynamic Body (add to static set)
| Component | Purpose |
|-----------|---------|
| `PhysicsVelocity` | Linear + angular velocity |
| `PhysicsMass` | Mass properties + inertia |
| `PhysicsDamping` | Drag/angular drag |
| `PhysicsGravityFactor` | Gravity multiplier (1 = normal) |

## Collider Factory Methods

| Method | Shape |
|--------|-------|
| `SphereCollider.Create(SphereGeometry, filter)` | Sphere |
| `BoxCollider.Create(BoxGeometry, filter)` | Box |
| `CapsuleCollider.Create(CapsuleGeometry, filter)` | Capsule |
| `CylinderCollider.Create(CylinderGeometry, filter)` | Cylinder |
| `ConvexCollider.Create(points, filter)` | Convex hull |
| `MeshCollider.Create(meshData, filter, material)` | Mesh (expensive) |
| `CompoundCollider.Create(NativeArray<ColliderBlobInstance>)` | Compound |

## Creating Physics Entities at Runtime

```csharp
using Unity.Entities;
using Unity.Mathematics;
using Unity.Physics;
using Unity.Transforms;

namespace DOTSAI.Physics
{
    public static class PhysicsEntityFactory
    {
        public static unsafe Entity CreateDynamicBox(
            EntityManager em,
            float3 position,
            float3 halfExtents,
            float mass = 1f,
            float3 linearVelocity = default)
        {
            var geo = new BoxGeometry
            {
                Center = float3.zero,
                Orientation = quaternion.identity,
                Size = halfExtents * 2f,
                BevelRadius = 0.05f
            };
            var collider = BoxCollider.Create(geo, CollisionFilter.Default);

            var entity = em.CreateEntity(
                typeof(LocalTransform), typeof(LocalToWorld),
                typeof(PhysicsCollider), typeof(PhysicsWorldIndex),
                typeof(PhysicsVelocity), typeof(PhysicsMass),
                typeof(PhysicsDamping), typeof(PhysicsGravityFactor));

            em.SetComponentData(entity, LocalTransform.FromPosition(position));
            em.SetComponentData(entity, new PhysicsCollider { Value = collider });
            em.SetSharedComponentManaged(entity, new PhysicsWorldIndex { Value = 0 });
            var colliderPtr = (Collider*)collider.GetUnsafePtr();
            em.SetComponentData(entity, PhysicsMass.CreateDynamic(colliderPtr->MassProperties, mass));
            em.SetComponentData(entity, new PhysicsVelocity { Linear = linearVelocity });
            em.SetComponentData(entity, new PhysicsDamping { Linear = 0.01f, Angular = 0.05f });
            em.SetComponentData(entity, new PhysicsGravityFactor { Value = 1f });
            return entity;
        }

        public static Entity CreateStaticSphere(EntityManager em, float3 position, float radius)
        {
            var collider = SphereCollider.Create(
                new SphereGeometry { Center = float3.zero, Radius = radius },
                CollisionFilter.Default);
            var entity = em.CreateEntity(
                typeof(LocalTransform), typeof(LocalToWorld),
                typeof(PhysicsCollider), typeof(PhysicsWorldIndex));
            em.SetComponentData(entity, LocalTransform.FromPosition(position));
            em.SetComponentData(entity, new PhysicsCollider { Value = collider });
            em.SetSharedComponentManaged(entity, new PhysicsWorldIndex { Value = 0 });
            return entity;
        }
    }
}
```

## Collision Filter — Layer Masking

Collision requires BOTH sides to permit it: `(A.BelongsTo & B.CollidesWith) != 0` and vice versa.
`GroupIndex`: 0 = use bitmasks, positive = always collide, negative = never collide.

```csharp
public static class PhysicsLayers
{
    public const uint Player     = 1 << 1;
    public const uint Enemy      = 1 << 2;
    public const uint Terrain    = 1 << 4;
    public const uint Everything = ~0u;
}

var playerFilter = new CollisionFilter
{
    BelongsTo    = PhysicsLayers.Player,
    CollidesWith = PhysicsLayers.Enemy | PhysicsLayers.Terrain,
    GroupIndex   = 0
};

// To modify at runtime in a job (must be unique blob):
unsafe { collider.Value.Value.SetCollisionFilter(NewFilter); }
```

## Compound Colliders

```csharp
using Unity.Collections;
public static BlobAssetReference<Collider> CreateCharacterCollider()
{
    var children = new NativeArray<CompoundCollider.ColliderBlobInstance>(2, Allocator.Temp);
    children[0] = new CompoundCollider.ColliderBlobInstance
    {
        Collider = CapsuleCollider.Create(new CapsuleGeometry
        {
            Vertex0 = new float3(0, 0.5f, 0),
            Vertex1 = new float3(0, 1.5f, 0),
            Radius = 0.4f
        }, CollisionFilter.Default),
        CompoundFromChild = RigidTransform.identity
    };
    children[1] = new CompoundCollider.ColliderBlobInstance
    {
        Collider = SphereCollider.Create(new SphereGeometry
        {
            Center = float3.zero, Radius = 0.3f
        }, CollisionFilter.Default),
        CompoundFromChild = new RigidTransform(quaternion.identity, new float3(0, 2.1f, 0))
    };
    var compound = CompoundCollider.Create(children);
    children.Dispose();
    return compound;
}
```
