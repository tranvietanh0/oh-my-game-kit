---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Cocos MCP Server Tools — Reference

Location: `extensions/cocos-mcp-server`

23 action-based MCP tools for AI-assisted editor control.

## manage_settings (7 actions)

| Action | Purpose |
|--------|---------|
| `get` | Read any settings file by name (engine, builder, project) |
| `set` | Deep-merge data into settings file |
| `list` | List all settings files in `settings/v2/packages/` |
| `get_engine_modules` | Get module enabled/disabled states from engine.json |
| `set_engine_modules` | Toggle modules (syncs both `cache` and `includeModules`) |
| `get_texture_config` | Read builder.json texture compression config |
| `set_texture_config` | Update texture settings (genMipmaps, presets, quality) |

## manage_code_analysis (4 actions)

| Action | Purpose |
|--------|---------|
| `scan_imports` | Regex scan on import lines across .ts/.js files |
| `scan_patterns` | General regex scan with extension/directory filtering |
| `get_file_stats` | File counts and sizes by extension |
| `find_references` | Find all files referencing a class/module name |

## manage_asset (enhanced — 3 new + 1 fixed)

| Action | Purpose |
|--------|---------|
| `get_audio_stats` | List audio files with sizes sorted by size |
| `get_texture_stats` | List textures with compression status from .meta |
| `update_meta` | Deep-merge properties into .meta file + reimport |
| `compress_textures` | Apply compression preset to texture .meta files (was stub, now works) |
