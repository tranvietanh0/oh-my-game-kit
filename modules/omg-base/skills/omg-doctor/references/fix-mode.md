---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Doctor Fix Mode Reference

## Auto-Healing Table

| Issue | Auto-Fix? | Action |
|-------|-----------|--------|
| Stale manifest | YES | Regenerate `.omg-manifest.json` from actual files in module |
| Missing agent reference | REPORT | Routing refers to agent with no .md file |
| Orphan files | REPORT | Files in `.agents/` not in any manifest |
| Duplicate activation keywords | REPORT | Same keyword at same priority in multiple fragments |
| Missing origin metadata | REPORT | CI/CD-managed and committed to git — should be present after first release |
| Invalid JSON fragment | REPORT | Syntax error in omg-*.json files |
| Schema version mismatch | REPORT | metadata.json schema != expected |

**Auto-fix rules:**
- Only fix issues that are deterministically resolvable
- Never delete files — only regenerate manifests
- Never modify CI/CD-generated metadata
- Always report what was fixed and what needs manual attention

## Fix Mode Steps (`omg-doctor fix`)

1. Regenerate `.omg-manifest.json` from installed files under `.agents/`
2. Detect orphaned files (in `.agents/` but not in manifest) → report as user-created
3. Detect stale origins (manifest references missing files) → remove stale entries
4. Report what was fixed vs what requires manual intervention

### Module Fix Mode (if `.agents/metadata.json` has `modules` key)
- Remove stale module files (files from uninstalled modules)
- Regenerate `.agents/metadata.json` with correct module assignments

## Config Debug (`omg-doctor --config`)

Dump resolved config from all sources with origin tracking:
- Feature flags (merged, highest priority wins) with source file
- Routing resolution per role with source file and priority
- Activation fragments loaded with module and skill counts
- Config files loaded in priority order
- Potential issues (overrides, conflicts, missing configs)
