---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Multi-Agent Patterns

Distribute work across multiple context windows for isolation and scale.

## Core Insight

Subagents exist to **isolate context**, not anthropomorphize roles. Use them when work genuinely benefits from a clean context window — not to simulate a team.

## Token Economics

| Architecture | Multiplier | Use Case |
|--------------|------------|----------|
| Single agent | 1x | Simple tasks |
| Single + tools | ~4x | Moderate complexity |
| Multi-agent | ~15x | Context isolation needed |

**Key**: Token usage explains 80% of performance variance. Accept the ~15x cost only when context isolation genuinely improves quality.

## OMG Subagent Architecture

OMG uses a registry-routed supervisor pattern. The AI (orchestrator) reads routing fragments, resolves which agent handles which role, then spawns via Agent tool with scoped context.

**Roles per command:**

| Command | Roles Spawned |
|---------|--------------|
| `omg-cook` | implementer → omg-tester → reviewer → omg-docs-manager → omg-git-manager |
| `omg-fix` | implementer, omg-debugger |
| `omg-debug` | omg-debugger |
| `omg-test` | omg-tester |
| `omg-review` | reviewer |

**Agent fallback chain**: module agent (p91+) → kit agent (p90) → core agent (p10)

See `skillsomg-cook/references/routing-protocol.md` for resolution algorithm.

## Context Injection Pattern (OMG Subagent Injection Protocol)

Before spawning any registry-routed agent, inject minimal scoped context:

```
Module context:
 - Agent: {agent-name} (module: {module-name} v{version})
 - Module skills (activate these): {comma-separated skill names}
 - Required module skills (also available): {skills from required modules}
 - Activate relevant skills using Skill tool before implementing.
 - DO NOT reference skills from uninstalled modules.
```

**Critical**: inject only the target module's skills. Do NOT dump all installed skills — that defeats context isolation.

See `skillsomg-cook/references/subagent-injection-protocol.md` for full steps.

## OMG Team Pattern (Parallel Agents)

`omg-team` enables parallel agent coordination with explicit file ownership:

```
Lead agent
├── Teammate A — owns src/feature-a/*
├── Teammate B — owns src/feature-b/*
└── Tester     — reads all, writes tests only
```

**File ownership rule**: Each teammate owns distinct files — no overlapping edits. Lead resolves conflicts.

**Communication**: SendMessage(type: "message") for peer DMs. Broadcast only for critical blockers.

**Status protocol**: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT — coordinator never ignores BLOCKED.

## Orchestration Patterns

### Supervisor / Orchestrator (OMG default)

Coordinator decomposes task → spawns subagents with clean context → aggregates summaries.

**Pros**: Controlled, human-in-loop | **Cons**: Bottleneck at coordinator, "telephone game" risk

### Peer-to-Peer (OMG team sessions)

Teammates communicate directly, handoff state via files or messages.

**Pros**: No single point of failure, scales | **Cons**: Complex coordination

### Hierarchical

Strategy layer → Planning layer → Execution layer.

**Pros**: Separation of concerns | **Cons**: Coordination overhead per layer

## Context Isolation Patterns

| Pattern | Isolation | When to Use |
|---------|-----------|-------------|
| Full delegation | Subagent gets task desc only | Max isolation |
| Instruction passing | Subagent gets task + phase file | Simple tasks |
| File coordination | Shared state via `plans/` files | Shared state |

## Failure Recovery

| Failure | Mitigation |
|---------|------------|
| BLOCKED subagent | Provide missing context → re-dispatch |
| NEEDS_CONTEXT | Give missing info, don't retry same approach |
| 3+ failures same task | Escalate to user — never retry blindly |
| Context bleed | Restart subagent with clean context |

**Never**: Force same approach after BLOCKED. Something must change before retry.

## Guidelines

1. Use subagents for context isolation, not role-play
2. Accept ~15x token cost only when isolation genuinely helps
3. Inject minimal scoped context — module skills only, not all installed
4. Use `plans/` phase files for shared state between agents
5. Design clear handoffs with explicit ownership
6. Validate results between agent boundaries
7. Implement circuit breakers (3+ failures → escalate)
8. Context isolation protocol: `skillsomg-cook/references/subagent-injection-protocol.md`

## Related

- [Context Optimization](./context-optimization.md)
- [Evaluation](./evaluation.md)
