---
name: omg-kit
description: "Maintain Oh My Game Kit repos as a kit maintainer. Use for releasing kits, scaffolding new kits, cross-kit validation, schema migration, and E2E test runs."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Kit — Maintainer Toolkit

Unified kit maintenance skill. All subcommands are for **kit maintainers only**, not end-users.

## Subcommands

| Subcommand | Usage | Purpose |
|---|---|---|
| `validate` | `omg-kit validate [--cross-kit]` | Schema, activation paths, keyword conflicts, preset refs, **universal `omg-` prefix** (skills + agents — see `rules/naming-convention.md`) |
| `release` | `omg-kit release [--skip-validate]` | Guided release: validate → CI gate → GitHub release → Discord |
| `sync` | `omg-kit sync [--pull] [--status-only]` | Pull all kits, check version compat, release-action alignment |
| `scaffold` | `omg-kit scaffold <name> [--org]` | Create new kit repo from template with full boilerplate |
| `audit` | `omg-kit audit [--all]` | Health audit: file counts, modules, keywords, CI, freshness |
| `migrate` | `omg-kit migrate [--dry-run]` | Schema migration (e.g., registryVersion 1→2) |
| `test` | `omg-kit test [--all] [--kit <name>]` | Comprehensive 15-phase E2E testing: install, modules, CLI, release infra |

## Quick Reference

```bash
omg-kit validate              # Validate current kit repo
omg-kit validate --cross-kit  # Validate across all installed kits
omg-kit release               # Guided release workflow
omg-kit sync --pull           # Pull and check all kits
omg-kit scaffold oh-my-game-kit-x  # Scaffold new kit
omg-kit audit --all           # Audit all kit repos
omg-kit migrate --dry-run     # Preview schema migration
omg-kit test --all            # E2E test all kits
omg-kit test --kit unity      # E2E test specific kit
```

## Subcommand Details

Read the reference file for full details on each subcommand:
- `references/validate.md` — per-kit and cross-kit validation checks
- `references/release.md` — release workflow steps and gates
- `references/sync.md` — cross-kit synchronization protocol
- `references/scaffold.md` — new kit scaffolding template
- `references/audit.md` — health audit checks and scoring
- `references/migrate.md` — registry schema migration steps (v1→v2)
- `references/test.md` — 12-phase E2E test plan
- `references/cli-commands.md` — `omg new`, `omg modules create`, `omg migrate`, `omg migrate metadata`, `omg rollback` (cli@v4.14.0; flags + gotchas grounded in source)

## Gotchas
- **Origin metadata: hand-stamp on NEW files, hands-off on existing files.** The release-action `inject-origin-metadata.cjs` runs post-merge — it strips and re-injects canonical `origin / repository / module / protected` (and `version` for SKILL.md) from env vars + module-resolution. So files already on `main` MUST NOT be hand-edited for these fields. BUT new files in PR branches MUST hand-stamp at least `origin:` (validator `validate-origin-injection-coverage.cjs` checks marker presence pre-merge — values are best-effort, CI overwrites them). Format per file type lives in memory `feedback_origin_marker_handauthor.md` and the `omg-skill-creator` "Required Frontmatter" section.
- **Modular kits use `release-modules.cjs`** (custom release script), NOT semantic-release directly. Flat kits (e.g., oh-my-game-kit-rn) still use semantic-release. `release-modules.cjs` produces per-module ZIPs + `manifest.json` index.
- **`omg-modules.json` is GENERATED** for the `modules` section — do not hand-author it. Source of truth is each `module.json`. Only `presets` in `omg-modules.json` are hand-authored.
- **`.releaserc.json` MUST include `package.json` and `.agents/metadata.json` in `@semantic-release/git` assets** — without this, `package.json` stays at `0.0.0` forever. Every kit repo needs: `"assets": ["package.json", "CHANGELOG.md", ".agents/metadata.json"]`
- **Do not hardcode `version` or `buildDate` in source `metadata.json`** — CI generates these from `package.json`. Source should only contain manually-maintained fields (`name`, `repository`, `deletions`).
- **Canonical "full" preset — required in EVERY kit** — every modular kit MUST declare `"full": "*"` in `omg-modules.json` `presets`. The interactive selector renders a synthetic "Full — all N modules" choice from any `"*"`-valued preset (it keys off the *value*, not the name), so kits with no presets or a differently-named `"*"` preset look fine in the UI — but scripted invocations like `omg new --preset full` fail when the preset is named anything other than literally `"full"`. Apr 2026 audit caught: web (`everything: "*"`), marketing + nakama (no presets section at all), designer (array-shorthand drift). **Always name the `"*"` preset literally `"full"`** even when the kit has only one required module (future-proofs scripted use). Other named presets (`rpg`, `fullstack`, etc.) MUST use v3 object form `{ "modules": [...], "description"?: "...", "crossKitModules"?: [...] }` — array shorthand `["mod-a", "mod-b"]` resolves at runtime but breaks cross-kit format consistency.
- **`module new` and `kit new` are NOT real CLI subcommands.** The shipped commands are `omg new` (project bootstrap) and `omg modules create` (module scaffold). Older audits and design docs use the legacy names — when documenting maintainer flows, reference the real CLI surface (`references/cli-commands.md`).
- **`omg rollback` requires a snapshot that nothing currently creates.** The H7 rollback read-side shipped in v4.14.0, but no production install/update path calls `createSnapshot()` yet. Until the write-side lands, `omg rollback --kit X --to-snapshot pre-Y` will reliably fail with `snapshot '...' does not exist`. Direct users to `omg install --reset` for now if they're truly stuck — and NEVER recommend `rm -rf ~/.agents/`. <!-- gate:allow-rm-codex (rule statement) -->
- **`omg rollback --yes` is a documented no-op** as of v4.14.0 — declared in the CLI registry, never read by the handler. Do not promise confirmation-bypass behavior in maintainer guidance.
- **`--to-snapshot` MUST literally start with `pre-`.** Bare-version arguments (`--to-snapshot 2.4.1`) are rejected. Always render the `pre-` prefix in examples.
- **Scaffold new modules with a `detect:` stub** — when `scaffold` or `omg-modules create` writes a new `module.json` for a non-base module, emit a `_disabled: true` detect stub so P6d CI and doctor #41 stay green while the author tightens patterns:
  ```json
  "detect": {
    "_disabled": true,
    "_note": "AUTO-GENERATED STUB. Tighten files+anyOf then remove _disabled to activate.",
    "files": ["**/*.md"],
    "anyOf": [{ "pattern": "TightenThisPattern_<moduleName>", "minHits": 2 }]
  }
  ```
  The stub is schema-valid (passes P6d), scanner silently skips modules with `_disabled: true`, and doctor #41 surfaces the stub as "needs activation" so the author can't forget.
