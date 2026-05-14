---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Environment Variables — .env Resolution Hierarchy

OMG resolves env vars in priority order (highest first):

| Tier | Location | Scope |
|------|----------|-------|
| 1 — Runtime | `process.env` (shell export) | Session only |
| 2 — Skill-local | `.agents/skills/{name}/.env` | Single skill |
| 3 — Shared | `.agents/.env.shared` | All skills in project |
| 4 — Global | `~/.agents/.env` | All projects on machine |

## Rules

- Never hardcode values — use env vars
- Document required vars in `.env.example` (no real values, committed to repo)
- Ensure `.env` is in `.gitignore`

## Anti-Rationalization Guards (Cook)

| Trap | Reality |
|------|---------|
| "This is too simple to plan" | Simple tasks hide complexity. Plan takes 30 seconds. |
| "I already know how to do this" | Knowing != planning. Write it down. |
| "The user wants speed" | Plan -> implement -> done is faster than implement -> debug -> rewrite. |
| "Let me just start coding" | Undisciplined action wastes tokens. Plan first. |
| "I'll plan as I go" | That's not planning, that's hoping. |
| "Just this once" | Every skip is "just this once." No exceptions. |

## Execution Trace

After task completes, if `features.executionTrace` enabled (default: true in `omg-config-*.json`), output compact summary (max 15 lines):
- Modules matched, routing mode (single/multi-module)
- Agents used (role: agent-name, module, priority)
- Skills activated (count + top 5)
- Fallbacks used, warnings
