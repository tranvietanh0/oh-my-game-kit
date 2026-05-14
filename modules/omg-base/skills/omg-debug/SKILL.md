---
name: omg-debug
description: "Investigate and diagnose errors via registry-routed omg-debugger. Root cause first, no fixes until confirmed. Use for runtime errors, test failures, CI/CD issues, log analysis."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Debug -- Systematic Debugging & Investigation

Comprehensive framework combining systematic debugging, root cause tracing, defense-in-depth validation, verification protocols, and system-level investigation (logs, CI/CD, databases, performance).

## Decision tree — which path do I take?

Pick by intent; load only the path you need.

| Intent | Path |
|---|---|
| Investigate a runtime error / test failure | Default investigative loop (Core Principle below) |
| CI/CD pipeline broken | Start with system-level investigation / log analysis |
| Database / query / performance issue | System-level investigation (perf, db, logs) |
| Stuck after 3+ hypothesis-test cycles | Switch to `omg-problem-solve` (assumption-break) |
| Just need a quick stack trace read | Skip to Verification Protocols |

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

Random fixes waste time and create new bugs. Find root cause, fix at source, validate at every layer, verify before claiming success.

## Agent Routing
Follow protocol: `skillsomg-cook/references/routing-protocol.md`
This command uses role: `omg-debugger`

## Skill Activation
Follow protocol: `skillsomg-cook/references/activation-protocol.md`

## When to Use

**Code-level:** Test failures, bugs, unexpected behavior, build failures, integration problems
**System-level:** Server errors, CI/CD pipeline failures, performance degradation, database issues, log analysis
**Always:** Before claiming work complete

## Techniques

### 1. Systematic Debugging (`references/systematic-debugging.md`)

Four-phase framework: Root Cause Investigation -> Pattern Analysis -> Hypothesis Testing -> Implementation. Complete each phase before proceeding. No fixes without Phase 1.

**Load when:** Any bug/issue requiring investigation and fix

### 2. Root Cause Tracing (`references/root-cause-tracing.md`)

Trace bugs backward through call stack to find original trigger. Fix at source, not symptom. Includes `scripts/find-polluter.sh` for bisecting test pollution.

**Load when:** Error deep in call stack, unclear where invalid data originated

### 3. Defense-in-Depth (`references/defense-in-depth.md`)

Validate at every layer: Entry validation -> Business logic -> Environment guards -> Debug instrumentation

**Load when:** After finding root cause, need comprehensive validation

### 4. Verification (`references/verification.md`)

**Iron law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Run command. Read output. Then claim result.

**Load when:** About to claim work complete, fixed, or passing

### 5. Investigation Methodology (`references/investigation-methodology.md`)

Five-step structured investigation for system-level issues: Initial Assessment -> Data Collection -> Analysis -> Root Cause ID -> Solution Development

**Load when:** Server incidents, system behavior analysis, multi-component failures

### 6. Log & CI/CD Analysis (`references/log-and-ci-analysis.md`)

Collect and analyze logs from servers, CI/CD pipelines (GitHub Actions), application layers. Tools: `gh` CLI, structured log queries, correlation across sources.

**Load when:** CI/CD pipeline failures, server errors, deployment issues

### 7. Performance Diagnostics (`references/performance-diagnostics.md`)

Identify bottlenecks, analyze query performance, develop optimization strategies. Covers database queries, API response times, resource utilization.

**Load when:** Performance degradation, slow queries, high latency, resource exhaustion

### 8. Reporting Standards (`references/reporting-standards.md`)

Structured diagnostic reports: Executive Summary -> Technical Analysis -> Recommendations -> Evidence

**Load when:** Need to produce investigation report or diagnostic summary

### 9. Task Management (`references/task-management-debugging.md`)

Track investigation pipelines via Codex Native Tasks (TaskCreate, TaskUpdate, TaskList). Hydration pattern for multi-step investigations with dependency chains and parallel evidence collection. **Fallback:** If Task tools unavailable, use `TodoWrite` for tracking.

**Load when:** Multi-component investigation (3+ steps), parallel log collection, coordinating omg-debugger subagents

### 10. Frontend Verification (`references/frontend-verification.md`)

Visual verification of frontend implementations via Chrome MCP or `chrome-devtools` skill fallback. Detect if frontend-related -> check Chrome MCP availability -> screenshot + console error check -> report. Skip if not frontend.

**Load when:** Implementation touches frontend files (tsx/jsx/vue/svelte/html/css), UI bugs, visual regressions

## Quick Reference

```
Code bug       -> systematic-debugging.md (Phase 1-4)
  Deep in stack  -> root-cause-tracing.md (trace backward)
  Found cause    -> defense-in-depth.md (add layers)
  Claiming done  -> verification.md (verify first)

System issue   -> investigation-methodology.md (5 steps)
  CI/CD failure  -> log-and-ci-analysis.md
  Slow system    -> performance-diagnostics.md
  Need report    -> reporting-standards.md

Frontend fix   -> frontend-verification.md (Chrome/devtools)
```

## Anti-Rationalization Guards

| Trap | Reality |
|------|---------|
| "Probably this line" | Hypotheses without evidence waste time. Prove it. |
| "Let me add more logging" | Read existing logs first. Most info is already there. |
| "Worked on my machine" | Reproduce in the reported environment, not yours. |
| "I'll just try a fix and see" | That's guessing, not debugging. Investigate first. |
| "The error message says X, so it must be X" | Error messages lie. Verify independently. |
| "Quick fix for now, investigate later" | Later never comes. Investigate now. |
| "Should work now" / "Seems fixed" | Run the verification. Then claim it. |

## Red Flags

Stop and return to systematic process if thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "Should work now" / "Seems fixed"
- "Tests pass, we're done"

**All mean:** Return to systematic process.

## Subagent Skill Injection (if installedModules present in metadata.json)
Follow protocol: `skillsomg-cook/references/subagent-injection-protocol.md`
Before spawning omg-debugger agent, inject module context.

## Execution Trace (if features.executionTrace enabled)
After task completes, output compact summary (max 15 lines).
Check `omg-config-*.json` -> `features.executionTrace` (default: true).
