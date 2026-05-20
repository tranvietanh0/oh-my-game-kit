---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Code Structure — {{GAME_NAME}}

**Source:** {{SANITIZED_URL}}
**Analyzed:** {{ISO_DATE}}
**Slug:** `{{SLUG}}`

## Engine

- **Engine:** {{ENGINE_NAME}} (e.g. `Cocos Creator 3.8.x`, `CreateJS / EaselJS`, `Pixi.js 6`)
- **Version evidence:** {{exact regex hits — file:line if useful}}
- **Confidence:** {{high | med | low}}
- **Runtime size:** {{N}} KB (engine boilerplate, subtracted from game-specific budget below)

## Bundle breakdown

| Type | Count | Bytes | % of total |
|---|---|---|---|
| HTML (root) | 1 | {{N}} | {{P}}% |
| JS (inline) | {{N}} | {{N}} | {{P}}% |
| JS (external) | {{N}} | {{N}} | {{P}}% |
| Images | {{N}} | {{N}} | {{P}}% |
| Audio | {{N}} | {{N}} | {{P}}% |
| JSON / data | {{N}} | {{N}} | {{P}}% |
| Other | {{N}} | {{N}} | {{P}}% |
| **Total** | | **{{N}}** | 100% |

**Total bundle size:** {{TOTAL_MB}} MB. **Game-specific code (excluding engine runtime):** {{N}} KB.

## Entry point

- File: `scripts/{{ENTRY_FILE}}`
- Bootstrap pattern: {{e.g. `cc.assetManager.loadBundle('main', ...)` / `new createjs.Stage('canvas')`}}
- First scene/state: {{NAME}}

## Module / file inventory

| File | Purpose (inferred) | LoC (beautified) |
|---|---|---|
| `scripts/{{a}}.beautified.js` | {{one sentence}} | {{N}} |
| `scripts/{{b}}.beautified.js` | {{one sentence}} | {{N}} |
| {{...}} | | |

## Event flow

Sequence-style bullets describing the observable runtime flow:

1. `BootService` → loads inline JSON config
2. `AssetLoader` → decodes base64 sprites/audio
3. `GameStateMachine` → enters `boot` → emits `assets_ready`
4. {{...}}

## Asset-loader strategy

{{e.g. "All assets inlined as base64 in `inline-2.js`. Loader decodes on `gameReady` via 23 calls to `decodeURIComponent + atob`. No CDN fetch."}}

## Obfuscation level

{{none | light | heavy | extreme}}

- Identifier style: {{e.g. "single-letter t/e/n vars in 80%+ of functions; class names preserved"}}
- String literals: {{readable | encoded | string-array}}
- Control flow: {{normal | flattened | virtualized}}

## Architecture pattern (inferred)

Describe how the game is structured at a high level:

- **State machine:** {{yes — `state` enum with N values | no, monolithic update loop}}
- **Event bus / signals:** {{e.g. "createjs EventDispatcher pattern; 12 distinct event names"}}
- **Service singletons:** {{list inferred singletons}}
- **Object pooling:** {{yes | no — evidence}}
- **UI architecture:** {{e.g. "DOM overlay on canvas / pure Stage children / Canvas + uGUI-like"}}

## Partial bundle / gaps

If `manifest.json` contains `gaps`, list them here:

- `{{url}}` — `{{reason}}` (e.g. `http-404` for `mraid.js` is normal — host injects at runtime)

## Confidence + Caveats

**Overall confidence:** {{high | med | low}}

**Reason:** {{one sentence}}

**Verifiable claims:** {{bulleted list}}

**Inferred claims:** {{bulleted list}}

**Obfuscation level:** {{none | light | heavy | extreme}}

**Unverifiable:** {{...}}
