---
name: omg-cocos-playable-asset-management
description: "AssetsManager singleton with caching, duplicate-load prevention, and typed resource loading for playable ad size budgets"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# AssetsManager

Singleton wrapping Cocos `resources.load()` with a memory cache and in-flight deduplication. Critical for playable ads where the <5MB size budget demands careful asset reuse. See `omg-cocos-playable-object-pool` for how `ObjectPoolManager` delegates to this class.

## Architecture

```
AssetsManager (singleton)
├── _cache: Map<string, Asset>            ← "path_TypeName" → Asset
└── _loadingPromises: Map<string, Promise> ← deduplication guard
```

Cache key format: `"${path}_${type.name}"` e.g. `"audio/BGM_AudioClip"`.

All assets loaded from `resources/` folder (Cocos runtime bundle). Paths are relative to `assets/resources/`.

## Key APIs

```typescript
const am = AssetsManager.instance;

// Generic typed load (with cache + dedup)
const prefab  = await am.loadResource("prefab/UI/GameHUD", Prefab);
const sprite  = await am.loadResource("sprites/logo", SpriteFrame);
const texture = await am.loadResource("textures/bg", Texture2D);
const json    = await am.loadResource("data/config", JsonAsset);

// Convenience shorthands
const prefab = await am.loadPrefab("prefab/UI/GameHUD");
const sprite = await am.loadSprite("sprites/logo");
const audio  = await am.loadAudio("BGM");          // prepends "audio/" automatically
const tex    = await am.loadTexture("textures/bg");
const json   = await am.loadJson("data/config");

// Load entire directory
const frames = await am.loadDir("sprites/icons", SpriteFrame);
const all    = await am.loadDir("prefab/enemies");  // untyped

// Parallel preload
await am.preloadResources([
    { path: "prefab/UI/GameHUD", type: Prefab },
    { path: "audio/BGM",         type: AudioClip },
]);

// Bundle loading (for split bundles)
const bundle = await am.loadBundle("game-assets");

// Cache queries
am.isCached("prefab/UI/GameHUD", Prefab);         // boolean
am.getCachedAsset("prefab/UI/GameHUD", Prefab);   // Prefab | null
am.getCacheSize();                                 // number of cached entries

// Release (decrements Cocos ref count)
am.releaseAsset("prefab/UI/GameHUD", Prefab);
am.releaseAll();   // full cache flush — use on scene exit
```

## Deduplication Behaviour

Concurrent calls with the same `path+type` share one `Promise`. The second caller awaits the same network request — no double load. Promise entry is removed from `_loadingPromises` on resolve or reject.

```typescript
// Both calls share one load operation:
const [a, b] = await Promise.all([
    am.loadPrefab("prefab/Coin"),
    am.loadPrefab("prefab/Coin"),  // hits dedup guard, returns same promise
]);
```

## Audio Path Convention

`loadAudio(name)` automatically prepends `"audio/"`:
```typescript
await am.loadAudio("BGM");   // loads resources/audio/BGM.mp3
await am.loadAudio("SFX_Tap");
```
Do not include `"audio/"` in the name — it will double-prefix.

## Legacy API

`loadAsync(type, id)` loads from `prefab/UI/{id}` — kept for backward compatibility. Prefer `loadResource()` for new code.

## Workflow: Common Tasks

**Preload all assets during loading state:**
```typescript
await AssetsManager.instance.preloadResources([
    { path: "prefab/UI/WinView",  type: Prefab },
    { path: "prefab/UI/LoseView", type: Prefab },
    { path: "audio/BGM",          type: AudioClip },
    { path: "audio/SFX_Win",      type: AudioClip },
]);
```

**Load and instantiate a prefab:**
```typescript
const prefab = await AssetsManager.instance.loadPrefab("prefab/UI/Tutorial");
const node = instantiate(prefab);
node.parent = this.node;
```

**Load sprite for dynamic UI:**
```typescript
const frame = await AssetsManager.instance.loadSprite("sprites/avatars/hero");
this.avatarSprite.spriteFrame = frame;
```

**Release on scene exit to free memory:**
```typescript
onDestroy(): void {
    AssetsManager.instance.releaseAll();
}
```

## AssetsManager vs Direct resources.load()

| | `AssetsManager` | `resources.load()` direct |
|---|---|---|
| Cache | Yes — reuses asset | No — loads again |
| Dedup | Yes — shared promise | No — parallel loads |
| Type safety | Typed generics | Typed generics |
| Use case | All runtime loads | Avoid — use AssetsManager |

## Memory Management for <5MB Budget

- Call `releaseAll()` on scene/level transitions
- Use `getCacheSize()` to monitor cached count during development
- Prefer `loadDir()` for icon sheets — one call, all frames cached
- AudioClips are the largest single-asset risk; `releaseAsset()` per clip after playback if one-shot

## Common Mistakes

- Passing `"audio/BGM"` to `loadAudio()` — results in path `"audio/audio/BGM"` (not found)
- Not awaiting `loadResource()` before accessing the asset — returns unresolved Promise
- Calling `releaseAll()` while assets are still referenced by active nodes — Cocos ref-counts drop to 0 and GC destroys them mid-use
- Using `loadAsync()` (legacy) for new prefabs — path is hardcoded to `prefab/UI/` prefix

## Gotchas

- **Bundle remote URLs require crossOrigin headers** — silent CORS fails on iOS Safari (in-app webview).
- **Atlas packing strategy affects load order** — a single 10MB atlas blocks first frame; split sub-atlases per scene.
- **Asset GC is not deterministic** — call `Asset.decRef` explicitly when releasing dynamic loads.
