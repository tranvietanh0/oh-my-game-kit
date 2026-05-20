---
name: omg-cocos-playable-animation-presets
description: "AnimationPresetPlayer static class, preset catalog (20 presets), custom preset registration, and AnimationPresetParameter configuration for Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Animation Preset System

Static `AnimationPresetPlayer` class for running named animation presets on Cocos nodes. Presets are driven by `AnimationPresetConfig` (part of composite parameter types). Delegates to `JuiceKit` internally for tween execution. See also: `omg-cocos-playable-juice`, `omg-cocos-playable-parameter`.

Import paths:
- `db://assets/PLAGameFoundation/animations/AnimationPresetPlayer`
- `db://assets/PLAGameFoundation/animations/AnimationPresetValues` (enum + config)

## AnimationPresetPlayer API

Static class — no instantiation.

```typescript
// Play a preset on a node
AnimationPresetPlayer.play(node: Node, config: AnimationPresetConfig): void;

// Stop any running preset on a node
AnimationPresetPlayer.stop(node: Node): void;

// Register a custom preset factory at project level
AnimationPresetPlayer.registerCustomPreset(name: string, factory: PresetFactory): void;
```

`PresetFactory` signature: `(node: Node, config: AnimationPresetConfig) => void`

## AnimationPresetConfig Interface

```typescript
interface AnimationPresetConfig {
    preset: AnimationPreset;   // which preset to run
    speed: number;             // duration multiplier (0.5 = twice as fast), default 1.0
    delay: number;             // seconds before starting, default 0
    loop: boolean;             // repeat after completion, default false
    loopInterval: number;      // seconds between loops, default 0.5
}
```

## Available Presets

20 built-in presets across 4 categories (General, Tutorial, Rich Text, End Card).
See `references/preset-catalog.md` for the full preset catalog with descriptions.

## Speed / Delay / Loop Tuning

- **speed**: multiplies base duration. `speed: 2` = half the time. `speed: 0.5` = double the time.
- **delay**: adds `AsyncTask.Delay(delay)` before playback starts.
- **loop: true** + **loopInterval**: after preset completes, waits `loopInterval` seconds then replays. Useful for tutorial hand presets.

## JuiceKit Integration

Presets like `FADE_IN/OUT`, `SCALE_IN/OUT`, `BOUNCE`, `BOUNCE_IN`, `PULSE`, `TAP` delegate to `JuiceKit` static methods. Non-JuiceKit presets use raw Cocos `tween()`. See `references/preset-catalog.md` for full mapping.

## Custom Preset Registration

Register at app startup (e.g., in `GameView.onLoad`):

```typescript
import { AnimationPresetPlayer } from "db://assets/PLAGameFoundation/animations/AnimationPresetPlayer";

AnimationPresetPlayer.registerCustomPreset("spin", (node, config) => {
    tween(node)
        .by(1.0 / config.speed, { eulerAngles: new Vec3(0, 0, 360) }, { easing: "linear" })
        .start();
});
```

Use the custom name as string in `AnimationPresetConfig.preset` (cast to `AnimationPreset` or use string union).

## Integration with AnimationPresetParameter

`AnimationPresetConfig` is embedded in composite parameter types:

```typescript
// TutorialHandParameter exposes:
config.animation: AnimationPresetConfig  // controls the hand animation loop

// RichTextParameter exposes:
config.entrance: AnimationPresetConfig   // plays when text appears
config.exit: AnimationPresetConfig       // plays before text hides
```

## ParameterBinder Integration

`ParameterBinder` automatically wires `AnimationPresetPlayer` calls — **do not call `AnimationPresetPlayer.play()` manually** when using the binder.

| Binder Method | Animation Behavior |
|---------------|--------------------|
| `.tutorialHand(config, getTarget)` | Calls `AnimationPresetPlayer.play(node, config.animation)` after sprite resolves |
| `.richText(config, getTarget)` | Calls `AnimationPresetPlayer.play(node, config.entrance)` immediately; schedules `AnimationPresetPlayer.play(node, config.exit)` after `config.autoHideDelay` seconds |
| `.endCard(config, getView)` | Calls `AnimationPresetPlayer.play(view.node, entranceAnimation)` after end card params are applied |

Example — this is all you need in `ParameterController.SetUpOnUpdate()`:

```typescript
this.binder
    .tutorialHand(PlayableConfig.HandTut, () => this.handSprite)   // animation auto-plays
    .richText(PlayableConfig.TutText, () => this.tutLabel)         // entrance + exit auto-play
    .endCard(PlayableConfig.EndCardWin, () => this.winView);       // entrance auto-plays
```

You only call `AnimationPresetPlayer` directly for **non-parameter-driven** animations (e.g., in-game juice effects). For parameter-driven presets, always go through `ParameterBinder`.

## Common Mistakes

- Passing `speed: 0` causes division by zero in duration calculation — use `speed: 0.01` minimum.
- `loop: true` without stopping on `onDestroy` leaks tween references — call `AnimationPresetPlayer.stop(node)` in cleanup.
- `TYPEWRITER` preset requires a `Label` component on the node — crashes silently on `Sprite` nodes.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Tween easing string mismatches silently fall back to linear** — typo `easeInOut` vs `easeInOutQuad` is common.
- **Repeat count ∞ requires explicit `forever()`** — using a large integer leaks memory through the tween action chain.
