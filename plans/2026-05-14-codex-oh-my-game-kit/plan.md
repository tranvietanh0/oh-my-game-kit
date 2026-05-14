# Oh My Game Kit for Codex — Implementation Plan

Date: 2026-05-14

## Goal

Build `oh-my-game-kit` as a Codex-native game-development kit inspired by the upstream reference ecosystem:

- Use the upstream references' successful ideas: installer, module manifests, dependency presets, safety validation, and domain skills.
- Avoid copying Claude-specific mechanics that do not map cleanly to Codex: slash commands, Claude hooks, `.claude/settings.json`, and Claude-specific agent invocation rules.
- Deliver a reusable game-development kit for Codex, starting with Unity/MCP workflows and expanding toward game architecture, testing, UI, rendering, DOTS, and playtesting.

## Source Projects Reviewed

### Upstream CLI Reference

Key architecture to reuse:

- Domain-driven CLI with command orchestrators and phase handlers.
- Safe install/update flow: download/extract/merge, checksums, protected file handling, rollback thinking.
- Module selection UX: required modules, presets, explicit modules, interactive custom selection.
- Reconciliation model: pure plan phase, execute phase, report phase.
- Portable provider support already includes Codex:
  - Codex project skills: `.agents/skills`
  - Codex global skills: `~/.agents/skills` in the upstream provider model
  - Codex project config/rules: `AGENTS.md`
  - Codex agents: `.codex/agents/*.toml` plus `.codex/config.toml` managed block

What not to copy directly:

- GitHub-private package auth flow as an MVP requirement.
- Full dashboard/web server.
- Claude command namespace and command prefix transformer.
- Release asset pipeline until the local kit format is stable.

### Upstream Core Reference

Key architecture to reuse:

- IoC-style registry instead of hardcoded engine behavior.
- Three fragment concepts:
  - routing: role to implementation
  - activation: keywords to skills
  - config: feature flags and context requirements
- Module-first install model with DAG dependencies and presets.
- Doctor/validator mindset: fail early on broken registries, missing files, context mismatch, and unsafe setup.
- Progressive skill loading: keep core instructions small and move details to references.

What must change for Codex:

- Codex skill activation is primarily driven by skill frontmatter descriptions in `SKILL.md`; it does not need a runtime slash-command router.
- Codex project instructions belong in `AGENTS.md`, not `CLAUDE.md`.
- Codex does not expose the same Claude hook lifecycle, so lifecycle checks should become explicit scripts and lightweight instructions.
- Subagent routing should be advisory, because Codex has built-in app subagents but custom `.codex/agents` behavior may vary by environment.

### Upstream Unity Reference

Key architecture to reuse:

- Engine kit layered above core.
- Unity context detection via `Assets` and `ProjectSettings`.
- Unity MCP as a first-class workflow.
- Module split:
  - base
  - editor
  - testing
  - ui
  - rendering
  - dots-core
  - dots-combat
  - dots-nav
  - dots-ai
  - mobile
  - audio
  - animation
  - networking
- Unity-specific safety rules, especially around targeted refresh instead of expensive global reimport.

What must change for Codex:

- Convert Unity workflow knowledge into Codex skills with strong trigger descriptions.
- Prefer direct MCP tool instructions over Claude-specific MCP setup commands.
- Build fewer, better Codex skills first. Codex benefits more from compact skills with references than from hundreds of narrow skills on day one.

## Codex-Native Product Shape

The kit should have two install surfaces:

1. Project-local install:
   - `AGENTS.md`
   - `.agents/skills/<skill>/SKILL.md`
   - optional `.codex/agents/*.toml`
   - `.oh-my-game-kit/install-state.json`

2. Global user install:
   - global skill path resolved by installer:
     - prefer `$CODEX_HOME/skills` when set
     - support `~/.codex/skills`
     - support `~/.agents/skills` because the upstream Codex provider and this machine expose that root
   - optional `~/.codex/AGENTS.md` merge block
   - optional `~/.codex/agents/*.toml`

## Proposed Repository Structure

