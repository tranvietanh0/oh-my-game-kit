---
name: omg-cocos-playable-animation-core
description: "FlyingAnimation and FlyingAnimationController with object pool integration for Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# FlyingAnimation & FlyingAnimationController

Pooled particle-like animation system built on Cocos `tween()`. `FlyingAnimation` is the per-node Component; `FlyingAnimationController` is the scene singleton that manages spawning and pooling. See also: `omg-cocos-playable-signalbus`.

Import paths:
- `db://assets/PLAGameFoundation/animations/FlyingAnimation`
- `db://assets/PLAGameFoundation/animations/FlyingAnimationController`

## Details

- [API reference: animation types, config interface, controller API, tween patterns](references/api-reference.md)
- [Usage examples: collect effect, explosion, float-up text](references/usage-examples.md)

## Common Mistakes

- Not calling `Tween.stopAllByTarget(node)` before replaying on a pooled node — old tweens persist after recycle.
- Setting `autoDestroy = true` when using the controller — controller handles pooling; `autoDestroy` must stay `false`.
- Passing `targetNode` for a non-target animation type — ignored silently; check enum group.
- Forgetting `UIOpacity` component on prefab — `FlyingAnimation.onLoad` auto-adds it, but only after the node is active in the scene.

## Gotchas

- **Animation clip references hold scene assets — they don't unload until the component is destroyed** — disable doesn't free.
- **Skeletal animation events fire on the animation thread; UI mutation must marshal to main**.
