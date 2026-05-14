---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# ProBuilder Export & Prefab Workflow

## Why Export?

ProBuilder stores mesh data in `ProBuilderMesh` component. At runtime, this component is unnecessary overhead. For production prefabs (especially DOTS SubScene baking), strip ProBuilder and save as standard Unity Mesh.

## Export Pattern: Strip + Save as Asset

```csharp
using UnityEngine;
using UnityEngine.ProBuilder;
using UnityEditor;

static GameObject ExportToStandardMesh(ProBuilderMesh pb, string meshPath, string prefabPath)
{
    // 1. Compile final mesh
    pb.ToMesh();
    pb.Refresh();

    // 2. Get the compiled Unity Mesh
    Mesh mesh = pb.GetComponent<MeshFilter>().sharedMesh;

    // 3. Save mesh as asset (decouples from ProBuilderMesh)
    Mesh savedMesh = Object.Instantiate(mesh);
    savedMesh.name = pb.name + "_mesh";
    AssetDatabase.CreateAsset(savedMesh, meshPath);

    // 4. Create clean GameObject (no ProBuilder components)
    var go = new GameObject(pb.name);
    var mf = go.AddComponent<MeshFilter>();
    mf.sharedMesh = savedMesh;

    var mr = go.AddComponent<MeshRenderer>();
    mr.sharedMaterials = pb.GetComponent<MeshRenderer>().sharedMaterials;

    // 5. Add collider for NavMesh/physics
    var mc = go.AddComponent<MeshCollider>();
    mc.sharedMesh = savedMesh;

    // 6. Save as prefab
    var prefab = PrefabUtility.SaveAsPrefabAsset(go, prefabPath);

    // 7. Cleanup temp objects
    Object.DestroyImmediate(pb.gameObject);
    Object.DestroyImmediate(go);

    return prefab;
}
```

## Alternative: Strip In-Place

```csharp
static void StripProBuilderComponent(ProBuilderMesh pb)
{
    // Save mesh reference before destroying component
    var mesh = Object.Instantiate(pb.GetComponent<MeshFilter>().sharedMesh);
    AssetDatabase.CreateAsset(mesh, $"Assets/Meshes/{pb.name}.asset");

    // Destroy ProBuilder component (keeps MeshFilter + MeshRenderer)
    Object.DestroyImmediate(pb);

    // Reassign saved mesh asset
    pb.GetComponent<MeshFilter>().sharedMesh = mesh;
}
```

## Batch Export (All ProBuilder Objects)

```csharp
[MenuItem("Tools/Export All ProBuilder Meshes")]
static void ExportAll()
{
    var allPb = Object.FindObjectsOfType<ProBuilderMesh>();
    foreach (var pb in allPb)
    {
        string name = pb.name;
        ExportToStandardMesh(pb,
            $"Assets/Meshes/{name}.asset",
            $"Assets/Prefabs/{name}.prefab");
    }
    AssetDatabase.SaveAssets();
}
```

## DOTS SubScene Compatibility

Standard exported GameObjects (MeshFilter + MeshRenderer + MeshCollider) bake cleanly into ECS entities:

- `MeshFilter` + `MeshRenderer` → `RenderMeshArray` + `MaterialMeshInfo`
- `MeshCollider` → `PhysicsCollider` (if Unity Physics present)
- `isStatic = true` → optimized rendering batches

No custom bakers needed — standard DOTS baking handles everything.

## Pre-Made Asset Integration

For imported 3D models (FBX, glTF from Asset Store or Blender):

```csharp
// Load pre-made asset
var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Models/Rock.fbx");

// Instantiate in scene
var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
instance.isStatic = true;

// Ensure collider for NavMesh
if (!instance.GetComponent<Collider>())
    instance.AddComponent<MeshCollider>();
```

Pre-made models work alongside ProBuilder geometry — both bake identically into DOTS entities.

## Checklist for Production Prefabs

- [ ] ProBuilderMesh component stripped
- [ ] Mesh saved as `.asset` file
- [ ] MeshCollider assigned (for NavMesh + physics)
- [ ] `isStatic = true` (for NavMesh collection + rendering batching)
- [ ] Materials use URP Lit shader
- [ ] Prefab saved in designated folder
