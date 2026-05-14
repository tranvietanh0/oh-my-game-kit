---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
<!-- omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=null | protected=true -->

# omg-plan Workflow Modes

## Comparison Table

| Aspect | default | `--hard` | `--deep` |
|--------|---------|----------|----------|
| Researcher count | 1 | 2 parallel | 3 parallel |
| Scout frequency | one-time (start) | per critical phase | per phase (no exceptions) |
| Validation gate | optional (advisory) | recommended (SHOULD) | mandatory (MUST) |
| Context7 usage | on-demand | per phase for each library | per phase + per library version |
| Dependency analysis | single pass | two passes (upstream + downstream) | three passes (upstream + downstream + cycles) |
| Risk matrix size | top 5 risks | top 10 risks | exhaustive (≥15 risks enumerated) |
| Typical effort | S–M | M–L | L–XL |
| When to use | routine features | complex features with ambiguity | mission-critical or cross-kit |

## Default Mode

- 1 omg-researcher agent for upfront discovery
- One-time scout at the start of the plan
- Validation gates are advisory — skip if phases are simple

Suitable for 80% of planning work.

## --hard Mode

- 2 omg-researcher agents in parallel, each exploring a different aspect
- Scout invoked at the start of each critical phase
- Validation gates recommended — run `omg-review` on phase outputs before proceeding
- Context7 consulted for every library mentioned in the plan

Use when the task has unclear scope, multiple viable approaches, or significant risk.

## --deep Mode

The most thorough planning mode. Use for architecture-critical features where getting it wrong has high cost.

- 3 omg-researcher agents in parallel, each with a distinct research angle
- Scout invoked at the start of EVERY phase (not just critical ones)
- Validation gate is mandatory — AI MUST run `omg-review` (or equivalent gate) between phases; cannot proceed on a failed gate without explicit user override
- Dependency analysis in three passes: upstream callers, downstream effects, circular dependency detection
- Risk matrix must enumerate at least 15 distinct risks; if fewer exist, document that enumeration was exhaustive

Use when:
- Cross-kit ripple is expected (changes affect multiple repos)
- The change touches security-critical code
- The change touches release infrastructure or CI gates
- User explicitly requests thoroughness ("plan this carefully", "be thorough")

### --deep vs --hard

- `--hard` is thorough for feature work
- `--deep` is thorough for architecture work
- If unsure which to use, start with `--hard` and escalate to `--deep` if the red team finds critical gaps

## --tdd Flag (composable with any depth mode)

Inserts the TDD workflow (3.T → 3.I → 3.V) into every implementation phase in the generated plan. The plan's phase cards will include a `TDD: yes` marker and sub-step breakdowns in the "Implementation Steps" section.

See `omg-cook` `references/workflow-steps.md` → `## --tdd Flag Behavior` for the T/I/V mechanics.

Composable combinations:
- `--hard --tdd` — 2 researchers, per-critical-phase scout, TDD sub-steps in every phase
- `--deep --tdd` — 3 researchers, per-phase scout, mandatory validation, TDD sub-steps in every phase (highest-safety combination)

## Guards

- `--hard + --deep`: REFUSE. `--deep` is a superset of `--hard`; use `--deep` alone.
- `--fast + --deep`: REFUSE. Fast mode skips rigor; `--deep` mandates it. They are incompatible.
- `--tdd + --parallel`: REFUSE. TDD requires strict T→I→V ordering; parallel execution cannot preserve it.
- `--fast + --hard`: ALLOWED but discouraged — document the reason in the plan.

## Test Cases

| Invocation | Expected Behavior |
|------------|-------------------|
| `omg-plan "feature X" --deep` | 3 researchers, per-phase scout, mandatory validation |
| `omg-plan "feature X" --hard --tdd` | 2 researchers, per-critical-phase scout, TDD sub-steps in every phase |
| `omg-plan "feature X" --deep --tdd` | 3 researchers, per-phase scout, mandatory validation, TDD sub-steps |
| `omg-plan "feature X" --hard --deep` | REFUSE — mutually exclusive |
| `omg-plan "feature X" --fast --deep` | REFUSE — mutually exclusive |
