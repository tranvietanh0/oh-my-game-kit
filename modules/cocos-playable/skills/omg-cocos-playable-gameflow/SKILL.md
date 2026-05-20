---
name: omg-cocos-playable-gameflow
description: "Cocos Creator 3.8.7 playable ads game flow, UI views, loading, end cards, CTA integration, and audio. Manage game states and view lifecycle."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Cocos Playable Game Flow

This skill handles game states, views, loading screens, end cards, and CTA integration. Does NOT handle parameter definitions (use `omg-cocos-playable-parameter`) or SDK adapters (use `omg-cocos-playable-sdk-core`).

## Game State Machine

```
LOADING -> FTUE -> GAMEPLAY -> WIN / LOSE
```

```typescript
export enum GameState { LOADING, FTUE, GAMEPLAY, WIN, LOSE }
```

## Core Components

- **GameView** (singleton) -- State machine. `onWin()`, `onLose()`, `onTutorialComplete()`
- **LoadingView** -- Progress bar, waits for `AllAsyncParametersReadySignal`. Bound via `LoadingScreenParameter` (replaces old scattered `LoadingBackgroundColor` + `LoadingIcon` + `LoadingGameName` params).
- **EndCardView** (abstract) -- Base for end cards, plays audio, triggers CTA. Exposes `backgroundSprite`, `titleLabel`, `subtitleLabel` for `ParameterBinder.bindEndCard()`.
- **WinView / LoseView** -- Extend EndCardView, provide audio name. Bound via `EndCardParameter` (replaces old `EndCardWinCTA` / `EndCardLoseCTA` params).
- **CTAService** -- Routes CTA click to correct store per SDK
- **PlayableHelper** -- First touch -> BGM, optional redirect-after-N-clicks

## Composite Parameter Binding for Views

`EndCardParameter` and `LoadingScreenParameter` are composite types that bundle all view fields into one dashboard group. Use `ParameterBinder` to apply them:

```typescript
// In ParameterController.SetUpOnUpdate():
PlayableConfig.EndCardWin.onUpdate = (config) => {
    const p = ParameterBinder.bindEndCard(this.winView, config);
    if (p) this._spriteUpdatePromises.push(p);
};

PlayableConfig.LoadingScreen.onUpdate = (config) => {
    const p = ParameterBinder.bindLoadingScreen(this.loadingView, config);
    if (p) this._spriteUpdatePromises.push(p);
};
```

See `omg-cocos-playable-parameter` skill for composite type definitions and migration guide.

## Workflow: Adding a New View/State

1. **Create** component extending `Component` in `assets/scripts/UI/`
2. **Add @property(Node)** reference in `GameView.ts`
3. **Hide** in `GameView.hideAllViews()`
4. **Add transition** method (e.g., `onMyState()`) setting `currentState` + activating view
5. **Wire parameters** if needed (use `omg-cocos-playable-parameter` skill)
6. **Assign** in Cocos Editor Inspector

## Signal Flow

```
ParametersReadySignal         -- sync params ready
AllAsyncParametersReadySignal -- async params loaded (LoadingView waits for this)
FirstInteractionSignal        -- user first touch (InputService)
TapSignal / SwipeSignal       -- user input events
```

## Import Convention

Always use `db://` protocol for cross-submodule imports:
```typescript
import { SignalBus } from "db://assets/PLAGameFoundation/signalBus/SignalBus";
import { AudioService } from "db://assets/PLAGameFoundation/gameControl/utilities/AudioSystem/AudioService";
import { SdkType } from "db://assets/PlayableParamterTool/GameConfig";
import { GameView } from "db://assets/scripts/UI/GameView";
```

## Audio Integration

```typescript
AudioService.instance.playMusic(Constant.AUDIO_NAME.BGM);
AudioService.instance.playSFX(Constant.AUDIO_NAME.WIN);
```

Audio files in `resources/audio/`. Register names in `constant.ts` -> `AUDIO_NAME`.

## Store Links & CTA

```typescript
// constant.ts: STORE_LINK = { ANDROID_LINK, IOS_LINK }
// CTAService routes per SDK: THE_ONE -> gameEndHandler, VOODOO -> ParameterManager.redirect()
```

## Code Examples

See `references/gameflow-code-examples.md` for complete implementation patterns.

## Gotchas

- **GameView lifecycle owns the FSM, not vice versa** — destroying GameView while FSM holds a reference dangles the state's `this`.
- **Scene transitions during state.enter() are a footgun** — the next state runs onLoad against an unmounted parent.
