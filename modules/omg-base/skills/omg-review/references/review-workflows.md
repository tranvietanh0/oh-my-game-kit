---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Review Workflows

## Quick Decision Tree

```
SITUATION?
|
+-- Input mode? -> Resolve diff (references/input-mode-resolution.md)
|   +-- #PR / URL -> fetch PR diff
|   +-- commit hash -> git show
|   +-- --pending -> git diff (staged + unstaged)
|   +-- codebase -> full scan (references/codebase-scan-workflow.md)
|   +-- codebase parallel -> parallel audit (references/parallel-review-workflow.md)
|   +-- default -> recent changes in context
|
+-- Received feedback -> STOP if unclear, verify if external, implement if human partner
+-- Completed work from plan/spec:
|   +-- Stage 1: Spec compliance review (references/spec-compliance-review.md)
|   |   +-- PASS? -> Stage 2 | FAIL? -> Fix -> Re-review Stage 1
|   +-- Stage 2: Code quality review (registry-routed reviewer agent)
|   |   +-- Scout edge cases -> Review standards, performance
|   +-- Stage 3: Adversarial review (references/adversarial-review.md) [ALWAYS-ON]
|       +-- Red-team the code -> Adjudicate -> Accept/Reject findings
+-- Completed work (no plan) -> Scout -> Code quality -> Adversarial review
+-- Pre-landing / ship -> Load checklists -> Two-pass review -> Adversarial review
+-- Multi-file feature (3+ files) -> Create review pipeline tasks (scout->review->adversarial->fix->verify)
+-- About to claim status -> RUN verification command FIRST
```

## Two-Pass Review Model

**Pass 1 -- Critical (Blocking):** Correctness, security, data integrity. Must fix before merge.
- Race conditions, deadlocks, shared state
- Auth bypass, injection, data leaks (OWASP Top 10)
- Data loss, corruption, silent failures
- API contract violations, breaking changes

**Pass 2 -- Informational:** Quality, maintainability, performance. Suggestions only.
- Code duplication, missing abstractions
- Performance improvements
- Naming, documentation gaps
- Test coverage suggestions

## Receiving Feedback

**Pattern:** READ -> UNDERSTAND -> VERIFY -> EVALUATE -> RESPOND -> IMPLEMENT
No performative agreement. Verify before implementing. Push back if wrong.

Full protocol: `references/code-review-reception.md`

## Requesting Review

1. **Scout edge cases first** (`references/edge-case-scouting.md`)
2. Get SHAs: `BASE_SHA=$(git rev-parse HEAD~1)` and `HEAD_SHA=$(git rev-parse HEAD)`
3. Dispatch registry-routed reviewer agent with: WHAT, PLAN, BASE_SHA, HEAD_SHA, DESCRIPTION
4. Fix Critical immediately, Important before proceeding

Full protocol: `references/requesting-code-review.md`

## Task-Managed Review Pipeline

**When:** Multi-file features (3+ changed files), parallel reviewer scopes, review cycles.

**Fallback:** If Task tools error, use `TodoWrite` for tracking and run pipeline sequentially.

```
TaskCreate: "Scout edge cases"         -> pending
TaskCreate: "Review implementation"    -> pending, blockedBy: [scout]
TaskCreate: "Adversarial review"       -> pending, blockedBy: [review]
TaskCreate: "Fix critical issues"      -> pending, blockedBy: [adversarial]
TaskCreate: "Verify fixes pass"        -> pending, blockedBy: [fix]
```

**Parallel reviews:** Spawn scoped reviewer subagents for independent file groups.
**Re-review cycles:** Limit 3 cycles, escalate to user after.

Full protocol: `references/task-management-reviews.md`

## Verification Gates

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

**Gate:** IDENTIFY command -> RUN full -> READ output -> VERIFY confirms -> THEN claim

**Red Flags:** "should"/"probably"/"seems to", satisfaction before verification, trusting agent reports

Full protocol: `references/verification-before-completion.md`

## Module Boundary Checks (if installedModules present in metadata.json)

- [ ] No cross-module skill references
- [ ] Modified skill registered in its own module's activation fragment
- [ ] Module agent only references skills from its own module
- [ ] Routing overlay only references agents from its own module
- [ ] No file appears in two modules

## Codebase Analysis Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `omg-review codebase` | `references/codebase-scan-workflow.md` | Scan and analyze the codebase |
| `omg-review codebase parallel` | `references/parallel-review-workflow.md` | Ultrathink edge cases, then parallel verify |

## Anti-Rationalization Guards

| Trap | Reality |
|------|---------|
| "It's a small change, skip review" | No. Small changes introduce subtle bugs. Always review. |
| "CI passed, it must be correct" | CI checks syntax, not correctness or security. |
| "I'll add tests later" | No tests = no merge. |
| "This file is out of scope" | Scope = the diff. If it changed, it's in scope. |
| "The edge case is unlikely" | Unlikely does not equal impossible. Document it or handle it. |
| "I reviewed it myself already" | Self-review misses context blindness. Use the agent. |

## Integration with Workflows

- **Subagent-Driven:** Scout -> Review -> Adversarial -> Verify before next task
- **Pull Requests:** Scout -> Code quality -> Adversarial -> Merge
- **Cook Handoff:** Cook completes phase -> review pipeline tasks (incl. adversarial) -> cook proceeds
- **PR Review:** `omg-review #123` -> fetch diff -> full 3-stage review on PR changes

## Execution Trace (if features.executionTrace enabled)

After task completes, output compact summary (max 15 lines).
