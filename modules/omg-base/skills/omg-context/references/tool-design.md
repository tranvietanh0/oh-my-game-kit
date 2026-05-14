---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Tool and Skill Design

Design effective skills and tools for OMG agent systems.

## Consolidation Principle

Single comprehensive skills > multiple narrow skills. **Target**: 10-20 activated skills per task max.

## Architectural Reduction Evidence

| Metric | 17 Tools | 2 Tools | Improvement |
|--------|----------|---------|-------------|
| Time | 274.8s | 77.4s | 3.5x faster |
| Success | 80% | 100% | +20% |
| Tokens | 102k | 61k | 37% fewer |

**Key**: Good documentation replaces tool/skill proliferation.

## OMG Skill Design Principles

A OMG skill is a Markdown file loaded into context. Every character costs tokens. Design accordingly.

**SKILL.md structure:**
1. **Frontmatter** — activation metadata (name, description, keywords trigger this)
2. **Body** — high-density guidance, loaded when skill activates
3. **Quick Reference table** — links to reference files (loaded on demand)
4. **References dir** — deep content, never auto-loaded

Load cost: frontmatter ~50 tokens, SKILL.md body ~500-2000 tokens, each reference ~300-1500 tokens.

## Description Engineering (Four-Question Framework)

Answer all four in every skill `description` and reference header:

1. **What** does this skill/tool do?
2. **When** should it be used?
3. **What inputs** does it accept?
4. **What** does it return/produce?

### Good SKILL.md Description

```yaml
description: "Context engineering for OMG workflows — optimize token usage,
  manage agent context, design skill injection, troubleshoot context degradation.
  Use when asking about context %, agent architecture, memory systems."
argument-hint: "[topic or question]"
```

### Poor Description

```yaml
description: "Helps with context stuff"
```

## Skill Frontmatter Requirements

All OMG skills MUST include `effort:` in frontmatter:

| Effort | Meaning | Context |
|--------|---------|---------|
| `low` | Quick reference, <500 token body | Default context |
| `medium` | Guidance + references, 500-2000 tokens | Default context |
| `high` | Deep workflow, full agent chain | Consider `context: fork` |

Heavy skills (`effort: high`) should declare `context: fork` to spawn a fresh context window.

## Skill Activation Keywords

Skills activate via `omg-activation-*.json` keyword matching. Design keywords to be:
- **Specific**: "context degradation" not just "context"
- **Non-overlapping**: avoid triggering on every prompt
- **Covering common phrasings**: "token limit", "context window", "context full"

## Error Messages in Skills

Skills should guide agents toward correct usage when misapplied:

```markdown
## When NOT to Use This Skill
- For simple single-file edits (use standard tools directly)
- When no multi-agent coordination is needed
```

Explicit non-use cases reduce incorrect activations.

## Response Format Guidance

Skills should specify expected output format:

```markdown
## Output Format
- Concise by default (3-5 bullet findings)
- Verbose only when explicitly requested
- Always include: status, modified files, next steps
```

## Guidelines

1. Consolidate skills (keep activated set ≤ 10-20 per task)
2. Answer all four description questions in every skill
3. Use full, descriptive parameter/argument names
4. Include explicit "when NOT to use" sections
5. Specify output format expectations
6. Test skill activation with real prompts before shipping
7. Start minimal, add reference files only when proven necessary
8. `effort: high` skills → consider `context: fork`

## Related

- [Context Fundamentals](./context-fundamentals.md)
- [Multi-Agent Patterns](./multi-agent-patterns.md)
