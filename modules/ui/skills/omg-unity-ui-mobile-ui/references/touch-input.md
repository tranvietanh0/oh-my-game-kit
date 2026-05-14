---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# Touch & Input

## Setup

```
1. Install: com.unity.inputsystem
2. Project Settings > Player > Active Input Handling: Both (or Input System)
3. Enable: EnhancedTouchSupport.Enable()
```

## Touch Service (VContainer)

```csharp
using UnityEngine.InputSystem.EnhancedTouch;
using Touch = UnityEngine.InputSystem.EnhancedTouch.Touch;

public sealed class TouchService : IInitializable, IDisposable, ITickable
{
    readonly SignalBus _signalBus;
    Vector2 _swipeStart;
    float _swipeStartTime, _lastTapTime;
    const float SwipeThreshold = 50f, SwipeTimeMax = 0.5f, DoubleTapWindow = 0.3f;

    public void Initialize() => EnhancedTouchSupport.Enable();
    public void Dispose()   => EnhancedTouchSupport.Disable();

    public void Tick()
    {
        foreach (var touch in Touch.activeTouches) {
            switch (touch.phase) {
                case UnityEngine.InputSystem.TouchPhase.Began:
                    _swipeStart = touch.screenPosition; _swipeStartTime = Time.time; break;
                case UnityEngine.InputSystem.TouchPhase.Ended:
                    DetectGesture(touch); break;
            }
        }
        DetectPinch();
    }

    void DetectGesture(Touch touch)
    {
        var delta = touch.screenPosition - _swipeStart;
        float elapsed = Time.time - _swipeStartTime;
        if (delta.magnitude > SwipeThreshold && elapsed < SwipeTimeMax) {
            _signalBus.Fire(new SwipeSignal(GetDir(delta), delta.magnitude));
        } else if (delta.magnitude < 20f) {
            if (Time.time - _lastTapTime < DoubleTapWindow)
                _signalBus.Fire(new DoubleTapSignal(touch.screenPosition));
            else
                _signalBus.Fire(new TapSignal(touch.screenPosition));
            _lastTapTime = Time.time;
        }
    }

    void DetectPinch()
    {
        if (Touch.activeFingers.Count < 2) return;
        var t0 = Touch.activeFingers[0].currentTouch;
        var t1 = Touch.activeFingers[1].currentTouch;
        float cur  = Vector2.Distance(t0.screenPosition, t1.screenPosition);
        float prev = Vector2.Distance(t0.screenPosition - t0.delta, t1.screenPosition - t1.delta);
        if (Mathf.Abs(cur - prev) > 1f) _signalBus.Fire(new PinchSignal(cur - prev, cur));
    }

    static SwipeDirection GetDir(Vector2 d) =>
        Mathf.Abs(d.x) > Mathf.Abs(d.y)
            ? (d.x > 0 ? SwipeDirection.Right : SwipeDirection.Left)
            : (d.y > 0 ? SwipeDirection.Up    : SwipeDirection.Down);
}

public record TapSignal(Vector2 ScreenPosition);
public record DoubleTapSignal(Vector2 ScreenPosition);
public record SwipeSignal(SwipeDirection Direction, float Distance);
public record PinchSignal(float Delta, float CurrentDistance);
public enum SwipeDirection { Up, Down, Left, Right }
```

## Virtual Joystick

```csharp
public sealed class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler
{
    [SerializeField] RectTransform _background = null!, _handle = null!;
    [SerializeField] float _range = 50f;
    public Vector2 Value { get; private set; }

    public void OnPointerDown(PointerEventData e) => OnDrag(e);
    public void OnDrag(PointerEventData e) {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(_background, e.position, e.pressEventCamera, out var lp);
        lp = Vector2.ClampMagnitude(lp, _range);
        _handle.anchoredPosition = lp;
        Value = lp / _range;
    }
    public void OnPointerUp(PointerEventData e) { _handle.anchoredPosition = Vector2.zero; Value = Vector2.zero; }
}
```

## Input Actions Asset (key bindings)

```json
{ "maps": [{ "name": "Gameplay", "actions": [
    { "name": "Move",   "type": "Value",  "expectedControlType": "Vector2" },
    { "name": "Jump",   "type": "Button" },
    { "name": "Attack", "type": "Button" }
], "bindings": [
    { "action": "Move",   "path": "<Gamepad>/leftStick" },
    { "action": "Move",   "path": "<Keyboard>/wasd", "isComposite": true },
    { "action": "Jump",   "path": "<Keyboard>/space" },
    { "action": "Jump",   "path": "<Gamepad>/buttonSouth" }
]}]}
```
