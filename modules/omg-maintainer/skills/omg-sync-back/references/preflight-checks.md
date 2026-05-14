---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Pre-flight Checks

Use this when: starting any sync-back operation after consumer-guard passes. These checks are MANDATORY before any file write.

## 1. GitHub MCP connected?

If not → ERROR: `"Connect GitHub MCP: codex mcp add github"`

## 2. Resolve repo URL per file

For each changed file, determine target repository from in-file origin metadata (in priority order):

1. YAML frontmatter `repository` field (e.g., `repository: "The1Studio/oh-my-game-kit-unity"`) → use directly
2. `.omg-resolved-config.json` → `routing` for pre-merged config
3. Last fallback: read ALL `omg-config-*.json` → match `kitName` against file's `origin` → `repos.primary`

## 3. Detect install location

- Path starts with `$HOME/.agents/` → global install
- Path starts with `$CWD/.agents/` → project install

Adjust all subsequent path references accordingly.

## 4. Verify repo access

Call `get_file_contents(owner, repo, "/")` on repo root. If 404/403 → ask user to confirm repo access before proceeding.

## 5. Staleness check (MANDATORY — v1.2.0)

For EACH target file the sync will write:

1. `get_file_contents(owner, repo, path, ref="main")` → fetch current remote content + SHA
2. `list_commits(owner, repo, path=target_path, sha="main")` → recent commits touching this file
3. If remote SHA differs from the base this sync started from, OR if newer commits exist since the last known sync timestamp → **BLOCK and warn:**

```
⚠️ {N} commits on main have touched {path} since your last sync. Remote file has diverged.
```

List the offending commits (hash + message). Offer three options:
- **(a) abort** — reconcile manually
- **(b) overwrite** — requires `--force` flag
- **(c) merge** — pull remote content, re-apply local diff, then push

**Never silently push a stale branch.** A `CONFLICTING` PR must never be produced.

**Why this exists:** Prior to v1.2.0, the skill produced unmergeable PRs against stale bases (see The1Studio/oh-my-game-kit-core#7 incident, 2026-04-09).
