---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# DOTS Battlefield — Package API Reference

## Package: `com.the1studio.dots-battlefield`

### Runtime Assembly: `DOTSBattlefield.Runtime`

#### ArenaConfig (ScriptableObject)
- **Namespace**: `DOTSBattlefield`
- **Create menu**: `DOTSBattlefield/Arena Config`
- **File**: `Packages/com.the1studio.dots-battlefield/Runtime/ArenaConfig.cs`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| GridWidth | int | 5 | Tile columns (min 1) |
| GridDepth | int | 5 | Tile rows (min 1) |
| TileSize | float | 10 | Meters per tile |
| ObstacleDensity | float | 0.3 | Obstacle probability per cell (0-1) |
| Seed | int | 42 | Deterministic RNG seed |
| SpawnClearRadius | float | 8 | Obstacle-free radius around spawn points |
| SpawnCenterA | Vector3 | (-20,0,0) | First team spawn position |
| SpawnCenterB | Vector3 | (20,0,0) | Second team spawn position |
| ElevationVariance | float | 0 | Max hill height (0=flat, 0-5) |
| TerrainNoiseScale | float | 4 | Perlin frequency — higher = more peaks |
| TerrainNoiseOctaves | int | 4 | Detail layers (1-8) |
| TerrainPersistence | float | 0.55 | Amplitude decay per octave (0-1) |
| TerrainLacunarity | float | 2.2 | Frequency multiplier per octave |
| RidgePower | float | 1.8 | Cliff sharpness exponent (1-4) |
| CliffThreshold | float | 0.45 | Height where cliffs begin (0-1) |
| BoundaryWallHeight | float | 3 | Arena wall height |
| BoundaryWallThickness | float | 0.5 | Perimeter wall thickness |
| PreMadeObstaclePrefabs | GameObject[] | null | Optional FBX/glTF obstacle models |
| OutputFolder | string | "GeneratedArena" | Base folder under Assets/ for generated assets |

**Computed properties:**
- `ArenaWidth` = GridWidth * TileSize
- `ArenaDepth` = GridDepth * TileSize
- `ArenaOrigin` = (-ArenaWidth/2, 0, -ArenaDepth/2)
- `MaterialsPath` = Assets/{OutputFolder}/Materials/Arena/
- `MeshesPath` = Assets/{OutputFolder}/Meshes/Arena/
- `TilePrefabsPath` = Assets/{OutputFolder}/Prefabs/Arena/Tiles/
- `ObstaclePrefabsPath` = Assets/{OutputFolder}/Prefabs/Arena/Obstacles/
- `ConfigPath` = Assets/{OutputFolder}/Config/

### Editor Assembly: `DOTSBattlefield.Editor`

#### ConfigLookup
- `FindConfig()` → ArenaConfig — finds first `t:ArenaConfig` in project via AssetDatabase.FindAssets

#### BattlefieldPrefabCreator
- **Menu**: `Tools/DOTSBattlefield/Create Prefabs`
- Creates: 3 tile prefabs (FlatTile, HillTile, RampTile), 7 obstacle prefabs (RockCluster, WallSegment, Barricade, Pillar, Crate, HeightRamp, SniperCliff), 4 materials (Grass, Dirt, Stone, Wood), default ArenaConfig if none exists
- `EnsureFolderChain(string path)` — internal utility to create nested folders

#### BattlefieldAssemblySetup
- **Menu**: `Tools/DOTSBattlefield/Assemble Arena`
- Creates: tile grid, obstacles (seed-based with spawn exclusion), boundary walls, NavMeshSurface
- `PlaceObstaclesOnRoot(config, parent)` — internal, used by ProceduralTerrainGenerator
- `PlaceBoundaryWallsOnRoot(config, parent)` — internal, used by ProceduralTerrainGenerator

#### ProceduralTerrainGenerator
- **Menu**: `Tools/DOTSBattlefield/Generate Procedural Terrain`
- Creates: Perlin noise heightmap mesh (flat-shaded, vertex-colored), obstacles, walls, NavMesh
- Replaces tile-based arena if present
- Flattens terrain around spawn zones (quadratic lerp)
- Uses UInt32 index format for large meshes (>65535 verts)

### Dependencies
- `com.unity.ai.navigation` 2.0.8 (NavMeshSurface, CollectObjects, NavMeshCollectGeometry)
- URP (for materials — Universal Render Pipeline/Lit shader)

### Generated Asset Structure
```
Assets/{OutputFolder}/
├── Config/
│   └── DefaultArenaConfig.asset
├── Materials/Arena/
│   ├── Grass.mat, Dirt.mat, Stone.mat, Wood.mat
│   └── VertexColorTerrain.mat (procedural terrain only)
├── Meshes/Arena/
│   ├── FlatTile_mesh.asset, HillTile_mesh.asset, RampTile_mesh.asset
│   └── ProceduralTerrain_mesh.asset (procedural terrain only)
└── Prefabs/Arena/
    ├── Tiles/ — FlatTile.prefab, HillTile.prefab, RampTile.prefab
    └── Obstacles/ — RockCluster, WallSegment, Barricade, Pillar, Crate, HeightRamp, SniperCliff
```
