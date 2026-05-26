---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Workflow: Diff and Status

Use this when: user wants to inspect what has changed across worktrees, or get a combined overview.

## Diff

```bash
# All worktrees vs base
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs diff --json
# Specific worktree
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs diff --worktree "<NAME>" --json
```

Reports per worktree: commits ahead/behind base, changed files list, dirty state, commit log.

## Status

```bash
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs status --json
```

Combined view: branch, dirty state, ahead/behind, env sync status per worktree.

## List

```bash
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs list --json
```

Lists all worktrees with name, path, branch. Use as the FIRST step in intent routing before asking the user anything.

## Info

```bash
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs info --json
```

Returns repo type, base branch, worktree root, project list (monorepo).
