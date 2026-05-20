---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Code Templates (v4)

## CRITICAL: Match Project's Existing Pattern

**Read the project's ParameterController.ts first** and match its @property style. Most projects use typed `@property(Sprite)`, `@property(Label)`, NOT `@property(Node)`.

## PlayableConfig.ts — Parameter Definitions

### Full-Field Sprite (ALL fields, actual scene values)

```typescript
Logo: new ObjectParameter<SpriteParameter>("Logo", new SpriteParameter({
    enable: true,
    position: {x: 0, y: 500},          // actual scene position
    contentSize: {x: 200, y: 200},      // actual UITransform size
    spriteFrame: "",                     // empty = keep current asset
    spriteColor: "#FFFFFF",             // actual sprite color
}), Categories.Logo),
```

### Full-Field Label (ALL fields, actual scene values)

```typescript
WinTitleLbl: new ObjectParameter<LabelParameter>("Win Title", new LabelParameter({
    enable: true,
    position: {x: 0, y: 300},          // actual position
    contentSize: {x: 600, y: 80},       // actual size
    string: "YOU WIN!",                  // actual text
    labelColor: "#FFD700",              // actual text color
    fontSize: 64,                        // actual font size
    lineHeight: 0,                       // actual line height
    isBold: true,                        // actual bold state
    outlineColor: "#000000",            // actual outline color
    outlineWidth: 3,                     // actual outline width
    shadowColor: "#00000088",           // actual shadow color
    shadowOffset: {x: 2, y: -2},       // actual shadow offset
}), Categories.EndCard),
```

### Full-Field Button (ALL fields, actual scene values)

```typescript
CTA: new ObjectParameter<ButtonParameter>("CTA Button", new ButtonParameter({
    enable: true,
    position: {x: 0, y: -660},         // actual position
    contentSize: {x: 400, y: 100},      // actual size
    spriteColor: "#FECE00",             // actual bg color
    string: "Play Now",                  // actual button text
    labelColor: "#000000",              // actual text color
    fontSize: 50,                        // actual font size
    outlineWidth: 0,
    outlineColor: "#000000",
}), Categories.CTA),
```

### Style-Only Label (exclude string — code-managed)

Only when you have evidence the string is managed by code (timer, score):

```typescript
TimerLbl: new ObjectParameter<LabelParameter>("Timer Label", new LabelParameter({
    enable: true,
    position: {x: 0, y: 500},
    contentSize: {x: 200, y: 60},
    // NO string — managed by timer countdown code
    labelColor: "#FFFFFF",
    fontSize: 40,
    outlineColor: "#000000",
    outlineWidth: 4,
}), Categories.GamePlayUI),
```

### Camera

```typescript
MainCamera: new ObjectParameter<CameraParameter>("Main Camera", new CameraParameter({
    position: {x: 0, y: 0, z: 10},     // actual 3D position
    rotation: {x: 0, y: 0, z: 0},      // actual 3D rotation
    fov: 45,                             // actual FOV
}), Categories.Camera),
```

## ParameterController.ts — Typed @property Pattern

### @property Declarations (MATCH EXISTING PROJECT PATTERN)

```typescript
@property(Camera)
public mainCamera: Camera = null;

@property(Sprite)
public logoSprite: Sprite = null;

@property(Label)
public timerLabel: Label = null;

@property(Node)
public ctaButton: Node = null;  // Button uses Node (has Sprite+Label children)

@property(LoadingView)
public loadingView: LoadingView = null;
```

### onUpdate Wiring

```typescript
// Sprite — track async promise
PlayableConfig.Logo.onUpdate = (data: typeof PlayableConfig.Logo) => {
    if (this.logoSprite) {
        const promise = applySpriteParams(this.logoSprite, data.parameters);
        if (promise) this._spriteUpdatePromises.push(promise);
    }
};

// Label — direct apply
PlayableConfig.WinTitleLbl.onUpdate = (data: typeof PlayableConfig.WinTitleLbl) => {
    if (this.winTitleLabel) {
        applyLabelParams(this.winTitleLabel, data.parameters);
    }
};

// Button — use applyButtonParams on Node
PlayableConfig.CTA.onUpdate = (data: typeof PlayableConfig.CTA) => {
    if (this.ctaButton) {
        const promise = applyButtonParams(this.ctaButton, data.parameters);
        if (promise) this._spriteUpdatePromises.push(promise);
    }
};

// Camera — direct apply
PlayableConfig.MainCamera.onUpdate = (data: typeof PlayableConfig.MainCamera) => {
    if (this.mainCamera) {
        applyCameraParams(this.mainCamera, data.parameters);
    }
};

// Composite — access fields via data.parameters
PlayableConfig.HPBarPlayerColor.onUpdate = (data: typeof PlayableConfig.HPBarPlayerColor) => {
    this.playerHPBar?.setBarColor(data.parameters.mainColor.default);
    this.playerHPBar?.setIndicatorColor(data.parameters.indicatorColor.default);
};
```

### Type Safety Rule

Every `onUpdate` callback MUST use `typeof PlayableConfig.X`:
```typescript
// CORRECT
PlayableConfig.Logo.onUpdate = (data: typeof PlayableConfig.Logo) => { ... };

// WRONG — missing type annotation
PlayableConfig.Logo.onUpdate = (data) => { ... };
```

## Import Templates

### PlayableConfig.ts Imports

```typescript
import { SdkType } from "db://assets/PlayableParamterTool/GameConfig";
import {
    AudioParameter, BooleanParameter, NumberParameter, ObjectParameter, RangeParameter,
    ColorParameter, TextParameter, CoordinatesParameter, ImageParameter, SelectParameter,
} from "db://assets/PlayableParamterTool/parameter/BaseParameter";
import {
    ButtonParameter, CameraParameter, SpriteParameter, LabelParameter,
    UINodeParameter, NodeParameter, RedirectParameter,
} from "db://assets/scripts/parameter/config/CustomParameter";
```

### ParameterController.ts Imports

```typescript
import { _decorator, Component, Camera, Label, Sprite, Node, Color } from 'cc';
import { PlayableConfig } from "db://assets/scripts/parameter/config/PlayableConfig";
import { applySpriteParams, applyLabelParams, applyCameraParams, applyButtonParams, applyUINodeParams } from "./ParameterUtils";
```

## Async Promise Tracking

Sprites and buttons return Promises. Always track them:

```typescript
const promise = applySpriteParams(this.sprite, data.parameters);
if (promise) this._spriteUpdatePromises.push(promise);
```

Wait in `waitForAsyncUpdates()` before firing `AllAsyncParametersReadySignal`.
