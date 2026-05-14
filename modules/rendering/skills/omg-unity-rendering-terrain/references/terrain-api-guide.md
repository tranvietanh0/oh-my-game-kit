---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Terrain API Guide

## Programmatic Terrain Creation

```csharp
static (Terrain, TerrainData) CreateTerrain(string name, int resolution, Vector3 size)
{
    var terrainData = new TerrainData();
    terrainData.heightmapResolution = resolution; // must be 2^n + 1
    terrainData.size = size;                       // (width, height, length) in world units

    var terrainGO = Terrain.CreateTerrainGameObject(terrainData);
    terrainGO.name = name;

#if UNITY_EDITOR
    AssetDatabase.CreateAsset(terrainData, $"Assets/Terrain/{name}Data.asset");
#endif

    return (terrainGO.GetComponent<Terrain>(), terrainData);
}
```

Valid `heightmapResolution` values (must be `2^n + 1`): 33, 65, 129, **257**, 513, 1025, 2049

| Resolution | Quality | Memory |
|-----------|---------|--------|
| 129 | Medium | ~65KB |
| 257 | Good | ~260KB |
| 513 | High | ~1MB |

## Heightmap Manipulation

### SetHeights — Full Replace

```csharp
int res = terrainData.heightmapResolution;
float[,] heights = new float[res, res];
for (int y = 0; y < res; y++)
    for (int x = 0; x < res; x++)
        heights[y, x] = SampleHeight(x, y, seed);
terrainData.SetHeights(0, 0, heights);
```

**CRITICAL:** Heights indexed as `[y,x]` NOT `[x,y]` — #1 source of bugs.

### SetHeightsDelayLOD — Batch Performance

```csharp
terrainData.SetHeightsDelayLOD(0, 0, heights); // skip LOD rebuild per call
// ... more calls ...
terrainData.SyncHeightmap(); // rebuild once at end
```

## Procedural Height Generation (Multi-Octave Perlin)

```csharp
static float[,] GenerateHeightmap(int res, int seed, float scale, int octaves)
{
    float[,] heights = new float[res, res];
    float ox = seed * 100f, oy = seed * 73f;
    for (int y = 0; y < res; y++) {
        for (int x = 0; x < res; x++) {
            float amp = 1f, freq = scale, h = 0f;
            for (int o = 0; o < octaves; o++) {
                h   += Mathf.PerlinNoise((x + ox) * freq / res, (y + oy) * freq / res) * amp;
                amp *= 0.5f; freq *= 2f;
            }
            heights[y, x] = Mathf.Clamp01(h / (2f - 1f / (1 << octaves)));
        }
    }
    return heights;
}
```

## Spawn Zone Flattening

```csharp
static void FlattenSpawnZones(float[,] heights, int res, Vector3 size,
    Vector3 redSpawn, Vector3 blueSpawn, float radius)
{
    for (int y = 0; y < res; y++) {
        for (int x = 0; x < res; x++) {
            var wp = new Vector3((float)x / res * size.x, 0, (float)y / res * size.z);
            float dist = Mathf.Min(Vector3.Distance(wp, redSpawn), Vector3.Distance(wp, blueSpawn));
            if (dist < radius) {
                float t = dist / radius;
                heights[y, x] = Mathf.Lerp(0.3f, heights[y, x], t * t);
            }
        }
    }
}
```

## TerrainData Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `heightmapResolution` | int | 2^n+1 |
| `size` | Vector3 | World size (width, maxHeight, length) |
| `terrainLayers` | TerrainLayer[] | Paint textures |
| `alphamapResolution` | int | Splatmap resolution |
| `treeInstances` | TreeInstance[] | Placed trees |
| `detailPrototypes` | DetailPrototype[] | Grass/details |
| `detailResolution` | int | Detail density resolution |
