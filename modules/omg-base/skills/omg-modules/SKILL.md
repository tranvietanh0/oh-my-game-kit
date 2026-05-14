---
name: omg-modules
description: "Manage optional skill modules for modular kits. Use for 'install module X', 'remove module Y', 'list available modules', 'apply a preset', 'update modules', or auditing module health."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Modules — Module Management

Day-to-day module management for modular kits. Modules are downloaded from
GitHub Releases independently, each versioned via `module.json`. Dependencies
are resolved automatically using semver ranges.

## Subcommands

| Command | Purpose |
|---------|---------|
| `add <names>` | Install modules + auto-resolve deps |
| `remove <names>` | Remove modules (refuses if dependents exist) |
| `update [<module>]` | Check for newer versions, install updates |
| `upgrade --preview <module>` | Show upgrade diff before applying |
| `list` | Show installed modules with versions + deps |
| `list --available` | Fetch manifest from releases, show available |
| `preset <name>` | Install all modules in a preset |
| `validate` | Check all installed modules have satisfied deps |
| `audit` | Unused modules, missing deps, version conflicts |
| `split <module>` | Split a module into two (kit-repo operation) |
| `merge <a> <b>` | Merge two modules into one (kit-repo operation) |
| `create <name>` | Scaffold new module in kit repo |

## Module State Detection

Follow protocol: `skillsomg-modules/references/module-detection-protocol.md`

Detect installed kits from MULTIPLE signals:
1. `metadata.json` → `installedModules` or `kits` key
2. `omg-routing-*.json` files — each fragment = one kit installed
3. `omg-activation-*.json` files — activation fragments confirm kit presence
4. `.agents/agents/` — kit-specific agents = kit installed

**Always read `omg-modules.json`** to discover ALL available modules. Module discovery scans only the first 30 lines of each module.json (frontmatter region) for performance; full body parsed lazily only when an action requires it.

## Live Module State (fetch on demand — do NOT inline in body)

When a module subcommand runs, fetch live state via tool calls AFTER the body is loaded — NEVER embed `` !`cat ...` `` here (cache-busts on every module install/remove). Use:

- `Read .agents/metadata.json` → v3 schema, `installedModules[]`, `kits[]`
- `Read .omg-module-summary.txt` → quick summary (file may not exist)
- `Read .agentsomg-modules.json` → registry of available modules + presets

If a file doesn't exist, treat as "no modular kits installed" — do not echo error.

## Subcommand Details

Full implementation details for each subcommand: `references/subcommand-details.md`

## Detect & Apply — CLI Delegation (P4 SSOT)

The skill does NOT reimplement scanning. All evidence collection is CLI-side; the skill is the decision layer.

```
omg modules detect --json [--cache-only] [--kit <name>]
```

Returns the 3-section evidence shape: `{confident: {install, recover}, ambiguous, unused-suspect, scanned, mode?}`. Skill workflow:

1. `confident.install[]` — present list with hits + first excerpt; on user confirmation: `omg modules add <name> --yes`.
2. `confident.recover[]` — orphan directories; on user confirmation: `omg modules add <name> --yes` (reinstall reconciles `metadata.installedModules`).
3. `ambiguous[]` — **defer to AI reasoning** (see next section).
4. `unused-suspect[]` — NEVER auto-apply; skill explains per-module and asks before `omg modules remove --yes`. Requires `--aggressive` on the CLI side.

**Fallback when `omg` CLI is missing:** the skill must detect this (`which omg` or `spawnSync('omg', ['--version'])` exit != 0), warn with the npm install hint, and fall back to the legacy manual workflow documented in `references/subcommand-details.md`. Never crash.

## AI Reasoning Layer (P7)

For `ambiguous[]` entries, regex hits alone are insufficient. Codex reasons over the full context:

1. Read each ambiguous entry's `excerpts[]` (file + line + snippet).
2. Open the first 1–2 source files via the `Read` tool to confirm the semantic fit.
3. Cross-reference the module's `description` and `skills[]` in `.agentsomg-modules.json`.
4. Form a per-module recommendation with explicit rationale, e.g. *"unity-mobile: the project compiles for iOS + reads `Application.platform == IPhone` in 3 files; AndroidManifest.xml is absent. Recommend install."*
5. Present a single conversational summary to the user: per-module `INSTALL / SKIP / NEED MORE INFO`, reasons included. Never auto-apply on ambiguous.

For `unused-suspect[]`, Codex reads the module's description + inspects git history (`git log -- .agents/modules/{name}/`) to distinguish "never used" from "used transiently, still valuable." Defaults to recommending KEEP unless clear dead-weight signal.

Design rationale: per AGENTS.md #8, CLI emits evidence; AI reasons. This is the canonical example of that split. Doctor check #40 (`project-module-fitness`) remains deterministic: it surfaces `confident.*` only and never consults the AI layer.

## Key Behaviors

- Modules are downloaded from GitHub Releases (not extracted from a full kit ZIP)
- Each module is independently versioned; deps use semver ranges
- File manifests (`.agents/modules/<name>/manifest.json`) enable clean remove/update
- All destructive operations (split, merge, remove) require confirmation
- After every operation: auto-run `omg-doctor` module checks
- `split`, `merge`, `create` are kit-repo operations; `add`, `remove`, `update`, `preset` are project operations

## Gotchas

- **Do not add origin metadata** — `origin`, `repository`, `module`, `protected` fields are CI/CD-injected, not authored in source.
- **v2 compatibility** — If `metadata.json` has `modules` key (v2), read from that map. Write-back uses whichever schema is present.
- **Module ZIP naming** — ZIPs follow `<module-name>-<version>.zip`. If not found, fall back to `<kit-name>.zip`.
- **Module selection UX is always multi-select** — Never add preset-vs-custom branching or preset-as-UI-item logic. Presets are CLI-flag concepts (`--preset`, `--modules`) and never rendered as selectable items in the interactive prompt. Required modules are pre-checked and disabled; optionals are individually toggleable. Spec + rationale: `docs/module-selection-ux.md` in oh-my-game-kit-core.
- **Never hardcode preset names in code** — preset names are kit-specific strings read from `omg-modules.json` at runtime. Hardcoding them in CLI/skill code produced the Apr 2026 preset-"full"-hardcode regression. Read the registry; never string-match. **Note:** the *registry side* is now standardized — every kit declares `"full": "*"` (canonical) — but consumer code must STILL read it from the registry, not assume it.
- **Canonical "full" preset rule (registry side)** — every modular kit's `omg-modules.json` MUST declare `"full": "*"`. Scripted callers (`omg new --preset full`, kit-test harnesses, demo CI) rely on this name being universal. Audit catch (Apr 2026): web shipped `everything: "*"`, marketing + nakama shipped no presets, designer shipped array-shorthand. All four were normalized in one batch. Adding a kit? Declare `full: "*"`. Renaming an existing kit's `"*"` preset to anything other than `full`? Don't. See `omg-kit` SKILL.md gotchas + `references/scaffold.md` canonical preset section.
- **`module.spec.yaml` is in flight, not yet authoritative** — Some modules ship a `module.spec.yaml` alongside `module.json` (Pillar 1 of the self-assembling architecture, see `plans/reports/260422-1248-self-assembling-kit-architecture.md` §15). SSOT remains `module.json` until the spec-file rollout completes. Read `module.json` for current behavior; do not yet rely on `module.spec.yaml` as the source of truth.

## Scope

Module management operations only.
