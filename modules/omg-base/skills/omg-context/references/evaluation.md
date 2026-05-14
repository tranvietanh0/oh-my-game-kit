---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Evaluation

Systematically assess agent performance and context engineering choices.

## Key Finding: 95% Performance Variance

- **Token usage**: 80% of variance
- **Tool calls**: ~10% of variance
- **Model choice**: ~5% of variance

**Implication**: Token budgets matter more than model upgrades. Optimize context before switching models.

## Multi-Dimensional Rubric

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Factual Accuracy | 30% | Ground truth verification |
| Completeness | 25% | Coverage of requirements |
| Tool Efficiency | 20% | Appropriate tool/skill usage |
| Citation Accuracy | 15% | Sources match claims |
| Source Quality | 10% | Authority/credibility |

## Evaluation Methods

### LLM-as-Judge

Beware biases:
- **Position**: First position preferred
- **Length**: Longer = higher score
- **Self-enhancement**: Rating own outputs higher
- **Verbosity**: Detailed = better

**Mitigation**: Position swapping, anti-bias prompting, pairwise comparison

### Pairwise Comparison

Compare output A vs B twice (AB and BA). Flag inconsistency:

```
score_AB = judge.compare(output_a, output_b)
score_BA = judge.compare(output_b, output_a)
# consistent if both agree on winner
```

### Probe-Based Testing

| Probe | Tests | Example |
|-------|-------|---------|
| Recall | Facts | "What was the error?" |
| Artifact | Files | "Which files modified?" |
| Continuation | Planning | "What's next?" |
| Decision | Reasoning | "Why chose X?" |

Use probes to evaluate compression quality (see [context-compression.md](./context-compression.md)).

## OMG Agent Evaluation

Apply evaluation when reviewing subagent outputs from `omg-cook`, `omg-review`, `omg-test`:

1. **Token efficiency**: Did the subagent use minimal context to complete the task?
2. **Skill relevance**: Were only relevant skills activated (no noise)?
3. **Output completeness**: Does output cover the phase requirements?
4. **Artifact trail**: Are modified files explicitly listed?

## Test Set Design

Stratify by complexity for balanced evaluation:

```
sample = (
    N/3 simple cases +
    N/3 medium cases +
    N/3 complex cases
)
```

## Production Monitoring

- Sample ~1% of agent outputs
- Alert threshold: quality score < 0.85
- Telemetry: OMG hooks write to `.agents/telemetry/` — review in `omg-watzup`

## Guidelines

1. Start with outcome evaluation, not step-by-step
2. Use multi-dimensional rubrics
3. Mitigate LLM-as-Judge biases with pairwise comparison
4. Test with stratified complexity
5. Implement continuous monitoring via telemetry hooks
6. Focus on token efficiency (80% of variance)
7. Probe-test compressed summaries before trusting them

## Related

- [Context Compression](./context-compression.md)
- [Tool Design](./tool-design.md)
