---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Debug Template — `omg-team debug`

Adversarial hypothesis testing with registry-routed debuggers and worktree isolation. Debuggers actively challenge each other's findings.

## Execution Protocol

When activated, IMMEDIATELY execute — do NOT ask for confirmation.

### 1. Generate Hypotheses

From `<issue>`, generate N competing hypotheses (default N=3):
- Each hypothesis must be independently testable
- Each must predict different observable symptoms
- Frame as: "If <cause>, then we should see <evidence>"

**OMG enhancement:** If issue spans modules, scope hypotheses per module:
- Read `metadata.json` → match issue keywords against module activation
- If 2+ modules: "Module A's combat system causes overflow" vs "Module B's UI doesn't handle null"

### 2. Pre-flight

Follow SKILL.md → Pre-flight Protocol:
1. **Verify `TeamCreate` is available BEFORE calling it.** Run `ToolSearch(query="select:TeamCreate", max_results=1)`. If unavailable, STOP per SKILL.md → Pre-flight Protocol (do NOT silently fall back to plain `Agent` spawning).
2. `TeamCreate(team_name: "debug-<issue-slug>")`
3. Resolve `omg-debugger` role via routing protocol
4. Detect modules, build skill injection

### 3. Create Tasks

`TaskCreate` x N — one per hypothesis:
- Subject: `Debug: Test hypothesis — <theory>`
- Description: `Investigate hypothesis: <theory>. For issue: <issue>. ADVERSARIAL: actively try to DISPROVE other theories. Message other debuggers to challenge findings. Report evidence FOR and AGAINST your theory. Save findings to: plans/reports/debugger-{N}-{issue-slug}.md. Mark task completed when done.`

### 4. Spawn Debuggers

For each hypothesis:
```
Agent(
  subagent_type: "{resolved omg-debugger agent}",
  name: "debugger-{N}",
  description: "Debug: {theory}",
  prompt: "{task description} + {OMG Context Block}",
  model: "opus",
  run_in_background: true,
  isolation: "worktree"
)
```

**MANDATORY:** `isolation: "worktree"` — debuggers may add logging, test code, or instrumentation. Worktrees are throwaway (NOT merged).

**Module-scoped debuggers:** Inject module skills for domain context:
```
Module context:
 - Agent: omg-debugger (module: {module-name} v{version})
 - Module skills: {skill list — contains patterns and known gotchas}
 - Investigate within your module's domain. Challenge other debuggers' findings.
```

### 5. Monitor

- Let debuggers converge via peer `SendMessage` — they challenge each other
- Primary: TaskCompleted events
- Fallback: TaskList poll every 60s
- Do NOT intervene unless stuck >10 min — adversarial debate is productive

### 6. Identify Root Cause

Read all omg-debugger reports. Determine:
- Which hypotheses were disproven (and by what evidence)?
- Which hypothesis survives with strongest evidence?
- **OMG addition:** Which module owns the root cause? → Note for fix routing

### 7. Write Root Cause Report

File: `plans/reports/debug-{issue-slug}.md`
Format:
- Root cause (with evidence chain)
- Module ownership (which module to fix)
- Disproven hypotheses (what was ruled out and why)
- Recommended fix approach
- Suggested command: `omg-fix <root-cause-summary>`

### 8. Cleanup

1. `SendMessage(type: "shutdown_request")` to each omg-debugger
2. `TeamDelete`
3. **Do NOT merge worktrees** — debug code is throwaway
4. Worktree cleanup: `git worktree remove <path>` for each
5. Report: "Debug complete. Root cause: {summary}. Module: {name}. Report: {path}."
6. Run `omg-watzup` to log session summary.
