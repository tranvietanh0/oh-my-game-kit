---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Model Compression Guide — FBX / glTF in Cocos Creator 3.8.7

Optional companion to the 2D-focused build-size workflow. Use ONLY when the playable ships 3D meshes (`game-assets/**/*.fbx`, `*.gltf`, `*.glb`). For 2D-only playables, dropping the `3d`/`meshopt`/`particle` engine modules entirely is the bigger win — see `engine-modules-guide.md`.

## When to read this

You're shipping 3D content (character models, environment props, animated meshes) and the build is over budget. Typical impact:

- `meshCompress` (quantize + meshopt encode) → 40-70% smaller `.bin` files
- `meshSimplify` (target 0.4) → ~60% fewer triangles, ~50% smaller `.bin`
- Animation curve culling → 10-30% smaller animation clips
- Removing per-FBX embedded textures → moves bytes into shared compressed texture pipeline

## The Cocos 3.8.7 Schema (verified)

Every FBX/glTF `.meta` exposes these top-level `userData` blocks:

```json
"meshSimplify": {
  "enable": true,
  "targetRatio": 0.4
},
"meshCompress": {
  "enable": true,
  "compress": true,
  "quantize": true,
  "encode": true
},
"lods": {
  "enable": false,
  "hasBuiltinLOD": false,
  "options": [
    { "screenRatio": 0.25, "faceCount": 1   },
    { "screenRatio": 0.125, "faceCount": 0.25 },
    { "screenRatio": 0.01,  "faceCount": 0.1  }
  ]
},
"fbx": {
  "smartMaterialEnabled": true
}
```

