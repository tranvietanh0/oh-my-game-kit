---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Parameter Code Examples

## Defining Parameters in PlayableConfig.ts

```typescript
// File: assets/scripts/parameter/config/PlayableConfig.ts
import { AudioParameter, BooleanParameter, ColorParameter, NumberParameter,
    ObjectParameter, RangeParameter } from "db://assets/PlayableParamterTool/parameter/BaseParameter";
import { ButtonParameter, CameraParameter, RedirectParameter, SpriteParameter,
    LabelParameter } from "db://assets/scripts/parameter/config/CustomParameter";

const Categories = {
    Default: "Default", Audio: "Audio", GamePlayUI: "GamePlayUI",
    CTA: "CTA", Logo: "Logo", Tutorial: "Tutorial",
    Loading: "Loading", EndCardWin: "EndCard Win", EndCardLose: "EndCard Lose",
};

export const PlayableConfig = {
    // Range parameter
    MusicVolume: new RangeParameter("Music Volume", 0.5, {min: 0, max: 1, step: 0.1}, Categories.Default),

    // Color parameter
    LoadingBackgroundColor: new ColorParameter("Loading Background Color", "#4A9FF8", Categories.Loading),

    // Audio parameter (auto-detected by Categories.Audio)
    BGM: new AudioParameter("Background Music", "", Categories.Audio),

    // Sprite parameter
    Logo: new ObjectParameter<SpriteParameter>("Logo", new SpriteParameter({
        enable: false,
        position: {x: -416.949, y: -771.667},
        contentSize: {x: 150, y: 150},
        spriteColor: "#FFFFFF",
        spriteFrame: "",
    }), Categories.Logo),

    // Label parameter
    Tut: new ObjectParameter<LabelParameter>("Tutorial Text", new LabelParameter({
        position: {x: 0, y: 200},
        string: "Tap to play!",
        labelColor: "#FFFFFF",
        fontSize: 32,
    }), Categories.Tutorial),

    // Button parameter (Sprite + Label combined)
    CTA: new ObjectParameter<ButtonParameter>("cta Button", new ButtonParameter({
        enable: true,
        position: {x: 0, y: -300},
        spriteColor: "#FF5500",
        spriteFrame: "",
        string: "Install Now",
        labelColor: "#FFFFFF",
        fontSize: 36,
    }), Categories.CTA),

    // Camera parameter
    MainCamera: new ObjectParameter<CameraParameter>("Camera", new CameraParameter({
        rotation: {x: 0, y: 0, z: 0},
        position: {x: 0, y: 0, z: 0},
    }), Categories.Default),
};
```

## Wiring onUpdate in ParameterController

```typescript
// File: assets/scripts/parameter/ParameterController.ts
// In SetUpOnUpdate() -> setupUINodeParamUpdates():

// Sprite: track promise
PlayableConfig.Logo.onUpdate = (data: typeof PlayableConfig.Logo) => {
    const promise = applySpriteParams(this.logoSprite, data.parameters);
    if (promise) this._spriteUpdatePromises.push(promise);
};

// Button: track promise (sprite + label combo)
PlayableConfig.CTA.onUpdate = (data: typeof PlayableConfig.CTA) => {
    const promise = applyButtonParams(this.ctaButton, data.parameters);
    if (promise) this._spriteUpdatePromises.push(promise);
};

// Label: no promise needed
PlayableConfig.Tut.onUpdate = (data: typeof PlayableConfig.Tut) => {
    applyLabelParams(this.tutLabel, data.parameters);
};

// Simple value
PlayableConfig.MusicVolume.onUpdate = (data: typeof PlayableConfig.MusicVolume) => {
    AudioService.instance.setMusicVolume(data.default);
};

// Camera
PlayableConfig.MainCamera.onUpdate = (data: typeof PlayableConfig.MainCamera) => {
    applyCameraParams(this.mainCamera, data.parameters);
};
```

## Custom Parameter Type

```typescript
// File: assets/scripts/parameter/config/CustomParameter.ts
export class SpriteParameter extends UINodeParameter {
    spriteFrame?: ImageParameter;
    color?: ColorParameter;

    constructor(config: SpriteConfig = {}) {
        super(config);
        this.spriteFrame = config.spriteFrame !== undefined
            ? new ImageParameter("Sprite Frame", config.spriteFrame) : undefined;
        this.color = config.spriteColor
            && new ColorParameter("Color", config.spriteColor);
    }
}

export class ButtonParameter extends SpriteParameter {
    labelString?: TextParameter;
    labelColor?: ColorParameter;
    labelFontSize?: NumberParameter;
    // ... all label fields prefixed with "label"

    constructor(config: ButtonConfig = {}) {
        super(config);
        this.labelString = config.string && new TextParameter("Label String", config.string);
        this.labelColor = config.labelColor && new ColorParameter("Label Color", config.labelColor);
        this.labelFontSize = config.fontSize && new NumberParameter("Label Font Size", config.fontSize);
    }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `assets/scripts/parameter/config/PlayableConfig.ts` | Parameter definitions (SSOT) |
| `assets/scripts/parameter/config/CustomParameter.ts` | Parameter type classes |
| `assets/scripts/parameter/config/ParameterConfig.ts` | Config interfaces |
| `assets/scripts/parameter/ParameterController.ts` | onUpdate wiring + async tracking |
| `assets/scripts/parameter/ParameterUtils.ts` | Apply functions |
| `assets/scripts/parameter/ParameterRegister.ts` | Registration system |
| `assets/PlayableParamterTool/parameter/BaseParameter.ts` | Base parameter types |
| `assets/PlayableParamterTool/PlayableParameterUpdates.ts` | SDK -> PlayableConfig sync |
| `assets/PlayableParamterTool/json-generate/ConfigWatcher.ts` | Auto-gen JSON |
