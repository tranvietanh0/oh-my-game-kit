---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Shadow Safety & Rendering Debug Guide

## Safe vs Unsafe Shadow Changes

| Change Type | Safety | Notes |
|-------------|--------|-------|
| URP Asset shadow settings (resolution, distance, cascades, bias) | **SAFE** | Pipeline-level, no scene data affected |
| Per-entity `ShadowCastingMode` via code | **SAFE** | Runtime component, no baked data |
| Adding `LightProbeGroup` to scene | **SAFE if SubScene open** | Open SubScene before adding probes |
| Changing light `lightmapBakeType` to Mixed | **SAFE if SubScene open** | Must open SubScene before changing |
| Baking lighting (`Generate Lighting`) | **SAFE if SubScene open** | SubScene MUST be open during bake per official docs |
| Baking lighting with SubScene CLOSED | **DANGEROUS** | Corrupts ChunkWorldRenderBounds with NaN → entities invisible |
| Setting objects `isStatic = true` | **SAFE** | Only affects how lightmaps are calculated |

## CRITICAL Gotchas (Scene Lighting)

### ChunkWorldRenderBounds NaN Corruption
- **Known limitation**: Baking lightmaps **with SubScene CLOSED** corrupts `ChunkWorldRenderBounds` with NaN
- Per [official docs](https://docs.unity3d.com/Packages/com.unity.entities.graphics@1.4/changelog/CHANGELOG): *"You will need to bake with subscenes open, upon closing the lightmaps will be converted into the subscene."*
- **Effect**: ALL entities invisible in Game view (unit counters show exist, nothing renders)
- **Fix**: `git checkout -- <scene>.unity` + `rm -rf Library/EntityScenes/` — cache clear alone is NOT enough
- **Prevention**: Open SubScene before baking; close after completion
- **Scope**: Unity 6000.x + Entities Graphics 1.4.x

### MCP Temp Camera Bypass
- `manage_scene(screenshot)` creates a temp camera that bypasses frustum culling
- Entities may appear in MCP screenshots but be invisible in actual Game view
- **Always verify** via Game view: `ScreenCapture.CaptureScreenshot()` or `execute_menu_item("Tools/Capture Screenshot")`

### EntityScenes Cache After Lighting Changes
- After modifying light probes, mixed lighting mode, or baking: delete `Library/EntityScenes/`
- Prevents stale baked entity data with corrupted chunk bounds

## Rendering Debugger Workflow

1. `Ctrl+Backspace` → open Rendering Debugger
2. Lighting → Shadow Cascades → visualize cascade splits (color-coded)
3. Detailed Stats → shadow pass timing
4. MCP: `rendering_stats` → `get_stats` for draw calls, shadow casters count
