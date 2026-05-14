---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# DOTS Input Advanced Patterns

## Pattern 4: Action Map Switching in ECS

```csharp
[UpdateInGroup(typeof(InitializationSystemGroup))]
public partial class InputMapSwitchSystem : SystemBase {
    private GameInputActions _input;

    protected override void OnCreate() {
        _input = new GameInputActions();
        _input.Player.Enable();
    }

    protected override void OnUpdate() {
        bool isPaused = SystemAPI.HasSingleton<GamePausedTag>();
        if (isPaused && _input.Player.enabled) {
            _input.Player.Disable();
            _input.UI.Enable();
        } else if (!isPaused && _input.UI.enabled) {
            _input.UI.Disable();
            _input.Player.Enable();
        }
    }

    protected override void OnDestroy() => _input.Dispose();
}
```

## Pattern 5: Netcode for Entities (IInputComponentData)

For networked games, use `IInputComponentData` — auto-generates buffer + serialization + rollback support.

```csharp
// Auto-generates DynamicBuffer<PlayerInput> + serialization
public struct PlayerInput : IInputComponentData {
    public int MoveX;   // discrete: -1/0/1 (deterministic)
    public int MoveZ;
    public InputEvent Jump;   // NetCode's InputEvent (tick-tagged)
    public InputEvent Attack;
}

// Gather ONLY in GhostInputSystemGroup (client-only, not re-run on rollback)
[UpdateInGroup(typeof(GhostInputSystemGroup))]
public partial class NetInputGatheringSystem : SystemBase {
    private GameInputActions _input;
    protected override void OnCreate() { _input = new(); _input.Player.Enable(); }
    protected override void OnUpdate() {
        foreach (var (input, _) in SystemAPI.Query<RefRW<PlayerInput>>().WithAll<GhostOwnerIsLocal>()) {
            var raw = _input.Player.Move.ReadValue<Vector2>();
            input.ValueRW.MoveX = (int)math.sign(raw.x);
            input.ValueRW.MoveZ = (int)math.sign(raw.y);
            input.ValueRW.Jump.Set(_input.Player.Jump.WasPressedThisFrame());
        }
    }
    protected override void OnDestroy() { _input.Disable(); _input.Dispose(); }
}

// Process in PredictedSimulationSystemGroup (re-runs on rollback)
[UpdateInGroup(typeof(PredictedSimulationSystemGroup))]
[BurstCompile]
public partial struct PlayerMovePredictionSystem : ISystem {
    public void OnUpdate(ref SystemState state) {
        foreach (var (input, vel) in SystemAPI.Query<RefRO<PlayerInput>, RefRW<Velocity>>()) {
            vel.ValueRW.Linear.x = input.ValueRO.MoveX * 5f;
            vel.ValueRW.Linear.z = input.ValueRO.MoveZ * 5f;
            if (input.ValueRO.Jump.IsSet) vel.ValueRW.Linear.y = 8f;
        }
    }
}
```

**CRITICAL:** Never call `ReadValue()` or `WasPressedThisFrame()` inside `PredictedSimulationSystemGroup` — that group re-runs on rollback with stale frame data.

## MonoBehaviour Bridge (Alternative to SystemBase)

```csharp
// Cleanest option — no ECS dependency on managed lifecycle
public class InputGatheringMono : MonoBehaviour {
    private GameInputActions _actions;
    void Awake()     { _actions = new GameInputActions(); _actions.Enable(); }
    void OnDestroy() { _actions.Disable(); _actions.Dispose(); }  // REQUIRED
    void Update()    { /* write singleton via EntityManager */ }
}
```

## Anti-Patterns

1. **Reading Input System in Burst job** — compile error or crash. Always use singleton bridge.
2. **Multiple SystemBase readers** — race condition on singleton write. Use ONE reader.
3. **Not disposing InputActions** — `IDisposable`; missing `Dispose()` → native memory leak.
4. **`WasPressedThisFrame` in fixed-rate systems** — misses presses between ticks. Use `FixedInputEvent`.
5. **Creating InputActions every frame** — allocates. Create once in `OnCreate`/`Awake`.
6. **Polling `ReadValue()` inside `PredictedSimulationSystemGroup`** — re-runs on rollback with wrong data.
7. **`performed` callbacks writing directly to ECS data** — fires on input thread, race with system updates.
