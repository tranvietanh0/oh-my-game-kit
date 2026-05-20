---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Reward Patterns — Usage Examples

## Score Tracking with CurrencyDisplay

```typescript
import { ScoreTracker, ScoreChangedSignal } from "db://assets/PLAGameFoundation/score/ScoreTracker";
import { SignalBus } from "db://assets/PLAGameFoundation/signalBus/SignalBus";

// Subscribe once in onLoad
SignalBus.instance.on(ScoreChangedSignal, (sig) => {
    this.scoreDisplay.setValue(sig.score);
}, this);

// On hit
ScoreTracker.incrementCombo();
ScoreTracker.addScore(100);
```

## Coin Collection Flying to UI Icon

```typescript
import { RewardCollector } from "db://assets/PLAGameFoundation/score/RewardCollector";

RewardCollector.collect({
    prefab: this.coinPrefab,
    count: 5,
    fromPosition: this.enemyNode.worldPosition,
    targetNode: this.coinIconNode,
    parent: this.uiRoot,
    onEachArrive: () => { ScoreTracker.addScore(50); },
    onAllComplete: () => { JuiceKit.scalePunch(this.coinIconNode); }
});
```

## Combo Multiplier Display

```typescript
import { ComboSignal } from "db://assets/PLAGameFoundation/score/ScoreTracker";

SignalBus.instance.on(ComboSignal, (sig) => {
    this.comboLabel.string = sig.comboCount >= 3
        ? sig.comboCount + 'x COMBO!'
        : '';
}, this);
```

## Multiplier Formula

`min(3, 1 + combo * 0.1)` — combo of 20 reaches the 3x cap.

## RewardCollectOptions Interface

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
