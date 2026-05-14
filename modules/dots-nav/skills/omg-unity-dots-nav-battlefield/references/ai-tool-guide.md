---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-nav
protected: false
---
# AI Tool Guide — Creating/Updating Battlefield Geometry

Step-by-step instructions for AI agents to create and manage battlefield arenas using MCP.

## Prerequisites
- Unity Editor open with the target project
- `com.the1studio.dots-battlefield` package in Packages/ folder
- MCP for Unity connected

## Create New Arena (Full Workflow)

### Step 1: Create ArenaConfig asset
Use MCP `manage_asset` or Unity menu to create config:
```
Action: Create ArenaConfig via Assets > Create > DOTSBattlefield > Arena Config
```
Or use `manage_scriptable_object` to create and configure programmatically.

### Step 2: Configure ArenaConfig
Key fields to set:
- `OutputFolder` — where generated assets go (e.g., "Demos/BattleDemo")
- `GridWidth`/`GridDepth` — arena size in tiles
- `TileSize` — meters per tile (default 10)
- `SpawnCenterA`/`SpawnCenterB` — team spawn positions
- `ObstacleDensity` — 0.0 (none) to 1.0 (every cell)
- `ElevationVariance` — 0 (flat) to 5 (hilly)
- `PreMadeObstaclePrefabs` — drag Synty/imported models here

### Step 3: Generate prefabs
Execute menu item via MCP:
```
execute_menu_item: "Tools/DOTSBattlefield/Create Prefabs"
```
This creates tile prefabs, obstacle prefabs, materials, and default config if missing.

### Step 4: Build arena (choose one)

**Option A — Tile-based arena:**
```
execute_menu_item: "Tools/DOTSBattlefield/Assemble Arena"
```

**Option B — Procedural terrain:**
```
execute_menu_item: "Tools/DOTSBattlefield/Generate Procedural Terrain"
```

### Step 5: Verify
- Check `read_console` for errors
- Scene should have `BattlefieldArena` (tile) or `ProceduralTerrain` (procedural) root GO
- NavMesh should be baked (visible in Navigation window)

## Update Existing Arena

To regenerate with different settings:
1. Modify ArenaConfig fields (via Inspector or MCP)
2. Re-run the same menu item — old arena is auto-destroyed and rebuilt

## Common Configurations

### Small Training Arena (20x20m)
- GridWidth=2, GridDepth=2, TileSize=10
- ObstacleDensity=0.2, ElevationVariance=0

### Standard Battle Arena (50x50m)
- GridWidth=5, GridDepth=5, TileSize=10
- ObstacleDensity=0.3, ElevationVariance=1.5
- SpawnCenterA=(-20,0,0), SpawnCenterB=(20,0,0)

### Large Terrain (100x100m)
- GridWidth=10, GridDepth=10, TileSize=10
- ObstacleDensity=0.25, ElevationVariance=3
- Use procedural terrain for best results

## Integrating Pre-Made Assets (Synty etc.)

1. Find prefabs: `Assets/Synty/Polygon*/Prefabs/Environment/*` or `Prefabs/Props/*`
2. Assign to `ArenaConfig.PreMadeObstaclePrefabs[]` array
3. Re-run arena generation — they scatter alongside built-in obstacles
4. Ensure prefabs have MeshCollider or BoxCollider for NavMesh carving

## Navigation Integration (Agents Navigation)

**Critical:** When using procedural terrain with elevation (`ElevationVariance > 0`), agents MUST have `AgentGrounding` to snap to terrain surface.

### How it works
1. `ProceduralTerrainGenerator` creates terrain mesh + `NavMeshSurface` (Volume mode)
2. `NavMeshSurface.BuildNavMesh()` bakes walkable surface from terrain + obstacles + walls
3. Agents Navigation reads baked NavMesh for pathfinding via `NavMeshPath` component
4. `AgentGroundingSystem` raycasts downward to snap agent Y to terrain surface

### Required agent components (baked by NavigationAuthoring)
- `NavMeshPath` — pathfinding on baked NavMesh
- `AgentGrounding` — Y-snap to terrain via physics raycast (enabled by `EnableGrounding = true`)

### NavMeshSurface configuration
- **Mode:** `CollectObjects.Volume` (includes root terrain mesh + child obstacles)
- **Geometry:** `NavMeshCollectGeometry.PhysicsColliders`
- **Volume size:** auto-calculated from `ArenaWidth`, `ArenaDepth`, `BoundaryWallHeight`, `ElevationVariance`
- **Single surface:** Generator auto-removes stale `NavMeshSurface` from old "Ground" GO

### Post-generation checklist
1. Only one `NavMeshSurface` in scene (on `ProceduralTerrain`)
2. Clear `Library/EntityScenes/` after code changes to force SubScene rebake
3. Verify `AgentGrounding` on entities: `manage_dots query_entities AgentGrounding`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No ArenaConfig found" | Create one via Assets > Create > DOTSBattlefield > Arena Config |
| "FlatTile prefab not found" | Run Tools/DOTSBattlefield/Create Prefabs first |
| NavMesh not baking | Ensure all obstacles have colliders; check NavMeshSurface is on root |
| Procedural terrain flat | Set ElevationVariance > 0 on ArenaConfig |
| Assets in wrong folder | Change OutputFolder on ArenaConfig before generating |
| Troops clip through terrain | Ensure `EnableGrounding = true` on `NavigationAuthoring`; clear EntityScenes cache |
| Duplicate NavMesh issues | Remove extra `NavMeshSurface` components; only one per scene |
| Agents don't follow terrain height | Add `AgentGrounding` component (baked by `NavigationAuthoring`) |
