---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Build Config Reference — cfgTemplate.json & cfgAndroidTemplate.json

## File Locations

- **Web:** `ConfigPath/cfgTemplate.json`
- **Android:** `ConfigPath/cfgAndroidTemplate.json`

These are Jenkins CI templates with placeholder tokens (`CocosPLA*`) replaced at build time.

## Placeholder Tokens

| Token | Replaced With | Valid Values |
|-------|---------------|--------------|
| `CocosPLABuildName` | Build name | Any string |
| `CocosPLAPlatform` | Target platform | `web-mobile`, `web-desktop` |
| `CocosPLABundleMode` | `nativeCodeBundleMode` | `wasm`, `asmjs`, `both` |
| `CocosPLAOrientationType` | Screen orientation | `portrait`, `landscape`, `auto` |
| `CocosPLAStartScene` | Start scene UUID | Scene UUID from Cocos Editor |
| `CocosPLASceneAll` | Scene list UUID | Scene UUID |
| `CocosPLATimeBuild` | Build timestamp | Auto-generated |

## Size-Critical Settings

### `experimentalEraseModules` (CRITICAL)

```json
"experimentalEraseModules": true
```

Cocos 3.8's engine JS dead-code elimination. Removes unused engine class code from the JS bundle at build time. Safe for projects that don't dynamically instantiate engine classes by string name (playable ads never do this).

**Impact:** 10–30% reduction of engine JavaScript bundle.

### `nativeCodeBundleMode`

```json
"nativeCodeBundleMode": "wasm"
```

| Value | Description | Size Impact |
|-------|-------------|-------------|
| `"wasm"` | WebAssembly only | Smallest for web |
| `"asmjs"` | asm.js fallback | Larger, for old browsers |
| `"both"` | Ship both WASM + asm.js | Largest — avoid |

### `overwriteProjectSettings.includeModules`

```json
"overwriteProjectSettings": {
  "includeModules": {
    "gfx-webgl2": "off"
  }
}
```

Overrides `engine.json` at build time. `"on"` forces module inclusion, `"off"` forces exclusion, `"inherit-project-setting"` uses `engine.json` value.

**WebGL2 note:** Most ad network webviews use WebGL1. Adding WebGL2 backend adds ~200 KB with no benefit.

### `wasmCompressionMode`

```json
"wasmCompressionMode": "gzip"
```

| Value | Description |
|-------|-------------|
| `false` | No WASM compression (default) |
| `"gzip"` | Gzip-compressed WASM embedded in JS |
| `"brotli"` | Brotli-compressed (smaller but slower decompress) |

Only relevant if WASM modules remain in the build (physics, Spine). If all WASM modules are removed, this setting has no effect.

### `polyfills.asyncFunctions`

```json
"polyfills": {
  "asyncFunctions": false
}
```

Adds `regenerator-runtime`-like polyfill (~15 KB) for async/await. Modern ad webviews (iOS Safari 11+, Chrome 55+) support ES2017 natively. Safe to disable for playable ads targeting 2020+ devices.

### Settings That Should Stay As-Is

| Setting | Value | Why |
|---------|-------|-----|
| `bundleCommonChunk` | `false` | Playable = single file, no chunk splitting |
| `md5Cache` | `false` | Self-contained HTML, no cache busting needed |
| `sourceMaps` | `false` | No debug info in production |
| `debug` | `false` | Strips debug assertions |
| `startSceneAssetBundle` | `false` | No asset bundles for playable ads |
| `mainBundleIsRemote` | `false` | Everything must be inline |
| `useSplashScreen` | `false` | No Cocos splash in ads |
| `packAutoAtlas` | `true` | Combines sprites into atlases (reduces draw calls) |
| `mainBundleCompressionType` | `"merge_dep"` | Merges dependencies into main bundle |

## Optimal cfgTemplate.json (Size-Focused)

```json
{
  "experimentalEraseModules": true,
  "nativeCodeBundleMode": "wasm",
  "wasmCompressionMode": "gzip",
  "bundleCommonChunk": false,
  "md5Cache": false,
  "sourceMaps": false,
  "debug": false,
  "polyfills": { "asyncFunctions": false },
  "overwriteProjectSettings": {
    "includeModules": {
      "gfx-webgl2": "off"
    }
  },
  "mainBundleCompressionType": "merge_dep",
  "packAutoAtlas": true,
  "useSplashScreen": false
}
```
