---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# Layouts, ScrollRect & Drag-and-Drop

## Layout Groups

### HorizontalLayoutGroup / VerticalLayoutGroup
```csharp
var hlg = parent.AddComponent<HorizontalLayoutGroup>();
hlg.spacing = 8f;
hlg.childAlignment = TextAnchor.MiddleLeft;
hlg.childControlWidth = true;    // layout controls child width
hlg.childControlHeight = true;
hlg.childForceExpandWidth = false; // don't stretch children
hlg.childForceExpandHeight = false;
hlg.padding = new RectOffset(10, 10, 5, 5); // left, right, top, bottom
```

### GridLayoutGroup (Inventory Slots)
```csharp
var grid = container.AddComponent<GridLayoutGroup>();
grid.cellSize = new Vector2(64, 64);
grid.spacing = new Vector2(4, 4);
grid.startCorner = GridLayoutGroup.Corner.UpperLeft;
grid.startAxis = GridLayoutGroup.Axis.Horizontal;
grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
grid.constraintCount = 8;
grid.childAlignment = TextAnchor.UpperLeft;
```

### LayoutElement (Override Sizing)
```csharp
var le = child.AddComponent<LayoutElement>();
le.preferredWidth = 100;
le.preferredHeight = 50;
le.flexibleWidth = 1; // takes remaining space
le.ignoreLayout = false;
```

### ContentSizeFitter
```csharp
var csf = go.AddComponent<ContentSizeFitter>();
csf.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
```

## ScrollRect (Scrollable Content)

```csharp
// Structure: ScrollView → Viewport (mask) → Content (layout)
var scrollGO = CreateUIElement("ScrollView", canvas.transform);
var scroll = scrollGO.gameObject.AddComponent<ScrollRect>();
scrollGO.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0.3f);

var viewport = CreateUIElement("Viewport", scrollGO);
viewport.gameObject.AddComponent<Image>().color = Color.clear;
viewport.gameObject.AddComponent<Mask>().showMaskGraphic = false;
viewport.anchorMin = Vector2.zero;
viewport.anchorMax = Vector2.one;
viewport.offsetMin = viewport.offsetMax = Vector2.zero;

var content = CreateUIElement("Content", viewport);
content.anchorMin = new Vector2(0, 1);
content.anchorMax = new Vector2(1, 1);
content.pivot = new Vector2(0, 1);
var csf = content.gameObject.AddComponent<ContentSizeFitter>();
csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
content.gameObject.AddComponent<VerticalLayoutGroup>();

scroll.viewport = viewport;
scroll.content = content;
scroll.horizontal = false;
scroll.vertical = true;
scroll.movementType = ScrollRect.MovementType.Clamped;
```

## Drag-and-Drop (Inventory Pattern)

### Draggable Item
```csharp
using UnityEngine.EventSystems;

public class DraggableItem : MonoBehaviour,
    IBeginDragHandler, IDragHandler, IEndDragHandler
{
    private Canvas _canvas;
    private RectTransform _rt;
    private CanvasGroup _cg;
    [HideInInspector] public Transform OriginalParent;

    void Awake()
    {
        _rt = GetComponent<RectTransform>();
        _cg = GetComponent<CanvasGroup>();
        _canvas = GetComponentInParent<Canvas>();
    }

    public void OnBeginDrag(PointerEventData e)
    {
        OriginalParent = transform.parent;
        transform.SetParent(_canvas.transform); // move to top
        transform.SetAsLastSibling();
        _cg.blocksRaycasts = false; // allow drop detection
        _cg.alpha = 0.7f;
    }

    public void OnDrag(PointerEventData e)
    {
        _rt.anchoredPosition += e.delta / _canvas.scaleFactor;
    }

    public void OnEndDrag(PointerEventData e)
    {
        _cg.blocksRaycasts = true;
        _cg.alpha = 1f;
        if (transform.parent == _canvas.transform)
            transform.SetParent(OriginalParent); // snap back
    }
}
```

### Drop Slot
```csharp
public class DropSlot : MonoBehaviour, IDropHandler
{
    public void OnDrop(PointerEventData e)
    {
        var dragged = e.pointerDrag;
        if (dragged == null) return;

        var item = dragged.GetComponent<DraggableItem>();
        if (item == null) return;

        // Swap if slot already has child
        if (transform.childCount > 0)
        {
            var existing = transform.GetChild(0);
            existing.SetParent(item.OriginalParent);
        }

        dragged.transform.SetParent(transform);
        dragged.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
    }
}
```

### Required Components Per Element
- **Slot**: `Image` + `DropSlot` | **Item**: `Image` + `CanvasGroup` (required!) + `DraggableItem`, stretch-anchored inside slot
## Gotchas
- **CanvasGroup required** — `blocksRaycasts = false` lets OnDrop fire on slot beneath; divide `e.delta` by `Canvas.scaleFactor` for correct drag speed
- **SetAsLastSibling** — ensures dragged item renders on top
- **Mask vs RectMask2D** — RectMask2D is faster (no stencil), use for rectangular scroll areas
