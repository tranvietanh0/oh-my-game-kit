---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Buffers & Shared Components Guide — Unity DOTS ECS

## ISharedComponentData

Same value shared across entities in the same chunk. Reduces chunk fragmentation for categorical data.

```csharp
// Unmanaged shared component (preferred — Burst-compatible)
public struct RenderLayer : ISharedComponentData
{
    public int Layer;
}

// Managed shared component (supports reference types)
public struct RenderMesh : ISharedComponentData, IEquatable<RenderMesh>
{
    public Mesh Mesh;
    public Material Material;

    public bool Equals(RenderMesh other) =>
        Mesh == other.Mesh && Material == other.Material;

    public override int GetHashCode() =>
        HashCode.Combine(Mesh?.GetHashCode() ?? 0, Material?.GetHashCode() ?? 0);
}
```

```csharp
// Set shared component via ECB (causes chunk move)
ecb.SetSharedComponent(entity, new RenderLayer { Layer = 2 });

// Query filtered by shared component value
var query = SystemAPI.QueryBuilder().WithAll<Health>().Build();
query.SetSharedComponentFilter(new RenderLayer { Layer = 2 });
```

---

## Chunk Components

One value per chunk (not per entity). Used for LOD levels, batch metadata.

```csharp
public struct LodLevel : IComponentData { public int Level; }
// Add as chunk component:
// entityManager.AddChunkComponentData<LodLevel>(entity);
// entityManager.SetChunkComponentData(chunk, new LodLevel { Level = 1 });
```

---

## DynamicBuffer

Resizable array attached to an entity. Replaces Lists inside components.

```csharp
[InternalBufferCapacity(8)] // inline capacity before heap allocation
public struct Waypoint : IBufferElementData { public float3 Position; }

// Add and populate during baking
var buffer = baker.AddBuffer<Waypoint>(entity);
buffer.Add(new Waypoint { Position = float3.zero });

// Access in system
DynamicBuffer<Waypoint> waypoints = SystemAPI.GetBuffer<Waypoint>(entity);
waypoints.Add(new Waypoint { Position = new float3(1, 0, 0) });
waypoints.RemoveAt(0);

// ECB deferred buffer append
ecb.AppendToBuffer(entity, new Waypoint { Position = float3.zero });
```

> For BlobAsset patterns, see [baking-guide.md](baking-guide.md).
