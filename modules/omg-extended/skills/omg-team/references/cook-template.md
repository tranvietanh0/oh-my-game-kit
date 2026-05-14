---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Cook Template — `omg-team cook`

Parallel implementation with registry-routed implementers, mandatory worktree isolation, and manifest-derived file ownership. Medium-high risk (writes code).

## Execution Protocol

When activated, IMMEDIATELY execute — do NOT ask for confirmation.

### 1. Plan Resolution

- If plan path provided: read plan, parse into task groups by module scope
- If description only: spawn omg-planner teammate first:
  ```
  Agent(
    subagent_type: "{resolved omg-planner agent}",
    description: "Plan: {description}",
    prompt: "Create implementation plan. Break into module-scoped task groups. {OMG Context Block}",
    model: "opus"
  )
  ```
- Parse plan into N independent task groups

### 2. Module-Aware Task Decomposition

**OMG unique — auto-grouping by module:**

1. Read `metadata.json` → `installedModules`
2. For each module touched by the plan: create one task group
3. Read `.omg-manifest.json` per module → derive file ownership globs (see `manifest-ownership-resolution.md`)
4. Result: N dev tasks, each scoped to one module's files

**Default N:** one dev per touched module. Override with `--devs N`.
**Max recommended:** 5 devs (cost control).

### 3. Create Team + Tasks

1. **Verify `TeamCreate` is available BEFORE calling it.** Run `ToolSearch(query="select:TeamCreate", max_results=1)`. If unavailable, STOP per SKILL.md → Pre-flight Protocol (do NOT silently fall back to plain `Agent` spawning).
2. `TeamCreate(team_name: "<feature-slug>")`
3. `TaskCreate` x N dev tasks:
   - Subject: `Implement: <module-name> — <task-summary>`
   - Description includes:
     - Implementation scope from plan
     - `File ownership: {auto-derived globs from manifest}`
     - Acceptance criteria
     - "You MUST NOT modify files outside your ownership globs"
3. `TaskCreate` x 1 omg-tester task:
   - Subject: `Test: full suite after merge`
   - `addBlockedBy: [all dev task IDs]`

### 4. Spawn Implementers

For each dev task:
```
Agent(
  subagent_type: "{resolved implementer agent}",
  name: "dev-{module-name}",
  description: "Implement: {module-name}",
  prompt: "{task description} + {plan context} + {OMG Context Block}",
  model: "opus",
  run_in_background: true,
  isolation: "worktree"
)
```

**MANDATORY:** `isolation: "worktree"` — every dev gets isolated git worktree. No exceptions.

**Module skill injection (per subagent-injection-protocol):**
```
Module context:
 - Agent: {agent-name} (module: {module-name} v{version})
 - Module skills (activate these): {comma-separated skill names}
 - Required module skills (also available): {required module skills}
 - Activate relevant skills using Skill tool before implementing.
 - DO NOT reference skills from uninstalled modules.
```

### 5. Plan Approval Gate (default ON)

Unless `--no-plan-approval` flag:
- Each dev submits plan before coding (via `plan_approval_request`)
- Lead reviews each plan:
  - Check: stays within file ownership boundaries?
  - Check: consistent with overall plan?
  - Check: reasonable approach?
- **Approval criteria:** plan stays within file ownership? consistent with overall plan? includes test approach? reasonable scope?
- Approve via `plan_approval_response` or reject with feedback
- Dev revises on reject, resubmits (max 2 rejections, then lead takes over)

### 6. Monitor

- Primary: TaskCompleted events notify when each dev finishes
- TeammateIdle events confirm devs are available for shutdown
- Fallback: TaskList poll every 60s
- If dev stuck >10 min with no progress: SendMessage with guidance

### 7. Worktree Merge (CRITICAL)

After ALL devs complete, merge sequentially (NOT parallel):

```
For each completed dev (in task ID order):
  a. Get worktree branch from Agent result
  b. git merge <dev-branch> --no-ff -m "feat(<module>): <summary>"
  c. If conflict:
     - Lead resolves (lead owns shared files)
     - git add . && git merge --continue
  d. git worktree remove <path>

After all merged:
  e. Run full test suite (spawn omg-tester)
  f. git log --oneline --graph (verify merge topology)
```

### 8. Spawn Tester

After merge:
```
Agent(
  subagent_type: "{resolved omg-tester agent}",
  name: "omg-tester",
  description: "Test: full suite post-merge",
  prompt: "Run full test suite. Report pass/fail/coverage. {OMG Context Block}",
  model: "opus"
)
```

**`--delegate` mode:** Lead cannot merge worktrees directly (delegate never touches code). Instead, spawn a dedicated merge teammate:
```
Agent(
  subagent_type: "omg-fullstack-developer",
  name: "merger",
  description: "Merge all worktree branches sequentially",
  prompt: "Merge these branches in order: {branch-list}. Resolve conflicts. Then run tests. {OMG Context Block}",
  model: "opus"
)
```

### 9. Docs Sync Eval

```
Docs impact: [none|minor|major]
Action: [no update needed — reason] | [updated <page>] | [needs separate PR]
```

### 10. Cleanup

1. `SendMessage(type: "shutdown_request")` to all teammates
2. `TeamDelete`
3. Report: "Cook complete. {N} modules implemented. Tests: {pass/fail}. Docs impact: {level}."
4. Run `omg-watzup` to log session summary.
