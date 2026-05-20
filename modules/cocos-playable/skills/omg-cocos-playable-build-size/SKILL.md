---
name: omg-cocos-playable-build-size
description: "Cocos Creator 3.8.7 playable ads build size optimization. Engine module pruning, texture compression, model/FBX/glTF mesh compression, build config tuning, asset auditing, and ad network size budget compliance."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Cocos Playable Build Size Optimization

Optimize Cocos Creator 3.8.7 playable ad builds for ad network size budgets (2–5 MB). Does NOT handle game logic (use `omg-cocos-playable-gameflow`), parameters (use `omg-cocos-playable-parameter`), or SDK integration (use `omg-cocos-playable-sdk-core`).

## Ad Network Size Limits

| Network | Max Size | Format |
|---------|----------|--------|
| Meta/Facebook | 2 MB | Single HTML |
| Google Ads | 5 MB | Single HTML or ZIP |
| Unity Ads | 5 MB | Single HTML |
| IronSource | 5 MB | ZIP |
| AppLovin | 5 MB | Single HTML |
| TikTok | 2 MB | Single HTML |
| Voodoo | 5 MB | Single HTML |
| Mintegral | 5 MB | ZIP |

## Size Optimization Checklist

### 1. Engine Module Pruning (Biggest Impact: 4–6 MB savings)

**File:** `settings/v2/packages/engine.json`

Minimal modules for a 2D playable ad:
```json
"includeModules": [
  "2d", "affine-transform", "animation", "audio", "base",
  "gfx-webgl", "graphics", "mask", "particle-2d",
  "rich-text", "tween", "ui"
]
```

Modules to REMOVE (with sizes): See `references/engine-modules-guide.md`

To modify: Open Cocos Editor → Project Settings → Feature Cropping. Or edit `engine.json` directly — update both `cache` (`_value: false`) and `includeModules` array.

### 2. Build Config Tuning

**Files:** `ConfigPath/cfgTemplate.json`, `ConfigPath/cfgAndroidTemplate.json`

| Setting | Optimal Value | Why |
|---------|--------------|-----|
| `experimentalEraseModules` | `true` | Cocos's JS dead-code removal. 10–30% engine JS reduction |
| `gfx-webgl2` (overwrite) | `"off"` | WebGL2 backend adds ~200 KB; most ad webviews use WebGL1 |
| `nativeCodeBundleMode` | `"wasm"` | Smallest for web; `"asmjs"` fallback if WASM unsupported |
| `wasmCompressionMode` | `"gzip"` or `"brotli"` | Compress remaining WASM (if any modules still need it) |
| `polyfills.asyncFunctions` | `false` | Saves ~15 KB; modern webviews support ES2017 async/await |
| `bundleCommonChunk` | `false` | Must be false for single-file HTML playable |
| `sourceMaps` | `false` | No debug maps in production |
| `debug` | `false` | Strips debug assertions |

Full settings reference: See `references/build-config-reference.md`

### 3. Texture Optimization

**File:** `settings/v2/packages/builder.json`

| Setting | Optimal | Current Issue |
|---------|---------|---------------|
| `genMipmaps` | `false` | Mipmaps add ~33% to texture data; useless for 2D |
| Compression quality | `70–80` | Quality `10` causes artifacts; `80` balances size/quality |
| WebP format | Add `"webp": { "quality": 80 }` | PNG-only misses 25–35% savings on web |
| Uncompressed textures | Apply preset to ALL | Check all `.meta` files have `compressSettings` |

Full texture & audio guide: See `references/texture-audio-optimization.md`

### 4. Audio Optimization

Target: MP3/OGG, mono, 96 kbps for SFX, 128 kbps for BGM. Use `optimize-size` tool.

```bash
cd CocosPlayableAdsTemplate/tools/optimize-size && npm start
# Opens http://localhost:3456 — browse and compress audio files
```

### 5. Code-Level Optimizations

- **3D ParticleSystem imports** force `3d` + `particle` modules. Use `ParticleSystem2D` instead.
- **`import * as cc from "cc"`** pulls entire namespace — import specific classes.
- **Both SDK adapters always bundled** via `SdkFactory`. Minor issue, both are small.
- **`fs-extra` in dependencies** — should be `devDependencies` (editor-only).

### 6. Asset Audit

- Remove unused assets from `game-assets/vfx/` before shipping
- Cocos only bundles scene-referenced assets, but accidental references happen
- Use `optimize-size` tool to identify large source assets

### 7. Model Compression (FBX / glTF) — Optional, only if shipping 3D

