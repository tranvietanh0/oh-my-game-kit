---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# ParameterBinder Templates

## Import Block

```typescript
import {_decorator, Component, Camera, Label, Sprite, Node} from 'cc';
import {PlayableConfig} from "db://assets/scripts/parameter/config/PlayableConfig";
import {SignalBus} from "db://assets/PLAGameFoundation/signalBus";
import {ParametersReadySignal} from "db://assets/PlayableParamterTool/PlayableParameterUpdates";
import {AllAsyncParametersReadySignal} from "db://assets/scripts/parameter/ParameterSignals";
import {ParameterBinder} from "db://assets/PlayableParamterTool/parameter/ParameterBinder";
import {WinView} from "db://assets/scripts/UI/WinView";
import {LoseView} from "db://assets/scripts/UI/LoseView";
import {LoadingView} from "db://assets/scripts/UI/LoadingView";
const {ccclass, property} = _decorator;
```

## Binder Method Signatures

| Method | Parameter Type | Target Return | Async |
|--------|---------------|---------------|-------|
| `.camera(param, getTarget)` | `ObjectParameter<CameraParameter>` | `Camera` | No |
| `.sprite(param, getTarget)` | `ObjectParameter<SpriteParameter>` | `Sprite` | Yes |
| `.label(param, getTarget)` | `ObjectParameter<LabelParameter>` | `Label` | No |
| `.button(param, getTarget)` | `ObjectParameter<ButtonParameter>` | `Node` | Yes |
| `.tutorialHand(param, getTarget)` | `ObjectParameter<TutorialHandParameter>` | `Sprite` | Yes |
| `.richText(param, getTarget)` | `ObjectParameter<RichTextParameter>` | `Label` | No |
| `.endCard(param, getView)` | `ObjectParameter<EndCardParameter>` | `EndCardView` | Yes |
| `.loadingScreen(param, getMapping)` | `ObjectParameter<LoadingScreenParameter>` | `LoadingScreenMapping` | Yes |

## @property Declaration Templates

```typescript
@property(Camera) public mainCamera: Camera = null;
@property(Sprite) public logoSprite: Sprite = null;
@property(Label)  public timerLabel: Label = null;
@property(Node)   public ctaButton: Node = null;  // Button uses Node
@property(LoadingView) public loadingView: LoadingView = null;
@property(WinView)  public winView: WinView = null;
@property(LoseView) public loseView: LoseView = null;
```

## Property Naming Conventions

| Parameter Name | Property Name | Property Type |
|----------------|---------------|---------------|
| `MainCamera` | `mainCamera` | `Camera` |
| `Logo` | `logoSprite` | `Sprite` |
| `CTA` | `ctaButton` | `Node` |
| `TutText` | `tutLabel` | `Label` |
| `HandTut` | `handTutSprite` | `Sprite` |
| `Loading` | `loadingView` | `LoadingView` |
| `EndCardWin` | `winView` | `WinView` |

## Binder Chain Structure

```typescript
private binder = new ParameterBinder();

public SetUpOnUpdate(): void {
    this.binder
        .camera(PlayableConfig.MainCamera, () => this.mainCamera)
        .sprite(PlayableConfig.Logo, () => this.logoSprite)
        .button(PlayableConfig.CTA, () => this.ctaButton)
        .label(PlayableConfig.ScoreLabel, () => this.scoreLabel)
        .richText(PlayableConfig.TutText, () => this.tutLabel)
        .tutorialHand(PlayableConfig.HandTut, () => this.handTutSprite)
        .loadingScreen(PlayableConfig.Loading, () => this.loadingView ? {
            node: this.loadingView.node,
            backgroundSprite: this.loadingView.backgroundSprite,
            iconSprite: this.loadingView.iconSprite,
            gameNameLabel: this.loadingView.gameNameLabel,
            fillBar: this.loadingView.FillBar,
        } : null)
        .endCard(PlayableConfig.EndCardWin, () => this.winView)
        .endCard(PlayableConfig.EndCardLose, () => this.loseView);
    this.setupAudioParamUpdates();
}
```

## LoadingScreen Mapping Interface

```typescript
interface LoadingScreenMapping {
    node: Node;
    backgroundSprite?: Sprite;
    iconSprite?: Sprite;
    gameNameLabel?: Label;
    fillBar?: Sprite;
}
```

## Async Handling

```typescript
private onParametersReady = async (): Promise<void> => {
    await this.binder.waitForAsync();
    await Promise.all(this._audioUpdatePromises);
    SignalBus.instance.fire(new AllAsyncParametersReadySignal());
}
```

## Audio Parameter Auto-Setup

```typescript
private setupAudioParamUpdates(): void {
    Object.entries(PlayableConfig).forEach(([key, param]) => {
        if (param.category === 'Audio') {
            param.onUpdate = (updatedParam) => {
                const promise = replaceParameterAudioFromResources(key, updatedParam)
                    .then(audioClip => {
                        if (audioClip && AudioContainer.instance)
                            AudioContainer.instance.registerAudioClip(key, audioClip);
                    });
                this._audioUpdatePromises.push(promise);
            };
        }
    });
}
```

## Manual onUpdate (Non-Binder)

For standalone parameters (Range, Color, Text), wire manually:

```typescript
PlayableConfig.MusicVolume.onUpdate = (data) => { AudioService.instance.setMusicVolume(data.default); };
PlayableConfig.SlotColor.onUpdate = (data) => { Constant.GAME_COLOR.SLOT_DEFAULT = data.default; };
```

## Data Parameter Pattern (No @property / No Binder)

```typescript
// PlayableConfig.ts
SlotColor: new ColorParameter("Slot Default Color", "#2b3747", Categories.GameConfig),
SnapDuration: new RangeParameter("Snap Duration", 0.12, {min: 0.05, max: 0.5, step: 0.01}, Categories.GameConfig),

// ParameterController.ts — manual onUpdate
PlayableConfig.SlotColor.onUpdate = (data) => { Constant.GAME_COLOR.SLOT_DEFAULT = data.default; };
PlayableConfig.SnapDuration.onUpdate = (data) => {
    if (this.gameplayController) this.gameplayController.snapDuration = data.default;
};
```
