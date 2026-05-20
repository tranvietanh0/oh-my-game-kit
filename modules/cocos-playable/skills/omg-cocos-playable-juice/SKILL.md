---
name: omg-cocos-playable-juice
description: "JuiceKit static tween helpers and ScreenEffects Component for game-feel effects in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# JuiceKit & ScreenEffects

Static tween helpers (`JuiceKit`) and a scene-singleton Component (`ScreenEffects`) for common game-feel effects. No dependencies on SignalBus or ObjectPool — pure Cocos `tween()` API. See also: `omg-cocos-playable-animation-core` for pooled flying effects.

Import paths:
- `db://assets/PLAGameFoundation/juice/JuiceKit`
- `db://assets/PLAGameFoundation/juice/ScreenEffects`

## JuiceKit API (static methods)

All methods call `Tween.stopAllByTarget(node)` before starting, so they are safe to call on a node that may already be animating.

| Method | Signature | Description |
|---|---|---|
| `scalePunch` | `(node, strength=0.3, duration=0.3)` | Scale to `1+strength` then return with elastic overshoot |
| `shake` | `(node, intensity=10, duration=0.3)` | 8-step positional shake with decay, returns to origin |
| `bounce` | `(node, height=50, bounces=3, duration=0.6)` | Jump up then bounce down with halving height |
| `squashAndStretch` | `(node, squashScale=0.7, stretchScale=1.3, duration=0.4)` | Classic cartoon deform sequence |
| `punchRotation` | `(node, angle=15, duration=0.3)` | Rotate to `+angle`, back to `-angle*0.5`, return with elastic |
| `fadeIn` | `(node, duration=0.3)` | Fade `UIOpacity` from 0 to 255 (auto-adds component if missing) |
| `fadeOut` | `(node, duration=0.3)` | Fade `UIOpacity` from 255 to 0 |
| `popIn` | `(node, duration=0.3)` | Scale from 0 to original with `backOut` overshoot |
| `popOut` | `(node, duration=0.2)` | Quick scale-up then scale to 0 |

All methods return the `Tween<Node>` or `Tween<UIOpacity>` instance (already started).

## ScreenEffects API (Component singleton)

Attach to a persistent node on the Canvas root. Assign `camera` property in the Inspector for `zoom()` to work.

```typescript
ScreenEffects.instance   // set in onLoad, cleared in onDestroy
```

| Method | Signature | Description |
|---|---|---|
| `flash` | `(color=Color.WHITE, duration=0.3)` | Full-screen color overlay that fades in/out |
| `zoom` | `(factor=1.2, duration=0.3)` | Camera FOV punch — requires `camera` property set |
| `vignette` | `(intensity=0.5, duration=0.5)` | Black-edge darkening overlay at given opacity |

Overlay nodes are created lazily on first call and reused. They are destroyed in `onDestroy`.

## Usage Examples

**Scale punch on coin collect:**
```typescript
import { JuiceKit } from "db://assets/PLAGameFoundation/juice/JuiceKit";

JuiceKit.scalePunch(coinNode, 0.4, 0.25);
```

**Shake UI on wrong answer:**
```typescript
JuiceKit.shake(this.panelNode, 15, 0.4);
```

**Screen flash + zoom on win:**
```typescript
import { ScreenEffects } from "db://assets/PLAGameFoundation/juice/ScreenEffects";
import { Color } from "cc";

ScreenEffects.instance.flash(new Color(255, 220, 0, 255), 0.4);
ScreenEffects.instance.zoom(1.15, 0.3);
```

**Pop in a reward panel:**
```typescript
JuiceKit.popIn(this.rewardPanelNode, 0.35);
```

