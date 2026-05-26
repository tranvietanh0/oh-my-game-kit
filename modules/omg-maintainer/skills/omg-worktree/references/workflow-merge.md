---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Workflow: Merge (PR-based)

Use this when: user wants to merge a worktree's branch back to the base branch via GitHub PR.

Merges via `gh pr` instead of local merge because the target branch (e.g., `master`) is checked out in the main worktree — `git checkout master` is unavailable here.

## Options
- `--target <branch>` — Target branch (default: base branch from `info`)
- `--delete` — Delete worktree after merge (default: keep)
- `--no-reset` — Skip post-merge reset (default: ALWAYS reset local + remote)
- `--squash` — Squash merge (default; tries squash first, falls back to rebase then merge)

## Step 1: Pre-merge checks
```bash
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs info --json
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs diff --worktree "<NAME>" --json
```
- If dirty: commit or stash uncommitted changes first
- If behind base: rebase is MANDATORY before PR (Step 2)

## Step 2: Rebase on target (MANDATORY if behind)
```bash
git fetch origin
git rebase origin/<target>
# If conflicts: abort, warn user, recommend manual resolution
git push origin <branch> --force-with-lease
```
Use `--force-with-lease` (safe force push) since rebase rewrites history.

## Step 3: Push branch
```bash
git push origin <branch>
```
If Step 2 already pushed with `--force-with-lease`, this step may be a no-op.

## Step 4: Create PR (if none exists)
```bash
gh pr list --head <branch> --state open --json number
# If no open PR:
gh pr create --base <target> --head <branch> --title "<title>" --body "<body>"
```
Auto-generate PR title from branch name or commit summary. Body: list commits + changed files count.

## Step 5: Merge PR
```bash
gh pr merge <number> --squash   # Try squash first
gh pr merge <number> --rebase   # Fallback if squash disallowed
gh pr merge <number> --merge    # Fallback if rebase disallowed
```

## Step 6: Reset worktree AND sync remote branch (DEFAULT — always unless --no-reset)

Reset BOTH local and remote so the worktree branch matches the target head on both sides.
Without syncing the remote, the feature branch either stays at the pre-merge commit (diverged
from local) or gets auto-deleted by GitHub (orphaning the local tracking ref). Either way,
the next push from this worktree will fail confusingly.

```bash
# 1. Prune stale remote-tracking refs
git fetch --prune origin

# 2. Reset local branch to target
git reset --hard origin/<target>

# 3. Sync remote — handle three states:
#    a) Remote still exists → force-with-lease (merge left it behind)
#    b) Remote auto-deleted by GitHub (delete_branch_on_merge=true) → recreate via plain push
#    c) Tracking already clean → both pushes become no-ops
if git ls-remote --exit-code origin <branch> > /dev/null 2>&1; then
  git push origin <branch> --force-with-lease
else
  git push -u origin <branch>
fi
```

**Why `--force-with-lease` is safe here:** the squash merge just landed in `<target>`; the pre-merge commits on this branch are now duplicate history. Force-syncing the remote to match master head is the intended post-merge cleanup. `--force-with-lease` still protects against concurrent pushes from another session.

Report the reset: show old HEAD vs new HEAD (local), and whether the remote was force-synced, recreated, or already clean.

## Step 6b: Post-merge (optional flags)
```bash
# --delete: Remove worktree entirely
node $HOME/.agents/skills/omg-worktree/scripts/worktree.cjs remove "<NAME>"
```

## Step 7: Update main worktree
```bash
cd <main-worktree-path> && git pull origin <target>
```

## Error Handling

| Error | Action |
|-------|--------|
| Merge commits not allowed | Try `--squash`, then `--rebase` |
| PR has conflicts | Run `sync` to rebase first, re-push |
| Branch not pushed | Push before creating PR |
| Dirty worktree | Commit or stash first |
