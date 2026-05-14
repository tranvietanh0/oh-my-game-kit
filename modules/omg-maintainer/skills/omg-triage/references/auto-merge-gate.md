---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Step 5b — Auto-Merge Gate (and Step 5c BEHIND handling)

Before any merge action — default-auto or `--ask` — every PR with `decision: merge` MUST pass the **strict** gate below. Anything ambiguous defers to human; **never relax the gate to chase throughput**.

Run for each PR:
```bash
gh pr view {n} --repo {REPO} --json mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,isDraft,labels
```

| Field | Required value | Reason |
|---|---|---|
| `isDraft` | `false` | Drafts are author-WIP, never merge |
| `reviewDecision` | `APPROVED` | At least one approving review and zero unresolved review-required threads |
| `statusCheckRollup[*].conclusion` | all `SUCCESS` (or `NEUTRAL` for skipped) | Zero red checks; zero pending checks. `PENDING` / `IN_PROGRESS` / `QUEUED` → defer, do NOT wait |
| `mergeable` | `MERGEABLE` (not `CONFLICTING`, not `UNKNOWN`) | Branch can be merged without human conflict resolution |
| `mergeStateStatus` | `CLEAN` or `BEHIND` | `CLEAN` → merge directly. `BEHIND` → rebase first (Step 5c). Anything else (`DIRTY`, `BLOCKED`, `UNSTABLE`, `UNKNOWN`) → defer |
| Skill-file gate | If PR touches `$HOME/.agents/skills/`, must have run `omg-skill-creator validate <skill-name>` (Step 4) | Skillmark conventions verified |

**If ALL pass → eligible for auto-merge.**
**If ANY fails → mark `merge-blocked: <reason>` in report, do NOT merge, surface to human.**

## `--yolo` flow into the strict gate

In yolo mode, `reviewDecision === APPROVED` is satisfied by triage **actually approving the PR via `gh pr review --approve`** (Step 4d), not by an internal bypass. The merit pipeline is:

1. **Step 4** — Spawn `omg-code-reviewer` agent. Returns `approve` / `request-changes` / `comment`
2. **Step 4b** — Risk classifier returns `low` / `medium` / `high`
3. **Step 4c** — Auto-fix common blockers on PR head (low-risk + reviewer-approve only)
4. **Step 4d** — Self-approve via `gh pr review --approve` (low-risk + reviewer-approve + auto-fix-clean only). After this, `reviewDecision` is genuinely APPROVED in GitHub state
5. **Step 5b** — Strict gate runs identically; passes naturally because Step 4d set the approval

**Merit-pass requires ALL of:**
- omg-code-reviewer verdict = `approve`
- Step 4b risk = `low`
- PR author ≠ authenticated `gh` user (GitHub forbids self-approve of own PRs)
- Step 4c auto-fix succeeded (or no fixes needed)
- Step 4d approval API call succeeded

**Failure modes (all defer to human, none silent):**
- omg-code-reviewer = `request-changes` → post review via `gh pr review --request-changes`; mark `merge-blocked: code-reviewer-rejected`
- omg-code-reviewer = `comment` → post review as comment; mark `merge-blocked: code-reviewer-uncertain`
- Risk = `medium` or `high` → mark `merge-blocked: risk-above-threshold-{level}`; surface to human for real review
- Self-authored PR → mark `merge-blocked: self-authored`; surface to human for review
- Auto-fix failed → mark `auto-fix-failed: {category}`; rolled back; surface to human

All other gate fields (`mergeable`, `statusCheckRollup`, `mergeStateStatus`, `isDraft`, skill-file gate) are checked **identically** in yolo mode — these are correctness guards, not policy gates, and yolo never bypasses correctness.

## Step 5c — Handling `BEHIND` Branches

When `mergeStateStatus = BEHIND` (branch is behind base, otherwise clean), delegation to `omg-babysit-pr {n} --repo {REPO}` is sufficient — babysit-pr's existing workflow rebases-then-merges when conditions allow. **Triage adds NO extra flags** to babysit-pr; the strict gate is enforced upstream (Step 5b only delegates when `mergeStateStatus ∈ {CLEAN, BEHIND}`).

If babysit-pr's rebase produces a conflict (which would trigger its own conflict-resolution policy), triage's strict-gate principle requires we override that and defer:

1. Triage MUST pass `--no-auto-merge` if it wants to do a rebase-only flow — but since babysit-pr does not expose a rebase-only mode, the simpler invariant is: triage delegates to babysit-pr only when `mergeStateStatus = CLEAN`. For `BEHIND`, triage should call `gh pr update-branch {n} --repo {REPO}` (or equivalent merge-base catch-up via the GitHub API) FIRST, re-fetch state, and only then delegate to babysit-pr if state turns CLEAN.

2. If `gh pr update-branch` reports conflict / fails: defer to human, comment on PR with `triage: branch update produced conflicts, leaving for human review` and the conflicted file list. NEVER hand a CONFLICTING branch to babysit-pr (its conflict-resolution defaults are looser than triage's strict gate).

**No auto conflict resolution — even for one-line frontmatter conflicts.** The strictest setting per maintainer choice (avoids cases where CI-injected metadata diverges in ways the merge tool can't safely auto-pick).