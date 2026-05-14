---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Scene Setup Troubleshooting

## Menu Item Not Found

**Symptom:** `execute_menu_item` throws "menu item not found"

**Causes & Fixes:**
1. Editor asmdef missing reference → check `{Demo}/Editor/*.asmdef` includes `Unity.Entities`
2. Script compilation error → `read_console(filter:"Error")` first, fix errors before running menu
3. Wrong path format → verify exact path via Unity Editor menu bar manually
4. Unity not in Edit mode → ensure not in Play mode when running setup tools

## Entities Invisible After Setup

**Symptom:** `rendering_stats` shows batches=0 or entities exist but nothing renders

**Cause:** Lightmap baking corrupts DOTS `ChunkWorldRenderBounds` → NaN → entities culled

**Fix:**
1. Do NOT bake lighting with DOTS entities in scene
2. Use realtime lighting only during development
3. Clear `Library/EntityScenes/` → re-enter Play mode
4. See `unity-light-baking` skill for DOTS-safe bake workflow

## Troops Not Moving

**Symptom:** Units spawn but stand still (no pathfinding)

**Cause priority:**
1. **BDP trees missing** — `Create Unit Prefabs` wipes prefabs, destroying BDP trees
   - Fix: always run `Build Behavior Trees` AFTER `Create Unit Prefabs`
2. **DetectionRadius too small** — units can't see enemies
   - Fix: check `{Demo}UnitPrefabCreator` → `DetectionRadius` >= spawn gap distance
3. **NavMesh not baked** — obstacles block entire surface
   - Fix: re-run `Setup Scene`, verify `GameObjectUtility.SetNavMeshArea(obs, 1)` for obstacles

## Stale Entity Cache

**Symptom:** Old component data persists after code changes, baking doesn't reflect new authoring

**Fix:**
```bash
rm -rf Library/EntityScenes/
```
Or via MCP: `manage_editor(action: "clear_entity_cache")` if available.

Must clear after:
- Adding/renaming `IComponentData` fields
- Changing `Baker<T>` logic
- Modifying SubScene content

## Prefab Regeneration Order (CRITICAL)

```
1. Create Unit Prefabs   ← sets components
2. Build Behavior Trees  ← adds BDP to prefabs (MUST run after step 1)
3. Setup Scene           ← places prefabs in SubScene
4. Clear Library/EntityScenes/
5. Enter Play mode
```

Skipping step 2 after step 1 → units idle forever.
