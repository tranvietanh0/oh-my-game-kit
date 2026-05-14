---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Core Game Patterns

## Object Pooling

### Unity Built-in ObjectPool<T>
```csharp
public sealed class ProjectilePool : IDisposable
{
    readonly ObjectPool<Projectile> _pool;

    public ProjectilePool(Projectile prefab, Transform parent)
    {
        _pool = new ObjectPool<Projectile>(
            createFunc: () => { var obj = Object.Instantiate(prefab, parent); obj.Pool = this; return obj; },
            actionOnGet: p => p.gameObject.SetActive(true),
            actionOnRelease: p => { p.gameObject.SetActive(false); p.ResetState(); },
            actionOnDestroy: p => Object.Destroy(p.gameObject),
            collectionCheck: false, defaultCapacity: 20, maxSize: 100
        );
    }

    public Projectile Get() => _pool.Get();
    public void Release(Projectile p) => _pool.Release(p);
    public void Dispose() => _pool.Dispose();
}
```

### Generic Pool Service (VContainer)
```csharp
public sealed class PoolService : IDisposable
{
    readonly Dictionary<string, IDisposable> _pools = new();

    public ObjectPool<T> GetOrCreate<T>(string id, Func<T> create,
        Action<T>? onGet = null, Action<T>? onRelease = null,
        int capacity = 20, int max = 100) where T : class
    {
        if (_pools.TryGetValue(id, out var existing)) return (ObjectPool<T>)existing;
        var pool = new ObjectPool<T>(create, onGet, onRelease, defaultCapacity: capacity, maxSize: max);
        _pools[id] = pool;
        return pool;
    }

    public void Dispose() { foreach (var p in _pools.Values) p.Dispose(); _pools.Clear(); }
}
```

Pre-warm: get N items then release them all in `Initialize()`.

## State Machine

```csharp
public abstract class State<TContext>
{
    protected TContext Context { get; private set; }
    public void SetContext(TContext ctx) => Context = ctx;
    public virtual void Enter() { }
    public virtual void Exit() { }
    public virtual void Tick() { }
}

public sealed class StateMachine<TContext> : ITickable
{
    readonly TContext _context;
    readonly Dictionary<Type, State<TContext>> _states = new();
    State<TContext>? _current;

    public StateMachine(TContext context) => _context = context;
    public void AddState<TState>(TState state) where TState : State<TContext>
        { state.SetContext(_context); _states[typeof(TState)] = state; }
    public void TransitionTo<TState>() where TState : State<TContext>
        { _current?.Exit(); _current = _states[typeof(TState)]; _current.Enter(); }
    public void Tick() => _current?.Tick();
}

// Usage
public sealed class GameService : IInitializable, ITickable
{
    readonly StateMachine<GameService> _fsm;
    public GameService() {
        _fsm = new StateMachine<GameService>(this);
        _fsm.AddState(new MenuState());
        _fsm.AddState(new PlayState());
        _fsm.AddState(new PauseState());
        _fsm.AddState(new GameOverState());
    }
    public void Initialize() => _fsm.TransitionTo<MenuState>();
    public void Tick() => _fsm.Tick();
}
```

## Command Pattern (Undo/Redo)

```csharp
public interface ICommand { void Execute(); void Undo(); }

public sealed class CommandHistory
{
    readonly Stack<ICommand> _undoStack = new();
    readonly Stack<ICommand> _redoStack = new();

    public void Execute(ICommand cmd) { cmd.Execute(); _undoStack.Push(cmd); _redoStack.Clear(); }
    public void Undo() { if (_undoStack.Count == 0) return; var c = _undoStack.Pop(); c.Undo(); _redoStack.Push(c); }
    public void Redo() { if (_redoStack.Count == 0) return; var c = _redoStack.Pop(); c.Execute(); _undoStack.Push(c); }
}

public sealed class MoveCommand : ICommand
{
    readonly Transform _target; readonly Vector3 _from, _to;
    public MoveCommand(Transform t, Vector3 to) { _target = t; _from = t.position; _to = to; }
    public void Execute() => _target.position = _to;
    public void Undo() => _target.position = _from;
}
```
