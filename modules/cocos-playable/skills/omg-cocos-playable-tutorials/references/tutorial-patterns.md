---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Tutorial Patterns — Composite Parameters & Usage Examples

## Composite Parameter Integration

### TutorialHandParameter

`TutorialHandParameter` = `SpriteParameter` (finger sprite) + `AnimationPresetParameter` (gesture animation). Defined as a composite in `PlayableConfig.ts` and applied via `ParameterBinder.bindTutorialHand()`.

```typescript
// config shape:
interface TutorialHandConfig {
    sprite: SpriteParameterValues;       // finger image + color
    animation: AnimationPresetConfig;    // preset = TAP | DRAG | SWIPE_* etc.
}

// In ParameterController.SetUpOnUpdate():
PlayableConfig.TutorialHand.onUpdate = (config) => {
    ParameterBinder.bindTutorialHand(this.tutorialHandNode, config);
};
```

The `animation.preset` value maps directly to `FingerAction` equivalents (`TAP`, `DRAG`, `HOLD`) plus swipe directions. `AnimationPresetPlayer.play()` handles the looping gesture on the sprite node.

### RichTextParameter

`RichTextParameter` = `LabelParameter` (text + style) + entrance `AnimationPresetParameter` + exit `AnimationPresetParameter` + `autoHide` boolean + `autoHideDelay` number.

```typescript
interface RichTextConfig {
    label: LabelParameterValues;
    entrance: AnimationPresetConfig;    // plays when hint text appears
    exit: AnimationPresetConfig;        // plays before text disappears
    autoHide: boolean;                  // hides after autoHideDelay seconds
    autoHideDelay: number;
}

// In ParameterController.SetUpOnUpdate():
PlayableConfig.TutorialText.onUpdate = (config) => {
    ParameterBinder.bindRichText(this.tutorialTextNode, config);
};
```

`TYPEWRITER` preset is the most common entrance choice for tutorial text.

See `omg-cocos-playable-parameter` skill for composite type definitions and migration guide.

Import paths:
- `db://assets/PLAGameFoundation/tutorials/FingerTutorial`
- `db://assets/PLAGameFoundation/tutorials/ArrowHint`
- `db://assets/PLAGameFoundation/tutorials/TutorialSequence`

## Usage Examples

**Simple tap hint with auto-advance after 3 seconds:**
```typescript
import { TutorialSequence, TutorialStepConfig } from "db://assets/PLAGameFoundation/tutorials/TutorialSequence";
import { FingerAction } from "db://assets/PLAGameFoundation/tutorials/FingerTutorial";

const seq = this.tutorialNode.getComponent(TutorialSequence);
seq.setSteps([
    { finger: { target: this.targetButton }, duration: 3 }
]);
seq.begin();
```

**Drag tutorial with condition-based advance:**
```typescript
seq.setSteps([
    {
        finger: {
            target: this.cardNode,
            action: FingerAction.DRAG,
            dragTarget: this.slotNode
        },
        condition: () => this._cardPlaced
    }
]);
seq.begin();
```

**Arrow only, pointing at moving enemy:**
```typescript
import { Vec3 } from "cc";

seq.setSteps([
    { arrow: { target: this.enemyNode, offset: new Vec3(0, 100, 0) }, duration: 2 },
    { finger: { target: this.attackButton }, duration: 2 }
]);
seq.begin();
```

**Listen for completion:**
```typescript
import { SignalBus } from "db://assets/PLAGameFoundation/signalBus/SignalBus";
import { TutorialCompleteSignal } from "db://assets/PLAGameFoundation/tutorials/TutorialSequence";

SignalBus.instance.on(TutorialCompleteSignal, () => {
    GameView.instance.changeState(GameplayState);
}, this);
```
