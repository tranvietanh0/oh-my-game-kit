---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# DOTween Pro → LitMotion Migration Guide

Based on [official LitMotion migration docs](https://github.com/annulusgames/litmotion/blob/main/docs/articles/en/migrate-from-dotween.md).

## Why Migrate

| Metric | DOTween Pro | LitMotion |
|--------|-------------|-----------|
| Allocation per tween | ~200B managed | **Zero** (struct-based) |
| Performance | Baseline | **2-20x faster** |
| Burst/Jobs | No | **Yes** (internal) |
| License | Paid ($15 Pro) | Free (MIT) |
| GC per frame (100 tweens) | ~20KB | **0KB** |
| Active maintenance | Slow | Active |

## API Mapping Table

### Transform Shortcuts

| DOTween Pro | LitMotion |
|-------------|-----------|
| `transform.DOMove(to, dur)` | `LMotion.Create(transform.position, to, dur).BindToPosition(transform)` |
| `transform.DOMoveX(to, dur)` | `LMotion.Create(pos.x, to, dur).BindToPositionX(transform)` |
| `transform.DOMoveY(to, dur)` | `LMotion.Create(pos.y, to, dur).BindToPositionY(transform)` |
| `transform.DOMoveZ(to, dur)` | `LMotion.Create(pos.z, to, dur).BindToPositionZ(transform)` |
| `transform.DOLocalMove(to, dur)` | `LMotion.Create(lp, to, dur).BindToLocalPosition(transform)` |
| `transform.DOScale(to, dur)` | `LMotion.Create(scale, to, dur).BindToScale(transform)` |
| `transform.DOScaleX(to, dur)` | `LMotion.Create(s.x, to, dur).BindToScaleX(transform)` |
| `transform.DORotate(to, dur)` | `LMotion.Create(euler, to, dur).BindToEulerAngles(transform)` |
| `transform.DOLocalRotate(to, dur)` | `LMotion.Create(le, to, dur).BindToLocalEulerAngles(transform)` |

### UI Shortcuts

| DOTween Pro | LitMotion |
|-------------|-----------|
| `canvasGroup.DOFade(to, dur)` | `LMotion.Create(cg.alpha, to, dur).BindToAlpha(canvasGroup)` |
| `image.DOColor(to, dur)` | `LMotion.Create(img.color, to, dur).BindToColor(image)` |
| `image.DOFade(to, dur)` | `LMotion.Create(img.color.a, to, dur).Bind(a => { var c = img.color; c.a = a; img.color = c; })` |
| `image.DOFillAmount(to, dur)` | `LMotion.Create(img.fillAmount, to, dur).Bind(x => img.fillAmount = x)` |
| `text.DOText(to, dur)` | `LMotion.Create(0, to.Length, dur).Bind(i => text.text = to[..i])` |

### Value Tweens

```csharp
// DOTween: generic value tween
var value = 0f;
DOTween.To(() => value, x => value = x, 10f, 2f);

// LitMotion: cleaner, zero-alloc
LMotion.Create(0f, 10f, 2f)
    .Bind(x => value = x);
```

### Punch & Shake

```csharp
// DOTween
transform.DOPunchPosition(new Vector3(0, 1, 0), 0.5f);
transform.DOShakePosition(0.5f, 0.3f);

// LitMotion
LMotion.Punch.Create(new Vector3(0, 1, 0), 0.5f)
    .BindToPosition(transform);
LMotion.Shake.Create(0.3f, 0.5f)
    .BindToPosition(transform);
```

### Sequences

```csharp
// DOTween
var seq = DOTween.Sequence();
seq.Append(transform.DOMove(pos1, 1f));
seq.Join(transform.DOScale(2f, 1f));
seq.Append(transform.DOMove(pos2, 1f));
seq.AppendInterval(0.5f);

// LitMotion
LSequence.Create()
    .Append(LMotion.Create(pos0, pos1, 1f).BindToPosition(transform))
    .Join(LMotion.Create(1f, 2f, 1f).BindToScaleUniform(transform))
    .Append(LMotion.Create(pos1, pos2, 1f).BindToPosition(transform))
    .AppendInterval(0.5f)
    .Run();  // IMPORTANT: must call .Run()
```

### Callbacks & Configuration

| DOTween Pro | LitMotion |
|-------------|-----------|
| `.SetEase(Ease.OutQuad)` | `.WithEase(Ease.OutQuad)` |
| `.SetDelay(0.5f)` | `.WithDelay(0.5f)` |
| `.SetLoops(3, LoopType.Yoyo)` | `.WithLoops(3, LoopType.Yoyo)` |
| `.OnComplete(() => ...)` | `.WithOnComplete(() => ...)` |
| `.OnUpdate(() => ...)` | Use `.Bind(x => { ...; })` |
| `.SetUpdate(true)` | `.WithScheduler(MotionScheduler.UnscaledUpdate)` |
| `.From()` | Swap start/end: `LMotion.Create(end, start, dur)` |
| `.Kill()` | `handle.Cancel()` |
| `.Complete()` | `handle.Complete()` |

### Lifecycle

```csharp
// DOTween: auto-kill by default, SetAutoKill(false) to keep
transform.DOMove(to, 1f).SetAutoKill(false);

// LitMotion: always use .AddTo() for lifecycle management
LMotion.Create(from, to, 1f)
    .BindToPosition(transform)
    .AddTo(gameObject);  // auto-cancel on destroy
```

## Migration Checklist

1. Remove `using DG.Tweening;` → add `using LitMotion; using LitMotion.Extensions;`
2. Replace `DOTween.Init()` → (not needed, LitMotion auto-initializes)
3. Replace all `.DO*()` shortcuts with `LMotion.Create().BindTo*()` pattern
4. Replace `DOTween.Sequence()` → `LSequence.Create()...Run()`
5. Replace `.Kill()` → `handle.Cancel()`, store `MotionHandle`
6. Add `.AddTo(gameObject)` to all tweens for lifecycle management
7. Replace `.SetUpdate(true)` → `.WithScheduler(MotionScheduler.UnscaledUpdate)`
8. Remove DOTween Pro package from manifest.json
9. Delete `Resources/DOTweenSettings.asset`
10. Run tests — verify all animations behave identically
