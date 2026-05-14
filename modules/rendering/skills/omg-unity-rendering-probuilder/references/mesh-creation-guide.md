---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# ProBuilder Mesh Creation Guide

## Programmatic Mesh Creation

### Using ShapeGenerator (Quickest)

```csharp
using UnityEngine.ProBuilder;

// Create a cube
var cube = ShapeGenerator.CreateShape(ShapeType.Cube);
cube.transform.localScale = new Vector3(10, 1, 10); // 10x10 flat tile
cube.ToMesh();
cube.Refresh();
```

**Available ShapeType values:** Cube, Stair, CurvedStair, Prism, Cylinder, Plane, Door, Pipe, Cone, Sprite, Arch, Sphere, Torus, Icosahedron

### Using ProBuilderMesh.Create (Full Control)

```csharp
using UnityEngine.ProBuilder;

// Define vertices
var positions = new Vector3[]
{
    new(0, 0, 0), new(10, 0, 0), new(10, 0, 10), new(0, 0, 10), // bottom
    new(0, 2, 0), new(10, 2, 0), new(10, 2, 10), new(0, 2, 10), // top
};

// Define faces (triangles grouped into Face objects)
var face = new Face(new int[] { 0, 1, 2, 0, 2, 3 }); // bottom quad as 2 tris
var faces = new Face[] { face };

// Create mesh
var pb = ProBuilderMesh.Create(positions, faces);
pb.ToMesh();
pb.Refresh();
```

### Creating a Flat Tile (Common Pattern)

```csharp
static ProBuilderMesh CreateFlatTile(float size, int subdivisions)
{
    var pb = ShapeGenerator.CreateShape(ShapeType.Plane);
    pb.transform.localScale = Vector3.one * size;

    // Set flat shading on all faces
    foreach (var face in pb.faces)
        face.smoothingGroup = 0;

    pb.ToMesh();
    pb.Refresh();
    return pb;
}
```

### Vertex Manipulation

```csharp
// Get mutable positions
var positions = pb.positions.ToArray();

// Modify (e.g., raise center vertices for hill)
for (int i = 0; i < positions.Length; i++)
{
    float distFromCenter = Vector3.Distance(positions[i], center);
    positions[i].y += Mathf.Max(0, hillHeight - distFromCenter * falloff);
}

// Apply
pb.positions = positions;
pb.ToMesh();
pb.Refresh();
```

### Face Operations

```csharp
// Access faces
foreach (var face in pb.faces)
{
    face.smoothingGroup = 0;          // flat shading
    face.submeshIndex = materialIndex; // per-face material
}

// Delete faces
pb.DeleteFaces(facesToDelete);
pb.ToMesh();
pb.Refresh();
```

## Mesh Operations (UnityEngine.ProBuilder.MeshOperations)

### Subdivide
```csharp
using UnityEngine.ProBuilder.MeshOperations;

ConnectElements.Connect(pb, pb.faces); // subdivide all faces
pb.ToMesh();
pb.Refresh();
```

### Extrude
```csharp
ExtrudeElements.Extrude(pb, facesToExtrude, ExtrudeMethod.FaceNormal, 1.0f);
pb.ToMesh();
pb.Refresh();
```

### Merge Meshes
```csharp
var merged = CombineMeshes.Combine(meshesToMerge, out var mergedPb);
```

## Editor Optimization

```csharp
#if UNITY_EDITOR
UnityEditor.ProBuilder.EditorMeshUtility.Optimize(pb);
#endif
```

## Critical Workflow

1. **Create** — `ShapeGenerator.CreateShape()` or `ProBuilderMesh.Create()`
2. **Modify** — Change positions, faces, materials via ProBuilderMesh API
3. **Compile** — `.ToMesh()` writes to UnityEngine.Mesh
4. **Refresh** — `.Refresh()` recalculates normals, tangents, UVs
5. **Optimize** — `EditorMeshUtility.Optimize()` (editor only)

**Never** modify `MeshFilter.sharedMesh` directly — always go through ProBuilderMesh.
