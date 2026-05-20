---
name: omg-cocos-playable-toast
description: "ToastController singleton for pooled toast notifications in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# ToastController — Pooled Toast Notifications

Singleton at `PLAGameFoundation/ui/utils/ToastController.ts`. Integrates with `ObjectPoolManager` — pool key `"Toast"`, prefab path `resources/prefab/Toast`. See also: `omg-cocos-playable-async-utilities` (duration timing), `omg-cocos-playable-gameflow` (where debug toasts are shown).

Import: `db://assets/PLAGameFoundation/ui/utils/ToastController`

## Architecture

```
ToastController (singleton)
└── ObjectPoolManager pool: "Toast"  ← prefab: resources/prefab/Toast
    └── Toast (Component on prefab)
        ├── Label (text)
        ├── UIOpacity (fade animations)
        └── Node background (Sprite for bg color)
```

Toast auto-recycles itself after animation completes via `recycle()` → `recycleToast()`.

## Setup (one-time, in GameView or LoadingView)

```typescript
// Must be called before any show() calls
await ToastController.instance.Initialize();

// Optional: override defaults
ToastController.instance.defaultDuration = 2.0;
ToastController.instance.defaultPosition = ToastPosition.TOP_CENTER;
ToastController.instance.defaultColor = new Color(255, 255, 255, 255);
ToastController.instance.defaultBgColor = new Color(50, 50, 50, 200);
ToastController.instance.defaultFontSize = 24;
ToastController.instance.initialPoolSize = 5;

// Optional: override container (defaults to scene Canvas)
ToastController.instance.setToastContainer(myCanvasNode);
```

## Positions — `ToastPosition` enum

9 presets + custom:
- `TOP_LEFT`, `TOP_CENTER`, `TOP_RIGHT`
- `CENTER_LEFT`, `CENTER`, `CENTER_RIGHT`
- `BOTTOM_LEFT`, `BOTTOM_CENTER`, `BOTTOM_RIGHT`
- `CUSTOM` — requires `customPosition: Vec3`

All presets use 100px edge offset from canvas bounds.

## Show API

```typescript
// Simple string — uses all defaults
ToastController.instance.show("Level Complete!");

// Full config
ToastController.instance.show({
    text: "Score: 100",
    position: ToastPosition.BOTTOM_CENTER,
    duration: 3.0,
    color: new Color(255, 215, 0, 255),    // gold text
    bgColor: new Color(0, 0, 0, 180),
    fontSize: 32,
    animationType: 'slideUpFade'           // default
});

// Custom position
ToastController.instance.show({
    text: "Hit!",
    position: ToastPosition.CUSTOM,
    customPosition: new Vec3(100, -200, 0),
    animationType: 'fadeIn',
    duration: 1.5
});
```

## Animation Types

| Type | Behavior |
|------|----------|
| `slideUpFade` | Slides up 50px + fades in, then continues sliding + fades out (default) |
| `slideUp` | Slides up 50px at full opacity, then slides up 30px more on exit |
| `fadeIn` | Fades in only, holds, then fades out (no movement) |

Timing: 0.3s enter, `(duration - 0.6)s` hold, 0.3s exit.

## Clear / Cleanup

```typescript
ToastController.instance.clearAll();   // recycles all active toasts immediately
ToastController.instance.dispose();    // unloads pool, clears singleton reference
```

## Common Mistakes

- Calling `show()` before `Initialize()` — logs error and does nothing. Always `await Initialize()` first.
- Pool size too small for rapid toasts — increase `initialPoolSize` before `Initialize()`.
- No `Toast` prefab at `resources/prefab/Toast` — `Initialize()` will fail; prefab must exist in resources.
- The `Toast` prefab must have `Toast` component attached with `Label`, `UIOpacity`, and `background` node wired in the Inspector.
- `clearAll()` does not cancel the underlying tweens gracefully — `cleanup()` is called on each `Toast` component which stops tweens and resets opacity.
- Container defaults to scene `Canvas` child named `"Canvas"` — if your Canvas node has a different name, call `setToastContainer()`.

## Gotchas

- **Toast queue must not stack-block input** — pointer-events must be `none` on toast containers.
- **Toast on top-layer must obey aspect ratio guards** — landscape playable toasts stretched to portrait read as bugs.
