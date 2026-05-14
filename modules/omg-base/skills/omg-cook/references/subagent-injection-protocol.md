---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Subagent Skill Injection Protocol

## Problem

When a command spawns a subagent (e.g., `dots-implementer`), the subagent has its own 200K context. It does NOT inherit the parent's activated skills. The subagent needs to know which module it belongs to and which skills to activate.

## Injection Steps (MANDATORY if `.agents/metadata.json` has `installedModules`)

Before spawning any registry-routed agent:

### Step 1 — Identify Module Scope
- Read `.agents/metadata.json` → `installedModules` (v3) to find installed modules with versions
- Read the agent's `module.json` → `routingOverlay` to determine module ownership
- If agent has no module association → skip module scope, use all installed skills

### Step 2 — Build Skill List
- **Module skills:** read module's `module.json` → `skills` array
- **Required module skills:** read required modules' `module.json` → `skills` (always available)
- **Core skills:** always available (omg-cook, omg-fix, etc.)

### Step 3 — Inject Into Agent Prompt
Include this block in the Agent tool's prompt parameter:

**For module-scoped agent:**
```
Module context:
 - Agent: {agent-name} (module: {module-name} v{version})
 - Module skills (activate these): {comma-separated skill names}
 - Required module skills (also available): {comma-separated skills from required modules}
 - Activate relevant skills using Skill tool before implementing.
 - DO NOT reference skills from uninstalled modules.
```

**For non-module agent:**
```
Kit context:
 - Agent: {agent-name} (no specific module scope)
 - All installed module skills available. Read module.json files for skill lists.
 - Activate relevant skills using Skill tool before implementing.
```

### Step 4 — Post-Agent Verification
- Verify no references to skills from uninstalled modules
- Run `omg-doctor` module checks if module files were modified

## Agent Types and Injection Needs

| Agent Type | Needs Skills For | Injection Type |
|---|---|---|
| **Implementer** (cook/fix) | Activating and following patterns | Full skill activation |
| **Debugger** (debug) | Investigation context | Full skill activation |
| **Tester** (test) | Test patterns and context | Full skill activation |
| **Reviewer** (review) | Checking compliance | Skill activation for standards |
| **Planner/Brainstormer** | Feasibility and inventory | Skill inventory only (names + modules) |
| **Docs/Git/Skills-mgr** | Context awareness | Module metadata only |
