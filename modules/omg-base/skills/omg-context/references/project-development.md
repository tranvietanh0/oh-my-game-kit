---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Project Development

Design and build LLM-powered projects and OMG workflows from ideation to deployment.

## Task-Model Fit

**LLM-Suited**: Synthesis, subjective judgment, natural language output, error-tolerant batches, code generation
**LLM-Unsuited**: Precise computation, real-time constraints, perfect accuracy requirements, deterministic output

## Manual Prototype First

Test one example with target model before automating. In OMG: run the phase manually once before building a full `omg-cook` workflow around it.

## Pipeline Architecture

```
acquire → prepare → process → parse → render
 (fetch)  (prompt)   (LLM)   (extract) (output)
```

Stages 1, 2, 4, 5: Deterministic, cheap
Stage 3: Non-deterministic, expensive — minimize token cost here

## File System as Pipeline State (OMG Mapping)

```
plans/{timestamp}-{slug}/
├── plan.md           # acquire done — task scoped
├── phase-01-*.md     # prepare done — context assembled
├── reports/          # process done — LLM outputs captured
└── phase-01-*.md     # parse done — structured findings
```

Resume from any stage: check which phase files exist, pick up from last completed.

**Benefits**: Idempotent, resumable, debuggable — same as OMG `plans/` structure by design.

## Structured Output

Design LLM outputs for reliable parsing:

```markdown
## SUMMARY
[Overview]

## KEY_FINDINGS
- Finding 1

## MODIFIED_FILES
- path/to/file.md: change description

## NEXT_STEPS
1. Next action
```

Always include explicit section headers. Parseable without regex gymnastics.

## Cost Estimation

Before starting multi-agent workflows, estimate token cost:

```
cost = num_items × tokens_per_item / 1000 × price_per_1k × 1.1  (10% buffer)
# Example: 50 phases × 2000 tokens × $0.003/1k = $0.33
```

Multi-agent multiplier: ~15x single agent. Budget accordingly.

## Single vs Multi-Agent Decision

| Factor | Single Agent | Multi-Agent |
|--------|-------------|-------------|
| Task fits context window | Yes | No |
| Tasks are sequential | Yes | No |
| Tasks are parallel | No | Yes |
| Context isolation needed | No | Yes |
| Token budget tight | Prefer | Avoid |

## OMG Workflow Development

When building a new OMG workflow (new skill or command):

1. **Validate manually**: Run the task by hand once — identify pain points
2. **Define pipeline stages**: Map to `plans/` phase structure
3. **Design skill scope**: What does the skill need to know? No more.
4. **Define routing**: Which role handles it? Update `omg-routing-core.json`
5. **Add activation keywords**: Update `omg-activation-core.json`
6. **Test activation**: Verify keyword matching fires correctly
7. **Validate with `omg-doctor`**: Check registry integrity

## Guidelines

1. Validate manually before automating
2. Use 5-stage pipeline (acquire → prepare → process → parse → render)
3. Track state via `plans/` files — idempotent resume
4. Design structured output with explicit section headers
5. Estimate costs before large multi-agent runs
6. Start single-agent, add multi-agent only when context isolation needed
7. Test skill activation keywords with real prompts

## Related

- [Context Optimization](./context-optimization.md)
- [Multi-Agent Patterns](./multi-agent-patterns.md)
