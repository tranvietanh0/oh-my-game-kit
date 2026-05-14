---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-architecture
protected: false
---
# .asmdef GUID Resolution

Unity assembly definitions (`.asmdef`) can reference other assemblies in two formats:

1. **Name reference**: `"Game.Core"` — direct assembly name
2. **GUID reference**: `"GUID:abcdef1234567890abcdef1234567890"` — meta file GUID

## Resolution Algorithm

`lib/asmdef-parser.cjs` implements two-pass resolution:

### Pass 1: Build GUID map
For each `.asmdef` file found, read its companion `.asmdef.meta` file:
```
Assets/Scripts/Game.Core/Game.Core.asmdef
Assets/Scripts/Game.Core/Game.Core.asmdef.meta  <- contains guid: <hex>
```

The `.meta` file is YAML-like (Unity-specific format). Extract:
```yaml
guid: abcdef1234567890abcdef1234567890
```

Build: `Map<guid, assemblyName>`

### Pass 2: Resolve references
For each asmdef's `references` array, match entries:
- If `GUID:xxxxx` form → look up in map → resolved name or `?GUID:xxxxx` (unresolved)
- Otherwise → treat as direct name

## Unresolved GUIDs

When a GUID cannot be resolved (meta file missing, deleted asmdef):
- Node ID rendered as `?GUID:<hex>` in the Mermaid graph
- Warning emitted: `Unresolved GUID ref: GUID:<hex>`
- Does NOT crash — graph generation continues

## Example .asmdef

```json
{
  "name": "Game.Systems",
  "references": [
    "GUID:abcdef1234567890abcdef1234567890",
    "Game.UI"
  ],
  "noEngineReferences": false,
  "autoReferenced": true
}
```

## Example .asmdef.meta

```yaml
fileFormatVersion: 2
guid: abcdef1234567890abcdef1234567890
AssemblyDefinitionImporter:
  externalObjects: {}
  userData:
  assetBundleName:
  assetBundleVariant:
```

## Unity Version Compatibility

The asmdef format has been stable since Unity 2017.3. Key flags supported:
- `noEngineReferences` — assembly does not reference UnityEngine/UnityEditor
- `autoReferenced` — default: true; false = not auto-included in Unity project
- `overrideReferences` — explicit precompiled references
- `includePlatforms` / `excludePlatforms` — platform-specific inclusion
- `references` — array of dependency names or GUID: refs
