---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# UI Integration, Input Debugger & On-Screen Controls

## InputSystemUIInputModule

Replaces `StandaloneInputModule` for UI navigation/clicks with Input System.

### Setup
1. Select EventSystem GameObject in scene
2. Remove `StandaloneInputModule` (or click auto-replace button in Inspector)
3. Add `InputSystemUIInputModule` component
4. Assign `.inputactions` asset (or use built-in defaults)

### Key Properties

| Property | Default | Purpose |
|----------|---------|---------|
| Move Repeat Delay | 0.5s | Initial delay before nav repeat |
| Move Repeat Rate | 0.1s | Repeat interval after delay |
| Actions Asset | (default) | Input Action Asset for UI |
| Point / Click / ScrollWheel / Move / Submit / Cancel | auto | Per-action overrides |

### Multiplayer UI
```csharp
// Replace EventSystem with MultiplayerEventSystem for split-screen
// Each player gets their own:
// - InputSystemUIInputModule
// - MultiplayerEventSystem
// - Canvas (with playerRoot set)

var mpes = gameObject.AddComponent<MultiplayerEventSystem>();
mpes.playerRoot = playerCanvas.gameObject; // restrict raycasts to this canvas
```

### Runtime Configuration
```csharp
var uiModule = EventSystem.current.GetComponent<InputSystemUIInputModule>();
uiModule.actionsAsset = myInputActions;
// Or override individual actions:
uiModule.point = InputActionReference.Create(myActions.UI.Point);
uiModule.leftClick = InputActionReference.Create(myActions.UI.Click);
```

### Navigation Events (code-driven)
```csharp
// UI Toolkit: register on VisualElement
element.RegisterCallback<NavigationMoveEvent>(e => {
    // e.direction: Up, Down, Left, Right
});
element.RegisterCallback<NavigationSubmitEvent>(e => { /* enter/submit */ });
element.RegisterCallback<NavigationCancelEvent>(e => { /* escape/cancel */ });
```

## Input Debugger

**Window → Analysis → Input Debugger**

### What It Shows
- All registered devices (keyboard, mouse, gamepad, touch)
- Real-time control values (position, button state, axis)
- Active action maps and their bindings
- Event trace log (chronological input events)
- Unrecognized/disconnected devices

### Debugging Workflows
1. **"Action doesn't fire"** → Check: is the action map enabled? Is binding correct?
2. **"Wrong device"** → Check: control scheme auto-switching. Look at active devices
3. **"Value is wrong"** → Check: processors (deadzone, scale, invert) applied to binding
4. **"Gamepad not detected"** → Check: device list. Try unplug/replug. Check HID support

### Event Tracing (code)
```csharp
// Enable detailed event logging
InputSystem.onEvent += (eventPtr, device) => {
    Debug.Log($"{device.name}: {eventPtr.type} @ {eventPtr.time}");
};
```

## On-Screen Controls (Mobile)

### OnScreenButton
```csharp
// Add to UI Button/Image GameObject
// Inspector: Control Path → <Gamepad>/buttonSouth (or any Button control)
// Sends 1 on pointer-down, 0 on pointer-up
```

Setup:
1. Create UI Image
2. Add `OnScreenButton` component
3. Set **Control Path** to target button (e.g., `<Gamepad>/buttonSouth`)
4. Actions bound to that path will fire automatically

### OnScreenStick
```csharp
// Add to UI Image GameObject
// Inspector: Control Path → <Gamepad>/leftStick
// Movement Range → 50 (pixels from center)
// Behaviour → Relative Position With Static Zone (recommended)
```

Setup:
1. Create UI Image (stick knob)
2. Add `OnScreenStick` component
3. Set **Control Path** to `<Gamepad>/leftStick`
4. Set **Movement Range** (default 50 pixels)
5. Actions bound to `<Gamepad>/leftStick` receive Vector2 automatically

### Stick Behavior Modes
| Mode | Description |
|------|-------------|
| Relative Position With Static Zone | Stick moves within fixed zone from touch point |
| Exact Position | Stick image follows finger exactly |

### Gotchas
- **No built-in deadzone** — add `stickDeadzone` processor to the action binding
- **Canvas scaling** — movement range is in pixels, affected by Canvas Scaler
- **Multiple sticks** — use different control paths (`leftStick` vs `rightStick`)
- **Custom visuals** — subclass `OnScreenControl` for custom behavior:

```csharp
public class MyJoystick : OnScreenControl {
    [InputControl(layout = "Vector2")]
    [SerializeField] private string controlPath;
    protected override string controlPathInternal {
        get => controlPath;
        set => controlPath = value;
    }
    // Override pointer event handlers for custom behavior
}
```
