---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# LitMotion Configuration

## Easing

```csharp
.WithEase(Ease.OutQuad)          // most common for UI
.WithEase(Ease.OutBack)          // overshoot bounce
.WithEase(Ease.OutElastic)       // spring effect
.WithEase(Ease.Linear)           // constant speed
.WithEase(animationCurve)        // custom AnimationCurve
```

**All Ease options:** `Linear`, `InSine/OutSine/InOutSine`, `InQuad/OutQuad/InOutQuad`, `InCubic/OutCubic/InOutCubic`, `InQuart/OutQuart/InOutQuart`, `InQuint/OutQuint/InOutQuint`, `InExpo/OutExpo/InOutExpo`, `InCirc/OutCirc/InOutCirc`, `InBack/OutBack/InOutBack`, `InElastic/OutElastic/InOutElastic`, `InBounce/OutBounce/InOutBounce`

## Delay

```csharp
.WithDelay(0.5f)  // delay before start (default: FirstLoop only)

.WithDelay(0.3f, DelayType.EveryLoop)  // delay each loop iteration

.WithDelay(0.3f, DelayType.FirstLoop, skipValuesDuringDelay: false)
// false = Bind callback runs with start value during delay
```

**Parameters:**
- `duration` — delay in seconds
- `delayType` — `DelayType.FirstLoop` (default) or `DelayType.EveryLoop`
- `skipValuesDuringDelay` — if `true` (default), Bind is not called during delay

## Loops

```csharp
.WithLoops(3)                          // repeat 3 times (Restart)
.WithLoops(3, LoopType.Yoyo)          // ping-pong 3 times
.WithLoops(-1, LoopType.Restart)      // infinite loop
```

**LoopType options:**
| Type | Behavior |
|------|----------|
| `Restart` | Resets to start value each loop |
| `Yoyo` | Alternates forward/backward |
| `Flip` | Swaps start/end each loop |
| `Increment` | Accumulates value each loop (start += delta per loop) |

## Callbacks

```csharp
.WithOnComplete(() => Debug.Log("Finished"))
.WithOnCancel(() => Debug.Log("Cancelled"))
.WithOnLoopComplete(() => Debug.Log("Loop done"))
// OnLoopComplete fires before OnComplete on final loop
```

## Playback Speed

```csharp
var handle = LMotion.Create(0f, 1f, 1f).Bind(x => val = x);
handle.PlaybackSpeed = 0.5f;  // half speed
handle.PlaybackSpeed = -1f;   // reverse playback
handle.PlaybackSpeed = 0f;    // pause
```

## Scheduler

Control when the motion updates:

```csharp
.WithScheduler(MotionScheduler.Update)          // default
.WithScheduler(MotionScheduler.LateUpdate)       // after Update
.WithScheduler(MotionScheduler.FixedUpdate)      // physics step
.WithScheduler(MotionScheduler.Manual)           // call manually
```

## Common Recipes

**Fade in UI element:**
```csharp
LMotion.Create(0f, 1f, 0.3f)
    .WithEase(Ease.OutQuad)
    .BindToAlpha(canvasGroup)
    .AddTo(gameObject);
```

**Scale bounce on spawn:**
```csharp
LMotion.Create(Vector3.zero, Vector3.one, 0.4f)
    .WithEase(Ease.OutBack)
    .BindToScale(transform)
    .AddTo(gameObject);
```

**Pulse loop:**
```csharp
LMotion.Create(1f, 1.2f, 0.5f)
    .WithEase(Ease.InOutSine)
    .WithLoops(-1, LoopType.Yoyo)
    .BindToLocalScaleX(transform)
    .AddTo(gameObject);
```

## Gotchas

- `WithLoops(-1)` = infinite — must be cancelled manually or via `.AddTo()`
- `PlaybackSpeed = -1` only works if motion has remaining time
- `WithDelay` with `EveryLoop` adds delay to EVERY iteration including the first
- Callbacks allocate a delegate — use sparingly in hot paths
