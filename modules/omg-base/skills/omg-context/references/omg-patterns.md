---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# OMG-Specific Context Patterns

## Skill Injection as Context Partitioning

Subagent-injection-protocol (`skillsomg-cook/references/subagent-injection-protocol.md`) is context partitioning in practice:
- Each spawned subagent gets ONLY its module's skills — not all installed skills
- Module scoping = attention management: restricts context to relevant domain
- Prevents cross-module context bleed and distraction

**Pattern**: Before spawning any registry-routed agent, build a minimal skill list:
```
Module skills → Required module skills → Core skills only
```
Never inject all installed module skills into every subagent.

## Registry Activation as Progressive Disclosure

OMG activation mirrors the progressive disclosure principle:
1. **sessionBaseline skills** — always loaded, lowest-cost universal context
2. **Keyword-matched skills** — loaded only when topic detected (`omg-activation-*.json`)
3. **Reference files** — loaded on demand within a skill (this file's Quick Reference table)

Never load all skills at session start. Let keyword matching drive activation.

## Module Scoping as Attention Management

When routing in multi-module mode (keywords match 2+ modules):
- Each domain agent receives ONLY its module's skills — no cross-contamination
- Coordinator receives only summaries, not full agent outputs
- This matches the context isolation pattern: subagents process in clean windows

## OMG Team Templates as Context Isolation

`omg-team` spawns parallel agents with isolated contexts. Each teammate:
- Owns distinct files (no overlap) — prevents context collision
- Communicates via structured messages, not shared context state
- Reports DONE/BLOCKED/NEEDS_CONTEXT — coordinator synthesizes

This is supervisor/orchestrator pattern with explicit file-ownership boundaries.

## OMG Hooks as Runtime Awareness

OMG ships hooks that inject context metadata automatically:
- `generate-baseline-context.cjs` (SessionStart) — injects installed module summary
- `check-module-keywords.cjs` (UserPromptSubmit) — warns on uninstalled module keywords
- `usage-context-awareness.cjs` (PostToolUse) — injects usage limits and context %

These hooks reduce manual monitoring overhead. Trust them; don't duplicate their logic.

## Plans Directory as Session Memory

`plans/` acts as L2 session memory:
- Phase files persist task state across context resets (`/clear`)
- Resume via `TaskList` + `metadata.phaseFile` — no need to re-describe work
- Reports in `plans/reports/` serve as compressed session summaries

## Agent Memory for Cross-Session Persistence

`~/.agents/agent-memory/` provides L3 (cross-session) memory:
- Agents write findings, decisions, and preferences here
- Memory survives session resets and `/clear`
- Use structured filenames: `{project}-{topic}-{date}.md`

## Guidelines

1. Place critical info at beginning/end of context
2. Implement compaction at 70-80% utilization
3. Use subagents for context isolation, not role-play
4. Design skills with 4-question framework (what, when, inputs, returns)
5. Optimize for tokens-per-task, not tokens-per-request
6. Validate with probe-based evaluation
7. Start minimal, add complexity only when proven necessary
8. Scope subagent skill injection to the relevant module only
9. Use `plans/` as session memory — resume from phase files, not re-description
