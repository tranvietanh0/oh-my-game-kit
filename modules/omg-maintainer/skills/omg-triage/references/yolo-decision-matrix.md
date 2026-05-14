---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Step 6b — `--yolo` mode decision matrix

When `--yolo` is set, every decision that default-auto would defer is replaced with a structured AI investigation step. Principle: **investigate before deciding, decide before deferring**.

## Decision matrix

| Default-auto behavior | Yolo behavior |
|---|---|
| `merge` blocked on missing APPROVED review | Run merit pipeline (Steps 4 → 4b → 4c → 4d): omg-code-reviewer agent + risk classifier + auto-fix on PR head + self-approve via `gh pr review --approve`. After Step 4d, `reviewDecision` is genuinely APPROVED in GitHub state and the unmodified Step 5b strict gate passes. Merit-pass requires ALL of: omg-code-reviewer = `approve`, risk = `low`, PR author ≠ self, auto-fix succeeded |
| `solve` skipped because `effort: large` | Auto-chain `omg-plan` → `omg-cook --auto` per phase. Sequential per-phase (later phases may depend on earlier output). Stop chain on first phase failure |
| Tracking issue skipped per memory rule (`feedback_tracking_issue_pattern.md`) | Investigate declared blockers (parse body + comments for blocker references). For each reference, run `gh issue view {n} --json state,closed` / `gh pr view {n} --json state,merged`. If ALL blockers are resolved → escalate to `solve` and run plan→cook chain. If ANY still open → comment with current blocker status, defer |
| `defer` because `infoStatus: insufficient` | UNCHANGED. Yolo does NOT manufacture missing repro info — the comment-and-defer behavior remains. Acting without repro data is a correctness violation, not a policy gate |
| `close` with reason | UNCHANGED. Same template, same action |

## Tracking-issue blocker-detection regex

```
/(blocked on|depends on|waiting on|prerequisite[d]?:?|prereq:?)\s*(?:#(\d+)|PR\s*#?(\d+)|([A-Za-z0-9_.-]+\/[A-Za-z0-9._-]+#\d+))/gi
```

Capture: local `#NN`, `PR #NN`, or cross-repo `org/repo#NN`. Resolve each via `gh` and aggregate state. If parsing yields zero blocker references in a tracking-style issue, treat the whole issue as still-tracking (conservative) and defer with comment listing the heuristic used.

## Plan→Cook chain (large issues)

1. Spawn `omg-plan` skill with full issue context (title, body, comments, labels, repo, module hint from Step 2b)
2. Plan agent writes phased plan to `plans/{YYMMDD}-{HHMM}-issue-{repo-slug}-{n}/plan.md` + per-phase files
3. For each phase sequentially: spawn `omg-cook --auto --plan-dir {path}`
4. Surface aggregate result in triage report: phases shipped, phases failed, links to PRs created
5. On any phase failure: STOP chain, mark remaining phases `chain-blocked: phase-{N}-failed`, post comment on the source issue with a summary

## Yolo invariants — NEVER bypassed

- `mergeable: MERGEABLE` (no merging conflicting branches)
- `statusCheckRollup` all green (no merging red CI)
- `mergeStateStatus ∈ {CLEAN, BEHIND}` (no merging DIRTY/BLOCKED/UNSTABLE)
- Skill-file gate (Step 4) — Skillmark validation runs unchanged
- `infoStatus: insufficient` items still defer
- Privacy + credential sanitization (Step 1c) unchanged

## Yolo failure handling (fail-conservative)

- omg-code-reviewer agent timeout/crash → mark `merge-blocked: review-agent-failed`, defer, surface to human
- plan agent failure → mark issue `chain-blocked: plan-failed`, comment with error excerpt, defer
- cook agent failure on phase N → STOP chain, mark `chain-blocked: phase-{N}-failed`
- Blocker-resolution `gh` call failure → treat as "still blocked" (conservative), defer

## Step 6c — `--yolo` Active Merge

After Step 4d self-approve and Step 5b gate pass, `--yolo` merges the PR **itself** via `gh pr merge {n} --squash --delete-branch`. On PENDING CI: poll `statusCheckRollup` every 60s for up to 10 min, then merge if green or mark `merge-deferred: ci-timeout`. On `BEHIND`: fall back to `omg-babysit-pr`. On gh-merge failure: mark `merge-blocked: gh-merge-failed` and surface to human (no retry).

Triage merges in-session — does NOT delegate to babysit-pr — because babysit may never run if the user moves on / session ends. Direct merge is the only way to satisfy the Completion Contract.

Full per-PR completion loop, parallelism rules, cache-stability constraints: `references/completion-verification.md` § "Step 6c".