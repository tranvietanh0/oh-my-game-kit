---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Scaling Formulas & Usage Examples

## ScalingCurve Details

```typescript
export enum ScalingCurve {
    LINEAR      = 0,  // t = level / maxLevel
    EXPONENTIAL = 1,  // t = (level / maxLevel)^2  — slow start, fast ramp
    STEPPED     = 2,  // 5 equal tiers, value advances at each tier boundary
}
```

### Formula

```
scale():        baseValue + (maxValue - baseValue) * t
scaleInverse(): baseValue - (baseValue - minValue) * t
```

- `LINEAR`: even progression from base to max
- `EXPONENTIAL`: slow early levels, fast increase near max
- `STEPPED`: 5 discrete tiers (level 1-2, 3-4, 5-6, 7-8, 9-10 for maxLevel=10)

## Usage Examples

**Start/complete level flow:**
```typescript
import { ProgressionManager, LevelCompleteSignal } from "db://assets/PLAGameFoundation/progression/ProgressionManager";
import { SignalBus } from "db://assets/PLAGameFoundation/signalBus/SignalBus";

// Subscribe in onLoad
SignalBus.instance.on(LevelCompleteSignal, (sig) => {
    if (sig.level >= ProgressionManager.maxLevel) {
        GameView.instance.changeState(WinState);
    } else {
        this.loadNextRound();
    }
}, this);

// Start first level
ProgressionManager.startLevel();

// On win condition
ProgressionManager.completeLevel();
```

**Scale enemy speed with level (increasing):**
```typescript
import { DifficultyScaler, ScalingCurve } from "db://assets/PLAGameFoundation/progression/DifficultyScaler";

const speed = DifficultyScaler.scale({
    baseValue: 100,
    maxValue: 300,
    curve: ScalingCurve.EXPONENTIAL
});
this.enemy.setSpeed(speed);
```

**Scale spawn interval (decreasing):**
```typescript
const interval = DifficultyScaler.scaleInverse({
    baseValue: 2.0,
    minValue: 0.5,
    curve: ScalingCurve.LINEAR
});
this.scheduleSpawn(interval);
```

**Override level for preview/testing:**
```typescript
const previewSpeed = DifficultyScaler.scale({
    baseValue: 100,
    maxValue: 300,
    level: 5,
    maxLevel: 10
});
```