```text
oh-my-game-kit/
├── AGENTS.md
├── package.json
├── tsconfig.json
├── kit.json
├── schemas/
│   ├── kit.schema.json
│   ├── module.schema.json
│   └── install-state.schema.json
├── modules/
│   ├── core/
│   │   ├── module.json
│   │   └── skills/
│   ├── unity-base/
│   │   ├── module.json
│   │   └── skills/
│   ├── unity-mcp/
│   │   ├── module.json
│   │   └── skills/
│   ├── unity-testing/
│   │   ├── module.json
│   │   └── skills/
│   ├── unity-ui/
│   │   ├── module.json
│   │   └── skills/
│   ├── unity-rendering/
│   │   ├── module.json
│   │   └── skills/
│   └── unity-dots/
│       ├── module.json
│       └── skills/
├── agents/
│   └── source/
├── src/
│   ├── cli.ts
│   ├── commands/
│   ├── installer/
│   ├── registry/
│   ├── validators/
│   └── codex/
├── scripts/
│   ├── install.ps1
│   └── install.sh
├── docs/
│   ├── architecture.md
│   ├── authoring-skills.md
│   └── unity-mcp.md
└── tests/
```

## Manifest Design

### `kit.json`

```json
{
  "name": "oh-my-game-kit",
  "version": "0.1.0",
  "provider": "codex",
  "description": "Codex-native game development skills and workflows",
  "modules": ["core", "unity-base", "unity-mcp"],
  "presets": {
    "unity-minimal": ["core", "unity-base", "unity-mcp"],
    "unity-production": ["core", "unity-base", "unity-mcp", "unity-testing", "unity-ui", "unity-rendering"],
    "unity-dots": ["core", "unity-base", "unity-mcp", "unity-testing", "unity-dots"],
    "full": "*"
  }
}
```

### `modules/<name>/module.json`

```json
{
  "name": "unity-mcp",
  "version": "0.1.0",
  "required": true,
  "dependencies": {
    "core": ">=0.1.0",
    "unity-base": ">=0.1.0"
  },
  "description": "Unity Editor orchestration through MCP tools",
  "skills": [
    "omg-unity-mcp",
    "omg-unity-scene",
    "omg-unity-script-lifecycle"
  ],
  "detect": {
    "requiredPaths": ["Assets", "ProjectSettings"],
    "optionalPaths": ["Packages/manifest.json"]
  }
}
```

### `.oh-my-game-kit/install-state.json`

Track enough metadata to support update, uninstall, and conflict detection:

```json
{
  "schemaVersion": 1,
  "kit": "oh-my-game-kit",
  "version": "0.1.0",
  "installedAt": "2026-05-14T00:00:00.000Z",
  "target": "project",
  "modules": {
    "core": "0.1.0",
    "unity-base": "0.1.0"
  },
  "files": [
    {
      "source": "modules/core/skills/omg-game-workflow/SKILL.md",
      "target": ".agents/skills/omg-game-workflow/SKILL.md",
      "checksum": "sha256..."
    }
  ]
}
```

## Skill Set MVP

### Core module

`omg-game-workflow`

- Trigger: building, fixing, planning, or reviewing game systems.
- Purpose: general workflow for game projects in Codex.
- References:
  - planning checklist
  - implementation checklist
  - verification checklist

`omg-game-architecture`

- Trigger: architecture, module boundaries, gameplay systems, state/data ownership.
- Purpose: design maintainable game systems.
- References:
  - Unity patterns
  - ECS vs MonoBehaviour decision matrix
  - module boundary checklist

`omg-game-debugging`

- Trigger: bugs, runtime errors, flaky behavior, performance symptoms.
- Purpose: root-cause debugging workflow.
- References:
  - logs and repro workflow
  - Unity console workflow
  - regression test checklist

`omg-game-review`

- Trigger: code review, PR review, pre-merge check, refactor risk.
- Purpose: review game code for correctness, performance, maintainability.

### Unity base module

`omg-unity-conventions`

- Unity C# conventions, folder layout, asmdef guidance, serialized field rules.

`omg-unity-monobehaviour`

- MonoBehaviour lifecycle, scene object ownership, prefabs, pooling.

`omg-unity-script-lifecycle`

- Create/edit scripts safely, refresh scripts, read console, avoid broad reimports.

`omg-unity-project-detection`

- Inspect Unity project structure and decide which modules/workflows apply.

### Unity MCP module

`omg-unity-mcp`

- Codex-specific Unity MCP workflow.
- Include tool categories available in this environment:
  - `manage_scene`
  - `manage_gameobject`
  - `manage_components`
  - `create_script`
  - `script_apply_edits`
  - `refresh_unity`
  - `read_console`
  - `run_tests`
  - `manage_asset`
  - `manage_prefabs`
  - `manage_camera`
  - `manage_ui`
  - `manage_profiler`
- Hard rules:
  - verify state before editing
  - use `batch_execute` for repeated operations
  - after script edits, refresh and read console
  - never run broad asset reimport unless explicitly ordered

`omg-unity-scene`

- Scene setup, object creation, prefab operations, visual verification.

`omg-unity-playtest`

- Play mode, screenshots, console checks, runtime validation.

