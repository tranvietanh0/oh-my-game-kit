---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Subagent Patterns

Standard patterns for spawning and using subagents in cook workflows.

## Task Tool Pattern
```
Task(subagent_type="[type]", prompt="[task description]", description="[brief]")
```

## Research Phase
```
Task(subagent_type="omg-researcher", prompt="Research [topic]. Report ≤150 lines.", description="Research [topic]")
```
- Use multiple researchers in parallel for different topics
- Keep reports ≤150 lines with citations

## Scout Phase
```
Task(subagent_type="scout", prompt="Find files related to [feature] in codebase", description="Scout [feature]")
```
- Use `omg-scout ext` (preferred) or `omg-scout` (fallback)

## Planning Phase
```
Task(subagent_type="omg-planner", prompt="Create implementation plan based on reports: [reports]. Save to [path]", description="Plan [feature]")
```
- Input: omg-researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files

## UI Implementation
```
Task(subagent_type="ui-ux-designer", prompt="Implement [feature] UI per ./docs/design-guidelines.md", description="UI [feature]")
```
- For frontend work
- Follow design guidelines

## Testing
```
Task(subagent_type="omg-tester", prompt="Run test suite for plan phase [phase-name]", description="Test [phase]")
```
- Must achieve 100% pass rate

## Debugging
```
Task(subagent_type="omg-debugger", prompt="Analyze failures: [details]", description="Debug [issue]")
```
- Use when tests fail
- Provides root cause analysis

## Code Review
```
Task(subagent_type="omg-code-reviewer", prompt="Review changes for [phase]. Check security, performance, YAGNI/KISS/DRY. Return score (X/10), critical, warnings, suggestions.", description="Review [phase]")
```

## Project Management
```
Task(subagent_type="omg-project-manager", prompt="Run full sync-back in [plan-path]: reconcile completed tasks with all phase files, backfill stale completed checkboxes across all phases, update plan.md status/progress, and report unresolved mappings.", description="Update plan")
```

## Documentation
```
Task(subagent_type="omg-docs-manager", prompt="Update docs for [phase]. Changed files: [list]", description="Update docs")
```

## Git Operations
```
Task(subagent_type="omg-git-manager", prompt="Stage and commit changes with conventional commit message", description="Commit changes")
```

## Parallel Execution
```
Task(subagent_type="omg-fullstack-developer", prompt="Implement [phase-file] with file ownership: [files]", description="Implement phase [N]")
```
- Launch multiple for parallel phases
- Include file ownership boundaries

## Gotchas & Budgeting (MANDATORY READ before any long subagent spawn)

### The ~50 tool-use ceiling
Sub-agents spawned via `Task` / `Agent` tool terminate **mid-thought at 47-52 tool uses**. Observed consistently across 4+ independent agents in a single session (49, 52, 47, 48). Final output is a truncated sentence; no "budget exceeded" error. The agent's partial work on disk may or may not compile.

**Design tasks for ≤40 tool uses per agent.** Leave margin for retries and verification.

### Rules to survive the ceiling
1. **Commit after EVERY phase.** Never batch phases into a single commit. A wall-hit mid-phase is recoverable if prior phases are committed.
2. **Tell agents to commit-after-each-phase explicitly in the prompt.** Don't assume; the default behavior is to finalize at the end, which loses everything if the wall hits mid-work.
3. **Split multi-phase plans across multiple sequential agents** (e.g., phases 1-3 in agent A, phases 4-6 in agent B). Pass state via commit hashes + handoff notes in the second agent's prompt.
4. **Prefer ONE large `Write` or ONE large `Edit` over N small `Edit` calls** when rewriting a file. Each Edit is a tool use. A file rewrite via 5 Edits costs 5 uses; via 1 Write costs 1.
5. **Batch reads:** send multiple `Read` calls in a single response when inspecting related files. Parallel tool calls count the same but you stay in tool budget for longer work.

### Recovery when an agent hits the wall

1. `git log --oneline origin/master..HEAD` — see which phases got committed
2. `git status --short` — see what's uncommitted (mid-phase dirt)
3. `pnpm --filter <affected> typecheck` — does the partial state compile?
   - **Yes** → finish the small remaining work inline (usually 1-5 edits), commit, continue
   - **No** → `git checkout <dirty-files>` to revert partial, then re-spawn agent with narrower scope (or finish inline if tiny)
4. Re-spawn for remaining phases with explicit context on what's done + what's next

### Prompt patterns that save budget

- **Pre-resolve decisions upfront.** If the agent would ask "which approach?", tell it. An AskUserQuestion round-trip burns 2+ uses.
- **Provide exact file paths.** Grepping to find a file costs 1-2 uses; passing the path costs 0.
- **Include investigation outputs the prior agent already gathered.** Save the agent from re-running the same grep/read.
- **State budget expectation explicitly:** "Stay under 35 tool uses. Commit after each phase. If approaching 30, commit progress and stop."

### When NOT to delegate to a sub-agent
- Task fits in <10 tool uses → do it inline
- Task requires the orchestrator's accumulated context (already-read files, prior decisions) → do it inline
- Task is pure verification (run `typecheck` / `test`, check output) → do it inline
- The gain from delegation (keeping main context clean) is negligible for short tasks

### Diagnosis tips from real incidents
- **"Stale test" claims in handoffs can be wrong.** A test for a feature that was never shipped looks identical to a test for a regressed feature. READ the test file before deciding which side to fix — the test body is the spec.
- **Mega-PRs collateral-remove code.** If a commit deleted feature X as part of a broad refactor (not as an explicit decision), restoring X is fine. Check the PR narrative, not just the diff, to understand intent.
- **pnpm `overrides` in root `package.json` resolve most transitive-dep Dependabot alerts** without per-service changes. Try overrides before dep-by-dep upgrades.
