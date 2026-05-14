---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
---

# Unity MCP Error Recovery

## Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Tools return "busy" | Compilation in progress | Wait, check `editor_state` |
| "stale_file" error | File changed since SHA | Re-fetch SHA with `get_sha`, retry |
| Connection lost | Domain reload | Wait ~5s, reconnect |
| Commands fail silently | Wrong instance | Check `set_active_instance` |

## AUTO-START

Set `EditorPrefs.SetBool("MCPForUnity.AutoStartOnLoad", true)` once — MCP starts automatically when Unity opens. No manual "Start Session" click needed. Auto-resumes after domain reloads (compilation) too.

## CRITICAL GOTCHA — Do NOT Assume Cache Issues

- Never close Unity Editor, reimport all assets, or clear Library/ as a first response to errors
- These are destructive, slow operations that rarely fix the actual problem
- Instead: read the console error, diagnose the root cause, fix the code
- Only clear caches as a last resort after confirming the root cause is genuinely stale data

## Asset Refresh Hierarchy (always try in order)

1. `refresh_unity(mode="force", scope="scripts")` — for script changes
2. `refresh_unity(mode="force", scope="all")` — for asset/shader/asmdef changes
3. Targeted reimport: `reimport_assets(paths=[...])` — single asset/folder (issue #5, pending MCP tool)
4. `rm -rf Library/EntityScenes/` + `refresh_unity` — stale SubScene cache
5. `rm -rf Library/BurstCache Library/Bee` + `refresh_unity` — stale Burst cache
6. **Reimport All — ABSOLUTE LAST RESORT** — only when import DB itself is corrupted
