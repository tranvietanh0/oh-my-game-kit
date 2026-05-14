---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Asset Hunter Pro — API Reference

Namespace: `HeurekaGames.AssetHunterPRO`

## Core Classes

### AH_Window (Main Window)
- Editor window for unused asset analysis
- Contains `AH_BuildInfoManager` for report data
- Menu: `Window/Asset Hunter PRO/Asset Hunter PRO`

### AH_BuildInfoManager
- Loads and manages `.ahbuildinfo` report files
- Tracks used/unused asset lists per build
- Provides tree view data for UI

### AH_SettingsManager (ScriptableSingleton)
```csharp
var settings = AH_SettingsManager.Instance;
settings.AddPathToExcludeList("Assets/Plugins/");
settings.AddTypeToExcludeList("MonoScript");
settings.AddExtensionToExcludeList(".shader");
settings.AddFileToExcludeList("Assets/file.txt");
settings.AddFolderToExcludeList("Editor");
```

### AH_DependencyGraphManager
- Bidirectional asset reference tracking
- "What does this asset reference?" + "What references this asset?"
- Uses `AssetDatabase.GetDependencies()` under the hood

### AH_DuplicateDataManager
- Content hashing for duplicate detection
- Groups identical assets by hash
- Reports file sizes per duplicate group

### AH_BuildProcessor
- Implements `IPreprocessBuildWithReport`, `IPostprocessBuildWithReport`
- Auto-hooks into Unity build pipeline
- Generates `.ahbuildinfo` JSON report post-build

### AH_SerializationHelper
- JSON/CSV export of analysis results
- Import/merge of multiple build reports

## Data Models

### AH_SerializedBuildInfo
- Top-level build report container
- Platform, date, scene list, asset tree

### AH_SerializedAssetInfo
- Per-asset record: GUID, path, size, used-in-build flag, referenced scenes

### AH_BuildReportFileInfo
- Build output file entry from Unity BuildReport

## Menu Items
| Path | Action |
|------|--------|
| `Window/Asset Hunter PRO/Asset Hunter PRO` | Main unused asset window |
| `Window/Asset Hunter PRO/Dependency Graph` | Reference tracking |
| `Window/Asset Hunter PRO/Duplicate Assets` | Duplicate finder |
| `Window/Asset Hunter PRO/Settings` | Exclusion configuration |
