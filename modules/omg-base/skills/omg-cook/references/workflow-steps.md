---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Unified Workflow Steps

All modes share core steps with mode-specific variations.

**Task Tool Fallback:** `TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList` are CLI-only — unavailable in VSCode extension. If they error, use `TodoWrite` for progress tracking. All workflow steps remain functional without Task tools.

## Step 0: Intent Detection & Setup

1. Parse input with `intent-detection.md` rules
2. Log detected mode: `✓ Step 0: Mode [X] - [reason]`
3. If mode=code: detect plan path, set active plan
4. Use `TaskCreate` to create workflow step tasks (with dependencies if complex)

**Output:** `✓ Step 0: Mode [interactive|auto|fast|parallel|no-test|code] - [detection reason]`

## Step 1: Research (skip if fast/code mode)

**Interactive/Auto:**
- Spawn multiple `omg-researcher` agents in parallel
- Use `omg-scout ext` or `scout` agent for codebase search
- Keep reports ≤150 lines

**Parallel:**
- Optional: max 2 researchers if complex

**Output:** `✓ Step 1: Research complete - [N] reports gathered`

### [Review Gate 1] Post-Research (skip if auto mode)
- Present research summary to user
- Use `AskUserQuestion` to ask: "Proceed to planning?" / "Request more research" / "Abort"
- **Auto mode:** Skip this gate

## Step 2: Planning

**Interactive/Auto/No-test:**
- Use `omg-planner` agent with research context
- Create `plan.md` + `phase-XX-*.md` files

**Fast:**
- Use `omg-plan --fast` with scout results only
- Minimal planning, focus on action

**Parallel:**
- Use `omg-plan --parallel` for dependency graph + file ownership matrix

**Code:**
- Skip - plan already exists
- Parse existing plan for phases

**Output:** `✓ Step 2: Plan created - [N] phases`

### [Review Gate 2] Post-Plan (skip if auto mode)
- Present plan overview with phases
- Use `AskUserQuestion` to ask: "Validate the plan or approve plan to start implementation?" - "Validate" / "Approve" / "Abort" / "Other" ("Request revisions")
  - "Validate": run `omg-plan validate` skill invocation
  - "Approve": continue to implementation
  - "Abort": stop the workflow
  - "Other": revise the plan based on user's feedback
- **Auto mode:** Skip this gate

## Step 3: Implementation

**IMPORTANT:**
1. `TaskList` first — check for existing tasks (hydrated by planning skill in same session)
2. If tasks exist → pick them up, skip re-creation
3. If no tasks → read plan phases, `TaskCreate` for each unchecked `[ ]` item with priority order and metadata (`phase`, `planDir`, `phaseFile`)
4. Tasks can be blocked by other tasks via `addBlockedBy`

**All modes:**
- Use `TaskUpdate` to mark tasks as `in_progress` immediately.
- Execute phase tasks sequentially (Step 3.1, 3.2, etc.)
- Use `ui-ux-designer` for frontend
- Use `ck:ai-multimodal` for image assets
- Run type checking after each file

**Parallel mode:**
- Utilize all tools of Codex Tasks: `TaskCreate`, `TaskUpdate`, `TaskGet` and `TaskList`
- Launch multiple `omg-fullstack-developer` agents
- When agents pick up a task, use `TaskUpdate` to assign task to agent and mark tasks as `in_progress` immediately.
- Respect file ownership boundaries
- Wait for parallel group before next

**Output:** `✓ Step 3: Implemented [N] files - [X/Y] tasks complete`

### [Review Gate 3] Post-Implementation (skip if auto mode)
- Present implementation summary (files changed, key changes)
- Use `AskUserQuestion` to ask: "Proceed to testing?" / "Request implementation changes" / "Abort"
- **Auto mode:** Skip this gate

## Step 4: Testing (skip if no-test mode)

**All modes (except no-test):**
- Write tests: happy path, edge cases, errors
- **MUST** spawn `omg-tester` subagent: `Task(subagent_type="omg-tester", prompt="Run test suite", description="Run tests")`
- If failures: **MUST** spawn `omg-debugger` subagent → fix → repeat
- **Forbidden:** fake mocks, commented tests, changed assertions, skipping subagent delegation

**Output:** `✓ Step 4: Tests [X/X passed] - omg-tester subagent invoked`

### [Review Gate 4] Post-Testing (skip if auto mode)
- Present test results summary
- Use `AskUserQuestion` to ask: "Proceed to code review?" / "Request test fixes" / "Abort"
- **Auto mode:** Skip this gate

## Step 5: Code Review

**All modes - MANDATORY subagent:**
- **MUST** spawn `omg-code-reviewer` subagent: `Task(subagent_type="omg-code-reviewer", prompt="Review changes. Return score, critical issues, warnings.", description="Code review")`
- **DO NOT** review code yourself - delegate to subagent

**Interactive/Parallel/Code/No-test:**
- Interactive cycle (max 3): see `review-cycle.md`
- Requires user approval

**Auto:**
- Auto-approve if score≥9.5 AND 0 critical
- Auto-fix critical (max 3 cycles)
- Escalate to user after 3 failed cycles

**Fast:**
- Simplified review, no fix loop
- User approves or aborts

**Output:** `✓ Step 5: Review [score]/10 - [Approved|Auto-approved] - omg-code-reviewer subagent invoked`

## Step 6: Finalize

