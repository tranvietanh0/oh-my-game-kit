---
name: omg-problem-solve
description: "Activate when stuck after 3+ fix attempts. Breaks complexity spirals, innovation blocks, recurring patterns, and assumption constraints with systematic techniques."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Problem-Solving Techniques

Systematic approaches for different types of stuck-ness. Each technique targets specific problem patterns.

**Auto-activation:** Triggered by OMG error recovery when `omg-debug` or `omg-fix` fails 3+ times on the same issue. See `skillsomg-fix/references/error-recovery.md`.

**MCP integration:** If `mcp__sequential-thinking__sequentialthinking` is available, use it for structured step-by-step analysis within each technique. Fall back to pure markdown methodology if MCP not connected.

## When to Use

Apply when encountering:
- **Complexity spiraling** — multiple implementations, growing special cases, excessive branching
- **Innovation blocks** — conventional solutions inadequate, need breakthrough thinking
- **Recurring patterns** — same issue across domains/modules, reinventing solutions
- **Assumption constraints** — forced into "only way", can't question premise
- **Scale uncertainty** — production readiness unclear, edge cases unknown
- **General stuck-ness** — unsure which technique applies

## Quick Dispatch

**Match symptom to technique:**

| Stuck Symptom | Technique | Reference |
|---------------|-----------|-----------|
| Same thing implemented 5+ ways, growing special cases | **Simplification Cascades** | `references/simplification-cascades.md` |
| Conventional solutions inadequate, need breakthrough | **Collision-Zone Thinking** | `references/collision-zone-thinking.md` |
| Same issue in different modules, reinventing wheels | **Meta-Pattern Recognition** | `references/meta-pattern-recognition.md` |
| Solution feels forced, "must be done this way" | **Inversion Exercise** | `references/inversion-exercise.md` |
| Will this work at production? Edge cases unclear? | **Scale Game** | `references/scale-game.md` |
| Unsure which technique to use | **When Stuck** | `references/when-stuck.md` |

## Core Techniques

### 1. Simplification Cascades
Find one insight eliminating multiple components. "If this is true, we don't need X, Y, Z."

**Key insight:** Everything is a special case of one general pattern.
**Red flag:** "Just need to add one more case..." (repeating forever)

### 2. Collision-Zone Thinking
Force unrelated concepts together to discover emergent properties. "What if we treated X like Y?"

**Key insight:** Revolutionary ideas from deliberate metaphor-mixing.
**Red flag:** "I've tried everything in this domain"

### 3. Meta-Pattern Recognition
Spot patterns appearing in 3+ domains/modules to find universal principles.

**Key insight:** Patterns in how patterns emerge reveal reusable abstractions.
**Red flag:** "This problem is unique" (probably not)

**OMG note:** Cross-module patterns are common — if 3+ modules have the same workaround, extract to a shared skill or core rule.

### 4. Inversion Exercise
Flip core assumptions to reveal hidden constraints. "What if the opposite were true?"

**Key insight:** Valid inversions reveal context-dependence of "rules."
**Red flag:** "There's only one way to do this"

### 5. Scale Game
Test at extremes (1000x bigger/smaller, instant/year-long) to expose fundamental truths.

**Key insight:** What works at one scale fails at another.
**Red flag:** "Should scale fine" (without testing)

## Application Process

1. **Identify stuck-type** — match symptom to technique above
2. **Check module scope** — which module owns the stuck task? Load its skills for domain context
3. **Load detailed reference** — read specific technique from `references/`
4. **Apply systematically** — follow technique's process (use MCP sequential-thinking if available)
5. **Document insights** — record what worked/failed in plans/reports/
6. **Combine if needed** — some problems need multiple techniques

## Combining Techniques

Powerful combinations:
- **Simplification + Meta-pattern** — find pattern, then simplify all instances
- **Collision + Inversion** — force metaphor, then invert its assumptions
- **Scale + Simplification** — extremes reveal what to eliminate
- **Meta-pattern + Scale** — universal patterns tested at extremes

## OMG Integration

### Auto-Activation (Error Recovery)

When `omg-debug` or `omg-fix` fails 3+ times:
1. Error recovery rule auto-suggests this skill
2. Classify the stuck-type from error patterns
3. Apply matching technique
4. If technique succeeds — resume `omg-fix` with new approach
5. If still stuck — escalate to user with technique analysis

### Module-Scoped Analysis

When analyzing a stuck problem:
1. Identify which module(s) are involved
2. Read module's skills for domain-specific patterns
3. Check if the pattern exists in other modules (meta-pattern)
4. Check if the issue is at a module boundary (ownership conflict)

## References

Load detailed guides as needed:
- `references/when-stuck.md` — dispatch flowchart and decision tree
- `references/simplification-cascades.md` — cascade detection and extraction
- `references/collision-zone-thinking.md` — metaphor collision process
- `references/meta-pattern-recognition.md` — pattern abstraction techniques
- `references/inversion-exercise.md` — assumption flipping methodology
- `references/scale-game.md` — extreme testing procedures
