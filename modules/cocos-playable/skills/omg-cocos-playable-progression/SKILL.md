---
name: omg-cocos-playable-progression
description: "ProgressionManager static level tracker and DifficultyScaler static helper for level-based parameter scaling in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# ProgressionManager & DifficultyScaler

Two static utility classes for level/round flow. `ProgressionManager` tracks the current level and fires lifecycle signals. `DifficultyScaler` computes parameter values that scale with level using LINEAR, EXPONENTIAL, or STEPPED curves. See also: `omg-cocos-playable-signalbus`, `omg-cocos-playable-score`.

Import paths:
- `db://assets/PLAGameFoundation/progression/ProgressionManager`
- `db://assets/PLAGameFoundation/progression/DifficultyScaler`

## ProgressionManager API (static)

### Signals

```typescript
export class LevelStartSignal {
    constructor(public level: number) {}
}

export class LevelCompleteSignal {
    constructor(public level: number) {}
}

export class LevelFailSignal {
    constructor(public level: number) {}
}
```

### Properties (read-only)

```typescript
ProgressionManager.currentLevel    // current level number (starts at 1)
ProgressionManager.maxLevel        // maximum level cap (default 10)
ProgressionManager.isLevelActive   // true between startLevel and complete/fail
```

### Methods

```typescript
ProgressionManager.startLevel(level?: number): void
// Sets _isLevelActive = true. Optionally overrides current level. Fires LevelStartSignal.

ProgressionManager.completeLevel(): void
// Sets _isLevelActive = false. Advances currentLevel (capped at maxLevel). Fires LevelCompleteSignal.

ProgressionManager.failLevel(): void
// Sets _isLevelActive = false. Does NOT advance level. Fires LevelFailSignal.

ProgressionManager.reset(): void
// Resets currentLevel to 1, _isLevelActive = false.

ProgressionManager.setMaxLevel(max: number): void
// Override the level cap. Minimum 1.
```

## DifficultyScaler API (static)

### ScalingCurve enum

`LINEAR` (t = level/maxLevel), `EXPONENTIAL` (t = (level/maxLevel)^2, slow start then fast ramp), `STEPPED` (5 equal tiers). See `references/scaling-formulas.md` for details.

### Methods

```typescript
DifficultyScaler.scale(options: {
    baseValue: number;    // value at level 1
    maxValue: number;     // value at maxLevel
    level?: number;       // defaults to ProgressionManager.currentLevel
    maxLevel?: number;    // defaults to ProgressionManager.maxLevel
    curve?: ScalingCurve; // defaults to LINEAR
}): number
// Returns baseValue + (maxValue - baseValue) * t
// Use for values that INCREASE with level: speed, spawn count, etc.

DifficultyScaler.scaleInverse(options: {
    baseValue: number;    // value at level 1
    minValue: number;     // value at maxLevel
    level?: number;
    maxLevel?: number;
    curve?: ScalingCurve;
}): number
// Returns baseValue - (baseValue - minValue) * t
// Use for values that DECREASE with level: timer duration, spawn interval, etc.
```

## Usage Examples

See `references/scaling-formulas.md` for complete usage examples and scaling formula details.

## Integration Points

- Both classes depend on `SignalBus.instance` — ensure SignalBus is initialized before first use (it initializes on `getInstance()` call, which is safe).
- `ProgressionManager.reset()` should be called alongside `ScoreTracker.reset()` when restarting.
- `DifficultyScaler` reads `ProgressionManager.currentLevel` and `ProgressionManager.maxLevel` by default — call `ProgressionManager.startLevel()` before using `DifficultyScaler` so the level is set correctly.
- Use `LevelStartSignal` to re-apply `DifficultyScaler` values each round (enemy speed, spawn counts, etc.).

## Common Mistakes

- Calling `DifficultyScaler.scale()` before `ProgressionManager.startLevel()` — `currentLevel` defaults to 1 and `maxLevel` to 10, so values will reflect level 1 rather than the intended level.
- Not unsubscribing `LevelStartSignal`/`LevelCompleteSignal`/`LevelFailSignal` in `onDestroy` — stale callbacks fire after the subscribing node is destroyed.
- Calling `completeLevel()` and `failLevel()` in the same frame — `_isLevelActive` is cleared by whichever runs first; the second signal will still fire but `isLevelActive` is already false.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Progress savepoints in playable ads are session-only** — never expect persistence; treat `localStorage` as opt-in fallback for bundle previews.
- **Skip events invalidate progression state** — handle a skip event arriving mid-progression without a stale-state lock.
