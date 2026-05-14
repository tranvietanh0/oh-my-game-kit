---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Bindings, Processors & Interactions

## Composite Bindings

```csharp
// 2D Vector — four directional buttons → Vector2
var move = map.AddAction("Move", type: InputActionType.Value);
move.AddCompositeBinding("2DVector")
    .With("Up",    "<Keyboard>/w")
    .With("Down",  "<Keyboard>/s")
    .With("Left",  "<Keyboard>/a")
    .With("Right", "<Keyboard>/d");

// 1D Axis — two buttons → float
var zoom = map.AddAction("Zoom", type: InputActionType.Value);
zoom.AddCompositeBinding("1DAxis")
    .With("Negative", "<Keyboard>/minus")
    .With("Positive", "<Keyboard>/equals");

// Button With One Modifier — Ctrl+S
var save = map.AddAction("Save");
save.AddCompositeBinding("ButtonWithOneModifier")
    .With("Modifier", "<Keyboard>/ctrl")
    .With("Button",   "<Keyboard>/s");
```

## Processors (apply to binding or action)

```csharp
action.AddBinding("<Gamepad>/leftStick")
    .WithProcessor("stickDeadzone(min=0.125,max=0.925)")
    .WithProcessor("invertVector2(invertX=false,invertY=true)")
    .WithProcessor("scaleVector2(x=2,y=2)");
```

| Processor | Effect |
|-----------|--------|
| `normalize` | Normalizes vector magnitude to 1 |
| `normalizeVector2` | Same for Vector2 |
| `scale(factor=N)` | Multiplies value by N |
| `scaleVector2(x,y)` | Scales each axis independently |
| `clamp(min,max)` | Clamps float to range |
| `axisDeadzone(min,max)` | Dead zone for 1D axis |
| `stickDeadzone(min,max)` | Dead zone for 2D stick |
| `invertAxis` | Flips sign of float |
| `invertVector2(invertX,invertY)` | Flips sign per axis |

## Interactions

```csharp
action.AddBinding("<Gamepad>/buttonSouth")
    .WithInteraction("hold(duration=0.5)");

// Tap: pressed and released within duration
action.AddBinding("<Keyboard>/space")
    .WithInteraction("tap(duration=0.2)");

// MultiTap: double-click
action.AddBinding("<Mouse>/leftButton")
    .WithInteraction("multiTap(tapCount=2,tapDelay=0.2)");
```

| Interaction | `performed` fires when |
|-------------|----------------------|
| `Press` | Pressed (configurable: PressOnly / ReleaseOnly / PressAndRelease) |
| `Hold` | Held for `duration` seconds |
| `Tap` | Pressed AND released within `duration` |
| `SlowTap` | Held past `duration`, then released |
| `MultiTap` | Tapped `tapCount` times within `tapDelay` |

## Programmatic Action Map Setup

```csharp
var map = new InputActionMap("Player");

var fire = map.AddAction("Fire", InputActionType.Button,
    binding: "<Gamepad>/buttonSouth");
fire.AddBinding("<Keyboard>/space");
fire.AddBinding("<Mouse>/leftButton");

var look = map.AddAction("Look", InputActionType.Value,
    binding: "<Mouse>/delta");
look.expectedControlType = "Vector2";

map.Enable();
fire.performed += ctx => Debug.Log("Fire!");
look.performed += ctx => aim = ctx.ReadValue<Vector2>();
```

## Rebinding at Runtime

```csharp
// Prompt user to press new key for action
var rebind = action
    .PerformInteractiveRebinding()
    .WithControlsExcluding("<Mouse>")
    .OnMatchWaitForAnother(0.1f)
    .OnComplete(op => {
        Debug.Log($"Rebound to: {op.selectedControl.path}");
        op.Dispose();
    })
    .Start();

// Save/restore binding overrides
string json = action.SaveBindingOverridesAsJson();
action.LoadBindingOverridesFromJson(json);
action.RemoveAllBindingOverrides();
```

## Gamepad Rumble

```csharp
var gamepad = Gamepad.current;
if (gamepad != null)
    gamepad.SetMotorSpeeds(lowFreq: 0.5f, highFreq: 0.8f);

// Stop after delay
await Task.Delay(200);
gamepad.ResetHaptics();
```

## Touch — Enhanced API

```csharp
// Must enable once (e.g., Awake or OnEnable)
EnhancedTouchSupport.Enable();

void OnEnable() {
    Touch.onFingerDown   += OnFingerDown;
    Touch.onFingerMove   += OnFingerMove;
    Touch.onFingerUp     += OnFingerUp;
}

void OnFingerDown(Finger f) {
    Vector2 pos = f.screenPosition;
    int id      = f.index;
}

// All active touches this frame
foreach (var touch in Touch.activeTouches)
    Debug.Log($"Touch {touch.finger.index}: {touch.screenPosition}");
```
