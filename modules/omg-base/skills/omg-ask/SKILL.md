---
name: omg-ask
description: "Answer technical questions with context-aware skill activation. Use for 'how does X work', 'what is the best way to', 'explain this pattern' queries."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Ask — Technical Q&A

Context-aware Q&A that auto-activates relevant skills by topic and checks existing project knowledge.

## Skill Activation
Read ALL `.agents/omg-activation-*.json` files.
Match question keywords against ALL fragments. Activate all matching skills (ADDITIVE).

## Process

1. **Classify question** — architecture, API, gotcha, pattern, or design decision?
2. **Activate skills** — match keywords → load relevant skill context
3. **Check project knowledge** — scan `.agents/skills/` gotchas before answering
4. **Use `AskUserQuestion`** if question is ambiguous
5. **Answer** — cite skill source when possible; flag uncertainty explicitly
6. **Scope gate** — if answer requires code changes, say: "To implement this, use `omg-cook`"

## Answer Format

- Short questions → direct answer + relevant gotcha if applicable
- Architecture questions → options table with tradeoffs
- Gotcha questions → What/Why/Fix/Prevention pattern

## Critical Constraints

- DO NOT implement — answer and advise only
- If unsure about an API, say so and suggest `omg-scout` to verify
- Always surface relevant gotchas from skill files

## Scope

Technical Q&A only — does NOT implement or modify code.
