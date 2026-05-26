---
name: omg-fix
description: "ALWAYS activate this skill before fixing ANY bug, error, test failure, CI/CD issue, type error, lint, log error, UI issue, code problem."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Fix — Bug Fixing

Fix issues with intelligent classification and registry-based routing.

## Tool guard — `AskUserQuestion` is deferred

`AskUserQuestion` is a deferred tool: its name appears in the deferred-tools system-reminder but its schema is NOT loaded at session start. Direct invocation fails with `InputValidationError`.

**Operational pre-step (mandatory before drafting any structured multi-option question):**

1. Verify `AskUserQuestion` is in the loaded tool list. If not, run:
   ```
   ToolSearch(query="select:AskUserQuestion", max_results=1)
   ```
2. THEN draft and invoke the tool with batched options.

**Failure mode this guard prevents:** assistant remembers the rule, drafts the question correctly in its head, then because the tool isn't loaded, falls back to "I'll just write the options as prose, and call the tool next time." Drafting prose bullets first is a violation — see `rules/always-ask-on-unresolved.md` "Forbidden prose" table.

## Decision tree — which path do I take?

Pick by intent; keep loading minimal.

| Intent | Path |
|---|---|
| Diagnose and fix one bug end-to-end | Default `--auto` (Steps 1–6 below) |
| Trivial issue (lint, single type error) | `--quick` (skips deep diagnose) |
| Want human checkpoint before applying fix | `--review` |
| Multiple unrelated bugs at once | `--parallel` (sub-agents per issue) |
| 3+ fix attempts already failed | STOP — escalate to architecture discussion (HARD-GATE below) |

## Arguments

| Flag | Description |
|------|-------------|
| `--auto` | Autonomous mode (**default**) |
| `--review` | Human-in-the-loop review mode |
| `--quick` | Quick mode for trivial issues |
| `--parallel` | Route to parallel `implementer` agents per issue |

<HARD-GATE>
Do NOT propose or implement fixes before completing Steps 1-2 (Scout + Diagnose).
Symptom fixes are failure. Find the cause first through structured analysis, NEVER guessing.
If 3+ fix attempts fail, STOP and question the architecture — discuss with user before attempting more.
User override: `--quick` mode allows fast scout-diagnose-fix cycle for trivial issues (lint, type errors).
</HARD-GATE>

## Agent Routing

Follow protocol: `.agents/skills/omg-cook/references/routing-protocol.md`
This command uses roles: `implementer`, `omg-debugger`

## Skill Activation

Follow protocol: `.agents/skills/omg-cook/references/activation-protocol.md`

## Workflow Steps

| Step | Name | Key Action | Reference |
|------|------|------------|-----------|
| 0 | Mode Selection | Ask user for workflow mode if no `--auto` | `references/mode-selection.md` |
| 1 | Scout | Map affected files, deps, tests — NEVER skip | `references/workflow-quick.md` |
| 2 | Diagnose | Structured root cause analysis — NEVER skip | `references/diagnosis-protocol.md` |
| 3 | Complexity | Classify: Simple/Moderate/Complex/Parallel | `references/complexity-assessment.md` |
| 4 | Fix | Implement per selected workflow | `references/workflow-standard.md` |
| 5 | Verify + Prevent | Run exact pre-fix commands, add regression test | `references/prevention-gate.md` |
| 6 | Finalize | Report, omg-docs-manager, commit offer | — |

Detailed workflow diagrams: `references/fix-workflow-overview.md`

## Complexity Routing

| Level | Indicators | Workflow |
|-------|------------|----------|
| **Simple** | Single file, clear error, type/lint | `references/workflow-quick.md` |
| **Moderate** | Multi-file, root cause unclear | `references/workflow-standard.md` |
| **Complex** | System-wide, architecture impact | `references/workflow-deep.md` |
| **Parallel** | 2+ independent issues OR `--parallel` | Parallel `implementer` agents |

Specialized: `references/workflow-ci.md`, `references/workflow-logs.md`, `references/workflow-test.md`, `references/workflow-types.md`, `references/workflow-ui.md`

## Always-Activate Skills

- `omg-scout` (Step 1) — understand before diagnosing
- `omg-debug` (Step 2) — systematic root cause investigation
- `omg-think` (Step 2) — structured hypothesis formation
- When you find that the skill content led you astray, emit a
  `[omg-skill-bug kit="..." skill="..." bug="..." evidence="..."]`
  marker in your final message. The lesson-collector hook will queue a
  GitHub issue on the owning kit repo.

Full activation matrix: `references/skill-activation-matrix.md`

## Subagent Skill Injection

Follow protocol: `.agents/skills/omg-cook/references/subagent-injection-protocol.md`

## Sub-Agent Fork Hygiene

**Sub-agent forking:** see `.agents/skills/omg-architecture/references/fork-hygiene.md`.
