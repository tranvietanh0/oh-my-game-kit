---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Oh My Game Kit Kit Test — Comprehensive Kit E2E Testing

End-to-end validation of kit installation, module lifecycle, and runtime integrity.
Designed to be **generic** — works for any kit (Unity, Cocos, Designer, RN, or future kits).

## Usage
```
omg-kit test --kit unity --kit-path /path/to/oh-my-game-kit-unity
omg-kit test --all                    # Test all kits found in parent directory
omg-kit test --kit cocos --preset mobile
```

## How It Works

1. Discovers the CLI binary (`omg` or builds from source)
2. Creates temp project directories for each test
3. Runs all test phases sequentially
4. Reports PASS/FAIL per check with details
5. Cleans up temp dirs

## Test Phases

### Phase 1: Kit Discovery
- Locate CLI: `which omg` or build from `oh-my-game-kit-cli/bin/gk.js`
- Locate kit repo: `--kit-path` or auto-discover from parent dir
- Read `omg-modules.json` from kit repo to understand its modules and presets
- If `--all`: scan parent dir for all `oh-my-game-kit-*` repos

### Phase 2: Bare Init (Required Modules Only)
```bash
tmpdir=$(mktemp -d)
$CLI init --kit $KIT --kit-path $KIT_PATH --dir $tmpdir -y
```
**Checks:**
- [ ] Init succeeds (exit 0 or success message)
- [ ] `.agents/` directory created
- [ ] `.agents/metadata.json` exists and is valid JSON
- [ ] Only required module(s) installed (count skills, compare with omg-modules.json required modules)
- [ ] Kit-wide files present: routing JSON, config JSON, keywords JSON
- [ ] Agents directory exists with expected agents
- [ ] No core files overridden (no `.agents/skills/omg-cook/`, no `.codex/agents/omg-planner.toml`, etc.)
- [ ] `modules/` directory structure present (if modular kit)

### Phase 3: Preset Init (Full Module Set)
For each preset defined in `omg-modules.json`:
```bash
tmpdir=$(mktemp -d)
$CLI init --kit $KIT --kit-path $KIT_PATH --dir $tmpdir --preset $PRESET -y
```
**Checks:**
- [ ] Init succeeds
- [ ] All preset modules listed in `modules list`
- [ ] Skill count matches sum of preset modules' skill lists
- [ ] Module-specific activation fragments present (one per installed module)
- [ ] Domain-root module agents present (if module declares agents)
- [ ] Routing overlays present (if module declares routingOverlay)

### Phase 4: Module Lifecycle
Starting from bare init:
```bash
# Add a module
echo "y" | $CLI modules add $MODULE_NAME --dir $tmpdir
# Verify
$CLI modules list --dir $tmpdir
# Remove (if not required)
echo "y" | $CLI modules remove $MODULE_NAME --dir $tmpdir
```
**Checks:**
- [ ] `modules add` succeeds for each optional module
- [ ] `modules list` shows added module as installed
- [ ] `modules remove` succeeds for non-required modules
- [ ] `modules remove` REFUSES for required modules (no --force)
- [ ] After add+remove cycle: project returns to bare state

### Phase 5: Metadata Integrity
After each operation, verify:
- [ ] `.agents/metadata.json` is valid JSON
- [ ] Contains `kits` key with kit entry
- [ ] Kit entry has `version`, `installedAt`
- [ ] If modular: `modules` field present with installed module list
- [ ] Per-file entries have `ownership` field

### Phase 6: Resolved Config & Module Summary
- [ ] `.agents/.omg-resolved-config.json` exists after init (modular kits)
- [ ] Contains `routing`, `modules`, `activationKeywords` sections
- [ ] `.omg-module-summary.txt` exists if CLI-generated (optional fallback; `metadata.json` is SSOT)
- [ ] If present, format: `kit|version|preset|module1,module2,...`

### Phase 7: Skill Content Validation
Skills may live in two locations:
- **Flat:** `.agents/skills/*/SKILL.md` (core, non-modular kits)
- **Modular:** `.agents/modules/*/skills/*/SKILL.md` (modular kits)

For each installed skill (from either location):
- [ ] `SKILL.md` exists and is non-empty
- [ ] Has YAML frontmatter with `name` and `description`
- [ ] No broken internal references (references/ dir files exist if referenced)
- [ ] For modular skills: `module` field in frontmatter matches parent module directory name (if origin metadata has been injected by CI/CD)
- [ ] Skill count from physical files matches `omg-modules.json` declarations (per module)

### Phase 8: Activation Fragment Validation
For each installed module:
- [ ] Activation fragment JSON is valid
- [ ] Has `registryVersion`, `kitName`, `mappings`
- [ ] All skill names in `mappings` exist as installed skill directories
- [ ] Required module has `sessionBaseline` (array, not boolean)

