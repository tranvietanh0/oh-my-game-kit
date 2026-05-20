---
name: omg-cocos-playable-score
description: "ScoreTracker static utility, CurrencyDisplay Component, and RewardCollector static helper for score, combo, and flying reward effects in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# ScoreTracker, CurrencyDisplay & RewardCollector

Three utilities for score/currency UI. `ScoreTracker` is a static class tracking score and combo with SignalBus events. `CurrencyDisplay` is a Cocos Component that animates a Label with a rolling number effect. `RewardCollector` is a static helper that spawns flying reward items from a source position to a target UI node. See also: `omg-cocos-playable-animation-core`, `omg-cocos-playable-object-pool`, `omg-cocos-playable-signalbus`.

Import paths:
- `db://assets/PLAGameFoundation/score/ScoreTracker`
- `db://assets/PLAGameFoundation/score/CurrencyDisplay`
- `db://assets/PLAGameFoundation/score/RewardCollector`

## ScoreTracker API (static)

### Signals

```typescript
export class ScoreChangedSignal {
    constructor(public score: number, public delta: number) {}
}

export class ComboSignal {
    constructor(public comboCount: number, public multiplier: number) {}
}
```

### Properties (read-only)

```typescript
ScoreTracker.score       // current total score
ScoreTracker.combo       // current combo count
ScoreTracker.multiplier  // 1 + combo * 0.1, capped at 3.0
```

### Methods

```typescript
ScoreTracker.addScore(points: number): void
// Applies multiplier, fires ScoreChangedSignal(newScore, effectiveDelta)

ScoreTracker.incrementCombo(): void
// Increments combo, resets combo timeout (default 2000ms), fires ComboSignal

ScoreTracker.reset(): void
// Resets score and combo to 0, clears combo timer

ScoreTracker.setComboTimeout(ms: number): void
// Override the window (ms) before combo resets after last increment
```

Multiplier formula: `min(3, 1 + combo * 0.1)` — combo of 20 reaches the 3x cap.

## CurrencyDisplay Component (Cocos Component)

Attach alongside a `Label` component. Animates the displayed number from current to target using ease-out quad.

### Inspector Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `label` | Label | null | The Label to update |
| `separator` | string | ',' | Thousands separator |
| `prefix` | string | '' | Text before the number (e.g. '$') |
| `suffix` | string | '' | Text after the number (e.g. ' pts') |
| `rollDuration` | number | 0.5 | Seconds to roll from old to new value |

### Methods

```typescript
display.setValue(value: number, animate: boolean = true): void
display.getValue(): number  // returns the target value
```

## RewardCollector API (static)

### RewardCollectOptions Interface

```typescript
interface RewardCollectOptions {
    prefab: Prefab;
    count: number;
    fromPosition: Vec3;       // world position of spawn
    targetNode: Node;         // UI node items fly toward
    parent: Node;             // parent node to add spawned items to
    delay?: number;           // stagger between items in seconds, default 0.05
    onEachArrive?: () => void;
    onAllComplete?: () => void;
}
```

### Method

```typescript
RewardCollector.collect(options: RewardCollectOptions): void
```

Uses `ObjectPoolManager` when a pool exists for `prefab.name`; falls back to `instantiate`. Attaches `FlyingAnimation` with `CURVE_TO_TARGET` type. Recycles (or destroys) each node when it arrives at `targetNode`.

## Usage Examples

See `references/reward-patterns.md` for complete usage examples (score tracking, coin collection, combo display).

## Integration Points

- `ScoreTracker` fires signals via `SignalBus.instance` — subscribe in UI Components and unsubscribe in `onDestroy`.
- `RewardCollector` depends on `FlyingAnimation` (from `omg-cocos-playable-animation-core`) and `ObjectPoolManager` (from `omg-cocos-playable-object-pool`). Pre-warm the pool via `ObjectPoolManager.instance.CreatePool(key, prefab, count)` before the first collect call for smooth playback.
- `CurrencyDisplay` works standalone with any Label — no SignalBus required. Wire it to `ScoreChangedSignal` manually.
- Call `ScoreTracker.reset()` in game restart logic (e.g. `ProgressionManager.reset()`).

## Common Mistakes

- Not calling `ScoreTracker.reset()` between play sessions — score and combo persist across the object's static lifetime.
- Forgetting to unsubscribe from `ScoreChangedSignal` / `ComboSignal` in `onDestroy` — causes callbacks to fire after the node is destroyed.
- Passing a `fromPosition` in local space instead of world space to `RewardCollector.collect` — `fromPosition` must be in world space.
- Setting `rollDuration = 0` on `CurrencyDisplay` and then calling `setValue` rapidly — values update instantly with no animation, which is correct but may not be the intended feel.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Score floats accumulate FP error** — for >100k tick games use integer-only math.
- **Score-driven UI update on every frame deopts** — throttle to 30fps or update on score-change events only.
