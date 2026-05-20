---
name: omg-cocos-playable-utilities
description: "MathUtils, ArrayUtils, VecUtils, CoordinateUtils, TimeUtils — pure math and data helpers for Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Utility Modules — Math, Array, Vector, Coordinate, Time

Pure static utility classes in `PLAGameFoundation/utils/`. All are exported from `index.ts`. See also: `omg-cocos-playable-gameflow` (where utils are consumed), `omg-cocos-playable-async-utilities` (timing helpers).

Import path: `db://assets/PLAGameFoundation/utils/{ClassName}`
Or barrel: `db://assets/PLAGameFoundation/utils/index`

## MathUtils

Scalar math — no Cocos dependency except `Vec2`/`Vec3` for geometry methods.

```typescript
MathUtils.clamp(value, min, max)                // clamps, t clamped to [0,1] in lerp/smoothLerp
MathUtils.lerp(start, end, t)                   // linear, t auto-clamped [0,1]
MathUtils.smoothLerp(start, end, t)             // smoothstep ease-in-out
MathUtils.randomRange(min, max)                 // float [min, max]
MathUtils.randomInt(min, max)                   // integer [min, max] inclusive
MathUtils.randomElement(array)                  // returns T | undefined (empty-safe)
MathUtils.remap(value, fromMin, fromMax, toMin, toMax)
MathUtils.approximately(a, b, epsilon?)         // default epsilon 0.0001
MathUtils.degToRad(degrees)
MathUtils.radToDeg(radians)
MathUtils.distance(a: Vec3, b: Vec3)            // delegates to Vec3.distance
MathUtils.distance2D(a: Vec2, b: Vec2)          // delegates to Vec2.distance
MathUtils.angleBetweenPoints(from: Vec2, to: Vec2)  // returns degrees
MathUtils.directionFromAngle(angleDegrees)      // returns Vec2 unit vector
```

## ArrayUtils

Depends on `MathUtils.randomInt` for shuffle.

```typescript
ArrayUtils.shuffle(array)          // in-place Fisher-Yates, returns same array
ArrayUtils.shuffled(array)         // returns new shuffled copy
ArrayUtils.remove(array, element)  // splice by value, returns true if found
ArrayUtils.last(array)             // T | undefined
ArrayUtils.first(array)            // T | undefined
ArrayUtils.isEmpty(array)          // boolean
ArrayUtils.unique(array)           // deduplicate via Set (reference equality)
```

## VecUtils

Vector operations returning new instances (non-mutating inputs).

```typescript
VecUtils.lerpVec3(start, end, t)               // returns new Vec3
VecUtils.lerpVec2(start, end, t)               // returns new Vec2
VecUtils.direction(from: Vec3, to: Vec3)        // normalized Vec3
VecUtils.direction2D(from: Vec2, to: Vec2)      // normalized Vec2
VecUtils.addRandomOffset(position: Vec3, range: Vec3)  // random ±range per axis
VecUtils.pointOnCircle(center: Vec2, radius, angleDegrees)
VecUtils.randomPointInCircle(center: Vec2, radius)
VecUtils.rotateVec2(vec: Vec2, angleDegrees)
```

## CoordinateUtils

3D/UI space conversions. Requires live camera and scene.

```typescript
// 3D world → UI canvas position (returns null if camera not ready)
CoordinateUtils.worldToUIPosition(worldPosition: Vec3, camera: Camera, uiNode: Node): Vec3 | null

// Screen pixel → 3D world (ray cast at distance, default 10)
CoordinateUtils.screenToWorldPosition(screenPos: Vec2, camera: Camera, distance?: number): Vec3

// UI node world position → screen pixel
CoordinateUtils.uiToScreenPosition(uiNode: Node): Vec2
```

## TimeUtils

Formatting only — no Cocos dependency.

```typescript
TimeUtils.formatTime(seconds)           // "MM:SS"
TimeUtils.formatTimeWithHours(seconds)  // "HH:MM:SS"
TimeUtils.formatMilliseconds(ms)        // "1.234s"
```

## Workflow: When to Use vs Native JS

| Need | Use |
|------|-----|
| Clamped random float | `MathUtils.randomRange` not `Math.random()` |
| Random array item | `MathUtils.randomElement` — handles empty array |
| Shuffle in-place | `ArrayUtils.shuffle` not `.sort(() => Math.random())` |
| Remove by value | `ArrayUtils.remove` not `filter` when modifying original |
| Vec lerp | `VecUtils.lerpVec3` not manual component-wise lerp |
| Angle from points | `MathUtils.angleBetweenPoints` → degrees ready for Cocos |
| Track position in UI | `CoordinateUtils.worldToUIPosition` — null-guard the result |

## Common Mistakes

- `randomInt(0, array.length - 1)` when `array.length === 0` → returns 0 (use `randomElement` instead, it checks empty).
- `CoordinateUtils.worldToUIPosition` returns `null` if `camera._camera` not initialized — always null-check.
- `ArrayUtils.unique` uses reference equality; won't deduplicate plain objects with same values.
- `VecUtils` methods return **new** Vec instances — do not compare with `===`.
- `smoothLerp` uses smoothstep (cubic), not exponential ease — don't use for frame-rate independent movement.

## Gotchas

- **`Math.random()` is not seedable** — for replay determinism use a seeded RNG utility, not the platform default.
- **JSON parsing untrusted strings throws** — wrap third-party SDK responses in try/catch.
- **Vec3 multiply mutates in some Cocos versions** — always confirm if you need `.clone()` before passing to a builder.
