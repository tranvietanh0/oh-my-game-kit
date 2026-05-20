---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# ResponsiveLayoutService — API Reference

## Singleton Access

```typescript
ResponsiveLayoutService.instance  // set in onLoad, cleared in onDestroy
```

## Aspect Ratio Categories

| Category | Enum value | Width/Height ratio | Typical devices |
|---|---|---|---|
| NARROW | 0 | < 0.47 | iPhone X+ (19.5:9 and taller) |
| STANDARD | 1 | 0.47 – 0.60 | Most Android phones (16:9 to 19:9) |
| WIDE | 2 | > 0.60 | Tablets, short-aspect devices |

Design resolution is 1080x1920 (fitHeight). Ratio = visibleWidth / visibleHeight.

## ScreenResizedSignal

```typescript
export class ScreenResizedSignal {
    constructor(
        public category: AspectRatioCategory,
        public aspectRatio: number,
        public screenWidth: number,
        public screenHeight: number
    ) {}
}
```

Fired on `onLoad` (initial detection) and on every `canvas-resize` event.

## Read-only Properties

```typescript
service.category     // AspectRatioCategory (NARROW | STANDARD | WIDE)
service.aspectRatio  // raw width/height ratio (e.g. 0.5625 for 9:16)
service.isNarrow     // true for tall phones
service.isWide       // true for tablets
service.isStandard   // true for typical phones
```

## Methods

```typescript
service.adjustForAspectRatio(
    node: Node,
    narrowY: number,
    standardY: number,
    wideY: number
): void
// Sets node Y position based on current category. X and Z are unchanged.

service.scaleToFit(
    node: Node,
    maxWidth: number,
    maxHeight: number
): void
// Uniformly scales node so its UITransform contentSize fits within maxWidth x maxHeight.

service.getSafeArea(): { top: number, bottom: number, left: number, right: number }
// Returns safe area insets in design-space pixels.
// Falls back to all-zeros on platforms where sys.getSafeAreaRect is unavailable (web).
```