If the playable contains 3D meshes (`*.fbx`, `*.gltf`, `*.glb` under `game-assets/`), per-asset `.meta` editing of `meshCompress` (quantize + meshopt encode) and `meshSimplify` (target-ratio decimation) typically drops mesh `.bin` files by 40–70%.

**Critical interaction:** `meshCompress.encode: true` REQUIRES the `meshopt` engine module to be enabled. If you previously cropped `meshopt` per § 1, you must re-enable it before turning encode on — otherwise runtime crashes with `meshopt_decoder undefined`.

**Strategy split:**
- Static meshes (field, props, ball) — full compress + simplify `targetRatio: 0.3–0.5`
- Skinned meshes (character, hair, hands) — full compress but `meshSimplify.enable: false` (or `targetRatio: 0.7+`) to preserve skin weights

Full workflow including pre-change checklist, red-flag breakage table, rollback steps, and batch-script template: `references/model-compression-guide.md`

## Workflow: Full Size Audit

If Cocos MCP Server is connected, use MCP tools for automation:

1. **Check engine modules** — `manage_settings` → `get_engine_modules` (or read `engine.json` directly)
2. **Check build config** — `manage_settings` → `get` with `fileName: "builder"` (or read files directly)
3. **Check builder config** — `manage_settings` → `get_texture_config`
4. **Scan code for 3D imports** — `manage_code_analysis` → `scan_imports` with `pattern: "ParticleSystem[^2]"`
5. **Scan texture metas** — `manage_asset` → `get_texture_stats`
6. **Check audio sizes** — `manage_asset` → `get_audio_stats`
7. **Report findings** with severity (Critical/Important/Minor) and estimated savings

Without MCP: read files directly with Read tool, use Grep for code scanning.

## Workflow: Apply Optimizations

### Step 0 — User Confirmation Gate (MANDATORY for direct file edits)

**Before any `Edit` / `Write` tool call on `engine.json`, `builder.json`, or any `.fbx.meta` / `.gltf.meta` / `.glb.meta`, you MUST invoke `AskUserQuestion` to confirm the Cocos Editor is fully closed.** No exceptions. No "I already checked Task Manager" shortcuts — the user owns this confirmation. The editor watches these files and rewrites them from its in-memory state on its next save cycle, silently clobbering your edits. Blast radius is non-trivial: optimization work that *appears* committed but never ships.

Required gate sequence:

1. Call `AskUserQuestion` BEFORE the first direct edit with prompt:
   > *"I'm about to edit `<file>` directly. Cocos Editor MUST be fully closed (verify `CocosCreator.exe` / `Creator.exe` absent in Task Manager) or my edits will be silently reverted on the editor's next save cycle. Is the editor closed?"*
2. Options: `[Editor closed — proceed]`, `[Editor open — wait, I'll close it]`, `[Cancel]`.
3. Proceed ONLY on `closed — proceed`. On `wait`, pause and re-ask after the user signals closed. On `cancel`, stop and report.
4. Optionally cross-check: `Get-Process CocosCreator -ErrorAction SilentlyContinue` (PowerShell) or `tasklist | findstr /i CocosCreator` (cmd). If the process is detected after a `closed — proceed` answer, surface the mismatch to the user and re-ask — do NOT proceed silently.
5. The gate is required ONCE per workflow session for the same file set; if the user re-opens the editor mid-workflow you MUST re-gate before subsequent edits.

**Exception — MCP path:** if Cocos MCP Server is connected AND every mutation goes through `manage_settings` / `manage_asset` MCP tools (NOT `Edit` / `Write`), the gate is not required — MCP tools coordinate with the running editor. Any direct file edit alongside MCP work ALWAYS triggers the gate.

**Exception — non-watched files:** `ConfigPath/cfgTemplate.json` and `ConfigPath/cfgAndroidTemplate.json` are Jenkins build templates outside `settings/v2/packages/` and are not watched by the editor — Step 0 gate not required for these specific files.

**Rule basis:** `rules/always-ask-on-unresolved.md` § 6 — *"Any deletion, overwrite, or destructive action whose blast radius is non-trivial — even if you have a strong default. Ask first."* Silent-revert qualifies as destructive blast radius.

### Step 1 — With MCP Server (editor-aware, no quit needed)

1. `manage_settings` → `set_engine_modules` with `modules: {"3d": false, "profiler": false, ...}` (syncs both cache + includeModules)
2. `manage_settings` → `set_texture_config` with `config: {"genMipmaps": false}`
3. `manage_asset` → `compress_textures` with `presetId` from builder.json presets
4. Edit `cfgTemplate.json` + `cfgAndroidTemplate.json` — apply optimal settings (no MCP tool yet; non-watched files, Step 0 gate not required)
5. Fix code — replace 3D `ParticleSystem` with `ParticleSystem2D` if appropriate
6. Rebuild in Cocos Editor and verify output size

