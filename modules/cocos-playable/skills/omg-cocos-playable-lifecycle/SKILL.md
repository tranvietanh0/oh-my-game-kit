---
name: omg-cocos-playable-lifecycle
description: "GameLifecycleManager and lifecycle interfaces for non-Component systems in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# GameLifecycleManager — Non-Component Lifecycle System

Drives Tick/FixedTick/LateTick on plain TS classes that don't extend Cocos `Component`. Add `GameLifecycleManager` as a component on a persistent scene node. See also: `omg-cocos-playable-signalbus`, `omg-cocos-playable-async-utilities`.

Import paths:
- `db://assets/PLAGameFoundation/gameLifecycle/GameLifecycleManager`
- `db://assets/PLAGameFoundation/gameLifecycle/LifecycleDecorator`
- `db://assets/PLAGameFoundation/gameLifecycle/interfaces/I*`

## Interfaces

| Interface | Method signature | Called when |
|---|---|---|
| `IInitializable` | `Initialize(): void` | Immediately on `Register()` |
| `ITickable` | `Tick(dt: number): void` | Every frame (via Cocos `update`) |
| `IFixedTickable` | `FixedTick(fixedDt: number): void` | Fixed timestep accumulator (default 0.02s / 50 FPS) |
| `ILateTickable` | `LateTick(dt: number): void` | After all Ticks (via Cocos `lateUpdate`) |
| `IDisposable` | `Dispose(): void` | On `Unregister()` or scene destroy |

A class can implement any combination. `Register()` detects which interfaces are present via duck-typing (`isType` checks for method name existence).

## @RegisterLifecycle() Decorator

Auto-instantiates and registers the class when `GameLifecycleManager.onLoad()` runs. No-arg constructor required.

```typescript
import { RegisterLifecycle } from "db://assets/PLAGameFoundation/gameLifecycle/LifecycleDecorator";
import { IInitializable, ITickable, IDisposable } from "db://assets/PLAGameFoundation/gameLifecycle/interfaces/...";

@RegisterLifecycle()
export class MySystem implements IInitializable, ITickable, IDisposable {
    Initialize(): void {
        // setup — called once at scene start
    }

    Tick(dt: number): void {
        // runs every frame
    }

    Dispose(): void {
        // cleanup on scene destroy
    }
}
```

## Manual Registration

Use when you need constructor args or runtime control:

```typescript
const system = new MySystem(someArg);
GameLifecycleManager.Instance.Register(system);

// Later, to stop ticking and call Dispose:
GameLifecycleManager.Instance.Unregister(system);
```

## Fixed Timestep

The manager accumulates delta time and calls `FixedTick` at a fixed rate:

```typescript
// Default: 0.02s (50 Hz). Change at runtime:
GameLifecycleManager.Instance.SetFixedTimeStep(1 / 30); // 30 Hz
GameLifecycleManager.Instance.GetFixedTimeStep();
```

`FixedTick` receives the configured `fixedDeltaTime`, not the accumulated surplus.

## isType Pattern (Internal)

The manager uses duck-typing — not `instanceof` — to check interfaces:

```typescript
// Internal implementation (for reference):
private isType<T>(obj: any, methodName: string): obj is T {
    return methodName in obj;
}
```

This means TypeScript interfaces are checked at runtime by method presence. Ensure method names match exactly (`Tick`, `FixedTick`, `LateTick`, `Initialize`, `Dispose`).

## Debug Info

```typescript
console.log(GameLifecycleManager.Instance.GetDebugInfo());
// Prints counts for each collection + fixedTimeStep
```

## When to Use Lifecycle Manager vs Cocos Component update()

| Scenario | Use |
|---|---|
| Pure logic / service class (no Node) | `@RegisterLifecycle()` + interfaces |
| Node-attached behaviour | Cocos `Component` with `update()` |
| Physics-like deterministic step | `IFixedTickable` |
| Camera follow / post-process | `ILateTickable` |
| One-time setup with no ticking | `IInitializable` only |
| Cross-system service needing frame updates | `ITickable` via lifecycle manager |

## Common Mistakes

- Implementing `tick()` (lowercase) instead of `Tick()` — manager checks exact name; the method is silently ignored.
- Using `@RegisterLifecycle()` on a class with constructor arguments — manager calls `new ClassConstructor()` with no args; use manual `Register()` instead.
- Multiple `GameLifecycleManager` components in the scene — the second one self-destructs. Keep exactly one on a persistent node.
- Forgetting `IDisposable` on systems holding signal subscriptions or timers — causes leaks on scene reload.

## Gotchas

- **Cocos lifecycle order: onLoad → onEnable → start → update** — wiring listeners in `start` instead of `onEnable` skips the first re-enable cycle.
- **`onDisable` fires on scene close before `onDestroy`** — release resources in `onDestroy`, not `onDisable`, to survive scene navigation.
- **`update` is called even on disabled components in some Cocos versions** — guard with `this.enabled` or migrate to `lateUpdate`.