### Unity testing module

`omg-unity-testing`

- EditMode/PlayMode tests, compile gates, console triage.

`omg-unity-coverage`

- Optional later skill for coverage workflows.

### Unity UI module

`omg-unity-ui`

- UGUI and UI Toolkit workflow, responsive HUD, mobile UI constraints.

### Unity rendering module

`omg-unity-rendering`

- URP, materials, shaders, VFX, cameras, lighting.

### Unity DOTS module

`omg-unity-dots`

- Entities, components, systems, baking, jobs, Burst.

`omg-unity-dots-performance`

- Profiling, structural changes, memory allocations, system ordering.

## Installer Plan

Build a small Node/TypeScript CLI instead of only PowerShell, with shell wrappers for convenience.

Command shape:

```bash
node dist/cli.js install --target project --preset unity-minimal
node dist/cli.js install --target global --modules core,unity-base,unity-mcp
node dist/cli.js doctor
node dist/cli.js list
node dist/cli.js uninstall --target project
```

### Install phases

1. Resolve target:
   - project: current working directory
   - global: `$CODEX_HOME`, `~/.codex`, or `~/.agents`

2. Detect Codex paths:
   - skills path
   - AGENTS.md path
   - optional `.codex/config.toml`
   - optional `.codex/agents`

3. Resolve modules:
   - required modules
   - preset expansion
   - explicit modules
   - dependency closure
   - cycle detection

4. Plan:
   - compute source file checksums
   - compare existing target files
   - classify each file: install, update, skip, conflict

5. Execute:
   - create directories
   - copy skill directories
   - merge managed block into `AGENTS.md`
   - optionally install Codex agents TOML
   - write install state atomically

6. Report:
   - installed modules
   - skipped/conflicting files
   - next recommended command

### AGENTS.md merge block

Use sentinels to avoid clobbering user instructions:

```md
<!-- oh-my-game-kit:start -->
...
<!-- oh-my-game-kit:end -->
```

The managed block should be short:

- explain installed modules
- tell Codex to prefer `.agents/skills`
- list Unity MCP verification rules
- link to local kit state

## Validator and Doctor Plan

`doctor` should check:

- `kit.json` schema valid.
- every module in `kit.json` exists.
- every module dependency exists or is explicitly external.
- every skill listed in module manifests exists and has `SKILL.md`.
- every `SKILL.md` has only `name` and `description` frontmatter.
- skill names are lowercase hyphen-case, preferably `omg-*`.
- descriptions are specific enough to trigger.
- references linked from `SKILL.md` exist.
- no skill body is overly large; move details to `references/`.
- project install state checksums match current files.
- Unity project context exists when Unity modules are installed.
- Unity MCP tools are available when `unity-mcp` is installed.

`validate` should be CI-friendly:

```bash
npm run validate
npm test
npm run typecheck
```

## Codex Agent Plan

Do not make custom agents required for MVP.

Phase 1 can ship skills only. Codex already has strong built-in agents and tool routing in the app.

Phase 2 can add optional agent TOML files:

- `omg_unity_developer`
- `omg_unity_tester`
- `omg_unity_reviewer`
- `omg_unity_debugger`
- `omg_game_architect`

If implemented, use the upstream Codex TOML idea:

- write `.codex/agents/<slug>.toml`
- merge `[agents.<slug>]` into `.codex/config.toml`
- use sentinel comments
- never overwrite unmanaged agent definitions

## Implementation Phases

### Phase 0 — Bootstrap repo

Deliverables:

- `package.json`
- `tsconfig.json`
- `AGENTS.md`
- `kit.json`
- base schemas
- initial `docs/architecture.md`

Acceptance criteria:

- `npm test` placeholder passes.
- `npm run validate` validates empty/minimal kit structure.

### Phase 1 — Skill format and core skills

Deliverables:

- `modules/core/module.json`
- `omg-game-workflow`
- `omg-game-architecture`
- `omg-game-debugging`
- `omg-game-review`
- frontmatter validator

Acceptance criteria:

- every core skill validates.
- skills are compact and use references for long details.
- installing `core` copies skills into project `.agents/skills`.

### Phase 2 — Installer MVP

Deliverables:

- module resolver
- install planner
- file copier
- AGENTS.md sentinel merger
- install-state writer
- `install --target project --preset unity-minimal`

Acceptance criteria:

- repeated install is idempotent.
- user edits outside managed blocks are preserved.
- user edits inside installed skill files are detected as conflicts unless `--force` is passed.

### Phase 3 — Unity base and MCP skills

Deliverables:

