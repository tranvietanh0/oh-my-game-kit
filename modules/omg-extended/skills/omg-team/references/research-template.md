---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Research Template — `omg-team research`

Parallel research with module-scoped angles. Read-only, low risk.

## Execution Protocol

When activated, IMMEDIATELY execute — do NOT ask for confirmation.

### 1. Derive Angles

From `<topic>`, generate N angles (default N=3):
- **Angle 1:** Architecture, patterns, proven approaches
- **Angle 2:** Alternatives, competing solutions, trade-offs
- **Angle 3:** Risks, edge cases, failure modes, security

**OMG enhancement:** If topic matches installed modules, scope angles per module:
- Read `metadata.json` → `installedModules`
- Match topic keywords against module activation keywords
- If 2+ modules match: one omg-researcher per matched module + one cross-cutting omg-researcher

### 2. Pre-flight

Follow SKILL.md → Pre-flight Protocol:
1. **Verify `TeamCreate` is available BEFORE calling it.** Run `ToolSearch(query="select:TeamCreate", max_results=1)`. If unavailable, STOP per SKILL.md → Pre-flight Protocol (do NOT silently fall back to plain `Agent` spawning).
2. `TeamCreate(team_name: "<topic-slug>")`
3. Resolve `omg-researcher` role via routing protocol
4. Detect modules, build skill injection

### 3. Create Tasks

`TaskCreate` x N — one per angle:
- Subject: `Research: <angle-title>`
- Description: `Investigate <angle> for topic: <topic>. Save report to: plans/reports/researcher-{N}-{topic-slug}.md. Format: executive summary, key findings, evidence, recommendations. Mark task completed when done. Send findings summary to lead.`

### 4. Spawn Researchers

For each angle, spawn via `Agent` tool:
```
Agent(
  subagent_type: "{resolved omg-researcher agent}",
  name: "researcher-{N}",
  description: "Research: {angle-title}",
  prompt: "{task description} + {OMG Context Block}",
  model: "opus",
  run_in_background: true
)
```

**Module-scoped researchers:** If scoped to a module, inject that module's skills:
```
Module context:
 - Agent: omg-researcher (module: {module-name} v{version})
 - Module skills: {skill list from module activation}
 - Research within your module's domain. Cross-reference other modules if relevant.
```

### 5. Monitor

- Primary: TaskCompleted events notify when researchers finish
- Fallback: Check TaskList every 60s if no events
- If stuck >5 min: SendMessage directly to stuck omg-researcher

### 6. Synthesize

Read all omg-researcher reports from `plans/reports/`. Create synthesis:
- File: `plans/reports/research-summary-{topic-slug}.md`
- Format: executive summary, key findings across all angles, comparative analysis, recommendations, unresolved questions

### 7. Cleanup

1. `SendMessage(type: "shutdown_request")` to each teammate
2. `TeamDelete`
3. Report to user: "Research complete. {N} reports + synthesis at {path}."
4. Run `omg-watzup` to log session summary.
