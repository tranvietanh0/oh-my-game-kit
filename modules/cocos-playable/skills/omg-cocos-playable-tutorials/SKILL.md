---
name: omg-cocos-playable-tutorials
description: "FingerTutorial, ArrowHint, and TutorialSequence Components for step-by-step animated tutorial hints in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# FingerTutorial, ArrowHint & TutorialSequence

Three Cocos Components for guiding the player through the FTUE. `FingerTutorial` shows an animated finger sprite for tap/drag/hold gestures. `ArrowHint` shows a pulsing arrow that tracks a moving target. `TutorialSequence` orchestrates both into step-by-step flows and fires `TutorialCompleteSignal` via SignalBus. See also: `omg-cocos-playable-signalbus`, `omg-cocos-playable-gameflow`, `omg-cocos-playable-animation-presets`.

## Composite Parameter Integration

See `references/tutorial-patterns.md` for composite parameter details (TutorialHandParameter, RichTextParameter).

Import paths:
- `db://assets/PLAGameFoundation/tutorials/FingerTutorial`
- `db://assets/PLAGameFoundation/tutorials/ArrowHint`
- `db://assets/PLAGameFoundation/tutorials/TutorialSequence`

## FingerTutorial Component

Attach to the finger sprite node. Set `targetNode` (and `dragTargetNode` for DRAG) in Inspector or at runtime.

### Inspector Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `targetNode` | Node | null | Node to point the finger at |
| `dragTargetNode` | Node | null | Drag endpoint (DRAG action only) |
| `action` | FingerAction | TAP | Animation style |
| `loopDelay` | number | 0.5 | Seconds between animation loops |
| `autoStart` | boolean | true | Call `show()` automatically in `start()` |

### FingerAction enum

```typescript
export enum FingerAction { TAP = 0, DRAG = 1, HOLD = 2 }
```

### Public API

```typescript
finger.show();                 // fade in and begin looping animation
finger.hide();                 // fade out and deactivate node
finger.setTarget(node: Node);  // change targetNode at runtime
finger.dragTargetNode = node;  // set drag endpoint at runtime
finger.action = FingerAction.DRAG;
```

The node starts with `active = false` and `UIOpacity = 0`. `show()` sets `active = true` and fades in.

## ArrowHint Component

Attach to the arrow sprite node. The arrow repositions itself every `update()` to track a moving `targetNode`.

### Inspector Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `targetNode` | Node | null | Node to point at |
| `pulseScale` | number | 0.2 | Amplitude of scale pulse (e.g. 0.2 = scales between 0.8 and 1.2) |
| `pulseSpeed` | number | 1.0 | Seconds per full pulse cycle |
| `autoStart` | boolean | true | Call `show()` automatically in `start()` |
| `offset` | Vec3 | (0,50,0) | Offset from target in local parent space |

### Public API

```typescript
arrow.show();
arrow.hide();
arrow.setTarget(node: Node);
arrow.offset = new Vec3(0, 80, 0);  // adjust offset at runtime
```

## TutorialSequence Component

Orchestrates `FingerTutorial` and `ArrowHint` through a series of steps. Wire `fingerNode` and `arrowNode` in the Inspector.

### Inspector Properties

| Property | Type | Description |
|---|---|---|
| `fingerNode` | Node | Node carrying a `FingerTutorial` component |
| `arrowNode` | Node | Node carrying an `ArrowHint` component |

### TutorialStepConfig Interface

```typescript
interface TutorialStepConfig {
    finger?: { target: Node; action?: FingerAction; dragTarget?: Node };
    arrow?:  { target: Node; offset?: Vec3 };
    text?:   string;                  // reserved for future label support
    condition?: () => boolean;        // auto-advance when returns true
    duration?: number;                // auto-advance after N seconds
}
```

### Public API

```typescript
seq.setSteps(steps: TutorialStepConfig[]): void;
seq.begin(): void;       // show step 0 and start the sequence
seq.nextStep(): void;    // manually advance to next step
seq.skip(): void;        // hide everything and fire TutorialCompleteSignal
```

### TutorialCompleteSignal

```typescript
export class TutorialCompleteSignal {
    constructor(public readonly sequenceNode: Node = null) {}
}
```

Fired by SignalBus when the last step completes or `skip()` is called.

## Usage Examples

See `references/tutorial-patterns.md` for complete usage patterns.

## Integration Points

- `TutorialSequence` uses `SignalBus.instance.fire(new TutorialCompleteSignal(...))` — subscribe in `GameView` or the FTUE state to advance game flow.
- `FingerTutorial` positions itself in its parent's local space by converting `targetNode.worldPosition` — both nodes must share a common Canvas ancestor.
- Disable `autoStart` on `FingerTutorial` and `ArrowHint` when using `TutorialSequence` to prevent them from starting before `begin()` is called.
- Clean up subscriptions to `TutorialCompleteSignal` in `onDestroy`.

## Common Mistakes

- Setting `autoStart = true` on `FingerTutorial`/`ArrowHint` when also using `TutorialSequence` — they will start independently before `begin()` is called.
- Forgetting to set `dragTargetNode` when using `FingerAction.DRAG` — it silently falls back to the TAP animation.
- Not subscribing to `TutorialCompleteSignal` before calling `begin()` — if the sequence is short (duration-based), the signal may fire before the subscription is registered. Subscribe first, then call `begin()`.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Tutorials in playable ads have a 5-second budget** — past that, networks penalize CTR.
- **Skip-tutorial state must persist for the session** — replaying tutorial on every retry kills funnel.
- **Highlight rectangles need to update when their target moves** — static cutout windows lag a frame behind on scroll/animate.