**All modes - MANDATORY subagents (NON-NEGOTIABLE):**
1. **MUST** spawn these subagents in parallel:
   - `Task(subagent_type="omg-project-manager", prompt="Run full sync-back for [plan-path]: reconcile all completed Codex Tasks with all phase files, backfill stale completed checkboxes across every phase, then update plan.md frontmatter/table progress. Do NOT only mark current phase.", description="Update plan")`
   - `Task(subagent_type="omg-docs-manager", prompt="Update docs for changes.", description="Update docs")`
2. Project-manager sync-back MUST include:

### Status Sync (Finalize)

Use CLI commands for deterministic status updates:

```bash
# Mark completed phases
ck plan check <phase-id>

# Mark in-progress phases
ck plan check <phase-id> --start

# Revert if needed
ck plan uncheck <phase-id>
```

**Fallback:** If `ck` is not available, edit plan.md directly —
only change the Status column cell, preserve table structure.
   - Sweep all `phase-XX-*.md` files in the plan directory.
   - Mark every completed item `[ ] → [x]` based on completed tasks (including earlier phases finished before current phase).
   - Update `plan.md` status/progress (`pending`/`in-progress`/`completed`) from actual checkbox state.
   - Return unresolved mappings if any completed task cannot be matched to a phase file.
3. Use `TaskUpdate` to mark Codex Tasks complete after sync-back confirmation.
4. Onboarding check (API keys, env vars)
5. **MUST** spawn git subagent: `Task(subagent_type="omg-git-manager", prompt="Stage and commit changes", description="Commit")`

**CRITICAL:** Step 6 is INCOMPLETE without spawning all 3 subagents. DO NOT skip subagent delegation.

**Auto mode:** Continue to next phase automatically, start from **Step 3**.
**Others:** Ask user before next phase

**Output:** `✓ Step 6: Finalized - 3 subagents invoked - Full-plan sync-back completed - Committed`

## Mode-Specific Flow Summary

Legend: `[R]` = Review Gate (human approval required)

```
interactive: 0 → 1 → [R] → 2 → [R] → 3 → [R] → 4 → [R] → 5(user) → 6
auto:        0 → 1 → 2 → 3 → 4 → 5(auto) → 6 → next phase (NO stops)
fast:        0 → skip → 2(fast) → [R] → 3 → [R] → 4 → [R] → 5(simple) → 6
parallel:    0 → 1? → [R] → 2(parallel) → [R] → 3(multi-agent) → [R] → 4 → [R] → 5(user) → 6
no-test:     0 → 1 → [R] → 2 → [R] → 3 → [R] → skip → 5(user) → 6
code:        0 → skip → skip → 3 → [R] → 4 → [R] → 5(user) → 6
```

**Key difference:** `auto` mode is the ONLY mode that skips all review gates.

## Critical Rules

- Never skip steps without mode justification
- **MANDATORY SUBAGENT DELEGATION:** Steps 4, 5, 6 MUST spawn subagents via Task tool. DO NOT implement directly.
  - Step 4: `omg-tester` (and `omg-debugger` if failures)
  - Step 5: `omg-code-reviewer`
  - Step 6: `omg-project-manager`, `omg-docs-manager`, `omg-git-manager`
- Use `TaskCreate` to create Codex Tasks for each unchecked item with priority order and dependencies (or `TodoWrite` if Task tools unavailable).
- Use `TaskUpdate` to mark Codex Tasks `in_progress` when picking up a task (skip if Task tools unavailable).
- Use `TaskUpdate` to mark Codex Tasks `complete` immediately after finalizing the task (skip if Task tools unavailable).
- All step outputs follow format: `✓ Step [N]: [status] - [metrics]`
- **VALIDATION:** If Task tool calls = 0 at end of workflow, the workflow is INCOMPLETE.

## --tdd Flag Behavior

When `--tdd` is active, **Step 3 (Implement) is decomposed** into three sub-steps per phase:

### Step 3.T — Write tests first
Write tests for the target behavior BEFORE writing any implementation code. Run the new tests immediately. They MUST fail initially (red phase). If any new test passes on first run without implementation changes, the test is not exercising the intended behavior — revise or delete it.

### Step 3.I — Implement minimum to pass
Write the minimum code required to make the Step 3.T tests pass. Do not add speculative features or pre-optimizations. Commit to the single responsibility of making the failing tests green.

### Step 3.V — Verify full suite
Run the full test suite (not just the new tests). Every test must pass (green). If any pre-existing test breaks, STOP and triage before proceeding. Do not advance to Step 4 until the full suite is green.

After Step 3.V passes → continue to Step 4 (full test run, no-op if already green) → Step 5 → Step 6.

### Guards and Incompatibilities

- `--tdd + --parallel`: REFUSE. Parallel execution cannot preserve the T→I→V ordering across concurrent phases. Error: "TDD requires strict ordering (tests → implement → verify); parallel execution cannot preserve this. Use `--tdd` alone, or `--parallel` without `--tdd`."
- `--tdd + --no-test`: REFUSE. TDD mode inherently requires the test suite; `--no-test` is contradictory.
- `--tdd + --fast`: ALLOWED. Fast mode skips research but preserves TDD ordering within Step 3.
- `--tdd + --auto`: ALLOWED. Auto mode skips review gates but still runs TDD within each phase.

### Example Invocations

```
omg-cook "add JWT refresh endpoint" --tdd
omg-cook plans/260411-auth/ --tdd --fast
omg-cook "refactor auth module" --tdd --auto
```
