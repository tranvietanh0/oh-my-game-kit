---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity Text Config — Gotchas & Failure Modes

## G1: YAML FileID Fragility (High Risk)

Every YAML object has a unique `fileID`. Adding/removing components shifts all subsequent fileIDs, silently breaking references.

```yaml
# This reference block — NEVER manually change
- component: {fileID: 7823949173284376}
```

**Rule**: If a line contains `{fileID: ...}` or `guid:`, do not touch it.
**Detection**: Broken references show as missing MonoBehaviour (null) in Inspector with no error.
**Fix**: Revert the edit; use C# API instead.

---

## G2: manifest.json Does Not Auto-Refresh Package Manager

Editing `manifest.json` does NOT trigger Package Manager window update or package resolution. `AssetDatabase.Refresh()` has no effect on Package Manager.

**Symptom**: File saved, `refresh_unity` called, but package is still missing or old version.
**Fix**: Restart the Unity Editor. Only a full restart triggers Package Manager re-resolution.

**Alternative**: Use `UnityEditor.PackageManager.Client` API from C# for reliable package management without restart:
```csharp
UnityEditor.PackageManager.Client.Add("com.unity.entities@1.4.5");
```

---

## G3: Not All ProjectSettings Files Are Text-Serialized

Even with "Force Text" asset serialization mode, some ProjectSettings files remain binary:
- `NavMesh.asset` — always binary (navigation mesh data)
- `LightingData.asset` — always binary (probe/lightmap arrays)
- Any `.asset` decorated with `[PreferBinarySerialization]`

**Detection**: Check file header. Open in text editor:
- `%YAML 1.1` on first line = text YAML, safe to read
- Binary garbage / no YAML header = do not edit

**Fix**: Use Editor API to regenerate (rebake NavMesh, rebake lighting).

---

## G4: Scene Files Are Extremely Dangerous

Unity scene files (`.unity`) contain dozens of interconnected fileID references. Structural changes cascade — adding one object shifts all subsequent object fileIDs.

**Common failure**: Adding a component reference or changing a parent object → entire GameObject hierarchy orphaned silently.
**Symptom**: GameObject disappears in hierarchy, no error logged.
**Fix**: Always use `EditorSceneManager` API. Never text-edit `.unity` files except for merge conflict resolution of simple primitive values.

---

## G5: AssetDatabase.Refresh() Does Not Reload Scripts

After editing `.asmdef` files that change compilation (add references, change platforms), `AssetDatabase.Refresh()` starts recompilation but Unity may crash or enter a broken state if scripts were in use during recompile.

**Safe workflow for .asmdef changes**:
1. Edit `.asmdef` file on disk
2. Call `refresh_unity` MCP tool OR go to Assets > Reimport All
3. If compilation errors appear, they may require manual Editor focus

**High-risk scenario**: Changing `.asmdef` while debugger is attached — disconnect debugger first.

---

## G6: ScriptableObject Text Edits Can Silently Lose Data

Editing a `.asset` ScriptableObject as YAML and introducing whitespace errors or indentation issues causes Unity to silently drop the field, reverting to default.

**Symptom**: Field shows default value after edit+refresh, no error.
**Detection**: Compare file on disk vs. Inspector value after refresh.
**Fix**: Use `AssetDatabase.LoadAssetAtPath<T>()` + `SerializedObject` API for safe, validated edits.

---

## G7: EditorPrefs Are Outside Project Files

EditorPrefs are stored in OS registry (Windows) or plist (macOS/Linux) — not in any project file. Text editing project files has no effect on EditorPrefs.

**Fix**: Use `EditorPrefs.SetString()`, `EditorPrefs.GetInt()`, etc. from C# editor script.

---

## G8: Prefab Variant FileID Chains

Prefab variants (overrides of base prefabs) contain `m_CorrespondingSourceObject` references that chain back to the base prefab. Editing these GUIDs silently breaks the variant.

**Rule**: Never edit prefab YAML to change variant relationships. Use `PrefabUtility` API:
```csharp
var contents = PrefabUtility.LoadPrefabContents(path);
// modify in memory
PrefabUtility.SaveAsPrefabAsset(contents, path);
PrefabUtility.UnloadPrefabContents(contents);
```

---

## G9: UITemplate Package Migration Reverts manifest.json Versions

UITemplate's package migration system can overwrite `Packages/manifest.json` on every Unity load when a package version does not match its migration config.

**Symptom**: You edit a `com.theone.*` package version in `Packages/manifest.json`, but the version reverts after Unity reloads.
**Cause**: `Assets/UITemplate/Editor/ProjectMigration/MigrationModules/PackageMigration/Resources/PackageMigrationConfig.json` contains a `PackagesToAdd` map that is treated as the migration source of truth.
**Fix**: When bumping a `com.theone.*` package version, update both `Packages/manifest.json` and the matching `PackagesToAdd` entry in `PackageMigrationConfig.json`. Manifest-only edits are not durable.
