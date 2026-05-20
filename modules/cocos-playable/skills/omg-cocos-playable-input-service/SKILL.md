---
name: omg-cocos-playable-input-service
description: "InputService component for touch detection, gesture recognition, and 3D raycasting in playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# InputService

Cocos Component attached to a scene node. Listens to global `input` events and fires typed signals via SignalBus. See `omg-cocos-playable-signalbus` for subscription patterns.

## Architecture

- **`InputService`** — Cocos `Component` (attach to scene node), registers TOUCH_START/MOVE/END handlers in `onLoad`
- **`InputSignals`** — Plain TS classes emitted via SignalBus; no constructor needed for `FirstInteractionSignal`
- **`InputServiceConfig`** — Optional config overrides passed to `configure()`

Default thresholds: `swipeThreshold=50px`, `swipeVelocityThreshold=300px/s`, `tapMaxDuration=300ms`, `tapMaxDistance=10px`

## Signal Types

| Signal | Payload | Fires when |
|---|---|---|
| `TouchStartSignal` | `worldPosition, uiPosition` | finger touches screen |
| `TouchEndSignal` | `worldPosition, uiPosition` | finger lifts |
| `TapSignal` | `worldPosition, uiPosition` | duration < 300ms AND distance < 10px |
| `SwipeSignal` | `direction ('up'|'down'|'left'|'right'), velocity` | distance > 50px AND velocity > 300px/s |
| `DragSignal` | `worldPosition, uiPosition, delta` | every TOUCH_MOVE |
| `FirstInteractionSignal` | — | first ever touch (once per session) |
| `RaycastHitSignal` | `hitNode, hitPoint` | 3D ray hits on TOUCH_START |
| `RaycastMoveSignal` | `hitNode, hitPoint` | 3D ray hits on TOUCH_MOVE |
| `RaycastEndSignal` | `hitNode, hitPoint` | 3D ray hits on TOUCH_END |

## Key APIs

```typescript
// Runtime configuration (merge over defaults)
inputService.configure({ swipeThreshold: 80, tapMaxDuration: 200 });

// Provide explicit 2D camera for screen→world conversion
inputService.setMainCamera(camera2D);

// Enable 3D raycasting (auto-enables when set)
inputService.set3DCamera(camera3D);
// OR assign via @property in editor: inputService.camera3D = camera;

// Toggle all input processing
inputService.setEnabled(false);

// Raycast mask for filtering physics layers (default = all layers)
inputService.configure({ raycastMask: 1 << 3 }); // layer 3 only
```

## Workflow: Common Tasks

**Subscribe to tap anywhere:**
```typescript
SignalBus.instance.subscribe(TapSignal, (s) => {
    console.log('tap at UI', s.uiPosition);
});
```

**Detect first touch (BGM unlock):**
```typescript
// PlayableHelper already handles this — autoPlayMusicOnFirstTouch = true
// For custom logic:
SignalBus.instance.subscribe(FirstInteractionSignal, () => {
    AudioService.instance.playMusic(Constant.AUDIO_NAME.BGM);
});
```

**4-directional swipe:**
```typescript
SignalBus.instance.subscribe(SwipeSignal, (s) => {
    if (s.direction === 'up') movePlayerUp();
});
```

**3D object picking (drag):**
```typescript
// 1. Assign camera3D in editor @property or via set3DCamera()
// 2. Subscribe to raycast signals:
SignalBus.instance.subscribe(RaycastHitSignal, (s) => {
    s.hitNode.getComponent(MyObject)?.onSelect();
});
SignalBus.instance.subscribe(RaycastMoveSignal, (s) => {
    s.hitNode.setWorldPosition(s.hitPoint);
});
```

**Screen-to-world conversion (internal):**
Uses `camera.screenToWorld()` auto-detected from Canvas if `mainCamera` not explicitly set.

## Integration with PlayableHelper

`PlayableHelper` subscribes `FirstInteractionSignal` → plays BGM, and optionally subscribes `TapSignal` for redirect-after-N-clicks. Do not duplicate these subscriptions.

## Common Mistakes

- Attaching `InputService` to a node that gets destroyed early — use a persistent scene root node
- Setting `camera3D` without enabling the PhysicsSystem in project settings (raycasts silently skip)
- Forgetting to call `setEnabled(false)` during loading/cutscenes — tap/swipe signals still fire otherwise
- Subscribing `TapSignal` when `PlayableHelper.autoPlayMusicOnFirstTouch` is true creates duplicate BGM play calls if you also subscribe `FirstInteractionSignal`

## Gotchas

- **Touch events on Cocos Web target document, not Canvas** — adding a div over the canvas blocks input silently.
- **Gamepad polling is per-frame, not per-event** — debounce in user code if you need event semantics.
- **Multi-touch pinches deliver two unsynchronised TouchMove events per frame** — buffer before reacting.
