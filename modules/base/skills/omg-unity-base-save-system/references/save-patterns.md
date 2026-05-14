---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity Save System — Code Patterns

## Storage Locations

```csharp
string savePath = Application.persistentDataPath;
// Windows: C:/Users/<user>/AppData/LocalLow/<company>/<product>/
// macOS:   ~/Library/Application Support/<company>/<product>/
// Linux:   ~/.config/unity3d/<company>/<product>/
// Android: /data/data/<package>/files/
// iOS:     /var/mobile/Containers/Data/Application/<guid>/Documents/

// PlayerPrefs (settings ONLY, never game saves):
PlayerPrefs.SetInt("MusicVolume", 80);
PlayerPrefs.GetInt("MusicVolume", 100); // default=100
PlayerPrefs.Save();
```

## Save Data Architecture

```csharp
[System.Serializable]
public class SaveData {
    public int version = 1;                    // For migration
    public string timestamp;
    public PlayerSaveData player;
    public List<InventoryItemSave> inventory;
    public List<QuestSaveData> quests;
    public WorldSaveData world;
}

[System.Serializable]
public class PlayerSaveData {
    public float[] position;                    // float3 → float[3]
    public int health, maxHealth;
    public int level, experience;
}
```

**Gotcha**: `JsonUtility` doesn't support `Dictionary`, `Vector3` works but `float3` doesn't. Use arrays or Newtonsoft.Json.

## JSON Serialization

```csharp
public static class SaveManager {
    private const string SaveFileName = "save_{0}.json";

    public static void Save(SaveData data, int slot = 0) {
        data.timestamp = System.DateTime.UtcNow.ToString("O");
        string json = JsonUtility.ToJson(data, prettyPrint: true);
        string path = Path.Combine(Application.persistentDataPath,
                                   string.Format(SaveFileName, slot));
        File.WriteAllText(path, json);
    }

    public static SaveData Load(int slot = 0) {
        string path = Path.Combine(Application.persistentDataPath,
                                   string.Format(SaveFileName, slot));
        if (!File.Exists(path)) return null;
        return JsonUtility.FromJson<SaveData>(File.ReadAllText(path));
    }

    public static bool SaveExists(int slot = 0) =>
        File.Exists(Path.Combine(Application.persistentDataPath,
                                 string.Format(SaveFileName, slot)));

    public static void DeleteSave(int slot = 0) {
        string path = Path.Combine(Application.persistentDataPath,
                                   string.Format(SaveFileName, slot));
        if (File.Exists(path)) File.Delete(path);
    }
}
```

## Binary Serialization

```csharp
public static void SaveBinary(SaveData data, int slot = 0) {
    string path = Path.Combine(Application.persistentDataPath, $"save_{slot}.dat");
    using var stream = new FileStream(path, FileMode.Create);
    using var writer = new BinaryWriter(stream);
    writer.Write(data.version);
    writer.Write(data.player.health);
    writer.Write(data.player.position.Length);
    foreach (float v in data.player.position) writer.Write(v);
}
```

## Data Versioning & Migration

```csharp
public static SaveData LoadWithMigration(int slot) {
    var data = Load(slot);
    if (data == null) return new SaveData();

    if (data.version < 2) {
        data.player.maxHealth = 100;  // New field in v2
        data.version = 2;
    }
    if (data.version < 3) {
        data.world ??= new WorldSaveData();  // New in v3
        data.version = 3;
    }
    return data;
}
```

## Auto-Save Pattern

```csharp
public class AutoSaveSystem : MonoBehaviour {
    [SerializeField] float autoSaveInterval = 300f; // 5 minutes

    void OnEnable() => InvokeRepeating(nameof(AutoSave), autoSaveInterval, autoSaveInterval);
    void OnDisable() => CancelInvoke(nameof(AutoSave));
    void OnApplicationPause(bool paused) { if (paused) AutoSave(); }  // Mobile
    void OnApplicationQuit() => AutoSave();

    void AutoSave() => SaveManager.Save(GatherSaveData(), slot: 99); // slot 99 = auto-save
}
```

## Simple Encryption (XOR Obfuscation)

```csharp
private static readonly byte[] Key = { 0x4D, 0x6F, 0x62, 0x69 };

public static string Encrypt(string plainText) {
    byte[] data = System.Text.Encoding.UTF8.GetBytes(plainText);
    for (int i = 0; i < data.Length; i++)
        data[i] ^= Key[i % Key.Length];
    return System.Convert.ToBase64String(data);
}
// For real security: System.Security.Cryptography.Aes
```

## Common Gotchas

1. **JsonUtility limitations**: No Dictionary, no polymorphism, no null for value types → use Newtonsoft.Json
2. **Mobile file permissions**: iOS iCloud backup includes persistentDataPath by default
3. **WebGL**: No filesystem → use `PlayerPrefs` or `IndexedDB` via JS interop
4. **Threading**: File I/O on main thread causes hitches → use `async/await` or background thread
5. **Save corruption**: Write to temp file, then rename (atomic operation)
6. **BinaryFormatter**: DEPRECATED and insecure — never use for save files
