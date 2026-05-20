---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# ResponsiveLayoutService — Usage Examples

## React to screen resize signal

```typescript
import { ResponsiveLayoutService, ScreenResizedSignal, AspectRatioCategory } from "db://assets/PLAGameFoundation/layout/ResponsiveLayoutService";
import { SignalBus } from "db://assets/PLAGameFoundation/signalBus/SignalBus";

protected onLoad(): void {
    SignalBus.instance.on(ScreenResizedSignal, this._onResize, this);
    this._applyLayout();
}

protected onDestroy(): void {
    SignalBus.instance.off(ScreenResizedSignal, this._onResize, this);
}

private _onResize(sig: ScreenResizedSignal): void {
    this._applyLayout();
}

private _applyLayout(): void {
    const service = ResponsiveLayoutService.instance;
    if (!service) return;
    service.adjustForAspectRatio(this.ctaButtonNode, -750, -820, -900);
}
```

## Adjust CTA button Y per device category

```typescript
ResponsiveLayoutService.instance.adjustForAspectRatio(
    this.ctaButtonNode,
    -750,   // narrowY  — tall phones, button higher up
    -820,   // standardY
    -900    // wideY    — tablets, button lower
);
```

## Scale a logo to fit a safe area

```typescript
ResponsiveLayoutService.instance.scaleToFit(this.logoNode, 800, 300);
```

## Read safe area and offset a bottom panel

```typescript
const safe = ResponsiveLayoutService.instance.getSafeArea();
const pos = this.bottomPanelNode.position;
this.bottomPanelNode.setPosition(pos.x, pos.y + safe.bottom, pos.z);
```

## One-time check without signal

```typescript
const service = ResponsiveLayoutService.instance;
if (service.isNarrow) {
    this.backgroundNode.setScale(1.1, 1.1, 1);
}
```