### Phase 9: Agent Validation
Agents may live in two locations:
- **Kit-wide:** `.agents/agents/*.md`
- **Module:** `.agents/modules/*/agents/*.md`

For each agent file (from either location):
- [ ] File is non-empty markdown
- [ ] Has YAML frontmatter with `name` and `description`
- [ ] For module agents: `module` field in frontmatter matches parent module directory (if origin metadata injected)

### Phase 10: Hook Scripts
- [ ] `.agents/hooks/generate-baseline-context.cjs` exists (core-owned, reads metadata.json SSOT)
- [ ] `.agents/hooks/check-module-keywords.cjs` exists (core-owned, reads metadata.json + keyword files)
- [ ] Both registered in `.agents/settings.json` (SessionStart and UserPromptSubmit respectively)
- [ ] Keywords file `omg-modules-keywords-*.json` exists and is valid JSON (CI-generated, or `omg-modules.json` as fallback)

### Phase 11: Core Protection
**Skip this phase when testing `--kit core`** — core IS the source of these files.
Only run for engine/designer kits:
- [ ] Kit does NOT contain `.agents/skills/omg-cook/`, `.agents/skills/omg-plan/` etc. (core skills)
- [ ] Kit does NOT contain `omg-routing-core.json` or `omg-activation-core.json`
- [ ] Kit does NOT contain `.codex/agents/omg-planner.toml`, `.codex/agents/omg-git-manager.toml` etc.

### Phase 12: Doctor (if available)
```bash
$CLI doctor --dir $tmpdir
```
- [ ] Doctor command runs without errors
- [ ] All checks pass

### Phase 13: CLI Update Check
```bash
$CLI update --check
```
- [ ] Update check runs without errors
- [ ] Displays current version and latest version
- [ ] Package name is correct (`@the1studio/oh-my-game-kit-cli`, NOT `gamekit-cli`)
- [ ] Registry URL is correct (GitHub Packages, NOT npmjs.org)

### Phase 14: CLI Version Consistency
- [ ] `$CLI --version` outputs valid version string
- [ ] Version in `package.json` matches displayed version
- [ ] No references to old `gamekit` naming in user-facing output

### Phase 15: Release Infrastructure (Kit Repo Check)
Verify the kit repo (not installed project) has proper release setup:
- [ ] `.releaserc.json` exists and is valid JSON
- [ ] `package.json` contains `semantic-release` in devDependencies
- [ ] `.github/workflows/release.yml` exists
- [ ] Release workflow references `oh-my-game-kit-release-action` reusable workflow
- [ ] For modular kits: workflow has `modular: true` input

## Output Format

```
╔══════════════════════════════════════════════════╗
║  Oh My Game Kit Kit Test — {kit-name}                 ║
╠══════════════════════════════════════════════════╣
║  Phase 1: Kit Discovery          ✅ PASS          ║
║  Phase 2: Bare Init              ✅ PASS (13 skills) ║
║  Phase 3: Preset Init            ✅ PASS (3/3 presets) ║
║  Phase 4: Module Lifecycle       ✅ PASS (add/remove ok) ║
║  Phase 5: Metadata Integrity     ✅ PASS           ║
║  Phase 6: Resolved Config        ✅ PASS           ║
║  Phase 7: Skill Content          ⚠️ WARN (2 missing refs) ║
║  Phase 8: Activation Fragments   ✅ PASS           ║
║  Phase 9: Agent Validation       ✅ PASS (12 agents) ║
║  Phase 10: Hook Scripts          ✅ PASS           ║
║  Phase 11: Core Protection       ✅ PASS           ║
║  Phase 12: Doctor                ✅ PASS           ║
╠══════════════════════════════════════════════════╣
║  RESULT: 12/12 PASS  0 FAIL  1 WARN             ║
╚══════════════════════════════════════════════════╝
```

## Implementation Notes

- Use `mktemp -d` for isolated test dirs — clean up after each test
- Use the locally built CLI (`node /path/to/bin/gk.js`) if global `omg` is outdated
- For `modules add/remove`: pipe `echo "y"` for non-interactive confirmation
- Parse `modules list` output to verify installed module names
- Read `omg-modules.json` to dynamically determine expected modules, skills, agents
- ALL checks are derived from `omg-modules.json` — never hardcode kit-specific values
- Report saves to: `plans/reports/` with naming convention

## Non-Modular Kits

For kits without `omg-modules.json` (e.g., core):
- Skip Phases 3, 4, 6, 8, 10 (module-specific)
- Run Phases 1, 2, 5, 7, 9, 11, 12
- Phase 2 becomes "full init" (no module filtering)

## Adding New Kits/Modules

This skill is **future-proof**:
- All checks derive from `omg-modules.json` — no hardcoded module names
- New kits: just point `--kit-path` at the new kit repo
- New modules: automatically included via registry reading
- New presets: automatically tested if `--preset` is iterated from registry
