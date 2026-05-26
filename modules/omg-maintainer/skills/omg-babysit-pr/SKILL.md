---
name: omg-babysit-pr
description: "Monitor a PR to green+merged. Use for: 'babysit pr', 'watch pr', 'monitor pr', 'flaky ci', 'auto merge'. Retries flaky CI, resolves simple conflicts, auto-merges when approved+green."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Babysit PR

Monitor a pull request until it is merged. Handles flaky CI, simple merge conflicts,
and auto-merges when conditions are met.

## Trigger Phrases
"babysit pr", "babysit-pr", "watch pr", "monitor pr", "auto merge", "flaky ci"

## Workflow

```
Start
  └─ Fetch PR state (status, reviews, conflicts)
       ├─ APPROVED + GREEN + no conflicts → merge
       ├─ CI FAILING → classify failure
       │     ├─ Known flaky test → retry CI
       │     └─ Real failure → report to user, stop
       ├─ MERGE CONFLICT → attempt auto-resolve
       │     ├─ Simple (non-overlapping) → resolve + push
       │     └─ Complex (overlapping logic) → report to user, stop
       └─ PENDING → wait (poll interval: 60s) → loop
```

## Operations

| Flag | Default | Description |
|---|---|---|
| `--dry-run` | off | Print actions without executing them |
| `--max-retries` | 3 | Max CI retry attempts before escalating |
| `--poll-interval` | 60s | Seconds between status checks |
| `--no-auto-merge` | off | Skip merge step (monitor only) |

## Commands Used

```bash
gh pr view <number> --json state,reviews,statusCheckRollup,mergeable
gh pr checks <number>
gh run rerun <run-id> --failed
gh pr merge <number> --squash --auto
gh pr diff <number>
```

## Merge Conditions (all must be true)

- [ ] At least 1 approved review
- [ ] No changes-requested reviews
- [ ] All required status checks green
- [ ] No merge conflicts
- [ ] PR is not in draft state

## Conflict Resolution Policy

**Auto-resolve (safe):**
- Documentation-only files (`.md`, `CHANGELOG`, `docs/`)
- Generated files with clear regeneration command
- Package lock files (re-generate from manifest)

**Escalate to user (unsafe — stop):**
- Overlapping logic in source files
- Schema or migration conflicts
- Any conflict in security-sensitive files

## Gotchas

- **Branch protection rules:** If the repo requires a specific merge method (squash/rebase/merge),
  detect it from `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`
  before merging. Default: `--squash`.
- **CI retry abuse:** GitHub rate-limits workflow reruns. After `--max-retries` attempts on the
  same check, stop retrying and report the persistent failure. Never retry more than 3 times.
- **Stale approval:** If new commits are pushed after approval and "dismiss stale reviews" is
  enabled, the PR needs a fresh approval. Detect via `review.state == DISMISSED`, escalate.
- **Auto-merge already set:** If `gh pr view` shows `autoMergeRequest` is set, skip the merge
  step — GitHub will handle it. Avoid double-setting.
- **Draft PRs:** Never attempt to merge a draft PR. Check `isDraft` field first.
- **Missing `gh` CLI:** Verify `gh auth status` before starting. Fail fast if unauthenticated.

## Gotchas

- Never force-push or rewrite history on shared branches.

## Contribution Scoring

On first poll only, invoke `omg-contribution-score` with `type=sync-back-pr` + PR URL/title/body (catches PRs opened outside any OMG skill). Fire-and-forget; SSOT gates non-OMG repos. See `.agents/skills/omg-contribution-score/SKILL.md`.
