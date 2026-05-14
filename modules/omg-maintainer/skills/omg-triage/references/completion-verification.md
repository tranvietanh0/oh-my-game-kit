---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Completion Verification — Step 6c (Active Merge) + Step 7 (Definition of Done)

Detail for SKILL.md Steps 6c and 7. The completion contract is the guarantee that triage finishes only when every classified item is in a terminal state — no PRs left in flight, no issues left open, no defer-comments un-posted.

## Step 6c — `--yolo` Active Merge (per-PR completion loop)

After Step 4d self-approve and Step 5b strict gate pass, `--yolo` performs the merge **itself**, in-session, rather than delegating to `omg-babysit-pr`. This is the change that makes the Completion Contract real: triage cannot return "done" with merges still in flight.

### Per-PR completion loop

1. **Re-check Step 5b strict gate** (state may have shifted between approve and merge):
   ```bash
   gh pr view {n} --repo {REPO} --json mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,isDraft
   ```

2. **All checks SUCCESS / NEUTRAL?** → run merge:
   ```bash
   gh pr merge {n} --repo {REPO} --squash --delete-branch
   ```
   Verify: `gh pr view {n} --json state` returns `MERGED`. Record `merged: <merge-commit-sha>` in report.

3. **Any check PENDING / IN_PROGRESS / QUEUED?** → enter bounded poll:
   - Poll interval: **60 seconds**
   - Total budget: **10 minutes** (10 polls)
   - On each poll: re-fetch `statusCheckRollup`. If all terminal → break out and merge (step 2). If any FAILURE / ERROR → break out, mark `merge-blocked: ci-failed: <check-name>`, do NOT merge
   - Timeout reached with checks still pending → mark `merge-deferred: ci-timeout-{minutes}m`, do NOT merge, surface to human in the final report

4. **`mergeStateStatus = BEHIND`?** → fall back to `omg-babysit-pr {n} --repo {REPO}` (its rebase-then-merge flow handles BEHIND properly). Wait for babysit-pr's return value; verify `gh pr view {n} --json state` returns `MERGED` before considering complete.

5. **Merge call fails (network, race, branch-protection rule we missed)?** → mark `merge-blocked: gh-merge-failed: <stderr-excerpt>`, surface to human. Do NOT retry inside the loop (a real GitHub error usually means manual intervention is required).

### Why merge in-session, not delegate

Babysit-pr is a separate skill with separate timing assumptions. If triage delegates and returns control to the user, the babysit job may never run (user moves on, session ends, stop hook fires). The user's expectation of `--yolo` is "you actually closed the loop." Direct merge satisfies that contract; delegation breaks it.

### Cache stability

The per-PR merge action is sequential, but the loop runs in **parallel batches of 5** across the merge partition (matching Step 6's general parallelism rule). Status output uses constant-shape per `agent-security-boilerplate.md` — substitute leaf values, never headers.

## Step 7 — Definition of Done (Completion Verification)

This step runs after Step 6 dispatches all actions. **Triage MUST NOT report completion until every classified item is in a terminal state.** Default-auto and `--yolo` both enforce this.

### Per-decision terminal-state table

| Decision | Terminal state | Verification command | Acceptable non-terminal | Action if non-terminal |
|---|---|---|---|---|
| `merge` | PR `MERGED` in GitHub | `gh pr view {n} --repo {REPO} --json state,mergedAt` returns `state: MERGED` | `merge-blocked: <reason>` recorded in report | If yolo: enter Step 6c poll loop. If still non-terminal after timeout → mark `merge-deferred: <reason>` and surface to human |
| `solve` | Cook PR URL recorded OR `solve-failed: <reason>` recorded | `omg-cook` return value contains a PR URL | None — cook either succeeds or fails synchronously | If cook agent timed out → mark `solve-failed: cook-timeout`, surface to human |
| `close` | Issue/PR `CLOSED` in GitHub | `gh {issue,pr} view {n} --repo {REPO} --json state` returns `CLOSED` | None — close is synchronous | If `gh ... close` failed → mark `close-failed: <gh-stderr>`, surface to human |
| `defer` | Missing-fields comment posted | Comment ID recorded by Step 2d | None — defer is synchronous | If `gh issue comment` failed → mark `defer-failed: comment-post-failed`, surface to human |

### Completion-loop algorithm

```
classified_items = output of Step 2 (classified-and-decided list)
for each item in classified_items:
    item.terminal_state = false
    item.attempts = 0

while any(not item.terminal_state for item in classified_items):
    if max_total_loop_time_exceeded (default 30 min for full run):
        break  # safety bound on overall triage runtime

    for item in classified_items where not item.terminal_state:
        result = verify_terminal_state(item)  # runs the table command above
        if result.terminal:
            item.terminal_state = true
            item.terminal_marker = result.marker  # "merged: <sha>", "closed", etc.
        elif result.non_terminal_acceptable:
            item.terminal_state = true            # blocker recorded; counts as terminal
            item.terminal_marker = result.marker
        else:
            item.attempts += 1
            if item.attempts > max_per_item_attempts (default 10):
                item.terminal_state = true
                item.terminal_marker = "incomplete: max-attempts-exceeded"

    sleep 60s
```

### Reporting

**Final report MUST include the terminal_marker for every item.** Reports without per-item terminal state are incomplete and the run is not "done."

### Bounded runtime

The outer loop has a 30-minute total budget per triage run (configurable via `OMG_TRIAGE_TIMEOUT_MIN`). On budget exhaustion, surface remaining non-terminal items as `incomplete: triage-runtime-exceeded` and exit. The bound prevents indefinite hangs while still giving CI enough time to complete on a typical change.

### Interaction with flags

- **`--dry-run`** — skips Step 7 entirely (no actions to verify). The report lists what triage WOULD have done, including Definition-of-Done targets it would have asserted.
- **`--ask`** — Step 7 still runs but only against items the user actually approved during Step 6 prompts. Skipped/declined items get no terminal state — they are recorded as `skipped-by-user` in the final report and excluded from the loop.

### Why this matters

Previous behavior allowed triage to delegate merges and return control while merges were still pending. Reports said "auto-cooked 4 items" while three of those PRs were still open with green CI awaiting an actual `gh pr merge` call. The Completion Contract closes that gap.
