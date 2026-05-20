---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Parameter Types — Composite Types, Config Interfaces & Migration

## Composite Parameter Types

Composite types bundle related fields into a single dashboard group. They live in:
`db://assets/PlayableParamterTool/parameter/composite/`

| Type | Wraps | File |
|------|-------|------|
| `TutorialHandParameter` | `SpriteParameter` + `AnimationPresetParameter` | `TutorialHandParameter.ts` |
| `RichTextParameter` | `LabelParameter` + entrance/exit `AnimationPresetParameter` + `autoHide` | `RichTextParameter.ts` |
| `EndCardParameter` | Background `SpriteParameter` + title/subtitle `LabelParameter` + CTA `ButtonParameter` | `EndCardParameter.ts` |
| `LoadingScreenParameter` | Background color + icon `SpriteParameter` + game name `LabelParameter` | `LoadingScreenParameter.ts` |

## Config Interfaces

```typescript
interface TutorialHandConfig {
    sprite: SpriteParameterValues;
    animation: AnimationPresetConfig;
}

interface RichTextConfig {
    label: LabelParameterValues;
    entrance: AnimationPresetConfig;
    exit: AnimationPresetConfig;
    autoHide: boolean;
    autoHideDelay: number;
}

interface EndCardConfig {
    background: SpriteParameterValues;
    title: LabelParameterValues;
    subtitle: LabelParameterValues;
    ctaButton: ButtonParameterValues;
}

interface LoadingScreenConfig {
    backgroundColor: ColorParameterValues;
    icon: SpriteParameterValues;
    gameName: LabelParameterValues;
}
```

## Defining Composites in PlayableConfig.ts

```typescript
TutorialHand: new ObjectParameter<TutorialHandConfig>({
    defaultValue: { sprite: defaultSprite, animation: defaultPreset },
    category: Categories.Tutorial,
    onUpdate: (config) => ParameterBinder.bindTutorialHand(this.tutorialHandNode, config)
}),
EndCardWin: new ObjectParameter<EndCardConfig>({
    defaultValue: { background: ..., title: ..., subtitle: ..., ctaButton: ... },
    category: Categories.EndCard,
    onUpdate: (config) => ParameterBinder.bindEndCard(this.winView, config)
}),
```

## Apply Functions (Composite)

| Function | Returns | Description |
|----------|---------|-------------|
| `applyTutorialHandParams(node, config)` | `{ spritePromise?, animationConfig? }` | Applies sprite; returns animation config for caller to play |
| `applyRichTextParams(node, config)` | `{ entranceAnimation?, exitAnimation?, autoHideDelay? }` | Applies label; returns animation configs + delay |
| `applyEndCardParams(view, config)` | `Promise<void>` | Full EndCardView binding (bg + labels + CTA) |
| `applyLoadingScreenParams(view, config)` | `Promise<void>` | LoadingView binding (bg color + icon + name) |

**Animation orchestration is handled by `ParameterBinder`** — callers should use the binder methods rather than calling apply functions directly.

## Migration: Old Scattered Params → New Composites

| Old Parameter | New Composite | Field |
|---------------|---------------|-------|
| `TutorialHandSprite` (SpriteParameter) | `HandTut` (TutorialHandParameter) | `.sprite` |
| `HandTut` (SpriteParameter) | `HandTut` (TutorialHandParameter) | `.sprite` |
| `Tut` / `TutorialText` (LabelParameter) | `TutText` (RichTextParameter) | `.label` |
| `LoadingBackgroundColor` | `LoadingScreen` | `.backgroundColor` |
| `LoadingIcon` | `LoadingScreen` | `.icon` |
| `LoadingGameName` | `LoadingScreen` | `.gameName` |
| `EndCardWinCTA` | `EndCardWin` | `.ctaButton` |
| `EndCardLoseCTA` | `EndCardLose` | `.ctaButton` |

**Mapping summary:**
- Old `Tut` / `TutorialText` (LabelParameter) → New `TutText` (RichTextParameter) with `.label` field
- Old `HandTut` / `TutorialHandSprite` (SpriteParameter) → New `HandTut` (TutorialHandParameter) with `.sprite` + `.animation` fields

**All composite parameters and ParameterBinder live in `PlayableParamterTool/parameter/` (submodule).**
