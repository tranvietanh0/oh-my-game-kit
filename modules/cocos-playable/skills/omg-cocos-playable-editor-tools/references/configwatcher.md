---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# ConfigWatcher — Reference

File: `assets/PlayableParamterTool/json-generate/ConfigWatcher.ts`

## How It Works

```
@executeInEditMode decorator → runs in Cocos Editor only (EDITOR env check guards runtime)
    ↓
start() → generateJSON()
    ↓
serializePlayableConfig(PlayableConfigProvider.config)   ← serializes all parameters
    ↓
Writes: assets/ParameterToolBuild/playable-config.json   ← dashboard reads this
    ↓ (if includeAssetRemoved = true)
waitForAssetsReady() → getAssetsRemoveInBuild()
    ↓
Deduplicates RefObject[] by (assetPath + parameterPath)
    ↓
Writes: assets/ParameterToolBuild/parameter-assets.json  ← asset removal manifest
```

## Setup

1. Add `ConfigWatcher` component to any scene node
2. Inspector: `includeAssetRemoved` (default true) — set false to skip `parameter-assets.json`
3. Runs automatically on scene open (`start()`); triggers only in Editor mode

## Hash-Based Change Detection

```typescript
// Internal — not exposed publicly
private getConfigHash(): string {
    return JSON.stringify(PlayableConfigProvider.config);
}
// checkAndGenerate() compares against lastConfigHash — only regenerates on change
```

## File Writing Pattern (Editor API + Node.js fs)

```typescript
// Only works inside Editor — uses Node.js require() not ES imports
const fs = require('fs');
const path = require('path');
const projectPath = Editor.Project.path;  // absolute path to .cocos project
const outputPath = path.join(projectPath, 'assets/ParameterToolBuild/playable-config.json');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
```

## Asset Removal Tracking

- `ParameterToolBuild/assetRemove/` folder — place assets here to force-remove from build regardless of parameters
- Sub-assets (e.g., `BgFill.png/spriteFrame`) are skipped — only top-level assets tracked
- `deduplicateAssets()` uses `assetPath + '|' + JSON.stringify(parameterPath)` as key
- `Editor.Message.request('asset-db', 'query-assets', { pattern })` used to list folder contents

## CRITICAL: ParameterToolBuild/ is Auto-Generated

**Never edit files inside `ParameterToolBuild/` manually.** They are overwritten on every ConfigWatcher run. Edit `PlayableConfig.ts` instead.

## JsonSerializerUtils

`serializeParameter(param)` — recursive, handles all parameter types automatically:
- Skips functions, `undefined`, `null`
- `parameters` nested key → recurses into sub-parameters
- Plain objects → `JSON.parse(JSON.stringify(...))` deep copy
- Special case: `param.type === 'table'` → `serializeTableParameter`
