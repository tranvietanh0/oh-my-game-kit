---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Frontmatter Quality Recommendations

## Recommended maxTurns by Role

| Role | Recommended | Rationale |
|---|---|---|
| implementer | 45-50 | Complex multi-file work + compile checks |
| omg-debugger | 40 | Deep investigation |
| omg-tester | 30-35 | Test execution and analysis |
| reviewer/validator | 25 | Read-heavy, structured output |
| optimizer | 35 | Profiling and optimization |
| omg-planneromg-brainstormer | 25-30 | Ideation and planning |
| docs/design | 20-30 | Writing |
| git/simple ops | 15 | Routine operations |

## Recommended effort by Skill Type

| Type | Effort | Examples |
|---|---|---|
| Planning/debugging/review | high | cook, plan, debug, review, triage |
| Implementation/management | medium | fix, test, ask, brainstorm, modules, doctor |
| Utility/status | low | git, docs, scout, watzup, sync-back, help |

## Module Check Output Format

```
### Module Checks
- Module file ownership: [PASS | FAIL — file X in modules A and B]
- Module dependency integrity: [PASS | FAIL — module X needs Y (not installed)]
- Activation fragment match: [PASS | FAIL — missing fragment for module X]
- Module agent presence: [PASS | FAIL — agent X.md missing]
- Routing overlay validity: [PASS | FAIL — overlay refs agent from different module]
- Stale module files: [PASS | FAIL — N files from uninstalled modules]
- SessionBaseline location: [PASS | FAIL — baseline skill X in optional module Y]
- Keyword uniqueness: [PASS | FAIL — keyword "X" in modules A and B]
- Routing priority uniqueness: [PASS | FAIL — role X at priority N in modules A and B]
- Origin frontmatter match: [PASS | FAIL — file X has origin Y but metadata says Z]
- Module frontmatter presence: [PASS | WARN — N files in modules/ missing module: field]
```
