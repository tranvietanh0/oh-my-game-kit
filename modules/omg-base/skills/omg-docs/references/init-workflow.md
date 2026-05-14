---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Docs Init Workflow

## Purpose
Create initial documentation structure for a new project.

## Steps
1. Analyze project type (backend, frontend, game, library, CLI)
2. Create `docs/` directory with appropriate files:
   - `code-standards.md` — coding conventions and patterns
   - `system-architecture.md` — high-level architecture overview
   - `project-changelog.md` — change history
   - `development-roadmap.md` — planned features and milestones
   - `codebase-summary.md` — quick overview for onboarding
3. Populate each file with project-specific content from codebase analysis
4. Add cross-references between docs where relevant

## Delegation
Routes to registered `omg-docs-manager` agent via routing protocol.
