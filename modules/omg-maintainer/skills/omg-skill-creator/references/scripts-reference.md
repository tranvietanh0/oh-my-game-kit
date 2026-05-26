---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Scripts Reference

All scripts in `.agents/skills/omg-skill-creator/scripts/`. Run with `~/.agents/skills/.venv/bin/python3`.

| Script | Purpose |
|--------|---------|
| `init_skill.py` | Initialize new skill from template |
| `package_skill.py` | Validate + package skill as zip |
| `quick_validate.py` | Quick frontmatter validation |
| `run_eval.py` | Test skill triggering on queries |
| `aggregate_benchmark.py` | Consolidate runs into summary stats |
| `improve_description.py` | AI-powered description optimization (10k token thinking budget) |
| `run_loop.py` | Iterative optimization with train/test split (5-15 iterations, convergence detection) |
| `generate_report.py` | Generate interactive HTML eval report |

## Eval Infrastructure Quick Steps

1. Create test cases in `evals/evals.json` with prompts + assertions
2. Spawn **parallel** with-skill + baseline runs (critical for fair timing)
3. Draft assertions while runs execute
4. Grade outputs with grader agent template (`agents/grader.md`, `agents/comparator.md`, `agents/analyzer.md`)
5. Aggregate results: `scripts/aggregate_benchmark.py`
6. Launch viewer: `eval-viewer/generate_review.py` → interactive HTML review
7. Collect human feedback via viewer → `feedback.json`

JSON schemas: `references/eval-schemas.md`
Full guide: `references/eval-infrastructure-guide.md`

## Description Optimization

Combat undertriggering with "pushy" descriptions:

```yaml
# Undertriggers
description: Data processing skill

# Triggers reliably
description: Process CSV files and tabular data. Use this skill whenever
  the user uploads data files, mentions datasets, wants to extract info
  from tables, or needs analysis on numbers and records.
```

- **Single-pass:** `scripts/improve_description.py` — one iteration from failed triggers
- **Iterative loop:** `scripts/run_loop.py` — train/test split, convergence detection
