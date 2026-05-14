---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Device Management & Testing

## Device Lifecycle

### Detecting Devices
```csharp
// Current devices
Keyboard kb = Keyboard.current;     // null if no keyboard
Gamepad gp = Gamepad.current;       // null if no gamepad
Mouse mouse = Mouse.current;
Touchscreen ts = Touchscreen.current;

// All connected devices
foreach (var device in InputSystem.devices)
    Debug.Log($"{device.name} ({device.layout})");
```

### Device Change Events
```csharp
InputSystem.onDeviceChange += (device, change) => {
    switch (change) {
        case InputDeviceChange.Added:
            Debug.Log($"Device added: {device.name}");
            break;
        case InputDeviceChange.Removed:
            Debug.Log($"Device removed: {device.name}");
            break;
        case InputDeviceChange.Reconnected:
            Debug.Log($"Device reconnected: {device.name}");
            break;
        case InputDeviceChange.Disconnected:
            Debug.Log($"Device disconnected: {device.name}");
            break;
        case InputDeviceChange.ConfigurationChanged:
            // Layout or capabilities changed
            break;
    }
};
```

### Device Matching for Control Schemes
```csharp
// Check which control scheme matches current devices
var playerInput = GetComponent<PlayerInput>();
playerInput.onControlsChanged += pi => {
    Debug.Log($"Switched to: {pi.currentControlScheme}");
    // Update UI prompts (keyboard icons vs gamepad icons)
};
```

## Custom Devices

### Steps
1. **State struct** — `IInputStateTypeInfo` with `[InputControl]` fields + `[StructLayout]`
2. **Device class** — `InputDevice` subclass with `[InputControlLayout(stateType=...)]`
3. **Register** — `InputSystem.RegisterLayout<MyDevice>()` in static ctor + `[RuntimeInitializeOnLoadMethod]`
4. **Feed state** — `InputSystem.QueueStateEvent(device, new MyDeviceState { ... })`

```csharp
[StructLayout(LayoutKind.Explicit, Size = 8)]
public struct MyDeviceState : IInputStateTypeInfo {
    public FourCC format => new FourCC('M', 'Y', 'D', 'V');
    [InputControl(name = "trigger", layout = "Button", bit = 0)]
    [FieldOffset(0)] public byte buttons;
    [InputControl(name = "axis", layout = "Axis")]
    [FieldOffset(4)] public float axis;
}

[InputControlLayout(stateType = typeof(MyDeviceState))]
public class MyDevice : InputDevice {
    public ButtonControl trigger { get; private set; }
    public AxisControl axis { get; private set; }
    static MyDevice() => InputSystem.RegisterLayout<MyDevice>();
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    static void Init() => InputSystem.RegisterLayout<MyDevice>();
    protected override void FinishSetup() {
        base.FinishSetup();
        trigger = GetChildControl<ButtonControl>("trigger");
        axis = GetChildControl<AxisControl>("axis");
    }
}
```

## Unit Testing with InputTestFixture

### Basic Setup
```csharp
using NUnit.Framework;
using UnityEngine.InputSystem;

// Inherit from InputTestFixture — isolates Input System per test
public class MyInputTests : InputTestFixture {
    private Keyboard keyboard;
    private Gamepad gamepad;

    public override void Setup() {
        base.Setup();
        keyboard = InputSystem.AddDevice<Keyboard>();
        gamepad = InputSystem.AddDevice<Gamepad>();
    }
}
```

### Simulating Input
```csharp
[Test]
public void Fire_OnSpacePress_Fires() {
    var action = new InputAction(binding: "<Keyboard>/space");
    action.Enable();
    bool fired = false;
    action.performed += _ => fired = true;

    // Simulate key press
    Press(keyboard.spaceKey);

    Assert.IsTrue(fired);
}

[Test]
public void Move_WithGamepad_ReturnsValue() {
    var action = new InputAction(binding: "<Gamepad>/leftStick");
    action.Enable();
    Set(gamepad.leftStick, new Vector2(0.5f, 0.75f));
    Assert.AreEqual(0.5f, action.ReadValue<Vector2>().x, 0.01f);
}
```

### Key Test Methods (InputTestFixture)

| Method | Purpose |
|--------|---------|
| `Press(control)` | Simulate button press |
| `Release(control)` | Simulate button release |
| `PressAndRelease(control)` | Press then release |
| `Set(control, value)` | Set axis/stick value |
| `BeginTouch(id, pos)` | Start touch |
| `MoveTouch(id, pos)` | Move touch |
| `EndTouch(id, pos)` | End touch |
| `MoveTime(seconds)` | Advance simulated time (use for Hold/SlowTap) |
| `currentTime` | Simulated time (set directly) |

### Gotchas
- `InputTestFixture` creates isolated Input System — must `AddDevice` in `Setup()`
- `currentTime` doesn't auto-advance — set manually for time-based interactions
- Always `Dispose()` any `InputAction` or actions asset created in tests
- Use `InputSystem.Update()` after time changes to process pending events
