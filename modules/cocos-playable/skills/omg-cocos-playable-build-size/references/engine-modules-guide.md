---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Engine Modules Guide — Cocos Creator 3.8.7

## Module Removal Priority (by size impact)

### Must Remove for Playable Ads

| Module | Est. Size | What It Does | Why Remove |
|--------|-----------|--------------|------------|
| `physics-ammo` | ~3 MB | Ammo.js WASM (Bullet physics 3D) | No 3D physics in playable ads |
| `spine-3.8` | ~900 KB | Spine animation runtime WASM | Only if no `sp.Skeleton` usage |
| `physics-2d-box2d` | ~400 KB | Box2D WASM (2D physics) | Only if no `RigidBody2D`/colliders |
| `dragon-bones` | ~300 KB | DragonBones animation runtime | Only if no `dragonBones` usage |
| `marionette` | ~200 KB | Animation state machine graph | Only if no Marionette controller |
| `3d` | ~150 KB | 3D rendering core | Remove if pure 2D (check ParticleSystem usage) |
| `terrain` | ~100 KB | 3D terrain system | Never needed for playable ads |
| `meshopt` | ~100 KB | meshopt decoder for compressed glTF/FBX meshes | Drop for pure 2D. **Keep** if any `.fbx.meta` / `.gltf.meta` has `meshCompress.encode: true` — see `model-compression-guide.md` |
| `particle` | ~100 KB | 3D particle system | Remove if using `ParticleSystem2D` only |
| `tiled-map` | ~80 KB | Tiled map renderer | Only if no tiled maps |
| `light-probe` | ~50 KB | 3D light probes | Never needed for 2D |
| `profiler` | ~50 KB | FPS/draw call overlay | Must remove for production |
| `skeletal-animation` | ~80 KB | 3D skinned mesh animation | Remove if no 3D skinned meshes |
| `primitive` | ~30 KB | Primitive 3D shapes (cube, sphere) | Remove if no MeshRenderer primitives |
| `intersection-2d` | ~20 KB | 2D intersection queries | Remove if no manual 2D intersection checks |

### Conditional — Add Back Per-Project

| Module | When to Keep |
|--------|-------------|
| `spine-3.8` | Project uses Spine animations (`sp.Skeleton` component) |
| `3d` + `particle` | Project uses 3D `ParticleSystem` (not `ParticleSystem2D`) |
| `physics-2d-box2d` | Project uses 2D physics (`RigidBody2D`, `BoxCollider2D`) |
| `skeletal-animation` | Project uses skinned mesh animations |

### Always Keep for Playable Ads

| Module | Why |
|--------|-----|
| `base` | Core engine runtime — required |
| `gfx-webgl` | WebGL1 renderer — required for web |
| `2d` | 2D rendering — required |
| `ui` | UI system (Label, Sprite, Button) — required |
| `animation` | Animation clips — required |
| `tween` | Tween system — required for juice/transitions |
| `audio` | Audio playback — required |
| `graphics` | Graphics drawing API — required for masks |
| `mask` | UI masking — required for loading bars, etc. |
| `rich-text` | Rich text labels — required by RichTextParameter |
| `affine-transform` | 2D transform math — required |
| `particle-2d` | 2D particle effects — commonly used |

## How to Edit engine.json

Two sections must be synchronized:

### 1. `cache` block — controls Editor UI checkboxes
```json
"physics-ammo": { "_value": false }
```

### 2. `includeModules` array — controls what's actually built
```json
"includeModules": ["2d", "animation", "audio", ...]
```

Both must agree. If `cache` says `true` but `includeModules` omits the module, behavior is undefined.

### Alternative: Use Cocos Editor GUI
Project Settings → Feature Cropping → uncheck modules. This updates both sections automatically.

## Verification

After changing modules, grep the codebase to confirm nothing references removed modules:

```bash
# Check for 3D particle usage (forces particle + 3d modules)
grep -rn "ParticleSystem[^2]" --include="*.ts" assets/

# Check for physics usage
grep -rn "RigidBody\|Collider\|PhysicsSystem" --include="*.ts" assets/

# Check for Spine usage
grep -rn "sp\.\|Skeleton\|SkeletonData" --include="*.ts" assets/

# Check for DragonBones
grep -rn "dragonBones\|ArmatureDisplay" --include="*.ts" assets/

# Check for terrain
grep -rn "Terrain" --include="*.ts" assets/

# Check for tiled map
grep -rn "TiledMap\|TiledLayer" --include="*.ts" assets/
```

## Size Impact Estimates

