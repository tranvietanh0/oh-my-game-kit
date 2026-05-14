---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Game Systems

## Scene Management

### Scene Service (VContainer)
```csharp
public sealed class SceneService
{
    public async UniTask LoadScene(string sceneName, LoadSceneMode mode = LoadSceneMode.Single)
    {
        var op = SceneManager.LoadSceneAsync(sceneName, mode);
        op.allowSceneActivation = false;
        while (op.progress < 0.9f) await UniTask.Yield();
        op.allowSceneActivation = true;
        await UniTask.WaitUntil(() => op.isDone);
    }

    public async UniTask LoadWithTransition(string sceneName, CanvasGroup fadePanel)
    {
        await fadePanel.DOFade(1f, 0.3f).ToUniTask();
        await LoadScene(sceneName);
        await fadePanel.DOFade(0f, 0.3f).ToUniTask();
    }

    public async UniTask UnloadScene(string sceneName)
    {
        if (SceneManager.GetSceneByName(sceneName).isLoaded)
            await SceneManager.UnloadSceneAsync(sceneName).ToUniTask();
    }
}
```

Additive scene pattern: Bootstrap → loads Persistent → loads MainMenu additively.

## Input Handling (New Input System)

```csharp
public sealed class InputService : IInitializable, IDisposable, ITickable
{
    readonly SignalBus _signalBus;
    GameInputActions? _actions;

    public Vector2 MoveInput { get; private set; }

    public void Initialize()
    {
        _actions = new GameInputActions();
        _actions.Gameplay.Enable();
        _actions.Gameplay.Jump.performed += _ => _signalBus.Fire(new JumpSignal());
        _actions.Gameplay.Attack.performed += _ => _signalBus.Fire(new AttackSignal());
    }

    public void Tick() => MoveInput = _actions?.Gameplay.Move.ReadValue<Vector2>() ?? Vector2.zero;

    public void Dispose()
    {
        _actions?.Gameplay.Jump.performed -= OnJump;
        _actions?.Dispose();
    }
}
```

## Timer System

```csharp
public sealed class TimerService : ITickable
{
    readonly List<Timer> _active = new(32);
    readonly List<Timer> _toRemove = new(8);

    public Timer Schedule(float duration, Action onComplete, bool repeat = false)
    {
        var timer = new Timer(duration, onComplete, repeat);
        _active.Add(timer);
        return timer;
    }

    public void Tick()
    {
        float dt = Time.deltaTime;
        foreach (var t in _active) {
            t.Elapsed += dt;
            if (t.Elapsed < t.Duration) continue;
            t.OnComplete();
            if (t.Repeat) t.Elapsed = 0f;
            else _toRemove.Add(t);
        }
        foreach (var t in _toRemove) _active.Remove(t);
        _toRemove.Clear();
    }
}
```

## Spawn System

```csharp
public sealed class SpawnService : IInitializable
{
    public async UniTask SpawnWave(WaveConfig wave, CancellationToken ct)
    {
        foreach (var group in wave.Groups) {
            for (int i = 0; i < group.Count; i++) {
                ct.ThrowIfCancellationRequested();
                var enemy = _poolService.GetOrCreate(group.PrefabId).Get();
                enemy.transform.position = GetSpawnPoint(group.SpawnArea);
                await UniTask.Delay(TimeSpan.FromSeconds(group.Interval), cancellationToken: ct);
            }
            await UniTask.Delay(TimeSpan.FromSeconds(wave.GroupDelay), cancellationToken: ct);
        }
        _signalBus.Fire(new WaveCompletedSignal(wave.WaveIndex));
    }
}
```

## Prioritized Signal Pattern

```csharp
// For cases where handler order matters (damage pipeline)
public sealed class DamageSignal
{
    public float BaseDamage { get; }
    public float FinalDamage { get; set; }
    public DamageSignal(float damage) { BaseDamage = damage; FinalDamage = damage; }
}
// Handler 1 (armor): FinalDamage *= 0.7f
// Handler 2 (crit):  FinalDamage *= 2.0f
// Handler 3 (apply): health -= FinalDamage
```
