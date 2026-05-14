---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Manifest Ownership Resolution

Auto-derive file ownership for teammates from module manifests. Zero manual configuration.

## Algorithm

```
1. Read .agents/metadata.json → installedModules
   - Each entry: { name, version, kit, repository }

2. For each installed module:
   a. Read .agents/modules/{name}/.omg-manifest.json → files[]
   b. Extract top-level directories from file paths
   c. Derive glob patterns: "{dir}/**" for each unique top-level dir
   d. Store: module → [glob patterns]

3. Assign ownership:
   - One teammate per module (or per task group if single-module)
   - Include in TaskCreate description: "File ownership: {glob patterns}"
   - Teammates MUST NOT modify files outside their ownership globs

4. Validation:
   - No glob overlap between teammates (modules should not share directories)
   - If overlap detected: warn lead, suggest manual resolution
```

## Example

Given installed modules with manifests:

```
dots-combat manifest files:
  - Assets/Scripts/Combat/CombatSystem.cs
  - Assets/Scripts/Combat/DamageCalculator.cs
  - Assets/Tests/Combat/CombatSystemTests.cs
→ Ownership globs: Assets/Scripts/Combat/**, Assets/Tests/Combat/**

ui manifest files:
  - Assets/Scripts/UI/HealthBar.cs
  - Assets/Scripts/UI/DamagePopup.cs
  - Assets/Prefabs/UI/HealthBar.prefab
→ Ownership globs: Assets/Scripts/UI/**, Assets/Prefabs/UI/**
```

Result: dev-combat owns `Assets/Scripts/Combat/**, Assets/Tests/Combat/**`
Result: dev-ui owns `Assets/Scripts/UI/**, Assets/Prefabs/UI/**`

## No Manifest? Error.

All kits are module containers. Manifests MUST exist. If a module is installed but has no manifest:

```
Error: Module "{name}" has no .omg-manifest.json.
Run omg-modules to fix module setup, or reinstall the module.
Cannot auto-derive file ownership without manifests.
```

Do NOT fall back to manual ownership or heuristics. Fix the module setup first.

## Shared Files

Some files may not belong to any module (kit-wide config, shared utilities):
- These are owned by the **lead** session
- Teammates must NOT modify shared files
- If a teammate needs a shared file changed: SendMessage to lead with the request
- Lead applies shared changes after all teammates complete
