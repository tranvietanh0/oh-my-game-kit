---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Context Optimization

Extend effective context capacity through strategic techniques.

## Four Core Strategies

| Strategy | Target | Reduction | When to Use |
|----------|--------|-----------|-------------|
| **Compaction** | Full context | 50-70% | Approaching limits |
| **Observation Masking** | Tool outputs | 60-80% | Verbose outputs >80% |
| **KV-Cache Optimization** | Repeated prefixes | 70%+ hit | Stable prompts |
| **Context Partitioning** | Work distribution | N/A | Parallelizable tasks |

## Compaction

Summarize context when approaching limits.

**Priority**: Tool outputs → Old turns → Retrieved docs → Never: System prompt or active task

```
if context_tokens / context_limit > 0.8:
    compact_context()
```

**Preserve**: Key findings, decisions, commitments (remove supporting details)

In OMG: use `plans/` phase files as the externalized summary. Phase files survive `/clear`.

## Observation Masking

Replace verbose tool outputs with compact references.

```
if len(observation) > max_length:
    store observation to file
    return "[Obs stored. Key: {extract_key}]"
```

**Never mask**: Current task critical, most recent turn, active reasoning
**Always mask**: Repeated outputs, boilerplate, already-summarized content

## KV-Cache Optimization

Reuse cached Key/Value tensors for identical prefixes.

```
# Cache-friendly ordering (stable first)
context = [system_prompt, rule_files]   # Cacheable — never change mid-session
context += [activated_skills]           # Semi-stable — changes per task
context += [message_history]            # Variable — always last
```

**Tips**: Avoid timestamps in stable sections, consistent formatting, stable structure

## Context Partitioning (OMG Subagent Injection)

Split work across subagents with isolated contexts.

Each subagent spawned by `omg-cook`, `omg-fix`, `omg-debug` gets:
- Its module's skills only (not all installed skills)
- A scoped task description — not the full session history
- Clean context window — no history bleed from coordinator

Coordinator receives only result summaries, not full subagent output.

See `.agents/skills/omg-cook/references/subagent-injection-protocol.md` for the exact injection steps.

## Decision Framework

| Dominant Component | Apply |
|-------------------|-------|
| Tool outputs | Observation masking |
| Retrieved docs | Summarization or partitioning |
| Message history | Compaction + summarization |
| Multiple | Combine strategies |
| Parallelizable tasks | Context partitioning (subagents) |

## Guidelines

1. Measure before optimizing
2. Apply compaction before masking
3. Design for cache stability — stable content first
4. Partition before context becomes problematic
5. Monitor effectiveness over time
6. Balance savings vs quality loss

## Related

- [Context Compression](./context-compression.md)
- [Memory Systems](./memory-systems.md)
