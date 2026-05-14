---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# 3D Rendering Guide

## Mesh Setup

3D units use Unity primitive meshes or Synty Polygon skeletal models with URP/Lit materials.

### Primitive Mesh Prefab

```csharp
// Root GO at feet (pivot point)
var go = new GameObject(name);

// Mesh child centered above pivot
var meshGO = GameObject.CreatePrimitive(shape);  // Capsule, Cylinder, Sphere
meshGO.name = "Mesh";
meshGO.transform.SetParent(go.transform);
meshGO.transform.localScale = scale;
float offsetY = GetMeshHalfHeight(shape) * scale.y;
meshGO.transform.localPosition = new Vector3(0f, offsetY, 0f);

// Remove default collider — baking handles physics
Object.DestroyImmediate(meshGO.GetComponent<Collider>());

// URP/Lit material with team color
var mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
mat.color = teamColor;
mat.SetFloat("_Smoothness", 0.6f);
meshGO.GetComponent<MeshRenderer>().sharedMaterial = mat;
```

### Mesh Half-Heights (Scale 1)
| Shape | Half-Height | Full Height |
|-------|-------------|-------------|
| Capsule | 1.0 | 2.0m |
| Cylinder | 1.0 | 2.0m |
| Sphere | 0.5 | 1.0m |

### Unit Class Visual Mapping
| Class | Shape | Scale | Notes |
|-------|-------|-------|-------|
| Melee | Capsule | (1, 1, 1) | Standard humanoid |
| Ranger | Cylinder | (0.6, 1.2, 0.6) | Tall, lean |
| Mage | Sphere | (0.9, 0.9, 0.9) | Round, mystical |
| Boss | Capsule | (1.5, 1.5, 1.5) | Large, imposing |

## LODGroup with Amplify Impostor

### Why Impostors

Synty Polygon characters have 5 Skinned Mesh Renderers + 50+ bones each. At 100 units, this exceeds GPU capacity. Impostor billboards at LOD1 reduce each distant unit to a single quad.

### Adding Impostor LOD

```csharp
private static void AddImpostorLODIfAvailable(
    GameObject root, MeshRenderer lod0Renderer, Color teamColor,
    string unitType, byte teamId, string unitName, string folder)
{
    var impostorAsset = LoadImpostorAsset(unitType, teamId);
    if (impostorAsset == null || impostorAsset.Mesh == null) return;

    // LOD1 impostor child
    var lod1 = new GameObject("LOD1_Impostor");
    lod1.transform.SetParent(root.transform);
    lod1.transform.localPosition = Vector3.zero;
    lod1.AddComponent<MeshFilter>().sharedMesh = impostorAsset.Mesh;
    var impostorRend = lod1.AddComponent<MeshRenderer>();

    // Tinted material instance (don't modify shared atlas material)
    var baseMat = ImpostorMaterialHelper.GetUrpImpostorMaterial(impostorAsset);
    var tintedMat = new Material(baseMat);
    tintedMat.SetColor("_BaseColor", teamColor);
    AssetDatabase.CreateAsset(tintedMat, folder + unitName + "_Tinted.mat");
    impostorRend.sharedMaterial = tintedMat;

    // LODGroup: LOD0 at 15%, LOD1 never culled
    var lodGroup = root.AddComponent<LODGroup>();
    lodGroup.SetLODs(new[] {
        new LOD(0.15f, new[] { lod0Renderer }),
        new LOD(0f, new[] { impostorRend }),
    });
    lodGroup.RecalculateBounds();
}
```

### Performance Impact
| Metric | No LOD | With Impostor LOD1 |
|--------|--------|-------------------|
| 100 Synty units | 0.9 FPS | 60 FPS |
| Draw calls per unit (far) | 5+ (SMRs) | 1 (billboard quad) |
| Bones processed (far) | 50+ | 0 |

## AoE Blast Prefab (3D)

Semi-transparent sphere with URP/Lit:

```csharp
var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
Object.DestroyImmediate(go.GetComponent<Collider>());

var mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
mat.color = new Color(0.9f, 0.3f, 0.9f, 0.4f);
mat.SetFloat("_Surface", 1f);        // Transparent
mat.SetFloat("_Smoothness", 0.9f);
mat.renderQueue = (int)RenderQueue.Transparent;
meshRenderer.shadowCastingMode = ShadowCastingMode.Off;
```

## Shadow Configuration

3D perspective benefits from full shadow casting:
- URP shadow resolution: 2048
- Shadow distance: 60m (for 100x100 arena)
- 2 cascades, split ratio 0.3
- Soft shadows quality 2

See `unity-shadow-optimization` skill for detailed URP shadow settings.

## Navigation Differences from 2D

| Setting | 2D/Iso | 3D |
|---------|--------|-----|
| EnableGrounding | false | true (default) |
| ArcHeight | 0 (flat) | 5 (parabolic) |
| IsFlat | true | false |
| SonarAvoidance | disabled (2K+) | enabled (< 500) |
| HealthBar Offset | 0.8 | meshFullHeight + 0.3 |
