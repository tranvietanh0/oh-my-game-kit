---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# LOD and Mesh Deformation Guide

## LOD System

### Baking LOD Groups

To use automatic LOD baking, place a LODGroup component on the root GameObject in a SubScene.
Baking creates:
- `MeshLODGroupComponent` on root entity
- `MeshLODComponent` on each LOD child entity

```csharp
// Read LOD group data (rarely needed manually)
var lodGroup = em.GetSharedComponentManaged<MeshLODGroupComponent>(rootEntity);
// lodGroup.LocalReferencePoint — center for LOD distance calculation

var lodChild = em.GetComponentData<MeshLODComponent>(lodEntity);
// lodChild.Group — parent entity reference
// lodChild.LODMask — bitmask (0=LOD0, 1=LOD1, etc.)
```

### LOD Crossfade (SpeedTree / Manual)

- Enable crossfade in the LODGroup Inspector (Fade Mode: Cross Fade or Speed Tree)
- Entities Graphics bakes `LODGroupWorldReferencePoint` and `LODWorldReferencePoint` components
- Crossfade weight stored per-entity; used by the built-in LOD selection system

### LOD Debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| LOD always LOD0 | Camera distance reference point wrong | Check `LODGroupWorldReferencePoint` system is active |

---

## Mesh Deformation (Skinned Mesh)

Status: Experimental. Requires `Skinned Mesh Renderer` on the authoring GameObject.

### Setup

1. Create a ShaderGraph material:
   - Add `Compute Deformation` node
   - Connect: Position to Vertex Position, Normal to Normal, Tangent to Tangent
2. Assign material to SkinnedMeshRenderer slots
3. Place in SubScene — baking auto-adds deformation ECS components

### Runtime Control

```csharp
using Unity.Rendering;

// Skinning: write SkinMatrix buffer per bone
// BlendShape: write BlendShapeWeight component
// These are populated automatically from Animator if present.

// For manual blend shape control:
var blendWeights = em.GetBuffer<BlendShapeWeight>(entity);
blendWeights[0] = new BlendShapeWeight { Value = 0.75f }; // index 0 = first blend shape

// For GPU vertex shader skinning (simpler, 4 bones per vertex, no blend shapes):
// Use Linear Blend Skinning node in ShaderGraph instead of Compute Deformation
```

### Skinning Debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skinning T-pose | Animator not baked / missing bind pose | Ensure SkinnedMeshRenderer is in SubScene with Animator |
