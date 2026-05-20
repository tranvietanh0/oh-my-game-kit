---
name: omg-cocos-playable-signalbus
description: "Type-safe pub/sub event bus (SignalBus) for Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# SignalBus — Typed Pub/Sub Event System

Singleton event bus using class constructors as keys. Signals are plain TS classes — no base class required. See also: `omg-cocos-playable-lifecycle`, `omg-cocos-playable-gameflow`.

Import path: `db://assets/PLAGameFoundation/signalBus/SignalBus`

## Architecture

- `SignalBus.instance` — singleton
- Key = class constructor (no string keys, no magic strings)
- Duplicate subscriptions are silently ignored (safe to call `subscribe` multiple times)
- Callbacks snapshot before firing — safe to modify subscriptions inside callbacks

## Key APIs

```typescript
// Subscribe
SignalBus.instance.subscribe(MySignal, (data: MySignal) => { ... });

// Unsubscribe — store callback reference to unsubscribe later
const cb = (data: MySignal) => { ... };
SignalBus.instance.subscribe(MySignal, cb);
SignalBus.instance.unsubscribe(MySignal, cb);

// Fire — pass an instance, not the constructor
SignalBus.instance.fire(new MySignal(value));

// Async one-shot wait
const result = await SignalBus.instance.waitFor(MySignal);
const result = await SignalBus.instance.waitFor(MySignal, 5000); // 5s timeout, throws on expire

// Cleanup
SignalBus.instance.clear(MySignal);   // remove all listeners for one type
SignalBus.instance.clearAll();        // remove everything (use in scene teardown)
SignalBus.instance.hasSubscriptions(MySignal); // bool check
```

## Signal Conventions

Signals are plain TS classes. Constructor args become typed payload fields.

```typescript
// No payload
export class FirstInteractionSignal {}

// With payload — use readonly constructor fields
export class TapSignal {
    constructor(
        public readonly worldPosition: Vec3,
        public readonly uiPosition: Vec2
    ) {}
}
```

## Project Signals Reference

| Signal | Source file | Payload |
|---|---|---|
| `ParametersReadySignal` | `PlayableParamterTool/PlayableParameterUpdates` | none |
| `AllAsyncParametersReadySignal` | `scripts/parameter/ParameterController` | none |
| `FirstInteractionSignal` | `PLAGameFoundation/inputService/InputSignals` | none |
| `TapSignal` | `PLAGameFoundation/inputService/InputSignals` | `worldPosition`, `uiPosition` |
| `SwipeSignal` | `PLAGameFoundation/inputService/InputSignals` | `direction`, `velocity` |
| `DragSignal` | `PLAGameFoundation/inputService/InputSignals` | `worldPosition`, `uiPosition`, `delta` |
| `TouchStartSignal` | `PLAGameFoundation/inputService/InputSignals` | `worldPosition`, `uiPosition` |
| `TouchEndSignal` | `PLAGameFoundation/inputService/InputSignals` | `worldPosition`, `uiPosition` |
| `RaycastHitSignal` | `PLAGameFoundation/inputService/InputSignals` | `hitNode`, `hitPoint` |

## Workflow: Common Tasks

**Wait for parameters before initializing scene:**
```typescript
await SignalBus.instance.waitFor(AllAsyncParametersReadySignal);
this.initScene();
```

**Subscribe in onEnable / unsubscribe in onDisable (Cocos component pattern):**
```typescript
private onTap = (s: TapSignal) => { this.handleTap(s); };

onEnable() { SignalBus.instance.subscribe(TapSignal, this.onTap); }
onDisable() { SignalBus.instance.unsubscribe(TapSignal, this.onTap); }
```

**Fire after state change:**
```typescript
SignalBus.instance.fire(new ParametersReadySignal());
```

## When to Use SignalBus vs Alternatives

| Use case | Recommendation |
|---|---|
| Cross-system communication | SignalBus |
| Parent → child component | Cocos Node events or direct call |
| One-shot async gate (wait for load) | `waitFor()` |
| UI button clicks | Cocos `Button` event + direct callback |
| Scene-local tight coupling | Direct method call |

## Common Mistakes

- Firing the constructor instead of an instance: `fire(MySignal)` — wrong. Use `fire(new MySignal())`.
- Forgetting to unsubscribe in `onDisable`/`onDestroy` — causes ghost callbacks on recycled nodes.
- Calling `clearAll()` mid-game — clears every listener globally; reserve for scene resets.

## Gotchas

- **Unsubscribe in `onDestroy`, not `onDisable`** — disabled-but-not-destroyed nodes still receive signals; disable-only unsubscribe leaves dead subscriptions on hot-reload.
- **Signal payloads should be serializable** — passing a node reference through a signal that crosses scene-replay = dangling reference.
- **Event names are global** — namespace via prefixes (`game.start`, `ui.toast`) to avoid silent collisions across modules.