- `modules/unity-base`
- `modules/unity-mcp`
- `omg-unity-conventions`
- `omg-unity-script-lifecycle`
- `omg-unity-project-detection`
- `omg-unity-mcp`
- `omg-unity-scene`
- `omg-unity-playtest`

Acceptance criteria:

- `doctor` detects Unity projects via `Assets` and `ProjectSettings`.
- MCP skill documents safe tool workflow using actual Codex Unity MCP tool names.
- Skill explicitly requires refresh + console check after script edits.

### Phase 4 — Doctor and update safety

Deliverables:

- `doctor`
- `list`
- `uninstall`
- conflict report
- checksum drift detection
- simple rollback backup for overwritten managed files

Acceptance criteria:

- install, reinstall, uninstall, reinstall cycle leaves no orphaned managed files.
- doctor reports actionable messages.

### Phase 5 — Unity production modules

Deliverables:

- `unity-testing`
- `unity-ui`
- `unity-rendering`
- `unity-dots`
- presets:
  - `unity-minimal`
  - `unity-production`
  - `unity-dots`
  - `full`

Acceptance criteria:

- each optional module installs independently with dependencies.
- references are one level deep from each `SKILL.md`.
- module-specific triggers do not conflict badly.

### Phase 6 — Optional Codex agents

Deliverables:

- source agent prompts
- TOML converter or direct TOML sources
- config.toml sentinel merge
- unmanaged config protection

Acceptance criteria:

- installing agents is opt-in.
- unmanaged `.codex/config.toml` blocks are preserved.
- slug collisions are reported and skipped.

### Phase 7 — Release and distribution

Deliverables:

- versioning policy
- release package format
- install from local path first, GitHub release later
- CI validation

Acceptance criteria:

- clean install from a tagged archive.
- no private GitHub auth required for public/local MVP.
- update path can compare installed version to source version.

## Technical Decisions

1. Use `omg-*` prefix for Codex skills.
   - Shorter than `oh-my-game-kit-*`.
   - Avoids collision with other installed skill namespaces.

2. Use `.agents/skills` for project-local Codex skills.
   - Matches the upstream Codex provider.
   - Works with current Codex skill-root style.

3. Support multiple global skill roots.
   - Codex ecosystem paths are not fully settled across environments.
   - Installer should detect and show the resolved target.

4. Keep registry for install-time behavior, not runtime behavior.
   - Codex skill descriptions should handle runtime activation.
   - Registry still helps module selection, validation, and update/uninstall.

5. Start with skills only.
   - Custom Codex agents are useful but not necessary for MVP.
   - Skills are lower risk and easier to validate.

6. Do not port Claude hooks directly.
   - Replace with `doctor`, `validate`, and short `AGENTS.md` rules.

## Risks

### Codex skill path ambiguity

Mitigation:

- detect `$CODEX_HOME`
- support `~/.codex/skills`
- support `~/.agents/skills`
- project-local `.agents/skills` as stable default for repos

### Overlarge skills reduce usefulness

Mitigation:

- enforce body size warnings
- move long domain docs to `references/`
- keep one-level reference links

### Unity MCP tool availability differs by session

Mitigation:

- `doctor` checks available MCP tools where possible.
- skills must instruct Codex to inspect tool availability before relying on advanced Unity operations.

### Copying Upstream Reference Content Too Directly

Mitigation:

- reuse architecture patterns, not private text wholesale.
- write Codex-native skills from scratch.
- cite upstream repos as design inspiration only.

### Installer complexity creep

Mitigation:

- ship project-local install first.
- delay GitHub release/download/update/dashboard until MVP is stable.

## Recommended First Implementation Slice

Build this first:

```text
AGENTS.md
kit.json
modules/core/module.json
modules/core/skills/omg-game-workflow/SKILL.md
modules/core/skills/omg-game-architecture/SKILL.md
modules/unity-base/module.json
modules/unity-base/skills/omg-unity-conventions/SKILL.md
modules/unity-mcp/module.json
modules/unity-mcp/skills/omg-unity-mcp/SKILL.md
src/cli.ts
src/registry/resolve-modules.ts
src/installer/install-project.ts
src/validators/validate-skills.ts
```

This gives a useful Codex kit without waiting for agents, releases, dashboard, or update infrastructure.

## Definition of Done for MVP

- A user can run one command from `oh-my-game-kit` to install the kit into a project.
- The project gets `AGENTS.md` and `.agents/skills/...`.
- Codex discovers at least the core and Unity MCP skills in a new session.
- Re-running install is idempotent.
- `doctor` reports clear status.
- Unity project users get actionable MCP workflow guidance.
- No Claude-specific files are required.
