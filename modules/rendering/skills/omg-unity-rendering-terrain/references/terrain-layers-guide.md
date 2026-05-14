---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Terrain Layers & Textures Guide

## TerrainLayer Setup

### Creating TerrainLayer via Script

```csharp
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

static TerrainLayer CreateTerrainLayer(string name, Texture2D diffuse,
    Vector2 tileSize, float metallic = 0f, float smoothness = 0.3f)
{
    var layer = new TerrainLayer();
    layer.diffuseTexture = diffuse;
    layer.tileSize = tileSize;
    layer.metallic = metallic;
    layer.smoothness = smoothness;

#if UNITY_EDITOR
    AssetDatabase.CreateAsset(layer, $"Assets/Terrain/Layers/{name}.terrainlayer");
#endif
    return layer;
}
```

### Assigning Layers to Terrain

```csharp
terrainData.terrainLayers = new TerrainLayer[]
{
    grassLayer,  // index 0 — base layer
    dirtLayer,   // index 1
    stoneLayer,  // index 2
    sandLayer,   // index 3
};
```

**Max layers:** 4 per pass for best performance (each pass = 1 draw call). More layers work but cost extra draw calls.

## Splatmap / Alphamap Painting

### Programmatic Texture Painting

```csharp
static void PaintByHeight(TerrainData td, float dirtThreshold, float stoneThreshold)
{
    int res = td.alphamapResolution;
    int layerCount = td.terrainLayers.Length;
    float[,,] alphamaps = new float[res, res, layerCount];

    float[,] heights = td.GetHeights(0, 0, res, res);

    for (int y = 0; y < res; y++)
    {
        for (int x = 0; x < res; x++)
        {
            float h = heights[y, x];

            // Height-based layer selection
            if (h > stoneThreshold)
            {
                alphamaps[y, x, 2] = 1f; // stone
            }
            else if (h > dirtThreshold)
            {
                float t = (h - dirtThreshold) / (stoneThreshold - dirtThreshold);
                alphamaps[y, x, 1] = t;     // dirt
                alphamaps[y, x, 0] = 1 - t; // grass
            }
            else
            {
                alphamaps[y, x, 0] = 1f; // grass
            }
        }
    }

    td.SetAlphamaps(0, 0, alphamaps);
}
```

### Slope-Based Painting

```csharp
static void PaintBySlope(TerrainData td, float cliffAngle)
{
    int res = td.alphamapResolution;
    float[,,] maps = new float[res, res, td.terrainLayers.Length];
    float[,] heights = td.GetHeights(0, 0, td.heightmapResolution, td.heightmapResolution);

    for (int y = 0; y < res; y++)
    {
        for (int x = 0; x < res; x++)
        {
            float steepness = td.GetSteepness(
                (float)x / res, (float)y / res); // 0-90 degrees

            if (steepness > cliffAngle)
                maps[y, x, 2] = 1f; // stone/cliff
            else
                maps[y, x, 0] = 1f; // grass
        }
    }
    td.SetAlphamaps(0, 0, maps);
}
```

## Using Color-Only Materials (No Textures)

For low-poly stylized terrain without textures:

```csharp
// Create solid-color textures programmatically
static Texture2D CreateSolidTexture(Color color, int size = 4)
{
    var tex = new Texture2D(size, size);
    var pixels = new Color[size * size];
    for (int i = 0; i < pixels.Length; i++) pixels[i] = color;
    tex.SetPixels(pixels);
    tex.Apply();
    return tex;
}

// Usage
var grassTex = CreateSolidTexture(new Color(0.35f, 0.55f, 0.25f));
var dirtTex = CreateSolidTexture(new Color(0.45f, 0.35f, 0.20f));
var stoneTex = CreateSolidTexture(new Color(0.50f, 0.50f, 0.48f));
```

## URP Terrain Shader Notes

- URP uses `Terrain/Lit` shader (auto-assigned)
- Supports height-based blending (`Enable Height-based Blend` in TerrainLayer)
- `Height Transition` controls smooth blending between layers
- Max 8 layers without performance penalty in URP
- `basemapDistance` controls where terrain switches to far-distance base texture