**Smooth parabolic arc (coin fly, projectile) — Bezier via progress scalar:**
```typescript
import { tween, Vec3 } from "cc";

// DO NOT chain two .to(midPos).to(target) tweens — that produces a kinked
// chord path (two straight segments meeting at apex) with zero velocity at
// the junction. With small arcHeight the two chords look colinear → flies
// in a straight line.
//
// Correct: tween a {t: 0->1} scalar with sineInOut easing, write
// quadratic Bezier worldPosition each frame.
const start = node.worldPosition.clone();
const end = targetWorldPos.clone();
// Flight-axis-aware apex: perpendicular unit vector × signed magnitude.
// (For pure-Y "lob" you can use Vec3(midX, midY+arcHeight, 0) directly.)
const dir = Vec3.subtract(new Vec3(), end, start);
const perp = new Vec3(-dir.y, dir.x, 0).normalize();
const mid = Vec3.lerp(new Vec3(), start, end, 0.5).add(perp.multiplyScalar(arcHeight));
const tmp = new Vec3();
const progress = { t: 0 };
tween(progress)
  .to(0.6, { t: 1 }, {
    easing: "sineInOut",
    onUpdate: () => {
      const u = 1 - progress.t;
      // B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
      Vec3.multiplyScalar(tmp, start, u * u);
      tmp.add(Vec3.multiplyScalar(new Vec3(), mid, 2 * u * progress.t));
      tmp.add(Vec3.multiplyScalar(new Vec3(), end, progress.t * progress.t));
      node.setWorldPosition(tmp);  // prefer setter over tweening .worldPosition directly
    },
  })
  .start();
```

Matches the `LoadingView.ts:72` / `turn-progress-controller.ts:65` codebase pattern.

## Integration Points

- `JuiceKit` has zero dependencies — import and call anywhere.
- `ScreenEffects` requires a Component node in the scene. Wire `camera` via Inspector if using `zoom()`.
- Combine with `ScoreTracker` signals: subscribe to `ScoreChangedSignal`, then call `JuiceKit.scalePunch` on the score label node.
- Combine with `TutorialSequence`: call `JuiceKit.popIn` on tutorial nodes when they appear.

## Common Mistakes

- Calling `JuiceKit.fadeIn/fadeOut` on a node without `UIOpacity` — the methods auto-add the component, but if the node also drives opacity elsewhere (e.g. a tween on the parent's `UIOpacity`), there may be conflicts. Prefer explicit component management.
- Not assigning `camera` on the `ScreenEffects` component in the Inspector — `zoom()` silently returns without a camera reference.
- Overlapping calls on the same node without intending to cancel: `JuiceKit` methods stop existing tweens, so calling two effects back-to-back on the same node cancels the first. Use different child nodes or accept the cancellation behavior.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.
- **Two-phase tween for "curved" flight produces a straight line.** Writing `tween(node).to(d/2, { worldPosition: mid }, { easing: "quadOut" }).to(d/2, { worldPosition: end }, { easing: "quadIn" })` makes a kinked chord path (two straight segments meeting at apex) with **zero velocity at the junction**. With small `arcHeight` relative to flight distance the two chords look colinear — indistinguishable from a straight `.to(end)`. For genuine parabolic arcs, tween a `{t:0->1}` scalar with `sineInOut` and write `node.setWorldPosition(...)` along a quadratic Bezier in `onUpdate` (see Usage Examples). For flight-axis-aware curves, compute apex offset as `perpUnit(start,end) * arcHeight`, NOT as a fixed `+Y` — pure-Y bends look wrong on horizontal flights.
- **Tweening `node.worldPosition` directly is slower and reference-fragile.** The property setter triggers extra dirty-flag plumbing per frame, and the read returns a shared `Vec3` whose mutation can desync if anything else holds the ref. Prefer `tween(scalar).onUpdate(() => node.setWorldPosition(vec))` — single computed value passed via setter, no shared-ref hazard. Codebase precedent: `LoadingView.ts:72`, `turn-progress-controller.ts:65`.

## Gotchas

- **Screen shake on phones can amplify motion-sickness** — gate behind a settings toggle for accessibility.
- **Hit-stop > 100ms feels like a freeze**, not a hit.
- **Particle counts at 60fps mid-tier Android: ~50** — past that, frame skipping kills feel rather than amplifies it.
- **Visual debugging "curves" that look straight = chord-tween bug, not arcHeight tuning.** First check whether the path is a Bezier or a two-`.to()` chain. Increasing `arcHeight` on a chord-path just makes a taller V-shape, not a smoother curve.
