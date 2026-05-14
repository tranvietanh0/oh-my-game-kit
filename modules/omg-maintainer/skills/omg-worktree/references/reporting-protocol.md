---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Reporting Protocol

Use this when: you need the exact before/after reporting format for any worktree command.

Every command MUST report before/after state to the user.

**Before execution:** Show current state relevant to the operation.
**After execution:** Show what changed.

## Per-Command Report Format

| Command | Before | After |
|---------|--------|-------|
| `create` | Repo type, base branch, worktree root | Created path, branch name, env files copied, next steps |
| `session` | Worktree path, branch, terminal detected | Launched confirmation, session command, layout (split panes) |
| `sync` | Per-worktree: branch, ahead/behind, dirty state | Per-worktree: rebase result (success/conflict/skipped), new ahead/behind |
| `envsync` | Source dir, env files found, target worktree count | Per-worktree per-file: copied/skipped/differs, total summary |
| `diff` | Total worktrees being compared | Per-worktree: ahead/behind, changed files list, dirty state, commit log |
| `status` | Total worktrees, base branch | Per-worktree: branch, dirty state, ahead/behind, env sync status |
| `remove` | Worktree path, branch name | Removed confirmation, branch deleted/kept |
| `merge` | Branch, dirty state, ahead/behind, existing PRs | PR created/found, merge result, LOCAL reset (old HEAD → new HEAD), REMOTE sync (force-pushed / recreated / already-clean), main worktree updated |

## Summary Line (MANDATORY)

End every operation with:
```
Summary: X worktrees synced, Y skipped, Z conflicts
```

## Global Options

- `--json` — JSON output for LLM parsing
- `--dry-run` — Preview without executing (`create`, `envsync`, `sync`)
- `--exclude <name>` — Skip a worktree during `envsync` (repeatable or comma-separated). Matches by basename, full path, or branch. Hard-errors if any pattern matches zero worktrees.
- `--worktree-root <path>` — Override worktree location (`create` only)
