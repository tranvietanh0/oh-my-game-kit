---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# UI Optimization

## Canvas Splitting Strategy

Separate canvases by update frequency — any change on a Canvas rebuilds its ENTIRE mesh:

```
Canvas_Static  (Sort 0) — HUD frame, labels that never change → rebuilds: Never
Canvas_Dynamic (Sort 1) — health bars, scores, timers        → rebuilds: Per-frame
Canvas_Overlay (Sort 2) — damage numbers, popups             → rebuilds: On-demand
```

### Rebuild Triggers & Fixes
| Action | Fix |
|--------|-----|
| `SetActive(true/false)` | Use `CanvasGroup.alpha = 0` + `blocksRaycasts = false` |
| Change Text | Use separate canvas for text elements |
| Change Image color | Use material property block |
| Change sprite | Move to separate canvas |

## Raycast Target

**Disable on ALL non-interactive elements** — every raycast checks every element with `Raycast Target = true`.
- Background images, decorative text, icons: OFF
- Only buttons, toggles, sliders: ON

```csharp
[MenuItem("Tools/UI/Find Unnecessary Raycast Targets")]
static void FindRaycastTargets()
{
    foreach (var g in FindObjectsOfType<Graphic>())
        if (g.raycastTarget && g.GetComponent<Selectable>() == null)
            Debug.LogWarning($"Unnecessary: {g.name}", g);
}
```

## TextMeshPro

```csharp
// GOOD: SetText (no GC alloc)
tmpText.SetText("Score: {0}", score);
tmpText.SetText("{0:F1}%", percentage);

// BAD: string concatenation → GC alloc
tmpText.text = "Score: " + score.ToString();

// Pre-warm for used characters
tmpFont.TryAddCharacters("0123456789:.");
```

Font asset: Atlas 512x512, Padding 5, Render Mode SDF (never bitmap for dynamic text).

## Sprite Atlas

```
One atlas per screen/feature. Max size 2048. Compression: ASTC 6x6.
Same atlas + same material = 1 draw call. Different atlases = breaks batch.
  - MainMenu atlas:  all menu UI sprites
  - Gameplay atlas:  all HUD sprites
  - Common atlas:    shared icons/backgrounds
```

## ScrollRect Performance

```csharp
// For 100+ items: pool off-screen items (only render visible + buffer)
scrollRect.inertia = true;
scrollRect.decelerationRate = 0.135f;
scrollRect.scrollSensitivity = 20f;
scrollRect.horizontal = false; // if vertical-only
```

### Nested ScrollRect Fix
```csharp
public sealed class NestedScrollFix : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
{
    ScrollRect _parentScroll = null!;
    bool _routeToParent;
    void Awake() => _parentScroll = GetComponentInParent<ScrollRect>();
    public void OnBeginDrag(PointerEventData e) {
        _routeToParent = Mathf.Abs(e.delta.y) > Mathf.Abs(e.delta.x);
        if (_routeToParent) _parentScroll.OnBeginDrag(e);
    }
    public void OnDrag(PointerEventData e) { if (_routeToParent) _parentScroll.OnDrag(e); }
    public void OnEndDrag(PointerEventData e) { if (_routeToParent) _parentScroll.OnEndDrag(e); }
}
```

## Performance Checklist

- [ ] Static and dynamic UI on separate canvases
- [ ] Raycast Target OFF on non-interactive elements
- [ ] `SetText()` instead of string concat in TMP
- [ ] Sprites in atlases (one atlas per screen)
- [ ] No Layout Groups in runtime UI (pre-calculate positions)
- [ ] `CanvasGroup.alpha` for show/hide (not `SetActive`)
- [ ] Pooled scroll list items for large lists
- [ ] Overdraw check: Scene > Overdraw visualization
