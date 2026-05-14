---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Terrain Features: Trees, Details, NavMesh, Performance

## Tree Placement (Programmatic)

```csharp
static void PlaceTrees(TerrainData td, GameObject treePrefab, int count, int seed)
{
    td.treePrototypes = new[] { new TreePrototype { prefab = treePrefab } };
    var rng = new System.Random(seed);
    var trees = new TreeInstance[count];
    for (int i = 0; i < count; i++) {
        trees[i] = new TreeInstance {
            prototypeIndex = 0,
            position = new Vector3((float)rng.NextDouble(), 0, (float)rng.NextDouble()),
            widthScale  = 0.8f + (float)rng.NextDouble() * 0.4f,
            heightScale = 0.8f + (float)rng.NextDouble() * 0.4f,
            rotation = (float)rng.NextDouble() * 360f,
            color = Color.white, lightmapColor = Color.white,
        };
    }
    td.treeInstances = trees;
}
```

Tree positions are normalized (0-1). Trees must have colliders on their prefab for physics.

## Detail / Grass Placement

```csharp
static void PlaceGrass(TerrainData td, Texture2D grassTexture, int density)
{
    td.detailPrototypes = new[] { new DetailPrototype {
        prototypeTexture = grassTexture,
        renderMode = DetailRenderMode.GrassBillboard,
        minWidth = 0.5f, maxWidth = 1.5f, minHeight = 0.3f, maxHeight = 0.8f,
        dryColor = new Color(0.6f, 0.5f, 0.2f), healthyColor = new Color(0.3f, 0.6f, 0.2f),
    }};
    int res = td.detailResolution;
    int[,] map = new int[res, res];
    for (int y = 0; y < res; y++) for (int x = 0; x < res; x++) map[y, x] = density;
    td.SetDetailLayer(0, 0, 0, map);
}
```

## NavMesh on Terrain

```csharp
static void BakeNavMeshOnTerrain(Terrain terrain)
{
    var surface = terrain.gameObject.GetComponent<NavMeshSurface>()
        ?? terrain.gameObject.AddComponent<NavMeshSurface>();
    surface.collectObjects = CollectObjects.All;
    surface.useGeometry = NavMeshCollectGeometry.PhysicsColliders;
    surface.BuildNavMesh();
}

// Mark obstacles to carve NavMesh holes
var mod = obstacleGO.AddComponent<NavMeshModifier>();
mod.overrideArea = true;
mod.area = NavMesh.GetAreaFromName("Not Walkable");
```

## Performance Settings

| Setting | Recommendation |
|---------|---------------|
| `heightmapResolution` | 257 for battles |
| `alphamapResolution` | 256 (match heightmap) |
| `detailResolution` | 128-256 (lower = faster) |
| `drawInstanced` | true (GPU instancing) |
| `treeDistance` | 1000 |
| `treeBillboardDistance` | 50 |

## DOTS Compatibility

Terrain is NOT baked into ECS entities — stays as managed GameObject.
- `TerrainCollider` → physics raycasts work
- `NavMeshSurface` → Agents Navigation works
- Obstacles ON terrain can be baked entities (MeshRenderer + MeshCollider)
- For fully ECS terrain, use procedural mesh (see `unity-probuilder` skill)

## Pre-Made Asset Placement

```csharp
// Sample terrain height at normalized position
static Vector3 GetTerrainPosition(Terrain terrain, float nx, float nz)
{
    var td = terrain.terrainData;
    float wx = nx * td.size.x + terrain.transform.position.x;
    float wz = nz * td.size.z + terrain.transform.position.z;
    float wy = terrain.SampleHeight(new Vector3(wx, 0, wz));
    return new Vector3(wx, wy, wz);
}
```
