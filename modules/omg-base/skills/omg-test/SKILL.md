---
name: omg-test
description: "Run tests via registry-routed omg-tester agent. Compilation checks, coverage reports, failure analysis. Use for 'run tests', 'check coverage', 'why is this test failing'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Test — Test Runner

Delegate to the registered omg-tester agent. Never ignore failing tests.

## Modes

| Flag | Mode | Behavior |
|------|------|----------|
| (default) | Full | Run entire test suite |
| `--flaky` | Flaky detection | Re-run failing tests up to 3 times, report retry rate per test |
| `--diff` | Diff-aware | Only run tests for files changed since main branch |
| `--coverage` | Coverage | Run with coverage reporting, flag uncovered critical paths |

### Flaky Test Detection (`--flaky`)
1. Run test suite normally
2. For any failing test, re-run it up to 3 times in isolation
3. If test passes on retry: mark as FLAKY (intermittent)
4. If test fails all retries: mark as FAILING (genuine failure)
5. Report: flaky tests with retry rate, genuine failures separately

### Diff-Aware Testing (`--diff`)
1. Run `git diff --name-only origin/main...HEAD` to find changed files
2. Map changed source files → corresponding test files
3. Run only mapped test files
4. If no mapping found: run full suite (fallback)

## Core Principle
**NEVER IGNORE FAILING TESTS.** Fix root causes, not symptoms.

## Full-Verify Contract — What "Tests Green" Actually Means

"Tests passed" is insufficient evidence to claim done. **Three gate types must all pass** before reporting complete:

| Gate | Question it answers | Typical command |
|---|---|---|
| **Type-check** | Does it compile? | `bun run typecheck` / `tsc --noEmit` / `cargo check` |
| **Lint / Format** | Does it meet project style? | `bun run lint` / `biome check` / `eslint .` / `ruff check` |
| **Tests** | Does behavior match spec? | `bun test` / `npm test` / `pytest` / `cargo test` |

These gates are **orthogonal**. A change can pass tests and fail lint (or vice versa). CI runs all three; claiming "done" after running only one or two is a false positive that surfaces as a red PR later.

### Rule

Before claiming work complete:
1. Run the kit's type-check script — read the output
2. Run the kit's lint/format script — read the output
3. Run the kit's test command — read the output
4. Only then claim "done" / "green" / "verified"

If the kit has no lint script: note this explicitly ("no lint gate in this project") so it's visible rather than silently skipped.

### Common scripts to discover

Check `package.json`:
```bash
jq -r '.scripts | to_entries[] | select(.key | test("^(test|lint|typecheck|check|format|build)$")) | "\(.key): \(.value)"' package.json
```

If a repo has `lint` + `typecheck` + `test` scripts, run all three. Don't assume one covers the others.

### Self-Teach on CI Gate Failures — MANDATORY

**Every time a CI quality gate (lint, format, typecheck, test, build, security scan) fails on a PR**, you MUST update the responsible skill to prevent the same failure in future sessions. This is the `development-principles.md` "Update Skills After Every Error" rule applied specifically to CI.

Failure → lesson loop:
1. CI gate fails on PR
2. Identify which local-verify command would have caught it (the CI step's name + what it runs)
3. If that command is NOT in the skill's verify checklist → add it
4. If it IS in the checklist but was skipped → note why, reinforce the checklist
5. Commit the skill update in the SAME session as the CI fix, not "later"

If you are about to push a fix-up commit for a CI failure without updating a skill, **stop and update the skill first**. The fix-up without the skill update guarantees the same person (or future you) will hit the same gate again.

### Bug trail (why this matters)

PR oh-my-game-kit-cli#79 (2026-04-21) had `bun run typecheck` clean + 433 tests green, but CI's Lint stage failed on 3 OS matrices because `biome check` wasn't in the local verify step. Cost: one extra round trip. Had a full-verify contract been followed, the formatter violations would have been caught and fixed locally before push. This skill section exists BECAUSE that happened.

## Agent Routing
Follow protocol: `.agents/skills/omg-cook/references/routing-protocol.md`
This command uses role: `omg-tester`

## Skill Activation
Follow protocol: `.agents/skills/omg-cook/references/activation-protocol.md`

## Workflow

1. Compilation check (read console or build output)
2. Run tests via registered omg-tester agent
3. Analyze test results for failures
4. If failures → spawn registered `omg-debugger` for root cause
5. Report structured results

## Module Context for Tester (if `installedModules` or `modules` present in metadata.json)
Follow protocol: `.agents/skills/omg-cook/references/subagent-injection-protocol.md`
Before spawning omg-tester agent, inject:
- Which module's files are being tested (from `.agents/metadata.json`)
- Module's test skills if available
- Boundary: "Test files in module {name} should not test cross-module behavior"

## Sub-Agent Fork Hygiene

**Sub-agent forking:** see `.agents/skills/omg-architecture/references/fork-hygiene.md`.
