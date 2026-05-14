---
name: omg-unity-base-asset-hunter-pro
description: "Asset Hunter Pro — unused asset detection, dependency graph, duplicate finder, project cleanup automation for Unity"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Asset Hunter Pro

Unity Editor tool for identifying unused assets, tracking dependencies, finding duplicates, and analyzing build reports. Package: `com.heurekagames.assethunterpro` v2.2.26.

## Quick Reference

| Feature | Menu Path | Key Class |
|---------|-----------|-----------|
| Unused Assets | `Window/Asset Hunter PRO/Asset Hunter PRO` | `AH_Window` |
| Dependency Graph | `Window/Asset Hunter PRO/Dependency Graph` | `AH_DependencyGraphWindow` |
| Duplicate Finder | `Window/Asset Hunter PRO/Duplicate Assets` | `AH_DuplicateWindow` |
| Settings | `Window/Asset Hunter PRO/Settings` | `AH_SettingsWindow` |

## Core Workflow

```
1. Run a Unity build (auto-logs to .ahbuildinfo)
2. Open Asset Hunter PRO window
3. Load latest report → review unused assets in tree view
4. Exclude false positives (scripts, addressables, plugins)
5. Delete confirmed unused assets
6. Re-verify with dependency graph
```

## Exclusion System (5 Categories)

| Category | Example | Use Case |
|----------|---------|----------|
| **Paths** | `Assets/Plugins/` | Third-party folders |
| **Types** | `MonoScript` | Scripts (common false positive) |
| **Extensions** | `.shader`, `.cginc` | Shader includes |
| **Files** | `Assets/Resources/config.json` | Specific files |
| **Folders** | `Editor`, `Gizmos` | Unity special folders |

## Programmatic API

```csharp
using HeurekaGames.AssetHunterPRO;

// Settings singleton
var settings = AH_SettingsManager.Instance;
settings.AddPathToExcludeList("Assets/Plugins/");

// Reports stored as .ahbuildinfo JSON in project
// Access via AH_BuildInfoManager (through AH_Window)
```

See `references/api-reference.md` for full API.

## MCP Integration

Use `manage_asset_hunter` MCP tool for automated queries:
- `scan_unused` — list unused assets from latest report
- `get_duplicates` — find duplicate assets by content hash
- `get_dependencies` — query asset reference graph
- `get_settings` — current exclusion configuration

## Critical Gotchas

1. **Scripts appear unused** — MonoScripts referenced only by code show as "unused". Exclude `MonoScript` type
2. **Must run a build first** — No `.ahbuildinfo` = no unused asset data
3. **Addressables false positives** — Assets loaded via Addressables API won't appear in dependencies
4. **Large project perf** — First scan of >10K assets takes 30-60s, cached after
5. **Editor-only** — All API is `#if UNITY_EDITOR`, no runtime
6. **DOTS entities** — ECS entity prefabs baked via SubScene are tracked normally

See `references/gotchas.md` for workarounds.

## References

- `references/workflow-guide.md` — Scan, clean, CI integration steps
- `references/api-reference.md` — Public classes and methods
- `references/gotchas.md` — Known issues and workarounds

## Security

- Editor-only, no runtime code, no external data transmission
- Reports contain file paths (project structure visible if shared)
- Delete operations irreversible — verify before bulk delete

## Bulk-Delete Safety Protocol

Before any bulk-delete (>10 assets), MUST:

1. **Snapshot the project** via VCS (`git stash --include-untracked` or branch-and-tag).
2. **Dry-run first** — `Asset Hunter Pro` reports include a `--dry-run` mode that lists what would be deleted; review the list outside the editor.
3. **Whitelist external references** — Resources/, Editor/, StreamingAssets/, Unity packages — these can be referenced via paths NOT detected by AssetDatabase, so include them in a manual review.
4. **Test rollback path before executing** — `git restore .` from the post-snapshot state should fully recover.
5. **Capture the report artifact** — the pre-delete report is the only forensic record of what was removed; save it outside the project tree before running the delete.

If any step is skipped, do NOT execute the bulk-delete — escalate via team review instead.