| Field | What it does | Safe default for playable |
|---|---|---|
| `meshSimplify.enable` | Run meshoptimizer's simplifier at import | `true` for environment props; `false` for skinned chars (see cautions) |
| `meshSimplify.targetRatio` | Fraction of triangles to keep (`0.4` = drop 60%) | `0.3–0.5` for static, `0.6–0.8` if skinned |
| `meshCompress.enable` | Master switch for the compression block | `true` |
| `meshCompress.compress` | Zlib-compress the `.bin` payload | `true` |
| `meshCompress.quantize` | Quantize positions/normals/UVs to smaller int types | `true` |
| `meshCompress.encode` | meshopt encode (vertex + index buffer encoding) — **requires `meshopt` engine module** | `true` |
| `lods.enable` | Auto-generate LOD chain | `false` (fixed-camera playables don't benefit) |
| `fbx.smartMaterialEnabled` | Re-bind materials by name on re-import | `true` (leave alone unless you hit material drift) |

## Engine Module Dependency (CRITICAL)

Setting `meshCompress.encode: true` makes the meshopt engine module REQUIRED at runtime. If you previously cropped `meshopt` from `engine.json` per the 2D guide, you MUST re-enable it OR turn `encode: false` everywhere.

```bash
# Confirm meshopt is included BEFORE flipping encode on
grep -n "meshopt" settings/v2/packages/engine.json
# Expect a row like:  "meshopt": { "_value": true }   AND  "meshopt"  in  includeModules
```

If `meshopt` is off and `encode: true`, you get a silent black-screen at runtime with a `meshopt_decoder undefined` console error. Cross-reference: `engine-modules-guide.md` § Conditional modules.

## Pre-Change Checklist (run BEFORE editing any model .meta)

1. **Quit Cocos Editor fully.** Same rule as `engine.json` — the editor re-imports and reverts.
   - Verify `CocosCreator.exe` is absent from Task Manager (Windows) / Activity Monitor (Mac).
2. **Back up the model + its `.meta`.**
   - `cp Char_final.fbx Char_final.fbx.bak && cp Char_final.fbx.meta Char_final.fbx.meta.bak`
   - The `.meta` contains the UUID that every prefab references. Replacing it from scratch breaks every reference.
3. **Snapshot the current build size** (`tools/optimize-size` or build-folder du) so you can measure the delta.
4. **Verify the asset is actually loaded** — `grep -rn "<uuid>" assets/` and `grep -rn "<filename>.prefab" assets/`. If nothing references it, the bigger win is deleting it.
5. **Record current triangle counts** — each mesh subMeta has `userData.triangleCount`. Total them; the post-import re-count tells you what `meshSimplify` actually did.
6. **Note whether the mesh is skinned** — any `gltf-skeleton` subMeta means it has skin weights. Skinned + aggressive simplify = broken animation.

## Step-By-Step: FBX Compression

1. Open the `.fbx.meta` file in a text editor (not the Cocos importer panel — direct edit is faster and lets you template across many files).
2. In `userData`, set:
   ```json
   "meshCompress": { "enable": true, "compress": true, "quantize": true, "encode": true }
   ```
3. For static props (field, net, goalposts), also enable simplify:
   ```json
   "meshSimplify": { "enable": true, "targetRatio": 0.4 }
   ```
   For animated/skinned (character, hands, hair), set `enable: false` OR raise `targetRatio` to `0.7+` and visually verify the rig afterward.
4. Save the file. Reopen the Cocos Editor.
5. The editor re-imports automatically. Watch the Console for `[gltf-mesh] reimport` messages.
6. **Re-open every prefab that references the model** and confirm meshes still render. The `meshCompress.encode` path is fragile if `meshopt` is missing from engine modules.

## Step-By-Step: glTF / GLB Compression

Same field schema. The `importer` row is `"gltf"` instead of `"fbx"`, and there's no `fbx.smartMaterialEnabled` block. Otherwise identical.

For external pre-compression (smaller still), run `gltfpack` BEFORE import:

```bash
# Vertex quantize + meshopt encode at the file level
npx -y gltfpack -i model.glb -o model.compressed.glb -cc -tc
# Then import the .compressed.glb into Cocos with meshCompress.encode: false
# (file is already encoded; double-encoding inflates it)
```

Use one or the other, never both. If you use `gltfpack`, set `meshCompress.encode: false` in the Cocos `.meta` so the editor doesn't try to re-encode an already-encoded buffer.

## Red Flags — What Breaks When You Compress

| Symptom | Likely cause | Fix |
|---|---|---|
| Character mesh distorted, limbs stretched after import | `meshSimplify` collapsed vertices that share skin weights | Set `meshSimplify.enable: false` on the skinned mesh; or raise `targetRatio` to `0.7+` |
| Blendshapes / morph targets missing | Simplifier dropped morph deltas | Disable `meshSimplify` on any mesh with a `gltf-mesh-morph` subMeta |
| Silent black screen, console: `meshopt_decoder is undefined` | `meshCompress.encode: true` but `meshopt` engine module pruned | Re-enable `meshopt` in `engine.json` `_value` AND `includeModules` |
| Mesh appears with hard/faceted normals after compress | `quantize: true` over-quantized normals on low-poly mesh | Set `quantize: false` for that mesh; accept the size cost |
| UV seams have visible cracks on textures | UV quantization too aggressive (rare in 3.8.7 default) | Set `quantize: false`; or split UV shells before export |
| All textures swap to wrong materials after re-import | `fbx.smartMaterialEnabled: false` + material names changed | Set back to `true` OR manually re-bind materials in prefab |
| Animation jitters / pops | Animation curve compression too aggressive (separate from meshCompress) | In FBX import settings, raise `animationBakeRate` or disable curve simplification |
| Prefab loads as empty / missing reference | The `.meta` UUID changed (deleted + recreated, not edited in place) | Restore from `.meta.bak`; never delete-and-recreate a `.meta` |
| Editor crashes on re-import | Corrupted `.bin` from interrupted previous import | Delete the asset's `library/imports/<uuid>` folder; let editor re-import clean |

## Rollback

If a compression pass breaks the build:

1. Quit Cocos Editor.
2. Restore the `.meta.bak` files: `mv Char_final.fbx.meta.bak Char_final.fbx.meta`.
3. Delete the cached imports: `rm -rf library/imports/<first-2-chars-of-uuid>/<full-uuid>` for each reverted asset (Cocos rebuilds on next open).
4. Reopen the editor. Confirm meshes render correctly.

Never `git checkout --` a `.meta` while the editor is open — it will re-emit a fresh `.meta` with a NEW UUID and orphan every prefab reference.

## Per-File vs Global Strategy

Cocos does NOT have a project-wide model compression preset (unlike textures, which have `userPreset` in `builder.json`). Each `.meta` is edited individually. Two options:

- **Manual:** open each `.fbx.meta` and edit. Practical for 5-20 models.
- **Batch script:** if you have 50+ models, write a Node.js script that walks `game-assets/**/*.fbx.meta`, parses JSON, merges in the `meshCompress`/`meshSimplify` blocks, and writes back. Run with editor closed.

Skeleton for the batch approach (run from project root, editor MUST be closed):

```javascript
// tools/apply-mesh-compression.cjs
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const COMPRESS = { enable: true, compress: true, quantize: true, encode: true };
const SIMPLIFY_STATIC  = { enable: true,  targetRatio: 0.4 };
const SIMPLIFY_SKINNED = { enable: false, targetRatio: 1.0 };

const SKINNED_HINTS = ['character/', 'Char_', 'Ani_'];

for (const file of glob.sync('assets/game-assets/**/*.fbx.meta')) {
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  meta.userData = meta.userData || {};
  meta.userData.meshCompress = COMPRESS;
  meta.userData.meshSimplify = SKINNED_HINTS.some(h => file.includes(h))
    ? SIMPLIFY_SKINNED : SIMPLIFY_STATIC;
  fs.writeFileSync(file, JSON.stringify(meta, null, 2) + '\n');
  console.log('updated', path.basename(file));
}
```

**Cautions for the batch path:** the script MUST preserve all other `.meta` fields (subMetas, UUIDs, userData.assetFinder, userData.materials overrides) — easy to wipe accidentally with a naive `JSON.stringify` after Object.assign on a subset. The example above merges into existing `userData`, not over it.

## Animation Clips (Separate Optimization)

FBX animation clips are imported as separate `.anim` assets and do NOT use `meshCompress`. They have their own size dial in the FBX import panel (`Animation Bake Rate`, default 30 fps — drop to 20 for non-combat playables). Curve simplification is automatic in Cocos 3.8.7; manual tuning lives in the Cocos editor's FBX Animation tab, not the `.meta`.

For very long animations (5+ seconds), consider clipping the unused tail in DCC before re-export rather than relying on import-time culling.

## What This Guide Does NOT Cover

- Mesh authoring in DCC (Blender, Maya) — pre-export polycount budgets
- Texture compression for model textures — see `texture-audio-optimization.md`
- Runtime mesh modification (`allowMeshDataAccess`) — only relevant for procedural/collision use cases; default `false` is correct for ad playables
- Skeletal animation re-targeting

## Cross-References

- `engine-modules-guide.md` § meshopt — when meshopt module is REQUIRED vs prunable
- `texture-audio-optimization.md` — for the texture portion of FBX-embedded images
- `build-config-reference.md` — for the build-level settings
- Cocos 3.8.7 docs: https://docs.cocos.com/creator/3.8/manual/en/asset/model-import.html
