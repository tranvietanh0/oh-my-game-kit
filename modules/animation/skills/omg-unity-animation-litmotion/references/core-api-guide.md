---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# LitMotion Core API

## LMotion.Create

Creates a `MotionBuilder` that animates a value from `start` to `end` over `duration` seconds.

```csharp
// Float
LMotion.Create(0f, 10f, 2f).Bind(x => Debug.Log(x));

// Vector3
LMotion.Create(Vector3.zero, Vector3.one, 1f).BindToPosition(transform);

// Color
LMotion.Create(Color.white, Color.red, 0.5f).BindToColor(spriteRenderer);

// Int
LMotion.Create(0, 100, 1f).Bind(x => score = x);
```

**Supported types:** `float`, `double`, `int`, `long`, `Vector2`, `Vector3`, `Vector4`, `Quaternion`, `Color`, `Rect`

## MotionBuilder Chain

`LMotion.Create()` returns a `MotionBuilder<TValue, TOptions, TAdapter>`. Chain configuration then call `.Bind()` or `.BindTo*()`.

```csharp
LMotion.Create(0f, 1f, 0.5f)
    .WithEase(Ease.OutQuad)       // easing curve
    .WithDelay(0.2f)              // start delay
    .WithLoops(3, LoopType.Yoyo) // repeat 3x
    .WithOnComplete(() => Debug.Log("Done"))
    .Bind(x => alpha = x)
    .AddTo(gameObject);           // lifecycle binding
```

## MotionHandle

`.Bind()` and `.BindTo*()` return a `MotionHandle` struct for controlling active motions.

```csharp
var handle = LMotion.Create(0f, 1f, 1f).BindToPositionX(transform);

// Control
handle.Cancel();        // stop immediately
handle.Complete();      // jump to end value
handle.PlaybackSpeed = 2f; // double speed

// Status
bool active = handle.IsActive();   // still running?
float progress = handle.Time;      // current time
```

**Important:** `MotionHandle` is a struct — store it if you need to cancel later. Calling `.Cancel()` on an inactive handle is safe (no-op).

## Binding Methods

### Lambda Bind
```csharp
LMotion.Create(0f, 1f, 1f).Bind(x => myField = x);
```

### BindTo Shortcuts (Transform)
```csharp
.BindToPosition(transform)        // Vector3 → position
.BindToPositionX(transform)       // float → position.x
.BindToPositionY(transform)       // float → position.y
.BindToPositionZ(transform)       // float → position.z
.BindToLocalPosition(transform)   // Vector3 → localPosition
.BindToLocalPositionX(transform)  // float → localPosition.x
.BindToScale(transform)           // Vector3 → localScale
.BindToLocalScaleX(transform)     // float → localScale.x
.BindToRotation(transform)        // Quaternion → rotation
.BindToEulerAngles(transform)     // Vector3 → eulerAngles
.BindToLocalEulerAnglesZ(transform) // float → localEulerAngles.z
```

### BindTo Shortcuts (UI / Renderer)
```csharp
.BindToColor(renderer)            // Color → material.color
.BindToAlpha(canvasGroup)         // float → CanvasGroup.alpha
.BindToColorR(graphic)            // float → color.r
.BindToFillAmount(image)          // float → Image.fillAmount
.BindToSizeDelta(rectTransform)   // Vector2 → sizeDelta
.BindToAnchoredPosition(rectTf)  // Vector2 → anchoredPosition
```

## Lifecycle Management

**Always bind to a GameObject** to prevent leaked motions:

```csharp
// Auto-cancel when gameObject is destroyed
LMotion.Create(0f, 1f, 1f)
    .Bind(x => val = x)
    .AddTo(gameObject);

// Or use a CancellationToken
LMotion.Create(0f, 1f, 1f)
    .Bind(x => val = x)
    .AddTo(destroyCancellationToken);
```

## Gotchas

- Forgetting `.AddTo()` causes motions to leak if the target is destroyed mid-tween
- `MotionHandle` becomes invalid after the motion completes — check `.IsActive()` first
- `.Bind()` callback runs every frame — keep it lightweight (no allocations)
- `LMotion.Create` with mismatched types won't compile — use correct overload for Vector3, Color, etc.
