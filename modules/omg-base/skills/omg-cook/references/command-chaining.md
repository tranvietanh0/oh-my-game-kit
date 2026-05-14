---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Oh My Game Kit Command Chaining

## Common Chains

Each step starts only after the prior completes:

| Chain | Steps | Trigger |
|---|---|---|
| Plan then Implement | `omg-plan` → `omg-cook` | New feature request |
| Implement then Validate | `omg-cook` → `omg-test` → `omg-review` | After each phase |
| Debug cycle | `omg-debug` → `omg-fix` → `omg-test` | Runtime bug |
| Release gate | `omg-test` → `omg-review` → commit | Before merge |
| Triage cycle | `omg-triage` → `omg-cook --auto --parallel` | Issue/PR backlog |

## Auto-Chains (Run Without User Prompt)

- `omg-cook` always ends with `omg-test` (verify implementation)
- `omg-fix` always ends with `omg-test` (verify fix)
- **Any command that updates `.agents/skills/`** → spawn a **background sub-agent** for `omg-sync-back` (`Task` tool, `run_in_background: true`). NEVER manually copy files and NEVER run the skill inline. See `skillsomg-fix/references/error-recovery.md` → "Background Sub-Agent Invocation".
- **Any command that discovers a skill bug** → spawn a **background sub-agent** for `omg-issue` (same pattern). NEVER manually create issues and NEVER run the skill inline.

## Require User Intervention

- Release/milestone gates (approval needed)
- `omg-git pr` (PR review needed)
- Major refactors (scope confirmation needed)

## Resume Interrupted Workflow

Call `TaskList`, find `in_progress` tasks, read `metadata.phaseFile` for context, continue from last completed step.

## Task Orchestration Pattern

`omg-plan` creates Codex Tasks — one per phase. `TaskCreate` fields:
- `title`: "Phase N: <name>"
- `metadata.phase`: N
- `metadata.planDir`: `plans/{timestamp}-{slug}/`
- `metadata.phaseFile`: `plans/{timestamp}-{slug}/phase-0N-*.md`
- `addBlockedBy`: list of predecessor task IDs (sequential phases)

`omg-cook` picks up existing tasks — never re-creates:
1. Call `TaskList` to find tasks with status `pending` or `in_progress`
2. Claim lowest-ID unblocked task first
3. CRITICAL: call `TaskUpdate(status="in_progress")` before writing any code
4. CRITICAL: call `TaskUpdate(status="completed")` before reporting done