- **Universal `omg-` naming prefix (MANDATORY)** — every skill directory + agent file + frontmatter `name:` MUST start with `omg-`. Tiers: core `omg-{slug}`, kit-wide `omg-{kit}-{slug}`, module-scoped `omg-{kit}-{module}-{slug}`. Slug MUST NOT redundantly start with the kit-short or any module-segment-token (algorithm v2 strips them). Three release-action gates are strict-by-default: `validate-skill-prefix.cjs`, `validate-agent-prefix.cjs`, `validate-new-name-conformance.cjs`. SSOT lives at `rules/naming-convention.md` + `.agents/skills/omg-skill-creator/references/architecture-rules.md` §0 + `.agents/skills/omg-agent-creator/references/architecture-rules.md` §0. When `scaffold`-ing a new kit/module or auditing an existing one, run `node /path/to/release-action/scripts/validate-skill-prefix.cjs` and `validate-agent-prefix.cjs` locally — fail-fast catches missed renames before push.
- **Activation fragment ref convention — bare-slug refs are the SSOT** — entries in `omg-activation-*.json` `sessionBaseline[]` and `mappings[].skills[]` arrays canonically use the **bare slug** form (e.g., `nakama-rpc` for the dir `omg-nakama-rpc`). The CI prefixer's `auto-prefix-skills.cjs::buildSelfHealMap()` self-heals legacy refs to canonical dir names at release time but the SSOT in fragment files stays bare so authors can write naturally. The release-action gate `validate-activation-skill-resolution.cjs` (per-PR safety net, added 2026-05-11) accepts BOTH bare and full-prefixed forms — anything else fails. When authoring or reviewing activation fragments, use the local bare slug (`{slug}` after kit + module strip) — NOT `{kit}-{slug}` shorthand that skips the module segment, which is the legacy form the self-heal does not accept and the gate flags. See `omg-doctor` check #47 for the doctor-time mirror.

## Future: Self-Improving AI Pipeline

OMG vision: the kit should self-teach and improve using aggregated consumer data. Planned pipeline:
1. User errors collected via telemetry → D1 (already exists)
2. Scheduled AI agent (cron) queries D1 for error clusters (same fingerprint, 3+ occurrences, multiple users)
3. AI aggregates patterns → synthesizes root cause, workaround, prevention
4. Auto-generates gotcha entries for relevant skill SKILL.md files
5. Opens PR to kit repo automatically
6. Maintainer reviews and merges → next release distributes to ALL users

**Status:** Not yet implemented. See AGENTS.md "Self-Improving AI Vision" for context.

## Auto-Activation Keywords

Triggers on: `kit validate`, `kit release`, `kit sync`, `kit scaffold`, `kit audit`, `kit migrate`, `kit test`, `kit health`, `kit status`, `cross-kit`, `maintainer`, `test kit`, `test install`, `test modules`, `e2e kit`, `validate installation`, `self-improving`, `auto-gotcha`, `gotcha generation`, `ai aggregation`, `learn from users`, `omg new`, `omg rollback`, `omg migrate`, `omg modules create`, `module new`, `kit new`, `module migrate`, `migrate metadata`, `rollback snapshot`, `pre-snapshot`
