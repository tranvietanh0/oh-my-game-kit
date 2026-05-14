---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Module Detection Protocol

## Module State Detection (All Module-Aware Commands)

1. **Read resolved config:** Check for `.omg-resolved-config.json` first
   - If exists: read `installedModules` key for pre-resolved module state
   - If absent: fall back to manual resolution below

2. **Manual resolution (fallback):**
   - Read `.agents/metadata.json`
   - Check `schemaVersion` field:
     - **v3 (current):** Read `installedModules` — object keyed by module name, each with `version`, `kit`, `repository`
     - **v2 (legacy):** Read `modules` key — flat list. Treat as installed modules without version info
     - **No `modules` or `installedModules`:** Flat/core-only, skip module checks

3. **Per-module state (v3):**
   - Each entry in `installedModules` is independently versioned
   - Module's `kit` field identifies which container repo it came from
   - Module's `version` field is the installed semver

## Graceful Degradation

All module checks MUST degrade gracefully:
- **No `.agents/metadata.json`:** Treat as no modules, skip module checks
- **schemaVersion 3:** Full module-first mode — per-module versions, deps, manifests
- **schemaVersion 2 (legacy):** Module names known but no per-module versions — upgrade path: `omg-doctor fix`
- **No schemaVersion:** Flat kit (core-only), skip module checks

## Per-File Module Origin

When working with specific files, determine module ownership:
```
Read .agents/modules/{name}/.omg-manifest.json → file list
For target file path:
  - Match against installed module manifests
  - Return: module name, kit, version
  - If no match: file is kit-wide or core
```

## Detection Pattern

```
IF .agents/metadata.json exists:
  IF schemaVersion == 3:
    Read installedModules → per-module { version, kit, repository }
    Each module is independently versioned and installable
  ELSE IF "modules" key present (v2 legacy):
    Read modules list → module names without versions
    Suggest: run omg-doctor fix to migrate to v3
  ELSE:
    → flat kit (core-only), skip module checks
ELSE:
  → no metadata, skip module checks
```

## Module Manifest Files

Each installed module has a file manifest at `.agents/modules/{name}/.omg-manifest.json`:
- Lists all files owned by that module
- Used for: update (diff old vs new), remove (delete all), split/merge (combine install + remove)
- If manifest missing but module in metadata: warn, suggest reinstall

## Available Modules Discovery (MANDATORY)

**Always read `omg-modules.json`** (not just `metadata.json`) to discover ALL available modules — both installed and not-yet-installed.

```
Read .agentsomg-modules.json → modules key
  For each module:
    - name, description, required, dependencies, skills
    - Check if installed: compare against installedModules from metadata.json
    - If NOT installed: note as "available" — can be installed via omg-modules add
```

**Proactive module suggestion:** When a user asks about a topic and an uninstalled module's keywords match:
- Inform the user: "Module `{name}` covers this topic but isn't installed. Install with `omg-modules add {name}`."
- Show module description and what skills it provides
- Don't block the user — offer, don't require

**Also check `kits` metadata format:** If `metadata.json` has `kits.{name}` but no `installedModules`, the project was initialized via `omg init` but modules haven't been individually tracked. Read `omg-modules.json` to determine which modules are available, and check `omg-routing-*.json` / `omg-activation-*.json` fragment names to infer which kits are installed.

## Commands Using This Protocol

Every module-aware command: doctor, help, sync-back, issue, triage, watzup, cook, fix, debug, test, review, scout, plan, brainstorm, modules.
