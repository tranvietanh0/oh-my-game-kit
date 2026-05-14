---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# ProBuilder Materials & UVs Guide

## Material Assignment

### Per-Object Material
```csharp
var renderer = pb.GetComponent<MeshRenderer>();
renderer.sharedMaterial = myMaterial;
```

### Per-Face Material (Multi-Material)
```csharp
// Assign materials to renderer (array = submesh materials)
renderer.sharedMaterials = new Material[] { grassMat, stoneMat, dirtMat };

// Set per-face submesh index
foreach (var face in pb.faces)
{
    if (IsGrass(face)) face.submeshIndex = 0;
    else if (IsStone(face)) face.submeshIndex = 1;
    else face.submeshIndex = 2;
}
pb.ToMesh();
pb.Refresh();
```

### Creating URP Materials (Project Pattern)
```csharp
static Material CreateURPMaterial(string name, Color color, float smoothness = 0.5f)
{
    var mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
    mat.color = color;
    mat.SetFloat("_Smoothness", smoothness);
    AssetDatabase.CreateAsset(mat, $"Assets/Materials/{name}.mat");
    return mat;
}
```

## Vertex Colors

```csharp
// Set vertex colors on ProBuilderMesh
var colors = new Color[pb.vertexCount];
for (int i = 0; i < colors.Length; i++)
{
    float height = pb.positions[i].y;
    colors[i] = Color.Lerp(dirtColor, grassColor, height / maxHeight);
}
pb.colors = colors;
pb.ToMesh();
pb.Refresh();
```

**Note:** URP Lit doesn't read vertex colors by default. Use a vertex-color shader or Shader Graph with Vertex Color node.

## UV Editing

### Auto UV (Per-Face)
```csharp
foreach (var face in pb.faces)
{
    face.uv = new AutoUnwrapSettings
    {
        anchor = AutoUnwrapSettings.Anchor.LowerLeft,
        fill = AutoUnwrapSettings.Fill.Tile,
        scale = new Vector2(1, 1),
        offset = Vector2.zero,
        rotation = 0f,
        swapUV = false,
        flipU = false,
        flipV = false,
        useWorldSpace = true
    };
    face.manualUV = false; // auto UV mode
}
```

### Manual UV
```csharp
face.manualUV = true;
// Access mesh UVs directly
var uvs = pb.textures.ToArray();
uvs[vertexIndex] = new Vector4(u, v, 0, 0);
pb.textures = uvs;
```

## Flat Shading (Low-Poly Style)

Set smoothing group to 0 on all faces — each face gets its own normal:
```csharp
foreach (var face in pb.faces)
    face.smoothingGroup = 0; // no smoothing = flat shading

pb.ToMesh();
pb.Refresh();
```

Alternatively, use unshared vertices (each triangle has unique verts) for guaranteed flat shading when building mesh manually.

## Material Palette for Battlefield

| Name | Color (RGB) | Usage |
|------|------------|-------|
| Grass | (0.35, 0.55, 0.25) | Ground tiles |
| Dirt | (0.45, 0.35, 0.20) | Paths, ramps |
| Stone | (0.50, 0.50, 0.48) | Cliffs, rocks |
| Wood | (0.55, 0.35, 0.15) | Barricades |
| Foliage | (0.20, 0.50, 0.15) | Tree canopy |
| Water | (0.20, 0.40, 0.60) | Rivers/trenches |
