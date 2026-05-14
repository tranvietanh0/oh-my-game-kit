---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Context Fundamentals

Context = all input provided to LLM for task completion.

## Anatomy of Context

| Component | Purpose | Token Impact |
|-----------|---------|--------------|
| System Prompt | Identity, constraints, guidelines | Stable, cacheable |
| Skill Definitions | Activated skill SKILL.md bodies | Grows with activations |
| Retrieved Docs | Domain knowledge, just-in-time | Variable, selective |
| Message History | Conversation state, task progress | Accumulates over time |
| Tool Outputs | Results from actions | 83.9% of typical context |

## Attention Mechanics

- **U-shaped curve**: Beginning/end get more attention than middle
- **Attention budget**: n^2 relationships for n tokens depletes with growth
- **Position encoding**: Interpolation allows longer sequences with degradation
- **First-token sink**: BOS token absorbs large attention budget

## System Prompt Structure

```xml
<BACKGROUND_INFORMATION>Domain knowledge, role definition</BACKGROUND_INFORMATION>
<INSTRUCTIONS>Step-by-step procedures</INSTRUCTIONS>
<SKILL_GUIDANCE>When/how to use skills and tools</SKILL_GUIDANCE>
<OUTPUT_DESCRIPTION>Format requirements</OUTPUT_DESCRIPTION>
```

## Progressive Disclosure Levels (OMG)

1. **Session baseline** (~100-500 tokens) — `sessionBaseline` skills always in context
2. **Keyword-matched skills** (<5k tokens each) — loaded when activation keywords hit
3. **Reference files** (unlimited) — loaded on demand from skill Quick Reference tables

This mirrors OMG's activation protocol: never load everything upfront.

## Token Budget Allocation

| Component | Typical Range | Notes |
|-----------|---------------|-------|
| System Prompt | 500-2000 | Stable, optimize once |
| Skill Definitions | 100-500 per skill | Keep activated set lean |
| Retrieved Docs | 1000-5000 | Selective loading |
| Message History | Variable | Summarize at 70% |
| Reserved Buffer | 10-20% | For responses |

## Document Management

**Strong identifiers**: `context-optimization.md` not `docs/file1.md`
**Chunk at semantic boundaries**: Paragraphs, sections, not arbitrary lengths
**Include metadata**: Source, date, relevance score

## Message History Pattern

Inject summary every N turns to prevent unbounded growth:

```
[Turn 1-20: detailed history]
→ Summary injected: "Implemented X, decided Y, next: Z"
[Turn 21+: fresh turns only]
```

Trigger at 70% utilization, not at failure.

## Guidelines

1. Treat context as finite with diminishing returns
2. Place critical info at attention-favored positions (beginning/end)
3. Use file-system-based access for large documents
4. Pre-load stable content, just-in-time load dynamic
5. Design with explicit token budgets
6. Monitor usage, implement compaction triggers at 70-80%

## Related Topics

- [Context Degradation](./context-degradation.md) - Failure patterns
- [Context Optimization](./context-optimization.md) - Efficiency techniques
- [Memory Systems](./memory-systems.md) - External storage
