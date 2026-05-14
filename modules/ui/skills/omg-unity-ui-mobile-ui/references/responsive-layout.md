---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# Responsive Layout

## Safe Area

### Universal SafeArea Component
```csharp
[RequireComponent(typeof(RectTransform))]
public sealed class SafeAreaHandler : MonoBehaviour
{
    RectTransform _rt = null!;
    Rect _lastSafeArea;

    void Awake() => _rt = GetComponent<RectTransform>();

    void Update()
    {
        if (_lastSafeArea == Screen.safeArea) return;
        ApplySafeArea();
    }

    void ApplySafeArea()
    {
        _lastSafeArea = Screen.safeArea;
        var minAnchor = _lastSafeArea.position;
        var maxAnchor = _lastSafeArea.position + _lastSafeArea.size;
        minAnchor.x /= Screen.width;
        minAnchor.y /= Screen.height;
        maxAnchor.x /= Screen.width;
        maxAnchor.y /= Screen.height;

        _rt.anchorMin = minAnchor;
        _rt.anchorMax = maxAnchor;
    }
}
```

### Canvas Setup Hierarchy
```
Canvas (Screen Space - Overlay)
├── SafeAreaPanel (attach SafeAreaHandler)
│   ├── TopBar (anchored top)
│   ├── Content (stretch fill)
│   └── BottomNav (anchored bottom)
└── FullScreenOverlays (outside safe area)
    ├── FadePanel
    └── LoadingScreen
```

## Aspect Ratio Handling

### Common Mobile Ratios
| Ratio | Devices | Strategy |
|-------|---------|----------|
| 16:9 | Older phones, tablets | Standard |
| 18:9 | Samsung Galaxy S8+ | Extend width |
| 19.5:9 | iPhone X+ | Safe area + extend |
| 20:9 | Modern Android | Safe area + extend |
| 4:3 | iPad | Letterbox or scale |

### Aspect Ratio Fitter
```
For game content (not UI):
  Camera > Viewport Rect → adjust for letterboxing
  OR: Use AspectRatioFitter component on content container

For UI:
  Use anchors-based responsive layout (no fixed pixel values)
  Use CanvasScaler: Scale With Screen Size
```

### Canvas Scaler Settings
```
Canvas Scaler:
  UI Scale Mode: Scale With Screen Size
  Reference Resolution: 1080 x 1920 (portrait) or 1920 x 1080 (landscape)
  Screen Match Mode: Match Width Or Height
  Match: 0.5 (balanced) or 1.0 (match height for portrait games)
```

## Responsive Patterns

### Anchoring Best Practices
```
Top-left anchored:     anchorMin(0,1) anchorMax(0,1)
Top-center anchored:   anchorMin(0.5,1) anchorMax(0.5,1)
Full-width stretch:    anchorMin(0,y) anchorMax(1,y)
Full-screen stretch:   anchorMin(0,0) anchorMax(1,1)

Rule: Use stretch anchors for backgrounds and containers
      Use point anchors for buttons and icons
      Use percentage-based sizing for responsive elements
```

### Orientation Handling
```csharp
public sealed class OrientationService : ITickable
{
    readonly SignalBus _signalBus;
    ScreenOrientation _lastOrientation;

    public void Tick()
    {
        if (Screen.orientation == _lastOrientation) return;
        _lastOrientation = Screen.orientation;
        _signalBus.Fire(new OrientationChangedSignal(_lastOrientation));
    }
}

// Lock orientation for games
Screen.orientation = ScreenOrientation.LandscapeLeft;
Screen.autorotateToLandscapeLeft = true;
Screen.autorotateToLandscapeRight = true;
Screen.autorotateToPortrait = false;
```

### DPI-Aware Sizing
```csharp
// Touch targets minimum 44pt (Apple HIG) / 48dp (Material)
float MinTouchSize()
{
    float dpi = Screen.dpi > 0 ? Screen.dpi : 160f;
    return 48f * (dpi / 160f); // 48dp in pixels
}
```
