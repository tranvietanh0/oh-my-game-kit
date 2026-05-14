---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# DOTS Input Basics

## Pattern 1: Single Singleton (Basic)

Managed `SystemBase` reads input → writes to singleton → Burst `ISystem` consumes.

## Pattern 2: Multi-Consumer Singleton

Multiple systems need different input data. Use ONE fat singleton, not many:

```csharp
public struct PlayerInputData : IComponentData {
    public float2 Move;
    public bool SprintPressed;
    public bool FireThisFrame;
    public bool AltFireThisFrame;
    public float2 AimDirection;
    public float2 Look;
    public float ZoomDelta;
    public bool PauseThisFrame;
    public bool InventoryThisFrame;
}
```

Each system reads only the fields it needs. One write, many reads — no contention.

## Pattern 3: Fixed Timestep Input Buffering

Input arrives in `Update()` (variable rate). DOTS physics/gameplay runs in `FixedStepSimulationSystemGroup` (fixed rate). Button presses can be missed.

### Approach A: Simple Accumulation

```csharp
public struct InputBuffer : IComponentData {
    public float2 Move;
    public bool FireAccumulated;
    public int FireCount;
}

[UpdateInGroup(typeof(InitializationSystemGroup))]
public partial class InputBufferSystem : SystemBase {
    private GameInputActions _input;
    private bool _fireThisFrame;

    protected override void OnCreate() {
        _input = new GameInputActions();
        _input.Player.Enable();
        _input.Player.Fire.performed += _ => _fireThisFrame = true;
        EntityManager.CreateSingleton<InputBuffer>();
    }

    protected override void OnUpdate() {
        var buf = SystemAPI.GetSingleton<InputBuffer>();
        buf.Move = (float2)_input.Player.Move.ReadValue<Vector2>();
        if (_fireThisFrame) {
            buf.FireAccumulated = true;
            buf.FireCount++;
            _fireThisFrame = false;
        }
        SystemAPI.SetSingleton(buf);
    }

    protected override void OnDestroy() => _input.Dispose();
}

[BurstCompile]
[UpdateInGroup(typeof(FixedStepSimulationSystemGroup))]
public partial struct FixedInputConsumerSystem : ISystem {
    public void OnUpdate(ref SystemState state) {
        var buf = SystemAPI.GetSingletonRW<InputBuffer>();
        if (buf.ValueRO.FireAccumulated) { /* Process fire */ }
        buf.ValueRW.FireAccumulated = false;
        buf.ValueRW.FireCount = 0;
    }
}
```

### Approach B: FixedInputEvent (tick-tagged, deterministic)

`WasPressedThisFrame()` is true for ONE variable frame only — can be lost between ticks.

```csharp
public struct FixedInputEvent {
    private uint _setTick;
    private uint _clearedTick;
    public void Set(uint tick) => _setTick = tick;
    public bool IsSet => _setTick > _clearedTick;
    public void Clear(uint tick) => _clearedTick = tick;
}

public struct FixedPlayerInput : IComponentData {
    public float2 Move;
    public FixedInputEvent Jump;
    public FixedInputEvent Attack;
}
```

Bridge writes in variable Update; fixed system reads and clears:
```csharp
void Update() {
    var tick = fixedTickCountSystem.Tick;
    var data = em.GetComponentData<FixedPlayerInput>(entity);
    data.Move = _actions.Player.Move.ReadValue<Vector2>();
    if (_actions.Player.Jump.WasPressedThisFrame()) data.Jump.Set(tick);
    em.SetComponentData(entity, data);
}
```

## Lifecycle: SystemBase vs ISystem

```csharp
// SystemBase (managed) — CAN hold InputActions
public partial class InputSystem : SystemBase {
    private GameInputActions _input;
    protected override void OnCreate()  { _input = new(); _input.Enable(); }
    protected override void OnDestroy() { _input.Dispose(); }  // MUST dispose
}

// ISystem (unmanaged) — CANNOT hold InputActions (managed class)
// Use SystemBase or MonoBehaviour bridge for input reading.
```

## WasPressedThisFrame vs Callback

| Approach | When to Use |
|----------|-------------|
| `WasPressedThisFrame()` | Variable-rate bridge → singleton (recommended) |
| `performed += callback` | Use with accumulation flag for no-miss guarantee |
| `FixedInputEvent` | Fixed-rate systems where press could be lost |

**Recommendation:** Use `WasPressedThisFrame()` in bridge — polling, thread-safe, no subscription to manage.
