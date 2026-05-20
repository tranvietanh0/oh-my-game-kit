---
name: omg-cocos-playable-sdk-core
description: "Cocos Creator 3.8.7 playable ads SDK abstraction layer. Integrate ad network SDKs (TheOne, Voodoo), handle postMessage parameter updates, and CTA routing."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Cocos Playable SDK Abstraction

This skill handles SDK integration, adapter creation, and CTA routing for playable ads. Does NOT handle parameter definitions (use `omg-cocos-playable-parameter`) or game flow (use `omg-cocos-playable-gameflow`).

## Architecture

```
Ad Dashboard -> postMessage -> window.mainPlayable.onParameterUpdated()
  -> BaseSdkAdapter hooks intercept -> fireParameterUpdate() to listeners
  -> PlayableParameterUpdates syncs to PlayableConfig -> onUpdate callbacks
```

SDK selection: `CURRENT_SDK` constant in `PlayableConfig.ts` -- set at build time.

## SDK Types

```typescript
// assets/PlayableParamterTool/GameConfig.ts
export enum SdkType { VOODOO = 'voodoo', THE_ONE = 'theone' }
```

## Core Classes

- **BaseSdkAdapter** (abstract) -- Window object hooks, parameter listener pub/sub, polling init
- **SdkFactory** -- Creates adapter + registers window objects by SDK type
- **CTAService** -- Routes CTA clicks: THE_ONE -> `gameEndHandler`, VOODOO -> `ParameterManager.redirect()`

## Workflow: Adding a New SDK

1. **Add enum** value in `GameConfig.ts` -> `SdkType`
2. **Create adapter** class extending `BaseSdkAdapter` (singleton pattern)
3. **Implement** `getWindowPlayableName()` and `getWindowSdkName()`
4. **Register** in `SdkFactory.createSdk()` and `getSdkInstance()` switch cases
5. **Update CTAService** with SDK-specific redirect logic
6. **Set** `CURRENT_SDK` in `PlayableConfig.ts`

## Parameter Update Flow

1. Dashboard edits param -> sends `postMessage`
2. SDK sets `window.mainPlayable.onParameterUpdated(params)`
3. BaseSdkAdapter hook intercepts, calls original + fires to listeners
4. PlayableParameterUpdates (listener) syncs values to PlayableConfig
5. Each parameter's `onUpdate` callback fires
6. ParameterUtils applies changes to scene nodes
7. Sync done: `ParametersReadySignal`
8. Async done (sprites, audio): `AllAsyncParametersReadySignal`

## SDK Interfaces

**Playable** (from dashboard): `create()`, `init()`, `start()`, `pause()`, `resume()`, `onResize()`, `onParameterUpdated(params)`, `onAudioVolumeChanged()`, `onParameterHighlighted(params)`

**PlayableMainSdk** (our API): `getAudioVolume()`, `getParameterValue(key)`, `getScreenSize()`, `win()`, `lose()`, `getUserLanguage()`, `redirectToInstallPage()`

## Code Examples

See `references/sdk-code-examples.md` for adapter implementation patterns.

## Gotchas

- **Per-network SDK quirks** — AppLovin auto-resizes the canvas; AdMob doesn't; Meta freezes mid-frame on init. Pin per-network behavior in a network-specific build flag.
- **The hosting iframe rules** — `window.top` is unreachable; storage is per-iframe; user gesture requirements differ per network.
