---
name: omg-cocos-playable-fsm
description: "StateManager FSM singleton with decorator-based registration and async state transitions for playable ad game flow"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# State Machine (FSM)

Singleton `StateManager` with type-safe, async state transitions. States self-register via `@State` decorator at module load time. See `omg-cocos-playable-gameflow` for how `GameView` drives the flow.

## Details

- [API reference: architecture, APIs, decorator registration](references/api-reference.md)
- [Workflow examples: typical ad flow, state definition, transitions, update loop](references/workflow-examples.md)

## Common Mistakes

- Importing state files after calling `changeState()` — `@State` decorator runs at import time; states not imported are not registered
- Not awaiting `changeState()` — `onEnter` may not complete before next logic runs
- Subscribing signals in `onEnter` without unsubscribing in `onExit` — signal leaks persist across states
- Calling `sm.reset()` mid-transition — leaves currentState inconsistent; only use on scene reload
- Implementing constructor logic instead of `onEnter` — `@State` calls `new StateClass()` at decoration time, before game starts

## Gotchas

- **Decorator order matters** — `@State` must run before `StateManager.start()`; if a state-file is tree-shaken out at build, the decorator never runs and the state silently isn't registered. Import the state files explicitly from a barrel.
- **Async transitions must await previous-state cleanup** — racing `enter()` of state B before `exit()` of state A finishes leaks subscriptions.
- **Singleton survives scene reload** — call `StateManager.reset()` on scene replay or stale state leaks across replays.
