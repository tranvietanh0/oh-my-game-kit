---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Module Subcommand Details

## add

1. Detect target kit: from `--kit` flag, or infer from `installedModules` kit field, or ask user
2. Fetch `manifest.json` from the kit repo's latest GitHub Release
3. Resolve dependencies for requested modules (semver ranges, transitive)
4. Show what will be installed (modules + deps, versions)
5. Download each module's ZIP: `gh release download --repo <repo> --pattern "<module>-*.zip"`
6. Extract: `unzip -o <zip> -d .` — populates `.agents/skills/`, `.agents/agents/`, activation/routing fragments
7. Write `.agents/modules/<name>/manifest.json` listing all installed files
8. Update `.agents/metadata.json` `installedModules` with new entry (version, kit, repository, installedAt)
9. Auto-run `omg-doctor` module checks → verify

## remove

1. Check if any installed module depends on target (read `installedModules` deps)
2. If dependents exist → refuse unless `--force`
3. Show what will be removed (files from manifest)
4. Read `.agents/modules/<name>/manifest.json` → delete all listed files
5. Remove `.agents/modules/<name>/` directory
6. Remove entry from `installedModules` in `.agents/metadata.json`
7. Auto-run `omg-doctor` → verify no stale files remain

## update

- `update` (no args): check all installed modules for newer versions
- `update <module>`: check and update a specific module only
1. Compare installed version vs release manifest version
2. Patch/minor → auto-download module ZIP, extract, update `installedModules` version
3. Major:
   - When `features.autoUpdateMajor: true` (default) → same auto-download path as patch/minor
   - When `features.autoUpdateMajor: false` → warn only: "Major update available for <module>. Run with `--force` to apply."
4. Report: updated / up-to-date / warnings

## list

Show installed modules from `installedModules`:
```
Installed:
  unity-base       1.2.0  [required]  deps: —
  dots-core        1.0.3  [optional]  deps: unity-base
  dots-combat      0.9.1  [optional]  deps: unity-base, dots-core
```

## list --available

1. Fetch `manifest.json` from the kit repo's latest GitHub Release
2. Cross-reference with `installedModules` to mark installed vs available
3. Show: name, description, version, deps, preset membership

## preset

1. Detect kit from `--kit` flag or installed modules
2. Fetch preset definition from release manifest
3. Show module diff: what will be added (not what's already installed)
4. If `--replace`: also show what will be removed (modules not in preset)
5. Confirm interactive (or `--yes` to skip)
6. Run `add` for each module in preset, then `remove` if `--replace`
7. Auto-run `omg-doctor` → verify

## upgrade --preview

Shows what will change before applying the update. Requires user confirmation.

1. Read installed version from `.agents/metadata.json` → `installedModules[module].version`
2. Fetch target version's `manifest.json` from GitHub Release
3. Compare manifests: files added, files removed, files changed, dependency changes
4. Display summary with breaking change warning if major version bump
5. Prompt: `Proceed with upgrade? [y/N]` — abort if no

## validate

1. Run `omg-doctor` module checks only (checks 7-16)
2. For each installed module: verify all dep modules are present with compatible versions
3. Report: satisfied / unsatisfied / version conflicts

## audit

1. Check cross-module skill references
2. Check keyword overlaps across module activation fragments
3. Check module sizes (skill count balance — flag if > 2x average)
4. Check for installed modules with zero activation matches in recent telemetry
5. Check for version conflicts between modules from the same kit
6. Generate report: `plans/reports/module-audit-{date}.md`
7. Suggest rebalancing if needed

## split (kit-repo operation)

1. Analyze module's skills — propose split by domain
2. Ask user to confirm split boundary
3. Update `omg-modules.json` — two new module entries
4. Move files to new module directories
5. Create separate activation fragments per new module
6. Auto-run `omg-doctor` → verify

## merge (kit-repo operation)

1. Validate no name conflicts between modules
2. Combine skills, activation fragments, agents
3. Update `omg-modules.json` — single merged entry
4. Move files to merged module directory
5. Auto-run `omg-doctor` → verify

## create (kit-repo operation)

1. Ask: module name, description, dependencies
2. Scaffold: `modules/<name>/` with `skills/`, `agents/` (if needed), activation fragment
3. Add entry to `omg-modules.json`
4. Auto-run `omg-doctor` → verify
5. **Note:** Origin metadata is NOT added manually — injected by CI/CD release action on next release.

## Available Modules Display

When user asks about topics covered by an uninstalled module, proactively suggest:
> "The `dots-combat` module has skills for combat mechanics, damage systems, and health management. Install with `omg-modules add dots-combat`."

Example display:
```
Available Modules (from omg-modules.json):

  ✓ unity-base [required]     — Core Unity skills
  ✓ dots-core [installed]     — ECS fundamentals
  ○ dots-combat [available]   — Combat mechanics (deps: dots-core)
  ○ rendering [available]     — URP, shaders, VFX (deps: unity-base)
```
