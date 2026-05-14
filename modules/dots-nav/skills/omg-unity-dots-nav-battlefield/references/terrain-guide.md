---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# Terrain Configuration & Shader Guide

## Terrain Tuning (ArenaConfig fields)

| Field | Default | Effect |
|-------|---------|--------|
| `ElevationVariance` | 0 | Max height in meters (0=flat) |
| `TerrainNoiseScale` | 4 | Perlin frequency — higher = more peaks |
| `TerrainNoiseOctaves` | 4 | Detail layers — more = finer |
| `TerrainPersistence` | 0.55 | Amplitude decay per octave (0-1) |
| `TerrainLacunarity` | 2.2 | Frequency multiplier per octave |
| `RidgePower` | 1.8 | Cliff sharpness — higher = steeper |
| `CliffThreshold` | 0.45 | Normalized height where cliffs begin (0-1) |
| `BoundaryWallThickness` | 0.5 | Perimeter wall thickness in meters |

## Terrain Shader — VertexColorTerrain

Custom URP shader at `Packages/com.the1studio.dots-battlefield/Runtime/Shaders/VertexColorTerrain.shader`.

**Path**: `DOTSBattlefield/VertexColorTerrain`

**What it does:**
- Reads per-vertex `COLOR` semantic baked by `ProceduralTerrainGenerator.HeightToColor()`
- Biome palette: green (grass, low) -> brown (dirt, mid) -> grey (stone, high)
- Multiplies vertex color x `_BaseMap` texture (defaults to `Assets/Synty/PolygonGeneric/Textures/Generic_Grass.png`)
- URP lighting: ambient SH + single directional light + shadow attenuation
- Supports `ShadowCaster` and `DepthOnly` passes

**Material constants (private const in ProceduralTerrainGenerator):**

| Const | Value | Purpose |
|-------|-------|---------|
| `VertexColorShaderName` | `DOTSBattlefield/VertexColorTerrain` | Shader.Find() name |
| `SyntyGrassTexturePath` | `Assets/Synty/PolygonGeneric/Textures/Generic_Grass.png` | Base texture |
| `TerrainTextureTiling` | `8f` | World-space XZ tiling |
| `TerrainAmbientStrength` | `0.35f` | Ambient SH multiplier |
| `TerrainSmoothness` | `0.2f` | PBR smoothness |

**Gotcha — shader not found**: If `Shader.Find("DOTSBattlefield/VertexColorTerrain")` returns null, Unity hasn't imported the `.shader` file yet. Run `Assets > Reimport All` or reopen the project. The shader file must be inside `Packages/` or `Assets/` (not `Editor/`).

**Gotcha — material already exists**: `GetOrCreateVertexColorMaterial()` is idempotent — it skips creation if `VertexColorTerrain.mat` already exists at the output path. Delete the `.mat` asset to force regeneration with updated shader settings.

**Gotcha — URP Lit ignores vertex colors**: Standard `Universal Render Pipeline/Lit` does NOT read the `COLOR` semantic from mesh vertices. Always use `DOTSBattlefield/VertexColorTerrain` for procedural terrain.

**Gotcha — 2D Renderer renders terrain white/blue (CRITICAL)**: This project originated from a 2D template. The `Renderer2D` asset does NOT process 3D `UniversalForward` lit passes — vertex colors, lighting, and shadows all fail silently (terrain renders white or skybox-blue). **Fix**: Create a `UniversalRendererData` (Forward Renderer) asset at `Assets/Settings/ForwardRenderer.asset` and set `m_RendererType: 0` + reference it in `UniversalRP.asset`. The `Renderer2D.asset` can remain for 2D sprite scenes.
