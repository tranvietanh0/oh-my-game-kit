---
name: omg-cocos-playable-editor-tools
description: "ConfigWatcher, parameter JSON generation, NPM Package Manager extension, and Cocos MCP Server tools for Cocos Creator playable ads editor tooling"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Editor Tools — ConfigWatcher & Package Manager Extension

Two distinct editor tools: **ConfigWatcher** (auto-generates dashboard JSON) and **package-manager** extension (CPM registry UI). Also includes **Cocos MCP Server** (23 action tools for AI-assisted editor control). See also: `omg-cocos-playable-parameter` (PlayableConfig that ConfigWatcher reads), `omg-cocos-playable-sdk-core`.

## Quick Reference

| Tool | File | Purpose |
|------|------|---------|
| ConfigWatcher | `assets/PlayableParamterTool/json-generate/ConfigWatcher.ts` | Auto-generates `playable-config.json` and `parameter-assets.json` |
| Package Manager | `extensions/package-manager/` | CPM registry UI — install/sync PlayableLabs packages |
| Cocos MCP Server | `extensions/cocos-mcp-server/` | 23 MCP tools for AI-assisted editor control |

## Details

- [ConfigWatcher internals, hash detection, file writing, asset tracking](references/configwatcher.md)
- [Package Manager architecture, NpmService, SyncService, auth](references/package-manager.md)
- [Cocos MCP Server tools: manage_settings, manage_code_analysis, manage_asset](references/cocos-mcp-server.md)

## Common Mistakes

- Editing files in `ParameterToolBuild/` — they are overwritten by ConfigWatcher.
- Calling `require('fs')` in non-editor scripts — crashes at runtime; always guard with `if (!EDITOR) return`.
- Forgetting `@executeInEditMode(true)` on a component that needs editor-only behavior.
- Package Manager extension source is TypeScript in `source/` — compiled output is in `dist/`. Edit source, not dist.
- `SyncService` uses `fs-extra` (not native `fs`) for `ensureDir`, `copy`, `remove` — ensure `fs-extra` is in the extension's `node_modules`.
- `Editor.Message.request` is async — always `await` it inside an `async` function.

## Gotchas

- **Editor scripts run in a different process — `cc.director` is undefined** — never share runtime singletons across editor/runtime.
- **Editor menu items are registered once at launch** — code changes need an editor restart, not an editor reload.
