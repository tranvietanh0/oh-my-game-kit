---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Components Guide — Unity DOTS ECS

## IComponentData

Unmanaged struct — the standard component type. Must contain only blittable types.

```csharp
using Unity.Entities;
using Unity.Mathematics;

namespace DOTSAI
{
    // Data component
    public struct Health : IComponentData
    {
        public float Current;
        public float Max;
    }

    // Tag component (zero-size, no fields)
    public struct Dead : IComponentData { }

    // Allowed field types: blittable primitives, bool, char,
    // float2/3/4, quaternion, BlobAssetReference<T>,
    // FixedString*, FixedList*, fixed arrays, Entity, nested conforming structs
}
```

**Managed IComponentData** (class, not struct) — use only when you must store managed references (string, Texture2D, etc.). Cannot be Burst-compiled or used in jobs.

```csharp
public class ManagedData : IComponentData, IDisposable
{
    public Texture2D Texture;
    public void Dispose() => Object.Destroy(Texture);
}
```

---

## ICleanupComponentData

Persists after entity destruction. Use to detect removal/destruction and perform cleanup.

```csharp
// Cleanup component — survives entity.Destroy() until explicitly removed
public struct SpawnedCleanup : ICleanupComponentData
{
    public Entity SpawnedEntity;
}
```

**Pattern — detect entity destruction:**
```csharp
// Entities that had Spawner removed (or were destroyed): has cleanup, no data
var deadQuery = SystemAPI.QueryBuilder()
    .WithAll<SpawnedCleanup>()
    .WithNone<Spawner>()
    .Build();

// Cleanup pass: destroy spawned entity, then remove cleanup component
foreach (var (cleanup, entity) in
    SystemAPI.Query<RefRO<SpawnedCleanup>>()
    .WithNone<Spawner>()
    .WithEntityAccess())
{
    ecb.DestroyEntity(cleanup.ValueRO.SpawnedEntity);
    ecb.RemoveComponent<SpawnedCleanup>(entity);
}
```

---

## IEnableableComponent

Toggle component on/off without structural change (no archetype move, Burst-safe).

```csharp
public struct Stunned : IComponentData, IEnableableComponent
{
    public float Duration;
}
```

```csharp
// Enable/disable via SystemAPI
SystemAPI.SetComponentEnabled<Stunned>(entity, true);
bool isStunned = SystemAPI.IsComponentEnabled<Stunned>(entity);

// In query — only matches enabled Stunned by default
// WithDisabled<Stunned>() — matches disabled
// WithAny<Stunned>() — matches both states
foreach (var stunned in SystemAPI.Query<RefRW<Stunned>>())
{
    stunned.ValueRW.Duration -= deltaTime;
}

// EnabledRefRW in IAspect or IJobEntity
public EnabledRefRW<Stunned> StunnedEnabled;
StunnedEnabled.ValueRW = false; // disable
```

---

> For ISharedComponentData, Chunk Components, and DynamicBuffer patterns, see [buffers-shared-guide.md](buffers-shared-guide.md).
