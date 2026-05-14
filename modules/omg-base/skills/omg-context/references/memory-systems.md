---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Memory Systems

Architectures for persistent context beyond the window.

## Memory Layer Architecture

| Layer | Scope | Persistence | OMG Mapping |
|-------|-------|-------------|-------------|
| L1: Working | Current window | None | Active session context |
| L2: Short-Term | Session | Session | `plans/` phase files |
| L3: Long-Term | Cross-session | Persistent | `~/.agents/agent-memory/` |
| L4: Entity | Per-entity | Persistent | `~/.agents/agent-memory/{entity}.md` |
| L5: Temporal Graph | Time-aware | Persistent | Timestamped memory entries |

## OMG Cross-Session Agent Memory

`~/.agents/agent-memory/` provides L3 persistent memory across sessions:

**Use for:**
- Project-specific patterns and decisions discovered during implementation
- Recurring error gotchas (supplement to `.agents/skills/` updates)
- User preferences and working style observations
- Architecture decisions that inform future work

**Naming convention:**
```
~/.agents/agent-memory/
├── {project}-architecture-{date}.md      # Design decisions
├── {project}-gotchas-{topic}.md          # Error patterns
├── {project}-preferences.md              # User preferences
└── {agent-name}-context-{date}.md        # Agent-specific memory
```

**Access pattern:** Read relevant memory files at session start or when topic matches. Do not load all memory files indiscriminately — that defeats the purpose.

## Plans Directory as L2 Memory

`plans/` functions as structured short-term memory that survives `/clear`:

```
plans/
├── {timestamp}-{slug}/
│   ├── plan.md              # Task overview
│   ├── phase-01-*.md        # Phase state (resume point)
│   └── reports/             # Compressed session artifacts
```

Resume protocol: `TaskList` → find `in_progress` → read `metadata.phaseFile` → continue. No re-description needed.

## Benchmark Performance (DMR Accuracy)

| System | Accuracy | Approach |
|--------|----------|----------|
| Zep | 94.8% | Temporal knowledge graphs |
| MemGPT | 93.4% | Hierarchical memory |
| GraphRAG | 75-85% | Knowledge graphs |
| Vector RAG | 60-70% | Embedding similarity |

**Practical OMG choice:** Start with file-system memory (`plans/` + `~/.agents/agent-memory/`). Add structured retrieval only when scale demands it.

## File-System-as-Memory (Recommended Starting Point)

```
memory/
├── sessions/{id}/summary.md      # L2: session summaries
├── entities/{id}.md              # L4: per-entity facts
└── facts/{timestamp}_{id}.md     # L5: time-stamped facts
```

Benefits: Inspectable, version-controlled, no external dependencies, survives process restarts.

## Memory Retrieval Patterns

| Pattern | Query | Use Case |
|---------|-------|----------|
| Semantic | "Similar to X" | General recall |
| Entity-based | "About project Y" | Consistency |
| Temporal | "Valid on date" | Evolving facts |
| Hybrid | Combine above | Production systems |

## Guidelines

1. Start with file-system-as-memory (simplest, most debuggable)
2. Use `plans/` phase files as authoritative L2 session memory
3. Write `~/.agents/agent-memory/` entries for cross-session persistence
4. Use entity indexing for consistency across long projects
5. Add temporal awareness for evolving architecture decisions
6. Load memory files selectively — match to current topic, not all at once
7. Measure retrieval accuracy before adding complexity

## Related

- [Context Fundamentals](./context-fundamentals.md)
- [Multi-Agent Patterns](./multi-agent-patterns.md)
