---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Engine Fingerprints

Regex catalog for detecting the engine inside beautified playable-ad JS. Used by `omg-cocos-playable-extractor` Step 1.

## Scoring rules

- A "hit" = one regex match. Count distinct lines, not raw match count (avoids one keyword inflating the score).
- An "unambiguous" hit = regex tagged `strong: true`. Three of those = `high` confidence.
- Two engines can co-exist (e.g. CreateJS host + custom game code). Report both; pick the dominant by `gameLogicHits`.

## Engines

### Cocos Creator 3.x

| Regex | Strong | Notes |
|---|---|---|
| `cc\.Class\(` | yes | core class factory |
| `cc\.assetManager\.` | yes | 3.x asset API |
| `cc\.director\.runSceneImmediate` | yes | 3.x bootstrap |
| `@ccclass\(` | yes | TS decorator |
| `cc\.Component\.prototype` | no | shared with 2.x |
| `cc\.game\.run\(` | no | shared |
| `_decorator` | yes | 3.x decorator import |

**Engine-runtime files:** any `*.beautified.js` containing `cc.engine.version` definition OR file size > 1.5 MB AND `cc\.` hit-count > 200.

### Cocos Creator 2.x

| Regex | Strong | Notes |
|---|---|---|
| `cc\.loader\.` | yes | 2.x asset API (replaced in 3.x) |
| `cc\.Class\(\{` | yes | 2.x extend pattern (object literal) |
| `cc\.director\.runScene` | yes | 2.x bootstrap |
| `cc\.find\(` | no | shared |

### Pixi.js 6+

| Regex | Strong | Notes |
|---|---|---|
| `PIXI\.Application` | yes | v6/v7 entry |
| `PIXI\.Container` | yes | core |
| `PIXI\.Sprite\.from` | yes | factory |
| `new PIXI\.` | no | catch-all |
| `pixi\.js` | no | filename ref |

### PlayCanvas

| Regex | Strong | Notes |
|---|---|---|
| `pc\.Application` | yes | entry |
| `pc\.createScript` | yes | script |
| `pc\.Entity` | yes | entity |
| `pc\.app\.` | yes | runtime |

### CreateJS / EaselJS / TweenJS

| Regex | Strong | Notes |
|---|---|---|
| `createjs\.Stage` | yes | EaselJS entry |
| `createjs\.Tween\.get` | yes | TweenJS |
| `createjs\.MovieClip` | yes | Flash-export pattern |
| `createjs\.Ticker` | yes | render loop |
| `easeljs` | no | string in comments |
| `tweenjs` | no | string in comments |
| `\bnew Stage\(` | no | requires createjs ns confirm |

**Engine-runtime files:** typical CDN bundle is `easel.min.js` (~250 KB) + `tween.min.js` (~50 KB) + `preload.min.js` (~30 KB) + `sound.min.js` (~80 KB), often merged into one ~600 KB blob.

### Phaser 3

| Regex | Strong | Notes |
|---|---|---|
| `Phaser\.Game` | yes | entry |
| `Phaser\.Scene` | yes | scene class |
| `phaser\.min\.js` | no | filename |
| `this\.scene\.start\(` | no | common pattern |

### Three.js

| Regex | Strong | Notes |
|---|---|---|
| `THREE\.Scene` | yes | 3D scene |
| `THREE\.WebGLRenderer` | yes | renderer |
| `THREE\.PerspectiveCamera` | yes | camera |

### Godot HTML5

| Regex | Strong | Notes |
|---|---|---|
| `Godot\.engine` | yes | runtime |
| `godot\.wasm` | yes | binary ref |

### Custom / unidentified

Fallback when no engine scores ≥ 3 strong hits across all JS files. Note `obfuscation` level — if `heavy` or `extreme`, identifiers are unrecoverable and engine may be hidden behind a minifier.

## Engine-runtime skip patterns

For each detected engine, the analyzer should skip the runtime when summarizing game logic — these strings indicate library code, not game code:

| Engine | Skip if file contains |
|---|---|
| Cocos 3.x | `cc.engine.version`, `legacyCC`, the boilerplate sym table `module.exports.cc=cc` |
| Cocos 2.x | `cc._engineLoaded`, `_polyfills` |
| Pixi | `PIXI.VERSION`, `pixi.js source` license header |
| PlayCanvas | `pc.VERSION`, `pc.REVISION` |
| CreateJS | `createjs.PreloadJS`, `createjs.EaselJS`, `createjs.TweenJS` version blocks |
| Phaser | `Phaser.VERSION`, `Phaser.CHECKSUM` |

## Disambiguation rules

- **CreateJS false-positive trap:** `createjs.Tween.get` and `tween.js` are widely reused as standalone animation libs inside non-CreateJS bundles (e.g. Three.js apps for 2D UI tweens). To classify a bundle as CreateJS-host, require **at least one** of: `createjs.Stage`, `createjs.MovieClip`, or `createjs.Ticker` — NOT TweenJS alone. If only TweenJS hits and a stronger engine (Three.js, Pixi, Cocos) also hits, classify as the stronger engine and list TweenJS as "utility lib."
- **Multi-engine bundles are common:** modern 3D playables often combine Three.js (rendering) + Cannon.js / Ammo.js (physics) + Pixi.js (2D HUD overlay) + Howler.js (audio) + TweenJS (tweens). Report the full stack in `code-structure.md`, with the rendering engine as primary.

## Empirical notes (2026-05-14)

- Sample bundle `35bacb11...html` (Sled Surfers, Mintegral): initially mis-detected as CreateJS (only 7 TweenJS hits in `inline-2`). On deeper inspection the real stack is **Three.js (rendering) + Cannon.js (physics) + Pixi.js (HUD) + Howler.js (audio) + TweenJS (utility tweens) + FBXLoader (model loading)**. Lesson: enforce the disambiguation rule above.
- The ad-network glue (`inline-3`) declared `window.network = 'unity'` despite Mintegral CDN — this is normal for cross-network creative reuse. The `window.network` value is therefore unreliable for ad-network identification; rely on the CDN hostname instead.
- Bundle is single-file inline (3.2 MB HTML, no external assets); `mraid.js` 404 in manifest gaps is expected (host injects MRAID at runtime).
