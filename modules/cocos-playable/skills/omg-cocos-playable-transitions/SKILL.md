---
name: omg-cocos-playable-transitions
description: "TransitionKit static helper for screen transitions (fade, slide, scale, curtain) between game states in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# TransitionKit

Static helper for full-screen transitions between game states. Each method creates a temporary overlay node on the Canvas, fires `onMidpoint` when the screen is fully covered, then destroys the overlay after the transition completes. No Component, no singleton, no setup required.

Import paths:
- `db://assets/PLAGameFoundation/transitions/TransitionKit`

## API Reference

All methods are fire-and-forget. The overlay nodes are created and destroyed internally.

### `TransitionKit.fade(options)`

```typescript
TransitionKit.fade({
    color?: Color;      // overlay color, default: black
    duration?: number;  // total seconds, default: 0.4
    onMidpoint?: () => void;  // fired when screen fully covered
});
```

Fades to solid color, fires `onMidpoint`, then fades back out.

### `TransitionKit.slide(options)`

```typescript
TransitionKit.slide({
    direction?: 'left' | 'right' | 'up' | 'down';  // default: 'left'
    duration?: number;    // total seconds, default: 0.4
    onMidpoint?: () => void;
});
```

Slides a black curtain in from the given direction, fires `onMidpoint`, then slides it back out in the opposite direction.

### `TransitionKit.scale(options)`

```typescript
TransitionKit.scale({
    duration?: number;    // total seconds, default: 0.4
    onMidpoint?: () => void;
});
```

Scales a black overlay from center outward to cover screen, fires `onMidpoint`, then scales back in.

### `TransitionKit.curtain(options)`

```typescript
TransitionKit.curtain({
    color?: Color;        // curtain color, default: black
    duration?: number;    // total seconds, default: 0.4
    onMidpoint?: () => void;
});
```

Two curtains (top and bottom) close toward center, fires `onMidpoint` when they meet, then opens back out.

## Usage Examples

**Fade to win state:**
```typescript
import { TransitionKit } from "db://assets/PLAGameFoundation/transitions/TransitionKit";

TransitionKit.fade({
    duration: 0.5,
    onMidpoint: () => { GameView.instance.changeState(WinState); }
});
```

**Slide transition to next level:**
```typescript
TransitionKit.slide({
    direction: 'up',
    duration: 0.4,
    onMidpoint: () => { this.loadNextLevel(); }
});
```

**Curtain close on restart:**
```typescript
import { Color } from "cc";

TransitionKit.curtain({
    color: new Color(20, 20, 20, 255),
    duration: 0.6,
    onMidpoint: () => { ScoreTracker.reset(); ProgressionManager.reset(); }
});
```

**Scale transition:**
```typescript
TransitionKit.scale({
    onMidpoint: () => { this.resetScene(); }
});
```

## Integration Points

- Use `onMidpoint` to trigger state changes in `GameView.instance` — the screen is fully covered so the transition appears seamless.
- Combine with `JuiceKit.fadeIn` on the new UI elements after the `onMidpoint` fires to create a polished entry animation.
- Works alongside `ProgressionManager`: fire `ProgressionManager.completeLevel()` inside `onMidpoint` so the level change happens while the screen is covered.
- Overlay canvas size is read from the scene's `Canvas` component `UITransform` at call time; fallback is 1080x1920.

## Implementation Notes

- Overlay nodes are dynamically created as children of the scene's `Canvas` node using `director.getScene()`.
- Overlay drawing uses `Graphics.fillColor` + `rect()` + `fill()` so no sprite atlas reference is needed.
- `curtain` uses a guard flag (`midpointFired`) to ensure `onMidpoint` is called exactly once even though two tweens run in parallel.

## Common Mistakes

- Calling another transition before the first has finished — the first overlay node still exists. Transitions are not queued; chain them via `onMidpoint` callbacks if needed.
- Performing heavy scene work in `onMidpoint` that takes more than the remaining half-duration — the fade-out begins immediately after `onMidpoint` returns. Keep `onMidpoint` synchronous and fast.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Mid-transition input MUST be locked** — letting a player tap during a fade-out and fade-in races the next state's `enter()`.
- **Transition canvas must be on a top-most layer** — most transition glitches are the new scene rendering above the transition mask.
