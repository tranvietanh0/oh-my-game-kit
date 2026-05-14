---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
<!-- omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=null | protected=true -->

# Skill Workflow Routing (OMG Core)

Common multi-skill chains with preconditions, handoff, and exit criteria. Each chain is advisory — use as a starting point, not a rigid script.

## Chain 1: New Feature (plan → cook → test → review)

**Trigger:** User wants to add a new feature from scratch.

**Preconditions:** Task is clear. If not, run `omg-brainstorm` first.

**Steps:**
1. `omg-plan <task>` — produces `plans/{timestamp}-{slug}/` with phase files and tasks
2. `omg-cook <plan-path>` — executes the plan; internally chains scout → implement → test → review
3. `omg-git cm` — conventional commit as part of `omg-cook` finalization

**Exit:** Tests pass; review green; commit in git log.

## Chain 2: Bug Fix (debug → fix → test)

**Trigger:** User reports a runtime error, test failure, or unexpected behavior.

**Preconditions:** Error is reproducible or a log/stack trace is available.

**Steps:**
1. `omg-debug <issue>` — root-cause investigation; no code changes until cause confirmed
2. `omg-fix <plan-from-debug>` — applies the fix; auto-chains to `omg-test`
3. If fix fails: return to `omg-debug` with new findings

**Exit:** Tests green; root cause documented in commit message.

## Chain 3: Exploration (scout → brainstorm → plan)

**Trigger:** User wants to understand the codebase before committing to a design.

**Preconditions:** None.

**Steps:**
1. `omg-scout <query>` — parallel file discovery and context gathering
2. `omg-brainstorm <topic>` — generate alternatives with trade-off analysis
3. `omg-plan <chosen-option>` — formalize into phased plan

**Exit:** Plan directory created; user approves phases.

## Chain 4: Issue Backlog (triage → cook --auto)

**Trigger:** User wants to process a batch of GitHub issues or PRs.

**Preconditions:** `github` MCP connected; at least one kit repo has open issues.

**Steps:**
1. `omg-triage` — fetch, classify, and filter actionable issues across all kit repos
2. `omg-cook --auto` — run through the actionable list autonomously

**Exit:** Actioned issues closed or commented; remaining items reported.

## Chain 5: Session Wrap (watzup → handoff)

**Trigger:** End of session or handoff to another developer.

**Preconditions:** None.

**Steps:**
1. `omg-watzup` — session summary (commits, errors, in-progress tasks, telemetry)
2. `omg-handoff` — save session context to resumable state

**Exit:** Handoff file written; next session can resume via `omg-handoff load`.

## Chain 6: Release Pipeline (test → review → ship → babysit-pr)

**Trigger:** User wants to ship a completed feature to main.

**Preconditions:** Implementation complete; no failing tests.

**Steps:**
1. `omg-test` — full test suite; must be green before proceeding
2. `omg-review` — adversarial code review; address all critical findings
3. `omg-ship` — full release pipeline (conventional commit, tag, PR)
4. `omg-babysit-pr` — monitor CI and reviewers until merged

**Exit:** PR merged; tag created; changelog updated.

## Post-Implementation Checklist

After completing any implementation:
- `omg-review` — before merging
- `omg-ship` — full shipping pipeline
- `omg-watzup` — session summary

## Notes

- Chains can be interrupted and resumed — use `omg-handoff` between steps if needed
- `omg-cook` auto-chains internal steps (scout → implement → test → review) — no need to invoke manually
- Parallel work: use `omg-worktree` for isolated branches and `omg-team` for multi-agent orchestration
