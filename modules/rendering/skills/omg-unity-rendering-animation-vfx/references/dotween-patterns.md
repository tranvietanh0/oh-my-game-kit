---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# DOTween Patterns

## Setup
```
Install: DOTween (HOTween v2) from Asset Store or OpenUPM
After import: Tools > Demigiant > DOTween Utility Panel > Setup
Enable ASMDEF integration for assembly definitions
```

## Core Tweens

```csharp
// Transform
transform.DOMove(target, 0.5f).SetEase(Ease.OutQuad);
transform.DOLocalMove(localTarget, 0.5f);
transform.DORotate(new Vector3(0, 180, 0), 0.3f);
transform.DOScale(Vector3.one * 1.2f, 0.2f);
transform.DOPunchScale(Vector3.one * 0.1f, 0.3f);

// Color/Alpha
spriteRenderer.DOColor(Color.red, 0.2f);
canvasGroup.DOFade(0f, 0.3f);
material.DOColor(Color.white, "_EmissionColor", 0.1f);

// Value
DOTween.To(() => health, x => health = x, targetHealth, 0.5f);
```

### Easing Quick Reference
| Ease | Use Case |
|------|----------|
| OutQuad | UI panels sliding in |
| InOutQuad | Camera transitions |
| OutBack | Bouncy popup appearance |
| OutElastic | Springy button feedback |
| InQuad | UI panels sliding out |
| Linear | Progress bars, timers |
| OutBounce | Item drops, landing |

## Sequences

```csharp
DOTween.Sequence()
    .Append(panel.DOFade(1f, 0.2f))
    .Join(panel.transform.DOScale(1f, 0.3f).SetEase(Ease.OutBack))
    .AppendInterval(0.1f)
    .AppendCallback(() => OnPopupShown());

// Dismiss
DOTween.Sequence()
    .Append(panel.DOFade(0f, 0.15f))
    .Join(panel.transform.DOScale(0.9f, 0.15f).SetEase(Ease.InQuad))
    .OnComplete(() => panel.gameObject.SetActive(false));
```

## Memory Management (CRITICAL)

```csharp
// ALWAYS kill on destroy — leaks if not cleaned up
void OnDestroy() { transform.DOKill(); _sequence?.Kill(); }

// VContainer IDisposable
public void Dispose() => DOTween.Kill(this);

// Batch kill by ID
transform.DOMove(target, 0.5f).SetId("level_anims");
DOTween.Kill("level_anims");

// Reusable tween
var tween = transform.DOMove(target, 0.5f).SetAutoKill(false).Pause();
tween.Restart(); // replay
tween.Kill();    // manual cleanup required
```

## Common UI Animations

```csharp
// Button press
void OnButtonPress(Transform button) => button.DOKill().DOPunchScale(Vector3.one * -0.1f, 0.15f, 5, 0.5f);

// Number counter
DOTween.To(() => from, x => text.SetText("{0}", x), to, 0.5f).SetEase(Ease.OutQuad);

// Camera shake (damage)
Camera.main.DOShakePosition(0.3f, 0.5f, 10, 90f, false, true);

// UI shake (error)
errorPanel.DOShakeAnchorPos(0.3f, 10f, 20, 90f);
```

## UniTask Integration

```csharp
await item.DOScale(1.5f, 0.2f).SetEase(Ease.OutBack).ToUniTask(cancellationToken: ct);
await item.DOMove(targetPos, 0.5f).SetEase(Ease.InQuad).ToUniTask(cancellationToken: ct);
```
