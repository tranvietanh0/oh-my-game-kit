---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Docs Update Workflow

## Purpose
Update existing documentation after code changes.

## Steps
1. Identify what changed: `git diff --name-only HEAD~N`
2. Map changed files to affected docs:
   - API changes → system-architecture.md, code-standards.md
   - New features → development-roadmap.md, project-changelog.md
   - Refactors → code-standards.md, codebase-summary.md
3. Read current doc content, apply updates
4. Update changelog with dated entry
5. Verify cross-references still valid

## Triggers
- After feature implementation
- After major refactor
- After dependency updates
- After architecture changes
