---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Workflow: Create Worktree

Use this when: user wants to start a new branch in an isolated working directory.

## Intent Routing (MANDATORY — run BEFORE asking questions)

When invoked with ambiguous input like "new session for X", "worktree for X", "start X worktree":

1. **ALWAYS run `list --json` FIRST** — check existing worktrees by name match (fuzzy, case-insensitive)
2. If a matching worktree exists → jump to `references/workflow-session.md`. Do NOT ask which repo or feature name.
3. If no match → infer from current repo's `info --json`. If the user said "for this repo" or omitted a repo, use the current repo.
4. Only ask `AskUserQuestion` when:
   - `list` returned no match AND intent is genuinely ambiguous (multiple repo candidates, no clear current-repo context)
   - Monorepo project selection is required (Step 4 below)
5. Never ask "which repo" when current CWD is already a git repo with clear base — use it.
6. Never ask for a feature name when the user's phrasing points to an existing worktree — resolve via `list` first.

## Step 1: Get Repo Info
```bash
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs info --json
```
Parse: `repoType`, `baseBranch`, `projects`, `worktreeRoot`.

## Step 2: Detect Branch Prefix
- "fix", "bug", "error" → `fix`
- "refactor", "rewrite" → `refactor`
- "docs", "readme" → `docs`
- "test", "coverage" → `test`
- "chore", "deps" → `chore`
- "perf", "optimize" → `perf`
- Default → `feat`

## Step 3: Slug
"add authentication" → `add-auth`. Max 50 chars, kebab-case.

## Step 4: Monorepo
If monorepo and project not specified, use `AskUserQuestion` with project options.

## Step 5: Execute
```bash
# Standalone
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs create "<SLUG>" --prefix <TYPE>
# Monorepo
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs create "<PROJECT>" "<SLUG>" --prefix <TYPE>
```

## Step 6: Install Dependencies
Detect lockfile → run install in background.

## Notes
- Auto-detects superproject, monorepo, standalone repos
- Smart worktree location: superproject > monorepo > sibling
- Env templates (`.env*.example`) auto-copied on create
