---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Open PR

Use this when: creating the branch, pushing files, and opening the pull request in the target kit repo (after routing and paths have been resolved).

## Main flow (has push access)

```
1. create_branch(owner, repo, branch)
   → If branch exists: append YYMMDD suffix
     e.g., omg-sync/coreomg-cook-260408
2. push_files(owner, repo, branch, files=[{path, content}...], message)
   → All files in ONE atomic commit
3. create_pull_request(owner, repo, title, head=branch, base="main")
```

## Fork flow (no push access — 403 on create_branch)

```
1. fork_repository(owner, repo)
   → If fork exists: reuse it
2. create_branch on FORK (fork-owner, repo, branch)
3. push_files to FORK branch
4. create_pull_request(owner=original, repo, head="fork-owner:branch", base="main")
```

## Dry-run flow (--dry-run)

```
1. For each target file: get_file_contents(owner, repo, path) → current remote content
2. Diff local modified file vs remote current
3. Display diff to user
4. Stop — no branch or PR created
```

## PR title and body format

**Title:** `fix({module}): update {skill}` or `fix({kit}): update {name}` for kit-wide

**Body (REQUIRED sections — do NOT open a PR missing any of these):**

```markdown
## Versions (at sync time)

- **Kit**: `{kit-name}` v`{kit-version}` (from consumer `.agents/metadata.json`)
- **Module**: `{module-name}` v`{module-version}` (or "kit-wide")
- **OMG CLI**: `{cli-version}`
- **Platform**: `{os}` `{os-release}`

## Plan link

`{relative-path-to-plan}` — or `ad-hoc` if no plan doc.

## Rationale (why this change is generic)

{1-3 sentences — must argue the change applies to ALL consumers of this kit/module,
not just the originating project. If the change is project-specific, sync-back must refuse.}

## Changed files

- `{path 1}` — {one-line description of change}
- `{path 2}` — {one-line description of change}
```

Missing any section → REFUSE to open the PR and ask the parent to fill it in.

## Post-PR rules

- Sync-back ONLY creates the PR. Review, triage, and merge happen in the kit repo.
- Do NOT automerge from the consumer project.
- End every invocation by reporting the PR URL and noting "review + merge in the kit repo."
- Use `omg-triage` from inside the kit repo to process the sync-back PR backlog.
