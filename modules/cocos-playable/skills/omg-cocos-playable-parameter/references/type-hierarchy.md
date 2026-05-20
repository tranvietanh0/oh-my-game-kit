---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Parameter Types — Hierarchy, Composites, Config Interfaces & Migration

## Architecture

```
PlayableConfig.ts (define) → ConfigWatcher (auto-gen JSON) → SDK postMessage
→ BaseSdkAdapter → PlayableParameterUpdates → onUpdate callbacks → ParameterUtils (apply to scene)
```

## Type Hierarchy

```
NodeParameter (position, rotation, scale)
  +-- UINodeParameter (+enable, contentSize)
  |     +-- SpriteParameter (+spriteFrame, color)
  |     |     +-- ButtonParameter (+label* prefix fields)
  |     +-- LabelParameter (+string, color, fontSize, outline, shadow)
  +-- CameraParameter (+fov)
RedirectParameter (active, count) — standalone
```

Base types: `NumberParameter`, `BooleanParameter`, `ColorParameter`, `TextParameter`, `ImageParameter`, `AudioParameter`, `RangeParameter`, `CoordinatesParameter`, `ObjectParameter<T>`, `SelectParameter`

## ParameterUtils Functions

| Function | Target | Returns | When to use |
|----------|--------|---------|-------------|
| `applyNodeParams(node, params)` | Node | void | 3D transforms |
| `applyUINodeParams(node, params)` | Node | void | UI transforms + enable/size |
| `applyCameraParams(camera, params)` | Camera | void | Camera FOV + transform |
| `applySpriteParams(sprite, params)` | Sprite | `Promise\|void` | Images (track promise!) |
| `applyLabelParams(label, params)` | Label | void | Text styling |
| `applyButtonParams(node, params)` | Node | `Promise\|void` | Sprite+Label combo (track!) |

## Composite Parameter Types (Submodule)

Live in `db://assets/PlayableParamterTool/parameter/composite/`:

| Type | Wraps | File |
|------|-------|------|
| `TutorialHandParameter` | `SpriteParameter` + `AnimationPresetParameter` | `TutorialHandParameter.ts` |
| `RichTextParameter` | `LabelParameter` + entrance/exit animation + `autoHide` | `RichTextParameter.ts` |
| `EndCardParameter` | Background sprite + title/subtitle labels + CTA button | `EndCardParameter.ts` |
| `LoadingScreenParameter` | Background color + icon sprite + game name label | `LoadingScreenParameter.ts` |

## Config Interfaces

```typescript
interface TutorialHandConfig { sprite: SpriteParameterValues; animation: AnimationPresetConfig; }
interface RichTextConfig { label: LabelParameterValues; entrance: AnimationPresetConfig; exit: AnimationPresetConfig; autoHide: boolean; autoHideDelay: number; }
interface EndCardConfig { background: SpriteParameterValues; title: LabelParameterValues; subtitle: LabelParameterValues; ctaButton: ButtonParameterValues; }
interface LoadingScreenConfig { backgroundColor: ColorParameterValues; icon: SpriteParameterValues; gameName: LabelParameterValues; }
```

## Composite Apply Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `applyTutorialHandParams(node, config)` | `{ spritePromise?, animationConfig? }` | Sprite + animation config |
| `applyRichTextParams(node, config)` | `{ entranceAnimation?, exitAnimation?, autoHideDelay? }` | Label + animations |
| `applyEndCardParams(view, config)` | `Promise<void>` | Full EndCardView binding |
| `applyLoadingScreenParams(view, config)` | `Promise<void>` | LoadingView binding |

Animation orchestration handled by `ParameterBinder` — use binder methods over direct apply.

## Signals

- `ParametersReadySignal` — all sync parameters initialized
- `AllAsyncParametersReadySignal` — all async parameters loaded

## Migration: Old Scattered Params → New Composites

| Old Parameter | New Composite | Field |
|---------------|---------------|-------|
| `TutorialHandSprite` (SpriteParameter) | `HandTut` (TutorialHandParameter) | `.sprite` |
| `Tut` / `TutorialText` (LabelParameter) | `TutText` (RichTextParameter) | `.label` |
| `LoadingBackgroundColor` | `LoadingScreen` | `.backgroundColor` |
| `LoadingIcon` | `LoadingScreen` | `.icon` |
| `LoadingGameName` | `LoadingScreen` | `.gameName` |
| `EndCardWinCTA` | `EndCardWin` | `.ctaButton` |

## Rules

- **ObjectParameter cannot nest inside another ObjectParameter** (except TableParameter items)
- **Composite fields must be BaseParameter types only** — no nested composites
- All composites and ParameterBinder live in `PlayableParamterTool/parameter/` (submodule)

## Key Files

| File | Purpose |
|------|---------|
| `assets/scripts/parameter/config/PlayableConfig.ts` | Parameter definitions (SSOT) |
| `assets/scripts/parameter/config/CustomParameter.ts` | Project parameter type classes |
| `assets/scripts/parameter/config/ParameterConfig.ts` | Config interfaces |
| `assets/scripts/parameter/ParameterController.ts` | onUpdate wiring + async tracking |
| `assets/scripts/parameter/ParameterUtils.ts` | Apply functions |
| `assets/PlayableParamterTool/parameter/BaseParameter.ts` | Base parameter types |
| `assets/PlayableParamterTool/parameter/ParameterBinder.ts` | Fluent binder API |
| `assets/PlayableParamterTool/PlayableParameterUpdates.ts` | SDK → PlayableConfig sync |
| `assets/PlayableParamterTool/json-generate/ConfigWatcher.ts` | Auto-gen JSON |
