---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# FlyingAnimation — API Reference

## Animation Types (FlyingAnimationType)

| Enum value | ID | Description |
|---|---|---|
| `FLOAT_UP` | 0 | Scale pop then float upward, fade out |
| `BOUNCE_UP` | 1 | Multi-bounce upward with scale squash |
| `SPIRAL_UP` | 2 | Helical upward path, 2 full rotations |
| `FOUNTAIN` | 3 | Arc up then fall with random horizontal spread |
| `EXPLODE_OUT` | 4 | Random radial burst outward |
| `ELASTIC_POP` | 5 | Scale pop with elastic wobble then float up |
| `WAVE_MOTION` | 6 | Sinusoidal lateral wave while rising |
| `PUNCH_POSITION` | 13 | DOTween-like spring punch — returns to origin |
| `CURVE_TO_TARGET` | 7 | Cubic Bezier path to `targetNode` |
| `LINEAR_TO_TARGET` | 8 | Direct line to `targetNode` with scale pop |
| `PARABOLA_TO_TARGET` | 9 | Arc over midpoint to `targetNode` |
| `MAGNET_TO_TARGET` | 10 | Shake then accelerating pull to `targetNode` |
| `SPIRAL_TO_TARGET` | 11 | Bounce then decaying spiral to `targetNode` |
| `BOUNCE_TO_TARGET` | 12 | Two-hop bounce landing at `targetNode` |

Target-based types (7–12) fall back to a non-target animation when `targetNode` is null.

## FlyingAnimationConfig Interface

```typescript
interface FlyingAnimationConfig {
    poolKey: string;                      // required — ObjectPool key
    prefab?: Prefab;                      // provide to auto-create pool on first use
    startPosition?: Vec3;                 // world position of spawn
    targetNode?: Node;                    // required for CURVE/LINEAR/PARABOLA/MAGNET/SPIRAL/BOUNCE_TO_TARGET
    animationType?: FlyingAnimationType;  // default FLOAT_UP
    duration?: number;                    // seconds, default 1.0
    count?: number;                       // spawn N nodes staggered 0.05s apart, default 1
    onComplete?: () => void;              // fires after each node finishes + recycles
    onArrive?: () => void;                // fires when node reaches targetNode
    onNodeSpawned?: (node: Node) => void; // hook for per-node customisation (set sprite, color, etc.)
}
```

## FlyingAnimationController API

```typescript
const ctrl = FlyingAnimationController.instance; // finds "FlyingAnimationController" node in scene

// Generic play
await ctrl.playAnimation(config);

// Preset effects
await ctrl.createExplosion(position, poolKey, count, prefab, onNodeSpawned);
await ctrl.createCollectEffect(startPos, targetNode, poolKey, count, prefab, onNodeSpawned);
ctrl.createFountain(position, poolKey, count, prefab);  // fire-and-forget, 0.1s stagger

// Pool management
ctrl.preloadPool(poolKey, prefab, count);  // pre-warm before animation
ctrl.clearAllAnimations();                 // stop + recycle all active nodes
ctrl.getActiveCount();                     // current active animation count (cap: maxActiveAnimations = 50)
```

## Punch Animation Parameters (PUNCH_POSITION)

```typescript
onNodeSpawned: (node) => {
    const anim = node.getComponent(FlyingAnimation);
    anim.punchStrength = new Vec3(40, 40, 0);  // pixels of initial displacement
    anim.punchVibrato = 8;                      // number of spring bounces
    anim.punchElasticity = 0.8;                 // overshoot factor (0–1)
    anim.punchRandomness = 0.5;                 // direction randomness (0–1)
}
```

## Object Pool Integration

Controller auto-manages the pool lifecycle:
1. On first `playAnimation`, if pool missing: loads from `prefab` or async from `resources/`.
2. On completion: `Recycle(node)` back to pool (controller sets `autoDestroy = false`).
3. Pool key must match a prefab name in `resources/` for async loading without `prefab` arg.

`maxActiveAnimations` (default 50) — exceeding it silently skips spawning.

## Cocos tween() Patterns Used Internally

```typescript
// Sequential chain
tween(node)
    .to(0.2, { scale: new Vec3(1.3, 1.3, 1) }, { easing: 'quadOut' })
    .to(0.8, { position: targetPos }, { easing: 'quadIn' })
    .call(() => onDone())
    .start();

// Parallel (position + opacity simultaneously)
tween(node).to(duration, { position: target }).start();
tween(opacityComp).delay(0.5).to(0.5, { opacity: 0 }).start();

// Cleanup — always stop before re-playing
Tween.stopAllByTarget(node);
Tween.stopAllByTarget(opacityComp);
```

Easing strings: `'quadIn'`, `'quadOut'`, `'quadInOut'`, `'backOut'`, `'cubicIn'`, etc.
