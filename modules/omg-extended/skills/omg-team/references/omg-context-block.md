---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# OMG Context Block

Every teammate spawn prompt MUST include this context block at the end. Replace `{placeholders}` with actual values.

## Template

```
OMG Context:
- Work dir: {CWD}
- Reports: {CWD}/plans/reports/
- Plans: {CWD}/plans/
- Branch: {current git branch}
- Kit: {from metadata.json → name} v{version}
- Installed modules: {comma-separated from metadata.json → installedModules}
- Your module scope: {module name if scoped, "all" if kit-wide}
- Your module skills: {comma-separated from module's activation fragment}
- Registry role: {role resolved from omg-routing-*.json, e.g., "implementer → unity-developer"}
- File ownership: {glob patterns from manifest, e.g., "Assets/Combat/**, Scripts/Combat/**"}
- Commits: conventional (feat:, fix:, docs:, refactor:, test:, chore:)
- Refer to teammates by NAME, not agent ID
- Follow rules in .agents/rules/ (loaded automatically)
- Mark tasks completed via TaskUpdate BEFORE sending completion message
```

## How to Build

1. Read `.agents/metadata.json` → extract kit name, version, installedModules
2. Resolve agent role via `.agents/skills/omg-cook/references/routing-protocol.md`
3. Read module's `.omg-manifest.json` → extract file list → derive ownership globs
4. Read module's activation fragment → extract skill names
5. Get current git branch: `git branch --show-current`
6. Substitute all placeholders

## Fork-hygiene checklist for spawned teammates

When a teammate runs as a fork child of the parent skill (parent has `context: fork`):

- Pass `useExactTools: true` when spawning fork children so they inherit the exact toolset, not the default subset.
- Strip `gitStatus` from the teammate's prompt — dynamic file-state in cached prefixes invalidates the cache on every call.
- Return a constant placeholder result (e.g., `{ status: "ok" }`) from the child so the parent isn't token-billed for full child output.
- Apply anti-avoidance prompting for any verifier sub-agents: enumerate excuses explicitly and reinject "verify ONLY, do NOT fix" after every tool result.

Full rules: `.agents/skills/omg-architecture/references/fork-hygiene.md`

## Example (Unity Kit, Combat Module)

```
OMG Context:
- Work dir: /home/user/my-game
- Reports: /home/user/my-game/plans/reports/
- Plans: /home/user/my-game/plans/
- Branch: feat/combat-overhaul
- Kit: oh-my-game-kit-unity v2.3.0
- Installed modules: dots-core, dots-combat, ui, balance
- Your module scope: dots-combat
- Your module skills: omg-combat-patterns, omg-ecs-helpers
- Registry role: implementer → dots-combat-implementer
- File ownership: Assets/Scripts/Combat/**, Assets/Tests/Combat/**
- Commits: conventional (feat:, fix:, docs:, refactor:, test:, chore:)
- Refer to teammates by NAME, not agent ID
- Follow rules in .agents/rules/ (loaded automatically)
- Mark tasks completed via TaskUpdate BEFORE sending completion message
```
