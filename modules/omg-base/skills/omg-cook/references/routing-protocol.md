---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Routing Protocol

## Standard Routing (All Registry-Routed Commands)

1. **Read resolved config:** Check for `.omg-resolved-config.json` first (CLI-generated, pre-merged)
   - If exists: read `routing.{role}` for pre-resolved agent name
   - If absent: fall back to manual resolution below

2. **Manual resolution (fallback):**
   - Read ALL `.agents/omg-routing-*.json` files
   - Sort by `priority` field (descending — higher number wins)
   - For each role, use the highest-priority registration found
   - Fallback to `omg-routing-core.json` (p10) if role not found elsewhere

3. **If no registry files exist:** Use `AskUserQuestion` to ask user which agent to use

## Module-First Routing

In the module-first architecture, **modules are independently installed units** with their own versions. Routing considers which modules are installed (from `metadata.json` → `installedModules`).

**Mode 1 — Single-Module Task** (keywords match 0-1 installed modules):
- Standard highest-priority routing. One agent per role.
- Inject that module's skills into the agent prompt.

**Mode 2 — Multi-Module Task** (keywords match 2+ installed modules):
- Context-based routing. Each module's agent handles its own domain.
- Triggers multi-agent pipeline (parallel domain agents).
- Example: "combat UI" → dots-combat-implementer for logic + ui-developer for UI.

## Module Routing Overlays

Module routing overlays (from `module.json` → `routingOverlay` or CI-generated fragments):
- Module agents: p91+ (deeper dependency = higher priority, computed: `91 + dependency_depth`)
- Kit-wide agents: p90
- Core fallback: p10

## Commands Using This Protocol

| Command | Role(s) |
|---------|---------|
| `omg-cook` | `implementer`, `omg-planner`, `omg-project-manager`, `omg-docs-manager`, `omg-git-manager` |
| `omg-fix` | `implementer`, `omg-debugger` |
| `omg-debug` | `omg-debugger` |
| `omg-test` | `omg-tester` |
| `omg-review` | `reviewer` |
| `omg-triage` | `reviewer`, `omg-skills-manager` |
| `omg-plan` | `omg-planner` |
| `omg-brainstorm` | `omg-brainstormer` |
| `omg-docs` | `omg-docs-manager` |
| `omg-git` | `omg-git-manager` |
| `omg-modules` | `omg-skills-manager` |
