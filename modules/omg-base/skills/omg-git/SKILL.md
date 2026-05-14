---
name: omg-git
description: "Git operations with conventional commits. Stage, commit, push, PR, merge. Security scans for secrets. Auto-splits commits by scope."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Git — Git Operations

Unified git command. Routes to registered `omg-git-manager` agent via routing protocol.

## Default (No Arguments)

Use `AskUserQuestion` to present available operations:

| Operation | Description |
|-----------|-------------|
| `cm` | Stage files and create commits |
| `cp` | Stage files, create commits, and push |
| `pr` | Create Pull Request |
| `merge` | Merge branches |

## Arguments
- `cm`: Stage files and create commits
- `cp`: Stage files, create commits, and push
- `pr [to-branch] [from-branch]`: Create Pull Request
- `merge [to-branch] [from-branch]`: Merge branches

## Core Workflow

### Step 1: Stage + Analyze
```bash
git add -A && git diff --cached --stat && git diff --cached --name-only
```

### Step 2: Security Check
```bash
git diff --cached | grep -iE "(api[_-]?key|token|password|secret|credential)"
```
**If secrets found:** STOP, warn user, suggest `.gitignore`.

### Step 2.5: Local Quality Gate — Lint + Typecheck

Before commit, run the kit's quality scripts if present. This catches CI-side failures (biome, eslint, ruff, tsc) that would otherwise bounce the PR.

```bash
# Auto-discover scripts
jq -r '.scripts | to_entries[] | select(.key | test("^(lint|typecheck|check)$")) | .key' package.json 2>/dev/null
```

Then run each discovered script (short-circuit on first failure):

| Script | Purpose | If fails |
|---|---|---|
| `typecheck` / `check` | Type-check source | STOP — fix types before commit |
| `lint` | Style/format check (biome/eslint/ruff) | STOP — run `bun run lint --write` or equivalent auto-fix, then re-check |

**Skip rules:**
- No `package.json`: skip (not a Node/Bun project). Check for `Cargo.toml`, `pyproject.toml`, etc.; run their equivalents (`cargo check`, `ruff check`).
- Script doesn't exist: skip that script silently.
- User explicitly passed `--skip-lint`: skip with a warning in output.
- Staged diff is 100% docs-only (all `*.md` / `docs/**`): skip — content rules only.

**Rationale:** Over the span of PR #79 (2026-04-21), three CI rounds were lost to biome format violations that `bun run lint` would have caught in 3 seconds locally. Running lint before commit costs a few seconds; skipping it costs a full CI cycle + a fix-up commit that pollutes the PR history.

### Step 3: Split Decision
Split commits if: different types mixed, multiple scopes, FILES > 10 unrelated.
Single commit if: same type/scope, FILES <= 3, LINES <= 50.

### Step 4: Commit
```bash
git commit -m "type(scope): description"
```

## Output Format
```
staged: N files (+X/-Y lines)
security: passed
commit: HASH type(scope): description
pushed: yes/no
```

## Force-Push Safeguard

| Scenario | Action |
|----------|--------|
| `git push --force` on `main` or `master` | **BLOCKED** — warn user, refuse to execute |
| `git push --force` on any other branch | **WARNING** — ask for confirmation, suggest `--force-with-lease` |
| `git push --force-with-lease` anywhere | **ALLOWED** — safer alternative, proceed normally |

**Rule:** Never execute bare `--force` on protected branches (main, master, release/*). Always suggest `--force-with-lease` as the correct alternative — it fails if the remote was updated by someone else, preventing accidental overwrites.

Note: `secret-guard.cjs` hook already blocks credential exposure in commits. This rule extends to push safety.

## Commit Scopes in Modular Kits — Must Map to Real Modules

Oh My Game Kit's release pipeline (`parse-commits.cjs` in `oh-my-game-kit-release-action`) triggers a per-module version bump **only** when the commit scope matches one of:

- An exact module name (e.g. `feat(omg-base):`, `fix(dots-core):`)
- A comma-separated list of module names (e.g. `feat(dots-core,dots-combat):`)
- The kit repo name (e.g. `feat(oh-my-game-kit-unity):`) — bumps all modules
- One of the kit-wide meta-scopes: `modules`, `all`, `meta`, `kit` — bumps all modules
- Unscoped `feat`/`fix`/`refactor`/`perf` — bumps all modules
- Unscoped commit with `!` or `BREAKING CHANGE` — bumps all modules (major)

**Anything else is silently dropped.** `chore`, `docs`, `style`, `test`, `ci` are always no-bump. **Skill names are NOT module names.** `fix(omg-handoff):`, `feat(omg-doctor):`, `fix(omg-modules):` all produce zero affected modules → the release workflow logs `[release] No releasable commits since last tag — exiting` and publishes nothing.

**Before committing a skill-level fix to a modular kit:** check which module owns the skill (`cat .agents/modules/*/module.json | jq '{name, skills}'`) and either:
- Use the owning module name as scope: `fix(omg-base): ...` when editing `omg-handoff` (since `omg-handoff` is in `omg-base`)
- OR use a meta-scope when the fix is kit-wide: `feat(modules): ...`

**`module.spec.yaml` edits use the same scope as `module.json`** — commits touching `.agents/modules/<name>/module.spec.yaml` go under the owning module name (e.g. `feat(omg-base): update spec`), same as edits to that module's `module.json`. Per assembling-plan §15 + commit-scope-policy.md.

**Bug trail:** `oh-my-game-kit-core` main was stuck at `modules-20260417-1213` for 3 commits (2026-04-17 → 2026-04-18) because `feat(modules):` wasn't recognized (before oh-my-game-kit-release-action#6). Unsticking required force-moving the `v2` tag and a subsequent core commit to trigger the fixed release pipeline.

## Contribution Scoring

After `pr` succeeds (not `cm`/`cp` — no artifact), invoke `omg-contribution-score` with `type=sync-back-pr` + PR URL/title/body and target kit/repo. Fire-and-forget; SSOT gates non-OMG repos. See `.agents/skillsomg-contribution-score/SKILL.md`.

## Scope

Git operations only. Never sync files containing credentials, API keys, or secrets.
