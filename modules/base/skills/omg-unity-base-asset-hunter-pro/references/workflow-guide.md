---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Asset Hunter Pro — Workflow Guide

## Initial Setup
1. Package already installed at `Packages/com.heurekagames.assethunterpro/`
2. Run any Unity build (File > Build Settings > Build) to generate `.ahbuildinfo`
3. `AH_BuildProcessor` hooks into pipeline automatically

## Scan Unused Assets
1. Build project (auto-logs `.ahbuildinfo`)
2. `Window > Asset Hunter PRO > Asset Hunter PRO`
3. Click "Load" > select latest `.ahbuildinfo`
4. Tree view shows unused assets highlighted
5. Filter by type, right-click > "Select in Project" to verify
6. Delete confirmed unused assets

## Configure Exclusions (before deleting)
`Window > Asset Hunter PRO > Settings`
- **Excluded Paths**: `Assets/Plugins/`, `Assets/StreamingAssets/`
- **Excluded Types**: `MonoScript` (scripts referenced only by code)
- **Excluded Extensions**: `.shader`, `.cginc`, `.hlsl`
- **Excluded Folders**: `Editor`, `Gizmos`

**DOTS-specific**: Exclude `Packages/`, `Library/EntityScenes/`, `Assets/Synty/`

## Dependency Graph
1. `Window > Asset Hunter PRO > Dependency Graph`
2. Select any asset in Project window
3. Shows "References" + "Referenced By" directions
4. Zero "Referenced By" = likely safe to delete (except code-only refs)

## Duplicate Detection
1. `Window > Asset Hunter PRO > Duplicate Assets`
2. Groups by content hash (not filename)
3. Keep one copy, delete rest, update references

## MCP Automation
```
manage_asset_hunter(action="scan_unused")     # List unused
manage_asset_hunter(action="get_duplicates")  # Find dupes
manage_asset_hunter(action="get_dependencies", asset_path="Assets/...") # Check refs
```

## Best Practices
- Scan after major imports or refactors
- Always verify with dependency graph before deleting
- Exclude MonoScript type by default
- Export reports before cleanup for rollback
