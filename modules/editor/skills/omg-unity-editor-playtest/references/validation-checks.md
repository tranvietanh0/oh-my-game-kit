---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Validation Checks Reference

## 8-Check MCP Protocol

### Check 1 — Console Clean
```
read_console(filter: "Error")
```
- Expected: 0 errors
- Fail action: STOP, fix errors before continuing
- Warnings acceptable unless they indicate missing components

### Check 2 — Entity Spawn
```
manage_dots(action: "query_entities", component: "GameEntityTag")
```
- Expected: count > 0 (matches spawner config)
- Fail: spawners misconfigured, SubScene not baked, prefab missing components

### Check 3 — Rendering
```
rendering_stats()
```
- Expected: draw_calls < 300 (desktop), batches > 0, triangles > 0, FPS > 0
- Fail: draw_calls = 0 or batches = 0 → lightmap NaN or culling issue

### Check 4 — NaN Bounds
```
manage_dots(action: "query_entities", component: "ChunkWorldRenderBounds")
```
- Inspect bounds values for NaN or Infinity
- Fail: any NaN → lightmap bake corruption, clear Library/EntityScenes/

### Check 5 — Movement
```
# t=0: capture positions
manage_dots(action: "get_component", component: "LocalTransform")
# wait 2 seconds
# t=2s: capture positions again
# compare: any delta > 0 = pass
```
- Expected: at least one team's units have moved
- Fail: BDP trees missing, DetectionRadius too small, NavMesh not baked

### Check 6 — Combat
```
manage_dots(action: "query_entities", component: "DamageEvent")
# OR check HP decrease over time via DerivedCombatStats.CurrentHP
```
- Expected: DamageEvents exist OR HP values decreasing
- Fail: no targets found, range too small, attack system disabled

### Check 7 — Camera
```
manage_gameobject(action: "find", name: "Main Camera")
# Check position is reasonable (not at origin if scene is large)
```
- Expected: camera exists, position not default (0,0,0) for top-down/iso demos
- Fail: camera not created by Setup Scene, wrong farClipPlane (must be > CameraHeight)

### Check 8 — Battle Resolution
```
# Wait for units to die (timeout 60s)
manage_dots(action: "query_entities", component: "GameEntityTag")
# Repeat every 5s until one team count = 0
```
- Expected: one team eliminated within timeout
- Fail: balance issue, death/respawn loop, win condition system disabled

## Quick Mode (Checks 1-3 Only)
Run for smoke tests after minor code changes. Skips gameplay checks.
