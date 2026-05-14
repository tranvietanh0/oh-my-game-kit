---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# LitMotion Advanced Features

## Sequences (LSequence)

```csharp
// Sequential
LSequence.Create()
    .Append(LMotion.Create(Vector3.zero, Vector3.right * 5, 0.5f).BindToPosition(transform))
    .Append(LMotion.Create(Vector3.one, Vector3.one * 1.5f, 0.3f).BindToScale(transform))
    .Run().AddTo(gameObject);

// Parallel
LSequence.Create()
    .Join(LMotion.Create(0f, 1f, 0.3f).BindToAlpha(canvasGroup))
    .Join(LMotion.Create(Vector3.zero, Vector3.one, 0.3f).BindToScale(transform))
    .Run().AddTo(gameObject);
```

Methods: `.Append(handle)` sequential, `.Join(handle)` parallel, `.AppendInterval(s)` pause, `.AppendCallback(action)` callback.

## Punch & Shake

```csharp
// Punch: single impact decays to original
LMotion.Punch.Create(Vector3.up * 0.5f, 0.4f).BindToPosition(transform).AddTo(gameObject);

// Shake: random oscillation decays to original
LMotion.Shake.Create(Vector3.one * 0.3f, 0.5f).BindToPosition(transform).AddTo(gameObject);

// Configure
LMotion.Punch.Create(Vector3.up * 1f, 0.5f)
    .WithFrequency(10).WithDampingRatio(0.5f)
    .BindToPosition(transform).AddTo(gameObject);
```

Note: Punch/Shake return to **original value**, not to `from` — they offset from current position.

## TextMeshPro Animation

```csharp
// Fade in each character sequentially
for (int i = 0; i < text.textInfo.characterCount; i++)
    LMotion.Create(0f, 1f, 0.3f).WithDelay(i * 0.05f).WithEase(Ease.OutQuad)
        .BindToTMPCharColor(text, i).AddTo(gameObject);

// Wave effect
for (int i = 0; i < text.textInfo.characterCount; i++)
    LMotion.Create(Vector3.zero, Vector3.up * 10f, 0.5f)
        .WithDelay(i * 0.08f).WithLoops(-1, LoopType.Yoyo)
        .BindToTMPCharPosition(text, i).AddTo(gameObject);
```

Requires `text.ForceMeshUpdate()` if text changes dynamically before animating.

## String Animation

```csharp
// Zero-allocation text interpolation (128-byte buffer)
LMotion.String.Create128Bytes("", "Hello World!", 1f).BindToText(tmpText).AddTo(gameObject);
```

## Async/Await (UniTask)

```csharp
await LMotion.Create(0f, 1f, 0.5f).BindToAlpha(canvasGroup).ToUniTask(cancellationToken);
```

Requires separate package: `com.annulusgames.lit-motion.unitask`

## Custom Adapter

```csharp
public readonly struct MyTypeAdapter : IMotionAdapter<MyType, NoOptions>
{
    public MyType Evaluate(ref MyType start, ref MyType end, ref NoOptions opts, in MotionEvaluationContext ctx)
        => MyType.Lerp(start, end, ctx.Progress);
}
LMotion.Create<MyType, NoOptions, MyTypeAdapter>(start, end, 1f).Bind(x => myField = x).AddTo(gameObject);
```

## Debugging

```csharp
MotionTracker.EnableTracking = true;
// Window → LitMotion → Motion Debugger to view active motions
```

## Gotchas

- Don't reuse MotionBuilders after `.Append()`/`.Join()` in sequences
- UniTask integration is a separate package install
- Sequences run already-built motions — build the motion handle first, then pass to sequence
