---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Workflow: Env Sync

Use this when: user wants to synchronize `.env` files across all worktrees, or check for compose env drift.

## Commands

```bash
# Sync from main worktree to all others (bidirectional "newest wins")
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs envsync --json
# Preview only — no files written
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs envsync --dry-run --json
# Custom source worktree
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs envsync --source /path/to/source --json
# Exclude a worktree from the sync
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs envsync --exclude my-feature --json
# Multiple excludes (comma-separated or repeatable)
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs envsync --exclude a,b --exclude c --json
```

Reports per worktree: each `.env` file copied/skipped/differs, total summary.

## `--exclude` flag

Use when the default bidirectional "newest wins" policy would overwrite a canonical master `.env` (e.g., a worktree has a newer but divergent `.env` with empty secret stubs). Exclude that worktree to protect master's production values.

Matches by basename, full path, or branch. Repeatable or comma-separated.
Hard-errors (`EXCLUDE_NOT_FOUND`) if any pattern matches zero worktrees — typo guard.

## Compose Env-Drift Detection (auto)

After file sync, envsync automatically scans `docker-compose*.yml` at the repo root of every worktree and diffs the `environment:` block for each service.

**Why:** feature branches that add or remove env refs (e.g., a merge drops `INTERNAL_SERVICE_SECRET` from `discord-bot-service`) silently break containers on next `--force-recreate`. The `.env` file sync does not catch this — compose env refs live in git, not on disk.

Behavior:
- Warn-only, never blocks or modifies files
- Reports per service which worktrees are missing keys that others have
- JSON field: `composeEnvDrift: { servicesChecked, driftedServices, drifts[] }`
- Pretty output prints a `⚠️  Compose env drift detected` block with the missing keys per worktree

Fix manually: add missing keys to the lacking worktree's compose file, or remove them if the divergence was intentional.
