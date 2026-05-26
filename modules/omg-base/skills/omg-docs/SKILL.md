---
name: omg-docs
description: "Create and update project documentation in docs/. Use for 'init docs', 'update docs after this change', 'generate a codebase summary', 'docs are out of date'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Docs — Documentation Management

Manage project documentation in `docs/` directory.

## Operations
| Operation | Description |
|---|---|
| `init` | Create project-appropriate doc structure |
| `update` | Update docs after code changes |
| `summarize` | Quick codebase summary |

## Doc Structure
```
docs/
├── code-standards.md
├── system-architecture.md
├── project-changelog.md
├── development-roadmap.md
└── codebase-summary.md
```

## Agent Routing
Follow protocol: `.agents/skills/omg-cook/references/routing-protocol.md`
This command uses role: `omg-docs-manager`

## References
- `references/init-workflow.md`
- `references/update-workflow.md`
- `references/summarize-workflow.md`
