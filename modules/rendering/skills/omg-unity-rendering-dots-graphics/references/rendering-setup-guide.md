---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Rendering Setup Guide

## Package Setup

```json
// Packages/manifest.json — add these for Unity 6 / URP
"com.unity.entities": "1.4.5",
"com.unity.entities.graphics": "1.4.18",
"com.unity.physics": "1.4.5",
"com.unity.burst": "1.8.28",
"com.unity.collections": "2.6.5",
"com.unity.mathematics": "1.3.2"
```

## Component Roles

| Component | Type | Purpose |
|-----------|------|---------|
| `RenderMeshArray` | `ISharedComponentData` | Mesh+material registry shared across entities |
| `MaterialMeshInfo` | `IComponentData` | Per-entity index into RenderMeshArray |
| `RenderFilterSettings` | Struct in `RenderMeshDescription` | Layer, shadow, motion vector settings |
| `RenderBounds` | `IComponentData` | Local-space AABB (set at bake time or manually) |
| `WorldRenderBounds` | `IComponentData` | World-space AABB (system-managed, read-only) |
| `LocalToWorld` | `IComponentData` | Transform matrix — required for rendering |
| `DisableRendering` | `IComponentData` (tag) | Add to hide entity; remove to show |
| `MeshLODGroupComponent` | `ISharedComponentData` | Baked LODGroup root data |
| `MeshLODComponent` | `IComponentData` | Per-LOD-level entity link |

## Required Namespaces

```csharp
using Unity.Rendering;           // RenderMeshArray, MaterialMeshInfo, RenderMeshUtility
using Unity.Entities.Graphics;   // RenderFilterSettings
using Unity.Entities;            // EntityManager, Baker
using Unity.Transforms;          // LocalToWorld, LocalTransform
using Unity.Mathematics;         // float3, float4x4
using UnityEngine.Rendering;     // ShadowCastingMode
```

## RenderMeshDescription and RenderFilterSettings

```csharp
// Full control constructor
var filterSettings = new RenderFilterSettings
{
    Layer = LayerMask.NameToLayer("Default"),
    RenderingLayerMask = 1,
    ShadowCastingMode = ShadowCastingMode.On,
    ReceiveShadows = true,
    MotionMode = MotionVectorGenerationMode.Object,
    StaticShadowCaster = false,
};

var desc = new RenderMeshDescription
{
    FilterSettings = filterSettings,
    LightProbeUsage = LightProbeUsage.BlendProbes,
};

// Convenience constructor (common case)
var desc = new RenderMeshDescription(
    shadowCastingMode: ShadowCastingMode.Off,
    receiveShadows: false);
```

## RenderBounds (Manual Setup)

Auto-set when baking from MeshRenderer. Required when creating entities from scratch.

```csharp
using Unity.Rendering;
using Unity.Mathematics;

em.AddComponentData(entity, new RenderBounds
{
    Value = new AABB
    {
        Center = float3.zero,
        Extents = new float3(0.5f, 0.5f, 0.5f) // half-extents
    }
});

// WorldRenderBounds is auto-computed by Entities Graphics — do not set manually
var wrb = em.GetComponentData<WorldRenderBounds>(entity);
```

## Baking (Authoring Workflow)

To use standard rendering, place a GameObject with MeshRenderer into a SubScene — baking adds all required components automatically.

For custom baking:

```csharp
// Namespace: DOTSAI.Authoring
using Unity.Entities;
using Unity.Rendering;
using UnityEngine;

public class RenderableAuthoring : MonoBehaviour { }

public class RenderableBaker : Baker<RenderableAuthoring>
{
    public override void Bake(RenderableAuthoring authoring)
    {
        var mf = GetComponent<MeshFilter>();
        var mr = GetComponent<MeshRenderer>();

        var entity = GetEntity(TransformUsageFlags.Dynamic);

        var desc = new RenderMeshDescription(authoring.gameObject);
        var rma = new RenderMeshArray(mr.sharedMaterials, new[] { mf.sharedMesh });

        RenderMeshUtility.AddComponents(entity, EntityManager, desc, rma,
            MaterialMeshInfo.FromRenderMeshArrayIndices(0, 0));
    }
}
```

## Debugging Checklist

| Symptom | Cause | Fix |
|---------|-------|-----|
| Entity not rendering | Missing `LocalToWorld` | `em.AddComponentData(e, new LocalToWorld())` |
| Entity culled / invisible | Missing or wrong `RenderBounds` | Set AABB matching mesh extents |
| Wrong mesh shown | `MaterialMeshInfo` index mismatch | Verify indices into `RenderMeshArray` |
| Baking entities don't render | MeshRenderer or MeshFilter missing | Both required on authoring GameObject |