### Step 1 — Without MCP (manual direct-edit path)

**Step 0 User Confirmation Gate is MANDATORY before any step below.**

1. Quit Cocos Editor fully (verify in Task Manager — `CocosCreator.exe` absent).
2. Edit `engine.json` — flip `_value: false` AND remove from `includeModules` for each cropped module.
3. Edit `cfgTemplate.json` / `cfgAndroidTemplate.json`.
4. User reopens editor → declines any "re-enable module X" prompt unless grep confirms actual usage (see reference grep table).
5. **Mandatory readback** — re-read `engine.json` after reopen; confirm every cropped module is still `_value: false` AND absent from `includeModules`. Report drift explicitly. Never claim "done" before this step.

## Common Mistakes

- Editing `engine.json` while Cocos Editor is **open** — editor reverts the file from its in-memory state. ALWAYS run the Step 0 User Confirmation Gate (Workflow: Apply Optimizations) before any direct edit. Never skip on the basis of "I already checked Task Manager" — the user owns the confirmation.
- Editing `engine.json` but forgetting to update both `cache._value` and `includeModules` — must update BOTH
- Editing the wrong config block — multiple configs can exist (`migrationsConfig`, `custom-config-{uuid}`); only the one named in `modules.globalConfigKey` is active.
- Reporting "modules cropped" without re-reading the file after the user reopens the editor — the editor's auto-scan may have reverted some via false-positive heuristics.
- Trusting prior session's "this module is already off" claims — always read the actual `_value` and `includeModules` array; never assume.
- Setting texture quality too low (10) — causes visible artifacts, especially on VFX
- Keeping `profiler` module enabled — adds FPS overlay code to production builds
- Forgetting `genMipmaps: false` — 33% texture waste, invisible in dev but bloats build
- Using `"gfx-webgl2": "on"` when targeting ad webviews that don't support WebGL2
- Not applying texture compression preset to all textures (check each `.meta` file)
- Enabling `meshCompress.encode: true` while the `meshopt` engine module is cropped — runtime `meshopt_decoder undefined` crash. Always re-enable `meshopt` first.
- Running `meshSimplify` on skinned character meshes with default `targetRatio: 0.4` — collapses vertices that share skin weights, producing distorted limbs. Disable simplify on skinned meshes or raise ratio to `0.7+`.
- Editing `.fbx.meta` while Cocos Editor is open — same trap as `engine.json`. Editor re-imports and reverts your changes. Step 0 User Confirmation Gate applies to `.fbx.meta` / `.gltf.meta` / `.glb.meta` edits too.
- Deleting a `.fbx.meta` to "start fresh" instead of editing in place — invalidates the UUID and orphans every prefab reference. Always edit, never recreate.

## Gotchas

- **Cocos Editor silently reverts `engine.json` / `builder.json` / `*.fbx.meta` edits while open.** Step 0 User Confirmation Gate (Workflow: Apply Optimizations) is MANDATORY before any direct `Edit` / `Write` tool call on these files — call `AskUserQuestion` to make the user confirm editor is closed. AI-side process checks (`Get-Process` / `tasklist`) supplement but do NOT replace the user confirmation. Details + active-config rule + post-edit readback protocol + false-positive grep table: `references/engine-modules-guide.md` § Editor Workflow Pitfalls.
- **Feature cropping has no editor-visible effect.** Scene/preview always renders with the full engine. Savings only appear in final BUILD output — verify via `tools/optimize-size` or build folder size diff, never editor view.
- **Build size cap for ad networks: typically 5MB** — going over silently fails on AdMob, hard-rejects on Meta.
- **Inlining base64 assets blows up minified JS** — keep large assets as separate URLs and gate `crossOrigin: 'anonymous'`.
- **TerserPlugin defaults preserve class names**; flip `mangle: { keep_classnames: false }` for an extra ~5% reduction.
- **Model compression has a hard dependency on the `meshopt` engine module.** Cropping `meshopt` is the right call for 2D-only playables, but the moment any `.fbx.meta` has `meshCompress.encode: true` the module becomes mandatory. Cross-check before flipping either side. Full workflow: `references/model-compression-guide.md`.
- **`.fbx.meta` UUID is referenced by every prefab that uses the model.** Never delete-and-recreate a `.meta` — always edit in place. Restoring from `.meta.bak` is safe; regenerating from scratch is not.
- **Cocos has no project-wide model compression preset.** Each `.fbx.meta` is configured individually. For projects with 20+ models, batch via a Node.js script (template in the reference) with the editor closed.
