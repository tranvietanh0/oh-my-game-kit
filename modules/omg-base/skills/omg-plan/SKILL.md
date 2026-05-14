---
name: omg-plan
description: "Create phased implementation plans with research and task breakdown. Use for 'plan this feature', 'how should we architect X', 'break this into phases before coding'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Plan — Implementation Planning

Create phased implementation plans. Routes to registered `omg-planner` agent via routing protocol.

## Tool guard — `AskUserQuestion` is deferred

`AskUserQuestion` is a deferred tool: its name appears in the deferred-tools system-reminder but its schema is NOT loaded at session start. Direct invocation fails with `InputValidationError`.

**Operational pre-step (mandatory before drafting any structured multi-option question):**

1. Verify `AskUserQuestion` is in the loaded tool list. If not, run:
   ```
   ToolSearch(query="select:AskUserQuestion", max_results=1)
   ```
2. THEN draft and invoke the tool with batched options.

**Failure mode this guard prevents:** assistant remembers the rule, drafts the question correctly in its head, then because the tool isn't loaded, falls back to "I'll just write the options as prose, and call the tool next time." Drafting prose bullets first is a violation — see `rules/always-ask-on-unresolved.md` "Forbidden prose" table. Especially relevant in plan endgame: "Open questions before I write the plan" lists are the canonical violation pattern.

## When to Use
- Planning new features
- Architecting system designs
- Breaking down complex requirements
- Creating roadmaps with testing/review gates

## Workflow Modes

| Flag | Research | Red Team | Validation | Cook Handoff |
|------|----------|----------|------------|--------------|
| `--auto` | Auto-detect | Follows mode | Follows mode | `omg-cook` |
| `--fast` | Skip | Skip | Skip | `omg-cook --auto` |
| `--hard` | 2 researchers | Yes | Optional | — |
| `--deep` | 3 researchers | Yes | Mandatory | — |
| `--parallel` | 2 researchers | Yes | Optional | `omg-cook --parallel` |
| `--tdd` | Composable with any mode | — | — | Annotates phase cards with 3.T/3.I/3.V sub-steps |

Mode comparison and `--deep` vs `--hard` details: `references/workflow-modes.md`

### Guards

- `--hard + --deep`: REFUSE. `--deep` is a strict superset of `--hard`; use one or the other.
- `--fast + --deep`: REFUSE. Fast mode skips rigor; `--deep` mandates it. They are incompatible.
- `--tdd + --parallel`: REFUSE. TDD requires strict T→I→V ordering; parallel execution cannot preserve it.
- `--fast + --hard`: ALLOWED but discouraged — document the reason in the plan.

## Subcommands
| Subcommand | Purpose |
|---|---|
| `omg-plan archive` | Archive plans + journal |
| `omg-plan red-team` | Adversarial plan review |
| `omg-plan validate` | Critical questions interview |

## Context Reminder
After plan creation, output: `omg-cook {plan-path}`

## Open Questions Gate (MANDATORY)

If the omg-planner needs to confirm 2-4 design decisions before finalizing the plan
(e.g., "scope target A or B?", "use module X or Y?", "tier thresholds?"), the
omg-planner MUST invoke `AskUserQuestion` (batch up to 4 per call). NEVER list open
questions as numbered prose with checkbox-style alternatives. This applies at
every step where decisions remain — not just the final cook handoff. See
`rules/ask-before-deciding.md` → "Failure mode — post-design open questions"
for the exact pattern to avoid.

## Agent Routing
Follow protocol: `skillsomg-cook/references/routing-protocol.md`
This command uses role: `omg-planner`

## Skill Inventory Injection (if `installedModules` present in metadata.json)

Before spawning omg-planner agent:
1. Read `.agents/metadata.json` → `installedModules` (v3) or `modules` (v2 fallback)
2. Read ALL `omg-activation-*.json` → collect skill names grouped by module
3. Inject into omg-planner prompt as inventory (names + modules, NOT full activation):
   "Available skills by module:
    - {module} v{version} (kit: {kit}): {skill1}, {skill2}...
    You can READ skill files if needed. DO NOT activate skills — planning only."

## Multi-Agent Planning Pipeline (if 2+ modules matched)

Auto-detect: count distinct modules with keyword matches.
- 0-1 modules → single omg-planner (standard)
- 2+ modules → multi-agent pipeline:

**Phase A** — Domain Design (if designer kit installed): spawn designer agent
**Phase B** — Domain Planning (PARALLEL): one omg-planner per matched module
**Phase C** — Integration (sequential): generic omg-planner assembles domain plans

## Execution Trace (if features.executionTrace enabled)
After task completes, output compact planning trace:
- Modules matched, pipeline mode (single/multi)
- Skills inventory provided (count across modules)
- Fallbacks, warnings

## Risk Assessment (Mandatory Output)

Every plan phase must include a risk table and effort estimate:

```markdown
### Risk Assessment
| Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation |
|------|-----------------|--------------|-------|------------|
| {risk} | {L} | {I} | {L*I} | {action} |

### Timeline
| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: {name} | S (1d) / M (3d) / L (1wk) | {blocker or dep} |
| Total | {sum} | Critical path: {phase list} |
```

**Effort scale:** S = ~1 day, M = ~3 days, L = ~1 week. Use judgment, not false precision.
**Risk score >= 15** = high risk, mandate mitigation before phase starts.

## Architecture References

For self-assembling kit architecture (Pillars 1–4: SSOT spec files, schema versioning + auto-migrate, declarative CI gates, lifecycle hub) and the canonical phasing model that produced the safety-addendum plan, see `plans/reports/260422-1248-self-assembling-kit-architecture.md`. Plan authors working on Oh My Game Kit infrastructure should align new phases with the §3 Seven Pillars and §11 Consumer Impact & Rollout sequence.

## Sub-Agent Fork Hygiene

**Sub-agent forking:** see `skillsomg-architecture/references/fork-hygiene.md`.
