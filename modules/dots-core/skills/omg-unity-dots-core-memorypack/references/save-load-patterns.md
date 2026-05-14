---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Save/Load Game State Patterns

## Pattern 1: Entity Snapshot (DOTS)

```csharp
[MemoryPackable] public partial class EntitySnapshot
{
    public int Id { get; set; }
    public Vector3 Position { get; set; }
    public float Health { get; set; }
}

[MemoryPackable] public partial class BattleSnapshot
{
    public List<EntitySnapshot> Units { get; set; }
    public int TurnCount { get; set; }
}

// Save
var entities = new List<EntitySnapshot>();
foreach (var entity in query)
{
    entities.Add(new EntitySnapshot
    {
        Id = (int)entity.Index,
        Position = em.GetComponentData<LocalTransform>(entity).Position,
        Health = em.GetComponentData<Health>(entity).Value
    });
}
File.WriteAllBytes("battle.save", MemoryPackSerializer.Serialize(
    new BattleSnapshot { Units = entities, TurnCount = turnSystem.CurrentTurn }));

// Load
var snapshot = MemoryPackSerializer.Deserialize<BattleSnapshot>(
    File.ReadAllBytes("battle.save"));
foreach (var u in snapshot.Units)
{
    var e = em.CreateEntity();
    em.SetComponentData(e, new Health { Value = u.Health });
    em.SetComponentData(e, new LocalTransform { Position = u.Position });
}
```

## Pattern 2: Auto-Save with Versioned Schema

```csharp
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class GameSave
{
    [MemoryPackOrder(0)] public int SaveVersion { get; set; }
    [MemoryPackOrder(1)] public string PlayerName { get; set; }
    [MemoryPackOrder(2)] public List<Vector3> Checkpoints { get; set; }
    [MemoryPackOrder(3)] public Dictionary<string, int> Inventory { get; set; }
}

const int CURRENT_VERSION = 3;

void SaveGame()
{
    var save = new GameSave
    {
        SaveVersion = CURRENT_VERSION,
        PlayerName = GetPlayerName(),
        Checkpoints = GetCheckpoints(),
        Inventory = GetInventory()
    };
    File.WriteAllBytes("autosave.bin", MemoryPackSerializer.Serialize(save));
}

void LoadGame()
{
    if (!File.Exists("autosave.bin")) return;
    var save = MemoryPackSerializer.Deserialize<GameSave>(File.ReadAllBytes("autosave.bin"));
    if (save.SaveVersion < CURRENT_VERSION)
        Debug.Log($"Migrating save v{save.SaveVersion} → v{CURRENT_VERSION}");
    RestoreState(save);
}
```

## Pattern 3: Slot-Based Saves

```csharp
[MemoryPackable] public partial class SaveSlot
{
    public int SlotNumber { get; set; }
    public DateTime SaveTime { get; set; }
    public BattleSnapshot BattleData { get; set; }
}

class SaveManager
{
    private const string SAVE_DIR = "Saves";

    public void SaveToSlot(int slot, BattleSnapshot battle)
    {
        Directory.CreateDirectory(SAVE_DIR);
        var data = new SaveSlot { SlotNumber = slot, SaveTime = DateTime.UtcNow, BattleData = battle };
        File.WriteAllBytes(Path.Combine(SAVE_DIR, $"save_{slot}.bin"), MemoryPackSerializer.Serialize(data));
    }

    public SaveSlot LoadFromSlot(int slot)
    {
        var path = Path.Combine(SAVE_DIR, $"save_{slot}.bin");
        return File.Exists(path) ? MemoryPackSerializer.Deserialize<SaveSlot>(File.ReadAllBytes(path)) : null;
    }
}
```

## Performance Tips

1. Pre-allocate `ArrayBufferWriter<byte>` for repeated saves (avoids intermediate arrays)
2. Use `File.WriteAllBytesAsync()` for non-blocking saves
3. Add `GZipStream` compression for large snapshots (~90% reduction on disk)
4. MemoryPack is 10x faster than MessagePack, ~100x faster than JSON for binary data
5. Snapshot only changed entities for frequent auto-saves
