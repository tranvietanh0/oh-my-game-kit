---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Sub-Agent Fork Hygiene — Mandatory Rules

When a skill spawns sub-agents (Task tool with `run_in_background` or `context: fork`), the following rules MUST be enforced. Architecture review (Round 5, 2026-04-28) flagged these as the most common failure mode in agentic skills.

## 1. Recursion Guard

A skill spawning a sub-agent MUST check `OMG_FORK_DEPTH`; refuse if depth >= 2.

```javascript
const depth = parseInt(process.env.OMG_FORK_DEPTH || "0", 10);
if (depth >= 2) {
  throw new Error("Fork depth exceeded — recursion guard tripped");
}
// when spawning: pass OMG_FORK_DEPTH=depth+1
```

The CLI/hook layer is responsible for plumbing `OMG_FORK_DEPTH` into sub-agent processes; skills only read it.

## 2. Fan-Out Cap

Hard cap parallel sub-agent count to N=4 unless the user explicitly opts into more via `--parallel-cap N`. Reasoning:
- Each fork costs ~50k tokens of system prompt + cache miss
- Parent context bloats with sub-agent traces if fan-out goes uncapped
- 4 is empirically the elbow point for diminishing returns on independent kits

For dynamic counts (e.g., "one per matched module"), apply `Math.min(matchedCount, 4)` and report skipped items in the final result.

## 3. `useExactTools: true` for Fork Children

When spawning a sub-agent, restrict its tool set to exactly the tools it needs. Default Codex agent tool set is ~70+ tools — most fork children need <10. Pass `useExactTools: true` + an explicit `tools: [...]` array.

```javascript
Agent({
  prompt: "...",
  useExactTools: true,
  tools: ["Read", "Grep", "Glob"],   // read-only verifier example
  context: "fork",
});
```

## 4. Strip `gitStatus` for Read-Only Forks

Read-only verifier sub-agents (researchers, reviewers, validators) do NOT need the `gitStatus` block in their system prompt — it bloats their cache key without informational gain. Strip it explicitly via `forkContext: { stripGitStatus: true }` when spawning.

## 5. Anti-Avoidance Prompting (Verifier Sub-Agents)

Sub-agents tasked with verification (test-runners, security checkers, doctors) tend to under-report failures because LLMs default to optimism. Prepend an anti-avoidance preamble:

```
You are a STRICT verifier. Your job is to FIND and REPORT every issue, not to declare victory. Specifically:
- If you cannot complete a check, REPORT it as 'unchecked', do NOT silently skip.
- If a check passes, state the EVIDENCE that proves it passed (not just "passed").
- If a check fails, give EXACT file:line and the failure mode (do not paraphrase).
- Empty findings are ONLY valid if you explicitly enumerated every check and confirmed each one. Otherwise, return 'INCOMPLETE'.
```

This guards against the "looks good to me" failure mode that has burned past sessions.

## 6. Constant-Placeholder Result for Cache Stability

When the sub-agent's result is later embedded back into the parent's transcript, use a constant placeholder for any timestamp/version/path that is session-specific. This keeps the parent's prompt cache stable across sub-agent runs.

## When These Rules Don't Apply

- One-shot fire-and-forget background sub-agents (`omg-sync-back`, `omg-issue` follow-ups) — recursion guard + fan-out cap apply, but `useExactTools` and `gitStatus` strip are optional since there's no parent that re-uses the cache.
- User-invoked `omg-team` skill — has its own coordination protocol.

## Skills That Must Cite This File

The following skills spawn sub-agents and MUST link to this file in their SKILL.md fork-spawning sections (one-line citation, do NOT inline the rules):

- `omg-cook` — multi-subagent fan-out, finalize phase
- `omg-plan` — Phase B parallel planners (count = matched modules, capped to 4)
- `omg-review` — `codebase parallel` mode multi-reviewer audit
- `omg-predict` — 5 personas (must be `context: fork` to keep parent transcript clean)
- `omg-issue` — lesson-queue sub-agent (background fire-and-forget)
- `omg-triage` — `--auto` actionable-item fan-out
- `omg-ship` — verification sub-agents
- `omg-fix` — `--parallel` fork
- `omg-test` — omg-tester + omg-debugger sub-agents on failure

## Test

A skill that spawns N sub-agents on a single user invocation:
- Should fail loudly if N >= 5 without `--parallel-cap` flag.
- Should fail loudly if it's already running inside a fork (depth check).
- Should pass an explicit tools array, not inherit the parent's default.
- Read-only sub-agents should have shorter system prompts than their write-capable siblings.
