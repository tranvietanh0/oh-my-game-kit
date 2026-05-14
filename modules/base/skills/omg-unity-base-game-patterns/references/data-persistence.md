---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Data & Persistence Patterns

## ScriptableObject Data Containers

```csharp
[CreateAssetMenu(fileName = "EnemyConfig", menuName = "Config/Enemy")]
public sealed class EnemyConfig : ScriptableObject
{
    [field: SerializeField] public float Health { get; private set; } = 100f;
    [field: SerializeField] public float Speed { get; private set; } = 5f;
    [field: SerializeField] public float AttackDamage { get; private set; } = 10f;
    [field: SerializeField] public AudioClip? HitSound { get; private set; }
}

[CreateAssetMenu(fileName = "ItemDatabase", menuName = "Database/Items")]
public sealed class ItemDatabase : ScriptableObject
{
    [SerializeField] ItemData[] _items = Array.Empty<ItemData>();
    Dictionary<string, ItemData>? _lookup;
    Dictionary<string, ItemData> Lookup => _lookup ??= _items.ToDictionary(i => i.Id);
    public ItemData? GetById(string id) => Lookup.TryGetValue(id, out var item) ? item : null;
}
```

## Save Service (JSON, VContainer)

```csharp
public sealed class SaveService : IInitializable
{
    const string SaveFileName = "save.json";
    SaveData _data = new();
    string SavePath => Path.Combine(Application.persistentDataPath, SaveFileName);

    public void Initialize() => Load();

    public T Get<T>(string key, T defaultValue = default!)
    {
        if (_data.Entries.TryGetValue(key, out var json)) return JsonUtility.FromJson<T>(json);
        return defaultValue;
    }

    public void Set<T>(string key, T value)
    {
        _data.Entries[key] = JsonUtility.ToJson(value);
        File.WriteAllText(SavePath, JsonUtility.ToJson(_data, true));
    }

    void Load()
    {
        if (File.Exists(SavePath)) _data = JsonUtility.FromJson<SaveData>(File.ReadAllText(SavePath));
    }

    public void DeleteSave() { if (File.Exists(SavePath)) File.Delete(SavePath); _data = new(); }
}

[Serializable] public sealed class SaveData { public Dictionary<string, string> Entries = new(); }
```

## Data Controller Pattern (TheOne Studio)

```csharp
// Controller wraps data access — NEVER access save data directly from feature code
public sealed class CurrencyController
{
    readonly SaveService _saveService;
    readonly SignalBus _signalBus;
    int _coins, _gems;

    public int Coins => _coins;
    public int Gems => _gems;

    public bool TrySpend(CurrencyType type, int amount)
    {
        ref int balance = ref type == CurrencyType.Coins ? ref _coins : ref _gems;
        if (balance < amount) return false;
        balance -= amount;
        _saveService.Set($"currency_{type}", balance);
        _signalBus.Fire(new CurrencyChangedSignal(type, balance));
        return true;
    }

    public void Add(CurrencyType type, int amount)
    {
        ref int balance = ref type == CurrencyType.Coins ? ref _coins : ref _gems;
        balance += amount;
        _saveService.Set($"currency_{type}", balance);
        _signalBus.Fire(new CurrencyChangedSignal(type, balance));
    }
}
```

## Reactive Property (without UniRx)

```csharp
public sealed class ReactiveProperty<T> where T : IEquatable<T>
{
    T _value;
    public event Action<T>? OnChanged;

    public T Value
    {
        get => _value;
        set { if (_value.Equals(value)) return; _value = value; OnChanged?.Invoke(_value); }
    }

    public ReactiveProperty(T initial) => _value = initial;
    public static implicit operator T(ReactiveProperty<T> prop) => prop.Value;
}
// Usage: _health.OnChanged += UpdateHealthBar;
```

## Cloud Save Pattern (offline-first)

```csharp
public sealed class CloudSaveService : IInitializable, IDisposable
{
    readonly SignalBus _signalBus;
    public void Initialize() => _signalBus.Subscribe<SaveRequestedSignal>(OnSaveRequested);

    async void OnSaveRequested(SaveRequestedSignal signal)
    {
        SaveLocally(signal.Key, signal.Json);              // local first
        var success = await SyncToCloud(signal.Key, signal.Json);
        _signalBus.Fire(new SaveCompletedSignal(signal.Key, success));
    }

    public void Dispose() => _signalBus.Unsubscribe<SaveRequestedSignal>(OnSaveRequested);
}
```
