---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Transforms Guide — Unity DOTS ECS

## LocalTransform

Primary component for position, rotation, and uniform scale of an entity.

```csharp
using Unity.Transforms;

// LocalTransform: position, rotation, uniform scale of an entity
public struct LocalTransform : IComponentData
{
    public float3 Position;
    public quaternion Rotation;
    public float Scale; // uniform only
}

// Read/write in system
foreach (var transform in SystemAPI.Query<RefRW<LocalTransform>>())
{
    transform.ValueRW.Position += new float3(0, 1, 0);
    transform.ValueRW = transform.ValueRO.RotateY(math.PI * dt);
    transform.ValueRW = LocalTransform.FromPositionRotationScale(pos, rot, 1f);
}

// LocalToWorld: world-space matrix (read-only, computed by transform system)
// float4x4 matrix = SystemAPI.GetComponent<LocalToWorld>(entity).Value;
```

---

## Parent / Child Hierarchy

```csharp
// Attach child to parent via ECB or EntityManager
ecb.AddComponent(child, new Parent { Value = parentEntity });

// Unity.Transforms systems handle propagation automatically.
// Children are stored in DynamicBuffer<Child> on the parent entity.
// Removing the Parent component detaches the child.
```

---

## TransformUsageFlags

Set in `Baker.GetEntity()` to control which transform components are added during baking.

| Flag | Effect |
|------|--------|
| `None` | No transform components added |
| `Dynamic` | Full `LocalTransform`, participates in hierarchy |
| `Renderable` | Read-only `LocalToWorld`, no `LocalTransform` |
| `WorldSpace` | Bakes world-space position, ignores parent |
| `NonUniformScale` | Adds `PostTransformMatrix` for non-uniform scale |

```csharp
// Dynamic — entity moves at runtime
var entity = GetEntity(authoring, TransformUsageFlags.Dynamic);

// Renderable — static mesh, only needs world matrix
var entity = GetEntity(authoring, TransformUsageFlags.Renderable);

// NonUniformScale — entity needs per-axis scale
var entity = GetEntity(authoring, TransformUsageFlags.NonUniformScale);
```

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `LocalTransform` missing on entity | Baker must use `TransformUsageFlags.Dynamic` |
| Non-uniform scale has no effect | Add `PostTransformMatrix` via `TransformUsageFlags.NonUniformScale` |
| Child not following parent | Ensure `Parent` component is added and transform systems are active |
| World-space position wrong for child | Use `LocalToWorld` for world-space read; `LocalTransform` is local-space only |