| Config | Approximate Engine JS Size |
|--------|---------------------------|
| All modules (default) | ~8–12 MB uncompressed |
| Minimal 2D (recommended) | ~2–3 MB uncompressed |
| Minimal 2D + experimentalEraseModules | ~1.5–2 MB uncompressed |
| After gzip/brotli | ~400–600 KB compressed |

## Editor Workflow Pitfalls

### Cocos Editor reverts external `engine.json` edits

The editor watches `settings/v2/packages/engine.json`. If you edit the file while the editor is open, the editor rewrites the file from its in-memory state on its next save cycle — silently clobbering your edits. It may also spawn a dormant `custom-config-{uuid}-...` block alongside `migrationsConfig` in the same file.

**Mitigation:** fully quit Cocos Creator (process terminated, not just project closed — check Task Manager for `CocosCreator.exe` / `Creator.exe`) before any direct edit. When Cocos MCP Server is connected, prefer `manage_settings` MCP tools — they coordinate with the running editor.

### `modules.globalConfigKey` selects the active config

`engine.json` can hold multiple `cache` + `includeModules` blocks (`migrationsConfig`, `custom-config-{uuid}`, etc.). Only the block named in `modules.globalConfigKey` (at the bottom of the file) affects builds and the Feature Cropping panel. Always confirm which is active before editing — edits to dormant blocks have zero effect.

### Editor auto-scan false-positive list

When the editor opens a project, its heuristic scans assets and prompts to re-enable modules it thinks are used. These modules are frequently flagged but commonly **not actually used** — grep before accepting:

| Module | Flagged when | Verify with grep |
|--------|--------------|------------------|
| `rich-text` | Editor sees label-like nodes | `grep -rn "cc\.RichText\|RichText(" --include="*.ts" --include="*.scene" --include="*.prefab" assets/` |
| `spine` / `spine-3.8` | Old Spine assets leftover | `grep -rn "sp\.Skeleton\|sp\.SkeletonData" --include="*.ts" assets/` |
| `dragon-bones` | Old DragonBones assets leftover | `grep -rn "dragonBones\|DragonBonesAtlasAsset" --include="*.ts" assets/` |
| `physics-2d-*` | 3D physics components mistaken for 2D | `grep -rn "RigidBody2D\|Collider2D\|PhysicsSystem2D" --include="*.ts" assets/` |
| `tiled-map` | Stale tilemap asset | `grep -rn "TiledMap\|TiledLayer" --include="*.ts" assets/` |
| `profiler` | Editor default | Always safe to disable for production |
| `primitive` | Editor default | `grep -rn "primitives\." --include="*.ts" assets/` |
| `intersection-2d` | Editor default | `grep -rn "Intersection2D\|geometry\.IntersectGroup" --include="*.ts" assets/` |
| `meshopt` | Any FBX/glTF/GLB asset has `meshCompress.encode: true` in its `.meta` | `grep -rn "\"encode\": true" --include="*.fbx.meta" --include="*.gltf.meta" --include="*.glb.meta" assets/` — if ANY hit, meshopt is mandatory. See `model-compression-guide.md`. |
| `light-probe` | Scene has `cc.LightProbeInfo` bake block | Check renderers — if every `_useLightProbe: false`, safe to disable |
| `terrain` | Scene has terrain references | `grep -rn "cc\.Terrain\|TerrainComponent" --include="*.scene" --include="*.prefab" assets/` |
| `particle-2d` | Editor default | `grep -rn "ParticleSystem2D" --include="*.ts" --include="*.scene" --include="*.prefab" assets/` |

If grep returns no hits, decline the editor's prompt. If hits exist and the module IS needed, accept and document the dependency.

### `cache._value` vs `includeModules` divergence

`cache._value: true/false` drives the Feature Cropping panel UI checkbox state. `includeModules: [...]` drives the actual build module list. These can disagree. **Build uses `includeModules` as SSOT.** If the panel says "module X is on" but `includeModules` omits X, the build will exclude it. When cropping, update BOTH for consistency.

### Mandatory post-edit verification

After ANY direct `engine.json` edit AND user reopens the editor, re-read the file. Verify every cropped module is still:
1. `cache.{name}._value === false`, AND
2. Absent from `includeModules` array.

If the editor reverted any, identify which asset triggered the false-positive scan (using the grep table above) and either remove that asset or accept the module bloat. Never report "done" before this readback.

### Feature cropping affects build output only

The Cocos Editor scene/preview always renders with the full engine. The Feature Cropping panel and `engine.json` only affect what ships in the final BUILD output. Users will not see visual differences in the editor after cropping — direct them to `tools/optimize-size` or compare build folder sizes for verification.
